# Exotic Estates AI Chatbot

A professional, context-aware AI chatbot for Exotic Estates luxury villa rental website. Features real-time page scraping, OpenAI integration, and seamless conversation persistence across page navigations.

## 🚀 Features

- **Real-Time Page Scraping**: Automatically scrapes and understands the current page context
- **OpenAI Integration**: Powered by GPT-4 for intelligent, context-aware responses
- **Conversation Persistence**: Maintains conversation history across page navigations
- **Context-Aware**: Understands property pages, destinations, guides, and blog posts
- **Professional UI**: Beautiful, responsive chat widget with modern design
- **Easy Integration**: Simple embed script - no complex setup required
- **Production Ready**: Includes error handling, rate limiting, caching, and security features

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

## 🛠️ Installation

1. **Clone or download the repository**

```bash
cd exotic-state-chat-bot
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# OpenAI Configuration (REQUIRED)
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-4

# CORS Configuration (comma-separated)
ALLOWED_ORIGINS=https://www.exoticestates.com,http://localhost:3000

# Scraping Configuration
SCRAPE_TIMEOUT=15000
USER_AGENT=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Cache Configuration
CONTEXT_CACHE_TTL_MS=3600000
```

4. **Start the server**

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## 📖 Usage

### Embedding the Chatbot Widget

#### Option 1: Simple HTML Embed

Add this script tag to your HTML page:

```html
<script src="http://your-server.com/public/chatbot-widget.js"
        data-api-url="http://your-server.com/api"
        data-config='{"theme": "light", "position": "bottom-right"}'></script>
```

#### Option 2: Vue.js Integration

```javascript
// In your Vue component or layout
mounted() {
  const script = document.createElement('script');
  script.src = 'http://your-server.com/public/chatbot-widget.js';
  script.setAttribute('data-api-url', 'http://your-server.com/api');
  script.setAttribute('data-config', JSON.stringify({
    theme: 'light',
    position: 'bottom-right',
    primaryColor: '#1a1a1a'
  }));
  document.body.appendChild(script);
}
```

#### Option 3: Next.js Integration

```javascript
// In _app.js or layout component
import { useEffect } from 'react';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = process.env.NEXT_PUBLIC_CHATBOT_URL || 'http://localhost:3000/public/chatbot-widget.js';
    script.setAttribute('data-api-url', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api');
    script.setAttribute('data-config', JSON.stringify({
      theme: 'light',
      position: 'bottom-right'
    }));
    document.body.appendChild(script);
    
    return () => {
      // Cleanup if needed
    };
  }, []);

  return <Component {...pageProps} />;
}
```

### Configuration Options

The chatbot can be configured via the `data-config` attribute:

```javascript
{
  "apiUrl": "http://your-server.com/api",        // API endpoint (required)
  "theme": "light",                              // "light" or "dark"
  "position": "bottom-right",                    // "bottom-right", "bottom-left", "top-right", "top-left"
  "primaryColor": "#1a1a1a",                     // Primary brand color
  "buttonText": "Chat with us",                  // Button text
  "buttonIcon": "💬",                            // Button icon/emoji
  "greetingMessage": "Hello! How can I help?",  // Initial greeting
  "enableContextAwareness": true,                // Enable page context scraping
  "storageKey": "exoticestates_chat"             // localStorage key
}
```

## 🔌 API Endpoints

### POST `/api/chat`

Send a chat message and get AI response.

**Request Body:**
```json
{
  "message": "What properties are available in Maui?",
  "conversationId": "conv_1234567890",  // Optional
  "pageUrl": "https://www.exoticestates.com/destinations/hawaii/maui"  // Optional
}
```

