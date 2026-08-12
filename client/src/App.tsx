import React from 'react';
import { SocketProvider, useBingoSocket } from './context/SocketContext';
import { WelcomeScreen } from './components/screens/WelcomeScreen';
import { LobbyScreen } from './components/screens/LobbyScreen';
import { SetupBoardScreen } from './components/screens/SetupBoardScreen';
import { TossScreen } from './components/screens/TossScreen';
import { GameScreen } from './components/screens/GameScreen';
import { PlayerLeftModal } from './components/screens/PlayerLeftModal';
import { Wifi, WifiOff, LogOut, X } from 'lucide-react';

const MainContent: React.FC = () => {
  const { roomState, isConnected, isReconnecting, errorMessage, clearErrorMessage, endSession } = useBingoSocket();

  const renderCurrentScreen = () => {
    if (!roomState) return <WelcomeScreen />;

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
        return <GameScreen />;
      default:
        return <WelcomeScreen />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="w-full border-b border-white/5 bg-slate-950/40 backdrop-blur-md px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-black text-white text-sm shadow-md shadow-blue-500/20">
              B
            </div>
            <span className="font-extrabold text-sm md:text-base tracking-tight text-white">
              BINGO <span className="text-blue-400 font-normal">PRIVATE</span>
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

      {/* Main View Area */}
      <main className="flex-1">{renderCurrentScreen()}</main>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 py-4 text-center text-slate-500 text-xs">
        <span>Authoritative Private 2-Player Bingo • Real-time Socket.IO Sync</span>
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
