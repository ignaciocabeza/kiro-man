import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameState } from '../contexts/GameStateContext';
import { GAME_CONFIG } from '../config/gameConfig';
import { MAZE_LAYOUTS } from '../config/mazeLayouts';
import type { GridPosition, EnemyType, AbilityType } from '../types';
import { GameStatus, SoundType, MusicType } from '../types';
import { useTimer } from '../hooks/useTimer';
import { audioManager } from '../utils/audioManager';
import { clearPathCache } from '../utils/pathfinding';
import Maze from './Maze';
import Kiro from './Kiro';
import Enemy from './Enemy';
import Collectible from './Collectible';
import Pills, { PILL_POINTS } from './Pills';
import DebugPath from './DebugPath';
import EnemyDeathEffect from './EnemyDeathEffect';
import AbilityOverlay from './AbilityOverlay';
import LevelTransition from './LevelTransition';

function CameraSetup({ centerX, centerZ, mazeWidth, mazeHeight }: { centerX: number; centerZ: number; mazeWidth: number; mazeHeight: number }) {
  const { camera, size } = useThree();

  useEffect(() => {
    if (camera instanceof THREE.OrthographicCamera) {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      // Reserve pixels for HUD bars; add extra bottom padding on touch for D-pad
      const hudPadding = isTouchDevice ? 260 : 100;
      const availableHeight = Math.max(size.height - hudPadding, 100);
      const availableWidth = size.width;

      // Add a small margin (1 grid unit each side) so the maze doesn't touch edges
      const worldW = mazeWidth + 2;
      const worldH = mazeHeight + 2;

      // Compute zoom so the entire maze fits in the available viewport
      const zoom = Math.min(availableWidth / worldW, availableHeight / worldH);

      // Shift maze up on touch devices so D-pad doesn't overlap
      const zOffset = isTouchDevice ? 4.5 : 0;
      camera.position.set(centerX, 25, centerZ + zOffset);
      camera.zoom = zoom;
      camera.lookAt(centerX, 0, centerZ + zOffset);
      camera.updateProjectionMatrix();
    }
  }, [camera, centerX, centerZ, mazeWidth, mazeHeight, size]);

  return null;
}

// Get random walkable positions from the maze
function getRandomWalkablePositions(
  grid: number[][],
  count: number,
  exclude: Set<string>
): GridPosition[] {
  const walkable: GridPosition[] = [];
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      if (grid[y][x] === 0 && !exclude.has(`${x},${y}`)) {
        walkable.push({ x, y });
      }
    }
  }
  // Shuffle and pick
  for (let i = walkable.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [walkable[i], walkable[j]] = [walkable[j], walkable[i]];
  }
  return walkable.slice(0, count);
}

const ABILITY_TYPES: AbilityType[] = ['vibe', 'tokenBurner', 'debug'];

