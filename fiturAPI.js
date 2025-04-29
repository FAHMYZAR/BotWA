const { MessageMedia } = require('whatsapp-web.js');
const axios = require('axios'); // Tambahkan ini
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

const { 
    downloaderService,
    stickerService,
    searchService,
    toolsService, 
    makerService, 
    internetService 
} = require('./api/APIService');
const { 
    downloadFile, 
    urlToMessageMedia, 
    formatSearchResults, 
    sendErrorMessage,
    isValidUrl 
} = require('./api/utils');
let config = null;

const setConfig = (cfg) => {
    config = cfg;
};

// ----------------- DOWNLOADER FUNCTIONS -----------------

const handleDownload = async (message, chat, platform, url) => {
    let statusMessage;
    let tempFiles = [];
    
    try {
        if (!isValidUrl(url) && !message.hasMedia) {
            await chat.sendMessage('❌ Please provide a valid URL or attach media.');
            return;
        }

        statusMessage = await chat.sendMessage(`⏳ Processing ${platform} download...`);

        if (['tiktok', 'tt'].includes(platform.toLowerCase())) {
            try {
                console.log('TikTok URL:', url);
                
                await statusMessage.edit(`⏳ [1/4] Mengambil informasi video TikTok...`);
                
                const result = await downloaderService.tiktok(url);
                const videoUrl = result?.data?.dlink?.nowm;
                if (!videoUrl) {
                    await chat.sendMessage('❌ Failed to fetch TikTok video.');
                    return;
                }
                console.log('TikTok Video URL:', videoUrl);
        
                // Create temp directory if it doesn't exist
                const tempDir = path.join(__dirname, 'temp');
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir);
                }
        
                // Generate unique filenames based on timestamp to avoid conflicts
                const timestamp = Date.now();
                const originalFile = path.join(tempDir, `tiktok_${timestamp}_original.mp4`);
                const convertedFile = path.join(tempDir, `tiktok_${timestamp}_converted.mp4`);
                tempFiles.push(originalFile, convertedFile);
        
                // Download with progress tracking
                await statusMessage.edit(`⏳ [2/4] Mendownload video TikTok (0%)...`);
                
                const writer = fs.createWriteStream(originalFile);
                const response = await axios({
                    method: 'get',
                    url: videoUrl,
                    responseType: 'stream',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });
                
                const totalLength = response.headers['content-length'];
                let downloadedLength = 0;
                let lastReportedPercent = 0;
                
                response.data.on('data', (chunk) => {
                    downloadedLength += chunk.length;
                    const percent = Math.round((downloadedLength / totalLength) * 100);
                    
                    // Update status every 10% to avoid spam
                    if (percent >= lastReportedPercent + 10) {
                        statusMessage.edit(`⏳ [2/4] Mendownload video TikTok (${percent}%)...`)
                            .catch(err => console.error('Error updating status:', err));
                        lastReportedPercent = percent;
                    }
                });
                
                await new Promise((resolve, reject) => {
                    response.data.pipe(writer);
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });
                
                await statusMessage.edit(`⏳ [3/4] Mengkonversi video ke format yang kompatibel (0%)...`);

                try {
                    await new Promise((resolve, reject) => {
                        let lastProgress = 0;
                        
                        ffmpeg(originalFile)
                            // Simplified conversion options
                            .outputOptions([
                                '-c:v libx264',          // H.264 codec
                                '-preset ultrafast',      // Fastest encoding
                                '-crf 30',               // Higher compression (lower quality, smaller file)
                                '-pix_fmt yuv420p',       // Standard pixel format
                                '-c:a aac',              // Audio codec
                                '-movflags +faststart',   // Web optimization
                                '-vf scale=480:-2'       // Smaller resolution
                            ])
                            .on('start', (commandLine) => {
                                console.log('FFmpeg started:', commandLine);
                            })
                            .on('progress', (progress) => {
                                if (progress.percent) {
                                    const percent = Math.round(progress.percent);
                                    if (percent >= lastProgress + 10 || percent === 100) {
                                        statusMessage.edit(`⏳ [3/4] Mengkonversi video ke format yang kompatibel (${percent}%)...`)
                                            .catch(err => console.error('Error updating status:', err));
                                        lastProgress = percent;
                                    }
                                }
                            })
                            .on('error', (err, stdout, stderr) => {
                                console.error('FFmpeg error:', err);
                                console.error('FFmpeg stdout:', stdout);
                                console.error('FFmpeg stderr:', stderr);
                                reject(err);
                            })
                            .on('end', () => {
                                console.log('Processing finished');
                                resolve();
                            })
                            .save(convertedFile);
                    });
                } catch (ffmpegError) {
                    console.error('FFmpeg conversion failed, trying simpler conversion:', ffmpegError);
                    
                    // Fallback to a much simpler conversion if the first attempt fails
                    await new Promise((resolve, reject) => {
                        ffmpeg(originalFile)
                            .outputOptions([
                                '-c:v libx264',          // Just use H.264
                                '-preset ultrafast',      // Fastest encoding
                                '-crf 35'                // Very high compression
                            ])
                            .on('error', (err) => {
                                console.error('Fallback FFmpeg error:', err);
                                reject(err);
                            })
                            .on('end', () => {
                                console.log('Fallback processing finished');
                                resolve();
                            })
                            .save(convertedFile);
                    });
                }
                
                // Check if conversion succeeded, otherwise use the original file
                if (!fs.existsSync(convertedFile) || fs.statSync(convertedFile).size === 0) {
                    console.log('Conversion failed, using original file');
                    fs.copyFileSync(originalFile, convertedFile);
                }
        
                const fileSize = fs.statSync(convertedFile).size;
                console.log(`Converted file size: ${fileSize} bytes`);
                
                // Sending the video with progress tracking
                await statusMessage.edit(`⏳ [4/4] Mengirim video ke WhatsApp (0%)...`);
                
                // Use streaming approach to read file in chunks for memory efficiency
                const videoData = fs.readFileSync(convertedFile);
                const base64Data = videoData.toString('base64');
                
                // Simulate upload progress (since WhatsApp Web.js doesn't provide real upload progress)
                const uploadSteps = [0, 25, 50, 75, 95, 100];
                
                for (let i = 0; i < uploadSteps.length - 1; i++) {
                    await statusMessage.edit(`⏳ [4/4] Mengirim video ke WhatsApp (${uploadSteps[i]}%)...`);
                    // Small delay to simulate upload progress
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
                
                const media = new MessageMedia('video/mp4', base64Data, `tiktok_${timestamp}.mp4`);
                
                try {
                    // Try to send as regular video first
                    await chat.sendMessage(media, {
                        caption: '✅ Downloaded from TikTok',
                        sendVideoAsGif: false,
                        sendMediaAsDocument: false
                    });
                } catch (sendError) {
                    console.log('Failed to send as regular video, trying as document:', sendError);
                    
                    // If regular send fails, try sending as document
                    await chat.sendMessage(media, {
                        caption: '✅ Downloaded from TikTok (as document)',
                        sendMediaAsDocument: true
                    });
                }
                
                await statusMessage.edit(`✅ [4/4] Video TikTok berhasil diunduh dan dikirim!`);
        
            } catch (error) {
                console.error('TikTok processing error:', error);
                await chat.sendMessage('❌ Error processing TikTok video: ' + error.message);
            } finally {
                // Cleanup temp files dengan optimasi
                setTimeout(() => {
                    for (const file of tempFiles) {
                        if (fs.existsSync(file)) {
                            try {
                                fs.unlinkSync(file);
                                console.log(`Deleted temp file: ${file}`);
                            } catch (err) {
                                console.error('Error deleting temp file:', err);
                            }
                        }
                    }
                }, 1000); // Delay cleanup for 1 second to ensure files aren't in use
            }
        }
        // ... rest of the code for other platforms ...

    } catch (error) {
        console.error(`${platform} download error:`, error);
        await chat.sendMessage(`❌ Error downloading from ${platform}: ${error.message}`);
    } finally {
        // Cleanup temp files
        for (const file of tempFiles) {
            if (fs.existsSync(file)) {
                try {
                    fs.unlinkSync(file);
                } catch (err) {
                    console.error('Error deleting temp file:', err);
                }
            }
        }
        
        if (statusMessage) {
            try {
                await statusMessage.delete();
            } catch (err) {
                console.error('Error deleting status message:', err);
            }
        }
    }
};

