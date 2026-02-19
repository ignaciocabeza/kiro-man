# Design Document

## Overview

Kiro Pacman Game is a browser-based game that reverses the classic Pacman gameplay mechanics. Built with React, Three.js (via React Three Fiber), and ZzFX for audio, the game features a top-down 3D view where the player controls Kiro (a ghost) hunting AI assistant enemies across five progressively challenging levels.

The game uses an orthographic camera for a classic top-down perspective while leveraging Three.js's 3D rendering capabilities for visual polish (lighting, shadows, smooth animations). All audio is generated procedurally using ZzFX, eliminating the need for external audio files.

## Architecture

### Technology Stack

- **React 18+**: UI framework and component structure
- **React Three Fiber (@react-three/fiber)**: Declarative Three.js wrapper
- **drei (@react-three/drei)**: Three.js helpers and utilities
- **Three.js**: 3D rendering engine (WebGL)
- **ZzFX**: Procedural 8-bit sound generation
- **Vite**: Build tool and dev server

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     React App Root                       │
│                   (Game Container)                       │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌──────▼──────┐  ┌────────▼────────┐
│  Game State    │  │   UI Layer  │  │  Audio System   │
│   Manager      │  │  (React)    │  │    (ZzFX)       │
└───────┬────────┘  └─────────────┘  └─────────────────┘
        │
┌───────▼────────────────────────────────────────────────┐
│           React Three Fiber Canvas                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Scene (Orthographic Camera)                     │  │
│  │  ├─ Lighting                                     │  │
│  │  ├─ Maze (Walls + Floor)                        │  │
│  │  ├─ Kiro (Player Character)                     │  │
│  │  ├─ Enemy (AI Character)                        │  │
│  │  └─ Collectibles (Power-ups)                    │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
App
├── GameStateProvider (Context)
├── AudioManager
└── GameContainer
    ├── LandingScreen (game state: menu)
    ├── GameCanvas (game state: playing)
    │   ├── Scene
    │   │   ├── Camera (Orthographic, top-down)
    │   │   ├── Lighting
    │   │   ├── Maze
    │   │   │   ├── Floor
    │   │   │   └── Walls[]
    │   │   ├── Kiro (Player)
    │   │   ├── Enemy
    │   │   └── Collectibles[]
    │   └── Effects (Post-processing for blur)
    ├── HUD (game state: playing)
    │   ├── ScoreDisplay
    │   ├── TimerDisplay
    │   ├── LevelDisplay
    │   └── AbilityIndicators
    ├── PauseMenu (game state: paused)
    ├── GameOverScreen (game state: game_over)
    └── VictoryScreen (game state: victory)
```

## Components and Interfaces

### 1. Game State Management

**GameState Interface**
```typescript
enum GameStatus {
  MENU = 'menu',
  PLAYING = 'playing',
  PAUSED = 'paused',
  GAME_OVER = 'game_over',
  VICTORY = 'victory'
}

interface GameState {
  status: GameStatus;
  currentLevel: number;
  score: number;
  timer: number;
  abilities: {
    vibe: boolean;
    tokenBurner: boolean;
  };
  activeAbility: 'vibe' | 'tokenBurner' | null;
}
```

**GameStateContext**
- Manages global game state using React Context
- Provides actions: startGame, pauseGame, resumeGame, restartGame, nextLevel, updateScore, updateTimer, collectAbility, activateAbility
- Persists state across component re-renders

### 2. Player Component (Kiro)

**Kiro Component**
```typescript
interface KiroProps {
  position: Vector3;
  onMove: (newPosition: Vector3) => void;
  speed: number;
  isVibeActive: boolean;
}
```

**Responsibilities:**
- Renders Kiro using provided SVG as texture on 3D plane or sprite
- Handles keyboard input (WASD/Arrow keys)
- Implements movement logic with collision detection
- Applies speed multiplier when Token Burner is active
- Implements intelligent autopilot navigation using A* pathfinding when Vibe is active

**Movement System:**
- Grid-based movement (aligns to maze grid)
- Collision detection against maze walls using raycasting or bounding box checks
- Smooth interpolation between grid positions
- Speed configurable via constants

**Movement Implementation Details:**
```typescript
// Internal state uses grid coordinates
interface GridPosition {
  x: number; // Grid column
  y: number; // Grid row
}

// Visual rendering uses world coordinates
interface WorldPosition {
  x: number; // World space X
  y: number; // World space Y (or Z in 3D)
}

