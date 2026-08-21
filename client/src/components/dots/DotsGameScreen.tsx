import React from 'react';
import { useBingoSocket } from '../../context/SocketContext';
import { GameHeader } from './GameHeader';
import { GameBoard } from './GameBoard';
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import { Trophy, Frown, Equal, RotateCcw, LogOut, LayoutGrid } from 'lucide-react';

export const DotsGameScreen: React.FC = () => {
  const { roomState, playerId, makeDotsMove, requestDotsRematch, returnToLobby, leaveRoom } = useBingoSocket();

  if (!roomState || !roomState.dotsState) return null;

  const dotsState = roomState.dotsState;

  const playerIds = roomState.players.map((p) => p.id);
  const playerNames: Record<string, string> = {};
  for (const p of roomState.players) {
    playerNames[p.id] = p.nickname;
  }

  const opponent = roomState.players.find((p) => p.id !== playerId);
  const isOpponentMissing = !opponent || roomState.players.length < 2;

  // Render Dots & Boxes Result Modal only if game ended naturally without an opponent leaving
  const isEnded = (roomState.stage === 'DOTS_ENDED' || dotsState.winnerId !== null) && !isOpponentMissing && dotsState.forfeitReason !== 'opponent_left';
  const isWinner = dotsState.winnerId === playerId;
  const isDraw = dotsState.winnerId === 'draw';
  const isForfeit = dotsState.forfeitReason === 'opponent_left';

  const myScore = dotsState.scores[playerId] || 0;
  const opponentScore = opponent ? dotsState.scores[opponent.id] || 0 : 0;

  const rematchRequestedByMe = dotsState.rematchRequestedBy === playerId;
  const rematchRequestedByOpponent =
    dotsState.rematchRequestedBy && dotsState.rematchRequestedBy !== playerId;

  const handleMakeMove = (type: 'h' | 'v', row: number, col: number) => {
    makeDotsMove(type, row, col);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-between gap-4 w-full my-auto py-4 px-2">
      {/* Header with Player Scores & Turn Status */}
      <GameHeader roomState={roomState} myPlayerId={playerId} />

      {/* Main Interactive 5x5 SVG Board */}
      <GameBoard
        dotsState={dotsState}
        myPlayerId={playerId}
        playerIds={playerIds}
        playerNames={playerNames}
        onMakeMove={handleMakeMove}
      />

      {/* Bottom Leave Control */}
      <div className="pb-2 flex gap-3">
        <button
          type="button"
          onClick={returnToLobby}
          className="text-xs text-slate-300 hover:text-blue-300 font-medium px-4 py-2 rounded-xl bg-slate-900/60 border border-white/10 transition-colors flex items-center gap-1.5"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Return to Common Lobby</span>
        </button>

        <button
          type="button"
          onClick={leaveRoom}
          className="text-xs text-slate-400 hover:text-rose-300 font-medium px-4 py-2 rounded-xl bg-slate-900/60 border border-white/10 transition-colors flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Leave Room</span>
        </button>
      </div>

      {/* Result Modal Overlay when Game Ends */}
      {isEnded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <GlassCard className="w-full max-w-md relative overflow-hidden flex flex-col gap-6 shadow-2xl text-center">
            <div className="flex flex-col items-center text-center gap-2">
              {isWinner || isForfeit ? (
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/20 animate-bounce">
                  <Trophy className="w-9 h-9" />
                </div>
              ) : isDraw ? (
                <div className="w-16 h-16 rounded-2xl bg-slate-500/20 border border-slate-400/40 flex items-center justify-center text-slate-300 shadow-xl">
                  <Equal className="w-9 h-9" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-300 shadow-xl">
                  <Frown className="w-9 h-9" />
                </div>
              )}

              <h2 className="text-3xl font-extrabold tracking-tight text-white mt-1">
                {isForfeit || isWinner ? 'YOU WON!' : isDraw ? "IT'S A DRAW!" : 'YOU LOST'}
              </h2>

              {isForfeit ? (
                <p className="text-xs text-slate-300 mt-1">
                  Opponent left the game. You win by forfeit!
                </p>
              ) : (
                <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
                  Final Box Score
                </p>
              )}
            </div>

            {!isForfeit && (
              <div className="p-4 rounded-2xl flex items-center justify-around bg-slate-900/60 border border-white/10">
                <div className="flex flex-col items-center">
                  <span className="text-xs font-semibold text-slate-300">YOU</span>
                  <span className="text-3xl font-extrabold text-sky-400 font-mono mt-1">
                    {myScore}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest">BOXES</span>
                </div>

                <div className="text-slate-500 font-extrabold text-sm">VS</div>

                <div className="flex flex-col items-center">
                  <span className="text-xs font-semibold text-slate-300">
                    {opponent?.nickname || 'OPPONENT'}
                  </span>
                  <span className="text-3xl font-extrabold text-amber-400 font-mono mt-1">
                    {opponentScore}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest">BOXES</span>
                </div>
              </div>
            )}

            {!isForfeit && rematchRequestedByOpponent && (
              <div className="text-center py-2 px-3 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-medium animate-pulse">
                Opponent requested a Dots & Boxes rematch! Click Play Again to accept.
              </div>
            )}

            <div className="flex flex-col gap-3">
              {!isForfeit && (
                <GlassButton
                  type="button"
                  variant="primary"
                  fullWidth
                  onClick={requestDotsRematch}
                  disabled={rematchRequestedByMe}
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{rematchRequestedByMe ? 'Waiting for opponent...' : 'Play Dots Again'}</span>
                </GlassButton>
              )}

              <GlassButton
                type="button"
                variant="secondary"
                fullWidth
                onClick={returnToLobby}
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Return to Common Lobby</span>
              </GlassButton>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};
