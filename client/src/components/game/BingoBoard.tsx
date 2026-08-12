import React, { useState, useMemo } from 'react';

interface BingoBoardProps {
  board: number[];
  calledNumbers: number[];
  winningLineIndices: number[][];
  isMyTurn: boolean;
  onCallNumber: (num: number) => Promise<void>;
}

type WinningLine = {
  type: 'horizontal' | 'vertical' | 'diagonal-main' | 'diagonal-anti';
  index?: number;
};

const BINGO_LINES: number[][] = [
  // Rows
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19],
  [20, 21, 22, 23, 24],

  // Columns
  [0, 5, 10, 15, 20],
  [1, 6, 11, 16, 21],
  [2, 7, 12, 17, 22],
  [3, 8, 13, 18, 23],
  [4, 9, 14, 19, 24],

  // Diagonals
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20],
];

const getLineType = (line: number[]): WinningLine | null => {
  const sorted = [...line].sort((a, b) => a - b);

  if (sorted.length !== 5) return null;

  // Horizontal rows
  if (
    sorted[1] === sorted[0] + 1 &&
    sorted[2] === sorted[0] + 2 &&
    sorted[3] === sorted[0] + 3 &&
    sorted[4] === sorted[0] + 4 &&
    Math.floor(sorted[0] / 5) === Math.floor(sorted[4] / 5)
  ) {
    return {
      type: 'horizontal',
      index: Math.floor(sorted[0] / 5),
    };
  }

  // Vertical columns
  if (
    sorted[1] === sorted[0] + 5 &&
    sorted[2] === sorted[0] + 10 &&
    sorted[3] === sorted[0] + 15 &&
    sorted[4] === sorted[0] + 20
  ) {
    return {
      type: 'vertical',
      index: sorted[0] % 5,
    };
  }

  // Main diagonal
  if (
    sorted[0] === 0 &&
    sorted[1] === 6 &&
    sorted[2] === 12 &&
    sorted[3] === 18 &&
    sorted[4] === 24
  ) {
    return {
      type: 'diagonal-main',
    };
  }

  // Anti diagonal
  if (
    sorted[0] === 4 &&
    sorted[1] === 8 &&
    sorted[2] === 12 &&
    sorted[3] === 16 &&
    sorted[4] === 20
  ) {
    return {
      type: 'diagonal-anti',
    };
  }

  return null;
};

