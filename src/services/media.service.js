const downloadImage = async (url) => {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Image download failed: ${response.status} ${response.statusText}`
        );
    }

    const contentType =
        response.headers.get("content-type") || "image/jpeg";

    const arrayBuffer = await response.arrayBuffer();

    return {
        buffer: Buffer.from(arrayBuffer),
        mimeType: contentType
    };
};

const downloadImages = async (imageUrls) => {
    const images = [];

    for (const url of imageUrls) {
        const image = await downloadImage(url);
        images.push(image);
    }

    return images;
};

module.exports = {
    downloadImages
};