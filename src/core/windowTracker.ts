import { useStore } from './store';

let lastX = window.screenX;
let lastY = window.screenY;
let lastTime = performance.now();

let currentVx = 0;
let currentVy = 0;
let rafId: number;

export const startTracking = () => {
  const update = () => {
    const now = performance.now();
    const dt = Math.max(now - lastTime, 1);
    
    const x = window.screenX;
    const y = window.screenY;

    const rawVx = ((x - lastX) / dt) * 1000;
    const rawVy = ((y - lastY) / dt) * 1000;

    // HIGH INERTIA / LOW FRICTION PHYSICS
    // When accelerating, respond relatively fast
    if (Math.abs(rawVx) > Math.abs(currentVx)) {
        currentVx += (rawVx - currentVx) * 0.3;
    } else {
        // When stopping or slowing, glide for a long time (0.97 multiplier)
        currentVx *= 0.97; 
    }

    if (Math.abs(rawVy) > Math.abs(currentVy)) {
        currentVy += (rawVy - currentVy) * 0.3;
    } else {
        currentVy *= 0.97; 
    }

    // Increased max velocity for wilder swings
    const maxV = 4000;
    if (currentVx > maxV) currentVx = maxV;
    if (currentVx < -maxV) currentVx = -maxV;
    if (currentVy > maxV) currentVy = maxV;
    if (currentVy < -maxV) currentVy = -maxV;

    if (Math.abs(currentVx) > 0.5 || Math.abs(currentVy) > 0.5 || x !== lastX || y !== lastY) {
        useStore.getState().setMyWindow({
          x,
          y,
          width: window.innerWidth,
          height: window.innerHeight,
          velocity: {
            x: Math.abs(currentVx) > 0.5 ? currentVx : 0,
            y: Math.abs(currentVy) > 0.5 ? currentVy : 0
          }
        });
    } else {
        currentVx = 0;
        currentVy = 0;
    }

    lastX = x;
    lastY = y;
    lastTime = now;
    rafId = requestAnimationFrame(update);
  };
  
  rafId = requestAnimationFrame(update);
  
  return () => cancelAnimationFrame(rafId);
};
