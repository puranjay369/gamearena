export function isGuestUid(uid) {
  return typeof uid === 'string' && uid.startsWith('guest_');
}

export function formatNameWithGuestBadge(displayName, uid) {
  const baseName = String(displayName || '').trim() || 'Guest';
  if (!isGuestUid(uid)) return baseName;
  return baseName.endsWith(' (Guest)') ? baseName : `${baseName} (Guest)`;
}
