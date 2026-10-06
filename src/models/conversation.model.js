const mongoose = require("mongoose");

const conversationMessageSchema = new mongoose.Schema(
    {
        role: {
            type: String,
            enum: ["user", "assistant"],
            required: true
        },

        content: {
            type: String,
            required: true
        },

        telegramMessageId: {
            type: Number,
            required: true
        }
    },
    {
        timestamps: true,
        _id: true
    }
);

const conversationSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            index: true
        },

        rootTelegramMessageId: {
            type: Number,
            required: true,
            unique: true,
            index: true
        },

        instagramUrl: {
            type: String,
            required: true
        },

        userPrompt: {
            type: String,
            default: null
        },

        context: {
            type: String,
            required: true
        },

        messages: {
            type: [conversationMessageSchema],
            default: []
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "Conversation",
    conversationSchema
);