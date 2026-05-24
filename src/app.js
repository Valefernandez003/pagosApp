require("dotenv").config();

const savePayment = require("./services/sheetsService");
const normalizeAmount = require("./utils/normalizeAmount");
const isPaymentMessage = require("./services/payment.parser");
const formatDate = require("./utils/formatDate");
const extractTextFromImage = require("./services/ocrService");
const isReceipt = require("./utils/isReceipt");
const client = require("./whatsapp/client");
const extractAmountFromText = require("./utils/extractAmountFromText");

const processedMessages = new Set();
const recentPayments = new Map();

/**
 * Limpieza de pagos recientes
 */
setInterval(() => {
    const now = Date.now();

    for (const [key, value] of recentPayments) {
        if (now - value > 120000) {
            recentPayments.delete(key);
        }
    }
}, 60000);

/**
 * Listener principal
 */
client.on("message", async (message) => {
    console.log("🔍 CHECK MEDIA FLAG:", message.hasMedia);
    console.log("📦 RAW MESSAGE TYPE:", message.type);
    try {
        console.log("\n====================================");
        console.log("📩 MENSAJE RECIBIDO");
        console.log({
            id: message.id?.id,
            type: message.type,
            hasMedia: message.hasMedia,
            body: message.body,
            from: message.from
        });

        if (message.from.includes("@g.us")) {
            console.log("❌ Grupo ignorado");
            return;
        }

        /**
         * =========================
         * 📌 FLUJO CON MEDIA
         * =========================
         */
        if (message.hasMedia) {
            console.log("🟡 [1] MEDIA DETECTADA");

            let media;

            try {
                console.log("⬇️ [2] DESCARGANDO MEDIA...");
                media = await message.downloadMedia();
                    console.log("📥 MEDIA RESULT RAW:", media);
                    console.log("📦 MIME:", media?.mimetype);
                    console.log("📦 HAS DATA:", !!media?.data);

                console.log("🟢 [3] MEDIA DESCARGADA OK");
                console.log("📦 MIME:", media?.mimetype);
                console.log("📦 SIZE:", media?.data?.length || 0);

                if (!media) {
                    console.log("🔴 MEDIA NULL");
                    return;
                }

            } catch (err) {
                console.log("🔴 ERROR downloadMedia()");
                console.log(err);
                return;
            }

            const allowedTypes = [
                "image/jpeg",
                "image/png",
                "application/pdf"
            ];

            if (!media?.mimetype || !allowedTypes.includes(media.mimetype)) {
                console.log("🟠 ARCHIVO NO PERMITIDO:", media?.mimetype);
                return;
            }

            console.log("🟢 [4] TIPO OK → OCR");

            let ocrResult;

            try {
                console.log("🧠 [5] EJECUTANDO OCR...");
                ocrResult = await extractTextFromImage(media);

                console.log("🧠 OCR RESULT:", ocrResult);

                console.log("🟢 [6] OCR RESULT:");
                console.log(ocrResult);

            } catch (err) {
                console.log("🔴 ERROR OCR");
                console.log(err);
                return;
            }

            if (!ocrResult) {
                console.log("🔴 OCR NULL");
                return;
            }

            const extractedText = ocrResult.text || "";

            console.log("📝 TEXTO EXTRAÍDO:");
            console.log(extractedText);

            const combinedText = `
                ${message.body || ""}
                ${media.filename || ""}
                ${extractedText}
            `.toLowerCase();

            console.log("🔗 TEXTO COMBINADO:");
            console.log(combinedText);

            if (!isReceipt(combinedText)) {
                console.log("🔴 NO ES COMPROBANTE");
                return;
            }

            console.log("🟢 ES COMPROBANTE");

            let monto = ocrResult.detectedAmount ?? null;

            if (!monto) {
                monto = normalizeAmount(extractedText);
            }

            const montoNumerico = Number(monto);

            if (!isNaN(montoNumerico) && montoNumerico >= 400000) {
                monto = "REVISAR";
                console.log("⚠️ MONTO EXTREMO");
            }

            const contact = await message.getContact();

            const nombre =
                contact.name ||
                contact.pushname ||
                "Sin nombre";

            const numero =
                contact.id?.user ||
                contact.number ||
                message.from;

            const numeroNormalizado =
                numero.replace("@c.us", "").replace("@lid", "");

            const now = Date.now();
            const lastPayment = recentPayments.get(numeroNormalizado);

            if (lastPayment && now - lastPayment < 120000) {
                console.log("🟠 DUPLICADO POR TIEMPO");
                return;
            }

            const fecha = formatDate(message.timestamp);

            if (processedMessages.has(message.id.id)) {
                console.log("🟠 MENSAJE DUPLICADO");
                return;
            }

            processedMessages.add(message.id.id);

            setTimeout(() => {
                processedMessages.delete(message.id.id);
            }, 1000 * 60 * 60);

            console.log("💾 GUARDANDO EN SHEETS...");

            await savePayment({
                messageId: message.id.id,
                nombre,
                numero: numeroNormalizado,
                fecha,
                mensaje: "Comprobante de pago",
                monto: monto || "revisar monto",
            });

            console.log("🟢 GUARDADO OK");

            recentPayments.set(numeroNormalizado, now);

            return;
        }

        /**
         * =========================
         * 📌 MENSAJES TEXTO
         * =========================
         */
        if (!isPaymentMessage(message.body)) {
            console.log("❌ No fue detectado como pago");
            return;
        }

        const contact = await message.getContact();

        const messageId = message.id.id;

        const nombre =
            contact.name ||
            contact.pushname ||
            "Sin nombre";

        const numero =
            contact.id?.user ||
            contact.number ||
            message.from;

        const numeroNormalizado =
            numero.replace("@c.us", "").replace("@lid", "");

        const now = Date.now();
        const lastPayment = recentPayments.get(numeroNormalizado);

        if (lastPayment && now - lastPayment < 120000) {
            console.log("🟠 DUPLICADO POR TIEMPO");
            return;
        }

        const fecha = formatDate(message.timestamp);

        let monto = normalizeAmount(message.body);

        const montoNumerico = Number(monto);

        if (!isNaN(montoNumerico) && montoNumerico >= 400000) {
            monto = "REVISAR";
            console.log("⚠️ MONTO EXTREMO");
        }

        if (processedMessages.has(messageId)) {
            console.log("🟠 MENSAJE DUPLICADO");
            return;
        }

        processedMessages.add(messageId);

        setTimeout(() => {
            processedMessages.delete(messageId);
        }, 1000 * 60 * 60);

        console.log("💾 GUARDANDO EN SHEETS...");

        await savePayment({
            messageId,
            nombre,
            numero: numeroNormalizado,
            fecha,
            mensaje: message.body,
            monto,
        });

        console.log("🟢 GUARDADO OK");

        recentPayments.set(numeroNormalizado, now);

    } catch (error) {
        console.error("❌ ERROR GENERAL:", error);
    }
});

client.initialize();