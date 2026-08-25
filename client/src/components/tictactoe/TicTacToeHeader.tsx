import React from 'react';
import { ClientRoomState } from '../../../../shared/types';
import { Zap, Trophy, Target } from 'lucide-react';

interface TicTacToeHeaderProps {
  roomState: ClientRoomState;
  myPlayerId: string;
}

export const TicTacToeHeader: React.FC<TicTacToeHeaderProps> = ({
  roomState,
  myPlayerId,
}) => {
  const ticTacToeState = roomState.ticTacToeState;

  if (!ticTacToeState) return null;

  const mode = ticTacToeState.mode || 'classic';
  const marks = ticTacToeState.marks || [];

  const p1 = roomState.players[0];
  const p2 = roomState.players[1];

  const p1Id = p1?.id || '';
  const p2Id = p2?.id || '';

  const p1Symbol = ticTacToeState.playerSymbols[p1Id] || 'X';
  const p2Symbol = ticTacToeState.playerSymbols[p2Id] || 'O';

  const p1Marks = marks.filter((m) => m.playerId === p1Id);
  const p2Marks = marks.filter((m) => m.playerId === p2Id);

  const isMyTurn =
    ticTacToeState.currentTurn === myPlayerId &&
    ticTacToeState.winnerId === null;

  const activePlayer = roomState.players.find(
    (p) => p.id === ticTacToeState.currentTurn
  );

  const p1Active =
    ticTacToeState.currentTurn === p1Id &&
    ticTacToeState.winnerId === null;

  const p2Active =
    ticTacToeState.currentTurn === p2Id &&
    ticTacToeState.winnerId === null;

  return (
    <div className="mx-auto w-full max-w-2xl px-2.5 pt-2 pb-1 sm:px-4">
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-slate-950/80 shadow-2xl backdrop-blur-2xl">
        {/* =========================
            PLAYER VS PLAYER SECTION
        ========================== */}
        <div className="relative p-2.5 sm:p-3">
          <div
            className="
              grid
              grid-cols-[minmax(0,1fr)_88px_minmax(0,1fr)]
              items-center
              gap-2.5
              sm:grid-cols-[minmax(0,1fr)_100px_minmax(0,1fr)]
              sm:gap-4
            "
          >
            {/* =========================
                PLAYER 1
            ========================== */}
            <div
              className={`
                relative
                min-w-0
                overflow-hidden
                rounded-xl
                border
                p-2
                sm:p-2.5
                transition-all
                duration-300
                ${p1Active
                  ? 'border-cyan-400/40 bg-cyan-400/[0.09] shadow-[0_0_25px_rgba(34,211,238,0.15)]'
                  : 'border-white/[0.06] bg-white/[0.025]'
                }
              `}
            >
              {p1Active && (
                <div className="absolute left-0 top-0 h-full w-[2px] bg-cyan-400" />
              )}

              <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
                {/* Symbol */}
                <div
                  className={`
                    relative
                    flex
                    h-9
                    w-9
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    border
                    font-black
                    transition-all
                    sm:h-10
                    sm:w-10
                    ${p1Active
                      ? 'border-cyan-400/50 bg-cyan-500/20 text-cyan-300 shadow-md shadow-cyan-500/20'
                      : 'border-white/[0.08] bg-white/[0.04] text-slate-400'
                    }
                  `}
                >
                  <span className="text-lg sm:text-xl">
                    {p1Symbol}
                  </span>
                </div>

                {/* Player info */}
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span className="max-w-[72px] truncate text-[11px] font-bold text-white sm:max-w-[110px] sm:text-xs">
                      {p1 ? p1.nickname : 'Player 1'}
                    </span>

                    {p1Id === myPlayerId && (
                      <span
                        className="
                          shrink-0
                          rounded
                          bg-cyan-400/10
                          px-1
                          py-0.5
                          text-[7px]
                          font-black
                          tracking-wider
                          text-cyan-300
                        "
                      >
                        YOU
                      </span>
                    )}
                  </div>

                  <div className="mt-0.5 flex min-w-0 flex-col gap-0.5">
                    <span
                      className="
                        truncate
                        text-[9px]
                        font-bold
                        uppercase
                        tracking-[0.12em]
                        text-cyan-400
                        sm:text-[10px]
                      "
                    >
                      SYMBOL {p1Symbol}
                    </span>

                    {mode === 'infinite' && (
                      <span className="text-[8px] font-mono font-bold text-slate-400 sm:text-[9px]">
                        {p1Marks.length}/3 MARKS
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* =========================
                CENTER / VS
            ========================== */}
            <div className="flex w-full min-w-0 flex-col items-center">
              {/* VS Circle */}
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center sm:h-9 sm:w-9">
                <div className="absolute inset-0 rounded-full border border-white/[0.08]" />

                <span className="relative text-[8px] font-black tracking-widest text-slate-400 sm:text-[9px]">
                  VS
                </span>
              </div>

              {/* Game info */}
              <div className="mt-1 flex w-full min-w-0 flex-col items-center gap-1">
                <div className="flex w-full min-w-0 items-center justify-center gap-1">
                  <Target className="h-2.5 w-2.5 shrink-0 text-slate-400" />

                  <span className="truncate whitespace-nowrap text-center text-[7px] font-bold uppercase tracking-[0.08em] text-slate-400 sm:text-[8px]">
                    TIC-TAC-TOE
                  </span>
                </div>

                <span
                  className={`
                    inline-flex
                    shrink-0
                    items-center
                    justify-center
                    whitespace-nowrap
                    rounded
                    border
                    px-1.5
                    py-0.5
                    text-[7px]
                    font-extrabold
                    uppercase
                    tracking-wide
                    sm:text-[8px]
                    ${mode === 'infinite'
                      ? 'border-purple-400/30 bg-purple-500/20 text-purple-300'
                      : 'border-cyan-400/30 bg-cyan-500/20 text-cyan-300'
                    }
                  `}
                >
                  {mode === 'infinite' ? '∞ INFINITE' : 'CLASSIC'}
                </span>
              </div>
            </div>

            {/* =========================
                PLAYER 2
            ========================== */}
            <div
              className={`
                relative
                min-w-0
                overflow-hidden
                rounded-xl
                border
                p-2
                sm:p-2.5
                transition-all
                duration-300
                ${p2Active
                  ? 'border-purple-400/40 bg-purple-400/[0.09] shadow-[0_0_25px_rgba(192,132,252,0.15)]'
                  : 'border-white/[0.06] bg-white/[0.025]'
                }
              `}
            >
              {p2Active && (
                <div className="absolute right-0 top-0 h-full w-[2px] bg-purple-400" />
              )}

              <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-2.5">
                {/* Player info */}
                <div className="min-w-0 flex-1 text-right">
                  <div className="flex min-w-0 items-center justify-end gap-1.5">
                    {p2Id === myPlayerId && (
                      <span
                        className="
                          shrink-0
                          rounded
                          bg-purple-400/10
                          px-1
                          py-0.5
                          text-[7px]
                          font-black
                          tracking-wider
                          text-purple-300
                        "
                      >
                        YOU
                      </span>
                    )}

                    <span className="max-w-[72px] truncate text-[11px] font-bold text-white sm:max-w-[110px] sm:text-xs">
                      {p2 ? p2.nickname : 'Player 2'}
                    </span>
                  </div>

                  <div className="mt-0.5 flex min-w-0 flex-col items-end gap-0.5">
                    <span
                      className="
                        truncate
                        text-[9px]
                        font-bold
                        uppercase
                        tracking-[0.12em]
                        text-purple-400
                        sm:text-[10px]
                      "
                    >
                      SYMBOL {p2Symbol}
                    </span>

                    {mode === 'infinite' && (
                      <span className="text-[8px] font-mono font-bold text-slate-400 sm:text-[9px]">
                        {p2Marks.length}/3 MARKS
                      </span>
                    )}
                  </div>
                </div>

                {/* Symbol */}
                <div
                  className={`
                    relative
                    flex
                    h-9
                    w-9
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    border
                    font-black
                    transition-all
                    sm:h-10
                    sm:w-10
                    ${p2Active
                      ? 'border-purple-400/50 bg-purple-500/20 text-purple-300 shadow-md shadow-purple-500/20'
                      : 'border-white/[0.08] bg-white/[0.04] text-slate-400'
                    }
                  `}
                >
                  <span className="text-lg sm:text-xl">
                    {p2Symbol}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================
            TURN INDICATOR
        ========================== */}
        <div
          className={`
            relative
            border-t
            px-4
            py-2
            transition-all
            duration-300
            sm:py-2.5
            ${isMyTurn
              ? 'border-emerald-400/10 bg-emerald-400/[0.055]'
              : 'border-white/[0.06] bg-black/[0.1]'
            }
          `}
        >
          <div className="flex items-center justify-center gap-2">
            <div
              className={`
                flex
                h-5
                w-5
                shrink-0
                items-center
                justify-center
                rounded-full
                ${isMyTurn
                  ? 'bg-emerald-400/15'
                  : 'bg-white/[0.05]'
                }
              `}
            >
              {isMyTurn ? (
                <Zap className="h-3 w-3 animate-pulse fill-emerald-400 text-emerald-400" />
              ) : (
                <Trophy className="h-3 w-3 text-slate-500" />
              )}
            </div>

            <span
              className={`
                max-w-full
                truncate
                text-center
                text-[9px]
                font-black
                uppercase
                tracking-[0.18em]
                ${isMyTurn
                  ? 'text-emerald-300'
                  : 'text-slate-400'
                }
              `}
            >
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