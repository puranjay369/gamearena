import { Gamepad2 } from 'lucide-react';
import GameCard from '../components/GameCard';

const games = [
  {
    name: 'Chess',
    description: 'The classic strategy game of kings and queens. Challenge your mind.',
    players: '2',
    image: '/pngtree-chess-logo-png-image_7966289.png',
    to: '/game/chess',
  },
  {
    name: 'Battleship',
    description: 'Hunt and sink enemy ships in this classic naval strategy game!',
    players: '2',
    image: '/battleship.png',
    to: '/game/battleship',
  },
  {
    name: 'Connect Four',
    description: 'Drop discs and connect four in a row. Simple but competitive!',
    players: '2',
    image: '/connect-4-logo.png',
    to: '/game/connect-four',
  },
];

export default function DashboardPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Gamepad2 className="w-7 h-7 text-accent" />
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Game Lobby</h1>
        </div>
        <p className="text-muted">
          Choose a game to create or join a room and start playing with friends.
        </p>
      </div>

      {/* Game Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {games.map((game) => (
          <GameCard key={game.name} {...game} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card/50 border border-edge/30 rounded-xl p-5 hover:border-accent/30 transition-all duration-300">
          <h3 className="text-lg font-semibold text-foreground mb-1">Create a Room</h3>
          <p className="text-sm text-muted mb-4">
            Start a new game session and invite friends to join with a room code.
          </p>
          <a
            href="/dashboard/create-room"
            className="text-accent text-sm font-medium hover:underline"
          >
            Create Room →
          </a>
        </div>
        <div className="bg-card/50 border border-edge/30 rounded-xl p-5 hover:border-accent/30 transition-all duration-300">
          <h3 className="text-lg font-semibold text-foreground mb-1">Join a Room</h3>
          <p className="text-sm text-muted mb-4">
            Have a room code? Enter it to join your friend's game instantly.
          </p>
          <a
            href="/dashboard/join-room"
            className="text-accent text-sm font-medium hover:underline"
          >
            Join Room →
          </a>
        </div>
      </div>
    </div>
  );
}
