import {
  Line,
  Box,
  Player,
  LineType,
  DotsGameState,
  GameChatMessage,
} from '../../../shared/types';

export class DotsAndBoxesGame {
  private roomId: string;
  private currentTurn: string | null = null;
  private horizontalLines: Line[][];
  private verticalLines: Line[][];
  private boxes: Box[][];
  private scores: Record<string, number> = {};
  private winnerId: string | 'draw' | null = null;
  private forfeitReason: 'opponent_left' | null = null;
  private rematchRequestedBy: string | null = null;
  private messages: GameChatMessage[] = [];

  constructor(roomId: string, playerIds: string[]) {
    this.roomId = roomId;
    this.horizontalLines = this.createHorizontalGrid();
    this.verticalLines = this.createVerticalGrid();
    this.boxes = this.createBoxGrid();
    for (const pId of playerIds) {
      this.scores[pId] = 0;
    }
    this.currentTurn = playerIds[0] || null;
  }

  private createHorizontalGrid(): Line[][] {
    const grid: Line[][] = [];
    for (let r = 0; r < 5; r++) {
      const row: Line[] = [];
      for (let c = 0; c < 4; c++) {
        row.push({
          id: `h-${r}-${c}`,
          type: 'h',
          row: r,
          col: c,
          owner: null,
        });
      }
      grid.push(row);
    }
    return grid;
  }

  private createVerticalGrid(): Line[][] {
    const grid: Line[][] = [];
    for (let r = 0; r < 4; r++) {
      const row: Line[] = [];
      for (let c = 0; c < 5; c++) {
        row.push({
          id: `v-${r}-${c}`,
          type: 'v',
          row: r,
          col: c,
          owner: null,
        });
      }
      grid.push(row);
    }
    return grid;
  }

  private createBoxGrid(): Box[][] {
    const grid: Box[][] = [];
    for (let r = 0; r < 4; r++) {
      const row: Box[] = [];
      for (let c = 0; c < 4; c++) {
        row.push({
          id: `b-${r}-${c}`,
          row: r,
          col: c,
          owner: null,
        });
      }
      grid.push(row);
    }
    return grid;
  }

  public makeMove(playerId: string, type: LineType, row: number, col: number): { success: boolean; message?: string } {
    if (this.winnerId !== null) {
      return { success: false, message: 'Game has ended' };
    }
    if (this.currentTurn !== playerId) {
      return { success: false, message: 'Not your turn' };
    }

    if (type === 'h') {
      if (row < 0 || row > 4 || col < 0 || col > 3) {
        return { success: false, message: 'Invalid horizontal line coordinates' };
      }
      if (this.horizontalLines[row][col].owner !== null) {
        return { success: false, message: 'Line already drawn' };
      }
      this.horizontalLines[row][col].owner = playerId;
    } else {
      if (row < 0 || row > 3 || col < 0 || col > 4) {
        return { success: false, message: 'Invalid vertical line coordinates' };
      }
      if (this.verticalLines[row][col].owner !== null) {
        return { success: false, message: 'Line already drawn' };
      }
      this.verticalLines[row][col].owner = playerId;
    }

    let completedBoxesCount = 0;
    const adjacentBoxes = this.getAdjacentBoxes(type, row, col);

    for (const { r, c } of adjacentBoxes) {
      if (this.isBoxCompleted(r, c) && this.boxes[r][c].owner === null) {
        this.boxes[r][c].owner = playerId;
        this.scores[playerId] = (this.scores[playerId] || 0) + 1;
        completedBoxesCount++;
      }
    }

    if (completedBoxesCount === 0) {
      const allPlayerIds = Object.keys(this.scores);
      const opponentId = allPlayerIds.find((id) => id !== playerId);
      if (opponentId) {
        this.currentTurn = opponentId;
      }
    }

    let totalClaimedBoxes = 0;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (this.boxes[r][c].owner !== null) {
          totalClaimedBoxes++;
        }
      }
    }

    if (totalClaimedBoxes === 16) {
      this.determineWinner();
    }

    return { success: true };
  }

  private getAdjacentBoxes(type: LineType, row: number, col: number): { r: number; c: number }[] {
    const boxes: { r: number; c: number }[] = [];
    if (type === 'h') {
      if (row > 0) boxes.push({ r: row - 1, c: col });
      if (row < 4) boxes.push({ r: row, c: col });
    } else {
      if (col > 0) boxes.push({ r: row, c: col - 1 });
      if (col < 4) boxes.push({ r: row, c: col });
    }
    return boxes;
  }

  private isBoxCompleted(r: number, c: number): boolean {
    const top = this.horizontalLines[r][c].owner !== null;
    const bottom = this.horizontalLines[r + 1][c].owner !== null;
    const left = this.verticalLines[r][c].owner !== null;
    const right = this.verticalLines[r][c + 1].owner !== null;
    return top && bottom && left && right;
  }

  private determineWinner(): void {
    const playerIds = Object.keys(this.scores);
    if (playerIds.length < 2) return;
    const s1 = this.scores[playerIds[0]] || 0;
    const s2 = this.scores[playerIds[1]] || 0;

    if (s1 > s2) {
      this.winnerId = playerIds[0];
    } else if (s2 > s1) {
      this.winnerId = playerIds[1];
    } else {
      this.winnerId = 'draw';
    }
  }

  public handleForfeit(leavingPlayerId: string): void {
    const remainingId = Object.keys(this.scores).find((id) => id !== leavingPlayerId);
    if (remainingId) {
      this.winnerId = remainingId;
      this.forfeitReason = 'opponent_left';
    }
  }

  public requestRematch(playerId: string): { success: boolean; isRestarted: boolean } {
    if (!this.rematchRequestedBy) {
      this.rematchRequestedBy = playerId;
      return { success: true, isRestarted: false };
    } else if (this.rematchRequestedBy !== playerId) {
      this.resetGame();
      return { success: true, isRestarted: true };
    }
    return { success: true, isRestarted: false };
  }

  public resetGame(): void {
    this.horizontalLines = this.createHorizontalGrid();
    this.verticalLines = this.createVerticalGrid();
    this.boxes = this.createBoxGrid();
    this.winnerId = null;
    this.forfeitReason = null;
    this.rematchRequestedBy = null;
    for (const id of Object.keys(this.scores)) {
      this.scores[id] = 0;
    }
  }

  public addMessage(senderId: string, senderName: string, text: string): GameChatMessage {
    const cleanText = (text || '').trim().slice(0, 200);
    const message: GameChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      roomId: this.roomId,
      senderId,
      senderName,
      message: cleanText,
      text: cleanText,
      timestamp: Date.now(),
    };
    this.messages.push(message);
    if (this.messages.length > 50) {
      this.messages.shift();
    }
    return message;
  }

  public clearMessages(): void {
    this.messages = [];
  }

  public getMessages(): GameChatMessage[] {
    return this.messages;
  }

  public getDotsState(): DotsGameState {
    return {
      currentTurn: this.currentTurn,
      horizontalLines: this.horizontalLines,
      verticalLines: this.verticalLines,
      boxes: this.boxes,
      scores: this.scores,
      winnerId: this.winnerId,
      forfeitReason: this.forfeitReason,
      rematchRequestedBy: this.rematchRequestedBy,
    };
  }
}
