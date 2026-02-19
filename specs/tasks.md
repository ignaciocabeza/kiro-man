# Implementation Plan

## Overview
This implementation plan breaks down the Kiro Pacman Game into discrete, manageable coding tasks. Each task builds incrementally on previous work, ensuring the game is functional at each stage.

---

- [x] 1. Set up project structure and dependencies
  - Initialize React + Vite project with `npm create vite@latest kiro-pacman-game -- --template react-ts`
  - Install dependencies: `npm install @react-three/fiber @react-three/drei @react-three/postprocessing three`
  - Install ZzFX: `npm install zzfx` or copy zzfx.js into project
  - Create folder structure: 
    - `/src/components` (React components)
    - `/src/hooks` (custom React hooks)
    - `/src/utils` (helper functions, pathfinding)
    - `/src/config` (game constants)
    - `/src/assets` (SVG files)
    - `/src/types` (TypeScript interfaces)
  - Configure tsconfig.json for strict type checking
  - Set up basic App.tsx with Canvas from @react-three/fiber
  - _Requirements: 11.1_

- [x] 2. Create game configuration constants
  - Create `/src/config/gameConfig.ts` file
  - Export GAME_CONFIG object with nested configuration:
    - FPS_TARGET: 60
    - GRID_SIZE: 1 (unit size for each grid cell)
    - LEVELS: Object with keys 1-5, each containing { enemy, timeLimit, points, mazeSize, enemySpeedMultiplier }
    - PLAYER: { BASE_SPEED: 5, SIZE: 0.8 }
    - ABILITIES: { VIBE: { DURATION: 5, PHRASES: [...] }, TOKEN_BURNER: { DURATION: 3, SPEED_MULTIPLIER: 1.5 } }
    - ENEMIES: Object with keys for each enemy type containing { baseSpeed, color, intelligence, behaviorParams }
    - COLLECTIBLES: { SPAWN_COUNT: 2, SPAWN_DELAY: 5 }
    - CAMERA: { POSITION: [0, 20, 0], ZOOM: 1, FRUSTUM_SIZE: 20 }
    - CONTROLS: { ABILITY_KEY: 'Space' }
  - Add TypeScript types for all config objects
  - _Requirements: 2.6, 2.9, 2.10, 8.7_

- [x] 3. Prepare SVG assets
  - Create `/src/assets/` directory
  - Add kiro.svg (provided by user)
  - Create or find SVG icons for enemies:
    - cursor.svg - Blue/white themed icon representing Cursor AI
    - antigravity.svg - Green/teal themed icon
    - codex.svg - Orange/red themed icon
    - claude.svg - Orange/beige themed icon
    - vscode.svg - Blue themed icon (larger for boss)
  - Ensure all SVGs are optimized and similar size (recommend 64x64px base size)
  - Use simple, recognizable shapes that work well with Pacman mask
  - Alternative: Use colored circles with letters (C, A, C, C, V) if SVGs unavailable
  - _Requirements: 1.3, 2.2_

- [x] 3. Implement game state management
  - [x] 3.1 Create GameState context and provider
    - Create `/src/contexts/GameStateContext.tsx`
    - Define GameStatus enum: MENU, PLAYING, PAUSED, GAME_OVER, VICTORY
    - Define GameState interface with properties: status, currentLevel, score, timer, abilities: { vibe: boolean, tokenBurner: boolean }, activeAbility
    - Create GameStateContext using React.createContext
    - Implement GameStateProvider component with useState for state management
    - Implement action functions: startGame() sets status to PLAYING and level to 1, pauseGame() sets status to PAUSED, resumeGame() sets status to PLAYING, restartGame() resets all state, nextLevel() increments level, updateScore(points) adds to score, updateTimer(seconds) sets timer
    - Export useGameState hook for consuming context
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  
  - [x] 3.2 Implement ability state management
    - Add collectAbility(type: 'vibe' | 'tokenBurner') action that sets abilities[type] = true
    - Add activateAbility(type) action that sets activeAbility = type and abilities[type] = false
    - Add deactivateAbility() action that sets activeAbility = null
    - Use setTimeout to auto-deactivate abilities after duration from config
    - _Requirements: 8.2, 8.3, 8.6_

