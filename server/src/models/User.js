import mongoose from 'mongoose';

const PRESET_AVATAR_IDS = [
  'avatar1',
  'avatar2',
  'avatar3',
  'avatar4',
  'avatar5',
  'avatar6',
  'avatar7',
  'avatar8',
];

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
    avatarId: {
      type: String,
      enum: PRESET_AVATAR_IDS,
      default: 'avatar1',
    },
    stats: { type: userStatsSchema, default: () => ({}) },
    createdAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
  }
);

export const User = mongoose.models.User || mongoose.model('User', userSchema);
