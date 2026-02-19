export const GameStatus = {
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'game_over',
  VICTORY: 'victory',
  LEVEL_TRANSITION: 'level_transition',
} as const;
export type GameStatus = typeof GameStatus[keyof typeof GameStatus];

export type AbilityType = 'vibe' | 'tokenBurner' | 'debug';

export interface GameState {
  status: GameStatus;
  currentLevel: number;
  score: number;
  timer: number;
  abilities: {
    vibe: boolean;
    tokenBurner: boolean;
    debug: boolean;
  };
  activeAbility: AbilityType | null;
  abilityEndTime: number | null;
  pillsSaved: number;
  pillsEatenByEnemy: number;
}

export interface MazeData {
  width: number;
  height: number;
  grid: number[][];
  spawnPoints: {
    player: { x: number; y: number };
    enemy: { x: number; y: number };
    collectibles: { x: number; y: number }[];
  };
}

export interface EnemyConfig {
  type: EnemyType;
  color: string;
  speed: number;
  intelligence: number;
  behaviorParams: Record<string, number | boolean>;
}

export type EnemyType = 'cursor' | 'antigravity' | 'codex' | 'claude' | 'vscode';

export interface GridPosition {
  x: number;
  y: number;
}

export interface Collectible {
  id: string;
  type: AbilityType;
  position: GridPosition;
  collected: boolean;
}

export const SoundType = {
  EAT: 'eat',
  PILL_EAT: 'pill_eat',
  ABILITY_ACTIVATE: 'ability_activate',
  COLLECTIBLE_PICKUP: 'collectible_pickup',
  LEVEL_COMPLETE: 'level_complete',
  GAME_OVER: 'game_over',
  ENEMY_DEATH: 'enemy_death',
  VICTORY: 'victory',
} as const;
export type SoundType = typeof SoundType[keyof typeof SoundType];

export const MusicType = {
  BACKGROUND: 'background',
  VIBE: 'vibe',
  TURBO: 'turbo',
  MENU: 'menu',
  VICTORY: 'victory',
} as const;
export type MusicType = typeof MusicType[keyof typeof MusicType];
