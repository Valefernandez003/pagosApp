function normalizeAmount(text) {
    text = text.toLowerCase();

    const match = text.match(/-?\d+/);

    if (!match) return null;
    
    let amount = parseInt(match[0]);
    
    if(amount <= 0){
        return null;
    }

    if(amount > 1000000){
        return null;
    }

    const palabrasMiles = [
        "mil",
        "lucas",
        "k"
    ];

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
        "pago"
    ];

    if (palabrasMiles.some(word => text.includes(word))) {
        return amount * 1000;
    }

    if (
        amount < 1000 &&
        palabrasPago.some(word => text.includes(word))
    ) {
        return amount * 1000;
    }

    return amount;
}

module.exports = normalizeAmount;