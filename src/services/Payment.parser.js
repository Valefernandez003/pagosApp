function isPaymentMessage(text) {
    const keywords = [
        "pague",
        "pagué",
        "pago",
        "transferi",
        "transferí",
        "transfiero",
        "abone",
        "aboné",
        "abono",
        "pase",
        "pasé",
        "paso",
        "mande",
        "mandé",
        "mando",
        "deposite",
        "deposité",
        "deposito",
        "envié",
        "envie",
        "envio",
        "envío",
    ];

    return keywords.some(word =>
        text.toLowerCase().includes(word)
    );
}

module.exports = isPaymentMessage;