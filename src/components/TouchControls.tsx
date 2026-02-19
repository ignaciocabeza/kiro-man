import React, { useCallback, useEffect, useState } from 'react';

// Dispatch synthetic keyboard events so Kiro's existing input handler works
function fireKey(code: string, type: 'keydown' | 'keyup') {
  window.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true }));
}

const BUTTONS = [
  { code: 'ArrowUp', label: '\u25B2', gridArea: 'up' },
  { code: 'ArrowLeft', label: '\u25C0', gridArea: 'left' },
  { code: 'ArrowRight', label: '\u25B6', gridArea: 'right' },
  { code: 'ArrowDown', label: '\u25BC', gridArea: 'down' },
] as const;

const TouchControls: React.FC = () => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  const handlePointerDown = useCallback((code: string) => {
    fireKey(code, 'keydown');
  }, []);

  const handlePointerUp = useCallback((code: string) => {
    fireKey(code, 'keyup');
  }, []);

  if (!isTouchDevice) return null;

  return (
    <div style={styles.container}>
      <div style={styles.dpad}>
        {BUTTONS.map((btn) => (
          <button
            key={btn.code}
            style={{ ...styles.button, gridArea: btn.gridArea }}
            onPointerDown={() => handlePointerDown(btn.code)}
            onPointerUp={() => handlePointerUp(btn.code)}
            onPointerLeave={() => handlePointerUp(btn.code)}
            onPointerCancel={() => handlePointerUp(btn.code)}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    left: '50%',
    transform: 'translateX(-50%)',
    bottom: 90,
    zIndex: 50,
    pointerEvents: 'none',
  },
  dpad: {
    display: 'grid',
    gridTemplateAreas: `
      ".    up    ."
      "left .     right"
      ".    down  ."
    `,
    gridTemplateColumns: '44px 44px 44px',
    gridTemplateRows: '44px 44px 44px',
    gap: '3px',
    pointerEvents: 'auto',
  },
  button: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    border: '1.5px solid rgba(255,255,255,0.25)',
    background: 'rgba(0,0,0,0.4)',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '1.1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    touchAction: 'none',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    outline: 'none',
    padding: 0,
  },
};

export default TouchControls;
