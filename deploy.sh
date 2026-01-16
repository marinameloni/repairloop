#!/bin/bash

##############################################################################
# Repair Loop Deployment Script
# Usage: ./deploy.sh
# Requirements: Git, Node.js, PM2, Nginx
##############################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
APP_DIR="/var/www/repair-loop"
LOG_DIR="/var/log/repair-loop"
BRANCH="main"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Log function
log_info() {
    echo -e "${BLUE}[${TIMESTAMP}]${NC} ${YELLOW}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${BLUE}[${TIMESTAMP}]${NC} ${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${BLUE}[${TIMESTAMP}]${NC} ${RED}❌ $1${NC}"
}

# Error handler
handle_error() {
    log_error "Deployment failed at step: $1"
    exit 1
}

##############################################################################
# START DEPLOYMENT
##############################################################################

echo -e "\n${YELLOW}╔════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║   🚀 Repair Loop Deployment Script     ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════╝${NC}\n"

# Step 1: Check prerequisites
log_info "Checking prerequisites..."
command -v git >/dev/null 2>&1 || handle_error "Git not installed"
command -v npm >/dev/null 2>&1 || handle_error "Node.js not installed"
command -v pm2 >/dev/null 2>&1 || handle_error "PM2 not installed"
log_success "All prerequisites met"

# Step 2: Pull code from GitHub
log_info "Pulling latest code from GitHub..."
cd $APP_DIR || handle_error "Cannot cd to $APP_DIR"
git pull origin $BRANCH || handle_error "Git pull"
log_success "Code updated"

# Step 3: Install backend dependencies
log_info "Installing backend dependencies..."
cd $APP_DIR/backend || handle_error "Cannot cd to backend"
npm ci --omit=dev || handle_error "Backend npm install"
log_success "Backend dependencies installed"

# Step 4: Install frontend dependencies
log_info "Installing frontend dependencies..."
cd $APP_DIR/frontend || handle_error "Cannot cd to frontend"
npm install --omit=dev || handle_error "Frontend npm install"
log_success "Frontend dependencies installed"

# Step 5: Build frontend (Nuxt)
log_info "Building frontend..."
npm run build || handle_error "Frontend build"
log_success "Frontend built successfully"

# Step 6: Check/Initialize database
log_info "Checking database..."
cd $APP_DIR/backend || handle_error "Cannot cd to backend"
if [ ! -f "game.db" ]; then
    log_info "Database not found, initializing..."
    node init-db.js || handle_error "Database initialization"
    log_success "Database initialized"
else
    log_success "Database exists"
fi

# Step 7: Backup database (optional but recommended)
log_info "Creating database backup..."
BACKUP_FILE="$LOG_DIR/backups/game_$(date +%Y%m%d_%H%M%S).db"
mkdir -p $LOG_DIR/backups
cp game.db "$BACKUP_FILE" 2>/dev/null || log_error "Could not backup database"
log_success "Database backed up: $BACKUP_FILE"

# Step 8: Stop current services gracefully
log_info "Stopping services gracefully..."
pm2 stop ecosystem.config.js 2>/dev/null || true
sleep 2
log_success "Services stopped"

# Step 9: Update environment
log_info "Updating environment with PM2..."
cd $APP_DIR || handle_error "Cannot cd to $APP_DIR"

# Step 10: Start/restart services
log_info "Starting services with PM2..."
pm2 delete ecosystem.config.js 2>/dev/null || true
sleep 1
pm2 start ecosystem.config.js --update-env || handle_error "PM2 start"
sleep 3
log_success "Services started"

# Step 11: Save PM2 process list
pm2 save || log_error "Could not save PM2 config"

# Step 12: Verify services are running
log_info "Verifying services..."
BACKEND_STATUS=$(pm2 describe repair-loop-backend 2>/dev/null | grep "status" | grep -c "online")
FRONTEND_STATUS=$(pm2 describe repair-loop-frontend 2>/dev/null | grep "status" | grep -c "online")

if [ "$BACKEND_STATUS" -gt 0 ] && [ "$FRONTEND_STATUS" -gt 0 ]; then
    log_success "All services running"
else
    log_error "Some services failed to start"
    pm2 logs
    handle_error "Service verification"
fi

##############################################################################
# DEPLOYMENT SUMMARY
##############################################################################

echo -e "\n${YELLOW}╔════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║   📊 Deployment Summary                ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════╝${NC}\n"

log_info "Deployment completed at: $TIMESTAMP"
log_info "Branch deployed: $BRANCH"
log_info "Application directory: $APP_DIR"
log_info "Logs directory: $LOG_DIR"

echo ""
log_info "Current services status:"
pm2 status

echo ""
echo -e "${GREEN}🎉 Deployment successful!${NC}\n"

echo -e "${YELLOW}Useful commands:${NC}"
echo "  pm2 logs repair-loop-backend    # View backend logs"
echo "  pm2 logs repair-loop-frontend   # View frontend logs"
echo "  pm2 restart all                 # Restart all services"
echo "  pm2 stop all                    # Stop all services"
echo "  tail -f $LOG_DIR/access.log     # View Nginx access logs"
echo "  tail -f $LOG_DIR/error.log      # View Nginx error logs"
echo ""
