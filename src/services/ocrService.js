const Tesseract = require("tesseract.js");
const sharp = require("sharp");

async function extractTextFromImage(media) {
    try {
        if (!media?.data) return null;

        const buffer = Buffer.from(media.data, "base64");

        const processedBuffer = await sharp(buffer)
            .resize({ width: 1600 })
            .grayscale()
            .normalize()
            .toBuffer();

        const result = await Tesseract.recognize(
            processedBuffer,
            "spa+eng"
        );

        const text = (result?.data?.text || "").toLowerCase();

        const isReceipt = detectReceipt(text);

        return {
            text,
            isReceipt
        };

    } catch (error) {
        console.error("OCR ERROR:", error);
        return null;
    }
}

function detectReceipt(text) {
    const keywords = [
        "comprobante",
        "transferencia",
        "mercado pago",
        "pagado",
        "envío de dinero",
        "operación",
        "cvu",
        "cuil"
    ];

    let score = 0;

    for (const k of keywords) {
        if (text.includes(k)) {
            score++;
        }
    }

    return score >= 2;
}

module.exports = extractTextFromImage;