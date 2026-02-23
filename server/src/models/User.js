import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },
    usernameLower: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
    },
    approved: {
      type: Boolean,
      default: false,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

userSchema.pre('validate', function normalizeUsername(next) {
  if (typeof this.username === 'string') {
    this.username = this.username.trim();
    this.usernameLower = this.username.toLowerCase();
  }
  next();
});

export const toSafeUser = (userDoc) => ({
  id: userDoc._id.toString(),
  username: userDoc.username,
  role: userDoc.role,
  approved: Boolean(userDoc.approved),
});

const User = mongoose.model('User', userSchema);

export default User;