const downloadHandler = async (message, chat, args) => {
    try {
        if (args.length < 2) {
            await chat.sendMessage(
                `*📥 Downloader Help*\n\n` +
                `Usage: ${message.body.startsWith(config.ownerPrefix) ? config.ownerPrefix : config.userPrefix}download [platform] [url]\n\n` +
                `*Supported Platforms:*\n` +
                `- capcut\n` +
                `- douyin\n` +
                `- facebook/fb\n` +
                `- fdroid\n` +
                `- gdrive\n` +
                `- github (provide repo name)\n` +
                `- instagram/ig\n` +
                `- mediafire\n` +
                `- spotify\n` +
                `- snackvideo\n` +
                `- soundcloud\n` +
                `- tiktok/tt\n` +
                `- threads\n` +
                `- twitter/x\n` +
                `- ytmp3 (YouTube audio)\n` +
                `- ytmp4 (YouTube video)\n\n` +
                // `- xnxx\n\n` +
                `Example: ${message.body.startsWith(config.ownerPrefix) ? config.ownerPrefix : config.userPrefix}download instagram https://www.instagram.com/p/abcdef/`
            );
            return;
        }

        const platform = args[0].toLowerCase();
        const url = args[1];
        
        await handleDownload(message, chat, platform, url);
    } catch (error) {
        console.error('Download handler error:', error);
        await chat.sendMessage('❌ An error occurred with the download command');
    }
};

// ----------------- SEARCH FUNCTIONS -----------------

/**
 * Handle search across various platforms
 * @param {Object} message - WhatsApp message object
 * @param {Object} chat - WhatsApp chat object
 * @param {string} platform - Platform to search
 * @param {string} query - Search query
 */
