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
    /\d+(?:[.,]\d+)?\s*k?|\d[\d.,]*/g
    );

    if (!matches) {
        return null;
    }

    /*tomar el mayor*/

    let amount = Math.max(

    ...matches.map(n => {

        const hasK = n.includes("k");

        let value = parseInt(
            n
                .replace("k", "")
                .split(",")[0]
                .replace(/\./g, "")
        );

        if (hasK) {
            value *= 1000;
        }

        return value;
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

        "pago",

        "transferencia"
    ];

    const hasMilesWord = palabrasMiles.some(word => text.split(/\s+/).includes(word))

    if (hasMilesWord) {
        return amount * 1000;
    }

    const paymentPatterns = [
        /\bte\s+pas[eé]\s+\d+\b/,
        /\bpagu[eé]?\s+\d+\b/,
        /\btransfer[ií]\s+\d+\b/,
        /\babon[eé]\s+\d+\b/,
        /\benvi[eé]\s+\d+\b/,
    ];

const looksLikePayment =
    paymentPatterns.some(pattern =>
        pattern.test(text)
    );

if (
    amount < 1000 &&
    looksLikePayment
) {
    return amount * 1000;
}

    return amount;
}

module.exports =
    normalizeAmount;