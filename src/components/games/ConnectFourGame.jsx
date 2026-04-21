import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { RotateCcw, Trophy } from 'lucide-react';
import useGameStats from '../../hooks/useGameStats';
import {
  applyMove,
  createInitialState,
  EMPTY,
  GAME_STATUS,
  getBotMove,
  isColumnFull,
  PLAYER1,
  PLAYER2,
} from '../../game-engines/connectFour';

const CELL_COLORS = {
  [EMPTY]: 'bg-surface',
  [PLAYER1]: 'bg-red-500 shadow-lg shadow-red-500/30',
  [PLAYER2]: 'bg-yellow-400 shadow-lg shadow-yellow-400/30',
};

export default function ConnectFourGame({
  mode = 'local',
  gameState,
  onMoveRequest,
  onResetRequest,
  localPlayer = PLAYER1,
  botDepth = 5,
}) {
  const [internalState, setInternalState] = useState(createInitialState);
  const [botThinking, setBotThinking] = useState(false);
  const [hoverCol, setHoverCol] = useState(null);
  const botThinkingRef = useRef(false);
  const { recordResult } = useGameStats();
  const resultRecorded = useRef(false);

  const activeState = useMemo(() => {
    if (mode === 'multiplayer') return gameState || createInitialState();
    return internalState;
  }, [mode, gameState, internalState]);

  const board = activeState.board;
  const currentPlayer = activeState.currentPlayer;
  const gameFinished = activeState.status !== GAME_STATUS.PLAYING;
  const gameOver = gameFinished ? { winner: activeState.status === GAME_STATUS.DRAW ? null : activeState.winner } : null;

  const blockedByTurn =
    mode === 'bot' ? currentPlayer === PLAYER2 : mode === 'multiplayer' ? currentPlayer !== localPlayer : false;

  const inputLocked = gameFinished || botThinking || blockedByTurn;

  const multiplayerRoleText = useMemo(() => {
    if (mode !== 'multiplayer') return '';
    if (localPlayer === PLAYER1) return 'You are Player 1 (Red)';
    if (localPlayer === PLAYER2) return 'You are Player 2 (Yellow)';
    return 'Waiting for seat assignment...';
  }, [mode, localPlayer]);

  const turnText = useMemo(() => {
    if (botThinking) return 'Bot is thinking...';
    if (gameOver) return '';

    if (mode === 'multiplayer') {
      if (localPlayer !== PLAYER1 && localPlayer !== PLAYER2) return 'Waiting for players...';
      return currentPlayer === localPlayer ? 'Your Turn' : "Opponent's Turn";
    }

    return `${currentPlayer === PLAYER1 ? 'Red' : 'Yellow'}'s turn`;
  }, [botThinking, gameOver, mode, localPlayer, currentPlayer]);

  // Record game result when game ends
  useEffect(() => {
    if (mode === 'multiplayer') return;
    if (!gameOver || resultRecorded.current) return;

    resultRecorded.current = true;

    if (gameOver.winner) {
      if (mode === 'bot') {
        const result = gameOver.winner === PLAYER1 ? 'win' : 'loss';
        recordResult('connectfour', result, null, 'bot');
      } else {
        recordResult('connectfour', 'win', `${gameOver.winner === PLAYER1 ? 'Red' : 'Yellow'} wins`, 'local');
      }
    } else {
      recordResult('connectfour', 'draw', null, mode === 'bot' ? 'bot' : 'local');
    }
  }, [gameOver, mode, recordResult]);

  useEffect(() => {
    resultRecorded.current = false;
    if (mode !== 'multiplayer') {
      setInternalState(createInitialState());
    }
  }, [mode]);

  const handleDrop = useCallback(
    (col) => {
      if (inputLocked) return;
      if (isColumnFull(board, col)) return;

      if (mode === 'multiplayer') {
        if (onMoveRequest) onMoveRequest(col);
        return;
      }

      setInternalState((prev) => {
        const result = applyMove(prev, col, prev.currentPlayer);
        if (!result.ok) return prev;
        return result.state;
      });
    },
    [inputLocked, mode, onMoveRequest, board]
  );

  // Bot move
  useEffect(() => {
    if (mode !== 'bot' || currentPlayer !== PLAYER2 || gameFinished || botThinkingRef.current) return;

    botThinkingRef.current = true;
    setBotThinking(true);

    const timer = setTimeout(() => {
      setInternalState((prev) => {
        const col = getBotMove(prev, botDepth, PLAYER2);
        if (col === null) return prev;

        const result = applyMove(prev, col, PLAYER2);
        if (!result.ok) return prev;
        return result.state;
      });

      botThinkingRef.current = false;
      setBotThinking(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [currentPlayer, mode, gameFinished, botDepth]);

  function resetGame() {
    if (mode === 'multiplayer') {
      if (onResetRequest) onResetRequest();
      return;
    }

    setInternalState(createInitialState());
    botThinkingRef.current = false;
    setBotThinking(false);
    resultRecorded.current = false;
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 gap-3 relative">
      {/* Status */}
      <div className="flex items-center gap-3 text-sm">
        <span className={`flex items-center gap-1.5 font-semibold ${currentPlayer === PLAYER1 ? 'text-foreground' : 'text-muted'}`}>
          <span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Red {mode !== 'local' && localPlayer === PLAYER1 ? '(You)' : ''}
        </span>
        <span className="text-muted">vs</span>
        <span className={`flex items-center gap-1.5 font-semibold ${currentPlayer === PLAYER2 ? 'text-foreground' : 'text-muted'}`}>
          <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" /> Yellow {mode === 'bot' ? '(Bot)' : mode === 'multiplayer' && localPlayer === PLAYER2 ? '(You)' : ''}
        </span>
      </div>

      {mode === 'multiplayer' && (
        <div className="text-xs font-medium text-muted">{multiplayerRoleText}</div>
      )}

      <div className="text-xs text-muted">{turnText}</div>

      {/* Board */}
      <div className="bg-accent/90 p-2 sm:p-3 rounded-2xl shadow-2xl">
        {board.map((row, r) => (
          <div key={r} className="flex gap-1.5 sm:gap-2">
            {row.map((cell, c) => (
              <button
                key={c}
                onClick={() => handleDrop(c)}
                onMouseEnter={() => setHoverCol(c)}
                onMouseLeave={() => setHoverCol(null)}
                disabled={inputLocked}
                className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full transition-all duration-200 cursor-pointer ${CELL_COLORS[cell]} ${
                  cell === EMPTY && hoverCol === c ? 'bg-surface-alt scale-95' : ''
                } ${
                  inputLocked ? 'cursor-not-allowed opacity-90' : ''
                }`}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button onClick={resetGame} className="flex items-center gap-1.5 text-xs bg-card hover:bg-edge text-muted hover:text-foreground px-3 py-1.5 rounded-lg border border-edge/50 transition-all cursor-pointer">
          <RotateCcw className="w-3.5 h-3.5" /> Restart
        </button>
      </div>

      {/* Game over overlay */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-2xl backdrop-blur-sm z-10">
          <div className="bg-surface-alt border border-edge rounded-2xl p-6 text-center shadow-2xl max-w-xs mx-4">
            <Trophy className="w-10 h-10 text-warning mx-auto mb-3" />
            <h3 className="text-xl font-bold text-foreground mb-1">
              {gameOver.winner ? (gameOver.winner === PLAYER1 ? '🔴 Red Wins!' : '🟡 Yellow Wins!') : "It's a Draw!"}
            </h3>
            <p className="text-sm text-muted mb-4">
              {gameOver.winner
                ? mode === 'bot'
                  ? gameOver.winner === PLAYER1
                    ? 'You beat the bot!'
                    : 'The bot wins this round.'
                  : `${gameOver.winner === PLAYER1 ? 'Red' : 'Yellow'} connected four!`
                : 'The board is full. No winner.'}
            </p>
            <div className="flex gap-2 justify-center">
              <button onClick={resetGame} className="bg-accent hover:bg-accent-hover text-white font-semibold py-2 px-5 rounded-lg transition-all cursor-pointer text-sm">
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
