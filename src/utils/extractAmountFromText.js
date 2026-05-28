function normalizeNumber(str) {

    return parseInt(

        String(str)

            .split(",")[0]

            .replace(/\$/g, "")

            .replace(/\./g, "")

            .replace(/\s/g, "")
    );
}

function extractAmountFromText(text) {

    if (!text) {
        return null;
    }

    text = String(text);

    /**
     * PRIORIDAD:
     * buscar montos con $
     * */

    const moneyMatches = text.match(
        /\$\s?\d{1,3}(?:\.\d{3})*(?:,\d+)?/g
    );

    if (moneyMatches?.length) {

        const amounts = moneyMatches.map(normalizeNumber).filter(n => n > 0);

        if (amounts.length) {
            return Math.max(...amounts);
        }
    }

    /*fallback inteligente*/

    const lines =
        text.split("\n");

    const blacklist = [

        "cuit",
        "cuil",
        "cvu",
        "operación",
        "operacion",
        "mercado pago"
    ];

    const possibleAmounts = [];

    for (const line of lines) {

        const lower =
            line.toLowerCase();

        /**
         * ignorar líneas peligrosas
         */

        if (
            blacklist.some(word =>
                lower.includes(word)
            )
        ) {
            continue;
        }

        /**
         * buscar números normales
         */

        const matches =
            line.match(
                /\d{1,3}(?:\.\d{3})+/g
            );

        if (!matches) {
            continue;
        }

        for (const match of matches) {

            const amount =
                normalizeNumber(
                    match
                );

            if (
                amount > 1000 &&
                amount < 9999999
            ) {
                possibleAmounts.push(
                    amount
                );
            }
        }
    }

    if (!possibleAmounts.length) {
        return null;
    }

    return Math.max(
        ...possibleAmounts
    );
}

module.exports =
    extractAmountFromText;