import React, { useRef, useEffect, useState } from 'react';
import { useGameState } from '../contexts/GameStateContext';

// Real TypeScript code from the actual codebase
const CODE_PANEL_LEFT = `// src/utils/pathfinding.ts — A* Search
interface PathNode {
  position: GridPosition;
  g: number;  // cost from start
  h: number;  // heuristic to goal
  f: number;  // g + h
  parent: PathNode | null;
}

export function findPath(
  start: GridPosition,
  goal: GridPosition,
  mazeGrid: number[][],
  useCache = true
): GridPosition[] {
  const openList: PathNode[] = [];
  const closedSet = new Set<string>();

  const startNode: PathNode = {
    position: start,
    g: 0,
    h: manhattanDistance(start, goal),
    f: manhattanDistance(start, goal),
    parent: null,
  };

  openList.push(startNode);

  while (openList.length > 0) {
    // Find node with lowest f score
    let lowestIdx = 0;
    for (let i = 1; i < openList.length; i++) {
      if (openList[i].f < openList[lowestIdx].f) {
        lowestIdx = i;
      }
    }

    const current = openList[lowestIdx];
    const currentKey =
      \`\${current.position.x},\${current.position.y}\`;

    // Goal reached
    if (current.position.x === goal.x &&
        current.position.y === goal.y) {
      const path: GridPosition[] = [];
      let node: PathNode | null = current;
      while (node) {
        path.unshift(node.position);
        node = node.parent;
      }
      return path;
    }

    openList.splice(lowestIdx, 1);
    closedSet.add(currentKey);

    const neighbors = getValidNeighbors(
      current.position.x,
      current.position.y,
      mazeGrid
    );

    for (const neighbor of neighbors) {
      const neighborKey =
        \`\${neighbor.x},\${neighbor.y}\`;
      if (closedSet.has(neighborKey)) continue;

      const g = current.g + 1;
      const h = manhattanDistance(neighbor, goal);
      const f = g + h;

      const existingIdx = openList.findIndex(
        (n) => n.position.x === neighbor.x
           && n.position.y === neighbor.y
      );

      if (existingIdx !== -1) {
        if (g < openList[existingIdx].g) {
          openList[existingIdx].g = g;
          openList[existingIdx].f = f;
          openList[existingIdx].parent = current;
        }
      } else {
        openList.push({
          position: neighbor, g, h, f,
          parent: current,
        });
      }
    }
  }
  // No path found
  return [];
}`;

const CODE_PANEL_RIGHT = `// src/utils/enemyAI.ts — Enemy Behavior
export function getNextMove(
  type: EnemyType,
  enemyPos: GridPosition,
  playerPos: GridPosition,
  mazeGrid: number[][],
  aiState: AIState,
  deltaTime: number
): { nextPos: GridPosition;
     updatedState: AIState } {
  const config = GAME_CONFIG.ENEMIES[type];
  const intelligence = config.intelligence;
  const evadeRadius =
    config.behaviorParams.evadeRadius;
  const dist =
    gridDistance(enemyPos, playerPos);

  const updatedState = { ...aiState };
  updatedState.timeSinceDirectionChange
    += deltaTime;
  updatedState.lastPathRecalc += deltaTime;

  // Evasion check
  if (dist < evadeRadius &&
      Math.random() < intelligence) {
    return getEvasionMove(
      enemyPos, playerPos, mazeGrid,
      updatedState, intelligence
    );
  }

  // Corridor following — no U-turns
  const neighbors = getNeighborsNoReverse(
    pos, state.lastDirection, mazeGrid
  );

  // Single option: continue forward
  if (neighbors.length === 1) {
    updatedState.lastDirection = {
      x: neighbors[0].x - pos.x,
      y: neighbors[0].y - pos.y,
    };
    return {
      nextPos: neighbors[0],
      updatedState
    };
  }

  // At junction: 65% forward bias
  const forward = {
    x: pos.x + state.lastDirection.x,
    y: pos.y + state.lastDirection.y,
  };
  const fwd = neighbors.find(
    n => n.x === forward.x
      && n.y === forward.y
  );

  if (fwd && Math.random() < 0.65) {
    return { nextPos: fwd, updatedState };
  }

  // Scatter: pathfind to target area
  if (type === 'antigravity') {
    const target = updatedState.scatterTarget;
    const path = findPath(
      pos, target, mazeGrid, false
    );
    if (path.length > 1) {
      return { nextPos: path[1], updatedState };
    }
  }

  // A* evasion for high intelligence
  const furthest = findFurthestPoint(
    pos, playerPos, mazeGrid, 10
  );
  const path = findPath(
    pos, furthest, mazeGrid, false
  );
  if (path.length > 1) {
    return { nextPos: path[1], updatedState };
  }

  return cursorBehavior(pos, mazeGrid, state);
}`;

