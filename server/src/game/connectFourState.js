import {
  createInitialState,
  EMPTY,
  GAME_STATUS,
  PLAYER1,
  PLAYER2,
} from '../../../src/game-engines/connectFour/index.js';

export const CONNECT_FOUR_GAME_STATUS = GAME_STATUS;
export { EMPTY, PLAYER1, PLAYER2 };

export function createInitialConnectFourState() {
  return createInitialState();
}
