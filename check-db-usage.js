import { MongoClient, GridFSBucket } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'whatsapp-sessions';
const BUCKET_NAME = 'sessionFiles';

async function checkUsage() {
  console.log('🔍 Checking MongoDB Storage Usage...');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const bucket = new GridFSBucket(db, { bucketName: BUCKET_NAME });
    
    // Get stats for the database
    const stats = await db.stats();
    console.log(`\n📊 Database Stats (${DB_NAME}):`);
    console.log(`   - Data Size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   - Storage Size: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   - Object Count: ${stats.objects}`);
    
    // List files in GridFS
    console.log(`\n📦 GridFS Files (${BUCKET_NAME}):`);
    const files = await bucket.find({}).toArray();
    
    if (files.length === 0) {
      console.log('   (No files found)');
    } else {
      files.forEach(file => {
        console.log(`   - Name: ${file.filename}`);
        console.log(`     Size: ${(file.length / 1024 / 1024).toFixed(2)} MB`);
        console.log(`     Date: ${file.uploadDate.toISOString()}`);
        console.log('     -------------------');
      });
    }
    
    // Check free tier limit (512MB)
    const totalUsed = stats.storageSize / 1024 / 1024;
    const limit = 512;
    const percent = (totalUsed / limit) * 100;
    
    console.log(`\n📉 Usage Summary:`);
    console.log(`   Used: ${totalUsed.toFixed(2)} MB / ${limit} MB (${percent.toFixed(1)}%)`);
    
    if (percent > 80) {
      console.log('⚠️  WARNING: You are approaching the 512MB limit!');
    } else {
      console.log('✅ You have plenty of space remaining.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

checkUsage();
