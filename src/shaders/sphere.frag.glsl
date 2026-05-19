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

    vec3 trueGlobal = vWorldPosition + uGlobalOffset;
    float fragNoise = fbm(trueGlobal * 2.0 + uTime * 0.5);
    
    if (uIsCore > 0.5) {
        // --- INNER CORE ---
        // Initially invisible. Becomes the OTHER window's color as the connection forms
        float alpha = smoothstep(0.1, 0.8, uConnectionProgress);
        
        vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
        float fresnel = dot(viewDirection, normalize(vNormal));
        alpha *= smoothstep(0.0, 0.6, fresnel); // Soft inner nucleus feel
        
        float corePulse = sin(uTime * 4.0 + fragNoise * 10.0) * 0.5 + 0.5;
        vec3 color = mix(otherColor * 0.5, otherColor * 2.0, corePulse);
        
        float spot = smoothstep(0.3, 0.8, fragNoise);
        color *= spot * 1.5 + 0.5;
        
        gl_FragColor = vec4(color, alpha);
    } else {
        // --- OUTER SHELL / BRIDGE ---
        vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
        float fresnel = dot(viewDirection, normalize(vNormal));
        fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
        fresnel = pow(fresnel, 2.0); 
        
        vec3 color = mix(myColor * 0.2, myColor, fragNoise);
        float alpha = fresnel * 0.8 + 0.1;
        
        if (uHasOther > 0.5) {
            vec3 dirToOther = normalize(uOtherPos);
            float dotOther = max(dot(normalize(vPosition), dirToOther), 0.0);
            float bridgeGlow = pow(dotOther, 5.0);
            
            alpha += bridgeGlow * 0.8;
            color += color * bridgeGlow * 2.0; 
            
            // TRAVELING WAVES FROM THE OTHER WINDOW
            // Create inward-flowing pulses of the other sphere's color travelling down the bridge pipe
            float incomingWave = fract(dotOther * 4.0 + uTime * 2.5);
            incomingWave = smoothstep(0.7, 1.0, incomingWave) * bridgeGlow;
            
            color = mix(color, otherColor * 2.0, incomingWave * uConnectionProgress);
            alpha += incomingWave * uConnectionProgress * 0.6;
        }

        float thread = fract(fragNoise * 8.0 - uTime * 2.0);
        thread = smoothstep(0.8, 1.0, thread);
        color += myColor * thread * 0.8;
        alpha += thread * 0.3;

        gl_FragColor = vec4(color, alpha);
    }
}
