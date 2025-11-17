import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { INSIGHT_OUROBOROS_STAGES, getOuroborosStageByNumber } from '../services/insightOuroborosService';
import { Zap } from 'lucide-react';

interface InsightOuroborosVisualizerProps {
  selectedStage?: number | null;
  onSelectStage?: (stage: number) => void;
}

// Color palette for each stage (16 unique colors representing the journey)
// Refined palette with smoother transitions for visual cohesion
// Pre-Vipassana: Cool grounded blues → Vipassana: Warm earth tones → Dark Night: Deep rich tones → High Equanimity: Ethereal teals/golds
const STAGE_COLORS: Record<number, number> = {
  // Pre-Vipassana: Cool, grounded tones (Stages 1-4)
  1: 0x8c9eb5,   // Desaturated Blue-Gray - Mind and Body
  2: 0x7a8c9e,   // Desaturated Blue - Discerning Cause
  3: 0x6b7a8c,   // Desaturated Blue-Gray - Three Characteristics
  4: 0x5c6b7a,   // Deep Blue-Gray - Arising and Passing

  // Vipassana Begins: Transition to warm, earthy tones (Stages 5-6)
  5: 0xd4a574,   // Soft Copper - Dissolution
  6: 0xe0b8a0,   // Warm Peach/Rose - Fear

  // Dark Night: Deep, rich, earthy tones (Stages 7-10)
  7: 0xa85252,   // Deep Rust - Misery
  8: 0x8b4545,   // Dark Burgundy - Disgust
  9: 0x9a6b6b,   // Muted Mauve-Red - Desire for Deliverance
  10: 0x8f7a7a,  // Earthy Brown-Gray - Re-observation

  // High Equanimity: Bright, sophisticated teals and greens (Stages 11-16)
  11: 0x6b9aa8,  // Muted Teal-Blue - Equanimity
  12: 0x5ca8c8,  // Soft Cyan - Conformity
  13: 0x4db8d4,  // Bright Sky Blue - Change of Lineage
  14: 0x5cd4a5,  // Soft Jade Green - Path
  15: 0x7dd4a5,  // Light Mint Green - Fruition
  16: 0xa8d456,  // Warm Gold-Green - Reviewing Consciousness
};

// Phase colors for legend - refined for visual cohesion
const PHASE_COLORS: Record<string, number> = {
  'Pre-Vipassana': 0x8c9eb5,           // Desaturated Blue-Gray
  'Vipassana Begins': 0xd4a574,        // Soft Copper
  'Dark Night': 0x8f7a7a,              // Earthy Brown-Gray
  'High Equanimity': 0x5cd4a5,         // Soft Jade Green
};

interface StagePoint {
  number: number;
  name: string;
  phase: string;
  position: THREE.Vector3;
  mesh: THREE.Mesh;
}

