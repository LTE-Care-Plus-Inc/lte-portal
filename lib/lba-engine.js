import { getSheetData } from './google-sheets';
import Papa from 'papaparse';

const parseDate = (str) => {
    if (!str) return null;
    const cleaned = str.split(' ')[0].replace(/-/g, '/');
    const [m, d, y] = cleaned.split('/').map(Number);
    return new Date(y, m - 1, d);
};

const roundQuarter = (num) => Math.round(num * 4) / 4;

const sanitizeCurrency = (v) => {
    if (!v) return 0;
    return parseFloat(v.toString().replace(/[$,\s]/g, "")) || 0;
};

export async function processLbaLogic(csvText, startDateStr, endDateStr, periodRange) {
    const startDate = parseDate(startDateStr);
    const endDate = parseDate(endDateStr);

    const [rawSalaryData, rawCptData, rawCastbackData, rawInsuranceData] = await Promise.all([
        getSheetData('LBA Salary!A1:R'),
        getSheetData('CPT Codes!A1:C'),
        getSheetData('Castback LBA!A1:Z'),
        getSheetData('Insurance Deductions!A1:Z')
    ]);

    const sHeaders = rawSalaryData[0].map(h => h.trim());
    const lbaRegistry = rawSalaryData.slice(1).reduce((acc, row) => {
        const nameKey = row[sHeaders.indexOf('LBA Name')]?.trim().toLowerCase();
        if (!nameKey || row[sHeaders.indexOf('Working Status')] !== 'Active') return acc;
        acc[nameKey] = {
            fullName: row[sHeaders.indexOf('LBA Name')],
            supervision: parseFloat(row[sHeaders.indexOf('Supervision Rate')]) || 0,
            assessment: parseFloat(row[sHeaders.indexOf('Assessment Rate')]) || 0,
            parentTraining: parseFloat(row[sHeaders.indexOf('Parent Training Rate')]) || 0,
            groupParent: parseFloat(row[sHeaders.indexOf('Group Parent Training Rate')]) || 0,
            fixedNBHours: parseFloat(row[sHeaders.indexOf('Non Billable Hours')]) || 0,
            thresholdGoal: parseFloat(row[sHeaders.indexOf('Billable Hours')]) || 0,
            employmentStatus: row[sHeaders.indexOf('Employment Status')] || 'Part Time'
        };
        return acc;
    }, {});

    const insHeaders = rawInsuranceData[0].map(h => h.trim());
    const insuranceMap = rawInsuranceData.slice(1).reduce((acc, row) => {
        const nameKey = row[insHeaders.indexOf('Name')]?.trim().toLowerCase();
        if (row[insHeaders.indexOf('Staff Type')] === 'LBA' && row[insHeaders.indexOf('Active')]?.toLowerCase() === 'yes') {
            acc[nameKey] = sanitizeCurrency(row[insHeaders.indexOf('Payroll Deduction')]);
        }
        return acc;
    }, {});

    const castbackSummary = {};
    const cptRows = rawCptData.slice(1);

    if (rawCastbackData && rawCastbackData.length > 1) {
        const cbHeaders = rawCastbackData[0].map(h => h.trim());
        let targetPeriod = periodRange?.includes('(') ? periodRange.split(' (')[1].replace(')', '').trim() : `${startDateStr} - ${endDateStr}`.trim();

        rawCastbackData.slice(1).forEach((row) => {
            const rowPeriod = row[cbHeaders.indexOf('Payroll Period')]?.trim() || '';
            if (!rowPeriod.includes(targetPeriod) && !targetPeriod.includes(rowPeriod)) return;
            if (row[cbHeaders.indexOf('Completed')]?.trim().toLowerCase() !== 'yes') return;

            const nameKey = row[cbHeaders.indexOf('Staff Name')]?.trim().toLowerCase();
            if (!lbaRegistry[nameKey]) return;

            const hours = roundQuarter(parseFloat(row[cbHeaders.indexOf('Billing Hours')]) || 0);
            const billingCode = row[cbHeaders.indexOf('Billing Code')]?.trim();
            const cptMatch = cptRows.find(c => c[0] === billingCode);
            const category = cptMatch ? cptMatch[1] : (row[cbHeaders.indexOf('Service Name')] || '');

            if (!castbackSummary[nameKey]) castbackSummary[nameKey] = { sup: 0, assess: 0, pt: 0, grp: 0, totalHours: 0 };
            if (category.includes('Supervision')) castbackSummary[nameKey].sup += hours;
            else if (category.includes('Assessment')) castbackSummary[nameKey].assess += hours;
            else if (category.includes('Parent Training')) castbackSummary[nameKey].pt += hours;
            else if (category.includes('Group')) castbackSummary[nameKey].grp += hours;
            castbackSummary[nameKey].totalHours += hours;
        });
    }

    const { data: alohaRows } = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    const payrollSummary = {};
    alohaRows.forEach(row => {
        if (row['Completed']?.trim().toLowerCase() !== 'yes') return;
        const apptDate = parseDate(row['Appt. Date']);
        if (!apptDate || apptDate < startDate || apptDate > endDate) return;

        const nameKey = row['Staff Name']?.trim().toLowerCase();
        if (!lbaRegistry[nameKey]) return;

        if (!payrollSummary[nameKey]) payrollSummary[nameKey] = { sup: 0, assess: 0, pt: 0, grp: 0 };
        const hours = roundQuarter(parseFloat(row['Billing Hours']) || 0);
        const cptMatch = cptRows.find(c => c[0] === row['Billing Code']?.trim());
        const category = cptMatch ? cptMatch[1] : '';

        if (category.includes('Supervision')) payrollSummary[nameKey].sup += hours;
        else if (category.includes('Assessment')) payrollSummary[nameKey].assess += hours;
        else if (category.includes('Parent Training')) payrollSummary[nameKey].pt += hours;
        else if (category.includes('Group')) payrollSummary[nameKey].grp += hours;
    });

    const finalRows = Object.keys(lbaRegistry).map(nameKey => {
        const settings = lbaRegistry[nameKey];
        const aloha = payrollSummary[nameKey] || { sup: 0, assess: 0, pt: 0, grp: 0 };
        const cb = castbackSummary[nameKey] || { sup: 0, assess: 0, pt: 0, grp: 0, totalHours: 0 };
        const deduction = insuranceMap[nameKey] || 0;

        const isFullTime = settings.employmentStatus.toLowerCase().includes('full') || settings.employmentStatus.toLowerCase() === 'ft';
        const nbHours = settings.fixedNBHours * 2;
        const nbPay = nbHours * settings.supervision;

        let adjSupPay = aloha.sup * settings.supervision;
        let otPay = 0, otHours = 0;
        if (isFullTime) {
            const threshold = (settings.thresholdGoal + settings.fixedNBHours) * 2;
            const currentLoad = aloha.sup + nbHours;
            if (currentLoad > threshold) {
                otHours = currentLoad - threshold;
                const actualOt = Math.min(otHours, aloha.sup);
                adjSupPay = (aloha.sup - actualOt) * settings.supervision;
                otPay = actualOt * 100;
            }
        }

        const alohaPTPay = (aloha.pt * 4 * settings.parentTraining) + (aloha.grp * 4 * settings.groupParent);
        const cbPTPay = (cb.pt * 4 * settings.parentTraining) + (cb.grp * 4 * settings.groupParent);
        const cbTotalPay = (cb.sup * settings.supervision) + (cb.assess * settings.assessment) + cbPTPay;

        const billablePay = adjSupPay + (aloha.assess * settings.assessment) + alohaPTPay;
        const netPay = (billablePay + nbPay + otPay + cbTotalPay) - deduction;

        return {
            staff: settings.fullName,
            employmentStatus: settings.employmentStatus, // Restored for badge
            isFullTime,
            total: netPay.toFixed(2),
            billablePay: billablePay.toFixed(2),
            overtimePay: otPay.toFixed(2),
            castbackPay: cbTotalPay.toFixed(2),
            insuranceDeduction: deduction.toFixed(2),
            breakdown: {
                supervision: { pay: adjSupPay.toFixed(2), hours: aloha.sup.toFixed(2), otAmount: otHours.toFixed(2) },
                assessment: { pay: (aloha.assess * settings.assessment).toFixed(2), hours: aloha.assess.toFixed(2) },
                parentTraining: { pay: alohaPTPay.toFixed(2), hours: (aloha.pt + aloha.grp).toFixed(2) },
                nonBillable: { pay: nbPay.toFixed(2), hours: nbHours.toFixed(2) },
                castback: {
                    pay: cbTotalPay.toFixed(2), hours: cb.totalHours.toFixed(2), details: {
                        supHours: cb.sup.toFixed(1),
                        assessHours: cb.assess.toFixed(1),
                        ptHours: (cb.pt + cb.grp).toFixed(1)
                    }
                }
            }
        };
    });

    return { rows: finalRows.filter(r => parseFloat(r.total) !== 0 || parseFloat(r.insuranceDeduction) > 0) };
}