import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGridMovement } from '../hooks/useGridMovement';
import { GAME_CONFIG } from '../config/gameConfig';
import type { GridPosition, EnemyType } from '../types';
import { GameStatus } from '../types';
import type { AIState } from '../utils/enemyAI';
import { getNextMove, createInitialAIState } from '../utils/enemyAI';
import { findPath, findFurthestPoint } from '../utils/pathfinding';
import { getEnemyGeometry } from '../utils/enemyShapes';
import { useGameStateRef } from '../contexts/GameStateContext';

interface EnemyProps {
  type: EnemyType;
  spawnPosition: GridPosition;
  mazeGrid: number[][];
  playerPosition: GridPosition;
  onEaten: () => void;
  onPositionUpdate: (pos: GridPosition) => void;
  debugLockedPathRef?: React.MutableRefObject<GridPosition[]>;
}

// Compute shortest angular distance (handles wrapping)
function shortAngleDist(from: number, to: number): number {
  const max = Math.PI * 2;
  const diff = (((to - from) % max) + max + Math.PI) % max - Math.PI;
  return diff;
}

const Enemy: React.FC<EnemyProps> = React.memo(({
  type,
  spawnPosition,
  mazeGrid,
  playerPosition,
  onEaten,
  onPositionUpdate,
  debugLockedPathRef,
}) => {
  const stateRef = useGameStateRef();
  const groupRef = useRef<THREE.Group>(null);
  const aiStateRef = useRef<AIState>(createInitialAIState(type, mazeGrid));
  const moveTimerRef = useRef(0);
  const playerPosRef = useRef(playerPosition);

  const movement = useGridMovement(spawnPosition, mazeGrid);

  // Smooth rotation tracking
  const targetAngle = useRef(0);
  const currentAngle = useRef(0);

  // Debug ability: locked path tracking
  const debugLockedPath = useRef<GridPosition[]>([]);
  const debugPathIndex = useRef(0);
  const wasDebugActive = useRef(false);

  const config = GAME_CONFIG.ENEMIES[type];

  // Pacman base shape (circle with mouth)
  const pacmanGeom = useMemo(() => {
    const shape = new THREE.Shape();
    const radius = 0.35;
    const mouthAngle = 0.35;
    shape.moveTo(0, 0);
    shape.absarc(0, 0, radius, mouthAngle, Math.PI * 2 - mouthAngle, false);
    shape.lineTo(0, 0);
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.18,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.02,
      bevelSegments: 3,
    });
  }, []);

  // SVG logo overlay geometry (cached by type in enemyShapes.ts)
  const logoGeom = useMemo(() => getEnemyGeometry(type), [type]);

  // Dispose pacman geometry on unmount (logoGeom is shared/cached, don't dispose)
  useEffect(() => {
    return () => {
      pacmanGeom.dispose();
    };
  }, [pacmanGeom]);

  useEffect(() => {
    playerPosRef.current = playerPosition;
  }, [playerPosition]);

  useEffect(() => {
    movement.resetPosition(spawnPosition);
    aiStateRef.current = createInitialAIState(type, mazeGrid);
  }, [spawnPosition, type, mazeGrid]);

  useFrame((_, delta) => {
    const gs = stateRef.current;
    if (gs.status !== GameStatus.PLAYING) return;

    const levelConfig = GAME_CONFIG.LEVELS[gs.currentLevel];
    const effectiveSpeed = config.baseSpeed * levelConfig.enemySpeedMultiplier;

    // Debug ability: lock enemy to a fixed path
    const isDebugActive = gs.activeAbility === 'debug';

    if (isDebugActive && !wasDebugActive.current) {
      const currentPos = movement.getGridPosition();
      const furthest = findFurthestPoint(currentPos, playerPosRef.current, mazeGrid, 15);
      const path = findPath(currentPos, furthest, mazeGrid, false);
      debugLockedPath.current = path;
      debugPathIndex.current = 0;
      if (debugLockedPathRef) {
        debugLockedPathRef.current = path;
      }
    }

    if (!isDebugActive && wasDebugActive.current) {
      debugLockedPath.current = [];
      debugPathIndex.current = 0;
      if (debugLockedPathRef) {
        debugLockedPathRef.current = [];
      }
    }

    wasDebugActive.current = isDebugActive;

    // Move enemy
    moveTimerRef.current += delta;
    const moveInterval = 1 / effectiveSpeed;

    if (isDebugActive && debugLockedPath.current.length > 0) {
      // Follow locked path rigidly
      if (!movement.getIsMoving() && moveTimerRef.current > moveInterval) {
        if (debugPathIndex.current < debugLockedPath.current.length - 1) {
          debugPathIndex.current++;
          const currentPos = movement.getGridPosition();
          const nextPos = debugLockedPath.current[debugPathIndex.current];
          movement.moveToGrid(nextPos.x, nextPos.y);

          const dx = nextPos.x - currentPos.x;
          const dy = nextPos.y - currentPos.y;
          targetAngle.current = Math.atan2(-dy, dx);
        } else {
          // Reached end of locked path - compute new one
          const currentPos = movement.getGridPosition();
          const furthest = findFurthestPoint(currentPos, playerPosRef.current, mazeGrid, 15);
          const path = findPath(currentPos, furthest, mazeGrid, false);
          debugLockedPath.current = path;
          debugPathIndex.current = 0;
          if (debugLockedPathRef) {
            debugLockedPathRef.current = path;
          }
        }
        moveTimerRef.current = 0;

        if (debugLockedPathRef) {
          debugLockedPathRef.current = debugLockedPath.current.slice(debugPathIndex.current);
        }
      }
    } else {
      // Normal AI movement
      if (!movement.getIsMoving() && moveTimerRef.current > moveInterval) {
        const currentPos = movement.getGridPosition();
        const { nextPos, updatedState } = getNextMove(
          type,
          currentPos,
          playerPosRef.current,
          mazeGrid,
          aiStateRef.current,
          delta
        );
        aiStateRef.current = updatedState;

        if (nextPos.x !== currentPos.x || nextPos.y !== currentPos.y) {
          movement.moveToGrid(nextPos.x, nextPos.y);
          const dx = nextPos.x - currentPos.x;
          const dy = nextPos.y - currentPos.y;
          targetAngle.current = Math.atan2(-dy, dx);
        }
        moveTimerRef.current = 0;
      }
    }

    // Smooth rotation interpolation
    const angleDiff = shortAngleDist(currentAngle.current, targetAngle.current);
    currentAngle.current += angleDiff * Math.min(1, delta * 8);

    movement.update(delta, effectiveSpeed);

    const worldPos = movement.getWorldPosition();
    const gridPos = movement.getGridPosition();

    if (groupRef.current) {
      groupRef.current.position.set(worldPos[0], 0.55, worldPos[2]);
      groupRef.current.rotation.y = currentAngle.current;
    }

    onPositionUpdate(gridPos);

    if (gridPos.x === playerPosRef.current.x && gridPos.y === playerPosRef.current.y) {
      onEaten();
    }
  });

  const worldPos = movement.getWorldPosition();

  return (
    <group ref={groupRef} position={[worldPos[0], 0.55, worldPos[2]]}>
      {/* Pacman body - dark base, acts as mask frame */}
      <mesh geometry={pacmanGeom} rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <meshStandardMaterial
          color="#111111"
          emissive={config.color}
          emissiveIntensity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* SVG logo - fills the pacman shape, colored in enemy color */}
      <group rotation={[-Math.PI / 2, 0, 0]} scale={[0.85, 0.85, 1]} position={[0, 0.19, 0]}>
        <mesh geometry={logoGeom}>
          <meshBasicMaterial
            color={config.color}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
      {/* Glow */}
      <pointLight position={[0, 0.3, 0]} intensity={0.5} distance={2.5} color={config.color} />
    </group>
  );
});

export default Enemy;
