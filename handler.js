const {
    generateDashboard, 
    generateOwnerHelpMenu, 
    generateUserHelpMenu,
    botStatus,
    cekJoni,
    imageToSticker,
    makeTriggered ,
    purgeMessages,
    handleKeynote,
    addKeynote,
    setKeynotePrefix,
    setUseKeynotePrefix,
    generateQuotlySticker
} = require('./fitur');

const {
    // New ResitaAPI functions
    downloadHandler,
    searchHandler,
    toolsHandler,
    makerHandler,
    internetHandler,
    stickerSearchHandler
} = require('./fiturAPI');

let config = null;

const setConfig = (cfg) => {
    config = cfg;
};

const handleOwnerCommands = async (message, chat) => {
    try {
    if (message.from !== config.ownerNumberFormatted) {
        await chat.sendMessage('*Kamu itu pengguna biasa, bukan owner!*\n*Gunakan Prefix:* (.)\ndiawali titik ya dek ya😘');
        return;
    }

    const command = message.body.slice(config.ownerPrefix.length).trim().split(' ')[0];
    const args = message.body.split(' ').slice(1); 

    if (await handleKeynote(message, chat, true)) return;
    if (await handleKeynote(message, chat, false)) return;

    switch(command) {
        case 'addkeynote':
            await addKeynote(message, chat, args);
            break;

        case 'setkeyprefix':
            await setKeynotePrefix(message, chat, args);
            break;

        case 'useprefixnote':
            await setUseKeynotePrefix(message, chat, args);
            break;
    
        case 'setprefix':
            if(args[0] === 'owner') {
                config.ownerPrefix = args[1];
                await chat.sendMessage('✅ Owner prefix updated!');
            } else if(args[0] === 'user') {
                config.userPrefix = args[1];
                await chat.sendMessage('✅ User prefix updated!');
            } else if(args[0] === 'reset') {
                config = {...config.defaultConfig};
                await chat.sendMessage('✅ Prefixes reset to default!\n' +
                    `*Owner Prefix:* ${config.ownerPrefix}\n` +
                    `*User Prefix:* ${config.userPrefix}`);
            }
            break;
            
        case 'help':
            await chat.sendMessage(generateOwnerHelpMenu());
            break;

        case 'start':
            await generateDashboard(chat, true);
            break;

        case 'ping':
            const start = Date.now();
            await chat.sendMessage(`*🏓Pong*\n*Latency:* ${Date.now() - start}ms\n*Status:* Active ✅`);
            break;

        case 'status':
            await botStatus(chat);
            break;

        case 'cekjoni':
            await cekJoni(message, chat);  
            break;

        case 'sticker':
            await imageToSticker(message, chat, args.join(' '));
            break;
    
        case 'triger':
            await makeTriggered(message, chat);
            break;

        case 'quote':
            await generateQuotlySticker(message, chat);
            break;

        case 'purge':
            const duration = args[0] ? parseInt(args[0]) : 5;
            if (isNaN(duration) || duration <= 0) {
                await chat.sendMessage('❌ Durasi harus berupa angka positif!');
                return;
            }
            if (duration > 60) {
                await chat.sendMessage('❌ Durasi maksimal 60 detik!');
                return;
            }
            await purgeMessages(message, chat, duration); 
            break;

        case 'download':
            await downloadHandler(message, chat, args);
            break;
            
        // New API commands
        case 'search':
            await searchHandler(message, chat, args);
            break;

        case 'tools':
            await toolsHandler(message, chat, args);
            break;
            
        case 'maker':
            await makerHandler(message, chat, args);
            break;
            
        case 'internet':
            await internetHandler(message, chat, args);
            break;
            
        case 'stickersearch':
            await stickerSearchHandler(message, chat, args);
            break;

        default:
            await chat.sendMessage('❌ Command tidak dikenali! Ketik *help* untuk melihat daftar command.');
            break;
        }
    } catch (error) {
        console.error('Owner Command Error:', error);
        await chat.sendMessage('❌ Terjadi kesalahan!');
    }
};

const handleUserCommands = async (message, chat) => {
    try {
    const command = message.body.slice(config.userPrefix.length).trim().split(' ')[0];
    const args = message.body.split(' ').slice(1);
    
    if (await handleKeynote(message, chat, true)) return;
    if (await handleKeynote(message, chat, false)) return;

    switch(command) {
        case 'addkeynote':
            await addKeynote(message, chat, args);
            break;

        case 'start':
            await generateDashboard(chat, false);
            break;
            
        case 'help':
            await chat.sendMessage(generateUserHelpMenu());
            break;
            
        case 'ping':
            const start = Date.now();
            await chat.sendMessage(`*🏓Pong*\n*Latency:* ${Date.now() - start}ms\n*Status:* Active ✅`);
            break;

        case 'status':
            await botStatus(chat);
            break;
            
        case 'cekjoni':
            await cekJoni(message, chat);  
            break;

        case 'sticker':
            await imageToSticker(message, chat, args.join(' '));
            break;
    
        case 'triger':
            await makeTriggered(message, chat);
            break;

        case 'quote':
            await generateQuotlySticker(message, chat);
            break;
            
        case 'download':
            await downloadHandler(message, chat, args);
            break;
            
        // New API commands
        case 'search':
            await searchHandler(message, chat, args);
            break;

        case 'tools':
            await toolsHandler(message, chat, args);
            break;
            
        case 'maker':
            await makerHandler(message, chat, args);
            break;
            
        case 'internet':
            await internetHandler(message, chat, args);
            break;
            
        case 'stickersearch':
            await stickerSearchHandler(message, chat, args);
            break;

        default:
            await chat.sendMessage('❌ Command tidak dikenali! Ketik *help* untuk melihat daftar command.');
            break;
        }
    } catch (error) {
        console.error('Owner Command Error:', error);
        await chat.sendMessage('❌ Terjadi kesalahan!');
    }
};

module.exports = {
    setConfig,
    handleOwnerCommands,
    handleUserCommands
};