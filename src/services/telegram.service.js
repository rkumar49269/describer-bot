const telegramClient = require("../clients/telegram.client")
const {
    startUserSession,
    stopUserSession,
    isUserActive
} = require("../services/telegram-session.service")

const { extractInstagramUrl } = require("../utils/instagram.util")
const { extractMediaUrls } = require("./instagram.service")
const { downloadImages } = require("./media.service");
const { describeImages, answerFollowUp } = require("./gemini.service");
const { splitTelegramMessage } = require("../utils/telegram.util");
const { findConversationByTelegramMessageId } = require("./conversation.service");
const Conversation = require("../models/conversation.model");

const pendingRequests = new Map();
const PENDING_PROMPT_TIMEOUT = 10000;

const startTypingIndicator = (chatId) => {
    let stopped = false;

    const sendTyping = async () => {
        if (stopped) return;

        try {
            await telegramClient.sendChatAction(
                chatId,
                "typing"
            );
        } catch (error) {
            console.error(
                "Telegram typing indicator error:",
                error.message
            );
        }
    };

    sendTyping();

    const interval = setInterval(sendTyping, 4000);

    return () => {
        stopped = true;
        clearInterval(interval);
    };
};

const processInstagramRequest = async (
    message,
    instagramUrl,
    userPrompt
) => {
    const chatId = message.chat.id;
    const stopTyping = startTypingIndicator(chatId);

    await telegramClient.sendMessage(
        chatId,
        "Instagram URL detected. Extracting media..."
    );

    try {
        const mediaUrls = await extractMediaUrls(instagramUrl);

        const images = await downloadImages(mediaUrls);

        const result = await describeImages(images, userPrompt);

        const messageChunks = splitTelegramMessage(result.answer);

        let rootTelegramMessageId = null;

        for (const chunk of messageChunks) {
            const sentMessage = await telegramClient.sendMessage(
                chatId,
                chunk
            );

            if (!rootTelegramMessageId) {
                rootTelegramMessageId = sentMessage.message_id;
            }
        }

        await Conversation.create({
            userId: String(chatId),

            rootTelegramMessageId,

            instagramUrl,

            userPrompt: userPrompt || null,

            context: result.context,

            messages: [
                {
                    role: "user",
                    content: message.text,
                    telegramMessageId: message.message_id
                },
                {
                    role: "assistant",
                    content: result.answer,
                    telegramMessageId: rootTelegramMessageId
                }
            ]
        });

    } catch (error) {
        console.error(
            "Telegram message processing error:",
            error
        );

        await telegramClient.sendMessage(
            chatId,
            "Sorry, something went wrong while analyzing the Instagram post. Please try again."
        );
    } finally {
        stopTyping();
    }
};

const handleTelegramMessage = async (message) => {
    const chatId = message.chat.id
    const text = message.text?.trim()

    if (!text) return

    if (text == "/start") {
        startUserSession(chatId)

        await telegramClient.sendMessage(
            chatId,
            "Welcome to Describer! \n\nSend me a public Instagram post(Image) URL and I'll analyze it for you."
        )
        return
    }

    if (text === "/stop") {
        stopUserSession(chatId)

        await telegramClient.sendMessage(
            chatId,
            "Describer stopped. Send /start whenever you want to use it again."
        )
        return
    }

    if (!isUserActive(chatId)) {
        await telegramClient.sendMessage(
            chatId,
            "Describer is currently stopped. Send /start to begin."
        );

        return;
    }

    const replyToMessageId = message.reply_to_message?.message_id;

    if (replyToMessageId) {
        const conversation =
            await findConversationByTelegramMessageId(replyToMessageId);

        if (conversation) {
            const userQuestion = text;

            const stopTyping = startTypingIndicator(chatId);

            try {
                const answer = await answerFollowUp(
                    conversation.context,
                    conversation.messages,
                    userQuestion
                );

                const messageChunks = splitTelegramMessage(answer);

                let firstAssistantMessageId = null;

                for (const chunk of messageChunks) {
                    const sentMessage = await telegramClient.sendMessage(
                        chatId,
                        chunk
                    );

                    if (!firstAssistantMessageId) {
                        firstAssistantMessageId = sentMessage.message_id;
                    }
                }

                conversation.messages.push({
                    role: "user",
                    content: userQuestion,
                    telegramMessageId: message.message_id
                });

                conversation.messages.push({
                    role: "assistant",
                    content: answer,
                    telegramMessageId: firstAssistantMessageId
                });

                await conversation.save();

                return;

            } finally {
                stopTyping();
            }
        }
    }

    const instagramUrl = extractInstagramUrl(text)

    const pendingRequest = pendingRequests.get(chatId);

    if (pendingRequest && !instagramUrl) {
        clearTimeout(pendingRequest.timeout);
        pendingRequests.delete(chatId);

        await processInstagramRequest(
            {
                ...pendingRequest.message,
                text: `${pendingRequest.instagramUrl}\n\n${text}`
            },
            pendingRequest.instagramUrl,
            text
        );

        return;
    }

    if (instagramUrl) {
        const urlMatch = text.match(
            /https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel|tv)\/[A-Za-z0-9_-]+(?:\/)?(?:\?[^\s]+)?/i
        );

        const fullInstagramUrl = urlMatch ? urlMatch[0] : "";

        const userPrompt = text
            .replace(fullInstagramUrl, "")
            .trim();

        // URL + prompt in the same message
        if (userPrompt) {
            await processInstagramRequest(
                message,
                instagramUrl,
                userPrompt
            );

            return;
        }

        // URL only → wait 3 seconds for a separate prompt
        const existingRequest = pendingRequests.get(chatId);

        if (existingRequest) {
            clearTimeout(existingRequest.timeout);
        }

        const timeout = setTimeout(async () => {
            pendingRequests.delete(chatId);

            await processInstagramRequest(
                message,
                instagramUrl,
                null
            );
        }, PENDING_PROMPT_TIMEOUT);

        pendingRequests.set(chatId, {
            message,
            instagramUrl,
            timeout
        });

        return;
    }

    await telegramClient.sendMessage(chatId, `You said: ${text}`)
}

module.exports = { handleTelegramMessage }