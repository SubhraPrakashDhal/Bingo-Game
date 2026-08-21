import React from 'react';
import { GameType } from '../../../shared/types';
import { GameScreen } from '../components/screens/GameScreen';
import { DotsGameScreen } from '../components/dots/DotsGameScreen';

const GAME_COMPONENTS: Record<GameType, React.ComponentType> = {
  bingo: GameScreen,
  dots: DotsGameScreen,
};

export const ActiveGameRenderer: React.FC<{ gameType: GameType }> = ({ gameType }) => {
  const Component = GAME_COMPONENTS[gameType];
  if (!Component) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
        <div className="glass-panel p-6 rounded-2xl border border-white/10 text-slate-300">
          <p className="text-sm font-semibold">Game type "{gameType}" component not registered.</p>
        </div>
      </div>
    );
  }
  return <Component />;
};
