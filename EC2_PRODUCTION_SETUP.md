# 🚀 EC2 Production Setup Guide

Your chatbot is running at: **http://16.16.128.91:3001**

## ✅ Current Status

- ✅ Server running on EC2
- ✅ Application accessible at http://16.16.128.91:3001
- ✅ API working
- ✅ Widget script accessible

## 📝 Script Tag for Client

```html
<script src="http://16.16.128.91:3001/public/chatbot-widget.js"
        data-api-url="http://16.16.128.91:3001/api"
        data-config='{"theme": "light", "position": "bottom-right"}'></script>
```

## ⚠️ Important: CORS Configuration

**Before client can use it, update CORS on EC2:**

```bash
# SSH into EC2
ssh ec2-user@16.16.128.91

# Edit .env file
cd ~/exotic-state
nano .env

# Make sure ALLOWED_ORIGINS includes client's domain:
ALLOWED_ORIGINS=https://www.exoticestates.com,https://exoticestates.com,http://localhost:3000

# Restart PM2
pm2 restart exotic-state
```

## 🔒 Production Recommendations

### 1. Set Up Nginx Reverse Proxy (Recommended)

```bash
# Install Nginx
sudo yum install nginx -y  # For Amazon Linux
# or
sudo apt install nginx -y  # For Ubuntu

# Create config
sudo nano /etc/nginx/conf.d/chatbot.conf
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name 16.16.128.91;  # Or your domain name

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Then:
```bash
sudo nginx -t
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2. Set Up SSL/HTTPS (Important for Production)

```bash
# Install Certbot
sudo yum install certbot python3-certbot-nginx -y

# Get SSL certificate (if you have a domain)
sudo certbot --nginx -d your-domain.com

# Or use AWS Certificate Manager with Load Balancer
```

### 3. Update Security Group

Make sure your EC2 security group allows:
- **Inbound:** Port 80 (HTTP), Port 443 (HTTPS), Port 22 (SSH)
- **Outbound:** All traffic

### 4. Set Up Domain Name (Optional)

1. Point your domain to EC2 IP: `16.16.128.91`
2. Update script tag to use domain instead of IP
3. Example: `https://chatbot.exoticestates.com`

## 🧪 Testing

### Test from Your Local Machine

```bash
# Health check
curl http://16.16.128.91:3001/health

# Widget script
curl http://16.16.128.91:3001/public/chatbot-widget.js | head -10

# API test
curl -X POST http://16.16.128.91:3001/api/chat/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello!","pageUrl":"https://www.exoticestates.com"}'
```

### Test on Client's Website

1. Add script tag to a test page
2. Open in browser
3. Check browser console (F12)
4. Look for chat button in bottom-right
5. Test chat functionality

## 🔧 Maintenance Commands

```bash
# View logs
pm2 logs exotic-state

# Restart
pm2 restart exotic-state

# Stop
pm2 stop exotic-state

# Start
pm2 start exotic-state

# Check status
pm2 list
pm2 status
```

## 📊 Monitoring

### Check Server Resources

```bash
# CPU and Memory
top
# or
htop

# Disk space
df -h

# Network
netstat -tulpn
```

### Set Up CloudWatch (Optional)

Monitor your EC2 instance through AWS CloudWatch for:
- CPU utilization
- Memory usage
- Network traffic
- Application logs

## 🚨 Troubleshooting

### Chatbot Not Loading on Client Site

1. **Check CORS:**
   ```bash
   # On EC2, check .env file
   cat ~/exotic-state/.env | grep ALLOWED_ORIGINS
   ```

2. **Check Server Logs:**
   ```bash
   pm2 logs exotic-state --lines 50
   ```

3. **Check Browser Console:**
   - Open client's website
   - Press F12
   - Check Console tab for errors
   - Check Network tab for failed requests

### Server Not Responding

```bash
# Check if PM2 process is running
pm2 list

# Check if port is listening
sudo netstat -tulpn | grep 3001

# Restart if needed
pm2 restart exotic-state
```

## ✅ Production Checklist

- [ ] Server running on EC2
- [ ] CORS configured for client domain
- [ ] Security group allows HTTP/HTTPS
- [ ] Nginx reverse proxy set up (optional but recommended)
- [ ] SSL certificate configured (for HTTPS)
- [ ] Domain name configured (optional)
- [ ] PM2 auto-restart on reboot configured
- [ ] Monitoring set up
- [ ] Tested on client's website
- [ ] Script tag provided to client

## 📞 Support

If issues arise:
1. Check PM2 logs: `pm2 logs exotic-state`
2. Check server health: `curl http://16.16.128.91:3001/health`
3. Verify CORS settings
4. Check browser console on client's site

---

**Your chatbot is ready!** Provide the script tag from `CLIENT_SCRIPT_TAG_FINAL.txt` to your client.

