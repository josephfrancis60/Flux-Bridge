uniform float uTime;
uniform float uSeed;
uniform vec3 uOtherPos;
uniform float uHasOther;
uniform float uIndex;
uniform float uIsCore;
uniform vec3 uGlobalOffset;
uniform float uConnectionProgress;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;

// NOISE_INCLUDE_PLACEHOLDER

void main() {
    vec3 myColor;
    vec3 otherColor;
    
    if (uIndex < 0.5) {
        myColor = vec3(1.0, 0.05, 0.1); // RED
        otherColor = vec3(1.0, 0.8, 0.0); // YELLOW
    } else {
        myColor = vec3(1.0, 0.8, 0.0); // YELLOW
        otherColor = vec3(1.0, 0.05, 0.1); // RED
    }

    vec3 localPos = vPosition;
    
    // --- COSMIC ENERGY WAVES (STATIC STATE) ---
    // Multi-octave evolving noise in local space for a stable, gaseous fluid look
    float n1 = snoise(localPos * 1.5 + vec3(0.0, uTime * 0.3, uSeed * 0.1));
    float n2 = snoise(localPos * 3.0 - vec3(uTime * 0.45, 0.0, n1 * 0.4));
    float cosmicNoise = mix(n1, n2, 0.45) * 0.5 + 0.5;

    // View direction and Fresnel for soft edges / atmospheric glow
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float fresnel = dot(viewDirection, normalize(vNormal));
    
    if (uIsCore > 0.5) {
        // --- INNER NUCLEUS / CORE ---
        // Becomes visible when connected. Replaces the core of the sphere
        // It carries the OTHER window's color, formed by waves traveling along the bridge
        float alpha = smoothstep(0.1, 0.8, uConnectionProgress);
        alpha *= smoothstep(0.0, 0.7, fresnel); // soft nuclear edge
        
        // Evolving core plasma flow
        float coreNoise = fbm(localPos * 4.0 - vec3(0.0, uTime * 0.6, 0.0));
        vec3 color = mix(otherColor * 0.35, otherColor * 1.8, coreNoise * 0.5 + 0.5);
        
        // Add linear traveler waves reaching the core
        if (uHasOther > 0.5) {
            float L = length(uOtherPos);
            vec3 dirToOther = normalize(uOtherPos);
            float dotOther = max(dot(normalize(vPosition), dirToOther), 0.0);
            float bridgeGlow = pow(dotOther, 4.0);
            
            float distAlongAxis = dot(vPosition, dirToOther);
            float distToCore = length(vPosition);
            
            // Unified coordinate: s = 0 at other sphere center, s = L at our core
            float s = L - mix(distToCore, distAlongAxis, bridgeGlow);
            
            // Traveling wave pulse carrying cosmic energy to the core
            float waveVal = sin(s * 2.8 - uTime * 8.0) * 0.5 + 0.5;
            float incomingPulse = pow(waveVal, 4.0);
            
            // Core glows intensely and flashes as waves arrive
            color = mix(color, otherColor * 3.0, incomingPulse * uConnectionProgress);
            alpha += incomingPulse * uConnectionProgress * 0.4;
        }
        
        gl_FragColor = vec4(color, alpha);
    } else {
        // --- OUTER COSMIC SHELL & BRIDGE ---
        float edgeAlpha = clamp(1.0 - fresnel, 0.0, 1.0);
        float shellGlow = pow(edgeAlpha, 2.5);
        
        // Liquid gaseous base color
        vec3 color = mix(myColor * 0.15, myColor * 1.4, cosmicNoise);
        float alpha = shellGlow * 0.85 + 0.1;
        
        // Nebulous bands wrapping around the sphere
        float bands = sin(localPos.y * 6.0 + cosmicNoise * 4.0 + uTime * 1.5) * 0.5 + 0.5;
        color += myColor * bands * 0.4;
        alpha += bands * 0.15;

        if (uHasOther > 0.5) {
            vec3 dirToOther = normalize(uOtherPos);
            float dotOther = max(dot(normalize(vPosition), dirToOther), 0.0);
            float bridgeGlow = pow(dotOther, 4.0);
            
            // Core bridge shape glow
            alpha += bridgeGlow * 0.85;
            color += myColor * bridgeGlow * 0.8;
            
            // TRAVELING WAVES FROM THE OTHER WINDOW
            float L = length(uOtherPos);
            float distAlongAxis = dot(vPosition, dirToOther);
            float distToCore = length(vPosition);
            
            // Unified wave coordinate
            float s = L - mix(distToCore, distAlongAxis, bridgeGlow);
            
            // Wave pulses traveling along the bridge
            float waveVal = sin(s * 2.8 - uTime * 8.0) * 0.5 + 0.5;
            float incomingWave = pow(waveVal, 4.0) * bridgeGlow;
            
            // Wave morphs to other color as it travels
            color = mix(color, otherColor * 2.5, incomingWave * uConnectionProgress);
            alpha += incomingWave * uConnectionProgress * 0.75;
        }

        gl_FragColor = vec4(color, alpha);
    }
}