const handleSearch = async (message, chat, platform, query) => {
    try {
        const noQueryPlatforms = ['gempa', 'earthquake'];
        if (!query && !noQueryPlatforms.includes(platform.toLowerCase())) {
            await chat.sendMessage('❌ Please provide a search query');
            return;
        }

        const statusMessage = await chat.sendMessage(`🔎 Searching on ${platform}...`);
        let result;

        // Call appropriate search service based on platform
        switch (platform.toLowerCase()) {
            case 'bstation':
                result = await searchService.bstation(query);
                break;
            case 'cuaca':
            case 'weather':
                result = await searchService.cuaca(query);
                break;
            case 'fdroid':
                result = await searchService.fdroid(query);
                break;
            case 'gempa':
            case 'earthquake':
                result = await searchService.gempa();
                break;
            case 'grupwa':
            case 'whatsappgroup':
                result = await searchService.grupwa(query);
                break;
            case 'livewallpaper':
                result = await searchService.livewallpaper(query);
                break;
            case 'pinterest':
                result = await searchService.pinterest(query);
                break;
            case 'playstore':
                result = await searchService.playstore(query);
                break;
            case 'jadwaltv':
            case 'tvschedule':
                result = await searchService.jadwaltv(query);
                break;
            case 'resep':
            case 'recipe':
                result = await searchService.resep(query);
                break;
            case 'sfile':
                result = await searchService.sfile(query);
                break;
            case 'spotify':
                result = await searchService.spotify(query);
                break;
            case 'soundcloud':
                result = await searchService.soundcloud(query);
                break;
            case 'tiktok':
                result = await searchService.tiktok(query);
                break;
            case 'whatmusic':
                // whatmusic needs a file URL, not a text query
                if (!isValidUrl(query)) {
                    await statusMessage.edit('❌ Please provide a valid media URL for whatmusic');
                    return;
                }
                result = await searchService.whatmusic(query);
                break;
            case 'xxx':
                result = await searchService.xnxx(query);
                break;
            case 'youtube':
            case 'yt':
                result = await searchService.youtube(query);
                break;
            default:
                await statusMessage.edit('❌ Unsupported search platform');
                return;
        }

        if (!result || !result.status) {
            await statusMessage.edit('❌ Search failed or returned no results');
            return;
        }

        // Format and send results
        if (platform === 'bstation') {
            const bstationResults = result.result;
        
            if (!bstationResults || bstationResults.length === 0) {
                await statusMessage.edit('❌ No results found for your query on Bstation.');
                return;
            }
        
            const firstResult = bstationResults[0]; // Ambil hasil pertama
            const bstationMessage = 
                `*🎥 Bstation Search Result*\n\n` +
                `🔍 Search: ${firstResult.search || 'N/A'}\n` +
                `📹 Video URL: ${firstResult.videoUrl || 'N/A'}\n` +
                `👁️ Views: ${firstResult.views || 'N/A'}\n\n` +
                `📖 Description:\n${firstResult.description || 'N/A'}`;
        
            try {
                // Jika ada URL gambar, kirim gambar terlebih dahulu
                if (firstResult.imageUrl) {
                    const media = await urlToMessageMedia(firstResult.imageUrl, 'bstation_image.jpg');
                    await chat.sendMessage(media, { caption: bstationMessage });
                }
            } catch (error) {
                console.error('Failed to send Bstation result:', error);
                await chat.sendMessage('❌ Failed to send Bstation search result.');
            }
        }

        if (platform === 'fdroid') {
            const fdroidResults = result.result;
        
            if (!fdroidResults || fdroidResults.length === 0) {
                await statusMessage.edit('❌ No results found for your query on F-Droid.');
                return;
            }
        
            // Batasi jumlah hasil yang ditampilkan (misalnya, 5 hasil pertama)
            const limitedResults = fdroidResults.slice(0, 5);
        
            for (const app of limitedResults) {
                const appMessage = 
                    `*📱 ${app.name || 'N/A'}*\n` +
                    `📝 ${app.summary || 'No description available'}\n` +
                    `🔑 License: ${app.license || 'Unknown'}\n` +
                    `🔗 [Open App](${app.link || '#'})`;
        
                try {
                    // Jika ada ikon, kirim ikon terlebih dahulu
                    if (app.icon) {
                        const media = await urlToMessageMedia(app.icon, 'fdroid_icon.jpg');
                        await chat.sendMessage(media, { caption: appMessage });
                    } else {
                        // Jika tidak ada ikon, kirim pesan teks saja
                        await chat.sendMessage(appMessage);
                    }
                } catch (error) {
                    console.error('Failed to send F-Droid result:', error);
                    await chat.sendMessage('❌ Failed to send F-Droid search result.');
                }
            }
        
            // Jika ada lebih banyak hasil, beri tahu pengguna
            if (fdroidResults.length > 5) {
                await chat.sendMessage(`✅ Found ${fdroidResults.length} results. Showing the first 5. Use the same command to refine your search.`);
            }
        }
        
        if (platform === 'grupwa' || platform === 'whatsappgroup') {
            const grupwaResults = result.data;
        
            if (!grupwaResults || grupwaResults.length === 0) {
                try {
                    await statusMessage.edit('❌ No WhatsApp groups found for your query.');
                } catch (error) {
                    console.error('Failed to edit statusMessage:', error);
                    await chat.sendMessage('❌ No WhatsApp groups found for your query.');
                }
                return;
            }
        
            // Format hasil pencarian menjadi satu pesan
            let grupwaMessage = `*📋 WhatsApp Group Search Results*\n\n`;
            grupwaResults.forEach((group, index) => {
                grupwaMessage += 
                    `*${index + 1}. ${group.title || 'N/A'}*\n` +
                    `📝 ${group.desc || 'No description available'}\n` +
                    `🔗 [Join Group](${group.link || '#'})\n` +
                    (group.thumb ? `🖼️ [Thumbnail](${group.thumb})\n` : '') +
                    `\n`;
            });
        
            // Kirim pesan hasil pencarian
            try {
                await statusMessage.edit(grupwaMessage);
            } catch (error) {
                console.error('Failed to edit statusMessage:', error);
                await chat.sendMessage(grupwaMessage);
            }
        }
        
        if (platform === 'tiktok') {
            const tiktokResults = result.result;
        
            if (!tiktokResults || tiktokResults.length === 0) {
                await statusMessage.edit('❌ No TikTok videos found for your query.');
                return;
            }
        
            // Format hasil pencarian menjadi satu pesan
            let tiktokMessage = `*🎥 TikTok Video Results*\n\n` +
                `📢 Watch videos without logging in and download them using the links below:\n\n`;
        
            tiktokResults.slice(0, 10).forEach((videoUrl, index) => {
                tiktokMessage += `*${index + 1}. [Watch Video](${videoUrl})*\n`;
            });
        
            // Tambahkan informasi jika ada lebih banyak hasil
            if (tiktokResults.length > 10) {
                tiktokMessage += `\n✅ Found ${tiktokResults.length} videos. Showing the first 10. Use the same command to see more results.`;
            }
        
            // Kirim pesan hasil pencarian
            try {
                await statusMessage.edit(tiktokMessage);
            } catch (error) {
                console.error('Failed to send TikTok search results:', error);
                await chat.sendMessage(tiktokMessage);
            }
        }
        if (platform === 'youtube' || platform === 'yt') {
            const youtubeResults = result.result;
        
            if (!youtubeResults || youtubeResults.length === 0) {
                await statusMessage.edit('❌ No YouTube videos found for your query.');
                return;
            }
        
            // Kirim setiap video sebagai pesan terpisah
            for (const video of youtubeResults.slice(0, 3)) { // Batasi ke 3 video pertama
                const videoMessage = 
                    `*🎥 ${video.title || 'N/A'}*\n` +
                    `⏱️ Duration: ${video.duration || 'N/A'}\n` +
                    `👁️ Views: ${video.views || 'N/A'}\n` +
                    `📅 Uploaded: ${video.uploadDate || 'N/A'}\n` +
                    `👤 Author: ${video.author || 'N/A'}\n` +
                    `🔗 [Watch Video](${video.url || '#'})`;
        
                try {
                    // Kirim thumbnail sebagai media dengan deskripsi sebagai caption
                    if (video.thumbnail) {
                        const media = await urlToMessageMedia(video.thumbnail, 'youtube_thumbnail.jpg');
                        await chat.sendMessage(media, { caption: videoMessage });
                    } else {
                        // Jika tidak ada thumbnail, kirim pesan teks saja
                        await chat.sendMessage(videoMessage);
                    }
                } catch (error) {
                    console.error('Failed to send YouTube video result:', error);
                    await chat.sendMessage('❌ Failed to send YouTube video result.');
                }
            }
        
            // Tanyakan apakah pengguna ingin melihat lebih banyak hasil
            if (youtubeResults.length > 3) {
                await chat.sendMessage(
                    `✅ Found ${youtubeResults.length} videos. Showing the first 3. Reply with the same command to see more results.`
                );
            }
        }
        if (platform === 'pinterest') {
            const pinterestResults = result.result;
        
            if (!pinterestResults || pinterestResults.length === 0) {
                await statusMessage.edit('❌ No Pinterest images found for your query.');
                return;
            }
        
            try {
                // Kirim setiap gambar sebagai pesan terpisah
                for (const imageUrl of pinterestResults.slice(0, 10)) { // Batasi ke 10 gambar pertama
                    try {
                        const media = await urlToMessageMedia(imageUrl, 'pinterest_image.jpg');
                        await chat.sendMessage(media);
                    } catch (error) {
                        console.error('Failed to send Pinterest image:', error);
                        await chat.sendMessage('❌ Failed to send one of the Pinterest images.');
                    }
                }
        
                // Jika ada lebih banyak hasil, beri tahu pengguna
                if (pinterestResults.length > 10) {
                    await chat.sendMessage(
                        `✅ Found ${pinterestResults.length} images. Showing the first 10. Use the same command to see more results.`
                    );
                }
            } catch (error) {
                console.error('Failed to send Pinterest results:', error);
                await chat.sendMessage('❌ Failed to send Pinterest results.');
            }
        }
        if (platform === 'gempa' || platform === 'earthquake') {
            const eq = result.data;
            const gempaMessage = 
                `*🗺️ Info Gempa*\n\n` +
                `📅 Waktu: ${eq.waktu || 'N/A'}\n` +
                `📍 Lokasi: ${eq.wilayah || 'N/A'}\n` +
                `🔢 Magnitudo: ${eq.magnitudo || 'N/A'}\n` +
                `🌊 Kedalaman: ${eq.kedalaman || 'N/A'}\n` +
                `📍 Koordinat: ${eq.lintang || 'N/A'}, ${eq.bujur || 'N/A'}`;
        
            try {
                // Jika ada URL peta, kirim gambar terlebih dahulu
                if (eq.map) {
                    const media = await urlToMessageMedia(eq.map, 'gempa_map.jpg');
                    await chat.sendMessage(media, { caption: gempaMessage});
                }
        
                // Kirim deskripsi gempa
                // await chat.sendMessage(gempaMessage);
            } catch (error) {
                console.error('Failed to send gempa map or message:', error);
                await chat.sendMessage('❌ Failed to send gempa information.');
            }
        } else if (platform === 'cuaca' || platform === 'weather') {
            const weather = result.data;
            await statusMessage.edit(
                `*🌤️ Info Cuaca di ${weather.kota || 'N/A'}*

` +
                `🌡️ Suhu: ${weather.suhu || 'N/A'}
` +
                `🌥️ Kondisi: ${weather.kondisi || 'N/A'}
` +
                `💧 Kelembapan: ${weather.kelembapan || 'N/A'}
` +
                `🌬️ Angin: ${weather.angin || 'N/A'}
` +
                `🌧️ Curah Hujan: ${weather.curah_hujan || 'N/A'}
` +
                `☁️ Tutupan Awan: ${weather.tutupan_awan || 'N/A'}
` +
                `👁️ Visibilitas: ${weather.visibilitas || 'N/A'}
` +
                `🌅 Terbit: ${weather.terbit || 'N/A'}
` +
                `🌇 Terbenam: ${weather.terbenam || 'N/A'}`
            );
        } else if (platform === 'whatmusic') {
            // Special formatting for music identification
            const music = result.data;
            await statusMessage.edit(
                `*🎵 Music Identified*\n\n` +
                `🎼 Title: ${music.title || 'Unknown'}\n` +
                `👨‍🎤 Artist: ${music.artist || 'Unknown'}\n` +
                `💿 Album: ${music.album || 'Unknown'}\n` +
                `📅 Release: ${music.release_date || 'Unknown'}\n` +
                `⏱️ Duration: ${music.duration || 'Unknown'}\n` +
                `🔗 Link: ${music.url || 'N/A'}`
            );
        } else if (platform === 'xxx') {
            // Pastikan result.message.data valid
            const xnxxResults = result.data;
        
            if (!xnxxResults || xnxxResults.length === 0) {
                try {
                    await statusMessage.edit('❌ No results found for your query on XNXX.');
                } catch (error) {
                    console.error('Failed to edit statusMessage:', error);
                    await chat.sendMessage('❌ No results found for your query on XNXX.');
                }
                return;
            }
        
            // Format hasil pencarian menjadi satu pesan
            let xnxxMessage = `*🔞 XNXX Search Results*\n\n`;
            xnxxResults.slice(0, 10).forEach((video, index) => {
                xnxxMessage += 
                    `*${index + 1}. ${video.title || 'N/A'}*\n` +
                    `🔗 [Watch Video](${video.link || '#'})\n\n`;
            });
        
            // Tambahkan informasi jika ada lebih banyak hasil
            if (xnxxResults.length > 10) {
                xnxxMessage += `✅ Found ${xnxxResults.length} videos. Showing the first 10. Use the same command to see more results.`;
            }
        
            // Kirim pesan hasil pencarian
            try {
                await statusMessage.edit(xnxxMessage);
            } catch (error) {
                console.error('Failed to send XNXX search results:', error);
                await chat.sendMessage(xnxxMessage);
            }
        } else {
            // Generic results formatting
            const formattedResults = formatSearchResults(
                Array.isArray(result.data) ? result.data : [result.data], 
                `${platform.charAt(0).toUpperCase() + platform.slice(1)} results for "${query}"`
            );
            await statusMessage.edit(formattedResults);
        }
    } catch (error) {
        console.error(`${platform} search error:`, error);
        await chat.sendMessage(`❌ Error searching on ${platform}: ${error.message}`);
    }
};

