import React from 'react';
import { GlassButton } from '../ui/GlassButton';
import { useBingoSocket } from '../../context/SocketContext';
import {
  Trophy,
  RotateCcw,
  LogOut,
  CheckCircle,
  Clock,
  Frown,
} from 'lucide-react';

export const WinnerModal: React.FC = () => {
  const { roomState, requestRematch, leaveRoom, rematchNotification } = useBingoSocket();

  if (!roomState || roomState.stage !== 'GAME_OVER') return null;

  const winner = roomState.players.find(
    (p) => p.id === roomState.winnerId
  );

  const isIWinner = roomState.winnerId === roomState.myPlayerId || roomState.winnerId === roomState.mySocketId;

  const me = roomState.players.find(
    (p) => p.id === roomState.myPlayerId || p.id === roomState.mySocketId
  );

  const opponent = roomState.players.find(
    (p) => p.id !== me?.id
  );

  const requestingNickname =
    rematchNotification?.nickname ||
    (opponent?.wantsRematch ? opponent.nickname : null);

  const showRematchNotification = !!requestingNickname && !me?.wantsRematch;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-fade-in">
      <div className="glass-panel max-w-md w-full p-6 md:p-8 rounded-3xl border border-white/15 text-center shadow-2xl relative overflow-hidden">

        {/* Glow backdrop */}
        <div
          className={`absolute -top-24 -left-24 w-64 h-64 rounded-full blur-3xl opacity-30 ${
            isIWinner ? 'bg-amber-400' : 'bg-slate-500'
          }`}
        />

        <div className="relative z-10">

          {/* Result Icon */}
          <div
            className={`w-20 h-20 mx-auto mb-4 rounded-full p-1 shadow-xl flex items-center justify-center ${
              isIWinner
                ? 'bg-gradient-to-tr from-amber-500 to-yellow-300 shadow-amber-500/30'
                : 'bg-gradient-to-tr from-slate-600 to-slate-400 shadow-slate-500/20'
            }`}
          >
            {isIWinner ? (
              <Trophy className="w-10 h-10 text-slate-950 animate-bounce" />
            ) : (
              <Frown className="w-10 h-10 text-slate-950" />
            )}
          </div>

          {/* Result Badge */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-2 ${
              isIWinner
                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                : 'bg-slate-500/10 border border-slate-500/30 text-slate-400'
            }`}
          >
            {isIWinner ? 'Bingo Complete!' : 'Game Finished'}
          </div>

          {/* Main Result */}
          <h2
            className={`text-3xl md:text-4xl font-extrabold mb-1 ${
              isIWinner ? 'text-white' : 'text-slate-200'
            }`}
          >
            {isIWinner ? 'VICTORY!' : 'DEFEAT'}
          </h2>

          <p
            className={`text-lg font-bold mb-4 ${
              isIWinner ? 'text-cyan-300' : 'text-slate-400'
            }`}
          >
            {isIWinner
              ? 'You won the game!'
              : `${winner?.nickname || 'Player'} Wins!`}
          </p>

          {/* Result Message */}
          {!isIWinner && (
            <p className="text-sm text-slate-500 mb-4">
              Better luck next time. Ready for a rematch?
            </p>
          )}

          {/* Completed Lines */}
          <div className="inline-block px-4 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-xs font-bold text-slate-300 mb-8">
            <span
              className={`font-mono text-sm ${
                isIWinner ? 'text-amber-400' : 'text-slate-400'
              }`}
            >
              5 / 5
            </span>{' '}
            LINES COMPLETED
          </div>

          {/* Rematch Requested Notification for Opponent */}
          {showRematchNotification && (
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-600/30 to-indigo-600/30 border border-blue-400/40 text-blue-200 text-center shadow-lg animate-fade-in">
              <div className="text-sm font-extrabold flex items-center justify-center gap-1.5 mb-1 text-blue-300">
                <span>🔄 Rematch Requested</span>
              </div>
              <div className="text-xs font-semibold text-white">
                {requestingNickname} wants to play again!
              </div>
            </div>
          )}

          {/* Rematch Status (Waiting for opponent) */}
          {me?.wantsRematch && (
            <div className="mb-6 p-3 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 text-blue-400 animate-spin" />
              <span>Rematch requested. Waiting for opponent...</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">

            <GlassButton
              type="button"
              variant="primary"
              onClick={requestRematch}
              disabled={me?.wantsRematch}
              fullWidth
            >
              {me?.wantsRematch ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Rematch Requested</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Play Again</span>
                </>
              )}
            </GlassButton>

            <GlassButton
              type="button"
              variant="secondary"
              onClick={leaveRoom}
              fullWidth
            >
              <LogOut className="w-4 h-4 text-slate-400" />
              <span>Return to Lobby</span>
            </GlassButton>

          </div>
        </div>
      </div>
    </div>
  );
};