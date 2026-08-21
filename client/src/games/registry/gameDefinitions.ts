import { GameType } from '../../../../shared/types';

export interface GameDefinition {
  id: GameType;
  name: string;
  description: string;
  icon: string;
  themeColor: 'blue' | 'purple' | 'emerald' | 'amber';
}

export const AVAILABLE_GAMES: GameDefinition[] = [
  {
    id: 'bingo',
    name: 'BINGO',
    description: 'Classic 5×5 line-completing game',
    icon: '🎱',
    themeColor: 'blue',
  },
  {
    id: 'dots',
    name: 'DOTS & BOXES',
    description: 'Complete boxes and control the board',
    icon: '⬡',
    themeColor: 'purple',
  },
];
