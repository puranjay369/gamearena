import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { RotateCcw, Trophy, Flag } from 'lucide-react';
import useGameStats from '../../hooks/useGameStats';
import {
  applyMove,
  createInitialState,
  GAME_STATUS,
} from '../../game-engines/chess';
import {
  checkMatchClockTimeout,
  createMatchClock,
  pauseMatchClock,
  resolveClock,
  switchMatchClockTurn,
} from '../../utils/matchClock';

const PROMOTION_OPTIONS = [
  { value: 'q', label: 'Queen' },
  { value: 'r', label: 'Rook' },
  { value: 'b', label: 'Bishop' },
  { value: 'n', label: 'Knight' },
];

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

export default function ChessGame({
  mode = 'local',
  gameState,
  onMoveRequest,
  localPlayer = 'w',
  roomKey = '',
  isExternallyLocked = false,
  onClockStateChange,
  onMatchReset,
}) {
  const [internalState, setInternalState] = useState(createInitialState);
  const [botThinking, setBotThinking] = useState(false);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [pendingPromotion, setPendingPromotion] = useState(null);
  const [isSubmittingMove, setIsSubmittingMove] = useState(false);
  const [moveHistory, setMoveHistory] = useState([]);
  const [capturedPieces, setCapturedPieces] = useState({ w: [], b: [] });
  const [clockState, setClockState] = useState(() => createMatchClock({ activePlayer: 1, nowMs: Date.now() }));
  const [clockNowMs, setClockNowMs] = useState(Date.now());
  const fallbackStateRef = useRef(createInitialState());
  const botThinkingRef = useRef(false);
  const previousClockSeatRef = useRef(1);
  const submissionTimerRef = useRef(null);
  const previousFenRef = useRef('');
  const derivedPreviousFenRef = useRef('');
  const derivedTransitionRef = useRef('');
  const { recordResult } = useGameStats();
  const resultRecorded = useRef(false);
  const [boardWidth, setBoardWidth] = useState(380);
  const boardContainerRef = useRef(null);

  const activeState = useMemo(() => {
    if (mode === 'multiplayer') return gameState || fallbackStateRef.current;
    return internalState;
  }, [mode, gameState, internalState]);

  const activeGame = useMemo(() => {
    try {
      return new Chess(activeState.fen);
    } catch {
      return new Chess();
    }
  }, [activeState.fen]);

  const localColor = useMemo(() => {
    if (localPlayer === 1 || localPlayer === '1' || localPlayer === 'w' || localPlayer === 'white') return 'w';
    if (localPlayer === 2 || localPlayer === '2' || localPlayer === 'b' || localPlayer === 'black') return 'b';
    return null;
  }, [localPlayer]);

  const localColorLabel = localColor === 'w' ? 'White' : localColor === 'b' ? 'Black' : '';

  const currentTurn = activeGame.turn();
  const turnLabel = currentTurn === 'w' ? 'White' : 'Black';
  const gameOver = activeState.status !== GAME_STATUS.PLAYING;
  const winnerLabel = activeState.winner === 'w' ? 'White' : activeState.winner === 'b' ? 'Black' : null;
  const waitingPromotion = Boolean(pendingPromotion);

  const blockedByTurn =
    mode === 'bot'
      ? currentTurn === 'b'
      : mode === 'multiplayer'
      ? !localColor || currentTurn !== localColor
      : false;

  const inputLocked = gameOver || botThinking || blockedByTurn || waitingPromotion || isSubmittingMove || isExternallyLocked;

  const activeSeat = currentTurn === 'b' ? 2 : 1;

  const localClockView = useMemo(() => {
    if (mode === 'multiplayer') return null;
    return resolveClock(clockState, clockNowMs);
  }, [mode, clockState, clockNowMs]);

  const turnText = useMemo(() => {
    if (botThinking) return 'Bot is thinking...';
    if (isSubmittingMove) return 'Submitting move...';
    if (waitingPromotion) return 'Choose a promotion piece';
    if (gameOver) return '';

    if (mode === 'multiplayer' && isExternallyLocked) {
      return 'Waiting for opponent reconnection...';
    }

    if (mode === 'multiplayer') {
      if (!localColor) return 'Waiting for seat assignment...';
      return currentTurn === localColor ? `Your Turn (${localColorLabel})` : "Opponent's Turn";
    }

    if (mode === 'bot') {
      return currentTurn === 'w' ? 'Your Turn (White)' : "Opponent's Turn";
    }

    return `${turnLabel}'s turn`;
  }, [botThinking, isSubmittingMove, waitingPromotion, gameOver, mode, localColor, currentTurn, turnLabel, localColorLabel, isExternallyLocked]);

  const feedbackText = useMemo(() => {
    if (activeState.status === GAME_STATUS.WON) {
      if (mode === 'multiplayer' && localColor) {
        return activeState.winner === localColor ? 'Checkmate - You Win' : 'Checkmate - You Lose';
      }

      return winnerLabel ? `Checkmate - ${winnerLabel} Wins` : 'Checkmate';
    }

    if (activeState.status === GAME_STATUS.DRAW) return 'Draw';
    if (activeGame.isCheck()) return 'Check!';
    return '';
  }, [activeState.status, activeState.winner, mode, localColor, winnerLabel, activeGame]);

  const legalTargetSquares = useMemo(() => {
    if (!selectedSquare || inputLocked) return [];

    try {
      return activeGame.moves({ square: selectedSquare, verbose: true }).map((move) => move.to);
    } catch {
      return [];
    }
  }, [selectedSquare, activeGame, inputLocked]);

  const squareStyles = useMemo(() => {
    const styles = {};

    const lastMove = activeState.lastMove;
    if (lastMove?.from) {
      styles[lastMove.from] = {
        backgroundColor: 'rgba(250, 204, 21, 0.28)',
      };
    }

    if (lastMove?.to) {
      styles[lastMove.to] = {
        ...(styles[lastMove.to] || {}),
        backgroundColor: 'rgba(234, 179, 8, 0.34)',
      };
    }

    if (selectedSquare) {
      styles[selectedSquare] = {
        ...(styles[selectedSquare] || {}),
        boxShadow: 'inset 0 0 0 3px rgba(59, 130, 246, 0.75)',
      };
    }

    for (const square of legalTargetSquares) {
      styles[square] = {
        ...(styles[square] || {}),
        backgroundImage: 'radial-gradient(circle, rgba(34, 197, 94, 0.5) 22%, transparent 24%)',
      };
    }

    return styles;
  }, [activeState.lastMove, selectedSquare, legalTargetSquares]);

  const isFreshPosition = activeState.lastMove === null && activeState.fen === createInitialState().fen;

  const parseMoveFromTransition = useCallback((previousFen, move) => {
    if (!move?.from || !move?.to) return null;

    try {
      const chess = new Chess(previousFen);
      const mover = chess.turn();
      const applied = chess.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion,
      });

      if (!applied) return null;

      return {
        san: applied.san,
        mover,
      };
    } catch {
      return null;
    }
  }, []);

  const detectCapturedPieces = useCallback((previousFen, currentFen) => {
    const pieceTypes = ['p', 'n', 'b', 'r', 'q'];
    const symbols = {
      w: { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕' },
      b: { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛' },
    };

    const countPieces = (fen) => {
      const counts = {
        w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
        b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
      };

      const chess = new Chess(fen);
      const board = chess.board();
      for (const row of board) {
        for (const piece of row) {
          if (!piece) continue;
          counts[piece.color][piece.type] += 1;
        }
      }

      return counts;
    };

    try {
      const previousCounts = countPieces(previousFen);
      const currentCounts = countPieces(currentFen);
      const delta = { w: [], b: [] };

      for (const color of ['w', 'b']) {
        for (const type of pieceTypes) {
          const missing = previousCounts[color][type] - currentCounts[color][type];
          if (missing <= 0) continue;

          const capturer = color === 'w' ? 'b' : 'w';
          for (let i = 0; i < missing; i += 1) {
            delta[capturer].push(symbols[color][type]);
          }
        }
      }

      return delta;
    } catch {
      return { w: [], b: [] };
    }
  }, []);

  // Record local or bot outcomes only; multiplayer results come from shared room state.
  useEffect(() => {
    if (mode === 'multiplayer') return;
    if (!gameOver || resultRecorded.current) return;

    resultRecorded.current = true;

    if (winnerLabel) {
      if (mode === 'bot') {
        const result = winnerLabel === 'White' ? 'win' : 'loss';
        recordResult('chess', result, 'checkmate', 'bot');
      } else {
        recordResult('chess', 'win', `${winnerLabel} wins`, 'local');
      }
    } else {
      recordResult('chess', 'draw', 'draw', mode === 'bot' ? 'bot' : 'local');
    }
  }, [mode, gameOver, winnerLabel, recordResult]);

  useEffect(() => {
    resultRecorded.current = false;
    botThinkingRef.current = false;
    setBotThinking(false);
    setSelectedSquare(null);
    setPendingPromotion(null);
    setIsSubmittingMove(false);
    setMoveHistory([]);
    setCapturedPieces({ w: [], b: [] });
    previousFenRef.current = '';
    derivedPreviousFenRef.current = '';
    derivedTransitionRef.current = '';

    if (submissionTimerRef.current) {
      clearTimeout(submissionTimerRef.current);
      submissionTimerRef.current = null;
    }

    if (mode !== 'multiplayer') {
      const nextState = createInitialState();
      setInternalState(nextState);
      previousClockSeatRef.current = 1;
      setClockState(createMatchClock({ activePlayer: 1, nowMs: Date.now() }));
      setClockNowMs(Date.now());
    } else if (onClockStateChange) {
      onClockStateChange(null);
    }
  }, [mode, roomKey]);

  useEffect(() => {
    if (mode === 'multiplayer') return;

    if (gameOver) {
      setClockState((previous) => pauseMatchClock(previous, Date.now()));
      return;
    }

    if (previousClockSeatRef.current !== activeSeat) {
      previousClockSeatRef.current = activeSeat;
      setClockState((previous) => switchMatchClockTurn(previous, activeSeat, Date.now()));
    }
  }, [mode, gameOver, activeSeat]);

  useEffect(() => {
    if (mode === 'multiplayer' || gameOver) return undefined;

    const timer = setInterval(() => {
      setClockNowMs(Date.now());
    }, 250);

    return () => clearInterval(timer);
  }, [mode, gameOver]);

  useEffect(() => {
    if (mode === 'multiplayer' || gameOver) return;

    const timeoutCheck = checkMatchClockTimeout(clockState, clockNowMs);
    if (!timeoutCheck.timedOutSeat) return;

    setClockState(timeoutCheck.clock);
    setInternalState((previous) => {
      if (previous.status !== GAME_STATUS.PLAYING) return previous;
      return {
        ...previous,
        status: GAME_STATUS.WON,
        winner: timeoutCheck.timedOutSeat === 1 ? 'b' : 'w',
        endReason: 'clock_timeout',
        timedOutSeat: timeoutCheck.timedOutSeat,
      };
    });
  }, [mode, gameOver, clockState, clockNowMs]);

  useEffect(() => {
    if (!onClockStateChange) return;
    onClockStateChange(localClockView);
  }, [onClockStateChange, localClockView]);

  useEffect(() => {
    if (isFreshPosition) {
      setMoveHistory([]);
      setCapturedPieces({ w: [], b: [] });
      derivedTransitionRef.current = '';
      derivedPreviousFenRef.current = activeState.fen;
      return;
    }

    if (!derivedPreviousFenRef.current) {
      derivedPreviousFenRef.current = activeState.fen;
      return;
    }

    const previousFen = derivedPreviousFenRef.current;
    const currentFen = activeState.fen;

    if (previousFen === currentFen) return;

    const move = activeState.lastMove;
    if (!move?.from || !move?.to) {
      derivedPreviousFenRef.current = currentFen;
      return;
    }

    const transitionSignature = `${previousFen}|${currentFen}|${move.from}${move.to}${move.promotion || ''}`;
    if (derivedTransitionRef.current === transitionSignature) {
      derivedPreviousFenRef.current = currentFen;
      return;
    }

    const parsedMove = parseMoveFromTransition(previousFen, move);
    if (parsedMove) {
      setMoveHistory((previousHistory) => {
        const next = [...previousHistory];

        if (parsedMove.mover === 'w') {
          next.push({ white: parsedMove.san, black: '' });
        } else if (next.length === 0 || next[next.length - 1].black) {
          next.push({ white: '...', black: parsedMove.san });
        } else {
          next[next.length - 1] = {
            ...next[next.length - 1],
            black: parsedMove.san,
          };
        }

        return next;
      });
    }

    const capturedDelta = detectCapturedPieces(previousFen, currentFen);
    if (capturedDelta.w.length || capturedDelta.b.length) {
      setCapturedPieces((previousCaptured) => ({
        w: [...previousCaptured.w, ...capturedDelta.w],
        b: [...previousCaptured.b, ...capturedDelta.b],
      }));
    }

    derivedTransitionRef.current = transitionSignature;
    derivedPreviousFenRef.current = currentFen;
  }, [activeState.fen, activeState.lastMove, detectCapturedPieces, isFreshPosition, parseMoveFromTransition]);

  useEffect(() => {
    if (mode !== 'multiplayer') return;

    if (!previousFenRef.current) {
      previousFenRef.current = activeState.fen;
      return;
    }

    if (activeState.fen !== previousFenRef.current) {
      previousFenRef.current = activeState.fen;
      setIsSubmittingMove(false);
      setSelectedSquare(null);

      if (submissionTimerRef.current) {
        clearTimeout(submissionTimerRef.current);
        submissionTimerRef.current = null;
      }
    }
  }, [mode, activeState.fen]);

  useEffect(() => {
    return () => {
      if (submissionTimerRef.current) {
        clearTimeout(submissionTimerRef.current);
        submissionTimerRef.current = null;
      }
    };
  }, []);

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

  const handleResign = useCallback(() => {
    if (mode === 'multiplayer' || gameOver) return;

    setInternalState((prev) => {
      let loser = 'w';
      try {
        loser = new Chess(prev.fen).turn();
      } catch {
        loser = 'w';
      }

      return {
        ...prev,
        status: GAME_STATUS.WON,
        winner: loser === 'w' ? 'b' : 'w',
      };
    });
  }, [mode, gameOver]);

  const isPromotionRequired = useCallback((fen, from, to) => {
    try {
      const chess = new Chess(fen);
      const piece = chess.get(from);
      if (!piece || piece.type !== 'p') return false;

      const isLastRank = (piece.color === 'w' && to[1] === '8') || (piece.color === 'b' && to[1] === '1');
      return isLastRank;
    } catch {
      return false;
    }
  }, []);

  const submitMove = useCallback((move) => {
    if (mode === 'multiplayer') {
      if (!onMoveRequest || isSubmittingMove) return false;

      setIsSubmittingMove(true);
      onMoveRequest(move);

      if (submissionTimerRef.current) {
        clearTimeout(submissionTimerRef.current);
      }

      submissionTimerRef.current = setTimeout(() => {
        setIsSubmittingMove(false);
      }, 1800);

      return false;
    }

    setInternalState((prev) => {
      let actor = 'w';
      try {
        actor = new Chess(prev.fen).turn();
      } catch {
        actor = 'w';
      }

      const result = applyMove(prev, move, actor);
      if (!result.ok) return prev;
      return result.state;
    });

    return true;
  }, [mode, onMoveRequest, isSubmittingMove]);

  const onDrop = useCallback((drop) => {
    const sourceSquare = drop?.sourceSquare;
    const targetSquare = drop?.targetSquare;

    if (!sourceSquare || !targetSquare) return false;
    if (inputLocked) return false;

    if (isPromotionRequired(activeState.fen, sourceSquare, targetSquare)) {
      setPendingPromotion({ from: sourceSquare, to: targetSquare });
      return false;
    }

    const move = {
      from: sourceSquare,
      to: targetSquare,
    };

    setSelectedSquare(null);
    const movedLocally = submitMove(move);
    return mode === 'multiplayer' ? false : movedLocally;
  }, [inputLocked, isPromotionRequired, activeState.fen, mode, submitMove]);

  const handleSquareClick = useCallback(({ square }) => {
    if (!square || inputLocked) return;

    if (selectedSquare && legalTargetSquares.includes(square)) {
      if (isPromotionRequired(activeState.fen, selectedSquare, square)) {
        setPendingPromotion({ from: selectedSquare, to: square });
        return;
      }

      const move = {
        from: selectedSquare,
        to: square,
      };

      setSelectedSquare(null);
      submitMove(move);
      return;
    }

    if (selectedSquare === square) {
      setSelectedSquare(null);
      return;
    }

    const piece = activeGame.get(square);
    if (!piece || piece.color !== currentTurn) {
      setSelectedSquare(null);
      return;
    }

    setSelectedSquare(square);
  }, [inputLocked, selectedSquare, legalTargetSquares, isPromotionRequired, activeState.fen, submitMove, activeGame, currentTurn]);

  const handlePromotionSelect = useCallback((promotion) => {
    if (!pendingPromotion) return;

    const move = {
      ...pendingPromotion,
      promotion,
    };

    setPendingPromotion(null);
    setSelectedSquare(null);
    submitMove(move);
  }, [pendingPromotion, submitMove]);

  const handlePromotionCancel = useCallback(() => {
    setPendingPromotion(null);
  }, []);

  useEffect(() => {
    if (mode !== 'bot' || currentTurn !== 'b' || gameOver || botThinkingRef.current) return;

    botThinkingRef.current = true;
    setBotThinking(true);

    const timer = setTimeout(() => {
      const gameCopy = new Chess(activeState.fen);
      const botMove = getBotMove(gameCopy);

      if (botMove) {
        setInternalState((prev) => {
          const result = applyMove(
            prev,
            {
              from: botMove.from,
              to: botMove.to,
              promotion: botMove.promotion,
            },
            'b'
          );

          if (!result.ok) return prev;
          return result.state;
        });
      }

      botThinkingRef.current = false;
      setBotThinking(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [mode, currentTurn, gameOver, activeState.fen]);

  const resetGame = useCallback(() => {
    if (mode === 'multiplayer') return;

    const nextState = createInitialState();
    setInternalState(nextState);
    previousClockSeatRef.current = 1;
    setClockState(createMatchClock({ activePlayer: 1, nowMs: Date.now() }));
    setClockNowMs(Date.now());
    botThinkingRef.current = false;
    setBotThinking(false);
    resultRecorded.current = false;
    if (onMatchReset) onMatchReset();
  }, [mode]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 gap-3 relative">
      <div className="flex items-center gap-4 text-sm">
        <span className={`font-semibold ${currentTurn === 'w' ? 'text-foreground' : 'text-muted'}`}>
          White {mode === 'bot' ? '(You)' : mode === 'multiplayer' && localColor === 'w' ? '(You)' : ''}
        </span>
        <span className="text-muted">vs</span>
        <span className={`font-semibold ${currentTurn === 'b' ? 'text-foreground' : 'text-muted'}`}>
          Black {mode === 'bot' ? '(Bot)' : mode === 'multiplayer' && localColor === 'b' ? '(You)' : ''}
        </span>
      </div>

      <div className="text-xs text-muted">
        {turnText}
      </div>

      {feedbackText && (
        <div className={`text-xs font-semibold ${feedbackText.includes('Lose') ? 'text-danger' : feedbackText.includes('Win') || feedbackText.includes('Check!') ? 'text-warning' : 'text-muted'}`}>
          {feedbackText}
        </div>
      )}

      {mode === 'multiplayer' && isSubmittingMove && (
        <div className="text-[11px] text-muted">Waiting for server sync...</div>
      )}

      <div className="w-full max-w-[640px] flex flex-col sm:flex-row items-center sm:items-start justify-center gap-3">
        <div ref={boardContainerRef} className="w-full max-w-[400px] aspect-square flex-shrink-0" style={{ width: `${boardWidth}px`, maxWidth: '100%' }}>
          <Chessboard
            options={{
              position: activeState.fen,
              onPieceDrop: onDrop,
              onSquareClick: handleSquareClick,
              animationDurationInMs: 200,
              allowDragging: !inputLocked,
              squareStyles,
              boardStyle: {
                borderRadius: '8px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              },
              darkSquareStyle: { backgroundColor: '#4a5568' },
              lightSquareStyle: { backgroundColor: '#a0aec0' },
            }}
          />
        </div>

        <aside className="w-full sm:w-[190px] bg-card/60 border border-edge/50 rounded-xl p-3">
          <div className="text-[11px] uppercase tracking-wider text-muted mb-2">Captured Pieces</div>

          <div className="space-y-2">
            <div>
              <div className="text-xs text-foreground/80">White captured</div>
              <div className="min-h-6 text-lg leading-6 text-foreground">
                {capturedPieces.w.length ? capturedPieces.w.join(' ') : '-'}
              </div>
            </div>

            <div>
              <div className="text-xs text-foreground/80">Black captured</div>
              <div className="min-h-6 text-lg leading-6 text-foreground">
                {capturedPieces.b.length ? capturedPieces.b.join(' ') : '-'}
              </div>
            </div>
          </div>

          <div className="h-px bg-edge/60 my-3" />

          <div className="text-[11px] uppercase tracking-wider text-muted mb-2">Moves</div>
          <div className="max-h-[220px] overflow-y-auto pr-1 space-y-1">
            {moveHistory.length === 0 ? (
              <div className="text-xs text-muted">No moves yet.</div>
            ) : (
              moveHistory.map((turn, index) => (
                <div key={`${index + 1}-${turn.white}-${turn.black}`} className="text-xs text-foreground/90 font-mono">
                  {index + 1}. {turn.white} {turn.black}
                </div>
              ))
            )}
          </div>
        </aside>
      </div>

      <div className="flex items-center gap-2">
        {mode !== 'multiplayer' && !gameOver && (
          <button
            onClick={handleResign}
            className="flex items-center gap-1.5 text-xs bg-danger/10 hover:bg-danger/20 text-danger px-3 py-1.5 rounded-lg border border-danger/30 transition-all cursor-pointer"
          >
            <Flag className="w-3.5 h-3.5" />
            Resign
          </button>
        )}

        {mode !== 'multiplayer' && (
          <button
            onClick={resetGame}
            className="flex items-center gap-1.5 text-xs bg-card hover:bg-edge text-muted hover:text-foreground px-3 py-1.5 rounded-lg border border-edge/50 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restart
          </button>
        )}
      </div>

      {gameOver && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-2xl backdrop-blur-sm z-10">
          <div className="bg-surface-alt border border-edge rounded-2xl p-6 text-center shadow-2xl max-w-xs mx-4">
            <Trophy className="w-10 h-10 text-warning mx-auto mb-3" />
            <h3 className="text-xl font-bold text-foreground mb-1">
              {activeState.status === GAME_STATUS.DRAW
                ? 'Draw'
                : mode === 'multiplayer' && localColor
                ? activeState.winner === localColor
                  ? 'Checkmate - You Win'
                  : 'Checkmate - You Lose'
                : winnerLabel
                ? `Checkmate - ${winnerLabel} Wins`
                : 'Checkmate'}
            </h3>
            <p className="text-sm text-muted mb-4">
              {activeState.status === GAME_STATUS.DRAW
                ? 'The game ended in a draw.'
                : winnerLabel
                ? `${winnerLabel} won the game.`
                : 'Game over.'}
            </p>

            {mode !== 'multiplayer' && (
              <button
                onClick={resetGame}
                className="bg-accent hover:bg-accent-hover text-white font-semibold py-2 px-5 rounded-lg transition-all cursor-pointer text-sm"
              >
                Play Again
              </button>
            )}
          </div>
        </div>
      )}

      {pendingPromotion && (
        <div className="absolute inset-0 bg-black/45 flex items-center justify-center rounded-2xl backdrop-blur-sm z-20">
          <div className="bg-surface-alt border border-edge rounded-xl p-4 w-[280px] max-w-[90%]">
            <h4 className="text-sm font-semibold text-foreground mb-1">Choose Promotion</h4>
            <p className="text-xs text-muted mb-3">Select the piece for pawn promotion.</p>

            <div className="grid grid-cols-2 gap-2">
              {PROMOTION_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handlePromotionSelect(option.value)}
                  className="text-sm font-medium bg-card hover:bg-edge text-foreground px-3 py-2 rounded-lg border border-edge/60 transition-all cursor-pointer"
                >
                  {option.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handlePromotionCancel}
              className="mt-3 w-full text-xs text-muted hover:text-foreground py-1.5 rounded-md transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
