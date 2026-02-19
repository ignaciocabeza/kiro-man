import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGridMovement } from '../hooks/useGridMovement';
import { GAME_CONFIG } from '../config/gameConfig';
import type { GridPosition } from '../types';
import { GameStatus } from '../types';
import { findPath } from '../utils/pathfinding';
import { useGameStateRef, useGameDispatch } from '../contexts/GameStateContext';

interface KiroProps {
  spawnPosition: GridPosition;
  mazeGrid: number[][];
  enemyPosition: GridPosition;
  onPositionUpdate: (pos: GridPosition) => void;
}

// SVG coordinate transform: center and scale the kiro.svg paths
const SVG_CX = 10;
const SVG_CY = 12;
const S = 0.035;
const px = (x: number) => (x - SVG_CX) * S;
const py = (y: number) => -(y - SVG_CY) * S;

function createBodyGeometry(): THREE.ExtrudeGeometry {
  const body = new THREE.Shape();

  body.moveTo(px(3.80081), py(18.5661));
  body.bezierCurveTo(px(1.32306), py(24.0572), px(6.59904), py(25.434), px(10.4904), py(22.2205));
  body.bezierCurveTo(px(11.6339), py(25.8242), px(15.926), py(23.1361), px(17.4652), py(20.3445));
  body.bezierCurveTo(px(20.8578), py(14.1915), px(19.4877), py(7.91459), px(19.1361), py(6.61988));
  body.bezierCurveTo(px(16.7244), py(-2.20972), px(4.67055), py(-2.21852), px(2.59581), py(6.6649));
  body.bezierCurveTo(px(2.11136), py(8.21946), px(2.10284), py(9.98752), px(1.82846), py(11.8233));
  body.bezierCurveTo(px(1.69011), py(12.749), px(1.59258), py(13.3398), px(1.23436), py(14.3135));
  body.bezierCurveTo(px(1.02841), py(14.8733), px(0.745043), py(15.3704), px(0.299833), py(16.2082));
  body.bezierCurveTo(px(-0.391594), py(17.5095), px(-0.0998802), py(20.021), px(3.46397), py(18.7186));
  body.lineTo(px(3.46397), py(18.7195));
  body.lineTo(px(3.80081), py(18.5661));
  body.closePath();

  return new THREE.ExtrudeGeometry(body, {
    depth: 0.25,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.03,
    bevelSegments: 4,
  });
}

function createEyeShape(svgCenterX: number, svgCenterY: number): THREE.ShapeGeometry {
  const eye = new THREE.Shape();
  const ecx = px(svgCenterX);
  const ecy = py(svgCenterY);
  const rx = 1.177 * S;
  const ry = 1.887 * S;

  const segments = 20;
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const ex = ecx + Math.cos(angle) * rx;
    const ey = ecy + Math.sin(angle) * ry;
    if (i === 0) eye.moveTo(ex, ey);
    else eye.lineTo(ex, ey);
  }
  eye.closePath();

  return new THREE.ShapeGeometry(eye);
}

