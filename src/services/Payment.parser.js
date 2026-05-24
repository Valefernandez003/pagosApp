function isPaymentMessage(text) {
    if (!text || typeof text !== "string") {
        return false;
    }

    text = text.toLowerCase();

    const negativePatterns = [
        "no pag",
        "no te pag",
        "no he pag",
        "todavía no pag",
        "todavia no pag",
        "aún no pag",
        "aun no pag",
        "me olvidé de pagar",
        "me olvide de pagar",
        "no hice el pago",
        "no transferi",
        "no transferí",
        "no te transferi",
        "no te transferí"
    ];

    if (negativePatterns.some(p => text.includes(p))) {
        return false;
    }

    const blacklist = [
        "mañana",
        "despues",
        "después",
        "queres",
        "querés",
        "puedo",
        "podria",
        "podría",
        "si te",
        "te parece",
        "capaz",
        "consulto",
        "consulta"
    ];

    if (blacklist.some(word => text.includes(word))) {
        return false;
    }

    const strongKeywords = [
        "te hice la transferencia",
        "ya transferí",
        "ya transferi",
        "te envié comprobante",
        "te envie comprobante",
        "te mandé comprobante",
        "te mande comprobante",
        "transferencia realizada",
        "ya te pagué",
        "ya te pague",
        "te acabo de transferir"
    ];

    const weakKeywords = [
        "pagué",
        "pague",
        "pago",
        "transferí",
        "transferi",
        "deposité",
        "deposite",
        "envíe",
        "envie",
        "mandé",
        "mande",
        "abone",
        "aboné"
    ];

    const hasStrong = strongKeywords.some(w => text.includes(w));
    const hasWeak = weakKeywords.some(w => text.includes(w));

    return hasStrong || hasWeak;
}

module.exports = isPaymentMessage;