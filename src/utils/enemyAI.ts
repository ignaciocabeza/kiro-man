import type { GridPosition, EnemyType } from '../types';
import { GAME_CONFIG } from '../config/gameConfig';
import { isWalkable, getValidNeighbors } from './collision';
import { findPath, findFurthestPoint } from './pathfinding';
import { gridDistance } from './movement';

export interface AIState {
  timeSinceDirectionChange: number;
  timeSinceBehaviorSwitch: number;
  currentDirection: GridPosition;
  lastDirection: GridPosition;
  patrolIndex: number;
  patrolPoints: GridPosition[];
  currentBehavior: EnemyType;
  lastPathRecalc: number;
  cachedPath: GridPosition[];
  scatterTarget: GridPosition | null;
}

export function createInitialAIState(
  type: EnemyType,
  mazeGrid: number[][]
): AIState {
  const patrolPoints = generatePatrolPoints(mazeGrid);
  return {
    timeSinceDirectionChange: 0,
    timeSinceBehaviorSwitch: 0,
    currentDirection: { x: 0, y: 1 },
    lastDirection: { x: 0, y: 0 },
    patrolIndex: 0,
    patrolPoints,
    currentBehavior: type,
    lastPathRecalc: 0,
    cachedPath: [],
    scatterTarget: null,
  };
}

function generatePatrolPoints(mazeGrid: number[][]): GridPosition[] {
  const points: GridPosition[] = [];
  const h = mazeGrid.length;
  const w = mazeGrid[0].length;

  const quadrants = [
    { sx: 1, sy: 1, ex: Math.floor(w / 2), ey: Math.floor(h / 2) },
    { sx: Math.floor(w / 2), sy: 1, ex: w - 1, ey: Math.floor(h / 2) },
    { sx: 1, sy: Math.floor(h / 2), ex: Math.floor(w / 2), ey: h - 1 },
    { sx: Math.floor(w / 2), sy: Math.floor(h / 2), ex: w - 1, ey: h - 1 },
  ];

  for (const q of quadrants) {
    const cx = Math.floor((q.sx + q.ex) / 2);
    const cy = Math.floor((q.sy + q.ey) / 2);
    for (let r = 0; r < 5; r++) {
      let found = false;
      for (let dy = -r; dy <= r && !found; dy++) {
        for (let dx = -r; dx <= r && !found; dx++) {
          if (isWalkable(cx + dx, cy + dy, mazeGrid)) {
            points.push({ x: cx + dx, y: cy + dy });
            found = true;
          }
        }
      }
      if (found) break;
    }
  }

  while (points.length < 4) {
    points.push({ x: 1, y: 1 });
  }

  return points;
}

// Get neighbors excluding the reverse of the last direction (no U-turns)
function getNeighborsNoReverse(
  pos: GridPosition,
  lastDir: GridPosition,
  mazeGrid: number[][]
): GridPosition[] {
  const all = getValidNeighbors(pos.x, pos.y, mazeGrid);
  if (lastDir.x === 0 && lastDir.y === 0) return all;

  const filtered = all.filter((n) => {
    const dx = n.x - pos.x;
    const dy = n.y - pos.y;
    return !(dx === -lastDir.x && dy === -lastDir.y);
  });

  return filtered.length > 0 ? filtered : all;
}

function setDirection(
  state: AIState,
  pos: GridPosition,
  next: GridPosition
): AIState {
  return {
    ...state,
    lastDirection: { x: next.x - pos.x, y: next.y - pos.y },
  };
}

