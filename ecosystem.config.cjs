// ecosystem.config.cjs
// PM2 process manager configuration for RekaKarbon backend (bare-metal host deployment).
//
// Usage:
//   pm2 start ecosystem.config.cjs --env production   # first start
//   pm2 reload rekakarbon-backend --update-env        # zero-downtime reload (CI)
//   pm2 save                                          # persist process list across reboots
//
// NOTE: .cjs extension is required because the root package.json sets "type": "module".

module.exports = {
  apps: [
    {
      name: 'rekakarbon-backend',

      // Entry point — compiled NestJS output relative to repo root
      script: 'server/dist/main.js',
      cwd: './',

      // Environment: development
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },

      // Environment: production (activated with --env production)
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // Cluster mode: spawn one worker per CPU core for throughput & resilience
      instances: 'max',
      exec_mode: 'cluster',

      // Auto-restart the process on crash
      autorestart: true,

      // Never watch the filesystem in production — use CI deploys instead
      watch: false,

      // Restart if the process exceeds 512 MB to guard against memory leaks
      max_memory_restart: '512M',

      // Log configuration
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      merge_logs: true,

      // Graceful shutdown / startup
      kill_timeout: 5000,   // ms to wait for graceful SIGINT before SIGKILL
      wait_ready: true,     // wait for process.send('ready') before marking online
      listen_timeout: 10000, // ms to wait for the app to start listening
    },
  ],
};
