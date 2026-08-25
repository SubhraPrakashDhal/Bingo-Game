import React, { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import { Badge } from '../ui/Badge';
import { useBingoSocket } from '../../context/SocketContext';
import { TicTacToeMode } from '../../../../shared/types';
import { Sparkles, Hash, Infinity as InfinityIcon, ArrowRight, LayoutGrid, Loader2 } from 'lucide-react';

export const TicTacToeModeSelect: React.FC = () => {
  const { roomState, playerId, selectTicTacToeMode, returnToLobby } = useBingoSocket();
  const [selectedMode, setSelectedMode] = useState<TicTacToeMode>('classic');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!roomState) return null;

  const me =
    roomState.players.find((p) => p.id === roomState.myPlayerId || p.id === roomState.mySocketId) ||
    roomState.players.find((p) => p.id === playerId) ||
    roomState.players[0];

  const isHost = me ? me.isHost : (roomState.players.length === 1 || roomState.players[0]?.id === roomState.myPlayerId);

  const handleConfirmMode = async () => {
    if (!isHost || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await selectTicTacToeMode(selectedMode);
    } catch (err) {
      console.error('Error selecting Tic-Tac-Toe mode:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 min-h-[calc(100vh-57px)] flex flex-col items-center justify-center p-4 py-8 max-w-2xl mx-auto w-full">
      <GlassCard className="w-full text-center py-8 px-5 sm:px-8 relative overflow-hidden shadow-2xl">
        {/* Top Header Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>TIC-TAC-TOE GAME MODE</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
          Select Game Rules
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm mb-6 max-w-md mx-auto">
          {isHost
            ? 'Choose Classic 3×3 duel or Infinite vanishing-mark mode before coin toss.'
            : 'Waiting for the host to select the game mode...'}
        </p>

        {/* Mode Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-left">
          {/* Classic Mode Card */}
          <div
            role="button"
            tabIndex={isHost ? 0 : -1}
            onClick={() => isHost && setSelectedMode('classic')}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && isHost) {
                e.preventDefault();
                setSelectedMode('classic');
              }
            }}
            className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden select-none ${isHost ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : 'cursor-default'
              } ${selectedMode === 'classic'
                ? 'bg-gradient-to-br from-cyan-950/70 via-slate-900 to-slate-950 border-cyan-400 shadow-xl shadow-cyan-500/20 ring-1 ring-cyan-400/50'
                : 'bg-slate-900/60 hover:bg-slate-800/80 border-white/10 opacity-80 hover:opacity-100'
              }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                <Hash className="w-6 h-6" />
              </div>
              {selectedMode === 'classic' && (
                <Badge variant="blue" className="text-[10px] font-bold">
                  ✓ Selected
                </Badge>
              )}
            </div>

            <h3 className="text-lg font-black text-white tracking-tight mb-1">
              CLASSIC
            </h3>
            <p className="text-slate-300 text-xs leading-relaxed mb-4">
              Traditional 3×3 Tic-Tac-Toe. Place your marks and get three in a row.
            </p>

            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
              <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] font-semibold text-slate-400">
                • Permanent Marks
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] font-semibold text-slate-400">
                • Draws Allowed
              </span>
            </div>
          </div>

          {/* Infinite Mode Card */}
          <div
            role="button"
            tabIndex={isHost ? 0 : -1}
            onClick={() => isHost && setSelectedMode('infinite')}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && isHost) {
                e.preventDefault();
                setSelectedMode('infinite');
              }
            }}
            className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden select-none ${isHost ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : 'cursor-default'
              } ${selectedMode === 'infinite'
                ? 'bg-gradient-to-br from-purple-950/70 via-slate-900 to-slate-950 border-purple-400 shadow-xl shadow-purple-500/20 ring-1 ring-purple-400/50'
                : 'bg-slate-900/60 hover:bg-slate-800/80 border-white/10 opacity-80 hover:opacity-100'
              }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                <InfinityIcon className="w-6 h-6" />
              </div>
              {selectedMode === 'infinite' && (
                <Badge variant="purple" className="text-[10px] font-bold">
                  ✓ Selected
                </Badge>
              )}
            </div>

            <h3 className="text-lg font-black text-white tracking-tight mb-1 flex items-center gap-1.5">
              <span>∞ INFINITE</span>
            </h3>
            <p className="text-slate-300 text-xs leading-relaxed mb-4">
              Each player can have only 3 active marks. When you place your 4th mark, your oldest mark disappears.
            </p>

            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
              <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-[10px] font-semibold text-purple-300">
                • Max 3 Marks
              </span>
              <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-[10px] font-semibold text-purple-300">
                • Oldest Vanishes
              </span>
              <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-[10px] font-semibold text-purple-300">
                • No Draws
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <GlassButton
            type="button"
            variant="secondary"
            onClick={returnToLobby}
            className="w-full sm:w-auto"
          >
            <LayoutGrid className="w-4 h-4 text-slate-400" />
            <span>Return to Lobby</span>
          </GlassButton>

          {isHost ? (
            <GlassButton
              type="button"
              variant="primary"
              onClick={handleConfirmMode}
              disabled={isSubmitting}
              className="w-full flex-1 !bg-gradient-to-r !from-cyan-600 !to-purple-600 hover:!from-cyan-500 hover:!to-purple-500 !py-3 text-sm font-extrabold"
            >
              <span>{isSubmitting ? 'Confirming...' : 'CONTINUE TO COIN TOSS'}</span>
              <ArrowRight className="w-4 h-4" />
            </GlassButton>
          ) : (
            <div className="w-full flex-1 p-3 rounded-xl bg-slate-900/60 border border-white/10 text-slate-400 text-xs font-semibold flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
              <span>Host is choosing game mode ({selectedMode.toUpperCase()})...</span>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};
