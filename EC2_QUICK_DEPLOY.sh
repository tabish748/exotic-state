#!/bin/bash
# ============================================
# Quick EC2 Deployment Script
# Run this after git pull
# ============================================

echo "🚀 Starting EC2 Deployment..."

# Go to project directory
cd ~/exotic-state || { echo "❌ Directory not found!"; exit 1; }

# Pull latest code
echo ""
echo "📥 Pulling latest code..."
git pull

# Check if package.json changed
if git diff HEAD@{1} HEAD --name-only | grep -q package.json; then
    echo ""
    echo "📦 package.json changed, installing dependencies..."
    npm install
else
    echo ""
    echo "✅ No dependency changes"
fi

# Restart PM2
echo ""
echo "🔄 Restarting PM2..."
pm2 restart exotic-state

# Wait a moment
sleep 2

# Check status
echo ""
echo "📊 PM2 Status:"
pm2 status

echo ""
echo "📋 Recent Logs:"
pm2 logs exotic-state --lines 15 --nostream

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Server should be running at: http://16.16.128.91:3001"

