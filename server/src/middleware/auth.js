import Session from '../models/Session.js';
import User, { toSafeUser } from '../models/User.js';
import { env } from '../config/env.js';
import { verifyAuthToken } from '../utils/tokens.js';

const TOUCH_INTERVAL_MS = 60 * 1000;

const unauthorized = (res) => res.status(401).json({ error: 'Unauthorized' });

export const requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.[env.COOKIE_NAME];
    if (!token) return unauthorized(res);

    let payload;
    try {
      payload = verifyAuthToken(token);
    } catch {
      return unauthorized(res);
    }

    const userId = payload?.sub;
    const sessionId = payload?.sid;
    if (!userId || !sessionId) return unauthorized(res);

    const now = new Date();
    const session = await Session.findOne({
      _id: sessionId,
      user: userId,
      expiresAt: { $gt: now },
    }).lean();

    if (!session) return unauthorized(res);

    const user = await User.findById(userId).lean();
    if (!user || !user.approved) {
      await Session.findByIdAndDelete(sessionId);
      return unauthorized(res);
    }

    const lastSeen = session.lastSeenAt ? new Date(session.lastSeenAt).getTime() : 0;
    if (Date.now() - lastSeen > TOUCH_INTERVAL_MS) {
      Session.findByIdAndUpdate(sessionId, { lastSeenAt: new Date() }).catch(() => {});
    }

    req.user = toSafeUser(user);
    req.auth = { sessionId };
    return next();
  } catch (error) {
    return next(error);
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  return next();
};
