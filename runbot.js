#!/usr/bin/env node

/**
 * WhatsApp News Bot (Advanced Mode)
 * 
 * Features:
 * - MongoDB Session Persistence (for GitHub Actions)
 * - Auto-posts to WhatsApp
 * - Optional Telegram notifications
 */

import dotenv from 'dotenv';
dotenv.config();

import { fetchTopNews } from './lib/newsFetcher.js';
import { summarizeNews } from './lib/summarizer.js';
import { postToWhatsAppGroup } from './lib/whatsapp.js';
import SessionStore from './lib/sessionStore.js';

// Optional Telegram for notifications
let sendTelegramNotification;
const TELEGRAM_ENABLED = process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID;

if (TELEGRAM_ENABLED) {
  const telegramModule = await import('./lib/telegram.js');
  sendTelegramNotification = async (message) => {
    try {
      await telegramModule.sendTelegramMessage(message);
      console.log('📤 Telegram notification sent');
    } catch (error) {
      console.log('⚠️  Telegram notification failed:', error.message);
    }
  };
} else {
  sendTelegramNotification = async () => {
    console.log('ℹ️  Telegram not configured, skipping notification');
  };
}

class WhatsAppNewsBot {
  constructor() {
    this.sessionStore = new SessionStore();
  }

  async run() {
    console.log('🤖 Starting WhatsApp News Bot (Advanced Mode)...');
    console.log('📅', new Date().toISOString());
    console.log('');
    
    try {
      // Step 0: Connect to MongoDB and Load Session
      console.log('💾 Step 0: Initializing Session Storage...');
      await this.sessionStore.connect();
      const hasSession = await this.sessionStore.loadSessionFromMongo();
      
      if (!hasSession) {
        console.log('ℹ️  No remote session found. You will need to scan QR code.');
      } else {
        console.log('✅ Remote session loaded successfully.');
      }
      console.log('');

      // Step 1: Fetch news
      console.log('📰 Step 1: Fetching latest Mutual Fund Industry news...');
      const news = await fetchTopNews();
      
      if (!news || news.length === 0) {
        console.log('⚠️  No news articles found. Generating educational content instead...');
        
        // Generate educational content
        const eduContent = await summarizeNews([]);
        
        console.log('📱 Posting educational content to WhatsApp...');
        await postToWhatsAppGroup(eduContent);
        console.log('✅ Message sent successfully!');
        
        // Notify Telegram if enabled (just notification, no approval)
        if (TELEGRAM_ENABLED) {
          await sendTelegramNotification(
            '⚠️ No fresh Mutual Fund news found today.\n\n' +
            '✅ Posted educational content to WhatsApp instead.\n\n' +
            `📅 ${new Date().toLocaleDateString('en-IN')}`
          );
        }
        
        // Save session and exit
        console.log('💾 Saving session to MongoDB...');
        await this.sessionStore.saveSessionToMongo();
        console.log('👋 Bot finished.');
        process.exit(0);
      } else {
        console.log(`✅ Found ${news.length} relevant articles`);
      }
      console.log('');
      
      // Step 2: Summarize news
      console.log('🧠 Step 2: Summarizing news with Gemini AI...');
      const summary = await summarizeNews(news);
      console.log('✅ Summary generated');
      console.log('');
      
      // Step 3: Post to WhatsApp
      console.log('📱 Step 3: Posting to WhatsApp group...');
      await postToWhatsAppGroup(summary);
      console.log('✅ Message sent successfully!');
      console.log('');

      // Step 4: Save Session back to MongoDB
      console.log('💾 Step 4: Saving session to MongoDB...');
      await this.sessionStore.saveSessionToMongo();
      console.log('✅ Session saved successfully!');
      
      // Send success notification
      if (TELEGRAM_ENABLED) {
        await sendTelegramNotification(
          '✅ News successfully posted to WhatsApp!\n\n' +
          `📊 Articles: ${news.length || 'Educational content'}\n` +
          `📅 ${new Date().toLocaleString('en-IN')}`
        );
      }
      
    } catch (error) {
      console.error('');
      console.error('❌ Bot execution failed:', error.message);
      
      // Send error notification
      if (TELEGRAM_ENABLED) {
        await sendTelegramNotification(
          '❌ Bot execution failed!\n\n' +
          `Error: ${error.message}\n\n` +
          `📅 ${new Date().toLocaleString('en-IN')}`
        );
      }
      
      // Try to save session even on error (in case authentication happened but posting failed)
      try {
        console.log('💾 Attempting to save session despite error...');
        await this.sessionStore.saveSessionToMongo();
      } catch (saveError) {
        console.error('❌ Failed to save session on error:', saveError.message);
      }
      
      process.exit(1);
    } finally {
      // Cleanup
      try {
        await this.sessionStore.disconnect();
      } catch (e) {
        console.error('Error disconnecting DB:', e.message);
      }
      console.log('👋 Bot finished.');
      process.exit(0);
    }
  }
}

// Run the bot
const bot = new WhatsAppNewsBot();
bot.run();
