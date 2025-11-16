import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface InsightOuroborosVisualizerProps {
  selectedStage: number | null;
  onSelectStage: (stage: number) => void;
}

// Color code by phase - elegant desaturated colors
const PHASE_COLORS: Record<string, number> = {
  'Pre-Vipassana': 0x9d8fc7,           // Muted purple
  'Vipassana Begins': 0xe0b8a0,        // Soft copper
  'Dark Night': 0xa8a8c8,              // Muted blue-gray
  'High Equanimity': 0xa0d4d0,         // Soft teal
};

const INSIGHT_STAGES = [
  { number: 1, name: 'Mind and Body', phase: 'Pre-Vipassana' },
  { number: 2, name: 'Cause and Effect', phase: 'Pre-Vipassana' },
  { number: 3, name: 'Three Characteristics', phase: 'Pre-Vipassana' },
  { number: 4, name: 'Arising and Passing Away', phase: 'Vipassana Begins' },
  { number: 5, name: 'Dissolution', phase: 'Dark Night' },
  { number: 6, name: 'Fear', phase: 'Dark Night' },
  { number: 7, name: 'Misery', phase: 'Dark Night' },
  { number: 8, name: 'Disgust', phase: 'Dark Night' },
  { number: 9, name: 'Desire for Deliverance', phase: 'Dark Night' },
  { number: 10, name: 'Re-observation', phase: 'Dark Night' },
  { number: 11, name: 'Equanimity', phase: 'High Equanimity' },
  { number: 12, name: 'Conformity', phase: 'High Equanimity' },
  { number: 13, name: 'Change of Lineage', phase: 'High Equanimity' },
  { number: 14, name: 'Path', phase: 'High Equanimity' },
  { number: 15, name: 'Fruition', phase: 'High Equanimity' },
  { number: 16, name: 'Review', phase: 'High Equanimity' },
];

interface StagePoint {
  number: number;
  name: string;
  phase: string;
  position: THREE.Vector3;
  mesh: THREE.Mesh;
}

