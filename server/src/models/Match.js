import mongoose from 'mongoose';

const matchPlayerSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true },
    displayName: { type: String, required: true },
  },
  { _id: false }
);

const userOutcomeSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true },
    result: {
      type: String,
      enum: ['win', 'loss', 'draw'],
      required: true,
    },
  },
  { _id: false }
);

const matchSchema = new mongoose.Schema(
  {
    gameId: { type: String, required: true },
    mode: {
      type: String,
      enum: ['multiplayer', 'bot', 'local'],
      default: 'multiplayer',
      required: true,
    },
    players: { type: [matchPlayerSchema], default: [] },
    userOutcomes: { type: [userOutcomeSchema], default: [] },
    winner: { type: String, default: 'draw' },
    status: {
      type: String,
      enum: ['finished'],
      required: true,
    },
    outcome: { type: String, default: 'draw' },
    detail: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
    finishedAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
  }
);

export const Match = mongoose.models.Match || mongoose.model('Match', matchSchema);
