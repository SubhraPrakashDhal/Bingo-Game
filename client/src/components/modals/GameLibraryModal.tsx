import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GameDefinition, AVAILABLE_GAMES } from '../../games/registry/gameDefinitions';
import { GameType } from '../../../../shared/types';
import { Badge } from '../ui/Badge';
import { Search, X, Gamepad2, Check, Sparkles, Filter, Clock, Lock, Play } from 'lucide-react';

interface GameLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGameId: GameType | null;
  onSelectGame: (gameId: GameType) => void;
  isHost: boolean;
}

const ALPHABET = ['ALL', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

export const GameLibraryModal: React.FC<GameLibraryModalProps> = ({
  isOpen,
  onClose,
  selectedGameId,
  onSelectGame,
  isHost,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PLAYABLE' | 'COMING_SOON'>('ALL');
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus trap & Escape key listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    setTimeout(() => searchInputRef.current?.focus(), 100);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Compute available letters from game names
  const availableLetters = useMemo(() => {
    const letters = new Set<string>();
    AVAILABLE_GAMES.forEach((g) => {
      const firstChar = g.name.trim().charAt(0).toUpperCase();
      if (/[A-Z]/.test(firstChar)) {
        letters.add(firstChar);
      }
    });
    return letters;
  }, []);

  const playableCount = useMemo(() => AVAILABLE_GAMES.filter((g) => g.isImplemented).length, []);
  const comingSoonCount = useMemo(() => AVAILABLE_GAMES.filter((g) => !g.isImplemented).length, []);

  // Filter & sort games
  const filteredGames = useMemo(() => {
    return AVAILABLE_GAMES.filter((game) => {
      // 1. Search Query Filter
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        game.name.toLowerCase().includes(query) ||
        game.description.toLowerCase().includes(query) ||
        (game.category && game.category.toLowerCase().includes(query));

      // 2. Letter Filter
      const firstLetter = game.name.trim().charAt(0).toUpperCase();
      const matchesLetter = selectedLetter === 'ALL' || firstLetter === selectedLetter;

      // 3. Status Filter
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'PLAYABLE' && game.isImplemented) ||
        (statusFilter === 'COMING_SOON' && !game.isImplemented);

      return matchesSearch && matchesLetter && matchesStatus;
    }).sort((a, b) => {
      // Always show implemented (playable) games first
      if (a.isImplemented && !b.isImplemented) return -1;
      if (!a.isImplemented && b.isImplemented) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [searchQuery, selectedLetter, statusFilter]);

  if (!isOpen) return null;

  const handleGameClick = (game: GameDefinition) => {
    if (!isHost || !game.isImplemented) return;
    onSelectGame(game.id);
    onClose();
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedLetter('ALL');
    setStatusFilter('ALL');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/80 backdrop-blur-md transition-all duration-300 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="library-modal-title"
    >
      {/* Modal Card Box */}
      <div
        ref={modalRef}
        className="w-full max-w-4xl max-h-[90vh] bg-slate-900/95 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col backdrop-blur-xl relative"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between gap-4 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 id="library-modal-title" className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                Game Library
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h2>
              <p className="text-xs text-slate-400 hidden sm:block">
                Choose a playable game to update the lobby. Featured upcoming games are marked as Coming Soon.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 border border-white/10 text-slate-300 hover:text-white transition-all duration-150 active:scale-95 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter Tabs Bar */}
        <div className="p-3 sm:p-4 bg-slate-950/40 border-b border-white/5 space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by game name, description, or category (e.g. Chess, Board, Strategy)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-900/90 border border-white/10 rounded-xl text-white placeholder-slate-500 text-xs sm:text-sm outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Status Tabs */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-900/80 p-1 rounded-xl border border-white/10 shrink-0">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === 'ALL'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({AVAILABLE_GAMES.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('PLAYABLE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  statusFilter === 'PLAYABLE'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-emerald-400/80 hover:text-emerald-300'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Playable ({playableCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('COMING_SOON')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  statusFilter === 'COMING_SOON'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-amber-400/80 hover:text-amber-300'
                }`}
              >
                <Clock className="w-3 h-3" />
                Soon ({comingSoonCount})
              </button>
            </div>
          </div>
        </div>

        {/* Main Body (Sidebar A-Z + Scrollable Grid) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-[350px]">
          {/* A-Z Letter Filter Sidebar / Horizontal Scroll on Mobile */}
          <div className="w-full md:w-20 bg-slate-950/60 border-b md:border-b-0 md:border-r border-white/5 p-2 flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto shrink-0 scrollbar-thin">
            {ALPHABET.map((letter) => {
              const isActive = selectedLetter === letter;
              const hasGames = letter === 'ALL' || availableLetters.has(letter);

              return (
                <button
                  key={letter}
                  type="button"
                  disabled={!hasGames && letter !== 'ALL'}
                  onClick={() => setSelectedLetter(letter)}
                  className={`px-2.5 py-1.5 md:py-1 rounded-lg text-[11px] font-bold transition-all duration-150 shrink-0 text-center ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                      : hasGames
                      ? 'text-slate-300 hover:bg-white/10 hover:text-white'
                      : 'text-slate-600 cursor-not-allowed opacity-40'
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>

          {/* Scrollable Games Grid */}
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto scrollbar-thin max-h-[60vh] md:max-h-none">
            {filteredGames.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredGames.map((game) => {
                  const isSelected = selectedGameId === game.id;
                  const isPlayable = !!game.isImplemented;
                  const Icon = game.icon;

                  return (
                    <div
                      key={game.id}
                      role="button"
                      tabIndex={isHost && isPlayable ? 0 : -1}
                      onClick={() => handleGameClick(game)}
                      onKeyDown={(e) => {
                        if ((e.key === 'Enter' || e.key === ' ') && isHost && isPlayable) {
                          e.preventDefault();
                          handleGameClick(game);
                        }
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition-all duration-300 flex flex-col justify-between select-none relative group overflow-hidden ${
                        isPlayable
                          ? isHost
                            ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]'
                            : 'cursor-default'
                          : 'cursor-not-allowed opacity-65 grayscale-[30%]'
                      } ${
                        isSelected
                          ? `bg-gradient-to-br ${game.bgGradient} ${game.activeBorder} shadow-xl ring-1 ${game.ringColor}`
                          : isPlayable
                          ? `bg-slate-900/60 hover:bg-slate-800/80 ${game.borderColor} opacity-90 hover:opacity-100 hover:shadow-lg`
                          : 'bg-slate-950/40 border-white/5'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <div
                            className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-base transition-transform ${
                              isPlayable ? 'group-hover:scale-110' : ''
                            } ${game.iconBg}`}
                          >
                            <Icon className={`w-5 h-5 ${game.iconColor}`} />
                          </div>

                          <div className="flex items-center gap-1.5">
                            {isSelected ? (
                              <Badge variant={game.badgeVariant} className="text-[10px] flex items-center gap-1 font-bold">
                                <Check className="w-3 h-3" />
                                <span>Selected</span>
                              </Badge>
                            ) : isPlayable ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                                <Play className="w-2.5 h-2.5 fill-emerald-400" />
                                Playable
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-bold flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Coming Soon
                              </span>
                            )}
                          </div>
                        </div>

                        <h3 className={`font-extrabold text-sm tracking-tight transition-colors ${
                          isPlayable ? 'text-white group-hover:text-blue-300' : 'text-slate-300'
                        }`}>
                          {game.name}
                        </h3>
                        <p className="text-slate-400 text-xs mt-1 leading-snug line-clamp-2">{game.description}</p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                        {isPlayable ? (
                          <>
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Playable Now
                            </span>
                            {isHost && (
                              <span className="text-blue-400 font-bold group-hover:underline">
                                {isSelected ? 'Currently Selected' : 'Select Game →'}
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <span className="text-slate-500 font-medium flex items-center gap-1">
                              <Lock className="w-3 h-3 text-slate-500" />
                              Not Available Yet
                            </span>
                            <span className="text-amber-400/80 font-bold italic">
                              Coming Soon
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Empty State */
              <div className="h-full min-h-[250px] flex flex-col items-center justify-center text-center p-6">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-white/10 flex items-center justify-center text-slate-400 mb-3">
                  <Filter className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white mb-1">No Matching Games Found</h4>
                <p className="text-xs text-slate-400 max-w-xs mb-4">
                  We couldn't find any games matching your current filters.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-950/70 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>
            Playable Games: <strong className="text-emerald-400">{playableCount}</strong> | Coming Soon: <strong className="text-amber-400">{comingSoonCount}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
