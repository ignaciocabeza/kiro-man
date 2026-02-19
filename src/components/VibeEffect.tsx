import React, { useState, useEffect } from 'react';
import { useGameState } from '../contexts/GameStateContext';
import { GAME_CONFIG } from '../config/gameConfig';

const VibeEffect: React.FC = () => {
  const { activeAbility } = useGameState();
  const [phrase, setPhrase] = useState('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (activeAbility === 'vibe') {
      const phrases = GAME_CONFIG.ABILITIES.VIBE.PHRASES;
      setPhrase(phrases[Math.floor(Math.random() * phrases.length)]);
      setVisible(true);
    } else {
      // Fade out
      const timer = setTimeout(() => setVisible(false), 500);
      return () => clearTimeout(timer);
    }
  }, [activeAbility]);

  if (!visible) return null;

  return (
    <div
      style={{
        ...styles.container,
        opacity: activeAbility === 'vibe' ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}
    >
      <div style={styles.blur} />
      <div style={styles.phraseContainer}>
        <p style={styles.phrase}>{phrase}</p>
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
    pointerEvents: 'none',
    zIndex: 20,
  },
  blur: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backdropFilter: 'blur(3px)',
    background: 'rgba(155, 89, 182, 0.15)',
  },
  phraseContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  },
  phrase: {
    fontFamily: '"Courier New", monospace',
    fontSize: '2.5rem',
    color: 'white',
    textShadow: '0 0 30px rgba(155, 89, 182, 0.8), 0 0 60px rgba(155, 89, 182, 0.4)',
    textAlign: 'center',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
};

export default VibeEffect;
