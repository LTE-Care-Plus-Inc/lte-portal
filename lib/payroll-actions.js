'use server'
import { processLbaLogic } from '@/lib/lba-engine';
import { processBtLogic } from '@/lib/bt-engine';
import { getSheetData } from '@/lib/google-sheets';

export async function runPayrollAction(csvText, mode, periodData) {

  if (mode === 'LBA') {
    if (!periodData || !periodData.start || !periodData.end) {
      console.error("❌ Action aborted: Missing period data");
    return { rows: [], summary: { totalCastbackHours: '0.00' } };
  }
    return await processLbaLogic(csvText, periodData.start, periodData.end, periodData.label);
  }

  if (mode === 'BT') {
    if (!periodData || !periodData.start || !periodData.end) {
      console.error("❌ BT payroll aborted: Missing period data");
      return { rows: [] };
    }

    return await processBtLogic(
      csvText,
      periodData.start,
      periodData.end,
      periodData.label,
    );
  }
}

export async function getPayrollDatesAction() {
  try {
    const data = await getSheetData('Payroll Dates!A1:C');
    if (!data || data.length < 2) return [];

    const headers = data[0].map(h => h.trim());
    
    return data.slice(1).map(row => {
      const pStart = row[headers.indexOf('Period Start')];
      const pEnd = row[headers.indexOf('Period End')];
      const pPay = row[headers.indexOf('Pay Date')];

      return {
        // This label is what processBtLogic uses to filter the CSV
        label: `${pPay} (${pStart} - ${pEnd})`,
        start: pStart,
        end: pEnd,
      };
    });
  } catch (error) {
    console.error("❌ Failed to fetch payroll dates:", error);
    return [];
  }
}