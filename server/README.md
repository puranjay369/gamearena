# GameArena Socket Server (Minimal)

Node.js + Express + Socket.IO backend for room lifecycle (Connect Four only).

## Implemented

- Room creation with generated room code
- Join room (max 2 players)
- Seat assignment (`1` / `2`)
- Start game (`hostPlayerId` only)
- In-memory room store
- Full room snapshot broadcast on room changes

## Not Implemented Yet

- Move handling / turn progression
- Persistence (DB)
- Match history

## Run

From project root:

```bash
npm run server
```

Or directly:

```bash
cd server
npm install
npm run dev
```

Server default URL: `http://localhost:4000`
Health endpoint: `GET /health`

## Socket Events

### `room:create`
Request payload:

```json
{
  "playerId": "uuid-from-localstorage",
  "displayName": "Player One",
  "gameId": "connect-four"
}
```

Ack response:

```json
{
  "ok": true,
  "room": { "...full room snapshot...": true }
}
```

### `room:join`
Request payload:

```json
{
  "roomCode": "ARENA-ABCD",
  "playerId": "uuid-from-localstorage",
  "displayName": "Player Two"
}
```

### `room:start`
Request payload:

```json
{
  "roomCode": "ARENA-ABCD",
  "playerId": "host-player-id"
}
```

### `room:get-state`
Request payload:

```json
{
  "roomCode": "ARENA-ABCD"
}
```

### `room:state` (server -> clients)
Broadcasted after create/join/start/disconnect with full room snapshot.

## Room Shape

```json
{
  "roomCode": "ARENA-ABCD",
  "gameId": "connect-four",
  "status": "waiting",
  "hostPlayerId": "...",
  "players": [
    {
      "playerId": "...",
      "displayName": "...",
      "socketId": "...",
      "seat": 1,
      "connected": true,
      "joinedAt": "ISO",
      "lastSeenAt": "ISO"
    }
  ],
  "gameState": null,
  "createdAt": "ISO",
  "updatedAt": "ISO"
}
```
