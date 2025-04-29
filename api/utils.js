const { MessageMedia } = require('whatsapp-web.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Create downloads directory if it doesn't exist
const DOWNLOAD_DIR = path.join(__dirname, 'downloads');
if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

/**
 * Download a file from URL and save it locally
 * @param {string} url - URL of the file to download
 * @param {string} filename - Filename to save as
 * @returns {Promise<string>} - Path to downloaded file
 */
const downloadFile = async (url, filename) => {
    try {
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream'
        });

        const filepath = path.join(DOWNLOAD_DIR, filename);
        const writer = fs.createWriteStream(filepath);

        return new Promise((resolve, reject) => {
            response.data.pipe(writer);
            writer.on('finish', () => resolve(filepath));
            writer.on('error', reject);
        });
    } catch (error) {
        console.error('Download error:', error);
        throw new Error(`Failed to download file: ${error.message}`);
    }
};

/**
 * Converts URL to MessageMedia for sending via WhatsApp
 * @param {string} url - Media URL
 * @param {string} filename - Filename
 * @returns {Promise<MessageMedia>} - WhatsApp-ready media
 */
const urlToMessageMedia = async (url, filename) => {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'binary');
        const mediaType = response.headers['content-type'];
        
        return new MessageMedia(
            mediaType || 'application/octet-stream',
            buffer.toString('base64'),
            filename
        );
    } catch (error) {
        console.error('Media conversion error:', error);
        throw new Error(`Failed to convert URL to media: ${error.message}`);
    }
};

/**
 * Formats search results into readable message
 * @param {Array} results - Array of search results
 * @param {string} title - Title for the results message
 * @returns {string} - Formatted message
 */
const formatSearchResults = (results, title) => {
    if (!results || results.length === 0) {
        return `*${title}*\n\nNo results found.`;
    }

    // Filter out any undefined or null items
    const validResults = results.filter(item => item != null);
    
    if (validResults.length === 0) {
        return `*${title}*\n\nNo valid results found.`;
    }

    let message = `*${title}*\n\n`;
    
    validResults.forEach((item, index) => {
        // Safe access to properties with null checks
        const itemTitle = item?.title || item?.name || `Item ${index + 1}`;
        message += `*${index + 1}. ${itemTitle}*\n`;
        
        // Add details safely with optional chaining
        if (item?.description) {
            const desc = item.description;
            message += `${desc.slice(0, 100)}${desc.length > 100 ? '...' : ''}\n`;
        }
        
        const itemUrl = item?.link || item?.url;
        if (itemUrl) message += `🔗 ${itemUrl}\n`;
        
        if (item?.thumbnail) message += `🖼️ Has thumbnail\n`;
        
        message += '\n';
    });

    return message;
};

/**
 * Sends an error message to the chat
 * @param {Object} chat - WhatsApp chat object
 * @param {string} message - Error message
 */
const sendErrorMessage = async (chat, message) => {
    await chat.sendMessage(`❌ *Error:* ${message}`);
};

/**
 * Validates a URL
 * @param {string} url - URL to validate
 * @returns {boolean} - Whether URL is valid
 */
const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    } catch (error) {
        return false;
    }
};

module.exports = {
    downloadFile,
    urlToMessageMedia,
    formatSearchResults,
    sendErrorMessage,
    isValidUrl
};