# 🔧 Where to Add CORS Fix on EC2

## File: `server/index.js`
## Location: Around **line 30-45**

## Current Code (BEFORE fix):
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
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

## Updated Code (AFTER fix):
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

## Step-by-Step on EC2:

```bash
# 1. SSH into EC2
ssh ec2-user@16.16.128.91

# 2. Go to project
cd ~/exotic-state

# 3. Edit the file
nano server/index.js

# 4. Find line 33 (after "if (!origin) return callback(null, true);")
# 5. Add these 3 lines:
    // Allow file:// protocol for local testing
    if (origin.startsWith('file://') || origin === 'null') {
      return callback(null, true);
    }

# 6. Save: Ctrl+X, then Y, then Enter

# 7. Restart
pm2 restart exotic-state
```

## Visual Guide:

```
Line 29: // CORS configuration
Line 30: app.use(cors({
Line 31:   origin: (origin, callback) => {
Line 32:     // Allow requests with no origin (mobile apps, Postman, etc.)
Line 33:     if (!origin) return callback(null, true);
Line 34:     
Line 35:     ← ADD THE 3 LINES HERE ←
Line 36:     
Line 37:     if (config.cors.allowedOrigins.includes(origin) || ...
```

