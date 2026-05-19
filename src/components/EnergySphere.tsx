import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useStore } from '../core/store';
import * as THREE from 'three';

import vertexShader from '../shaders/sphere.vert.glsl?raw';
import fragmentShader from '../shaders/sphere.frag.glsl?raw';
import noiseShader from '../shaders/noise.glsl?raw';

const EnergySphere = () => {
  const outerMatRef = useRef<THREE.ShaderMaterial>(null);
  const innerMatRef = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();
  
  const { seed, index, fixIteration } = useStore();

  const vert = vertexShader.replace('// NOISE_INCLUDE_PLACEHOLDER', noiseShader);
  const frag = fragmentShader.replace('// NOISE_INCLUDE_PLACEHOLDER', noiseShader);

  const uniformsOuter = useMemo(() => ({
    uTime: { value: 0 },
    uSeed: { value: seed },
    uIndex: { value: index },
    uVelocity: { value: new THREE.Vector3(0, 0, 0) },
    uOtherPos: { value: new THREE.Vector3(0, 0, 0) },
    uGlobalOffset: { value: new THREE.Vector3(0, 0, 0) },
    uHasOther: { value: 0 },
    uIsCore: { value: 0.0 },
    uConnectionProgress: { value: 0.0 }
  }), [seed, index]);

  const uniformsInner = useMemo(() => ({
    uTime: { value: 0 },
    uSeed: { value: seed },
    uIndex: { value: index },
    uVelocity: { value: new THREE.Vector3(0, 0, 0) },
    uOtherPos: { value: new THREE.Vector3(0, 0, 0) },
    uGlobalOffset: { value: new THREE.Vector3(0, 0, 0) },
    uHasOther: { value: 0 },
    uIsCore: { value: 1.0 },
    uConnectionProgress: { value: 0.0 }
  }), [seed, index]);

  const connectionProgressRef = useRef(0);

  useFrame((state, delta) => {
    if (!outerMatRef.current || !innerMatRef.current) return;
    
    const t = fixIteration !== 0 ? fixIteration : state.clock.elapsedTime;
    
    outerMatRef.current.uniforms.uTime.value = t;
    innerMatRef.current.uniforms.uTime.value = t;
    
    const store = useStore.getState();
    const my = store.myWindow;
    
    const vx = my.velocity.x * 0.01;
    const vy = -my.velocity.y * 0.01;
    outerMatRef.current.uniforms.uVelocity.value.set(vx, vy, 0);
    innerMatRef.current.uniforms.uVelocity.value.set(vx, vy, 0);

    const myCX = my.x + my.width / 2;
    const myCY = my.y + my.height / 2;
    const scale = viewport.height / window.innerHeight;
    
    const globalX = myCX * scale;
    const globalY = -myCY * scale;
    outerMatRef.current.uniforms.uGlobalOffset.value.set(globalX, globalY, 0);
    innerMatRef.current.uniforms.uGlobalOffset.value.set(globalX, globalY, 0);

    const otherWindows = Object.values(store.otherWindows);
    
    // Smooth, liquid transition for the connection progress
    const isConnected = otherWindows.length > 0;
    const targetProgress = isConnected ? 1 : 0;
    connectionProgressRef.current += (targetProgress - connectionProgressRef.current) * delta * 1.5;
    
    outerMatRef.current.uniforms.uConnectionProgress.value = connectionProgressRef.current;
    innerMatRef.current.uniforms.uConnectionProgress.value = connectionProgressRef.current;

    if (isConnected) {
      let closest = otherWindows[0];
      let minDist = Infinity;
      
      for (const w of otherWindows) {
        const wCX = w.x + w.width / 2;
        const wCY = w.y + w.height / 2;
        const dist = Math.hypot(wCX - myCX, wCY - myCY);
        if (dist < minDist) {
          minDist = dist;
          closest = w;
        }
      }

      const wCX = closest.x + closest.width / 2;
      const wCY = closest.y + closest.height / 2;
      
      const dx_px = wCX - myCX;
      const dy_px = wCY - myCY;

      const dx_world = dx_px * scale;
      const dy_world = dy_px * scale;

      outerMatRef.current.uniforms.uOtherPos.value.set(dx_world, -dy_world, 0);
      outerMatRef.current.uniforms.uHasOther.value = 1.0;
      
      innerMatRef.current.uniforms.uOtherPos.value.set(dx_world, -dy_world, 0);
      innerMatRef.current.uniforms.uHasOther.value = 1.0;
    } else {
      outerMatRef.current.uniforms.uHasOther.value = 0.0;
      innerMatRef.current.uniforms.uHasOther.value = 0.0;
    }
  });

  return (
    <group>
      {/* Outer Shell */}
      <mesh>
        <sphereGeometry args={[1.5, 96, 96]} />
        <shaderMaterial
          ref={outerMatRef}
          vertexShader={vert}
          fragmentShader={frag}
          uniforms={uniformsOuter}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Inner Core */}
      <mesh>
        <sphereGeometry args={[0.8, 64, 64]} />
        <shaderMaterial
          ref={innerMatRef}
          vertexShader={vert}
          fragmentShader={frag}
          uniforms={uniformsInner}
          transparent={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};

export default EnergySphere;
