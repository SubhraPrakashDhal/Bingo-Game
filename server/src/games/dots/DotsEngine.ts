import { IGameEngine, MoveResult } from '../core/IGameEngine';
import { GameType, LineType } from '../../../../shared/types';
import { DotsAndBoxesGame } from '../../game/DotsAndBoxesGame';

export class DotsEngine implements IGameEngine {
  readonly gameType: GameType = 'dots';
  readonly roomId: string;
  private dotsGame: DotsAndBoxesGame;

  constructor(roomId: string, playerIds: string[]) {
    this.roomId = roomId;
    this.dotsGame = new DotsAndBoxesGame(roomId, playerIds);
  }

  init(playerIds: string[]): void {
    this.dotsGame = new DotsAndBoxesGame(this.roomId, playerIds);
  }

  makeMove(playerId: string, payload: { type: LineType; row: number; col: number }): MoveResult {
    const res = this.dotsGame.makeMove(playerId, payload.type, payload.row, payload.col);
    const state = this.dotsGame.getDotsState();
    return {
      success: res.success,
      error: res.message,
      isEnded: state.winnerId !== null,
      winnerId: state.winnerId || undefined,
    };
  }

  requestRematch(playerId: string): { success: boolean; isRestarted: boolean } {
    return this.dotsGame.requestRematch(playerId);
  }

  getState() {
    return this.dotsGame.getDotsState();
  }

  getDotsGameInstance(): DotsAndBoxesGame {
    return this.dotsGame;
  }
}
