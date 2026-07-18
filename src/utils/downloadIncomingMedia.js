const {
    downloadMediaMessage,
    getContentType,
} = require("@whiskeysockets/baileys");

const P = require("pino");

const DOWNLOAD_MAX_ATTEMPTS = 3;
const DOWNLOAD_RETRY_DELAY_MS = 2000;

async function downloadIncomingMedia(sock, m) {
    const messageType = getContentType(m.message);

    const mediaTypes = [
        "imageMessage",
        "documentMessage",
        "documentWithCaptionMessage",
    ];

    if (!mediaTypes.includes(messageType)) {
        return null; // no es un mensaje con media descargable
    }

    let lastError = null;

    for (let attempt = 1; attempt <= DOWNLOAD_MAX_ATTEMPTS; attempt++) {
        try {
            console.log(`[DOWNLOAD] Intento ${attempt}/${DOWNLOAD_MAX_ATTEMPTS} (tipo: ${messageType})...`);

            const buffer = await downloadMediaMessage(
                m,
                "buffer",
                {},
                {
                    logger: P(),
                    // Permite que Baileys pida un re-upload si el media
                    // ya expiró en los servidores de WhatsApp.
                    reuploadRequest: sock.updateMediaMessage,
                }
            );

            const mimetype = extractMimetype(m.message, messageType);
            const filename = extractFilename(m.message, messageType);

            console.log("[DOWNLOAD] Descarga exitosa. MIME:", mimetype);

            return {
                mimetype,
                data: buffer.toString("base64"),
                filename: filename || null,
            };

        } catch (err) {
            lastError = err;
            console.log(`[DOWNLOAD] Error en intento ${attempt}:`, err.message);

            if (attempt < DOWNLOAD_MAX_ATTEMPTS) {
                await new Promise((res) => setTimeout(res, DOWNLOAD_RETRY_DELAY_MS));
            }
        }
    }

    throw lastError || new Error("No se pudo descargar el media tras varios intentos");
}

function extractMimetype(message, messageType) {
    if (messageType === "imageMessage") {
        return message.imageMessage?.mimetype || "image/jpeg";
    }
    if (messageType === "documentMessage" || messageType === "documentWithCaptionMessage") {
        const doc = message.documentMessage || message.documentWithCaptionMessage?.message?.documentMessage;
        return doc?.mimetype || "application/octet-stream";
    }
    return "application/octet-stream";
}

function extractFilename(message, messageType) {
    if (messageType === "documentMessage") {
        return message.documentMessage?.fileName || null;
    }
    if (messageType === "documentWithCaptionMessage") {
        return message.documentWithCaptionMessage?.message?.documentMessage?.fileName || null;
    }
    return null;
}

module.exports = downloadIncomingMedia;
