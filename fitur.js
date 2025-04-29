const { MessageMedia } = require('whatsapp-web.js');
const os = require('os');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const axios = require('axios');
const { createCanvas, loadImage } = require('canvas');
const { loadKeynotes, saveKeynotes } = require('./keynoteDB');

let config = null;

const setConfig = (cfg) => {
    config = cfg;
};

const generateDashboard = async (chat, isOwner) => {
    try {
        const start = Date.now();
        const imagePath = path.join(__dirname, 'disk', 'welcome.jpg');
        const base64Image = fs.readFileSync(imagePath, { encoding: 'base64' });

        const welcomeImage = new MessageMedia(
            'image/jpeg',
            base64Image,
            'welcome.jpg'
        );

        const latency = Date.now() - start;

        const caption = `*Welcome to FahmyZZX Bot* 🤖\n\n`
            + `*Status:* Active ✅\n`
            + `*Current Latency:* ${latency}ms\n`
            + `*Your Role:* ${isOwner ? 'Owner 👑' : 'User 👤'}\n`
            + `*Prefix:* ${isOwner ? config.ownerPrefix : config.userPrefix}\n\n`
            + `*Available Commands:*\n`
            + `${isOwner ? config.ownerPrefix : config.userPrefix}help - Show all commands 📚\n`
            + `${isOwner ? config.ownerPrefix : config.userPrefix}ping - Check bot latency 🏓\n`
            + `${isOwner ? config.ownerPrefix : config.userPrefix}setprefix - Configure prefixes ⚙️`

        await chat.sendMessage(welcomeImage, { caption });
    } catch (error) {
        console.error('Error in dashboard:', error);
        await chat.sendMessage('Error loading dashboard image');
    }
};

const generateOwnerHelpMenu = () => {
    return `*━━━👑 FAHMYZZX BOT - OWNER COMMANDS 👑━━━*

`
        + `🔹 *Admin Commands*
`
        + `  ├ ${config.ownerPrefix}setprefix owner [prefix] - Ubah prefix owner
`
        + `  ├ ${config.ownerPrefix}setprefix user [prefix] - Ubah prefix user
`
        + `  ├ ${config.ownerPrefix}setprefix reset - Reset prefix ke default
`
        + `  ├ ${config.ownerPrefix}purge [detik] - Hapus pesan dalam rentang waktu tertentu

`

        + `🤖 *Bot Management*
`
        + `  ├ ${config.ownerPrefix}start - Tampilkan dashboard bot
`
        + `  ├ ${config.ownerPrefix}help - Tampilkan menu bantuan
`
        + `  ├ ${config.ownerPrefix}ping - Cek latency bot
`
        + `  ├ ${config.ownerPrefix}status - Cek status bot

`

        + `🧠 *Keynote Features*
`
        + `  ├ ${config.ownerPrefix}setkeyprefix [prefix] - Set prefix catatan
`
        + `  ├ ${config.ownerPrefix}addkeynote [nama] [isi] - Tambah catatan
`
        + `  ├ ${config.ownerPrefix}useprefixnote [prefix] - Gunakan prefix catatan tertentu

`

        + `🎭 *Fun Features*
`
        + `  ├ ${config.ownerPrefix}cekjoni - Cek ukuran joni
`
        + `  ├ ${config.ownerPrefix}sticker [teks] - Buat stiker dari teks
`
        + `  ├ ${config.ownerPrefix}triger - Buat efek "triggered"
`
        + `  ├ ${config.ownerPrefix}quote - Buat stiker quote

`

        + `📥 *Downloader*
`
        + `  ├ ${config.ownerPrefix}download [platform] [url] - Download media
`
        + `  ├ ${config.ownerPrefix}download help - Lihat daftar platform yang didukung

`

        + `🔎 *Search Features*
`
        + `  ├ ${config.ownerPrefix}search [platform] [query] - Cari konten
`
        + `  ├ ${config.ownerPrefix}search help - Lihat daftar platform yang didukung

`

        + `🛠️ *Tools & Utilities*
`
        + `  ├ ${config.ownerPrefix}tools [tool] [input] - Gunakan tools API
`
        + `  ├ ${config.ownerPrefix}tools help - Lihat daftar tools yang tersedia

`

        + `🎨 *Maker & Generator*
`
        + `  ├ ${config.ownerPrefix}maker [tool] [input] - Buat konten kreatif
`
        + `  ├ ${config.ownerPrefix}maker help - Lihat daftar maker yang tersedia
`
        + `  ├ ${config.ownerPrefix}stickersearch [query] - Cari stiker

`

        + `🌐 *Internet Tools*
`
        + `  ├ ${config.ownerPrefix}internet [tool] [input] - Tools internet
`
        + `  ├ ${config.ownerPrefix}internet help - Lihat daftar tools internet

`

        + `📌 *Current Prefixes:*
`
        + `  ├ Owner: ${config.ownerPrefix}
`
        + `  ├ User: ${config.userPrefix}`;
};

