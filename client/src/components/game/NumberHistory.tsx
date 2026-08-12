import React, { useState } from 'react';
import { History, ChevronUp, ChevronDown, ListOrdered } from 'lucide-react';

interface NumberHistoryProps {
  calledNumbers: number[];
}

export const NumberHistory: React.FC<NumberHistoryProps> = ({ calledNumbers }) => {
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  const latestNumber = calledNumbers[calledNumbers.length - 1] ?? null;
  const previousNumbers = [...calledNumbers].slice(0, -1).reverse();

  return (
    <div className="w-full">
      {/* Desktop View */}
      <div className="hidden lg:block glass-panel p-5 rounded-2xl border border-white/10 w-72">
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Number History</span>
          </div>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 border border-cyan-500/20">
            {calledNumbers.length} CALLED
          </span>
        </div>

        {/* Latest Number */}
        <div className="mb-4 text-center p-4 rounded-xl bg-gradient-to-br from-blue-600/30 via-slate-900 to-purple-600/30 border border-blue-500/30 shadow-inner">
          <span className="block text-[10px] font-extrabold text-blue-400 uppercase tracking-widest mb-1">
            Latest Number
          </span>
          <span className="text-4xl font-mono font-black text-white">
            {latestNumber !== null ? latestNumber : '—'}
          </span>
        </div>

        {/* Previous Numbers List */}
        <div>
          <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Previous Numbers
          </span>

          {previousNumbers.length > 0 ? (
            <div className="grid grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
              {previousNumbers.map((num, idx) => (
                <div
                  key={idx}
                  className="py-1.5 rounded-lg bg-slate-900/80 border border-white/5 text-center font-mono text-sm font-bold text-slate-300"
                >
                  {num}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-slate-500 text-xs italic">
              No previous numbers yet
            </div>
          )}
        </div>
      </div>

      {/* Mobile View - Collapsible Bottom Drawer */}
      <div className="block lg:hidden mt-4 glass-panel rounded-xl p-3 border border-white/10">
        <button
          type="button"
          onClick={() => setIsOpenMobile(!isOpenMobile)}
          className="w-full flex items-center justify-between text-xs font-bold text-slate-200"
        >
          <div className="flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-cyan-400" />
            <span>NUMBER HISTORY ({calledNumbers.length})</span>
          </div>

          <div className="flex items-center gap-2">
            {latestNumber !== null && (
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-xs font-bold">
                Latest: {latestNumber}
              </span>
            )}
            {isOpenMobile ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
          </div>
        </button>

        {isOpenMobile && (
          <div className="mt-3 pt-3 border-t border-white/5">
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {calledNumbers.slice().reverse().map((num, idx) => (
                <div
                  key={idx}
                  className={`px-3 py-1.5 rounded-lg text-center font-mono text-xs font-bold shrink-0 ${
                    idx === 0
                      ? 'bg-blue-600 text-white border border-cyan-400 shadow-md'
                      : 'bg-slate-900 text-slate-300 border border-white/5'
                  }`}
                >
                  {num}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