// Movement flow:
// 1. Player presses key → queue direction
// 2. Check if next grid cell is valid (not wall)
// 3. If valid, start moving toward that cell
// 4. Interpolate position over time (lerp)
// 5. When reached, snap to grid position
// 6. Repeat if key still pressed
```

**Collision Detection:**
- Before moving to next grid cell, check maze grid array
- If grid[nextY][nextX] === 1 (wall), block movement
- If grid[nextY][nextX] === 0 (path), allow movement
- No complex physics needed

**Smooth Animation:**
- Use lerp (linear interpolation) for visual position
- Example: `visualPos = lerp(currentGridPos, targetGridPos, progress)`
- Progress increases based on speed and delta time
- When progress >= 1.0, snap to target and accept new input

### 3. Enemy Component

**Enemy Interface**
```typescript
interface EnemyConfig {
  type: 'cursor' | 'antigravity' | 'codex' | 'claude' | 'vscode';
  svgPath: string;
  color: string;
  speed: number;
  behaviorType: 'erratic' | 'vertical' | 'patrol' | 'chase' | 'combined';
}

interface EnemyProps {
  config: EnemyConfig;
  position: Vector3;
  playerPosition: Vector3;
  mazeData: MazeData;
}
```

**Responsibilities:**
- Renders enemy as Pacman-shaped mask over brand SVG
- Animates Pacman mouth opening/closing
- Implements AI behavior based on enemy type
- Detects collision with player

**AI Behaviors:**
1. **Cursor (Erratic)**: Random direction changes at high frequency, minimal awareness of Kiro position
2. **Antigravity (Vertical)**: Moves vertically, ignores walls occasionally, slight awareness of Kiro (moves away if very close)
3. **Codex (Patrol)**: Follows predefined patrol path, moderate awareness (changes patrol direction if Kiro approaches)
4. **Claude (Chase/Evade)**: Intelligent pathfinding that actively evades Kiro, high awareness (calculates escape routes)
5. **VSCode (Combined)**: Switches between all behaviors randomly, maximum awareness (predicts Kiro's movement and evades proactively)

**Intelligence Progression:**
- **Level 1 (Cursor)**: 10% awareness - mostly random, occasionally moves away from Kiro
- **Level 2 (Antigravity)**: 30% awareness - reacts when Kiro is within 3 tiles
- **Level 3 (Codex)**: 50% awareness - actively avoids Kiro when within 5 tiles
- **Level 4 (Claude)**: 75% awareness - uses pathfinding to maintain distance, calculates escape routes
- **Level 5 (VSCode)**: 95% awareness - predicts Kiro's path, uses optimal evasion strategies

**Evasion Strategies:**
- **Low intelligence**: Random movement with occasional direction reversal when Kiro is close
- **Medium intelligence**: Move toward tiles furthest from Kiro
- **High intelligence**: A* pathfinding to maximize distance from Kiro while avoiding dead ends
- **Maximum intelligence**: Predict Kiro's trajectory and move to positions that maximize future distance

### 4. Maze System

**Maze Data Structure**
```typescript
interface MazeData {
  width: number;
  height: number;
  grid: number[][]; // 0 = path, 1 = wall
  spawnPoints: {
    player: Vector2;
    enemy: Vector2;
    collectibles: Vector2[];
  };
}

interface MazeConfig {
  level: number;
  layout: MazeData;
}
```

**Maze Component**
- Renders walls as 3D boxes with distinct materials
- Renders floor as plane
- Provides collision detection helpers
- Five predefined maze layouts (one per level)
- Maze size increases with each level (15x15, 17x17, 19x19, 21x21, 23x23)

**Maze Generation:**
- Hardcoded layouts for each level (stored as 2D arrays)
- Each layout ensures multiple paths between points
- Spawn points defined for player, enemy, and collectibles
- Progressive complexity: more walls, longer paths in higher levels

### 5. Collectibles System

**Collectible Interface**
```typescript
interface Collectible {
  id: string;
  type: 'vibe' | 'tokenBurner';
  position: Vector3;
  collected: boolean;
}
```

**Collectible Component**
- Renders as glowing 3D shape (sphere or box)
- Distinct colors for each ability type
- Floating/rotating animation
- Collision detection with player
- Spawns at random valid maze positions

### 6. Audio System

**AudioManager**
```typescript
interface AudioManager {
  playSound: (soundType: SoundType) => void;
  playMusic: (musicType: MusicType) => void;
  stopMusic: () => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unmute: () => void;
}

enum SoundType {
  EAT = 'eat',
  ABILITY_ACTIVATE = 'ability_activate',
  COLLECTIBLE_PICKUP = 'collectible_pickup',
  LEVEL_COMPLETE = 'level_complete',
  GAME_OVER = 'game_over'
}

