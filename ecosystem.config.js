module.exports = {
  apps: [
    {
      name: 'pay-breakfast-api',
      script: 'dist/main.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      node_args: '--enable-source-maps',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        DB_HOST: '127.0.0.1',
        DB_PORT: 3306,
        DB_USERNAME: 'pay_breakfast',
        DB_PASSWORD: 'password',
        DB_NAME: 'pay_breakfast',
        DB_CHARSET: 'utf8mb4_unicode_ci',
        JWT_SECRET: 'change_this_secret'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        DB_HOST: '127.0.0.1',
        DB_PORT: 3306,
        DB_USERNAME: 'pay_breakfast',
        DB_PASSWORD: 'password',
        DB_NAME: 'pay_breakfast',
        DB_CHARSET: 'utf8mb4_unicode_ci',
        JWT_SECRET: 'change_this_secret'
      }
    }
  ]
};
