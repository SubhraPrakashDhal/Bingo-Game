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
          BINGO PRIVATE
        </h1>
        <p className="text-slate-400 text-sm md:text-base leading-relaxed">
          Create a private room, invite a friend, configure your strategic 5×5 board, and compete head-to-head in real time.
        </p>
      </div>

      <GlassCard className="w-full max-w-md">
        {/* Toggle Mode */}
        <div className="grid grid-cols-2 p-1 bg-slate-900/60 rounded-xl mb-6 border border-white/5">
          <button
            type="button"
            onClick={() => { setMode('create'); setErrorMsg(null); }}
            className={`py-2.5 rounded-lg font-medium text-xs md:text-sm flex items-center justify-center gap-2 transition-all ${
              mode === 'create'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            Create Room
          </button>

          <button
            type="button"
            onClick={() => { setMode('join'); setErrorMsg(null); }}
            className={`py-2.5 rounded-lg font-medium text-xs md:text-sm flex items-center justify-center gap-2 transition-all ${
              mode === 'join'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-4 h-4" />
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
                className="w-full px-4 py-3 bg-slate-900/80 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
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
                className="w-full px-4 py-3 bg-slate-900/80 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-sm mb-4"
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
                className="w-full px-4 py-3 bg-slate-900/80 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-sm font-mono tracking-widest text-center uppercase"
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
