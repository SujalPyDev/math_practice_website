import bcrypt from 'bcrypt';
import { env } from '../config/env.js';
import User from '../models/User.js';

export const ensureAdminUser = async () => {
  const username = env.ADMIN_USERNAME.trim();
  const usernameLower = username.toLowerCase();

  let admin = await User.findOne({ usernameLower });

  if (!admin) {
    const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, env.BCRYPT_SALT_ROUNDS);
    admin = await User.create({
      username,
      passwordHash,
      role: 'admin',
      approved: true,
    });
    console.log(`Created admin user: ${admin.username}`);
    return;
  }

  let changed = false;
  if (admin.role !== 'admin') {
    admin.role = 'admin';
    changed = true;
  }
  if (!admin.approved) {
    admin.approved = true;
    changed = true;
  }
  if (changed) {
    await admin.save();
  }
};
