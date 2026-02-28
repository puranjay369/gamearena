import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Gamepad2 } from 'lucide-react';
import Button from '../components/Button';

const gameOptions = [
  { id: 'chess', name: 'Chess', image: '/pngtree-chess-logo-png-image_7966289.png', players: '2' },
  { id: 'battleship', name: 'Battleship', image: '/battleship.png', players: '2' },
  { id: 'connect-four', name: 'Connect Four', image: '/connect-4-logo.png', players: '2' },
];

export default function CreateRoomPage() {
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  const handleCreate = () => {
    if (selected) {
      // TODO: call backend to create room via Socket.io
      navigate(`/room/${selected}`);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <Plus className="w-7 h-7 text-accent" />
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Create Room</h1>
      </div>
      <p className="text-muted mb-8">
        Select a game and create a private room for your friends.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {gameOptions.map((game) => (
          <button
            key={game.id}
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
          </button>
        ))}
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={handleCreate}
        disabled={!selected}
      >
        <Gamepad2 className="w-5 h-5 mr-2" />
        Create Room
      </Button>
    </div>
  );
}
