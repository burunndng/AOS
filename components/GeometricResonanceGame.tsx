import React, { useState, useRef, useEffect } from 'react';
import { X, Volume2, VolumeX, RotateCw } from 'lucide-react';
import * as THREE from 'three';

// Bloom shader for post-processing
const bloomVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const bloomFragmentShader = `
  uniform sampler2D tDiffuse;
  uniform float strength;
  uniform float threshold;
  varying vec2 vUv;

  void main() {
    vec4 texel = texture2D(tDiffuse, vUv);
    float luminance = dot(texel.rgb, vec3(0.299, 0.587, 0.114));

    if (luminance > threshold) {
      gl_FragColor = vec4(texel.rgb * strength, texel.a);
    } else {
      gl_FragColor = texel;
    }
  }
`;

// Chromatic aberration shader
const chromaticVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const chromaticFragmentShader = `
  uniform sampler2D tDiffuse;
  uniform vec2 amount;
  varying vec2 vUv;

  void main() {
    vec2 offset = amount * 0.01;
    float r = texture2D(tDiffuse, vUv + offset).r;
    float g = texture2D(tDiffuse, vUv).g;
    float b = texture2D(tDiffuse, vUv - offset).b;
    gl_FragColor = vec4(r, g, b, 1.0);
  }
`;

// Nebula shader with Simplex-like noise
const nebulaVertexShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const nebulaFragmentShader = `
  uniform float uTime;
  uniform float uResonance;
  varying vec3 vPosition;
  varying vec3 vNormal;

  // Simple hash function
  float hash(vec3 p) {
    return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
  }

  // Noise function
  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float n = mix(
      mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y),
      f.z
    );
    return n;
  }

  void main() {
    vec3 pos = vPosition + uTime * 0.1;
    float n = noise(pos);

    // Create swirling nebula effect
    float swirl = sin(length(vPosition) * 2.0 - uTime) * 0.5 + 0.5;
    float intensity = mix(n, swirl, 0.5);

    // Color gradient from purple to cyan
    vec3 color1 = vec3(0.6, 0.2, 1.0); // Purple
    vec3 color2 = vec3(0.0, 0.8, 1.0); // Cyan
    vec3 color = mix(color1, color2, intensity);

    // Resonance affects the glow
    color *= (1.0 + uResonance * 0.5);

    gl_FragColor = vec4(color, intensity * 0.6);
  }
`;

interface GeometricResonanceGameProps {
  isOpen: boolean;
  onClose: () => void;
  onGameEvent?: (event: string, data?: any) => void;
}

type GameMode = 'resonance-duel' | 'mandala-architect' | 'menu';

