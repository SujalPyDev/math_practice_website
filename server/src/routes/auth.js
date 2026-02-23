import express from 'express';
import bcrypt from 'bcrypt';
import ms from 'ms';
import { body } from 'express-validator';
import User, { toSafeUser } from '../models/User.js';
import Session from '../models/Session.js';
import { env } from '../config/env.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { decodeAuthToken, signAuthToken } from '../utils/tokens.js';
import { getAuthCookieOptions, getClearCookieOptions } from '../utils/cookies.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const usernameValidator = body('username')
  .trim()
  .isLength({ min: 3, max: 20 })
  .withMessage('Username must be 3-20 characters.')
  .matches(/^[a-zA-Z0-9_]+$/)
  .withMessage('Username can only use letters, numbers, and _.');

const passwordValidator = body('password')
  .isString()
  .withMessage('Password is required.')
  .isLength({ min: 6, max: 72 })
  .withMessage('Password must be 6-72 characters.');

router.post(
  '/register',
  authLimiter,
  [usernameValidator, passwordValidator],
  validate,
  asyncHandler(async (req, res) => {
    const username = req.body.username.trim();
    const usernameLower = username.toLowerCase();
    const password = req.body.password;

    const exists = await User.findOne({ usernameLower }).lean();
    if (exists) {
      return res.status(409).json({ error: 'Username already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
    await User.create({
      username,
      passwordHash,
      role: 'user',
      approved: false,
    });

    return res.status(201).json({ message: 'Registered. Awaiting admin approval.' });
  }),
);

router.post(
  '/login',
  authLimiter,
  [
    usernameValidator,
    body('password').isString().withMessage('Password is required.'),
    body('remember').optional().isBoolean().withMessage('remember must be true or false.'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const username = req.body.username.trim();
    const usernameLower = username.toLowerCase();
    const password = req.body.password;
    const remember = req.body.remember === true || req.body.remember === 'true';

    const user = await User.findOne({ usernameLower });
    const validPassword = user ? await bcrypt.compare(password, user.passwordHash) : false;

    if (!user || !validPassword) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    if (!user.approved) {
      return res.status(403).json({ error: 'Awaiting admin approval.', code: 'PENDING' });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const expiresIn = remember ? env.JWT_REMEMBER_EXPIRES_IN : env.JWT_EXPIRES_IN;
    const maxAgeMs = ms(expiresIn);
    if (!Number.isFinite(maxAgeMs) || maxAgeMs <= 0) {
      throw new Error('Invalid JWT expiration configuration.');
    }

    const session = await Session.create({
      user: user._id,
      expiresAt: new Date(Date.now() + maxAgeMs),
      lastSeenAt: new Date(),
      userAgent: req.get('user-agent') || '',
      ipAddress: req.ip || '',
    });

    const token = signAuthToken(
      {
        userId: user._id.toString(),
        role: user.role,
        sessionId: session._id.toString(),
      },
      expiresIn,
    );

    res.cookie(env.COOKIE_NAME, token, getAuthCookieOptions(maxAgeMs));

    return res.json({ user: toSafeUser(user) });
  }),
);

router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[env.COOKIE_NAME];
    if (token) {
      const decoded = decodeAuthToken(token);
      if (decoded?.sid) {
        await Session.findByIdAndDelete(decoded.sid);
      }
    }

    res.clearCookie(env.COOKIE_NAME, getClearCookieOptions());
    return res.json({ message: 'Logged out.' });
  }),
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    return res.json({ user: req.user });
  }),
);

export default router;