const generateUserHelpMenu = () => {
    return `*━━━👤 FAHMYZZX BOT - USER COMMANDS 👤━━━*

`
        + `🤖 *Bot Commands*
`
        + `  ├ ${config.userPrefix}start - Tampilkan dashboard bot
`
        + `  ├ ${config.userPrefix}help - Tampilkan menu bantuan
`
        + `  ├ ${config.userPrefix}ping - Cek latency bot
`
        + `  ├ ${config.userPrefix}status - Cek status bot

`

        + `🧠 *Keynote Features*
`
        + `  ├ ${config.userPrefix}addkeynote [nama] [isi] - Tambah catatan

`

        + `🎭 *Fun Features*
`
        + `  ├ ${config.userPrefix}cekjoni - Cek ukuran joni
`
        + `  ├ ${config.userPrefix}sticker [teks] - Buat stiker dari teks
`
        + `  ├ ${config.userPrefix}triger - Buat efek "triggered"
`
+ `  ├ ${config.ownerPrefix}quote - Buat stiker quote

`

        + `📥 *Downloader*
`
        + `  ├ ${config.ownerPrefix}download [platform] [url] - Download media
`
        + `  ├ ${config.ownerPrefix}download help - Lihat daftar platform yang didukung

`

        + `🔎 *Search Features*
`
        + `  ├ ${config.ownerPrefix}search [platform] [query] - Cari konten
`
        + `  ├ ${config.ownerPrefix}search help - Lihat daftar platform yang didukung

`

        + `🛠️ *Tools & Utilities*
`
        + `  ├ ${config.ownerPrefix}tools [tool] [input] - Gunakan tools API
`
        + `  ├ ${config.ownerPrefix}tools help - Lihat daftar tools yang tersedia

`

        + `🎨 *Maker & Generator*
`
        + `  ├ ${config.ownerPrefix}maker [tool] [input] - Buat konten kreatif
`
        + `  ├ ${config.ownerPrefix}maker help - Lihat daftar maker yang tersedia
`
        + `  ├ ${config.ownerPrefix}stickersearch [query] - Cari stiker

`

        + `🌐 *Internet Tools*
`
        + `  ├ ${config.ownerPrefix}internet [tool] [input] - Tools internet
`
        + `  ├ ${config.ownerPrefix}internet help - Lihat daftar tools internet

`

        + `📌 *Current Prefixes:*
`
        + `  ├ User: ${config.userPrefix}`;
};