enum MusicType {
  BACKGROUND = 'background',
  VIBE = 'vibe',
  TURBO = 'turbo'
}
```

**ZzFX Integration:**
- Sound effects: Short ZzFX calls with specific parameters
- Music: Longer looping sequences using ZzFX
- Music tracks switch based on active ability
- Volume control affects all ZzFX output

**Sound Design:**
- Eat sound: Quick "chomp" effect
- Ability activate: Power-up sound
- Collectible pickup: Coin/pickup sound
- Level complete: Victory jingle
- Background music: Looping 8-bit melody
- Vibe music: Chill, slower tempo 8-bit track
- Turbo music: Fast-paced, energetic 8-bit track

### 7. UI Components

**HUD Component**
- Overlays on top of Three.js canvas
- Displays: Score, Timer, Level, Ability indicators
- Updates in real-time via game state
- Minimal, non-intrusive design

**LandingScreen**
- Animated Kiro SVG (floating/bobbing animation)
- Play button
- Game title
- Optional: Instructions/controls

**PauseMenu**
- Semi-transparent overlay
- Resume button
- Restart button
- Volume controls

**GameOverScreen**
- Final score display
- Restart button
- Message: "Time's Up!" or similar

**VictoryScreen**
- Final score display
- Congratulations message
- Restart button (play again)

### 8. Visual Effects

**Vibe Ability Effect**
- Post-processing blur effect using drei's `<EffectComposer>`
- Random phrase overlay (large text, centered)
- Phrases: ["vibing this hunting", "hunting is almost production ready", ...]
- Effect duration matches ability duration

**Visual Feedback**
- Enemy eat: Particle effect or flash
- Collectible pickup: Glow/sparkle effect
- Ability activation: Screen flash or color tint

## Data Models

### Configuration Constants

```typescript
// Game Configuration
export const GAME_CONFIG = {
  FPS_TARGET: 60,
  GRID_SIZE: 1, // Unit size for grid-based movement
  
  // Level Configuration
  LEVELS: {
    1: { enemy: 'cursor', timeLimit: 60, points: 100, mazeSize: 15, enemySpeedMultiplier: 1.0 },
    2: { enemy: 'antigravity', timeLimit: 75, points: 150, mazeSize: 17, enemySpeedMultiplier: 1.1 },
    3: { enemy: 'codex', timeLimit: 90, points: 200, mazeSize: 19, enemySpeedMultiplier: 1.2 },
    4: { enemy: 'claude', timeLimit: 120, points: 300, mazeSize: 21, enemySpeedMultiplier: 1.3 },
    5: { enemy: 'vscode', timeLimit: 180, points: 500, mazeSize: 23, enemySpeedMultiplier: 1.5 }
  },
  
  // Player Configuration
  PLAYER: {
    BASE_SPEED: 5,
    SIZE: 0.8
  },
  
  // Ability Configuration
  ABILITIES: {
    VIBE: {
      DURATION: 5, // seconds
      PHRASES: [
        "vibing this hunting",
        "hunting is almost production ready",
        "in the zone",
        "feeling it"
      ]
    },
    TOKEN_BURNER: {
      DURATION: 3, // seconds
      SPEED_MULTIPLIER: 1.5
    }
  },
  
  // Enemy Configuration
  ENEMIES: {
    cursor: {
      baseSpeed: 6,
      color: '#007ACC',
      intelligence: 0.1, // 10% awareness
      behaviorParams: { 
        changeDirectionInterval: 0.5,
        evadeRadius: 2 // tiles
      }
    },
    antigravity: {
      baseSpeed: 4,
      color: '#00D4AA',
      intelligence: 0.3, // 30% awareness
      behaviorParams: { 
        verticalBias: 0.7,
        evadeRadius: 3
      }
    },
    codex: {
      baseSpeed: 3,
      color: '#FF6B6B',
      intelligence: 0.5, // 50% awareness
      behaviorParams: { 
        patrolPoints: 4,
        evadeRadius: 5
      }
    },
    claude: {
      baseSpeed: 5,
      color: '#D97757',
      intelligence: 0.75, // 75% awareness
      behaviorParams: { 
        pathfindingInterval: 1,
        evadeRadius: 7,
        usePathfinding: true
      }
    },
    vscode: {
      baseSpeed: 7,
      color: '#0078D4',
      intelligence: 0.95, // 95% awareness
      behaviorParams: { 
        behaviorSwitchInterval: 3,
        evadeRadius: 8,
        predictiveEvasion: true
      }
    }
  },
  
  // Collectible Configuration
  COLLECTIBLES: {
    SPAWN_COUNT: 2, // Per level
    SPAWN_DELAY: 5 // Seconds after level start
  },
  
  // Camera Configuration
  CAMERA: {
    POSITION: [0, 20, 0], // Top-down view
    ZOOM: 1,
    FRUSTUM_SIZE: 20
  }
};
```

### Level Data

```typescript
// Maze layouts stored as 2D arrays
export const MAZE_LAYOUTS: Record<number, MazeData> = {
  1: {
    width: 15,
    height: 15,
    grid: [
      // 0 = path, 1 = wall
      // ... 15x15 array
    ],
    spawnPoints: {
      player: { x: 1, y: 1 },
      enemy: { x: 13, y: 13 },
      collectibles: [
        { x: 7, y: 7 },
        { x: 3, y: 11 }
      ]
    }
  },
  2: {
    width: 17,
    height: 17,
    // ... larger, more complex maze
  },
  3: {
    width: 19,
    height: 19,
    // ... even larger maze
  },
  4: {
    width: 21,
    height: 21,
    // ... larger still
  },
  5: {
    width: 23,
    height: 23,
    // ... largest, most complex maze
  }
};
```

## Error Handling

### Collision Detection Errors
- Validate maze bounds before movement
- Fallback to previous valid position if collision detected
- Log warnings for unexpected collision states

### Audio Errors
- Gracefully handle ZzFX failures (browser compatibility)
- Provide mute option if audio context fails
- Continue game without audio if necessary

### Asset Loading Errors
- Fallback to colored shapes if SVG fails to load
- Display error message for critical asset failures
- Retry mechanism for network-related failures

### Game State Errors
- Validate state transitions
- Reset to safe state (menu) on critical errors
- Preserve score/progress where possible

## Testing Strategy

### Unit Tests
- Game state management logic
- Collision detection algorithms
- AI pathfinding functions
- Score calculation
- Timer countdown logic

### Component Tests
- Player movement with mocked input
- Enemy behavior patterns
- Collectible spawn logic
- UI component rendering
- Audio manager functions

### Integration Tests
- Complete level flow (start → eat enemy → next level)
- Ability collection and activation
- Game over scenarios (timer expiration)
- Victory condition (eating VSCode)
- Pause/resume functionality

### Manual Testing
- Performance testing (maintain 30+ FPS)
- Visual quality check (animations, effects)
- Audio quality (sound effects, music transitions)
- Cross-browser compatibility
- Keyboard input responsiveness

### Test Data
- Predefined maze layouts for consistent testing
- Mock game states for UI testing
- Recorded input sequences for replay testing

## Performance Considerations

### Optimization Strategies
1. **Rendering**: Use instanced meshes for repeated geometry (walls)
2. **Collision Detection**: Grid-based spatial partitioning
3. **AI**: Limit pathfinding calculations (run every N frames)
4. **Audio**: Reuse ZzFX sound buffers
5. **React**: Memoize expensive components, use React.memo
6. **Three.js**: Dispose of geometries/materials on unmount

### Performance Targets
- 60 FPS on modern browsers (Chrome, Firefox, Safari)
- 30 FPS minimum on older hardware
- Load time < 2 seconds for initial level
- Level transition < 1 second

## Technical Constraints

### Browser Support
- Modern browsers with WebGL support
- ES6+ JavaScript features
- Web Audio API support (for ZzFX)

### Device Requirements
- Minimum: Integrated GPU, 4GB RAM
- Keyboard required (no touch/mobile support in MVP)

### Asset Requirements
- Kiro SVG (provided)
- Enemy brand SVGs (5 total: Cursor, Antigravity, Codex, Claude, VSCode)
- All other visuals generated programmatically

## Implementation Notes

### SVG Integration
- Load SVGs using drei's `<Image>` or convert to textures
- Apply Pacman mask using Three.js stencil buffer or shader
- Animate mask (mouth opening/closing) using uniform updates

### Pathfinding (Claude Enemy & Vibe Ability)
- Implement A* algorithm for grid-based pathfinding
- Used by Claude enemy for intelligent chasing/evading
- Used by Vibe ability for smart autopilot navigation
- Cache paths, recalculate only when player/enemy moves significantly
- Add randomness to Claude's behavior to avoid perfect tracking
- Vibe ability uses optimal pathfinding without randomness

### Post-Processing (Blur Effect)
- Use drei's `<EffectComposer>` with `<Bloom>` or custom blur pass
- Toggle effect on/off based on Vibe ability state
- Optimize blur radius for performance

### ZzFX Music Generation
- Create looping sequences by chaining ZzFX calls
- Use setTimeout/setInterval for rhythm
- Implement smooth transitions between tracks

### Grid-Based Movement
- Snap positions to grid for consistent collision detection
- Interpolate visually for smooth animation
- Use grid coordinates internally, world coordinates for rendering
- Movement is tile-by-tile with smooth transitions

**Implementation approach:**
1. Maintain separate grid position (logical) and world position (visual)
2. On input, check if next grid tile is walkable
3. If walkable, begin interpolation to that tile
4. Update visual position each frame using lerp
5. When interpolation complete, update grid position and accept new input
6. This gives responsive controls with smooth visuals

**Benefits:**
- Simple collision detection (just check grid array)
- Predictable movement (like classic Pacman)
- Easy AI pathfinding (works on same grid)
- Smooth visuals (interpolation hides grid snapping)
