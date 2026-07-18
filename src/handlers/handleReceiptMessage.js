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

const downloadIncomingMedia =
    require("../utils/downloadIncomingMedia");

function getCaption(m) {
    return (
        m.message?.imageMessage?.caption ||
        m.message?.documentMessage?.caption ||
        m.message?.documentWithCaptionMessage?.message?.documentMessage?.caption ||
        ""
    );
}

async function handleReceiptMessage(m, sock) {

    let media;

    console.log("======================================");
    console.log("[DOWNLOAD] Iniciando descarga");
    console.log("[DOWNLOAD] ID:", m.key.id);
    console.log("[DOWNLOAD] From:", m.key.remoteJid);

    if (m.key.remoteJid === "status@broadcast") {
        return;
    }

    try {
        media = await downloadIncomingMedia(sock, m);

        if (!media) {
            console.log("[DOWNLOAD] downloadIncomingMedia devolvió null");
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
        ${getCaption(m)}
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
            m.key.id
        )
    ) {

        return;
    }

    processedMessages.add(
        m.key.id
    );

    setTimeout(() => {

        processedMessages.delete(
            m.key.id
        );

    }, 1000 * 60 * 10);

    const nombre =
        m.pushName || "Sin nombre";

    const numero =
        m.key.remoteJid;

    const numeroNormalizado =
        numero
            .replace("@c.us", "")
            .replace("@s.whatsapp.net", "")
            .replace("@lid", "");

    const fecha =
        formatDate(
            Number(m.messageTimestamp)
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
        messageId: m.key.id,
        nombre,
        numero: numeroNormalizado,
        fecha,
        mensaje: "Comprobante de pago",
        monto,
    });

    console.log("[SHEETS] Comprobante guardado correctamente");

    setTimeout(() => {

        usersWithRecentReceipt.delete(
            numeroNormalizado
        );

    }, 1000 * 60 * 3);
}

module.exports =
    handleReceiptMessage;