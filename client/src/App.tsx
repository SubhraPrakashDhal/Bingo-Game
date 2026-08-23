import React from 'react';
import { SocketProvider, useBingoSocket } from './context/SocketContext';
import { WelcomeScreen } from './components/screens/WelcomeScreen';
import { LobbyScreen } from './components/screens/LobbyScreen';
import { SetupBoardScreen } from './components/screens/SetupBoardScreen';
import { TossScreen } from './components/screens/TossScreen';
import { ActiveGameRenderer } from './games/GameRegistry';
import { GameChat } from './components/shared/GameChat';
import { VoiceChat } from './components/shared/VoiceChat';
import { PlayerLeftModal } from './components/screens/PlayerLeftModal';
import { Wifi, WifiOff, LogOut, X, Gamepad2, Github, Instagram, Linkedin } from 'lucide-react';

const MainContent: React.FC = () => {
  const { roomState, isConnected, isReconnecting, isRestoringSession, errorMessage, clearErrorMessage, endSession } = useBingoSocket();

  const renderCurrentScreen = () => {
    if (!roomState) {
      if (isRestoringSession) {
        return (
          <div className="flex-1 min-h-[calc(100vh-57px)] flex flex-col items-center justify-center p-4">
            <div className="glass-panel p-8 rounded-3xl border border-white/10 text-center max-w-md shadow-2xl bg-slate-950/80 backdrop-blur-xl">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 animate-spin">
                <Wifi className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Restoring Game Session...</h3>
              <p className="text-xs text-slate-400">Reconnecting to your room. Please wait a moment.</p>
            </div>
          </div>
        );
      }
      return <WelcomeScreen />;
    }

    switch (roomState.stage) {
      case 'WELCOME':
        return <WelcomeScreen />;
      case 'LOBBY':
        return <LobbyScreen />;
      case 'BOARD_SETUP':
        return <SetupBoardScreen />;
      case 'TOSS':
        return <TossScreen />;
      case 'PLAYING':
      case 'GAME_OVER':
      case 'DOTS_PLAYING':
      case 'DOTS_ENDED':
        return roomState.selectedGame ? (
          <ActiveGameRenderer gameType={roomState.selectedGame} />
        ) : (
          <WelcomeScreen />
        );
      default:
        return <WelcomeScreen />;
    }
  };

  const isGameplayActive =
    roomState &&
    roomState.stage !== 'WELCOME' &&
    roomState.stage !== 'LOBBY';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navbar */}
      <header className="w-full border-b border-white/5 bg-slate-950/40 backdrop-blur-md px-4 py-3 shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-black text-white text-sm shadow-md shadow-blue-500/20">
              <Gamepad2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-sm md:text-base tracking-tight text-white">
              GAMES <span className="text-blue-400 font-normal">PRIVATE</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isConnected ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <Wifi className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Connected</span>
              </div>
            ) : isReconnecting ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium animate-pulse">
                <WifiOff className="w-3.5 h-3.5" />
                <span>Reconnecting to game...</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium animate-pulse">
                <WifiOff className="w-3.5 h-3.5" />
                <span>Connecting...</span>
              </div>
            )}

            {roomState && (
              <button
                type="button"
                onClick={endSession}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-rose-200 text-xs font-semibold transition-all duration-150 shadow-sm active:scale-95 cursor-pointer"
                title="End session and return to Welcome Screen"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>End Session</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Error Toast */}
      {errorMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce max-w-sm">
          <div className="glass-panel p-4 rounded-xl border border-rose-500/40 bg-slate-950/90 text-rose-300 text-xs flex items-center justify-between gap-3 shadow-2xl">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={clearErrorMessage}
              className="p-1 rounded-lg hover:bg-rose-500/20 text-rose-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Player Disconnected / Left Modal */}
      <PlayerLeftModal />

      {/* Shared In-Game Glass Chat Overlay */}
      {isGameplayActive && <GameChat />}

      {/* Real-Time P2P Voice Chat Controls (Lobby & Gameplay) */}
      <VoiceChat />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col">{renderCurrentScreen()}</main>

      {/* Footer */}
<footer className="relative w-full border-t border-white/[0.06] bg-slate-950/80 px-4 py-6 backdrop-blur-md">
  {/* Top glow */}
  <div className="pointer-events-none absolute inset-x-0 -top-px mx-auto h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

  <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 sm:flex-row">
    {/* Left - Platform Info */}
    <div className="flex flex-col items-center gap-1.5 sm:items-start">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />

        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          GAMES PRIVATE
        </span>

        <span className="text-slate-700">•</span>

        <span className="text-[10px] uppercase tracking-[0.12em] text-slate-500">
          Real-Time 2-Player Platform
        </span>
      </div>

      <span className="text-[10px] text-slate-600">
        Powered by Socket.IO • Real-Time Sync
      </span>
    </div>

    {/* Social Links */}
    <div className="flex items-center gap-2">
      {/* GitHub */}
      <a
        href="https://github.com/SubhraPrakashDhal"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GitHub"
        className="group flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-slate-500 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.08] hover:text-white"
      >
        <Github className="h-4 w-4 transition-transform group-hover:scale-110" />
      </a>

      {/* Instagram */}
      <a
        href="https://instagram.com/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram"
        className="group flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-slate-500 transition-all duration-200 hover:-translate-y-0.5 hover:border-pink-500/30 hover:bg-pink-500/10 hover:text-pink-400"
      >
        <Instagram className="h-4 w-4 transition-transform group-hover:scale-110" />
      </a>

      {/* LinkedIn */}
      <a
        href="https://linkedin.com/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="LinkedIn"
        className="group flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-slate-500 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-400"
      >
        <Linkedin className="h-4 w-4 transition-transform group-hover:scale-110" />
      </a>

      {/* X */}
      <a
        href="https://x.com/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="X"
        className="group flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-slate-500 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
      >
        <span className="text-sm font-semibold transition-transform group-hover:scale-110">
          𝕏
        </span>
      </a>
    </div>
  </div>

  {/* Bottom */}
  <div className="mx-auto mt-5 flex max-w-7xl flex-col items-center justify-center gap-1 border-t border-white/[0.04] pt-4 text-center">
    <p className="text-[10px] text-slate-600">
      Designed & Developed by
    </p>

    <a
      href="https://github.com/SubhraPrakashDhal"
      target="_blank"
      rel="noopener noreferrer"
      className="text-[11px] font-semibold tracking-wide text-slate-400 transition-colors hover:text-blue-400"
    >
      SUBHRA PRAKASH DHAL
    </a>

    <p className="mt-1 text-[9px] uppercase tracking-[0.2em] text-slate-700">
      © {new Date().getFullYear()} Games Private
    </p>
  </div>
</footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <SocketProvider>
      <MainContent />
    </SocketProvider>
  );
};

export default App;
