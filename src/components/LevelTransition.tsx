import React from 'react';
import { GAME_CONFIG } from '../config/gameConfig';
import cursorSvg from '../assets/cursor.svg';
import antigravitySvg from '../assets/antigravity.svg';
import codexSvg from '../assets/codex.svg';
import claudeSvg from '../assets/claude.svg';
import vscodeSvg from '../assets/vscode.svg';

const ENEMY_SVGS: Record<string, string> = {
  cursor: cursorSvg,
  antigravity: antigravitySvg,
  codex: codexSvg,
  claude: claudeSvg,
  vscode: vscodeSvg,
};

const ENEMY_LABELS: Record<string, string> = {
  cursor: 'Cursor',
  antigravity: 'Antigravity',
  codex: 'Codex',
  claude: 'Claude',
  vscode: 'VS Code',
};

interface LevelTransitionProps {
  level: number;
  enemyType: string;
}

const LevelTransition: React.FC<LevelTransitionProps> = ({ level, enemyType }) => {
  const color = GAME_CONFIG.ENEMIES[enemyType]?.color || '#e94560';
  const svg = ENEMY_SVGS[enemyType];
  const label = ENEMY_LABELS[enemyType] || enemyType.toUpperCase();

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes level-fade-in {
          0% { opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes enemy-scale-in {
          0% { opacity: 0; transform: scale(0.2) rotate(-20deg); }
          40% { opacity: 1; transform: scale(1.15) rotate(5deg); }
          60% { transform: scale(0.95) rotate(-2deg); }
          75% { transform: scale(1.05) rotate(1deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes title-slide-down {
          0% { opacity: 0; transform: translateY(-30px); }
          30% { opacity: 1; transform: translateY(0); }
        }
        @keyframes name-slide-up {
          0% { opacity: 0; transform: translateY(20px); }
          40% { opacity: 1; transform: translateY(0); }
        }
        @keyframes glow-pulse {
          0%, 100% { filter: drop-shadow(0 0 15px var(--glow-color)); }
          50% { filter: drop-shadow(0 0 35px var(--glow-color)); }
        }
      `}</style>
      <div style={{ ...styles.inner, animation: 'level-fade-in 2s ease-in-out forwards' }}>
        <p style={{
          ...styles.levelLabel,
          animation: 'title-slide-down 0.6s ease-out forwards',
        }}>
          LEVEL {level}
        </p>

        {svg && (
          <div style={{
            ...styles.enemyContainer,
            // @ts-expect-error CSS custom property
            '--glow-color': color,
            animation: 'enemy-scale-in 0.8s ease-out 0.2s both, glow-pulse 1.5s ease-in-out 1s infinite',
          }}>
            <img src={svg} alt={label} style={styles.enemyImg} />
          </div>
        )}

        <p style={{
          ...styles.enemyName,
          color,
          textShadow: `0 0 20px ${color}, 0 0 40px ${color}`,
          animation: 'name-slide-up 0.6s ease-out 0.4s both',
        }}>
          {label}
        </p>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.85)',
    zIndex: 30,
  },
  inner: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
  },
  levelLabel: {
    color: '#999',
    fontFamily: '"Courier New", monospace',
    fontSize: '1.2rem',
    letterSpacing: '0.4em',
    textTransform: 'uppercase',
    margin: 0,
  },
  enemyContainer: {
    position: 'relative',
    width: '120px',
    height: '120px',
  },
  enemyImg: {
    width: '120px',
    height: '120px',
    objectFit: 'contain',
  },
  enemyName: {
    fontFamily: '"Courier New", monospace',
    fontSize: '2.5rem',
    fontWeight: 'bold',
    letterSpacing: '0.15em',
    margin: 0,
  },
};

export default LevelTransition;
