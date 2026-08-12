export type GameStage =
  | 'WELCOME'
  | 'LOBBY'
  | 'BOARD_SETUP'
  | 'TOSS'
  | 'PLAYING'
  | 'GAME_OVER';

export type CoinChoice = 'HEADS' | 'TAILS';

export interface Player {
  id: string; // Current Socket ID or empty string if temporarily disconnected
  playerId: string; // Stable client-generated ID (e.g. player_xxxx)
  nickname: string;
  isHost: boolean;
  isReady: boolean; // Ready for setup / toss
  isBoardReady: boolean; // Has submitted valid 5x5 board
  wantsRematch?: boolean;
  isConnected?: boolean;
}

export type BingoBoardGrid = (number | null)[][]; // 5x5 grid

export interface RoomState {
  roomId: string; // 6-character room code
  stage: GameStage;
  players: Player[];
  boards: { [playerId: string]: number[] }; // 25 flat numbers stored server-side per stable playerId
  tossChoice?: CoinChoice;
  tossWinnerId?: string; // Stable playerId
  currentTurnPlayerId?: string; // Stable playerId
  calledNumbers: number[];
  winnerId?: string; // Stable playerId
  winningLines: { [playerId: string]: number[][] }; // Array of line indices per stable playerId
  completedLineCounts: { [playerId: string]: number };
}

// Client-safe Player view (without secret board details)
export interface PublicPlayerInfo {
  id: string; // Stable playerId
  nickname: string;
  isHost: boolean;
  isReady: boolean;
  isBoardReady: boolean;
  wantsRematch: boolean;
  isConnected: boolean;
  completedLines: number;
}

export interface ClientRoomState {
  roomId: string;
  stage: GameStage;
  players: PublicPlayerInfo[];
  myBoard: number[] | null; // Only sent to the owner!
  myPlayerId: string;
  mySocketId: string;
  tossChoice?: CoinChoice;
  tossWinnerId?: string;
  currentTurnPlayerId?: string;
  calledNumbers: number[];
  latestCalledNumber?: number | null;
  lastCallerNickname?: string | null;
  winnerId?: string;
  myCompletedLines: number;
  opponentCompletedLines: number;
  myWinningLineIndices: number[][]; // Grid cell indices for line highlights
}

// SOCKET EVENTS (Client -> Server)
export interface ClientToServerEvents {
  'room:create': (payload: { nickname: string }, callback: (res: { success: boolean; roomId?: string; error?: string }) => void) => void;
  'room:join': (payload: { roomId: string; nickname: string }, callback: (res: { success: boolean; error?: string }) => void) => void;
  'room:reconnect': (payload: { playerId: string }, callback: (res: { success: boolean; error?: string }) => void) => void;
  'room:toggle_ready': () => void;
  'board:submit': (payload: { board: number[] }, callback: (res: { success: boolean; error?: string }) => void) => void;
  'toss:choose': (payload: { choice: CoinChoice }) => void;
  'game:call_number': (payload: { number: number }, callback: (res: { success: boolean; error?: string }) => void) => void;
  'game:rematch': () => void;
  'room:leave': () => void;
}

// SOCKET EVENTS (Server -> Client)
export interface ServerToClientEvents {
  'room:updated': (state: ClientRoomState) => void;
  'number:called': (payload: { number: number; calledByNickname: string; calledById: string }) => void;
  'toss:result': (payload: { choice: CoinChoice; outcome: CoinChoice; winnerId: string; winnerNickname: string }) => void;
  'game:bingo': (payload: { winnerId: string; winnerNickname: string }) => void;
  'error:message': (payload: { message: string }) => void;
  'player:disconnected': (payload: { nickname: string }) => void;
  'player:reconnected': (payload: { nickname: string }) => void;
}
