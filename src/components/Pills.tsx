import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import type { GridPosition, MazeData } from '../types';
import { GAME_CONFIG } from '../config/gameConfig';

interface PillsProps {
  mazeData: MazeData;
  playerPosition: GridPosition;
  enemyPosition: GridPosition;
  onPillSaved: () => void;
  onPillEatenByEnemy: () => void;
}

const PILL_POINTS = 10;

const Pills: React.FC<PillsProps> = React.memo(({
  mazeData,
  playerPosition,
  enemyPosition,
  onPillSaved,
  onPillEatenByEnemy,
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const eatenRef = useRef<Set<string>>(new Set());

  // Generate pill positions on all walkable tiles (except spawn points)
  const positions = useMemo(() => {
    const pos: GridPosition[] = [];
    const sp = mazeData.spawnPoints;
    const excluded = new Set<string>();
    excluded.add(`${sp.player.x},${sp.player.y}`);
    excluded.add(`${sp.enemy.x},${sp.enemy.y}`);
    for (const c of sp.collectibles) {
      excluded.add(`${c.x},${c.y}`);
    }

    for (let y = 0; y < mazeData.height; y++) {
      for (let x = 0; x < mazeData.width; x++) {
        if (mazeData.grid[y][x] === 0 && !excluded.has(`${x},${y}`)) {
          pos.push({ x, y });
        }
      }
    }
    return pos;
  }, [mazeData]);

  // Reset eaten pills when maze changes
  useEffect(() => {
    eatenRef.current = new Set();
  }, [mazeData]);

  // Set up instance matrices
  useEffect(() => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;
    const matrix = new THREE.Matrix4();

    positions.forEach((pos, i) => {
      matrix.identity();
      matrix.setPosition(
        pos.x * GAME_CONFIG.GRID_SIZE,
        0.15,
        pos.y * GAME_CONFIG.GRID_SIZE
      );
      mesh.setMatrixAt(i, matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
  }, [positions]);

  // Helper to hide a pill at a given index
  const hidePill = (idx: number) => {
    if (meshRef.current) {
      const matrix = new THREE.Matrix4();
      matrix.makeScale(0, 0, 0);
      meshRef.current.setMatrixAt(idx, matrix);
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  };

  // Check if player ate a pill
  useEffect(() => {
    const key = `${playerPosition.x},${playerPosition.y}`;
    if (eatenRef.current.has(key)) return;

    const idx = positions.findIndex(
      (p) => p.x === playerPosition.x && p.y === playerPosition.y
    );
    if (idx === -1) return;

    eatenRef.current.add(key);
    onPillSaved();
    hidePill(idx);
  }, [playerPosition, positions, onPillSaved]);

  // Check if enemy ate a pill
  useEffect(() => {
    const key = `${enemyPosition.x},${enemyPosition.y}`;
    if (eatenRef.current.has(key)) return;

    const idx = positions.findIndex(
      (p) => p.x === enemyPosition.x && p.y === enemyPosition.y
    );
    if (idx === -1) return;

    eatenRef.current.add(key);
    onPillEatenByEnemy();
    hidePill(idx);
  }, [enemyPosition, positions, onPillEatenByEnemy]);

  if (positions.length === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, positions.length]}>
      <sphereGeometry args={[0.08, 6, 6]} />
      <meshStandardMaterial
        color="#ffee88"
        emissive="#ffcc00"
        emissiveIntensity={0.6}
      />
    </instancedMesh>
  );
});

export { PILL_POINTS };
export default Pills;
