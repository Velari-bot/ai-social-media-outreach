#!/bin/bash

# Cron Job Setup Script for Verality VPS
# Usage: ./setup-vps-cron.sh <CRON_SECRET>

CRON_SECRET=$1

if [ -z "$CRON_SECRET" ]; then
    echo "Error: Please provide your CRON_SECRET as an argument."
    echo "Usage: ./setup-vps-cron.sh <CRON_SECRET>"
    exit 1
fi

DOMAIN="https://verality.io"
LOG_DIR="/var/log/verality-cron"

# Create log directory
sudo mkdir -p $LOG_DIR
sudo chown -R $USER:$USER $LOG_DIR
sudo chmod -R 755 $LOG_DIR

# Define Cron Jobs
# 1. Send Scheduled Emails (Every minute) - High priority for volume
JOB_SEND="* * * * * curl -L -s -X GET -H \"Authorization: Bearer $CRON_SECRET\" \"$DOMAIN/api/cron/outreach/send\" >> $LOG_DIR/send.log 2>&1"

# 2. Monitor Replies (Every minute) - Fast response time
JOB_MONITOR="* * * * * curl -L -s -X GET -H \"Authorization: Bearer $CRON_SECRET\" \"$DOMAIN/api/cron/outreach/monitor\" >> $LOG_DIR/monitor.log 2>&1"

# 3. Run Campaigns & Discovery (Every 30 minutes) - Keeps the funnel full
JOB_CAMPAIGNS="*/30 * * * * curl -L -s -X GET -H \"Authorization: Bearer $CRON_SECRET\" \"$DOMAIN/api/cron/campaigns/run\" >> $LOG_DIR/campaigns.log 2>&1"

# 4. Reset User Credits (Daily at Midnight UTC)
JOB_RESET="0 0 * * * curl -L -s -X GET -H \"Authorization: Bearer $CRON_SECRET\" \"$DOMAIN/api/cron/credits/reset\" >> $LOG_DIR/reset.log 2>&1"

# 5. Aggregate Stats (Every hour) - For dashboard speed
JOB_STATS="0 * * * * curl -L -s -X GET -H \"Authorization: Bearer $CRON_SECRET\" \"$DOMAIN/api/cron/aggregate-stats\" >> $LOG_DIR/stats.log 2>&1"

# Backup existing crontab
crontab -l > mycron.backup 2>/dev/null

# Create new crontab file
cat > mycron.new <<EOF
$JOB_SEND
$JOB_MONITOR
$JOB_CAMPAIGNS
$JOB_RESET
$JOB_STATS
EOF

# Install new crontab
crontab mycron.new
rm mycron.new

echo "✅ Cron jobs installed successfully!"
echo "Logs are located at: $LOG_DIR"
echo "Current Crontab:"
crontab -l
