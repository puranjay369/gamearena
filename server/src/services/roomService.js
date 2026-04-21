import { DEFAULT_GAME_ID, SUPPORTED_GAME_IDS } from '../config.js';
import { createInitialConnectFourState } from '../game/connectFourState.js';
import { createInitialChessState } from '../game/chessState.js';
import { ensureUserProfile, persistFinishedMatch } from './persistenceService.js';
import { generateUniqueRoomCode } from '../utils/roomCode.js';
import {
  applyMove as applyConnectFourMove,
  GAME_STATUS as CONNECT_FOUR_GAME_STATUS,
  MOVE_ERRORS as CONNECT_FOUR_MOVE_ERRORS,
} from '../../../src/game-engines/connectFour/index.js';
import {
  applyMove as applyChessMove,
  GAME_STATUS as CHESS_GAME_STATUS,
  MOVE_ERRORS as CHESS_MOVE_ERRORS,
} from '../../../src/game-engines/chess/index.js';

const ROOM_STATUS = {
  WAITING: 'waiting',
  ACTIVE: 'active',
  FINISHED: 'finished',
};

const GAME_ID = {
  CONNECT_FOUR: 'connect-four',
  CHESS: 'chess',
};

const GAME_STATE_INITIALIZERS = {
  [GAME_ID.CONNECT_FOUR]: createInitialConnectFourState,
  [GAME_ID.CHESS]: createInitialChessState,
};

const ERROR_CODE = {
  BAD_REQUEST: 'BAD_REQUEST',
  UNSUPPORTED_GAME: 'UNSUPPORTED_GAME',
  ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
  ROOM_FULL: 'ROOM_FULL',
  PLAYER_NOT_IN_ROOM: 'PLAYER_NOT_IN_ROOM',
  HOST_ONLY: 'HOST_ONLY',
  ROOM_NOT_READY: 'ROOM_NOT_READY',
  ROOM_ALREADY_STARTED: 'ROOM_ALREADY_STARTED',
  ROOM_NOT_ACTIVE: 'ROOM_NOT_ACTIVE',
  GAME_NOT_READY: 'GAME_NOT_READY',
  GAME_FINISHED: 'GAME_FINISHED',
  INVALID_MOVE: 'INVALID_MOVE',
  PROMOTION_REQUIRED: 'PROMOTION_REQUIRED',
  INVALID_COLUMN: 'INVALID_COLUMN',
  NOT_YOUR_TURN: 'NOT_YOUR_TURN',
  COLUMN_FULL: 'COLUMN_FULL',
  ROOM_NOT_FINISHED: 'ROOM_NOT_FINISHED',
};

function nowIso() {
  return new Date().toISOString();
}

function normalizeRoomCode(roomCode) {
  return String(roomCode || '').trim().toUpperCase();
}

function normalizePlayerName(displayName, fallbackPlayerId) {
  const trimmed = String(displayName || '').trim();
  if (trimmed) return trimmed;
  return `Player-${String(fallbackPlayerId).slice(0, 6)}`;
}

function runPersistenceTask(promise, label) {
  promise.catch((error) => {
    // eslint-disable-next-line no-console
    console.warn(`[db] ${label}: ${error.message}`);
  });
}

function toClientRoom(room) {
  return {
    roomCode: room.roomCode,
    gameId: room.gameId,
    status: room.status,
    hostPlayerId: room.hostPlayerId,
    players: room.players.map((player) => ({
      playerId: player.playerId,
      displayName: player.displayName,
      socketId: player.socketId,
      seat: player.seat,
      connected: player.connected,
      joinedAt: player.joinedAt,
      lastSeenAt: player.lastSeenAt,
    })),
    gameState: room.gameState,
    rematchVotes: { ...(room.rematchVotes || {}) },
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
  };
}

export class RoomServiceError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'RoomServiceError';
    this.code = code;
  }
}

export class RoomService {
  constructor(roomStore) {
    this.roomStore = roomStore;
    this.socketIndex = new Map();
    this.roomOperationQueues = new Map();
  }

