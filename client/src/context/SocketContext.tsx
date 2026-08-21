import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  ClientRoomState,
  CoinChoice,
  GameType,
  LineType,
} from '../../../shared/types';

interface BingoSession {
  playerId: string;
  roomId?: string;
  nickname?: string;
}

const SESSION_KEY = 'games_private_session';

const getOrCreatePlayerId = (): string => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.playerId === 'string') {
        return parsed.playerId;
      }
    }
  } catch (err) {
    console.error('Failed to read games_private_session from sessionStorage', err);
  }

  const newPlayerId = 'player_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ playerId: newPlayerId }));
  } catch (e) {
    console.error('Failed to write games_private_session', e);
  }
  return newPlayerId;
};

const saveSessionRoom = (roomId: string, nickname: string) => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    const session: BingoSession = raw ? JSON.parse(raw) : { playerId: getOrCreatePlayerId() };
    session.roomId = roomId;
    session.nickname = nickname;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (err) {
    console.error('Failed to save room to session', err);
  }
};

const clearSessionRoom = () => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      const session: BingoSession = JSON.parse(raw);
      delete session.roomId;
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
  } catch (err) {
    console.error('Failed to clear room from session', err);
  }
};

interface SocketContextType {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  isConnected: boolean;
  isReconnecting: boolean;
  isRestoringSession: boolean;
  playerId: string;
  roomState: ClientRoomState | null;
  errorMessage: string | null;
  calledNotification: { number: number; calledByNickname: string; calledById: string } | null;
  tossNotification: { choice: CoinChoice; outcome: CoinChoice; winnerId: string; winnerNickname: string } | null;
  playerLeftNotification: { nickname: string } | null;
  rematchNotification: { nickname: string } | null;
  createRoom: (nickname: string) => Promise<{ success: boolean; roomId?: string; error?: string }>;
  joinRoom: (roomId: string, nickname: string) => Promise<{ success: boolean; error?: string }>;
  selectGame: (game: GameType) => Promise<{ success: boolean; error?: string }>;
  startGame: () => Promise<{ success: boolean; error?: string }>;
  returnToLobby: () => void;
  toggleReady: () => void;
  submitBoard: (board: number[]) => Promise<{ success: boolean; error?: string }>;
  callNumber: (num: number) => Promise<{ success: boolean; error?: string }>;
  requestRematch: () => void;
  makeDotsMove: (type: LineType, row: number, col: number) => Promise<{ success: boolean; error?: string }>;
  requestDotsRematch: () => void;
  sendChatMessage: (message: string) => Promise<{ success: boolean; error?: string }>;
  leaveRoom: () => void;
  endSession: () => void;
  clearErrorMessage: () => void;
  clearPlayerLeftNotification: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [playerId] = useState<string>(() => getOrCreatePlayerId());
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isRestoringSession, setIsRestoringSession] = useState<boolean>(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        const session: BingoSession = JSON.parse(raw);
        return !!session.roomId;
      }
    } catch (e) {}
    return false;
  });

  const [roomState, setRoomState] = useState<ClientRoomState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [playerLeftNotification, setPlayerLeftNotification] = useState<{ nickname: string } | null>(null);
  const [rematchNotification, setRematchNotification] = useState<{ nickname: string } | null>(null);
  const [calledNotification, setCalledNotification] = useState<{
    number: number;
    calledByNickname: string;
    calledById: string;
  } | null>(null);
  const [tossNotification, setTossNotification] = useState<{
    choice: CoinChoice;
    outcome: CoinChoice;
    winnerId: string;
    winnerNickname: string;
  } | null>(null);

  useEffect(() => {
    const getServerUrl = (): string => {
      if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
      }
      if (typeof window !== 'undefined' && window.location?.origin) {
        return window.location.origin;
      }
      return 'http://localhost:3001';
    };

    const serverUrl = getServerUrl();
    const newSocket: Socket<ServerToClientEvents, ClientToServerEvents> = io(serverUrl, {
      auth: { playerId },
      autoConnect: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log(`Connected to GAMES PRIVATE server. Socket: ${newSocket.id}, PlayerId: ${playerId}`);
      setIsConnected(true);
      setIsReconnecting(false);

      try {
        const raw = sessionStorage.getItem(SESSION_KEY);
        if (raw) {
          const session: BingoSession = JSON.parse(raw);
          if (session.roomId) {
            newSocket.emit('room:reconnect', { playerId }, (res) => {
              if (!res.success) {
                clearSessionRoom();
                setIsRestoringSession(false);
              }
            });
          } else {
            setIsRestoringSession(false);
          }
        } else {
          setIsRestoringSession(false);
        }
      } catch (err) {
        console.error('Error checking room reconnection', err);
        setIsRestoringSession(false);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from GAMES PRIVATE server');
      setIsConnected(false);
      setIsReconnecting(true);
    });

    newSocket.on('room:updated', (state: ClientRoomState) => {
      console.log('Room state updated:', state);
      setRoomState(state);
      if (state.stage !== 'GAME_OVER') {
        setRematchNotification(null);
      }
      setIsReconnecting(false);
      setIsRestoringSession(false);
      if (state.roomId) {
        const myPlayer = state.players.find((p) => p.id === state.myPlayerId || p.id === playerId);
        saveSessionRoom(state.roomId, myPlayer?.nickname || 'Player');
      }
    });

    newSocket.on('game_selection_updated', ({ selectedGame }) => {
      console.log('Game selection updated:', selectedGame);
      setRoomState((prevState) => {
        if (!prevState) return prevState;
        return {
          ...prevState,
          selectedGame,
        };
      });
    });

    newSocket.on('number:called', (data) => {
      setCalledNotification(data);
      setTimeout(() => {
        setCalledNotification(null);
      }, 2200);
    });

    newSocket.on('toss:result', (data) => {
      setTossNotification(data);
      setTimeout(() => {
        setTossNotification(null);
      }, 4000);
    });

    newSocket.on('rematch:requested', ({ nickname }) => {
      setRematchNotification({ nickname });
    });

    newSocket.on('player:disconnected', ({ nickname }) => {
      setRoomState((currentState) => {
        if (currentState) {
          setPlayerLeftNotification({ nickname });
        }
        return currentState;
      });
    });

    newSocket.on('error:message', ({ message }) => {
      setErrorMessage(message);
    });

    return () => {
      newSocket.removeAllListeners();
      newSocket.disconnect();
    };
  }, [playerId]);

  const createRoom = (nickname: string) => {
    return new Promise<{ success: boolean; roomId?: string; error?: string }>((resolve) => {
      if (!socket) return resolve({ success: false, error: 'Socket not connected' });
      socket.emit('room:create', { nickname }, (res) => {
        if (res.success && res.roomId) {
          saveSessionRoom(res.roomId, nickname);
        }
        resolve(res);
      });
    });
  };

  const joinRoom = (roomId: string, nickname: string) => {
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      if (!socket) return resolve({ success: false, error: 'Socket not connected' });
      socket.emit('room:join', { roomId, nickname }, (res) => {
        if (res.success) {
          saveSessionRoom(roomId, nickname);
        }
        resolve(res);
      });
    });
  };

  const selectGame = (game: GameType) => {
    setRoomState((prev) => (prev ? { ...prev, selectedGame: game } : prev));
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      if (!socket) return resolve({ success: false, error: 'Socket not connected' });
      
      const timer = setTimeout(() => {
        resolve({ success: false, error: 'Select game timed out' });
      }, 5000);

      socket.emit('room:select_game', { game }, (res) => {
        clearTimeout(timer);
        if (res && !res.success && res.error) {
          console.error('Select game failed on server:', res.error);
          setErrorMessage(res.error);
        }
        resolve(res || { success: true });
      });
    });
  };

  const startGame = () => {
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      if (!socket) return resolve({ success: false, error: 'Socket not connected' });

      const timer = setTimeout(() => {
        resolve({ success: false, error: 'Start game request timed out. Please try again.' });
      }, 5000);

      socket.emit('room:start_game', (res) => {
        clearTimeout(timer);
        if (res && !res.success && res.error) {
          console.error('Start game failed on server:', res.error);
          setErrorMessage(res.error);
        }
        resolve(res || { success: true });
      });
    });
  };

  const returnToLobby = () => {
    if (socket) socket.emit('room:return_to_lobby');
  };

  const toggleReady = () => {
    if (socket) socket.emit('room:toggle_ready');
  };

  const submitBoard = (board: number[]) => {
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      if (!socket) return resolve({ success: false, error: 'Socket not connected' });
      socket.emit('board:submit', { board }, (res) => {
        resolve(res);
      });
    });
  };

  const callNumber = (num: number) => {
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      if (!socket) return resolve({ success: false, error: 'Socket not connected' });
      socket.emit('game:call_number', { number: num }, (res) => {
        resolve(res);
      });
    });
  };

  const requestRematch = () => {
    if (socket) socket.emit('game:rematch');
    setRematchNotification(null);
  };

  const makeDotsMove = (type: LineType, row: number, col: number) => {
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      if (!socket) return resolve({ success: false, error: 'Socket not connected' });
      socket.emit('dots:move', { type, row, col }, (res) => {
        resolve(res || { success: true });
      });
    });
  };

  const requestDotsRematch = () => {
    if (socket) socket.emit('dots:rematch');
  };

  const sendChatMessage = (message: string) => {
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      if (!socket) return resolve({ success: false, error: 'Socket not connected' });
      socket.emit('send_game_chat_message', { message }, (res) => {
        resolve(res || { success: true });
      });
    });
  };

  const leaveRoom = () => {
    if (socket) socket.emit('room:leave');
    clearSessionRoom();
    setRoomState(null);
    setRematchNotification(null);
    setPlayerLeftNotification(null);
    setIsRestoringSession(false);
  };

  const endSession = () => {
    if (socket) socket.emit('room:leave');
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch (err) {
      console.error('Failed to clear games_private_session', err);
    }
    setRoomState(null);
    setRematchNotification(null);
    setPlayerLeftNotification(null);
    setIsRestoringSession(false);
  };

  const clearErrorMessage = () => setErrorMessage(null);
  const clearPlayerLeftNotification = () => setPlayerLeftNotification(null);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        isReconnecting,
        isRestoringSession,
        playerId,
        roomState,
        errorMessage,
        calledNotification,
        tossNotification,
        playerLeftNotification,
        rematchNotification,
        createRoom,
        joinRoom,
        selectGame,
        startGame,
        returnToLobby,
        toggleReady,
        submitBoard,
        callNumber,
        requestRematch,
        makeDotsMove,
        requestDotsRematch,
        sendChatMessage,
        leaveRoom,
        endSession,
        clearErrorMessage,
        clearPlayerLeftNotification,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useBingoSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useBingoSocket must be used within a SocketProvider');
  }
  return context;
};
