import {
  RoomState,
  ClientRoomState,
  Player,
  CoinChoice,
} from '../../../shared/types';
import { BingoEvaluator } from './BingoEvaluator';
import { TossEngine } from './TossEngine';

export class RoomManager {
  private rooms: Map<string, RoomState> = new Map();
  // Stable Player ID -> Room ID lookup
  private playerToRoom: Map<string, string> = new Map();
  // Socket ID -> Stable Player ID lookup
  private socketToPlayer: Map<string, string> = new Map();

  /**
   * Generates a 6-character room code.
   */
  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }

  /**
   * Creates a new private room associated with stable playerId.
   */
  public createRoom(
    playerId: string,
    socketId: string,
    nickname: string
  ): { roomId: string; room: RoomState } {
    // If player was previously in another room, clean up old association
    const oldRoomId = this.playerToRoom.get(playerId);
    if (oldRoomId) {
      this.leaveRoom(playerId);
    }

    const roomId = this.generateRoomCode();
    const host: Player = {
      id: socketId,
      playerId,
      nickname,
      isHost: true,
      isReady: false,
      isBoardReady: false,
      wantsRematch: false,
      isConnected: true,
    };

    const room: RoomState = {
      roomId,
      stage: 'LOBBY',
      players: [host],
      boards: {},
      calledNumbers: [],
      winningLines: {},
      completedLineCounts: {},
    };

    this.rooms.set(roomId, room);
    this.playerToRoom.set(playerId, roomId);
    this.socketToPlayer.set(socketId, playerId);

    return { roomId, room };
  }

  /**
   * Joins an existing room using stable playerId.
   */
  public joinRoom(
    playerId: string,
    socketId: string,
    roomId: string,
    nickname: string
  ): { success: boolean; error?: string } {
    const formattedId = roomId.toUpperCase().trim();
    const room = this.rooms.get(formattedId);

    if (!room) {
      return { success: false, error: 'Room not found. Please check the room code.' };
    }

    // Check if this player is already in the room (reconnecting)
    const existingPlayer = room.players.find(
      (p) => p.playerId === playerId || p.id === playerId
    );
    if (existingPlayer) {
      existingPlayer.id = socketId;
      existingPlayer.isConnected = true;
      this.socketToPlayer.set(socketId, playerId);
      this.playerToRoom.set(playerId, formattedId);
      return { success: true };
    }

    if (room.players.length >= 2) {
      return { success: false, error: 'Room is full. Maximum 2 players allowed.' };
    }

    if (room.stage !== 'LOBBY') {
      return { success: false, error: 'Game has already started in this room.' };
    }

    const guest: Player = {
      id: socketId,
      playerId,
      nickname,
      isHost: false,
      isReady: false,
      isBoardReady: false,
      wantsRematch: false,
      isConnected: true,
    };

    room.players.push(guest);
    this.playerToRoom.set(playerId, formattedId);
    this.socketToPlayer.set(socketId, playerId);

    return { success: true };
  }

  /**
   * Reconnects an existing player with a new socketId.
   */
  public reconnectPlayer(
    playerId: string,
    newSocketId: string
  ): { success: boolean; roomId?: string; room?: RoomState; reconnectedNickname?: string } {
    const roomId = this.playerToRoom.get(playerId);
    if (!roomId) return { success: false };

    const room = this.rooms.get(roomId);
    if (!room) {
      this.playerToRoom.delete(playerId);
      return { success: false };
    }

    const player = room.players.find(
      (p) => p.playerId === playerId || p.id === playerId
    );
    if (!player) {
      this.playerToRoom.delete(playerId);
      return { success: false };
    }

    // Update socket mapping and connection state
    player.id = newSocketId;
    player.isConnected = true;
    this.socketToPlayer.set(newSocketId, playerId);
    this.playerToRoom.set(playerId, roomId);

    return { success: true, roomId, room, reconnectedNickname: player.nickname };
  }

  /**
   * Gets room by room code.
   */
  public getRoom(roomId: string): RoomState | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * Gets room by stable playerId.
   */
  public getRoomByPlayerId(playerId: string): RoomState | undefined {
    const roomId = this.playerToRoom.get(playerId);
    if (!roomId) return undefined;
    return this.rooms.get(roomId);
  }

  /**
   * Gets room by socket ID.
   */
  public getRoomBySocket(socketId: string): RoomState | undefined {
    const playerId = this.socketToPlayer.get(socketId);
    if (!playerId) return undefined;
    return this.getRoomByPlayerId(playerId);
  }

  /**
   * Gets stable playerId by socket ID.
   */
  public getPlayerIdBySocket(socketId: string): string | undefined {
    return this.socketToPlayer.get(socketId);
  }

  /**
   * Toggles player readiness in lobby.
   */
  public toggleReady(playerId: string): { room?: RoomState; error?: string } {
    const room = this.getRoomByPlayerId(playerId);
    if (!room) return { error: 'Room not found' };

    const player = room.players.find(
      (p) => p.playerId === playerId || p.id === playerId
    );
    if (!player) return { error: 'Player not found' };

    player.isReady = !player.isReady;

    // Check if both players are ready to proceed to BOARD_SETUP
    if (room.players.length === 2 && room.players.every((p) => p.isReady)) {
      room.stage = 'BOARD_SETUP';
    }

    return { room };
  }

  /**
   * Validates and submits a player's 5x5 board setup.
   */
  public submitBoard(
    playerId: string,
    board: number[]
  ): { success: boolean; room?: RoomState; error?: string } {
    const room = this.getRoomByPlayerId(playerId);
    if (!room) return { success: false, error: 'Room not found' };

    if (room.stage !== 'BOARD_SETUP') {
      return { success: false, error: 'Board setup is not currently open.' };
    }

    // Validate board numbers (must be 25 unique integers 1-25)
    if (!Array.isArray(board) || board.length !== 25) {
      return { success: false, error: 'Invalid board size. Board must contain exactly 25 numbers.' };
    }

    const uniqueSet = new Set(board);
    if (
      uniqueSet.size !== 25 ||
      !board.every((num) => Number.isInteger(num) && num >= 1 && num <= 25)
    ) {
      return {
        success: false,
        error: 'Invalid numbers. Board must contain unique numbers from 1 to 25.',
      };
    }

    // Save player's private board indexed by stable playerId
    room.boards[playerId] = board;

    const player = room.players.find(
      (p) => p.playerId === playerId || p.id === playerId
    );
    if (player) {
      player.isBoardReady = true;
    }

    // If both players submitted boards, advance to TOSS stage
    if (room.players.length === 2 && room.players.every((p) => p.isBoardReady)) {
      room.stage = 'TOSS';
    }

    return { success: true, room };
  }

  /**
   * Executes coin toss with host's choice and sets first turn.
   */
  public executeToss(
    playerId: string,
    choice: CoinChoice
  ): { room?: RoomState; tossResult?: any; error?: string } {
    const room = this.getRoomByPlayerId(playerId);
    if (!room) return { error: 'Room not found' };

    if (room.stage !== 'TOSS') {
      return { error: 'Coin toss is not currently active.' };
    }

    const host = room.players.find((p) => p.isHost);
    const guest = room.players.find((p) => !p.isHost);

    if (!host || !guest) {
      return { error: 'Both players must be present for toss.' };
    }

    const hostId = host.playerId || host.id;
    const guestId = guest.playerId || guest.id;

    room.tossChoice = choice;
    const { outcome, winnerId } = TossEngine.determineWinner(choice, hostId, guestId);
    room.tossWinnerId = winnerId;
    room.currentTurnPlayerId = winnerId;
    room.stage = 'PLAYING';

    const winnerPlayer = room.players.find(
      (p) => p.playerId === winnerId || p.id === winnerId
    );

    return {
      room,
      tossResult: {
        choice,
        outcome,
        winnerId,
        winnerNickname: winnerPlayer?.nickname || 'Winner',
      },
    };
  }

  /**
   * Process calling a number during turn.
   */
  public callNumber(
    playerId: string,
    numberCalled: number
  ): { success: boolean; room?: RoomState; calledByNickname?: string; winner?: Player; error?: string } {
    const room = this.getRoomByPlayerId(playerId);
    if (!room) return { success: false, error: 'Room not found' };

    if (room.stage !== 'PLAYING') {
      return { success: false, error: 'Game is not currently active.' };
    }

    if (room.currentTurnPlayerId !== playerId) {
      return { success: false, error: 'It is not your turn!' };
    }

    if (!Number.isInteger(numberCalled) || numberCalled < 1 || numberCalled > 25) {
      return { success: false, error: 'Invalid number. Must be between 1 and 25.' };
    }

    if (room.calledNumbers.includes(numberCalled)) {
      return { success: false, error: 'This number has already been called!' };
    }

    // Record called number
    room.calledNumbers.push(numberCalled);

    const caller = room.players.find(
      (p) => p.playerId === playerId || p.id === playerId
    );

    // Recalculate line completion for both players
    let winningPlayer: Player | undefined = undefined;

    if (!room.completedLineCounts) room.completedLineCounts = {};
    if (!room.winningLines) room.winningLines = {};

    for (const p of room.players) {
      const pId = p.playerId || p.id;
      const pBoard = room.boards[pId];
      if (pBoard) {
        const evalResult = BingoEvaluator.evaluate(pBoard, room.calledNumbers);

        room.completedLineCounts[pId] = evalResult.completedLinesCount;
        room.winningLines[pId] = evalResult.completedLines;

        if (evalResult.hasWon && !winningPlayer) {
          winningPlayer = p;
        }
      }
    }

    // Check if winner was detected
    if (winningPlayer) {
      room.stage = 'GAME_OVER';
      room.winnerId = winningPlayer.playerId || winningPlayer.id;
    } else {
      // Switch turn to opponent
      const opponent = room.players.find(
        (p) => (p.playerId || p.id) !== playerId
      );
      if (opponent) {
        room.currentTurnPlayerId = opponent.playerId || opponent.id;
      }
    }

    return {
      success: true,
      room,
      calledByNickname: caller?.nickname,
      winner: winningPlayer,
    };
  }

  /**
   * Process rematch request.
   */
  public requestRematch(playerId: string): { room?: RoomState; bothReadyForRematch: boolean } {
    const room = this.getRoomByPlayerId(playerId);
    if (!room) return { bothReadyForRematch: false };

    const player = room.players.find(
      (p) => p.playerId === playerId || p.id === playerId
    );
    if (player) {
      player.wantsRematch = true;
    }

    const bothReady = room.players.length === 2 && room.players.every((p) => p.wantsRematch);

    if (bothReady) {
      // Reset room for new game setup
      room.stage = 'BOARD_SETUP';
      room.boards = {};
      room.calledNumbers = [];
      room.tossChoice = undefined;
      room.tossWinnerId = undefined;
      room.currentTurnPlayerId = undefined;
      room.winnerId = undefined;
      room.winningLines = {};
      room.completedLineCounts = {};

      for (const p of room.players) {
        p.isBoardReady = false;
        p.wantsRematch = false;
      }
    }

    return { room, bothReadyForRematch: bothReady };
  }

  /**
   * Handle socket disconnect.
   * Marks socketId = '' and isConnected = false to allow temporary reconnect without immediately destroying active game state.
   */
  public handleDisconnect(
    socketId: string
  ): { roomId?: string; room?: RoomState; disconnectedNickname?: string } {
    const playerId = this.socketToPlayer.get(socketId);
    if (!playerId) return {};

    this.socketToPlayer.delete(socketId);

    const roomId = this.playerToRoom.get(playerId);
    if (!roomId) return {};

    const room = this.rooms.get(roomId);
    if (!room) return {};

    const discPlayer = room.players.find(
      (p) => p.playerId === playerId || p.id === socketId
    );
    if (discPlayer) {
      discPlayer.id = '';
      discPlayer.isConnected = false;
    }

    // Clean up empty abandoned room only after 15 minutes of all players being disconnected
    const allDisconnected = room.players.every(
      (p) => p.isConnected === false || !p.id
    );
    if (allDisconnected) {
      setTimeout(() => {
        const currentRoom = this.rooms.get(roomId);
        if (
          currentRoom &&
          currentRoom.players.every((p) => p.isConnected === false || !p.id)
        ) {
          for (const p of currentRoom.players) {
            this.playerToRoom.delete(p.playerId || p.id);
          }
          this.rooms.delete(roomId);
        }
      }, 15 * 60 * 1000);
    }

    return { roomId, room, disconnectedNickname: discPlayer?.nickname };
  }

  /**
   * Explicit leave room by player.
   */
  public leaveRoom(playerId: string): { roomId?: string; room?: RoomState; disconnectedNickname?: string } {
    const roomId = this.playerToRoom.get(playerId);
    if (!roomId) return {};

    const room = this.rooms.get(roomId);
    this.playerToRoom.delete(playerId);

    if (!room) return {};

    const player = room.players.find(
      (p) => p.playerId === playerId || p.id === playerId
    );
    const nickname = player?.nickname;

    if (player && player.id) {
      this.socketToPlayer.delete(player.id);
    }

    room.players = room.players.filter(
      (p) => (p.playerId || p.id) !== playerId
    );

    if (room.players.length === 0) {
      this.rooms.delete(roomId);
      return { roomId, disconnectedNickname: nickname };
    } else {
      if (room.players[0]) {
        room.players[0].isHost = true;
      }
    }

    return { roomId, room, disconnectedNickname: nickname };
  }

  /**
   * Generates a PRIVACY-SAFE snapshot tailored for a specific client targetPlayerId.
   * Player 1 sees ONLY Player 1's board.
   * Player 2 sees ONLY Player 2's board.
   */
  public getClientRoomState(roomId: string, targetPlayerId: string): ClientRoomState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const targetPlayer = room.players.find(
      (p) => (p.playerId || p.id) === targetPlayerId
    );
    const completedCounts = room.completedLineCounts || {};
    const lines = room.winningLines || {};

    const publicPlayers = room.players.map((p) => {
      const pId = p.playerId || p.id;
      return {
        id: pId,
        nickname: p.nickname,
        isHost: p.isHost,
        isReady: p.isReady,
        isBoardReady: p.isBoardReady,
        wantsRematch: !!p.wantsRematch,
        isConnected: p.isConnected !== false && !!p.id,
        completedLines: completedCounts[pId] || 0,
      };
    });

    const myBoard = room.boards[targetPlayerId] || null;
    const myWinningLineIndices = lines[targetPlayerId] || [];
    const myCompletedLines = completedCounts[targetPlayerId] || 0;

    return {
      roomId: room.roomId,
      stage: room.stage,
      players: publicPlayers,
      myBoard,
      myPlayerId: targetPlayerId,
      mySocketId: targetPlayer?.id || '',
      tossChoice: room.tossChoice,
      tossWinnerId: room.tossWinnerId,
      currentTurnPlayerId: room.currentTurnPlayerId,
      calledNumbers: room.calledNumbers,
      latestCalledNumber: room.calledNumbers[room.calledNumbers.length - 1] || null,
      winnerId: room.winnerId,
      myCompletedLines,
      opponentCompletedLines: 0, // Opponent completed lines kept hidden for privacy
      myWinningLineIndices,
    };
  }
}
