const { telegramBotToken } = require("../config/env")

const BASE_URL = `https://api.telegram.org/bot${telegramBotToken}`

const call = async (method, payload) => {
    const response = await fetch(`${BASE_URL}/${method}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    })

    const data = await response.json()

    if (!response.ok || !data.ok) {
        throw new Error(`Telegram API error: ${JSON.stringify(data)}`)
    }

    return data.result
}

const sendMessage = (chatId, text) => {
    return call("sendMessage", {
        chat_id: chatId,
        text
    })
}

const sendChatAction = (chatId, action) => {
    return call("sendChatAction", {
        chat_id: chatId,
        action
    });
};

module.exports = { sendMessage, sendChatAction }
