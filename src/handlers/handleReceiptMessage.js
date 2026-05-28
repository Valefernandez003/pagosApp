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

    try {

        media =
            await message.downloadMedia();

        if (!media) {
            return;
        }

    } catch (err) {

        console.log(err);
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

        ocrResult =
            await extractTextFromImage(
                media
            );

    } catch (err) {

        console.log(err);
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

    const montoNumerico =
        Number(monto);

    if (
        !isNaN(montoNumerico) &&
        montoNumerico >= 400000
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

    await savePayment({
        messageId: message.id.id,
        nombre,
        numero: numeroNormalizado,
        fecha,
        mensaje: "Comprobante de pago",
        monto,
    });

    usersWithRecentReceipt.set(
        numeroNormalizado,
        Date.now()
    );

    setTimeout(() => {

        usersWithRecentReceipt.delete(
            numeroNormalizado
        );

    }, 1000 * 60 * 3);
}

module.exports =
    handleReceiptMessage;