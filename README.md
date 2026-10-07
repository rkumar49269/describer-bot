# Describer Bot — Backend

Backend for **Describer**, an AI-powered Telegram bot that analyzes Instagram posts using Google Gemini and supports conversational follow-up questions, PDF report generation, and email delivery.

The backend is built with **Node.js + Express**, uses **MongoDB** for conversation persistence, **Playwright** for Instagram media extraction, **Google Gemini** for multimodal analysis, and **Resend** for email delivery.

---

## ✨ Features

* 🤖 Telegram bot integration through Telegram Webhooks
* 📸 Instagram post and reel analysis
* 🖼️ Supports:

  * Single-image Instagram posts
  * Carousel posts
* 🔍 Extracts Instagram media using a persistent Playwright browser session
* 🧠 Gemini vision analysis of Instagram images
* 💬 Follow-up questions using stored conversation context
* 🗃️ MongoDB persistence for conversations
* ⌨️ Telegram typing indicator while AI is processing
* 🧹 Telegram message formatting and automatic message splitting
* 🔗 Supports:

  * Instagram URL + prompt in the same message
  * Instagram URL followed by a separate prompt
  * Follow-up questions by replying to the bot's previous response
* 📄 PDF report generation from the latest Instagram analysis
* 📧 Email delivery of generated PDF reports using Resend
* 🔁 Gemini retry handling for temporary `503` errors
* 🧩 Layered backend architecture for easier maintenance and extension

---

## 🏗️ Architecture

The backend follows a layered Express architecture:

```text
Telegram
   │
   ▼
Webhook Route
   │
   ▼
Controller
   │
   ▼
Telegram Service
   │
   ├── Session Management
   ├── Instagram URL Extraction
   ├── Conversation Lookup
   ├── Follow-up Handling
   └── Email/PDF Handling
   │
   ▼
Instagram Service
   │
   └── Instagram Client
          │
          └── Playwright
                 │
                 ▼
            Instagram Media
                 │
                 ▼
            Media Service
                 │
                 ▼
            Gemini Service
                 │
                 ▼
            Gemini Client
                 │
                 ▼
             AI Response
                 │
          ┌──────┴──────┐
          ▼             ▼
      Telegram       MongoDB
       Client      Conversation
                       │
                       ▼
                 PDF Service
                       │
                       ▼
                 Email Client
                       │
                       ▼
                    Resend
```

---

## 📁 Project Structure

```text
describer-backend/
│
├── server.js
├── package.json
├── package-lock.json
├── .gitignore
│
└── src/
    │
    ├── app.js
    │
    ├── clients/
    │   ├── email.client.js
    │   ├── gemini.client.js
    │   ├── instagram.client.js
    │   └── telegram.client.js
    │
    ├── config/
    │   ├── db.js
    │   └── env.js
    │
    ├── controllers/
    │   ├── health.controller.js
    │   └── telegram.controller.js
    │
    ├── middleware/
    │
    ├── models/
    │   └── conversation.model.js
    │
    ├── routes/
    │   ├── health.routes.js
    │   └── telegram.routes.js
    │
    ├── services/
    │   ├── conversation.service.js
    │   ├── gemini.service.js
    │   ├── instagram.service.js
    │   ├── media.service.js
    │   ├── pdf.service.js
    │   ├── telegram-session.service.js
    │   └── telegram.service.js
    │
    └── utils/
        ├── instagram.util.js
        └── telegram.util.js
```

---

## 🧩 Responsibilities of Each Layer

### `server.js`

Application entry point.

Responsible for:

* Loading environment variables
* Connecting to MongoDB
* Starting the Express server

The Express application itself is kept separate in `src/app.js`.

---

### `src/app.js`

Creates and configures the Express application.

Responsibilities include:

* Creating the Express app
* Registering middleware
* Registering application routes

```text
server.js
   │
   └── src/app.js
          │
          ├── /health
          └── /api/telegram
```

---

### `clients/`

Contains integrations with external APIs or browser-based external systems.

#### `telegram.client.js`

Centralizes Telegram Bot API operations such as:

* Sending messages
* Sending chat actions

This prevents Telegram API calls from being duplicated across services.

#### `gemini.client.js`

Provides a centralized interface to Google Gemini.

It also handles retrying temporary `503` responses.

#### `instagram.client.js`

Handles browser-based Instagram interaction using Playwright.

It:

* Opens Instagram using a persistent browser context
* Extracts carousel media from Instagram page data
* Falls back to `og:image` for single-image posts

#### `email.client.js`

Centralizes email delivery through Resend.

It is responsible for sending generated PDF reports as email attachments.

