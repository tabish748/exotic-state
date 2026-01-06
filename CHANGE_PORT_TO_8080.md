# 🔧 Change Server Port to 8080

## On EC2 - Update .env File

```bash
# SSH into EC2
ssh ec2-user@16.16.128.91

# Go to project
cd ~/exotic-state

# Edit .env file
nano .env
```

## In .env file, change:

```env
PORT=8080
```

Or if PORT doesn't exist, add it:
```env
PORT=8080
NODE_ENV=production
OPENAI_API_KEY=your-key-here
# ... other variables
```

**Save:** Ctrl+X, then Y, then Enter

## Restart PM2

```bash
# Stop all processes first
pm2 stop all
pm2 delete all

# Kill any process on port 8080 (just in case)
lsof -ti:8080 | xargs kill -9 2>/dev/null || true

# Start server
pm2 start server/index.js --name exotic-state
pm2 save

# Check status
pm2 status
pm2 logs exotic-state --lines 30
```

## Update Script Tags

After changing port, update these files to use port 8080:

1. `standalone-test.html` - Change `3001` to `8080`
2. `test-widget.html` - Change `3001` to `8080`
3. `CLIENT_SCRIPT_TAG.txt` - Change `3001` to `8080`

## New URLs

- Server: `http://16.16.128.91:8080`
- Widget: `http://16.16.128.91:8080/public/chatbot-widget.js`
- API: `http://16.16.128.91:8080/api`