const Kiro: React.FC<KiroProps> = React.memo(({
  spawnPosition,
  mazeGrid,
  enemyPosition,
  onPositionUpdate,
}) => {
  const stateRef = useGameStateRef();
  const dispatch = useGameDispatch();
  const groupRef = useRef<THREE.Group>(null);
  const flamesGroupRef = useRef<THREE.Group>(null);
  const flame1Ref = useRef<THREE.Mesh>(null);
  const flame2Ref = useRef<THREE.Mesh>(null);
  const flame3Ref = useRef<THREE.Mesh>(null);
  const flame4Ref = useRef<THREE.Mesh>(null);
  const keysPressed = useRef<Set<string>>(new Set());
  const lastDirection = useRef<GridPosition | null>(null);
  const vibePathRef = useRef<GridPosition[]>([]);
  const vibeRecalcTimer = useRef(0);
  const bobTimer = useRef(0);

  const movement = useGridMovement(spawnPosition, mazeGrid);

  const bodyGeom = useMemo(() => createBodyGeometry(), []);
  const leftEyeGeom = useMemo(() => createEyeShape(10.96, 8.55), []);
  const rightEyeGeom = useMemo(() => createEyeShape(15.03, 8.55), []);

  // Dispose geometries on unmount
  useEffect(() => {
    return () => {
      bodyGeom.dispose();
      leftEyeGeom.dispose();
      rightEyeGeom.dispose();
    };
  }, [bodyGeom, leftEyeGeom, rightEyeGeom]);

  useEffect(() => {
    movement.resetPosition(spawnPosition);
  }, [spawnPosition, mazeGrid]);

  // Stable keyboard handler — reads abilities from ref, never re-attaches
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.code);
      const abilities = stateRef.current.abilities;
      if (e.code === 'Digit1' && abilities.vibe) {
        dispatch.activateAbility('vibe');
      } else if (e.code === 'Digit2' && abilities.tokenBurner) {
        dispatch.activateAbility('tokenBurner');
      } else if (e.code === 'Digit3' && abilities.debug) {
        dispatch.activateAbility('debug');
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.code);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [stateRef, dispatch]);

  const getDirection = useCallback((): GridPosition | null => {
    const keys = keysPressed.current;
    if (keys.has('ArrowUp') || keys.has('KeyW')) return { x: 0, y: -1 };
    if (keys.has('ArrowDown') || keys.has('KeyS')) return { x: 0, y: 1 };
    if (keys.has('ArrowLeft') || keys.has('KeyA')) return { x: -1, y: 0 };
    if (keys.has('ArrowRight') || keys.has('KeyD')) return { x: 1, y: 0 };
    return null;
  }, []);

  useFrame((_, delta) => {
    const gs = stateRef.current;
    if (gs.status !== GameStatus.PLAYING) return;

    const speed =
      gs.activeAbility === 'tokenBurner'
        ? GAME_CONFIG.PLAYER.BASE_SPEED * GAME_CONFIG.ABILITIES.TOKEN_BURNER.SPEED_MULTIPLIER
        : gs.activeAbility === 'vibe'
        ? GAME_CONFIG.PLAYER.BASE_SPEED * GAME_CONFIG.ABILITIES.VIBE.SPEED_MULTIPLIER
        : GAME_CONFIG.PLAYER.BASE_SPEED;

    const currentPos = movement.getGridPosition();

    if (gs.activeAbility === 'vibe') {
      vibeRecalcTimer.current += delta;
      if (vibeRecalcTimer.current > 0.5 || vibePathRef.current.length === 0) {
        vibePathRef.current = findPath(currentPos, enemyPosition, mazeGrid, false);
        vibeRecalcTimer.current = 0;
      }
      if (!movement.getIsMoving() && vibePathRef.current.length > 1) {
        const next = vibePathRef.current[1];
        if (movement.moveToGrid(next.x, next.y)) {
          vibePathRef.current = vibePathRef.current.slice(1);
        }
      }
    } else {
      const dir = getDirection();
      if (dir) {
        lastDirection.current = dir;
      }

      if (!movement.getIsMoving() && lastDirection.current) {
        const moved = movement.moveToGrid(
          currentPos.x + lastDirection.current.x,
          currentPos.y + lastDirection.current.y
        );
        if (!moved) {
          lastDirection.current = null;
        }
      }
    }

    movement.update(delta, speed);

    const worldPos = movement.getWorldPosition();
    if (groupRef.current) {
      bobTimer.current += delta;
      groupRef.current.position.set(
        worldPos[0],
        0.55 + Math.sin(bobTimer.current * 3) * 0.04,
        worldPos[2]
      );
    }

    // Toggle flame visibility and animate (no mount/unmount)
    const isTokenBurner = gs.activeAbility === 'tokenBurner';
    if (flamesGroupRef.current) {
      flamesGroupRef.current.visible = isTokenBurner;
    }
    if (isTokenBurner) {
      const t = Date.now() * 0.01;
      const flames = [flame1Ref, flame2Ref, flame3Ref, flame4Ref];
      flames.forEach((ref, i) => {
        if (ref.current) {
          const phase = t * (1.5 + i * 0.4) + i * 1.5;
          ref.current.scale.y = 0.6 + Math.sin(phase) * 0.5;
          ref.current.scale.x = 0.7 + Math.sin(phase * 1.3) * 0.3;
          ref.current.scale.z = 0.7 + Math.sin(phase * 1.3) * 0.3;
          ref.current.position.y = -0.15 - Math.sin(phase) * 0.05;
        }
      });
    }

    const gridPos = movement.getGridPosition();
    onPositionUpdate(gridPos);
  });

  const worldPos = movement.getWorldPosition();

  return (
    <group ref={groupRef} position={[worldPos[0], 0.55, worldPos[2]]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={bodyGeom} castShadow>
        <meshStandardMaterial
          color="#ffffff"
          emissive="#6688ff"
          emissiveIntensity={0.3}
          transparent
          opacity={0.92}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.26, 0]} geometry={leftEyeGeom}>
        <meshBasicMaterial color="#1a1a3a" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.26, 0]} geometry={rightEyeGeom}>
        <meshBasicMaterial color="#1a1a3a" />
      </mesh>
      <mesh position={[-0.1, 0.28, -0.08]}>
        <sphereGeometry args={[0.07, 10, 10]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-0.1, 0.32, -0.08]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#111133" />
      </mesh>
      <mesh position={[0.1, 0.28, -0.08]}>
        <sphereGeometry args={[0.07, 10, 10]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.1, 0.32, -0.08]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#111133" />
      </mesh>
      <pointLight position={[0, 0.3, 0]} intensity={0.8} distance={3} color="#88aaff" />
      {/* Flames always mounted, visibility toggled via useFrame */}
      <group ref={flamesGroupRef} visible={false}>
        <mesh ref={flame1Ref} position={[0, -0.2, 0]}>
          <coneGeometry args={[0.18, 0.5, 8]} />
          <meshBasicMaterial color="#ff6600" transparent opacity={0.9} />
        </mesh>
        <mesh ref={flame2Ref} position={[0, -0.15, 0]}>
          <coneGeometry args={[0.12, 0.4, 8]} />
          <meshBasicMaterial color="#ffcc00" transparent opacity={0.85} />
        </mesh>
        <mesh ref={flame3Ref} position={[0.15, -0.18, 0.15]}>
          <coneGeometry args={[0.1, 0.35, 6]} />
          <meshBasicMaterial color="#ff3300" transparent opacity={0.8} />
        </mesh>
        <mesh ref={flame4Ref} position={[-0.15, -0.18, -0.15]}>
          <coneGeometry args={[0.1, 0.35, 6]} />
          <meshBasicMaterial color="#ff4400" transparent opacity={0.8} />
        </mesh>
        <pointLight position={[0, -0.3, 0]} intensity={3} distance={4} color="#ff6600" />
        <pointLight position={[0, 0.2, 0]} intensity={1.5} distance={3} color="#ffaa00" />
      </group>
    </group>
  );
});

export default Kiro;
