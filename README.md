# WhatsApp News Bot

A one-shot Node.js bot that fetches the latest Indian Mutual Fund Industry news from newsdata.io API, summarizes it with Gemini AI, and posts educational updates to WhatsApp and Telegram with MongoDB session persistence.

## 🚀 Features

- **One-shot Execution**: Runs as a single script, no persistent server required
- **MongoDB Session Persistence**: WhatsApp sessions stored in MongoDB Atlas
- **Telegram Polling**: Uses polling mode instead of webhooks for approval
- **Gemini AI Summarization**: SEBI-compliant educational content generation
- **Fallback Content**: Educational mutual fund content when no news available
- **GitHub Actions**: Automated daily execution with CI/CD
- **Ephemeral Environment Ready**: Works in GitHub Actions and other CI environments

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   GitHub        │    │   MongoDB       │    │   WhatsApp      │
│   Actions       │    │   Atlas         │    │   Web.js        │
│                 │    │                 │    │                 │
│ • Daily Cron    │◄──►│ • Session       │◄──►│ • LocalAuth     │
│ • Environment   │    │   Storage       │    │ • Session Dir   │
│ • Dependencies  │    │ • File Upload   │    │ • QR Code       │
└─────────────────┘    │ • File Download │    └─────────────────┘
                       └─────────────────┘
```

## 📁 Project Structure

```
├── runbot.js                 # Main orchestration script
├── lib/
│   ├── newsFetcher.js        # newsdata.io API integration
│   ├── summarizer.js         # Gemini AI summarization
│   ├── telegram.js           # Telegram polling bot
│   ├── whatsapp.js           # WhatsApp Web.js client
│   └── sessionStore.js       # MongoDB session persistence
├── .github/workflows/
│   └── dailybot.yml          # GitHub Actions workflow
├── temp/session/             # Local session directory (ephemeral)
└── package.json              # Dependencies and scripts
```

## 🛠️ Setup

### 1. Environment Variables

Create a `.env` file with:

```env
# API Keys
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key
NEWSDATA_API_KEY=pub_0c710b01fcdf47d3886ed01f290ae10c

# Telegram Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id

# WhatsApp Configuration
WHATSAPP_GROUP_NAME=your_group_name
WHATSAPP_GROUP_ID=your_group_id

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
```

### 2. MongoDB Atlas Setup

1. **Create MongoDB Atlas Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create free account and cluster (M0 Free tier)

2. **Get Connection String**
   - Click "Connect" → "Connect your application"
   - Copy connection string and replace `<password>`
   - Add to `MONGODB_URI` environment variable

3. **Network Access**
   - Go to Network Access
   - Add `0.0.0.0/0` to allow all IPs

### 3. Local Development

```bash
# Install dependencies
npm install

# Run bot locally
npm start

# Development mode with auto-restart
npm run dev
```

## 🔄 Workflow

The bot follows this sequence:

1. **Session Load**: Download WhatsApp session from MongoDB Atlas
2. **News Fetch**: Get latest Mutual Fund Industry news from newsdata.io API
3. **Summarize**: Generate SEBI-compliant summary with Gemini AI
4. **Telegram Send**: Post summary with Approve/Reject buttons
5. **Poll Approval**: Wait for admin response (30s intervals, max 3 retries)
6. **WhatsApp Post**: If approved, post to WhatsApp group
7. **Session Save**: Upload updated session to MongoDB Atlas
8. **Cleanup**: Clear local files and exit

## 🚀 GitHub Actions Deployment

### 1. Repository Secrets

Add these secrets in your GitHub repository:

```
OPENAI_API_KEY
GEMINI_API_KEY
NEWSDATA_API_KEY
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
WHATSAPP_GROUP_NAME
WHATSAPP_GROUP_ID
MONGODB_URI
```

### 2. Workflow Features

- **Daily Execution**: Runs at 6:00 AM UTC daily
- **Manual Trigger**: Can be triggered manually via GitHub UI
- **Chrome Dependencies**: Installs all required Chrome libraries
- **Error Logging**: Uploads logs as artifacts on failure
- **Node.js 20**: Uses latest LTS version

### 3. First Run Setup

On first execution, the bot will:

1. **Show QR Code**: Display WhatsApp QR code in GitHub Actions logs
2. **Manual Scan**: You need to scan the QR code from the logs
3. **Session Storage**: After authentication, session is saved to MongoDB
4. **Subsequent Runs**: Will use stored session automatically

## 📱 WhatsApp Authentication

### First Time Setup

1. **Run the bot** (locally or via GitHub Actions)
2. **Look for QR code** in the console/logs
3. **Scan with WhatsApp**:
   - Open WhatsApp → Settings → Linked Devices
   - Tap "Link a Device"
   - Scan the QR code from logs
4. **Session persists** in MongoDB Atlas

### Session Management

- **Automatic**: Sessions are automatically saved/loaded
- **Persistent**: Survives container restarts and deployments
- **Secure**: Stored in MongoDB Atlas, not in ephemeral storage
- **Timeout**: Sessions expire after 30 days of inactivity

## 🔧 Troubleshooting

### Common Issues

1. **QR Code Not Visible**
   - Check logs for QR code output
   - Ensure terminal supports ASCII art
   - Use `qrcode-terminal` for better display

2. **MongoDB Connection Failed**
   - Verify `MONGODB_URI` format
   - Check network access settings
   - Ensure database user has write permissions

3. **WhatsApp Authentication Failed**
   - Clear MongoDB session and retry
   - Check if WhatsApp account is active
   - Ensure phone has internet connection

4. **Telegram Polling Issues**
   - Verify bot token and chat ID
   - Check if bot has permission to send messages
   - Ensure inline keyboard buttons are working

### Debug Mode

For local debugging:

```bash
# Run with verbose logging
DEBUG=* npm start

# Check session files
ls -la temp/session/

# Test MongoDB connection
node -e "
import SessionStore from './lib/sessionStore.js';
const store = new SessionStore();
store.connect().then(() => console.log('MongoDB OK')).catch(console.error);
"
```

## 📋 Requirements

- **Node.js**: 20.0.0 or higher
- **Chrome/Chromium**: For Puppeteer (automatically installed)
- **MongoDB Atlas**: Free tier account
- **API Keys**: OpenAI, Gemini, newsdata.io, Telegram Bot

## 🎯 Use Cases

- **Daily News Updates**: Automated mutual fund news summaries
- **Educational Content**: SEBI-compliant financial education
- **Community Management**: Automated WhatsApp group content
- **Content Moderation**: Human approval workflow via Telegram

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the troubleshooting section
- Review GitHub Actions logs
- Open an issue with detailed error information 