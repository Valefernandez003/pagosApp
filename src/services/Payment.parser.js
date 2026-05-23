function isPaymentMessage(text) {

    if (!text) {
        return false;
    }

    text =
        text.toLowerCase();

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

            "capaz"
        ];

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

        "envie",
        "envié",
        "envio",
        "envío",
        "te hice la transferencia",
        "ya transferí",
        "ya te mandé",
        "te envié",
        "te pasé",
    ];

    if (blacklist.some(word => text.includes(word))){
        return false;
    }
    return keywords.some(word =>text.includes(word));
}

module.exports =
    isPaymentMessage;