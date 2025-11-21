const path = require('path');
const dotenvPath = process.env.ENV_FILE || path.resolve(__dirname, '.env');

// Load .env before PM2 injects env vars, so a single file can hold all values.
require('dotenv').config({ path: dotenvPath });

const baseEnv = {
  NODE_ENV: process.env.NODE_ENV || 'production',
  PORT: process.env.PORT || 3000,
  DB_HOST: process.env.DB_HOST || '127.0.0.1',
  DB_PORT: process.env.DB_PORT || 3306,
  DB_USERNAME: process.env.DB_USERNAME || 'pay_breakfast',
  DB_PASSWORD: process.env.DB_PASSWORD || 'password',
  DB_NAME: process.env.DB_NAME || 'pay_breakfast',
  DB_CHARSET: process.env.DB_CHARSET || 'utf8mb4_unicode_ci',
  DB_TIMEZONE: process.env.DB_TIMEZONE || 'Z',
  JWT_SECRET: process.env.JWT_SECRET || 'change_this_secret',
  // Optional security/email extras
  RSA_PRIVATE_KEY: process.env.RSA_PRIVATE_KEY,
  RSA_PUBLIC_KEY: process.env.RSA_PUBLIC_KEY,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  TRUST_PROXY: process.env.TRUST_PROXY || '1',
};

module.exports = {
  apps: [
    {
      name: 'pay-breakfast-api',
      script: 'dist/main.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      node_args: '--enable-source-maps',
      // Allow pm2 to parse the same .env file when using `pm2 start ecosystem.config.js`.
      env_file: dotenvPath,
      env: {
        ...baseEnv,
        NODE_ENV: 'development',
      },
      env_production: {
        ...baseEnv,
        NODE_ENV: 'production',
      },
    },
  ],
};
