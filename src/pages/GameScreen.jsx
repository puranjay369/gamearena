import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User } from 'lucide-react';
import Button from '../components/Button';
import ChessGame from '../components/games/ChessGame';
import BattleshipGame from '../components/games/BattleshipGame';
import ConnectFourGame from '../components/games/ConnectFourGame';

const gameComponents = {
  chess: ChessGame,
  battleship: BattleshipGame,
  'connect-four': ConnectFourGame,
};

const gameNames = {
  chess: 'Chess',
  battleship: 'Battleship',
  'connect-four': 'Connect Four',
};

export default function GameScreen() {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const GameComponent = gameComponents[gameId];
  const gameName = gameNames[gameId] || 'Game';

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Top bar */}
      <header className="bg-surface-alt/80 backdrop-blur-xl border-b border-edge/50 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-muted hover:text-foreground text-sm transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Leave
          </button>
          <span className="text-sm font-semibold text-foreground">{gameName}</span>
          <div className="w-16" />
        </div>
      </header>

      {/* Player info + game area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 gap-4">
        {/* Player bar */}
        <div className="w-full max-w-2xl flex items-center justify-between">
          {/* Player 1 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center">
              <User className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">Player 1 (You)</div>
              <div className="text-xs text-muted">⏱ 05:00</div>
            </div>
          </div>

          <div className="text-muted font-bold text-lg">VS</div>

          {/* Player 2 */}
          <div className="flex items-center gap-3">
            <div>
              <div className="text-sm font-semibold text-foreground text-right">Player 2</div>
              <div className="text-xs text-muted text-right">⏱ 05:00</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-danger/20 border-2 border-danger flex items-center justify-center">
              <User className="w-5 h-5 text-danger" />
            </div>
          </div>
        </div>

        {/* Game Container */}
        <div className="w-full max-w-2xl aspect-square bg-surface-alt border border-edge/50 rounded-2xl overflow-hidden shadow-2xl">
          {GameComponent ? (
            <GameComponent />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted">
              Game not found
            </div>
          )}
        </div>

        {/* Leave button */}
        <Button variant="danger" size="sm" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Leave Game
        </Button>
      </div>
    </div>
  );
}
