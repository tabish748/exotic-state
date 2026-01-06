# 🔧 Fix CORS for File Testing on EC2

## Problem
When testing with `file://` protocol (local HTML file), you get CORS error:
```
ERR_BLOCKED_BY_RESPONSE.NotSameOrigin
```

## Solution: Update CORS on EC2

### Option 1: Update .env File (Recommended)

SSH into your EC2 instance and update the `.env` file:

```bash
# SSH into EC2
ssh ec2-user@16.16.128.91

# Go to project directory
cd ~/exotic-state

# Edit .env file
nano .env

# Add or update ALLOWED_ORIGINS to include file:// and null:
ALLOWED_ORIGINS=https://www.exoticestates.com,https://exoticestates.com,file://,null

# Save and exit (Ctrl+X, then Y, then Enter)

# Restart PM2
pm2 restart exotic-state

# Check logs
pm2 logs exotic-state --lines 20
```

### Option 2: Use Environment Variable

```bash
# On EC2
cd ~/exotic-state

# Set environment variable
export ALLOWED_ORIGINS="https://www.exoticestates.com,https://exoticestates.com,file://,null"

# Restart with new env
ALLOWED_ORIGINS="https://www.exoticestates.com,https://exoticestates.com,file://,null" pm2 restart exotic-state --update-env

# Save
pm2 save
```

### Option 3: Use Local HTTP Server (Better for Testing)

Instead of opening the file directly, serve it via HTTP:

```bash
# On your local machine
cd exotic-state-chat-bot

# Start test server
npm run serve-test

# Or manually:
node serve-test-page.js
```

Then open: **http://localhost:8000/test-widget.html**

This avoids CORS issues completely!

---

## Quick Fix Commands (Copy & Paste)

```bash
# On EC2
cd ~/exotic-state
echo "ALLOWED_ORIGINS=https://www.exoticestates.com,https://exoticestates.com,file://,null" >> .env
pm2 restart exotic-state
pm2 logs exotic-state --lines 10
```

---

## Verify It Works

After updating CORS:

1. **Test from local file:**
   - Open `test-widget.html` in browser
   - Should load without CORS errors

2. **Test from HTTP server:**
   ```bash
   npm run serve-test
   # Open http://localhost:8000/test-widget.html
   ```

3. **Check browser console:**
   - Should see: `✅ Chatbot widget initialized successfully!`
   - No CORS errors

---

## Security Note

⚠️ **For Production:** Remove `file://` and `null` from ALLOWED_ORIGINS after testing. Only keep actual domains.

```bash
# Production .env should have:
ALLOWED_ORIGINS=https://www.exoticestates.com,https://exoticestates.com
```

---

**After fixing, your test file should work!**

