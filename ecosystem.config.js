module.exports = {
  apps: [
    {
      name: 'esparex-backend',
      script: 'dist/index.js',
      cwd: './user-backend',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      },
      error_file: '../logs/backend-error.log',
      out_file: '../logs/backend-out.log',
      merge_logs: true,
      time: true
    },
    {
      name: 'esparex-admin-backend',
      script: 'dist/server.js',
      cwd: './admin-backend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
        PORT: 5002
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5002
      },
      error_file: '../logs/admin-error.log',
      out_file: '../logs/admin-out.log',
      merge_logs: true,
      time: true
    }
  ]
};
