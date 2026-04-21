export const ROWS = 6;
export const COLS = 7;

export const EMPTY = 0;
export const PLAYER1 = 1;
export const PLAYER2 = 2;

export const GAME_STATUS = {
  PLAYING: 'playing',
  WON: 'won',
  DRAW: 'draw',
};

export const MOVE_ERRORS = {
  INVALID_STATE: 'INVALID_STATE',
  INVALID_COLUMN: 'INVALID_COLUMN',
  GAME_FINISHED: 'GAME_FINISHED',
  NOT_YOUR_TURN: 'NOT_YOUR_TURN',
  COLUMN_FULL: 'COLUMN_FULL',
};

function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));
}

function cloneBoard(board) {
  return board.map((row) => [...row]);
}

export function createInitialState() {
  return {
    board: createBoard(),
    currentPlayer: PLAYER1,
    status: GAME_STATUS.PLAYING,
    winner: null,
    lastMove: null,
  };
}

export function isValidGameState(state) {
  if (!state || typeof state !== 'object') return false;
  const { board, currentPlayer, status, winner, lastMove } = state;

  if (!Array.isArray(board) || board.length !== ROWS) return false;
  if (board.some((row) => !Array.isArray(row) || row.length !== COLS)) return false;
  if (![PLAYER1, PLAYER2].includes(currentPlayer)) return false;
  if (!Object.values(GAME_STATUS).includes(status)) return false;

  const winnerValid = winner === null || winner === PLAYER1 || winner === PLAYER2 || winner === 'draw';
  if (!winnerValid) return false;

  if (lastMove !== null) {
    const hasMoveShape =
      typeof lastMove === 'object' &&
      Number.isInteger(lastMove.row) &&
      Number.isInteger(lastMove.col) &&
      [PLAYER1, PLAYER2].includes(lastMove.player);

    if (!hasMoveShape) return false;
  }

  return true;
}

export function getDropRow(board, col) {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === EMPTY) return r;
  }
  return null;
}

export function isColumnFull(board, col) {
  return getDropRow(board, col) === null;
}

export function isBoardFull(board) {
  return board[0].every((cell) => cell !== EMPTY);
}

export function getValidColumns(board) {
  return Array.from({ length: COLS }, (_, i) => i).filter((col) => !isColumnFull(board, col));
}

export function checkWin(board, player) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      if (board[r][c] === player && board[r][c + 1] === player && board[r][c + 2] === player && board[r][c + 3] === player) {
        return true;
      }
    }
  }

  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] === player && board[r + 1][c] === player && board[r + 2][c] === player && board[r + 3][c] === player) {
        return true;
      }
    }
  }

  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      if (board[r][c] === player && board[r + 1][c + 1] === player && board[r + 2][c + 2] === player && board[r + 3][c + 3] === player) {
        return true;
      }
    }
  }

  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 3; c < COLS; c++) {
      if (board[r][c] === player && board[r + 1][c - 1] === player && board[r + 2][c - 2] === player && board[r + 3][c - 3] === player) {
        return true;
      }
    }
  }

  return false;
}

export function applyMove(state, col, actorPlayer = state?.currentPlayer) {
  if (!isValidGameState(state)) {
    return { ok: false, error: MOVE_ERRORS.INVALID_STATE };
  }

  if (!Number.isInteger(col) || col < 0 || col >= COLS) {
    return { ok: false, error: MOVE_ERRORS.INVALID_COLUMN };
  }

  if (state.status !== GAME_STATUS.PLAYING) {
    return { ok: false, error: MOVE_ERRORS.GAME_FINISHED };
  }

  if (actorPlayer !== state.currentPlayer) {
    return { ok: false, error: MOVE_ERRORS.NOT_YOUR_TURN };
  }

  if (isColumnFull(state.board, col)) {
    return { ok: false, error: MOVE_ERRORS.COLUMN_FULL };
  }

  const row = getDropRow(state.board, col);
  const nextBoard = cloneBoard(state.board);
  nextBoard[row][col] = actorPlayer;

  let nextStatus = GAME_STATUS.PLAYING;
  let nextWinner = null;

  if (checkWin(nextBoard, actorPlayer)) {
    nextStatus = GAME_STATUS.WON;
    nextWinner = actorPlayer;
  } else if (isBoardFull(nextBoard)) {
    nextStatus = GAME_STATUS.DRAW;
    nextWinner = 'draw';
  }

  return {
    ok: true,
    state: {
      board: nextBoard,
      currentPlayer: nextStatus === GAME_STATUS.PLAYING ? (actorPlayer === PLAYER1 ? PLAYER2 : PLAYER1) : state.currentPlayer,
      status: nextStatus,
      winner: nextWinner,
      lastMove: {
        row,
        col,
        player: actorPlayer,
      },
    },
  };
}