- [x] 4. Create maze system
  - [x] 4.1 Define maze data structures and design levels
    - Create `/src/config/mazeLayouts.ts`
    - Define MazeData interface: { width: number, height: number, grid: number[][], spawnPoints: { player: Vector2, enemy: Vector2, collectibles: Vector2[] } }
    - Create MAZE_LAYOUTS object with 5 detailed maze configurations:
    
    **Level 1 (15x15) - Tutorial Maze:**
    - Simple open layout with minimal walls
    - Wide corridors (2-3 tiles wide)
    - Few dead ends
    - Player spawns bottom-left, enemy spawns top-right (maximum distance)
    - 2 collectible spawn points in center area
    - Design goal: Easy to navigate, enemy easy to catch
    
    **Level 2 (17x17) - Corridor Maze:**
    - More walls creating corridor structure
    - Mix of 1-tile and 2-tile wide passages
    - Some dead ends but always alternate paths
    - Player spawns left side, enemy spawns right side
    - Collectibles in opposite corners
    - Design goal: Requires some navigation, enemy moderately difficult
    
    **Level 3 (19x19) - Room Maze:**
    - Multiple "rooms" connected by corridors
    - 4-5 distinct open areas
    - More dead ends, requires backtracking
    - Player spawns center-bottom, enemy spawns center-top
    - Collectibles in side rooms
    - Design goal: Strategic movement required, enemy uses patrol effectively
    
    **Level 4 (21x21) - Complex Maze:**
    - Dense wall structure with winding paths
    - Many intersections and decision points
    - Several dead ends and loops
    - Player spawns corner, enemy spawns opposite corner
    - Collectibles hidden in maze interior
    - Design goal: Challenging navigation, enemy AI shines with pathfinding
    
    **Level 5 (23x23) - Boss Arena:**
    - Large central open area (5x5) for boss fight
    - Surrounding maze with multiple entry points to center
    - Pillars/obstacles in center area
    - Outer maze is complex with many paths to center
    - Player spawns in outer maze, enemy spawns in center
    - Collectibles in outer maze corners
    - Design goal: Epic final battle, requires power-ups to win
    
    - Use 0 for walkable paths, 1 for walls
    - Manually create each grid as 2D array
    - Ensure spawn points are on walkable tiles (grid[y][x] === 0)
    - Verify multiple paths exist between spawn points by manual testing
    - _Requirements: 6.1, 6.3, 2.9_
  
  - [x] 4.2 Implement Maze component
    - Create `/src/components/Maze.tsx`
    - Accept props: mazeData (MazeData)
    - Map over grid array to create wall positions
    - For each cell where grid[y][x] === 1, render a <Box> at position [x * GRID_SIZE, 0.5, y * GRID_SIZE]
    - Set box dimensions to [GRID_SIZE, 1, GRID_SIZE]
    - Apply MeshStandardMaterial with color for walls
    - Render floor as <Plane> with rotation [-Math.PI / 2, 0, 0] and size [width * GRID_SIZE, height * GRID_SIZE]
    - Apply different material/color for floor
    - _Requirements: 6.1, 6.2, 11.5_
  
  - [x] 4.3 Create collision detection utilities
    - Create `/src/utils/collision.ts`
    - Implement isWalkable(x: number, y: number, mazeGrid: number[][]): boolean
      - Check if x, y are within grid bounds
      - Return mazeGrid[y][x] === 0
    - Implement getValidNeighbors(x: number, y: number, mazeGrid: number[][]): Vector2[]
      - Return array of adjacent walkable cells (up, down, left, right)
      - Used for pathfinding
    - _Requirements: 1.2_

- [x] 5. Implement grid-based movement system
  - [x] 5.1 Create movement utilities
    - Create `/src/utils/movement.ts`
    - Implement gridToWorld(gridX: number, gridY: number): Vector3
      - Convert grid coordinates to world coordinates
      - Return [gridX * GRID_SIZE, 0, gridY * GRID_SIZE]
    - Implement worldToGrid(worldX: number, worldZ: number): Vector2
      - Convert world coordinates to grid coordinates
      - Return { x: Math.round(worldX / GRID_SIZE), y: Math.round(worldZ / GRID_SIZE) }
    - Implement lerp(start: number, end: number, t: number): number
      - Linear interpolation: start + (end - start) * t
    - Create useGridMovement custom hook
      - Manages gridPosition (current grid cell) and worldPosition (visual position)
      - Manages targetGridPosition (next grid cell to move to)
      - Manages moveProgress (0 to 1, interpolation progress)
      - Returns { gridPosition, worldPosition, moveToGrid(x, y), update(deltaTime) }
    - _Requirements: 1.1, 1.4, 1.5_
  
  - [x] 5.2 Implement collision detection for movement
    - In useGridMovement hook, add mazeGrid parameter
    - In moveToGrid function, call isWalkable(targetX, targetY, mazeGrid)
    - Only set targetGridPosition if isWalkable returns true
    - In update function, interpolate worldPosition toward targetGridPosition
    - When moveProgress >= 1, snap gridPosition to targetGridPosition and reset progress
    - _Requirements: 1.2_