  createRoom({ playerId, displayName, socketId, gameId = DEFAULT_GAME_ID }) {
    this.#assertIdentity(playerId);

    if (!SUPPORTED_GAME_IDS.includes(gameId)) {
      throw new RoomServiceError(ERROR_CODE.UNSUPPORTED_GAME, `Unsupported game: ${gameId}.`);
    }

    const roomCode = generateUniqueRoomCode((code) => this.roomStore.has(code));
    const createdAt = nowIso();

    const hostPlayer = {
      playerId,
      displayName: normalizePlayerName(displayName, playerId),
      socketId,
      seat: 1,
      connected: true,
      joinedAt: createdAt,
      lastSeenAt: createdAt,
    };

    const room = {
      roomCode,
      gameId,
      status: ROOM_STATUS.WAITING,
      hostPlayerId: playerId,
      players: [hostPlayer],
      gameState: null,
      rematchVotes: {},
      createdAt,
      updatedAt: createdAt,
    };

    this.roomStore.set(room);
    this.#bindSocket(socketId, roomCode, playerId);
    runPersistenceTask(
      ensureUserProfile({ uid: hostPlayer.playerId, displayName: hostPlayer.displayName }),
      'Failed to upsert host user profile'
    );

    return room;
  }

  joinRoom({ roomCode, playerId, displayName, socketId }) {
    this.#assertIdentity(playerId);

    const room = this.#getRoomOrThrow(roomCode);
    if (!room.rematchVotes || typeof room.rematchVotes !== 'object') {
      room.rematchVotes = {};
    }

    if (room.players.length >= 2 && !room.players.some((player) => player.playerId === playerId)) {
      throw new RoomServiceError(ERROR_CODE.ROOM_FULL, 'Room is full.');
    }

    const timestamp = nowIso();
    const existingPlayer = room.players.find((player) => player.playerId === playerId);

    if (existingPlayer) {
      existingPlayer.socketId = socketId;
      existingPlayer.connected = true;
      existingPlayer.lastSeenAt = timestamp;
      if (displayName) existingPlayer.displayName = normalizePlayerName(displayName, playerId);
    } else {
      const seat = this.#getNextSeat(room.players);
      if (!seat) {
        throw new RoomServiceError(ERROR_CODE.ROOM_FULL, 'Room is full.');
      }

      room.players.push({
        playerId,
        displayName: normalizePlayerName(displayName, playerId),
        socketId,
        seat,
        connected: true,
        joinedAt: timestamp,
        lastSeenAt: timestamp,
      });
    }

    room.updatedAt = timestamp;
    this.roomStore.set(room);
    this.#bindSocket(socketId, room.roomCode, playerId);

    const profileDisplayName = existingPlayer
      ? existingPlayer.displayName
      : room.players.find((entry) => entry.playerId === playerId)?.displayName;

    runPersistenceTask(
      ensureUserProfile({ uid: playerId, displayName: profileDisplayName }),
      'Failed to upsert joined user profile'
    );

    return room;
  }

  startGame({ roomCode, playerId }) {
    this.#assertIdentity(playerId);

    const room = this.#getRoomOrThrow(roomCode);

    if (room.hostPlayerId !== playerId) {
      throw new RoomServiceError(ERROR_CODE.HOST_ONLY, 'Only host can start the game.');
    }

    if (room.status === ROOM_STATUS.ACTIVE) {
      throw new RoomServiceError(ERROR_CODE.ROOM_ALREADY_STARTED, 'Game already started.');
    }

    if (room.players.length < 2) {
      throw new RoomServiceError(ERROR_CODE.ROOM_NOT_READY, 'Need 2 players to start.');
    }

    room.status = ROOM_STATUS.ACTIVE;
    room.gameState = this.#createInitialGameState(room.gameId);
    room.rematchVotes = {};
    room.updatedAt = nowIso();

    this.roomStore.set(room);
    return room;
  }

