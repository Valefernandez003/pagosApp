require("dotenv").config();

const client = require("./whatsapp/client");

const handleReceiptMessage =
    require("./handlers/handleReceiptMessage");

const handleTextPayment =
    require("./handlers/handleTextPayment");

client.on("message", async (message) => {

    try {

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