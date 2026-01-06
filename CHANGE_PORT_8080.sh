#!/bin/bash
# ============================================
# Change Server Port to 8080 - Run on EC2
# ============================================

echo "🔧 Changing server port to 8080..."

cd ~/exotic-state || { echo "❌ Directory not found!"; exit 1; }

# 1. Update .env file
echo ""
echo "Step 1: Updating .env file..."
if [ -f .env ]; then
    # Remove old PORT line if exists
    sed -i '/^PORT=/d' .env
    # Add new PORT
    echo "PORT=8080" >> .env
    echo "✅ Updated .env file"
else
    echo "⚠️  .env file not found, creating it..."
    echo "PORT=8080" > .env
    echo "NODE_ENV=production" >> .env
    echo "⚠️  Please add your OPENAI_API_KEY to .env file!"
fi

# 2. Stop all PM2 processes
echo ""
echo "Step 2: Stopping all PM2 processes..."
pm2 stop all
pm2 delete all

# 3. Kill any process on port 8080
echo ""
echo "Step 3: Clearing port 8080..."
lsof -ti:8080 | xargs kill -9 2>/dev/null || echo "Port 8080 is free"

# 4. Wait
sleep 2

# 5. Start server
echo ""
echo "Step 4: Starting server on port 8080..."
pm2 start server/index.js --name exotic-state
pm2 save

# 6. Check status
echo ""
echo "Step 5: Checking status..."
pm2 status

# 7. Show logs
echo ""
echo "Step 6: Recent logs..."
pm2 logs exotic-state --lines 20 --nostream

echo ""
echo "✅ Done! Server should be running on port 8080"
echo ""
echo "🌐 URLs:"
echo "  - Server: http://16.16.128.91:8080"
echo "  - Widget: http://16.16.128.91:8080/public/chatbot-widget.js"
echo "  - API: http://16.16.128.91:8080/api"

