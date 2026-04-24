import { getPresetAvatar, PRESET_AVATAR_IDS } from './avatarMap';

function randomItem(items) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
}

export function getRandomPresetAvatarId(excludedIds = []) {
  const blocked = new Set(
    (excludedIds || [])
      .map((value) => String(value || '').trim().toLowerCase())
      .filter(Boolean)
  );

  const allowed = PRESET_AVATAR_IDS.filter((id) => !blocked.has(id));
  const picked = randomItem(allowed.length > 0 ? allowed : PRESET_AVATAR_IDS);
  return picked || 'avatar1';
}

export function getDistinctRandomAvatarIds() {
  const first = getRandomPresetAvatarId();
  const second = getRandomPresetAvatarId([first]);
  return [first, second];
}

export function buildModeAvatarSet(mode, userAvatarId) {
  const normalizedMode = String(mode || '').trim().toLowerCase();
  const normalizedUserAvatarId = String(userAvatarId || 'avatar1').trim().toLowerCase() || 'avatar1';

  if (normalizedMode === 'bot') {
    const botAvatarId = getRandomPresetAvatarId([normalizedUserAvatarId]);
    return {
      player1Avatar: getPresetAvatar(normalizedUserAvatarId),
      player2Avatar: getPresetAvatar(botAvatarId),
      player1AvatarId: normalizedUserAvatarId,
      player2AvatarId: botAvatarId,
    };
  }

  if (normalizedMode === 'local') {
    const [first, second] = getDistinctRandomAvatarIds();
    return {
      player1Avatar: getPresetAvatar(first),
      player2Avatar: getPresetAvatar(second),
      player1AvatarId: first,
      player2AvatarId: second,
    };
  }

  return {
    player1Avatar: getPresetAvatar(normalizedUserAvatarId),
    player2Avatar: getPresetAvatar('avatar1'),
    player1AvatarId: normalizedUserAvatarId,
    player2AvatarId: 'avatar1',
  };
}
