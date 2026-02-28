import { useState, useCallback, useEffect, useRef } from 'react';
import { RotateCcw, Bot, Users, Trophy } from 'lucide-react';

const ROWS = 6;
const COLS = 7;
const EMPTY = 0;
const PLAYER1 = 1; // Red
const PLAYER2 = 2; // Yellow

function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));
}

function dropPiece(board, col, player) {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === EMPTY) {
      const newBoard = board.map((row) => [...row]);
      newBoard[r][col] = player;
      return newBoard;
    }
  }
  return null;
}

function checkWin(board, player) {
  // Horizontal
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c <= COLS - 4; c++)
      if (board[r][c] === player && board[r][c + 1] === player && board[r][c + 2] === player && board[r][c + 3] === player)
        return true;
  // Vertical
  for (let r = 0; r <= ROWS - 4; r++)
    for (let c = 0; c < COLS; c++)
      if (board[r][c] === player && board[r + 1][c] === player && board[r + 2][c] === player && board[r + 3][c] === player)
        return true;
  // Diagonal down-right
  for (let r = 0; r <= ROWS - 4; r++)
    for (let c = 0; c <= COLS - 4; c++)
      if (board[r][c] === player && board[r + 1][c + 1] === player && board[r + 2][c + 2] === player && board[r + 3][c + 3] === player)
        return true;
  // Diagonal down-left
  for (let r = 0; r <= ROWS - 4; r++)
    for (let c = 3; c < COLS; c++)
      if (board[r][c] === player && board[r + 1][c - 1] === player && board[r + 2][c - 2] === player && board[r + 3][c - 3] === player)
        return true;
  return false;
}

function isBoardFull(board) {
  return board[0].every((cell) => cell !== EMPTY);
}

function getValidCols(board) {
  return Array.from({ length: COLS }, (_, i) => i).filter((c) => board[0][c] === EMPTY);
}

// Bot AI — minimax with alpha-beta pruning
function scoreWindow(window, player) {
  const opp = player === PLAYER1 ? PLAYER2 : PLAYER1;
  const pCount = window.filter((c) => c === player).length;
  const eCount = window.filter((c) => c === EMPTY).length;
  const oCount = window.filter((c) => c === opp).length;

  if (pCount === 4) return 100;
  if (pCount === 3 && eCount === 1) return 5;
  if (pCount === 2 && eCount === 2) return 2;
  if (oCount === 3 && eCount === 1) return -4;
  return 0;
}

function scoreBoard(board, player) {
  let score = 0;
  // Center column preference
  const centerCol = board.map((r) => r[3]);
  score += centerCol.filter((c) => c === player).length * 3;

  // Horizontal
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c <= COLS - 4; c++)
      score += scoreWindow([board[r][c], board[r][c + 1], board[r][c + 2], board[r][c + 3]], player);
  // Vertical
  for (let r = 0; r <= ROWS - 4; r++)
    for (let c = 0; c < COLS; c++)
      score += scoreWindow([board[r][c], board[r + 1][c], board[r + 2][c], board[r + 3][c]], player);
  // Diagonal
  for (let r = 0; r <= ROWS - 4; r++)
    for (let c = 0; c <= COLS - 4; c++)
      score += scoreWindow([board[r][c], board[r + 1][c + 1], board[r + 2][c + 2], board[r + 3][c + 3]], player);
  for (let r = 0; r <= ROWS - 4; r++)
    for (let c = 3; c < COLS; c++)
      score += scoreWindow([board[r][c], board[r + 1][c - 1], board[r + 2][c - 2], board[r + 3][c - 3]], player);

  return score;
}

function botMinimax(board, depth, alpha, beta, isMaximizing) {
  const validCols = getValidCols(board);
  const isTerminal = checkWin(board, PLAYER1) || checkWin(board, PLAYER2) || validCols.length === 0;

  if (depth === 0 || isTerminal) {
    if (checkWin(board, PLAYER2)) return [null, 100000];
    if (checkWin(board, PLAYER1)) return [null, -100000];
    if (validCols.length === 0) return [null, 0];
    return [null, scoreBoard(board, PLAYER2)];
  }

  if (isMaximizing) {
    let bestScore = -Infinity;
    let bestCol = validCols[Math.floor(Math.random() * validCols.length)];
    for (const col of validCols) {
      const newBoard = dropPiece(board, col, PLAYER2);
      const [, score] = botMinimax(newBoard, depth - 1, alpha, beta, false);
      if (score > bestScore) { bestScore = score; bestCol = col; }
      alpha = Math.max(alpha, score);
      if (alpha >= beta) break;
    }
    return [bestCol, bestScore];
  } else {
    let bestScore = Infinity;
    let bestCol = validCols[Math.floor(Math.random() * validCols.length)];
    for (const col of validCols) {
      const newBoard = dropPiece(board, col, PLAYER1);
      const [, score] = botMinimax(newBoard, depth - 1, alpha, beta, true);
      if (score < bestScore) { bestScore = score; bestCol = col; }
      beta = Math.min(beta, score);
      if (alpha >= beta) break;
    }
    return [bestCol, bestScore];
  }
}

