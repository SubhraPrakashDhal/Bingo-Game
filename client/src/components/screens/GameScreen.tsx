import React from 'react';
import { useBingoSocket } from '../../context/SocketContext';
import { BingoBoard } from '../game/BingoBoard';
import { BingoProgress } from '../game/BingoProgress';
import { NumberHistory } from '../game/NumberHistory';
import { CalledPopup } from '../game/CalledPopup';
import { WinnerModal } from './WinnerModal';
import { Badge } from '../ui/Badge';
import { ShieldCheck, Zap, Lock } from 'lucide-react';

export const GameScreen: React.FC = () => {
  const { roomState, calledNotification, callNumber } = useBingoSocket();

  if (!roomState || !roomState.myBoard) return null;

  const me = roomState.players.find((p) => p.id === roomState.myPlayerId || p.id === roomState.mySocketId);
  const opponent = roomState.players.find((p) => p.id !== me?.id);
  const isMyTurn = roomState.currentTurnPlayerId === me?.id;
  const currentTurnPlayer = roomState.players.find((p) => p.id === roomState.currentTurnPlayerId);

  const handleCallNumber = async (num: number) => {
    await callNumber(num);
  };

  return (
    <div className="min-h-[90vh] flex flex-col items-center justify-between p-3 md:p-6 max-w-6xl mx-auto relative">
      {/* 2-Second Call Popup */}
      <CalledPopup notification={calledNotification} mySocketId={roomState.mySocketId} />

      {/* Victory Glass Modal */}
      <WinnerModal />

      {/* Top Game Status Bar */}
      <div className="w-full glass-panel p-4 rounded-2xl border border-white/10 mb-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Players Info */}
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
            {/* You */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center font-bold text-blue-300 text-sm shadow-md">
                {me?.nickname.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold text-white leading-none">{me?.nickname} (You)</span>
                <span className="text-[10px] text-slate-400 font-mono">Lines: {roomState.myCompletedLines} / 5</span>
              </div>
            </div>

            <span className="text-xs font-mono text-slate-600 font-black">VS</span>

            {/* Opponent */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center font-bold text-purple-300 text-sm shadow-md">
                {opponent?.nickname.charAt(0).toUpperCase() || 'O'}
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold text-white leading-none">{opponent?.nickname || 'Opponent'}</span>
                <span className="text-[10px] text-slate-400 font-mono">Opponent</span>
              </div>
            </div>
          </div>

          {/* B-I-N-G-O Progress Indicator */}
          <BingoProgress completedLinesCount={roomState.myCompletedLines} />

          {/* Turn Indicator Badge */}
          <div className="w-full md:w-auto flex justify-center">
            {isMyTurn ? (
              <Badge variant="emerald" className="!px-4 !py-2 text-xs md:text-sm animate-pulse flex items-center gap-2 shadow-lg shadow-emerald-500/20">
                <Zap className="w-4 h-4 text-emerald-300" />
                <span>YOUR TURN — CALL A NUMBER!</span>
              </Badge>
            ) : (
              <Badge variant="amber" className="!px-4 !py-2 text-xs md:text-sm flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-300" />
                <span>OPPONENT'S TURN ({currentTurnPlayer?.nickname || 'Opponent'})</span>
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Main Gameplay Layout */}
      <div className="w-full flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 lg:gap-10 my-auto">
        {/* Center: 5x5 Bingo Board */}
        <div className="w-full max-w-[460px] shrink-0 flex flex-col items-center mx-auto">
          <BingoBoard
            board={roomState.myBoard}
            calledNumbers={roomState.calledNumbers}
            winningLineIndices={roomState.myWinningLineIndices}
            isMyTurn={isMyTurn}
            onCallNumber={handleCallNumber}
          />

          <div className="mt-4 inline-flex items-center gap-2 text-xs text-slate-400 bg-slate-900/60 px-4 py-2 rounded-xl border border-white/5 shadow-inner">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Private Board • Click any unmarked cell on your turn to call number</span>
          </div>
        </div>

        {/* Right Sidebar: Number History */}
        <div className="w-full lg:w-72 shrink-0">
          <NumberHistory calledNumbers={roomState.calledNumbers} />
        </div>
      </div>
    </div>
  );
};