export default function InsightOuroborosVisualizer({ selectedStage, onSelectStage }: InsightOuroborosVisualizerProps) {
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

  // Helper function to create ouroboros path curve (torus-like path with narrative arc)
  function createOuroborosPath(): THREE.CatmullRomCurve3 {
    const points: THREE.Vector3[] = [];
    const numPoints = 200;
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const angle = t * Math.PI * 2;
      const radius = 10;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      // Narrative arc: descent into Dark Night (stages 5-10), ascent to High Equanimity (stages 11-16)
      // Stage indices: 0-3 (Pre-Vipassana), 4-9 (Dark Night), 10-15 (High Equanimity)
      const stageIndex = t * INSIGHT_STAGES.length;
      let y = 0;
      if (stageIndex >= 4 && stageIndex < 10) {
        // Dark Night descent: smooth valley
        const darkNightProgress = (stageIndex - 4) / 6;
        y = -Math.sin(darkNightProgress * Math.PI) * 2.5;
      } else if (stageIndex >= 10 && stageIndex < 16) {
        // High Equanimity ascent: smooth peak
        const equanimityProgress = (stageIndex - 10) / 6;
        y = Math.sin(equanimityProgress * Math.PI) * 2.5;
      }

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

    // Camera setup - positioned for interactive exploration
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(20, 8, 20);
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

    // Create ouroboros using TubeGeometry following the narrative arc path
    const tubeGeometry = new THREE.TubeGeometry(
      ouroborosPath,
      200,  // segments along path
      0.5,  // tube radius
      16,   // segments around circumference
      true  // closed
    );
    const tubeMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b8b9f,
      emissive: 0x3a3a4a,
      metalness: 0.8,
      roughness: 0.25,
      envMapIntensity: 1.2,
    });
    const tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
    tubeMesh.castShadow = true;
    tubeMesh.receiveShadow = true;
    ouroborosGroup.add(tubeMesh);
    tubeMeshRef.current = tubeMesh;

    // Create stage nodes around the circle with narrative arc
    INSIGHT_STAGES.forEach((stage, index) => {
      const angle = (index / INSIGHT_STAGES.length) * Math.PI * 2;
      const radius = 10;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      // Apply narrative arc: descent into Dark Night, ascent to High Equanimity
      let y = 0;
      if (index >= 4 && index < 10) {
        // Dark Night (stages 5-10): descent into valley
        const darkNightProgress = (index - 4) / 6;
        y = -Math.sin(darkNightProgress * Math.PI) * 2.5;
      } else if (index >= 10 && index < 16) {
        // High Equanimity (stages 11-16): ascent to peak
        const equanimityProgress = (index - 10) / 6;
        y = Math.sin(equanimityProgress * Math.PI) * 2.5;
      }

      const position = new THREE.Vector3(x, y, z);

      // Stage sphere
      const geometry = new THREE.IcosahedronGeometry(0.6, 5);
      const material = new THREE.MeshStandardMaterial({
        color: PHASE_COLORS[stage.phase],
        emissive: PHASE_COLORS[stage.phase],
        emissiveIntensity: 0.3,
        metalness: 0.9,
        roughness: 0.15,
        envMapIntensity: 1.5,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      ouroborosGroup.add(mesh);

      // Subtle aura
      const auraGeometry = new THREE.IcosahedronGeometry(0.9, 4);
      const auraMaterial = new THREE.MeshBasicMaterial({
        color: PHASE_COLORS[stage.phase],
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
        ctx.fillText(stage.number.toString(), 32, 32);
      }
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.copy(position);
      sprite.position.y = 0.3;
      sprite.scale.set(1.5, 1.5, 1);
      ouroborosGroup.add(sprite);

      stagePointsRef.current.push({
        number: stage.number,
        name: stage.name,
        phase: stage.phase,
        position: position.clone(),
        mesh,
      });
    });

    // Create particle system for dynamic flow along ouroboros
    const particleCount = 800;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const t = Math.random();
      const pos = ouroborosPath.getPointAt(t);
      const tangent = ouroborosPath.getTangentAt(t).normalize();
      const speed = 0.04 + Math.random() * 0.04;

      // Position particles near the path with slight randomness
      particlePositions[i * 3] = pos.x + (Math.random() - 0.5) * 1.5;
      particlePositions[i * 3 + 1] = pos.y + (Math.random() - 0.5) * 1.5;
      particlePositions[i * 3 + 2] = pos.z + (Math.random() - 0.5) * 1.5;

      // Velocity aligned with ouroboros path tangent
      particleVelocities[i * 3] = tangent.x * speed;
      particleVelocities[i * 3 + 1] = tangent.y * speed;
      particleVelocities[i * 3 + 2] = tangent.z * speed;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xa8c8e1,
      size: 0.08,
      transparent: true,
      opacity: 0.35,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    ouroborosGroup.add(particles);
    particlesRef.current = particles;

    // Store velocities for animation
    (particles as any).userData.velocities = particleVelocities;

    // Mouse click handler - triggers camera focus transition
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
          onSelectStage(selectedPoint.number);

          // Calculate focus target: positioned to view the stage from a good angle
          const targetPos = selectedPoint.position.clone();
          targetPos.y += 2.5;
          targetPos.z += 4;
          cameraFocusTargetRef.current.copy(targetPos);
          isCameraFocusingRef.current = true;
        }
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

      // Smooth focus transition when clicking a stage (overrides user input momentarily)
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

        // Resume user control when close enough
        if (currentPos.distanceTo(targetPos) < 0.2) {
          isCameraFocusingRef.current = false;
        }
      }

      // --- PARTICLE SYSTEM: Dynamic flow along ouroboros ---
      if (particlesRef.current) {
        const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
        const velocities = (particlesRef.current.userData as any).velocities as Float32Array;

        const ouroborosPath = createOuroborosPath();

        for (let i = 0; i < particleCount; i++) {
          // Update position based on velocity
          positions[i * 3] += velocities[i * 3] * 0.5;
          positions[i * 3 + 1] += velocities[i * 3 + 1] * 0.5;
          positions[i * 3 + 2] += velocities[i * 3 + 2] * 0.5;

          // Smooth wrap-around: find closest point on path and reset if too far
          let closestT = 0;
          let minDist = Infinity;

          // Sample 20 points along the path to find closest
          for (let j = 0; j < 20; j++) {
            const sampleT = j / 20;
            const samplePos = ouroborosPath.getPointAt(sampleT);
            const dx = positions[i * 3] - samplePos.x;
            const dy = positions[i * 3 + 1] - samplePos.y;
            const dz = positions[i * 3 + 2] - samplePos.z;
            const dist = dx * dx + dy * dy + dz * dz;
            if (dist < minDist) {
              minDist = dist;
              closestT = sampleT;
            }
          }

          // If particle drifts too far (>8 units), reset it to path
          if (Math.sqrt(minDist) > 8) {
            const resetT = (closestT + 0.05) % 1.0;
            const resetPos = ouroborosPath.getPointAt(resetT);
            const resetTangent = ouroborosPath.getTangentAt(resetT).normalize();
            const resetSpeed = 0.04 + Math.random() * 0.04;

            positions[i * 3] = resetPos.x + (Math.random() - 0.5) * 1.5;
            positions[i * 3 + 1] = resetPos.y + (Math.random() - 0.5) * 1.5;
            positions[i * 3 + 2] = resetPos.z + (Math.random() - 0.5) * 1.5;

            velocities[i * 3] = resetTangent.x * resetSpeed;
            velocities[i * 3 + 1] = resetTangent.y * resetSpeed;
            velocities[i * 3 + 2] = resetTangent.z * resetSpeed;
          }
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
  }, [selectedStage, onSelectStage]);

  return (
    <div className="w-full space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <h3 className="text-3xl font-bold text-slate-100">The Insight Ouroboros</h3>
        <p className="text-sm text-slate-400">The 16 stages of insight meditation in a sacred cycle. Click on any stage to explore.</p>
      </div>

      {/* 3D Canvas Container */}
      <div ref={containerRef} className="w-full h-96 rounded-lg overflow-hidden border border-slate-700 bg-slate-950" />

      {/* Selected Stage Details Panel */}
      {selectedStage && (() => {
        const stage = INSIGHT_STAGES.find((s) => s.number === selectedStage);
        return stage ? (
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-2 border-slate-700 rounded-2xl p-8 animate-fade-in">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div
                    className="inline-block w-4 h-4 rounded-full mb-3"
                    style={{ backgroundColor: `#${PHASE_COLORS[stage.phase].toString(16).padStart(6, '0')}` }}
                  />
                  <h4 className="text-2xl font-bold text-slate-100">Stage {stage.number}: {stage.name}</h4>
                  <p className="text-sm text-slate-400 mt-1">{stage.phase}</p>
                </div>
              </div>

              <p className="text-slate-300 leading-relaxed">
                Click on other stages around the ouroboros to explore the journey of insight meditation. Each stage represents a distinct phase in the practitioner's unfolding awareness.
              </p>

              <p className="text-sm text-slate-400 italic border-l-2 border-accent/50 pl-4">
                The ouroboros symbolizes the cyclic nature of practice: stages spiral back, wisdom deepens, and the journey continues eternally.
              </p>
            </div>
          </div>
        ) : null;
      })()}

      {/* Phase Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(PHASE_COLORS).map(([phase, color]) => (
          <div key={phase} className="flex items-center gap-2 text-xs p-2 rounded bg-slate-800/50">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: `#${color.toString(16).padStart(6, '0')}` }}
            />
            <span className="text-slate-300 truncate">{phase}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
