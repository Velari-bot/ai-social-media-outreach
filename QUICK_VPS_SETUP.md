# 🚀 Quick VPS Setup Instructions

## Your VPS Details
- **IP:** 149.28.35.225
- **Username:** root
- **Password:** -oV2})Y$}.[PJQ}r

---

## Option 1: Automated Setup (Recommended - 5 minutes)

### Step 1: SSH into VPS
```bash
ssh root@149.28.35.225
# Password: -oV2})Y$}.[PJQ}r
```

### Step 2: Download and run setup script
```bash
# Download script
curl -o setup.sh https://raw.githubusercontent.com/Velari-bot/ai-social-media-outreach/main/vps-setup.sh

# Make executable
chmod +x setup.sh

# Run it
bash setup.sh
```

### Step 3: Update environment variables
When the script pauses, edit `.env.local`:
```bash
nano /home/verality/apps/ai-social-media-outreach/.env.local
```

**Copy your entire `.env.local` from your local machine and paste it here.**

Save: `Ctrl+X`, then `Y`, then `Enter`

Press `Enter` to continue the script.

### Step 4: Verify it's running
```bash
# Check PM2
pm2 status
pm2 logs verality

# Visit in browser
# http://149.28.35.225
```

---

## Option 2: Manual Setup (If script fails)

### 1. SSH in
```bash
ssh root@149.28.35.225
```

### 2. Clean up
```bash
pm2 delete all
pm2 kill
rm -rf /home/verality/apps/*
```

### 3. Update system
```bash
apt update && apt upgrade -y
```

### 4. Install Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

### 5. Install PM2
```bash
npm install -g pm2
```

### 6. Install Nginx
```bash
apt install -y nginx
systemctl start nginx
systemctl enable nginx
```

### 7. Clone repo
```bash
mkdir -p /home/verality/apps
cd /home/verality/apps
git clone https://github.com/Velari-bot/ai-social-media-outreach.git
cd ai-social-media-outreach
```

### 8. Create .env.local
```bash
nano .env.local
```
Paste your entire `.env.local` content, save with `Ctrl+X`, `Y`, `Enter`

### 9. Build
```bash
npm install
npm run build
```

### 10. Start with PM2
```bash
pm2 start npm --name "verality" -- start
pm2 save
pm2 startup
```

### 11. Configure Nginx
```bash
nano /etc/nginx/sites-available/verality
```

Paste:
```nginx
server {
    listen 80;
    server_name verality.io www.verality.io 149.28.35.225;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Save, then:
```bash
ln -s /etc/nginx/sites-available/verality /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

### 12. Setup cron jobs
```bash
crontab -e
```

Add:
```cron
0 0 * * * curl -H "Authorization: Bearer lOdZjqZL5ZjRww/QL+RKARq9P5PnhgcxSGXqMvkIXoI=" http://localhost:3000/api/cron/credits/reset
0 9 * * * curl -H "Authorization: Bearer lOdZjqZL5ZjRww/QL+RKARq9P5PnhgcxSGXqMvkIXoI=" http://localhost:3000/api/cron/campaigns/daily
*/5 * * * * curl -H "Authorization: Bearer lOdZjqZL5ZjRww/QL+RKARq9P5PnhgcxSGXqMvkIXoI=" http://localhost:3000/api/cron/outreach/send
*/5 * * * * curl -H "Authorization: Bearer lOdZjqZL5ZjRww/QL+RKARq9P5PnhgcxSGXqMvkIXoI=" http://localhost:3000/api/cron/outreach/monitor
```

---

## ✅ Verification

### Check if running:
```bash
pm2 status
pm2 logs verality
curl http://localhost:3000
```

### Visit in browser:
- http://149.28.35.225

---

## 🌐 Point Your Domain

In your domain registrar (Namecheap, GoDaddy, etc.):

1. Go to DNS settings for `verality.io`
2. Add A records:
   ```
   Type: A
   Host: @
   Value: 149.28.35.225
   
   Type: A
   Host: www
   Value: 149.28.35.225
   ```
3. Wait 5-30 minutes for DNS propagation

---

## 🔒 Setup SSL (After domain points to VPS)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d verality.io -d www.verality.io
```

---

## 🎯 You're Done!

Your app will be running at:
- http://149.28.35.225 (immediate)
- https://verality.io (after DNS + SSL)

All cron jobs running natively on the VPS! 🚀
