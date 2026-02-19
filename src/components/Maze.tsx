import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import type { MazeData } from '../types';
import { GAME_CONFIG } from '../config/gameConfig';

interface MazeProps {
  mazeData: MazeData;
}

// Check if a grid cell is a path (or out of bounds = wall)
function isPath(grid: number[][], x: number, y: number, w: number, h: number): boolean {
  if (x < 0 || x >= w || y < 0 || y >= h) return false;
  return grid[y][x] === 0;
}

// Create a rounded box geometry via ExtrudeGeometry
function createRoundedBoxGeometry(width: number, height: number, depth: number, radius: number): THREE.ExtrudeGeometry {
  const w = width / 2;
  const d = depth / 2;
  const r = Math.min(radius, w, d);

  const shape = new THREE.Shape();
  shape.moveTo(-w + r, -d);
  shape.lineTo(w - r, -d);
  shape.quadraticCurveTo(w, -d, w, -d + r);
  shape.lineTo(w, d - r);
  shape.quadraticCurveTo(w, d, w - r, d);
  shape.lineTo(-w + r, d);
  shape.quadraticCurveTo(-w, d, -w, d - r);
  shape.lineTo(-w, -d + r);
  shape.quadraticCurveTo(-w, -d, -w + r, -d);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: false,
    curveSegments: 3,
  });

  geo.rotateX(-Math.PI / 2);
  geo.translate(0, -height / 2, 0);

  return geo;
}

const Maze: React.FC<MazeProps> = React.memo(({ mazeData }) => {
  const wallMeshRef = useRef<THREE.InstancedMesh>(null);

  // Rounded wall geometry (created once)
  const wallGeometry = useMemo(() => {
    const g = GAME_CONFIG.GRID_SIZE;
    return createRoundedBoxGeometry(g, 1, g, 0.12);
  }, []);

  const wallPositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    for (let y = 0; y < mazeData.height; y++) {
      for (let x = 0; x < mazeData.width; x++) {
        if (mazeData.grid[y][x] === 1) {
          positions.push([
            x * GAME_CONFIG.GRID_SIZE,
            0.5,
            y * GAME_CONFIG.GRID_SIZE,
          ]);
        }
      }
    }
    return positions;
  }, [mazeData]);

  // Compute neon edge segments - only along wall faces adjacent to paths
  const neonEdges = useMemo(() => {
    const edges: { start: [number, number, number]; end: [number, number, number] }[] = [];
    const g = GAME_CONFIG.GRID_SIZE;
    const half = g / 2;
    const topY = 1.01;

    for (let y = 0; y < mazeData.height; y++) {
      for (let x = 0; x < mazeData.width; x++) {
        if (mazeData.grid[y][x] !== 1) continue;

        const wx = x * g;
        const wz = y * g;

        if (isPath(mazeData.grid, x, y - 1, mazeData.width, mazeData.height)) {
          edges.push({ start: [wx - half, topY, wz - half], end: [wx + half, topY, wz - half] });
        }
        if (isPath(mazeData.grid, x, y + 1, mazeData.width, mazeData.height)) {
          edges.push({ start: [wx - half, topY, wz + half], end: [wx + half, topY, wz + half] });
        }
        if (isPath(mazeData.grid, x - 1, y, mazeData.width, mazeData.height)) {
          edges.push({ start: [wx - half, topY, wz - half], end: [wx - half, topY, wz + half] });
        }
        if (isPath(mazeData.grid, x + 1, y, mazeData.width, mazeData.height)) {
          edges.push({ start: [wx + half, topY, wz - half], end: [wx + half, topY, wz + half] });
        }
      }
    }
    return edges;
  }, [mazeData]);

  // Batched neon edge lines into a single geometry
  const edgeLinesGeometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (const edge of neonEdges) {
      points.push(new THREE.Vector3(edge.start[0], edge.start[1], edge.start[2]));
      points.push(new THREE.Vector3(edge.end[0], edge.end[1], edge.end[2]));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [neonEdges]);

  // Set wall instance matrices
  useEffect(() => {
    if (!wallMeshRef.current) return;
    const mesh = wallMeshRef.current;
    const matrix = new THREE.Matrix4();

    wallPositions.forEach((pos, i) => {
      matrix.setPosition(pos[0], pos[1], pos[2]);
      mesh.setMatrixAt(i, matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
  }, [wallPositions]);

  const g = GAME_CONFIG.GRID_SIZE;

  return (
    <group>
      {/* Floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[
          (mazeData.width * g) / 2 - 0.5,
          0,
          (mazeData.height * g) / 2 - 0.5,
        ]}
        receiveShadow
      >
        <planeGeometry args={[mazeData.width * g, mazeData.height * g]} />
        <meshStandardMaterial color="#050510" />
      </mesh>

      {/* Walls (instanced) - rounded corners, no emissive/glow */}
      <instancedMesh
        ref={wallMeshRef}
        args={[wallGeometry, undefined, wallPositions.length]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#0d1030" emissive="#0a1545" emissiveIntensity={0.3} />
      </instancedMesh>

      {/* Neon edge lines - single batched draw call */}
      <lineSegments geometry={edgeLinesGeometry}>
        <lineBasicMaterial color="#00ccff" />
      </lineSegments>
    </group>
  );
});

export default Maze;
