import React, { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import { Badge } from '../ui/Badge';
import { useBingoSocket } from '../../context/SocketContext';
import { copyToClipboard } from '../../utils/clipboard';
import { Copy, Check, Crown, LogOut, Sparkles, Play, Library } from 'lucide-react';
import { GameType } from '../../../../shared/types';
import { AVAILABLE_GAMES, getGameById } from '../../games/registry/gameDefinitions';
import { GameLibraryModal } from '../modals/GameLibraryModal';

export const LobbyScreen: React.FC = () => {
  const { roomState, selectGame, startGame, leaveRoom } = useBingoSocket();
  const [copied, setCopied] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  if (!roomState) return null;

  const me =
    roomState.players.find((p) => p.id === roomState.myPlayerId || p.id === roomState.mySocketId) ||
    (roomState.players.length === 1 ? roomState.players[0] : undefined);
  const opponent = roomState.players.find((p) => p.id !== me?.id);
  const isHost = me ? me.isHost : (roomState.players.length === 1 || roomState.players[0]?.id === roomState.myPlayerId);

  const selectedGameDef = getGameById(roomState.selectedGame);

  // Compute the 2 visible main cards:
  // Card #1: Currently selected game (marked as Selected)
  // Card #2: Alternative game (if Card #1 is 'dots', use 'bingo', else default to 'dots')
  const currentSelectedId = roomState.selectedGame || 'bingo';
  const primarySelectedGame = getGameById(currentSelectedId);
  const alternativeGameId: GameType = currentSelectedId === 'dots' ? 'bingo' : 'dots';
  const alternativeGame = getGameById(alternativeGameId);

  const mainTwoCards = [primarySelectedGame, alternativeGame];

  const handleCopyCode = async () => {
    const success = await copyToClipboard(roomState.roomId);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSelectGame = async (game: GameType) => {
    if (!isHost) return;
    const gameDef = getGameById(game);
    if (!gameDef.isImplemented) return;
    await selectGame(game);
  };

  const handleStartGame = async () => {
    console.log('[GAME] Start clicked. isHost:', isHost, 'players:', roomState.players.length, 'selectedGame:', roomState.selectedGame);
    if (!isHost || roomState.players.length < 2 || !roomState.selectedGame) {
      console.warn('[GAME] Start game validation failed on client. isHost:', isHost, 'players:', roomState.players.length, 'selectedGame:', roomState.selectedGame);
      return;
    }
    setIsStarting(true);
    try {
      const res = await startGame();
      console.log('[GAME] handleStartGame completed res:', res);
    } catch (err) {
      console.error('[GAME] handleStartGame error:', err);
    } finally {
      setIsStarting(false);
    }
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

        {/* Main Game Selection Section: Exactly 2 visible cards + Choose Other Games action */}
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

          {/* Exactly Two Visible Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {mainTwoCards.map((gameDef) => {
              const isSelected = roomState.selectedGame === gameDef.id;
              const Icon = gameDef.icon;

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
                  className={`p-4 rounded-2xl border text-left transition-all duration-300 select-none relative group overflow-hidden ${
                    isHost ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : 'cursor-default'
                  } ${
                    isSelected
                      ? `bg-gradient-to-br ${gameDef.bgGradient} ${gameDef.activeBorder} shadow-xl ring-1 ${gameDef.ringColor}`
                      : `bg-slate-900/60 hover:bg-slate-800/80 ${gameDef.borderColor} opacity-85 hover:opacity-100 hover:shadow-lg`
                  }`}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <div
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-base transition-transform group-hover:scale-110 ${gameDef.iconBg}`}
                    >
                      <Icon className={`w-5 h-5 ${gameDef.iconColor}`} />
                    </div>
                    {isSelected && (
                      <Badge variant={gameDef.badgeVariant} className="text-[10px] font-bold">
                        ✓ Selected
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-extrabold text-white text-sm tracking-tight group-hover:text-blue-300 transition-colors">
                    {gameDef.name}
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5 line-clamp-1">{gameDef.description}</p>
                </div>
              );
            })}
          </div>

          {/* Choose Other Games Action */}
          <button
            type="button"
            onClick={() => setIsLibraryOpen(true)}
            className="w-full mt-3 p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-white/10 hover:border-blue-500/40 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-sm active:scale-[0.99] cursor-pointer group"
          >
            <Library className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
            <span>Choose Other Games</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold">
              {AVAILABLE_GAMES.length} Available
            </span>
          </button>
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
                  ? `Waiting for Host to start ${selectedGameDef?.name || roomState.selectedGame}...`
                  : 'Waiting for Host to select a game...'}
              </span>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Game Library Modal */}
      <GameLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        selectedGameId={roomState.selectedGame}
        onSelectGame={handleSelectGame}
        isHost={isHost}
      />
    </div>
  );
};