- [x] 6. Create Kiro (player) component
  - [x] 6.1 Implement Kiro rendering
    - Create `/src/components/Kiro.tsx`
    - Load Kiro SVG from `/src/assets/kiro.svg` using useLoader(TextureLoader)
    - Create <Sprite> or <Plane> with SVG texture
    - Set scale based on PLAYER.SIZE from config
    - Position at worldPosition from movement hook
    - Add rotation to face movement direction
    - _Requirements: 1.3_
  
  - [x] 6.2 Implement keyboard input handling
    - Use useEffect to add keydown and keyup event listeners
    - Track pressed keys in state: { up, down, left, right, ability }
    - Map WASD and arrow keys to directions
    - Map Space key to ability activation
    - When Space pressed and ability available, call gameState.activateAbility(type)
    - Store current direction in state
    - Clean up listeners on unmount
    - _Requirements: 1.1, 1.4, 8.4, 8.5_
  
  - [x] 6.3 Implement Kiro movement logic
    - Use useGridMovement hook with current level's mazeGrid
    - In useFrame hook, calculate deltaTime
    - Get current speed: baseSpeed * (activeAbility === 'tokenBurner' ? TOKEN_BURNER.SPEED_MULTIPLIER : 1)
    - If direction key pressed and not currently moving, call moveToGrid with next grid position
    - Call movement.update(deltaTime * speed) to interpolate position
    - Update Kiro position to movement.worldPosition
    - _Requirements: 1.1, 1.2, 1.4, 8.5_
  
  - [x] 6.4 Implement Vibe ability autopilot
    - Create `/src/utils/pathfinding.ts` with findPath function (A* algorithm)
    - When activeAbility === 'vibe', override manual input
    - Call findPath(kiroGridPos, enemyGridPos, mazeGrid) to get path
    - Follow path by moving to next grid cell in path array
    - Recalculate path every 0.5 seconds or when enemy moves significantly
    - _Requirements: 8.4_

- [x] 7. Implement A* pathfinding algorithm
  - In `/src/utils/pathfinding.ts`, implement findPath(start: Vector2, goal: Vector2, mazeGrid: number[][]): Vector2[]
  - Create Node class with properties: position, g (cost from start), h (heuristic to goal), f (g + h), parent
  - Initialize openList with start node, closedList as empty
  - While openList not empty:
    - Get node with lowest f score from openList
    - If node is goal, reconstruct path by following parent pointers
    - Move node to closedList
    - For each valid neighbor (from getValidNeighbors):
      - Calculate g score (current g + 1)
      - If neighbor in closedList with lower g, skip
      - If neighbor not in openList or has lower g, update and add to openList
  - Use Manhattan distance for heuristic: |x1 - x2| + |y1 - y2|
  - Return path as array of Vector2 positions
  - Add path caching with Map<string, Vector2[]> keyed by "startX,startY,goalX,goalY"
  - _Requirements: 3.4, 8.4_

