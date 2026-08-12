import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from '../../shared/types';
import { RoomManager } from './game/RoomManager';
import { registerGameHandlers } from './sockets/gameHandler';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: '*', // Allow connections from Vite dev server
    methods: ['GET', 'POST'],
  },
});

const roomManager = new RoomManager();

// Healthcheck route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  registerGameHandlers(io, socket, roomManager);

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Bingo Real-Time Server running on http://localhost:${PORT}`);
});
