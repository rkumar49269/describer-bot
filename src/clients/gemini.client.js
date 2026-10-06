const { GoogleGenAI } = require("@google/genai");
const { geminiApiKey } = require("../config/env");

const ai = new GoogleGenAI({
    apiKey: geminiApiKey
});

const MAX_RETRIES = 2;

const generateContent = async (contents, model = "gemini-3.5-flash") => {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await ai.models.generateContent({
                model,
                contents
            });

            return response.text;
        } catch (error) {
            const status = error?.status;

            if (status !== 503 || attempt === MAX_RETRIES) {
                throw error;
            }

            const delay = 2000 * Math.pow(2, attempt);

            await new Promise((resolve) => {
                setTimeout(resolve, delay);
            });
        }
    }
};

module.exports = {
    generateContent
};