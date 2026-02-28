import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Copy, Check, Play, ArrowLeft, Share2 } from 'lucide-react';
import Button from '../components/Button';
import PlayerCard from '../components/PlayerCard';

const mockPlayers = [
  { id: 1, name: 'Player1 (You)', isHost: true, isReady: true, isConnected: true },
  { id: 2, name: null, isHost: false, isReady: false, isConnected: false },
];

export default function RoomLobbyPage() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const roomCode = 'ARENA-X7K2';
  const isHost = true;

  const gameName =
    gameId === 'chess' ? 'Chess' : gameId === 'battleship' ? 'Battleship' : 'Connect Four';

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStart = () => {
    navigate(`/game/${gameId}`);
  };

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
              Waiting for opponent to join...
            </p>
          </div>

          <div className="p-6 space-y-6">
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
                Players ({mockPlayers.filter((p) => p.name).length}/2)
              </div>
              <div className="space-y-2">
                {mockPlayers.map((player) => (
                  <PlayerCard key={player.id} {...player} />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="secondary" className="flex-1" onClick={handleCopy}>
                <Share2 className="w-4 h-4 mr-2" />
                Invite
              </Button>
              {isHost && (
                <Button variant="primary" className="flex-1" onClick={handleStart}>
                  <Play className="w-4 h-4 mr-2" />
                  Start Game
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
