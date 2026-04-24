const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

function normalizeApiBase(url) {
  return String(url || '').replace(/\/$/, '');
}

function createErrorFromResponse(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export async function fetchUserProfile({ uid, displayName }) {
  const normalizedUid = String(uid || '').trim();
  if (!normalizedUid) throw new Error('uid is required');

  const params = new URLSearchParams({ uid: normalizedUid });
  if (displayName) params.set('displayName', String(displayName));

  const base = normalizeApiBase(API_BASE);
  const requestUrl = `${base}/api/users/profile?${params.toString()}`;

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

  if (!response.ok || !payload?.ok || !payload?.user) {
    throw createErrorFromResponse(payload?.error || 'Failed to load user profile.', response.status);
  }

  return payload.user;
}

export async function saveUserAvatar({ uid, avatarId, displayName }) {
  const normalizedUid = String(uid || '').trim();
  if (!normalizedUid) throw new Error('uid is required');

  const base = normalizeApiBase(API_BASE);
  const requestUrl = `${base}/api/users/avatar`;

  const response = await fetch(requestUrl, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      uid: normalizedUid,
      avatarId,
      displayName: displayName || undefined,
    }),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.ok || !payload?.user) {
    throw createErrorFromResponse(payload?.error || 'Failed to update avatar.', response.status);
  }

  return payload.user;
}