- [x] 8. Create Enemy component
  - [x] 8.1 Implement enemy rendering
    - Create `/src/components/Enemy.tsx`
    - Accept props: type ('cursor' | 'antigravity' | 'codex' | 'claude' | 'vscode'), position, playerPosition, mazeData
    - Load enemy SVG based on type (placeholder: use colored circle if SVG not available)
    - Create Pacman mask using custom shader or stencil buffer:
      - Draw circle geometry
      - Cut out wedge (30-degree angle) for mouth
      - Apply SVG as texture within mask
    - Apply color from ENEMIES[type].color config
    - Position at worldPosition from movement
    - _Requirements: 2.2, 3.1-3.5_
  
  - [x] 8.2 Animate Pacman mouth
    - Track mouthAngle state (0 to 30 degrees)
    - In useFrame, oscillate mouthAngle: mouthAngle = 15 + 15 * Math.sin(time * 5)
    - Update mask geometry to reflect current mouthAngle
    - Rotate mouth to face movement direction
    - _Requirements: 11.4_
  
  - [x] 8.3 Implement base enemy movement
    - Use useGridMovement hook with mazeGrid
    - Calculate effective speed: ENEMIES[type].baseSpeed * LEVELS[currentLevel].enemySpeedMultiplier
    - In useFrame, call movement.update(deltaTime * effectiveSpeed)
    - Update enemy position to movement.worldPosition
    - _Requirements: 3.1-3.5, 2.10_
  
  - [x] 8.4 Implement enemy AI behaviors
    - Create `/src/utils/enemyAI.ts` with behavior functions
    - Cursor behavior: Every changeDirectionInterval seconds, pick random valid direction
    - Antigravity behavior: Prefer vertical movement (70% chance), occasionally ignore walls
    - Codex behavior: Define patrol path (4 waypoints), move toward next waypoint
    - Claude behavior: Use findPath to move away from player, recalculate every pathfindingInterval
    - VSCode behavior: Randomly switch between all behaviors every behaviorSwitchInterval
    - Each behavior returns next grid position to move to
    - _Requirements: 3.1-3.5, 2.10_
  
  - [x] 8.5 Implement progressive evasion intelligence
    - Calculate distance to player: Math.sqrt((ex - px)^2 + (ey - py)^2)
    - Get intelligence level from ENEMIES[type].intelligence
    - If distance < evadeRadius and Math.random() < intelligence:
      - Low intelligence (< 0.3): Move in opposite direction of player
      - Medium intelligence (0.3-0.6): Move to neighbor cell furthest from player
      - High intelligence (> 0.6): Use findPath to maximize distance from player
    - Otherwise, use base behavior
    - For VSCode, add predictive evasion: calculate player velocity and predict future position
    - _Requirements: 2.10, 3.4, 3.5_
  
  - [x] 8.6 Implement collision detection with Kiro
    - In useFrame, check if enemy.gridPosition equals player.gridPosition
    - If collision detected, call onEaten callback prop
    - Parent component handles removing enemy and updating score
    - _Requirements: 4.1_

- [x] 9. Create collectibles system
  - [x] 9.1 Implement Collectible component
    - Create `/src/components/Collectible.tsx`
    - Accept props: type ('vibe' | 'tokenBurner'), position, onCollect
    - Render as <Sphere> with radius 0.3
    - Apply emissive material with color based on type (purple for vibe, orange for tokenBurner)
    - Add <pointLight> inside sphere for glow effect
    - In useFrame, animate floating: position.y = baseY + Math.sin(time * 2) * 0.2
    - Add rotation animation: rotation.y += deltaTime
    - _Requirements: 8.1_
  
  - [x] 9.2 Implement collectible spawning
    - Create `/src/hooks/useCollectibles.ts` hook
    - On level start, wait COLLECTIBLES.SPAWN_DELAY seconds
    - Generate COLLECTIBLES.SPAWN_COUNT random positions from mazeData.spawnPoints.collectibles
    - Randomly assign types (50% vibe, 50% tokenBurner)
    - Return array of collectible objects: { id, type, position, collected: false }
    - _Requirements: 8.1_
  
  - [x] 9.3 Implement collectible pickup
    - In Collectible component useFrame, check distance to player position
    - If distance < 0.5 (collision threshold), call onCollect(type)
    - In parent component, handle onCollect by:
      - Calling gameState.collectAbility(type)
      - Setting collectible.collected = true
      - Triggering pickup visual effect (scale up and fade out)
      - Playing pickup sound
    - Remove collected collectibles from render
    - _Requirements: 8.2, 8.3, 9.6_