/**
 * Main search command handler
 * @param {Object} message - WhatsApp message object
 * @param {Object} chat - WhatsApp chat object
 * @param {Array} args - Command arguments
 */
const searchHandler = async (message, chat, args) => {
    try {
        // Daftar platform yang tidak memerlukan query
        const noQueryPlatforms = ['gempa', 'earthquake'];

        // Jika argumen kurang dari 2 dan platform tidak termasuk dalam noQueryPlatforms
        if (args.length < 2 && !noQueryPlatforms.includes(args[0]?.toLowerCase())) {
            await chat.sendMessage(
                `*🔎 Search Help*\n\n` +
                `Usage: ${message.body.startsWith(config.ownerPrefix) ? config.ownerPrefix : config.userPrefix}search [platform] [query]\n\n` +
                `*Supported Platforms:*\n` +
                `- bstation\n` +
                `- cuaca/weather (city name)\n` +
                `- fdroid\n` +
                `- gempa/earthquake (no query needed)\n` +
                `- grupwa/whatsappgroup\n` +
                `- livewallpaper\n` +
                `- pinterest\n` +
                `- playstore\n` +
                `- jadwaltv/tvschedule (channel name)\n` +
                `- resep/recipe\n` +
                `- sfile\n` +
                `- spotify\n` +
                `- soundcloud\n` +
                `- tiktok\n` +
                `- whatmusic (media URL)\n` +
                `- youtube/yt\n\n` +
                `Example: ${message.body.startsWith(config.ownerPrefix) ? config.ownerPrefix : config.userPrefix}search youtube Coldplay`
            );
            return;
        }

        const platform = args[0]?.toLowerCase();
        const query = noQueryPlatforms.includes(platform) ? '' : args.slice(1).join(' ');

        // Panggil fungsi handleSearch
        await handleSearch(message, chat, platform, query);
    } catch (error) {
        console.error('Search handler error:', error);
        await chat.sendMessage('❌ An error occurred with the search command');
    }
};
// ----------------- TOOLS FUNCTIONS -----------------

