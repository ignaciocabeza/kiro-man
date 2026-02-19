import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GAME_CONFIG } from '../config/gameConfig';
import type { GridPosition, AbilityType } from '../types';
import { GameStatus } from '../types';
import { useGameStateRef } from '../contexts/GameStateContext';

interface CollectibleProps {
  type: AbilityType;
  position: GridPosition;
  onCollect: (type: AbilityType) => void;
  playerPosition: GridPosition;
}

const COLLECTIBLE_COLORS: Record<AbilityType, { color: string; emissive: string }> = {
  vibe: { color: '#9b59b6', emissive: '#8e44ad' },
  tokenBurner: { color: '#e67e22', emissive: '#d35400' },
  debug: { color: '#2ecc71', emissive: '#27ae60' },
};

const Collectible: React.FC<CollectibleProps> = React.memo(({
  type,
  position,
  onCollect,
  playerPosition,
}) => {
  const stateRef = useGameStateRef();
  const groupRef = useRef<THREE.Group>(null);
  const collectedRef = useRef(false);

  const { color, emissive } = COLLECTIBLE_COLORS[type];
  const worldX = position.x * GAME_CONFIG.GRID_SIZE;
  const worldZ = position.y * GAME_CONFIG.GRID_SIZE;

  useFrame((_, delta) => {
    if (stateRef.current.status !== GameStatus.PLAYING || collectedRef.current) return;
    if (!groupRef.current) return;

    groupRef.current.position.y = 0.5 + Math.sin(Date.now() * 0.003) * 0.15;
    groupRef.current.rotation.y += delta * 2;

    if (playerPosition.x === position.x && playerPosition.y === position.y) {
      collectedRef.current = true;
      onCollect(type);
    }
  });

  if (collectedRef.current) return null;

  return (
    <group ref={groupRef} position={[worldX, 0.5, worldZ]}>
      {type === 'vibe' && (
        <mesh castShadow>
          <torusGeometry args={[0.18, 0.06, 8, 16]} />
          <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.6} transparent opacity={0.9} />
        </mesh>
      )}
      {type === 'tokenBurner' && (
        <mesh castShadow>
          <coneGeometry args={[0.15, 0.35, 8]} />
          <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.6} transparent opacity={0.9} />
        </mesh>
      )}
      {type === 'debug' && (
        <mesh castShadow>
          <icosahedronGeometry args={[0.2, 0]} />
          <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.6} transparent opacity={0.9} />
        </mesh>
      )}
      <pointLight intensity={0.5} distance={2} color={emissive} />
    </group>
  );
});

export default Collectible;