const botStatus = async (chat) => {
    try {
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);

        const processMemory = process.memoryUsage();
        const systemMemory = {
            total: os.totalmem(),
            free: os.freemem(),
            used: os.totalmem() - os.freemem()
        };

        const cpus = os.cpus();
        const cpuModel = cpus[0].model;
        const cpuCores = cpus.length;
        const cpuUsage = process.cpuUsage();
        const cpuPercent = ((cpuUsage.user + cpuUsage.system) / 1000000).toFixed(2);

        const projectPath = path.join(__dirname, '../');
        let projectSize = 0;

        try {
            const getAllFiles = (dirPath) => {
                let size = 0;
                const files = fs.readdirSync(dirPath);
                
                for (const file of files) {
                    const filePath = path.join(dirPath, file);
                    const stat = fs.statSync(filePath);
                    
                    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
                        size += getAllFiles(filePath);
                    } else if (stat.isFile()) {
                        size += stat.size;
                    }
                }
                return size;
            };

            projectSize = (getAllFiles(projectPath) / (1024 * 1024)).toFixed(2);
        } catch (err) {
            console.error('Error calculating project size:', err);
            projectSize = 0;
        }

        const formatMemory = (bytes) => {
            return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
        };

        const osInfo = {
            platform: process.platform,
            release: os.release(),
            arch: os.arch(),
            type: os.type()
        };

        let driveInfo = '';
        if (process.platform === 'win32') {
            try {
                const drive = projectPath.split(':')[0] + ':';
                const { stdout } = await new Promise((resolve, reject) => {
                    exec(`wmic logicaldisk where "DeviceID='${drive}'" get size,freespace /value`, 
                        { encoding: 'utf8' }, 
                        (error, stdout, stderr) => {
                            if (error) reject(error);
                            else resolve({ stdout, stderr });
                        }
                    );
                });

                const size = parseInt(stdout.match(/Size=(\d+)/)[1]);
                const free = parseInt(stdout.match(/FreeSpace=(\d+)/)[1]);
                const used = size - free;

                driveInfo = `\n*💽 Drive (${drive}):*\n` +
                    `├ Used: ${formatMemory(used)}\n` +
                    `├ Free: ${formatMemory(free)}\n` +
                    `└ Total: ${formatMemory(size)}\n`;
            } catch (err) {
                console.error('Error getting drive info:', err);
                driveInfo = '';
            }
        }

        await chat.sendMessage(
            `⚙️ *Bot Status*\n` +
            `${'─'.repeat(30)}\n` +
            `*⏰ Uptime:* ${hours}h ${minutes}m ${seconds}s\n\n` +
            `*💾 Memory Usage:*\n` +
            `├ Process: ${(processMemory.heapUsed / 1024 / 1024).toFixed(2)} MB\n` +
            `├ System Used: ${formatMemory(systemMemory.used)}\n` +
            `├ System Free: ${formatMemory(systemMemory.free)}\n` +
            `└ System Total: ${formatMemory(systemMemory.total)}\n\n` +
            `*📁 Storage:*\n` +
            `└ Project Size: ${projectSize} MB${driveInfo}\n` +
            `*🔄 CPU:*\n` +
            `├ Model: ${cpuModel}\n` +
            `├ Cores: ${cpuCores}\n` +
            `└ Usage: ${cpuPercent}%\n\n` +
            `*💻 System:*\n` +
            `├ OS: ${osInfo.type}\n` +
            `├ Platform: ${osInfo.platform}\n` +
            `├ Architecture: ${osInfo.arch}\n` +
            `├ Release: ${osInfo.release}\n` +
            `└ Node: ${process.version}\n` +
            `${'─'.repeat(30)}\n` +
            `_🔥 System of FAHMYZZX-BOT_ © ${new Date().getFullYear()}`
        );

    } catch (error) {
        console.error('Bot Status Error:', error);
        await chat.sendMessage(
            `❌ *Bot Status Error*\n` +
            `${'─'.repeat(30)}\n` +
            `Failed to get complete system information.\n` +
            `Error: ${error.message}\n` +
            `${'─'.repeat(30)}`
        );
    }
};

const simulateProgress = async (chat) => {
    const msg = await chat.sendMessage('🔄 *Calculating size...*\n```[▒▒▒▒▒▒▒▒▒▒] 0%```');
    await new Promise(resolve => setTimeout(resolve, 1000));
    await msg.edit('🔄 *Analyzing data...*\n```[██████▒▒▒▒] 60%```');
    await new Promise(resolve => setTimeout(resolve, 1000));
    await msg.edit('🔄 *Final calculation...*\n```[██████████] 100%```');
    await new Promise(resolve => setTimeout(resolve, 1000));
    return msg;
};

const cekJoni = async (message, chat) => {
    try {
        const quotedMsg = await message.getQuotedMessage();
        if (!quotedMsg) {
            await chat.sendMessage('❌ Reply to someone\'s message to measure!');
            return;
        }

        const contact = await quotedMsg.getContact();
        const name = contact.pushname || 'Unknown';

        await simulateProgress(chat);
        const size = Math.floor(Math.random() * 50) + 1;

        let sizeEmoji;
        if (size < 10) sizeEmoji = '🤏🍆';
        else if (size < 20) sizeEmoji = '😐🍆';
        else if (size < 30) sizeEmoji = '😎🍆';
        else if (size < 40) sizeEmoji = '😏🍆';
        else sizeEmoji = '🍆🍆';

        await chat.sendMessage(`*Hasil perhitungan ukuran joni* ${sizeEmoji}\n\n`
            + `*Name:* ${name}\n`
            + `*Ukuran Joni dia:* ${size}cm\n\n`
            + `_Awwokwokowk Ukuran Joni🍆 nya ternyata ${size}_🤣`);

    } catch (error) {
        console.error('Error in measure command:', error);
        await chat.sendMessage('❌ Failed to measure! Try again.');
    }
}