- [x] 10. Implement game loop and level management
  - [x] 10.1 Create level timer
    - Create `/src/hooks/useTimer.ts` hook
    - Accept initialTime parameter from LEVELS[currentLevel].timeLimit
    - Use useEffect with setInterval to decrement timer every 1000ms
    - When timer reaches 0, call onTimeUp callback
    - Pause timer when gameState.status === PAUSED
    - Return current timer value
    - In parent component, call gameState.updateTimer(timer) to sync state
    - _Requirements: 2.6, 2.7, 5.4, 5.5_
  
  - [x] 10.2 Implement level completion logic
    - In GameCanvas component, handle enemy onEaten callback
    - Call gameState.updateScore(LEVELS[currentLevel].points)
    - Play level complete sound
    - Show level complete message for 3 seconds
    - Call gameState.nextLevel()
    - Reset timer to new level's timeLimit
    - Respawn player and enemy at new level's spawn points
    - Clear collected collectibles
    - _Requirements: 2.3, 2.8, 4.2, 4.3_
  
  - [x] 10.3 Implement victory condition
    - In level completion logic, check if currentLevel === 5
    - If true, set gameState.status = VICTORY instead of calling nextLevel
    - Display VictoryScreen with final score
    - _Requirements: 2.5, 4.5_
  
  - [x] 10.4 Implement game over condition
    - In useTimer hook, when timer reaches 0, call onTimeUp
    - In parent component, handle onTimeUp by setting gameState.status = GAME_OVER
    - Display GameOverScreen with final score and restart button
    - _Requirements: 2.7, 7.6_

- [x] 11. Create UI components
  - [x] 11.1 Implement HUD
    - Create `/src/components/HUD.tsx`
    - Use absolute positioning to overlay on canvas
    - Display score: `<div>Score: {gameState.score}</div>` (top-left)
    - Display level: `<div>Level {gameState.currentLevel}: {LEVELS[currentLevel].enemy}</div>` (top-center)
    - Display timer: `<div>Time: {gameState.timer}s</div>` (top-right)
    - Display ability indicators (bottom-center):
      - Show Vibe icon with checkmark if gameState.abilities.vibe === true
      - Show Token Burner icon with checkmark if gameState.abilities.tokenBurner === true
      - Display "Press SPACE to activate" text when ability available
      - Highlight active ability with glow effect
    - Display controls hint: "WASD/Arrows: Move | SPACE: Use Ability | ESC: Pause"
    - Use useEffect to update display within 100ms of state changes
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 9.1, 9.2_
  
  - [x] 11.2 Create LandingScreen
    - Create `/src/components/LandingScreen.tsx`
    - Center container with game title "Kiro Pacman"
    - Load and display Kiro SVG with CSS animation (floating: translateY oscillation)
    - Add "Play" button that calls gameState.startGame() on click
    - Style with retro/8-bit aesthetic
    - _Requirements: 7.1, 7.2_
  
  - [x] 11.3 Create PauseMenu
    - Create `/src/components/PauseMenu.tsx`
    - Semi-transparent dark overlay covering full screen
    - Center modal with "Paused" title
    - "Resume" button calls gameState.resumeGame()
    - "Restart" button shows confirmation dialog:
      - "Are you sure? Your progress will be lost."
      - "Yes" button calls gameState.restartGame()
      - "No" button closes dialog
    - Volume slider (0-100) that calls audioManager.setVolume(value / 100)
    - Mute checkbox that calls audioManager.mute() / unmute()
    - _Requirements: 7.3, 7.4, 7.5, 10.4_
  
  - [x] 11.4 Create GameOverScreen
    - Create `/src/components/GameOverScreen.tsx`
    - Full screen overlay with dark background
    - Display "Time's Up!" message
    - Display final score: `<div>Final Score: {gameState.score}</div>`
    - "Restart" button calls gameState.restartGame()
    - _Requirements: 5.6, 7.6_
  
  - [x] 11.5 Create VictoryScreen
    - Create `/src/components/VictoryScreen.tsx`
    - Full screen overlay with celebratory background
    - Display "Victory!" message
    - Display final score with animation
    - "Play Again" button calls gameState.restartGame()
    - _Requirements: 2.5, 5.6_

