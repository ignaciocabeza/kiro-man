import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { GridPosition } from '../types';
import { GAME_CONFIG } from '../config/gameConfig';
import { findPath, findFurthestPoint } from '../utils/pathfinding';

interface DebugPathProps {
  enemyPosition: GridPosition;
  playerPosition: GridPosition;
  mazeGrid: number[][];
  lockedPathRef?: React.MutableRefObject<GridPosition[]>;
}

const MAX_PATH_LENGTH = 20;

const DebugPath: React.FC<DebugPathProps> = React.memo(({
  enemyPosition,
  playerPosition,
  mazeGrid,
  lockedPathRef,
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const pathRef = useRef<GridPosition[]>([]);
  const recalcTimer = useRef(0);

  const dummyMatrix = useMemo(() => new THREE.Matrix4(), []);
  const hideMatrix = useMemo(() => new THREE.Matrix4().makeScale(0, 0, 0), []);

  // Recalculate path periodically
  useFrame((_, delta) => {
    recalcTimer.current += delta;
    if (recalcTimer.current < 0.3) return;
    recalcTimer.current = 0;

    // Use locked path from debug ability if available, otherwise compute prediction
    if (lockedPathRef && lockedPathRef.current.length > 0) {
      pathRef.current = lockedPathRef.current.slice(0, MAX_PATH_LENGTH);
    } else {
      const furthest = findFurthestPoint(enemyPosition, playerPosition, mazeGrid, 8);
      const path = findPath(enemyPosition, furthest, mazeGrid, false);
      pathRef.current = path.slice(0, MAX_PATH_LENGTH);
    }

    if (!meshRef.current) return;

    // Update instance positions
    for (let i = 0; i < MAX_PATH_LENGTH; i++) {
      if (i < pathRef.current.length) {
        const pos = pathRef.current[i];
        dummyMatrix.identity();
        dummyMatrix.setPosition(
          pos.x * GAME_CONFIG.GRID_SIZE,
          0.3,
          pos.y * GAME_CONFIG.GRID_SIZE
        );
        meshRef.current.setMatrixAt(i, dummyMatrix);
      } else {
        meshRef.current.setMatrixAt(i, hideMatrix);
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  // Initialize all hidden
  useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < MAX_PATH_LENGTH; i++) {
      meshRef.current.setMatrixAt(i, hideMatrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [hideMatrix]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_PATH_LENGTH]}>
      <sphereGeometry args={[0.12, 6, 6]} />
      <meshStandardMaterial
        color="#ff4444"
        emissive="#ff2222"
        emissiveIntensity={0.8}
        transparent
        opacity={0.5}
      />
    </instancedMesh>
  );
});

export default DebugPath;
