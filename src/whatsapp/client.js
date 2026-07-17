const { Client, LocalAuth } =
require("whatsapp-web.js");

const qrcode =
require("qrcode-terminal");

let isReady = false; // Variable de control

const client =
new Client({

    authStrategy:
        new LocalAuth(),

    puppeteer: {

        headless: true,

        args: [

            "--no-sandbox",

            "--disable-setuid-sandbox",

            "--disable-dev-shm-usage"
        ]
    }
});

client.on("qr", (qr) => {

    console.log("ESCANEA QR");

    qrcode.generate(qr, {
        small: true
    });
});

client.on("authenticated", () => {

    console.log("AUTH OK");
});

client.on("ready", async () => {
    isReady = true;
    console.log("WHATSAPP CONECTADO");
});

client.on("message_ack", () => {
    console.log("MESSAGE_ACK");
});

client.on("change_state", state => {
    console.log("STATE:", state);
});

client.on("disconnected", async (reason) => {

    console.log("WHATSAPP DESCONECTADO: ", reason);
    try {
        await client.destroy(); // Cierre limpio antes de salir
    } catch (e) {}
    process.exit(1);
});

setTimeout(async () => {
    if (!isReady) {
        console.log("ALERTA: WhatsApp no llegó al estado READY en 5 minutos. Forzando cierre limpio...");
        try {
            //mata Chromium y libera los bloqueos de sesión
            await client.destroy(); 
            console.log("Puppeteer cerrado correctamente.");
        } catch (error) {
            console.error("Error al intentar cerrar el cliente en el watchdog:", error);
        } finally {
            console.log("Reiniciando proceso vía PM2...");
            process.exit(1);
        }
    }

}, 5 * 60 * 1000);

module.exports = client;