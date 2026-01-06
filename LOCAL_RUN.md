# 🚀 Running the Project Locally

## Quick Start

```bash
# Start the server
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

## Server URLs

Once running, the server will be available at:

- **Server:** http://localhost:8080
- **API Base:** http://localhost:8080/api
- **Widget:** http://localhost:8080/public/chatbot-widget.js
- **Health Check:** http://localhost:8080/health
- **Test Page:** http://localhost:8080/test
- **Demo Page:** http://localhost:8080/demo

## Environment Variables

Create a `.env` file in the root directory (optional - defaults will be used):

```env
PORT=8080
NODE_ENV=development
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-4
ALLOWED_ORIGINS=http://localhost:8080,http://localhost:3000
```

**Note:** If `.env` doesn't exist, the server will use defaults:
- Port: 8080
- Model: gpt-4
- Environment: development

## Testing the Widget Locally

### Option 1: Use the test pages served by the server

1. Start the server: `npm start`
2. Open in browser:
   - http://localhost:8080/test
   - http://localhost:8080/demo
   - http://localhost:8080/test-widget.html

### Option 2: Use standalone HTML file

1. Start the server: `npm start`
2. Open `standalone-test.html` in your browser
3. The widget should load from `http://localhost:8080`

### Option 3: Use the test server (for file:// protocol)

```bash
npm run serve-test
```

Then open: http://localhost:8000/standalone-test.html

## Stopping the Server

Press `Ctrl+C` in the terminal where the server is running.

## Troubleshooting

**Port already in use?**
```bash
# Kill process on port 8080
lsof -ti:8080 | xargs kill -9
```

**Server not starting?**
- Check if Node.js is installed: `node --version` (needs 18+)
- Install dependencies: `npm install`
- Check for errors in the console

**Widget not loading?**
- Make sure server is running
- Check browser console (F12) for errors
- Verify the widget URL is correct

