function isReceipt(text) {
    const keywords = [
        "mercado pago",
        "transferencia",
        "transferiste",
        "dinero enviado",
        "transferencia realizada",
        "comprobante",
        "banco",
        "transferido"
    ];

    return keywords.some(word =>
        text.includes(word)
    );
}

module.exports = isReceipt;