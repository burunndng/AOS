import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { JhanaLevel } from '../types.ts';
import { X } from 'lucide-react';

interface JhanaSpiralVisualizer3DProps {
  selectedJhana: JhanaLevel | null;
  onSelectJhana: (jhana: JhanaLevel) => void;
}

// Elegant metallic colors - desaturated, sophisticated
const JHANA_COLORS: Record<JhanaLevel, number> = {
  'Access Concentration': 0x9d8fc7,    // Muted purple
  'Momentary Concentration': 0xb5a8d9, // Soft lavender
  '1st Jhana': 0xd4a5a5,               // Muted rose
  '2nd Jhana': 0xe0b8a0,               // Soft copper
  '3rd Jhana': 0xe8d4a0,               // Warm gold
  '4th Jhana': 0xa8d4b8,               // Muted jade
  '5th Jhana': 0xa0d4d0,               // Soft teal
  '6th Jhana': 0xa8c8e1,               // Cool silver-blue
  '7th Jhana': 0xb8c8e1,               // Muted periwinkle
  '8th Jhana': 0xb8a8d9,               // Elegant mauve
};

const JHANA_DESCRIPTIONS: Record<JhanaLevel, string> = {
  'Access Concentration': 'The threshold state before jhana. Mind is collected and stable.',
  'Momentary Concentration': 'Brief moments of strong concentration during insight practice.',
  '1st Jhana': 'Sustained absorption with thinking, joy, and happiness. All five factors present.',
  '2nd Jhana': 'Thinking drops away. Stronger unification with piti and sukha. More absorbed.',
  '3rd Jhana': 'Energetic piti fades, leaving pure contentment. Equanimous happiness.',
  '4th Jhana': 'Even sukha fades into pure equanimity. Effortless absorption.',
  '5th Jhana': 'Infinite space. Mind expands beyond form to boundless space itself.',
  '6th Jhana': 'Infinite consciousness. Awareness itself becomes the object and subject.',
  '7th Jhana': 'Nothingness. The subtle sense of being dissolves into vast emptiness.',
  '8th Jhana': 'Neither-perception-nor-non-perception. The subtlest state before cessation.',
};

interface JhanaPoint {
  jhana: JhanaLevel;
  position: THREE.Vector3;
  mesh: THREE.Mesh;
  index: number;
}

