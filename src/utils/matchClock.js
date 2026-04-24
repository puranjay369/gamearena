export const MATCH_CLOCK_INITIAL_MS = 10 * 60 * 1000;

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clampToZero(value) {
  return Math.max(0, Math.floor(value));
}

export function normalizeSeat(value) {
  if (value === 1 || value === '1' || value === 'w' || value === 'white') return 1;
  if (value === 2 || value === '2' || value === 'b' || value === 'black') return 2;
  return null;
}

export function resolveActiveSeatFromGameState(gameId, gameState) {
  if (!gameState || typeof gameState !== 'object') return 1;

  if (gameId === 'connect-four') {
    const seat = normalizeSeat(gameState.currentPlayer);
    return seat || 1;
  }

  if (gameId === 'chess') {
    const fen = String(gameState.fen || '').trim();
    const fenParts = fen.split(' ');
    const turn = fenParts.length > 1 ? fenParts[1] : 'w';
    return turn === 'b' ? 2 : 1;
  }

  return 1;
}

export function createMatchClock(options = {}) {
  const initialMs = clampToZero(toNumber(options.initialMs, MATCH_CLOCK_INITIAL_MS));
  const activeSeat = normalizeSeat(options.activePlayer) || 1;
  const nowMs = toNumber(options.nowMs, Date.now());
  const paused = Boolean(options.paused);

  return {
    player1RemainingTime: initialMs,
    player2RemainingTime: initialMs,
    activePlayerSeat: activeSeat,
    activeClockStartedAt: paused ? null : nowMs,
    isPaused: paused,
  };
}

export function resolveClock(clock, nowMs = Date.now()) {
  if (!clock || typeof clock !== 'object') {
    return createMatchClock({ nowMs });
  }

  let player1RemainingTime = clampToZero(toNumber(clock.player1RemainingTime, MATCH_CLOCK_INITIAL_MS));
  let player2RemainingTime = clampToZero(toNumber(clock.player2RemainingTime, MATCH_CLOCK_INITIAL_MS));
  const activePlayerSeat = normalizeSeat(clock.activePlayerSeat) || 1;
  const activeClockStartedAt = clock.activeClockStartedAt === null
    ? null
    : toNumber(clock.activeClockStartedAt, NaN);

  let isPaused = Boolean(clock.isPaused);
  if (!Number.isFinite(activeClockStartedAt)) {
    isPaused = true;
  }

  if (!isPaused && Number.isFinite(activeClockStartedAt)) {
    const elapsedMs = Math.max(0, toNumber(nowMs, Date.now()) - activeClockStartedAt);

    if (activePlayerSeat === 1) {
      player1RemainingTime = clampToZero(player1RemainingTime - elapsedMs);
    } else {
      player2RemainingTime = clampToZero(player2RemainingTime - elapsedMs);
    }
  }

  return {
    player1RemainingTime,
    player2RemainingTime,
    activePlayerSeat,
    activeClockStartedAt: isPaused ? null : activeClockStartedAt,
    isPaused,
  };
}

export function pauseMatchClock(clock, nowMs = Date.now()) {
  const resolved = resolveClock(clock, nowMs);
  return {
    ...resolved,
    activeClockStartedAt: null,
    isPaused: true,
  };
}

export function resumeMatchClock(clock, nowMs = Date.now()) {
  const resolved = resolveClock(clock, nowMs);

  if (resolved.player1RemainingTime <= 0 || resolved.player2RemainingTime <= 0) {
    return {
      ...resolved,
      activeClockStartedAt: null,
      isPaused: true,
    };
  }

  return {
    ...resolved,
    activeClockStartedAt: toNumber(nowMs, Date.now()),
    isPaused: false,
  };
}

export function switchMatchClockTurn(clock, nextActiveSeat, nowMs = Date.now()) {
  const resolved = resolveClock(clock, nowMs);
  const normalizedSeat = normalizeSeat(nextActiveSeat) || resolved.activePlayerSeat || 1;

  if (resolved.player1RemainingTime <= 0 || resolved.player2RemainingTime <= 0) {
    return {
      ...resolved,
      activePlayerSeat: normalizedSeat,
      activeClockStartedAt: null,
      isPaused: true,
    };
  }

  return {
    ...resolved,
    activePlayerSeat: normalizedSeat,
    activeClockStartedAt: toNumber(nowMs, Date.now()),
    isPaused: false,
  };
}

export function checkMatchClockTimeout(clock, nowMs = Date.now()) {
  const resolved = resolveClock(clock, nowMs);

  if (resolved.player1RemainingTime <= 0) {
    return {
      timedOutSeat: 1,
      clock: {
        ...resolved,
        activeClockStartedAt: null,
        isPaused: true,
      },
    };
  }

  if (resolved.player2RemainingTime <= 0) {
    return {
      timedOutSeat: 2,
      clock: {
        ...resolved,
        activeClockStartedAt: null,
        isPaused: true,
      },
    };
  }

  return {
    timedOutSeat: null,
    clock: resolved,
  };
}

export function getActiveClockRemaining(clock) {
  const resolved = resolveClock(clock, Date.now());
  return resolved.activePlayerSeat === 1
    ? resolved.player1RemainingTime
    : resolved.player2RemainingTime;
}

export function formatClockMs(ms) {
  const safe = clampToZero(toNumber(ms, 0));
  const totalSeconds = Math.ceil(safe / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