const handleTools = async (message, chat, tool, input) => {
    try {
        const statusMessage = await chat.sendMessage(`⚙️ Processing with ${tool}...`);
        let result;

        // Tangani khusus untuk tool 'remini'
        if (tool.toLowerCase() === 'remini') {
            let imageUrl;

            // Periksa apakah pesan yang di-reply memiliki media
            if (message.hasQuotedMsg) {
                const quotedMessage = await message.getQuotedMessage();
                if (quotedMessage.hasMedia) {
                    const media = await quotedMessage.downloadMedia();
                    if (!media) {
                        await statusMessage.edit('❌ Failed to process the quoted media.');
                        return;
                    }
                    const OneuniqueFileName = `uploaded_image_${Date.now()}.jpg`;
                    // Simulasikan unggahan media ke server (ganti dengan logika unggahan sebenarnya)
                    const uploadResponse = await axios.post('https://xerahax.xyz/index.php', {
                        file: media.data,
                        filename: media.filename || OneuniqueFileName,
                        mimetype: media.mimetype
                    });

                    if (!uploadResponse.data || !uploadResponse.data.url) {
                        await statusMessage.edit('❌ Failed to upload media to server.');
                        return;
                    }

                    imageUrl = uploadResponse.data.url; // URL gambar yang diunggah
                    console.log('Uploaded Image URL:', imageUrl); // Tambahkan log ini
                } else {
                    await statusMessage.edit('❌ The quoted message does not contain media.');
                    return;
                }
            } else {
                await statusMessage.edit('❌ Please reply to a message containing an image.');
                return;
            }

            // Panggil API remini dengan URL gambar
            const reminiResponse = await toolsService.remini(imageUrl);

            if (!reminiResponse || !reminiResponse.success || !reminiResponse.data) {
                await statusMessage.edit('❌ Failed to process image with Remini.');
                return;
            }

            // Ambil URL hasil dari API remini
            const resultImageUrl = reminiResponse.data;
            console.log('Remini Result Image URL:', resultImageUrl);
            // Unduh hasil dan kirimkan kembali ke pengguna
            const uniqueFileName = `remini_result_${Date.now()}.jpg`;
            const media = await urlToMessageMedia(resultImageUrl, uniqueFileName);
            await chat.sendMessage(media, { caption: '✅ Image processed with Remini!' });
            await statusMessage.delete(true);
            return;
        }

        // Logika untuk tools lainnya
        if (!input || input.trim() === '') {
            await chat.sendMessage('❌ Please provide input for the tool');
            return;
        }

        if (['ocr', 'removebg', 'ssweb', 'shortlink', 'toanime', 'tozombie', 'yttranscript'].includes(tool.toLowerCase())) {
            if (!isValidUrl(input) && !message.hasMedia) {
                await statusMessage.edit('❌ Please provide a valid URL or attach a media file');
                return;
            }

            if (message.hasMedia && !isValidUrl(input)) {
                const media = await message.downloadMedia();
                await statusMessage.edit('❌ Direct media processing not implemented yet. Please provide a URL.');
                return;
            }
        }

        // Panggil tool lainnya
        switch (tool.toLowerCase()) {
            case 'ocr':
                result = await toolsService.ocr(input);
                break;
            case 'removebg':
                result = await toolsService.removebg(input);
                break;
            case 'ssweb':
                result = await toolsService.ssweb(input);
                break;
            case 'shortlink':
                result = await toolsService.shortlink(input);
                break;
            case 'toanime':
                result = await toolsService.toanime(input);
                break;
            case 'tozombie':
                result = await toolsService.tozombie(input);
                break;
            default:
                await statusMessage.edit('❌ Unsupported tool');
                return;
        }

        if (!result || !result.status) {
            await statusMessage.edit('❌ Tool processing failed');
            return;
        }

        await statusMessage.edit('✅ Tool processing completed');
    } catch (error) {
        console.error(`${tool} tool error:`, error);
        await chat.sendMessage(`❌ Error using ${tool}: ${error.message}`);
    }
};

