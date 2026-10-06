const {
    extractInstagramImages
} = require("../clients/instagram.client");

const extractMediaUrls = async (instagramUrl) => {
    return await extractInstagramImages(instagramUrl);
};

module.exports = {
    extractMediaUrls
};