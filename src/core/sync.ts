import { useStore } from './store';

const channelName = 'energy-sphere-sync';
let channel: BroadcastChannel;

export const initSync = () => {
  channel = new BroadcastChannel(channelName);
  
  const handleMessage = (event: MessageEvent) => {
    const { type, payload } = event.data;
    
    if (type === 'WINDOW_UPDATE') {
      const state = useStore.getState();
      const isNew = !state.otherWindows[payload.id];
      
      state.updateOtherWindow(payload.id, payload);
      
      // If we just discovered a new window from its broadcast,
      // we must broadcast our own state back so it knows about us!
      if (isNew) {
         broadcastUpdate();
      }
    } else if (type === 'WINDOW_CLOSE') {
      useStore.getState().removeOtherWindow(payload.id);
    }
  };

  channel.addEventListener('message', handleMessage);
  
  // Announce immediately on open
  broadcastUpdate();

  const handleUnload = () => {
    channel.postMessage({
      type: 'WINDOW_CLOSE',
      payload: { id: useStore.getState().myWindow.id }
    });
    channel.close();
  };
  window.addEventListener('beforeunload', handleUnload);
  
  // Subscribe to velocity/position changes to continually update
  const unsubscribe = useStore.subscribe((state, prevState) => {
    if (state.myWindow !== prevState.myWindow) {
      broadcastUpdate();
    }
  });

  return () => {
    channel.removeEventListener('message', handleMessage);
    window.removeEventListener('beforeunload', handleUnload);
    unsubscribe();
  };
};

const broadcastUpdate = () => {
  if (!channel) return;
  const state = useStore.getState();
  channel.postMessage({
    type: 'WINDOW_UPDATE',
    payload: state.myWindow
  });
};
