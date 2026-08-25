export type GameStage =
  | 'WELCOME'
  | 'LOBBY'
  | 'BOARD_SETUP'
  | 'TOSS'
  | 'PLAYING'
  | 'GAME_OVER'
  | 'DOTS_PLAYING'
  | 'DOTS_ENDED'
  | 'TICTACTOE_MODE_SELECT'
  | 'TICTACTOE_PLAYING'
  | 'TICTACTOE_ENDED';

export type GameType =
  | 'bingo'
  | 'dots'
  | 'chess'
  | 'checkers'
  | 'tictactoe'
  | 'battleship'
  | 'connect4'
  | 'ludo'
  | 'reversi'
  | 'sudoku'
  | 'dominoes'
  | 'carrom'
  | 'pool'
  | 'uno'
  | 'snakes'
  | 'scrabble'
  | 'backgammon';

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

// Dots & Boxes structures
export type LineType = 'h' | 'v';

export interface Line {
  id: string;
  type: LineType;
  row: number;
  col: number;
  owner: string | null;
}

export interface Box {
  id: string;
  row: number;
  col: number;
  owner: string | null;
}

export interface DotsGameState {
  currentTurn: string | null;
  horizontalLines: Line[][];
  verticalLines: Line[][];
  boxes: Box[][];
  scores: Record<string, number>;
  winnerId: string | 'draw' | null;
  forfeitReason?: 'opponent_left' | null;
  rematchRequestedBy?: string | null;
}

// Tic-Tac-Toe structures
export type TicTacToeSymbol = 'X' | 'O';
export type TicTacToeMode = 'classic' | 'infinite';

export interface TicTacToeMark {
  playerId: string;
  symbol: TicTacToeSymbol;
  cellIndex: number;
  moveNumber: number;
}

export interface TicTacToeGameState {
  mode: TicTacToeMode;
  board: (TicTacToeSymbol | null)[];
  currentTurn: string | null;
  playerSymbols: Record<string, TicTacToeSymbol>;
  winnerId: string | 'draw' | null;
  winningLine: number[] | null;
  marks: TicTacToeMark[];
  lastExpiredMark?: TicTacToeMark | null;
  forfeitReason?: 'opponent_left' | null;
  rematchRequestedBy?: string | null;
}

export interface GameChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  message: string;
  text?: string;
  timestamp: number;
}

export interface RoomState {
  roomId: string; // 6-character room code
  stage: GameStage;
  selectedGame: GameType | null;
  tictactoeMode?: TicTacToeMode;
  players: Player[];
  boards: { [playerId: string]: number[] }; // 25 flat numbers stored server-side per stable playerId
  tossChoice?: CoinChoice;
  tossWinnerId?: string; // Stable playerId
  tossChooserId?: string; // Stable playerId of player designated to choose
  currentTurnPlayerId?: string; // Stable playerId
  calledNumbers: number[];
  winnerId?: string; // Stable playerId
  winningLines: { [playerId: string]: number[][] }; // Array of line indices per stable playerId
  completedLineCounts: { [playerId: string]: number };
  dotsState?: DotsGameState;
  ticTacToeState?: TicTacToeGameState;
  chatMessages?: GameChatMessage[];
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
  selectedGame: GameType | null;
  tictactoeMode?: TicTacToeMode;
  players: PublicPlayerInfo[];
  myBoard: number[] | null; // Only sent to the owner!
  myPlayerId: string;
  mySocketId: string;
  tossChoice?: CoinChoice;
  tossWinnerId?: string;
  tossChooserId?: string;
  currentTurnPlayerId?: string;
  calledNumbers: number[];
  latestCalledNumber?: number | null;
  lastCallerNickname?: string | null;
  winnerId?: string;
  myCompletedLines: number;
  opponentCompletedLines: number;
  myWinningLineIndices: number[][]; // Grid cell indices for line highlights
  dotsState?: DotsGameState;
  ticTacToeState?: TicTacToeGameState;
  chatMessages?: GameChatMessage[];
}