- [x] 12. Implement visual effects
  - [x] 12.1 Set up post-processing
    - Install @react-three/postprocessing: `npm install @react-three/postprocessing`
    - In GameCanvas, wrap scene with `<EffectComposer>`
    - Add `<Bloom>` effect for glow
    - Add custom blur pass (or use `<DepthOfField>` with high blur)
    - Control blur intensity with state variable
    - _Requirements: 9.3_
  
  - [x] 12.2 Implement Vibe ability visual effects
    - When gameState.activeAbility === 'vibe', set blur intensity to high value
    - Select random phrase from ABILITIES.VIBE.PHRASES
    - Display phrase as large centered text overlay (position: fixed, z-index: 1000)
    - Style with retro font, white color, text-shadow for visibility
    - When ability ends, animate blur intensity back to 0 over 500ms
    - Fade out phrase over 500ms
    - _Requirements: 9.3, 9.4, 9.5_
  
  - [x] 12.3 Implement visual feedback effects
    - Create `/src/components/ParticleEffect.tsx` for reusable particle system
    - Enemy eat effect: Spawn 20 particles at enemy position, radial explosion, fade out over 0.5s
    - Collectible pickup effect: Spawn 10 particles at collectible position, upward motion, fade out
    - Ability activation effect: Flash screen with colored overlay (vibe = purple, tokenBurner = orange), fade over 0.3s
    - Use drei's `<Billboard>` for particles to face camera
    - _Requirements: 4.4, 9.6_

- [x] 13. Implement ZzFX audio system
  - [x] 13.1 Create AudioManager
    - Create `/src/utils/audioManager.ts`
    - Import zzfx library
    - Create AudioManager class with methods:
      - playSound(type: SoundType): void - plays one-shot sound effect
      - playMusic(type: MusicType): void - starts looping music track
      - stopMusic(): void - stops current music
      - setVolume(volume: number): void - sets master volume (0-1)
      - mute(): void - sets volume to 0
      - unmute(): void - restores previous volume
    - Store current music type and interval ID for looping
    - Export singleton instance
    - _Requirements: 10.4_
  
  - [x] 13.2 Generate sound effects with ZzFX
    - Define sound effect parameters as constants:
    - Eat sound: zzfx(...[,,925,.04,.3,.6,1,.3,,6.27,-184,.09,.17]) - quick chomp
    - Ability activation: zzfx(...[,,261,.01,.11,.3,,.76,,,,,,.5,,.2]) - power-up
    - Collectible pickup: zzfx(...[,,783,.01,.08,.15,,.5,,,,,,.5]) - coin pickup
    - Level complete: zzfx(...[,,523,.04,.2,.4,1,.3,,,,,.1]) - victory jingle
    - In playSound method, call zzfx with appropriate parameters based on type
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [x] 13.3 Generate music tracks with ZzFX
    - Create looping sequences using arrays of notes
    - Background music: Simple 8-bit melody, 4-bar loop, moderate tempo
      - Define note sequence: [C4, E4, G4, E4, ...] with durations
      - Use setInterval to play notes in sequence
    - Vibe music: Slower tempo, chill progression, use lower frequencies
    - Turbo music: Fast tempo, energetic, use higher frequencies and shorter notes
    - Store interval IDs to clear when stopping music
    - _Requirements: 10.5, 10.6_
  
  - [x] 13.4 Implement music switching
    - In playMusic method, call stopMusic() first to clear current music
    - Start new music loop based on type parameter
    - In GameCanvas component, use useEffect to watch gameState.activeAbility
    - When activeAbility === 'tokenBurner', call audioManager.playMusic('turbo')
    - When activeAbility === 'vibe', call audioManager.playMusic('vibe')
    - When activeAbility === null, call audioManager.playMusic('background')
    - Add 500ms fade transition by gradually adjusting volume
    - _Requirements: 10.5, 10.6, 10.7_

- [x] 14. Set up Three.js scene and camera
  - [x] 14.1 Configure Canvas and Scene
    - In `/src/components/GameCanvas.tsx`, import Canvas from @react-three/fiber
    - Set up Canvas with props: camera={{ position: [0, 20, 0], fov: 50 }}
    - Use orthographic camera: `<OrthographicCamera makeDefault position={[0, 20, 0]} zoom={1} />`
    - Set frustum size based on maze dimensions: left/right/top/bottom calculated from CAMERA.FRUSTUM_SIZE
    - Point camera down at origin: lookAt([0, 0, 0])
    - _Requirements: 6.4, 11.1_
  
  - [x] 14.2 Add lighting
    - Add `<ambientLight intensity={0.5} />` for base illumination
    - Add `<directionalLight position={[10, 20, 5]} intensity={0.8} castShadow />` for shadows
    - Configure shadow camera bounds to cover maze area
    - Enable shadows on Canvas: `<Canvas shadows>`
    - Set receiveShadow on floor mesh, castShadow on walls, Kiro, and enemies
    - _Requirements: 11.5_