export function getNextMove(
  type: EnemyType,
  enemyPos: GridPosition,
  playerPos: GridPosition,
  mazeGrid: number[][],
  aiState: AIState,
  deltaTime: number
): { nextPos: GridPosition; updatedState: AIState } {
  const config = GAME_CONFIG.ENEMIES[type];
  const intelligence = config.intelligence;
  const evadeRadius = config.behaviorParams.evadeRadius as number;
  const dist = gridDistance(enemyPos, playerPos);

  const updatedState = { ...aiState };
  updatedState.timeSinceDirectionChange += deltaTime;
  updatedState.timeSinceBehaviorSwitch += deltaTime;
  updatedState.lastPathRecalc += deltaTime;

  // Evasion check
  if (dist < evadeRadius && Math.random() < intelligence) {
    return getEvasionMove(enemyPos, playerPos, mazeGrid, updatedState, intelligence);
  }

  switch (type) {
    case 'cursor':
      return cursorBehavior(enemyPos, mazeGrid, updatedState);
    case 'antigravity':
      return antigravityBehavior(enemyPos, playerPos, mazeGrid, updatedState);
    case 'codex':
      return codexBehavior(enemyPos, mazeGrid, updatedState);
    case 'claude':
      return claudeBehavior(enemyPos, playerPos, mazeGrid, updatedState);
    case 'vscode':
      return vscodeBehavior(enemyPos, playerPos, mazeGrid, updatedState);
    default:
      return cursorBehavior(enemyPos, mazeGrid, updatedState);
  }
}

// Cursor: Corridor-following with random turns at junctions, never reverses
function cursorBehavior(
  pos: GridPosition,
  mazeGrid: number[][],
  state: AIState
): { nextPos: GridPosition; updatedState: AIState } {
  const neighbors = getNeighborsNoReverse(pos, state.lastDirection, mazeGrid);
  let updatedState = { ...state };

  if (neighbors.length === 0) {
    return { nextPos: pos, updatedState };
  }

  // Single option (corridor) - continue
  if (neighbors.length === 1) {
    updatedState = setDirection(updatedState, pos, neighbors[0]);
    return { nextPos: neighbors[0], updatedState };
  }

  // At junction: 65% chance to continue forward if possible
  const forward = {
    x: pos.x + state.lastDirection.x,
    y: pos.y + state.lastDirection.y,
  };
  const forwardNeighbor = neighbors.find(
    (n) => n.x === forward.x && n.y === forward.y
  );
  if (forwardNeighbor && Math.random() < 0.65) {
    updatedState = setDirection(updatedState, pos, forwardNeighbor);
    return { nextPos: forwardNeighbor, updatedState };
  }

  // Random turn at junction
  const chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
  updatedState = setDirection(updatedState, pos, chosen);
  return { nextPos: chosen, updatedState };
}

// Antigravity: Scatter mode - picks target areas and pathfinds toward them
function antigravityBehavior(
  pos: GridPosition,
  playerPos: GridPosition,
  mazeGrid: number[][],
  state: AIState
): { nextPos: GridPosition; updatedState: AIState } {
  const updatedState = { ...state };
  const h = mazeGrid.length;
  const w = mazeGrid[0].length;

  // Pick new scatter target if needed
  const needNewTarget =
    !state.scatterTarget ||
    (pos.x === state.scatterTarget.x && pos.y === state.scatterTarget.y) ||
    state.timeSinceDirectionChange > 5;

  if (needNewTarget) {
    const targets = [
      { x: 1, y: 1 },
      { x: w - 2, y: 1 },
      { x: 1, y: h - 2 },
      { x: w - 2, y: h - 2 },
      { x: Math.floor(w / 2), y: 1 },
      { x: Math.floor(w / 2), y: h - 2 },
      { x: 1, y: Math.floor(h / 2) },
      { x: w - 2, y: Math.floor(h / 2) },
    ];
    const target = targets[Math.floor(Math.random() * targets.length)];

    // Find nearest walkable to target
    outer: for (let r = 0; r < 8; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (isWalkable(target.x + dx, target.y + dy, mazeGrid)) {
            updatedState.scatterTarget = { x: target.x + dx, y: target.y + dy };
            break outer;
          }
        }
      }
    }
    updatedState.timeSinceDirectionChange = 0;
    updatedState.cachedPath = [];
  }

  const target = updatedState.scatterTarget || { x: 1, y: 1 };

  // Use cached path or compute new one
  if (updatedState.cachedPath.length <= 1) {
    updatedState.cachedPath = findPath(pos, target, mazeGrid, false);
  }

  // Follow cached path
  if (updatedState.cachedPath.length > 1) {
    const next = updatedState.cachedPath[1];
    updatedState.cachedPath = updatedState.cachedPath.slice(1);
    return { nextPos: next, updatedState: setDirection(updatedState, pos, next) };
  }

  // Fallback: greedy move toward target
  const neighbors = getNeighborsNoReverse(pos, state.lastDirection, mazeGrid);
  if (neighbors.length === 0) return { nextPos: pos, updatedState };

  let best = neighbors[0];
  let bestDist = gridDistance(neighbors[0], target);
  for (let i = 1; i < neighbors.length; i++) {
    const d = gridDistance(neighbors[i], target);
    if (d < bestDist) {
      bestDist = d;
      best = neighbors[i];
    }
  }

  return { nextPos: best, updatedState: setDirection(updatedState, pos, best) };
}

