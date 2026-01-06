#!/bin/bash
# ============================================
# EC2 Port Fix Script
# Run this on your EC2 instance
# ============================================

echo "🔧 Fixing port conflict on EC2..."

# Step 1: Stop all PM2 processes
echo "Step 1: Stopping all PM2 processes..."
pm2 stop all
pm2 delete all

# Step 2: Kill processes on ports
echo "Step 2: Killing processes on ports 3000, 3001, 3002..."
sudo fuser -k 3000/tcp 2>/dev/null || true
sudo fuser -k 3001/tcp 2>/dev/null || true
sudo fuser -k 3002/tcp 2>/dev/null || true
sudo fuser -k 8080/tcp 2>/dev/null || true

# Step 3: Check if .env file exists and update PORT
echo "Step 3: Checking .env file..."
cd ~/exotic-state

if [ -f .env ]; then
    echo "Found .env file, updating PORT to 8080..."
    # Remove old PORT line and add new one
    sed -i '/^PORT=/d' .env
    echo "PORT=8080" >> .env
else
    echo "Creating .env file with PORT=8080..."
    echo "PORT=8080" > .env
    echo "NODE_ENV=production" >> .env
fi

# Step 4: Start app with explicit PORT
echo "Step 4: Starting app on port 8080..."
PORT=8080 pm2 start server/index.js --name exotic-state --update-env

# Step 5: Save PM2 config
echo "Step 5: Saving PM2 configuration..."
pm2 save

# Step 6: Wait a moment
sleep 2

# Step 7: Check status
echo ""
echo "Step 6: Checking status..."
pm2 list

echo ""
echo "Step 7: Recent logs..."
pm2 logs exotic-state --lines 10 --nostream

echo ""
echo "Step 8: Testing health endpoint..."
curl -s http://localhost:8080/health || echo "❌ Health check failed"

echo ""
echo "✅ Done! Check the output above."
echo ""
echo "If still having issues, check:"
echo "  - pm2 logs exotic-state"
echo "  - cat .env"
echo "  - sudo netstat -tulpn | grep 8080"

