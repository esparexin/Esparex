#!/bin/bash
# Emergency Rollback Script for Esparex Remediation PR
#
# Use this if deployment causes critical issues
# Usage: bash scripts/rollback-deployment.sh [COMMIT_SHA]
#
# Examples:
#   bash scripts/rollback-deployment.sh                  # Rollback to previous commit
#   bash scripts/rollback-deployment.sh abc123def        # Rollback to specific commit

set -e

BACKEND_PATH="${BACKEND_PATH:-.}/backend"
COMMIT_SHA="${1:-HEAD~1}"  # Default: previous commit

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${RED}═══════════════════════════════════════════════${NC}"
echo -e "${RED}  ⚠️  EMERGENCY ROLLBACK INITIATED${NC}"
echo -e "${RED}═══════════════════════════════════════════════${NC}\n"

# 1. Confirm rollback
echo -e "${YELLOW}Rolling back to: $COMMIT_SHA${NC}"
echo ""
read -p "⚠️  Are you SURE? This will revert code changes. (yes/no) " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Rollback cancelled."
    exit 0
fi

# 2. Stop backend service
echo -e "\n${BLUE}Step 1: Stopping backend service...${NC}"

if systemctl is-active --quiet esparex-backend 2>/dev/null; then
    echo "Stopping systemd service..."
    sudo systemctl stop esparex-backend
    echo "✅ Stopped"
elif pgrep -f "npm.*start.*backend" > /dev/null; then
    echo "Stopping npm process..."
    pkill -f "npm.*start.*backend" || true
    sleep 2
    echo "✅ Stopped"
else
    echo "No backend process found (may already be stopped)"
fi

# 3. Revert code
echo -e "\n${BLUE}Step 2: Reverting code changes...${NC}"

cd "$BACKEND_PATH"

echo "Current HEAD:"
git log --oneline -1

echo ""
echo "Resetting to: $COMMIT_SHA"
git reset --hard "$COMMIT_SHA"

echo "✅ Code reverted"
echo ""
git log --oneline -1

# 4. Rebuild
echo -e "\n${BLUE}Step 3: Rebuilding backend...${NC}"

npm install --production
npm run build

echo "✅ Build complete"

# 5. Clear OTP environment (optional but recommended)
echo -e "\n${BLUE}Step 4: Handling environment...${NC}"

if [ -f ".env" ]; then
    echo "Current .env variables:"
    grep -E "MSG91|OTP" .env || echo "  (no OTP-related vars)"
    
    read -p "Remove MSG91 credentials from .env? (y/n) " REMOVE_KEYS
    if [ "$REMOVE_KEYS" = "y" ]; then
        sed -i '/MSG91_AUTH_KEY/d' .env
        sed -i '/MSG91_SENDER_ID/d' .env
        echo "✅ MSG91 credentials removed"
    fi
else
    echo "⚠️  .env file not found"
fi

# 6. Restart backend
echo -e "\n${BLUE}Step 5: Starting backend service...${NC}"

if systemctl is-enabled --quiet esparex-backend 2>/dev/null; then
    sudo systemctl start esparex-backend
    sleep 3
    if systemctl is-active --quiet esparex-backend; then
        echo "✅ Service started successfully"
    else
        echo -e "${RED}❌ Service failed to start. Check logs:${NC}"
        sudo journalctl -u esparex-backend -n 20
        exit 1
    fi
else
    echo "Starting with npm..."
    cd "$BACKEND_PATH"
    NODE_ENV=production npm start > /tmp/esparex-backend.log 2>&1 &
    sleep 3
    if pgrep -f "npm.*start.*backend" > /dev/null; then
        echo "✅ Backend started (PID: $(pgrep -f 'npm.*start.*backend'))"
    else
        echo -e "${RED}❌ Backend failed to start. Check logs:${NC}"
        tail -20 /tmp/esparex-backend.log
        exit 1
    fi
fi

# 7. Verify
echo -e "\n${BLUE}Step 6: Verifying rollback...${NC}"

sleep 2

echo "Checking logs for errors..."
if [ -f "/var/log/esparex-backend.log" ]; then
    ERROR_COUNT=$(grep -i "error\|failed" /var/log/esparex-backend.log | tail -5 | wc -l)
    if [ "$ERROR_COUNT" -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Recent errors found (may be pre-existing):${NC}"
        grep -i "error\|failed" /var/log/esparex-backend.log | tail -5
    else
        echo "✅ No errors in logs"
    fi
fi

# 8. Health check
echo ""
echo "Running health check..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/v1/health || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${YELLOW}⚠️  Health check returned HTTP $HTTP_CODE (may be normal)${NC}"
fi

# Summary
echo -e "\n${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ ROLLBACK COMPLETE${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}\n"

echo "Summary:"
echo "  Backend reverted to: $COMMIT_SHA"
echo "  Service status: $(systemctl is-active esparex-backend 2>/dev/null || echo 'running (npm)')"
echo "  Health check: HTTP $HTTP_CODE"
echo ""
echo "Next steps:"
echo "  1. Monitor logs: tail -f /var/log/esparex-backend.log"
echo "  2. Verify functionality: test OTP send/verify"
echo "  3. Identify root cause of original issue"
echo ""
echo "If issues persist:"
echo "  - Check recent logs: grep -i 'error' /var/log/esparex-backend.log"
echo "  - Contact DevOps: describe what broke"
echo "  - Don't retry deployment until root cause identified"

exit 0
