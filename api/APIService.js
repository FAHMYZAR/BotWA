const axios = require('axios');

// Base URL for all API calls
const API_BASE_URL = 'https://api.ferdev.my.id';

/**
 * General API request handler with error handling
 * @param {string} endpoint - API endpoint path
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - API response data
 */
const makeApiRequest = async (endpoint, params = {}) => {
    try {
        const url = `${API_BASE_URL}${endpoint}`;
        const response = await axios.get(url, { params });
        
        if (response.status !== 200) {
            throw new Error(`API returned status code ${response.status}`);
        }
        
        return response.data;
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error.message);
        throw new Error(`Failed to fetch data: ${error.message}`);
    }
};

// DOWNLOADER SERVICES
const downloaderService = {
    capcut: (link) => makeApiRequest('/downloader/capcut', { link }),
    douyin: (link) => makeApiRequest('/downloader/douyin', { link }),
    facebook: (link) => makeApiRequest('/downloader/facebook', { link }),
    fdroid: (link) => makeApiRequest('/downloader/fdroid', { link }),
    gdrive: (link) => makeApiRequest('/downloader/gdrive', { link }),
    github: (repo) => makeApiRequest('/downloader/github', { repo }),
    instagram: (link) => makeApiRequest('/downloader/instagram', { link }),
    mediafire: (link) => makeApiRequest('/downloader/mediafire', { link }),
    spotify: (link) => makeApiRequest('/downloader/spotify', { link }),
    snackvideo: (link) => makeApiRequest('/downloader/snackvideo', { link }),
    soundcloud: (link) => makeApiRequest('/downloader/soundcloud', { link }),
    tiktok: (link) => makeApiRequest('/downloader/tiktok', { link }),
    threads: (link) => makeApiRequest('/downloader/threads', { link }),
    twitter: (link) => makeApiRequest('/downloader/twitter', { link }),
    ytmp3: (link) => makeApiRequest('/downloader/ytmp3', { link }),
    ytmp4: (link) => makeApiRequest('/downloader/ytmp4', { link }),
    xnxx: (link) => makeApiRequest('/downloader/xnxx', { link })
};

// STICKER SERVICES
const stickerService = {
    searchGif: (query) => makeApiRequest('/sticker/gif', { query })
};

// SEARCH SERVICES
const searchService = {
    bstation: (query) => makeApiRequest('/search/bstation', { query }),
    cuaca: (kota) => makeApiRequest('/search/cuaca', { kota }),
    fdroid: (query) => makeApiRequest('/search/fdroid', { query }),
    gempa: () => makeApiRequest('/search/gempa'),
    grupwa: (query) => makeApiRequest('/search/grupwa', { query }),
    livewallpaper: (query) => makeApiRequest('/search/livewallpaper', { query }),
    pinterest: (query) => makeApiRequest('/search/pinterest', { query }),
    playstore: (query) => makeApiRequest('/search/playstore', { query }),
    jadwaltv: (channel) => makeApiRequest('/search/jadwaltv', { channel }),
    resep: (query) => makeApiRequest('/search/resep', { query }),
    sfile: (query) => makeApiRequest('/search/sfile', { query }),
    spotify: (query) => makeApiRequest('/search/spotify', { query }),
    soundcloud: (query) => makeApiRequest('/search/soundcloud', { query }),
    tiktok: (query) => makeApiRequest('/search/tiktok', { query }),
    whatmusic: (link) => makeApiRequest('/search/whatmusic', { link }),
    xnxx: (query) => makeApiRequest('/search/xnxx', { query }),
    youtube: (query) => makeApiRequest('/search/youtube', { query })
};

// TOOLS SERVICES
const toolsService = {
    ocr: (link) => makeApiRequest('/tools/ocr', { link }),
    remini: (link) => makeApiRequest('/tools/remini', { link }),
    removebg: (link) => makeApiRequest('/tools/removebg', { link }),
    ssweb: (link) => makeApiRequest('/tools/ssweb', { link }),
    shortlink: (link) => makeApiRequest('/tools/shortlink', { link }),
    text2qr: (text) => makeApiRequest('/tools/text2qr', { text }),
    toanime: (link) => makeApiRequest('/tools/toanime', { link }),
    tozombie: (link) => makeApiRequest('/tools/tozombie', { link }),
    text2imgv2: (text) => makeApiRequest('/tools/text2imgv2', { text }),
    yttranscript: (link) => makeApiRequest('/tools/yttranscript', { link })
};

// MAKER SERVICES
const makerService = {
    brat: (text) => makeApiRequest('/maker/brat', { text }),
    bratv2: (text) => makeApiRequest('/maker/bratv2', { text }),
    bratvid: (text) => makeApiRequest('/maker/bratvid', { text }),
    carbon: (text) => makeApiRequest('/maker/carbon', { text }),
    emojimix: (e1, e2) => makeApiRequest('/maker/emojimix', { e1, e2 }),
    fluximage: (prompt) => makeApiRequest('/maker/fluximage', { prompt }),
    tohitam: (link) => makeApiRequest('/maker/tohitam', { link })
};

// INTERNET SERVICES
const internetService = {
    githubroast: (username) => makeApiRequest('/internet/githubroast', { username }),
    infoua: (ua) => makeApiRequest('/internet/infoua', { ua }),
    infoip: (ip) => makeApiRequest('/internet/infoip', { ip }),
    tempmail: () => makeApiRequest('/internet/tempmail'),
    mailbox: (id) => makeApiRequest('/internet/mailbox', { id }),
    whois: (domain) => makeApiRequest('/internet/whois', { domain })
};

module.exports = {
    downloaderService,
    stickerService,
    searchService,
    toolsService,
    makerService,
    internetService
};