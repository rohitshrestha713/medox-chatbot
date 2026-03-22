# Medox AI Chatbot 🤖

Medox is a powerful, highly responsive, and beautiful AI Chatbot built with vanilla HTML, CSS, and JavaScript. It uses the **OpenRouter API** (powered by Gemini 1.5 Flash) to provide intelligent responses, analyze images, and read documents.

It also features offline/fallback integrations to fetch real-time weather and news for free!

## ✨ Features

- **Brain:** Powered by `google/gemini-2.5-flash` via OpenRouter.
- **Multilingual Support:** Chat in English, Hindi (Devanagari), or Hinglish (Roman).
- **Personalities/Modes:** 
  - 💖 **Friend:** Casual, fun, uses emojis.
  - 🎓 **Teacher:** Patient, explains concepts clearly.
  - ⚙️ **Engine:** Precise, technical, data-driven.
- **Vision & Document Analysis:** Upload images or PDFs for the AI to analyze.
- **Real-Time Integrations:**
  - 🌤️ Live weather routing via `wttr.in`.
  - 📰 Live news feeds via Google News RSS.
  - 🕒 Live local time & date queries.
- **Micro-Animations & UI:** Glassmorphism UI, smooth transitions, dark/light theme switching, and responsive design (mobile-ready).
- **Secure Architecture:** Built with a Netlify Serverless Function proxy (`/api/chat`) so your OpenRouter API key is never exposed to the public browser.

## 🚀 Local Development (Testing)

You don't need a Node.js server to run the interface!

1. Just double click `index.html` to open it in your browser.
2. Since there is no live Netlify server running locally, the `/api/chat` proxy will fail.
3. The app will prompt you to open the **⚙️ Settings** gear in the sidebar.
4. Paste your OpenRouter API key directly into the UI to test locally! (It saves securely to your browser's local storage).

## 🟢 Deployment (Netlify Drag and Drop)

This project is perfectly configured to be deployed via [Netlify Drop](https://app.netlify.com/drop) without using GitHub.

1. Drag and drop the entire `chatbot` folder into the Netlify Drop circle.
2. Once your site is live, click on **Site settings**.
3. Go to **Environment variables** on the left menu.
4. Click **Add a single variable**:
   - **Key:** `OPENROUTER_API_KEY`
   - **Value:** Your OpenRouter key (e.g., `sk-or-v1-...`)
5. Click **Create Variable**.
6. **Crucial Step:** Go back to the **Deploys** tab and scroll to the bottom. Drag and drop your `chatbot` folder into the box again. Netlify will reconnect the API Key into the backend serverless logic!

## 📁 Project Structure

```text
├── index.html        # Main HTML layout
├── style.css         # Custom CSS styling (Tokens, Glassmorphism)
├── app.js            # Core Frontend Logic (UI, API calls)
├── netlify/
│   └── functions/
│       └── chat.js   # Netlify Serverless Proxy (Hides API Key)
├── netlify.toml      # Netlify routing configuration (Proxy to Function)
├── .gitignore        # Blocks hidden keys from going to Git (optional)
├── .env              # Local API Key storage
└── README.md         # Documentation
```
