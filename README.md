# Lx-Bot

Lx-Bot is a fully-featured, modular, and multilingual Discord bot with sharding, written in **Discord.js (v14)** and uses SQLite. It has features like an economy system, leveling system, moderation system, ticket support, and temporary voice channels by join to create and more.

---

## Prerequisites

In order to run this Bot, you need:
* **Node.js** (v16.9.0 or higher recommended)
* **npm** 

---

## How to Setup the Bot

1. **Download Project Files**:
   Clone the repository or download the ZIP file and extract it.

2. **Install Dependencies**:
   Open your cmd in the project directory and run:
   ```bash
   npm install discord.js
   npm install @napi-rs/canvas
   npm install dotenv
   npm install nodemon
   npm install better-sqlite3
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory of the project and add your Bots Token and ID:
   ```env
   token=YOUR_DISCORD_BOT_TOKEN
   appid=YOUR_DISCORD_APPLICATION_ID
   ```
---

## Running the Bot

Once the configuration is complete, you can start the bot using:

* **Standard Start**:
  ```bash
  npm run bot
  ```

---