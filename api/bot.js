// УЛЬТРА-ПРОСТОЙ РАБОЧИЙ БОТ
const { Telegraf } = require('telegraf');

const bot = new Telegraf('ТВОЙ_ТОКЕН_ЗДЕСЬ');

bot.start((ctx) => {
  ctx.reply('🎁 Бот работает! Отправь /generate @username');
});

bot.command('generate', (ctx) => {
  const target =
