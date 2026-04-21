function normalizeRoomCode(roomCode) {
  return String(roomCode || '').trim().toUpperCase();
}

export class RoomStore {
  constructor() {
    this.rooms = new Map();
  }

  has(roomCode) {
    return this.rooms.has(normalizeRoomCode(roomCode));
  }

  get(roomCode) {
    return this.rooms.get(normalizeRoomCode(roomCode));
  }

  set(room) {
    this.rooms.set(normalizeRoomCode(room.roomCode), room);
    return room;
  }

  delete(roomCode) {
    this.rooms.delete(normalizeRoomCode(roomCode));
  }

  values() {
    return [...this.rooms.values()];
  }
}
