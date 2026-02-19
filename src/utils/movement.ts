import { GAME_CONFIG } from '../config/gameConfig';
import type { GridPosition } from '../types';

export function gridToWorld(gridX: number, gridY: number): [number, number, number] {
  return [gridX * GAME_CONFIG.GRID_SIZE, 0, gridY * GAME_CONFIG.GRID_SIZE];
}

export function worldToGrid(worldX: number, worldZ: number): GridPosition {
  return {
    x: Math.round(worldX / GAME_CONFIG.GRID_SIZE),
    y: Math.round(worldZ / GAME_CONFIG.GRID_SIZE),
  };
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export function gridDistance(a: GridPosition, b: GridPosition): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function manhattanDistance(a: GridPosition, b: GridPosition): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}
