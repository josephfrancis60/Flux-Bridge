uniform float uTime;
uniform vec3 uVelocity;
uniform vec3 uOtherPos; 
uniform float uHasOther;
uniform float uIndex;
uniform float uIsCore;
uniform vec3 uGlobalOffset;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;

// NOISE_INCLUDE_PLACEHOLDER

void main() {
  vUv = uv;
  vNormal = normal;
  vPosition = position;
  
  vec3 newPos = position;
  float pull = 0.0;
  vec3 dirToOther = vec3(0.0);
  
  if (uHasOther > 0.5) {
      dirToOther = normalize(uOtherPos);
      float dotOther = max(dot(normal, dirToOther), 0.0);
      pull = pow(dotOther, 4.0);
      
      float distToOther = length(uOtherPos);
      if (distToOther > 0.0) {
          vec3 preGlobal = position + uGlobalOffset;
          float waveFlow = (preGlobal.x + preGlobal.y) * 0.5 - uTime * 3.0;
          float wave = sin(waveFlow) * 0.5 + 0.5;
          
          float stretchFactor = uIsCore > 0.5 ? 0.1 : 0.5;
          float stretchDist = distToOther * stretchFactor;
          
          newPos += dirToOther * pull * stretchDist * (1.0 + wave * 0.15);
      }
  }
  
  vec3 globalBase = newPos + uGlobalOffset;
  float n = fbm(globalBase * 2.0 + uTime * 0.5);
  
  vec3 dispDir = normal;
  if (uHasOther > 0.5) {
      vec3 axisProj = dirToOther * dot(newPos, dirToOther);
      vec3 outward = newPos - axisProj;
      if (length(outward) > 0.001) {
          outward = normalize(outward);
      }
      dispDir = normalize(mix(normal, outward, pull));
  }
  
  float coreFactor = uIsCore > 0.5 ? 0.1 : 0.3;
  newPos += dispDir * (n * coreFactor);
  
  // Crazy elasticity for dragging
  float velMag = length(uVelocity);
  if (velMag > 0.0) {
      vec3 velDir = normalize(uVelocity);
      float dotVel = dot(normal, velDir);
      
      // Increased scaling factor so extreme momentum causes massive trailing stretching
      float visualVel = min(velMag * 0.003, 3.0);
      float stretchAmount = (dotVel + 1.0) * 0.5; 
      
      // High-speed ripples travelling along the mass
      float ripple = sin(dotVel * 12.0 - uTime * 20.0) * visualVel * 0.15;
      
      newPos -= velDir * stretchAmount * visualVel * (uIsCore > 0.5 ? 0.2 : 0.8);
      newPos += normal * ripple;
  }

  vec4 worldPosition = modelMatrix * vec4(newPos, 1.0);
  vWorldPosition = worldPosition.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
