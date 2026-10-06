const { chromium } = require("playwright");
const path = require("path");

const PROFILE_DIR = path.join(process.cwd(), ".instagram-profile");

let context = null;
let page = null;

const getBrowserPage = async () => {
    if (page) {
        return page;
    }

    const isProduction = process.env.NODE_ENV === "production";

    context = await chromium.launchPersistentContext(PROFILE_DIR, {
        headless: isProduction,
        viewport: {
            width: 1280,
            height: 800
        }
    });

    page = context.pages()[0] || await context.newPage();

    return page;
};

/*
 * Extract a complete JSON array/object starting at startIndex.
 *
 * Instagram embeds JSON-like data inside large script strings.
 * We cannot JSON.parse the entire script, so we find the matching
 * closing bracket while respecting strings and escaped characters.
 */
const extractJsonValue = (text, startIndex) => {
    const opening = text[startIndex];

    const closing =
        opening === "["
            ? "]"
            : opening === "{"
                ? "}"
                : null;

    if (!closing) {
        return null;
    }

    let depth = 0;
    let insideString = false;
    let escaped = false;

    for (let i = startIndex; i < text.length; i++) {
        const char = text[i];

        if (insideString) {
            if (escaped) {
                escaped = false;
                continue;
            }

            if (char === "\\") {
                escaped = true;
                continue;
            }

            if (char === '"') {
                insideString = false;
            }

            continue;
        }

        if (char === '"') {
            insideString = true;
            continue;
        }

        if (char === opening) {
            depth++;
        } else if (char === closing) {
            depth--;

            if (depth === 0) {
                return text.slice(startIndex, i + 1);
            }
        }
    }

    return null;
};

const extractCarouselMediaFromScript = (script) => {
    const marker = '"carousel_media":';

    const mediaIndex = script.indexOf(marker);

    if (mediaIndex === -1) {
        return [];
    }

    const arrayStart = mediaIndex + marker.length;

    if (script[arrayStart] !== "[") {
        return [];
    }

    const jsonArray = extractJsonValue(script, arrayStart);

    if (!jsonArray) {
        return [];
    }

    try {
        return JSON.parse(jsonArray);
    } catch (error) {
        console.error(
            "Failed to parse carousel_media:",
            error.message
        );

        return [];
    }
};

const extractInstagramImages = async (instagramUrl) => {
    const browserPage = await getBrowserPage();

    await browserPage.goto(instagramUrl, {
        waitUntil: "domcontentloaded",
        timeout: 60000
    });

    await browserPage.waitForTimeout(4000);

    const scripts = await browserPage.locator("script").evaluateAll(
        (elements) =>
            elements
                .map((script) => script.textContent || "")
                .filter((text) => text.trim())
    );

    const imageUrls = [];

    // --------------------------------------------------
    // 1. Try carousel media
    // --------------------------------------------------

    for (const script of scripts) {
        if (!script.includes('"carousel_media"')) {
            continue;
        }

        const carouselMedia =
            extractCarouselMediaFromScript(script);

        for (const media of carouselMedia) {
            const candidates =
                media?.image_versions2?.candidates || [];

            if (!candidates.length) {
                continue;
            }

            const bestImage = candidates.reduce((best, current) => {
                const bestPixels =
                    (best.width || 0) * (best.height || 0);

                const currentPixels =
                    (current.width || 0) * (current.height || 0);

                return currentPixels > bestPixels
                    ? current
                    : best;
            });

            if (bestImage.url) {
                imageUrls.push(bestImage.url);
            }
        }
    }

    // --------------------------------------------------
    // 2. Fallback: single-image post
    // --------------------------------------------------

    if (!imageUrls.length) {
        const ogImage = await browserPage
            .locator('meta[property="og:image"]')
            .getAttribute("content");

        if (ogImage) {
            imageUrls.push(ogImage);
        }
    }

    const uniqueImageUrls = [
        ...new Set(imageUrls)
    ];

    if (!uniqueImageUrls.length) {
        throw new Error("No Instagram images were extracted.");
    }

    return uniqueImageUrls;
};

module.exports = {
    extractInstagramImages
};