import { useEffect } from 'react';
import { startTracking } from '../core/windowTracker';

export const useWindowMotion = () => {
  useEffect(() => {
    const cleanup = startTracking();
    return cleanup;
  }, []);
};
