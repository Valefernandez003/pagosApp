const savePayment =
    require("../services/sheetsService");

const normalizeAmount =
    require("../utils/normalizeAmount");

const formatDate =
    require("../utils/formatDate");

const extractTextFromImage =
    require("../services/ocrService");

const isReceipt =
    require("../utils/isReceipt");

const processedMessages =
    require("../storage/processedMessages");

const usersWithRecentReceipt =
    require("../storage/usersWithRecentReceipt");

async function handleReceiptMessage(message) {

    let media;

console.log("======================================");
console.log("[DOWNLOAD] Iniciando descarga");
console.log("[DOWNLOAD] ID:", message.id.id);
console.log("[DOWNLOAD] Tipo:", message.type);
console.log("[DOWNLOAD] HasMedia:", message.hasMedia);
console.log("[DOWNLOAD] From:", message.from);

try {
    
    if (message.from === "status@broadcast") {
    return;
    }

    media = await message.downloadMedia();

    if (!media) {
        console.log("[DOWNLOAD] downloadMedia devolvió null");
        return;
    }

    console.log("[DOWNLOAD] Descarga exitosa");
    console.log("[DOWNLOAD] MIME:", media.mimetype);
    console.log("[DOWNLOAD] Filename:", media.filename);

} catch (err) {

    console.log("[DOWNLOAD] Error al descargar media");
    console.log("Nombre:", err.name);
    console.log("Mensaje:", err.message);
    console.log("Stack:", err.stack);
    console.log("Objeto completo:", err);

    return;
}

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "application/pdf"
    ];

    if (
        !media?.mimetype ||
        !allowedTypes.includes(
            media.mimetype
        )
    ) {

        return;
    }

    let ocrResult;

    try {

        console.log("[OCR] Iniciando OCR...");

        ocrResult =
            await extractTextFromImage(media);

        console.log("[OCR] OCR finalizado");
        console.log("[OCR] Monto detectado:", ocrResult?.detectedAmount);
        console.log("[OCR] Texto extraído:", ocrResult?.text?.substring(0, 100));

    } catch (err) {

        console.log("[OCR] Error durante el OCR");
        console.log("Nombre:", err.name);
        console.log("Mensaje:", err.message);
        console.log("Stack:", err.stack);
        return;
    }

    if (!ocrResult) {
        return;
    }

    const extractedText =
        ocrResult.text || "";

    const combinedText = `
        ${message.body || ""}
        ${media.filename || ""}
        ${extractedText}
    `.toLowerCase();

    if (!isReceipt(combinedText)) {
        return;
    }

    let monto =
        ocrResult.detectedAmount ?? null;

    if (!monto) {

        monto =
            normalizeAmount(
                extractedText
            );
    }

    if (
        monto === null ||
        monto === undefined
    ) {

        return;
    }

    if (
        monto === false
    ) {
        monto = "REVISAR";
    }

    const montoNumerico =
        Number(monto);

    if (
        !isNaN(montoNumerico) &&
        (montoNumerico >= 400000 || montoNumerico === 2202 || montoNumerico < 100)
    ) {

        monto = "REVISAR";
    }

    if (
        processedMessages.has(
            message.id.id
        )
    ) {

        return;
    }

    processedMessages.add(
        message.id.id
    );

    setTimeout(() => {

        processedMessages.delete(
            message.id.id
        );

    }, 1000 * 60 * 10);

    const contact =
        await message.getContact();

    const nombre =
        contact.name ||
        contact.pushname ||
        "Sin nombre";

    const numero =
        contact.id?.user ||
        contact.number ||
        message.from;

    const numeroNormalizado =
        numero
            .replace("@c.us", "")
            .replace("@lid", "");

    const fecha =
        formatDate(
            message.timestamp
        );
        if (usersWithRecentReceipt.has(numeroNormalizado)) {
            return;
        }
        
    usersWithRecentReceipt.set(
        numeroNormalizado,
        Date.now()
    );

        console.log("[SHEETS] Guardando comprobante...");

        await savePayment({
            messageId: message.id.id,
            nombre,
            numero: numeroNormalizado,
            fecha,
            mensaje: "Comprobante de pago",
            monto,
        });
        
        console.log("[SHEETS] ✅ Comprobante guardado correctamente");

    setTimeout(() => {

        usersWithRecentReceipt.delete(
            numeroNormalizado
        );

    }, 1000 * 60 * 3);
}

module.exports =
    handleReceiptMessage;