# ⚙️ GitHub Actions Setup Guide

## Overview

GitHub Actions automates deployment whenever you push to the `main` branch. The workflow file (`.github/workflows/deploy.yml`) triggers the `deploy.sh` script on your VPS via SSH.

## Step 1: Generate SSH Key on VPS

SSH into your VPS and create a deployment key:

```bash
# Generate Ed25519 key (recommended)
ssh-keygen -t ed25519 -C "repair-loop-deployment" -f ~/.ssh/repair-loop-deploy -N ""

# Display public key (save for GitHub)
cat ~/.ssh/repair-loop-deploy.pub

# Display private key (save as GitHub secret)
cat ~/.ssh/repair-loop-deploy
```

## Step 2: Add Deploy Key to GitHub

1. Go to your GitHub repository
2. Click **Settings** → **Deploy keys**
3. Click **Add deploy key**
4. Paste content from `~/.ssh/repair-loop-deploy.pub`
5. **Check** "Allow write access"
6. Click **Add key**

## Step 3: Add GitHub Secrets

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add these 4 secrets:

### Secret 1: VPS_HOST

- **Name:** `VPS_HOST`
- **Value:** Your VPS IP address or domain (e.g., `123.45.67.89`)

### Secret 2: VPS_USER

- **Name:** `VPS_USER`
- **Value:** SSH username (usually `root` or your username)

### Secret 3: VPS_SSH_KEY

- **Name:** `VPS_SSH_KEY`
- **Value:** Full content of `~/.ssh/repair-loop-deploy` private key

To get the private key content safely:

```bash
# On VPS
cat ~/.ssh/repair-loop-deploy
```

Copy the entire output (including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`).

### Secret 4: VPS_PORT (Optional)

- **Name:** `VPS_PORT`
- **Value:** SSH port (usually `22`)

## Step 4: Verify Workflow File

The workflow file `.github/workflows/deploy.yml` should exist in your repository with this structure:

```yaml
name: Deploy to Production VPS

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: 🔔 Start deployment notification
        run: echo "Starting deployment to production..."

      - name: 🔐 Deploy via SSH
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: ${{ secrets.VPS_PORT || '22' }}
          script: |
            cd /var/www/repair-loop
            chmod +x deploy.sh
            ./deploy.sh

      - name: ✅ Deployment complete
        run: echo "Production deployment completed successfully"

      - name: 📧 Notify on failure
        if: failure()
        run: echo "Deployment failed - check logs in GitHub Actions"
```

## Step 5: Test the Deployment

### Option A: Manual Trigger (Recommended First Test)

1. Go to your repository
2. Click **Actions** tab
3. Click **Deploy to Production VPS** workflow
4. Click **Run workflow** → **Run workflow**
5. Watch the deployment in real-time

### Option B: Push a Small Change

```bash
# Make a small change
echo "# Updated" >> README.md

# Commit and push
git add README.md
git commit -m "Test deployment"
git push origin main
```

Then check the **Actions** tab to watch the deployment.

## Step 6: Monitor Deployment

1. Go to **Actions** tab in your repository
2. Click the workflow run
3. Click the `🔐 Deploy via SSH` step to view logs
4. Green checkmark = success ✅
5. Red X = failure ❌

### Deployment Logs Show:

```
✅ All prerequisites met
✅ Code updated
✅ Backend dependencies installed
✅ Frontend dependencies installed
✅ Frontend built successfully
✅ Database exists
✅ Database backed up: /var/log/repair-loop/backups/game_20240115_143022.db
✅ Services stopped
✅ Services started
✅ All services running

╔════════════════════════════════════════╗
║   📊 Deployment Summary                ║
╚════════════════════════════════════════╝
```

## Full Deployment Workflow

Now your complete CI/CD pipeline is:

```
1. Make changes locally
   git add .
   git commit -m "Add new feature"

2. Push to GitHub
   git push origin main

3. GitHub Actions triggers
   - Receives webhook notification
   - SSH connects to VPS
   - Runs deploy.sh

4. Deploy script:
   - Pulls latest code
   - Installs dependencies
   - Builds frontend
   - Restarts services gracefully
   - Verifies services are running

5. Live update
   - App updated on production
   - Zero downtime (PM2 rolling restart)
   - Database backed up automatically
```

## Troubleshooting

### ❌ "Authentication failed"

**Problem:** SSH key not working

**Solution:**

1. Verify SSH key was generated correctly
2. Check `VPS_SSH_KEY` secret contains full private key (including BEGIN/END lines)
3. Regenerate if needed:
   ```bash
   ssh-keygen -t ed25519 -C "repair-loop-deployment" -f ~/.ssh/repair-loop-deploy -N ""
   ```
4. Update GitHub secret with new key

### ❌ "Permission denied"

**Problem:** VPS user doesn't have directory permissions

**Solution:**

```bash
# On VPS
sudo chown -R $(whoami):$(whoami) /var/www/repair-loop
sudo chmod -R 755 /var/www/repair-loop
```

### ❌ "Workflow not showing"

**Problem:** `.github/workflows/deploy.yml` file not recognized

**Solution:**

1. Commit the file to `main` branch
2. GitHub Actions only runs workflows on `main`
3. Wait a few seconds for GitHub to recognize it
4. Refresh Actions tab

### ❌ "Deploy.sh not found"

**Problem:** Deployment script missing on VPS

**Solution:**

```bash
# Manually copy deploy.sh to VPS
scp deploy.sh user@your-vps:/var/www/repair-loop/
chmod +x /var/www/repair-loop/deploy.sh
```

## Manual Deployment (Backup Plan)

If GitHub Actions fails, manually deploy:

```bash
# SSH to VPS
ssh user@your-vps

# Navigate to app
cd /var/www/repair-loop

# Run deploy script manually
chmod +x deploy.sh
./deploy.sh
```

## Viewing Live Logs on VPS

```bash
# SSH to VPS
ssh user@your-vps

# View backend logs
pm2 logs repair-loop-backend

# View frontend logs
pm2 logs repair-loop-frontend

# View all logs
pm2 logs

# Exit logs view
# Press Ctrl+C
```

## Schedule Automatic Backups

To backup database daily without deployment, create another GitHub Actions workflow:

`.github/workflows/backup.yml`

```yaml
name: Daily Database Backup

on:
  schedule:
    - cron: "0 2 * * *" # 2 AM UTC daily

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Backup database
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            mkdir -p /var/log/repair-loop/backups
            cp /var/www/repair-loop/backend/game.db /var/log/repair-loop/backups/game_$(date +%Y%m%d_%H%M%S).db
            echo "Backup created successfully"
```

## Summary

You now have:

✅ Automated deployment on every push to `main`
✅ GitHub Actions triggers deployment script
✅ SSH connects to VPS securely
✅ Deploy script handles all updates
✅ Zero-downtime deployment via PM2
✅ Automatic database backups
✅ Logs viewable in GitHub Actions and on VPS

Your development workflow is now:

```
Code → Commit → Push → 🚀 Automatic Deployment → Live Update
```

No manual VPS login needed for regular updates!
