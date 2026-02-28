import { useState, useCallback, useEffect, useRef } from 'react';
import { RotateCcw, Bot, Users, Trophy, Crosshair } from 'lucide-react';

const GRID = 10;
const EMPTY = 0;
const SHIP = 1;
const HIT = 2;
const MISS = 3;
const SUNK = 4;

const SHIPS = [
  { name: 'Carrier', size: 5 },
  { name: 'Battleship', size: 4 },
  { name: 'Cruiser', size: 3 },
  { name: 'Submarine', size: 3 },
  { name: 'Destroyer', size: 2 },
];

function createGrid() {
  return Array.from({ length: GRID }, () => Array(GRID).fill(EMPTY));
}

function placeShipsRandomly() {
  const grid = createGrid();
  const shipPositions = [];

  for (const ship of SHIPS) {
    let placed = false;
    while (!placed) {
      const horizontal = Math.random() > 0.5;
      const r = Math.floor(Math.random() * (horizontal ? GRID : GRID - ship.size + 1));
      const c = Math.floor(Math.random() * (horizontal ? GRID - ship.size + 1 : GRID));
      const cells = [];
      let valid = true;

      for (let i = 0; i < ship.size; i++) {
        const nr = horizontal ? r : r + i;
        const nc = horizontal ? c + i : c;
        if (grid[nr][nc] !== EMPTY) { valid = false; break; }
        cells.push([nr, nc]);
      }

      if (valid) {
        for (const [cr, cc] of cells) grid[cr][cc] = SHIP;
        shipPositions.push({ ...ship, cells });
        placed = true;
      }
    }
  }

  return { grid, ships: shipPositions };
}

function allShipsSunk(ships, grid) {
  return ships.every((ship) => ship.cells.every(([r, c]) => grid[r][c] === HIT || grid[r][c] === SUNK));
}

function markSunkShips(ships, attackGrid, hiddenGrid) {
  const newGrid = attackGrid.map((r) => [...r]);
  for (const ship of ships) {
    const isSunk = ship.cells.every(([r, c]) => hiddenGrid[r][c] === HIT || hiddenGrid[r][c] === SUNK);
    if (isSunk) {
      for (const [r, c] of ship.cells) newGrid[r][c] = SUNK;
    }
  }
  return newGrid;
}

// Bot AI — hunt and target strategy
function getBotTarget(attackGrid, lastHits) {
  // Target mode: if we have a hit, try adjacent cells
  if (lastHits.length > 0) {
    for (const [hr, hc] of lastHits) {
      const adj = [[hr - 1, hc], [hr + 1, hc], [hr, hc - 1], [hr, hc + 1]];
      for (const [nr, nc] of adj) {
        if (nr >= 0 && nr < GRID && nc >= 0 && nc < GRID && attackGrid[nr][nc] === EMPTY) {
          return [nr, nc];
        }
      }
    }
  }

  // Hunt mode: random untried cell with checkerboard pattern preference
  const candidates = [];
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      if (attackGrid[r][c] === EMPTY) {
        candidates.push({ r, c, parity: (r + c) % 2 });
      }
    }
  }

  // Prefer checkerboard pattern
  const parityOnes = candidates.filter((c) => c.parity === 1);
  const pool = parityOnes.length > 0 ? parityOnes : candidates;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  return pick ? [pick.r, pick.c] : null;
}

const CELL_STYLES = {
  [EMPTY]: 'bg-surface-alt/80 hover:bg-accent/30',
  [SHIP]: 'bg-surface-alt/80 hover:bg-accent/30', // hidden on opponent grid
  [HIT]: 'bg-red-500/80',
  [MISS]: 'bg-muted/30',
  [SUNK]: 'bg-red-700',
};

const OWN_CELL_STYLES = {
  [EMPTY]: 'bg-surface-alt/50',
  [SHIP]: 'bg-accent/40 border-accent/60',
  [HIT]: 'bg-red-500/80',
  [MISS]: 'bg-muted/30',
  [SUNK]: 'bg-red-700',
};

