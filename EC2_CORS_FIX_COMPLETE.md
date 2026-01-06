# 🔧 Complete EC2 CORS Fix - Copy & Paste

## ⚠️ IMPORTANT: Fix CORS on EC2 First!

Before testing with `test-widget-local.html`, you MUST fix CORS on EC2.

---

## 🚀 Quick Fix (Copy & Paste on EC2)

SSH into your EC2 instance and run these commands:

```bash
# SSH into EC2
ssh ec2-user@16.16.128.91

# Go to project directory
cd ~/exotic-state

# Step 1: Update .env file
echo "ALLOWED_ORIGINS=https://www.exoticestates.com,https://exoticestates.com,file://,null" >> .env

# Step 2: Update server/index.js CORS configuration
# Edit the file
nano server/index.js

# Find the CORS section (around line 30) and replace it with:
```

**Replace this CORS code in server/index.js:**

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

**After editing:**
- Save: Ctrl+X, then Y, then Enter

**Step 3: Restart PM2**

```bash
# Restart the application
pm2 restart exotic-state

# Save PM2 configuration
pm2 save

# Check status
pm2 list

# View logs to verify
pm2 logs exotic-state --lines 20
```

---

## ✅ Verify It's Fixed

After updating, test:

```bash
# On EC2, test health
curl http://localhost:3001/health

# Should return: {"status":"ok"}
```

Then on your local machine:

1. Open `test-widget-local.html` in browser
2. Should load without CORS errors
3. Chat button should appear in bottom-right

---

## 📝 What Changed

1. **server/index.js**: Added check for `file://` and `null` origins
2. **.env file**: Added `file://,null` to ALLOWED_ORIGINS

This allows:
- ✅ Testing with `file://` protocol (local HTML files)
- ✅ Testing from browser console injection
- ✅ Still secure for production (can remove `file://` later)

---

## 🔒 After Testing (Production)

Once testing is complete, remove `file://` and `null` for security:

```bash
# On EC2
cd ~/exotic-state
nano .env

# Change to:
ALLOWED_ORIGINS=https://www.exoticestates.com,https://exoticestates.com

# Restart
pm2 restart exotic-state
```

---

**After fixing CORS on EC2, `test-widget-local.html` will work with the live server!**