/**
 * Main tools command handler
 * @param {Object} message - WhatsApp message object
 * @param {Object} chat - WhatsApp chat object
 * @param {Array} args - Command arguments
 */
const toolsHandler = async (message, chat, args) => {
    try {
        // Periksa apakah argumen cukup atau ada media yang di-reply
        if (args.length < 1 && (!message.hasQuotedMsg && !message.hasMedia)) {
            await chat.sendMessage(
                `*🛠️ Tools Help*\n\n` +
                `Usage: ${message.body.startsWith(config.ownerPrefix) ? config.ownerPrefix : config.userPrefix}tools [tool] [input]\n\n` +
                `*Supported Tools:*\n` +
                `- ocr (image URL)\n` +
                `- remini/upscale (reply to an image or provide image URL)\n` +
                `- removebg (image URL)\n` +
                `- ssweb/screenshot (website URL)\n` +
                `- shortlink (URL)\n` +
                `- text2qr/qrcode (text)\n` +
                `- toanime (image URL)\n` +
                `- tozombie (image URL)\n` +
                `- text2img (text prompt)\n` +
                `- yttranscript (YouTube URL)\n\n` +
                `Example: ${message.body.startsWith(config.ownerPrefix) ? config.ownerPrefix : config.userPrefix}tools shortlink https://example.com`
            );
            return;
        }

        const tool = args[0].toLowerCase();
        const input = args.slice(1).join(' ');

        // Jika tool adalah 'remini' dan tidak ada input, periksa apakah ada pesan yang di-reply
        if (tool === 'remini' && !input) {
            if (!message.hasQuotedMsg) {
                await chat.sendMessage('❌ Please reply to a message containing an image for Remini.');
                return;
            }
        }

        // Panggil fungsi handleTools untuk memproses alat
        await handleTools(message, chat, tool, input);
    } catch (error) {
        console.error('Tools handler error:', error);
        await chat.sendMessage('❌ An error occurred with the tools command');
    }
};

// ----------------- MAKER FUNCTIONS -----------------

/**
 * Handle maker tools from the API
 * @param {Object} message - WhatsApp message object
 * @param {Object} chat - WhatsApp chat object
 * @param {string} maker - Maker tool name
 * @param {string} input - Maker input
 */
