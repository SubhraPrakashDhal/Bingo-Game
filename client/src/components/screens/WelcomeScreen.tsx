import React, { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import { useBingoSocket } from '../../context/SocketContext';
import { ShieldCheck, Users, PlusCircle, LogIn, Sparkles, Dices } from 'lucide-react';

export const WelcomeScreen: React.FC = () => {
  const { createRoom, joinRoom } = useBingoSocket();
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [nickname, setNickname] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setErrorMsg('Please enter a nickname');
      return;
    }
    setErrorMsg(null);
    setIsLoading(true);
    const res = await createRoom(nickname.trim());
    setIsLoading(false);
    if (!res.success && res.error) {
      setErrorMsg(res.error);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setErrorMsg('Please enter a nickname');
      return;
    }
    if (!roomCodeInput.trim() || roomCodeInput.trim().length !== 6) {
      setErrorMsg('Room code must be 6 characters');
      return;
    }
    setErrorMsg(null);
    setIsLoading(true);
    const res = await joinRoom(roomCodeInput.trim().toUpperCase(), nickname.trim());
    setIsLoading(false);
    if (!res.success && res.error) {
      setErrorMsg(res.error);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-4">
      {/* Brand Hero */}
      <div className="text-center mb-8 max-w-lg">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Real-Time Private 2-Player Experience</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-blue-400 bg-clip-text text-transparent mb-3">
          GAMES PRIVATE
        </h1>
        <p className="text-slate-400 text-sm md:text-base leading-relaxed">
          Create a private room, invite a friend, choose a game, and play together in real time.
        </p>
      </div>

      <GlassCard className="w-full max-w-md">
        {/* Toggle Mode - Premium Segmented Control */}
        <div className="relative flex p-1 bg-slate-900/60 rounded-xl mb-6 border border-white/5 shadow-inner">
          {/* Animated Background Indicator */}
          <div
            className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-lg transition-all duration-[300ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
              mode === 'create'
                ? 'translate-x-0 bg-gradient-to-r from-blue-600 to-blue-500 shadow-[0_0_12px_rgba(37,99,235,0.3)]'
                : 'translate-x-full bg-gradient-to-r from-purple-600 to-indigo-500 shadow-[0_0_12px_rgba(147,51,234,0.3)]'
            }`}
          />

          {/* Create Room Button */}
          <button
            type="button"
            aria-pressed={mode === 'create'}
            onClick={() => { setMode('create'); setErrorMsg(null); }}
            className={`group relative z-10 flex-1 py-2.5 rounded-lg font-medium text-xs md:text-sm flex items-center justify-center gap-2 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 active:scale-[0.98] ${
              mode === 'create'
                ? 'text-white font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-white/5 hover:scale-[1.01]'
            }`}
          >
            <PlusCircle 
              className={`w-4 h-4 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                mode === 'create' 
                  ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]' 
                  : 'opacity-70 group-hover:opacity-100 group-hover:scale-105'
              }`} 
            />
            Create Room
          </button>

          {/* Join Private Room Button */}
          <button
            type="button"
            aria-pressed={mode === 'join'}
            onClick={() => { setMode('join'); setErrorMsg(null); }}
            className={`group relative z-10 flex-1 py-2.5 rounded-lg font-medium text-xs md:text-sm flex items-center justify-center gap-2 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 active:scale-[0.98] ${
              mode === 'join'
                ? 'text-white font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-white/5 hover:scale-[1.01]'
            }`}
          >
            <LogIn 
              className={`w-4 h-4 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                mode === 'join' 
                  ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]' 
                  : 'opacity-70 group-hover:opacity-100 group-hover:scale-105'
              }`} 
            />
            Join Private Room
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center font-medium">
            {errorMsg}
          </div>
        )}

        {mode === 'create' ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Your Player Nickname
              </label>
              <input
                type="text"
                maxLength={15}
                placeholder="e.g. MasterBingo"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/80 border border-white/10 rounded-xl text-white placeholder-slate-500 outline-none focus:outline-none focus:border-white/30 focus:bg-slate-900/90 focus:ring-0 focus:shadow-none transition-colors duration-200 text-sm"
              />
            </div>

            <GlassButton type="submit" fullWidth disabled={isLoading}>
              {isLoading ? (
                <span>Generating Private Room...</span>
              ) : (
                <>
                  <Dices className="w-4 h-4" />
                  <span>Create Private Room</span>
                </>
              )}
            </GlassButton>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Your Player Nickname
              </label>
              <input
                type="text"
                maxLength={15}
                placeholder="e.g. Challenger2"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/80 border border-white/10 rounded-xl text-white placeholder-slate-500 outline-none focus:outline-none focus:border-white/30 focus:bg-slate-900/90 focus:ring-0 focus:shadow-none transition-colors duration-200 text-sm mb-4"
              />

              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                6-Character Room Code
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="e.g. BINGO7"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 bg-slate-900/80 border border-white/10 rounded-xl text-white placeholder-slate-500 outline-none focus:outline-none focus:border-white/30 focus:bg-slate-900/90 focus:ring-0 focus:shadow-none transition-colors duration-200 text-sm font-mono tracking-widest text-center uppercase"
              />
            </div>

            <GlassButton type="submit" fullWidth disabled={isLoading} className="!bg-purple-600 hover:!bg-purple-500">
              {isLoading ? (
                <span>Joining Room...</span>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  <span>Join Room</span>
                </>
              )}
            </GlassButton>
          </form>
        )}

        <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-center gap-2 text-slate-500 text-xs">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          <span>Strict Server-Authoritative & Zero Board Leaks</span>
        </div>
      </GlassCard>
    </div>
  );
};