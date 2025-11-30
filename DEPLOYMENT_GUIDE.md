# WhatsApp News Automation - Deployment Guide

This guide details how to deploy the WhatsApp News Bot using **GitHub Actions** (for execution) and **MongoDB Atlas** (for session persistence). This setup is completely free.

## Prerequisites

1.  **GitHub Account**
2.  **MongoDB Atlas Account** (Free Tier)
3.  **API Keys**:
    *   Gemini API Key (Google AI Studio)
    *   NewsData.io API Key
    *   Telegram Bot Token (Optional)

---

## Step 1: Setup MongoDB Atlas (Database)

1.  **Create Account**: Sign up at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2.  **Create Cluster**: Build a database using the **M0 Free** tier.
3.  **Create User**:
    *   Go to "Database Access".
    *   Add a new user (e.g., `whatsapp-bot`).
    *   **Important**: Save the password!
4.  **Allow Access**:
    *   Go to "Network Access".
    *   Add IP Address: `0.0.0.0/0` (Allow access from anywhere).
5.  **Get Connection String**:
    *   Click "Connect" -> "Drivers".
    *   Copy the string (e.g., `mongodb+srv://<user>:<password>@cluster...`).
    *   Replace `<password>` with your actual password.

---

## Step 2: Local Authentication (One-Time Setup)

You must run the login script locally once to scan the QR code and save the session to MongoDB.

1.  **Configure Environment**:
    Create a `.env` file in the project root:
    ```env
    GEMINI_API_KEY=your_key_here
    NEWSDATA_API_KEY=pub_0c710b01fcdf47d3886ed01f290ae10c
    WHATSAPP_GROUP_NAME=Your Group Name
    MONGODB_URI=your_mongodb_connection_string
    TELEGRAM_BOT_TOKEN=optional_token
    TELEGRAM_CHAT_ID=optional_chat_id
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Run Login Script**:
    ```bash
    npm run login
    ```

4.  **Scan QR Code**:
    *   A QR code will appear in the terminal.
    *   Scan it with WhatsApp (Settings -> Linked Devices).

5.  **Verify Success**:
    *   Wait for the message: `🎉 Login successful! Session saved.`.
    *   Once you see this, the session is safely stored in the cloud.

---

## Step 3: Deploy to GitHub

1.  **Push Code**:
    ```bash
    git add .
    git commit -m "Ready for deployment"
    git push origin main
    ```

2.  **Add Secrets**:
    Go to your GitHub Repository -> **Settings** -> **Secrets and variables** -> **Actions**.
    Add the following **Repository secrets**:

    | Name | Value |
    | :--- | :--- |
    | `GEMINI_API_KEY` | Your Gemini API Key |
    | `NEWSDATA_API_KEY` | `pub_0c710b01fcdf47d3886ed01f290ae10c` |
    | `WHATSAPP_GROUP_NAME` | Exact name of your WhatsApp group |
    | `MONGODB_URI` | Your MongoDB connection string |
    | `TELEGRAM_BOT_TOKEN` | (Optional) Your Telegram Bot Token |
    | `TELEGRAM_CHAT_ID` | (Optional) Your Telegram Chat ID |

---

## Step 4: Enable Automation

1.  Go to the **Actions** tab in your GitHub repository.
2.  You should see "Daily WhatsApp News Bot" listed.
3.  **Enable Workflow** if prompted.
4.  The bot is scheduled to run automatically at **8:00 PM IST** (14:30 UTC) every day.

### Manual Trigger
You can test the deployment immediately:
1.  Select "Daily WhatsApp News Bot" in the Actions tab.
2.  Click **Run workflow**.
3.  Select `main` branch and click the green **Run workflow** button.

---

## Managing WhatsApp Session

The bot uses a persistent session stored in MongoDB. If the session expires or you need to re-authenticate:

1.  **Run the login script locally:**
    ```bash
    npm run login
    ```
2.  **Scan the QR code** with your WhatsApp (Linked Devices).
3.  The script will save the new session to MongoDB automatically.
4.  The bot in GitHub Actions will pick up the new session on the next run.

---

## Troubleshooting

*   **"Group not found"**: Ensure `WHATSAPP_GROUP_NAME` matches exactly (case-sensitive) and the bot account has joined that group.
*   **"Session not found"**: Re-run Step 2 (Local Authentication) to refresh the session in MongoDB.
*   **"offset is out of bounds"**: This means the session file is too large. We use GridFS to handle this, so ensure you are using the latest code.
