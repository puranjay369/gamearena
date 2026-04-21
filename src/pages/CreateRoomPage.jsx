import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Gamepad2 } from 'lucide-react';
import Button from '../components/Button';
import { useRoom } from '../contexts/RoomContext';
import { useAuth } from '../contexts/AuthContext';

const gameOptions = [
  { id: 'chess', name: 'Chess', image: '/pngtree-chess-logo-png-image_7966289.png', players: '2', enabled: true },
  { id: 'battleship', name: 'Battleship', image: '/battleship.png', players: '2', enabled: false },
  { id: 'connect-four', name: 'Connect Four', image: '/connect-4-logo.png', players: '2', enabled: true },
];

export default function CreateRoomPage() {
  const [selected, setSelected] = useState('connect-four');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { createRoom, error, clearRoomError } = useRoom();
  const { user } = useAuth();

  const handleCreate = async () => {
    if (!selected) return;

    setSubmitting(true);
    clearRoomError();

    try {
      const room = await createRoom(selected);
      navigate(`/room/${room.roomCode}`);
    } catch {
      // RoomContext already exposes a user-facing error message.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <Plus className="w-7 h-7 text-accent" />
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Create Room</h1>
      </div>
      <p className="text-muted mb-8">
        Select a game and create a private room.
      </p>

      {!user && (
        <div className="mb-6 bg-warning/10 border border-warning/30 text-warning text-sm rounded-lg px-4 py-3">
          Please sign in first. You can use Google or Play as Guest.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {gameOptions.map((game) => (
          <button
            key={game.id}
            disabled={!game.enabled || submitting || !user}
            onClick={() => setSelected(game.id)}
            className={`p-5 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer ${
              selected === game.id
                ? 'border-accent bg-accent/10 shadow-lg shadow-accent/10'
                : 'border-edge/50 bg-card/50 hover:border-edge'
            }`}
          >
            <img src={game.image} alt={game.name} className="w-12 h-12 object-contain mb-2" />
            <div className="font-semibold text-foreground">{game.name}</div>
            <div className="text-xs text-muted mt-1">👥 {game.players} Players</div>
            {!game.enabled && <div className="text-[11px] text-muted mt-2">Coming soon</div>}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-danger mb-4">{error}</p>
      )}

      <Button
        variant="primary"
        size="lg"
        onClick={handleCreate}
        disabled={!selected || submitting || !user}
      >
        <Gamepad2 className="w-5 h-5 mr-2" />
        {submitting ? 'Creating...' : user ? 'Create Room' : 'Sign in to Create Room'}
      </Button>
    </div>
  );
}
