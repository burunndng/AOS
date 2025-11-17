import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { INSIGHT_OUROBOROS_STAGES, getOuroborosStageByNumber } from '../services/insightOuroborosService';
import { Zap } from 'lucide-react';

interface InsightOuroborosVisualizerProps {
  selectedStage?: number | null;
  onSelectStage?: (stage: number) => void;
}

// Color palette for each stage (16 unique vibrant colors representing the journey)
// Pre-Vipassana: Brilliant purples → Vipassana: Warm golds/coppers → Dark Night: Deep reds/oranges → High Equanimity: Bright teals/cyans/golds
const STAGE_COLORS: Record<number, number> = {
  1: 0xb8a8ff,   // Vibrant lavender - Mind and Body
  2: 0xa688ff,   // Bright purple - Discerning Cause
  3: 0x9068ff,   // Rich purple - Three Characteristics
  4: 0x7848ff,   // Deep violet - Arising and Passing
  5: 0xff9f43,   // Vibrant amber - Dissolution
  6: 0xffc266,   // Golden orange - Fear
  7: 0xff6b6b,   // Bright red - Misery
  8: 0xff5252,   // Vivid red - Disgust
  9: 0xff4757,   // Intense coral - Desire for Deliverance
  10: 0xe74c3c,  // Deep coral-red - Re-observation
  11: 0x00d4ff,  // Vibrant cyan - Equanimity (FIXED - NOW BRIGHT)
  12: 0x00e5ff,  // Bright aqua - Conformity
  13: 0x1dd1a1,  // Vivid turquoise - Change of Lineage
  14: 0x48dbfb,  // Bright cyan - Path
  15: 0x74b9ff,  // Sky blue - Fruition
  16: 0xffd93d,  // Bright gold - Reviewing Consciousness
};

// Phase colors for legend
const PHASE_COLORS: Record<string, number> = {
  'Pre-Vipassana': 0x9d8fc7,           // Muted purple
  'Vipassana Begins': 0xe0b8a0,        // Soft copper
  'Dark Night': 0xa8a8c8,              // Muted blue-gray
  'High Equanimity': 0xa0d4d0,         // Soft teal
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
  const particleDataRef = useRef<{ t: number; speed: number }[]>([]);
  const isOrbitingStageRef = useRef(false);
  const orbitingStageRef = useRef<number | null>(null);

  // Helper function to create simple rope forming concentric circles
  function createOuroborosPath(): THREE.CatmullRomCurve3 {
    const points: THREE.Vector3[] = [];
    const numCircles = 2.5; // 2.5 complete circles
    const pointsPerCircle = 100;
    const totalPoints = Math.floor(numCircles * pointsPerCircle);
    const radius = 10;

    for (let i = 0; i <= totalPoints; i++) {
      const t = i / totalPoints; // 0 to 1

      // Height increases as we complete circles
      const y = t * 12;

      // Full rotation for each complete circle
      const angle = t * numCircles * Math.PI * 2;

      // Simple circle at constant radius
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      points.push(new THREE.Vector3(x, y, z));
    }

    return new THREE.CatmullRomCurve3(points);
  }

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e27);
    scene.fog = new THREE.Fog(0x0a0e27, 100, 200);
    sceneRef.current = scene;

    // Camera setup - positioned for interactive exploration with better spiral view
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(25, 5, 25);  // Higher horizontal positioning to see spiral better
    camera.lookAt(0, 2, 0);  // Look at center with slight upward bias
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
    controls.maxDistance = 100;
    controls.autoRotate = false; // User controls rotation
    controlsRef.current = controls;

    // Modest lighting for clean appearance
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.5);
    keyLight.position.set(30, 30, 30);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.far = 200;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x8ab8e1, 0.2);
    fillLight.position.set(-20, 20, -30);
    scene.add(fillLight);

    // Create ouroboros group
    const ouroborosGroup = new THREE.Group();
    scene.add(ouroborosGroup);
    ouroborosGroupRef.current = ouroborosGroup;

    // Create ouroboros path curve (used for both tube geometry and particles)
    const ouroborosPath = createOuroborosPath();

    // Create ouroboros using TubeGeometry following the serpent's path
    const tubeGeometry = new THREE.TubeGeometry(
      ouroborosPath,
      250,  // smooth segments
      0.6,  // modest rope radius
      16,   // good circumference segments
      true  // closed
    );
    const tubeMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a6b6b,        // Dark teal-green rope color
      emissive: 0x1a3a3a,     // Subtle glow only
      metalness: 0.5,         // Slightly reflective
      roughness: 0.4,         // More textured rope appearance
      envMapIntensity: 0.8,   // Minimal environmental reflection
    });
    const tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
    tubeMesh.castShadow = true;
    tubeMesh.receiveShadow = true;
    ouroborosGroup.add(tubeMesh);
    tubeMeshRef.current = tubeMesh;

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

      // Subtle aura glow
      const auraGeometry = new THREE.IcosahedronGeometry(0.85, 3);
      const auraMaterial = new THREE.MeshBasicMaterial({
        color: stageColor,
        transparent: true,
        opacity: 0.15,
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
    const particleData: { t: number; speed: number }[] = [];

    for (let i = 0; i < particleCount; i++) {
      const t = Math.random();
      const pos = ouroborosPath.getPointAt(t);

      // Phase-aware speed: Dark Night (t: 0.25-0.625) flows faster/turbulent, High Equanimity (t: 0.625-1.0) flows slower/smooth
      const stageIndex = t * INSIGHT_OUROBOROS_STAGES.length;
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

      // Store particle data for animation
      particleData.push({ t, speed });
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x6b9aa8,  // Subtle teal to match rope
      size: 0.08,
      transparent: true,
      opacity: 0.2,  // Very subtle
      sizeAttenuation: true,
      blending: THREE.NormalBlending,
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
        const particleData = particleDataRef.current;
        const ouroborosPath = createOuroborosPath();

        for (let i = 0; i < particleData.length; i++) {
          // Move particle along curve based on its phase-aware speed
          particleData[i].t = (particleData[i].t + particleData[i].speed) % 1.0;
          const pos = ouroborosPath.getPointAt(particleData[i].t);

          positions[i * 3] = pos.x;
          positions[i * 3 + 1] = pos.y;
          positions[i * 3 + 2] = pos.z;
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
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
      particleGeometry.dispose();
      particleMaterial.dispose();
    };
  }, [selectedStage]);

  return (
    <div className="w-full space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <h3 className="text-3xl font-bold text-slate-100">The Insight Ouroboros</h3>
        <p className="text-sm text-slate-400">The 16 stages of insight meditation in a sacred cycle. Click on any stage to explore.</p>
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
