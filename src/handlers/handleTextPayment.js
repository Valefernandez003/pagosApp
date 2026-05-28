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

async function handleTextPayment(message) {

    if (!message.body?.trim()) {
        return;
    }

    if (
        !isPaymentMessage(
            message.body
        )
    ) {

        return;
    }

    const contact =
        await message.getContact();

    const messageId =
        message.id.id;

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

    if (
        usersWithRecentReceipt.has(
            numeroNormalizado
        )
    ) {

        return;
    }

    let monto =
        normalizeAmount(
            message.body
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
            message.timestamp
        );

    await savePayment({
        messageId,
        nombre,
        numero: numeroNormalizado,
        fecha,
        mensaje: message.body,
        monto,
    });
}

module.exports =
    handleTextPayment;