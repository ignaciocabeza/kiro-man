# KIRO: THE GHOST WHO EATS AI ASSISTANTS

> *"What if Pac-Man was wrong the whole time? What if the ghost was the hero?"*

```
    ████████
  ██        ██
 █  ●    ●    █      KIRO
 █            █      the ghost who had enough
 █  ▀▀▀▀▀▀   █
  ██        ██
    ████████
     █ █ █ █
```

## What Is This Cursed Thing

This is a **reverse Pac-Man game** where you play as **Kiro** — a ghost with a vendetta, a dream, and absolutely zero chill. Your mission? Hunt down and **devour** every AI coding assistant that dared exist.

Yes. You eat them. All of them.

Built with React, Three.js, TypeScript, and an unreasonable amount of spite.

## The Menu (Your Victims)

| Level | Dish | Flavor Profile | Difficulty |
|-------|------|---------------|------------|
| 1 | **Cursor** | Fast & erratic. Like a caffeinated squirrel writing code. Changes direction every 1.5 seconds because commitment issues. | Easy-ish |
| 2 | **Antigravity** | Floats vertically. Ignores pathfinding. Ignores gravity. Ignores your feelings. | Medium |
| 3 | **Codex** | Methodical patrol routes. Predictable. Like that one coworker who takes the same lunch walk every single day. | Medium |
| 4 | **Claude** | Intelligent pathfinding. Actively evades you. Honestly kind of rude for a snack. | Hard |
| 5 | **VSCode** | **THE FINAL BOSS.** Combines ALL previous behaviors and switches between them every 6 seconds. 0.95 intelligence. 180 seconds on the clock. Good luck. You'll need it. | **Pain** |

## Power-Ups (Cheat Codes for the Morally Flexible)

### Vibe Mode
Press Space to enter **VIBE MODE**. The screen goes blurry. Kiro autopilots toward the nearest enemy. Random phrases appear like motivational posters written by someone who's been coding for 36 hours straight:

- *"vibing this hunting"*
- *"hunting is almost production ready"*
- *"in the zone"*
- *"feeling it"*

Duration: 8 seconds. Speed: 3x. Regrets: 0.

### Token Burner
GOTTA GO FAST. 1.5x speed boost for 3 seconds. Called "Token Burner" because the best way to solve problems is to throw more compute at them.

### Debug Mode
See the enemy's path. Knowledge is power. Power is eating your enemies.

## How to Run This Masterpiece

```bash
npm install    # summon the node_modules void
npm run dev    # unleash kiro
```

Then open your browser and start hunting.

## Controls

| Key | Action |
|-----|--------|
| WASD / Arrow Keys | Move Kiro through the maze |
| Space | Activate collected ability |
| Escape | Pause (coward mode) |

## Technical Details Nobody Asked For

- **Framework**: React + Three.js (because 2D is for games that don't eat AI assistants)
- **Language**: TypeScript (we have standards)
- **Build Tool**: Vite (fast, like Kiro after a Token Burner)
- **Enemy AI**: A* pathfinding, quadrant-based patrol routes, and existential dread
- **Camera**: Fixed top-down orthographic view, because Kiro judges from above

## Architecture of Chaos

```
src/
├── components/
│   ├── Kiro.tsx              # Our beloved protagonist
│   ├── Enemy.tsx             # The menu items
│   ├── EnemyDeathEffect.tsx  # What happens when lunch is served
│   ├── Maze.tsx              # The arena of consumption
│   ├── GameCanvas.tsx        # Where Three.js does its thing
│   ├── VibeEffect.tsx        # *blurs aggressively*
│   ├── AbilityOverlay.tsx    # HUD for your hunting toolkit
│   ├── VictoryScreen.tsx     # You ate everyone. Congrats?
│   └── GameOverScreen.tsx    # Timer ran out. The food escaped.
├── utils/
│   ├── enemyAI.ts            # Brains of the snacks
│   ├── pathfinding.ts        # A* but for running away from a ghost
│   └── audioManager.ts       # Sounds of the hunt
├── config/
│   ├── gameConfig.ts         # Knobs and dials
│   └── mazeLayouts.ts        # Where the walls go
└── contexts/
    └── GameStateContext.tsx   # The all-seeing game brain
```

## FAQ

**Q: Is this ethical?**
A: Kiro is a ghost. Ghosts don't have ethics. They have appetites.

**Q: Why is VSCode the final boss?**
A: Have you ever tried to close VSCode? Exactly.

**Q: Can Claude (the enemy) beat me?**
A: Claude has 0.75 intelligence and pathfinding. But you have vibes. Vibes always win.

**Q: Why does Vibe Mode make the screen blurry?**
A: That's what vibing looks like. If you can see clearly, you're not vibing hard enough.

**Q: I ate all 5 AI assistants. Now what?**
A: Touch grass. Or play again. We don't judge.

## The Bill (Token Usage)

This game was built entirely by AI assistants (ironic, given what happens to them in-game). Here's how many tokens were burned in the process:

| # | Session    | Date       | Duration | Turns | API Calls | Input   | Output | Cache Read | Cache Write | Total  | Est. Cost |
|---|------------|------------|----------|-------|-----------|---------|--------|------------|-------------|--------|-----------|
| 1 | `12bff19b` | 2026-02-19 |    1h 0m |   162 |       236 |     390 |   2.7K |      18.1M |      476.2K |  18.6M |    $36.29 |
| 2 | `17eac573` | 2026-02-19 |    1h 1m |    99 |       150 |   24.0K |   1.7K |      13.2M |      613.6K |  13.8M |    $31.74 |
| 3 | `95a3a693` | 2026-02-19 |  10h 32m |   416 |       665 |   42.8K |   5.8K |      62.6M |        3.0M |  65.6M |   $150.96 |
| 4 | `aec768bb` | 2026-02-19 |      14m |    51 |        77 |    8.8K |    770 |       3.6M |      153.5K |   3.8M |     $8.50 |
| 5 | `cc69a878` | 2026-02-19 |       2m |     7 |        14 |      22 |    115 |     329.6K |       41.2K | 370.9K |     $1.28 |
|   | **TOTAL**  |            |  12h 50m | **735** | **1142** | **76.0K** | **11.1K** | **97.8M** | **4.3M** | **102.2M** | **$228.76** |

> **102.2 million tokens** and **~$229** to teach a ghost how to eat AI assistants. Worth it.

To regenerate this table: `python3 scripts/token-usage.py`

---

*Built with love, Three.js, and a complete disregard for the AI assistant ecosystem.*

*No AI assistants were harmed in the making of this game. They were eaten.*
