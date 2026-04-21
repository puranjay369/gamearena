import { isDbConnected } from '../db/connect.js';
import { Match } from '../models/Match.js';
import { User } from '../models/User.js';

const DRAW = 'draw';
const VALID_MODES = new Set(['multiplayer', 'bot', 'local']);
const VALID_RESULTS = new Set(['win', 'loss', 'draw']);

function invertResult(result) {
  if (result === 'win') return 'loss';
  if (result === 'loss') return 'win';
  return 'draw';
}

function normalizeGameId(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'connectfour' || raw === 'connect-four') return 'connect-four';
  if (raw === 'chess') return 'chess';
  if (raw === 'battleship') return 'battleship';
  return raw;
}

function buildUserOutcomes(participants, winnerUid) {
  if (winnerUid === DRAW) {
    return participants.map((player) => ({ uid: player.uid, result: 'draw' }));
  }

  return participants.map((player) => ({
    uid: player.uid,
    result: player.uid === winnerUid ? 'win' : 'loss',
  }));
}

function normalizeParticipants(players = []) {
  return players
    .map((player) => ({
      uid: String(player?.playerId || '').trim(),
      displayName: String(player?.displayName || '').trim() || 'Player',
      seat: player?.seat,
    }))
    .filter((player) => Boolean(player.uid));
}

function resolveWinnerUid(room, participants) {
  const state = room?.gameState;
  if (!state) return DRAW;

  if (state.status === DRAW || state.winner === DRAW || state.winner === null || state.winner === undefined) {
    return DRAW;
  }

  if (room.gameId === 'connect-four') {
    const winnerSeat = Number(state.winner);
    const winner = participants.find((player) => player.seat === winnerSeat);
    return winner?.uid || DRAW;
  }

  if (room.gameId === 'chess') {
    const winnerSeat = state.winner === 'w' ? 1 : state.winner === 'b' ? 2 : null;
    const winner = participants.find((player) => player.seat === winnerSeat);
    return winner?.uid || DRAW;
  }

  return String(state.winner || '').trim() || DRAW;
}

async function upsertUserIdentity(uid, displayName) {
  await User.updateOne(
    { uid },
    {
      $set: { displayName },
      $setOnInsert: {
        uid,
        createdAt: new Date(),
        stats: { wins: 0, losses: 0, draws: 0 },
      },
    },
    { upsert: true }
  );
}

export async function ensureUserProfile({ uid, displayName }) {
  if (!isDbConnected()) return;

  const normalizedUid = String(uid || '').trim();
  if (!normalizedUid) return;

  const normalizedName = String(displayName || '').trim() || 'Player';
  await upsertUserIdentity(normalizedUid, normalizedName);
}

export async function persistFinishedMatch(room) {
  if (!isDbConnected()) return;
  if (!room || room.status !== 'finished' || !room.gameState) return;

  const participants = normalizeParticipants(room.players);
  if (participants.length === 0) return;

  await Promise.all(participants.map((player) => upsertUserIdentity(player.uid, player.displayName)));

  const winnerUid = resolveWinnerUid(room, participants);
  const finishedAt = new Date();
  const userOutcomes = buildUserOutcomes(participants, winnerUid);

  await Match.create({
    gameId: normalizeGameId(room.gameId),
    mode: 'multiplayer',
    players: participants.map((player) => ({ uid: player.uid, displayName: player.displayName })),
    userOutcomes,
    winner: winnerUid,
    status: 'finished',
    outcome: String(room.gameState.status || 'finished'),
    detail: null,
    createdAt: room.createdAt ? new Date(room.createdAt) : finishedAt,
    finishedAt,
  });

  const winUids = userOutcomes.filter((entry) => entry.result === 'win').map((entry) => entry.uid);
  const lossUids = userOutcomes.filter((entry) => entry.result === 'loss').map((entry) => entry.uid);
  const drawUids = userOutcomes.filter((entry) => entry.result === 'draw').map((entry) => entry.uid);

  if (winUids.length > 0) {
    await User.updateMany({ uid: { $in: winUids } }, { $inc: { 'stats.wins': 1 } });
  }

  if (lossUids.length > 0) {
    await User.updateMany({ uid: { $in: lossUids } }, { $inc: { 'stats.losses': 1 } });
  }

  if (drawUids.length > 0) {
    await User.updateMany({ uid: { $in: drawUids } }, { $inc: { 'stats.draws': 1 } });
  }
}

export async function persistClientFinishedMatch(payload) {
  if (!isDbConnected()) return null;

  const status = String(payload?.status || '').trim().toLowerCase();
  if (status !== 'finished') return null;

  const uid = String(payload?.uid || '').trim();
  const displayName = String(payload?.displayName || '').trim() || 'Player';
  const result = String(payload?.result || '').trim().toLowerCase();
  const mode = String(payload?.mode || '').trim().toLowerCase();
  const gameId = normalizeGameId(payload?.gameId);
  const detail = typeof payload?.detail === 'string' ? payload.detail.trim() || null : null;

  if (!uid || !displayName || !gameId) return null;
  if (!VALID_RESULTS.has(result) || !VALID_MODES.has(mode)) return null;

  await upsertUserIdentity(uid, displayName);

  const opponentLabel = mode === 'bot' ? 'Bot' : mode === 'local' ? 'Local Opponent' : 'Opponent';
  const opponentUid = mode === 'bot' ? `bot_${gameId}` : mode === 'local' ? `local_${gameId}` : `opponent_${gameId}`;

  const participants = [
    { uid, displayName },
    { uid: opponentUid, displayName: opponentLabel },
  ];

  const winner = result === 'win' ? uid : result === 'loss' ? opponentUid : DRAW;
  const userOutcomes = [
    { uid, result },
    { uid: opponentUid, result: invertResult(result) },
  ];

  const finishedAt = payload?.finishedAt ? new Date(payload.finishedAt) : new Date();

  const match = await Match.create({
    gameId,
    mode,
    players: participants,
    userOutcomes,
    winner,
    status: 'finished',
    outcome: result === 'draw' ? 'draw' : 'won',
    detail,
    createdAt: finishedAt,
    finishedAt,
  });

  if (result === 'win') {
    await User.updateOne({ uid }, { $inc: { 'stats.wins': 1 } });
  } else if (result === 'loss') {
    await User.updateOne({ uid }, { $inc: { 'stats.losses': 1 } });
  } else {
    await User.updateOne({ uid }, { $inc: { 'stats.draws': 1 } });
  }

  return match;
}

export async function getMatchesForUser(uid, limit = 50) {
  if (!isDbConnected()) return [];

  const normalizedUid = String(uid || '').trim();
  if (!normalizedUid) return [];

  const cappedLimit = Math.max(1, Math.min(Number(limit) || 50, 100));

  return Match.find({ 'userOutcomes.uid': normalizedUid })
    .sort({ finishedAt: -1, createdAt: -1 })
    .limit(cappedLimit)
    .lean();
}