  async makeMove({ roomCode, playerId, column, move }) {
    this.#assertIdentity(playerId);

    return this.#enqueueRoomTask(roomCode, async () => {
      const room = this.#getRoomOrThrow(roomCode);
      const player = room.players.find((entry) => entry.playerId === playerId);

      if (!player) {
        throw new RoomServiceError(ERROR_CODE.PLAYER_NOT_IN_ROOM, 'Player is not in this room.');
      }

      if (room.status !== ROOM_STATUS.ACTIVE) {
        throw new RoomServiceError(ERROR_CODE.ROOM_NOT_ACTIVE, 'Game is not active.');
      }

      if (!room.gameState) {
        throw new RoomServiceError(ERROR_CODE.GAME_NOT_READY, 'Game state is not initialized.');
      }

      const result = this.#applyRoomMove({ room, player, column, move });

      room.gameState = result.state;
      if (room.gameState.status !== 'playing') {
        room.status = ROOM_STATUS.FINISHED;
        room.rematchVotes = {};

        runPersistenceTask(
          persistFinishedMatch(room),
          'Failed to persist finished match'
        );
      }

      room.updatedAt = nowIso();
      this.roomStore.set(room);
      return room;
    });
  }

  async requestRematch({ roomCode, playerId }) {
    this.#assertIdentity(playerId);

    return this.#enqueueRoomTask(roomCode, async () => {
      const room = this.#getRoomOrThrow(roomCode);
      const player = room.players.find((entry) => entry.playerId === playerId);

      if (!player) {
        throw new RoomServiceError(ERROR_CODE.PLAYER_NOT_IN_ROOM, 'Player is not in this room.');
      }

      if (room.status !== ROOM_STATUS.FINISHED) {
        throw new RoomServiceError(ERROR_CODE.ROOM_NOT_FINISHED, 'Rematch is available only after game finishes.');
      }

      if (!room.rematchVotes || typeof room.rematchVotes !== 'object') {
        room.rematchVotes = {};
      }

      room.rematchVotes[playerId] = true;

      const bothRequested =
        room.players.length === 2 &&
        room.players.every((entry) => room.rematchVotes[entry.playerId] === true);

      if (bothRequested) {
        room.gameState = this.#createInitialGameState(room.gameId);
        room.status = ROOM_STATUS.ACTIVE;
        room.rematchVotes = {};
      }

      room.updatedAt = nowIso();
      this.roomStore.set(room);
      return room;
    });
  }

  getRoom(roomCode) {
    const room = this.#getRoomOrThrow(roomCode);
    return room;
  }

  markDisconnected(socketId) {
    const index = this.socketIndex.get(socketId);
    if (!index) return null;

    this.socketIndex.delete(socketId);

    const room = this.roomStore.get(index.roomCode);
    if (!room) return null;

    const player = room.players.find((entry) => entry.playerId === index.playerId);
    if (!player) return null;

    player.connected = false;
    player.socketId = null;
    player.lastSeenAt = nowIso();
    room.updatedAt = nowIso();

    this.roomStore.set(room);
    return room;
  }

  serializeRoom(room) {
    return toClientRoom(room);
  }

  #assertIdentity(playerId) {
    if (!String(playerId || '').trim()) {
      throw new RoomServiceError(ERROR_CODE.BAD_REQUEST, 'playerId is required.');
    }
  }

  #getRoomOrThrow(roomCode) {
    const normalized = normalizeRoomCode(roomCode);
    const room = this.roomStore.get(normalized);
    if (!room) {
      throw new RoomServiceError(ERROR_CODE.ROOM_NOT_FOUND, `Room ${normalized} not found.`);
    }
    return room;
  }

  #getNextSeat(players) {
    const taken = new Set(players.map((player) => player.seat));
    if (!taken.has(1)) return 1;
    if (!taken.has(2)) return 2;
    return null;
  }

  #createInitialGameState(gameId) {
    const createInitialState = GAME_STATE_INITIALIZERS[gameId];
    if (createInitialState) {
      return createInitialState();
    }

    throw new RoomServiceError(ERROR_CODE.UNSUPPORTED_GAME, `Unsupported game: ${gameId}.`);
  }

  #applyRoomMove({ room, player, column, move }) {
    const moveHandlers = {
      [GAME_ID.CONNECT_FOUR]: () => this.#applyConnectFourMove({ room, player, column }),
      [GAME_ID.CHESS]: () => this.#applyChessMove({ room, player, move }),
    };

    const applyGameMove = moveHandlers[room.gameId];
    if (applyGameMove) {
      return applyGameMove();
    }

    throw new RoomServiceError(ERROR_CODE.UNSUPPORTED_GAME, `Unsupported game: ${room.gameId}.`);
  }

  #applyConnectFourMove({ room, player, column }) {
    if (room.gameState.status !== CONNECT_FOUR_GAME_STATUS.PLAYING) {
      throw new RoomServiceError(ERROR_CODE.GAME_FINISHED, 'Game is already finished.');
    }

    if (!Number.isInteger(column)) {
      throw new RoomServiceError(ERROR_CODE.INVALID_COLUMN, 'Column must be an integer.');
    }

    if (player.seat !== room.gameState.currentPlayer) {
      throw new RoomServiceError(ERROR_CODE.NOT_YOUR_TURN, 'It is not your turn.');
    }

    const result = applyConnectFourMove(room.gameState, column, player.seat);
    if (!result.ok) {
      const mappedError = this.#toConnectFourMoveError(result.error);
      throw new RoomServiceError(mappedError.code, mappedError.message);
    }

    return result;
  }

  #applyChessMove({ room, player, move }) {
    if (room.gameState.status !== CHESS_GAME_STATUS.PLAYING) {
      throw new RoomServiceError(ERROR_CODE.GAME_FINISHED, 'Game is already finished.');
    }

    const playerColor = player.seat === 1 ? 'w' : player.seat === 2 ? 'b' : null;
    const result = applyChessMove(room.gameState, move, playerColor);

    if (!result.ok) {
      const mappedError = this.#toChessMoveError(result.error);
      throw new RoomServiceError(mappedError.code, mappedError.message);
    }

    return result;
  }

  #toConnectFourMoveError(errorCode) {
    if (errorCode === CONNECT_FOUR_MOVE_ERRORS.INVALID_COLUMN) {
      return { code: ERROR_CODE.INVALID_COLUMN, message: 'Invalid column.' };
    }

    if (errorCode === CONNECT_FOUR_MOVE_ERRORS.COLUMN_FULL) {
      return { code: ERROR_CODE.COLUMN_FULL, message: 'That column is full.' };
    }

    if (errorCode === CONNECT_FOUR_MOVE_ERRORS.NOT_YOUR_TURN) {
      return { code: ERROR_CODE.NOT_YOUR_TURN, message: 'It is not your turn.' };
    }

    if (errorCode === CONNECT_FOUR_MOVE_ERRORS.GAME_FINISHED) {
      return { code: ERROR_CODE.GAME_FINISHED, message: 'Game is already finished.' };
    }

    return { code: ERROR_CODE.BAD_REQUEST, message: 'Invalid move.' };
  }

  #toChessMoveError(errorCode) {
    if (errorCode === CHESS_MOVE_ERRORS.INVALID_MOVE) {
      return { code: ERROR_CODE.INVALID_MOVE, message: 'Invalid move.' };
    }

    if (errorCode === CHESS_MOVE_ERRORS.NOT_YOUR_TURN) {
      return { code: ERROR_CODE.NOT_YOUR_TURN, message: 'It is not your turn.' };
    }

    if (errorCode === CHESS_MOVE_ERRORS.GAME_FINISHED) {
      return { code: ERROR_CODE.GAME_FINISHED, message: 'Game is already finished.' };
    }

    if (errorCode === CHESS_MOVE_ERRORS.PROMOTION_REQUIRED) {
      return { code: ERROR_CODE.PROMOTION_REQUIRED, message: 'Promotion piece is required.' };
    }

    return { code: ERROR_CODE.INVALID_MOVE, message: 'Invalid move.' };
  }

  #enqueueRoomTask(roomCode, operation) {
    const normalizedRoomCode = normalizeRoomCode(roomCode);
    const currentTail = this.roomOperationQueues.get(normalizedRoomCode) || Promise.resolve();

    const next = currentTail.then(() => operation());
    const tail = next.catch(() => {});

    this.roomOperationQueues.set(normalizedRoomCode, tail);

    return next.finally(() => {
      if (this.roomOperationQueues.get(normalizedRoomCode) === tail) {
        this.roomOperationQueues.delete(normalizedRoomCode);
      }
    });
  }

  #bindSocket(socketId, roomCode, playerId) {
    if (!socketId) return;
    this.socketIndex.set(socketId, {
      roomCode: normalizeRoomCode(roomCode),
      playerId,
    });
  }
}

export { ROOM_STATUS, ERROR_CODE };
