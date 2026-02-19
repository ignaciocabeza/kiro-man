import { useCallback, useRef } from 'react';
import type { GridPosition } from '../types';
import { isWalkable } from '../utils/collision';
import { lerp } from '../utils/movement';
import { GAME_CONFIG } from '../config/gameConfig';

export function useGridMovement(
  initialPos: GridPosition,
  mazeGrid: number[][]
) {
  const gridPos = useRef<GridPosition>({ ...initialPos });
  const targetPos = useRef<GridPosition>({ ...initialPos });
  const worldPos = useRef<[number, number, number]>([
    initialPos.x * GAME_CONFIG.GRID_SIZE,
    0.4,
    initialPos.y * GAME_CONFIG.GRID_SIZE,
  ]);
  const moveProgress = useRef(1);
  const isMoving = useRef(false);

  const getGridPosition = useCallback(() => ({ ...gridPos.current }), []);
  const getWorldPosition = useCallback((): [number, number, number] => [...worldPos.current], []);
  const getIsMoving = useCallback(() => isMoving.current, []);

  const moveToGrid = useCallback(
    (x: number, y: number): boolean => {
      if (isMoving.current && moveProgress.current < 0.9) return false;
      if (!isWalkable(x, y, mazeGrid)) return false;

      // Snap to current target when interrupting a near-complete move
      // This prevents the visual jump backward that happens when gridPos
      // hasn't been updated yet but moveProgress resets to 0
      if (isMoving.current) {
        gridPos.current = { ...targetPos.current };
        worldPos.current = [
          targetPos.current.x * GAME_CONFIG.GRID_SIZE,
          0.4,
          targetPos.current.y * GAME_CONFIG.GRID_SIZE,
        ];
      }

      targetPos.current = { x, y };
      moveProgress.current = 0;
      isMoving.current = true;
      return true;
    },
    [mazeGrid]
  );

  const update = useCallback((deltaTime: number, speed: number) => {
    if (!isMoving.current) return;

    moveProgress.current += deltaTime * speed;

    if (moveProgress.current >= 1) {
      moveProgress.current = 1;
      gridPos.current = { ...targetPos.current };
      worldPos.current = [
        targetPos.current.x * GAME_CONFIG.GRID_SIZE,
        0.4,
        targetPos.current.y * GAME_CONFIG.GRID_SIZE,
      ];
      isMoving.current = false;
    } else {
      worldPos.current = [
        lerp(
          gridPos.current.x * GAME_CONFIG.GRID_SIZE,
          targetPos.current.x * GAME_CONFIG.GRID_SIZE,
          moveProgress.current
        ),
        0.4,
        lerp(
          gridPos.current.y * GAME_CONFIG.GRID_SIZE,
          targetPos.current.y * GAME_CONFIG.GRID_SIZE,
          moveProgress.current
        ),
      ];
    }
  }, []);

  const resetPosition = useCallback((pos: GridPosition) => {
    gridPos.current = { ...pos };
    targetPos.current = { ...pos };
    worldPos.current = [
      pos.x * GAME_CONFIG.GRID_SIZE,
      0.4,
      pos.y * GAME_CONFIG.GRID_SIZE,
    ];
    moveProgress.current = 1;
    isMoving.current = false;
  }, []);

  return {
    getGridPosition,
    getWorldPosition,
    getIsMoving,
    moveToGrid,
    update,
    resetPosition,
  };
}
