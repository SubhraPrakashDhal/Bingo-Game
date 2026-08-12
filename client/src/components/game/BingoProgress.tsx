import React from 'react';
import { Check } from 'lucide-react';

interface BingoProgressProps {
  completedLinesCount: number; // 0 to 5
}

export const BingoProgress: React.FC<BingoProgressProps> = ({ completedLinesCount }) => {
  const letters = ['B', 'I', 'N', 'G', 'O'];

  return (
    <div className="flex items-center justify-center gap-2 md:gap-4 my-2">
      {letters.map((letter, index) => {
        const isCompleted = index < completedLinesCount;
        return (
          <div
            key={letter}
            className={`flex flex-col items-center justify-center w-12 h-14 md:w-14 md:h-16 rounded-xl border transition-all duration-300 ${
              isCompleted
                ? 'bg-gradient-to-b from-blue-600 to-purple-600 border-cyan-400 text-white shadow-lg shadow-blue-500/40 scale-105'
                : 'bg-slate-900/60 border-white/10 text-slate-500'
            }`}
          >
            <span className="text-lg md:text-xl font-black tracking-wider">{letter}</span>
            <div className="mt-0.5">
              {isCompleted ? (
                <Check className="w-4 h-4 text-cyan-300 stroke-[3]" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-slate-700" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
