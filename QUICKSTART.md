# 🚀 Quick Start Guide

Get the Exotic Estates Chatbot up and running in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Environment

Create a `.env` file in the root directory:

```env
PORT=3000
NODE_ENV=development
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-4
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

**Important:** Replace `your-openai-api-key-here` with your actual OpenAI API key from [platform.openai.com](https://platform.openai.com/api-keys)

## Step 3: Start the Server

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

You should see:
```
🚀 Exotic Estates Chatbot Server
================================
📍 Server running on port 3000
🌍 Environment: development
🤖 OpenAI Model: gpt-4
🔗 API Base URL: http://localhost:3000/api
📦 Widget URL: http://localhost:3000/public/chatbot-widget.js
================================
```

## Step 4: Test the Chatbot

### Option A: Use the Example HTML File

Open `example.html` in your browser (make sure the server is running).

### Option B: Embed in Your Website

Add this to any HTML page:

```html
<script src="http://localhost:3000/public/chatbot-widget.js"
        data-api-url="http://localhost:3000/api"
        data-config='{"theme": "light", "position": "bottom-right"}'></script>
```

## Step 5: Test the API

```bash
# Test health endpoint
curl http://localhost:3000/health

# Test chat endpoint
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello!",
    "pageUrl": "https://www.exoticestates.com/destinations/hawaii/maui"
  }'
```

## ✅ You're Done!

The chatbot should now be working. Try asking it questions about properties, destinations, or anything related to Exotic Estates!

## 🐛 Troubleshooting

**Chatbot not appearing?**
- Check browser console (F12) for errors
- Verify server is running on port 3000
- Check CORS settings in `.env`

**OpenAI errors?**
- Verify your API key is correct
- Check you have credits in your OpenAI account
- Ensure the API key has proper permissions

**Need help?**
- Check the full [README.md](./README.md) for detailed documentation
- Review server logs for error messages

