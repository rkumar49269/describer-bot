require("dotenv").config()

module.exports = {
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
    port: process.env.PORT || 3000,
    geminiApiKey: process.env.GEMINI_API_KEY,
    instagramSessionId: process.env.IG_SESSION_ID,
    mongodbUri: process.env.MONGODB_URI,
    resendApiKey: process.env.RESEND_API_KEY,
}