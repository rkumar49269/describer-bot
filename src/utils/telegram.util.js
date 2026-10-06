const TELEGRAM_MESSAGE_LIMIT = 4000;

const formatTelegramText = (text) => {
    return text
        .replace(/\r\n/g, "\n")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/^\s*-\s+/gm, "• ");
};

const splitLongText = (text) => {
    const words = text.split(/\s+/);
    const chunks = [];
    let currentChunk = "";

    for (const word of words) {
        const candidate = currentChunk
            ? `${currentChunk} ${word}`
            : word;

        if (candidate.length <= TELEGRAM_MESSAGE_LIMIT) {
            currentChunk = candidate;
        } else {
            if (currentChunk) {
                chunks.push(currentChunk);
            }

            currentChunk = word;
        }
    }

    if (currentChunk) {
        chunks.push(currentChunk);
    }

    return chunks;
};

const splitTelegramMessage = (text) => {
    const formattedText = formatTelegramText(text);

    if (formattedText.length <= TELEGRAM_MESSAGE_LIMIT) {
        return [formattedText];
    }

    const lines = formattedText.split("\n");

    const chunks = [];
    let currentChunk = "";

    for (const line of lines) {
        const cleanLine = line.trim();

        if (!cleanLine) {
            if (currentChunk) {
                currentChunk += "\n";
            }

            continue;
        }

        if (cleanLine.length > TELEGRAM_MESSAGE_LIMIT) {
            if (currentChunk.trim()) {
                chunks.push(currentChunk.trim());
                currentChunk = "";
            }

            chunks.push(...splitLongText(cleanLine));
            continue;
        }

        const candidate = currentChunk
            ? `${currentChunk}\n${cleanLine}`
            : cleanLine;

        if (candidate.length <= TELEGRAM_MESSAGE_LIMIT) {
            currentChunk = candidate;
        } else {
            chunks.push(currentChunk.trim());
            currentChunk = cleanLine;
        }
    }

    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
};

module.exports = {
    splitTelegramMessage,
    formatTelegramText
};