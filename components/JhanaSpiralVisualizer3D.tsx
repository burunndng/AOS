import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { JhanaLevel } from '../types.ts';
import { X } from 'lucide-react';

interface JhanaSpiralVisualizer3DProps {
  selectedJhana: JhanaLevel | null;
  onSelectJhana: (jhana: JhanaLevel) => void;
}

const JHANA_COLORS: Record<JhanaLevel, number> = {
  'Access Concentration': 0xa78bfa,
  'Momentary Concentration': 0xc4b5fd,
  '1st Jhana': 0xf87171,
  '2nd Jhana': 0xfb923c,
  '3rd Jhana': 0xfbbf24,
  '4th Jhana': 0x10b981,
  '5th Jhana': 0x14b8a6,
  '6th Jhana': 0x06b6d4,
  '7th Jhana': 0x3b82f6,
  '8th Jhana': 0x8b5cf6,
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

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    sceneRef.current = scene;

    // Camera setup
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(15, 8, 15);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.8);
    pointLight.position.set(20, 20, 20);
    pointLight.castShadow = true;
    pointLight.shadow.mapSize.width = 2048;
    pointLight.shadow.mapSize.height = 2048;
    scene.add(pointLight);

    // Create spiral group
    const spiralGroup = new THREE.Group();
    scene.add(spiralGroup);
    spiralGroupRef.current = spiralGroup;

    // Create spiral helix geometry
    const spiralCurve = new THREE.LineCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 20, 0)
    );

    const spiralTubeGeometry = new THREE.TubeGeometry(
      createSpiralCurve(),
      200,
      0.3,
      8,
      false
    );
    const spiralMaterial = new THREE.MeshStandardMaterial({
      color: 0x6b4ce1,
      emissive: 0x4c3aa0,
      metalness: 0.6,
      roughness: 0.4,
    });
    const spiralMesh = new THREE.Mesh(spiralTubeGeometry, spiralMaterial);
    spiralMesh.castShadow = true;
    spiralMesh.receiveShadow = true;
    spiralGroup.add(spiralMesh);

    // Create jhana points along spiral
    jhanasInOrder.forEach((jhana, i) => {
      const t = i / (jhanasInOrder.length - 1);
      const position = createSpiralCurve().getPointAt(t);

      // Create sphere for jhana point
      const geometry = new THREE.IcosahedronGeometry(0.8, 4);
      const material = new THREE.MeshStandardMaterial({
        color: JHANA_COLORS[jhana],
        emissive: JHANA_COLORS[jhana],
        emissiveIntensity: 0.5,
        metalness: 0.7,
        roughness: 0.2,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      spiralGroup.add(mesh);

      // Add glow effect with larger sphere
      const glowGeometry = new THREE.IcosahedronGeometry(1.2, 4);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: JHANA_COLORS[jhana],
        transparent: true,
        opacity: 0.2,
      });
      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      glowMesh.position.copy(position);
      spiralGroup.add(glowMesh);

      jhanaPointsRef.current.push({
        jhana,
        position: position.clone(),
        mesh,
        index: i,
      });
    });

    // Create particle system
    const particleCount = 1000;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const t = Math.random();
      const pos = createSpiralCurve().getPointAt(t);
      particlePositions[i * 3] = pos.x + (Math.random() - 0.5) * 2;
      particlePositions[i * 3 + 1] = pos.y + (Math.random() - 0.5) * 2;
      particlePositions[i * 3 + 2] = pos.z + (Math.random() - 0.5) * 2;

      particleVelocities[i * 3] = (Math.random() - 0.5) * 0.05;
      particleVelocities[i * 3 + 1] = Math.random() * 0.02;
      particleVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x22d3ee,
      size: 0.15,
      transparent: true,
      opacity: 0.6,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    spiralGroup.add(particles);
    particlesRef.current = particles;

    // Store velocities for animation
    (particles as any).userData.velocities = particleVelocities;

    // Mouse click handler
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
          // Animate camera to jhana point
          animateCameraToPoint(selectedPoint.position);
        }
      }
    };

    renderer.domElement.addEventListener('click', onMouseClick);

    // Animation loop
    let animationTime = 0;
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      animationTime += 0.002;

      // Rotate spiral
      spiralGroup.rotation.y += 0.0005;

      // Update particles
      if (particlesRef.current) {
        const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
        const velocities = (particlesRef.current.userData as any).velocities as Float32Array;

        for (let i = 0; i < particleCount; i++) {
          positions[i * 3] += velocities[i * 3];
          positions[i * 3 + 1] += velocities[i * 3 + 1];
          positions[i * 3 + 2] += velocities[i * 3 + 2];

          // Wrap particles around spiral
          if (positions[i * 3 + 1] > 20) {
            positions[i * 3 + 1] = 0;
            const randomT = Math.random();
            const pos = createSpiralCurve().getPointAt(randomT);
            positions[i * 3] = pos.x + (Math.random() - 0.5) * 2;
            positions[i * 3 + 2] = pos.z + (Math.random() - 0.5) * 2;
          }
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
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
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', onMouseClick);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      containerRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
      spiralTubeGeometry.dispose();
      spiralMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
    };
  }, [selectedJhana, onSelectJhana]);

  // Helper function to create spiral curve
  function createSpiralCurve(): THREE.Curve<THREE.Vector3> {
    return {
      getPoint: (t: number) => {
        const height = t * 20;
        const radius = 5 + t * 3;
        const angle = t * Math.PI * 8;
        return new THREE.Vector3(
          radius * Math.cos(angle),
          height,
          radius * Math.sin(angle)
        );
      },
      getPointAt: (u: number) => {
        return this.getPoint(u);
      },
      getPoints: (divisions: number = 5) => {
        const points: THREE.Vector3[] = [];
        for (let i = 0; i <= divisions; i++) {
          points.push(this.getPoint(i / divisions));
        }
        return points;
      },
      getSpacedPoints: (divisions: number = 5) => {
        return this.getPoints(divisions);
      },
    } as THREE.Curve<THREE.Vector3>;
  }

  // Helper function to animate camera to clicked point
  function animateCameraToPoint(targetPosition: THREE.Vector3) {
    if (!cameraRef.current) return;

    const startPos = cameraRef.current.position.clone();
    const endPos = new THREE.Vector3(
      targetPosition.x + 8,
      targetPosition.y + 5,
      targetPosition.z + 8
    );

    let progress = 0;
    const duration = 1000;
    const startTime = Date.now();

    const animateCamera = () => {
      progress = (Date.now() - startTime) / duration;
      if (progress >= 1) {
        cameraRef.current?.position.copy(endPos);
        cameraRef.current?.lookAt(targetPosition);
        return;
      }

      const easeProgress = easeInOutCubic(progress);
      cameraRef.current?.position.lerpVectors(startPos, endPos, easeProgress);
      cameraRef.current?.lookAt(targetPosition);

      requestAnimationFrame(animateCamera);
    };

    animateCamera();
  }

  function easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  return (
    <div className="w-full space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <h3 className="text-3xl font-bold text-slate-100">The Jhana Spiral</h3>
        <p className="text-sm text-slate-400">Click on any point to explore that jhana state and navigate the 3D spiral</p>
      </div>

      {/* 3D Canvas Container */}
      <div ref={containerRef} className="w-full h-96 rounded-lg overflow-hidden border border-slate-700 bg-slate-950" />

      {/* Selected Jhana Details Panel */}
      {selectedJhana && (
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-2 border-slate-700 rounded-2xl p-8 animate-fade-in">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div
                  className="inline-block w-4 h-4 rounded-full mb-3"
                  style={{ backgroundColor: `#${JHANA_COLORS[selectedJhana].toString(16).padStart(6, '0')}` }}
                />
                <h4 className="text-2xl font-bold text-slate-100">{selectedJhana}</h4>
              </div>
            </div>

            <p className="text-slate-300 leading-relaxed">
              {JHANA_DESCRIPTIONS[selectedJhana]}
            </p>

            <p className="text-sm text-slate-400 italic border-l-2 border-accent/50 pl-4">
              Click on other points in the spiral to explore different jhana states.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
