import { useMemo, useState } from 'react';
import { User, Trophy, Gamepad2, Clock, TrendingUp, TrendingDown, Minus, History } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import useGameStats from '../hooks/useGameStats';
import { formatNameWithGuestBadge } from '../utils/guestIdentity';
import { getPresetAvatar, PRESET_AVATAR_IDS, resolveUserAvatar } from '../utils/avatarMap';

const GAME_LABELS = { chess: 'Chess', connectfour: 'Connect Four', battleship: 'Battleship' };
const RESULT_COLORS = { win: 'text-success', loss: 'text-danger', draw: 'text-warning' };
const MODE_LABELS = { multiplayer: 'Online Match', bot: 'Bot Match', local: 'Local Match' };

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
  const { user, updateAvatar } = useAuth();
  const { stats, totals } = useGameStats();
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [selectedAvatarId, setSelectedAvatarId] = useState(user?.avatarId || 'avatar1');
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  const activeAvatarId = useMemo(
    () => String(user?.avatarId || 'avatar1').trim().toLowerCase() || 'avatar1',
    [user?.avatarId]
  );
  const profileAvatarSrc = useMemo(() => resolveUserAvatar(user), [user]);

  function openAvatarPicker() {
    setSelectedAvatarId(activeAvatarId);
    setAvatarError('');
    setIsAvatarPickerOpen(true);
  }

  function closeAvatarPicker() {
    if (savingAvatar) return;
    setIsAvatarPickerOpen(false);
  }

  async function handleSaveAvatar() {
    setAvatarError('');
    setSavingAvatar(true);
    try {
      await updateAvatar(selectedAvatarId);
      setIsAvatarPickerOpen(false);
    } catch (error) {
      setAvatarError(error?.message || 'Failed to update avatar.');
    } finally {
      setSavingAvatar(false);
    }
  }

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
            <div className="relative w-20 h-20">
              <button
                type="button"
                onClick={openAvatarPicker}
                className="w-20 h-20 rounded-full bg-card border-4 border-surface-alt overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/60"
                title="Choose avatar"
              >
                <img src={profileAvatarSrc} alt="Profile avatar" className="w-full h-full object-cover" />
              </button>
              <button
                type="button"
                onClick={openAvatarPicker}
                className="absolute -right-1 -bottom-1 text-[10px] font-semibold bg-accent hover:bg-accent-hover text-white px-2 py-1 rounded-full shadow-lg"
              >
                Edit
              </button>
            </div>
          </div>

          <h2 className="text-xl font-bold text-foreground">
            {formatNameWithGuestBadge(user?.displayName || 'Player', user?.uid)}
          </h2>
          <p className="text-sm text-muted">{user?.isGuest ? 'Guest account' : user?.email}</p>

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
                  <span className="text-[10px] uppercase tracking-wider text-accent/90 bg-accent/10 border border-accent/20 rounded px-1.5 py-0.5">
                    {MODE_LABELS[entry.mode] || 'Match'}
                  </span>
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

      {isAvatarPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={closeAvatarPicker}>
          <div
            className="w-full max-w-md bg-surface-alt border border-edge/50 rounded-2xl p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-foreground mb-1">Choose Your Avatar</h3>
            <p className="text-xs text-muted mb-4">Pick one preset avatar and save your profile.</p>

            <div className="grid grid-cols-4 gap-3">
              {PRESET_AVATAR_IDS.map((avatarId) => {
                const isSelected = selectedAvatarId === avatarId;
                return (
                  <button
                    type="button"
                    key={avatarId}
                    onClick={() => setSelectedAvatarId(avatarId)}
                    className={`rounded-xl p-1.5 border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-accent bg-accent/15'
                        : 'border-edge/40 hover:border-accent/50 hover:bg-card/40'
                    }`}
                  >
                    <img
                      src={getPresetAvatar(avatarId)}
                      alt={avatarId}
                      className="w-full aspect-square rounded-lg object-cover"
                    />
                  </button>
                );
              })}
            </div>

            {avatarError && (
              <p className="text-xs text-danger mt-3">{avatarError}</p>
            )}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                className="px-3 py-2 text-sm text-muted hover:text-foreground"
                onClick={closeAvatarPicker}
                disabled={savingAvatar}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 text-sm font-semibold bg-accent hover:bg-accent-hover text-white rounded-lg disabled:opacity-60"
                onClick={handleSaveAvatar}
                disabled={savingAvatar}
              >
                {savingAvatar ? 'Saving...' : 'Save Avatar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
