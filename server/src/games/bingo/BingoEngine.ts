import { IGameEngine, MoveResult } from '../core/IGameEngine';
import { GameType } from '../../../../shared/types';
import { BingoEvaluator } from '../../game/BingoEvaluator';

export class BingoEngine implements IGameEngine {
  readonly gameType: GameType = 'bingo';
  readonly roomId: string;
  private playerIds: string[] = [];

  constructor(roomId: string, playerIds: string[]) {
    this.roomId = roomId;
    this.playerIds = playerIds;
  }

  init(playerIds: string[]): void {
    this.playerIds = playerIds;
  }

  getState(): Record<string, any> {
    return {};
  }
}
