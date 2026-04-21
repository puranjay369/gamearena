let runtimePlayerId = null;

function createFallbackId() {
  return `player_${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
}

export function getOrCreatePlayerId() {
  if (runtimePlayerId) return runtimePlayerId;

  runtimePlayerId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : createFallbackId();
  return runtimePlayerId;
}

export function getPlayerId() {
  return runtimePlayerId;
}
