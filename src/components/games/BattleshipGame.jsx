import { useState, useEffect, useRef } from 'react';
import { RotateCcw, Bot, Users, Trophy, Crosshair, Shuffle, RotateCw, Anchor } from 'lucide-react';

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

function canPlaceShip(grid, r, c, size, horizontal) {
  for (let i = 0; i < size; i++) {
    const nr = horizontal ? r : r + i;
    const nc = horizontal ? c + i : c;
    if (nr >= GRID || nc >= GRID || grid[nr][nc] !== EMPTY) return false;
  }
  return true;
}

function placeShipOnGrid(grid, r, c, size, horizontal) {
  const newGrid = grid.map((row) => [...row]);
  const cells = [];
  for (let i = 0; i < size; i++) {
    const nr = horizontal ? r : r + i;
    const nc = horizontal ? c + i : c;
    newGrid[nr][nc] = SHIP;
    cells.push([nr, nc]);
  }
  return { grid: newGrid, cells };
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
      if (canPlaceShip(grid, r, c, ship.size, horizontal)) {
        const cells = [];
        for (let i = 0; i < ship.size; i++) {
          const nr = horizontal ? r : r + i;
          const nc = horizontal ? c + i : c;
          grid[nr][nc] = SHIP;
          cells.push([nr, nc]);
        }
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
  const candidates = [];
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      if (attackGrid[r][c] === EMPTY) {
        candidates.push({ r, c, parity: (r + c) % 2 });
      }
    }
  }
  const parityOnes = candidates.filter((c) => c.parity === 1);
  const pool = parityOnes.length > 0 ? parityOnes : candidates;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  return pick ? [pick.r, pick.c] : null;
}

// ─── Styles ───
const CELL_ATTACK = {
  [EMPTY]: 'bg-blue-900/40 hover:bg-accent/40 border-blue-800/30',
  [SHIP]: 'bg-blue-900/40 hover:bg-accent/40 border-blue-800/30',
  [HIT]: 'bg-red-500/80 border-red-400/50',
  [MISS]: 'bg-slate-700/50 border-slate-600/30',
  [SUNK]: 'bg-red-700 border-red-600/50',
};

const CELL_OWN = {
  [EMPTY]: 'bg-slate-800/50 border-slate-700/30',
  [SHIP]: 'bg-accent/40 border-accent/50',
  [HIT]: 'bg-red-500/80 border-red-400/50',
  [MISS]: 'bg-slate-700/50 border-slate-600/30',
  [SUNK]: 'bg-red-700 border-red-600/50',
};

// ─────────────────────── SETUP PHASE COMPONENT ───────────────────────