// SOCKET EVENTS (Client -> Server)
export interface ClientToServerEvents {
  'room:create': (payload: { nickname: string }, callback: (res: { success: boolean; roomId?: string; error?: string }) => void) => void;
  'room:join': (payload: { roomId: string; nickname: string }, callback: (res: { success: boolean; error?: string }) => void) => void;
  'room:reconnect': (payload: { playerId: string }, callback: (res: { success: boolean; error?: string }) => void) => void;
  'room:select_game': (payload: { game: GameType }, callback?: (res: { success: boolean; error?: string }) => void) => void;
  'room:start_game': (callback?: (res: { success: boolean; error?: string }) => void) => void;
  'room:return_to_lobby': () => void;
  'room:toggle_ready': () => void;
  'board:submit': (payload: { board: number[] }, callback: (res: { success: boolean; error?: string }) => void) => void;
  'toss:choose': (payload: { choice: CoinChoice }, callback?: (res: { success: boolean; error?: string }) => void) => void;
  'game:call_number': (payload: { number: number }, callback: (res: { success: boolean; error?: string }) => void) => void;
  'game:rematch': () => void;
  'dots:move': (payload: { type: LineType; row: number; col: number }, callback?: (res: { success: boolean; error?: string }) => void) => void;
  'dots:rematch': () => void;
  'tictactoe:select_mode': (payload: { mode: TicTacToeMode }, callback?: (res: { success: boolean; error?: string }) => void) => void;
  'tictactoe:move': (payload: { cellIndex: number }, callback?: (res: { success: boolean; error?: string }) => void) => void;
  'tictactoe:rematch': () => void;
  'send_game_chat_message': (payload: { roomId?: string; message?: string; text?: string }, callback?: (res: { success: boolean; error?: string }) => void) => void;
  'send_message': (payload: { roomId: string; text: string }) => void;
  'room:leave': () => void;

  // WebRTC Voice Signaling Events (Client -> Server)
  'voice:ready': (payload: { roomId: string }) => void;
  'voice:offer': (payload: { targetSocketId: string; offer: RTCSessionDescriptionInit }) => void;
  'voice:answer': (payload: { targetSocketId: string; answer: RTCSessionDescriptionInit }) => void;
  'voice:candidate': (payload: { targetSocketId: string; candidate: RTCIceCandidateInit }) => void;
  'voice:leave': (payload: { roomId: string }) => void;
}

// SOCKET EVENTS (Server -> Client)
export interface ServerToClientEvents {
  'room:updated': (state: ClientRoomState) => void;
  'game_selection_updated': (payload: { selectedGame: GameType | null }) => void;
  'number:called': (payload: { number: number; calledByNickname: string; calledById: string }) => void;
  'toss:result': (payload: { choice: CoinChoice; outcome: CoinChoice; winnerId: string; winnerNickname: string }) => void;
  'game:bingo': (payload: { winnerId: string; winnerNickname: string }) => void;
  'rematch:requested': (payload: { nickname: string }) => void;
  'receive_game_chat_message': (msg: GameChatMessage) => void;
  'new_message': (msg: GameChatMessage) => void;
  'error:message': (payload: { message: string }) => void;
  'player:disconnected': (payload: { nickname: string }) => void;
  'player:reconnected': (payload: { nickname: string }) => void;

  // WebRTC Voice Signaling Events (Server -> Client)
  'voice:ready': (payload: { senderSocketId: string; senderPlayerId: string }) => void;
  'voice:offer': (payload: { senderSocketId: string; offer: RTCSessionDescriptionInit }) => void;
  'voice:answer': (payload: { senderSocketId: string; answer: RTCSessionDescriptionInit }) => void;
  'voice:candidate': (payload: { senderSocketId: string; candidate: RTCIceCandidateInit }) => void;
  'voice:leave': (payload: { senderSocketId: string }) => void;
}
