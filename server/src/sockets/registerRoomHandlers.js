import { RoomServiceError } from '../services/roomService.js';

function safeAck(ack, payload) {
  if (typeof ack === 'function') ack(payload);
}

function toAckError(error) {
  if (error instanceof RoomServiceError) {
    return {
      ok: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }

  return {
    ok: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Unexpected server error.',
    },
  };
}

function toMoveRejected(error) {
  if (error instanceof RoomServiceError) {
    return {
      code: error.code,
      reason: error.message,
    };
  }

  return {
    code: 'INTERNAL_ERROR',
    reason: 'Unexpected server error.',
  };
}

export function registerRoomHandlers(io, socket, roomService) {
  socket.on('room:create', (payload = {}, ack) => {
    try {
      const room = roomService.createRoom({
        playerId: payload.playerId,
        displayName: payload.displayName,
        gameId: payload.gameId,
        socketId: socket.id,
      });

      socket.join(room.roomCode);

      const snapshot = roomService.serializeRoom(room);
      io.to(room.roomCode).emit('room:state', snapshot);
      safeAck(ack, { ok: true, room: snapshot });
    } catch (error) {
      safeAck(ack, toAckError(error));
    }
  });

  socket.on('room:join', (payload = {}, ack) => {
    try {
      const room = roomService.joinRoom({
        roomCode: payload.roomCode,
        playerId: payload.playerId,
        displayName: payload.displayName,
        socketId: socket.id,
      });

      socket.join(room.roomCode);

      const snapshot = roomService.serializeRoom(room);
      io.to(room.roomCode).emit('room:state', snapshot);
      safeAck(ack, { ok: true, room: snapshot });
    } catch (error) {
      safeAck(ack, toAckError(error));
    }
  });

  socket.on('room:start', (payload = {}, ack) => {
    try {
      const room = roomService.startGame({
        roomCode: payload.roomCode,
        playerId: payload.playerId,
      });

      const snapshot = roomService.serializeRoom(room);
      io.to(room.roomCode).emit('room:state', snapshot);
      safeAck(ack, { ok: true, room: snapshot });
    } catch (error) {
      safeAck(ack, toAckError(error));
    }
  });

  socket.on('room:get-state', (payload = {}, ack) => {
    try {
      const room = roomService.getRoom(payload.roomCode);
      safeAck(ack, { ok: true, room: roomService.serializeRoom(room) });
    } catch (error) {
      safeAck(ack, toAckError(error));
    }
  });

  socket.on('make_move', async (payload = {}, ack) => {
    try {
      const room = await roomService.makeMove({
        roomCode: payload.roomCode,
        playerId: payload.playerId,
        column: payload.column,
        move: payload.move,
      });

      const snapshot = roomService.serializeRoom(room);
      io.to(room.roomCode).emit('room:state', snapshot);
      safeAck(ack, { ok: true, room: snapshot });
    } catch (error) {
      const rejection = toMoveRejected(error);
      socket.emit('move:rejected', rejection);
      safeAck(ack, { ok: false, error: rejection });
    }
  });

  socket.on('rematch:request', async (payload = {}, ack) => {
    try {
      const room = await roomService.requestRematch({
        roomCode: payload.roomCode,
        playerId: payload.playerId,
      });

      const snapshot = roomService.serializeRoom(room);
      io.to(room.roomCode).emit('room:state', snapshot);
      safeAck(ack, { ok: true, room: snapshot });
    } catch (error) {
      safeAck(ack, toAckError(error));
    }
  });

  socket.on('disconnect', () => {
    const room = roomService.markDisconnected(socket.id);
    if (!room) return;

    const snapshot = roomService.serializeRoom(room);
    io.to(room.roomCode).emit('room:state', snapshot);
  });
}
