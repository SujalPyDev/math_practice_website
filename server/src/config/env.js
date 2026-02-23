import dotenv from 'dotenv';

dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';

const requiredKeys = ['MONGODB_URI', 'JWT_SECRET'];
for (const key of requiredKeys) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

if (NODE_ENV === 'production' && !process.env.ADMIN_PASSWORD) {
  throw new Error('Missing required environment variable in production: ADMIN_PASSWORD');
}

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseTrustProxy = (value) => {
  if (value === undefined || value === null || value === '') return false;
  if (value === 'true') return true;
  if (value === 'false') return false;
  const asInt = Number.parseInt(value, 10);
  if (Number.isFinite(asInt)) return asInt;
  return value;
};

const parseOrigins = (value) => {
  if (!value) return ['http://localhost:5173'];
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

export const env = {
  NODE_ENV,
  PORT: toInt(process.env.PORT, 5174),
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '12h',
  JWT_REMEMBER_EXPIRES_IN: process.env.JWT_REMEMBER_EXPIRES_IN || '30d',
  COOKIE_NAME: process.env.COOKIE_NAME || 'mt_auth',
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || '',
  CORS_ORIGINS: parseOrigins(process.env.CORS_ORIGINS),
  TRUST_PROXY: parseTrustProxy(process.env.TRUST_PROXY),
  BCRYPT_SALT_ROUNDS: toInt(process.env.BCRYPT_SALT_ROUNDS, 12),
  ADMIN_USERNAME: process.env.ADMIN_USERNAME || 'Sujal',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'ChangeThisAdminPassword123!',
};
