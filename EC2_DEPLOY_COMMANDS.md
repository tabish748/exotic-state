# 🚀 EC2 Deployment Commands

## Quick Deploy After Git Pull

```bash
# 1. SSH into EC2
ssh ec2-user@16.16.128.91

# 2. Go to project directory
cd ~/exotic-state

# 3. Pull latest code
git pull

# 4. Install/update dependencies (if package.json changed)
npm install

# 5. Restart PM2
pm2 restart exotic-state

# 6. Check status
pm2 status
pm2 logs exotic-state --lines 20
```

## Full Deployment (First Time or After Major Changes)

```bash
# 1. SSH into EC2
ssh ec2-user@16.16.128.91

# 2. Go to project directory
cd ~/exotic-state

# 3. Pull latest code
git pull

# 4. Install dependencies
npm install

# 5. Make sure .env file exists and has correct values
# (Don't overwrite if it already exists)
if [ ! -f .env ]; then
    cp .env.example .env
    nano .env  # Edit with your API keys
fi

# 6. Stop old process (if exists)
pm2 stop exotic-state || true
pm2 delete exotic-state || true

# 7. Start with PM2
pm2 start server/index.js --name exotic-state

# 8. Save PM2 configuration
pm2 save

# 9. Setup PM2 to start on boot
pm2 startup
# (Follow the command it outputs)

# 10. Check status
pm2 status
pm2 logs exotic-state --lines 30
```

## Quick Restart (No Code Changes)

```bash
pm2 restart exotic-state
pm2 logs exotic-state --lines 20
```

## View Logs

```bash
# Real-time logs
pm2 logs exotic-state

# Last 50 lines
pm2 logs exotic-state --lines 50

# Error logs only
pm2 logs exotic-state --err --lines 50
```

## Stop/Start

```bash
# Stop
pm2 stop exotic-state

# Start
pm2 start exotic-state

# Restart
pm2 restart exotic-state
```

## Check Server Status

```bash
# PM2 status
pm2 status

# Check if port is listening
netstat -tuln | grep 3001

# Or
lsof -i :3001

# Test API endpoint
curl http://localhost:3001/api/chat/health
```

## Environment Variables

```bash
# Edit .env file
nano .env

# After editing .env, restart PM2
pm2 restart exotic-state
```

## Troubleshooting

```bash
# If port is in use
lsof -i :3001
kill -9 <PID>

# If PM2 process is stuck
pm2 kill
pm2 start server/index.js --name exotic-state
pm2 save

# Check Node version
node --version

# Check if dependencies are installed
ls node_modules
```

