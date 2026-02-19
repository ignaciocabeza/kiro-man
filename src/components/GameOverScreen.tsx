import React from 'react';
import { useGameState } from '../contexts/GameStateContext';

const GameOverScreen: React.FC = () => {
  const { score, restartGame } = useGameState();

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>TIME'S UP!</h1>
        <div style={styles.scoreContainer}>
          <p style={styles.scoreLabel}>Final Score</p>
          <p style={styles.score}>{score}</p>
        </div>
        <button style={styles.button} onClick={restartGame}>
          RESTART
        </button>
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
    background: 'linear-gradient(135deg, #1a0000, #2d0000, #1a0000)',
    zIndex: 100,
  },
  content: {
    textAlign: 'center',
    color: 'white',
    fontFamily: '"Courier New", monospace',
  },
  title: {
    fontSize: '3.5rem',
    color: '#e94560',
    textShadow: '0 0 30px rgba(233, 69, 96, 0.8)',
    marginBottom: '2rem',
  },
  scoreContainer: {
    margin: '2rem 0',
  },
  scoreLabel: {
    fontSize: '1.2rem',
    color: '#aaa',
  },
  score: {
    fontSize: '3rem',
    color: '#e94560',
    textShadow: '0 0 15px rgba(233, 69, 96, 0.5)',
  },
  button: {
    fontSize: '1.3rem',
    padding: '15px 50px',
    background: 'transparent',
    border: '2px solid #e94560',
    color: '#e94560',
    cursor: 'pointer',
    fontFamily: '"Courier New", monospace',
    letterSpacing: '0.2em',
    marginTop: '1rem',
    borderRadius: '4px',
  },
};

export default GameOverScreen;
