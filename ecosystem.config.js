const path = require('path');
const dotenvPath = process.env.ENV_FILE || path.resolve(__dirname, '.env');

// Load .env first so PM2 picks up every key defined there.
const dotenvResult = require('dotenv').config({ path: dotenvPath });
if (dotenvResult.error) {
  console.warn('[ecosystem] No .env file found at', dotenvPath, '- relying on process environment.');
}

// Mirror every variable (including those injected by PM2 or the shell) so the
// runtime sees exactly what is present in .env / ENV_FILE. Defaults should live
// in .env, not in this file.
const baseEnv = { ...process.env };

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
