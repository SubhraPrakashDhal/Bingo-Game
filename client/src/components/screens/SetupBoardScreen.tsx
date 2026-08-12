import React, { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import { Badge } from '../ui/Badge';
import { useBingoSocket } from '../../context/SocketContext';
import {
  RotateCcw,
  CheckCircle,
  Clock,
  ShieldCheck,
  Grid,
  Info,
  Shuffle,
} from 'lucide-react';

export const SetupBoardScreen: React.FC = () => {
  const { roomState, submitBoard } = useBingoSocket();

  const [boardGrid, setBoardGrid] = useState<(number | null)[]>(
    Array(25).fill(null)
  );
  const [nextNumber, setNextNumber] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!roomState) return null;

  const me = roomState.players.find(
    (p) =>
      p.id === roomState.myPlayerId || p.id === roomState.mySocketId
  );

  const isAlreadyReadyOnServer = me?.isBoardReady || hasSubmitted;

  // ------------------------------------------------------------
  // Manual board placement
  // ------------------------------------------------------------
  const handleCellClick = (index: number) => {
    if (isAlreadyReadyOnServer || isSubmitting) return;

    if (boardGrid[index] !== null) return;
    if (nextNumber > 25) return;

    const newGrid = [...boardGrid];
    newGrid[index] = nextNumber;

    setBoardGrid(newGrid);
    setNextNumber((prev) => prev + 1);
  };

  // ------------------------------------------------------------
  // Randomize board
  // ------------------------------------------------------------
  const handleRandomize = () => {
    if (isAlreadyReadyOnServer || isSubmitting) return;

    const numbers = Array.from(
      { length: 25 },
      (_, i) => i + 1
    );

    // Fisher-Yates shuffle
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));

      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }

    setBoardGrid(numbers);
    setNextNumber(26);
    setErrorMsg(null);
  };

  // ------------------------------------------------------------
  // Reset board
  // ------------------------------------------------------------
  const handleReset = () => {
    if (isAlreadyReadyOnServer || isSubmitting) return;

    setBoardGrid(Array(25).fill(null));
    setNextNumber(1);
    setErrorMsg(null);
  };

  // ------------------------------------------------------------
  // Submit board
  // ------------------------------------------------------------
  const handleSubmit = async () => {
    if (
      nextNumber <= 25 ||
      boardGrid.some((val) => val === null)
    ) {
      setErrorMsg(
        'Please place all 25 numbers on your board before submitting.'
      );
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
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-3 py-5 md:px-5 md:py-6">
      <GlassCard className="w-full max-w-xl text-center p-4 sm:p-5 md:p-6">
        {/* =====================================================
            HEADER
        ====================================================== */}
        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
          <div className="text-left min-w-0">
            <h2 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
              <Grid className="w-5 h-5 text-blue-400 shrink-0" />

              <span className="truncate">
                Configure Strategic Board
              </span>
            </h2>

            <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
              Click cells in sequence to place numbers 1 to 25.
            </p>
          </div>

          {/* Progress */}
          <div className="text-right shrink-0">
            <span className="block text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-slate-500">
              Progress
            </span>

            <span className="text-base sm:text-lg font-mono font-extrabold text-blue-400">
              {placedCount} / 25
            </span>
          </div>
        </div>

        {/* =====================================================
            PRIVACY / STATUS
        ====================================================== */}
        <div className="mb-3 px-3 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0 text-blue-300">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />

            <span className="text-[11px] sm:text-xs truncate">
              Board layout is strictly private to you!
            </span>
          </div>

          {placedCount === 25 ? (
            <Badge
              variant="emerald"
              className="animate-pulse shrink-0"
            >
              BOARD READY
            </Badge>
          ) : (
            <Badge
              variant="blue"
              className="shrink-0"
            >
              IN PROGRESS
            </Badge>
          )}
        </div>

        {/* =====================================================
            ERROR
        ====================================================== */}
        {errorMsg && (
          <div className="mb-3 px-3 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center font-medium">
            {errorMsg}
          </div>
        )}

        {/* =====================================================
            5x5 BOARD
        ====================================================== */}
        <div className="w-full max-w-[380px] aspect-square mx-auto my-4">
          <div className="grid grid-cols-5 gap-2 sm:gap-2.5 w-full h-full">
            {boardGrid.map((val, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleCellClick(idx)}
                disabled={
                  val !== null || isAlreadyReadyOnServer
                }
                className={`
                  w-full h-full min-w-0 min-h-0
                  aspect-square
                  rounded-xl
                  flex items-center justify-center
                  border
                  box-border
                  overflow-hidden
                  font-mono font-bold
                  text-base sm:text-lg md:text-xl
                  transition-all duration-150
                  select-none

                  ${
                    val !== null
                      ? `
                        bg-gradient-to-br
                        from-blue-600/60
                        to-purple-600/60
                        border-blue-400/50
                        text-white
                        shadow-md
                        shadow-blue-500/20
                      `
                      : `
                        bg-slate-900/60
                        border-white/10
                        text-slate-500
                        hover:border-blue-500/50
                        hover:bg-slate-800/70
                      `
                  }

                  ${
                    isAlreadyReadyOnServer
                      ? 'opacity-80 cursor-default'
                      : ''
                  }
                `}
              >
                {val !== null ? val : ''}
              </button>
            ))}
          </div>
        </div>

        {/* =====================================================
            ACTION BUTTONS
        ====================================================== */}
        <div
          className="
            grid
            grid-cols-2
            sm:grid-cols-[1fr_1fr_1.55fr]
            gap-2.5
            w-full
            mt-3
          "
        >
          {/* Randomize */}
          <GlassButton
            type="button"
            variant="secondary"
            onClick={handleRandomize}
            disabled={
              isAlreadyReadyOnServer || isSubmitting
            }
            className="
              !h-12
              sm:!h-13
              !px-3
              text-xs
              sm:text-sm
              font-bold
              flex
              items-center
              justify-center
              gap-1.5
              whitespace-nowrap
              border
              border-white/10
              hover:border-blue-400/30
              transition-all
            "
          >
            <Shuffle className="w-4 h-4 shrink-0 text-blue-400" />

            <span>Randomize</span>
          </GlassButton>

          {/* Reset */}
          <GlassButton
            type="button"
            variant="secondary"
            onClick={handleReset}
            disabled={
              isAlreadyReadyOnServer ||
              placedCount === 0 ||
              isSubmitting
            }
            className="
              !h-12
              sm:!h-13
              !px-3
              text-xs
              sm:text-sm
              font-bold
              flex
              items-center
              justify-center
              gap-1.5
              whitespace-nowrap
              border
              border-white/10
              hover:border-white/20
              transition-all
            "
          >
            <RotateCcw className="w-4 h-4 shrink-0 text-slate-400" />

            <span>Reset Board</span>
          </GlassButton>

          {/* Confirm */}
          <GlassButton
            type="button"
            variant="primary"
            onClick={handleSubmit}
            disabled={
              isAlreadyReadyOnServer ||
              placedCount < 25 ||
              isSubmitting
            }
            className="
              col-span-2
              sm:col-span-1
              !h-12
              sm:!h-13
              !px-3
              sm:!px-4
              text-xs
              sm:text-sm
              font-extrabold
              flex
              items-center
              justify-center
              gap-2
              whitespace-nowrap
              shadow-lg
              shadow-blue-500/20
              transition-all
            "
          >
            {isAlreadyReadyOnServer ? (
              <>
                <Clock
                  className="
                    w-4 h-4
                    text-emerald-400
                    animate-spin
                    shrink-0
                  "
                />

                <span className="whitespace-nowrap">
                  Waiting for Opponent...
                </span>
              </>
            ) : isSubmitting ? (
              <span className="whitespace-nowrap">
                Submitting Board...
              </span>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 shrink-0" />

                <span className="whitespace-nowrap">
                  Confirm & Lock Board
                </span>
              </>
            )}
          </GlassButton>
        </div>

        {/* =====================================================
            INSTRUCTION
        ====================================================== */}
        <div className="mt-3 px-2 flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] text-slate-500">
          <Info className="w-3.5 h-3.5 shrink-0" />

          <span>
            Click cells in your preferred order to build your
            customized strategy layout.
          </span>
        </div>
      </GlassCard>
    </div>
  );
};