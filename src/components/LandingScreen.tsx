import React, { useEffect, useState, useCallback, useRef } from 'react';
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

const MD_FILES = [
  'README.md', 'CONTRIBUTING.md', 'CHANGELOG.md', 'TODO.md',
  'SECURITY.md', 'LICENSE.md', 'BUGS.md', 'HACKED.md',
  'FEELINGS.md', 'REGRETS.md', 'VIBE_CHECK.md', 'OOPS.md',
  'FIX_LATER.md', 'DEPLOY_FRIDAY.md', 'WORKS_ON_MY_MACHINE.md',
  'DONT_TOUCH.md', 'HELP.md', 'WHY.md', 'CURSED.md',
];

interface FlyingFile {
  id: number;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  hue: number;
}

const GRAVITY = 980;

const ENEMIES = [
  { name: 'Cursor', svg: cursorSvg, color: GAME_CONFIG.ENEMIES.cursor.color },
  { name: 'Antigravity', svg: antigravitySvg, color: GAME_CONFIG.ENEMIES.antigravity.color },
  { name: 'Codex', svg: codexSvg, color: GAME_CONFIG.ENEMIES.codex.color },
  { name: 'Claude', svg: claudeSvg, color: GAME_CONFIG.ENEMIES.claude.color },
  { name: 'VS Code', svg: vscodeSvg, color: GAME_CONFIG.ENEMIES.vscode.color },
];

const LandingScreen: React.FC = () => {
  const { startGame } = useGameState();
  const [flyingFiles, setFlyingFiles] = useState<FlyingFile[]>([]);
  const nextIdRef = useRef(0);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    audioManager.playMusic(MusicType.MENU);
    return () => {
      audioManager.stopMusic();
    };
  }, []);

  const spawnFile = useCallback((originX: number, originY: number) => {
    const name = MD_FILES[Math.floor(Math.random() * MD_FILES.length)];
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
    const speed = 500 + Math.random() * 400;
    const file: FlyingFile = {
      id: nextIdRef.current++,
      name,
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 720,
      hue: Math.floor(Math.random() * 360),
    };
    setFlyingFiles((prev) => [...prev, file]);
  }, []);

  useEffect(() => {
    if (flyingFiles.length === 0) {
      lastTimeRef.current = 0;
      return;
    }

    const animate = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = time;

      setFlyingFiles((prev) =>
        prev
          .map((f) => ({
            ...f,
            x: f.x + f.vx * dt,
            y: f.y + f.vy * dt,
            vy: f.vy + GRAVITY * dt,
            rotation: f.rotation + f.rotationSpeed * dt,
          }))
          .filter((f) => f.y < window.innerHeight + 200)
      );

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [flyingFiles.length > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleKiroClick = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const count = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      spawnFile(cx + (Math.random() - 0.5) * 30, cy);
    }
  }, [spawnFile]);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>KIRO-MAN</h1>
        <p style={styles.subtitle}>Hunt or Be Outpaced</p>

        <div style={styles.kiroContainer}>
          <img
            src={kiroSvg}
            alt="Kiro"
            style={styles.kiro}
            onClick={handleKiroClick}
          />
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

      {/* Flying .md files */}
      {flyingFiles.map((f) => (
        <div
          key={f.id}
          style={{
            position: 'fixed',
            left: f.x,
            top: f.y,
            transform: `translate(-50%, -50%) rotate(${f.rotation}deg)`,
            pointerEvents: 'none',
            zIndex: 200,
            fontFamily: '"Courier New", monospace',
            fontSize: '0.85rem',
            fontWeight: 'bold',
            color: `hsl(${f.hue}, 80%, 70%)`,
            textShadow: `0 0 8px hsl(${f.hue}, 90%, 50%), 0 0 16px hsl(${f.hue}, 90%, 40%)`,
            whiteSpace: 'nowrap',
          }}
        >
          {f.name}
        </div>
      ))}
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
    cursor: 'pointer',
    transition: 'transform 0.1s ease',
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