// Codex: Patrols between quadrant points using A* paths, no reversals
function codexBehavior(
  pos: GridPosition,
  mazeGrid: number[][],
  state: AIState
): { nextPos: GridPosition; updatedState: AIState } {
  const updatedState = { ...state };

  if (state.patrolPoints.length === 0) {
    return cursorBehavior(pos, mazeGrid, state);
  }

  const target =
    state.patrolPoints[state.patrolIndex % state.patrolPoints.length];

  // If at target, advance to next patrol point
  if (pos.x === target.x && pos.y === target.y) {
    updatedState.patrolIndex =
      (state.patrolIndex + 1) % state.patrolPoints.length;
    updatedState.cachedPath = [];
    return { nextPos: pos, updatedState };
  }

  // Use cached path or compute new one
  if (updatedState.cachedPath.length <= 1) {
    updatedState.cachedPath = findPath(pos, target, mazeGrid);
  }

  if (updatedState.cachedPath.length > 1) {
    const next = updatedState.cachedPath[1];
    updatedState.cachedPath = updatedState.cachedPath.slice(1);
    return { nextPos: next, updatedState: setDirection(updatedState, pos, next) };
  }

  // Can't reach patrol point, skip
  updatedState.patrolIndex =
    (state.patrolIndex + 1) % state.patrolPoints.length;
  updatedState.cachedPath = [];
  return cursorBehavior(pos, mazeGrid, updatedState);
}

// Claude: A* evasion to furthest reachable point from player
function claudeBehavior(
  pos: GridPosition,
  playerPos: GridPosition,
  mazeGrid: number[][],
  state: AIState
): { nextPos: GridPosition; updatedState: AIState } {
  const updatedState = { ...state };
  const interval = GAME_CONFIG.ENEMIES.claude.behaviorParams
    .pathfindingInterval as number;

  if (state.lastPathRecalc > interval || state.cachedPath.length <= 1) {
    const furthest = findFurthestPoint(pos, playerPos, mazeGrid, 10);
    updatedState.cachedPath = findPath(pos, furthest, mazeGrid, false);
    updatedState.lastPathRecalc = 0;
  }

  if (updatedState.cachedPath.length > 1) {
    const next = updatedState.cachedPath[1];
    updatedState.cachedPath = updatedState.cachedPath.slice(1);
    return { nextPos: next, updatedState: setDirection(updatedState, pos, next) };
  }

  return cursorBehavior(pos, mazeGrid, updatedState);
}