const CELL_COLORS = {
  [EMPTY]: 'bg-surface',
  [PLAYER1]: 'bg-red-500 shadow-lg shadow-red-500/30',
  [PLAYER2]: 'bg-yellow-400 shadow-lg shadow-yellow-400/30',
};

export default function ConnectFourGame() {
  const [board, setBoard] = useState(createBoard);
  const [currentPlayer, setCurrentPlayer] = useState(PLAYER1);
  const [gameOver, setGameOver] = useState(null);
  const [vsBot, setVsBot] = useState(null);
  const [botThinking, setBotThinking] = useState(false);
  const [hoverCol, setHoverCol] = useState(null);
  const botThinkingRef = useRef(false);

  const handleDrop = useCallback(
    (col) => {
      if (gameOver || botThinking) return;
      if (board[0][col] !== EMPTY) return;

      const newBoard = dropPiece(board, col, currentPlayer);
      if (!newBoard) return;

      setBoard(newBoard);

      if (checkWin(newBoard, currentPlayer)) {
        setGameOver({ winner: currentPlayer });
      } else if (isBoardFull(newBoard)) {
        setGameOver({ winner: null });
      } else {
        setCurrentPlayer(currentPlayer === PLAYER1 ? PLAYER2 : PLAYER1);
      }
    },
    [board, currentPlayer, gameOver, botThinking]
  );

  // Bot move
  useEffect(() => {
    if (!vsBot || currentPlayer !== PLAYER2 || gameOver || botThinkingRef.current) return;

    botThinkingRef.current = true;
    setBotThinking(true);
    const timer = setTimeout(() => {
      const [col] = botMinimax(board, 5, -Infinity, Infinity, true);
      if (col !== null) {
        const newBoard = dropPiece(board, col, PLAYER2);
        setBoard(newBoard);
        if (checkWin(newBoard, PLAYER2)) {
          setGameOver({ winner: PLAYER2 });
        } else if (isBoardFull(newBoard)) {
          setGameOver({ winner: null });
        } else {
          setCurrentPlayer(PLAYER1);
        }
      }
      botThinkingRef.current = false;
      setBotThinking(false);
    }, 500);

    return () => {
      if (!botThinkingRef.current) clearTimeout(timer);
    };
  }, [currentPlayer, vsBot, gameOver, board]);

  function resetGame() {
    setBoard(createBoard());
    setCurrentPlayer(PLAYER1);
    setGameOver(null);
    botThinkingRef.current = false;
    setBotThinking(false);
  }

  function backToMenu() {
    resetGame();
    setVsBot(null);
  }

  // Mode selection
  if (vsBot === null) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 gap-6">
        <img src="/connect-4-logo.png" alt="Connect Four" className="w-20 h-20 object-contain" />
        <h2 className="text-2xl font-bold text-foreground">Connect Four</h2>
        <p className="text-muted text-sm text-center max-w-xs">Drop discs and connect 4 in a row!</p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button onClick={() => setVsBot(true)} className="flex items-center justify-center gap-3 bg-accent hover:bg-accent-hover text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 cursor-pointer">
            <Bot className="w-5 h-5" /> Play vs Bot
          </button>
          <button onClick={() => setVsBot(false)} className="flex items-center justify-center gap-3 bg-card hover:bg-edge text-foreground font-semibold py-3 px-6 rounded-xl border border-edge transition-all duration-200 cursor-pointer">
            <Users className="w-5 h-5" /> Local 2 Player
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 gap-3 relative">
      {/* Status */}
      <div className="flex items-center gap-3 text-sm">
        <span className={`flex items-center gap-1.5 font-semibold ${currentPlayer === PLAYER1 ? 'text-foreground' : 'text-muted'}`}>
          <span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Red {vsBot ? '(You)' : ''}
        </span>
        <span className="text-muted">vs</span>
        <span className={`flex items-center gap-1.5 font-semibold ${currentPlayer === PLAYER2 ? 'text-foreground' : 'text-muted'}`}>
          <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" /> Yellow {vsBot ? '(Bot)' : ''}
        </span>
      </div>

      <div className="text-xs text-muted">
        {botThinking ? '🤔 Bot is thinking...' : gameOver ? '' : `${currentPlayer === PLAYER1 ? 'Red' : 'Yellow'}'s turn`}
      </div>

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
                disabled={gameOver || botThinking || (vsBot && currentPlayer === PLAYER2)}
                className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full transition-all duration-200 cursor-pointer ${CELL_COLORS[cell]} ${
                  cell === EMPTY && hoverCol === c ? 'bg-surface-alt scale-95' : ''
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
        <button onClick={backToMenu} className="text-xs text-muted hover:text-foreground px-3 py-1.5 rounded-lg transition-all cursor-pointer">
          Menu
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
                ? vsBot
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
              <button onClick={backToMenu} className="bg-card hover:bg-edge text-foreground py-2 px-5 rounded-lg border border-edge transition-all cursor-pointer text-sm">
                Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
