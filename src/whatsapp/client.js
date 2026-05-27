const { Client, LocalAuth } =
require("whatsapp-web.js");

const qrcode =
require("qrcode-terminal");

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

client.on("ready", () => {

    console.log("WHATSAPP CONECTADO");
});

module.exports = client;