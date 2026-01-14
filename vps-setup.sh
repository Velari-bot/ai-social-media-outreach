#!/bin/bash

###############################################################################
# Verality VPS Setup Script
# Automated setup for Ubuntu 22.04
# Run this as root: bash setup.sh
###############################################################################

set -e  # Exit on error

echo "=========================================="
echo "🚀 Verality VPS Setup Starting..."
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Clean up old installations
echo -e "${YELLOW}[1/13] Cleaning up old installations...${NC}"
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true
systemctl stop nginx 2>/dev/null || true
rm -rf /home/verality/apps/* 2>/dev/null || true
rm -rf /root/apps/* 2>/dev/null || true

# Step 2: Update system
echo -e "${YELLOW}[2/13] Updating system packages...${NC}"
apt update && apt upgrade -y

# Step 3: Install Node.js 20
echo -e "${YELLOW}[3/13] Installing Node.js 20...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node --version
npm --version

# Step 4: Install PM2
echo -e "${YELLOW}[4/13] Installing PM2...${NC}"
npm install -g pm2
pm2 --version

# Step 5: Install Nginx
echo -e "${YELLOW}[5/13] Installing Nginx...${NC}"
apt install -y nginx
systemctl start nginx
systemctl enable nginx

# Step 6: Install Git
echo -e "${YELLOW}[6/13] Installing Git...${NC}"
apt install -y git

# Step 7: Create user (if doesn't exist)
echo -e "${YELLOW}[7/13] Setting up user...${NC}"
if ! id "verality" &>/dev/null; then
    adduser --disabled-password --gecos "" verality
    usermod -aG sudo verality
    echo "verality:verality123" | chpasswd
fi

# Step 8: Clone repository
echo -e "${YELLOW}[8/13] Cloning repository...${NC}"
mkdir -p /home/verality/apps
cd /home/verality/apps
rm -rf ai-social-media-outreach
git clone https://github.com/Velari-bot/ai-social-media-outreach.git
cd ai-social-media-outreach

# Step 9: Create .env.local
echo -e "${YELLOW}[9/13] Creating environment file...${NC}"
cat > .env.local << 'EOF'
# This is a placeholder - YOU MUST UPDATE THIS!
# Copy your actual .env.local content here

INFLUENCER_CLUB_API_KEY=lOdZjqZL5ZjRww/QL+RKARq9P5PnhgcxSGXqMvkIXoI=
CRON_SECRET=lOdZjqZL5ZjRww/QL+RKARq9P5PnhgcxSGXqMvkIXoI=

# ADD YOUR OTHER ENV VARS HERE:
# FIREBASE_SERVICE_ACCOUNT=
# OPENAI_API_KEY=
# NEXT_PUBLIC_GMAIL_CLIENT_ID=
# GMAIL_CLIENT_SECRET=
# etc...
EOF

echo -e "${RED}⚠️  IMPORTANT: Edit /home/verality/apps/ai-social-media-outreach/.env.local with your actual environment variables!${NC}"
echo -e "${RED}Run: nano /home/verality/apps/ai-social-media-outreach/.env.local${NC}"
read -p "Press Enter after you've updated .env.local..."

# Step 10: Install dependencies and build
echo -e "${YELLOW}[10/13] Installing dependencies...${NC}"
npm install

echo -e "${YELLOW}Building application...${NC}"
npm run build

# Step 11: Start with PM2
echo -e "${YELLOW}[11/13] Starting application with PM2...${NC}"
chown -R verality:verality /home/verality/apps
pm2 start npm --name "verality" -- start
pm2 save
pm2 startup systemd -u root --hp /root

# Step 12: Configure Nginx
echo -e "${YELLOW}[12/13] Configuring Nginx...${NC}"
cat > /etc/nginx/sites-available/verality << 'EOF'
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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Increase timeouts for long-running requests
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
    }
}
EOF

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/verality /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Step 13: Setup cron jobs
echo -e "${YELLOW}[13/13] Setting up cron jobs...${NC}"
(crontab -l 2>/dev/null || true; cat << 'EOF'
# Verality Automated Outreach Cron Jobs
0 0 * * * curl -H "Authorization: Bearer lOdZjqZL5ZjRww/QL+RKARq9P5PnhgcxSGXqMvkIXoI=" http://localhost:3000/api/cron/credits/reset >> /var/log/verality-cron.log 2>&1
0 9 * * * curl -H "Authorization: Bearer lOdZjqZL5ZjRww/QL+RKARq9P5PnhgcxSGXqMvkIXoI=" http://localhost:3000/api/cron/campaigns/daily >> /var/log/verality-cron.log 2>&1
*/5 * * * * curl -H "Authorization: Bearer lOdZjqZL5ZjRww/QL+RKARq9P5PnhgcxSGXqMvkIXoI=" http://localhost:3000/api/cron/outreach/send >> /var/log/verality-cron.log 2>&1
*/5 * * * * curl -H "Authorization: Bearer lOdZjqZL5ZjRww/QL+RKARq9P5PnhgcxSGXqMvkIXoI=" http://localhost:3000/api/cron/outreach/monitor >> /var/log/verality-cron.log 2>&1
EOF
) | crontab -

# Setup firewall
echo -e "${YELLOW}Setting up firewall...${NC}"
ufw --force enable
ufw allow OpenSSH
ufw allow 'Nginx Full'

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "📊 Status Check:"
echo "  PM2 Status:"
pm2 status
echo ""
echo "  Nginx Status:"
systemctl status nginx --no-pager
echo ""
echo "🌐 Your app should be accessible at:"
echo "  - http://149.28.35.225"
echo "  - http://verality.io (after DNS propagation)"
echo ""
echo "📝 Next Steps:"
echo "  1. Update .env.local with your actual environment variables"
echo "  2. Restart PM2: pm2 restart verality"
echo "  3. Check logs: pm2 logs verality"
echo "  4. Point your domain to 149.28.35.225"
echo "  5. Setup SSL: sudo certbot --nginx -d verality.io -d www.verality.io"
echo ""
echo "🔍 Useful Commands:"
echo "  - View logs: pm2 logs verality"
echo "  - Restart app: pm2 restart verality"
echo "  - View cron logs: tail -f /var/log/verality-cron.log"
echo ""
