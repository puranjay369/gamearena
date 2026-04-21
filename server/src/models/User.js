import mongoose from 'mongoose';

const userStatsSchema = new mongoose.Schema(
  {
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, unique: true, index: true },
    displayName: { type: String, required: true },
    stats: { type: userStatsSchema, default: () => ({}) },
    createdAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
  }
);

export const User = mongoose.models.User || mongoose.model('User', userSchema);
