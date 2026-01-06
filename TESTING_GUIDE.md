# 🧪 Testing Guide - Exotic Estates Chatbot

Complete guide on how to test and use the chatbot.

## 📋 Prerequisites

1. **Node.js installed** (version 18+)
2. **OpenAI API Key** - Get one from [platform.openai.com](https://platform.openai.com/api-keys)
3. **Dependencies installed** - Run `npm install`

## 🚀 Step-by-Step Setup

### Step 1: Install Dependencies

```bash
cd exotic-state-chat-bot
npm install
```

### Step 2: Create .env File

Create a `.env` file in the root directory:

```env
PORT=3000
NODE_ENV=development
OPENAI_API_KEY=sk-your-actual-api-key-here
OPENAI_MODEL=gpt-4
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:5500
```

**⚠️ Important:** Replace `sk-your-actual-api-key-here` with your real OpenAI API key!

### Step 3: Start the Server

```bash
npm start
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

## 🎨 Testing Methods

### Method 1: Using the Example HTML File (Easiest)

1. **Start the server** (see Step 3 above)

2. **Open the example file:**
   - Option A: Double-click `example.html` in your file explorer
   - Option B: Right-click `example.html` → "Open with" → Your browser
   - Option C: Use a local server:
     ```bash
     # If you have Python installed
     python -m http.server 8000
     # Then visit http://localhost:8000/example.html
     ```

3. **You should see:**
   - A chat button in the bottom-right corner
   - Click it to open the chat window
   - Start chatting!

### Method 2: Create Your Own Test Page

Create a new HTML file (e.g., `test.html`):

```html
<!DOCTYPE html>
<html>
<head>
    <title>Chatbot Test</title>
</head>
<body>
    <h1>Test Page</h1>
    <p>Scroll down and look for the chat button in the bottom-right corner!</p>
    
    <!-- Chatbot Widget -->
    <script src="http://localhost:3000/public/chatbot-widget.js"
            data-api-url="http://localhost:3000/api"
            data-config='{"theme": "light", "position": "bottom-right"}'></script>
</body>
</html>
```

Open this file in your browser and the chatbot will appear!

### Method 3: Test via API (Command Line)

#### Test Health Endpoint
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{"status":"ok","timestamp":"2024-01-15T10:30:00.000Z"}
```

#### Test Chat API
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello! What properties are available in Maui?",
    "pageUrl": "https://www.exoticestates.com/destinations/hawaii/maui"
  }'
```

Expected response:
```json
{
  "response": "I'd be happy to help you find properties in Maui...",
  "conversationId": "conv_1234567890",
  "pageContext": {
    "url": "https://www.exoticestates.com/destinations/hawaii/maui",
    "pageType": "destination",
    "title": "Maui Vacation Rentals"
  }
}
```

#### Test Page Scraping
```bash
curl "http://localhost:3000/api/chat/context?url=https://www.exoticestates.com/destinations/hawaii/maui"
```

This will show you the scraped page context.

### Method 4: Test with Postman or Insomnia

1. **Create a new POST request**
   - URL: `http://localhost:3000/api/chat`
   - Method: `POST`
   - Headers: `Content-Type: application/json`
   - Body (JSON):
     ```json
     {
       "message": "Tell me about luxury villas in Cabo",
       "pageUrl": "https://www.exoticestates.com/destinations/mexico/cabo"
     }
     ```

2. **Send the request** and see the AI response!

## 🎯 How to Use the Chatbot

### In the UI (Widget):

1. **Open the chat** - Click the chat button (bottom-right corner)
2. **Type your question** - Ask anything about Exotic Estates properties
3. **Get instant responses** - The AI responds with context-aware answers
4. **Continue the conversation** - The chatbot remembers previous messages

### Example Questions to Try:

- "What properties are available in Maui?"
- "Tell me about luxury villas in Cabo"
- "I'm looking for a 4-bedroom villa in Hawaii"
- "What amenities do your properties have?"
- "What's the best destination for a family vacation?"
- "Tell me about properties near the beach"

### Features You'll Notice:

✅ **Context Awareness** - The chatbot knows what page you're on
✅ **Conversation Memory** - It remembers previous messages
✅ **Smart Responses** - Provides relevant, detailed answers
✅ **Professional UI** - Beautiful, modern chat interface

## 🔍 Testing Different Scenarios

### Test 1: Basic Chat
1. Open the chatbot
2. Type: "Hello"
3. Should get a friendly greeting

### Test 2: Property Questions
1. Ask: "What properties are in Maui?"
2. Should get information about Maui properties
3. Follow up: "Tell me more about one of them"
4. Should continue the conversation contextually

### Test 3: Page Context
1. Visit a property page URL in your test
2. Open chatbot
3. Ask: "Tell me about this property"
4. Should reference the current page

### Test 4: Navigation Persistence
1. Start a conversation
2. Navigate to a different page (in your test site)
3. Continue chatting
4. Conversation should persist

## 🐛 Troubleshooting

### Chatbot Not Appearing?

1. **Check server is running:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Check browser console (F12):**
   - Look for JavaScript errors
   - Check if script loaded: `Network` tab → Look for `chatbot-widget.js`

3. **Check CORS settings:**
   - Make sure your test page origin is in `ALLOWED_ORIGINS` in `.env`

4. **Check script URL:**
   - Verify the script src points to `http://localhost:3000/public/chatbot-widget.js`

### Getting API Errors?

1. **Check OpenAI API Key:**
   ```bash
   # Test if key is valid
   curl -X POST http://localhost:3000/api/chat/health
   ```

2. **Check server logs:**
   - Look at the terminal where server is running
   - Check for error messages

3. **Test API directly:**
   ```bash
   curl -X POST http://localhost:3000/api/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "test"}'
   ```

### Scraping Not Working?

1. **Test scraping endpoint:**
   ```bash
   curl "http://localhost:3000/api/chat/context?url=https://www.exoticestates.com"
   ```

2. **Check network connectivity:**
   - Server needs internet to scrape exoticestates.com

3. **Check timeout settings:**
   - Increase `SCRAPE_TIMEOUT` in `.env` if pages are slow

## 📊 Monitoring

### Check Service Stats

```bash
curl http://localhost:3000/api/chat/stats
```

Returns:
```json
{
  "conversations": {
    "totalConversations": 5,
    "ttl": 86400000
  },
  "cache": {
    "size": 3,
    "timeout": 3600000
  }
}
```

### Check Health

```bash
curl -X POST http://localhost:3000/api/chat/health
```

## 🎓 Next Steps

Once testing is successful:

1. **Deploy to production server**
2. **Update CORS origins** to your production domain
3. **Embed in your website** using the script tag
4. **Monitor performance** using the stats endpoint

## 💡 Pro Tips

- **Use browser DevTools** (F12) to see network requests and debug
- **Check server logs** in the terminal for detailed error messages
- **Test with different page URLs** to see context awareness in action
- **Try asking follow-up questions** to test conversation memory
- **Test on mobile** by resizing browser or using mobile emulation

---

Happy Testing! 🚀

