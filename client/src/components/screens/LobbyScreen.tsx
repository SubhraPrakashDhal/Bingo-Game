import React, { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import { Badge } from '../ui/Badge';
import { useBingoSocket } from '../../context/SocketContext';
import { copyToClipboard } from '../../utils/clipboard';
import { Copy, Check, UserCheck, Clock, Crown, LogOut, Sparkles } from 'lucide-react';

export const LobbyScreen: React.FC = () => {
  const { roomState, toggleReady, leaveRoom } = useBingoSocket();
  const [copied, setCopied] = useState(false);

  if (!roomState) return null;

  const me = roomState.players.find((p) => p.id === roomState.myPlayerId || p.id === roomState.mySocketId);
  const opponent = roomState.players.find((p) => p.id !== me?.id);

  const handleCopyCode = async () => {
    const success = await copyToClipboard(roomState.roomId);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-4 max-w-xl mx-auto">
      <GlassCard className="w-full text-center">
        {/* Header */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Lobby Ready Room</span>
        </div>

        <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
          Private Game Lobby
        </h2>
        <p className="text-slate-400 text-xs md:text-sm mb-6">
          Share your room code with your friend. When both players are ready, board setup will begin!
        </p>

        {/* Room Code Banner */}
        <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-4 mb-8 flex items-center justify-between shadow-inner">
          <div className="text-left">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Private Room Code
            </span>
            <span className="text-2xl md:text-3xl font-mono font-extrabold tracking-widest text-blue-400">
              {roomState.roomId}
            </span>
          </div>

          <GlassButton
            type="button"
            variant="secondary"
            onClick={handleCopyCode}
            className="!px-4 !py-2.5 text-xs"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Code</span>
              </>
            )}
          </GlassButton>
        </div>

        {/* Players Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* My Card */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-blue-500/30 text-left relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-blue-400 font-bold uppercase tracking-wider flex items-center gap-1">
                You
                {me?.isHost && <Crown className="w-3.5 h-3.5 text-amber-400 inline" />}
              </span>
              {me?.isReady ? (
                <Badge variant="emerald" className="flex items-center gap-1">
                  <UserCheck className="w-3 h-3" /> Ready
                </Badge>
              ) : (
                <Badge variant="amber" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Waiting
                </Badge>
              )}
            </div>

            <div className="text-lg font-bold text-white truncate">{me?.nickname || 'You'}</div>
            <div className="text-xs text-slate-400 mt-1">Status: Connected</div>
          </div>

          {/* Opponent Card */}
          <div
            className={`p-4 rounded-xl border text-left transition-all ${
              opponent
                ? 'bg-slate-900/60 border-purple-500/30'
                : 'bg-slate-900/30 border-white/5 border-dashed flex flex-col items-center justify-center text-center py-6'
            }`}
          >
            {opponent ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-purple-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    Opponent
                    {opponent.isHost && <Crown className="w-3.5 h-3.5 text-amber-400 inline" />}
                  </span>
                  {opponent.isReady ? (
                    <Badge variant="emerald" className="flex items-center gap-1">
                      <UserCheck className="w-3 h-3" /> Ready
                    </Badge>
                  ) : (
                    <Badge variant="amber" className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Waiting
                    </Badge>
                  )}
                </div>

                <div className="text-lg font-bold text-white truncate">{opponent.nickname}</div>
                <div className="text-xs text-slate-400 mt-1">Status: Connected</div>
              </>
            ) : (
              <div className="text-slate-500 text-xs space-y-1">
                <Clock className="w-6 h-6 mx-auto mb-1 animate-pulse text-blue-400/60" />
                <p className="font-medium text-slate-400">Waiting for Player 2...</p>
                <p className="text-[11px]">Share room code <span className="font-mono text-blue-400">{roomState.roomId}</span></p>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col md:flex-row gap-3">
          <GlassButton
            type="button"
            variant="ghost"
            onClick={leaveRoom}
            className="w-full md:w-auto"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            <span>Leave Lobby</span>
          </GlassButton>

          <GlassButton
            type="button"
            variant={me?.isReady ? 'secondary' : 'primary'}
            onClick={toggleReady}
            disabled={roomState.players.length < 2}
            className="w-full flex-1"
          >
            {me?.isReady ? (
              <span>Cancel Readiness</span>
            ) : (
              <span>Ready for Board Setup</span>
            )}
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
};
