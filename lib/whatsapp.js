import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import fs from 'fs/promises';
import dotenv from 'dotenv';
dotenv.config();

const GROUP_NAME = process.env.WHATSAPP_GROUP_NAME;
const GROUP_ID = process.env.WHATSAPP_GROUP_ID;
const SESSION_DIR = './temp/session';

export async function postToWhatsAppGroup(message) {
  return new Promise((resolve, reject) => {
    console.log('🚀 Initializing WhatsApp client with local session...');
    
    let retryCount = 0;
    const maxRetries = 2;
    
    const attemptConnection = () => {
      const client = new Client({
        authStrategy: new LocalAuth({
          clientId: 'whatsapp-bot',
          dataPath: SESSION_DIR
        }),
        webVersionCache: {
          type: 'remote',
          remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
        },
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

      // Handle QR code for authentication
      client.on('qr', (qr) => {
        if (retryCount === 0) {
          console.log('🔐 QR Code received for WhatsApp authentication:');
          console.log('📱 Instructions:');
          console.log('   1. Open WhatsApp on your phone');
          console.log('   2. Go to Settings → Linked Devices');
          console.log('   3. Tap "Link a Device"');
          console.log('   4. Scan the QR code below');
          console.log('⚠️  You have 60 seconds to scan');
          console.log('');
          
          // Generate QR code in terminal
          qrcode.generate(qr, { small: true });
          console.log('');
        } else {
          console.log('🔄 Retrying with new session - QR Code received:');
          qrcode.generate(qr, { small: true });
          console.log('');
        }
      });

      client.on('ready', async () => {
        try {
          console.log('✅ WhatsApp client ready. Waiting 15 seconds for chats to sync...');
          await new Promise(resolve => setTimeout(resolve, 15000));
          console.log('✅ Sync wait complete. Finding group...');
          const chats = await client.getChats();
          
          console.log(`📋 Found ${chats.length} total chats`);
          console.log(`📋 Groups found: ${chats.filter(c => c.isGroup).length}`);
          
          let group;
          
          // Try to find by ID first (more reliable)
          if (GROUP_ID) {
            console.log(`🔍 Looking for group by ID: ${GROUP_ID}`);
            group = chats.find(c => c.id._serialized === GROUP_ID);
            if (group) {
              console.log(`✅ Group found by ID: "${group.name}"`);
            } else {
              console.log(`❌ Group not found by ID: ${GROUP_ID}`);
            }
          }
          
          // If not found by ID, try by name
          if (!group && GROUP_NAME) {
            console.log(`🔍 Looking for group by name: "${GROUP_NAME}"`);
            group = chats.find(c => c.name === GROUP_NAME && c.isGroup);
            if (group) {
              console.log(`✅ Group found by name: "${group.name}"`);
            } else {
              console.log(`❌ Group not found by name: "${GROUP_NAME}"`);
            }
          }
          
          if (!group) {
            console.log('❌ Available groups:');
            const groups = chats.filter(c => c.isGroup);
            if (groups.length === 0) {
              console.log('   No groups found in your WhatsApp account');
            } else {
              groups.forEach(g => {
                console.log(`   - "${g.name}" (ID: ${g.id._serialized})`);
              });
            }
            throw new Error(`Group not found. Please check GROUP_NAME or GROUP_ID in environment variables. Available groups: ${groups.map(g => g.name).join(', ')}`);
          }
          
          console.log(`📤 Sending message to group: "${group.name}"...`);
          await client.sendMessage(group.id._serialized, message);
          console.log('✅ Message sent to WhatsApp group successfully.');
          
          // Wait a moment before destroying to ensure message is sent
          await new Promise(resolve => setTimeout(resolve, 3000));
          await client.destroy();
          
          resolve();
        } catch (err) {
          console.error('❌ Error in WhatsApp posting:', err.message);
          await client.destroy();
          reject(err);
        }
      });

      client.on('auth_failure', msg => {
        console.error('❌ WhatsApp authentication failed:', msg);
        handleRetry('Authentication failed');
      });

      client.on('disconnected', (reason) => {
        console.log('⚠️  WhatsApp client disconnected:', reason);
        
        if (reason === 'LOGOUT' || reason.includes('auth') || reason.includes('session')) {
          handleRetry(`Session expired: ${reason}`);
        } else {
          reject(new Error('WhatsApp disconnected: ' + reason));
        }
      });

      client.on('loading_screen', (percent, message) => {
        console.log(`🔄 Loading WhatsApp: ${percent}% - ${message}`);
      });

      // Handle process termination
      process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down WhatsApp client...');
        await client.destroy();
        process.exit(0);
      });

      client.initialize();
    };

    const handleRetry = async (reason) => {
      retryCount++;
      console.log(`🔄 Retry attempt ${retryCount}/${maxRetries} due to: ${reason}`);
      
      if (retryCount <= maxRetries) {
        console.log('🧹 Clearing old session and retrying with fresh authentication...');
        
        try {
          await fs.rm(SESSION_DIR, { recursive: true, force: true });
          console.log('✅ Old session cleared, retrying...');
        } catch (err) {
          console.log('⚠️  Error clearing session:', err.message);
        }
        
        setTimeout(attemptConnection, 2000); // Wait 2 seconds before retry
      } else {
        console.error('❌ Max retries reached, giving up');
        reject(new Error(`Failed after ${maxRetries} attempts: ${reason}`));
      }
    };

    // Start the first attempt
    attemptConnection();
  });
}