function scoreWindow(windowCells, player) {
  const opponent = player === PLAYER1 ? PLAYER2 : PLAYER1;
  const playerCount = windowCells.filter((cell) => cell === player).length;
  const emptyCount = windowCells.filter((cell) => cell === EMPTY).length;
  const opponentCount = windowCells.filter((cell) => cell === opponent).length;

  if (playerCount === 4) return 100;
  if (playerCount === 3 && emptyCount === 1) return 5;
  if (playerCount === 2 && emptyCount === 2) return 2;
  if (opponentCount === 3 && emptyCount === 1) return -4;
  return 0;
}

function scoreBoard(board, player) {
  let score = 0;

  const centerColumn = board.map((row) => row[3]);
  score += centerColumn.filter((cell) => cell === player).length * 3;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      score += scoreWindow([board[r][c], board[r][c + 1], board[r][c + 2], board[r][c + 3]], player);
    }
  }

  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c < COLS; c++) {
      score += scoreWindow([board[r][c], board[r + 1][c], board[r + 2][c], board[r + 3][c]], player);
    }
  }

  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      score += scoreWindow([board[r][c], board[r + 1][c + 1], board[r + 2][c + 2], board[r + 3][c + 3]], player);
    }
  }

  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 3; c < COLS; c++) {
      score += scoreWindow([board[r][c], board[r + 1][c - 1], board[r + 2][c - 2], board[r + 3][c - 3]], player);
    }
  }

  return score;
}

function minimax(board, depth, alpha, beta, isMaximizing, maximizingPlayer) {
  const minimizingPlayer = maximizingPlayer === PLAYER1 ? PLAYER2 : PLAYER1;
  const validColumns = getValidColumns(board);
  const terminalState =
    checkWin(board, maximizingPlayer) ||
    checkWin(board, minimizingPlayer) ||
    validColumns.length === 0;

  if (depth === 0 || terminalState) {
    if (checkWin(board, maximizingPlayer)) return [null, 100000];
    if (checkWin(board, minimizingPlayer)) return [null, -100000];
    if (validColumns.length === 0) return [null, 0];
    return [null, scoreBoard(board, maximizingPlayer)];
  }

  if (isMaximizing) {
    let bestScore = -Infinity;
    let bestCol = validColumns[Math.floor(Math.random() * validColumns.length)];

    for (const col of validColumns) {
      const row = getDropRow(board, col);
      const nextBoard = cloneBoard(board);
      nextBoard[row][col] = maximizingPlayer;
      const [, score] = minimax(nextBoard, depth - 1, alpha, beta, false, maximizingPlayer);

      if (score > bestScore) {
        bestScore = score;
        bestCol = col;
      }

      alpha = Math.max(alpha, score);
      if (alpha >= beta) break;
    }

    return [bestCol, bestScore];
  }

  let bestScore = Infinity;
  let bestCol = validColumns[Math.floor(Math.random() * validColumns.length)];

  for (const col of validColumns) {
    const row = getDropRow(board, col);
    const nextBoard = cloneBoard(board);
    nextBoard[row][col] = minimizingPlayer;
    const [, score] = minimax(nextBoard, depth - 1, alpha, beta, true, maximizingPlayer);

    if (score < bestScore) {
      bestScore = score;
      bestCol = col;
    }

    beta = Math.min(beta, score);
    if (alpha >= beta) break;
  }

  return [bestCol, bestScore];
}

export function getBotMove(state, depth = 5, botPlayer = PLAYER2) {
  if (!isValidGameState(state)) return null;
  if (state.status !== GAME_STATUS.PLAYING) return null;
  if (state.currentPlayer !== botPlayer) return null;

  const validColumns = getValidColumns(state.board);
  if (validColumns.length === 0) return null;

  const [col] = minimax(state.board, depth, -Infinity, Infinity, true, botPlayer);
  return col;
}
