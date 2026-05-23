const savePayment = require("./services/sheetsService");
const normalizeAmount = require("./utils/normalizeAmount");
const isPaymentMessage = require("./services/payment.parser");
const formatDate = require("./utils/formatDate");
const extractTextFromImage = require("./services/ocrService");
const isReceipt = require("./utils/isReceipt");
const client = require("./whatsapp/client");
const extractAmountFromText = require("./utils/extractAmountFromText");

const recentPayments = new Map();
setInterval(() => {

    const now =
        Date.now();

    for (
        const [key, value]
        of recentPayments
    ) {

        if (
            now - value >
            120000
        ) {

            recentPayments.delete(
                key
            );
        }
    }

}, 60000);

client.on("message", async (message) => {
    try {
        if ( message.isForwarded) {
            return;
        }

        if(message.from.includes("@g.us")) {
            return;
        }

        if (message.hasMedia) {

                const media =
                    await message.downloadMedia();

                const allowedTypes = [

                    "image/jpeg",

                    "image/png",

                    "application/pdf"
                ];

                if (
                    !allowedTypes.includes(
                        media.mimetype
                    )
                ) {

                    console.log(
                        "Archivo ignorado"
                    );

                    return;
                }

                const ocrResult =
                    await extractTextFromImage(
                        media
                    );

                if (!ocrResult) {

                    console.log(
                        "OCR falló, se ignora media"
                    );

                    return;
                }

                const extractedText =
                    ocrResult.text || "";

                const combinedText = `
                    ${message.body || ""}
                    ${media.filename || ""}
                    ${extractedText}
                `.toLowerCase();

                if (
                    !isReceipt(
                        combinedText
                    )
                ) {

                    console.log(
                        "No parece comprobante"
                    );

                    return;
                }

                let monto =
                    ocrResult.detectedAmount
                    ?? null;

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

                    montoNumerico >= 300000
                ) {

                    monto =
                        "REVISAR";

                    console.log(
                        "Monto extremo"
                    );
}

                const contact =
                    await message.getContact();

                const nombre =
                    contact.name ||
                    contact.pushname || "Sin nombre";

                const numero =
                    contact.id?.user ||
                    contact.number || message.from;

                const numeroNormalizado =
                    numero
                        .replace("@c.us","")
                        .replace("@lid","");

                const now = Date.now();

                const lastPayment = recentPayments.get(numeroNormalizado);

                if (lastPayment && now - lastPayment < 120000) {


                    return;
                }

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
                    monto: monto ||"revisar monto",
                });

                recentPayments.set(numeroNormalizado,now);

                return;
            }

            if (!isPaymentMessage(message.body)) {

                console.log( "No fue detectado como pago");
                return;
            }

            const contact = await message.getContact();

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

            const numeroNormalizado = numero

                    .replace("@c.us","")

                    .replace("@lid","");

            const now = Date.now();
            const lastPayment = recentPayments.get(numeroNormalizado);

            if(lastPayment && now - lastPayment < 120000) {
                return;
            }

            const fecha = formatDate(message.timestamp);
            const monto = normalizeAmount(message.body);

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

                                montoNumerico >= 300000
                            ) {

                                monto =
                                    "REVISAR";

                                console.log(
                                    "Monto extremo"
                                );
            }

            await savePayment({
                messageId,
                nombre,
                numero: numeroNormalizado,
                fecha,
                mensaje: message.body,
                monto
            });

            recentPayments.set(numeroNormalizado,now);
        } catch (error) {
            console.error(
                "Error procesando mensaje:",
                error
            );
        }
    }
);

client.initialize();