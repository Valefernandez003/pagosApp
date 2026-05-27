const vision =
require("@google-cloud/vision");

const extractAmountFromText =
require("../utils/extractAmountFromText");

const client =
new vision.ImageAnnotatorClient();

async function extractTextFromImage(media) {

    try {

        if (!media?.data) {

            console.log(
                "Media inválida"
            );

            return null;
        }

        /*base64 -> buffer */

        const buffer =
            Buffer.from(
                media.data,
                "base64"
            );

        /*Google Vision OCR*/

        const [result] =
            await client
                .documentTextDetection({

                    image: {
                        content: buffer
                    }
                });

        /*texto detectado*/

        const text =
            result
                ?.fullTextAnnotation
                ?.text || "";

        /*detectar monto*/

        let detectedAmount =
            null;

        try {

            detectedAmount =
                extractAmountFromText(
                    text
                );

        } catch (amountError) {

            console.log(
                "\nERROR EXTRACTING AMOUNT:\n"
            );

            console.log(
                amountError
            );
        }


        /*retorno final*/

        return {

            text,

            detectedAmount
        };

    } catch (error) {

        console.log(
            "\nGOOGLE OCR ERROR:\n"
        );

        console.log(error);

        return null;
    }
}

module.exports =
    extractTextFromImage;