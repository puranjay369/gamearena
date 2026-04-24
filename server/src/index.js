import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { createApp, corsOptions } from './app.js';
import { PORT } from './config.js';
import { connectDB } from './db/connect.js';
import { RoomService } from './services/roomService.js';
import { registerSocketHandlers } from './sockets/index.js';
import { RoomStore } from './store/roomStore.js';

const app = createApp();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: corsOptions,
});

const roomStore = new RoomStore();
const roomService = new RoomService(roomStore, {
  onRoomUpdated: (snapshot) => {
    if (!snapshot?.roomCode) return;
    io.to(snapshot.roomCode).emit('room:state', snapshot);
  },
});

registerSocketHandlers(io, roomService);

async function bootstrap() {
  try {
    await connectDB();
  } catch {
    // eslint-disable-next-line no-console
    console.warn('[db] Starting server without database connection.');
  }

  httpServer.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Socket server running on http://localhost:${PORT}`);
  });
}

bootstrap();
