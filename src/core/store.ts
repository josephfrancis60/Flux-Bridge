import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface WindowState {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  velocity: { x: number; y: number };
  sphereOffset?: { x: number; y: number };
}

export interface AppState {
  time: number;
  seed: number;
  index: number;
  fixIteration: number;
  myWindow: WindowState;
  otherWindows: Record<string, WindowState>;
  setMyWindow: (data: Partial<WindowState>) => void;
  updateOtherWindow: (id: string, data: WindowState) => void;
  removeOtherWindow: (id: string) => void;
  setTime: (time: number) => void;
}

const parseUrlParams = () => {
  const params = new URLSearchParams(window.location.search);
  let i = params.has('i') ? parseInt(params.get('i')!, 10) : -1;
  let seed = params.has('seed') ? parseFloat(params.get('seed')!) : -1;
  let fixIteration = params.has('fixIteration') ? parseFloat(params.get('fixIteration')!) : -1;

  if (i === -1 || seed === -1) {
    if (i === -1) i = 0; 
    if (seed === -1) seed = Math.floor(Math.random() * 10000);
    
    const newParams = new URLSearchParams(window.location.search);
    newParams.set('i', i.toString());
    newParams.set('seed', seed.toString());
    if (fixIteration !== -1) newParams.set('fixIteration', fixIteration.toString());
    
    window.history.replaceState(null, '', '?' + newParams.toString());
  }
  
  return { i, seed, fixIteration: fixIteration === -1 ? 0 : fixIteration };
};

const initialParams = parseUrlParams();
console.log(`[Store] Window initialized with index: ${initialParams.i}, seed: ${initialParams.seed}`);

const windowId = uuidv4();

export const useStore = create<AppState>((set) => ({
  time: 0,
  seed: initialParams.seed,
  index: initialParams.i,
  fixIteration: initialParams.fixIteration,
  myWindow: {
    id: windowId,
    x: window.screenX,
    y: window.screenY,
    width: window.innerWidth,
    height: window.innerHeight,
    velocity: { x: 0, y: 0 },
    sphereOffset: { x: 0, y: 0 }
  },
  otherWindows: {},
  setMyWindow: (data) => set((state) => ({ myWindow: { ...state.myWindow, ...data } })),
  updateOtherWindow: (id, data) => set((state) => ({
    otherWindows: { ...state.otherWindows, [id]: data }
  })),
  removeOtherWindow: (id) => set((state) => {
    const { [id]: _, ...rest } = state.otherWindows;
    return { otherWindows: rest };
  }),
  setTime: (time) => set({ time })
}));

export const generateNewWindowURL = (newIndex: number, newSeed: number) => {
  return `/?i=${newIndex}&seed=${newSeed}`;
};
