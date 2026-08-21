import {
  RoomState,
  ClientRoomState,
  Player,
  CoinChoice,
  GameType,
  LineType,
  GameChatMessage,
} from '../../../shared/types';
import { BingoEvaluator } from './BingoEvaluator';
import { TossEngine } from './TossEngine';
import { DotsAndBoxesGame } from './DotsAndBoxesGame';
import { IGameEngine } from '../games/core/IGameEngine';
import { GameRegistry } from '../games/core/GameRegistry';
import { DotsEngine } from '../games/dots/DotsEngine';

export class RoomManager {
  private rooms: Map<string, RoomState> = new Map();
  private activeGameEngines: Map<string, IGameEngine> = new Map();
  // Stable Player ID -> Room ID lookup
  private playerToRoom: Map<string, string> = new Map();
  // Socket ID -> Stable Player ID lookup
  private socketToPlayer: Map<string, string> = new Map();

  private getDotsGameInstance(roomId: string): DotsAndBoxesGame | undefined {
    const engine = this.activeGameEngines.get(roomId);
    if (engine && engine instanceof DotsEngine) {
      return engine.getDotsGameInstance();
    }
    return undefined;
  }

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
      selectedGame: null,
      players: [host],
      boards: {},
      calledNumbers: [],
      winningLines: {},
      completedLineCounts: {},
      chatMessages: [],
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
   * Selects a game (Host only).
   */
  public selectGame(
    playerId: string,
    game: GameType
  ): { success: boolean; room?: RoomState; error?: string } {
    const room = this.getRoomByPlayerId(playerId);
    if (!room) return { success: false, error: 'Room not found' };

    const player = room.players.find(
      (p) => p.playerId === playerId || p.id === playerId || this.socketToPlayer.get(p.id) === playerId
    );
    if (!player || !player.isHost) {
      return { success: false, error: 'Only the host can select a game.' };
    }

    if (room.stage !== 'LOBBY') {
      return { success: false, error: 'Game selection is locked during match.' };
    }

    room.selectedGame = game;
    return { success: true, room };
  }

  /**
   * Starts selected game (Host only).
   */
  public startGame(
    playerId: string
  ): { success: boolean; room?: RoomState; error?: string } {
    const room = this.getRoomByPlayerId(playerId);
    if (!room) return { success: false, error: 'Room not found' };

    const player = room.players.find(
      (p) => (p.playerId || p.id) === playerId
    );
    if (!player || !player.isHost) {
      return { success: false, error: 'Only the host can start the game.' };
    }

    if (room.players.length < 2) {
      return { success: false, error: 'Need 2 players to start game.' };
    }

    if (!room.selectedGame) {
      return { success: false, error: 'Please choose a game first.' };
    }

    if (room.selectedGame === 'bingo') {
      room.stage = 'BOARD_SETUP';
      room.boards = {};
      room.calledNumbers = [];
      room.tossChoice = undefined;
      room.tossWinnerId = undefined;
      room.currentTurnPlayerId = undefined;
      room.winnerId = undefined;
      room.winningLines = {};
      room.completedLineCounts = {};
      room.chatMessages = [];
      for (const p of room.players) {
        p.isBoardReady = false;
        p.isReady = true;
        p.wantsRematch = false;
      }
    } else if (room.selectedGame === 'dots') {
      room.stage = 'DOTS_PLAYING';
      const playerIds = room.players.map((p) => p.playerId || p.id);
      const engine = GameRegistry.create(room.selectedGame, room.roomId, playerIds);
      this.activeGameEngines.set(room.roomId, engine);
      room.chatMessages = [];
    }

    return { success: true, room };
  }

  /**
   * Return to lobby from ended game.
   */
  public returnToLobby(playerId: string): { success: boolean; room?: RoomState } {
    const room = this.getRoomByPlayerId(playerId);
    if (!room) return { success: false };

    room.stage = 'LOBBY';
    room.boards = {};
    room.calledNumbers = [];
    room.tossChoice = undefined;
    room.tossWinnerId = undefined;
    room.currentTurnPlayerId = undefined;
    room.winnerId = undefined;
    room.winningLines = {};
    room.completedLineCounts = {};
    room.chatMessages = [];
    this.activeGameEngines.delete(room.roomId);

    for (const p of room.players) {
      p.isReady = false;
      p.isBoardReady = false;
      p.wantsRematch = false;
    }

    return { success: true, room };
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

    player.id = newSocketId;
    player.isConnected = true;
    this.socketToPlayer.set(newSocketId, playerId);
    this.playerToRoom.set(playerId, roomId);

    return { success: true, roomId, room, reconnectedNickname: player.nickname };
  }

