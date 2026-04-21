const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomCodePart(length) {
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return result;
}

export function generateRoomCode() {
  return `ARENA-${randomCodePart(4)}`;
}

export function generateUniqueRoomCode(hasCode, maxAttempts = 5000) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const code = generateRoomCode();
    if (!hasCode(code)) return code;
  }

  throw new Error('Unable to generate unique room code');
}
