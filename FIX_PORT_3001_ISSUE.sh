#!/bin/bash
# ============================================
# Complete Fix for Port 3001 Issue
# Run this on EC2
# ============================================

echo "🔧 Fixing port 3001 conflict issue..."

cd ~/exotic-state || { echo "❌ Directory not found!"; exit 1; }

# 1. Verify and fix .env file
echo ""
echo "Step 1: Fixing .env file..."
if [ -f .env ]; then
    # Remove any PORT line
    grep -v "^PORT=" .env > .env.tmp
    # Add PORT=8080 at the top
    echo "PORT=8080" > .env
    cat .env.tmp >> .env
    rm .env.tmp
    echo "✅ Updated .env file"
else
    echo "PORT=8080" > .env
    echo "NODE_ENV=production" >> .env
    echo "⚠️  Created .env file - please add OPENAI_API_KEY!"
fi

# Show what's in .env
echo ""
echo "Current .env PORT setting:"
grep "^PORT=" .env || echo "⚠️  PORT not found!"

# 2. Nuclear option - kill everything
echo ""
echo "Step 2: Killing all processes..."
pm2 kill 2>/dev/null || true
pkill -f node 2>/dev/null || true
pkill -f "server/index.js" 2>/dev/null || true

# 3. Kill processes on ports
echo ""
echo "Step 3: Clearing ports..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || echo "Port 3001 cleared"
lsof -ti:8080 | xargs kill -9 2>/dev/null || echo "Port 8080 cleared"

# 4. Wait
echo ""
echo "Step 4: Waiting for processes to die..."
sleep 5

# 5. Verify ports are free
echo ""
echo "Step 5: Verifying ports are free..."
if lsof -i:3001 > /dev/null 2>&1; then
    echo "❌ Port 3001 is STILL in use!"
    lsof -i:3001
    echo "Trying to kill again..."
    lsof -ti:3001 | xargs kill -9 2>/dev/null
    sleep 2
else
    echo "✅ Port 3001 is free"
fi

if lsof -i:8080 > /dev/null 2>&1; then
    echo "⚠️  Port 8080 is in use"
    lsof -i:8080
else
    echo "✅ Port 8080 is free"
fi

# 6. Check for any remaining node processes
echo ""
echo "Step 6: Checking for remaining node processes..."
NODE_PROCS=$(ps aux | grep -E "node|server/index.js" | grep -v grep | wc -l)
if [ "$NODE_PROCS" -gt 0 ]; then
    echo "⚠️  Found $NODE_PROCS node processes still running:"
    ps aux | grep -E "node|server/index.js" | grep -v grep
    echo "Killing them..."
    pkill -9 -f node
    sleep 2
else
    echo "✅ No node processes running"
fi

# 7. Start server
echo ""
echo "Step 7: Starting server..."
echo "Current directory: $(pwd)"
echo "PORT from .env: $(grep ^PORT= .env)"
pm2 start server/index.js --name exotic-state
pm2 save

# 8. Wait
sleep 3

# 9. Check status
echo ""
echo "Step 8: PM2 Status..."
pm2 status

# 10. Show logs
echo ""
echo "Step 9: Recent logs (check for port number)..."
pm2 logs exotic-state --lines 50 --nostream | grep -E "port|PORT|8080|3001" || pm2 logs exotic-state --lines 20 --nostream

echo ""
echo "✅ Done!"
echo ""
echo "🔍 Check the logs above - it should say 'port 8080'"
echo "If it still says 'port 3001', the .env file might not be loading correctly."

