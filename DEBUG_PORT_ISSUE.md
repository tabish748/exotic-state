# 🔍 Debug Port 3001 Issue

## The Problem
Even though `.env` has `PORT=8080`, the server is still trying to use port 3001.

## Possible Causes

1. **.env file not being read** - dotenv might not be finding the file
2. **Multiple PM2 instances** - Old instances still running
3. **Cached process** - PM2 might be using cached code
4. **Wrong .env file location** - File might be in wrong directory

## Debug Steps on EC2

### Step 1: Verify .env file exists and has correct value

```bash
cd ~/exotic-state
cat .env | grep PORT
```

Should show: `PORT=8080`

### Step 2: Check if .env is in the right location

```bash
cd ~/exotic-state
pwd
ls -la .env
```

The `.env` file should be in `~/exotic-state/.env` (same directory as `server/`)

### Step 3: Check for multiple Node processes

```bash
# Check all node processes
ps aux | grep node

# Check what's using port 3001
lsof -i:3001

# Check what's using port 8080
lsof -i:8080
```

### Step 4: Verify dotenv is loading correctly

Add this temporary debug line to `server/config/config.js`:

```javascript
import dotenv from 'dotenv';

// Debug: Check if .env is loaded
const result = dotenv.config();
console.log('🔍 [DEBUG] dotenv result:', result);
console.log('🔍 [DEBUG] process.env.PORT:', process.env.PORT);
console.log('🔍 [DEBUG] Current working directory:', process.cwd());

export const config = {
  server: {
    port: parseInt(process.env.PORT) || 3000,
    // ...
```

### Step 5: Complete Clean Restart

```bash
# 1. Stop everything
pm2 stop all
pm2 delete all
pm2 kill

# 2. Kill all node processes
pkill -f node

# 3. Kill processes on ports
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:8080 | xargs kill -9 2>/dev/null || true

# 4. Wait
sleep 3

# 5. Verify .env
cd ~/exotic-state
cat .env
echo ""
echo "PORT value: $(grep ^PORT= .env)"

# 6. Start fresh
pm2 start server/index.js --name exotic-state
pm2 save

# 7. Check logs immediately
pm2 logs exotic-state --lines 50
```

### Step 6: Check if there are multiple .env files

```bash
find ~/exotic-state -name ".env*" -type f
```

### Step 7: Verify the actual port being used

```bash
# Check what port the server is actually trying to use
pm2 logs exotic-state | grep "port"
```

## Quick Fix Script

```bash
cd ~/exotic-state

# Make absolutely sure .env has PORT=8080
echo "PORT=8080" > .env.tmp
grep -v "^PORT=" .env >> .env.tmp 2>/dev/null || true
mv .env.tmp .env

# Verify
cat .env | head -5

# Nuclear option - kill everything
pm2 kill
pkill -f node
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
sleep 3

# Start fresh
pm2 start server/index.js --name exotic-state
pm2 save
pm2 logs exotic-state --lines 50
```

