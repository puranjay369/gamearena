import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { socket } from '../socket/client';
import { useAuth } from './AuthContext';

const RoomContext = createContext(null);

function normalizeRoomCode(roomCode) {
  return String(roomCode || '').trim().toUpperCase();
}

function emitWithAck(event, payload, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    let resolved = false;

    const timeout = setTimeout(() => {
      if (resolved) return;
      resolved = true;
      reject(new Error('Server request timed out.'));
    }, timeoutMs);

    socket.emit(event, payload, (response) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeout);

      if (!response?.ok) {
        const error = new Error(response?.error?.message || 'Request failed.');
        error.code = response?.error?.code || 'REQUEST_FAILED';
        reject(error);
        return;
      }

      resolve(response.room);
    });
  });
}

export function RoomProvider({ children }) {
  const { user } = useAuth();
  const [room, setRoom] = useState(null);
  const [activeRoomCode, setActiveRoomCodeState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(socket.connected);

  const playerId = user?.uid || null;
  const displayName =
    user?.displayName ||
    (user?.email ? user.email.split('@')[0] : null) ||
    (user?.uid ? `Player-${String(user.uid).slice(0, 6)}` : null);
  const avatarId = String(user?.avatarId || '').trim().toLowerCase() || 'avatar1';

  const requireAuth = useCallback(() => {
    if (playerId) return;
    throw new Error('Please sign in to continue. You can use Google or Guest mode.');
  }, [playerId]);

  const setActiveRoomCode = useCallback((roomCode) => {
    const normalized = normalizeRoomCode(roomCode);
    setActiveRoomCodeState(normalized || null);
  }, []);

  useEffect(() => {
    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, []);

  useEffect(() => {
    if (user) return;

    setRoom(null);
    setActiveRoomCodeState(null);
  }, [user]);

  useEffect(() => {
    const handleRoomState = (snapshot) => {
      if (!snapshot?.roomCode) return;
      const snapshotCode = normalizeRoomCode(snapshot.roomCode);
      if (activeRoomCode && snapshotCode !== activeRoomCode) return;
      setRoom(snapshot);
    };

    socket.on('room:state', handleRoomState);

    return () => {
      socket.off('room:state', handleRoomState);
    };
  }, [activeRoomCode]);

  const createRoom = useCallback(async (gameId) => {
    try {
      requireAuth();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Please sign in to continue. You can use Google or Guest mode.';
      setError(message);
      throw err;
    }

    setLoading(true);
    setError('');

    try {
      const snapshot = await emitWithAck('room:create', {
        playerId,
        displayName,
        avatarId,
        gameId,
      });

      const roomCode = normalizeRoomCode(snapshot.roomCode);
      setActiveRoomCodeState(roomCode);
      setRoom(snapshot);
      return snapshot;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to create room.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [playerId, displayName, avatarId, requireAuth]);

  const joinRoom = useCallback(async (roomCode) => {
    const normalized = normalizeRoomCode(roomCode);
    if (!normalized) {
      const err = new Error('Room code is required.');
      setError(err.message);
      throw err;
    }

    try {
      requireAuth();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Please sign in to continue. You can use Google or Guest mode.';
      setError(message);
      throw err;
    }

    setLoading(true);
    setError('');

    try {
      const snapshot = await emitWithAck('room:join', {
        roomCode: normalized,
        playerId,
        displayName,
        avatarId,
      });

      setActiveRoomCodeState(normalized);
      setRoom(snapshot);
      return snapshot;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to join room.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [playerId, displayName, avatarId, requireAuth]);

  const startGame = useCallback(async (roomCode) => {
    const targetCode = normalizeRoomCode(roomCode || activeRoomCode);
    if (!targetCode) {
      const err = new Error('Room code is required.');
      setError(err.message);
      throw err;
    }

    try {
      requireAuth();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Please sign in to continue. You can use Google or Guest mode.';
      setError(message);
      throw err;
    }

    setLoading(true);
    setError('');

    try {
      const snapshot = await emitWithAck('room:start', {
        roomCode: targetCode,
        playerId,
      });
      setRoom(snapshot);
      return snapshot;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to start game.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [activeRoomCode, playerId, requireAuth]);

  const fetchRoomState = useCallback(async (roomCode) => {
    const targetCode = normalizeRoomCode(roomCode || activeRoomCode);
    if (!targetCode) return null;

    setLoading(true);
    setError('');

    try {
      const snapshot = await emitWithAck('room:get-state', { roomCode: targetCode });
      setActiveRoomCodeState(targetCode);
      setRoom(snapshot);
      return snapshot;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load room state.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [activeRoomCode]);

  const requestRematch = useCallback(async (roomCode) => {
    const targetCode = normalizeRoomCode(roomCode || activeRoomCode || room?.roomCode);
    if (!targetCode) {
      const err = new Error('Room code is required.');
      setError(err.message);
      throw err;
    }

    try {
      requireAuth();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Please sign in to continue. You can use Google or Guest mode.';
      setError(message);
      throw err;
    }

    setLoading(true);
    setError('');

    try {
      const snapshot = await emitWithAck('rematch:request', {
        roomCode: targetCode,
        playerId,
      });

      setRoom(snapshot);
      return snapshot;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to request rematch.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [activeRoomCode, room?.roomCode, requireAuth, playerId]);

  const leaveRoom = useCallback(async (roomCode) => {
    const targetCode = normalizeRoomCode(roomCode || activeRoomCode || room?.roomCode);
    if (!targetCode) {
      const err = new Error('Room code is required.');
      setError(err.message);
      throw err;
    }

    try {
      requireAuth();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Please sign in to continue. You can use Google or Guest mode.';
      setError(message);
      throw err;
    }

    setLoading(true);
    setError('');

    try {
      const snapshot = await emitWithAck('room:leave', {
        roomCode: targetCode,
        playerId,
      });

      setRoom(snapshot);
      return snapshot;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to leave room.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [activeRoomCode, room?.roomCode, requireAuth, playerId]);

  const clearRoomError = useCallback(() => setError(''), []);

  const makeMove = useCallback((moveOrColumn, roomCode) => {
    if (!playerId) {
      setError('Please sign in to continue. You can use Google or Guest mode.');
      return false;
    }

    const targetCode = normalizeRoomCode(roomCode || activeRoomCode || room?.roomCode);
    if (!targetCode) {
      setError('Room code is required.');
      return false;
    }

    const isColumnMove = Number.isInteger(moveOrColumn);
    const payload = isColumnMove ? { column: moveOrColumn } : { move: moveOrColumn };

    socket.emit('make_move', {
      roomCode: targetCode,
      playerId,
      displayName,
      ...payload,
    });

    return true;
  }, [activeRoomCode, playerId, displayName, room?.roomCode]);

  useEffect(() => {
    const handleMoveRejected = (payload) => {
      const reason = String(payload?.reason || '').trim();
      if (!reason) return;
      setError(reason);
    };

    socket.on('move:rejected', handleMoveRejected);

    return () => {
      socket.off('move:rejected', handleMoveRejected);
    };
  }, []);

  const value = useMemo(() => ({
    socket,
    connected,
    playerId,
    displayName,
    room,
    activeRoomCode,
    loading,
    error,
    setActiveRoomCode,
    createRoom,
    joinRoom,
    startGame,
    fetchRoomState,
    requestRematch,
    leaveRoom,
    makeMove,
    clearRoomError,
  }), [
    connected,
    playerId,
    displayName,
    room,
    activeRoomCode,
    loading,
    error,
    setActiveRoomCode,
    createRoom,
    joinRoom,
    startGame,
    fetchRoomState,
    requestRematch,
    leaveRoom,
    makeMove,
    clearRoomError,
  ]);

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}

export function useRoom() {
  const context = useContext(RoomContext);
  if (!context) throw new Error('useRoom must be used inside RoomProvider');
  return context;
}
