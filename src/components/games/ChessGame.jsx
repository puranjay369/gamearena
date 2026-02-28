import { useState, useCallback, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { RotateCcw, Bot, Users, Trophy } from 'lucide-react';

// Simple bot: evaluates moves with piece values + positional bonus
const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

function evaluateBoard(game) {
  let score = 0;
  const board = game.board();
  for (const row of board) {
    for (const sq of row) {
      if (!sq) continue;
      const val = PIECE_VALUES[sq.type] || 0;
      score += sq.color === 'w' ? val : -val;
    }
  }
  return score;
}

function minimax(game, depth, alpha, beta, isMaximizing) {
  if (depth === 0 || game.isGameOver()) return evaluateBoard(game);

  const moves = game.moves();
  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      game.move(move);
      const eval_ = minimax(game, depth - 1, alpha, beta, false);
      game.undo();
      maxEval = Math.max(maxEval, eval_);
      alpha = Math.max(alpha, eval_);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      game.move(move);
      const eval_ = minimax(game, depth - 1, alpha, beta, true);
      game.undo();
      minEval = Math.min(minEval, eval_);
      beta = Math.min(beta, eval_);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

function getBotMove(game, depth = 2) {
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return null;

  let bestScore = Infinity;
  let bestMoves = [];

  for (const move of moves) {
    game.move(move.san);
    const score = minimax(game, depth - 1, -Infinity, Infinity, true);
    game.undo();

    if (score < bestScore) {
      bestScore = score;
      bestMoves = [move];
    } else if (score === bestScore) {
      bestMoves.push(move);
    }
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

export default function ChessGame() {
  const [game, setGame] = useState(new Chess());
  const [vsBot, setVsBot] = useState(null);
  const [gameOver, setGameOver] = useState(null);
  const [botThinking, setBotThinking] = useState(false);
  const [moveHistory, setMoveHistory] = useState([]);
  const [boardWidth, setBoardWidth] = useState(380);
  const botThinkingRef = useRef(false);
  const boardContainerRef = useRef(null);

  const turn = game.turn() === 'w' ? 'White' : 'Black';

  // Resize board to fit container
  useEffect(() => {
    const el = boardContainerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const size = Math.min(entry.contentRect.width, entry.contentRect.height, 400);
        setBoardWidth(Math.floor(size));
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const checkGameOver = useCallback((g) => {
    if (g.isCheckmate()) {
      setGameOver({ type: 'checkmate', winner: g.turn() === 'w' ? 'Black' : 'White' });
    } else if (g.isDraw()) {
      setGameOver({ type: 'draw', winner: null });
    } else if (g.isStalemate()) {
      setGameOver({ type: 'stalemate', winner: null });
    }
  }, []);

  // Bot move effect — use ref to prevent cleanup from clearing the timeout
  useEffect(() => {
    if (!vsBot || game.turn() !== 'b' || game.isGameOver() || botThinkingRef.current) return;

    botThinkingRef.current = true;
    setBotThinking(true);
    const timer = setTimeout(() => {
      const gameCopy = new Chess(game.fen());
      const move = getBotMove(gameCopy);
      if (move) {
        const updated = new Chess(game.fen());
        updated.move(move.san);
        setGame(updated);
        setMoveHistory((prev) => [...prev, move.san]);
        checkGameOver(updated);
      }
      botThinkingRef.current = false;
      setBotThinking(false);
    }, 400);

    return () => {
      // Only clear if the bot hasn't started processing
      if (botThinkingRef.current) return;
      clearTimeout(timer);
    };
  }, [game, vsBot, checkGameOver]);

  function onDrop({ sourceSquare, targetSquare }) {
    if (botThinking) return false;
    if (vsBot && game.turn() === 'b') return false;

    const gameCopy = new Chess(game.fen());
    try {
      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });
      if (!move) return false;
      setGame(gameCopy);
      setMoveHistory((prev) => [...prev, move.san]);
      checkGameOver(gameCopy);
      return true;
    } catch {
      return false;
    }
  }

  function resetGame() {
    setGame(new Chess());
    setGameOver(null);
    setMoveHistory([]);
    botThinkingRef.current = false;
    setBotThinking(false);
  }

  function backToMenu() {
    resetGame();
    setVsBot(null);
  }

  // Mode selection screen
  if (vsBot === null) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 gap-6">
        <img src="/pngtree-chess-logo-png-image_7966289.png" alt="Chess" className="w-20 h-20 object-contain" />
        <h2 className="text-2xl font-bold text-foreground">Chess</h2>
        <p className="text-muted text-sm text-center max-w-xs">Choose how you want to play</p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => setVsBot(true)}
            className="flex items-center justify-center gap-3 bg-accent hover:bg-accent-hover text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 cursor-pointer"
          >
            <Bot className="w-5 h-5" />
            Play vs Bot
          </button>
          <button
            onClick={() => setVsBot(false)}
            className="flex items-center justify-center gap-3 bg-card hover:bg-edge text-foreground font-semibold py-3 px-6 rounded-xl border border-edge transition-all duration-200 cursor-pointer"
          >
            <Users className="w-5 h-5" />
            Local 2 Player
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 gap-3 relative">
      {/* Status bar */}
      <div className="flex items-center gap-4 text-sm">
        <span className={`font-semibold ${game.turn() === 'w' ? 'text-foreground' : 'text-muted'}`}>
          ⬜ White {vsBot ? '(You)' : ''}
        </span>
        <span className="text-muted">vs</span>
        <span className={`font-semibold ${game.turn() === 'b' ? 'text-foreground' : 'text-muted'}`}>
          ⬛ Black {vsBot ? '(Bot)' : ''}
        </span>
      </div>

      <div className="text-xs text-muted">
        {botThinking ? '🤔 Bot is thinking...' : game.isCheck() ? `⚠️ ${turn} is in check!` : `${turn}'s turn`}
      </div>

      {/* Board */}
      <div ref={boardContainerRef} className="w-full max-w-[400px] aspect-square">
        <Chessboard
          options={{
            position: game.fen(),
            onPieceDrop: onDrop,
            animationDurationInMs: 200,
            allowDragging: !gameOver && !botThinking,
            boardStyle: {
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            },
            darkSquareStyle: { backgroundColor: '#4a5568' },
            lightSquareStyle: { backgroundColor: '#a0aec0' },
          }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={resetGame}
          className="flex items-center gap-1.5 text-xs bg-card hover:bg-edge text-muted hover:text-foreground px-3 py-1.5 rounded-lg border border-edge/50 transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Restart
        </button>
        <button
          onClick={backToMenu}
          className="text-xs text-muted hover:text-foreground px-3 py-1.5 rounded-lg transition-all cursor-pointer"
        >
          Menu
        </button>
      </div>

      {/* Move history */}
      {moveHistory.length > 0 && (
        <div className="w-full max-w-[400px] max-h-16 overflow-y-auto text-xs text-muted bg-surface-alt/50 rounded-lg px-3 py-2">
          {moveHistory.map((m, i) => (
            <span key={i} className={i % 2 === 0 ? 'text-foreground' : 'text-muted'}>
              {i % 2 === 0 ? `${Math.floor(i / 2) + 1}. ` : ''}{m}{' '}
            </span>
          ))}
        </div>
      )}

      {/* Game over overlay */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-2xl backdrop-blur-sm z-10">
          <div className="bg-surface-alt border border-edge rounded-2xl p-6 text-center shadow-2xl max-w-xs mx-4">
            <Trophy className="w-10 h-10 text-warning mx-auto mb-3" />
            <h3 className="text-xl font-bold text-foreground mb-1">
              {gameOver.type === 'checkmate' ? 'Checkmate!' : gameOver.type === 'stalemate' ? 'Stalemate!' : 'Draw!'}
            </h3>
            <p className="text-sm text-muted mb-4">
              {gameOver.winner ? `${gameOver.winner} wins!` : 'The game is a draw.'}
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={resetGame}
                className="bg-accent hover:bg-accent-hover text-white font-semibold py-2 px-5 rounded-lg transition-all cursor-pointer text-sm"
              >
                Play Again
              </button>
              <button
                onClick={backToMenu}
                className="bg-card hover:bg-edge text-foreground py-2 px-5 rounded-lg border border-edge transition-all cursor-pointer text-sm"
              >
                Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