const BREAKPOINT_LINES_LEFT = [7, 22, 37, 48, 59, 73];
const BREAKPOINT_LINES_RIGHT = [5, 18, 30, 43, 55, 68];

const AbilityOverlay: React.FC = () => {
  const gameState = useGameState();
  const scrollRef = useRef(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [activeLine, setActiveLine] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (gameState.activeAbility !== 'debug') {
      scrollRef.current = 0;
      setScrollOffset(0);
      setActiveLine(0);
      return;
    }

    let running = true;
    const animate = () => {
      if (!running) return;
      scrollRef.current += 0.3;
      setScrollOffset(scrollRef.current);
      setActiveLine(Math.floor(scrollRef.current / 18) % 85);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [gameState.activeAbility]);

  if (!gameState.activeAbility || (gameState.activeAbility !== 'tokenBurner' && gameState.activeAbility !== 'debug')) {
    return null;
  }

  if (gameState.activeAbility === 'tokenBurner') {
    return (
      <>
        <style>{`
          @keyframes flame-rise {
            0% { transform: translateY(0) scaleX(1); opacity: 0.9; }
            50% { transform: translateY(-30px) scaleX(0.8); opacity: 0.7; }
            100% { transform: translateY(-60px) scaleX(0.6); opacity: 0; }
          }
          @keyframes flame-flicker {
            0%, 100% { opacity: 0.7; transform: scaleY(1); }
            25% { opacity: 1; transform: scaleY(1.05); }
            50% { opacity: 0.8; transform: scaleY(0.95); }
            75% { opacity: 0.9; transform: scaleY(1.02); }
          }
          @keyframes ember-float {
            0% { transform: translateY(0) translateX(0); opacity: 1; }
            100% { transform: translateY(-120px) translateX(20px); opacity: 0; }
          }
        `}</style>
        <div style={fireContainerStyle}>
          {/* Left fire panel */}
          <div style={{ ...firePanelStyle, left: 0 }}>
            <div style={fireGradientLeftStyle} />
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={`lf-${i}`}
                style={{
                  position: 'absolute',
                  bottom: `${(i * 12) % 100}%`,
                  left: `${10 + (i * 7) % 40}px`,
                  width: `${12 + (i % 3) * 8}px`,
                  height: `${20 + (i % 4) * 10}px`,
                  borderRadius: '50% 50% 20% 20%',
                  background: i % 2 === 0
                    ? 'radial-gradient(ellipse, #ff6600 0%, #ff3300 40%, transparent 70%)'
                    : 'radial-gradient(ellipse, #ffaa00 0%, #ff6600 40%, transparent 70%)',
                  animation: `flame-rise ${1.2 + (i % 3) * 0.4}s ease-in-out infinite`,
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={`le-${i}`}
                style={{
                  position: 'absolute',
                  bottom: `${20 + i * 15}%`,
                  left: `${5 + i * 10}px`,
                  width: '3px',
                  height: '3px',
                  borderRadius: '50%',
                  background: '#ffcc00',
                  boxShadow: '0 0 4px #ff6600',
                  animation: `ember-float ${2 + i * 0.3}s ease-out infinite`,
                  animationDelay: `${i * 0.4}s`,
                }}
              />
            ))}
          </div>
          {/* Right fire panel */}
          <div style={{ ...firePanelStyle, right: 0 }}>
            <div style={fireGradientRightStyle} />
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={`rf-${i}`}
                style={{
                  position: 'absolute',
                  bottom: `${(i * 12 + 5) % 100}%`,
                  right: `${10 + (i * 7) % 40}px`,
                  width: `${12 + (i % 3) * 8}px`,
                  height: `${20 + (i % 4) * 10}px`,
                  borderRadius: '50% 50% 20% 20%',
                  background: i % 2 === 0
                    ? 'radial-gradient(ellipse, #ff6600 0%, #ff3300 40%, transparent 70%)'
                    : 'radial-gradient(ellipse, #ffaa00 0%, #ff6600 40%, transparent 70%)',
                  animation: `flame-rise ${1.2 + (i % 3) * 0.4}s ease-in-out infinite`,
                  animationDelay: `${i * 0.15 + 0.1}s`,
                }}
              />
            ))}
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={`re-${i}`}
                style={{
                  position: 'absolute',
                  bottom: `${20 + i * 15}%`,
                  right: `${5 + i * 10}px`,
                  width: '3px',
                  height: '3px',
                  borderRadius: '50%',
                  background: '#ffcc00',
                  boxShadow: '0 0 4px #ff6600',
                  animation: `ember-float ${2 + i * 0.3}s ease-out infinite`,
                  animationDelay: `${i * 0.4 + 0.2}s`,
                }}
              />
            ))}
          </div>
        </div>
      </>
    );
  }

  // Debug ability: scrolling code panels
  const leftLines = CODE_PANEL_LEFT.split('\n');
  const rightLines = CODE_PANEL_RIGHT.split('\n');

  return (
    <div style={debugContainerStyle}>
      {/* Left code panel */}
      <div style={{ ...codePanelStyle, left: 0, borderRight: '1px solid #00ff41' }}>
        <div style={codePanelHeaderStyle}>
          <span style={{ color: '#ff4444' }}>●</span>{' '}
          <span style={{ color: '#ffaa00' }}>●</span>{' '}
          <span style={{ color: '#00ff41' }}>●</span>{' '}
          <span style={{ marginLeft: 8, color: '#888' }}>pathfinding.ts</span>
        </div>
        <div style={codeScrollAreaStyle}>
          <div style={{ transform: `translateY(${-scrollOffset}px)` }}>
            {leftLines.map((line, i) => (
              <div
                key={i}
                style={{
                  ...codeLineStyle,
                  background: i === activeLine ? 'rgba(255,255,0,0.15)' : 'transparent',
                  borderLeft: BREAKPOINT_LINES_LEFT.includes(i)
                    ? '3px solid #ff4444'
                    : '3px solid transparent',
                }}
              >
                <span style={lineNumberStyle}>{i + 1}</span>
                <span>{highlightCode(line)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Right code panel */}
      <div style={{ ...codePanelStyle, right: 0, borderLeft: '1px solid #00ff41' }}>
        <div style={codePanelHeaderStyle}>
          <span style={{ color: '#ff4444' }}>●</span>{' '}
          <span style={{ color: '#ffaa00' }}>●</span>{' '}
          <span style={{ color: '#00ff41' }}>●</span>{' '}
          <span style={{ marginLeft: 8, color: '#888' }}>enemyAI.ts</span>
        </div>
        <div style={codeScrollAreaStyle}>
          <div style={{ transform: `translateY(${-scrollOffset * 0.8}px)` }}>
            {rightLines.map((line, i) => (
              <div
                key={i}
                style={{
                  ...codeLineStyle,
                  background: i === Math.floor(activeLine * 0.85) ? 'rgba(255,255,0,0.15)' : 'transparent',
                  borderLeft: BREAKPOINT_LINES_RIGHT.includes(i)
                    ? '3px solid #ff4444'
                    : '3px solid transparent',
                }}
              >
                <span style={lineNumberStyle}>{i + 1}</span>
                <span>{highlightCode(line)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple syntax highlighting
function highlightCode(line: string): React.ReactNode {
  const keywords = /\b(const|let|function|export|return|if|for|while|import|interface|type|new|null|true|false|continue|else)\b/g;
  const types = /\b(GridPosition|PathNode|AIState|EnemyType|number|string|boolean|Set|Map|void)\b/g;
  const comments = /^(\s*\/\/.*)$/;
  const strings = /(`[^`]*`|'[^']*'|"[^"]*")/g;

  if (comments.test(line)) {
    return <span style={{ color: '#6a9955' }}>{line}</span>;
  }

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const allMatches: { start: number; end: number; color: string }[] = [];

  let match;
  const lineForKeywords = line;

  keywords.lastIndex = 0;
  while ((match = keywords.exec(lineForKeywords)) !== null) {
    allMatches.push({ start: match.index, end: match.index + match[0].length, color: '#c586c0' });
  }

  types.lastIndex = 0;
  while ((match = types.exec(lineForKeywords)) !== null) {
    allMatches.push({ start: match.index, end: match.index + match[0].length, color: '#4ec9b0' });
  }

  strings.lastIndex = 0;
  while ((match = strings.exec(lineForKeywords)) !== null) {
    allMatches.push({ start: match.index, end: match.index + match[0].length, color: '#ce9178' });
  }

  // Sort by start position, filter overlaps
  allMatches.sort((a, b) => a.start - b.start);
  const filtered: typeof allMatches = [];
  for (const m of allMatches) {
    if (filtered.length === 0 || m.start >= filtered[filtered.length - 1].end) {
      filtered.push(m);
    }
  }

  for (const m of filtered) {
    if (m.start > lastIndex) {
      parts.push(<span key={`t-${lastIndex}`} style={{ color: '#d4d4d4' }}>{line.slice(lastIndex, m.start)}</span>);
    }
    parts.push(<span key={`h-${m.start}`} style={{ color: m.color }}>{line.slice(m.start, m.end)}</span>);
    lastIndex = m.end;
  }

  if (lastIndex < line.length) {
    parts.push(<span key={`e-${lastIndex}`} style={{ color: '#d4d4d4' }}>{line.slice(lastIndex)}</span>);
  }

  return parts.length > 0 ? <>{parts}</> : <span style={{ color: '#d4d4d4' }}>{line}</span>;
}

// Styles
const fireContainerStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
  zIndex: 5,
};

const firePanelStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  bottom: 0,
  width: '120px',
  overflow: 'hidden',
  animation: 'flame-flicker 0.3s ease-in-out infinite',
};

const fireGradientLeftStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'linear-gradient(to right, rgba(255,68,0,0.6) 0%, rgba(255,100,0,0.35) 40%, rgba(255,150,0,0.1) 70%, transparent 100%)',
};

const fireGradientRightStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'linear-gradient(to left, rgba(255,68,0,0.6) 0%, rgba(255,100,0,0.35) 40%, rgba(255,150,0,0.1) 70%, transparent 100%)',
};

const debugContainerStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
  zIndex: 5,
};

const codePanelStyle: React.CSSProperties = {
  position: 'absolute',
  top: '40px',
  bottom: '70px',
  width: '280px',
  background: 'rgba(30, 30, 30, 0.92)',
  fontFamily: '"Fira Code", "Cascadia Code", "Consolas", monospace',
  fontSize: '10px',
  lineHeight: '18px',
  overflow: 'hidden',
  boxShadow: '0 0 20px rgba(0,255,65,0.2)',
};

const codePanelHeaderStyle: React.CSSProperties = {
  padding: '4px 10px',
  background: 'rgba(40, 40, 40, 0.95)',
  borderBottom: '1px solid #333',
  fontSize: '11px',
};

const codeScrollAreaStyle: React.CSSProperties = {
  padding: '4px 0',
  overflow: 'hidden',
  height: '100%',
};

const codeLineStyle: React.CSSProperties = {
  padding: '0 8px 0 4px',
  whiteSpace: 'pre',
  display: 'flex',
  minHeight: '18px',
};

const lineNumberStyle: React.CSSProperties = {
  color: '#555',
  minWidth: '28px',
  textAlign: 'right',
  marginRight: '8px',
  userSelect: 'none',
};

export default AbilityOverlay;
