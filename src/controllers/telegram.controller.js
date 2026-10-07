const { handleTelegramMessage } = require("../services/telegram.service")

const telegramWebhook = async (req, res) => {
    
    try {
        const message = req.body.message

        if (message) {
            await handleTelegramMessage(message)
        }

        res.sendStatus(200)

    } catch (error) {
        console.log("Telegram error", error)
        res.sendStatus(500)
    }
}

module.exports = { telegramWebhook }