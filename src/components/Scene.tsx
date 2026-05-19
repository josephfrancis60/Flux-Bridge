import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import EnergySphere from './EnergySphere';
import Effects from './Effects';

const Scene = () => {
  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: false, powerPreference: "high-performance" }}
    >
      <color attach="background" args={['#000510']} />

      {/* Add an environment to potentially influence materials if we used Standard Material, 
          but for ShaderMaterial it's purely for potential future use or ambient feels */}
      <ambientLight intensity={0.2} />

      <EnergySphere />
      <Effects />
    </Canvas>
  );
};

export default Scene;
