import { Chess } from 'chess.js';

export const GAME_STATUS = {
  PLAYING: 'playing',
  WON: 'won',
  DRAW: 'draw',
};

export const MOVE_ERRORS = {
  INVALID_MOVE: 'INVALID_MOVE',
  NOT_YOUR_TURN: 'NOT_YOUR_TURN',
  GAME_FINISHED: 'GAME_FINISHED',
  PROMOTION_REQUIRED: 'PROMOTION_REQUIRED',
};

function normalizeMove(move) {
  if (!move || typeof move !== 'object') return null;

  const from = typeof move.from === 'string' ? move.from.trim().toLowerCase() : '';
  const to = typeof move.to === 'string' ? move.to.trim().toLowerCase() : '';
  const promotionRaw = typeof move.promotion === 'string' ? move.promotion.trim().toLowerCase() : '';

  if (!from || !to) return null;

  const normalized = { from, to };
  if (promotionRaw) normalized.promotion = promotionRaw;
  return normalized;
}

function normalizePlayer(player) {
  if (player === 1 || player === '1' || player === 'w' || player === 'white') return 'w';
  if (player === 2 || player === '2' || player === 'b' || player === 'black') return 'b';
  return null;
}

function isPromotionRequired(chess, move) {
  const piece = chess.get(move.from);
  if (!piece || piece.type !== 'p') return false;

  const targetRank = move.to[1];
  return (piece.color === 'w' && targetRank === '8') || (piece.color === 'b' && targetRank === '1');
}

function getStatusFromChess(chess) {
  if (chess.isCheckmate()) {
    const winner = chess.turn() === 'w' ? 'b' : 'w';
    return { status: GAME_STATUS.WON, winner };
  }

  if (chess.isDraw()) {
    return { status: GAME_STATUS.DRAW, winner: null };
  }

  return { status: GAME_STATUS.PLAYING, winner: null };
}

function isValidStateShape(state) {
  if (!state || typeof state !== 'object') return false;
  if (typeof state.fen !== 'string' || !state.fen.trim()) return false;
  if (!Object.values(GAME_STATUS).includes(state.status)) return false;

  const validWinner = state.winner === null || state.winner === 'w' || state.winner === 'b';
  if (!validWinner) return false;

  if (state.lastMove === null) return true;

  if (typeof state.lastMove !== 'object') return false;
  if (typeof state.lastMove.from !== 'string' || typeof state.lastMove.to !== 'string') return false;

  if (state.lastMove.promotion !== undefined && typeof state.lastMove.promotion !== 'string') return false;

  return true;
}

export function createInitialState() {
  const chess = new Chess();
  return {
    fen: chess.fen(),
    status: GAME_STATUS.PLAYING,
    winner: null,
    lastMove: null,
  };
}

export function getStatus(state) {
  if (!state || typeof state.fen !== 'string') {
    return { status: GAME_STATUS.DRAW, winner: null };
  }

  try {
    const chess = new Chess(state.fen);
    return getStatusFromChess(chess);
  } catch {
    return { status: GAME_STATUS.DRAW, winner: null };
  }
}

export function validateMove(state, move) {
  if (!isValidStateShape(state)) return false;
  if (state.status !== GAME_STATUS.PLAYING) return false;

  const normalizedMove = normalizeMove(move);
  if (!normalizedMove) return false;

  try {
    const chess = new Chess(state.fen);

    if (isPromotionRequired(chess, normalizedMove) && !normalizedMove.promotion) {
      return false;
    }

    const legalMoves = chess.moves({ verbose: true });
    return legalMoves.some((legalMove) => {
      const promotion = legalMove.promotion || undefined;
      return (
        legalMove.from === normalizedMove.from
        && legalMove.to === normalizedMove.to
        && promotion === normalizedMove.promotion
      );
    });
  } catch {
    return false;
  }
}

export function applyMove(state, move, player) {
  if (!isValidStateShape(state)) {
    return { ok: false, error: MOVE_ERRORS.INVALID_MOVE };
  }

  if (state.status !== GAME_STATUS.PLAYING) {
    return { ok: false, error: MOVE_ERRORS.GAME_FINISHED };
  }

  const actor = normalizePlayer(player);
  if (!actor) {
    return { ok: false, error: MOVE_ERRORS.INVALID_MOVE };
  }

  const normalizedMove = normalizeMove(move);
  if (!normalizedMove) {
    return { ok: false, error: MOVE_ERRORS.INVALID_MOVE };
  }

  let chess;
  try {
    chess = new Chess(state.fen);
  } catch {
    return { ok: false, error: MOVE_ERRORS.INVALID_MOVE };
  }

  if (chess.turn() !== actor) {
    return { ok: false, error: MOVE_ERRORS.NOT_YOUR_TURN };
  }

  if (isPromotionRequired(chess, normalizedMove) && !normalizedMove.promotion) {
    return { ok: false, error: MOVE_ERRORS.PROMOTION_REQUIRED };
  }

  try {
    const appliedMove = chess.move({
      from: normalizedMove.from,
      to: normalizedMove.to,
      promotion: normalizedMove.promotion,
    });

    if (!appliedMove) {
      return { ok: false, error: MOVE_ERRORS.INVALID_MOVE };
    }

    const { status, winner } = getStatusFromChess(chess);

    const lastMove = {
      from: appliedMove.from,
      to: appliedMove.to,
    };

    if (appliedMove.promotion) {
      lastMove.promotion = appliedMove.promotion;
    }

    return {
      ok: true,
      state: {
        fen: chess.fen(),
        status,
        winner,
        lastMove,
      },
    };
  } catch {
    return { ok: false, error: MOVE_ERRORS.INVALID_MOVE };
  }
}