const GeometricResonanceGame: React.FC<GeometricResonanceGameProps> = ({
  isOpen,
  onClose,
  onGameEvent
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const playerShapeRef = useRef<THREE.Group | null>(null);
  const oracleShapeRef = useRef<THREE.Group | null>(null);
  const symmetryLinesRef = useRef<THREE.Group | null>(null);
  const particleSystemRef = useRef<THREE.Points | null>(null);
  const sceneGroupRef = useRef<THREE.Group | null>(null);
  const backgroundRef = useRef<THREE.Group | null>(null);
  const composerRef = useRef<any>(null);
  const bloomMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const chromaticMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const nebulaShaderRef = useRef<THREE.ShaderMaterial | null>(null);
  const instancedMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const elapsedTimeRef = useRef(0);

  const [gameMode, setGameMode] = useState<GameMode>('menu');
  const [score, setScore] = useState(0);
  const [resonanceLevel, setResonanceLevel] = useState(0);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [gameTime, setGameTime] = useState(60);
  const [gameActive, setGameActive] = useState(false);
  const [oracleScore, setOracleScore] = useState(0);

  // Helper: Create sacred geometry shapes with enhanced visuals
  const createGeometricShape = (type: string, color: number): THREE.Group => {
    const group = new THREE.Group();
    let geometry: THREE.BufferGeometry;

    switch (type) {
      case 'tetrahedron':
        geometry = new THREE.TetrahedronGeometry(1, 2);
        break;
      case 'cube':
        geometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
        break;
      case 'octahedron':
        geometry = new THREE.OctahedronGeometry(1, 2);
        break;
      case 'icosahedron':
        geometry = new THREE.IcosahedronGeometry(1, 3);
        break;
      case 'dodecahedron':
        geometry = new THREE.DodecahedronGeometry(1, 0);
        break;
      case 'flower-of-life':
        return createFlowerOfLife(color);
      default:
        geometry = new THREE.BoxGeometry(1, 1, 1);
    }

    // Create wireframe with enhanced glow
    const wireframeGeometry = new THREE.EdgesGeometry(geometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({
      color: color,
      linewidth: 2,
      transparent: true,
      opacity: 0.9,
      fog: false,
    });
    const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
    group.add(wireframe);

    // Create solid with glow
    const material = new THREE.MeshPhongMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.15,
      wireframe: false,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);

    // Add multiple glow lights for stronger effect
    const glowLight1 = new THREE.PointLight(color, 1.2, 25);
    group.add(glowLight1);

    const glowLight2 = new THREE.PointLight(color, 0.6, 15);
    glowLight2.position.set(0.5, 0.5, 0.5);
    group.add(glowLight2);

    return group;
  };

  const createFlowerOfLife = (color: number): THREE.Group => {
    const group = new THREE.Group();
    const radius = 0.5;
    const circles = 7; // Central + 6 around

    // Central circle
    const circleGeometry = new THREE.CircleGeometry(radius, 32);
    const circleMaterial = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.7,
    });

    for (let i = 0; i < circles; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      const edges = new THREE.EdgesGeometry(circleGeometry);
      const circle = new THREE.LineSegments(edges, circleMaterial);
      circle.position.set(x, y, 0);
      group.add(circle);
    }

    // Add outer circle
    const outerGeometry = new THREE.CircleGeometry(radius * 1.5, 32);
    const outerEdges = new THREE.EdgesGeometry(outerGeometry);
    const outerCircle = new THREE.LineSegments(outerEdges, circleMaterial);
    group.add(outerCircle);

    // Add glow light
    const glowLight = new THREE.PointLight(color, 1, 20);
    group.add(glowLight);

    return group;
  };

  const createNebulaBackground = (scene: THREE.Scene) => {
    const bg = new THREE.Group();
    scene.add(bg);
    backgroundRef.current = bg;

    // Create a large sphere with shader-based nebula
    const geometry = new THREE.SphereGeometry(50, 32, 32);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uResonance: { value: 0 },
      },
      vertexShader: nebulaVertexShader,
      fragmentShader: nebulaFragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
    });

    nebulaShaderRef.current = material;
    const nebula = new THREE.Mesh(geometry, material);
    bg.add(nebula);

    // Add additional particle layer for depth
    const particleCount = 300;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xc77dff,
      size: 0.3,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.2,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    bg.add(particles);
  };

  const createInstancedGeometryBurst = (parentGroup: THREE.Group) => {
    // Create base geometry (small tetrahedron)
    const geometry = new THREE.TetrahedronGeometry(0.15, 1);
    const material = new THREE.MeshPhongMaterial({
      color: 0xffd700,
      emissive: 0xffaa00,
      emissiveIntensity: 0.8,
    });

    // Create instanced mesh with many instances
    const count = 500;
    const instancedMesh = new THREE.InstancedMesh(geometry, material, count);

    // Initialize positions far off-screen
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      dummy.position.set(1000, 1000, 1000);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);
    }
    instancedMesh.instanceMatrix.needsUpdate = true;

    parentGroup.add(instancedMesh);
    instancedMeshRef.current = instancedMesh;
  };

  // Initialize Three.js scene
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a0a1a);
    scene.fog = new THREE.FogExp2(0x0a0a1a, 0.001);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 8;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    rendererRef.current = renderer;

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Add dynamic point lights
    const goldenLight = new THREE.PointLight(0xffd700, 1.5, 30);
    goldenLight.position.set(0, 3, 3);
    scene.add(goldenLight);

    const purpleLight = new THREE.PointLight(0xc77dff, 1.2, 30);
    purpleLight.position.set(-3, -2, 3);
    scene.add(purpleLight);

    const cyanLight = new THREE.PointLight(0x00d9ff, 1.2, 30);
    cyanLight.position.set(3, -2, 3);
    scene.add(cyanLight);

    // Create main scene group
    const sceneGroup = new THREE.Group();
    sceneRef.current.add(sceneGroup);
    sceneGroupRef.current = sceneGroup;

    // Create background nebula
    createNebulaBackground(scene);

    // Create instanced geometry burst system
    createInstancedGeometryBurst(sceneGroup);

    // Create player's geometric shape (starts as cube)
    const playerShape = createGeometricShape('cube', 0xff6b9d);
    playerShape.position.set(-3, 0, 0);
    sceneGroup.add(playerShape);
    playerShapeRef.current = playerShape;

    // Create oracle's geometric shape (starts as octahedron)
    const oracleShape = createGeometricShape('octahedron', 0x00d9ff);
    oracleShape.position.set(3, 0, 0);
    sceneGroup.add(oracleShape);
    oracleShapeRef.current = oracleShape;

    // Create symmetry visualization lines
    const symmetryLines = new THREE.Group();
    sceneGroup.add(symmetryLines);
    symmetryLinesRef.current = symmetryLines;

    updateSymmetryVisualization();

    // Create particle system for fractal bursts
    createParticleSystem(sceneGroup);

    // Handle resize
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Burst animation state
    let burstActive = false;
    let burstStartTime = 0;
    const burstDuration = 2000; // 2 seconds

    // Animation loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      elapsedTimeRef.current += 0.016;

      // Update shader uniforms
      if (nebulaShaderRef.current) {
        nebulaShaderRef.current.uniforms.uTime.value = elapsedTimeRef.current;
        nebulaShaderRef.current.uniforms.uResonance.value = resonanceLevel;
      }

      if (gameMode !== 'menu' && gameActive) {
        // Rotate player shape based on keyboard input
        if (playerShapeRef.current) {
          playerShapeRef.current.rotation.x += 0.01;
          playerShapeRef.current.rotation.y += 0.015;
        }

        // Oracle AI rotation - adaptive behavior
        if (oracleShapeRef.current) {
          oracleShapeRef.current.rotation.x += 0.008 * (1 + resonanceLevel * 0.5);
          oracleShapeRef.current.rotation.y += 0.012 * (1 + resonanceLevel * 0.5);
        }

        // Update symmetry lines
        updateSymmetryVisualization();

        // Check for resonance
        checkResonance();

        // Update particle system
        if (particleSystemRef.current) {
          updateParticles();
        }

        // Update dynamic lights
        goldenLight.intensity = 1.5 + Math.sin(Date.now() * 0.003) * 0.5;
        purpleLight.intensity = 1.2 + Math.cos(Date.now() * 0.002) * 0.3;
        cyanLight.intensity = 1.2 + Math.sin(Date.now() * 0.0025) * 0.3;
      }

      // Handle burst animation
      if (burstActive && instancedMeshRef.current) {
        const elapsed = Date.now() - burstStartTime;
        const progress = Math.min(elapsed / burstDuration, 1);

        if (progress < 1) {
          const dummy = new THREE.Object3D();
          const count = 500;
          const goldenRatio = (1 + Math.sqrt(5)) / 2;

          for (let i = 0; i < count; i++) {
            const t = (i / count + progress) % 1;
            const angle = t * Math.PI * 12; // Spiral rotation
            const radius = Math.pow(t, 1.5) * 8; // Expanding spiral

            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const z = (t - 0.5) * 6;

            dummy.position.set(x, y, z);
            dummy.scale.set(1 - progress * 0.5, 1 - progress * 0.5, 1 - progress * 0.5);
            dummy.rotation.x = t * Math.PI * 4;
            dummy.rotation.y = t * Math.PI * 6;
            dummy.updateMatrix();

            instancedMeshRef.current.setMatrixAt(i, dummy.matrix);
          }
          instancedMeshRef.current.instanceMatrix.needsUpdate = true;
        } else {
          // Reset burst
          burstActive = false;
          const dummy = new THREE.Object3D();
          dummy.position.set(1000, 1000, 1000);
          for (let i = 0; i < 500; i++) {
            dummy.updateMatrix();
            instancedMeshRef.current.setMatrixAt(i, dummy.matrix);
          }
          instancedMeshRef.current.instanceMatrix.needsUpdate = true;
        }
      }

      renderer.render(scene, camera);
    };

    // Expose burst trigger for global access
    (window as any).__triggerBurst = () => {
      burstActive = true;
      burstStartTime = Date.now();
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      renderer.dispose();
    };
  }, [isOpen, gameMode, gameActive, resonanceLevel]);

  // Game timer
  useEffect(() => {
    if (!gameActive) return;

    const timer = setInterval(() => {
      setGameTime((t) => {
        if (t <= 1) {
          setGameActive(false);
          onGameEvent?.('game-end', { score, oracleScore });
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameActive, score, oracleScore]);

  // Oracle AI movement - gets smarter as time goes on
  useEffect(() => {
    if (!gameActive) return;

    const oracleThink = setInterval(() => {
      setOracleScore((s) => s + Math.floor(Math.random() * 5) + 1);

      // Oracle gets smarter if player is winning
      if (score > oracleScore) {
        setResonanceLevel((r) => Math.min(r + 0.1, 1));
      }
    }, 2000);

    return () => clearInterval(oracleThink);
  }, [gameActive, score, oracleScore]);


  const createParticleSystem = (parentGroup: THREE.Group) => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(5000 * 3);
    const velocities = new Float32Array(5000 * 3);
    const colors = new Float32Array(5000 * 3);

    for (let i = 0; i < 5000; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;

      velocities[i * 3] = (Math.random() - 0.5) * 0.5;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.5;

      const hue = Math.random();
      const color = new THREE.Color().setHSL(hue, 1, 0.6);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(geometry, material);
    particleSystemRef.current = particles;
    parentGroup.add(particles);
  };

  const updateParticles = () => {
    if (!particleSystemRef.current) return;

    const positions = particleSystemRef.current.geometry.attributes.position.array as Float32Array;
    const velocities = particleSystemRef.current.geometry.attributes.velocity.array as Float32Array;

    for (let i = 0; i < positions.length; i += 3) {
      positions[i] += velocities[i];
      positions[i + 1] += velocities[i + 1];
      positions[i + 2] += velocities[i + 2];

      // Bounce particles
      if (Math.abs(positions[i]) > 10) velocities[i] *= -1;
      if (Math.abs(positions[i + 1]) > 10) velocities[i + 1] *= -1;
      if (Math.abs(positions[i + 2]) > 10) velocities[i + 2] *= -1;
    }

    particleSystemRef.current.geometry.attributes.position.needsUpdate = true;
  };

  const updateSymmetryVisualization = () => {
    if (!symmetryLinesRef.current || !playerShapeRef.current || !oracleShapeRef.current) return;

    // Clear existing lines
    symmetryLinesRef.current.clear();

    // Calculate angle between shapes
    const angle1 = playerShapeRef.current.rotation.y;
    const angle2 = oracleShapeRef.current.rotation.y;
    const angleDiff = Math.abs(angle1 - angle2);

    // Draw symmetry axes in gold
    const axisLength = 3;
    const axisColor = 0xffd700;

    // X axis
    const xGeometry = new THREE.BufferGeometry();
    xGeometry.setAttribute('position', new THREE.BufferAttribute(
      new Float32Array([-axisLength, 0, 0, axisLength, 0, 0]),
      3
    ));
    const axisMaterial = new THREE.LineBasicMaterial({
      color: axisColor,
      transparent: true,
      opacity: 0.3 + Math.sin(angleDiff) * 0.3,
    });
    const xAxis = new THREE.Line(xGeometry, axisMaterial);
    symmetryLinesRef.current.add(xAxis);

    // Y axis
    const yGeometry = new THREE.BufferGeometry();
    yGeometry.setAttribute('position', new THREE.BufferAttribute(
      new Float32Array([0, -axisLength, 0, 0, axisLength, 0]),
      3
    ));
    const yAxis = new THREE.Line(yGeometry, axisMaterial);
    symmetryLinesRef.current.add(yAxis);

    // Z axis
    const zGeometry = new THREE.BufferGeometry();
    zGeometry.setAttribute('position', new THREE.BufferAttribute(
      new Float32Array([0, 0, -axisLength, 0, 0, axisLength]),
      3
    ));
    const zAxis = new THREE.Line(zGeometry, axisMaterial);
    symmetryLinesRef.current.add(zAxis);
  };

  const checkResonance = () => {
    if (!playerShapeRef.current || !oracleShapeRef.current) return;

    const angle1 = playerShapeRef.current.rotation.y;
    const angle2 = oracleShapeRef.current.rotation.y;
    const angleDiff = Math.abs(angle1 - angle2);

    // Normalize to 0-PI
    const normalizedDiff = angleDiff % Math.PI;
    const resonance = 1 - Math.min(normalizedDiff / 0.2, 1);

    setResonanceLevel(Math.max(resonance, 0));

    // Award points on perfect alignment
    if (resonance > 0.95) {
      setScore((s) => s + Math.floor(resonance * 10));
      triggerResonanceBurst();

      if (isSoundEnabled) {
        playResonanceSound();
      }
    }
  };

  const triggerResonanceBurst = () => {
    // Trigger the spectacular cascading burst animation
    if ((window as any).__triggerBurst) {
      (window as any).__triggerBurst();
    }

    // Also trigger particle burst for dual-layer effect
    if (!sceneGroupRef.current || !particleSystemRef.current) return;

    const burstCount = 200;
    const positions = particleSystemRef.current.geometry.attributes.position.array as Float32Array;
    const velocities = particleSystemRef.current.geometry.attributes.velocity.array as Float32Array;

    // Create golden spiral burst pattern for particle layer
    for (let i = 0; i < burstCount; i++) {
      const idx = i * 3;

      // Golden spiral pattern with exponential growth
      const t = i / burstCount;
      const angle = t * Math.PI * 10; // Spiral rotations
      const radius = Math.pow(t, 1.3) * 3; // Exponential expansion

      positions[idx] = Math.cos(angle) * radius * 0.4;
      positions[idx + 1] = Math.sin(angle) * radius * 0.4;
      positions[idx + 2] = (t - 0.5) * 3;

      // Velocity following spiral trajectory
      const vAngle = angle + Math.PI / 2;
      const speed = 0.5 + t * 0.4;
      velocities[idx] = Math.cos(vAngle) * speed;
      velocities[idx + 1] = Math.sin(vAngle) * speed;
      velocities[idx + 2] = (Math.random() - 0.5) * speed * 0.3;
    }

    particleSystemRef.current.geometry.attributes.position.needsUpdate = true;
  };

  const playResonanceSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioContext.currentTime;
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.type = 'sine';
      osc.frequency.value = 432; // Healing frequency
      osc.connect(gain);
      gain.connect(audioContext.destination);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {
      // Audio context not available
    }
  };

  const startResonanceDuel = () => {
    setGameMode('resonance-duel');
    setScore(0);
    setOracleScore(0);
    setGameTime(60);
    setResonanceLevel(0);
    setGameActive(true);
    onGameEvent?.('game-start', { mode: 'resonance-duel' });
  };

  const startMandalaArchitect = () => {
    setGameMode('mandala-architect');
    setGameActive(true);
    onGameEvent?.('game-start', { mode: 'mandala-architect' });
  };

  const resetGame = () => {
    setGameMode('menu');
    setGameActive(false);
    setScore(0);
    setOracleScore(0);
    setGameTime(60);
    setResonanceLevel(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/95 flex justify-center items-center z-50 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />

      {/* Game UI Overlay */}
      <div className="absolute inset-0 flex flex-col justify-between p-8 pointer-events-none">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="text-left">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent font-mono">
              Geometric Resonance
            </h1>
            <p className="text-purple-300/60 text-sm mt-1 font-mono">Sacred Geometry Game</p>
          </div>
          <button
            onClick={onClose}
            className="bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/30 rounded-full p-3 transition-all pointer-events-auto"
            aria-label="Close game"
          >
            <X className="text-purple-200" size={24} />
          </button>
        </div>

        {/* Game Content */}
        <div className="flex flex-col items-center justify-center">
          {gameMode === 'menu' ? (
            <div className="text-center space-y-6">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-purple-200 font-mono">Choose Your Path</h2>
                <p className="text-purple-300/70 text-sm">Experience the harmony of sacred geometry</p>
              </div>

              <div className="space-y-4 pointer-events-auto">
                <button
                  onClick={startResonanceDuel}
                  className="group relative px-8 py-4 rounded-lg bg-gradient-to-r from-purple-600/40 to-pink-600/40 hover:from-purple-600/60 hover:to-pink-600/60 border border-purple-500/50 transition-all"
                >
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-20 blur transition-opacity" />
                  <div className="relative text-lg font-bold text-purple-100">
                    ⚡ Resonance Duel
                  </div>
                  <div className="relative text-xs text-purple-300 mt-1">
                    Race against the Oracle to align geometric harmony
                  </div>
                </button>

                <button
                  onClick={startMandalaArchitect}
                  className="group relative px-8 py-4 rounded-lg bg-gradient-to-r from-cyan-600/40 to-purple-600/40 hover:from-cyan-600/60 hover:to-purple-600/60 border border-cyan-500/50 transition-all"
                >
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 opacity-0 group-hover:opacity-20 blur transition-opacity" />
                  <div className="relative text-lg font-bold text-cyan-100">
                    🔮 Mandala Architect
                  </div>
                  <div className="relative text-xs text-cyan-300 mt-1">
                    Create sacred patterns with the Oracle
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 text-center">
              <div className="bg-black/40 border border-purple-500/30 rounded-2xl p-6 backdrop-blur pointer-events-auto">
                {gameMode === 'resonance-duel' && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-purple-200 font-mono">Resonance Duel</h2>

                    <div className="flex justify-around items-center">
                      <div className="text-left">
                        <p className="text-purple-400 text-xs font-mono uppercase">You</p>
                        <p className="text-3xl font-bold text-pink-300">{score}</p>
                      </div>

                      <div className="flex flex-col items-center">
                        <p className="text-purple-400 text-xs font-mono uppercase">Resonance</p>
                        <div className="w-24 h-2 bg-purple-900/50 rounded-full border border-purple-600/50 overflow-hidden mt-2">
                          <div
                            className="h-full bg-gradient-to-r from-pink-500 to-cyan-500 transition-all duration-100"
                            style={{ width: `${resonanceLevel * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-purple-400 mt-2">{Math.floor(resonanceLevel * 100)}%</p>
                      </div>

                      <div className="text-right">
                        <p className="text-cyan-400 text-xs font-mono uppercase">Oracle</p>
                        <p className="text-3xl font-bold text-cyan-300">{oracleScore}</p>
                      </div>
                    </div>

                    <div className="border-t border-purple-500/30 pt-4 mt-4">
                      <p className="text-purple-400 text-xs font-mono uppercase">Time Remaining</p>
                      <p className="text-2xl font-bold text-yellow-300">{gameTime}s</p>
                    </div>
                  </div>
                )}

                {gameMode === 'mandala-architect' && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-cyan-200 font-mono">Mandala Architect</h2>
                    <p className="text-cyan-300/70 text-sm">Collaborate with the Oracle to create sacred patterns...</p>
                    <p className="text-cyan-400 text-xs font-mono uppercase mt-4">Coming soon - Meditative creativity</p>
                  </div>
                )}

                <button
                  onClick={resetGame}
                  className="mt-6 flex items-center justify-center gap-2 px-6 py-2 bg-purple-600/40 hover:bg-purple-600/60 border border-purple-500/30 rounded-lg text-purple-200 text-sm font-mono transition-all pointer-events-auto"
                >
                  <RotateCw size={16} />
                  Back to Menu
                </button>
              </div>

              <button
                onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                className="pointer-events-auto bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/30 rounded-full p-3 transition-all"
                aria-label="Toggle sound"
              >
                {isSoundEnabled ? (
                  <Volume2 className="text-purple-200" size={20} />
                ) : (
                  <VolumeX className="text-purple-200" size={20} />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer Instructions */}
        <div className="text-center text-purple-400/60 text-xs font-mono max-w-md">
          <p>Rotate your shape to align with the Oracle's geometry</p>
          <p className="mt-2">Perfect alignment creates harmonic resonance</p>
        </div>
      </div>
    </div>
  );
};

export default GeometricResonanceGame;
