import { google } from 'googleapis';

export async function getSheetData(range, customSpreadsheetId = null) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        // Replace escaped newlines from the .env string
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // Use custom spreadsheet ID if provided, otherwise fall back to default
    const spreadsheetId = customSpreadsheetId || process.env.GOOGLE_SHEET_ID;
    
    console.log(`📊 Fetching from spreadsheet: ${spreadsheetId?.substring(0, 10)}... | Range: ${range}`);
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: range, 
    });

    console.log(`✅ Retrieved ${response.data.values?.length || 0} rows from ${range}`);
    
    return response.data.values;
  } catch (error) {
    console.error('Google API Error:', error.message);
    console.error('Range attempted:', range);
    return null;
  }
}