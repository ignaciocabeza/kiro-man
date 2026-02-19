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

// --- Binary min-heap for O(log n) open-list operations ---
class MinHeap {
  private data: PathNode[] = [];

  get size() { return this.data.length; }

  push(node: PathNode) {
    this.data.push(node);
    this.bubbleUp(this.data.length - 1);
  }

  pop(): PathNode | undefined {
    if (this.data.length === 0) return undefined;
    const min = this.data[0];
    const last = this.data.pop()!;
    if (this.data.length > 0) {
      this.data[0] = last;
      this.sinkDown(0);
    }
    return min;
  }

  private bubbleUp(i: number) {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.data[i].f >= this.data[parent].f) break;
      [this.data[i], this.data[parent]] = [this.data[parent], this.data[i]];
      i = parent;
    }
  }

  private sinkDown(i: number) {
    const n = this.data.length;
    while (true) {
      let min = i;
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      if (l < n && this.data[l].f < this.data[min].f) min = l;
      if (r < n && this.data[r].f < this.data[min].f) min = r;
      if (min === i) break;
      [this.data[i], this.data[min]] = [this.data[min], this.data[i]];
      i = min;
    }
  }
}

// --- LRU cache with bounded size ---
const MAX_CACHE_SIZE = 500;
const pathCache = new Map<string, GridPosition[]>();

function getCacheKey(start: GridPosition, goal: GridPosition): string {
  return `${start.x},${start.y},${goal.x},${goal.y}`;
}

function addToCache(key: string, path: GridPosition[]) {
  if (pathCache.size >= MAX_CACHE_SIZE) {
    // Delete oldest entry (first key in Map iteration order)
    const firstKey = pathCache.keys().next().value;
    if (firstKey !== undefined) pathCache.delete(firstKey);
  }
  pathCache.set(key, path);
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

  const heap = new MinHeap();
  const closedSet = new Set<string>();
  const gScores = new Map<string, number>();

  const h = manhattanDistance(start, goal);
  const startNode: PathNode = {
    position: start,
    g: 0,
    h,
    f: h,
    parent: null,
  };

  heap.push(startNode);
  gScores.set(`${start.x},${start.y}`, 0);

  while (heap.size > 0) {
    const current = heap.pop()!;
    const currentKey = `${current.position.x},${current.position.y}`;

    // Skip if already visited via a better path
    if (closedSet.has(currentKey)) continue;
    closedSet.add(currentKey);

    // Goal reached
    if (current.position.x === goal.x && current.position.y === goal.y) {
      const path: GridPosition[] = [];
      let node: PathNode | null = current;
      while (node) {
        path.unshift(node.position);
        node = node.parent;
      }
      if (useCache) {
        addToCache(cacheKey, path);
      }
      return path;
    }

    // Check neighbors
    const neighbors = getValidNeighbors(current.position.x, current.position.y, mazeGrid);
    for (const neighbor of neighbors) {
      const neighborKey = `${neighbor.x},${neighbor.y}`;
      if (closedSet.has(neighborKey)) continue;

      const g = current.g + 1;
      const existingG = gScores.get(neighborKey);
      if (existingG !== undefined && g >= existingG) continue;

      gScores.set(neighborKey, g);
      const nh = manhattanDistance(neighbor, goal);
      heap.push({
        position: neighbor,
        g,
        h: nh,
        f: g + nh,
        parent: current,
      });
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
  // Collect walkable candidates within radius, sorted by distance from awayFrom (descending)
  const candidates: { x: number; y: number; dist: number }[] = [];

  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const x = from.x + dx;
      const y = from.y + dy;
      if (y < 0 || y >= mazeGrid.length || x < 0 || x >= mazeGrid[0].length) continue;
      if (mazeGrid[y][x] !== 0) continue;

      const dist = manhattanDistance({ x, y }, awayFrom);
      candidates.push({ x, y, dist });
    }
  }

  // Sort by distance descending — only verify top candidates with full A*
  candidates.sort((a, b) => b.dist - a.dist);

  const maxChecks = Math.min(5, candidates.length);
  for (let i = 0; i < maxChecks; i++) {
    const c = candidates[i];
    const path = findPath(from, { x: c.x, y: c.y }, mazeGrid, false);
    if (path.length > 0 && path.length < radius * 2) {
      return { x: c.x, y: c.y };
    }
  }

  return from;
}
