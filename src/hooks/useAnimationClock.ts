import { useEffect } from 'react';
import { useStore } from '../core/store';

export const useAnimationClock = () => {
  useEffect(() => {
    let rafId: number;
    const start = performance.now();
    
    const tick = () => {
      useStore.getState().setTime((performance.now() - start) * 0.001);
      rafId = requestAnimationFrame(tick);
    };
    
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);
};
