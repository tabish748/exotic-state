#!/bin/bash
# ============================================
# Fix EC2 Port Conflict - Run on EC2
# ============================================

echo "🔧 Fixing port 3001 conflict on EC2..."

# 1. Stop all PM2 processes
echo ""
echo "Step 1: Stopping all PM2 processes..."
pm2 stop all
pm2 delete all

# 2. Kill any processes using port 3001
echo ""
echo "Step 2: Killing processes on port 3001..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || echo "No processes found on port 3001"

# 3. Wait a moment
sleep 2

# 4. Check if port is free
echo ""
echo "Step 3: Checking if port 3001 is free..."
if lsof -i:3001 > /dev/null 2>&1; then
    echo "⚠️  Port 3001 is still in use. Trying again..."
    lsof -ti:3001 | xargs kill -9 2>/dev/null
    sleep 2
else
    echo "✅ Port 3001 is free"
fi

# 5. Start the server
echo ""
echo "Step 4: Starting server with PM2..."
cd ~/exotic-state
pm2 start server/index.js --name exotic-state

# 6. Save PM2 config
pm2 save

# 7. Check status
echo ""
echo "Step 5: Checking PM2 status..."
pm2 status

# 8. Show logs
echo ""
echo "Step 6: Recent logs..."
pm2 logs exotic-state --lines 20 --nostream

echo ""
echo "✅ Done! Server should be running now."

