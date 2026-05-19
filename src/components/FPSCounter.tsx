import { useEffect, useState } from 'react';

const FPSCounter = () => {
  const [fps, setFps] = useState(0);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let rafId: number;

    const tick = () => {
      const now = performance.now();
      frameCount++;
      
      if (now - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = now;
      }
      
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div style={{
      position: 'absolute',
      top: 10,
      left: 10,
      color: '#00ffcc',
      fontFamily: 'monospace',
      fontSize: '14px',
      background: 'rgba(0,0,0,0.5)',
      padding: '4px 8px',
      borderRadius: '4px',
      zIndex: 1000,
      pointerEvents: 'none'
    }}>
      FPS: {fps}
    </div>
  );
};

export default FPSCounter;
