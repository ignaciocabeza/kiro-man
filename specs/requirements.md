# Requirements Document

## Introduction

Kiro Pacman Game is a browser-based 3D game built with Three.js that reverses the classic Pacman gameplay. The player controls Kiro (a ghost character) who must hunt and eat Pacman-style enemies across multiple levels. Each level features a different AI assistant enemy (Cursor, Antigravity, Codex, Claude) with unique behaviors, culminating in a final boss battle against VSCode.

## Glossary

- **Game System**: The complete Three.js-based game application including rendering, physics, input handling, and game state management
- **Kiro**: The player-controlled ghost character
- **Enemy**: An AI assistant character (Cursor, Antigravity, Codex, Claude, or VSCode) that the player must catch and eat
- **Level**: A distinct game stage with a unique maze layout and specific enemy
- **Maze**: The 3D environment containing walls, paths, and collectibles where gameplay occurs
- **Game State**: The current condition of the game (menu, playing, paused, game over, victory)
- **Collision Detection**: The system that determines when Kiro contacts enemies or walls
- **Score System**: The mechanism that tracks and displays player performance metrics
- **Ability**: A special power that Kiro can activate with a cooldown period between uses
- **Cooldown**: The time period during which an ability cannot be used after activation
- **Vibe Ability**: An autopilot ability that automatically navigates Kiro toward the nearest enemy
- **Token Burner Ability**: A speed boost ability that temporarily increases Kiro's movement speed
- **Audio System**: The component responsible for playing sound effects and music during gameplay
- **Collectible**: An item that spawns in the maze that Kiro can pick up to gain abilities
- **Level Timer**: A countdown timer that limits the duration of each level

## Requirements

### Requirement 1

**User Story:** As a player, I want to control Kiro's movement through a 3D maze, so that I can navigate and chase enemies

#### Acceptance Criteria

1. WHEN the player presses arrow keys or WASD keys, THE Game System SHALL move Kiro in the corresponding direction at a consistent speed
2. WHEN Kiro encounters a wall, THE Game System SHALL prevent Kiro from passing through the wall
3. THE Game System SHALL render Kiro as a distinct ghost character visible from the player's camera perspective
4. WHEN the player releases movement keys, THE Game System SHALL stop Kiro's movement in that direction
5. THE Game System SHALL maintain smooth movement at a minimum of 30 frames per second during gameplay

### Requirement 2

**User Story:** As a player, I want to play through five distinct levels with different enemies, so that I experience varied gameplay challenges

#### Acceptance Criteria

1. THE Game System SHALL provide exactly five playable levels in sequential order
2. WHEN a level starts, THE Game System SHALL spawn the designated enemy (Cursor for level 1, Antigravity for level 2, Codex for level 3, Claude for level 4, VSCode for level 5)
3. WHEN the player eats an enemy, THE Game System SHALL mark the level as complete and transition to the next level within 3 seconds
4. THE Game System SHALL display the current level number and enemy name during gameplay
5. WHEN the player eats the VSCode enemy in level 5, THE Game System SHALL display a victory screen and end the game
6. THE Game System SHALL assign each level a configurable time limit defined as a constant in the codebase
7. WHEN the Level Timer reaches zero, THE Game System SHALL end the level and display a game over screen
8. WHEN transitioning between levels, THE Game System SHALL preserve the accumulated score from previous levels
9. THE Game System SHALL increase maze size progressively with each level
10. THE Game System SHALL increase enemy intelligence and speed with each level to provide progressive difficulty

### Requirement 3

**User Story:** As a player, I want each enemy to have unique movement patterns, so that each level feels different and challenging

#### Acceptance Criteria

1. WHEN Cursor is active, THE Game System SHALL move Cursor using a fast, erratic movement pattern
2. WHEN Antigravity is active, THE Game System SHALL move Antigravity with vertical movement capabilities that ignore standard pathfinding
3. WHEN Codex is active, THE Game System SHALL move Codex using a methodical, predictable patrol pattern
4. WHEN Claude is active, THE Game System SHALL move Claude using an intelligent pathfinding algorithm that actively pursues or evades Kiro
5. WHEN VSCode is active, THE Game System SHALL move VSCode using a combination of all previous enemy behaviors with increased speed

### Requirement 4

**User Story:** As a player, I want to catch and eat enemies to progress, so that I can complete levels and win the game

#### Acceptance Criteria

1. WHEN Kiro collides with an enemy, THE Game System SHALL remove the enemy from the level
2. WHEN an enemy is removed, THE Game System SHALL increase the player's score by a level-specific point value
3. WHEN Kiro eats an enemy, THE Game System SHALL mark the level as complete
4. THE Game System SHALL display visual feedback when Kiro successfully eats an enemy
5. WHEN Kiro eats the VSCode boss enemy, THE Game System SHALL trigger the game victory condition and end the game

### Requirement 5

**User Story:** As a player, I want to see my score and game status, so that I can track my progress and performance

#### Acceptance Criteria

