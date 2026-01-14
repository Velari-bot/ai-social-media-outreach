# VPS Setup Guide - Ubuntu 22.04 x64

## 📊 VPS Specs (Perfect for This App!)
- **CPU:** 1 vCPU ✅
- **RAM:** 1 GB ✅
- **Storage:** 25 GB SSD ✅
- **OS:** Ubuntu 22.04 x64 ✅

This is **perfect** for your Next.js app with moderate traffic!

---

## 🚀 Complete Setup Guide

### **Step 1: Initial Server Setup**

#### 1.1 SSH into your VPS
```bash
ssh root@YOUR_VPS_IP
```

#### 1.2 Update system
```bash
apt update && apt upgrade -y
```

#### 1.3 Create a non-root user
```bash
adduser verality
usermod -aG sudo verality
```

#### 1.4 Switch to new user
```bash
su - verality
```

---

### **Step 2: Install Node.js 20**

```bash
# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version
```

---

### **Step 3: Install PM2 (Process Manager)**

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify
pm2 --version
```

---

### **Step 4: Install Nginx (Reverse Proxy)**

```bash
# Install Nginx
sudo apt install -y nginx

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

---

### **Step 5: Clone Your Repository**

```bash
# Install Git
sudo apt install -y git

# Create app directory
cd /home/verality
mkdir apps
cd apps

# Clone your repo
git clone https://github.com/Velari-bot/ai-social-media-outreach.git
cd ai-social-media-outreach
```

---

### **Step 6: Setup Environment Variables**

```bash
# Create .env.local file
nano .env.local
```

**Paste your environment variables:**
```env
# Firebase
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# APIs
INFLUENCER_CLUB_API_KEY=lOdZjqZL5ZjRww/QL+RKARq9P5PnhgcxSGXqMvkIXoI=
OPENAI_API_KEY=your_openai_key
CLAY_WEBHOOK_URL=your_clay_webhook

# Gmail OAuth
NEXT_PUBLIC_GMAIL_CLIENT_ID=your_client_id
GMAIL_CLIENT_SECRET=your_client_secret

# Cron Secret
CRON_SECRET=lOdZjqZL5ZjRww/QL+RKARq9P5PnhgcxSGXqMvkIXoI=

# Add all other env vars from your local .env.local
```

**Save:** `Ctrl+X`, then `Y`, then `Enter`

---

### **Step 7: Install Dependencies & Build**

```bash
# Install dependencies
npm install

# Build the app
npm run build
```

---

### **Step 8: Start App with PM2**

```bash
# Start the app
pm2 start npm --name "verality" -- start

# Save PM2 config
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Copy and run the command it outputs
```

**Check if running:**
```bash
pm2 status
pm2 logs verality
```

---

