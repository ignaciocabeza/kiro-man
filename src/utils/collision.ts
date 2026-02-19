import type { GridPosition } from '../types';

export function isWalkable(x: number, y: number, mazeGrid: number[][]): boolean {
  if (y < 0 || y >= mazeGrid.length) return false;
  if (x < 0 || x >= mazeGrid[0].length) return false;
  return mazeGrid[y][x] === 0;
}

export function getValidNeighbors(x: number, y: number, mazeGrid: number[][]): GridPosition[] {
  const neighbors: GridPosition[] = [];
  const directions = [
    { x: 0, y: -1 }, // up
    { x: 0, y: 1 },  // down
    { x: -1, y: 0 }, // left
    { x: 1, y: 0 },  // right
  ];

  for (const dir of directions) {
    const nx = x + dir.x;
    const ny = y + dir.y;
    if (isWalkable(nx, ny, mazeGrid)) {
      neighbors.push({ x: nx, y: ny });
    }
  }

  return neighbors;
}
