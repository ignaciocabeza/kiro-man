import React, { useCallback, useEffect, useRef, useState } from 'react';

// Dispatch synthetic keyboard events so Kiro's existing input handler works
function fireKey(code: string, type: 'keydown' | 'keyup') {
  window.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true }));
}

const PAD_SIZE = 140;
const DEAD_ZONE = 12; // pixels from center before registering a direction

const TouchControls: React.FC = () => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const padRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const activeKeys = useRef<Set<string>>(new Set());
  const activePointerId = useRef<number | null>(null);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  const releaseAll = useCallback(() => {
    activeKeys.current.forEach((code) => fireKey(code, 'keyup'));
    activeKeys.current.clear();
    activePointerId.current = null;
    if (knobRef.current) {
      knobRef.current.style.transform = 'translate(-50%, -50%)';
      knobRef.current.style.opacity = '0.5';
    }
  }, []);

  const updateDirection = useCallback((clientX: number, clientY: number) => {
    const pad = padRef.current;
    if (!pad) return;

    const rect = pad.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Clamp knob position to pad radius
    const maxR = PAD_SIZE / 2 - 10;
    const clampedDist = Math.min(dist, maxR);
    const angle = Math.atan2(dy, dx);
    const knobX = clampedDist * Math.cos(angle);
    const knobY = clampedDist * Math.sin(angle);

    if (knobRef.current) {
      knobRef.current.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
      knobRef.current.style.opacity = '0.85';
    }

    // Determine desired direction
    const wantedKeys = new Set<string>();

    if (dist > DEAD_ZONE) {
      // Use angle to determine direction — allow diagonals to pick the dominant axis
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (absDx > absDy) {
        // Horizontal dominant
        wantedKeys.add(dx > 0 ? 'ArrowRight' : 'ArrowLeft');
      } else {
        // Vertical dominant
        wantedKeys.add(dy > 0 ? 'ArrowDown' : 'ArrowUp');
      }
    }

    // Release keys no longer wanted
    activeKeys.current.forEach((code) => {
      if (!wantedKeys.has(code)) {
        fireKey(code, 'keyup');
        activeKeys.current.delete(code);
      }
    });

    // Press newly wanted keys
    wantedKeys.forEach((code) => {
      if (!activeKeys.current.has(code)) {
        fireKey(code, 'keydown');
        activeKeys.current.add(code);
      }
    });
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (activePointerId.current !== null) return; // only one finger
    activePointerId.current = e.pointerId;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updateDirection(e.clientX, e.clientY);
  }, [updateDirection]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (e.pointerId !== activePointerId.current) return;
    updateDirection(e.clientX, e.clientY);
  }, [updateDirection]);

  const handlePointerEnd = useCallback((e: React.PointerEvent) => {
    if (e.pointerId !== activePointerId.current) return;
    releaseAll();
  }, [releaseAll]);

  if (!isTouchDevice) return null;

  return (
    <div style={styles.container}>
      <div
        ref={padRef}
        style={styles.pad}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
      >
        {/* Direction indicators */}
        <span style={{ ...styles.indicator, top: 10, left: '50%', transform: 'translateX(-50%)' }}>▲</span>
        <span style={{ ...styles.indicator, bottom: 10, left: '50%', transform: 'translateX(-50%)' }}>▼</span>
        <span style={{ ...styles.indicator, left: 10, top: '50%', transform: 'translateY(-50%)' }}>◀</span>
        <span style={{ ...styles.indicator, right: 10, top: '50%', transform: 'translateY(-50%)' }}>▶</span>
        {/* Knob */}
        <div ref={knobRef} style={styles.knob} />
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
  pad: {
    width: PAD_SIZE,
    height: PAD_SIZE,
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.2)',
    background: 'rgba(0,0,0,0.35)',
    position: 'relative',
    pointerEvents: 'auto',
    touchAction: 'none',
    userSelect: 'none',
    WebkitUserSelect: 'none',
  },
  knob: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.35)',
    border: '2px solid rgba(255,255,255,0.4)',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
    opacity: 0.5,
    transition: 'opacity 0.15s',
  },
  indicator: {
    position: 'absolute' as const,
    color: 'rgba(255,255,255,0.25)',
    fontSize: '0.9rem',
    pointerEvents: 'none' as const,
    userSelect: 'none' as const,
  },
};

export default TouchControls;
