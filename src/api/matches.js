const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

function normalizeApiBase(url) {
  return String(url || '').replace(/\/$/, '');
}

function createErrorFromResponse(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export async function fetchMatches(uid, limit = 50) {
  const base = normalizeApiBase(API_BASE);
  const requestUrl = `${base}/api/matches?uid=${encodeURIComponent(uid)}&limit=${encodeURIComponent(limit)}`;

  const response = await fetch(requestUrl, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.ok) {
    throw createErrorFromResponse(payload?.error || 'Failed to load matches.', response.status);
  }

  return Array.isArray(payload.matches) ? payload.matches : [];
}

export async function saveFinishedMatch(matchPayload) {
  const base = normalizeApiBase(API_BASE);
  const requestUrl = `${base}/api/matches`;

  const response = await fetch(requestUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(matchPayload),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.ok) {
    throw createErrorFromResponse(payload?.error || 'Failed to save match.', response.status);
  }

  return payload.match;
}
