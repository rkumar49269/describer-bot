const Conversation = require("../models/conversation.model");

const findConversationByTelegramMessageId = async (telegramMessageId) => {
    return Conversation.findOne({
        "messages.telegramMessageId": telegramMessageId
    });
};

const findLatestConversationByUserId = async (userId) => {
    return Conversation.findOne({ userId }).sort({ createdAt: -1 });
};

module.exports = {
    findConversationByTelegramMessageId,
    findLatestConversationByUserId
};