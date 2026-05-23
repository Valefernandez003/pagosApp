function normalizeAmount(text) {

    if (!text) {
        return null;
    }

    text =
        text.toLowerCase();
    
    if (text.includes("?")) {
        return false;
    }

    /*detectar números*/

    const matches = text.match(
    /\d[\d.,]*/g
    );

    if (!matches) {
        return null;
    }

    /*tomar el mayor*/

    let amount = Math.max(

    ...matches.map(n => {

            return parseInt(

                n
                    .split(",")[0]
                    .replace(/\./g, "")
            );
        })
    );

    /* validaciones*/

    if (
        isNaN(amount) ||
        amount <= 0 ||
        amount > 1000000
    ) {
        return null;
    }

    const palabrasMiles = [

        "mil",

        "lucas",

        "k"
    ];

    /*palabras de pago*/

    const palabrasPago = [

        "transferi",
        "transferí",

        "pague",
        "pagué",

        "abone",
        "aboné",

        "mande",
        "mandé",

        "envie",
        "envié",

        "pase",
        "pasé",

        "pago",

        "transferencia"
    ];

    if (
        palabrasMiles.some(word =>
            text.includes(word)
        )
    ) {

        return amount * 1000;
    }

    if (

        amount < 1000 &&

        palabrasPago.some(word =>
            text.includes(word)
        )
    ) {

        return amount * 1000;
    }

    return amount;
}

module.exports =
    normalizeAmount;