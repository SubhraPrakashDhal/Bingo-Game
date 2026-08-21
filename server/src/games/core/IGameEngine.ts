import { GameType } from '../../../../shared/types';

export interface MoveResult {
  success: boolean;
  error?: string;
  isEnded?: boolean;
  winnerId?: string | 'draw';
}

export interface IGameEngine {
  readonly gameType: GameType;
  readonly roomId: string;

  init(playerIds: string[]): void;
  getState(): Record<string, any> | undefined;
  makeMove?(playerId: string, payload: any): MoveResult;
  requestRematch?(playerId: string): { success: boolean; isRestarted: boolean };
  reset?(): void;
}
