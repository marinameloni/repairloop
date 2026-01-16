# 🚀 DEPLOYMENT GUIDE - Repair Loop

## Architecture de Déploiement

```
                    ┌─────────────────┐
                    │   Git Repository│
                    │   (GitHub)      │
                    └────────┬────────┘
                             │
                    (Push & Trigger)
                             │
                    ┌────────▼────────┐
                    │  GitHub Actions │
                    │  (CI/CD)        │
                    └────────┬────────┘
                             │
                    (SSH Deploy Script)
                             │
                    ┌────────▼────────────┐
                    │      VPS Server     │
                    │  ┌─────────────────┐│
                    │  │ Nginx (reverse) ││
                    │  │    proxy        ││
                    │  └────────┬────────┘│
                    │           │        │
                    │  ┌────────▼──────┐ │
                    │  │ PM2 (Backend)  │ │
                    │  │ :3001          │ │
                    │  └────────────────┘ │
                    │           │        │
                    │  ┌────────▼──────┐ │
                    │  │ Nuxt (Frontend)│ │
                    │  │ :3000          │ │
                    │  └────────────────┘ │
                    │           │        │
                    │  ┌────────▼──────┐ │
                    │  │ SQLite DB      │ │
                    │  │ game.db        │ │
                    │  └────────────────┘ │
                    └────────────────────┘
```

---

## ÉTAPE 1: Préparation du VPS

### 1. Installer Node.js et PM2

```bash
# SSH dans le VPS
ssh root@YOUR_VPS_IP

# Installer Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installer PM2 globalement
sudo npm install -g pm2

# Démarrer PM2 au boot
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root

# Installer Git
sudo apt-get install -y git

# Installer Nginx
sudo apt-get install -y nginx

# Installer Certbot pour HTTPS
sudo apt-get install -y certbot python3-certbot-nginx
```

### 2. Créer les répertoires d'application

```bash
# Répertoires de l'app
sudo mkdir -p /var/www/repair-loop
sudo mkdir -p /var/www/repair-loop/backend
sudo mkdir -p /var/www/repair-loop/frontend

# Permissions
sudo chown -R root:root /var/www/repair-loop
sudo chmod -R 755 /var/www/repair-loop

# Répertoires pour les logs
sudo mkdir -p /var/log/repair-loop
sudo chmod -R 755 /var/log/repair-loop
```

---

## ÉTAPE 2: Configuration de Nginx (Reverse Proxy)

Créer `/etc/nginx/sites-available/repair-loop.conf`:

```nginx
# Upstream backend
upstream backend {
    server localhost:3001;
}

# Upstream frontend
upstream frontend {
    server localhost:3000;
}

# Redirection HTTP → HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Compression
    gzip on;
    gzip_types text/plain text/css text/javascript application/json application/javascript application/xml+rss;
    gzip_min_length 1000;

    # Logs
    access_log /var/log/repair-loop/access.log;
    error_log /var/log/repair-loop/error.log;

    # Frontend (port 3000)
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API (port 3001)
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts pour les WebSockets
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # WebSocket (Socket.io)
    location /socket.io {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Activer la configuration:

```bash
# Créer symlink
sudo ln -s /etc/nginx/sites-available/repair-loop.conf /etc/nginx/sites-enabled/

# Tester la configuration
sudo nginx -t

# Redémarrer Nginx
sudo systemctl restart nginx
```

---

## ÉTAPE 3: SSL/HTTPS avec Let's Encrypt

```bash
# Générer certificat SSL gratuit
sudo certbot certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renouvellement (tous les 3 mois)
sudo certbot renew --quiet

# Vérifier que c'est en cron
sudo crontab -l | grep certbot
```

---

## ÉTAPE 4: Clone du Repository

```bash
cd /var/www/repair-loop

# Clone GitHub
git clone https://github.com/YOUR_USERNAME/repair-loop-game.git .

# Ou si privé, générer SSH key
ssh-keygen -t ed25519 -C "deploy@vps"
# Ajouter la clé publique à GitHub
```

---

## ÉTAPE 5: Configuration PM2

Créer `ecosystem.config.js` à la racine du projet:

```javascript
module.exports = {
  apps: [
    // Backend
    {
      name: "repair-loop-backend",
      script: "./backend/server.js",
      cwd: "/var/www/repair-loop",
      instances: 2,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        CORS_ORIGIN: "https://yourdomain.com",
        JWT_SECRET: "your-production-secret-key-here",
        DB_PATH: "/var/www/repair-loop/backend/game.db",
      },
      error_file: "/var/log/repair-loop/backend-error.log",
      out_file: "/var/log/repair-loop/backend-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      restart_delay: 4000,
      max_memory_restart: "500M",
    },

    // Frontend (Nuxt)
    {
      name: "repair-loop-frontend",
      script: "npm",
      args: "run start",
      cwd: "/var/www/repair-loop/frontend",
      instances: 1,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "/var/log/repair-loop/frontend-error.log",
      out_file: "/var/log/repair-loop/frontend-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      restart_delay: 4000,
      max_memory_restart: "1G",
    },
  ],
};
```

---

## ÉTAPE 6: Script de Déploiement Automatisé

Créer `deploy.sh` à la racine:

```bash
#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🚀 Déploiement de Repair Loop...${NC}"

APP_DIR="/var/www/repair-loop"

# 1. Pull du code
echo -e "${YELLOW}📥 Pulling latest code from GitHub...${NC}"
cd $APP_DIR
git pull origin main || { echo -e "${RED}❌ Git pull failed${NC}"; exit 1; }

# 2. Backend - Installation des dépendances
echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
cd $APP_DIR/backend
npm ci --omit=dev || { echo -e "${RED}❌ Backend npm install failed${NC}"; exit 1; }

