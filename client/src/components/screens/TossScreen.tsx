import React, { useState, useEffect } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import { useBingoSocket } from '../../context/SocketContext';
import { Sparkles, Zap, Shield, Crown, Loader2 } from 'lucide-react';
import { CoinChoice } from '../../../../shared/types';

export const TossScreen: React.FC = () => {
  const { roomState, playerId, tossNotification, chooseToss } = useBingoSocket();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localChoice, setLocalChoice] = useState<CoinChoice | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [isSettled, setIsSettled] = useState(false);

  if (!roomState) return null;

  const me =
    roomState.players.find((p) => p.id === roomState.myPlayerId || p.id === roomState.mySocketId) ||
    roomState.players.find((p) => p.id === playerId) ||
    roomState.players[0];

  const opponent = roomState.players.find((p) => p.id !== me?.id);

  // Designated toss chooser: defaults to guest/opponent
  const chooserId = roomState.tossChooserId || (opponent?.id);
  const isChooser = chooserId === (me?.id) || chooserId === playerId || (!me?.isHost && !!opponent);

  // Active choice & outcome state
  const activeChoice = roomState.tossChoice || tossNotification?.choice || localChoice;
  const outcome = tossNotification?.outcome;
  const tossWinnerId = roomState.tossWinnerId || tossNotification?.winnerId;

  const isWinner = tossWinnerId ? (tossWinnerId === me?.id || tossWinnerId === playerId) : false;
  const winnerNickname = tossNotification?.winnerNickname ||
    (tossWinnerId ? roomState.players.find((p) => p.id === tossWinnerId)?.nickname : undefined);

  const isDots = roomState.selectedGame === 'dots';

  // Trigger flip animation state when outcome arrives from server
  useEffect(() => {
    if (outcome) {
      setIsFlipping(true);
      const timer = setTimeout(() => {
        setIsFlipping(false);
        setIsSettled(true);
      }, 2400);
      return () => clearTimeout(timer);
    }
  }, [outcome]);

  const handleSelectChoice = async (choice: CoinChoice) => {
    if (isSubmitting || activeChoice || !isChooser) return;
    setIsSubmitting(true);
    setLocalChoice(choice);
    try {
      const res = await chooseToss(choice);
      if (!res.success) {
        setLocalChoice(null);
      }
    } catch (err) {
      console.error('[TOSS] Error choosing toss:', err);
      setLocalChoice(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stacked 3D Z-offset layers for physical metallic rim thickness
  const edgeLayers = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6];

  return (
    <div className="flex-1 min-h-[calc(100vh-57px)] flex flex-col items-center justify-center p-4 py-8 max-w-lg mx-auto w-full">
      <GlassCard className="w-full text-center py-8 px-5 sm:px-8 relative overflow-hidden shadow-2xl">
        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>OFFICIAL COIN TOSS</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
          Who Goes First?
        </h2>

        {/* Dynamic Status Message */}
        <p className="text-slate-400 text-xs sm:text-sm mb-6 max-w-sm mx-auto min-h-[24px]">
          {!activeChoice ? (
            isChooser ? (
              <span className="text-amber-300 font-medium">
                Choose <strong className="text-white">HEADS</strong> or <strong className="text-white">TAILS</strong> to call the toss!
              </span>
            ) : (
              <span className="text-slate-300">
                Waiting for <strong className="text-purple-300">{opponent?.nickname || 'Opponent'}</strong> to choose Heads or Tails...
              </span>
            )
          ) : isFlipping ? (
            <span className="text-amber-300 font-bold animate-pulse">
              FLIPPING COIN...
            </span>
          ) : outcome ? (
            <span className="text-white font-extrabold text-base tracking-wide">
              RESULT: <strong className="text-amber-400 uppercase">{outcome}</strong>
            </span>
          ) : (
            <span>
              {isChooser ? (
                <>You selected <strong className="text-amber-300 uppercase">{activeChoice}</strong>. Preparing toss...</>
              ) : (
                <><strong className="text-purple-300">{opponent?.nickname || 'Opponent'}</strong> selected <strong className="text-amber-300 uppercase">{activeChoice}</strong>. Preparing toss...</>
              )}
            </span>
          )}
        </p>

        {/* Realistic 3D Physical Metallic Gold Coin Display */}
        <div className="w-36 h-36 sm:w-44 sm:h-44 mx-auto mb-2 coin-perspective flex items-center justify-center relative">
          <div
            className={`w-32 h-32 sm:w-40 sm:h-40 coin-3d-wrapper ${
              !outcome ? 'coin-idle-float' : ''
            } ${
              outcome === 'HEADS' ? 'coin-flip-heads' : ''
            } ${
              outcome === 'TAILS' ? 'coin-flip-tails' : ''
            }`}
          >
            {/* Front Face (HEADS - Warm Gold/Brass Metallic Material) */}
            <div className="coin-face coin-face-front bg-gradient-to-tr from-amber-700 via-yellow-400 to-amber-200 border-4 border-amber-300/90 p-2 flex flex-col items-center justify-center text-center overflow-hidden">
              <div className="w-full h-full rounded-full border-2 border-amber-200/60 flex flex-col items-center justify-center bg-gradient-to-br from-amber-600/95 via-yellow-600/95 to-amber-800/95 shadow-inner p-1 relative">
                {/* Metallic Specular Shine Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/30 rounded-full pointer-events-none" />
                <Crown className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-200 drop-shadow-[0_2px_5px_rgba(0,0,0,0.85)] mb-0.5 relative z-10" />
                <span className="text-[11px] sm:text-xs font-black font-mono tracking-widest text-yellow-100 drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.9)] uppercase relative z-10">
                  HEADS
                </span>
              </div>
            </div>

            {/* Back Face (TAILS - Same Warm Gold/Brass Metallic Material) */}
            <div className="coin-face coin-face-back bg-gradient-to-tr from-amber-700 via-yellow-400 to-amber-200 border-4 border-amber-300/90 p-2 flex flex-col items-center justify-center text-center overflow-hidden">
              <div className="w-full h-full rounded-full border-2 border-amber-200/60 flex flex-col items-center justify-center bg-gradient-to-br from-amber-600/95 via-yellow-600/95 to-amber-800/95 shadow-inner p-1 relative">
                {/* Metallic Specular Shine Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/30 rounded-full pointer-events-none" />
                <Shield className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-200 drop-shadow-[0_2px_5px_rgba(0,0,0,0.85)] mb-0.5 relative z-10" />
                <span className="text-[11px] sm:text-xs font-black font-mono tracking-widest text-yellow-100 drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.9)] uppercase relative z-10">
                  TAILS
                </span>
              </div>
            </div>

            {/* Stacked 3D Edge Rim Thickness Layers */}
            {edgeLayers.map((zOffset) => (
              <div
                key={zOffset}
                className="coin-edge-layer"
                style={{ transform: `translateZ(${zOffset}px)` }}
              />
            ))}
          </div>
        </div>

        {/* Dynamic Floor Shadow beneath 3D Coin */}
        <div
          className={`h-3 rounded-full mx-auto mb-6 transition-all duration-700 ${
            isFlipping
              ? 'w-28 sm:w-32 bg-amber-500/25 blur-md scale-110'
              : outcome
              ? 'w-36 sm:w-40 bg-slate-950/90 blur-sm scale-100'
              : 'w-28 sm:w-32 bg-slate-950/70 blur-sm scale-95'
          }`}
        />

        {/* Action Choice Buttons (Visible only to Chooser when no choice is active yet) */}
        {!activeChoice && isChooser && (
          <div className="grid grid-cols-2 gap-3 mb-4 animate-fadeIn">
            <GlassButton
              type="button"
              variant="secondary"
              onClick={() => handleSelectChoice('HEADS')}
              disabled={isSubmitting}
              className="!py-3.5 border-amber-500/30 hover:border-amber-400/60 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Crown className="w-4 h-4 text-amber-400" />
              <span>HEADS</span>
            </GlassButton>

            <GlassButton
              type="button"
              variant="secondary"
              onClick={() => handleSelectChoice('TAILS')}
              disabled={isSubmitting}
              className="!py-3.5 border-amber-500/30 hover:border-amber-400/60 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Shield className="w-4 h-4 text-amber-400" />
              <span>TAILS</span>
            </GlassButton>
          </div>
        )}

        {/* Non-Chooser Waiting Indicator */}
        {!activeChoice && !isChooser && (
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/10 text-slate-400 text-xs font-semibold flex items-center justify-center gap-2.5 mb-4 animate-pulse">
            <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
            <span>Opponent is selecting Heads or Tails...</span>
          </div>
        )}

        {/* Selection Announcement (Before outcome) */}
        {activeChoice && !outcome && (
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-amber-500/30 text-amber-300 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 animate-pulse mb-2">
            <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
            <span>Choice locked ({activeChoice}). Preparing coin flip...</span>
          </div>
        )}

        {/* Toss Winner Announcement Card (Appears after toss flip completes) */}
        {tossWinnerId && (isSettled || !isFlipping) && (
          <div className={`p-4 rounded-2xl border text-sm font-bold animate-fadeIn transition-all shadow-xl ${
            isWinner
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-emerald-500/10'
              : 'bg-purple-500/15 border-purple-500/40 text-purple-300 shadow-purple-500/10'
          }`}>
            <div className="flex items-center justify-center gap-2 mb-1 text-base font-black uppercase tracking-wide">
              <Zap className={`w-5 h-5 ${isWinner ? 'text-emerald-400' : 'text-purple-400'}`} />
              <span>{isWinner ? 'YOU WON THE TOSS!' : `${winnerNickname || 'Opponent'} WON THE TOSS!`}</span>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              {isDots ? (
                isWinner ? 'You get the first line move!' : `${winnerNickname || 'Opponent'} moves first!`
              ) : roomState.selectedGame === 'tictactoe' ? (
                isWinner ? 'You get symbol X and the first move!' : `${winnerNickname || 'Opponent'} gets symbol X and moves first!`
              ) : (
                isWinner ? 'You will call the first number!' : `${winnerNickname || 'Opponent'} will call the first number!`
              )}
            </p>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
