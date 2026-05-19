# FluxBridge

FluxBridge is an interactive, browser-based 3D visual experiment. It features a glowing, physics-responsive plasma sphere that reacts to browser window movements with extreme elasticity and fluid inertia. 

The most unique feature of FluxBridge is its **multi-window synchronization**. When you open a second window, the spheres discover each other across the boundaries of the browser windows and mathematically connect in physical screen space. They form a seamless "energy bridge" where plasma waves and colors physically flow from one browser window into the other, creating an interconnected cross-window visual experience.

## 🚀 Tech Stack

- **Framework:** React 18 & Vite
- **Language:** TypeScript
- **3D Rendering:** Three.js
- **React Abstraction:** React Three Fiber (`@react-three/fiber`) & React Three Drei (`@react-three/drei`)
- **Shaders:** Custom GLSL Vertex and Fragment shaders (FBM Noise, Fresnel, Additive Blending)
- **Post-Processing:** `@react-three/postprocessing` (Bloom)
- **State Management:** Zustand
- **Cross-Window Sync:** Web `BroadcastChannel` API & Screen Coordinates (`window.screenX` / `window.screenY`)
- **Styling:** Vanilla CSS

## 🛠️ Getting Started

Follow these steps to run the project locally on your machine.

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone the repository or download the source code.
2. Open your terminal and navigate to the project directory:
   ```bash
   cd FluxBridge
   ```
3. Install the project dependencies:
   ```bash
   npm install
   ```

### Running the Application

1. Start the Vite development server:
   ```bash
   npm run dev
   ```
2. Open the provided `localhost` link in your web browser (usually `http://localhost:5173`).
3. **To see the magic:** Click the "Open Linked Window" button on the UI to open a second window. Place them side-by-side and watch the energy bridge form! Drag the windows around to see the elastic physics in action.

## 💡 How it Works
- **Screen-to-World Mapping**: The application calculates your browser's physical pixel position on your monitor and precisely maps it into the Three.js 3D world space. 
- **Deterministic Noise**: The plasma is generated using a customized 3D Fractal Brownian Motion (FBM) algorithm that evaluates coordinates in *global monitor space*, guaranteeing the geometric width and texture patterns perfectly align across separate windows.
- **Broadcast Sync**: The window positions and velocities are shared in real-time across tabs using the `BroadcastChannel` API, feeding into the WebGL shaders via Zustand state to drive the deformation.
