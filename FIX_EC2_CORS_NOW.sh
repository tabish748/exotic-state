#!/bin/bash
# ============================================
# COMPLETE EC2 CORS FIX
# Copy and paste these commands on EC2
# ============================================

echo "🔧 Fixing CORS on EC2..."

cd ~/exotic-state

# Step 1: Update .env file
echo ""
echo "Step 1: Updating .env file..."
if [ -f .env ]; then
    # Remove old ALLOWED_ORIGINS line
    sed -i '/^ALLOWED_ORIGINS=/d' .env
    # Add new one
    echo "ALLOWED_ORIGINS=https://www.exoticestates.com,https://exoticestates.com,file://,null" >> .env
    echo "✅ Updated .env"
else
    echo "ALLOWED_ORIGINS=https://www.exoticestates.com,https://exoticestates.com,file://,null" > .env
    echo "✅ Created .env"
fi

# Step 2: Update server/index.js
echo ""
echo "Step 2: Updating server/index.js CORS configuration..."

# Check if file:// check already exists
if grep -q "origin.startsWith('file://')" server/index.js; then
    echo "✅ CORS already updated in server/index.js"
else
    echo "⚠️  Need to manually update server/index.js"
    echo "   Add file:// check in CORS origin function"
    echo "   See EC2_CORS_FIX_INSTRUCTIONS.md for details"
fi

# Step 3: Restart PM2
echo ""
echo "Step 3: Restarting PM2..."
pm2 restart exotic-state
pm2 save

# Step 4: Wait and check
sleep 3

echo ""
echo "Step 4: Checking status..."
pm2 list

echo ""
echo "Step 5: Recent logs..."
pm2 logs exotic-state --lines 15 --nostream

echo ""
echo "✅ Done!"
echo ""
echo "🧪 Now test:"
echo "   1. Open test-widget.html in browser"
echo "   2. Should work without CORS errors"
echo ""
echo "📝 If still having issues, check:"
echo "   - pm2 logs exotic-state"
echo "   - Make sure server/index.js has file:// check"

