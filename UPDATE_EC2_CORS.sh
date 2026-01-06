#!/bin/bash
# ============================================
# Update CORS on EC2 to Allow File Testing
# Run this on your EC2 instance
# ============================================

echo "🔧 Updating CORS on EC2 to allow file:// testing..."

cd ~/exotic-state

# Backup current .env
if [ -f .env ]; then
    cp .env .env.backup
    echo "✅ Backed up .env to .env.backup"
fi

# Update or add ALLOWED_ORIGINS
if grep -q "ALLOWED_ORIGINS" .env; then
    # Update existing
    sed -i 's|ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=https://www.exoticestates.com,https://exoticestates.com,file://,null|' .env
    echo "✅ Updated ALLOWED_ORIGINS in .env"
else
    # Add new
    echo "ALLOWED_ORIGINS=https://www.exoticestates.com,https://exoticestates.com,file://,null" >> .env
    echo "✅ Added ALLOWED_ORIGINS to .env"
fi

# Also need to update server code to handle file://
echo ""
echo "📝 Note: You also need to update server/index.js on EC2"
echo "   Add file:// check in CORS configuration (see FIX_CORS_EC2.md)"

# Restart PM2
echo ""
echo "🔄 Restarting PM2..."
pm2 restart exotic-state

# Wait a moment
sleep 2

# Check status
echo ""
echo "📊 PM2 Status:"
pm2 list

echo ""
echo "📋 Recent Logs:"
pm2 logs exotic-state --lines 10 --nostream

echo ""
echo "✅ Done! CORS updated."
echo ""
echo "🧪 Test now:"
echo "   - Open test-widget.html in browser"
echo "   - Should work without CORS errors"

