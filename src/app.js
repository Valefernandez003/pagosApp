require("dotenv").config();

const cron = require("node-cron");

const client = require("./whatsapp/client");

const handleReceiptMessage =
    require("./handlers/handleReceiptMessage");

const handleTextPayment =
    require("./handlers/handleTextPayment");

    cron.schedule("0 6 * * *", async () => {
    console.log(" Iniciando reinicio diario programado para liberar memoria...");
    try {
        if (client) {
            await client.destroy(); 
            console.log("Cliente de WhatsApp destruido.");
        }
    } catch (error) {
        console.error("Error al destruir el cliente de WhatsApp durante el reinicio:", error);
    } finally {
        console.log("Apagando el proceso de Node.js. PM2 lo reiniciará ahora.");
        process.exit(0); 
    }
});

client.on("message", async (message) => {
    
    try {
        console.log("MENSAJE RECIBIDO", message.type);

        const nowInSeconds =
            Math.floor(Date.now() / 1000);

        const messageAge =
            nowInSeconds - message.timestamp;

        if (messageAge > 300) {
            return;
        }

        if (message.from.includes("@g.us")) {
            return;
        }

        if (message.hasMedia) {

            console.log(
                "Media recibida:",
                message.type
            );

            if (
                message.type !== "image" &&
                message.type !== "document"
            ) {

                return;
            }

            await handleReceiptMessage(
                message
            );

            return;
        }

        await handleTextPayment(
            message
        );

    } catch (error) {

        console.error(
            "❌ ERROR GENERAL:",
            error
        );
    }
});

client.initialize();