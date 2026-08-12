import React from 'react';
import { Volume2 } from 'lucide-react';

interface CalledPopupProps {
  notification: {
    number: number;
    calledByNickname: string;
    calledById: string;
  } | null;
  myPlayerId?: string;
  mySocketId?: string;
}

export const CalledPopup: React.FC<CalledPopupProps> = ({ notification, myPlayerId, mySocketId }) => {
  if (!notification) return null;

  const isMe = notification.calledById === myPlayerId || notification.calledById === mySocketId;

  return (
    <div className="fixed top-28 left-1/2 -translate-x-1/2 z-50 animate-call-popup pointer-events-none w-11/12 max-w-sm">
      <div className="glass-panel p-4 rounded-2xl border border-blue-400/50 shadow-2xl text-center bg-slate-950/95 backdrop-blur-2xl ring-1 ring-blue-500/30">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-extrabold uppercase tracking-widest mb-1.5">
          <Volume2 className="w-3 h-3" />
          <span>Number Called</span>
        </div>

        <div className="text-4xl md:text-5xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 my-1 tracking-tight">
          {notification.number}
        </div>

        <div className="text-xs font-semibold text-slate-300">
          {isMe ? 'You' : notification.calledByNickname} called number <span className="font-mono text-cyan-400 font-bold">{notification.number}</span>
        </div>
      </div>
    </div>
  );
};