---

## `services/`

Contains the application's business logic.

### `telegram.service.js`

Coordinates the main Telegram workflow.

It handles:

* `/start`
* `/stop`
* User sessions
* Instagram URL detection
* Pending URL → prompt workflow
* Follow-up conversations
* Telegram responses
* PDF generation requests
* Email delivery requests

---

### `instagram.service.js`

Coordinates Instagram analysis.

```text
Instagram URL
      ↓
Instagram Client
      ↓
Image URLs
      ↓
Media Service
      ↓
Image Buffers
```

---

### `media.service.js`

Downloads extracted Instagram images and converts them into buffers suitable for Gemini processing.

---

### `gemini.service.js`

Contains Gemini-specific application logic.

It handles:

* Multimodal image analysis
* Structured initial responses
* Conversation-aware follow-up questions

The initial analysis produces:

```json
{
  "answer": "...",
  "context": "..."
}
```

The generated `context` is stored with the conversation and reused for follow-up questions.

---

### `conversation.service.js`

Handles conversation lookup from MongoDB.

For example, a Telegram reply can be mapped back to the conversation that generated the original response.

---

### `telegram-session.service.js`

Maintains active Telegram user sessions in memory.

---

### `pdf.service.js`

Generates a PDF report from the initial Instagram analysis.

The report includes:

* Describer analysis
* Original Instagram source URL
* Formatted analysis content
* Describer AI footer

---

## 🧠 AI Workflow

When a user sends an Instagram URL:

```text
User
 │
 │ Instagram URL
 ▼
Telegram
 │
 ▼
Webhook
 │
 ▼
Telegram Controller
 │
 ▼
Telegram Service
 │
 ▼
Extract Instagram URL
 │
 ▼
Instagram Client
 │
 └── Playwright
        │
        ▼
Instagram Media URLs
        │
        ▼
Media Service
        │
        ▼
Image Buffers
        │
        ▼
Gemini Vision
        │
        ▼
{
    answer,
    context
}
        │
   ┌────┴─────┐
   ▼          ▼
Telegram    MongoDB
Response   Conversation
              │
              ▼
          Follow-ups
```

The `context` generated by Gemini is stored so that later questions can be answered without reprocessing the Instagram post.

---

## 💬 Follow-Up Conversations

Describer supports conversational questions after an Instagram post has been analyzed.

For example:

```text
User:
https://instagram.com/p/example

Bot:
[Detailed analysis]

User:
What text was visible in the image?

Bot:
[Answer based on stored context]

User:
What was the main product?

Bot:
[Answer based on the same conversation]
```

Each conversation stores:

* Telegram user ID
* Root Telegram message ID
* Instagram URL
* Original user prompt
* AI-generated context
* User messages
* Assistant messages
* Telegram message IDs
* Creation/update timestamps

This allows Telegram reply messages to be mapped back to their corresponding conversation.

---

## 📄 PDF & Email Reports

After an Instagram analysis, the latest analysis can be converted into a PDF report and sent through email.

The Telegram command is:

```text
/email your@email.com
```

The workflow is:

```text
Telegram
   │
   ▼
/email command
   │
   ▼
Latest Conversation
   │
   ▼
PDF Service
   │
   ▼
PDF Buffer
   │
   ▼
Email Client
   │
   ▼
Resend
   │
   ▼
User Email
```

The PDF is generated dynamically from the stored assistant analysis and includes the original Instagram source URL.

> During development, Resend's testing restrictions may limit email delivery to the account's verified/testing recipient. Production email delivery requires appropriate Resend domain configuration.

---

## 🗃️ MongoDB Model

The main collection is based around the `Conversation` model.

Conceptually:

```text
Conversation
│
├── userId
├── rootTelegramMessageId
├── instagramUrl
├── userPrompt
├── context
│
└── messages[]
     │
     ├── role
     ├── content
     ├── telegramMessageId
     ├── createdAt
     └── updatedAt
```

MongoDB is used because the conversation structure naturally contains a variable-length array of messages.

---

## ⌨️ Telegram Message Handling

Telegram has a message length limitation, so long AI responses are processed before being sent.

The backend:

1. Normalizes whitespace
2. Cleans unnecessary blank lines
3. Converts simple bullet formatting
4. Splits long responses into Telegram-compatible chunks
5. Sends the chunks sequentially

This logic is centralized in:

```text
src/utils/telegram.util.js
```

---

## 🔄 URL + Prompt Workflow

Describer supports two ways of providing a request.

### Same message

```text
https://instagram.com/p/example
Describe the product and extract all visible text.
```

The URL and prompt are processed together.

