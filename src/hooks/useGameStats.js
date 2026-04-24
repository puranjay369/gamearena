import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchMatches, saveFinishedMatch } from '../api/matches';
import { useAuth } from '../contexts/AuthContext';

const EMPTY_STATS = {
  chess: { wins: 0, losses: 0, draws: 0 },
  connectfour: { wins: 0, losses: 0, draws: 0 },
  battleship: { wins: 0, losses: 0, draws: 0 },
  history: [],
};

function normalizeGameId(game) {
  const raw = String(game || '').trim().toLowerCase();
  if (raw === 'connectfour' || raw === 'connect-four') return 'connect-four';
  if (raw === 'chess') return 'chess';
  if (raw === 'battleship') return 'battleship';
  return raw;
}

function toStatsKey(gameId) {
  if (gameId === 'connect-four') return 'connectfour';
  if (gameId === 'chess') return 'chess';
  if (gameId === 'battleship') return 'battleship';
  return null;
}

function normalizeMode(mode) {
  const raw = String(mode || '').trim().toLowerCase();
  if (raw === 'bot' || raw === 'local' || raw === 'multiplayer') return raw;
  return 'local';
}

function normalizeResult(result) {
  const raw = String(result || '').trim().toLowerCase();
  if (raw === 'won') return 'win';
  if (raw === 'lost') return 'loss';
  if (raw === 'win' || raw === 'loss' || raw === 'draw') return raw;
  return null;
}

function getResultForUser(match, uid) {
  const userOutcome = Array.isArray(match?.userOutcomes)
    ? match.userOutcomes.find((entry) => entry?.uid === uid)
    : null;

  const outcomeResult = normalizeResult(userOutcome?.result);
  if (outcomeResult) return outcomeResult;

  const directResult = normalizeResult(match?.result);
  if (directResult) return directResult;

  const outcomeResultLegacy = normalizeResult(match?.outcome);
  if (outcomeResultLegacy) return outcomeResultLegacy;

  if (match?.winner === 'draw') return 'draw';
  if (typeof match?.winner === 'string' && match.winner) {
    return match.winner === uid ? 'win' : 'loss';
  }

  return null;
}

function buildStatsFromMatches(matches, uid) {
  const next = {
    chess: { wins: 0, losses: 0, draws: 0 },
    connectfour: { wins: 0, losses: 0, draws: 0 },
    battleship: { wins: 0, losses: 0, draws: 0 },
    history: [],
  };

  for (const match of matches) {
    const gameKey = toStatsKey(normalizeGameId(match?.gameId || match?.game));
    if (!gameKey) continue;

    const result = getResultForUser(match, uid);
    if (!result) continue;

    if (result === 'win') next[gameKey].wins += 1;
    if (result === 'loss') next[gameKey].losses += 1;
    if (result === 'draw') next[gameKey].draws += 1;

    next.history.push({
      game: gameKey,
      result,
      mode: normalizeMode(match?.mode),
      detail: typeof match?.detail === 'string' ? match.detail : null,
      date: match?.finishedAt || match?.createdAt || new Date().toISOString(),
    });
  }

  next.history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  next.history = next.history.slice(0, 50);

  return next;
}

export default function useGameStats() {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user?.uid) {
      setMatches([]);
      return;
    }

    setLoading(true);
    try {
      const rows = await fetchMatches(user.uid, 100);
      setMatches(Array.isArray(rows) ? rows : []);
    } catch {
      // Keep UI functional with optimistic records when backend is unavailable.
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const recordResult = useCallback(
    async (game, result, detail, mode = 'local') => {
      if (!user) return;

      const normalizedGameId = normalizeGameId(game);
      const normalizedResult = normalizeResult(result);
      const normalizedMode = normalizeMode(mode);
      if (!normalizedGameId || !normalizedResult) return;

      const now = new Date().toISOString();
      const optimistic = {
        gameId: normalizedGameId,
        mode: normalizedMode,
        status: 'finished',
        outcome: normalizedResult === 'draw' ? 'draw' : 'won',
        detail: detail || null,
        createdAt: now,
        finishedAt: now,
        winner: normalizedResult === 'win' ? user.uid : normalizedResult === 'draw' ? 'draw' : `opponent_${normalizedGameId}`,
        userOutcomes: [{ uid: user.uid, result: normalizedResult }],
      };

      setMatches((prev) => [optimistic, ...prev].slice(0, 100));

      try {
        await saveFinishedMatch({
          uid: user.uid,
          displayName: user.displayName || user.email || 'Player',
          gameId: normalizedGameId,
          mode: normalizedMode,
          result: normalizedResult,
          detail: detail || null,
          status: 'finished',
          finishedAt: now,
        });

        await refresh();
      } catch {
        // Optimistic entry remains visible when API is temporarily unavailable.
      }
    },
    [user, refresh],
  );

  const stats = useMemo(() => {
    if (!user?.uid) return null;
    return buildStatsFromMatches(matches, user.uid);
  }, [matches, user]);

  const totals = stats
    ? {
        gamesPlayed:
          stats.chess.wins + stats.chess.losses + stats.chess.draws +
          stats.connectfour.wins + stats.connectfour.losses + stats.connectfour.draws +
          stats.battleship.wins + stats.battleship.losses + stats.battleship.draws,
        wins: stats.chess.wins + stats.connectfour.wins + stats.battleship.wins,
        losses: stats.chess.losses + stats.connectfour.losses + stats.battleship.losses,
        draws: stats.chess.draws + stats.connectfour.draws + stats.battleship.draws,
      }
    : { gamesPlayed: 0, wins: 0, losses: 0, draws: 0 };

  const fallbackStats = user?.stats || { wins: 0, losses: 0, draws: 0 };
  const fallbackGamesPlayed =
    Number(fallbackStats.wins || 0) + Number(fallbackStats.losses || 0) + Number(fallbackStats.draws || 0);

  const effectiveTotals = totals.gamesPlayed > 0
    ? totals
    : {
        gamesPlayed: fallbackGamesPlayed,
        wins: Number(fallbackStats.wins || 0),
        losses: Number(fallbackStats.losses || 0),
        draws: Number(fallbackStats.draws || 0),
      };

  return { stats: stats || EMPTY_STATS, totals: effectiveTotals, recordResult, loading };
}
