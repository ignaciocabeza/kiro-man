import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { GridPosition } from '../types';
import { GAME_CONFIG } from '../config/gameConfig';
import { getEnemyGeometry } from '../utils/enemyShapes';

interface EnemyDeathEffectProps {
  position: GridPosition;
  color: string;
  enemyType: string;
  onComplete: () => void;
}

const DURATION = 1.5;

const EnemyDeathEffect: React.FC<EnemyDeathEffectProps> = ({ position, color, enemyType, onComplete }) => {
  const groupRef = useRef<THREE.Group>(null);
  const enemyMeshRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const flashRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const timer = useRef(0);
  const completed = useRef(false);

  const worldX = position.x * GAME_CONFIG.GRID_SIZE;
  const worldZ = position.y * GAME_CONFIG.GRID_SIZE;

  const enemyGeom = useMemo(() => getEnemyGeometry(enemyType), [enemyType]);

  useFrame((_, delta) => {
    timer.current += delta;
    const t = timer.current / DURATION;

    if (t >= 1 && !completed.current) {
      completed.current = true;
      onComplete();
      return;
    }

    // Shrinking spinning enemy shape
    if (enemyMeshRef.current) {
      const shrink = Math.max(0, 1 - t * 1.2);
      enemyMeshRef.current.scale.set(shrink, shrink, shrink);
      // Accelerating spin: starts slow, gets faster
      enemyMeshRef.current.rotation.z += delta * (5 + t * 25);
      // Rise up slightly as it spins
      enemyMeshRef.current.position.y = t * 0.5;
      const mat = enemyMeshRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = Math.max(0, shrink);
      mat.emissiveIntensity = 0.6 + t * 2;
    }

    // Expanding ring 1
    if (ring1Ref.current) {
      const scale = 0.5 + t * 3;
      ring1Ref.current.scale.set(scale, scale, scale);
      (ring1Ref.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - t * 1.5);
    }

    // Expanding ring 2 (delayed)
    if (ring2Ref.current) {
      const t2 = Math.max(0, t - 0.2);
      const scale = 0.3 + t2 * 2.5;
      ring2Ref.current.scale.set(scale, scale, scale);
      (ring2Ref.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.8 - t2 * 1.5);
    }

    // Flash
    if (flashRef.current) {
      const flashOpacity = t < 0.15 ? 1 : Math.max(0, 1 - (t - 0.15) * 3);
      (flashRef.current.material as THREE.MeshBasicMaterial).opacity = flashOpacity;
      const flashScale = 0.5 + t * 2;
      flashRef.current.scale.set(flashScale, flashScale, flashScale);
    }

    // Pulsing light
    if (lightRef.current) {
      lightRef.current.intensity = Math.max(0, 5 * (1 - t));
    }
  });

  return (
    <group ref={groupRef} position={[worldX, 0.6, worldZ]}>
      {/* Shrinking spinning enemy shape */}
      <mesh ref={enemyMeshRef} geometry={enemyGeom} rotation={[-Math.PI / 2, 0, 0]}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          transparent
          opacity={1}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Expanding ring 1 */}
      <mesh ref={ring1Ref} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.4, 24]} />
        <meshBasicMaterial color={color} transparent opacity={1} side={THREE.DoubleSide} />
      </mesh>
      {/* Expanding ring 2 */}
      <mesh ref={ring2Ref} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 0.35, 24]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>
      {/* Central flash */}
      <mesh ref={flashRef} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.3, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={1} side={THREE.DoubleSide} />
      </mesh>
      {/* Glow light */}
      <pointLight ref={lightRef} color={color} intensity={5} distance={6} />
    </group>
  );
};

export default EnemyDeathEffect;
