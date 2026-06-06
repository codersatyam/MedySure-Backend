module.exports = {
  apps: [
    {
      name: 'medysure-api',
      script: 'src/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
      env_development: {
        NODE_ENV: 'development',
        watch: true,
        ignore_watch: ['node_modules', 'logs', 'tests'],
      },
    },
    {
      name: 'medysure-worker',
      script: 'src/workers/index.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