**Response:**
```json
{
  "response": "I'd be happy to help you find properties in Maui...",
  "conversationId": "conv_1234567890",
  "pageContext": {
    "url": "https://www.exoticestates.com/destinations/hawaii/maui",
    "pageType": "destination",
    "title": "Maui Vacation Rentals"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### GET `/api/chat/context?url=<page-url>`

Get page context (for testing/debugging).

### GET `/api/chat/conversation/:id`

Get conversation history by ID.

### DELETE `/api/chat/conversation/:id`

Delete a conversation.

### GET `/api/chat/stats`

Get service statistics.

### POST `/api/chat/health`

Health check endpoint.

## 🏗️ Project Structure

```
exotic-state-chat-bot/
├── server/
│   ├── index.js                 # Main Express server
│   ├── config/
│   │   └── config.js            # Configuration management
│   ├── routes/
│   │   └── chat.js              # Chat API routes
│   ├── services/
│   │   ├── scraper.js           # Page scraping service
│   │   ├── openai.js            # OpenAI integration
│   │   ├── context.js           # Context management
│   │   └── conversation.js      # Conversation management
│   └── utils/
│       └── helpers.js           # Utility functions
├── public/
│   └── chatbot-widget.js        # Frontend embeddable widget
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

## 🎯 How It Works

1. **Page Context Scraping**: When a user opens the chatbot, it automatically scrapes the current page to understand:
   - Page type (property, destination, guide, blog, etc.)
   - Property details (bedrooms, amenities, location, etc.)
   - Destination information
   - Page content and key points

2. **Context-Aware Responses**: The scraped context is included in the system prompt, allowing the AI to provide relevant, accurate responses based on what the user is viewing.

3. **Conversation Persistence**: Conversations are stored in localStorage and maintained across page navigations, with context updated automatically.

4. **Real-Time Scraping**: Each page is scraped in real-time to ensure the chatbot always has the latest information.

## 🔒 Security Features

- **Helmet.js**: Security headers
- **CORS**: Configurable origin restrictions
- **Rate Limiting**: Prevents abuse
- **Input Validation**: Sanitizes user input
- **Error Handling**: Graceful error handling without exposing sensitive information

## 🧪 Testing

### Test the Scraper

```bash
curl "http://localhost:3000/api/chat/context?url=https://www.exoticestates.com/destinations/hawaii/maui"
```

### Test the Chat API

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What properties are available in Maui?",
    "pageUrl": "https://www.exoticestates.com/destinations/hawaii/maui"
  }'
```

### Health Check

```bash
curl http://localhost:3000/health
```

## 🚀 Deployment

### Environment Variables for Production

Make sure to set:
- `NODE_ENV=production`
- `OPENAI_API_KEY` (your production API key)
- `ALLOWED_ORIGINS` (your production domain)
- `PORT` (your server port)

### Recommended Hosting

- **Heroku**: Easy deployment with environment variables
- **AWS EC2/Elastic Beanstalk**: Scalable option
- **DigitalOcean**: Simple VPS deployment
- **Railway**: Modern platform with easy setup
- **Render**: Free tier available

### CORS Configuration

Update `ALLOWED_ORIGINS` in your `.env` file to include your production domain:

```env
ALLOWED_ORIGINS=https://www.exoticestates.com,https://exoticestates.com
```

## 📝 Configuration Reference

### Server Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `NODE_ENV` | development | Environment mode |

### OpenAI Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | - | **Required** OpenAI API key |
| `OPENAI_MODEL` | gpt-4 | OpenAI model to use |

### Scraping Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `SCRAPE_TIMEOUT` | 15000 | Scraping timeout in ms |
| `USER_AGENT` | Mozilla/5.0... | User agent string |

### Rate Limiting

| Variable | Default | Description |
|----------|---------|-------------|
| `RATE_LIMIT_WINDOW_MS` | 900000 | Rate limit window (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | 100 | Max requests per window |

## 🐛 Troubleshooting

### Chatbot not appearing

- Check browser console for errors
- Verify the script URL is correct
- Ensure CORS is configured properly
- Check that the API server is running

### OpenAI API errors

- Verify your API key is correct
- Check your OpenAI account has sufficient credits
- Ensure the API key has proper permissions

### Scraping fails

- Check network connectivity
- Verify the target URL is accessible
- Check if the website structure has changed
- Review server logs for detailed error messages

## 📄 License

ISC

## 🤝 Support

For issues, questions, or contributions, please contact the development team.

## 🔄 Updates & Maintenance

- **Cache TTL**: Context cache expires after 1 hour (configurable)
- **Conversation TTL**: Conversations expire after 24 hours
- **Auto Cleanup**: Old conversations and expired cache are automatically cleaned up

---

Built with ❤️ for Exotic Estates

