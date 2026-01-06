#!/bin/bash
# ============================================
# IMMEDIATE EC2 CORS FIX
# Copy and paste ALL of this on EC2
# ============================================

echo "🔧 Fixing CORS on EC2 - This will fix the file:// error..."

cd ~/exotic-state

# Step 1: Backup
echo ""
echo "Step 1: Backing up files..."
cp server/index.js server/index.js.backup
if [ -f .env ]; then
    cp .env .env.backup
fi
echo "✅ Backups created"

# Step 2: Update .env
echo ""
echo "Step 2: Updating .env file..."
# Remove old ALLOWED_ORIGINS if exists
sed -i '/^ALLOWED_ORIGINS=/d' .env 2>/dev/null || true
# Add new one
echo "ALLOWED_ORIGINS=https://www.exoticestates.com,https://exoticestates.com,file://,null" >> .env
echo "✅ .env updated"

# Step 3: Update server/index.js CORS
echo ""
echo "Step 3: Updating server/index.js CORS configuration..."

# Create a temporary file with the new CORS code
cat > /tmp/new_cors.js << 'CORSCODE'
// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, file://, etc.)
    if (!origin) return callback(null, true);
    
    // Allow file:// protocol for local testing
    if (origin.startsWith('file://') || origin === 'null') {
      return callback(null, true);
    }
    
    if (config.cors.allowedOrigins.includes(origin) || config.server.isDevelopment) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
CORSCODE

# Find and replace the CORS section in server/index.js
# This is a bit tricky, so we'll use sed to replace the entire CORS block
# First, let's create a Python script to do this more reliably
python3 << 'PYTHONSCRIPT'
import re

# Read the file
with open('server/index.js', 'r') as f:
    content = f.read()

# New CORS code
new_cors = """// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, file://, etc.)
    if (!origin) return callback(null, true);
    
    // Allow file:// protocol for local testing
    if (origin.startsWith('file://') || origin === 'null') {
      return callback(null, true);
    }
    
    if (config.cors.allowedOrigins.includes(origin) || config.server.isDevelopment) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));"""

# Pattern to match the CORS configuration block
pattern = r'// CORS configuration\s+app\.use\(cors\(\{[^}]+\}\)\);'

# Replace
new_content = re.sub(pattern, new_cors, content, flags=re.DOTALL)

# If pattern didn't match, try a simpler approach - find the line and replace the whole block
if new_content == content:
    # Find the line with "// CORS configuration"
    lines = content.split('\n')
    new_lines = []
    skip_until_close = False
    brace_count = 0
    
    for i, line in enumerate(lines):
        if '// CORS configuration' in line:
            # Replace from here
            new_lines.append(new_cors)
            skip_until_close = True
            brace_count = 0
            continue
        elif skip_until_close:
            # Count braces to know when to stop skipping
            brace_count += line.count('{') - line.count('}')
            if '});' in line and brace_count <= 0:
                skip_until_close = False
            continue
        else:
            new_lines.append(line)
    
    new_content = '\n'.join(new_lines)

# Write back
with open('server/index.js', 'w') as f:
    f.write(new_content)

print("✅ server/index.js updated")
PYTHONSCRIPT

if [ $? -eq 0 ]; then
    echo "✅ server/index.js CORS updated"
else
    echo "⚠️  Python update failed, trying manual method..."
    # Manual method - use sed
    # This is a fallback
    echo "⚠️  Please manually update server/index.js - see EC2_CORS_FIX_COMPLETE.md"
fi

# Step 4: Restart PM2
echo ""
echo "Step 4: Restarting PM2..."
pm2 restart exotic-state
pm2 save

# Wait
sleep 3

# Step 5: Verify
echo ""
echo "Step 5: Verifying..."
pm2 list
echo ""
echo "Recent logs:"
pm2 logs exotic-state --lines 10 --nostream

echo ""
echo "✅ Done! Now test your file again."
echo ""
echo "If it still doesn't work, check:"
echo "  - pm2 logs exotic-state"
echo "  - Make sure server/index.js has the file:// check"

