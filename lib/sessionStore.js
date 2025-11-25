import { MongoClient, GridFSBucket } from 'mongodb';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'whatsapp-sessions';
const BUCKET_NAME = 'sessionFiles'; // GridFS bucket name
const SESSION_DIR = './temp/session';
const ZIP_FILE_NAME = 'session.zip';

class SessionStore {
  constructor() {
    this.client = null;
    this.db = null;
    this.bucket = null;
  }

  async connect() {
    try {
      this.client = new MongoClient(MONGODB_URI, {
        serverSelectionTimeoutMS: 30000,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 30000
      });
      await this.client.connect();
      this.db = this.client.db(DB_NAME);
      this.bucket = new GridFSBucket(this.db, { bucketName: BUCKET_NAME });
      
      console.log('✅ Connected to MongoDB Atlas (GridFS enabled)');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      console.log('🔌 Disconnected from MongoDB Atlas');
    }
  }

  async loadSessionFromMongo() {
    try {
      console.log('📥 Loading WhatsApp session from MongoDB Atlas (GridFS)...');
      
      // Check if file exists in GridFS
      const files = await this.bucket.find({ filename: ZIP_FILE_NAME }).toArray();
      
      if (files.length === 0) {
        console.log('ℹ️  No existing session found in MongoDB, will create new session');
        return false; // No existing session
      }
      
      const fileDoc = files[0];
      console.log(`📦 Found session archive (Size: ${(fileDoc.length / 1024 / 1024).toFixed(2)} MB)`);
      
      // Ensure session directory exists and is empty
      await this.clearLocalSession();
      await fs.mkdir(SESSION_DIR, { recursive: true });
      
      // Download stream to buffer
      const downloadStream = this.bucket.openDownloadStreamByName(ZIP_FILE_NAME);
      
      const chunks = [];
      for await (const chunk of downloadStream) {
        chunks.push(chunk);
      }
      const zipBuffer = Buffer.concat(chunks);
      
      // Extract zip
      const zip = new AdmZip(zipBuffer);
      zip.extractAllTo(SESSION_DIR, true);
      
      console.log(`✅ Session restored successfully to ${SESSION_DIR}`);
      return true; // Session exists
      
    } catch (error) {
      console.error('❌ Error loading session from MongoDB:', error);
      return false;
    }
  }

  async saveSessionToMongo() {
    try {
      console.log('📤 Saving WhatsApp session to MongoDB Atlas (GridFS)...');
      
      // Check if session directory exists
      try {
        await fs.access(SESSION_DIR);
      } catch {
        console.log('ℹ️  No session directory found, nothing to save');
        return;
      }
      
      // Create zip from session directory
      const zip = new AdmZip();
      zip.addLocalFolder(SESSION_DIR);
      const zipBuffer = zip.toBuffer();
      
      console.log(`📦 Created session archive (Size: ${(zipBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
      
      // Delete old file if exists
      const files = await this.bucket.find({ filename: ZIP_FILE_NAME }).toArray();
      if (files.length > 0) {
        await this.bucket.delete(files[0]._id);
        console.log('🗑️  Deleted old session archive');
      }
      
      // Upload new file via stream
      const uploadStream = this.bucket.openUploadStream(ZIP_FILE_NAME);
      uploadStream.end(zipBuffer);
      
      await new Promise((resolve, reject) => {
        uploadStream.on('finish', resolve);
        uploadStream.on('error', reject);
      });
      
      console.log(`✅ Session archive saved successfully to MongoDB (GridFS)`);
      
    } catch (error) {
      console.error('❌ Error saving session to MongoDB:', error.message);
      console.log('⚠️  Session save failed, but continuing...');
    }
  }

  async clearLocalSession() {
    try {
      await fs.rm(SESSION_DIR, { recursive: true, force: true });
      // Re-create empty directory
      await fs.mkdir(SESSION_DIR, { recursive: true });
    } catch (error) {
      // Ignore errors if directory doesn't exist
    }
  }

  async clearSession() {
    try {
      console.log('🗑️  Clearing session from MongoDB...');
      
      // Clear from GridFS
      const files = await this.bucket.find({ filename: ZIP_FILE_NAME }).toArray();
      if (files.length > 0) {
        await this.bucket.delete(files[0]._id);
      }
      
      // Clear local session directory
      await this.clearLocalSession();
      
      console.log('✅ Session cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing session:', error.message);
      throw error;
    }
  }
}

export default SessionStore;