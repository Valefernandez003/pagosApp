require("dotenv").config();

const savePayment = require("./services/sheetsService");
const normalizeAmount = require("./utils/normalizeAmount");
const isPaymentMessage = require("./services/Payment.parser");
const formatDate = require("./utils/formatDate");
const extractTextFromImage = require("./services/ocrService");
const isReceipt = require("./utils/isReceipt");
const client = require("./whatsapp/client");
const extractAmountFromText = require("./utils/extractAmountFromText");

const usersWithRecentReceipt = new Map();
const processedMessages = new Set();

client.on("message", async (message) => {
    try {
        if (message.from.includes("@g.us")) {
            return;
        }

        if (message.hasMedia) {

            let media;

            try {
                media = await message.downloadMedia();

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
                !allowedTypes.includes(media.mimetype)
            ) {

                return;
            }

            let ocrResult;

            try {

                ocrResult =
                    await extractTextFromImage(media);

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

            const montoNumerico =
                Number(monto);

            if (
                !isNaN(montoNumerico) &&
                montoNumerico >= 400000
            ) {

                monto = "REVISAR";
            }

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

            usersWithRecentReceipt.set(
                numeroNormalizado,
                Date.now()
            );

            setTimeout(() => {

                usersWithRecentReceipt.delete(
                    numeroNormalizado
                );

            }, 1000 * 60 * 3);

            const fecha =
                formatDate(
                    message.timestamp
                );

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

            }, 1000 * 60 * 60);


            await savePayment({
                messageId: message.id.id,
                nombre,
                numero: numeroNormalizado,
                fecha,
                mensaje: "Comprobante de pago",
                monto: monto || "revisar monto",
            });


            return;
        }

        if (!isPaymentMessage(message.body)) {
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

        const fecha =
            formatDate(
                message.timestamp
            );

        let monto =
            normalizeAmount(
                message.body
            );

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

        }, 1000 * 60 * 60);


        await savePayment({
            messageId,
            nombre,
            numero: numeroNormalizado,
            fecha,
            mensaje: message.body,
            monto,
        });

    } catch (error) {

        console.error(
            "❌ ERROR GENERAL:",
            error
        );
    }
});

client.initialize();