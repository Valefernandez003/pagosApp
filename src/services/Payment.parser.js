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
        "consulta",
        "foto",
        "fotos",
    ];

    if (blacklist.some(word => text.includes(word))) {
        return false;
    }

    const strongKeywords = [
        "te hice la transferencia",
        "ya transferí",
        "ya transferi",
        "te transferi",
        "te transferí",
        "ya te transferi",
        "ya te transferí",
        "te deposite",
        "te deposité",
        "ya te deposite",
        "ya te deposité",
        "te envié comprobante",
        "te envie comprobante",
        "te mandé comprobante",
        "te mande comprobante",
        "transferencia realizada",
        "te acabo de transferir",
        "ya te pagué",
        "ya te pague",
        "te pasé",
        "te pase",
        "te mande",
        "te mandé",
        "ahi te mande",
        "ahí te mande",
        "ahi te mandé",
        "ahí te mandé",
        "ya te mande",
        "ya te mandé",
        "te envie",
        "te envié",
        "ya te envie",
        "ya te envié",
        "ahí te envié",
        "ahi te envie",
        "ahí te envie",
        "ahi te envié",
    ];

    const weakKeywords = [
        "pagué",
        "pague",
        "pago",
        "transferí",
        "transferi",
        "deposité",
        "deposite",
        "abone",
        "aboné"
    ];

    const hasStrong = strongKeywords.some(w => text.includes(w));
    const hasWeak = weakKeywords.some(w => text.includes(w));
    const hasAmount =
    /\d+/.test(text);

    return (
        (hasStrong && hasAmount) ||
        (hasWeak && hasAmount)
    );
}

module.exports = isPaymentMessage;