function SetupPhase({ playerLabel, onConfirm }) {
  const [grid, setGrid] = useState(createGrid);
  const [ships, setShips] = useState([]);
  const [currentShipIdx, setCurrentShipIdx] = useState(0);
  const [horizontal, setHorizontal] = useState(true);
  const [hoverCells, setHoverCells] = useState([]);

  const currentShip = SHIPS[currentShipIdx];
  const allPlaced = currentShipIdx >= SHIPS.length;

  function handleRandomize() {
    const result = placeShipsRandomly();
    setGrid(result.grid);
    setShips(result.ships);
    setCurrentShipIdx(SHIPS.length);
    setHoverCells([]);
  }

  function handleClear() {
    setGrid(createGrid());
    setShips([]);
    setCurrentShipIdx(0);
    setHoverCells([]);
  }

  function handleHover(r, c) {
    if (allPlaced) { setHoverCells([]); return; }
    const cells = [];
    let valid = true;
    for (let i = 0; i < currentShip.size; i++) {
      const nr = horizontal ? r : r + i;
      const nc = horizontal ? c + i : c;
      if (nr >= GRID || nc >= GRID) { valid = false; break; }
      if (grid[nr][nc] !== EMPTY) valid = false;
      cells.push([nr, nc]);
    }
    setHoverCells(valid ? cells : []);
  }

  function handleClick(r, c) {
    if (allPlaced) return;
    if (!canPlaceShip(grid, r, c, currentShip.size, horizontal)) return;
    const result = placeShipOnGrid(grid, r, c, currentShip.size, horizontal);
    const cells = [];
    for (let i = 0; i < currentShip.size; i++) {
      cells.push([horizontal ? r : r + i, horizontal ? c + i : c]);
    }
    setGrid(result.grid);
    setShips((prev) => [...prev, { ...currentShip, cells }]);
    setCurrentShipIdx((prev) => prev + 1);
    setHoverCells([]);
  }

  const hoverSet = new Set(hoverCells.map(([r, c]) => `${r},${c}`));

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 gap-3">
      <div className="text-lg font-bold text-foreground">{playerLabel} — Place Your Ships</div>

      {!allPlaced && (
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted">Placing:</span>
          <span className="text-accent font-semibold">{currentShip.name} ({currentShip.size})</span>
          <button
            onClick={() => setHorizontal((h) => !h)}
            className="flex items-center gap-1 text-xs bg-card hover:bg-edge text-muted hover:text-foreground px-2 py-1 rounded-lg border border-edge/50 transition-all cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
            {horizontal ? 'Horizontal' : 'Vertical'}
          </button>
        </div>
      )}

      {allPlaced && (
        <div className="text-sm text-success font-medium">All ships placed! Ready to battle.</div>
      )}

      {/* Grid */}
      <div className="inline-grid gap-0.5 bg-card/30 p-1.5 rounded-lg">
        {grid.map((row, r) => (
          <div key={r} className="flex gap-0.5">
            {row.map((cell, c) => {
              const key = `${r},${c}`;
              const isHover = hoverSet.has(key);
              return (
                <button
                  key={c}
                  onClick={() => handleClick(r, c)}
                  onMouseEnter={() => handleHover(r, c)}
                  onMouseLeave={() => setHoverCells([])}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-sm transition-all duration-100 text-[10px] font-bold cursor-pointer border ${
                    isHover
                      ? 'bg-accent/50 border-accent/70 scale-105'
                      : cell === SHIP
                      ? 'bg-accent/40 border-accent/50'
                      : 'bg-slate-800/50 border-slate-700/30 hover:bg-slate-700/50'
                  }`}
                >
                  {cell === SHIP ? '▪' : ''}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Ship list */}
      <div className="flex flex-wrap gap-1.5 justify-center text-[10px] text-muted">
        {SHIPS.map((s, i) => (
          <span
            key={s.name}
            className={`px-1.5 py-0.5 rounded ${
              i < currentShipIdx ? 'bg-accent/20 text-accent line-through' : i === currentShipIdx ? 'bg-accent/30 text-accent font-bold' : 'bg-card/50'
            }`}
          >
            {s.name} ({s.size})
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleRandomize}
          className="flex items-center gap-1.5 text-xs bg-card hover:bg-edge text-muted hover:text-foreground px-3 py-1.5 rounded-lg border border-edge/50 transition-all cursor-pointer"
        >
          <Shuffle className="w-3.5 h-3.5" /> Random
        </button>
        <button
          onClick={handleClear}
          className="flex items-center gap-1.5 text-xs bg-card hover:bg-edge text-muted hover:text-foreground px-3 py-1.5 rounded-lg border border-edge/50 transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Clear
        </button>
        {allPlaced && (
          <button
            onClick={() => onConfirm({ grid, ships })}
            className="flex items-center gap-1.5 text-sm bg-accent hover:bg-accent-hover text-white font-semibold px-5 py-1.5 rounded-lg transition-all cursor-pointer"
          >
            <Anchor className="w-4 h-4" /> Ready!
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────── PASS DEVICE SCREEN (2P) ───────────────────────

function PassDeviceScreen({ nextPlayer, onReady }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 gap-4">
      <div className="text-4xl">🔒</div>
      <h2 className="text-xl font-bold text-foreground">Pass the device to</h2>
      <div className="text-2xl font-bold text-accent">{nextPlayer}</div>
      <p className="text-sm text-muted text-center max-w-xs">
        Don't peek! Make sure only {nextPlayer} is looking at the screen.
      </p>
      <button
        onClick={onReady}
        className="bg-accent hover:bg-accent-hover text-white font-semibold py-3 px-8 rounded-xl transition-all cursor-pointer mt-2"
      >
        I'm {nextPlayer} — Ready!
      </button>
    </div>
  );
}

// ─────────────────────── MAIN COMPONENT ───────────────────────

export default function BattleshipGame() {
  // phases: menu → setup-p1 → (pass-p2 → setup-p2 →) playing → over
  const [phase, setPhase] = useState('menu');
  const [vsBot, setVsBot] = useState(null);

  // Board data
  const [p1Board, setP1Board] = useState(null);
  const [p1Ships, setP1Ships] = useState([]);
  const [p2Board, setP2Board] = useState(null);
  const [p2Ships, setP2Ships] = useState([]);
  const [p1Attacks, setP1Attacks] = useState(createGrid);
  const [p2Attacks, setP2Attacks] = useState(createGrid);

  const [currentTurn, setCurrentTurn] = useState(1); // 1 or 2
  const [botThinking, setBotThinking] = useState(false);
  const [gameOver, setGameOver] = useState(null);
  const [showPassScreen, setShowPassScreen] = useState(false);
  const botThinkingRef = useRef(false);
  const botHitsRef = useRef([]);
  const botTimerRef = useRef(null);

  function selectMode(bot) {
    setVsBot(bot);
    setPhase('setup-p1');
  }

  function handleP1Setup({ grid, ships }) {
    setP1Board(grid);
    setP1Ships(ships);
    if (vsBot) {
      // Bot places randomly
      const bot = placeShipsRandomly();
      setP2Board(bot.grid);
      setP2Ships(bot.ships);
      setP1Attacks(createGrid());
      setP2Attacks(createGrid());
      setCurrentTurn(1);
      setGameOver(null);
      botHitsRef.current = [];
      botThinkingRef.current = false;
      setBotThinking(false);
      setPhase('playing');
    } else {
      // 2P: show pass screen then P2 setup
      setPhase('pass-p2');
    }
  }

  function handleP2Setup({ grid, ships }) {
    setP2Board(grid);
    setP2Ships(ships);
    setP1Attacks(createGrid());
    setP2Attacks(createGrid());
    setCurrentTurn(1);
    setGameOver(null);
    setPhase('playing');
  }

  // ─── Attack logic ───
  // Hit = another turn, Miss = switch turns
  function handleAttack(r, c) {
    if (gameOver || botThinking) return;

    if (currentTurn === 1) {
      if (p1Attacks[r][c] !== EMPTY) return;
      const newAttacks = p1Attacks.map((row) => [...row]);
      const isHit = p2Board[r][c] === SHIP;
      newAttacks[r][c] = isHit ? HIT : MISS;

      const updatedP2Board = p2Board.map((row) => [...row]);
      if (isHit) updatedP2Board[r][c] = HIT;
      setP2Board(updatedP2Board);

      const finalAttacks = markSunkShips(p2Ships, newAttacks, updatedP2Board);
      setP1Attacks(finalAttacks);

      if (allShipsSunk(p2Ships, updatedP2Board)) {
        setGameOver({ winner: 1 });
        return;
      }

      // Hit → keep turn, Miss → switch
      if (!isHit) {
        if (vsBot) {
          setCurrentTurn(2);
        } else {
          setShowPassScreen(true);
          setCurrentTurn(2);
        }
      }
    } else if (currentTurn === 2 && !vsBot) {
      if (p2Attacks[r][c] !== EMPTY) return;
      const newAttacks = p2Attacks.map((row) => [...row]);
      const isHit = p1Board[r][c] === SHIP;
      newAttacks[r][c] = isHit ? HIT : MISS;

      const updatedP1Board = p1Board.map((row) => [...row]);
      if (isHit) updatedP1Board[r][c] = HIT;
      setP1Board(updatedP1Board);

      const finalAttacks = markSunkShips(p1Ships, newAttacks, updatedP1Board);
      setP2Attacks(finalAttacks);

      if (allShipsSunk(p1Ships, updatedP1Board)) {
        setGameOver({ winner: 2 });
        return;
      }

      // Hit → keep turn, Miss → switch
      if (!isHit) {
        setShowPassScreen(true);
        setCurrentTurn(1);
      }
    }
  }

  // ─── Bot turn ───
  // Bot keeps firing while it hits, stops on miss
  // Uses a ref-based approach to avoid stale state / cleanup issues
  useEffect(() => {
    if (currentTurn !== 2 || !vsBot || gameOver || botThinkingRef.current || phase !== 'playing') return;

    botThinkingRef.current = true;
    setBotThinking(true);

    // Snapshot current state into refs so the chain doesn't depend on React state
    let localAttacks = p2Attacks.map((row) => [...row]);
    let localP1Board = p1Board.map((row) => [...row]);
    let cancelled = false;

    function botFireOnce() {
      if (cancelled) return;
      const timer = setTimeout(() => {
        if (cancelled) return;

        const target = getBotTarget(localAttacks, botHitsRef.current);
        if (!target) {
          botThinkingRef.current = false;
          setBotThinking(false);
          setCurrentTurn(1);
          return;
        }

        const [r, c] = target;
        const isHit = localP1Board[r][c] === SHIP;
        localAttacks[r][c] = isHit ? HIT : MISS;

        if (isHit) {
          botHitsRef.current.push([r, c]);
          localP1Board[r][c] = HIT;

          // Check for sunk ships and clear targeting list
          for (const ship of p1Ships) {
            const isSunk = ship.cells.every(([sr, sc]) => localP1Board[sr][sc] === HIT);
            if (isSunk) {
              botHitsRef.current = botHitsRef.current.filter(
                ([hr, hc]) => !ship.cells.some(([sr, sc]) => sr === hr && sc === hc)
              );
              // Mark sunk on attacks grid
              for (const [sr, sc] of ship.cells) localAttacks[sr][sc] = SUNK;
            }
          }

          // Push updated state to React for rendering
          setP1Board(localP1Board.map((row) => [...row]));
          setP2Attacks(localAttacks.map((row) => [...row]));

          if (allShipsSunk(p1Ships, localP1Board)) {
            setGameOver({ winner: 2 });
            botThinkingRef.current = false;
            setBotThinking(false);
            return;
          }

          // Hit → fire again
          botFireOnce();
        } else {
          // Miss → push state and switch turn
          setP2Attacks(localAttacks.map((row) => [...row]));
          botThinkingRef.current = false;
          setBotThinking(false);
          setCurrentTurn(1);
        }
      }, 600);
      botTimerRef.current = timer;
    }

    botFireOnce();

    return () => {
      cancelled = true;
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
    };
    // Only trigger on turn change, not on p2Attacks/p1Board (we use local snapshots)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTurn, vsBot, gameOver, phase]);

  function resetGame() {
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    setPhase('setup-p1');
    setP1Board(null); setP1Ships([]);
    setP2Board(null); setP2Ships([]);
    setP1Attacks(createGrid()); setP2Attacks(createGrid());
    setCurrentTurn(1);
    setGameOver(null);
    setShowPassScreen(false);
    botThinkingRef.current = false;
    setBotThinking(false);
    botHitsRef.current = [];
    botTimerRef.current = null;
  }

  function backToMenu() {
    setPhase('menu');
    setVsBot(null);
    setGameOver(null);
    setShowPassScreen(false);
  }

  // ─── MENU ───
  if (phase === 'menu') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 gap-6">
        <img src="/battleship.png" alt="Battleship" className="w-20 h-20 object-contain" />
        <h2 className="text-2xl font-bold text-foreground">Battleship</h2>
        <p className="text-muted text-sm text-center max-w-xs">Place your fleet and sink the enemy!</p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button onClick={() => selectMode(true)} className="flex items-center justify-center gap-3 bg-accent hover:bg-accent-hover text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 cursor-pointer">
            <Bot className="w-5 h-5" /> Play vs Bot
          </button>
          <button onClick={() => selectMode(false)} className="flex items-center justify-center gap-3 bg-card hover:bg-edge text-foreground font-semibold py-3 px-6 rounded-xl border border-edge transition-all duration-200 cursor-pointer">
            <Users className="w-5 h-5" /> Local 2 Player
          </button>
        </div>
      </div>
    );
  }

  // ─── SETUP PHASES ───
  if (phase === 'setup-p1') {
    return <SetupPhase playerLabel={vsBot ? 'Admiral' : 'Player 1'} onConfirm={handleP1Setup} />;
  }
  if (phase === 'pass-p2') {
    return <PassDeviceScreen nextPlayer="Player 2" onReady={() => setPhase('setup-p2')} />;
  }
  if (phase === 'setup-p2') {
    return <SetupPhase playerLabel="Player 2" onConfirm={handleP2Setup} />;
  }

  // ─── PASS DEVICE between turns (2P) ───
  if (showPassScreen && !vsBot && !gameOver) {
    const nextLabel = currentTurn === 1 ? 'Player 1' : 'Player 2';
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 gap-4 relative">
        <PassDeviceScreen nextPlayer={nextLabel} onReady={() => setShowPassScreen(false)} />
        <button onClick={backToMenu} className="absolute bottom-4 text-xs text-muted hover:text-foreground cursor-pointer">
          Menu
        </button>
      </div>
    );
  }

  // ─── PLAYING ───
  // In bot mode, always show from P1's perspective. In 2P, flip based on turn.
  const viewAsPl = vsBot ? 1 : currentTurn;
  const myAttacks = viewAsPl === 1 ? p1Attacks : p2Attacks;
  const myBoard = viewAsPl === 1 ? p1Board : p2Board;
  const myShips = viewAsPl === 1 ? p1Ships : p2Ships;
  const oppAttacksOnMe = viewAsPl === 1 ? p2Attacks : p1Attacks;
  const oppShips = viewAsPl === 1 ? p2Ships : p1Ships;
  const playerLabel = vsBot ? 'You' : `Player ${currentTurn}`;
  const oppLabel = vsBot ? 'Bot' : `Player ${currentTurn === 1 ? 2 : 1}`;

  const mySunkCount = oppShips.filter((s) =>
    s.cells.every(([r, c]) => myAttacks[r][c] === HIT || myAttacks[r][c] === SUNK)
  ).length;
  const lostCount = myShips.filter((s) =>
    s.cells.every(([r, c]) => oppAttacksOnMe[r][c] === HIT || oppAttacksOnMe[r][c] === SUNK)
  ).length;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-3 gap-2 relative overflow-auto">
      {/* Status */}
      <div className="text-xs text-muted">
        {botThinking
          ? '🤔 Bot is targeting...'
          : gameOver
          ? ''
          : `🎯 ${playerLabel}'s turn — click enemy grid to fire!`}
      </div>

      <div className="flex flex-col lg:flex-row gap-3 items-start">
        {/* Enemy grid (attack target) */}
        <div className="text-center">
          <div className="text-xs font-semibold text-foreground mb-1 flex items-center justify-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5 text-danger" /> {oppLabel}'s Waters
            <span className="text-muted font-normal ml-1">({mySunkCount}/{SHIPS.length} sunk)</span>
          </div>
          <div className="inline-grid gap-0.5 bg-card/30 p-1 rounded-lg">
            {myAttacks.map((row, r) => (
              <div key={r} className="flex gap-0.5">
                {row.map((cell, c) => (
                  <button
                    key={c}
                    onClick={() => handleAttack(r, c)}
                    disabled={gameOver || botThinking || cell !== EMPTY}
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-sm transition-all duration-150 text-[10px] font-bold cursor-pointer border ${CELL_ATTACK[cell]} ${
                      cell === EMPTY && !gameOver && !botThinking ? 'hover:scale-110' : ''
                    }`}
                  >
                    {cell === HIT ? '💥' : cell === MISS ? '•' : cell === SUNK ? '🔥' : ''}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Own fleet grid */}
        <div className="text-center">
          <div className="text-xs font-semibold text-foreground mb-1">
            🛡️ {playerLabel}'s Fleet
            <span className="text-muted font-normal ml-1">({lostCount}/{SHIPS.length} lost)</span>
          </div>
          <div className="inline-grid gap-0.5 bg-card/30 p-1 rounded-lg">
            {(myBoard || createGrid()).map((row, r) => (
              <div key={r} className="flex gap-0.5">
                {row.map((cell, c) => {
                  const attacked = oppAttacksOnMe[r][c];
                  const display = attacked !== EMPTY ? attacked : cell;
                  return (
                    <div
                      key={c}
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-sm transition-all duration-150 text-[10px] font-bold border flex items-center justify-center ${CELL_OWN[display]}`}
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
              {vsBot
                ? gameOver.winner === 1 ? 'Victory!' : 'Defeated!'
                : `Player ${gameOver.winner} Wins!`}
            </h3>
            <p className="text-sm text-muted mb-4">
              {vsBot
                ? gameOver.winner === 1
                  ? 'You sank all enemy ships! Admiral status unlocked. 🎖️'
                  : 'The enemy sank your fleet. Better luck next time!'
                : `Player ${gameOver.winner} sank all enemy ships!`}
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
