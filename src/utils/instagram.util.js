const INSTAGRAM_URL_REGEX =
    /https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel|tv)\/[A-Za-z0-9_-]+(?:\/)?(?:\?[^\s]+)?/i;

const extractInstagramUrl = (text) => {
    const match = text.match(INSTAGRAM_URL_REGEX);

    if (!match) {
        return null;
    }

    const url = new URL(match[0]);

    return `${url.origin}${url.pathname}`;
};

module.exports = {
    extractInstagramUrl
};