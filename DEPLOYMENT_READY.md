# 🚀 Deployment Ready - Quick Start Guide

Your chatbot is ready for AWS deployment! Follow these steps:

---

## 📦 Step 1: Prepare for Deployment

### Files Already Created:
- ✅ `Procfile` - For Elastic Beanstalk
- ✅ `.ebignore` - Files to exclude from deployment
- ✅ Code is production-ready

### What You Need:
- AWS Account
- OpenAI API Key
- Client's domain (for CORS)

---

## 🚀 Step 2: Deploy to AWS Elastic Beanstalk (Recommended)

### Install EB CLI

```bash
pip install awsebcli
```

### Initialize and Deploy

```bash
cd exotic-state-chat-bot

# Initialize Elastic Beanstalk
eb init

# Follow prompts:
# - Select region (e.g., us-east-1)
# - Platform: Node.js
# - Platform version: Node.js 18 or 20
# - Setup SSH: Yes (optional)

# Create production environment
eb create exoticestates-chatbot-prod

# Set environment variables (REPLACE WITH YOUR VALUES)
eb setenv \
  NODE_ENV=production \
  PORT=8080 \
  OPENAI_API_KEY=your-openai-api-key-here \
  OPENAI_MODEL=gpt-4 \
  ALLOWED_ORIGINS=https://www.exoticestates.com,https://exoticestates.com \
  SCRAPE_TIMEOUT=15000 \
  RATE_LIMIT_WINDOW_MS=900000 \
  RATE_LIMIT_MAX_REQUESTS=100 \
  CONTEXT_CACHE_TTL_MS=3600000

# Deploy
eb deploy

# Get your URL
eb status
```

### You'll Get a URL Like:
```
https://exoticestates-chatbot-prod.us-east-1.elasticbeanstalk.com
```

---

## ✅ Step 3: Test Your Deployment

### Test Health Endpoint
```bash
curl https://your-eb-url.elasticbeanstalk.com/health
# Should return: {"status":"ok"}
```

### Test Widget Script
```bash
curl https://your-eb-url.elasticbeanstalk.com/public/chatbot-widget.js
# Should return JavaScript code
```

### Test API
```bash
curl -X POST https://your-eb-url.elasticbeanstalk.com/api/chat/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello"}'
# Should return AI response
```

---

## 📝 Step 4: Script Tag for Client

Once deployed, provide your client with this script tag:

**Replace `YOUR-AWS-URL` with your actual Elastic Beanstalk URL**

```html
<script src="https://YOUR-AWS-URL/public/chatbot-widget.js"
        data-api-url="https://YOUR-AWS-URL/api"
        data-config='{"theme": "light", "position": "bottom-right"}'></script>
```

### Example (with actual URL):
```html
<script src="https://exoticestates-chatbot-prod.us-east-1.elasticbeanstalk.com/public/chatbot-widget.js"
        data-api-url="https://exoticestates-chatbot-prod.us-east-1.elasticbeanstalk.com/api"
        data-config='{"theme": "light", "position": "bottom-right"}'></script>
```

---

## 🔧 Step 5: Update CORS (Important!)

Make sure the client's domain is in ALLOWED_ORIGINS:

```bash
eb setenv ALLOWED_ORIGINS=https://www.exoticestates.com,https://exoticestates.com
```

If you need to add more domains later:
```bash
eb setenv ALLOWED_ORIGINS=https://www.exoticestates.com,https://exoticestates.com,https://another-domain.com
```

---

## 🧪 Step 6: Test on Client's Website

1. Add the script tag to a test page on client's website
2. Open the page in browser
3. Check browser console (F12) - should see: `[Chatbot] Initializing...`
4. Look for chat button in bottom-right corner
5. Click button and test chat

---

## 📋 Deployment Checklist

- [ ] EB CLI installed
- [ ] `eb init` completed
- [ ] Environment created with `eb create`
- [ ] Environment variables set (especially OPENAI_API_KEY and ALLOWED_ORIGINS)
- [ ] `eb deploy` successful
- [ ] Got AWS URL from `eb status`
- [ ] Health endpoint works
- [ ] Widget script accessible
- [ ] API endpoint works
- [ ] CORS configured for client domain
- [ ] Tested script tag on test page

---

## 🔄 Updating After Deployment

```bash
# Make code changes locally
# Then deploy:
eb deploy

# View logs:
eb logs

# Check status:
eb status
```

---

## 🆘 Troubleshooting

### Widget Not Loading
- Check CORS settings
- Verify script URL is correct
- Check browser console for errors

### API Errors
- Verify OPENAI_API_KEY is set correctly
- Check `eb logs` for errors
- Verify environment variables

### CORS Errors
- Make sure client domain is in ALLOWED_ORIGINS
- Update with: `eb setenv ALLOWED_ORIGINS=...`

---

## 📞 Next Steps

1. Deploy to AWS using steps above
2. Get your AWS URL
3. Test all endpoints
4. Provide script tag to client
5. Client adds script tag to their website
6. Test on client's website
7. Done! 🎉

---

**Ready to deploy!** Follow Step 2 to get started.