- [x] 15. Integrate all components into main game
  - [x] 15.1 Create GameCanvas component
    - Create `/src/components/GameCanvas.tsx`
    - Set up Canvas with OrthographicCamera and lighting
    - Get current level's mazeData from MAZE_LAYOUTS[gameState.currentLevel]
    - Render `<Maze mazeData={mazeData} />`
    - Render `<Kiro position={playerSpawn} mazeData={mazeData} />`
    - Render `<Enemy type={levelConfig.enemy} position={enemySpawn} playerPosition={kiroPosition} mazeData={mazeData} onEaten={handleEnemyEaten} />`
    - Render collectibles array: `{collectibles.map(c => <Collectible key={c.id} {...c} onCollect={handleCollect} />)}`
    - Add `<EffectComposer>` with effects
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  
  - [x] 15.2 Create GameContainer component
    - Create `/src/components/GameContainer.tsx`
    - Use useGameState hook to access game state
    - Conditionally render based on gameState.status:
      - MENU: `<LandingScreen />`
      - PLAYING: `<><GameCanvas /><HUD /></>`
      - PAUSED: `<><GameCanvas /><HUD /><PauseMenu /></>`
      - GAME_OVER: `<GameOverScreen />`
      - VICTORY: `<VictoryScreen />`
    - Initialize audioManager and start background music when game starts
    - _Requirements: 7.1-7.6_
  
  - [x] 15.3 Wire up App component
    - In `/src/App.tsx`, import GameStateProvider and GameContainer
    - Wrap app with GameStateProvider: `<GameStateProvider><GameContainer /></GameStateProvider>`
    - Add React ErrorBoundary component:
      - Create `/src/components/ErrorBoundary.tsx`
      - Implement componentDidCatch to log errors
      - Display fallback UI: "Something went wrong. Please refresh the page."
      - Wrap GameContainer with ErrorBoundary
    - Add global styles for full-screen canvas and UI overlays
    - Set body margin to 0, overflow hidden
    - _Requirements: All_

- [x] 16. Implement pause functionality
  - In GameCanvas component, use useEffect to add keydown event listener
  - Listen for 'Escape' key press
  - When detected and gameState.status === PLAYING, call gameState.pauseGame()
  - When detected and gameState.status === PAUSED, call gameState.resumeGame()
  - In useTimer hook, check if gameState.status === PAUSED before decrementing timer
  - In Enemy and Kiro components, skip movement updates when paused
  - Clean up event listener on unmount
  - _Requirements: 7.3, 7.4_

- [x] 17. Performance optimization
  - Wrap Maze, Kiro, Enemy, Collectible components with React.memo to prevent unnecessary re-renders
  - In Maze component, use `<instancedMesh>` for walls instead of individual Box components:
    - Create single geometry and material
    - Use instancing to render all walls in one draw call
    - Set matrix for each wall position
  - In pathfinding, implement path caching with Map<string, Vector2[]>
  - Cache key format: `${startX},${startY},${goalX},${goalY}`
  - Clear cache when maze changes (level transition)
  - In all Three.js components, use useEffect cleanup to dispose geometries and materials:
    - `return () => { geometry.dispose(); material.dispose(); }`
  - Use drei's `<Preload />` to preload assets
  - _Requirements: 1.5, 11.2_

- [x] 18. Final polish and bug fixes
  - Test complete game flow: Landing → Level 1 → Level 2 → ... → Level 5 → Victory
  - Test game over scenario: Let timer run out, verify game over screen appears
  - Test pause/resume: Press ESC during gameplay, verify game pauses and resumes correctly
  - Test abilities:
    - Collect Vibe power-up, activate with key, verify autopilot and visual effects
    - Collect Token Burner, activate, verify speed increase and music change
  - Test enemy behaviors: Verify each enemy type moves according to its AI pattern
  - Test progressive difficulty: Verify enemies get smarter and faster in later levels
  - Verify animations are smooth (60 FPS target)
  - Test audio: Verify all sound effects play correctly, music transitions smoothly
  - Test in multiple browsers: Chrome, Firefox, Safari
  - Fix any collision detection issues (Kiro getting stuck, enemies passing through walls)
  - Adjust timing constants if gameplay feels too fast/slow
  - Polish UI styling for consistent retro aesthetic
  - Add loading screen if needed for asset loading
  - _Requirements: All_
