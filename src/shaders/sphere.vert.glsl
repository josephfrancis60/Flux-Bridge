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
          // Stable wave flowing along the bridge direction using local coordinates
          float distAlongAxis = dot(position, dirToOther);
          float waveFlow = distAlongAxis * 1.5 - uTime * 3.0;
          float wave = sin(waveFlow) * 0.5 + 0.5;
          
          float stretchFactor = uIsCore > 0.5 ? 0.1 : 0.5;
          float stretchDist = distToOther * stretchFactor;
          
          newPos += dirToOther * pull * stretchDist * (1.0 + wave * 0.15);
      }
  }
  
  // Smooth cosmic waves displacement calculated in local space
  float n = fbm(newPos * 1.5 + vec3(0.0, uTime * 0.35, 0.0));
  
  vec3 dispDir = normal;
  if (uHasOther > 0.5) {
      vec3 axisProj = dirToOther * dot(newPos, dirToOther);
      vec3 outward = newPos - axisProj;
      if (length(outward) > 0.001) {
          outward = normalize(outward);
      }
      dispDir = normalize(mix(normal, outward, pull));
  }
  
  float coreFactor = uIsCore > 0.5 ? 0.08 : 0.25;
  newPos += dispDir * (n * coreFactor);
  
  // Physical elasticity driven by our sphere velocity
  float velMag = length(uVelocity);
  if (velMag > 0.0) {
      vec3 velDir = normalize(uVelocity);
      float dotVel = dot(normal, velDir);
      
      // visual velocity stretch factor
      float visualVel = min(velMag * 0.45, 3.0);
      float stretchAmount = (dotVel + 1.0) * 0.5; 
      
      // Gentle, trailing ripples along the direction of physical travel
      float ripple = sin(dotVel * 10.0 - uTime * 15.0) * visualVel * 0.12;
      
      newPos -= velDir * stretchAmount * visualVel * (uIsCore > 0.5 ? 0.25 : 0.85);
      newPos += normal * ripple;
  }

  vec4 worldPosition = modelMatrix * vec4(newPos, 1.0);
  vWorldPosition = worldPosition.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