export default function BattleshipGame() {
  const [phase, setPhase] = useState('menu'); // menu | setup | playing | over
  const [vsBot, setVsBot] = useState(null);
  const [playerBoard, setPlayerBoard] = useState(null);
  const [playerShips, setPlayerShips] = useState([]);
  const [botBoard, setBotBoard] = useState(null);
  const [botShips, setBotShips] = useState([]);
  const [playerAttacks, setPlayerAttacks] = useState(createGrid); // player's attacks on bot
  const [botAttacks, setBotAttacks] = useState(createGrid); // bot's attacks on player
  const [currentTurn, setCurrentTurn] = useState('player'); // player | bot
  const [botThinking, setBotThinking] = useState(false);
  const [gameOver, setGameOver] = useState(null);
  const botHitsRef = useRef([]); // track bot's unsunk hits for targeting

  const startGame = useCallback((mode) => {
    const player = placeShipsRandomly();
    const bot = placeShipsRandomly();
    setPlayerBoard(player.grid);
    setPlayerShips(player.ships);
    setBotBoard(bot.grid);
    setBotShips(bot.ships);
    setPlayerAttacks(createGrid());
    setBotAttacks(createGrid());
    setCurrentTurn('player');
    setBotThinking(false);
    setGameOver(null);
    botHitsRef.current = [];
    setVsBot(mode);
    setPhase('playing');
  }, []);

  // Player attacks bot
  function handlePlayerAttack(r, c) {
    if (currentTurn !== 'player' || botThinking || gameOver) return;
    if (playerAttacks[r][c] !== EMPTY) return;

    const newAttacks = playerAttacks.map((row) => [...row]);
    const isHit = botBoard[r][c] === SHIP;
    newAttacks[r][c] = isHit ? HIT : MISS;

    // Mark sunk ships
    const updatedBotBoard = botBoard.map((row) => [...row]);
    if (isHit) updatedBotBoard[r][c] = HIT;
    setBotBoard(updatedBotBoard);

    const finalAttacks = markSunkShips(botShips, newAttacks, updatedBotBoard);
    setPlayerAttacks(finalAttacks);

    if (allShipsSunk(botShips, updatedBotBoard)) {
      setGameOver({ winner: 'player' });
      return;
    }

    if (vsBot) {
      setCurrentTurn('bot');
    } else {
      setCurrentTurn(currentTurn === 'player' ? 'bot' : 'player');
    }
  }

  // Bot turn
  useEffect(() => {
    if (currentTurn !== 'bot' || !vsBot || gameOver || botThinking) return;

    setBotThinking(true);
    const timer = setTimeout(() => {
      const target = getBotTarget(botAttacks, botHitsRef.current);
      if (target) {
        const [r, c] = target;
        const newAttacks = botAttacks.map((row) => [...row]);
        const isHit = playerBoard[r][c] === SHIP;
        newAttacks[r][c] = isHit ? HIT : MISS;

        if (isHit) {
          botHitsRef.current.push([r, c]);
          const updatedPlayerBoard = playerBoard.map((row) => [...row]);
          updatedPlayerBoard[r][c] = HIT;
          setPlayerBoard(updatedPlayerBoard);

          // Remove sunk ship hits from targeting list
          for (const ship of playerShips) {
            const isSunk = ship.cells.every(([sr, sc]) => updatedPlayerBoard[sr][sc] === HIT);
            if (isSunk) {
              botHitsRef.current = botHitsRef.current.filter(
                ([hr, hc]) => !ship.cells.some(([sr, sc]) => sr === hr && sc === hc)
              );
            }
          }

          const finalAttacks = markSunkShips(playerShips, newAttacks, updatedPlayerBoard);
          setBotAttacks(finalAttacks);

          if (allShipsSunk(playerShips, updatedPlayerBoard)) {
            setGameOver({ winner: 'bot' });
            setBotThinking(false);
            return;
          }
        } else {
          setBotAttacks(newAttacks);
        }
      }
      setBotThinking(false);
      setCurrentTurn('player');
    }, 600);

    return () => clearTimeout(timer);
  }, [currentTurn, vsBot, gameOver, botThinking, botAttacks, playerBoard, playerShips]);

  function resetGame() {
    startGame(vsBot);
  }

  function backToMenu() {
    setPhase('menu');
    setVsBot(null);
    setGameOver(null);
  }

  // Menu
  if (phase === 'menu') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 gap-6">
        <img src="/battleship.png" alt="Battleship" className="w-20 h-20 object-contain" />
        <h2 className="text-2xl font-bold text-foreground">Battleship</h2>
        <p className="text-muted text-sm text-center max-w-xs">Sink all enemy ships to win!</p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button onClick={() => startGame(true)} className="flex items-center justify-center gap-3 bg-accent hover:bg-accent-hover text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 cursor-pointer">
            <Bot className="w-5 h-5" /> Play vs Bot
          </button>
          <button onClick={() => startGame(false)} className="flex items-center justify-center gap-3 bg-card hover:bg-edge text-foreground font-semibold py-3 px-6 rounded-xl border border-edge transition-all duration-200 cursor-pointer">
            <Users className="w-5 h-5" /> Local 2 Player
          </button>
        </div>
      </div>
    );
  }

  const playerSunkCount = botShips.filter((s) => s.cells.every(([r, c]) => playerAttacks[r][c] === HIT || playerAttacks[r][c] === SUNK)).length;
  const botSunkCount = playerShips.filter((s) => s.cells.every(([r, c]) => botAttacks[r][c] === HIT || botAttacks[r][c] === SUNK)).length;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-3 gap-2 relative overflow-auto">
      {/* Status */}
      <div className="text-xs text-muted">
        {botThinking ? '🤔 Bot is targeting...' : gameOver ? '' : currentTurn === 'player' ? '🎯 Your turn — click enemy grid to fire!' : "Opponent's turn"}
      </div>

      <div className="flex flex-col lg:flex-row gap-3 items-start">
        {/* Enemy grid (where player attacks) */}
        <div className="text-center">
          <div className="text-xs font-semibold text-foreground mb-1 flex items-center justify-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5 text-danger" /> Enemy Waters
            <span className="text-muted font-normal ml-1">({playerSunkCount}/{SHIPS.length} sunk)</span>
          </div>
          <div className="inline-grid gap-0.5 bg-card/30 p-1 rounded-lg">
            {playerAttacks.map((row, r) => (
              <div key={r} className="flex gap-0.5">
                {row.map((cell, c) => (
                  <button
                    key={c}
                    onClick={() => handlePlayerAttack(r, c)}
                    disabled={gameOver || botThinking || currentTurn !== 'player' || cell !== EMPTY}
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-sm transition-all duration-150 text-[10px] font-bold cursor-pointer border border-edge/20 ${CELL_STYLES[cell]} ${
                      cell === EMPTY && currentTurn === 'player' && !gameOver ? 'hover:scale-110' : ''
                    }`}
                  >
                    {cell === HIT ? '💥' : cell === MISS ? '•' : cell === SUNK ? '🔥' : ''}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Own grid (player's ships + bot attacks) */}
        <div className="text-center">
          <div className="text-xs font-semibold text-foreground mb-1">
            🛡️ Your Fleet
            <span className="text-muted font-normal ml-1">({botSunkCount}/{SHIPS.length} lost)</span>
          </div>
          <div className="inline-grid gap-0.5 bg-card/30 p-1 rounded-lg">
            {(playerBoard || createGrid()).map((row, r) => (
              <div key={r} className="flex gap-0.5">
                {row.map((cell, c) => {
                  const attacked = botAttacks[r][c];
                  const display = attacked !== EMPTY ? attacked : cell;
                  return (
                    <div
                      key={c}
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-sm transition-all duration-150 text-[10px] font-bold border border-edge/20 flex items-center justify-center ${OWN_CELL_STYLES[display]}`}
                    >
                      {attacked === HIT ? '💥' : attacked === MISS ? '•' : attacked === SUNK ? '🔥' : cell === SHIP ? '▪' : ''}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ship legend */}
      <div className="flex flex-wrap gap-1.5 justify-center text-[10px] text-muted">
        {SHIPS.map((s) => (
          <span key={s.name} className="bg-card/50 px-1.5 py-0.5 rounded">{s.name} ({s.size})</span>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button onClick={resetGame} className="flex items-center gap-1.5 text-xs bg-card hover:bg-edge text-muted hover:text-foreground px-3 py-1.5 rounded-lg border border-edge/50 transition-all cursor-pointer">
          <RotateCcw className="w-3.5 h-3.5" /> New Game
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
              {gameOver.winner === 'player' ? 'Victory!' : 'Defeated!'}
            </h3>
            <p className="text-sm text-muted mb-4">
              {gameOver.winner === 'player'
                ? 'You sank all enemy ships! Admiral status unlocked. 🎖️'
                : 'The enemy sank your fleet. Better luck next time!'}
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
