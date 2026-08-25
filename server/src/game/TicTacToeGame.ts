import {
  TicTacToeSymbol,
  TicTacToeMode,
  TicTacToeMark,
  TicTacToeGameState,
  GameChatMessage,
} from '../../../shared/types';

export class TicTacToeGame {
  private roomId: string;
  private playerIds: string[] = [];
  private mode: TicTacToeMode = 'classic';
  private board: (TicTacToeSymbol | null)[] = Array(9).fill(null);
  private marks: TicTacToeMark[] = [];
  private lastExpiredMark: TicTacToeMark | null = null;
  private moveCounter = 0;
  private playerSymbols: Record<string, TicTacToeSymbol> = {};
  private currentTurn: string | null = null;
  private winnerId: string | 'draw' | null = null;
  private winningLine: number[] | null = null;
  private forfeitReason: 'opponent_left' | null = null;
  private rematchRequestedBy: string | null = null;
  private messages: GameChatMessage[] = [];

  private static WINNING_COMBINATIONS: number[][] = [
    // Rows
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    // Columns
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    // Diagonals
    [0, 4, 8],
    [2, 4, 6],
  ];

  constructor(roomId: string, playerIds: string[], tossWinnerId?: string) {
    this.roomId = roomId;
    this.playerIds = playerIds;
    this.initializePlayerSymbols(tossWinnerId);
  }

  public setMode(mode: TicTacToeMode): void {
    this.mode = mode;
  }

  public getMode(): TicTacToeMode {
    return this.mode;
  }

  public initializePlayerSymbols(tossWinnerId?: string): void {
    if (this.playerIds.length < 2) return;
    const winner = tossWinnerId && this.playerIds.includes(tossWinnerId) ? tossWinnerId : this.playerIds[0];
    const opponent = this.playerIds.find((id) => id !== winner) || this.playerIds[1];

    this.playerSymbols[winner] = 'X';
    this.playerSymbols[opponent] = 'O';
    this.currentTurn = winner;
  }

  public setInitialTurnAndSymbols(tossWinnerId: string): void {
    this.initializePlayerSymbols(tossWinnerId);
  }

  public makeMove(playerId: string, cellIndex: number): { success: boolean; message?: string } {
    if (this.winnerId !== null) {
      return { success: false, message: 'Game has ended' };
    }
    if (this.currentTurn !== playerId) {
      return { success: false, message: 'Not your turn' };
    }
    if (!Number.isInteger(cellIndex) || cellIndex < 0 || cellIndex > 8) {
      return { success: false, message: 'Invalid cell index' };
    }
    if (this.board[cellIndex] !== null) {
      return { success: false, message: 'Cell is already occupied' };
    }

    const symbol = this.playerSymbols[playerId];
    if (!symbol) {
      return { success: false, message: 'Player symbol not assigned' };
    }

    let expired: TicTacToeMark | null = null;

    // 1. In Infinite Mode: if player already has 3 active marks,
    // the oldest mark (1st element) is logically expired and removed BEFORE win detection.
    if (this.mode === 'infinite') {
      const playerMarks = this.marks.filter((m) => m.playerId === playerId);
      if (playerMarks.length >= 3) {
        const oldestMark = playerMarks[0];
        // Expire oldest mark logically: clear from board and remove from mark history
        this.board[oldestMark.cellIndex] = null;
        this.marks = this.marks.filter((m) => m !== oldestMark);
        expired = oldestMark;
      }
    }

    this.lastExpiredMark = expired;

    // 2. Place the new mark on the board and push to active mark queue
    this.board[cellIndex] = symbol;
    this.moveCounter++;
    this.marks.push({
      playerId,
      symbol,
      cellIndex,
      moveNumber: this.moveCounter,
    });

    // 3. Evaluate board for win using ONLY current active marks
    const winningCombo = this.checkWin(symbol);

    if (winningCombo) {
      this.winnerId = playerId;
      this.winningLine = winningCombo;
    } else if (this.mode === 'classic' && this.board.every((cell) => cell !== null)) {
      // Classic Mode Draw check
      this.winnerId = 'draw';
      this.winningLine = null;
    } else {
      // 4. Switch Turn to opponent
      const opponentId = this.playerIds.find((id) => id !== playerId);
      if (opponentId) {
        this.currentTurn = opponentId;
      }
    }

    return { success: true };
  }

  private checkWin(symbol: TicTacToeSymbol): number[] | null {
    for (const combo of TicTacToeGame.WINNING_COMBINATIONS) {
      const [a, b, c] = combo;
      if (
        this.board[a] === symbol &&
        this.board[b] === symbol &&
        this.board[c] === symbol
      ) {
        return combo;
      }
    }
    return null;
  }

  public handleForfeit(leavingPlayerId: string): void {
    const remainingId = this.playerIds.find((id) => id !== leavingPlayerId);
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
    this.board = Array(9).fill(null);
    this.marks = [];
    this.lastExpiredMark = null;
    this.moveCounter = 0;
    this.winnerId = null;
    this.winningLine = null;
    this.forfeitReason = null;
    this.rematchRequestedBy = null;
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

  public getTicTacToeState(): TicTacToeGameState {
    return {
      mode: this.mode,
      board: this.board,
      currentTurn: this.currentTurn,
      playerSymbols: this.playerSymbols,
      winnerId: this.winnerId,
      winningLine: this.winningLine,
      marks: this.marks,
      lastExpiredMark: this.lastExpiredMark,
      forfeitReason: this.forfeitReason,
      rematchRequestedBy: this.rematchRequestedBy,
    };
  }
}