  public getRoom(roomId: string): RoomState | undefined {
    return this.rooms.get(roomId);
  }

  public getRoomByPlayerId(playerId: string): RoomState | undefined {
    let roomId = this.playerToRoom.get(playerId);
    if (roomId && this.rooms.has(roomId)) {
      return this.rooms.get(roomId);
    }

    const mappedPlayerId = this.socketToPlayer.get(playerId);
    if (mappedPlayerId) {
      roomId = this.playerToRoom.get(mappedPlayerId);
      if (roomId && this.rooms.has(roomId)) {
        return this.rooms.get(roomId);
      }
    }

    for (const room of this.rooms.values()) {
      const match = room.players.find(
        (p) => p.playerId === playerId || p.id === playerId
      );
      if (match) {
        if (match.playerId) this.playerToRoom.set(match.playerId, room.roomId);
        if (match.id) this.socketToPlayer.set(match.id, match.playerId || match.id);
        return room;
      }
    }

    return undefined;
  }

  public getRoomBySocket(socketId: string): RoomState | undefined {
    const playerId = this.socketToPlayer.get(socketId);
    if (!playerId) return undefined;
    return this.getRoomByPlayerId(playerId);
  }

  public getPlayerIdBySocket(socketId: string): string | undefined {
    return this.socketToPlayer.get(socketId);
  }

  public toggleReady(playerId: string): { room?: RoomState; error?: string } {
    const room = this.getRoomByPlayerId(playerId);
    if (!room) return { error: 'Room not found' };

    const player = room.players.find(
      (p) => (p.playerId || p.id) === playerId
    );
    if (!player) return { error: 'Player not found' };

    player.isReady = !player.isReady;
    return { room };
  }

  public submitBoard(
    playerId: string,
    board: number[]
  ): { success: boolean; room?: RoomState; error?: string } {
    const room = this.getRoomByPlayerId(playerId);
    if (!room) return { success: false, error: 'Room not found' };

    if (room.stage !== 'BOARD_SETUP') {
      return { success: false, error: 'Board setup is not currently open.' };
    }

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

    room.boards[playerId] = board;

    const player = room.players.find(
      (p) => (p.playerId || p.id) === playerId
    );
    if (player) {
      player.isBoardReady = true;
    }

    if (room.players.length === 2 && room.players.every((p) => p.isBoardReady)) {
      room.stage = 'TOSS';
    }

    return { success: true, room };
  }

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
      (p) => (p.playerId || p.id) === winnerId
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

    room.calledNumbers.push(numberCalled);

    const caller = room.players.find(
      (p) => (p.playerId || p.id) === playerId
    );

    const winningPlayers: Player[] = [];
    if (!room.completedLineCounts) room.completedLineCounts = {};
    if (!room.winningLines) room.winningLines = {};

    for (const p of room.players) {
      const pId = p.playerId || p.id;
      const pBoard = room.boards[pId];
      if (pBoard) {
        const evalResult = BingoEvaluator.evaluate(pBoard, room.calledNumbers);

        room.completedLineCounts[pId] = evalResult.completedLinesCount;
        room.winningLines[pId] = evalResult.completedLines;

        if (evalResult.hasWon) {
          winningPlayers.push(p);
        }
      }
    }

    let winningPlayer: Player | undefined = undefined;

    if (winningPlayers.length > 0) {
      const callerId = caller ? (caller.playerId || caller.id) : playerId;
      const callerWon = winningPlayers.some(
        (p) => (p.playerId || p.id) === callerId
      );

      if (callerWon) {
        winningPlayer = caller || winningPlayers[0];
      } else {
        winningPlayer = winningPlayers[0];
      }
    }

