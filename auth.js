import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import SessionStore from './lib/sessionStore.js';
import dotenv from 'dotenv';

dotenv.config();

const SESSION_DIR = './temp/session';

async function login() {
  console.log('🔐 Starting WhatsApp Login Flow...');
  
  const store = new SessionStore();
  
  try {
    // Step 1: Connect to MongoDB
    console.log('💾 Connecting to MongoDB...');
    await store.connect();
    
    // Step 2: Clear existing session to force new login
    console.log('🧹 Clearing existing session...');
    await store.clearSession();
    
    // Step 3: Initialize Client
    console.log('🚀 Initializing WhatsApp client...');
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: 'whatsapp-bot',
        dataPath: SESSION_DIR
      }),
      puppeteer: { 
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process', 
          '--disable-gpu'
        ]
      }
    });

    client.on('qr', (qr) => {
      console.log('\n✨ QR Code received! Scan this with your WhatsApp:');
      qrcode.generate(qr, { small: true });
      console.log('⚠️  You have 60 seconds to scan.');
    });

    client.on('ready', async () => {
      console.log('\n✅ WhatsApp client ready!');
      
      // Step 4: Save new session
      console.log('💾 Saving new session to MongoDB...');
      await store.saveSessionToMongo();
      
      console.log('🎉 Login successful! Session saved.');
      console.log('👋 Exiting...');
      
      await client.destroy();
      await store.disconnect();
      process.exit(0);
    });

    client.on('auth_failure', (msg) => {
      console.error('❌ Authentication failed:', msg);
      process.exit(1);
    });
    
    client.initialize();
    
  } catch (error) {
    console.error('❌ Login failed:', error);
    if (store) await store.disconnect();
    process.exit(1);
  }
}

login();
