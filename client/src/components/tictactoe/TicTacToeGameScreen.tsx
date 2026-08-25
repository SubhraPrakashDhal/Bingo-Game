import React from 'react';
import { useBingoSocket } from '../../context/SocketContext';
import { TicTacToeHeader } from './TicTacToeHeader';
import { TicTacToeBoard } from './TicTacToeBoard';
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import { Trophy, Frown, Equal, RotateCcw, LayoutGrid, LogOut } from 'lucide-react';

export const TicTacToeGameScreen: React.FC = () => {
  const {
    roomState,
    playerId,
    makeTicTacToeMove,
    requestTicTacToeRematch,
    returnToLobby,
    leaveRoom,
  } = useBingoSocket();

  if (!roomState || !roomState.ticTacToeState) return null;

  const ticTacToeState = roomState.ticTacToeState;

  const opponent = roomState.players.find((p) => p.id !== playerId);
  const isOpponentMissing = !opponent || roomState.players.length < 2;

  const isEnded =
    (roomState.stage === 'TICTACTOE_ENDED' || ticTacToeState.winnerId !== null) &&
    !isOpponentMissing &&
    ticTacToeState.forfeitReason !== 'opponent_left';

  const isWinner = ticTacToeState.winnerId === playerId;
  const isDraw = ticTacToeState.winnerId === 'draw';
  const isForfeit = ticTacToeState.forfeitReason === 'opponent_left';

  const rematchRequestedByMe = ticTacToeState.rematchRequestedBy === playerId;
  const rematchRequestedByOpponent =
    ticTacToeState.rematchRequestedBy && ticTacToeState.rematchRequestedBy !== playerId;

  const handleMakeMove = (cellIndex: number) => {
    makeTicTacToeMove(cellIndex);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-between gap-4 w-full my-auto py-4 px-2">
      {/* Header */}
      <TicTacToeHeader roomState={roomState} myPlayerId={playerId} />

      {/* 3x3 Board */}
      <TicTacToeBoard
        ticTacToeState={ticTacToeState}
        myPlayerId={playerId}
        onMakeMove={handleMakeMove}
      />

      {/* Bottom Controls */}
      <div className="pb-2 flex gap-5">
        <button
          type="button"
          onClick={returnToLobby}
          className="text-xs text-slate-300 hover:text-blue-300 font-medium px-4 py-3 rounded-xl bg-slate-900/60 border border-white/10 transition-colors flex items-center gap-1.5"
        >
          <LayoutGrid size={16} />
          <span>Return to Common Lobby</span>
        </button>

        <button
          type="button"
          onClick={leaveRoom}
          className="text-xs text-slate-400 hover:text-rose-300 font-medium px-4 py-3 rounded-xl bg-slate-900/60 border border-white/10 transition-colors flex items-center gap-1.5"
        >
          <LogOut size={16} />
          <span>Leave Room</span>
        </button>
      </div>

      {/* Result Modal Overlay */}
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
              ) : isWinner ? (
                <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">
                  Congratulations! 3 in a row!
                </p>
              ) : isDraw ? (
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  Well played! All cells filled.
                </p>
              ) : (
                <p className="text-xs text-rose-400 font-semibold uppercase tracking-wider">
                  Better luck next match!
                </p>
              )}
            </div>

            {!isForfeit && rematchRequestedByOpponent && (
              <div className="text-center py-2 px-3 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-medium animate-pulse">
                Opponent requested a Tic-Tac-Toe rematch! Click Play Again to accept.
              </div>
            )}

            <div className="flex flex-col gap-3">
              {!isForfeit && (
                <GlassButton
                  type="button"
                  variant="primary"
                  fullWidth
                  onClick={requestTicTacToeRematch}
                  disabled={rematchRequestedByMe}
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>
                    {rematchRequestedByMe ? 'Waiting for opponent...' : 'Play Tic-Tac-Toe Again'}
                  </span>
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
