import { useEffect } from 'react';
import { initSync } from '../core/sync';

export const useSync = () => {
  useEffect(() => {
    const cleanup = initSync();
    return cleanup;
  }, []);
};
