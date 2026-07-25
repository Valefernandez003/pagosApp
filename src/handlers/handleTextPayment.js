const savePayment =
    require("../services/sheetsService");

const normalizeAmount =
    require("../utils/normalizeAmount");

const isPaymentMessage =
    require("../services/Payment.parser");

const formatDate =
    require("../utils/formatDate");

const processedMessages =
    require("../storage/processedMessages");

const usersWithRecentReceipt =
    require("../storage/usersWithRecentReceipt");

function getTextBody(m) {
    return (
        m.message?.conversation ||
        m.message?.extendedTextMessage?.text ||
        ""
    );
}

async function handleTextPayment(m) {

    console.log("[TEXT] --- handleTextPayment llamado ---");
    console.log("[TEXT] m.message crudo:", JSON.stringify(m.message));

    const body = getTextBody(m);

    console.log("[TEXT] body extraído:", JSON.stringify(body));

    if (!body.trim()) {
        console.log("[TEXT] body vacío, se corta acá.");
        return;
    }

    const esPago = isPaymentMessage(body);
    console.log("[TEXT] ¿isPaymentMessage?", esPago);

    if (!esPago) {
        console.log("[TEXT] no pasó el filtro de isPaymentMessage, se corta acá.");
        return;
    }

    const messageId =
        m.key.id;

    const nombre =
        m.pushName || "Sin nombre";

    const numero =
        m.key.remoteJid;

    const numeroNormalizado =
        numero
            .replace("@c.us", "")
            .replace("@s.whatsapp.net", "")
            .replace("@lid", "");

    if (
        usersWithRecentReceipt.has(
            numeroNormalizado
        )
    ) {

        return;
    }

    let monto =
        normalizeAmount(
            body
        );

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
            messageId
        )
    ) {

        return;
    }

    processedMessages.add(
        messageId
    );

    setTimeout(() => {

        processedMessages.delete(
            messageId
        );

    }, 1000 * 60 * 10);

    const fecha =
        formatDate(
            Number(m.messageTimestamp)
        );

    await savePayment({
        messageId,
        nombre,
        numero: numeroNormalizado,
        fecha,
        mensaje: body,
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
    handleTextPayment;