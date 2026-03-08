import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

const STATS_KEY = 'gamearena_stats';

function getAllStats() {
  try {
    return JSON.parse(localStorage.getItem(STATS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveAllStats(stats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

/**
 * Per-user game stats stored in localStorage.
 * Structure:  { [uid]: { chess: { wins, losses, draws }, connectfour: {...}, battleship: {...}, history: [...] } }
 */
export default function useGameStats() {
  const { user } = useAuth();

  const getStats = useCallback(() => {
    if (!user) return null;
    const all = getAllStats();
    return all[user.uid] || {
      chess: { wins: 0, losses: 0, draws: 0 },
      connectfour: { wins: 0, losses: 0, draws: 0 },
      battleship: { wins: 0, losses: 0, draws: 0 },
      history: [],
    };
  }, [user]);

  /**
   * Record a finished game.
   * @param {'chess'|'connectfour'|'battleship'} game
   * @param {'win'|'loss'|'draw'} result
   * @param {string} [detail] - optional short detail e.g. "Checkmate", "by resignation"
   */
  const recordResult = useCallback(
    (game, result, detail) => {
      if (!user) return;
      const all = getAllStats();
      const userStats = all[user.uid] || {
        chess: { wins: 0, losses: 0, draws: 0 },
        connectfour: { wins: 0, losses: 0, draws: 0 },
        battleship: { wins: 0, losses: 0, draws: 0 },
        history: [],
      };

      // Update game-specific counters
      if (result === 'win') userStats[game].wins += 1;
      else if (result === 'loss') userStats[game].losses += 1;
      else if (result === 'draw') userStats[game].draws += 1;

      // Append to history (keep last 50)
      userStats.history = [
        {
          game,
          result,
          detail: detail || null,
          date: new Date().toISOString(),
        },
        ...(userStats.history || []),
      ].slice(0, 50);

      all[user.uid] = userStats;
      saveAllStats(all);
    },
    [user],
  );

  const stats = getStats();

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

  return { stats, totals, recordResult };
}
