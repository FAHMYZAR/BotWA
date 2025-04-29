const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const puppeteer = require('puppeteer');
const { handleOwnerCommands, handleUserCommands, setConfig: setHandlerConfig } = require('./handler');
const { setConfig: setFiturConfig ,handleKeynote} = require('./fitur');
const { setConfig: setFiturAPIConfig } = require('./fiturAPI'); // Tambahkan baris ini

const defaultConfig = {
    ownerPrefix: '!',    
    userPrefix: '.',     
    ownerNumber: '6285226166485',
    ownerNumberFormatted: '6285226166485@c.us'
};

let config = {...defaultConfig}; 

setHandlerConfig(config);
setFiturConfig(config);
setFiturAPIConfig(config);

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true, // or false
        args: ['--no-sandbox', '--disable-setuid-sandbox'], // Important for some environments
    },
    webVersionCache: {
        type: 'local',
        path: './.wwebjs_cache'
    }
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('🚀 Bot sudah siap!');
});

client.on('authenticated', () => {
    console.log('🔑 Login Succes');
});

client.on('auth_failure', msg => {
    console.error('❌ Login Failed:', msg);
});

client.on('disconnected', (reason) => {
    console.log('Client logged out:', reason);
});

client.on('message', async (message) => {
    try {
        if (message.fromMe) return;

        const chat = await message.getChat();
        const body = typeof message.body === 'string' ? message.body.trim() : '';

        if (message.from === config.ownerNumberFormatted && body.startsWith(config.ownerPrefix)) {
            await handleOwnerCommands(message, chat);
        } else if (body.startsWith(config.userPrefix)) {
            await handleUserCommands(message, chat);
        } else {
            await handleKeynote(message, chat, false);
        }
    } catch (error) {
        console.error('Message Handler Error:', error);
    }
});

client.on('message_create', async (message) => {
    try {
        if (!message.fromMe) return;
        
        const chat = await message.getChat();
        const body = typeof message.body === 'string' ? message.body.trim() : '';

        if (message.from === config.ownerNumberFormatted && body.startsWith(config.ownerPrefix)) {
            await handleOwnerCommands(message, chat);
        } else {
            await handleKeynote(message, chat, false);
        }
    } catch (error) {
        console.error('Message Create Handler Error:', error);
    }
});

client.initialize();