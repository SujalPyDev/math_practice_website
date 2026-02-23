import rateLimit from 'express-rate-limit';

const makeLimiter = ({ windowMs, max, message, skipSuccessfulRequests = false }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    message: { error: message },
  });

export const globalLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: 'Too many requests. Please try again in a few minutes.',
});

export const authLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
});

export const adminLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000,
  max: 120,
  message: 'Too many admin requests. Please slow down.',
});
