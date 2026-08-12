import { Server, Socket } from 'socket.io';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  CoinChoice,
} from '../../../shared/types';
import { RoomManager } from '../game/RoomManager';

export function registerGameHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  roomManager: RoomManager
) {
  // Helper to retrieve stable playerId attached to handshake or socket lookup
  const getPlayerId = (): string => {
    const authPlayerId = socket.handshake.auth?.playerId;
    if (authPlayerId) return authPlayerId;
    return roomManager.getPlayerIdBySocket(socket.id) || socket.id;
  };

  // Helper to emit privacy-safe room update to all players in a room
  const broadcastRoomUpdate = (roomId: string) => {
    const room = roomManager.getRoom(roomId);
    if (!room) return;

    for (const player of room.players) {
      const pId = player.playerId || player.id;
      if (player.id) {
        const clientState = roomManager.getClientRoomState(roomId, pId);
        if (clientState) {
          io.to(player.id).emit('room:updated', clientState);
        }
      }
    }
  };

  // Auto Reconnect Check on Connection
  const handshakePlayerId = socket.handshake.auth?.playerId;
  if (handshakePlayerId) {
    const reconRes = roomManager.reconnectPlayer(handshakePlayerId, socket.id);
    if (reconRes.success && reconRes.roomId) {
      socket.join(reconRes.roomId);
      broadcastRoomUpdate(reconRes.roomId);
      if (reconRes.reconnectedNickname) {
        socket.to(reconRes.roomId).emit('player:reconnected', { nickname: reconRes.reconnectedNickname });
      }
    }
  }

  // 1. Create Room
  socket.on('room:create', ({ nickname }, callback) => {
    try {
      const playerId = getPlayerId();
      const cleanName = (nickname || 'Player 1').trim().slice(0, 15);
      const { roomId } = roomManager.createRoom(playerId, socket.id, cleanName);

      socket.join(roomId);
      callback({ success: true, roomId });
      broadcastRoomUpdate(roomId);
    } catch (err: any) {
      callback({ success: false, error: err?.message || 'Failed to create room' });
    }
  });

  // 2. Join Room
  socket.on('room:join', ({ roomId, nickname }, callback) => {
    try {
      const playerId = getPlayerId();
      const cleanName = (nickname || 'Player 2').trim().slice(0, 15);
      const result = roomManager.joinRoom(playerId, socket.id, roomId, cleanName);

      if (!result.success) {
        return callback({ success: false, error: result.error });
      }

      const formattedRoomId = roomId.toUpperCase().trim();
      socket.join(formattedRoomId);
      callback({ success: true });
      broadcastRoomUpdate(formattedRoomId);
    } catch (err: any) {
      callback({ success: false, error: err?.message || 'Failed to join room' });
    }
  });

  // 3. Reconnect Room explicitly
  socket.on('room:reconnect', (payload, callback) => {
    const targetPlayerId = payload?.playerId || getPlayerId();
    const reconRes = roomManager.reconnectPlayer(targetPlayerId, socket.id);

    if (reconRes.success && reconRes.roomId) {
      socket.join(reconRes.roomId);
      broadcastRoomUpdate(reconRes.roomId);
      if (reconRes.reconnectedNickname) {
        socket.to(reconRes.roomId).emit('player:reconnected', { nickname: reconRes.reconnectedNickname });
      }
      callback({ success: true });
    } else {
      callback({ success: false, error: 'No active session found.' });
    }
  });

  // 4. Toggle Ready (Lobby)
  socket.on('room:toggle_ready', () => {
    const playerId = getPlayerId();
    const result = roomManager.toggleReady(playerId);
    if (result.room) {
      broadcastRoomUpdate(result.room.roomId);
    } else if (result.error) {
      socket.emit('error:message', { message: result.error });
    }
  });

  // 5. Submit Board (5x5 Setup)
  socket.on('board:submit', ({ board }, callback) => {
    const playerId = getPlayerId();
    const result = roomManager.submitBoard(playerId, board);
    if (!result.success) {
      callback({ success: false, error: result.error });
      return;
    }

    callback({ success: true });

    if (result.room) {
      broadcastRoomUpdate(result.room.roomId);

      // Auto-trigger Coin Toss if room just entered TOSS stage
      if (result.room.stage === 'TOSS') {
        const tossRes = roomManager.executeToss(playerId, 'HEADS');
        if (tossRes.room && tossRes.tossResult) {
          io.to(result.room.roomId).emit('toss:result', tossRes.tossResult);
          broadcastRoomUpdate(result.room.roomId);
        }
      }
    }
  });

  // 6. Choose Toss
  socket.on('toss:choose', ({ choice }: { choice: CoinChoice }) => {
    const playerId = getPlayerId();
    const tossRes = roomManager.executeToss(playerId, choice);
    if (tossRes.room && tossRes.tossResult) {
      io.to(tossRes.room.roomId).emit('toss:result', tossRes.tossResult);
      broadcastRoomUpdate(tossRes.room.roomId);
    } else if (tossRes.error) {
      socket.emit('error:message', { message: tossRes.error });
    }
  });

  // 7. Call Number
  socket.on('game:call_number', ({ number }, callback) => {
    const playerId = getPlayerId();
    const result = roomManager.callNumber(playerId, number);
    if (!result.success) {
      callback({ success: false, error: result.error });
      return;
    }

    callback({ success: true });

    if (result.room) {
      // Broadcast number:called popup payload to both clients
      io.to(result.room.roomId).emit('number:called', {
        number,
        calledByNickname: result.calledByNickname || 'Player',
        calledById: playerId,
      });

      broadcastRoomUpdate(result.room.roomId);

      // Check if someone won
      if (result.room.stage === 'GAME_OVER' && result.winner) {
        const winnerId = result.winner.playerId || result.winner.id;
        io.to(result.room.roomId).emit('game:bingo', {
          winnerId,
          winnerNickname: result.winner.nickname,
        });
      }
    }
  });

  // 8. Request Rematch
  socket.on('game:rematch', () => {
    const playerId = getPlayerId();

    const result = roomManager.requestRematch(playerId);

    if (!result.room) return;

    // Both players accepted rematch
    if (result.bothReadyForRematch) {
      broadcastRoomUpdate(result.room.roomId);
      return;
    }

    // Only this player requested rematch
    const requestingPlayer = result.room.players.find(
      (p) => p.playerId === playerId
    );

    const opponent = result.room.players.find(
      (p) => p.playerId !== playerId
    );

    if (!requestingPlayer || !opponent) {
      broadcastRoomUpdate(result.room.roomId);
      return;
    }

    // First update opponent's room state
    broadcastRoomUpdate(result.room.roomId);

    // Send direct notification to opponent
    if (opponent.id && opponent.isConnected !== false) {
      io.to(opponent.id).emit('rematch:requested', {
        nickname: requestingPlayer.nickname,
      });
    }
  });

  // 9. Explicit Leave Room
  socket.on('room:leave', () => {
    const playerId = getPlayerId();
    const result = roomManager.leaveRoom(playerId);
    if (result.roomId) {
      if (result.disconnectedNickname) {
        socket.to(result.roomId).emit('player:disconnected', { nickname: result.disconnectedNickname });
      }
      if (result.room) {
        broadcastRoomUpdate(result.roomId);
      }
    }
  });

  // 10. Socket Disconnect (Temporary or page refresh)
  socket.on('disconnect', () => {
    const result = roomManager.handleDisconnect(socket.id);
    if (result.roomId && result.room) {
      broadcastRoomUpdate(result.roomId);
    }
  });
}
