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
  const groupRef = useRef<THREE.Group>(null);
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

  // DRAG PHYSICS STATE (HIGH INERTIA / LESS FRICTION SPRING SIMULATION)
  const lastWindowPos = useRef({ x: window.screenX, y: window.screenY });
  const sphereOffset = useRef(new THREE.Vector3(0, 0, 0));
  const sphereVelocity = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((state, delta) => {
    if (!outerMatRef.current || !innerMatRef.current) return;
    
    const t = fixIteration !== 0 ? fixIteration : state.clock.elapsedTime;
    
    outerMatRef.current.uniforms.uTime.value = t;
    innerMatRef.current.uniforms.uTime.value = t;
    
    const store = useStore.getState();
    const my = store.myWindow;
    
    // Scale viewport conversions
    const scale = viewport.height / window.innerHeight;

    // --- DRAG PHYSICS (INERTIA + SPRING PULL-BACK) ---
    const currentX = window.screenX;
    const currentY = window.screenY;
    
    // Difference in window's screen coordinates
    const dx = currentX - lastWindowPos.current.x;
    const dy = currentY - lastWindowPos.current.y;
    
    lastWindowPos.current.x = currentX;
    lastWindowPos.current.y = currentY;

    // Convert screen drag delta to Three.js viewport space
    const deltaX = dx * scale;
    const deltaY = -dy * scale; // screen Y increases down, Three.js Y increases up

    // Lag behind: shift the sphere's local position in the opposite direction of window movement
    sphereOffset.current.x -= deltaX;
    sphereOffset.current.y -= deltaY;

    // Physics parameters for high inertia (slow acceleration/damping) and low friction
    const k = 4.0;   // Spring constant (restoring pull force)
    const c = 0.45;  // Damping coefficient (friction - lower value = more glide/oscillation)
    const m = 1.0;   // Mass (inertia)

    // Spring-mass-damper system: F = -k*x - c*v
    const forceX = -k * sphereOffset.current.x - c * sphereVelocity.current.x;
    const forceY = -k * sphereOffset.current.y - c * sphereVelocity.current.y;

    const ax = forceX / m;
    const ay = forceY / m;

    // Cap delta time to prevent giant leaps on frame drops
    const dt = Math.min(delta, 0.05);

    sphereVelocity.current.x += ax * dt;
    sphereVelocity.current.y += ay * dt;

    sphereOffset.current.x += sphereVelocity.current.x * dt;
    sphereOffset.current.y += sphereVelocity.current.y * dt;

    // Boundary limit to keep sphere inside viewport bounds safely
    const maxOffsetDist = 3.2;
    const offsetLen = Math.hypot(sphereOffset.current.x, sphereOffset.current.y);
    if (offsetLen > maxOffsetDist && offsetLen > 0) {
      sphereOffset.current.x = (sphereOffset.current.x / offsetLen) * maxOffsetDist;
      sphereOffset.current.y = (sphereOffset.current.y / offsetLen) * maxOffsetDist;
      sphereVelocity.current.multiplyScalar(0.7); // lose some speed on boundaries
    }

    // Apply the computed lag offset to the group containing the spheres
    if (groupRef.current) {
      groupRef.current.position.set(sphereOffset.current.x, sphereOffset.current.y, 0);
    }

    // Pass the sphere's active relative velocity to the shader for the visual trailing stretch
    // We scale this to make the stretch highly prominent and liquid
    const vx = sphereVelocity.current.x * 0.15;
    const vy = sphereVelocity.current.y * 0.15;
    outerMatRef.current.uniforms.uVelocity.value.set(vx, vy, 0);
    innerMatRef.current.uniforms.uVelocity.value.set(vx, vy, 0);

    // Save my physical sphere offset back to Zustand so the partner window knows our exact coordinates
    store.setMyWindow({
      sphereOffset: { x: sphereOffset.current.x, y: sphereOffset.current.y }
    });

    const myCX = my.x + my.width / 2;
    const myCY = my.y + my.height / 2;
    
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

      // Extract the other sphere's lag offset from state (sync)
      const otherSphereOffset = closest.sphereOffset || { x: 0, y: 0 };

      // Calculate vector between actual physically shifted spheres
      const finalOtherX = dx_world + otherSphereOffset.x - sphereOffset.current.x;
      const finalOtherY = -dy_world + otherSphereOffset.y - sphereOffset.current.y;

      outerMatRef.current.uniforms.uOtherPos.value.set(finalOtherX, finalOtherY, 0);
      outerMatRef.current.uniforms.uHasOther.value = 1.0;
      
      innerMatRef.current.uniforms.uOtherPos.value.set(finalOtherX, finalOtherY, 0);
      innerMatRef.current.uniforms.uHasOther.value = 1.0;
    } else {
      outerMatRef.current.uniforms.uHasOther.value = 0.0;
      innerMatRef.current.uniforms.uHasOther.value = 0.0;
    }
  });

  return (
    <group ref={groupRef}>
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
