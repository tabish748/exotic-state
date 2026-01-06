# ⚡ Quick Deploy Guide

## 🚀 Deploy to AWS in 5 Steps

### 1. Install EB CLI
```bash
pip install awsebcli
```

### 2. Initialize
```bash
cd exotic-state-chat-bot
eb init
# Select: Region, Node.js, Node.js 18
```

### 3. Create Environment
```bash
eb create exoticestates-chatbot-prod
```

### 4. Set Environment Variables
```bash
eb setenv \
  NODE_ENV=production \
  PORT=8080 \
  OPENAI_API_KEY=your-openai-api-key \
  OPENAI_MODEL=gpt-4 \
  ALLOWED_ORIGINS=https://www.exoticestates.com,https://exoticestates.com
```

### 5. Deploy
```bash
eb deploy
eb status  # Get your URL
```

## 📝 Script Tag for Client

Replace `YOUR-AWS-URL` with URL from `eb status`:

```html
<script src="https://YOUR-AWS-URL/public/chatbot-widget.js"
        data-api-url="https://YOUR-AWS-URL/api"
        data-config='{"theme": "light", "position": "bottom-right"}'></script>
```

## ✅ Test Before Sending to Client

1. Test health: `curl https://YOUR-AWS-URL/health`
2. Test widget: `curl https://YOUR-AWS-URL/public/chatbot-widget.js`
3. Test API: `curl -X POST https://YOUR-AWS-URL/api/chat/chat -H "Content-Type: application/json" -d '{"message":"Hello"}'`

Done! 🎉