export default function JhanaSpiralVisualizer3D({ selectedJhana, onSelectJhana }: JhanaSpiralVisualizer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const jhanaPointsRef = useRef<JhanaPoint[]>([]);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const animationIdRef = useRef<number>();
  const spiralGroupRef = useRef<THREE.Group | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const spiralMeshRef = useRef<THREE.Mesh | null>(null);
  const isCameraFocusingRef = useRef(false);
  const cameraFocusTargetRef = useRef(new THREE.Vector3());
  const controlsRef = useRef<OrbitControls | null>(null);

  const jhanasInOrder: JhanaLevel[] = [
    'Access Concentration',
    'Momentary Concentration',
    '1st Jhana',
    '2nd Jhana',
    '3rd Jhana',
    '4th Jhana',
    '5th Jhana',
    '6th Jhana',
    '7th Jhana',
    '8th Jhana',
  ];

  // Helper function to create a proper spiral curve with balanced geometry
  function createSpiralCurve(): THREE.CatmullRomCurve3 {
    const points: THREE.Vector3[] = [];
    const numPoints = 200;
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const height = t * 20;
      // Reduced radius growth for more balanced visual appearance (3 → 2)
      const radius = 5 + t * 2;
      const angle = t * Math.PI * 8;
      points.push(
        new THREE.Vector3(
          radius * Math.cos(angle),
          height,
          radius * Math.sin(angle)
        )
      );
    }
    return new THREE.CatmullRomCurve3(points);
  }

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup with dark, sophisticated background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e27);
    scene.fog = new THREE.Fog(0x0a0e27, 100, 200);
    sceneRef.current = scene;

    // Camera setup - positioned to view entire spiral
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    // Adjusted camera position: further back (35) and centered on spiral (y = 10)
    camera.position.set(0, 10, 35);
    camera.lookAt(0, 10, 0);
    cameraRef.current = camera;

    // Renderer setup with high quality
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
    controls.autoRotate = false; // User controls rotation instead of passive animation
    controlsRef.current = controls;

    // Elegant multi-source lighting
    // Soft ambient light
    const ambientLight = new THREE.AmbientLight(0xc9b9e8, 0.5);
    scene.add(ambientLight);

    // Key light - warm glow from above
    const keyLight = new THREE.DirectionalLight(0xe8d4b8, 0.6);
    keyLight.position.set(30, 40, 30);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.far = 200;
    scene.add(keyLight);

    // Fill light - cool accent light
    const fillLight = new THREE.DirectionalLight(0x8ab8e1, 0.3);
    fillLight.position.set(-20, 20, -30);
    scene.add(fillLight);

    // Rim light - subtle highlight
    const rimLight = new THREE.PointLight(0xa8c8e1, 0.2);
    rimLight.position.set(0, 30, 0);
    scene.add(rimLight);

    // Create spiral group
    const spiralGroup = new THREE.Group();
    scene.add(spiralGroup);
    spiralGroupRef.current = spiralGroup;

    // Create spiral helix geometry
    const spiralCurve = createSpiralCurve();
    const spiralTubeGeometry = new THREE.TubeGeometry(
      spiralCurve,
      240,
      0.35,
      10,
      false
    );

    // Elegant metallic material for the spiral
    const spiralMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b8b9f,           // Sophisticated gunmetal
      emissive: 0x3a3a4a,        // Subtle emission
      metalness: 0.8,             // Highly metallic
      roughness: 0.25,            // Smooth, polished
      envMapIntensity: 1.2,
    });

    const spiralMesh = new THREE.Mesh(spiralTubeGeometry, spiralMaterial);
    spiralMesh.castShadow = true;
    spiralMesh.receiveShadow = true;
    spiralGroup.add(spiralMesh);
    spiralMeshRef.current = spiralMesh;

    // Create jhana points along spiral
    jhanasInOrder.forEach((jhana, i) => {
      const t = i / (jhanasInOrder.length - 1);
      const position = createSpiralCurve().getPointAt(t);

      // Create sphere for jhana point - elegant metallic
      const geometry = new THREE.IcosahedronGeometry(0.7, 5);
      const material = new THREE.MeshStandardMaterial({
        color: JHANA_COLORS[jhana],
        emissive: JHANA_COLORS[jhana],
        emissiveIntensity: 0.3,
        metalness: 0.9,            // Highly metallic
        roughness: 0.15,           // Very smooth, polished
        envMapIntensity: 1.5,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      spiralGroup.add(mesh);

      // Add subtle aura effect with larger sphere
      const auraGeometry = new THREE.IcosahedronGeometry(1.0, 4);
      const auraMaterial = new THREE.MeshBasicMaterial({
        color: JHANA_COLORS[jhana],
        transparent: true,
        opacity: 0.15,
      });
      const auraMesh = new THREE.Mesh(auraGeometry, auraMaterial);
      auraMesh.position.copy(position);
      spiralGroup.add(auraMesh);

      jhanaPointsRef.current.push({
        jhana,
        position: position.clone(),
        mesh,
        index: i,
      });
    });

    // Create particle system with tangent-aligned coherent flow
    const particleCount = 1000;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const t = Math.random();
      const spiralCurve = createSpiralCurve();
      const pos = spiralCurve.getPointAt(t);

      // Get tangent vector to align particle velocity with spiral flow
      const tangent = spiralCurve.getTangentAt(t).normalize();
      const speed = 0.05 + Math.random() * 0.05; // Base speed + random variation

      // Position particles near the spiral with slight randomness
      particlePositions[i * 3] = pos.x + (Math.random() - 0.5) * 2;
      particlePositions[i * 3 + 1] = pos.y + (Math.random() - 0.5) * 2;
      particlePositions[i * 3 + 2] = pos.z + (Math.random() - 0.5) * 2;

      // Velocity aligned with spiral tangent for coherent upward flow
      particleVelocities[i * 3] = tangent.x * speed;
      particleVelocities[i * 3 + 1] = tangent.y * speed;
      particleVelocities[i * 3 + 2] = tangent.z * speed;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xa8c8e1,    // Elegant cool silver-blue
      size: 0.1,
      transparent: true,
      opacity: 0.4,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    spiralGroup.add(particles);
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

      const jhanaPointMeshes = jhanaPointsRef.current.map((p) => p.mesh);
      const intersects = raycasterRef.current.intersectObjects(jhanaPointMeshes);

      if (intersects.length > 0) {
        const clickedMesh = intersects[0].object;
        const selectedPoint = jhanaPointsRef.current.find((p) => p.mesh === clickedMesh);
        if (selectedPoint) {
          onSelectJhana(selectedPoint.jhana);

          // Calculate focus target: position above and behind the selected point
          const targetPos = selectedPoint.position.clone();
          targetPos.y += 3;
          targetPos.z += 5;
          cameraFocusTargetRef.current.copy(targetPos);
          isCameraFocusingRef.current = true;
        }
      }
    };

    renderer.domElement.addEventListener('click', onMouseClick);

    // Animation loop with dynamic camera, particles, and spiral breathing
    let animationTime = 0;
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      animationTime += 0.002;

      // --- CAMERA LOGIC: User-controlled with optional focus transition ---
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

        const selectedPoint = jhanaPointsRef.current.find(p => p.jhana === selectedJhana);
        if (selectedPoint) {
          camera.lookAt(selectedPoint.position);
        }

        // Resume user control when close enough
        if (currentPos.distanceTo(targetPos) < 0.15) {
          isCameraFocusingRef.current = false;
        }
      }

      // --- PARTICLE SYSTEM: Coherent upward flow with drift ---
      if (particlesRef.current) {
        const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
        const velocities = (particlesRef.current.userData as any).velocities as Float32Array;

        const upwardDraft = 0.001; // Constant upward acceleration
        const wrapAroundHeight = 20; // Max height before wrap

        for (let i = 0; i < particleCount; i++) {
          // Apply upward drift (acceleration)
          velocities[i * 3 + 1] += upwardDraft;

          // Update position based on velocity
          positions[i * 3] += velocities[i * 3];
          positions[i * 3 + 1] += velocities[i * 3 + 1];
          positions[i * 3 + 2] += velocities[i * 3 + 2];

          // Smooth wrap-around when particles reach top
          if (positions[i * 3 + 1] > wrapAroundHeight) {
            // Reset to bottom with velocity realigned to spiral start tangent
            positions[i * 3 + 1] -= wrapAroundHeight;
            const spiralCurve = createSpiralCurve();
            const newTangent = spiralCurve.getTangentAt(0).normalize();
            const speed = 0.05 + Math.random() * 0.05;
            velocities[i * 3] = newTangent.x * speed;
            velocities[i * 3 + 1] = newTangent.y * speed;
            velocities[i * 3 + 2] = newTangent.z * speed;
          }
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      // --- SPIRAL BREATHING EFFECT: Subtle pulsing and rotation ---
      if (spiralMeshRef.current && spiralGroupRef.current) {
        // Breathing effect: subtle scale pulse
        const breathePulse = 1.0 + Math.sin(animationTime * 2) * 0.02;
        spiralMeshRef.current.scale.set(breathePulse, 1, breathePulse);

        // Subtle spiral group rotation for dynamic feel
        spiralGroupRef.current.rotation.y = Math.sin(animationTime * 0.3) * 0.05;
      }

      // Highlight selected jhana
      jhanaPointsRef.current.forEach((point) => {
        if (point.jhana === selectedJhana) {
          const scale = 1.2 + Math.sin(animationTime * 6) * 0.2;
          point.mesh.scale.set(scale, scale, scale);
          (point.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.8 + Math.sin(animationTime * 4) * 0.2;
        } else {
          point.mesh.scale.set(1, 1, 1);
          (point.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5;
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
      if (controlsRef.current) {
        controlsRef.current.handleResize?.();
      }
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
      spiralTubeGeometry.dispose();
      spiralMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
    };
  }, [selectedJhana, onSelectJhana]);

  return (
    <div className="w-full space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <h3 className="text-3xl font-bold text-slate-100">The Jhana Spiral</h3>
        <p className="text-sm text-slate-400">Click on any point to explore that jhana state. The spiral continuously orbits for a mesmerizing view of all eight absorption states.</p>
      </div>

      {/* Two-column layout: Canvas (left) and Info Panel (right) */}
      <div className="flex gap-4 h-72">
        {/* Left Column: 3D Canvas */}
        <div className="w-2/3">
          <div ref={containerRef} className="relative w-full h-full rounded-lg overflow-hidden border border-slate-700 bg-slate-950" />
        </div>

        {/* Right Column: Info Panel - Compact */}
        <div className="w-1/3">
          {selectedJhana ? (
            <div className="h-full bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-2 border-slate-700 rounded-2xl p-4 animate-fade-in overflow-y-auto">
              <div className="space-y-3">
                <div>
                  <div
                    className="inline-block w-3 h-3 rounded-full mb-2"
                    style={{ backgroundColor: `#${JHANA_COLORS[selectedJhana].toString(16).padStart(6, '0')}` }}
                  />
                  <h4 className="text-lg font-bold text-slate-100">{selectedJhana}</h4>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-4">
                    {JHANA_DESCRIPTIONS[selectedJhana]}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full border-2 border-dashed border-slate-700 rounded-2xl p-4 flex items-center justify-center text-slate-500 text-center text-sm">
              <p>Click a point</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
