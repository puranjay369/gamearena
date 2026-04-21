import { registerRoomHandlers } from './registerRoomHandlers.js';

export function registerSocketHandlers(io, roomService) {
  io.on('connection', (socket) => {
    registerRoomHandlers(io, socket, roomService);
  });
}
