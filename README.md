# 🤖 Describer AI: Intelligent Instagram Analysis Bot

![Node.js](https://img.shields.io/badge/Node.js-18.x-green?style=flat-square&logo=node.js)
![Telegram API](https://img.shields.io/badge/Telegram-Bot-blue?style=flat-square&logo=telegram)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-orange?style=flat-square&logo=google)
![Render](https://img.shields.io/badge/Deployed_on-Render-black?style=flat-square)

**Describer AI** is a sophisticated Telegram bot that extracts, analyzes, and contextualizes visual content from Instagram posts. Powered by Google's Gemini Multimodal AI, it acts as an intelligent visual assistant with contextual memory and automated PDF reporting capabilities.

---

## ✨ Core Features

* **Multimodal Vision Analysis:** Instantly downloads Instagram media and uses `gemini-2.5-flash` to extract text, objects, and visual context.
* **Custom Instruction Buffer:** Built with a custom 3-second debounce timer, allowing users to forward a link and a specific prompt (e.g., "Summarize the pricing") as separate messages that are automatically merged before processing.
* **Stateful User Memory:** Utilizes an isolated `Map()` memory structure so the bot "remembers" the visual context of the current post. Users can ask follow-up questions without re-triggering the vision model, saving API quota.
* **In-Memory PDF Generation:** Users can request a formal report via `/email`. The bot dynamically compiles the analysis into a formatted PDF using `pdfkit` entirely in RAM (Buffer) and securely emails it via `nodemailer` without writing temporary files to disk.
* **Smart Message Chunking:** Automatically bypasses Telegram's 4,096-character limit by splitting long AI responses into sequential, readable chunks.

---

## 🏗️ System Architecture

1. **Ingestion:** User sends an Instagram URL (and an optional text prompt).
2. **Buffer Phase:** The request enters a 3-second waiting room. If follow-up text arrives, it merges the payloads.
3. **Execution:** `instagram-url-direct` scrapes the media, buffers it into Base64, and sends it to Gemini.
4. **Caching:** The analysis is stored in a user-specific Map session. Follow-up chat replies route to the lightweight `gemini-3.1-flash-lite` text model using this cached context.
5. **Export:** On `/email`, the cached context is piped through a formatting regex, drawn onto a PDF canvas, and streamed to an SMTP server.

---

## 🛠️ Tech Stack

* **Backend Environment:** Node.js, Express
* **AI Integration:** `@google/genai` (Gemini API)
* **Bot Framework:** `node-telegram-bot-api`
* **Media Processing:** `pdfkit` (Document Generation)
* **Communication:** `nodemailer` (SMTP Emailing)
* **Hosting:** Render (Web Service)

---

## 🚀 Installation & Local Setup

### 1. Clone the repository

git clone [https://github.com/rkumar49269/describer-ai-bot.git](https://github.com/rkumar49269/describer-ai-bot.git)
cd describer-ai-bot

2. Install dependencies
npm install

3. Environment Variables
Create a .env file in the root directory and add the following keys. (Note: You will need an App Password from your Google Account for the email functionality).

TELEGRAM_BOT_TOKEN=your_telegram_botfather_token
GEMINI_API_KEY=your_google_ai_studio_key
PORT=3000
EMAIL_USER=your_bot_email@gmail.com
EMAIL_PASS=your_16_character_app_password

4. Run the Bot
npm start