# 3. Frontend - Build
echo -e "${YELLOW}🏗️ Building frontend...${NC}"
cd $APP_DIR/frontend
npm ci --omit=dev || { echo -e "${RED}❌ Frontend npm install failed${NC}"; exit 1; }
npm run build || { echo -e "${RED}❌ Frontend build failed${NC}"; exit 1; }

# 4. Database migration si nécessaire
echo -e "${YELLOW}🗄️ Checking database...${NC}"
cd $APP_DIR/backend
node init-db.js || { echo -e "${RED}❌ Database init failed${NC}"; exit 1; }

# 5. PM2 Restart
echo -e "${YELLOW}♻️ Restarting services with PM2...${NC}"
pm2 restart ecosystem.config.js --update-env || { echo -e "${RED}❌ PM2 restart failed${NC}"; exit 1; }

# 6. PM2 Save
pm2 save

# 7. Logs
echo -e "${YELLOW}📊 PM2 Status:${NC}"
pm2 status

echo -e "${GREEN}✅ Déploiement réussi!${NC}"
```

Rendre exécutable:

```bash
chmod +x deploy.sh
```

---

## ÉTAPE 7: GitHub Actions pour CI/CD Automatique

Créer `.github/workflows/deploy.yml`:

```yaml
name: Deploy to VPS

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Deploy via SSH
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /var/www/repair-loop
            /var/www/repair-loop/deploy.sh

      - name: Notify Slack (optional)
        if: success()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "✅ Repair Loop deployed successfully!"
            }
```

Ajouter les secrets GitHub:

1. Aller à: Settings → Secrets and variables → Actions
2. Ajouter:
   - `VPS_HOST`: votre IP du VPS
   - `VPS_USER`: root (ou autre user)
   - `VPS_SSH_KEY`: votre clé SSH privée

---

## ÉTAPE 8: Workflow de Déploiement Continu

### Pour les petites mises à jour:

```bash
# 1. Modifier localement
# 2. Commit et push
git add .
git commit -m "Fix: update login validation"
git push origin main

# 3. GitHub Actions s'exécute automatiquement
# 4. Votre site est à jour en 2-3 minutes!
```

### Pour les déploiements manuels:

```bash
# SSH dans le VPS
ssh root@YOUR_VPS_IP

# Exécuter le script de déploiement
/var/www/repair-loop/deploy.sh

# Vérifier les logs
pm2 logs repair-loop-backend
pm2 logs repair-loop-frontend
```

---

## ÉTAPE 9: Monitoring et Maintenance

### Logs en temps réel:

```bash
# Backend logs
pm2 logs repair-loop-backend

# Frontend logs
pm2 logs repair-loop-frontend

# Tous les logs
pm2 logs

# Nginx logs
tail -f /var/log/repair-loop/access.log
tail -f /var/log/repair-loop/error.log
```

### Status:

```bash
pm2 status
pm2 monit  # Dashboard interactif
```

### Redémarrage de services:

```bash
pm2 restart repair-loop-backend
pm2 restart repair-loop-frontend
pm2 restart all
```

### Database backup:

```bash
# Backup quotidien (ajouter en cron)
0 2 * * * cp /var/www/repair-loop/backend/game.db /var/backups/game_$(date +\%Y\%m\%d).db
```

---

## WORKFLOW RECOMMANDÉ

### Jour 1: Setup initial

```bash
1. SSH VPS
2. Installer Node.js, PM2, Nginx, Git
3. Générer certificat SSL
4. Clone du repo
5. npm install + build
6. Configurer PM2 et Nginx
7. Test: curl https://yourdomain.com
```

### Maintenance régulière

```bash
1. Modifier le code localement
2. Tester en local (npm run dev)
3. Commit et push sur main
4. GitHub Actions déploie automatiquement
5. Vérifier les logs: pm2 logs
```

### Rollback en cas de problème

```bash
1. git log --oneline
2. git revert COMMIT_HASH
3. git push origin main
4. GitHub Actions redéploie
```

---

## TIPS DE PERFORMANCE

### 1. Compression Gzip

```nginx
gzip on;
gzip_types text/plain text/css text/javascript application/json application/javascript;
```

### 2. Cache Assets

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. Database Optimization

```bash
# Indexer les colonnes fréquemment cherchées
sqlite3 game.db
> CREATE INDEX idx_players_username ON players(username);
```

### 4. PM2 Clustering

```javascript
instances: 'max',  // Utiliser tous les CPU cores
exec_mode: 'cluster'
```

---

## CHECKLIST DE SÉCURITÉ

- [ ] HTTPS activé et certificat valide
- [ ] Nginx rate limiting activé
- [ ] Firewall (UFW) configuré
- [ ] SSH key-based auth seulement (pas de password)
- [ ] JWT_SECRET unique et fort en production
- [ ] CORS_ORIGIN = votre domaine
- [ ] Backups automatisés
- [ ] Logs centralisés et monitores
- [ ] Fail2ban pour protection brute-force
- [ ] Monitoring uptime (StatusCake, UptimeRobot)

---

## TROUBLESHOOTING

**Nginx ne démarre pas:**

```bash
sudo nginx -t  # Test config
sudo systemctl restart nginx
```

**PM2 ne redémarre pas:**

```bash
pm2 kill
pm2 start ecosystem.config.js
pm2 save
```

**Port 3000/3001 déjà utilisé:**

```bash
lsof -i :3000
kill -9 PID
```

**Certificat SSL expiré:**

```bash
sudo certbot renew --force-renewal
sudo systemctl restart nginx
```

---

**Résumé: Vous pouvez maintenant déployer en 1 commande! 🚀**
