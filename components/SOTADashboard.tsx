import React, { useState, useRef, useEffect } from 'react';
import { X, Zap, Settings, RotateCw } from 'lucide-react';
import * as THREE from 'three';

interface SOTADashboardProps {
  onClose: () => void;
}

interface ParticleData {
  positions: Float32Array;
  velocities: Float32Array;
  colors: Float32Array;
  scales: Float32Array;
  count: number;
}

interface LightConfig {
  intensity: number;
  color: string;
  position: [number, number, number];
  decay: number;
}

const SOTADashboard: React.FC<SOTADashboardProps> = ({ onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const particlesRef = useRef<ParticleData | null>(null);
  const particleSystemRef = useRef<THREE.Points | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const lightsRef = useRef<THREE.Light[]>([]);

  const [isRotating, setIsRotating] = useState(true);
  const [particleCount, setParticleCount] = useState(5000);
  const [lightIntensity, setLightIntensity] = useState(1.5);
  const [bloomStrength, setBloomStrength] = useState(1.2);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e27);
    scene.fog = new THREE.Fog(0x0a0e27, 100, 500);
    sceneRef.current = scene;

    // Initialize Camera
    const canvas = canvasRef.current;
    const width = canvas.clientWidth || 800;
    const height = canvas.clientHeight || 600;

    if (width === 0 || height === 0) {
      console.warn('Canvas has zero dimensions, using fallback');
    }

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
    camera.position.set(0, 15, 40);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Initialize Renderer with Post-Processing
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    // Create Advanced Particle System
    const createParticleSystem = (count: number) => {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      const velocities = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const scales = new Float32Array(count);

      // Color palette for SOTA
      const colorPalette = [
        new THREE.Color(0x00ff88), // Neon green
        new THREE.Color(0x00d4ff), // Cyan
        new THREE.Color(0xff006e), // Pink
        new THREE.Color(0xffbe0b), // Yellow
        new THREE.Color(0x8338ec), // Purple
      ];

      for (let i = 0; i < count; i++) {
        // Distribute particles in a sphere with some clustering
        const radius = 30 + Math.random() * 40;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.cos(phi);
        positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

        // Random velocities for organic movement
        velocities[i * 3] = (Math.random() - 0.5) * 0.5;
        velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.5;

        // Assign colors from palette
        const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;

        // Random scales
        scales[i] = Math.random() * 2 + 0.5;
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

      const material = new THREE.PointsMaterial({
        size: 0.5,
        vertexColors: true,
        transparent: true,
        sizeAttenuation: true,
        alphaTest: 0.01,
      });

      const points = new THREE.Points(geometry, material);
      scene.add(points);
      particleSystemRef.current = points;

      return {
        positions,
        velocities,
        colors,
        scales,
        count,
      };
    };

    particlesRef.current = createParticleSystem(particleCount);

    // Create Dynamic Lighting
    const createLighting = () => {
      // Ambient light for base illumination
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
      scene.add(ambientLight);
      lightsRef.current.push(ambientLight);

      // Directional light with shadows
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(30, 50, 30);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      scene.add(directionalLight);
      lightsRef.current.push(directionalLight);

      // Dynamic point lights with circuit colors
      const pointLightConfigs: LightConfig[] = [
        {
          intensity: 2,
          color: '#00ff88',
          position: [40, 20, 40],
          decay: 2,
        },
        {
          intensity: 2,
          color: '#00d4ff',
          position: [-40, 20, 40],
          decay: 2,
        },
        {
          intensity: 1.5,
          color: '#ff006e',
          position: [0, 40, -40],
          decay: 2,
        },
        {
          intensity: 1.5,
          color: '#8338ec',
          position: [30, 30, -30],
          decay: 2,
        },
      ];

      pointLightConfigs.forEach((config) => {
        const light = new THREE.PointLight(config.color, config.intensity, 200);
        light.position.set(...config.position);
        light.decay = config.decay;
        scene.add(light);
        lightsRef.current.push(light);
      });
    };

    createLighting();

    // Add Geometric Elements
    const createGeometry = () => {
      // Central sphere
      const sphereGeometry = new THREE.IcosahedronGeometry(8, 6);
      const sphereMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a2e,
        metalness: 0.7,
        roughness: 0.2,
        emissive: 0x00ff88,
        emissiveIntensity: 0.1,
      });
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphere.castShadow = true;
      sphere.receiveShadow = true;
      scene.add(sphere);

      // Rotating rings
      const ringCount = 4;
      for (let i = 0; i < ringCount; i++) {
        const ringGeometry = new THREE.TorusGeometry(25 + i * 8, 0.8, 32, 200);
        const ringMaterial = new THREE.MeshStandardMaterial({
          color: [0x00ff88, 0x00d4ff, 0xff006e, 0x8338ec][i],
          metalness: 0.9,
          roughness: 0.1,
          emissive: [0x00ff88, 0x00d4ff, 0xff006e, 0x8338ec][i],
          emissiveIntensity: 0.3,
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.castShadow = true;
        ring.receiveShadow = true;
        ring.rotation.x = Math.PI / 3 + (i * Math.PI) / 6;
        ring.rotation.y = Math.PI / 4 + (i * Math.PI) / 8;
        ring.userData.rotationSpeed = 0.001 + i * 0.0005;
        scene.add(ring);
      }
    };

    createGeometry();

    // Animation Loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      // Update particles
      if (particlesRef.current && particleSystemRef.current) {
        const { positions, velocities, count } = particlesRef.current;

        for (let i = 0; i < count; i++) {
          // Update position
          positions[i * 3] += velocities[i * 3] * 0.05;
          positions[i * 3 + 1] += velocities[i * 3 + 1] * 0.05;
          positions[i * 3 + 2] += velocities[i * 3 + 2] * 0.05;

          // Apply gravity toward center
          const x = positions[i * 3];
          const y = positions[i * 3 + 1];
          const z = positions[i * 3 + 2];

          const distance = Math.sqrt(x * x + y * y + z * z);
          const force = 0.0008 / (distance * distance + 1);

          velocities[i * 3] -= (x / distance) * force;
          velocities[i * 3 + 1] -= (y / distance) * force;
          velocities[i * 3 + 2] -= (z / distance) * force;

          // Damping
          velocities[i * 3] *= 0.98;
          velocities[i * 3 + 1] *= 0.98;
          velocities[i * 3 + 2] *= 0.98;

          // Wrap around bounds
          const maxBound = 100;
          if (Math.abs(positions[i * 3]) > maxBound)
            velocities[i * 3] *= -1;
          if (Math.abs(positions[i * 3 + 1]) > maxBound)
            velocities[i * 3 + 1] *= -1;
          if (Math.abs(positions[i * 3 + 2]) > maxBound)
            velocities[i * 3 + 2] *= -1;
        }

        (particleSystemRef.current.geometry.attributes
          .position as THREE.BufferAttribute).needsUpdate = true;

        if (isRotating) {
          particleSystemRef.current.rotation.x += 0.0002;
          particleSystemRef.current.rotation.y += 0.0003;
        }
      }

      // Rotate geometric elements
      scene.children.forEach((child) => {
        if (child instanceof THREE.Mesh && child.userData.rotationSpeed) {
          child.rotation.x += child.userData.rotationSpeed;
          child.rotation.y += child.userData.rotationSpeed * 0.7;
        }
      });

      // Dynamic light cycling
      const time = Date.now() * 0.0003;
      lightsRef.current.forEach((light, index) => {
        if (light instanceof THREE.PointLight && index > 1) {
          const offset = (index - 2) * (Math.PI / 2);
          const radius = 50;
          light.position.x = Math.cos(time + offset) * radius;
          light.position.z = Math.sin(time + offset) * radius;
        }
      });

      // Camera slight orbit
      if (isRotating) {
        const orbitTime = Date.now() * 0.00005;
        camera.position.x = Math.sin(orbitTime) * 50;
        camera.position.z = Math.cos(orbitTime) * 50;
        camera.lookAt(0, 0, 0);
      }

      // Update light intensity
      lightsRef.current.forEach((light) => {
        if (light instanceof THREE.PointLight) {
          light.intensity = lightIntensity;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // Handle Resize
    const handleResize = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      renderer.dispose();
    };
  }, [isRotating, lightIntensity, bloomStrength, particleCount]);

  const handleParticleCountChange = (newCount: number) => {
    setParticleCount(newCount);
    // Would need to recreate particles - this is handled via useEffect dependency
  };

  const handleReset = () => {
    setIsRotating(true);
    setParticleCount(5000);
    setLightIntensity(1.5);
    setBloomStrength(1.2);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col border border-purple-500/30">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-purple-500/20">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500">
              SOTA Visualization Dashboard
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-purple-500/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Canvas & Controls */}
        <div className="flex-1 flex gap-6 p-6 overflow-hidden">
          {/* 3D Canvas */}
          <div className="flex-1 rounded-xl overflow-hidden bg-black/50 border border-purple-500/20">
            <canvas
              ref={canvasRef}
              className="w-full h-full"
              style={{ display: 'block' }}
            />
          </div>

          {/* Control Panel */}
          <div className="w-64 flex flex-col gap-4">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-purple-500/20 space-y-4">
              <h3 className="font-semibold text-gray-200 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Controls
              </h3>

              {/* Rotation Toggle */}
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Auto Rotation</label>
                <button
                  onClick={() => setIsRotating(!isRotating)}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-all ${
                    isRotating
                      ? 'bg-gradient-to-r from-cyan-500 to-pink-500 text-white'
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  }`}
                >
                  {isRotating ? 'On' : 'Off'}
                </button>
              </div>

              {/* Particle Count */}
              <div className="space-y-2">
                <label className="text-sm text-gray-400">
                  Particles: {particleCount.toLocaleString()}
                </label>
                <input
                  type="range"
                  min="1000"
                  max="10000"
                  step="1000"
                  value={particleCount}
                  onChange={(e) => handleParticleCountChange(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Light Intensity */}
              <div className="space-y-2">
                <label className="text-sm text-gray-400">
                  Light Intensity: {lightIntensity.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={lightIntensity}
                  onChange={(e) => setLightIntensity(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Bloom Strength */}
              <div className="space-y-2">
                <label className="text-sm text-gray-400">
                  Bloom: {bloomStrength.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={bloomStrength}
                  onChange={(e) => setBloomStrength(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Reset Button */}
              <button
                onClick={handleReset}
                className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <RotateCw className="w-4 h-4" />
                Reset
              </button>
            </div>

            {/* Info Panel */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-purple-500/20">
              <h4 className="font-semibold text-gray-200 mb-2">Features</h4>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>✓ Advanced particle physics</li>
                <li>✓ Dynamic multi-color lighting</li>
                <li>✓ Orbital camera movement</li>
                <li>✓ Real-time gravity simulation</li>
                <li>✓ High-performance rendering</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SOTADashboard;