### **Step 9: Configure Nginx**

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/verality
```

**Paste this configuration:**
```nginx
server {
    listen 80;
    server_name verality.io www.verality.io;

    location / {
        proxy_pass http://localhost:3000;
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

**Save:** `Ctrl+X`, then `Y`, then `Enter`

**Enable the site:**
```bash
sudo ln -s /etc/nginx/sites-available/verality /etc/nginx/sites-enabled/
sudo nginx -t  # Test config
sudo systemctl restart nginx
```

---

### **Step 10: Setup SSL (HTTPS)**

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d verality.io -d www.verality.io
```

**Follow prompts:**
- Enter email
- Agree to terms
- Choose redirect HTTP to HTTPS (option 2)

---

### **Step 11: Setup Cron Jobs (Native!)**

```bash
# Edit crontab
crontab -e
```

**Add these cron jobs:**
```cron
# Reset credits at midnight
0 0 * * * curl -H "Authorization: Bearer lOdZjqZL5ZjRww/QL+RKARq9P5PnhgcxSGXqMvkIXoI=" http://localhost:3000/api/cron/credits/reset

# Run campaigns at 9 AM
0 9 * * * curl -H "Authorization: Bearer lOdZjqZL5ZjRww/QL+RKARq9P5PnhgcxSGXqMvkIXoI=" http://localhost:3000/api/cron/campaigns/daily

# Send emails every 5 minutes
*/5 * * * * curl -H "Authorization: Bearer lOdZjqZL5ZjRww/QL+RKARq9P5PnhgcxSGXqMvkIXoI=" http://localhost:3000/api/cron/outreach/send

# Monitor replies every 5 minutes
*/5 * * * * curl -H "Authorization: Bearer lOdZjqZL5ZjRww/QL+RKARq9P5PnhgcxSGXqMvkIXoI=" http://localhost:3000/api/cron/outreach/monitor
```

**Save:** `Ctrl+X`, then `Y`, then `Enter`

---

### **Step 12: Point Your Domain**

In your domain registrar (e.g., Namecheap, GoDaddy):

1. Go to DNS settings
2. Add/Update A records:
   ```
   Type: A
   Host: @
   Value: YOUR_VPS_IP
   TTL: 300

   Type: A
   Host: www
   Value: YOUR_VPS_IP
   TTL: 300
   ```

3. Wait 5-30 minutes for DNS propagation

---

### **Step 13: Verify Everything Works**

```bash
# Check PM2
pm2 status
pm2 logs verality --lines 50

# Check Nginx
sudo systemctl status nginx

# Check cron jobs
crontab -l

# Test app
curl http://localhost:3000
```

**Visit your site:**
- https://verality.io
- Should see your app!

---

## 🔄 Deployment Workflow (Future Updates)

When you push code changes:

```bash
# SSH into VPS
ssh verality@YOUR_VPS_IP

# Navigate to app
cd /home/verality/apps/ai-social-media-outreach

# Pull latest code
git pull origin main

# Install any new dependencies
npm install

# Rebuild
npm run build

# Restart PM2
pm2 restart verality

# Check logs
pm2 logs verality
```

---

## 📊 Monitoring Commands

```bash
# View app logs
pm2 logs verality

# View app status
pm2 status

# View resource usage
pm2 monit

# Restart app
pm2 restart verality

# Stop app
pm2 stop verality

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 🛡️ Security Best Practices

### 1. Setup Firewall
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

### 2. Disable Root Login
```bash
sudo nano /etc/ssh/sshd_config
```
Change: `PermitRootLogin no`
```bash
sudo systemctl restart sshd
```

### 3. Setup Fail2Ban
```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 💰 Cost Comparison

| Option | Monthly Cost | Pros | Cons |
|--------|-------------|------|------|
| **Vultr VPS** | **$6-12** | Native cron, full control, cheaper | Manual setup |
| Vercel Pro | $20 | Easy deploy, auto-scaling | More expensive, serverless limits |
| Vercel Free + cron-job.org | $0 | Free | External dependency |

**Recommendation:** VPS is the best value! 🎯

---

## 🚨 Troubleshooting

### App won't start
```bash
pm2 logs verality --lines 100
# Check for errors
```

### Port 3000 already in use
```bash
sudo lsof -i :3000
sudo kill -9 PID
pm2 restart verality
```

### Nginx 502 Bad Gateway
```bash
# Check if app is running
pm2 status
# Restart app
pm2 restart verality
```

### SSL renewal
```bash
# Certbot auto-renews, but to test:
sudo certbot renew --dry-run
```

---

## ✅ Final Checklist

- [ ] VPS created and accessible via SSH
- [ ] Node.js 20 installed
- [ ] PM2 installed
- [ ] Nginx installed and configured
- [ ] App cloned and built
- [ ] Environment variables set
- [ ] PM2 running app
- [ ] Nginx reverse proxy working
- [ ] SSL certificate installed
- [ ] Cron jobs configured
- [ ] Domain pointed to VPS
- [ ] Firewall configured
- [ ] App accessible at https://verality.io

---

## 🎯 Next Steps After Setup

1. Test campaign creation
2. Verify cron jobs run
3. Check email sending
4. Monitor logs for errors
5. Set up monitoring (optional: UptimeRobot)

Your app will be running 24/7 with native cron jobs - no external services needed! 🚀
