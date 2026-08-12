import React from 'react';
import { GlassCard } from '../ui/GlassCard';
import { useBingoSocket } from '../../context/SocketContext';
import { Sparkles, Coins, Zap } from 'lucide-react';

export const TossScreen: React.FC = () => {
  const { roomState, tossNotification } = useBingoSocket();

  if (!roomState) return null;

  const tossWinner = roomState.players.find((p) => p.id === roomState.tossWinnerId);

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-4 max-w-md mx-auto">
      <GlassCard className="w-full text-center py-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Coin Toss Sequence</span>
        </div>

        <h2 className="text-2xl font-extrabold text-white mb-2">
          Both Players Ready!
        </h2>
        <p className="text-slate-400 text-xs mb-8">
          Flipping official coin to determine who gets the first turn...
        </p>

        {/* Animated Coin */}
        <div className="w-32 h-32 mx-auto mb-8 relative flex items-center justify-center">
          <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 p-1 shadow-2xl shadow-amber-500/30 animate-bounce">
            <div className="w-full h-full rounded-full bg-slate-900 flex flex-col items-center justify-center border-2 border-amber-400/50">
              <Coins className="w-10 h-10 text-amber-400 mb-1 animate-spin" />
              <span className="text-[10px] font-extrabold font-mono text-amber-300 tracking-widest uppercase">
                {tossNotification ? tossNotification.outcome : 'FLIPPING'}
              </span>
            </div>
          </div>
        </div>

        {/* Toss Winner Announcement */}
        {tossWinner && (
          <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm font-semibold animate-pulse flex items-center justify-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>{tossWinner.nickname} wins the toss and gets the 1st Turn!</span>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
