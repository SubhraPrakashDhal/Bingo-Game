import React from 'react';
import { GameType } from '../../../shared/types';
import { GameScreen } from '../components/screens/GameScreen';
import { DotsGameScreen } from '../components/dots/DotsGameScreen';
import { getGameById } from './registry/gameDefinitions';
import { useBingoSocket } from '../context/SocketContext';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { Sparkles, ArrowLeft } from 'lucide-react';

const GAME_COMPONENTS: Partial<Record<GameType, React.ComponentType>> = {
  bingo: GameScreen,
  dots: DotsGameScreen,
};

export const ActiveGameRenderer: React.FC<{ gameType: GameType }> = ({ gameType }) => {
  const { returnToLobby } = useBingoSocket();
  const Component = GAME_COMPONENTS[gameType];

  if (!Component) {
    const gameDef = getGameById(gameType);
    const Icon = gameDef.icon;
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 max-w-lg mx-auto text-center">
        <GlassCard className="w-full p-8 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-bold text-3xl text-white mb-4 shadow-xl shadow-blue-500/20">
            <Icon className="w-8 h-8 text-white" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>FEATURED GAME IN DEVELOPMENT</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-2">{gameDef.name}</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            {gameDef.description}. This game module is currently being finalized. Please select Bingo or Dots & Boxes to play a full match right now!
          </p>
          <GlassButton type="button" onClick={returnToLobby} className="w-full flex items-center justify-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Lobby</span>
          </GlassButton>
        </GlassCard>
      </div>
    );
  }

  return <Component />;
};
