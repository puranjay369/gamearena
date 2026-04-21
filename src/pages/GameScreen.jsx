import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, User } from 'lucide-react';
import Button from '../components/Button';
import ChessGame from '../components/games/ChessGame';
import BattleshipGame from '../components/games/BattleshipGame';
import ConnectFourGame from '../components/games/ConnectFourGame';
import { PLAYER1 } from '../game-engines/connectFour';
import { useRoom } from '../contexts/RoomContext';
import { formatNameWithGuestBadge } from '../utils/guestIdentity';

const MODE_LABELS = {
  local: 'Local',
  bot: 'Bot',
  multiplayer: 'Multiplayer',
};

const GAME_MODES = {
  chess: ['local', 'bot', 'multiplayer'],
  'connect-four': ['local', 'bot', 'multiplayer'],
};

const MULTIPLAYER_GAMES = new Set(['chess', 'connect-four']);

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
  const location = useLocation();

  const GameComponent = gameComponents[gameId];
  const gameName = gameNames[gameId] || 'Game';
  const isConnectFour = gameId === 'connect-four';
  const isChess = gameId === 'chess';
  const supportsMultiplayer = MULTIPLAYER_GAMES.has(gameId);
  const availableModes = GAME_MODES[gameId] || ['local'];
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const roomCodeFromQuery = useMemo(() => String(searchParams.get('roomCode') || '').trim().toUpperCase(), [searchParams]);

  const initialMode = useMemo(() => {
    if (supportsMultiplayer && roomCodeFromQuery) return 'multiplayer';

    const queryMode = searchParams.get('mode');
    const routeMode = location.state?.mode;
    const candidate = routeMode || queryMode;
    return availableModes.includes(candidate) ? candidate : 'local';
  }, [supportsMultiplayer, roomCodeFromQuery, searchParams, location.state, availableModes]);

  const [gameMode, setGameMode] = useState(initialMode);
  const {
    room,
    playerId,
    activeRoomCode,
    setActiveRoomCode,
    fetchRoomState,
    requestRematch,
    makeMove,
  } = useRoom();
  const [requestingRematch, setRequestingRematch] = useState(false);

  useEffect(() => {
    setGameMode(initialMode);
  }, [initialMode, gameId]);

  const multiplayerRoomCode = useMemo(() => {
    const routeRoomCode = String(location.state?.roomCode || '').trim().toUpperCase();
    return roomCodeFromQuery || routeRoomCode || activeRoomCode || '';
  }, [roomCodeFromQuery, location.state, activeRoomCode]);

  useEffect(() => {
    if (!supportsMultiplayer || gameMode !== 'multiplayer' || !multiplayerRoomCode) return;

    setActiveRoomCode(multiplayerRoomCode);
    fetchRoomState(multiplayerRoomCode).catch(() => {});
  }, [
    supportsMultiplayer,
    gameMode,
    multiplayerRoomCode,
    setActiveRoomCode,
    fetchRoomState,
  ]);

  const multiplayerGameState = useMemo(() => {
    if (!room || room.roomCode !== multiplayerRoomCode) return null;
    return room.gameState || null;
  }, [room, multiplayerRoomCode]);

  const activeMultiplayerRoom = useMemo(() => {
    if (!room || room.roomCode !== multiplayerRoomCode) return null;
    return room;
  }, [room, multiplayerRoomCode]);

  const isMultiplayerFinished = useMemo(() => {
    if (gameMode !== 'multiplayer') return false;
    return activeMultiplayerRoom?.status === 'finished';
  }, [gameMode, activeMultiplayerRoom]);

  const hasRequestedRematch = useMemo(() => {
    if (!playerId || !activeMultiplayerRoom?.rematchVotes) return false;
    return activeMultiplayerRoom.rematchVotes[playerId] === true;
  }, [playerId, activeMultiplayerRoom]);

  const opponentRequestedRematch = useMemo(() => {
    if (!playerId || !activeMultiplayerRoom?.players || !activeMultiplayerRoom?.rematchVotes) return false;
    const opponent = activeMultiplayerRoom.players.find((entry) => entry.playerId !== playerId);
    if (!opponent) return false;
    return activeMultiplayerRoom.rematchVotes[opponent.playerId] === true;
  }, [playerId, activeMultiplayerRoom]);

  const multiplayerLocalSeat = useMemo(() => {
    if (!room || room.roomCode !== multiplayerRoomCode) return null;
    const currentPlayer = room.players?.find((entry) => entry.playerId === playerId);
    return currentPlayer?.seat ?? null;
  }, [room, multiplayerRoomCode, playerId]);

  const seatOnePlayer = useMemo(
    () => (room && room.roomCode === multiplayerRoomCode ? room.players?.find((entry) => entry.seat === 1) : null),
    [room, multiplayerRoomCode]
  );

  const seatTwoPlayer = useMemo(
    () => (room && room.roomCode === multiplayerRoomCode ? room.players?.find((entry) => entry.seat === 2) : null),
    [room, multiplayerRoomCode]
  );

  const multiplayerRoleText = useMemo(() => {
    if (gameMode !== 'multiplayer') return '';

    if (isChess) {
      if (multiplayerLocalSeat === 1) return 'You are White';
      if (multiplayerLocalSeat === 2) return 'You are Black';
      return 'Waiting for player seat assignment...';
    }

    if (multiplayerLocalSeat === 1) return 'You are Player 1 (Red)';
    if (multiplayerLocalSeat === 2) return 'You are Player 2 (Yellow)';
    return 'Waiting for player seat assignment...';
  }, [gameMode, isChess, multiplayerLocalSeat]);

  const handleMultiplayerMove = useCallback((movePayload) => {
    if (gameMode !== 'multiplayer') return;
    makeMove(movePayload, multiplayerRoomCode);
  }, [gameMode, makeMove, multiplayerRoomCode]);

  const handleRequestRematch = useCallback(async () => {
    if (gameMode !== 'multiplayer' || !multiplayerRoomCode || hasRequestedRematch || requestingRematch) return;

    setRequestingRematch(true);
    try {
      await requestRematch(multiplayerRoomCode);
    } catch {
      // RoomContext exposes request errors.
    } finally {
      setRequestingRematch(false);
    }
  }, [gameMode, multiplayerRoomCode, hasRequestedRematch, requestingRematch, requestRematch]);

  const firstPlayerLabel = useMemo(() => {
    if (gameMode === 'multiplayer') {
      const label = formatNameWithGuestBadge(seatOnePlayer?.displayName || 'Player 1', seatOnePlayer?.playerId);
      return `${label}${seatOnePlayer?.playerId === playerId ? ' (You)' : ''}`;
    }

    if (isChess) return 'White (You)';
    return 'Player 1 (You)';
  }, [gameMode, seatOnePlayer, playerId, isChess]);

  const secondPlayerLabel = useMemo(() => {
    if (gameMode === 'multiplayer') {
      const label = formatNameWithGuestBadge(seatTwoPlayer?.displayName || 'Player 2', seatTwoPlayer?.playerId);
      return `${label}${seatTwoPlayer?.playerId === playerId ? ' (You)' : ''}`;
    }

    if (isChess && gameMode === 'bot') return 'Black (Bot)';
    if (isChess) return 'Black';
    if (gameId === 'connect-four' && gameMode === 'bot') return 'Bot';
    return 'Player 2';
  }, [gameMode, seatTwoPlayer, playerId, isChess, gameId]);

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
        {availableModes.length > 1 && (
          <div className="w-full max-w-2xl flex items-center justify-center gap-2">
            {availableModes.map((mode) => {
              const isDisabled = mode === 'multiplayer' && !multiplayerRoomCode;
              const isActive = gameMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => setGameMode(mode)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-accent/20 border-accent/50 text-accent'
                      : 'bg-card border-edge/50 text-muted hover:text-foreground hover:bg-edge/60'
                  } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {MODE_LABELS[mode] || mode}
                </button>
              );
            })}
          </div>
        )}

        {supportsMultiplayer && gameMode === 'multiplayer' && (
          <div className="w-full max-w-2xl text-xs sm:text-sm text-center text-muted bg-card/50 border border-edge/40 rounded-lg py-2 px-3">
            {multiplayerRoleText}
          </div>
        )}

        {/* Player bar */}
        <div className="w-full max-w-2xl flex items-center justify-between">
          {/* Player 1 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center">
              <User className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">
                {firstPlayerLabel}
              </div>
              <div className="text-xs text-muted">⏱ 05:00</div>
            </div>
          </div>

          <div className="text-muted font-bold text-lg">VS</div>

          {/* Player 2 */}
          <div className="flex items-center gap-3">
            <div>
              <div className="text-sm font-semibold text-foreground text-right">
                {secondPlayerLabel}
              </div>
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
            isConnectFour ? (
              <ConnectFourGame
                mode={gameMode}
                gameState={gameMode === 'multiplayer' ? multiplayerGameState : undefined}
                onMoveRequest={gameMode === 'multiplayer' ? handleMultiplayerMove : undefined}
                localPlayer={gameMode === 'multiplayer' ? (multiplayerLocalSeat ?? 0) : PLAYER1}
              />
            ) : isChess ? (
              <ChessGame
                mode={gameMode}
                gameState={gameMode === 'multiplayer' ? multiplayerGameState : undefined}
                onMoveRequest={gameMode === 'multiplayer' ? handleMultiplayerMove : undefined}
                localPlayer={gameMode === 'multiplayer' ? (multiplayerLocalSeat === 1 ? 'w' : multiplayerLocalSeat === 2 ? 'b' : null) : 'w'}
                roomKey={gameMode === 'multiplayer' ? multiplayerRoomCode : ''}
              />
            ) : (
              <GameComponent />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted">
              Game not found
            </div>
          )}
        </div>

        {supportsMultiplayer && gameMode === 'multiplayer' && isMultiplayerFinished && (
          <div className="w-full max-w-2xl bg-card/60 border border-edge/40 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Game finished</p>
              <p className="text-xs text-muted">
                {hasRequestedRematch
                  ? 'Waiting for opponent to accept rematch...'
                  : opponentRequestedRematch
                  ? 'Opponent requested a rematch.'
                  : 'Request a rematch to play again in the same room.'}
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={handleRequestRematch}
              disabled={hasRequestedRematch || requestingRematch}
            >
              {hasRequestedRematch
                ? 'Waiting for opponent...'
                : requestingRematch
                ? 'Requesting...'
                : 'Rematch'}
            </Button>
          </div>
        )}

        {/* Leave button */}
        <Button variant="danger" size="sm" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Leave Game
        </Button>
      </div>
    </div>
  );
}
