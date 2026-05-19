import { useSync } from './hooks/useSync';
import { useWindowMotion } from './hooks/useWindowMotion';
import Scene from './components/Scene';
import FPSCounter from './components/FPSCounter';
import { useStore, generateNewWindowURL } from './core/store';

function App() {
  // Initialize synchronization and window tracking hooks
  useSync();
  useWindowMotion();

  const { index, seed } = useStore();

  const handleOpenNewWindow = () => {
    // Open new window with deterministically next index and new seed
    const nextIndex = index + 1;
    const nextSeed = Math.floor(Math.random() * 10000);
    const url = generateNewWindowURL(nextIndex, nextSeed);
    window.open(url, '_blank', 'width=800,height=600');
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <FPSCounter />

      {/* UI Overlay for URL Params visibility and controls */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        zIndex: 10,
        color: 'white',
        fontFamily: 'monospace',
        background: 'rgba(0,0,0,0.5)',
        padding: '12px',
        borderRadius: '8px'
      }}>
        <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#00ffcc' }}>Index: {index}</p>
        <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#ff00cc' }}>Seed: {seed}</p>
        <button
          onClick={handleOpenNewWindow}
          style={{
            background: '#1a1a1a',
            color: 'white',
            border: '1px solid #444',
            padding: '6px 12px',
            cursor: 'pointer',
            borderRadius: '4px',
            fontFamily: 'monospace'
          }}
        >
          Open Linked Window
        </button>
      </div>

      <Scene />
    </div>
  );
}

export default App;
