import { EffectComposer, Bloom } from '@react-three/postprocessing';

const Effects = () => {
  return (
    <EffectComposer>
      {/* Bloom effect for the subtle glow / plasma look */}
      <Bloom 
        luminanceThreshold={0.2} 
        mipmapBlur 
        intensity={1.5} 
        radius={0.8}
      />
    </EffectComposer>
  );
};

export default Effects;
