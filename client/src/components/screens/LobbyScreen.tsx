import React, { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import { Badge } from '../ui/Badge';
import { useBingoSocket } from '../../context/SocketContext';
import { copyToClipboard } from '../../utils/clipboard';
import { Copy, Check, Crown, LogOut, Sparkles, Play } from 'lucide-react';
import { GameType } from '../../../../shared/types';
import { AVAILABLE_GAMES } from '../../games/registry/gameDefinitions';

export const LobbyScreen: React.FC = () => {
  const { roomState, selectGame, startGame, leaveRoom } = useBingoSocket();
  const [copied, setCopied] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  if (!roomState) return null;

  const me =
    roomState.players.find((p) => p.id === roomState.myPlayerId || p.id === roomState.mySocketId) ||
    (roomState.players.length === 1 ? roomState.players[0] : undefined);
  const opponent = roomState.players.find((p) => p.id !== me?.id);
  const isHost = me ? me.isHost : (roomState.players.length === 1 || roomState.players[0]?.id === roomState.myPlayerId);

  const selectedGameDef = AVAILABLE_GAMES.find((g) => g.id === roomState.selectedGame);

  const handleCopyCode = async () => {
    const success = await copyToClipboard(roomState.roomId);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSelectGame = async (game: GameType) => {
    if (!isHost) return;
    await selectGame(game);
  };

  const handleStartGame = async () => {
    if (!isHost || roomState.players.length < 2 || !roomState.selectedGame) return;
    setIsStarting(true);
    await startGame();
    setIsStarting(false);
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-4 max-w-xl mx-auto">
      <GlassCard className="w-full text-center">
        {/* Header */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>GAMES PRIVATE LOBBY</span>
        </div>

        <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
          Private Game Room
        </h2>
        <p className="text-slate-400 text-xs md:text-sm mb-6">
          {isHost
            ? 'Invite your opponent, select a game below, and start the match.'
            : 'Waiting for host to choose a game and start the match.'}
        </p>

        {/* Room Code Banner */}
        <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-4 mb-6 flex items-center justify-between shadow-inner">
          <div className="text-left">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Private Room Code
            </span>
            <span className="text-2xl md:text-3xl font-mono font-extrabold tracking-widest text-blue-400">
              {roomState.roomId}
            </span>
          </div>

          <GlassButton
            type="button"
            variant="secondary"
            onClick={handleCopyCode}
            className="!px-4 !py-2.5 text-xs"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Code</span>
              </>
            )}
          </GlassButton>
        </div>

        {/* Players Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {/* My Card */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-blue-500/30 text-left relative overflow-hidden">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-blue-400 font-bold uppercase tracking-wider flex items-center gap-1">
                You
                {me?.isHost && <Crown className="w-3.5 h-3.5 text-amber-400 inline" />}
              </span>
              <Badge variant="emerald" className="text-[10px]">Connected</Badge>
            </div>
            <div className="text-base font-bold text-white truncate">{me?.nickname || 'You'}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{me?.isHost ? 'HOST' : 'PLAYER 2'}</div>
          </div>

          {/* Opponent Card */}
          <div
            className={`p-3.5 rounded-xl border text-left transition-all ${
              opponent
                ? 'bg-slate-900/60 border-purple-500/30'
                : 'bg-slate-900/30 border-white/5 border-dashed flex flex-col items-center justify-center text-center py-4'
            }`}
          >
            {opponent ? (
              <>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-purple-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    Opponent
                    {opponent.isHost && <Crown className="w-3.5 h-3.5 text-amber-400 inline" />}
                  </span>
                  <Badge variant="emerald" className="text-[10px]">Connected</Badge>
                </div>
                <div className="text-base font-bold text-white truncate">{opponent.nickname}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{opponent.isHost ? 'HOST' : 'PLAYER 2'}</div>
              </>
            ) : (
              <div className="text-slate-500 text-xs space-y-1">
                <p className="font-medium text-slate-400 text-xs">Waiting for Player 2...</p>
                <p className="text-[10px]">Share code <span className="font-mono text-blue-400">{roomState.roomId}</span></p>
              </div>
            )}
          </div>
        </div>

        {/* Compact Game Selection Cards */}
        <div className="mb-6 text-left">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Choose a Game
            </span>
            {!isHost && (
              <span className="text-[11px] text-amber-400 font-medium">
                {selectedGameDef
                  ? `Host selected: ${selectedGameDef.name}`
                  : 'Host is choosing...'}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {AVAILABLE_GAMES.map((gameDef) => {
              const isSelected = roomState.selectedGame === gameDef.id;
              const isBlue = gameDef.themeColor === 'blue';

              return (
                <div
                  key={gameDef.id}
                  role="button"
                  tabIndex={isHost ? 0 : -1}
                  onClick={() => handleSelectGame(gameDef.id)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && isHost) {
                      e.preventDefault();
                      handleSelectGame(gameDef.id);
                    }
                  }}
                  className={`p-4 rounded-xl border text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 select-none ${
                    isHost ? 'cursor-pointer hover:border-blue-400/80 active:scale-[0.98]' : 'cursor-default'
                  } ${
                    isSelected
                      ? isBlue
                        ? 'bg-gradient-to-br from-blue-900/40 to-slate-900 border-blue-500 shadow-lg shadow-blue-500/20 ring-1 ring-blue-500'
                        : 'bg-gradient-to-br from-purple-900/40 to-slate-900 border-purple-500 shadow-lg shadow-purple-500/20 ring-1 ring-purple-500'
                      : 'bg-slate-900/40 border-white/10 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`w-9 h-9 rounded-lg border flex items-center justify-center font-bold text-base ${
                        isBlue
                          ? 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                          : 'bg-purple-500/20 border-purple-500/30 text-purple-400'
                      }`}
                    >
                      {gameDef.icon}
                    </div>
                    {isSelected && (
                      <Badge variant={isBlue ? 'blue' : 'purple'} className="text-[10px]">
                        Selected
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-bold text-white text-sm">{gameDef.name}</h3>
                  <p className="text-slate-400 text-xs mt-0.5">{gameDef.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col md:flex-row gap-3">
          <GlassButton
            type="button"
            variant="ghost"
            onClick={leaveRoom}
            className="w-full md:w-auto"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            <span>Leave Room</span>
          </GlassButton>

          {isHost ? (
            <GlassButton
              type="button"
              variant="primary"
              onClick={handleStartGame}
              disabled={roomState.players.length < 2 || !roomState.selectedGame || isStarting}
              className="w-full flex-1 !bg-gradient-to-r !from-blue-600 !to-purple-600 hover:!from-blue-500 hover:!to-purple-500"
            >
              <Play className="w-4 h-4" />
              <span>{isStarting ? 'Starting Game...' : 'START GAME'}</span>
            </GlassButton>
          ) : (
            <div className="w-full flex-1 p-3 rounded-xl bg-slate-900/60 border border-white/10 text-slate-400 text-xs font-semibold flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
              <span>
                {roomState.selectedGame
                  ? `Waiting for Host to start ${roomState.selectedGame === 'bingo' ? 'Bingo' : 'Dots & Boxes'}...`
                  : 'Waiting for Host to select a game...'}
              </span>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};