export const BingoBoard: React.FC<BingoBoardProps> = ({
  board,
  calledNumbers,
  winningLineIndices,
  isMyTurn,
  onCallNumber,
}) => {
  const [callingNumber, setCallingNumber] = useState<number | null>(null);

  const calledSet = useMemo(
    () => new Set(calledNumbers),
    [calledNumbers]
  );

  /*
   * IMPORTANT:
   * Calculate completed lines locally from THIS player's private board.
   *
   * This prevents the visual Bingo lines from depending on
   * winningLineIndices arriving correctly from the server.
   */
  const completedLines = useMemo(() => {
    if (!board || board.length !== 25) return [];

    const completed: number[][] = [];

    for (const line of BINGO_LINES) {
      const isComplete = line.every((index) =>
        calledSet.has(board[index])
      );

      if (isComplete) {
        completed.push(line);
      }
    }

    return completed;
  }, [board, calledSet]);

  /*
   * Use the locally calculated lines for visual rendering.
   *
   * winningLineIndices is still accepted because it is part of
   * the existing component contract, but the visual result does
   * not depend on it.
   */
  const activeWinningLines =
    completedLines.length > 0
      ? completedLines
      : winningLineIndices || [];

  const winningIndicesSet = useMemo(() => {
    return new Set(activeWinningLines.flat());
  }, [activeWinningLines]);

  const winningLineTypes = useMemo(() => {
    return activeWinningLines
      .map(getLineType)
      .filter((line): line is WinningLine => line !== null);
  }, [activeWinningLines]);

  const handleCellClick = async (num: number) => {
    if (
      !isMyTurn ||
      calledSet.has(num) ||
      callingNumber !== null
    ) {
      return;
    }

    setCallingNumber(num);

    try {
      await onCallNumber(num);
    } finally {
      setCallingNumber(null);
    }
  };

  return (
    <div className="w-full max-w-[440px] mx-auto aspect-square p-2 md:p-3 glass-panel rounded-2xl border border-white/10 shadow-2xl">

      {/* Exact same grid area used for cells and winning-line overlay */}
      <div className="relative w-full h-full">

        {/* =====================================================
            WINNING LINE OVERLAY
            Uses the SAME CSS Grid geometry as the board.
            This guarantees perfect row/column alignment.
           ===================================================== */}
        {winningLineTypes.length > 0 && (
          <div
            className="absolute inset-0 z-30 pointer-events-none grid grid-cols-5 grid-rows-5 gap-2 md:gap-2.5"
            aria-hidden="true"
          >

            {winningLineTypes.map((line, index) => {

              {/* ---------------- HORIZONTAL ---------------- */}
              if (line.type === 'horizontal') {
                return (
                  <div
                    key={`horizontal-${line.index}-${index}`}
                    className="relative"
                    style={{
                      gridColumn: '1 / 6',
                      gridRow: `${(line.index ?? 0) + 1}`,
                    }}
                  >
                    <div
                      className="
                        absolute
                        left-0
                        right-0
                        top-1/2
                        -translate-y-1/2
                        h-[4px]
                        rounded-full
                        bg-gradient-to-r
                        from-cyan-400
                        via-blue-500
                        to-cyan-400
                        shadow-[0_0_10px_rgba(59,130,246,0.9)]
                      "
                    />
                  </div>
                );
              }

              {/* ---------------- VERTICAL ---------------- */}
              if (line.type === 'vertical') {
                return (
                  <div
                    key={`vertical-${line.index}-${index}`}
                    className="relative"
                    style={{
                      gridColumn: `${(line.index ?? 0) + 1}`,
                      gridRow: '1 / 6',
                    }}
                  >
                    <div
                      className="
                        absolute
                        top-0
                        bottom-0
                        left-1/2
                        -translate-x-1/2
                        w-[4px]
                        rounded-full
                        bg-gradient-to-b
                        from-cyan-400
                        via-blue-500
                        to-cyan-400
                        shadow-[0_0_10px_rgba(59,130,246,0.9)]
                      "
                    />
                  </div>
                );
              }

              return null;
            })}

            {/* =================================================
                DIAGONALS
               ================================================= */}

            {winningLineTypes.some(
              (line) => line.type === 'diagonal-main'
            ) && (
              <div
                className="
                  absolute
                  inset-0
                  flex
                  items-center
                  justify-center
                "
              >
                <div
                  className="
                    absolute
                    w-[141%]
                    h-[4px]
                    rounded-full
                    bg-gradient-to-r
                    from-cyan-400
                    via-blue-500
                    to-cyan-400
                    shadow-[0_0_10px_rgba(59,130,246,0.9)]
                    rotate-45
                  "
                />
              </div>
            )}

            {winningLineTypes.some(
              (line) => line.type === 'diagonal-anti'
            ) && (
              <div
                className="
                  absolute
                  inset-0
                  flex
                  items-center
                  justify-center
                "
              >
                <div
                  className="
                    absolute
                    w-[141%]
                    h-[4px]
                    rounded-full
                    bg-gradient-to-r
                    from-cyan-400
                    via-blue-500
                    to-cyan-400
                    shadow-[0_0_10px_rgba(59,130,246,0.9)]
                    -rotate-45
                  "
                />
              </div>
            )}
          </div>
        )}

        {/* =====================================================
            5x5 BINGO BOARD
           ===================================================== */}
        <div className="grid grid-cols-5 gap-2 md:gap-2.5 w-full h-full relative z-10">

          {board.map((num, index) => {
            const isMarked = calledSet.has(num);
            const isWinningCell = winningIndicesSet.has(index);
            const isPending = callingNumber === num;

            let cellClass =
              'rounded-xl font-mono font-bold text-lg md:text-2xl transition-colors duration-200 flex items-center justify-center border relative overflow-hidden select-none ';

            if (isWinningCell) {
              cellClass +=
                'winning-cell text-cyan-200 shadow-lg ';
            } else if (isMarked) {
              cellClass += 'marked-cell ';
            } else if (isMyTurn) {
              cellClass +=
                'bg-slate-900/80 border-white/10 hover:border-blue-500 hover:bg-slate-800 text-white cursor-pointer shadow-md ';
            } else {
              cellClass +=
                'bg-slate-900/50 border-white/5 text-slate-400 cursor-not-allowed ';
            }

            return (
              <button
                key={index}
                type="button"
                onClick={() => handleCellClick(num)}
                disabled={
                  !isMyTurn ||
                  isMarked ||
                  isPending
                }
                className={cellClass}
              >
                <span className="relative z-10">
                  {num}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};