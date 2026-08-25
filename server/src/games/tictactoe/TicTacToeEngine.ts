import { IGameEngine, MoveResult } from '../core/IGameEngine';
import { GameType } from '../../../../shared/types';
import { TicTacToeGame } from '../../game/TicTacToeGame';

export class TicTacToeEngine implements IGameEngine {
  readonly gameType: GameType = 'tictactoe';
  readonly roomId: string;
  private ticTacToeGame: TicTacToeGame;

  constructor(roomId: string, playerIds: string[]) {
    this.roomId = roomId;
    this.ticTacToeGame = new TicTacToeGame(roomId, playerIds);
  }

  init(playerIds: string[]): void {
    this.ticTacToeGame = new TicTacToeGame(this.roomId, playerIds);
  }

  makeMove(playerId: string, payload: { cellIndex: number }): MoveResult {
    const res = this.ticTacToeGame.makeMove(playerId, payload.cellIndex);
    const state = this.ticTacToeGame.getTicTacToeState();
    return {
      success: res.success,
      error: res.message,
      isEnded: state.winnerId !== null,
      winnerId: state.winnerId || undefined,
    };
  }

  requestRematch(playerId: string): { success: boolean; isRestarted: boolean } {
    return this.ticTacToeGame.requestRematch(playerId);
  }

  getState() {
    return this.ticTacToeGame.getTicTacToeState();
  }

  getTicTacToeGameInstance(): TicTacToeGame {
    return this.ticTacToeGame;
  }
}
