import type { GridPosition } from '../types';
import { getValidNeighbors } from './collision';
import { manhattanDistance } from './movement';

interface PathNode {
  position: GridPosition;
  g: number;
  h: number;
  f: number;
  parent: PathNode | null;
}

const pathCache = new Map<string, GridPosition[]>();

function getCacheKey(start: GridPosition, goal: GridPosition): string {
  return `${start.x},${start.y},${goal.x},${goal.y}`;
}

export function clearPathCache(): void {
  pathCache.clear();
}

export function findPath(
  start: GridPosition,
  goal: GridPosition,
  mazeGrid: number[][],
  useCache = true
): GridPosition[] {
  const cacheKey = getCacheKey(start, goal);
  if (useCache && pathCache.has(cacheKey)) {
    return pathCache.get(cacheKey)!;
  }

  const openList: PathNode[] = [];
  const closedSet = new Set<string>();

  const startNode: PathNode = {
    position: start,
    g: 0,
    h: manhattanDistance(start, goal),
    f: manhattanDistance(start, goal),
    parent: null,
  };

  openList.push(startNode);

  while (openList.length > 0) {
    // Find node with lowest f score
    let lowestIdx = 0;
    for (let i = 1; i < openList.length; i++) {
      if (openList[i].f < openList[lowestIdx].f) {
        lowestIdx = i;
      }
    }

    const current = openList[lowestIdx];
    const currentKey = `${current.position.x},${current.position.y}`;

    // Goal reached
    if (current.position.x === goal.x && current.position.y === goal.y) {
      const path: GridPosition[] = [];
      let node: PathNode | null = current;
      while (node) {
        path.unshift(node.position);
        node = node.parent;
      }
      if (useCache) {
        pathCache.set(cacheKey, path);
      }
      return path;
    }

    // Move current to closed set
    openList.splice(lowestIdx, 1);
    closedSet.add(currentKey);

    // Check neighbors
    const neighbors = getValidNeighbors(current.position.x, current.position.y, mazeGrid);
    for (const neighbor of neighbors) {
      const neighborKey = `${neighbor.x},${neighbor.y}`;
      if (closedSet.has(neighborKey)) continue;

      const g = current.g + 1;
      const h = manhattanDistance(neighbor, goal);
      const f = g + h;

      const existingIdx = openList.findIndex(
        (n) => n.position.x === neighbor.x && n.position.y === neighbor.y
      );

      if (existingIdx !== -1) {
        if (g < openList[existingIdx].g) {
          openList[existingIdx].g = g;
          openList[existingIdx].f = f;
          openList[existingIdx].parent = current;
        }
      } else {
        openList.push({
          position: neighbor,
          g,
          h,
          f,
          parent: current,
        });
      }
    }
  }

  // No path found
  return [];
}

export function findFurthestPoint(
  from: GridPosition,
  awayFrom: GridPosition,
  mazeGrid: number[][],
  radius: number = 10
): GridPosition {
  let bestPos = from;
  let bestDist = 0;

  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const x = from.x + dx;
      const y = from.y + dy;
      if (y < 0 || y >= mazeGrid.length || x < 0 || x >= mazeGrid[0].length) continue;
      if (mazeGrid[y][x] !== 0) continue;

      const dist = manhattanDistance({ x, y }, awayFrom);
      if (dist > bestDist) {
        const path = findPath(from, { x, y }, mazeGrid, false);
        if (path.length > 0 && path.length < radius * 2) {
          bestDist = dist;
          bestPos = { x, y };
        }
      }
    }
  }

  return bestPos;
}
