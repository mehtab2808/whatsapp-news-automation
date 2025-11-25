import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

let bot = null;

if (token) {
  bot = new TelegramBot(token, { polling: false });
}

export async function sendTelegramMessage(message) {
  if (!bot || !chatId) {
    console.log('⚠️ Telegram not configured (token or chat ID missing)');
    return;
  }

  try {
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('❌ Telegram send failed:', error.message);
    // Don't throw, just log error so main process continues
  }
}