const handleMaker = async (message, chat, maker, input) => {
    try {
        if (!input || input.trim() === '') {
            if (maker !== 'emojimix') {
                await chat.sendMessage('❌ Please provide input for the maker tool');
                return;
            }
        }

        const statusMessage = await chat.sendMessage(`🎨 Processing with ${maker}...`);
        let result;

        // For image-based makers, check if URL is valid
        if (maker === 'tohitam') {
            if (!isValidUrl(input) && !message.hasMedia) {
                await statusMessage.edit('❌ Please provide a valid image URL or attach an image');
                return;
            }
            
            // If message has media, upload and get the URL (simplified)
            if (message.hasMedia && !isValidUrl(input)) {
                await statusMessage.edit('❌ Direct media processing not implemented yet. Please provide a URL.');
                return;
            }
        }

        // Call appropriate maker service
        switch (maker.toLowerCase()) {
            case 'brat':
                result = await makerService.brat(input);
                break;
            case 'bratv2':
                result = await makerService.bratv2(input);
                break;
            case 'bratvid':
                result = await makerService.bratvid(input);
                break;
            case 'carbon':
                result = await makerService.carbon(input);
                break;
            case 'emojimix':
                const emojis = input.split(' ').filter(e => e.trim() !== '');
                if (emojis.length < 2) {
                    await statusMessage.edit('❌ Please provide two emojis separated by space');
                    return;
                }
                result = await makerService.emojimix(emojis[0], emojis[1]);
                break;
            case 'fluximage':
                result = await makerService.fluximage(input);
                break;
            case 'tohitam':
                result = await makerService.tohitam(input);
                break;
            default:
                await statusMessage.edit('❌ Unsupported maker tool');
                return;
        }

        if (!result || !result.status) {
            await statusMessage.edit('❌ Maker processing failed');
            return;
        }

        // Handle the result - most maker tools return an image URL
        if (result.data && result.data.url) {
            const media = await urlToMessageMedia(result.data.url, `${maker}_result.jpg`);
            await chat.sendMessage(media, { 
                caption: `✅ ${maker.charAt(0).toUpperCase() + maker.slice(1)} result` 
            });
            await statusMessage.delete(true);
        } else {
            await statusMessage.edit('✅ Maker processing completed, but response format is not recognized');
        }
    } catch (error) {
        console.error(`${maker} maker error:`, error);
        await chat.sendMessage(`❌ Error using ${maker}: ${error.message}`);
    }
};

/**
 * Main maker command handler
 * @param {Object} message - WhatsApp message object
 * @param {Object} chat - WhatsApp chat object
 * @param {Array} args - Command arguments
 */
const makerHandler = async (message, chat, args) => {
    try {
        if (args.length < 2 && (!message.hasMedia || args.length < 1)) {
            await chat.sendMessage(
                `*🎨 Maker Tools Help*\n\n` +
                `Usage: ${message.body.startsWith(config.ownerPrefix) ? config.ownerPrefix : config.userPrefix}maker [tool] [input]\n\n` +
                `*Supported Maker Tools:*\n` +
                `- brat (text)\n` +
                `- bratv2 (text)\n` +
                `- bratvid (text)\n` +
                `- carbon (code/text)\n` +
                `- emojimix (emoji1 emoji2)\n` +
                `- fluximage (text prompt)\n` +
                `- tohitam (image URL)\n\n` +
                `Example: ${message.body.startsWith(config.ownerPrefix) ? config.ownerPrefix : config.userPrefix}maker carbon console.log('Hello World!')`
            );
            return;
        }

        const maker = args[0].toLowerCase();
        const input = args.slice(1).join(' ');
        
        await handleMaker(message, chat, maker, input);
    } catch (error) {
        console.error('Maker handler error:', error);
        await chat.sendMessage('❌ An error occurred with the maker command');
    }
};

// ----------------- INTERNET FUNCTIONS -----------------

/**
 * Handle internet tools from the API
 * @param {Object} message - WhatsApp message object
 * @param {Object} chat - WhatsApp chat object
 * @param {string} tool - Internet tool name
 * @param {string} input - Tool input
 */
const handleInternet = async (message, chat, tool, input) => {
    try {
        // Some tools need input, some don't
        if (!input && ['githubroast', 'infoua', 'infoip', 'mailbox', 'whois'].includes(tool)) {
            await chat.sendMessage('❌ Please provide input for this tool');
            return;
        }

        const statusMessage = await chat.sendMessage(`🌐 Processing with ${tool}...`);
        let result;

        // Call appropriate internet service
        switch (tool.toLowerCase()) {
            case 'githubroast':
                result = await internetService.githubroast(input);
                break;
            case 'infoua':
                result = await internetService.infoua(input);
                break;
            case 'infoip':
                result = await internetService.infoip(input);
                break;
            case 'tempmail':
                result = await internetService.tempmail();
                break;
            case 'mailbox':
                result = await internetService.mailbox(input);
                break;
            case 'whois':
                result = await internetService.whois(input);
                break;
            default:
                await statusMessage.edit('❌ Unsupported internet tool').catch(() => 
                    chat.sendMessage('❌ Unsupported internet tool'));
                return;
        }

        if (!result || !result.status) {
            await statusMessage.edit('❌ Tool processing failed').catch(() => 
                chat.sendMessage('❌ Tool processing failed'));
            return;
        }

        // Handle different result types
        if (tool === 'githubroast' && result.data) {
            const response = `*🔥 GitHub Roast for ${input}*\n\n${result.data.roast || 'No roast generated'}`;
            try {
                await statusMessage.edit(response);
            } catch (err) {
                await chat.sendMessage(response);
            }
        } else if (tool === 'infoua' && result.data) {
            const ua = result.data;
            await statusMessage.edit(
                `*📱 User-Agent Info*\n\n` +
                `Browser: ${ua.browser || 'Unknown'}\n` +
                `OS: ${ua.os || 'Unknown'}\n` +
                `Device: ${ua.device || 'Unknown'}\n` +
                `Type: ${ua.type || 'Unknown'}`
            );
        } else if (tool === 'infoip' && result.data) {
            const ip = result.data;
            await statusMessage.edit(
                `*🌐 IP Information*\n\n` +
                `IP: ${ip.ip || input}\n` +
                `Country: ${ip.country || 'Unknown'}\n` +
                `Region: ${ip.region || 'Unknown'}\n` +
                `City: ${ip.city || 'Unknown'}\n` +
                `ISP: ${ip.isp || 'Unknown'}\n` +
                `Timezone: ${ip.timezone || 'Unknown'}`
            );
        } else if (tool === 'tempmail' && result.data) {
            await statusMessage.edit(
                `*📧 Temporary Email*\n\n` +
                `Email: ${result.data.email || 'Could not generate'}\n` +
                `ID: ${result.data.id || 'N/A'}\n\n` +
                `To check inbox, use: ${message.body.startsWith(config.ownerPrefix) ? config.ownerPrefix : config.userPrefix}internet mailbox ${result.data.id}`
            );
        } else if (tool === 'mailbox' && result.data) {
            if (!result.data.length) {
                await statusMessage.edit('📭 *Mailbox is empty*');
                return;
            }
            
            let mailboxText = `*📬 Mailbox Contents*\n\n`;
            result.data.forEach((mail, index) => {
                mailboxText += `*Email ${index + 1}*\n`;
                mailboxText += `From: ${mail.from || 'Unknown'}\n`;
                mailboxText += `Subject: ${mail.subject || 'No subject'}\n`;
                mailboxText += `Date: ${mail.date || 'Unknown'}\n`;
                mailboxText += `Body: ${mail.body.substring(0, 100)}${mail.body.length > 100 ? '...' : ''}\n\n`;
            });
            
            await statusMessage.edit(mailboxText);
        } else if (tool === 'whois' && result.data) {
            const whois = result.data;
            const response = `*🔍 WHOIS Information for ${input}*\n\n` +
                `Domain: ${whois.domain || input}\n` +
                `Registrar: ${whois.registrar || 'Unknown'}\n` +
                `Created: ${whois.createdDate || 'Unknown'}\n` +
                `Expires: ${whois.expiryDate || 'Unknown'}\n` +
                `Updated: ${whois.updatedDate || 'Unknown'}\n` +
                `Name Servers: ${whois.nameServers ? whois.nameServers.join(', ') : 'Unknown'}`;
            
            try {
                await statusMessage.edit(response);
            } catch (err) {
                console.log('Error editing message, sending new one instead');
                await chat.sendMessage(response);
            }
        } else {
            try {
                await statusMessage.edit('✅ Command completed, but response format is not recognized');
            } catch (err) {
                await chat.sendMessage('✅ Command completed, but response format is not recognized');
            }
        }
    } catch (error) {
        console.error(`${tool} internet tool error:`, error);
        await chat.sendMessage(`❌ Error using ${tool}: ${error.message}`);
    }
};

