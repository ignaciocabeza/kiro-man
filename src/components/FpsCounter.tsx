import React, { useRef, useEffect, useState } from 'react';

const FpsCounter: React.FC = React.memo(() => {
  const [fps, setFps] = useState(0);
  const framesRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const rafRef = useRef(0);

  useEffect(() => {
    const loop = () => {
      framesRef.current++;
      const now = performance.now();
      const elapsed = now - lastTimeRef.current;

      if (elapsed >= 1000) {
        setFps(Math.round((framesRef.current * 1000) / elapsed));
        framesRef.current = 0;
        lastTimeRef.current = now;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div style={style}>
      {fps} FPS
    </div>
  );
});

const style: React.CSSProperties = {
  position: 'fixed',
  bottom: 52,
  right: 12,
  padding: '2px 8px',
  background: 'rgba(0,0,0,0.6)',
  color: '#0f0',
  fontFamily: '"Courier New", monospace',
  fontSize: '12px',
  borderRadius: 4,
  zIndex: 20,
  pointerEvents: 'none',
};

export default FpsCounter;