// VSCode: Smart A* pathfinding - always follows cached paths for smooth movement
// Picks scatter targets far from player, recomputes path periodically
function vscodeBehavior(
  pos: GridPosition,
  playerPos: GridPosition,
  mazeGrid: number[][],
  state: AIState
): { nextPos: GridPosition; updatedState: AIState } {
  const updatedState = { ...state };
  const interval = GAME_CONFIG.ENEMIES.vscode.behaviorParams
    .pathfindingInterval as number;
  const dist = gridDistance(pos, playerPos);

  // Need new path if: no path, path exhausted, or periodic recalc
  const needNewPath = updatedState.cachedPath.length <= 1 || updatedState.lastPathRecalc > interval;

  if (needNewPath) {
    if (dist < 6) {
      // Close to player: pathfind to furthest point away
      const furthest = findFurthestPoint(pos, playerPos, mazeGrid, 12);
      updatedState.cachedPath = findPath(pos, furthest, mazeGrid, false);
    } else {
      // Far from player: scatter to a target area
      const h = mazeGrid.length;
      const w = mazeGrid[0].length;
      const targets = [
        { x: 1, y: 1 }, { x: w - 2, y: 1 },
        { x: 1, y: h - 2 }, { x: w - 2, y: h - 2 },
        { x: Math.floor(w / 2), y: 1 }, { x: Math.floor(w / 2), y: h - 2 },
      ];
      // Pick target furthest from player
      let bestTarget = targets[0];
      let bestDist = 0;
      for (const t of targets) {
        const d = gridDistance(t, playerPos);
        if (d > bestDist) {
          bestDist = d;
          bestTarget = t;
        }
      }
      // Find nearest walkable to target
      let walkableTarget = bestTarget;
      for (let r = 0; r < 5; r++) {
        let found = false;
        for (let dy = -r; dy <= r && !found; dy++) {
          for (let dx = -r; dx <= r && !found; dx++) {
            if (isWalkable(bestTarget.x + dx, bestTarget.y + dy, mazeGrid)) {
              walkableTarget = { x: bestTarget.x + dx, y: bestTarget.y + dy };
              found = true;
            }
          }
        }
        if (found) break;
      }
      updatedState.cachedPath = findPath(pos, walkableTarget, mazeGrid, false);
    }
    updatedState.lastPathRecalc = 0;
  }

  // Follow cached path smoothly
  if (updatedState.cachedPath.length > 1) {
    const next = updatedState.cachedPath[1];
    updatedState.cachedPath = updatedState.cachedPath.slice(1);
    return { nextPos: next, updatedState: setDirection(updatedState, pos, next) };
  }

  // Fallback to corridor following
  return cursorBehavior(pos, mazeGrid, updatedState);
}

// Improved evasion: uses no-reverse rule and smarter distance maximization
function getEvasionMove(
  pos: GridPosition,
  playerPos: GridPosition,
  mazeGrid: number[][],
  state: AIState,
  intelligence: number
): { nextPos: GridPosition; updatedState: AIState } {
  const updatedState = { ...state };
  const neighbors = getNeighborsNoReverse(pos, state.lastDirection, mazeGrid);

  if (neighbors.length === 0) {
    return { nextPos: pos, updatedState };
  }

  if (intelligence < 0.3) {
    // Low: move to neighbor that increases distance from player
    let best = neighbors[0];
    let bestDist = gridDistance(neighbors[0], playerPos);
    for (let i = 1; i < neighbors.length; i++) {
      const d = gridDistance(neighbors[i], playerPos);
      if (d > bestDist) {
        bestDist = d;
        best = neighbors[i];
      }
    }
    return { nextPos: best, updatedState: setDirection(updatedState, pos, best) };
  } else if (intelligence < 0.6) {
    // Medium: move to furthest neighbor from player
    let best = neighbors[0];
    let bestDist = 0;
    for (const n of neighbors) {
      const d = gridDistance(n, playerPos);
      if (d > bestDist) {
        bestDist = d;
        best = n;
      }
    }
    return { nextPos: best, updatedState: setDirection(updatedState, pos, best) };
  } else {
    // High: A* pathfinding to maximize distance
    const furthest = findFurthestPoint(pos, playerPos, mazeGrid, 8);
    const path = findPath(pos, furthest, mazeGrid, false);
    if (path.length > 1) {
      return {
        nextPos: path[1],
        updatedState: setDirection(updatedState, pos, path[1]),
      };
    }
  }

  // Fallback: pick neighbor furthest from player
  let best = neighbors[0];
  let bestDist = 0;
  for (const n of neighbors) {
    const d = gridDistance(n, playerPos);
    if (d > bestDist) {
      bestDist = d;
      best = n;
    }
  }
  return { nextPos: best, updatedState: setDirection(updatedState, pos, best) };
}
