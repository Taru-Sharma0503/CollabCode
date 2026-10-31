const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Search candidate paths for .env so it resolves regardless of CWD
const envCandidates = [
  path.resolve(__dirname, '../../.env'), // server/.env
  path.resolve(process.cwd(), 'server/.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../../../.env')
];

let envLoaded = false;
for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  dotenv.config({ override: true });
}

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  MONGODB_URI: process.env.MONGODB_URI || '',
  REDIS_URL: process.env.REDIS_URL || '',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'dev_collabcode_jwt_access_secret_32chars!',
  JWT_ACCESS_TTL: process.env.JWT_ACCESS_TTL || '15m',
  REFRESH_TOKEN_TTL_DAYS: parseInt(process.env.REFRESH_TOKEN_TTL_DAYS, 10) || 7,
  COOKIE_SECURE: process.env.COOKIE_SECURE === 'true',
  COOKIE_SAME_SITE: process.env.COOKIE_SAME_SITE || 'lax',
  PASSWORD_RESET_BASE_URL: process.env.PASSWORD_RESET_BASE_URL || 'http://localhost:5173/reset-password',
  EXECUTION_SERVICE_URL: process.env.EXECUTION_SERVICE_URL || '',
  EXECUTION_SERVICE_SECRET: process.env.EXECUTION_SERVICE_SECRET || ''
};

module.exports = env;
