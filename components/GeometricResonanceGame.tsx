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
  uniform float uCrystalline;
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
    // Enhanced time-based animation with multiple layers
    vec3 pos = vPosition * 0.1;

    // Layer 1: Slow primary noise
    float n1 = noise(pos + uTime * 0.05);

    // Layer 2: Medium speed secondary noise
    float n2 = noise(pos * 2.0 + uTime * 0.08);

    // Layer 3: Swirling vortex
    float dist = length(vPosition);
    float swirl = sin(atan(vPosition.y, vPosition.x) * 3.0 - uTime * 0.3) * 0.5 + 0.5;
    float vortex = sin(dist * 0.5 - uTime * 0.2) * 0.5 + 0.5;

    // Combine noise layers
    float intensity = mix(mix(n1, n2, 0.4), mix(swirl, vortex, 0.3), 0.5);

    // Resonance-reactive color gradient
    vec3 color1 = vec3(0.6, 0.2, 1.0); // Purple
    vec3 color2 = vec3(0.0, 0.8, 1.0); // Cyan
    vec3 color3 = vec3(0.2, 0.4, 0.8); // Deep blue (resonance peak)

    // Crystalline cavern effect - adds geometric patterns when unlocked
    if (uCrystalline > 0.5) {
      vec3 crystalPos = vPosition * 0.05;
      float crystal = abs(sin(crystalPos.x * 5.0) * sin(crystalPos.y * 5.0) * sin(crystalPos.z * 5.0));
      intensity = mix(intensity, crystal, uCrystalline * 0.3);

      // Add crystalline color tint
      color2 = mix(color2, vec3(0.5, 0.9, 1.0), uCrystalline * 0.4);
    }

    // Blend colors based on resonance level
    vec3 baseColor = mix(color1, color2, intensity);
    vec3 color = mix(baseColor, color3, uResonance * 0.6);

    // Intensity modulation with resonance
    float finalIntensity = intensity * (0.8 + uResonance * 0.4);

    // Resonance causes brightening and color saturation
    color *= (1.0 + uResonance * 0.7);

    gl_FragColor = vec4(color, finalIntensity * 0.7);
  }
