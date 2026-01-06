# 🚨 SIMPLE EC2 CORS FIX - Do This Now!

## Copy & Paste These Commands on EC2

```bash
# SSH into EC2
ssh ec2-user@16.16.128.91

# Run these commands:
cd ~/exotic-state

# 1. Update .env
sed -i '/^ALLOWED_ORIGINS=/d' .env
echo "ALLOWED_ORIGINS=https://www.exoticestates.com,https://exoticestates.com,file://,null" >> .env

# 2. Edit server/index.js
nano server/index.js
```

## In nano editor, find this section (around line 30):

```javascript
// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (config.cors.allowedOrigins.includes(origin) || config.server.isDevelopment) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
```

## Replace it with this:

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

**Save:** Ctrl+X, then Y, then Enter

## Then restart:

```bash
pm2 restart exotic-state
pm2 save
pm2 logs exotic-state --lines 20
```

## Test:

Open `test-widget-local.html` - should work now!

---

## Alternative: Test via HTTP Server (No EC2 Changes)

If you don't want to fix EC2 right now, use HTTP server:

```bash
# On your local machine
cd exotic-state-chat-bot
npm run serve-test

# Then open: http://localhost:8000/test-widget-local.html
```

This serves the file over HTTP, avoiding CORS issues!

