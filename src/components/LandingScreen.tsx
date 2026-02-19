import React, { useEffect } from 'react';
import { useGameState } from '../contexts/GameStateContext';
import { audioManager } from '../utils/audioManager';
import { MusicType } from '../types';
import { GAME_CONFIG } from '../config/gameConfig';
import kiroSvg from '../assets/kiro.svg';
import cursorSvg from '../assets/cursor.svg';
import antigravitySvg from '../assets/antigravity.svg';
import codexSvg from '../assets/codex.svg';
import claudeSvg from '../assets/claude.svg';
import vscodeSvg from '../assets/vscode.svg';

const ENEMIES = [
  { name: 'Cursor', svg: cursorSvg, color: GAME_CONFIG.ENEMIES.cursor.color },
  { name: 'Antigravity', svg: antigravitySvg, color: GAME_CONFIG.ENEMIES.antigravity.color },
  { name: 'Codex', svg: codexSvg, color: GAME_CONFIG.ENEMIES.codex.color },
  { name: 'Claude', svg: claudeSvg, color: GAME_CONFIG.ENEMIES.claude.color },
  { name: 'VS Code', svg: vscodeSvg, color: GAME_CONFIG.ENEMIES.vscode.color },
];

const LandingScreen: React.FC = () => {
  const { startGame } = useGameState();

  useEffect(() => {
    audioManager.playMusic(MusicType.MENU);
    return () => {
      audioManager.stopMusic();
    };
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>KIRO-MAN</h1>
        <p style={styles.subtitle}>Hunt or Be Outpaced</p>

        <div style={styles.kiroContainer}>
          <img src={kiroSvg} alt="Kiro" style={styles.kiro} />
        </div>

        {/* Enemy parade */}
        <div style={styles.enemyRow}>
          {ENEMIES.map((enemy) => (
            <div key={enemy.name} style={styles.enemyItem}>
              <div style={{
                ...styles.enemyIcon,
                filter: `drop-shadow(0 0 8px ${enemy.color})`,
              }}>
                <img
                  src={enemy.svg}
                  alt={enemy.name}
                  style={{
                    width: '36px',
                    height: '36px',
                    filter: `drop-shadow(0 0 4px ${enemy.color})`,
                  }}
                />
              </div>
              <span style={{ ...styles.enemyName, color: enemy.color }}>{enemy.name}</span>
            </div>
          ))}
        </div>

        <button style={styles.playButton} onClick={startGame}>
          PLAY
        </button>

        <div style={styles.controls}>
          <p style={styles.controlText}>WASD / Arrow Keys - Move</p>
          <p style={styles.controlText}>[1] Vibe  [2] Turbo  [3] Debug</p>
          <p style={styles.controlText}>ESC - Pause</p>
        </div>
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
    background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
    zIndex: 100,
  },
  content: {
    textAlign: 'center',
    color: 'white',
    fontFamily: '"Courier New", monospace',
  },
  title: {
    fontSize: '4rem',
    marginBottom: '0.5rem',
    textShadow: '0 0 20px #e94560, 0 0 40px #e94560',
    letterSpacing: '0.2em',
  },
  subtitle: {
    fontSize: '1.2rem',
    color: '#aaa',
    marginBottom: '1rem',
  },
  kiroContainer: {
    margin: '1.5rem auto',
    animation: 'float 2s ease-in-out infinite',
  },
  kiro: {
    width: '120px',
    height: '120px',
    filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.5))',
    animation: 'float 2s ease-in-out infinite',
  },
  enemyRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    margin: '1rem 0 1.5rem',
  },
  enemyItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  enemyIcon: {
    position: 'relative',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  enemyName: {
    fontSize: '0.55rem',
    letterSpacing: '0.05em',
    opacity: 0.8,
  },
  playButton: {
    fontSize: '1.5rem',
    padding: '15px 60px',
    background: 'transparent',
    border: '2px solid #e94560',
    color: '#e94560',
    cursor: 'pointer',
    fontFamily: '"Courier New", monospace',
    letterSpacing: '0.3em',
    transition: 'all 0.3s ease',
  },
  controls: {
    marginTop: '2rem',
    opacity: 0.6,
  },
  controlText: {
    fontSize: '0.9rem',
    margin: '0.3rem 0',
  },
};

export default LandingScreen;
