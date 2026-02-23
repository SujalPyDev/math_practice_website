import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
    userAgent: {
      type: String,
      default: '',
      maxlength: 500,
    },
    ipAddress: {
      type: String,
      default: '',
      maxlength: 128,
    },
  },
  { timestamps: true },
);

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Session = mongoose.model('Session', sessionSchema);

export default Session;
