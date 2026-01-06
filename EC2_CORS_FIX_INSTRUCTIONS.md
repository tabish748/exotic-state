# 🔧 Fix CORS on EC2 - Step by Step

## Problem
Getting `ERR_BLOCKED_BY_RESPONSE.NotSameOrigin` when testing with `file://` protocol.

## Solution: Update EC2 Server

### Step 1: SSH into EC2

```bash
ssh ec2-user@16.16.128.91
```

### Step 2: Update Server Code

```bash
cd ~/exotic-state

# Edit server/index.js
nano server/index.js
```

Find the CORS configuration (around line 30) and update it to:

```javascript
// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, file://, etc.)
    if (!origin) return callback(null, true);
    
    // Allow file:// protocol for local testing
    if (origin.startsWith('file://') || origin === 'null') {
      return callback(null, true);
    }
    
    if (config.cors.allowedOrigins.includes(origin) || config.server.isDevelopment) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

Save and exit (Ctrl+X, Y, Enter)

### Step 3: Update .env File

```bash
# Edit .env
nano .env

# Add or update ALLOWED_ORIGINS:
ALLOWED_ORIGINS=https://www.exoticestates.com,https://exoticestates.com,file://,null
```

Save and exit

### Step 4: Restart PM2

```bash
pm2 restart exotic-state
pm2 save
```

### Step 5: Verify

```bash
# Check logs
pm2 logs exotic-state --lines 20

# Test health
curl http://localhost:3001/health
```

### Step 6: Test

Now open `test-widget.html` in your browser - it should work!

---

## Quick One-Liner Fix

Or use the script I created:

```bash
# On EC2
cd ~/exotic-state
bash UPDATE_EC2_CORS.sh
```

(But you still need to update server/index.js manually)

---

## Alternative: Test with Local Server (No EC2 Changes Needed)

Instead of fixing EC2 CORS, you can test locally:

```bash
# On your local machine
cd exotic-state-chat-bot

# Make sure local server is running
npm start  # Runs on port 3002

# Open test-widget-local.html in browser
# It uses localhost:3002 instead of EC2
```

This avoids CORS issues completely!

---

## After Testing

**Important:** Remove `file://` and `null` from ALLOWED_ORIGINS for production security:

```bash
# On EC2
nano .env

# Change to:
ALLOWED_ORIGINS=https://www.exoticestates.com,https://exoticestates.com

# Restart
pm2 restart exotic-state
```

---

**The local server test should work right now!** Open `test-widget-local.html` to test without EC2 changes.