const imageToSticker = async (message, chat, text = '') => {
    try {
        let media;

        if (message.hasQuotedMsg) {
            const quotedMsg = await message.getQuotedMessage();
            if (quotedMsg.hasMedia) {
                media = await quotedMsg.downloadMedia();
            }
        }
        else if (message.hasMedia) {
            media = await message.downloadMedia();
        }

        if (!media) {
            await chat.sendMessage('❌ Please send an image or reply to an image!');
            return;
        }

        if (!media.mimetype.includes('image')) {
            await chat.sendMessage('❌ This is not an image!');
            return;
        }

        if (text) {
            const imageBuffer = Buffer.from(media.data, 'base64');
            const modifiedImage = await sharp(imageBuffer)
                .resize(512, 512, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .composite([{
                    input: Buffer.from(`<svg>
                        <text x="50%" y="95%" text-anchor="middle" font-size="40" fill="white" stroke="black" stroke-width="2">${text}</text>
                    </svg>`),
                    top: 0,
                    left: 0
                }])
                .toBuffer();

            media.data = modifiedImage.toString('base64');
        }

        await chat.sendMessage(media, { sendMediaAsSticker: true });

    } catch (error) {
        console.error('Error in imageToSticker:', error);
        await chat.sendMessage('❌ Failed to create sticker!');
    }
};

const makeTriggered = async (message, chat) => {
    try {
        let media;

        if (message.hasQuotedMsg) {
            const quotedMsg = await message.getQuotedMessage();
            if (quotedMsg.hasMedia) {
                media = await quotedMsg.downloadMedia();
            }
        } else if (message.hasMedia) {
            media = await message.downloadMedia();
        }

        if (!media) {
            await chat.sendMessage('❌ Please send an image/sticker or reply to one!');
            return;
        }

        const imageBuffer = Buffer.from(media.data, 'base64');
        
        const distortX = Math.random() * 30 - 15;  
        const distortY = Math.random() * 30 - 15;  
        const rotate = Math.random() * 20 - 10;    
        const scale = 1 + (Math.random() * 0.5);   
        const hue = Math.floor(Math.random() * 360);
        
        const triggeredImage = await sharp(imageBuffer)
            .resize(512, 512, {
                fit: 'contain',
                background: { r: 255, g: 0, b: 0, alpha: 0.2 }
            })
            .linear(1.4, -0.3)
            .modulate({
                brightness: 1.3,
                saturation: 2.5,
                hue: hue
            })
            .affine([[scale, distortX/50], [distortY/50, scale]], {
                background: { r: 255, g: 0, b: 0, alpha: 0.2 }
            })
            .rotate(rotate, {
                background: { r: 255, g: 0, b: 0, alpha: 0.2 }
            })
            .composite([
                {
                    input: Buffer.from([255, 0, 0, 40]),
                    raw: {
                        width: 1,
                        height: 1,
                        channels: 4
                    },
                    tile: true,
                    blend: 'overlay'
                },
                {
                    input: Buffer.from(`<svg>
                        <text x="50%" y="95%" text-anchor="middle" font-size="60" font-weight="900" 
                        fill="red" stroke="white" stroke-width="3" filter="url(#distort)">
                        TRIGGERED</text>
                        <defs>
                            <filter id="distort">
                                <feTurbulence type="fractalNoise" baseFrequency="0.1" numOctaves="3" />
                                <feDisplacementMap in="SourceGraphic" scale="30" />
                            </filter>
                        </defs>
                    </svg>`),
                    top: 0,
                    left: 0
                }
            ])
            .toBuffer();

        const triggeredMedia = new MessageMedia(
            'image/jpeg',
            triggeredImage.toString('base64'),
            'triggered.jpg'
        );

        await chat.sendMessage(triggeredMedia, { 
            sendMediaAsSticker: true,
            stickerName: 'Triggered',
            stickerAuthor: 'FahmyZZX Bot'
        });

    } catch (error) {
        console.error('Error in makeTriggered:', error);
        await chat.sendMessage('❌ Failed to create triggered sticker!');
    }
};

const purgeMessages = async (message, chat, duration = 5) => {
    try {
        if (!message.hasQuotedMsg) {
            await chat.sendMessage('❌ *Reply pesan awal* untuk memulai purge!');
            return;
        }

        const startTime = Date.now();
        const quotedMsg = await message.getQuotedMessage();

        const statusMsg = await chat.sendMessage(
            `🚀 *PURGE PROCESS STARTED* 🚀\n` +
            `⏱ Durasi: ${duration}s\n` +
            `📌 Ref Message: ${quotedMsg.body.slice(0, 20)}...\n`
        );

        let deletedCount = 0;
        let isRunning = true;
        let errors = 0;

        setTimeout(() => {
            isRunning = false;
            console.log('[PURGE] Waktu habis');
        }, duration * 1000);

        const progressBar = (percent) => {
            const bars = Math.round(percent * 20);
            return `[${'█'.repeat(bars)}${'░'.repeat(20 - bars)}]`;
        };

        while (isRunning) {
            try {
                const messages = await chat.fetchMessages({
                    fromMe: true,
                    limit: 100,
                    before: quotedMsg.id._serialized
                });

                const validMessages = messages.filter(msg =>
                    msg?.id?._serialized && msg.timestamp >= quotedMsg.timestamp
                );

                await Promise.all(validMessages.map(async (msg) => {
                    try {
                        await msg.delete(true);
                        deletedCount++;
                    } catch (err) {
                        errors++;
                        console.error('[DELETE ERROR]', err.message);
                    }
                }));

                const elapsed = (Date.now() - startTime) / 1000;
                const percent = elapsed / duration;

                await statusMsg.edit(
                    `🚦 *PROGRESS UPDATE*\n` +
                    `${progressBar(percent)} ${(percent * 100).toFixed(1)}%\n` +
                    `✅ Terhapus: ${deletedCount}\n` +
                    `⚠️ Error: ${errors}\n` +
                    `⏱ Sisa: ${(duration - elapsed).toFixed(1)}s\n`
                );

                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (err) {
                console.error('[BATCH ERROR]', err.message);
                errors++;
            }
        }

        try {
            if (quotedMsg.fromMe) {
                await quotedMsg.delete(true);
                deletedCount++;
            }
        } catch (err) {
            console.error('[REF DELETE ERROR]', err.message);
        }

        const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
        const speed = (deletedCount / totalTime).toFixed(1);

        await chat.sendMessage(
            `🎉 *PURGE COMPLETED*🎉\n\n` +
            `📊 Total Terhapus: ${deletedCount}\n` +
            `⚡️ Kecepatan: ${speed}/detik\n` +
            `⏱ Durasi: ${totalTime}s\n` +
            `🚨 Error: ${errors}\n` +
            `📌 Ref Message: *Deleted*\n\n` +
            `_🔥 Purge by FAHMYZZX-BOT_`
        );

        try {
            await statusMsg.delete(true);
            console.log('[PURGE] Pesan status dihapus');
        } catch (err) {
            console.error('[STATUS DELETE ERROR]', err.message);
        }

    } catch (error) {
        console.error('[MAIN ERROR]', error);
        await chat.sendMessage(
            `║═══════════════════════\n` +
            `║ ❌ *PURGE FAILED!*\n` +
            `║═══════════════════════\n` +
            `║ ${error.message}\n` +
            `║═══════════════════════`
        );
    }
};

const roundRect = (ctx, x, y, width, height, radius) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
};

const downloadAvatar = async (profilePicUrl) => {
    try {
        if (!profilePicUrl) return null;
        
        const response = await axios.get(profilePicUrl, { responseType: 'arraybuffer' });
        return Buffer.from(response.data, 'binary');
    } catch (error) {
        console.error('Error downloading avatar:', error);
        return null;
    }
};

const generateQuotlySticker = async (message, chat) => {
    try {
        if (!message.hasQuotedMsg) {
            await chat.sendMessage('❌ Reply pesan yang ingin dijadikan sticker!');
            return;
        }

        const quotedMsg = await message.getQuotedMessage();
        const sender = await quotedMsg.getContact();
        const profilePicUrl = await sender.getProfilePicUrl();
        
        const canvasWidth = 512;
        const canvasHeight = 320; // Lebih kecil untuk format landscape
        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvasWidth, canvasHeight);// background transparan
        
        const bubbleMargin = 30; // Margin lebih kecil
        const bubbleWidth = canvasWidth - (bubbleMargin * 2);
        const minBubbleHeight = 100; // Minimal tinggi bubble

        ctx.font = '20px Arial';
        const textX = bubbleMargin + 20;
        const textY = bubbleMargin + 60; // Sesuaikan posisi awal teks
        const textMaxWidth = bubbleWidth - 40;
        
        let testCanvas = createCanvas(textMaxWidth, 1000);
        let testCtx = testCanvas.getContext('2d');
        testCtx.font = '20px Arial';
        
        const textLines = [];
        const words = quotedMsg.body.split(' ');
        let currentLine = words[0] || '';
        
        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = testCtx.measureText(`${currentLine} ${word}`).width;
            
            if (width < textMaxWidth) {
                currentLine += ` ${word}`;
            } else {
                textLines.push(currentLine);
                currentLine = word;
            }
        }
        
        if (currentLine.length > 0) {
            textLines.push(currentLine);
        }
        
        if (textLines.length === 0) {
            textLines.push(quotedMsg.body || " ");
        }
        
        const lineCount = textLines.length;
        const lineHeight = 30;
        const textHeight = lineCount * lineHeight;
        
        const bubbleHeight = Math.min(
            canvasHeight - (bubbleMargin * 2), // Batas maksimum tinggi
            Math.max(minBubbleHeight, textHeight + 80) // Minimum tinggi + margin header/footer
        );
        
        ctx.fillStyle = '#202C33'; // Warna bubble dark theme WhatsApp
        roundRect(ctx, bubbleMargin, bubbleMargin, bubbleWidth, bubbleHeight, 15);
        ctx.fill();

        const avatarX = bubbleMargin + 25;
        const avatarY = bubbleMargin + 25;
        const avatarSize = 30;
        
        ctx.save();
        
        if (profilePicUrl) {
            try {
                const avatarBuffer = await downloadAvatar(profilePicUrl);
                if (avatarBuffer) {
                    const avatarImg = await loadImage(avatarBuffer);
                    
                    ctx.beginPath();
                    ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2, true);
                    ctx.closePath();
                    ctx.clip();
                    
                    ctx.drawImage(avatarImg, avatarX - avatarSize/2, avatarY - avatarSize/2, avatarSize, avatarSize);
                }
            } catch (error) {
                console.error('Error drawing avatar:', error);
            }
        }
        
        ctx.restore();
        
        ctx.fillStyle = '#00a884'; // Warna nama (hijau WhatsApp)
        ctx.font = 'bold 18px Arial';
        ctx.fillText(sender.pushname || 'User', avatarX + avatarSize, avatarY + 6);

        ctx.fillStyle = '#e9edef'; // Warna teks pesan (putih)
        ctx.font = '20px Arial';
        
        const maxVisibleLines = Math.floor((bubbleHeight - 80) / lineHeight);
        const visibleLines = Math.min(textLines.length, maxVisibleLines);
        
        for (let i = 0; i < visibleLines; i++) {
            ctx.fillText(textLines[i], textX, textY + (i * lineHeight));
        }
        
        if (textLines.length > maxVisibleLines) {
            ctx.fillText("...", textX, textY + ((visibleLines - 1) * lineHeight));
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '14px Arial';
        const time = new Date(quotedMsg.timestamp * 1000);
        const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
        
        const timeWidth = ctx.measureText(timeStr).width;
        ctx.fillText(timeStr, bubbleMargin + bubbleWidth - timeWidth - 15, 
                    bubbleMargin + bubbleHeight - 15);

        const buffer = canvas.toBuffer('image/png');
        
        await chat.sendMessage(
            new MessageMedia('image/png', buffer.toString('base64')),
            {
                sendMediaAsSticker: true,
                stickerName: 'QuotlyBot',
                stickerAuthor: 'FahmyZZX Bot'
            }
        );

    } catch (err) {
        console.error('QuotlyBot Error:', err);
        await chat.sendMessage('❌ Gagal membuat sticker! Error: ' + err.message);
    }
};

