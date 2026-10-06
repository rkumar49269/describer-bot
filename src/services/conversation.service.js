const Conversation = require("../models/conversation.model");

const findConversationByTelegramMessageId = async (telegramMessageId) => {
    return Conversation.findOne({
        "messages.telegramMessageId": telegramMessageId
    });
};

module.exports = {
    findConversationByTelegramMessageId
};