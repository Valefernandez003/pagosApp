const { google } = require("googleapis");
require("dotenv").config();

const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
});

const spreadsheetId = process.env.SPREADSHEET_ID;

if (!spreadsheetId) {
    throw new Error("SPREADSHEET_ID no está definido");
}

async function savePayment(data) {
    const sheets = google.sheets({
        version: "v4",
        auth
    });

    const existingRows = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "pagos!A:A"
    });

    const ids = existingRows.data.values || [];

    const exists = ids.some(row => row[0] === data.messageId);

    if (exists) {
        console.log("Mensaje duplicado, no se guarda");
        return;
    }

    const response = await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "pagos!A1",
        valueInputOption: "USER_ENTERED",
        requestBody: {
            values: [[
                data.messageId,
                data.nombre,
                data.numero,
                data.fecha,
                data.mensaje,
                data.monto
            ]]
        }
    });

}

module.exports = savePayment;