export default function InsightOuroborosVisualizer({ selectedStage: externalSelectedStage, onSelectStage: externalOnSelectStage }: InsightOuroborosVisualizerProps = {}) {
  const [selectedStage, setSelectedStage] = React.useState<number | null>(externalSelectedStage || null);

  const handleSelectStage = (stage: number) => {
    setSelectedStage(stage);
    externalOnSelectStage?.(stage);
  };
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const stagePointsRef = useRef<StagePoint[]>([]);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const animationIdRef = useRef<number>();
  const ouroborosGroupRef = useRef<THREE.Group | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const tubeMeshRef = useRef<THREE.Mesh | null>(null);
  const isCameraFocusingRef = useRef(false);
  const cameraFocusTargetRef = useRef(new THREE.Vector3());
  const controlsRef = useRef<OrbitControls | null>(null);
  const particleDataRef = useRef<{ t: number; speed: number; phaseColor: number }[]>([]);
  const isOrbitingStageRef = useRef(false);
  const orbitingStageRef = useRef<number | null>(null);
  const headMeshRef = useRef<THREE.Mesh | null>(null);
  const tailMeshRef = useRef<THREE.Mesh | null>(null);

  // Helper function to create serpent biting its tail (ouroboros) - a simple circle
  function createOuroborosPath(): THREE.CatmullRomCurve3 {
    const points: THREE.Vector3[] = [];
    const numPoints = 120;
    const radius = 12;

    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = 0; // Flat circle at y=0

      points.push(new THREE.Vector3(x, y, z));
    }

    return new THREE.CatmullRomCurve3(points, true); // true = closed loop
  }

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e27);
    scene.fog = new THREE.Fog(0x0a0e27, 100, 200);
    sceneRef.current = scene;

    // Camera setup - positioned above the circular ouroboros
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 25, 0); // Directly above the circle
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    // Style the canvas to absolutely fill the container (prevents layout overflow)
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.inset = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Initialize OrbitControls for interactive camera control
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 15;
    controls.maxDistance = 50;
    controls.maxPolarAngle = Math.PI / 2.5; // Limit rotation to keep view from below
    controls.autoRotate = false; // User controls rotation
    controlsRef.current = controls;

    // Elegant lighting
    const ambientLight = new THREE.AmbientLight(0xc9b9e8, 0.5);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xe8d4b8, 0.6);
    keyLight.position.set(30, 40, 30);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.far = 200;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x8ab8e1, 0.3);
    fillLight.position.set(-20, 20, -30);
    scene.add(fillLight);

    // Create ouroboros group
    const ouroborosGroup = new THREE.Group();
    scene.add(ouroborosGroup);
    ouroborosGroupRef.current = ouroborosGroup;

    // Create ouroboros path curve (used for both tube geometry and particles)
    const ouroborosPath = createOuroborosPath();

    // Create ouroboros using TubeGeometry following the serpent's circular path
    const tubeGeometry = new THREE.TubeGeometry(
      ouroborosPath,
      120,  // segments for smooth circle
      0.6,  // tube radius
      16,   // segments around circumference
      true  // closed loop
    );
    const tubeMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d5a5f,        // Rich serpent teal with more depth
      emissive: 0x4a7d85,     // Stronger glow in teal
      emissiveIntensity: 0.25, // More noticeable glow
      metalness: 0.8,         // More metallic for iridescent effect
      roughness: 0.2,         // Smoother, more polished scales
      envMapIntensity: 1.6,
    });
    const tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
    tubeMesh.castShadow = true;
    tubeMesh.receiveShadow = true;
    ouroborosGroup.add(tubeMesh);
    tubeMeshRef.current = tubeMesh;

    // Create Serpent Head - positioned at the end of the path (stage 16)
    const headGeometry = new THREE.ConeGeometry(1.0, 2.0, 16);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a5a5f,
      emissive: 0x2a3a3f,
      emissiveIntensity: 0.3,
      metalness: 0.9,
      roughness: 0.3,
    });
    const headMesh = new THREE.Mesh(headGeometry, headMaterial);
    const headPosition = ouroborosPath.getPointAt(0.99);
    headMesh.position.copy(headPosition);
    // Orient head along path tangent (looking forward along the path)
    const headTangent = ouroborosPath.getTangentAt(0.99);
    headMesh.lookAt(headPosition.clone().add(headTangent));
    headMesh.rotateX(Math.PI / 2); // Rotate to align cone tip with forward direction
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    ouroborosGroup.add(headMesh);
    headMeshRef.current = headMesh;

    // Create Serpent Tail - positioned at the start of the path (near stage 1)
    const tailGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    const tailMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a5a5f,
      emissive: 0x2a3a3f,
      emissiveIntensity: 0.3,
      metalness: 0.9,
      roughness: 0.3,
    });
    const tailMesh = new THREE.Mesh(tailGeometry, tailMaterial);
    tailMesh.position.copy(ouroborosPath.getPointAt(0.01));
    tailMesh.castShadow = true;
    tailMesh.receiveShadow = true;
    ouroborosGroup.add(tailMesh);
    tailMeshRef.current = tailMesh;

    // Create stage nodes positioned along the serpent's body
    INSIGHT_OUROBOROS_STAGES.forEach((stage, index) => {
      // Position nodes along the ouroborosPath at equal intervals
      const t = index / (INSIGHT_OUROBOROS_STAGES.length - 1);
      const position = ouroborosPath.getPointAt(t);

      // Stage sphere - use individual stage color
      const stageColor = STAGE_COLORS[stage.stage] || 0x888888; // Default gray if stage not found
      const geometry = new THREE.IcosahedronGeometry(0.6, 5);
      const material = new THREE.MeshStandardMaterial({
        color: stageColor,
        emissive: stageColor,
        emissiveIntensity: 0.4,
        metalness: 0.85,
        roughness: 0.15,
        envMapIntensity: 1.5,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      ouroborosGroup.add(mesh);

      // Enhanced aura with better visibility
      const auraGeometry = new THREE.IcosahedronGeometry(1.0, 4);
      const auraMaterial = new THREE.MeshBasicMaterial({
        color: stageColor,
        transparent: true,
        opacity: 0.35, // Increased from 0.2 for more visible aura
      });
      const auraMesh = new THREE.Mesh(auraGeometry, auraMaterial);
      auraMesh.position.copy(position);
      ouroborosGroup.add(auraMesh);

      // Stage number label (using billboard technique)
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(stage.stage), 32, 32);
      }
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.copy(position);
      sprite.position.y = 0.3;
      sprite.scale.set(1.5, 1.5, 1);
      ouroborosGroup.add(sprite);

      stagePointsRef.current.push({
        number: stage.stage,
        name: stage.name,
        phase: stage.phase,
        position: position.clone(),
        mesh,
      });
    });

    // Create particle system for dynamic flow along ouroboros with phase-aware behavior
    const particleCount = 800;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const particleData: { t: number; speed: number; phaseColor: number }[] = [];

    for (let i = 0; i < particleCount; i++) {
      const t = Math.random();
      const pos = ouroborosPath.getPointAt(t);

      // Phase-aware speed and color: different phases have different speeds and colors
      const stageIndex = Math.floor(t * INSIGHT_OUROBOROS_STAGES.length);
      const currentStage = INSIGHT_OUROBOROS_STAGES[stageIndex];
      const phaseColor = PHASE_COLORS[currentStage.phase];
      let speed = 0;

      if (stageIndex >= 4 && stageIndex < 10) {
        // Dark Night: faster, turbulent flow (0.008-0.012)
        speed = 0.008 + Math.random() * 0.004;
      } else if (stageIndex >= 10) {
        // High Equanimity: slower, smooth flow (0.003-0.005)
        speed = 0.003 + Math.random() * 0.002;
      } else {
        // Pre-Vipassana: neutral flow (0.005-0.007)
        speed = 0.005 + Math.random() * 0.002;
      }

      // Position particles exactly on the path
      particlePositions[i * 3] = pos.x;
      particlePositions[i * 3 + 1] = pos.y;
      particlePositions[i * 3 + 2] = pos.z;

      // Set particle color based on phase
      const color = new THREE.Color(phaseColor);
      particleColors[i * 3] = color.r;
      particleColors[i * 3 + 1] = color.g;
      particleColors[i * 3 + 2] = color.b;

      // Store particle data for animation
      particleData.push({ t, speed, phaseColor });
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
    const particleMaterial = new THREE.PointsMaterial({
      vertexColors: true,
      size: 0.12,
      transparent: true,
      opacity: 0.5,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending, // Additive blending for glow effect
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    ouroborosGroup.add(particles);
    particlesRef.current = particles;

    // Store particle data for animation
    particleDataRef.current = particleData;

    // Mouse click handler - stage selection or return to overview
    const onMouseClick = (event: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);

      const stageMeshes = stagePointsRef.current.map((p) => p.mesh);
      const intersects = raycasterRef.current.intersectObjects(stageMeshes);

      if (intersects.length > 0) {
        const clickedMesh = intersects[0].object;
        const selectedPoint = stagePointsRef.current.find((p) => p.mesh === clickedMesh);
        if (selectedPoint) {
          // If already focusing this stage, return to overview
          if (isOrbitingStageRef.current && orbitingStageRef.current === selectedPoint.number) {
            isOrbitingStageRef.current = false;
            orbitingStageRef.current = null;
            // Camera will revert to OrbitControls which handles free exploration
          } else {
            // Focus on the selected stage
            handleSelectStage(selectedPoint.number);

            // Calculate focus target: positioned to view the stage from a good angle
            // Position camera outside the circle, slightly above the stage
            const outwardDir = selectedPoint.position.clone().normalize();
            const targetPos = outwardDir.multiplyScalar(18).add(new THREE.Vector3(0, 3, 0));
            cameraFocusTargetRef.current.copy(targetPos);
            isCameraFocusingRef.current = true;
            isOrbitingStageRef.current = false;
            orbitingStageRef.current = selectedPoint.number;
          }
        }
      } else {
        // Click on background: return to overview
        isOrbitingStageRef.current = false;
        orbitingStageRef.current = null;
      }
    };

    renderer.domElement.addEventListener('click', onMouseClick);

    // Animation loop with dynamic particles, camera focus, and torus breathing
    let animationTime = 0;
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      animationTime += 0.002;

      // --- CAMERA LOGIC: OrbitControls with optional focus transition ---
      // Update OrbitControls (handles damping and smooth rotation)
      if (controlsRef.current) {
        controlsRef.current.update();
      }

      // Smooth focus transition and orbit behavior when clicking a stage
      if (isCameraFocusingRef.current) {
        const currentPos = camera.position;
        const targetPos = cameraFocusTargetRef.current;
        const lerpFactor = 0.05;

        currentPos.lerp(targetPos, lerpFactor);

        // Look at the selected stage
        const selectedPoint = stagePointsRef.current.find(p => p.number === selectedStage);
        if (selectedPoint) {
          camera.lookAt(selectedPoint.position);
        }

        // Enter orbit mode when close enough to target
        if (currentPos.distanceTo(targetPos) < 0.2) {
          isCameraFocusingRef.current = false;
          isOrbitingStageRef.current = true;
        }
      } else if (isOrbitingStageRef.current && orbitingStageRef.current !== null) {
        // Gentle slow orbit around the selected stage during focus mode
        const selectedPoint = stagePointsRef.current.find(p => p.number === orbitingStageRef.current);
        if (selectedPoint) {
          const orbitCenter = selectedPoint.position;
          const currentPos = camera.position;
          const toCenter = orbitCenter.clone().sub(currentPos).normalize();
          const right = new THREE.Vector3(0, 1, 0).cross(toCenter).normalize();
          const orbitAxis = new THREE.Vector3(0, 1, 0);

          // Slow orbit around the stage (0.01 radians per frame ≈ 5 degrees per second)
          const orbitSpeed = 0.01;
          const radius = currentPos.distanceTo(orbitCenter);

          // Apply rotation to camera position
          const offset = currentPos.clone().sub(orbitCenter);
          offset.applyAxisAngle(orbitAxis, orbitSpeed);
          camera.position.copy(orbitCenter.clone().add(offset));
          camera.lookAt(orbitCenter);
        }
      }

      // --- PARTICLE SYSTEM: Phase-aware dynamic flow along ouroboros ---
      if (particlesRef.current && particleDataRef.current.length > 0) {
        const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
        const colors = particlesRef.current.geometry.attributes.color.array as Float32Array;
        const particleData = particleDataRef.current;
        const ouroborosPath = createOuroborosPath();

        for (let i = 0; i < particleData.length; i++) {
          // Move particle along curve based on its phase-aware speed
          particleData[i].t = (particleData[i].t + particleData[i].speed) % 1.0;
          const pos = ouroborosPath.getPointAt(particleData[i].t);

          positions[i * 3] = pos.x;
          positions[i * 3 + 1] = pos.y;
          positions[i * 3 + 2] = pos.z;

          // Update particle color based on new position's phase
          const stageIndex = Math.floor(particleData[i].t * INSIGHT_OUROBOROS_STAGES.length);
          const currentStage = INSIGHT_OUROBOROS_STAGES[stageIndex];
          const newPhaseColor = PHASE_COLORS[currentStage.phase];
          particleData[i].phaseColor = newPhaseColor;

          const color = new THREE.Color(newPhaseColor);
          colors[i * 3] = color.r;
          colors[i * 3 + 1] = color.g;
          colors[i * 3 + 2] = color.b;
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
        particlesRef.current.geometry.attributes.color.needsUpdate = true;
      }

      // --- TUBE BREATHING EFFECT ---
      if (tubeMeshRef.current && ouroborosGroupRef.current) {
        // Subtle pulsing
        const breathePulse = 1.0 + Math.sin(animationTime * 1.5) * 0.015;
        tubeMeshRef.current.scale.set(breathePulse, breathePulse, breathePulse);

        // Subtle rotation for dynamic feel
        ouroborosGroupRef.current.rotation.y = Math.sin(animationTime * 0.3) * 0.03;
      }

      // Highlight selected stage
      stagePointsRef.current.forEach((point) => {
        if (point.number === selectedStage) {
          const scale = 1.3 + Math.sin(animationTime * 6) * 0.15;
          point.mesh.scale.set(scale, scale, scale);
          (point.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.6 + Math.sin(animationTime * 4) * 0.2;
        } else {
          point.mesh.scale.set(1, 1, 1);
          (point.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', onMouseClick);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      containerRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
      tubeGeometry.dispose();
      tubeMaterial.dispose();
      headGeometry.dispose();
      headMaterial.dispose();
      tailGeometry.dispose();
      tailMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
    };
  }, [selectedStage]);

  return (
    <div className="w-full space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <h3 className="text-3xl font-bold text-slate-100">The Insight Ouroboros</h3>
        <p className="text-sm text-slate-400">A serpent biting its tail - the 16 stages of insight in one sacred circle. Click any stage to explore.</p>
      </div>

      {/* Two-column layout: Canvas (left) and Info Panel (right) */}
      <div className="flex gap-4 h-72">
        {/* Left Column: 3D Canvas */}
        <div className="w-2/3">
          <div ref={containerRef} className="relative w-full h-full rounded-lg overflow-hidden border border-slate-700 bg-slate-950" />
        </div>

        {/* Right Column: Info Panel - Full Details */}
        <div className="w-1/3">
          {selectedStage ? (
            (() => {
              const stage = getOuroborosStageByNumber(selectedStage);
              return stage ? (
                <div className="h-full bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-2 border-slate-700 rounded-2xl p-4 animate-fade-in overflow-y-auto">
                  <div className="space-y-3">
                    {/* Header */}
                    <div>
                      {(() => {
                        const phaseColor = PHASE_COLORS[stage.phase];
                        const colorHex = phaseColor ? (typeof phaseColor === 'number' ? phaseColor.toString(16).padStart(6, '0') : phaseColor) : '666666';
                        return (
                          <div
                            className="inline-block w-3 h-3 rounded-full mb-2"
                            style={{ backgroundColor: `#${colorHex}` }}
                          />
                        );
                      })()}
                      <h4 className="text-lg font-bold text-slate-100">Stage {stage.stage}</h4>
                      <p className="text-sm font-semibold text-slate-300">{stage.name}</p>
                      <p className="text-xs text-slate-400 mt-1">{stage.phase}</p>
                    </div>

                    {/* Description */}
                    {stage.description && (
                      <div className="pt-2 border-t border-slate-700/50">
                        <p className="text-xs text-slate-300 leading-relaxed">{stage.description}</p>
                      </div>
                    )}

                    {/* Key Markers */}
                    {stage.keyMarkers && stage.keyMarkers.length > 0 && (
                      <div className="pt-2 border-t border-slate-700/50">
                        <div className="flex items-center gap-1 mb-2">
                          <Zap size={12} className="text-amber-400" />
                          <p className="text-xs font-mono text-amber-400">Markers</p>
                        </div>
                        <ul className="space-y-1">
                          {stage.keyMarkers.map((marker, idx) => (
                            <li key={idx} className="text-xs text-slate-400 pl-3 list-disc list-inside">
                              {marker}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Duration */}
                    {stage.duration && (
                      <div className="pt-2 border-t border-slate-700/50">
                        <p className="text-xs text-slate-400">
                          <span className="font-mono text-slate-500">⏱</span> {stage.duration}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : null;
            })()
          ) : (
            <div className="h-full border-2 border-dashed border-slate-700 rounded-2xl p-4 flex items-center justify-center text-slate-500 text-center text-sm">
              <p>Click a stage</p>
            </div>
          )}
        </div>
      </div>

      {/* Phase Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(PHASE_COLORS).map(([phase, color]) => {
          if (color === null || color === undefined) return null;
          const colorHex = typeof color === 'number' ? color.toString(16).padStart(6, '0') : String(color);
          return (
            <div key={phase} className="flex items-center gap-2 text-xs p-2 rounded bg-slate-800/50">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: `#${colorHex}` }}
              />
              <span className="text-slate-300 truncate">{phase}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