### Separate messages

```text
User:
https://instagram.com/p/example

User:
Describe the product and extract the text.
```

The backend temporarily stores the Instagram request and waits for the user's prompt before starting the analysis.

---

## 📧 Email Workflow

The `/email` command uses the user's latest conversation.

The backend:

1. Finds the latest conversation for the Telegram user.
2. Retrieves the initial AI analysis.
3. Generates a PDF from that analysis.
4. Sends the PDF as an email attachment.
5. Confirms the result through Telegram.

The email integration is isolated in:

```text
src/clients/email.client.js
```

while PDF generation is handled by:

```text
src/services/pdf.service.js
```

This keeps external email communication separate from PDF generation and Telegram business logic.

---

## 🛠️ Tech Stack

| Technology       | Purpose                      |
| ---------------- | ---------------------------- |
| Node.js          | Runtime                      |
| Express.js       | HTTP server and routing      |
| MongoDB          | Conversation persistence     |
| Mongoose         | MongoDB ODM                  |
| Google Gemini    | Multimodal AI analysis       |
| Playwright       | Instagram browser automation |
| Telegram Bot API | User interaction             |
| PDFKit           | PDF report generation        |
| Resend           | Email delivery               |
| Nodemon          | Local development            |

---

## ⚙️ Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000

TELEGRAM_BOT_TOKEN=your_telegram_bot_token

GEMINI_API_KEY=your_gemini_api_key

MONGODB_URI=your_mongodb_connection_string

RESEND_API_KEY=your_resend_api_key
```

### Important

Never commit `.env` to GitHub.

The repository's `.gitignore` excludes environment files and the local Playwright browser profile.

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/rkumar49269/describer-bot.git
cd describer-bot
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create:

```text
.env
```

and add the required credentials.

### 4. Start the development server

```bash
npx nodemon server.js
```

The server will start on:

```text
http://localhost:3000
```

---

## ❤️ Health Check

The backend exposes a health endpoint:

```text
GET /health
```

Example:

```text
http://localhost:3000/health
```

This can be used to verify that the Express application is running.

---

## 🔗 Telegram Webhook

Telegram communicates with the backend through:

```text
POST /api/telegram/webhook
```

For local development, the webhook can be exposed through a public HTTPS tunnel.

For production, the server should expose a publicly accessible HTTPS endpoint.

The webhook should point to:

```text
https://YOUR_DOMAIN/api/telegram/webhook
```

---

## 🧪 Development

Run the development server with:

```bash
npx nodemon server.js
```

For a normal Node.js start:

```bash
node server.js
```

---

## 🔐 Security Notes

The following should never be committed:

```text
.env
.instagram-profile/
node_modules/
```

API credentials are loaded through environment variables.

The Playwright Instagram profile is kept locally because it may contain browser authentication/session information.

---

## ⚠️ Instagram Integration

Instagram extraction is implemented using a persistent Playwright browser context rather than relying on an Instagram scraping package.

The browser profile is stored locally at:

```text
.instagram-profile/
```

On the first local run, Playwright may require an authenticated Instagram browser session depending on the content being accessed.

The profile directory is intentionally excluded from Git.

For production deployment, the Playwright browser profile requires a persistent storage strategy.

---

## 📌 Current Limitations

* Instagram extraction depends on the current Instagram web experience.
* Some Instagram content may require authentication.
* Playwright requires a persistent browser environment.
* Telegram session state is currently maintained in application memory.
* Gemini responses depend on model/API availability.
* Resend production email delivery requires appropriate domain configuration.
* Production deployment should provide persistent storage for the Playwright profile where required.
* PDF generation and email delivery currently process the stored initial analysis rather than the complete conversation history.

---

## 🛣️ Future Improvements

Planned improvements include:

* Better production handling for Playwright sessions
* More robust Telegram session persistence
* Improved media ingestion performance
* Additional Instagram media types
* Automated testing
* Production deployment configuration
* Better error classification and monitoring
* Resend domain verification for unrestricted production email delivery

---

## 📂 Version History

The repository keeps the previous implementation separately:

```text
main
    ↓
Current rebuilt architecture

version_1
    ↓
Previous implementation
```

The current `main` branch contains the rebuilt backend architecture with separated routes, controllers, services, clients, utilities, and models.

The current implementation also includes:

* Conversation persistence
* Reply-based follow-up conversations
* Separate prompt handling
* PDF report generation
* Email delivery through Resend

---

## 👨‍💻 Author

**Rohit Kumar**

GitHub:

https://github.com/rkumar49269

---

## 📄 License

This project is currently intended as a personal/portfolio project.
