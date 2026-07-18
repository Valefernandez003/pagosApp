require("dotenv").config();

const cron = require("node-cron");
const { getContentType } = require("@whiskeysockets/baileys");

const { startClient } = require("./whatsapp/client");

const handleReceiptMessage =
    require("./handlers/handleReceiptMessage");

const handleTextPayment =
    require("./handlers/handleTextPayment");

const MEDIA_TYPES = [
    "imageMessage",
    "documentMessage",
    "documentWithCaptionMessage",
];

async function main() {
    const sock = await startClient();

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
        // Solo interesan mensajes nuevos en vivo
        if (type !== "notify") return;

        for (const m of messages) {
            try {
                if (!m.message) continue;
                if (m.key.fromMe) continue;

                const from = m.key.remoteJid;

                const nowInSeconds =
                    Math.floor(Date.now() / 1000);

                const messageAge =
                    nowInSeconds - Number(m.messageTimestamp);

                if (messageAge > 300) {
                    continue;
                }

                if (from === "status@broadcast") {
                    continue;
                }

                if (from.includes("@g.us")) {
                    continue;
                }

                if (from.includes("@newsletter")) {
                    continue;
                }

                const contentType = getContentType(m.message);

                if (MEDIA_TYPES.includes(contentType)) {

                    console.log(
                        "Media recibida:",
                        contentType
                    );

                    await handleReceiptMessage(m, sock);

                    continue;
                }

                await handleTextPayment(m);

            } catch (error) {

                console.error(
                    "ERROR GENERAL:",
                    error
                );
            }
        }
    });

    cron.schedule("0 6 * * *", async () => {
        console.log("Iniciando reinicio diario programado...");
        console.log("Apagando el proceso de Node.js. PM2 lo reiniciará ahora.");
        process.exit(0);
    });

    async function gracefulExit() {
        console.log("Cerrando proceso...");
        process.exit(0);
    }

    process.on("SIGINT", gracefulExit);
    process.on("SIGTERM", gracefulExit);
}

main();