let useKeyPrefix = true;

const setUseKeynotePrefix = async (message, chat, args) => {
    try {
        if (!args.length) {
            await chat.sendMessage(
                '❌ Format: !useprefix [1/0]\n' +
                '1 = Gunakan prefix\n' +
                '0 = Tanpa prefix\n' +
                `Status: ${useKeyPrefix ? 'Menggunakan Prefix ✅' : 'Tanpa Prefix ❌'}`
            );
            return;
        }

        const value = parseInt(args[0]);
        if (value !== 0 && value !== 1) {
            await chat.sendMessage('❌ Nilai tidak valid! Gunakan 1 atau 0');
            return;
        }

        useKeyPrefix = value === 1;
        const store = loadKeynotes();
        
        await chat.sendMessage(
            `✅ *Keynote Prefix Setting Updated!*\n\n` +
            `Mode: ${useKeyPrefix ? 'Menggunakan Prefix' : 'Tanpa Prefix'}\n` +
            `Prefix: ${store.prefix}\n` +
            `Contoh: ${useKeyPrefix ? `${store.prefix}note` : 'note'}`
        );
    } catch (error) {
        console.error('Set UseKeynotePrefix Error:', error);
        await chat.sendMessage('❌ Gagal mengubah pengaturan prefix!');
    }
};

