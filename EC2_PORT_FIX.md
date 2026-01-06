# 🔧 EC2 Port Conflict Fix Guide

## Problem
Port 3001 (and possibly 3000, 3002) are already in use on your EC2 instance.

## Solution Options

### Option 1: Kill Existing Processes (Recommended)

```bash
# Check what's using the ports
sudo lsof -i :3000
sudo lsof -i :3001
sudo lsof -i :3002

# Or check PM2 processes
pm2 list

# Stop all PM2 processes
pm2 stop all
pm2 delete all

# Kill processes on specific ports
sudo kill -9 $(lsof -ti:3000) 2>/dev/null
sudo kill -9 $(lsof -ti:3001) 2>/dev/null
sudo kill -9 $(lsof -ti:3002) 2>/dev/null

# Then restart your app
pm2 start server/index.js --name exotic-state
```

### Option 2: Use a Different Port (Port 8080)

```bash
# Update your .env file or set environment variable
export PORT=8080

# Or in PM2:
PORT=8080 pm2 start server/index.js --name exotic-state

# Or update PM2 ecosystem (see below)
```

### Option 3: Use Port 80 (with Nginx reverse proxy)

If you have Nginx set up, use port 80 and configure Nginx to proxy to your app.

---

## Quick Fix Commands

### Step 1: Stop All PM2 Processes
```bash
pm2 stop all
pm2 delete all
```

### Step 2: Kill Processes on Ports
```bash
sudo fuser -k 3000/tcp
sudo fuser -k 3001/tcp
sudo fuser -k 3002/tcp
```

### Step 3: Use Port 8080 (Recommended for Production)
```bash
# Set PORT in environment
export PORT=8080

# Start with PM2
PORT=8080 pm2 start server/index.js --name exotic-state

# Save PM2 config
pm2 save
```

### Step 4: Verify
```bash
# Check if running
pm2 list

# Check logs
pm2 logs exotic-state

# Test health endpoint
curl http://localhost:8080/health
```

---

## Create PM2 Ecosystem File (Best Practice)

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'exotic-state',
    script: 'server/index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 8080
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
```

Then start with:
```bash
pm2 start ecosystem.config.js
pm2 save
```

---

## Update Nginx Config (If Using)

If you're using Nginx, update `/etc/nginx/sites-available/chatbot`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8080;  # Changed from 3000/3001/3002
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Then restart Nginx:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

## Recommended Solution

**Use Port 8080** (standard for production):

```bash
# 1. Stop everything
pm2 stop all
pm2 delete all

# 2. Kill port processes
sudo fuser -k 3000/tcp 3001/tcp 3002/tcp

# 3. Start on port 8080
PORT=8080 pm2 start server/index.js --name exotic-state

# 4. Save
pm2 save

# 5. Verify
pm2 logs exotic-state --lines 20
curl http://localhost:8080/health
```

---

## Troubleshooting

### Check What's Using Ports
```bash
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :3001
sudo netstat -tulpn | grep :3002
```

### Find and Kill Specific Process
```bash
# Find process ID
sudo lsof -i :3001

# Kill by PID
sudo kill -9 <PID>
```

### Check PM2 Status
```bash
pm2 list
pm2 info exotic-state
pm2 logs exotic-state
```

---

**After fixing, your app should run on port 8080 and be accessible!**

