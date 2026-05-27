function formatDate(timestamp) {

    return new Date(timestamp * 1000)
        .toLocaleString(
            "es-AR",
            {
                timeZone:
                    "America/Argentina/Buenos_Aires",
                    hour12: false,
            }
        );
}

module.exports =
    formatDate;