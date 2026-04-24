import avatar1 from '../assets/avatars/avatar1.png';
import avatar2 from '../assets/avatars/avatar2.png';
import avatar3 from '../assets/avatars/avatar3.png';
import avatar4 from '../assets/avatars/avatar4.png';
import avatar5 from '../assets/avatars/avatar5.png';
import avatar6 from '../assets/avatars/avatar6.png';
import avatar7 from '../assets/avatars/avatar7.png';
import avatar8 from '../assets/avatars/avatar8.png';

export const AVATAR_MAP = {
  avatar1,
  avatar2,
  avatar3,
  avatar4,
  avatar5,
  avatar6,
  avatar7,
  avatar8,
};

export const PRESET_AVATAR_IDS = Object.keys(AVATAR_MAP);

export function getPresetAvatar(avatarId) {
  const normalized = String(avatarId || '').trim().toLowerCase();
  return AVATAR_MAP[normalized] || AVATAR_MAP.avatar1;
}

export function resolveUserAvatar(user) {
  if (!user) return AVATAR_MAP.avatar1;

  const avatarId = String(user.avatarId || '').trim().toLowerCase();

  if (AVATAR_MAP[avatarId]) return AVATAR_MAP[avatarId];

  if (user.photoURL) return user.photoURL;

  return AVATAR_MAP[avatarId] || AVATAR_MAP.avatar1;
}
