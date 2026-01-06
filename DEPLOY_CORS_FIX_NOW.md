# 🚨 Deploy CORS Fix to EC2 NOW

## The Problem
Your local file has the CORS fix, but EC2 server doesn't. That's why you're getting `ERR_BLOCKED_BY_RESPONSE.NotSameOrigin`.

## Quick Fix - Option 1: Git Deploy (Recommended)

```bash
# 1. Commit and push
git add server/index.js
git commit -m "Add CORS file:// support"
git push

# 2. On EC2, pull and restart
ssh ec2-user@16.16.128.91
cd ~/exotic-state
git pull
pm2 restart exotic-state
pm2 logs exotic-state --lines 20
```

## Quick Fix - Option 2: Manual Edit on EC2

```bash
# 1. SSH into EC2
ssh ec2-user@16.16.128.91

# 2. Edit file
cd ~/exotic-state
nano server/index.js

# 3. Find line 33 (after "if (!origin) return callback(null, true);")
# 4. Add these 3 lines:
    // Allow file:// protocol for local testing
    if (origin.startsWith('file://') || origin === 'null') {
      return callback(null, true);
    }

# 5. Save: Ctrl+X, then Y, then Enter

# 6. Restart
pm2 restart exotic-state
pm2 logs exotic-state --lines 20
```

## Verify It's Fixed

After deploying, test:
1. Open `standalone-test.html` in browser
2. Check console - should see widget loaded
3. Chat button should appear in bottom-right

## Check if Fix is on EC2

```bash
ssh ec2-user@16.16.128.91
cd ~/exotic-state
grep -A 2 "file://" server/index.js
```

If you see the code, it's there. If not, deploy it!

