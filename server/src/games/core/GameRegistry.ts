import { GameType } from '../../../../shared/types';
import { IGameEngine } from './IGameEngine';
import { BingoEngine } from '../bingo/BingoEngine';
import { DotsEngine } from '../dots/DotsEngine';

export type GameEngineConstructor = new (roomId: string, playerIds: string[]) => IGameEngine;

export class GameRegistry {
  private static registry = new Map<GameType, GameEngineConstructor>();

  public static register(type: GameType, constructorClass: GameEngineConstructor): void {
    this.registry.set(type, constructorClass);
  }

  public static create(type: GameType, roomId: string, playerIds: string[]): IGameEngine {
    const ConstructorClass = this.registry.get(type);
    if (!ConstructorClass) {
      throw new Error(`No game engine registered for type '${type}'`);
    }
    const engine = new ConstructorClass(roomId, playerIds);
    engine.init(playerIds);
    return engine;
  }

  public static isRegistered(type: GameType): boolean {
    return this.registry.has(type);
  }
}

// Auto-register built-in games
GameRegistry.register('bingo', BingoEngine);
GameRegistry.register('dots', DotsEngine);