const GameCanvas: React.FC = () => {
  const gameState = useGameState();
  const [playerPos, setPlayerPos] = useState<GridPosition>({ x: 1, y: 1 });
  const [enemyPos, setEnemyPos] = useState<GridPosition>({ x: 1, y: 1 });
  const [enemyAlive, setEnemyAlive] = useState(true);
  const [collectibles, setCollectibles] = useState<
    { id: string; type: AbilityType; position: GridPosition }[]
  >([]);
  const [levelTransitionMsg, setLevelTransitionMsg] = useState('');
  const [deathEffect, setDeathEffect] = useState<{
    position: GridPosition;
    color: string;
    enemyType: string;
  } | null>(null);
  const spawnCounter = useRef(0);
  const debugLockedPathRef = useRef<GridPosition[]>([]);

  // Ref for stable escape handler
  const statusRef = useRef(gameState.status);
  statusRef.current = gameState.status;

  const currentLevel = gameState.currentLevel;
  const mazeData = MAZE_LAYOUTS[currentLevel];
  const levelConfig = GAME_CONFIG.LEVELS[currentLevel];

  // Camera zoom is now computed dynamically inside CameraSetup based on viewport size

  // Timer
  useTimer(
    levelConfig.timeLimit,
    gameState.status,
    () => {
      audioManager.playSound(SoundType.GAME_OVER);
      audioManager.stopMusic();
      gameState.setGameOver();
    },
    (time) => {
      gameState.updateTimer(time);
    }
  );

  // Spawn collectibles: initial + respawn every RESPAWN_INTERVAL
  const spawnCollectibles = useCallback(() => {
    const exclude = new Set<string>();
    exclude.add(`${mazeData.spawnPoints.player.x},${mazeData.spawnPoints.player.y}`);
    exclude.add(`${mazeData.spawnPoints.enemy.x},${mazeData.spawnPoints.enemy.y}`);

    const positions = getRandomWalkablePositions(
      mazeData.grid,
      GAME_CONFIG.COLLECTIBLES.SPAWN_COUNT,
      exclude
    );

    spawnCounter.current += 1;
    const batch = spawnCounter.current;

    const newCollectibles = positions.map((pos, i) => ({
      id: `collectible-${currentLevel}-${batch}-${i}`,
      type: ABILITY_TYPES[i % ABILITY_TYPES.length],
      position: pos,
    }));
    setCollectibles(newCollectibles);
  }, [mazeData, currentLevel]);

  useEffect(() => {
    setEnemyAlive(true);
    setCollectibles([]);
    setDeathEffect(null);
    clearPathCache();
    spawnCounter.current = 0;

    // Initial spawn after delay
    const initialTimer = setTimeout(() => {
      spawnCollectibles();
    }, GAME_CONFIG.COLLECTIBLES.SPAWN_DELAY * 1000);

    // Respawn interval
    const respawnInterval = setInterval(() => {
      if (gameState.status === GameStatus.PLAYING) {
        spawnCollectibles();
      }
    }, GAME_CONFIG.COLLECTIBLES.RESPAWN_INTERVAL * 1000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(respawnInterval);
    };
  }, [currentLevel, mazeData]);

  // Start background music
  useEffect(() => {
    if (gameState.status === GameStatus.PLAYING) {
      audioManager.playMusic(MusicType.BACKGROUND);
    }
  }, [gameState.status]);

  // Music switching based on ability
  useEffect(() => {
    if (gameState.status !== GameStatus.PLAYING) return;

    if (gameState.activeAbility === 'tokenBurner') {
      audioManager.playMusic(MusicType.TURBO);
    } else if (gameState.activeAbility === 'vibe') {
      audioManager.playMusic(MusicType.VIBE);
    } else {
      audioManager.playMusic(MusicType.BACKGROUND);
    }
  }, [gameState.activeAbility, gameState.status]);

  // Escape key for pause — stable handler, reads status from ref
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (statusRef.current === GameStatus.PLAYING) {
          gameState.pauseGame();
        } else if (statusRef.current === GameStatus.PAUSED) {
          gameState.resumeGame();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Handle level transition
  useEffect(() => {
    if (gameState.status === GameStatus.LEVEL_TRANSITION) {
      const nextLevel = gameState.currentLevel;
      setLevelTransitionMsg(`Level ${nextLevel}: ${GAME_CONFIG.LEVELS[nextLevel].enemy.toUpperCase()}`);

      const timer = setTimeout(() => {
        setLevelTransitionMsg('');
        gameState.resumeGame();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [gameState.status, gameState.currentLevel]);

  const handleEnemyEaten = useCallback(() => {
    if (!enemyAlive) return;
    setEnemyAlive(false);

    // Death effect
    audioManager.playSound(SoundType.ENEMY_DEATH);
    audioManager.playSound(SoundType.LEVEL_COMPLETE);
    setDeathEffect({
      position: { ...enemyPos },
      color: GAME_CONFIG.ENEMIES[levelConfig.enemy]?.color || '#ff0000',
      enemyType: levelConfig.enemy,
    });

    gameState.updateScore(levelConfig.points);

    if (currentLevel === 5) {
      audioManager.stopMusic();
      setTimeout(() => {
        gameState.nextLevel();
      }, 1500);
    } else {
      setTimeout(() => {
        gameState.nextLevel();
      }, 1500);
    }
  }, [enemyAlive, currentLevel, levelConfig.points, enemyPos, levelConfig.enemy]);

  const handleCollectiblePickup = useCallback(
    (type: AbilityType) => {
      audioManager.playSound(SoundType.COLLECTIBLE_PICKUP);
      gameState.collectAbility(type);
    },
    []
  );

  const handlePillSaved = useCallback(() => {
    audioManager.playSound(SoundType.PILL_EAT);
    gameState.updateScore(PILL_POINTS);
    gameState.addPillSaved();
  }, []);

  const handlePillEatenByEnemy = useCallback(() => {
    gameState.addPillEatenByEnemy();
  }, []);

  const handlePlayerPosUpdate = useCallback((pos: GridPosition) => {
    setPlayerPos(pos);
  }, []);

  const handleEnemyPosUpdate = useCallback((pos: GridPosition) => {
    setEnemyPos(pos);
  }, []);

  const handleDeathEffectComplete = useCallback(() => {
    setDeathEffect(null);
  }, []);

  const centerX = (mazeData.width - 1) / 2;
  const centerZ = (mazeData.height - 1) / 2;

  return (
    <div style={{ width: '100%', height: '100%', position: 'fixed', top: 0, left: 0 }}>
      {levelTransitionMsg && (
        <LevelTransition
          level={gameState.currentLevel}
          enemyType={GAME_CONFIG.LEVELS[gameState.currentLevel].enemy}
        />
      )}

      <AbilityOverlay />

      <Canvas shadows={{ type: THREE.PCFShadowMap }} orthographic camera={{ position: [centerX, 25, centerZ], zoom: 1, near: 0.1, far: 100 }}>
        <CameraSetup centerX={centerX} centerZ={centerZ} mazeWidth={mazeData.width} mazeHeight={mazeData.height} />

        <ambientLight intensity={0.5} />
        <directionalLight
          position={[centerX + 10, 20, centerZ - 5]}
          intensity={0.8}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-far={50}
          shadow-camera-left={-15}
          shadow-camera-right={15}
          shadow-camera-top={15}
          shadow-camera-bottom={-15}
        />
        <pointLight position={[centerX, 5, centerZ]} intensity={0.3} />

        <Maze mazeData={mazeData} />

        <Pills
          mazeData={mazeData}
          playerPosition={playerPos}
          enemyPosition={enemyPos}
          onPillSaved={handlePillSaved}
          onPillEatenByEnemy={handlePillEatenByEnemy}
        />

        <Kiro
          spawnPosition={mazeData.spawnPoints.player}
          mazeGrid={mazeData.grid}
          enemyPosition={enemyPos}
          onPositionUpdate={handlePlayerPosUpdate}
        />

        {enemyAlive && (
          <Enemy
            type={levelConfig.enemy as EnemyType}
            spawnPosition={mazeData.spawnPoints.enemy}
            mazeGrid={mazeData.grid}
            playerPosition={playerPos}
            onEaten={handleEnemyEaten}
            onPositionUpdate={handleEnemyPosUpdate}
            debugLockedPathRef={debugLockedPathRef}
          />
        )}

        {/* Debug ability - show enemy's predicted path */}
        {gameState.activeAbility === 'debug' && (
          <DebugPath
            enemyPosition={enemyPos}
            playerPosition={playerPos}
            mazeGrid={mazeData.grid}
            lockedPathRef={debugLockedPathRef}
          />
        )}

        {/* Enemy death effect */}
        {deathEffect && (
          <EnemyDeathEffect
            position={deathEffect.position}
            color={deathEffect.color}
            enemyType={deathEffect.enemyType}
            onComplete={handleDeathEffectComplete}
          />
        )}

        {collectibles.map((c) => (
          <Collectible
            key={c.id}
            type={c.type}
            position={c.position}
            playerPosition={playerPos}
            onCollect={handleCollectiblePickup}
          />
        ))}

      </Canvas>
    </div>
  );
};

export default GameCanvas;