    if (winningPlayer) {
      room.stage = 'GAME_OVER';
      room.winnerId = winningPlayer.playerId || winningPlayer.id;
    } else {
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

  public requestRematch(playerId: string): { room?: RoomState; bothReadyForRematch: boolean } {
    const room = this.getRoomByPlayerId(playerId);
    if (!room) return { bothReadyForRematch: false };

    const player = room.players.find(
      (p) => (p.playerId || p.id) === playerId
    );
    if (player) {
      player.wantsRematch = true;
    }

    const bothReady = room.players.length === 2 && room.players.every((p) => p.wantsRematch);

    if (bothReady) {
      room.stage = 'BOARD_SETUP';
      room.boards = {};
      room.calledNumbers = [];
      room.tossChoice = undefined;
      room.tossWinnerId = undefined;
      room.currentTurnPlayerId = undefined;
      room.winnerId = undefined;
      room.winningLines = {};
      room.completedLineCounts = {};
      room.chatMessages = [];

      for (const p of room.players) {
        p.isBoardReady = false;
        p.wantsRematch = false;
      }
    }

    return { room, bothReadyForRematch: bothReady };
  }

  /**
   * Dots & Boxes Move execution.
   */
  public makeDotsMove(
    playerId: string,
    type: LineType,
    row: number,
    col: number
  ): { success: boolean; room?: RoomState; error?: string } {
    const room = this.getRoomByPlayerId(playerId);
    if (!room) return { success: false, error: 'Room not found' };

    const dotsGame = this.getDotsGameInstance(room.roomId);
    if (!dotsGame) return { success: false, error: 'Dots match not active' };

    const res = dotsGame.makeMove(playerId, type, row, col);
    if (!res.success) return { success: false, error: res.message };

    const state = dotsGame.getDotsState();
    if (state.winnerId !== null) {
      room.stage = 'DOTS_ENDED';
    }

    return { success: true, room };
  }

  /**
   * Dots & Boxes Rematch request.
   */
  public requestDotsRematch(playerId: string): { success: boolean; room?: RoomState; isRestarted: boolean } {
    const room = this.getRoomByPlayerId(playerId);
    if (!room) return { success: false, isRestarted: false };

    const dotsGame = this.getDotsGameInstance(room.roomId);
    if (!dotsGame) return { success: false, isRestarted: false };

    const res = dotsGame.requestRematch(playerId);
    if (res.isRestarted) {
      room.stage = 'DOTS_PLAYING';
      room.chatMessages = [];
      dotsGame.clearMessages();
    }

    return { success: true, room, isRestarted: res.isRestarted };
  }

  /**
   * Process in-game chat message for both games.
   */
  public addChatMessage(
    playerId: string,
    messageText: string
  ): { success: boolean; message?: GameChatMessage; room?: RoomState; error?: string } {
    const room = this.getRoomByPlayerId(playerId);
    if (!room) return { success: false, error: 'Room not found' };

    const sender = room.players.find(
      (p) => (p.playerId || p.id) === playerId
    );
    if (!sender) return { success: false, error: 'Player not found in room' };

    const cleanText = (messageText || '').trim().slice(0, 200);
    if (!cleanText) return { success: false, error: 'Message cannot be empty' };

    const chatMsg: GameChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      roomId: room.roomId,
      senderId: playerId,
      senderName: sender.nickname,
      message: cleanText,
      text: cleanText,
      timestamp: Date.now(),
    };

    if (!room.chatMessages) room.chatMessages = [];
    room.chatMessages.push(chatMsg);
    if (room.chatMessages.length > 50) room.chatMessages.shift();

    const dotsGame = this.getDotsGameInstance(room.roomId);
    if (dotsGame) {
      dotsGame.addMessage(playerId, sender.nickname, cleanText);
    }

    return { success: true, message: chatMsg, room };
  }

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
      (p) => (p.playerId || p.id) === playerId || p.id === socketId
    );
    if (discPlayer) {
      discPlayer.id = '';
      discPlayer.isConnected = false;
    }

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
          this.activeGameEngines.delete(roomId);
          this.rooms.delete(roomId);
        }
      }, 15 * 60 * 1000);
    }

    return { roomId, room, disconnectedNickname: discPlayer?.nickname };
  }

  public leaveRoom(playerId: string): { roomId?: string; room?: RoomState; disconnectedNickname?: string } {
    const roomId = this.playerToRoom.get(playerId);
    if (!roomId) return {};

    const room = this.rooms.get(roomId);
    this.playerToRoom.delete(playerId);

    if (!room) return {};

    const player = room.players.find(
      (p) => (p.playerId || p.id) === playerId
    );
    const nickname = player?.nickname;

    if (player && player.id) {
      this.socketToPlayer.delete(player.id);
    }

    room.players = room.players.filter(
      (p) => (p.playerId || p.id) !== playerId
    );

    // Clean up active Dots & Boxes game instance without triggering a game-over stage transition
    this.activeGameEngines.delete(roomId);

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

    const dotsGame = this.getDotsGameInstance(roomId);

    return {
      roomId: room.roomId,
      stage: room.stage,
      selectedGame: room.selectedGame,
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
      opponentCompletedLines: 0,
      myWinningLineIndices,
      dotsState: dotsGame ? dotsGame.getDotsState() : undefined,
      chatMessages: room.chatMessages || [],
    };
  }
}
