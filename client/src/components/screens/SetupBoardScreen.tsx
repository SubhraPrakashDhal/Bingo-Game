import React, { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import { Badge } from '../ui/Badge';
import { useBingoSocket } from '../../context/SocketContext';
import { RotateCcw, CheckCircle, Clock, ShieldCheck, Grid, Info } from 'lucide-react';

export const SetupBoardScreen: React.FC = () => {
  const { roomState, submitBoard } = useBingoSocket();
  const [boardGrid, setBoardGrid] = useState<(number | null)[]>(Array(25).fill(null));
  const [nextNumber, setNextNumber] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!roomState) return null;

  const me = roomState.players.find((p) => p.id === roomState.myPlayerId || p.id === roomState.mySocketId);
  const isAlreadyReadyOnServer = me?.isBoardReady || hasSubmitted;

  const handleCellClick = (index: number) => {
    if (isAlreadyReadyOnServer || isSubmitting) return;

    // If cell already has a number, do nothing or allow reset
    if (boardGrid[index] !== null) return;

    if (nextNumber > 25) return;

    const newGrid = [...boardGrid];
    newGrid[index] = nextNumber;
    setBoardGrid(newGrid);
    setNextNumber((prev) => prev + 1);
  };

  const handleReset = () => {
    if (isAlreadyReadyOnServer || isSubmitting) return;
    setBoardGrid(Array(25).fill(null));
    setNextNumber(1);
    setErrorMsg(null);
  };

  const handleSubmit = async () => {
    if (nextNumber <= 25 || boardGrid.some((val) => val === null)) {
      setErrorMsg('Please place all 25 numbers on your board before submitting.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);
    const res = await submitBoard(boardGrid as number[]);
    setIsSubmitting(false);

    if (res.success) {
      setHasSubmitted(true);
    } else if (res.error) {
      setErrorMsg(res.error);
    }
  };

  const placedCount = nextNumber - 1;

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-3 md:p-6 max-w-xl mx-auto">
      <GlassCard className="w-full text-center">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
          <div className="text-left">
            <h2 className="text-xl md:text-2xl font-extrabold text-white flex items-center gap-2">
              <Grid className="w-5 h-5 text-blue-400" />
              Configure Strategic Board
            </h2>
            <p className="text-xs text-slate-400">
              Click cells in sequence to place numbers 1 to 25.
            </p>
          </div>

          <div className="text-right">
            <span className="block text-[10px] uppercase font-bold text-slate-400">Progress</span>
            <span className="text-lg font-mono font-extrabold text-blue-400">
              {placedCount} / 25
            </span>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="mb-4 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Board layout is strictly private to you!</span>
          </span>
          {placedCount === 25 ? (
            <Badge variant="emerald" className="animate-pulse">BOARD READY</Badge>
          ) : (
            <Badge variant="blue">IN PROGRESS</Badge>
          )}
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center font-medium">
            {errorMsg}
          </div>
        )}


        {/* 5x5 Board Setup Grid */}
        <div className="grid grid-cols-5 gap-2 md:gap-3 my-6 w-full max-w-[420px] aspect-square mx-auto">
          {boardGrid.map((val, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleCellClick(idx)}
              disabled={val !== null || isAlreadyReadyOnServer}
              className={`
        w-full h-full min-w-0 min-h-0 aspect-square
        rounded-xl
        font-bold font-mono
        flex items-center justify-center
        border
        text-base md:text-xl
        transition-colors duration-150
        box-border
        overflow-hidden
        ${val !== null
                  ? 'bg-gradient-to-br from-blue-600/60 to-purple-600/60 border-blue-400/50 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-900/60 border-white/10 hover:border-blue-500/50 hover:bg-slate-800/60 text-slate-500'
                }
        ${isAlreadyReadyOnServer ? 'opacity-80 cursor-default' : ''}
      `}
            >
              {val !== null ? val : ''}
            </button>
          ))}
        </div>
        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <GlassButton
            type="button"
            variant="secondary"
            onClick={handleReset}
            disabled={isAlreadyReadyOnServer || placedCount === 0 || isSubmitting}
            className="w-full sm:w-auto"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Board</span>
          </GlassButton>

          <GlassButton
            type="button"
            variant="primary"
            onClick={handleSubmit}
            disabled={isAlreadyReadyOnServer || placedCount < 25 || isSubmitting}
            className="w-full flex-1"
          >
            {isAlreadyReadyOnServer ? (
              <>
                <Clock className="w-4 h-4 text-emerald-400 animate-spin" />
                <span>Waiting for Opponent...</span>
              </>
            ) : isSubmitting ? (
              <span>Submitting Board...</span>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Confirm & Lock Board</span>
              </>
            )}
          </GlassButton>
        </div>

        <div className="mt-4 text-[11px] text-slate-500 flex items-center justify-center gap-1">
          <Info className="w-3.5 h-3.5" />
          <span>Click cells in your preferred order to build your customized strategy layout.</span>
        </div>
      </GlassCard>
    </div>
  );
};
