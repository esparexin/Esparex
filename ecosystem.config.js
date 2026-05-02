module.exports = {
  apps: [
    {
      name: 'esparex-backend',
      script: 'dist/backend/src/server.js',
      cwd: './backend',
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
      name: 'esparex-backend/admin',
      script: 'dist/backend/admin/src/server.js',
      cwd: './backend/admin',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      },
      error_file: '../logs/admin-error.log',
      out_file: '../logs/admin-out.log',
      merge_logs: true,
      time: true
    }
  ]
};
