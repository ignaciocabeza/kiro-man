import React, { useState } from 'react';
import { useGameState } from '../contexts/GameStateContext';
import { audioManager } from '../utils/audioManager';

const PauseMenu: React.FC = () => {
  const { resumeGame, restartGame } = useGameState();
  const [showConfirm, setShowConfirm] = useState(false);
  const [volume, setVolume] = useState(Math.round(audioManager.getVolume() * 100));
  const [muted, setMuted] = useState(audioManager.isMuted());

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    audioManager.setVolume(val / 100);
  };

  const handleMuteToggle = () => {
    audioManager.toggleMute();
    setMuted(!muted);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>PAUSED</h2>

        {!showConfirm ? (
          <>
            <button style={styles.button} onClick={resumeGame}>
              RESUME
            </button>
            <button style={styles.button} onClick={() => setShowConfirm(true)}>
              RESTART
            </button>

            <div style={styles.audioSection}>
              <label style={styles.label}>
                Volume: {volume}%
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={handleVolumeChange}
                  style={styles.slider}
                />
              </label>
              <label style={styles.muteLabel}>
                <input
                  type="checkbox"
                  checked={muted}
                  onChange={handleMuteToggle}
                  style={styles.checkbox}
                />
                Mute
              </label>
            </div>
          </>
        ) : (
          <div style={styles.confirmBox}>
            <p style={styles.confirmText}>Are you sure? Your progress will be lost.</p>
            <div style={styles.confirmButtons}>
              <button
                style={{ ...styles.button, ...styles.dangerButton }}
                onClick={restartGame}
              >
                YES
              </button>
              <button style={styles.button} onClick={() => setShowConfirm(false)}>
                NO
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  modal: {
    background: '#1a1a2e',
    border: '2px solid #e94560',
    borderRadius: '12px',
    padding: '40px',
    textAlign: 'center',
    color: 'white',
    fontFamily: '"Courier New", monospace',
    minWidth: '300px',
  },
  title: {
    fontSize: '2rem',
    marginBottom: '2rem',
    textShadow: '0 0 10px #e94560',
  },
  button: {
    display: 'block',
    width: '100%',
    padding: '12px 24px',
    margin: '10px 0',
    background: 'transparent',
    border: '1px solid #e94560',
    color: '#e94560',
    fontSize: '1rem',
    cursor: 'pointer',
    fontFamily: '"Courier New", monospace',
    borderRadius: '4px',
    transition: 'all 0.2s',
  },
  dangerButton: {
    background: '#e94560',
    color: 'white',
  },
  audioSection: {
    marginTop: '2rem',
    padding: '1rem',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  label: {
    display: 'block',
    fontSize: '0.9rem',
    color: '#aaa',
  },
  slider: {
    width: '100%',
    marginTop: '8px',
    accentColor: '#e94560',
  },
  muteLabel: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '12px',
    fontSize: '0.9rem',
    color: '#aaa',
    cursor: 'pointer',
  },
  checkbox: {
    accentColor: '#e94560',
  },
  confirmBox: {
    padding: '1rem',
  },
  confirmText: {
    fontSize: '1rem',
    color: '#aaa',
    marginBottom: '1rem',
  },
  confirmButtons: {
    display: 'flex',
    gap: '10px',
  },
};

export default PauseMenu;
