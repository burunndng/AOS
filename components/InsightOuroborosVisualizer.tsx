import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

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

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e27);
    scene.fog = new THREE.Fog(0x0a0e27, 100, 200);
    sceneRef.current = scene;

    // Camera setup - fixed position with subtle tilt
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 8, 18);
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

    // Create ouroboros (torus) - the serpent eating its tail
    const torusGeometry = new THREE.TorusGeometry(10, 0.5, 16, 100);
    const torusMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b8b9f,
      emissive: 0x3a3a4a,
      metalness: 0.8,
      roughness: 0.25,
      envMapIntensity: 1.2,
    });
    const torusMesh = new THREE.Mesh(torusGeometry, torusMaterial);
    torusMesh.castShadow = true;
    torusMesh.receiveShadow = true;
    ouroborosGroup.add(torusMesh);

    // Create stage nodes around the circle
    INSIGHT_STAGES.forEach((stage, index) => {
      const angle = (index / INSIGHT_STAGES.length) * Math.PI * 2;
      const radius = 10;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const position = new THREE.Vector3(x, 0, z);

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

    // Mouse click handler
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
        }
      }
    };

    renderer.domElement.addEventListener('click', onMouseClick);

    // Animation loop - subtle, quasi-static
    let animationTime = 0;
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      animationTime += 0.001;

      // Very subtle rotation of the entire ouroboros
      ouroborosGroup.rotation.y = Math.sin(animationTime * 0.3) * 0.1;
      ouroborosGroup.rotation.z = Math.cos(animationTime * 0.2) * 0.05;

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
      containerRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
      torusGeometry.dispose();
      torusMaterial.dispose();
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
