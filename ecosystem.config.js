module.exports = {
  apps: [
    // Backend Node.js
    {
      name: 'repair-loop-backend',
      script: './backend/server.js',
      cwd: '/var/www/repair-loop',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        CORS_ORIGIN: 'https://yourdomain.com',
        JWT_SECRET: 'CHANGE_THIS_IN_PRODUCTION_WITH_STRONG_SECRET',
        DB_PATH: '/var/www/repair-loop/backend/game.db'
      },
      error_file: '/var/log/repair-loop/backend-error.log',
      out_file: '/var/log/repair-loop/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      restart_delay: 4000,
      max_memory_restart: '500M',
      watch: false,
      ignore_watch: ['node_modules', '.git'],
      merge_logs: true
    },
    
    // Frontend Nuxt
    {
      name: 'repair-loop-frontend',
      script: './frontend/.output/server/index.mjs',
      cwd: '/var/www/repair-loop',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0',
        NITRO_HOST: '0.0.0.0'
      },
      error_file: '/var/log/repair-loop/frontend-error.log',
      out_file: '/var/log/repair-loop/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      restart_delay: 4000,
      max_memory_restart: '1G',
      watch: false,
      ignore_watch: ['node_modules', '.git'],
      merge_logs: true
    }
  ],
  
  // Deploy configuration
  deploy: {
    production: {
      user: 'root',
      host: 'YOUR_VPS_IP',
      ref: 'origin/main',
      repo: 'https://github.com/YOUR_USERNAME/repair-loop-game.git',
      path: '/var/www/repair-loop',
      'post-deploy': 'npm ci && pm2 restart ecosystem.config.js --update-env',
      'pre-deploy-local': ''
    }
  }
}