1. THE Game System SHALL display the current score in the game interface at all times during gameplay
2. WHEN the score changes, THE Game System SHALL update the displayed score within 100 milliseconds
3. THE Game System SHALL display the current level number during gameplay
4. THE Game System SHALL display the remaining time for the current level in seconds
5. WHEN the Level Timer updates, THE Game System SHALL refresh the displayed time within 100 milliseconds
6. WHEN the game ends, THE Game System SHALL display the final score on the game over or victory screen

### Requirement 6

**User Story:** As a player, I want to navigate through 3D mazes with walls and paths, so that I have spatial challenges while chasing enemies

#### Acceptance Criteria

1. THE Game System SHALL render each level with a distinct 3D maze layout
2. THE Game System SHALL ensure maze walls are visually distinguishable from pathways
3. THE Game System SHALL provide at least two different paths between any two accessible points in each maze
4. THE Game System SHALL use a fixed camera position that provides clear visibility of Kiro and the maze
5. WHEN a new level loads, THE Game System SHALL generate or load the maze layout within 2 seconds

### Requirement 7

**User Story:** As a player, I want to start, pause, and restart the game, so that I can control my gameplay session

#### Acceptance Criteria

1. WHEN the game launches, THE Game System SHALL display a landing screen with a play button and an animated Kiro character
2. WHEN the player clicks the play button, THE Game System SHALL begin level 1 within 1 second
3. WHEN the player presses the escape key during gameplay, THE Game System SHALL pause the game and display a pause menu
4. WHEN the game is paused, THE Game System SHALL halt all enemy movement and game timers
5. WHEN the player selects restart from any menu, THE Game System SHALL reset to level 1 with a score of zero and return to the landing screen
6. WHEN the game over screen is displayed, THE Game System SHALL provide a restart option that resets to level 1 with a score of zero

### Requirement 8

**User Story:** As a player, I want to collect power-ups in the maze to gain special abilities, so that I can strategically overcome difficult situations

#### Acceptance Criteria

1. THE Game System SHALL spawn Vibe Ability collectibles and Token Burner Ability collectibles at random locations in the maze
2. WHEN Kiro collides with a Vibe Ability collectible, THE Game System SHALL grant Kiro the ability to activate the Vibe Ability
3. WHEN Kiro collides with a Token Burner Ability collectible, THE Game System SHALL grant Kiro the ability to activate the Token Burner Ability
4. WHEN the player activates the Vibe Ability, THE Game System SHALL automatically navigate Kiro toward the nearest enemy using intelligent pathfinding for a configurable duration
5. WHEN the player activates the Token Burner Ability, THE Game System SHALL increase Kiro's movement speed by a configurable percentage for a configurable duration
6. WHEN an ability is activated, THE Game System SHALL prevent that ability from being used again until a new collectible is obtained
7. THE Game System SHALL define all ability parameters (durations, speed multipliers, spawn rates) as configurable constants in the codebase

### Requirement 9

**User Story:** As a player, I want to see visual feedback when abilities are active, so that I understand the current game state

#### Acceptance Criteria

1. THE Game System SHALL display a visual indicator showing which abilities Kiro currently has available
2. WHEN an ability is available, THE Game System SHALL provide visual feedback indicating readiness
3. WHEN the Vibe Ability is activated, THE Game System SHALL apply a blur effect to the game level
4. WHEN the Vibe Ability is activated, THE Game System SHALL display a random phrase from a predefined set including "vibing this hunting" and "hunting is almost production ready"
5. WHEN the Vibe Ability ends, THE Game System SHALL remove the blur effect and phrase display within 500 milliseconds
6. WHEN Kiro collects a collectible, THE Game System SHALL display visual feedback indicating the pickup

### Requirement 10

**User Story:** As a player, I want to hear sound effects during gameplay, so that the game feels more immersive and responsive

#### Acceptance Criteria

1. WHEN Kiro eats an enemy, THE Audio System SHALL play a distinct eating sound effect
2. WHEN the player activates an ability, THE Audio System SHALL play a sound effect corresponding to that ability
3. WHEN a level is completed, THE Audio System SHALL play a victory sound effect
4. THE Audio System SHALL provide a way to mute or adjust audio volume
5. WHEN the Token Burner ability is active, THE Audio System SHALL play turbo music that overrides the background music
6. WHEN the Vibe ability is active, THE Audio System SHALL play vibe music that overrides the background music
7. WHEN an ability ends, THE Audio System SHALL resume the standard background music within 500 milliseconds

### Requirement 11

**User Story:** As a player, I want responsive 3D graphics and smooth animations, so that the game feels polished and enjoyable

#### Acceptance Criteria

1. THE Game System SHALL render all game objects using Three.js with WebGL
2. THE Game System SHALL maintain a frame rate of at least 30 frames per second on devices meeting minimum specifications
3. WHEN Kiro moves, THE Game System SHALL animate the movement smoothly without visible stuttering
4. WHEN enemies move, THE Game System SHALL animate their movement smoothly without visible stuttering
5. THE Game System SHALL apply appropriate lighting and materials to create visual depth in the 3D environment
