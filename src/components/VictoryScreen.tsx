import React, { useEffect } from 'react';
import { useGameState } from '../contexts/GameStateContext';
import { audioManager } from '../utils/audioManager';
import { SoundType, MusicType } from '../types';
import kiroSvg from '../assets/kiro.svg';

const VictoryScreen: React.FC = () => {
  const { score, restartGame } = useGameState();

  useEffect(() => {
    audioManager.stopMusic();
    audioManager.playSound(SoundType.VICTORY);
    // Start victory music after fanfare finishes
    const timer = setTimeout(() => {
      audioManager.playMusic(MusicType.VICTORY);
    }, 1200);
    return () => {
      clearTimeout(timer);
      audioManager.stopMusic();
    };
  }, []);

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes float-crown {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
      <div style={styles.content}>
        <h1 style={styles.title}>VICTORY!</h1>
        <p style={styles.subtitle}>You defeated all the AI IDEs!</p>

        {/* Kiro with crown */}
        <div style={styles.kiroContainer}>
          <div style={styles.crownContainer}>
            <svg width="60" height="40" viewBox="0 0 60 40" style={{ animation: 'float-crown 2s ease-in-out infinite' }}>
              <polygon
                points="5,35 15,10 22,25 30,5 38,25 45,10 55,35"
                fill="#f1c40f"
                stroke="#d4ac0d"
                strokeWidth="2"
              />
              <circle cx="15" cy="10" r="4" fill="#e74c3c" />
              <circle cx="30" cy="5" r="4" fill="#3498db" />
              <circle cx="45" cy="10" r="4" fill="#2ecc71" />
            </svg>
          </div>
          <img src={kiroSvg} alt="Kiro" style={styles.kiro} />
          {/* Sparkles */}
          <div style={{ ...styles.sparkle, top: '-10px', left: '20px', animationDelay: '0s' }}>*</div>
          <div style={{ ...styles.sparkle, top: '10px', right: '10px', animationDelay: '0.5s' }}>*</div>
          <div style={{ ...styles.sparkle, bottom: '20px', left: '10px', animationDelay: '1s' }}>*</div>
          <div style={{ ...styles.sparkle, top: '30px', right: '30px', animationDelay: '1.5s' }}>*</div>
        </div>

        <div style={styles.scoreContainer}>
          <p style={styles.scoreLabel}>Final Score</p>
          <p style={styles.score}>{score}</p>
        </div>

        <button style={styles.button} onClick={restartGame}>
          PLAY AGAIN
        </button>

        {/* Credits */}
        <div style={styles.credits}>
          <p style={styles.creditsTitle}>CREDITS</p>
          <p style={styles.creditLine}>Prompt Engineer: <span style={styles.creditName}>Ignacio Cabeza</span></p>
          <p style={styles.creditLine}>Product Manager: <span style={styles.creditName}>Kiro</span></p>
          <p style={styles.creditLine}>Developer: <span style={styles.creditName}>Claude Code</span></p>
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
    background: 'linear-gradient(135deg, #0a1628, #1a2a48, #0f1f38)',
    zIndex: 100,
    overflow: 'auto',
  },
  content: {
    textAlign: 'center',
    color: 'white',
    fontFamily: '"Courier New", monospace',
    padding: '2rem',
  },
  title: {
    fontSize: '4rem',
    color: '#2ecc71',
    textShadow: '0 0 30px rgba(46, 204, 113, 0.8), 0 0 60px rgba(46, 204, 113, 0.4)',
    marginBottom: '0.5rem',
  },
  subtitle: {
    fontSize: '1.2rem',
    color: '#aaa',
    marginBottom: '1.5rem',
  },
  kiroContainer: {
    position: 'relative',
    display: 'inline-block',
    margin: '1rem auto',
  },
  crownContainer: {
    position: 'absolute',
    top: '-35px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1,
    filter: 'drop-shadow(0 0 10px rgba(241, 196, 15, 0.8))',
  },
  kiro: {
    width: '100px',
    height: '100px',
    filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.5))',
  },
  sparkle: {
    position: 'absolute',
    color: '#f1c40f',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    textShadow: '0 0 10px rgba(241, 196, 15, 0.8)',
    animation: 'sparkle 2s ease-in-out infinite',
  } as React.CSSProperties,
  scoreContainer: {
    margin: '1.5rem 0',
  },
  scoreLabel: {
    fontSize: '1.2rem',
    color: '#aaa',
  },
  score: {
    fontSize: '3rem',
    color: '#f1c40f',
    textShadow: '0 0 15px rgba(241, 196, 15, 0.5)',
  },
  button: {
    fontSize: '1.3rem',
    padding: '15px 50px',
    background: 'transparent',
    border: '2px solid #2ecc71',
    color: '#2ecc71',
    cursor: 'pointer',
    fontFamily: '"Courier New", monospace',
    letterSpacing: '0.2em',
    marginTop: '1rem',
    borderRadius: '4px',
  },
  credits: {
    marginTop: '2.5rem',
    padding: '1.5rem',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  creditsTitle: {
    fontSize: '0.9rem',
    color: '#888',
    letterSpacing: '0.3em',
    marginBottom: '0.8rem',
  },
  creditLine: {
    fontSize: '0.85rem',
    color: '#999',
    margin: '0.4rem 0',
  },
  creditName: {
    color: '#e94560',
    fontWeight: 'bold',
  },
};

export default VictoryScreen;
