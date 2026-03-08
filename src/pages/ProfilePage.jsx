import { User, Trophy, Gamepad2, Clock, TrendingUp, TrendingDown, Minus, History } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import useGameStats from '../hooks/useGameStats';

const GAME_LABELS = { chess: 'Chess', connectfour: 'Connect Four', battleship: 'Battleship' };
const RESULT_COLORS = { win: 'text-success', loss: 'text-danger', draw: 'text-warning' };

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function formatHistoryDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function winRate(wins, total) {
  if (total === 0) return '—';
  return `${Math.round((wins / total) * 100)}%`;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { stats, totals } = useGameStats();

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <User className="w-7 h-7 text-accent" />
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Profile</h1>
      </div>

      {/* Profile card */}
      <div className="bg-surface-alt border border-edge/50 rounded-2xl overflow-hidden max-w-3xl">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-r from-accent/30 to-purple-500/30" />

        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="relative -mt-10 mb-4">
            <div className="w-20 h-20 rounded-full bg-card border-4 border-surface-alt flex items-center justify-center">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-muted" />
              )}
            </div>
          </div>

          <h2 className="text-xl font-bold text-foreground">{user?.displayName || 'Player'}</h2>
          <p className="text-sm text-muted">{user?.email}</p>

          {/* Overall stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {[
              { icon: Gamepad2, label: 'Games Played', value: totals.gamesPlayed, color: 'text-accent' },
              { icon: Trophy, label: 'Wins', value: totals.wins, color: 'text-success' },
              { icon: TrendingDown, label: 'Losses', value: totals.losses, color: 'text-danger' },
              { icon: Clock, label: 'Joined', value: formatDate(user?.createdAt), color: 'text-accent' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-card/50 border border-edge/30 rounded-xl p-4 text-center"
              >
                <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-2`} />
                <div className="text-lg font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Per-game breakdown */}
          <h3 className="text-sm font-semibold text-foreground mt-8 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent" /> Stats by Game
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {stats && ['chess', 'connectfour', 'battleship'].map((key) => {
              const g = stats[key];
              const total = g.wins + g.losses + g.draws;
              return (
                <div key={key} className="bg-card/50 border border-edge/30 rounded-xl p-4">
                  <div className="text-sm font-semibold text-foreground mb-2">{GAME_LABELS[key]}</div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <div className="text-base font-bold text-success">{g.wins}</div>
                      <div className="text-muted">W</div>
                    </div>
                    <div>
                      <div className="text-base font-bold text-danger">{g.losses}</div>
                      <div className="text-muted">L</div>
                    </div>
                    <div>
                      <div className="text-base font-bold text-warning">{g.draws}</div>
                      <div className="text-muted">D</div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted text-center">
                    Win rate: <span className="text-foreground font-semibold">{winRate(g.wins, total)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent match history */}
          <h3 className="text-sm font-semibold text-foreground mt-8 mb-3 flex items-center gap-2">
            <History className="w-4 h-4 text-accent" /> Recent Matches
          </h3>
          {stats?.history?.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {stats.history.slice(0, 15).map((entry, i) => (
                <div key={i} className="flex items-center gap-3 bg-card/50 border border-edge/20 rounded-lg px-3 py-2 text-xs">
                  <span className={`font-bold uppercase w-10 ${RESULT_COLORS[entry.result]}`}>
                    {entry.result}
                  </span>
                  <span className="text-foreground font-medium">{GAME_LABELS[entry.game] || entry.game}</span>
                  {entry.detail && <span className="text-muted">— {entry.detail}</span>}
                  <span className="ml-auto text-muted whitespace-nowrap">{formatHistoryDate(entry.date)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted bg-card/30 rounded-lg px-4 py-3">
              No games played yet. Start playing to build your match history!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