/**
 * Main internet command handler
 * @param {Object} message - WhatsApp message object
 * @param {Object} chat - WhatsApp chat object
 * @param {Array} args - Command arguments
 */
const internetHandler = async (message, chat, args) => {
    try {
        if (args.length < 2 ) {
            await chat.sendMessage(
                `*🌐 Internet Tools Help*\n\n` +
                `Usage: ${message.body.startsWith(config.ownerPrefix) ? config.ownerPrefix : config.userPrefix}internet [tool] [input]\n\n` +
                `*Supported Internet Tools:*\n` +
                `- githubroast (GitHub username)\n` +
                `- infoua (User-Agent string)\n` +
                `- infoip (IP address)\n` +
                `- tempmail (no input needed)\n` +
                `- mailbox (tempmail ID)\n` +
                `- whois (domain name)\n\n` +
                `Example: ${message.body.startsWith(config.ownerPrefix) ? config.ownerPrefix : config.userPrefix}internet whois google.com`
            );
            return;
        }

        const tool = args[0].toLowerCase();
        const input = args.slice(1).join(' ');
        
        await handleInternet(message, chat, tool, input);
    } catch (error) {
        console.error('Internet handler error:', error);
        await chat.sendMessage('❌ An error occurred with the internet command');
    }
};

/**
 * Main sticker search command handler
 * @param {Object} message - WhatsApp message object
 * @param {Object} chat - WhatsApp chat object
 * @param {Array} args - Command arguments
 */
const stickerSearchHandler = async (message, chat, args) => {
    try {
        if (args.length < 1) {
            await chat.sendMessage(
                `*🎭 Sticker Search Help*\n\n` +
                `Usage: ${message.body.startsWith(config.ownerPrefix) ? config.ownerPrefix : config.userPrefix}stickersearch [query]\n\n` +
                `Example: ${message.body.startsWith(config.ownerPrefix) ? config.ownerPrefix : config.userPrefix}stickersearch pocoyo`
            );
            return;
        }

        const query = args.join(' ');
        const statusMessage = await chat.sendMessage(`🔍 Searching for stickers: "${query}"...`);
        
        const result = await stickerService.searchGif(query);
        
        if (!result || !result.status || !result.data || !result.data.length) {
            await statusMessage.edit('❌ No stickers found');
            return;
        }

        await statusMessage.edit(`✅ Found ${result.data.length} stickers. Sending the first one...`);
        
        // Send the first sticker
        if (result.data[0].url) {
            try {
                const media = await urlToMessageMedia(result.data[0].url, 'sticker.gif');
                await chat.sendMessage(media, { sendMediaAsSticker: true });
                
                // Let user know there are more results
                if (result.data.length > 1) {
                    await chat.sendMessage(`🎭 Found ${result.data.length} stickers matching "${query}". Send the same command again to see more.`);
                }
                
                await statusMessage.delete(true);
            } catch (error) {
                console.error('Sticker conversion error:', error);
                await statusMessage.edit('❌ Found stickers but failed to convert to correct format');
            }
        } else {
            await statusMessage.edit('❌ Found stickers but URL is missing');
        }
    } catch (error) {
        console.error('Sticker search error:', error);
        await chat.sendMessage('❌ An error occurred during sticker search');
    }
};

// Export all our new functions
module.exports = {
    setConfig,
    downloadHandler,
    searchHandler,
    toolsHandler,
    makerHandler,
    internetHandler,
    stickerSearchHandler
};