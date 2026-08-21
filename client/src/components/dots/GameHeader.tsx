import { ClientRoomState } from '../../../../shared/types';
import { Zap, Trophy, Circle, Target } from 'lucide-react';

interface GameHeaderProps {
  roomState: ClientRoomState;
  myPlayerId: string;
}

export const GameHeader: React.FC<GameHeaderProps> = ({ roomState, myPlayerId }) => {
  const dotsState = roomState.dotsState;
  if (!dotsState) return null;

  const p1 = roomState.players[0];
  const p2 = roomState.players[1];

  const p1Id = p1?.id || '';
  const p2Id = p2?.id || '';

  const p1Score = dotsState.scores[p1Id] || 0;
  const p2Score = dotsState.scores[p2Id] || 0;

  const isMyTurn = dotsState.currentTurn === myPlayerId;
  const activePlayer = roomState.players.find((p) => p.id === dotsState.currentTurn);

  const totalBoxes = 16;
  const claimedBoxes = p1Score + p2Score;
  const progress = totalBoxes > 0 ? Math.min((claimedBoxes / totalBoxes) * 100, 100) : 0;

  const p1Active = dotsState.currentTurn === p1Id;
  const p2Active = dotsState.currentTurn === p2Id;

  return (
    <div className="w-full max-w-xl mx-auto px-3 sm:px-4 pt-2 pb-1">
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-slate-950/80 shadow-2xl backdrop-blur-2xl">
        <div className="relative p-3 sm:p-4">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
            {/* Player 1 */}
            <div
              className={`relative overflow-hidden rounded-xl border p-2.5 sm:p-3 transition-all duration-300 ${
                p1Active
                  ? 'border-sky-400/35 bg-sky-400/[0.09] shadow-[0_0_25px_rgba(56,189,248,0.08)]'
                  : 'border-white/[0.06] bg-white/[0.025]'
              }`}
            >
              {p1Active && <div className="absolute left-0 top-0 h-full w-[2px] bg-sky-400" />}
              <div className="flex items-center gap-2.5">
                <div
                  className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-sm font-black transition-all ${
                    p1Active
                      ? 'border-sky-400/40 bg-sky-400/15 text-sky-300'
                      : 'border-white/[0.08] bg-white/[0.04] text-slate-400'
                  }`}
                >
                  {p1 ? p1.nickname.charAt(0).toUpperCase() : '1'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="max-w-[80px] truncate text-xs font-bold text-white sm:max-w-[110px]">
                      {p1 ? p1.nickname : 'Player 1'}
                    </span>
                    {p1Id === myPlayerId && (
                      <span className="rounded px-1 py-0.5 text-[7px] font-black tracking-wider text-sky-300 bg-sky-400/10">
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-baseline gap-1.5">
                    <span className={`font-mono text-2xl font-black leading-none ${p1Active ? 'text-sky-300' : 'text-slate-300'}`}>
                      {p1Score}
                    </span>
                    <span className="text-[8px] font-medium uppercase tracking-wider text-slate-400">
                      boxes
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* VS Badge */}
            <div className="flex flex-col items-center">
              <div className="relative flex h-9 w-9 items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-white/[0.08]" />
                <span className="relative text-[9px] font-black tracking-widest text-slate-400">VS</span>
              </div>
              <div className="mt-1 flex items-center gap-1">
                <Target className="h-2.5 w-2.5 text-slate-400" />
                <span className="whitespace-nowrap text-[7px] font-bold uppercase tracking-wider text-slate-400">
                  DOTS & BOXES
                </span>
              </div>
            </div>

            {/* Player 2 */}
            <div
              className={`relative overflow-hidden rounded-xl border p-2.5 sm:p-3 transition-all duration-300 ${
                p2Active
                  ? 'border-amber-400/35 bg-amber-400/[0.09] shadow-[0_0_25px_rgba(251,191,36,0.08)]'
                  : 'border-white/[0.06] bg-white/[0.025]'
              }`}
            >
              {p2Active && <div className="absolute right-0 top-0 h-full w-[2px] bg-amber-400" />}
              <div className="flex items-center justify-end gap-2.5">
                <div className="min-w-0 flex-1 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {p2Id === myPlayerId && (
                      <span className="rounded px-1 py-0.5 text-[7px] font-black tracking-wider text-amber-300 bg-amber-400/10">
                        YOU
                      </span>
                    )}
                    <span className="max-w-[80px] truncate text-xs font-bold text-white sm:max-w-[110px]">
                      {p2 ? p2.nickname : 'Player 2'}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-baseline justify-end gap-1.5">
                    <span className="text-[8px] font-medium uppercase tracking-wider text-slate-400">
                      boxes
                    </span>
                    <span className={`font-mono text-2xl font-black leading-none ${p2Active ? 'text-amber-300' : 'text-slate-300'}`}>
                      {p2Score}
                    </span>
                  </div>
                </div>
                <div
                  className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-sm font-black transition-all ${
                    p2Active
                      ? 'border-amber-400/40 bg-amber-400/15 text-amber-300'
                      : 'border-white/[0.08] bg-white/[0.04] text-slate-400'
                  }`}
                >
                  {p2 ? p2.nickname.charAt(0).toUpperCase() : '2'}
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="mb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Circle className="h-2.5 w-2.5 fill-slate-500 text-slate-500" />
                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
                  Board Progress
                </span>
              </div>
              <span className="font-mono text-[8px] font-bold text-slate-400">
                {claimedBoxes}/{totalBoxes}
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-white/[0.05]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-400 via-violet-400 to-amber-400 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Turn indicator */}
        <div
          className={`relative border-t px-4 py-2.5 transition-all duration-300 ${
            isMyTurn
              ? 'border-emerald-400/10 bg-emerald-400/[0.055]'
              : 'border-white/[0.06] bg-black/[0.1]'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <div className={`flex h-5 w-5 items-center justify-center rounded-full ${isMyTurn ? 'bg-emerald-400/15' : 'bg-white/[0.05]'}`}>
              {isMyTurn ? (
                <Zap className="h-3 w-3 fill-emerald-400 text-emerald-400 animate-pulse" />
              ) : (
                <Trophy className="h-3 w-3 text-slate-500" />
              )}
            </div>
            <span className={`text-[9px] font-black uppercase tracking-[0.18em] ${isMyTurn ? 'text-emerald-300' : 'text-slate-400'}`}>
              {isMyTurn
                ? 'Your Turn'
                : activePlayer
                ? `${activePlayer.nickname}'s Turn`
                : 'Game Ended'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
