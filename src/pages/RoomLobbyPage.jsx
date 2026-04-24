import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Copy, Check, Play, ArrowLeft, Share2 } from 'lucide-react';
import Button from '../components/Button';
import PlayerCard from '../components/PlayerCard';
import { useRoom } from '../contexts/RoomContext';
import { useAuth } from '../contexts/AuthContext';
import { formatNameWithGuestBadge } from '../utils/guestIdentity';
import { resolveUserAvatar } from '../utils/avatarMap';

const GAME_NAME_MAP = {
  chess: 'Chess',
  battleship: 'Battleship',
  'connect-four': 'Connect Four',
};

export default function RoomLobbyPage() {
  const { roomCode: roomCodeParam } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
  const {
    room,
    playerId,
    connected,
    loading,
    error,
    setActiveRoomCode,
    joinRoom,
    fetchRoomState,
    startGame,
    clearRoomError,
  } = useRoom();

  const roomCode = useMemo(() => String(roomCodeParam || '').toUpperCase(), [roomCodeParam]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrapLobby() {
      if (!roomCode) return;

      setActiveRoomCode(roomCode);
      clearRoomError();

      try {
        await joinRoom(roomCode);
      } catch (err) {
        if (err instanceof Error && err.code === 'MATCH_EXPIRED') {
          return;
        }

        // If join fails for an existing viewer state, attempt snapshot fetch.
        if (!cancelled) {
          await fetchRoomState(roomCode).catch(() => {});
        }
      }
    }

    bootstrapLobby();

    return () => {
      cancelled = true;
    };
  }, [roomCode, setActiveRoomCode, joinRoom, fetchRoomState, clearRoomError]);

  useEffect(() => {
    if (!roomCode || !room) return;
    if (room.status !== 'active' || !room.gameId) return;

    navigate(`/game/${room.gameId}?roomCode=${encodeURIComponent(roomCode)}`, {
      replace: true,
    });
  }, [room, roomCode, navigate]);

  const gameName = room?.gameId ? (GAME_NAME_MAP[room.gameId] || room.gameId) : 'Room';
  const isHost = room?.hostPlayerId === playerId;
  const players = room?.players || [];

  const playerSlots = useMemo(
    () => [1, 2].map((seat) => players.find((entry) => entry.seat === seat) || null),
    [players]
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStart = async () => {
    if (!roomCode) return;

    setStarting(true);
    clearRoomError();

    try {
      await startGame(roomCode);
    } catch {
      // RoomContext already exposes a user-facing error message.
    } finally {
      setStarting(false);
    }
  };

  const playerCount = players.length;
  const canStart = isHost && room?.status === 'waiting' && playerCount === 2;
  const waitingMessage =
    room?.status === 'active'
      ? 'Game started. Redirecting players to the board...'
      : playerCount < 2
      ? 'Waiting for opponent to join...'
      : 'Ready to start.';

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        {/* Back */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-muted hover:text-foreground text-sm mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Lobby
        </button>

        {/* Card */}
        <div className="bg-surface-alt border border-edge/50 rounded-2xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-accent/20 to-purple-500/20 px-6 py-5 border-b border-edge/30">
            <h1 className="text-xl font-bold text-foreground">{gameName} — Room Lobby</h1>
            <p className="text-sm text-muted mt-1">
              {waitingMessage}
            </p>
          </div>

          <div className="p-6 space-y-6">
            {error && (
              <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            {!connected && (
              <div className="bg-warning/10 border border-warning/30 text-warning text-sm rounded-lg px-3 py-2">
                Reconnecting to server...
              </div>
            )}

            {loading && (
              <div className="bg-card/70 border border-edge/40 text-muted text-sm rounded-lg px-3 py-2">
                Syncing room state...
              </div>
            )}

            {/* Room Code */}
            <div className="bg-card/50 border border-edge/30 rounded-xl p-4">
              <div className="text-xs text-muted uppercase tracking-wider font-medium mb-2">
                Room Code
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-mono font-bold text-foreground tracking-widest flex-1">
                  {roomCode}
                </span>
                <button
                  onClick={handleCopy}
                  className="p-2 rounded-lg bg-surface-alt hover:bg-edge text-muted hover:text-foreground transition-all cursor-pointer"
                  title="Copy room code"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-success" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Players */}
            <div>
              <div className="text-xs text-muted uppercase tracking-wider font-medium mb-3">
                Players ({playerCount}/2)
              </div>
              <div className="space-y-2">
                {playerSlots.map((player, idx) => (
                  <PlayerCard
                    key={idx}
                    name={player ? `${formatNameWithGuestBadge(player.displayName, player.playerId)}${player.playerId === playerId ? ' (You)' : ''}` : null}
                    avatar={player?.playerId === playerId ? resolveUserAvatar(user) : null}
                    isHost={player ? player.playerId === room?.hostPlayerId : false}
                    isReady={room?.status === 'active'}
                    isConnected={player ? player.connected : false}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="secondary" className="flex-1" onClick={handleCopy}>
                <Share2 className="w-4 h-4 mr-2" />
                {copied ? 'Copied!' : 'Copy Room Code'}
              </Button>
              {isHost && (
                <Button variant="primary" className="flex-1" onClick={handleStart} disabled={!canStart || starting || loading}>
                  <Play className="w-4 h-4 mr-2" />
                  {starting ? 'Starting...' : room?.status === 'active' ? 'Game Started' : 'Start Game'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
