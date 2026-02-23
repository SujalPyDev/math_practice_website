import { env } from '../config/env.js';

const isProd = env.NODE_ENV === 'production';

const baseCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  path: '/',
};

if (env.COOKIE_DOMAIN) {
  baseCookieOptions.domain = env.COOKIE_DOMAIN;
}

export const getAuthCookieOptions = (maxAgeMs) => ({
  ...baseCookieOptions,
  maxAge: maxAgeMs,
});

export const getClearCookieOptions = () => ({
  ...baseCookieOptions,
});
