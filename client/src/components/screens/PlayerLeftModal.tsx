import React from 'react';
import { GlassButton } from '../ui/GlassButton';
import { useBingoSocket } from '../../context/SocketContext';
import { UserX, LogOut, AlertTriangle } from 'lucide-react';

export const PlayerLeftModal: React.FC = () => {
  const { roomState, playerLeftNotification, endSession, clearPlayerLeftNotification } = useBingoSocket();

  // Determine if opponent has left during active game
  const opponent = roomState?.players.find((p) => p.id !== roomState.myPlayerId);
  const isGameActive = roomState && ['BOARD_SETUP', 'TOSS', 'PLAYING', 'GAME_OVER'].includes(roomState.stage);
  const isOpponentMissing = isGameActive && (!opponent || roomState.players.length < 2);

  const shouldShow = playerLeftNotification !== null || isOpponentMissing;

  if (!shouldShow) return null;

  const leftNickname = playerLeftNotification?.nickname || opponent?.nickname || 'Your opponent';

  const handleLeave = () => {
    clearPlayerLeftNotification();
    endSession();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-fade-in">
      <div className="glass-panel max-w-md w-full p-6 md:p-8 rounded-3xl border border-rose-500/30 text-center shadow-2xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-20 -left-20 w-56 h-56 rounded-full bg-rose-600 blur-3xl opacity-20 pointer-events-none" />

        <div className="relative z-10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <UserX className="w-8 h-8 text-rose-400" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-widest mb-3">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Player Disconnected</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
            Opponent Has Left
          </h2>

          <p className="text-slate-300 text-sm mb-6 leading-relaxed">
            <span className="font-semibold text-rose-300">{leftNickname}</span> has left the room. The current game session has ended.
          </p>

          <GlassButton
            type="button"
            variant="danger"
            onClick={handleLeave}
            fullWidth
            className="!py-3.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Return to Welcome Screen</span>
          </GlassButton>
        </div>
      </div>
    </div>
  );
};