const handleKeynote = async (message, chat, withPrefix = false) => {
    try {
        const store = loadKeynotes();
        const body = typeof message.body === 'string' 
            ? message.body.trim() 
            : String(message.body || '').trim();

        let noteName;

        if (useKeyPrefix) {
            if (!body.startsWith(store.prefix)) return false;
            noteName = body.slice(store.prefix.length).split(/\s+/)[0];
        } else {
            noteName = body.split(/\s+/)[0];
        }

        const note = store.notes[noteName];
        if (!note) return false;

        const contact = await message.client.getContactById(note.author);
        const authorName = (contact?.pushname || 'Unknown').slice(0, 10);
    
        await chat.sendMessage(
            `📝 *${noteName}*\n` +
            `${note.content}\n\n` +
            `👤 _By: ${authorName}_\n` +
            `📅 _${new Date(note.created).toLocaleString('id-ID')}_`
        );
        return true;
    } catch (error) {
        console.error('Keynote Error:', error);
        return false;
    }
};

const addKeynote = async (message, chat, args) => {
    try {
        if (args.length < 2) {
            await chat.sendMessage('❌ Format: !addkeynote [nama] [isi]');
            return;
        }

        const noteName = args[0];
        const noteContent = message.body.substring(
            message.body.indexOf(noteName) + noteName.length + 1
        ).trim();

        const store = loadKeynotes();
        store.notes[noteName] = {
            content: noteContent,
            author: message.from,
            created: new Date().toISOString()
        };
        saveKeynotes(store);

        await chat.sendMessage(
            `📝 *Catatan "${noteName}" Tersimpan!*\n` +
            `🔖 Prefix: ${store.prefix}\n` +
            `📌 Contoh akses: ${store.prefix}${noteName}\n` +
            `📄 Content: ${noteContent}`
        );
    } catch (error) {
        console.error('Add Keynote Error:', error);
        await chat.sendMessage('❌ Gagal menyimpan catatan!');
    }
};

const setKeynotePrefix = async (message, chat, args) => {
    try {
        if (args.length < 2) {
            await chat.sendMessage('❌ Format: !setkeyprefix keynote [newPrefix]');
            return;
        }

        const store = loadKeynotes();
        store.prefix = args[1];
        saveKeynotes(store);
        
        await chat.sendMessage(`✅ Prefix keynote diubah ke: ${args[1]}`);
    } catch (error) {
        console.error('Set Keynote Prefix Error:', error);
        await chat.sendMessage('❌ Gagal mengubah prefix!');
    }
};

module.exports = {
    setConfig,
    simulateProgress,
    generateDashboard,
    generateOwnerHelpMenu,
    generateUserHelpMenu,
    botStatus,
    //Fitur-Fitur
    cekJoni,
    imageToSticker,
    makeTriggered,
    purgeMessages,
    generateQuotlySticker ,
    handleKeynote,
    addKeynote,
    setKeynotePrefix,
    setUseKeynotePrefix 
};