import React, { useState, useEffect } from 'react';
import { useGameState } from '../contexts/GameStateContext';
import { GAME_CONFIG } from '../config/gameConfig';

const HUD: React.FC = React.memo(() => {
  const gameState = useGameState();
  const levelConfig = GAME_CONFIG.LEVELS[gameState.currentLevel];
  const [abilityCountdown, setAbilityCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (!gameState.activeAbility || !gameState.abilityEndTime) {
      setAbilityCountdown(null);
      return;
    }

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((gameState.abilityEndTime! - Date.now()) / 1000));
      setAbilityCountdown(remaining);
    };
    tick();
    const interval = setInterval(tick, 100);
    return () => clearInterval(interval);
  }, [gameState.activeAbility, gameState.abilityEndTime]);

  return (
    <div style={styles.container}>
      {/* Top bar - outside the maze area */}
      <div style={styles.topBar}>
        <div style={styles.score}>Score: {gameState.score}</div>
        <div style={styles.pillCounters}>
          <span style={styles.pillSaved}>Saved: {gameState.pillsSaved}</span>
          <span style={styles.pillLost}>Lost: {gameState.pillsEatenByEnemy}</span>
        </div>
        <div style={styles.level}>
          Level {gameState.currentLevel}: {levelConfig.enemy.toUpperCase()}
        </div>
        <div style={styles.timer}>Time: {gameState.timer}s</div>
      </div>

      {/* Bottom bar - abilities, outside the maze area */}
      <div style={styles.bottomBar}>
        <div style={styles.abilityContainer}>
          <div
            style={{
              ...styles.ability,
              ...(gameState.abilities.vibe ? styles.abilityAvailable : {}),
              ...(gameState.activeAbility === 'vibe' ? styles.abilityActive : {}),
            }}
          >
            <span style={styles.keyBadge}>[1]</span>
            <span style={styles.abilityIcon}>🌊</span>
            <span style={styles.abilityLabel}>Vibe</span>
            {gameState.abilities.vibe && <span style={styles.readyBadge}>READY</span>}
            {gameState.activeAbility === 'vibe' && abilityCountdown !== null && (
              <span style={styles.countdown}>{abilityCountdown}s</span>
            )}
          </div>
          <div
            style={{
              ...styles.ability,
              ...(gameState.abilities.tokenBurner ? styles.abilityAvailable : {}),
              ...(gameState.activeAbility === 'tokenBurner' ? styles.abilityActive : {}),
            }}
          >
            <span style={styles.keyBadge}>[2]</span>
            <span style={styles.abilityIcon}>🔥</span>
            <span style={styles.abilityLabel}>Turbo</span>
            {gameState.abilities.tokenBurner && <span style={styles.readyBadge}>READY</span>}
            {gameState.activeAbility === 'tokenBurner' && abilityCountdown !== null && (
              <span style={styles.countdown}>{abilityCountdown}s</span>
            )}
          </div>
          <div
            style={{
              ...styles.ability,
              ...(gameState.abilities.debug ? styles.abilityAvailable : {}),
              ...(gameState.activeAbility === 'debug' ? styles.abilityActive : {}),
            }}
          >
            <span style={styles.keyBadge}>[3]</span>
            <span style={styles.abilityIcon}>🔍</span>
            <span style={styles.abilityLabel}>Debug</span>
            {gameState.abilities.debug && <span style={styles.readyBadge}>READY</span>}
            {gameState.activeAbility === 'debug' && abilityCountdown !== null && (
              <span style={styles.countdown}>{abilityCountdown}s</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 10,
    fontFamily: '"Courier New", monospace',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 20px',
    background: 'rgba(0,0,0,0.85)',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    flexShrink: 0,
  },
  score: {
    fontSize: '1rem',
    textShadow: '0 0 10px rgba(233, 69, 96, 0.8)',
  },
  pillCounters: {
    display: 'flex',
    gap: '12px',
    fontSize: '0.85rem',
  },
  pillSaved: {
    color: '#2ecc71',
    textShadow: '0 0 8px rgba(46, 204, 113, 0.6)',
  },
  pillLost: {
    color: '#e74c3c',
    textShadow: '0 0 8px rgba(231, 76, 60, 0.6)',
  },
  level: {
    fontSize: '1rem',
    textShadow: '0 0 10px rgba(255, 255, 255, 0.5)',
  },
  timer: {
    fontSize: '1rem',
    textShadow: '0 0 10px rgba(46, 204, 113, 0.8)',
  },
  bottomBar: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '8px 15px',
    background: 'rgba(0,0,0,0.85)',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    flexShrink: 0,
  },
  abilityContainer: {
    display: 'flex',
    gap: '15px',
  },
  ability: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '4px 12px',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '6px',
    opacity: 0.4,
    transition: 'all 0.3s',
  },
  abilityAvailable: {
    opacity: 1,
    border: '1px solid rgba(255,255,255,0.8)',
    boxShadow: '0 0 15px rgba(255,255,255,0.3)',
  },
  abilityActive: {
    opacity: 1,
    border: '2px solid #e94560',
    boxShadow: '0 0 20px rgba(233, 69, 96, 0.5)',
    background: 'rgba(233, 69, 96, 0.2)',
  },
  keyBadge: {
    fontSize: '0.6rem',
    color: '#ffcc00',
    fontWeight: 'bold',
  },
  abilityIcon: {
    fontSize: '1.2rem',
  },
  abilityLabel: {
    fontSize: '0.6rem',
    marginTop: '2px',
  },
  readyBadge: {
    fontSize: '0.55rem',
    color: '#2ecc71',
    marginTop: '1px',
  },
  countdown: {
    fontSize: '0.75rem',
    color: '#e94560',
    fontWeight: 'bold',
    marginTop: '2px',
    textShadow: '0 0 8px rgba(233, 69, 96, 0.8)',
  },
};

export default HUD;
