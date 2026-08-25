import React from 'react';
import { TicTacToeGameState, TicTacToeSymbol } from '../../../../shared/types';
import { GlassCard } from '../ui/GlassCard';

interface TicTacToeBoardProps {
  ticTacToeState: TicTacToeGameState;
  myPlayerId: string;
  onMakeMove: (cellIndex: number) => void;
}

export const TicTacToeBoard: React.FC<TicTacToeBoardProps> = ({
  ticTacToeState,
  myPlayerId,
  onMakeMove,
}) => {
  const {
    mode = 'classic',
    board,
    currentTurn,
    playerSymbols,
    winnerId,
    winningLine,
    marks = [],
    lastExpiredMark,
  } = ticTacToeState;

  const isMyTurn = currentTurn === myPlayerId && winnerId === null;
  const mySymbol: TicTacToeSymbol = playerSymbols[myPlayerId] || 'X';

  const currentTurnSymbol = currentTurn ? playerSymbols[currentTurn] : null;

  // In Infinite mode, find the oldest mark cell index ONLY for the player whose turn it currently is (when they have 3 active marks)
  const xMarks = marks.filter((m) => m.symbol === 'X');
  const oMarks = marks.filter((m) => m.symbol === 'O');

  const oldestXCellIndex = mode === 'infinite' && currentTurnSymbol === 'X' && xMarks.length >= 3 ? xMarks[0].cellIndex : null;
  const oldestOCellIndex = mode === 'infinite' && currentTurnSymbol === 'O' && oMarks.length >= 3 ? oMarks[0].cellIndex : null;

  const handleCellClick = (index: number) => {
    if (!isMyTurn || board[index] !== null) return;
    onMakeMove(index);
  };

  // Helper SVG for smooth neon X drawing
  const renderX = (isWinningCell: boolean, isOldest: boolean) => (
    <svg
      viewBox="0 0 100 100"
      className={`w-16 h-16 sm:w-20 sm:h-20 transition-all duration-500 ${
        isWinningCell
          ? 'scale-110 drop-shadow-[0_0_20px_rgba(34,211,238,1)] opacity-100'
          : isOldest
          ? 'opacity-40 scale-95 drop-shadow-[0_0_4px_rgba(6,182,212,0.35)] animate-pulse'
          : 'drop-shadow-[0_0_12px_rgba(6,182,212,0.8)] opacity-100'
      }`}
    >
      <line
        x1="20"
        y1="20"
        x2="80"
        y2="80"
        stroke="#22d3ee"
        strokeWidth="12"
        strokeLinecap="round"
        className="animate-draw-line"
      />
      <line
        x1="80"
        y1="20"
        x2="20"
        y2="80"
        stroke="#06b6d4"
        strokeWidth="12"
        strokeLinecap="round"
        className="animate-draw-line"
      />
    </svg>
  );

  // Helper SVG for smooth neon O drawing
  const renderO = (isWinningCell: boolean, isOldest: boolean) => (
    <svg
      viewBox="0 0 100 100"
      className={`w-16 h-16 sm:w-20 sm:h-20 transition-all duration-500 ${
        isWinningCell
          ? 'scale-110 drop-shadow-[0_0_20px_rgba(192,132,252,1)] opacity-100'
          : isOldest
          ? 'opacity-40 scale-95 drop-shadow-[0_0_4px_rgba(168,85,247,0.35)] animate-pulse'
          : 'drop-shadow-[0_0_12px_rgba(168,85,247,0.8)] opacity-100'
      }`}
    >
      <circle
        cx="50"
        cy="50"
        r="32"
        fill="none"
        stroke="#c084fc"
        strokeWidth="12"
        strokeLinecap="round"
        className="animate-draw-circle"
      />
    </svg>
  );

  // Helper SVG for transient fade-out animation of expired mark
  const renderFadingMark = (symbol: TicTacToeSymbol) => {
    if (symbol === 'X') {
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 sm:w-20 sm:h-20 animate-mark-fade-out">
          <line x1="20" y1="20" x2="80" y2="80" stroke="#22d3ee" strokeWidth="12" strokeLinecap="round" />
          <line x1="80" y1="20" x2="20" y2="80" stroke="#06b6d4" strokeWidth="12" strokeLinecap="round" />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 100 100" className="w-16 h-16 sm:w-20 sm:h-20 animate-mark-fade-out">
        <circle cx="50" cy="50" r="32" fill="none" stroke="#c084fc" strokeWidth="12" strokeLinecap="round" />
      </svg>
    );
  };

  return (
    <GlassCard className="w-full max-w-md mb-10 mx-auto p-4 sm:p-6 shadow-2xl relative overflow-hidden border border-white/10 bg-slate-950/80 backdrop-blur-xl">
      {/* 3x3 Grid Layout */}
      <div className="grid grid-cols-3 gap-3 relative z-10 aspect-square">
        {board.map((cellValue, index) => {
          const isWinningCell = winningLine?.includes(index) || false;
          const isOccupied = cellValue !== null;

          const isOldestX = cellValue === 'X' && index === oldestXCellIndex;
          const isOldestO = cellValue === 'O' && index === oldestOCellIndex;
          const isOldestMark = isOldestX || isOldestO;

          const isLastExpiredCell = !isOccupied && lastExpiredMark?.cellIndex === index;

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleCellClick(index)}
              disabled={!isMyTurn || isOccupied}
              className={`relative rounded-2xl flex items-center justify-center transition-all duration-300 aspect-square group overflow-hidden ${
                isWinningCell
                  ? 'bg-gradient-to-tr from-cyan-500/30 to-purple-500/30 border-2 border-cyan-400 shadow-xl shadow-cyan-500/20 scale-[1.02]'
                  : isOccupied
                  ? 'bg-slate-900/80 border border-white/10 cursor-not-allowed'
                  : isMyTurn
                  ? 'bg-slate-900/50 border border-white/15 hover:border-cyan-400/60 hover:bg-cyan-500/10 cursor-pointer active:scale-95 shadow-md hover:shadow-cyan-500/10'
                  : 'bg-slate-900/40 border border-white/5 cursor-not-allowed'
              }`}
            >
              {/* Render Active Symbol */}
              {cellValue === 'X' && renderX(isWinningCell, isOldestMark)}
              {cellValue === 'O' && renderO(isWinningCell, isOldestMark)}

              {/* Render Transient Fading Mark for expired cell */}
              {isLastExpiredCell && lastExpiredMark && renderFadingMark(lastExpiredMark.symbol)}

              {/* Hover Preview for empty cell when it is my turn */}
              {!isOccupied && !isLastExpiredCell && isMyTurn && (
                <span className="text-3xl sm:text-4xl font-black text-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-150 select-none">
                  {mySymbol}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </GlassCard>
  );
};
