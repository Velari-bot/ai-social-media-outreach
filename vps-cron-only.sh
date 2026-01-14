#!/bin/bash

###############################################################################
# Verality Cron Jobs Only Setup
# Just sets up cron jobs to hit Vercel endpoints
###############################################################################

set -e

echo "=========================================="
echo "🚀 Setting Up Cron Jobs for Verality..."
echo "=========================================="

# Your Vercel app URL
VERCEL_URL="https://www.verality.io"
CRON_SECRET="lOdZjqZL5ZjRww/QL+RKARq9P5PnhgcxSGXqMvkIXoI="

echo "Setting up cron jobs to hit: $VERCEL_URL"

# Create cron jobs
(crontab -l 2>/dev/null || true; cat << EOF
# Verality Automated Outreach Cron Jobs
# Reset credits at midnight
0 0 * * * curl -H "Authorization: Bearer $CRON_SECRET" $VERCEL_URL/api/cron/credits/reset >> /var/log/verality-cron.log 2>&1

# Run campaigns at 9 AM
0 9 * * * curl -H "Authorization: Bearer $CRON_SECRET" $VERCEL_URL/api/cron/campaigns/daily >> /var/log/verality-cron.log 2>&1

# Send emails every 5 minutes
*/5 * * * * curl -H "Authorization: Bearer $CRON_SECRET" $VERCEL_URL/api/cron/outreach/send >> /var/log/verality-cron.log 2>&1

# Monitor replies every 5 minutes
*/5 * * * * curl -H "Authorization: Bearer $CRON_SECRET" $VERCEL_URL/api/cron/outreach/monitor >> /var/log/verality-cron.log 2>&1
EOF
) | crontab -

echo ""
echo "=========================================="
echo "✅ Cron Jobs Setup Complete!"
echo "=========================================="
echo ""
echo "📋 Installed Cron Jobs:"
crontab -l
echo ""
echo "🔍 Monitor cron job execution:"
echo "  tail -f /var/log/verality-cron.log"
echo ""
echo "🌐 Cron jobs will hit:"
echo "  - $VERCEL_URL/api/cron/credits/reset (midnight)"
echo "  - $VERCEL_URL/api/cron/campaigns/daily (9 AM)"
echo "  - $VERCEL_URL/api/cron/outreach/send (every 5 min)"
echo "  - $VERCEL_URL/api/cron/outreach/monitor (every 5 min)"
echo ""
echo "✅ Done! Your Vercel app will receive cron triggers from this VPS."
echo ""
