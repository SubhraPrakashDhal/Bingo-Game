import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  ClientRoomState,
  CoinChoice,
} from '../../../shared/types';

interface BingoSession {
  playerId: string;
  roomId?: string;
  nickname?: string;
}

const SESSION_KEY = 'bingo_session';

const getOrCreatePlayerId = (): string => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.playerId === 'string') {
        return parsed.playerId;
      }
    }
  } catch (err) {
    console.error('Failed to read bingo_session from localStorage', err);
  }

  // Generate new stable Player ID
  const newPlayerId = 'player_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ playerId: newPlayerId }));
  } catch (e) {
    console.error('Failed to write bingo_session', e);
  }
  return newPlayerId;
};

const saveSessionRoom = (roomId: string, nickname: string) => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    const session: BingoSession = raw ? JSON.parse(raw) : { playerId: getOrCreatePlayerId() };
    session.roomId = roomId;
    session.nickname = nickname;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (err) {
    console.error('Failed to save room to bingo_session', err);
  }
};

const clearSessionRoom = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const session: BingoSession = JSON.parse(raw);
      delete session.roomId;
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
  } catch (err) {
    console.error('Failed to clear room from bingo_session', err);
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
  toggleReady: () => void;
  submitBoard: (board: number[]) => Promise<{ success: boolean; error?: string }>;
  callNumber: (num: number) => Promise<{ success: boolean; error?: string }>;
  requestRematch: () => void;
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
      const raw = localStorage.getItem(SESSION_KEY);
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
    const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const newSocket: Socket<ServerToClientEvents, ClientToServerEvents> = io(serverUrl, {
      auth: { playerId },
      autoConnect: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log(`Connected to Bingo server. Socket: ${newSocket.id}, PlayerId: ${playerId}`);
      setIsConnected(true);
      setIsReconnecting(false);

      // Check if session has a saved room to restore
      try {
        const raw = localStorage.getItem(SESSION_KEY);
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
      console.log('Disconnected from Bingo server');
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
      // Persist active roomId to localStorage session
      if (state.roomId) {
        const myPlayer = state.players.find((p) => p.id === playerId);
        saveSessionRoom(state.roomId, myPlayer?.nickname || 'Player');
      }
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
      console.log('Rematch requested event:', nickname);
      setRematchNotification({ nickname });
    });

    newSocket.on('player:disconnected', ({ nickname }) => {
      console.log('Player disconnected event:', nickname);
      setPlayerLeftNotification({ nickname });
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

  const leaveRoom = () => {
    if (socket) socket.emit('room:leave');
    clearSessionRoom();
    setRoomState(null);
    setRematchNotification(null);
    setIsRestoringSession(false);
  };

  const endSession = () => {
    if (socket) socket.emit('room:leave');
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (err) {
      console.error('Failed to clear bingo_session', err);
    }
    setRoomState(null);
    setRematchNotification(null);
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
        toggleReady,
        submitBoard,
        callNumber,
        requestRematch,
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