`;

interface GeometricResonanceGameProps {
  isOpen: boolean;
  onClose: (data?: { resonanceAchieved?: boolean }) => void;
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
  const trailMeshRef = useRef<THREE.LineSegments | null>(null);
  const gravityWellSphereRef = useRef<THREE.Mesh | null>(null);
  const gravityWellFadeRef = useRef(0);
  const playerRotationVelocityRef = useRef({ x: 0, y: 0 });
  const rotationInputRef = useRef({ x: 0, y: 0 });

  const [gameMode, setGameMode] = useState<GameMode>('menu');
  const [score, setScore] = useState(0);
  const [resonanceLevel, setResonanceLevel] = useState(0);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [gameTime, setGameTime] = useState(60);
  const [gameActive, setGameActive] = useState(false);
  const [oracleScore, setOracleScore] = useState(0);
  const [perfectResonanceAchieved, setPerfectResonanceAchieved] = useState(false);
  const [showResonanceFeedback, setShowResonanceFeedback] = useState(false);
  const resonanceAchievedRef = useRef(false);
  const [hasCrystallineCavern, setHasCrystallineCavern] = useState(false);
  const [showCavernNotification, setShowCavernNotification] = useState(false);
  const cavernNotificationShownRef = useRef(false);
  const cameraStartPosRef = useRef<THREE.Vector3 | null>(null);
  const shakeActiveRef = useRef(false);
  const gravityWellActiveRef = useRef(false);
  const timeScaleRef = useRef(1.0);
  const prevParticlePositionsRef = useRef<Float32Array | null>(null);
  const lastBurstTimeRef = useRef(0);

  // Load crystalline cavern unlock state
  useEffect(() => {
    const unlocked = localStorage.getItem('geometricResonanceCavernUnlocked') === 'true';
    setHasCrystallineCavern(unlocked);
    if (unlocked) {
      cavernNotificationShownRef.current = true; // Already unlocked, don't show notification again
    }
  }, []);

  // Handle crystalline cavern unlock notification
  useEffect(() => {
    if (hasCrystallineCavern && !cavernNotificationShownRef.current) {
      cavernNotificationShownRef.current = true;
      setShowCavernNotification(true);

      const timer = setTimeout(() => {
        setShowCavernNotification(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [hasCrystallineCavern]);

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

    // Create solid with enhanced physical material for sacred glow
    const material = new THREE.MeshPhysicalMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.12,
      wireframe: false,
      side: THREE.DoubleSide,
      roughness: 0.2,
      metalness: 0.7,
      clearcoat: 0.9,
      clearcoatRoughness: 0.15,
      envMapIntensity: 0.5,
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
        uCrystalline: { value: 0 },
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

    // Use enhanced physical material for sacred glow with additive blending for trails
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xffd700,
      emissive: 0xffaa00,
      emissiveIntensity: 0.9,
      roughness: 0.15,
      metalness: 0.85,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
      wireframe: false,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
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
    cameraStartPosRef.current = camera.position.clone();
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
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
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

    // Create particle trails system
    const trailSegmentsCount = 500; // One trail per particle
    const trailPositions = new Float32Array(trailSegmentsCount * 2 * 3);
    const trailGeometry = new THREE.BufferGeometry();
    trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));

    const trailMaterial = new THREE.LineBasicMaterial({
      color: 0xffd700,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      linewidth: 2,
    });

    const trailMesh = new THREE.LineSegments(trailGeometry, trailMaterial);
    sceneGroup.add(trailMesh);
    trailMeshRef.current = trailMesh;

    // Create gravity well visual anchor (glowing sphere at center)
    const gravityWellGeometry = new THREE.SphereGeometry(0.3, 32, 32);
    const gravityWellMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x00d9ff,
      emissive: 0x00d9ff,
      emissiveIntensity: 1.2,
      metalness: 0.9,
      roughness: 0.1,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
      transparent: true,
      opacity: 0,
      wireframe: false,
    });

    const gravityWellSphere = new THREE.Mesh(gravityWellGeometry, gravityWellMaterial);
    gravityWellSphere.position.set(0, 0, 0);
    sceneGroup.add(gravityWellSphere);
    gravityWellSphereRef.current = gravityWellSphere;

    // Add glow light for gravity well
    const gravityWellLight = new THREE.PointLight(0x00d9ff, 0, 20);
    gravityWellLight.position.set(0, 0, 0);
    sceneGroup.add(gravityWellLight);

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

      // Calculate time scale based on resonance level (time dilation effect)
      timeScaleRef.current = resonanceLevel > 0.9
        ? 0.3 + (1 - resonanceLevel) * 7  // Slows to 30% at 98% resonance
        : 1.0;

      elapsedTimeRef.current += 0.016 * timeScaleRef.current;

      // Update shader uniforms
      if (nebulaShaderRef.current) {
        nebulaShaderRef.current.uniforms.uTime.value = elapsedTimeRef.current;
        nebulaShaderRef.current.uniforms.uResonance.value = resonanceLevel;
        // Crystalline cavern effect (fade in over 3 seconds when unlocked)
        const targetCrystalline = hasCrystallineCavern ? 1.0 : 0.0;
        nebulaShaderRef.current.uniforms.uCrystalline.value += (targetCrystalline - nebulaShaderRef.current.uniforms.uCrystalline.value) * 0.02;
      }

      if (gameMode !== 'menu' && gameActive) {
        // Apply rotational inertia to player shape
        if (playerShapeRef.current) {
          // Apply input acceleration to velocity
          const inputSensitivity = 0.0015;
          playerRotationVelocityRef.current.x += rotationInputRef.current.x * inputSensitivity;
          playerRotationVelocityRef.current.y += rotationInputRef.current.y * inputSensitivity;

          // Apply friction to velocity (damping effect)
          const friction = 0.88;
          playerRotationVelocityRef.current.x *= friction;
          playerRotationVelocityRef.current.y *= friction;

          // Clamp velocity to prevent excessive rotation
          const maxVelocity = 0.05;
          playerRotationVelocityRef.current.x = Math.max(-maxVelocity, Math.min(maxVelocity, playerRotationVelocityRef.current.x));
          playerRotationVelocityRef.current.y = Math.max(-maxVelocity, Math.min(maxVelocity, playerRotationVelocityRef.current.y));

          // Apply velocity to rotation (with time dilation)
          playerShapeRef.current.rotation.x += playerRotationVelocityRef.current.x * timeScaleRef.current;
          playerShapeRef.current.rotation.y += playerRotationVelocityRef.current.y * timeScaleRef.current;

          // Update player shape color based on resonance
          updateShapeColors(playerShapeRef.current, resonanceLevel);
        }

        // Oracle AI rotation - adaptive behavior (with time dilation)
        if (oracleShapeRef.current) {
          oracleShapeRef.current.rotation.x += 0.008 * (1 + resonanceLevel * 0.5) * timeScaleRef.current;
          oracleShapeRef.current.rotation.y += 0.012 * (1 + resonanceLevel * 0.5) * timeScaleRef.current;

          // Update oracle shape color based on resonance
          updateShapeColors(oracleShapeRef.current, resonanceLevel);
        }

        // Update symmetry lines
        updateSymmetryVisualization();

        // Check for resonance
        checkResonance();

        // Update particle system
        if (particleSystemRef.current) {
          const positions = particleSystemRef.current.geometry.attributes.position.array as Float32Array;
          const velocities = particleSystemRef.current.geometry.attributes.velocity.array as Float32Array;

          // Store previous positions BEFORE updating particles
          if (!prevParticlePositionsRef.current) {
            prevParticlePositionsRef.current = new Float32Array(positions.length);
            prevParticlePositionsRef.current.set(positions);
          }

          const prevPositions = new Float32Array(prevParticlePositionsRef.current);

          // Update particles
          updateParticles();

          // Apply gravity well effect on perfect resonance (only within 5 seconds of burst for performance)
          const timeSinceBurst = Date.now() - lastBurstTimeRef.current;
          const gravityWellActive = resonanceLevel > 0.98 && timeSinceBurst < 5000;

          if (gravityWellActive) {
            applyGravityWell(positions, velocities, resonanceLevel);
            particleSystemRef.current.geometry.attributes.velocity.needsUpdate = true;
          }

          // Update gravity well visual anchor
          if (gravityWellSphereRef.current) {
            if (gravityWellActive) {
              // Fade in when gravity well is active
              gravityWellFadeRef.current = Math.min(gravityWellFadeRef.current + 0.08, 0.8);
              gravityWellSphereRef.current.material.opacity = gravityWellFadeRef.current;
            } else {
              // Fade out when gravity well is no longer active
              gravityWellFadeRef.current = Math.max(gravityWellFadeRef.current - 0.04, 0);
              gravityWellSphereRef.current.material.opacity = gravityWellFadeRef.current;
            }

            // Animate the sphere with pulsing rotation when active
            if (gravityWellActive) {
              gravityWellSphereRef.current.rotation.x += 0.03;
              gravityWellSphereRef.current.rotation.y += 0.04;
              gravityWellSphereRef.current.rotation.z += 0.02;
            }
          }

          // Update particle trails
          if (trailMeshRef.current && prevParticlePositionsRef.current) {
            const trailPositionsArray = trailMeshRef.current.geometry.attributes.position.array as Float32Array;
            const particleCount = 500;

            for (let i = 0; i < particleCount; i++) {
              // Each particle gets 2 vertices for a line segment (prev→current)
              // Vertex 1: Previous position
              trailPositionsArray[i * 6 + 0] = prevPositions[i * 3 + 0];
              trailPositionsArray[i * 6 + 1] = prevPositions[i * 3 + 1];
              trailPositionsArray[i * 6 + 2] = prevPositions[i * 3 + 2];

              // Vertex 2: Current position
              trailPositionsArray[i * 6 + 3] = positions[i * 3 + 0];
              trailPositionsArray[i * 6 + 4] = positions[i * 3 + 1];
              trailPositionsArray[i * 6 + 5] = positions[i * 3 + 2];
            }

            trailMeshRef.current.geometry.attributes.position.needsUpdate = true;
          }

          // Store current positions for next frame
          prevParticlePositionsRef.current.set(positions);
        }

        // Update dynamic lights (with time dilation)
        goldenLight.intensity = 1.5 + Math.sin(Date.now() * 0.003 * timeScaleRef.current) * 0.5;
        purpleLight.intensity = 1.2 + Math.cos(Date.now() * 0.002 * timeScaleRef.current) * 0.3;
        cyanLight.intensity = 1.2 + Math.sin(Date.now() * 0.0025 * timeScaleRef.current) * 0.3;
      }

      // Handle burst animation with golden ratio spirals
      if (burstActive && instancedMeshRef.current) {
        const elapsed = Date.now() - burstStartTime;
        const progress = Math.min(elapsed / burstDuration, 1);

        if (progress < 1) {
          const dummy = new THREE.Object3D();
          const count = 500;

          // Golden ratio constants
          const goldenRatio = (1 + Math.sqrt(5)) / 2;
          const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ≈ 137.5°

          for (let i = 0; i < count; i++) {
            // Use golden ratio for spiral distribution
            const t = i / count;
            const cascadeT = (t + progress) % 1; // Cascading effect

            // Golden spiral angle
            const angle = i * goldenAngle;

            // Exponential radius growth (logarithmic spiral property)
            const radiusGrowth = Math.pow(cascadeT, 1.2);
            const baseRadius = 8;
            const radius = radiusGrowth * baseRadius;

            // Position along golden spiral
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const z = Math.sin(i * 0.05) * 3 * Math.sin(progress * Math.PI);

            dummy.position.set(x, y, z);

            // Scaling: particles fade out as they expand
            const scale = 1 - progress * 0.6;
            dummy.scale.set(scale, scale, scale);

            // Rotation: spinning motion follows spiral
            dummy.rotation.x = angle + progress * Math.PI * 2;
            dummy.rotation.y = i * 0.01 + progress * Math.PI;
            dummy.rotation.z = cascadeT * Math.PI * 4;

            dummy.updateMatrix();
            instancedMeshRef.current.setMatrixAt(i, dummy.matrix);
          }
          instancedMeshRef.current.instanceMatrix.needsUpdate = true;
        } else {
          // Reset burst - move all instances off-screen
          burstActive = false;
          const dummy = new THREE.Object3D();
          dummy.position.set(1000, 1000, 1000);
          dummy.updateMatrix();
          for (let i = 0; i < 500; i++) {
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

  // Keyboard input for player rotation
  useEffect(() => {
    const keys: { [key: string]: boolean } = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key] = true;

      // Update rotation input based on arrow keys
      rotationInputRef.current.x = 0;
      rotationInputRef.current.y = 0;

      if (keys['ArrowUp'] || keys['w'] || keys['W']) {
        rotationInputRef.current.x -= 1; // Rotate up (around X axis)
      }
      if (keys['ArrowDown'] || keys['s'] || keys['S']) {
        rotationInputRef.current.x += 1; // Rotate down
      }
      if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        rotationInputRef.current.y -= 1; // Rotate left (around Y axis)
      }
      if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        rotationInputRef.current.y += 1; // Rotate right
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key] = false;

      // Update rotation input based on remaining pressed keys
      rotationInputRef.current.x = 0;
      rotationInputRef.current.y = 0;

      if (keys['ArrowUp'] || keys['w'] || keys['W']) {
        rotationInputRef.current.x -= 1;
      }
      if (keys['ArrowDown'] || keys['s'] || keys['S']) {
        rotationInputRef.current.x += 1;
      }
      if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        rotationInputRef.current.y -= 1;
      }
      if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        rotationInputRef.current.y += 1;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Camera shake effect on resonance
  const triggerCameraShake = (camera: THREE.PerspectiveCamera, intensity: number = 0.15, duration: number = 400) => {
    if (shakeActiveRef.current) return;
    shakeActiveRef.current = true;

    const startPos = cameraStartPosRef.current || camera.position.clone();
    const startTime = Date.now();

    const shake = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress < 1) {
        const strength = intensity * (1 - progress);
        camera.position.x = startPos.x + (Math.random() - 0.5) * strength;
        camera.position.y = startPos.y + (Math.random() - 0.5) * strength;
        camera.position.z = startPos.z + (Math.random() - 0.5) * strength * 0.5;
        requestAnimationFrame(shake);
      } else {
        camera.position.copy(startPos);
        shakeActiveRef.current = false;
      }
    };
    shake();
  };

  // Apply gravity well to particles
  const applyGravityWell = (positions: Float32Array, velocities: Float32Array, resonance: number) => {
    const center = new THREE.Vector3(0, 0, 0);
    const strength = resonance > 0.98 ? 0.02 : 0;

    if (strength === 0) return;

    for (let i = 0; i < positions.length; i += 3) {
      const pos = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
      const toCenter = center.clone().sub(pos);
      const distance = toCenter.length();

      if (distance > 0.1) {
        const force = strength / (distance * distance + 0.1);
        const gravityForce = toCenter.normalize().multiplyScalar(force);

        // Orbital velocity (perpendicular to direction)
        const tangent = new THREE.Vector3(-toCenter.y, toCenter.x, 0)
          .normalize()
          .multiplyScalar(0.03 * resonance);

        velocities[i] = gravityForce.x + tangent.x;
        velocities[i + 1] = gravityForce.y + tangent.y;
        velocities[i + 2] = gravityForce.z + tangent.z;
      }
    }
  };

  // Update shape colors based on resonance
  const updateShapeColors = (shape: THREE.Group, resonance: number) => {
    // Hue shifts from purple (0.6) toward gold (0.12) as resonance increases
    const hue = 0.6 - resonance * 0.48;
    const saturation = Math.min(1, 0.6 + resonance * 0.4);
    const lightness = 0.5 + resonance * 0.1;

    shape.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshPhysicalMaterial) {
        const color = new THREE.Color().setHSL(hue, saturation, lightness);
        child.material.emissive = color;
        child.material.emissiveIntensity = 0.4 + resonance * 0.6;
      }
    });
  };

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

      // Trigger visual feedback for perfect resonance
      if (!resonanceAchievedRef.current) {
        resonanceAchievedRef.current = true;
        setPerfectResonanceAchieved(true);
        setShowResonanceFeedback(true);

        // Trigger camera shake
        if (cameraRef.current) {
          triggerCameraShake(cameraRef.current as THREE.PerspectiveCamera, 0.15, 400);
        }

        // Unlock crystalline cavern on first achievement
        if (!hasCrystallineCavern) {
          setHasCrystallineCavern(true);
          localStorage.setItem('geometricResonanceCavernUnlocked', 'true');
        }

        // Auto-hide feedback after 2.5 seconds
        setTimeout(() => {
          setShowResonanceFeedback(false);
        }, 2500);
      }

      if (isSoundEnabled) {
        playResonanceSound();
      }
    }
  };

  const triggerResonanceBurst = () => {
    // Track burst time for optimized gravity well
    lastBurstTimeRef.current = Date.now();

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

      // Primary oscillator - 432Hz healing frequency
      const osc1 = audioContext.createOscillator();
      const osc2 = audioContext.createOscillator();
      const gain1 = audioContext.createGain();
      const gain2 = audioContext.createGain();
      const masterGain = audioContext.createGain();

      // Primary tone - modulate frequency with resonance level
      const baseFreq = 432; // Healing frequency
      const freqVariation = resonanceLevel * 50; // Up to 50Hz variation at perfect resonance
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(baseFreq + freqVariation, now);
      osc1.connect(gain1);

      // Secondary harmonic - perfect fifth (1.5x frequency)
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime((baseFreq + freqVariation) * 1.5, now);
      osc2.connect(gain2);

      // Route both to master gain
      gain1.connect(masterGain);
      gain2.connect(masterGain);
      masterGain.connect(audioContext.destination);

      // Volume modulation - louder at perfect resonance
      const peakVolume = 0.15 * (0.5 + resonanceLevel * 0.5);
      gain1.gain.setValueAtTime(peakVolume * 0.7, now);
      gain2.gain.setValueAtTime(peakVolume * 0.3, now);
      masterGain.gain.setValueAtTime(peakVolume, now);

      // Resonance envelope
      const duration = 0.5 + resonanceLevel * 0.2; // Longer burst at perfect resonance
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      // Start oscillators
      osc1.start(now);
      osc2.start(now);

      // Stop oscillators
      osc1.stop(now + duration);
      osc2.stop(now + duration);
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

      {/* Perfect Resonance Visual Feedback */}
      {showResonanceFeedback && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-40">
          {/* Radial gradient flash */}
          <div
            className="absolute inset-0 animate-pulse"
            style={{
              background: 'radial-gradient(circle at center, rgba(255, 215, 0, 0.6) 0%, rgba(255, 215, 0, 0.3) 25%, transparent 70%)',
              animation: 'resonanceFlash 0.8s ease-out',
            }}
          />

          {/* Celebratory text */}
          <div
            className="relative text-center font-bold text-4xl md:text-6xl animate-pulse"
            style={{
              background: 'linear-gradient(135deg, #ffd700, #ffaa00, #ff6b9d)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.6))',
              animation: 'resonanceText 2.5s ease-in-out',
            }}
          >
            ⚡ HARMONIC RESONANCE ACHIEVED ⚡
          </div>

          {/* CSS for animations */}
          <style>{`
            @keyframes resonanceFlash {
              0% {
                opacity: 1;
                transform: scale(0.8);
              }
              100% {
                opacity: 0;
                transform: scale(1.5);
              }
            }

            @keyframes resonanceText {
              0% {
                opacity: 0;
                transform: scale(0.5) translateY(20px);
              }
              30% {
                opacity: 1;
                transform: scale(1) translateY(0);
              }
              70% {
                opacity: 1;
                transform: scale(1) translateY(0);
              }
              100% {
                opacity: 0;
                transform: scale(1.2) translateY(-20px);
              }
            }
          `}</style>
        </div>
      )}

      {/* Crystalline Cavern Unlock Notification */}
      {showCavernNotification && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-40">
          <div
            className="relative text-center font-bold text-3xl md:text-5xl"
            style={{
              background: 'linear-gradient(135deg, #00d9ff, #00ffff, #00d9ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 30px rgba(0, 217, 255, 0.8))',
              animation: 'cavernUnlockPulse 3s ease-in-out forwards',
            }}
          >
            🔮 CRYSTALLINE CAVERN UNLOCKED 🔮
          </div>

          {/* Animated glow background */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at center, rgba(0, 217, 255, 0.4) 0%, rgba(0, 217, 255, 0.2) 30%, transparent 70%)',
              animation: 'cavernGlowFade 3s ease-in-out forwards',
            }}
          />

          <style>{`
            @keyframes cavernUnlockPulse {
              0% {
                opacity: 0;
                transform: scale(0.5) translateY(20px);
              }
              20% {
                opacity: 1;
                transform: scale(1) translateY(0);
              }
              80% {
                opacity: 1;
                transform: scale(1) translateY(0);
              }
              100% {
                opacity: 0;
                transform: scale(1.1) translateY(-20px);
              }
            }

            @keyframes cavernGlowFade {
              0% {
                opacity: 0;
              }
              20% {
                opacity: 1;
              }
              80% {
                opacity: 1;
              }
              100% {
                opacity: 0;
              }
            }
          `}</style>
        </div>
      )}

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
            onClick={() => onClose({ resonanceAchieved: perfectResonanceAchieved })}
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
