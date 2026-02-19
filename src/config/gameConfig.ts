export const GAME_CONFIG = {
  FPS_TARGET: 60,
  GRID_SIZE: 1,

  LEVELS: {
    1: { enemy: 'cursor' as const, timeLimit: 60, points: 100, mazeSize: 15, enemySpeedMultiplier: 1.0 },
    2: { enemy: 'antigravity' as const, timeLimit: 75, points: 150, mazeSize: 17, enemySpeedMultiplier: 1.1 },
    3: { enemy: 'codex' as const, timeLimit: 90, points: 200, mazeSize: 19, enemySpeedMultiplier: 1.2 },
    4: { enemy: 'claude' as const, timeLimit: 120, points: 300, mazeSize: 21, enemySpeedMultiplier: 1.3 },
    5: { enemy: 'vscode' as const, timeLimit: 180, points: 500, mazeSize: 23, enemySpeedMultiplier: 1.5 },
  } as Record<number, { enemy: string; timeLimit: number; points: number; mazeSize: number; enemySpeedMultiplier: number }>,

  PLAYER: {
    BASE_SPEED: 5,
    SIZE: 0.8,
  },

  ABILITIES: {
    VIBE: {
      DURATION: 8,
      SPEED_MULTIPLIER: 3,
      PHRASES: [
        'vibing this hunting',
        'hunting is almost production ready',
        'in the zone',
        'feeling it',
      ],
    },
    TOKEN_BURNER: {
      DURATION: 3,
      SPEED_MULTIPLIER: 1.5,
    },
    DEBUG: {
      DURATION: 10,
    },
  },

  ENEMIES: {
    cursor: {
      baseSpeed: 6,
      color: '#007ACC',
      intelligence: 0.1,
      behaviorParams: {
        changeDirectionInterval: 1.5,
        evadeRadius: 2,
      },
    },
    antigravity: {
      baseSpeed: 4,
      color: '#00D4AA',
      intelligence: 0.3,
      behaviorParams: {
        verticalBias: 0.7,
        evadeRadius: 3,
      },
    },
    codex: {
      baseSpeed: 3,
      color: '#FF6B6B',
      intelligence: 0.5,
      behaviorParams: {
        patrolPoints: 4,
        evadeRadius: 5,
      },
    },
    claude: {
      baseSpeed: 5,
      color: '#D97757',
      intelligence: 0.75,
      behaviorParams: {
        pathfindingInterval: 1,
        evadeRadius: 7,
        usePathfinding: true,
      },
    },
    vscode: {
      baseSpeed: 4,
      color: '#0078D4',
      intelligence: 0.95,
      behaviorParams: {
        behaviorSwitchInterval: 6,
        evadeRadius: 8,
        pathfindingInterval: 1.5,
      },
    },
  } as Record<string, {
    baseSpeed: number;
    color: string;
    intelligence: number;
    behaviorParams: Record<string, number | boolean>;
  }>,

  COLLECTIBLES: {
    SPAWN_COUNT: 3,
    SPAWN_DELAY: 5,
    RESPAWN_INTERVAL: 10,
  },

  CAMERA: {
    POSITION: [0, 20, 0] as [number, number, number],
    ZOOM: 1,
    FRUSTUM_SIZE: 20,
  },

  CONTROLS: {
    ABILITY_KEY: 'Space',
  },
};
