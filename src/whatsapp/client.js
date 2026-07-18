const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");

const qrcode = require("qrcode-terminal");
const pino = require("pino");

const logger = pino({ level: "silent" });

const AUTH_FOLDER = "./auth_info_baileys";

let sock = null;
let isReady = false;

async function startClient() {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        auth: state,
        logger,
        syncFullHistory: false,
        markOnlineOnConnect: false,
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log("ESCANEA QR");
            qrcode.generate(qr, { small: true });
        }

        if (connection === "open") {
            isReady = true;
            console.log("WHATSAPP CONECTADO");
            console.log("Número:", sock.user?.id);
        }

        if (connection === "close") {
            isReady = false;
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

            console.log(
                "WHATSAPP DESCONECTADO. Código:",
                statusCode,
                "¿Reintentar?",
                shouldReconnect
            );

            if (shouldReconnect) {
                startClient();
            } else {
                console.log("Sesión cerrada (logout). Hay que volver a escanear el QR.");
            }
        }
    });

    return sock;
}

function getSock() {
    if (!sock) {
        throw new Error("El cliente todavía no fue inicializado. Llamá a startClient() primero.");
    }
    return sock;
}

function getIsReady() {
    return isReady;
}

module.exports = {
    startClient,
    getSock,
    getIsReady,
};