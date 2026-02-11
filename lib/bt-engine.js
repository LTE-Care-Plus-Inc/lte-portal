import { getSheetData } from './google-sheets';
import Papa from 'papaparse';

const sanitizeCurrency = (v) => {
    if (!v) return 0;
    return parseFloat(v.toString().replace(/[$,\s]/g, "")) || 0;
};

export async function processBtLogic(csvText, periodRange) {
    // 1. Fetch All Data Sources
    // Note: Flagged_1/25 uses BT_WORKBOOK_ID, the others use the default (Main)
    const [rawAlohaData, rawInsuranceData, rawSalaryData, rawCastbackData] = await Promise.all([
        getSheetData('All_sessions!A1:Z', process.env.BT_WORKBOOK_ID), 
        getSheetData('Insurance Deductions!A1:Z'),
        getSheetData('BT Salary!A1:Z'),
        getSheetData('Castback BT!A1:Z') 
    ]);

    // 2. Build Rate & Insurance Lookups
    const salHeaders = rawSalaryData[0].map(h => h.trim().toLowerCase());
    const rateLookup = {};
    rawSalaryData.slice(1).forEach(row => {
        const name = row[salHeaders.indexOf('staff name')]?.trim().toLowerCase();
        const rate = parseFloat(row[salHeaders.indexOf('rate')]) || 0;
        if (name) rateLookup[name] = rate;
    });

    const insHeaders = rawInsuranceData[0].map(h => h.trim());
    const insuranceMap = rawInsuranceData.slice(1).reduce((acc, row) => {
        const nameKey = row[insHeaders.indexOf('Name')]?.trim().toLowerCase();
        if (row[insHeaders.indexOf('Staff Type')] === 'BT' && row[insHeaders.indexOf('Active')]?.toLowerCase() === 'yes') {
            acc[nameKey] = sanitizeCurrency(row[insHeaders.indexOf('Payroll Deduction')]);
        }
        return acc;
    }, {});

    // 3. Build Billable ID Set (Verification)
    const alohaHeaders = rawAlohaData[0].map(h => h.trim().toLowerCase());
    const billableIds = new Set();
    const idIdx = alohaHeaders.findIndex(h => h.includes('appointment id'));
    const statusIdx = alohaHeaders.findIndex(h => h.includes('status'));

    rawAlohaData.slice(1).forEach(row => {
        const status = row[statusIdx]?.trim();
        if (['Ready_to_Bill', 'Already Billed', 'Verified'].includes(status)) {
            billableIds.add(row[idIdx]?.trim());
        }
    });

    const btSummary = {};

    // 4. Process Castback BT Sheet
    if (rawCastbackData && rawCastbackData.length > 1) {
        const cbHeaders = rawCastbackData[0].map(h => h.trim());
        // Extracts "Feb 15" from "Feb 15 (02/01 - 02/15)"
        const targetLabel = periodRange?.split(' (')[0].trim(); 

        rawCastbackData.slice(1).forEach((row) => {
            const rowPeriod = row[cbHeaders.indexOf('Payroll Period')]?.trim() || '';
            const isCompleted = row[cbHeaders.indexOf('Completed')]?.trim().toLowerCase() === 'yes';
            
            // Only process if the period name matches and it's marked completed
            if (!rowPeriod.includes(targetLabel) || !isCompleted) return;

            const nameKey = row[cbHeaders.indexOf('Staff Name')]?.trim().toLowerCase();
            const units = parseFloat(row[cbHeaders.indexOf('Units')]) || 0;
            const rate = rateLookup[nameKey] || 0;

            if (!btSummary[nameKey]) {
                btSummary[nameKey] = { fullName: row[cbHeaders.indexOf('Staff Name')], regHours: 0, regPay: 0, cbHours: 0, cbPay: 0, appts: 0 };
            }

            const hours = units / 4;
            btSummary[nameKey].cbHours += hours;
            btSummary[nameKey].cbPay += (hours * rate);
            btSummary[nameKey].appts++;
        });
    }

    // 5. Process CSV
    const { data: csvRows } = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    csvRows.forEach((row) => {
        const apptId = row['Appointment ID']?.trim();
        const nameKey = row['Staff Name']?.trim().toLowerCase();
        const rate = rateLookup[nameKey] || 0;

        // VERIFICATION: Check if appointment is in the "Flagged" sheet
        if (!billableIds.has(apptId) || !nameKey) return;

        const units = parseFloat(row['Units']?.replace(/[^-0-9.]/g, '')) || 0;
        const hours = units / 4;

        if (!btSummary[nameKey]) {
            btSummary[nameKey] = { fullName: row['Staff Name'], regHours: 0, regPay: 0, cbHours: 0, cbPay: 0, appts: 0 };
        }

        btSummary[nameKey].regHours += hours;
        btSummary[nameKey].regPay += (hours * rate);
        btSummary[nameKey].appts++;
    });

    // 6. Final Calculation
const finalRows = Object.keys(btSummary).map(nameKey => {
    const bt = btSummary[nameKey];
    
    // Safety Net: Extract values and default to 0 BEFORE calling toFixed
    const regPay = bt.regPay || 0;
    const cbPay = bt.cbPay || 0;
    const regHours = bt.regHours || 0;
    const cbHours = bt.cbHours || 0;
    const deduction = insuranceMap[nameKey] || 0;
    const rate = rateLookup[nameKey] || 0;

    const totalGross = regPay + cbPay;
    const netPay = totalGross - deduction;

    return {
        staff: bt.fullName,
        total: netPay.toFixed(2),
        regularPay: regPay.toFixed(2), // Use regPay, not regularPay
        castbackPay: cbPay.toFixed(2),
        overtimePay: "0.00",
        insuranceDeduction: deduction.toFixed(2),
        hourlyRate: rate.toFixed(2),
        isFullTime: false, // Or add logic if needed
        breakdown: {
            regularHours: regHours.toFixed(2),
            castbackHours: cbHours.toFixed(2),
            totalHours: (regHours + cbHours).toFixed(2),
            appointmentCount: bt.appts || 0
        }
    };
});

    return { rows: finalRows.filter(r => parseFloat(r.total) !== 0 || parseFloat(r.insuranceDeduction) > 0) };
}