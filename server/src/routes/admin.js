import express from 'express';
import bcrypt from 'bcrypt';
import { body } from 'express-validator';
import User from '../models/User.js';
import Session from '../models/Session.js';
import { env } from '../config/env.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { adminLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

router.use(requireAuth, requireAdmin, adminLimiter);

router.get(
  '/pending',
  asyncHandler(async (req, res) => {
    const users = await User.find({ approved: false })
      .sort({ createdAt: 1 })
      .lean();

    return res.json({
      users: users.map((user) => ({
        id: user._id.toString(),
        username: user.username,
        created_at: user.createdAt,
      })),
    });
  }),
);

router.get(
  '/overview',
  asyncHandler(async (req, res) => {
    const now = new Date();
    await Session.deleteMany({ expiresAt: { $lte: now } });

    const sessions = await Session.find({ expiresAt: { $gt: now } })
      .populate('user')
      .sort({ lastSeenAt: -1 })
      .lean();

    const sessionRows = sessions
      .filter((session) => session.user)
      .map((session) => ({
        id: session._id.toString(),
        user_id: session.user._id.toString(),
        username: session.user.username,
        role: session.user.role,
        approved: session.user.approved,
        created_at: session.createdAt,
        last_seen_at: session.lastSeenAt || session.createdAt,
        expires_at: session.expiresAt,
      }));

    const sessionSummary = await Session.aggregate([
      { $match: { expiresAt: { $gt: now } } },
      {
        $group: {
          _id: '$user',
          active_sessions: { $sum: 1 },
          last_seen_at: { $max: '$lastSeenAt' },
        },
      },
    ]);

    const summaryMap = new Map(
      sessionSummary.map((row) => [row._id.toString(), row]),
    );

    const users = await User.find().lean();
    const userRows = users
      .map((user) => {
        const summary = summaryMap.get(user._id.toString());
        return {
          id: user._id.toString(),
          username: user.username,
          role: user.role,
          approved: user.approved,
          created_at: user.createdAt,
          last_login_at: user.lastLoginAt || null,
          active_sessions: summary?.active_sessions || 0,
          last_seen_at: summary?.last_seen_at || null,
        };
      })
      .sort((a, b) => {
        const aTs = a.last_seen_at ? new Date(a.last_seen_at).getTime() : 0;
        const bTs = b.last_seen_at ? new Date(b.last_seen_at).getTime() : 0;
        return bTs - aTs;
      });

    return res.json({ sessions: sessionRows, users: userRows });
  }),
);

router.post(
  '/approve',
  [
    body('userId').isMongoId().withMessage('Invalid user ID.'),
    body('approved').isBoolean().withMessage('approved must be true or false.'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { userId } = req.body;
    const approved = req.body.approved === true || req.body.approved === 'true';

    const target = await User.findById(userId);
    if (!target) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (approved) {
      target.approved = true;
      await target.save();
      return res.json({ ok: true });
    }

    if (target.role === 'admin') {
      return res.status(400).json({ error: 'Admin user cannot be rejected.' });
    }

    await Session.deleteMany({ user: target._id });
    await User.deleteOne({ _id: target._id });

    return res.json({ ok: true });
  }),
);

router.post(
  '/password',
  [
    body('currentPassword').isString().withMessage('Current password is required.'),
    body('newPassword')
      .isString()
      .withMessage('New password is required.')
      .isLength({ min: 6, max: 72 })
      .withMessage('New password must be 6-72 characters.'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const admin = await User.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({ error: 'Admin user not found.' });
    }

    const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    admin.passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_SALT_ROUNDS);
    await admin.save();

    await Session.deleteMany({
      user: admin._id,
      _id: { $ne: req.auth.sessionId },
    });

    return res.json({ message: 'Password updated.' });
  }),
);

export default router;
