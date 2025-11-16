import React, { useState, useRef, useEffect } from 'react';
import { X, Brain, Layers, GitCompare, Lightbulb, AlertTriangle, ChevronDown } from 'lucide-react';
import * as THREE from 'three';

interface ConsciousnessGraphProps {
  onClose: () => void;
}

type ViewMode = 'both' | 'leary' | 'wilber';

interface LevelData {
  number: number;
  leary: {
    name: string;
    shortName: string;
    description: string;
    when_active: string;
    insight: string;
    quote: string;
  };
  wilber: {
    name: string;
    isState: boolean;
    description: string;
    characteristics: string;
    insight: string;
    stageInterpretations?: { [key: string]: string };
  };
  relationship: {
    similarity: string;
    difference: string;
    keyInsight: string;
    warning?: string;
  };
  color: string;
  wilberColor: string;
}

const CONSCIOUSNESS_DATA: LevelData[] = [
  {
    number: 1,
    leary: {
      name: "Biosurvival Circuit",
      shortName: "C1: Survival",
      description: "First circuit to activate (womb to infancy). Governs survival, safety, basic trust. Biological functions: eating, breathing, physical security.",
      when_active: "Feeling grounded in your body, automatic safety responses, fight/flight/freeze reactions, basic physical comfort/discomfort.",
      insight: "This circuit is your 'on/off switch' - if not imprinted positively (safe environment in infancy), higher circuits struggle to develop properly.",
      quote: "Is the world safe or dangerous? Will my needs be met?"
    },
    wilber: {
      name: "Archaic/Infrared Stage",
      isState: false,
      description: "Developmental stage: birth to ~18 months. Pre-personal, instinctual consciousness. Sensorimotor intelligence.",
      characteristics: "No clear self/other boundary yet. Physical sensation dominates. Impulse and reflex. Basic organismic needs.",
      insight: "This isn't a 'higher' or 'lower' consciousness - it's a necessary developmental foundation. Adults can access this state but interpret it from their current stage."
    },
    relationship: {
      similarity: "Both describe the most basic, body-centered, survival-focused mode of consciousness.",
      difference: "Leary: A circuit that stays with you for life; can be re-imprinted. Wilber: A developmental stage you grow through; adults at higher stages still have survival needs but process them differently.",
      keyInsight: "When you're in pure survival mode (accident, illness, extreme stress), you're operating primarily from C1/Infrared - but how you make sense of it depends on your stage development."
    },
    color: "#8B4513",
    wilberColor: "#800000"
  },
  {
    number: 2,
    leary: {
      name: "Emotional-Territorial Circuit",
      shortName: "C2: Emotion/Territory",
      description: "Activates in toddlerhood (~2-3 years). Governs emotions, dominance/submission, territory, status. Mammalian inheritance: pack dynamics.",
      when_active: "Feeling dominant or submissive, territorial about space/possessions/relationships, emotional flooding (anger, fear, triumph), political/status awareness.",
      insight: "Most human conflict operates from C2 - status games, territorial disputes, emotional reactivity. Seeing this circuit clearly helps you choose when to engage vs. transcend it.",
      quote: "Am I strong or weak? What's my status in the pack?"
    },
    wilber: {
      name: "Magic (Magenta) → Power (Red)",
      isState: false,
      description: "Magic (2-5 years): Magical thinking, animistic. Power/Red: Egocentric, impulsive, immediate gratification. Might makes right.",
      characteristics: "Emotional-impulsive. No concern for others' perspectives. Power and status driven. Present-focused.",
      insight: "This stage is necessary - developing a strong ego. The problem is getting stuck here. Healthy Red gives you assertiveness; unhealthy Red is tyrannical."
    },
    relationship: {
      similarity: "Both describe emotional, territorial, status-driven consciousness - the 'inner mammal'.",
      difference: "Leary: A functional system that never goes away - you'll always have emotions and status awareness. Wilber: Developmental stages you ideally grow through, though can regress to under stress.",
      keyInsight: "Your C2 circuit processes emotions and status your whole life. But HOW you handle these depends on your stage: At Red: Act on every impulse. At Amber: Suppress emotions, follow rules. At Orange: Strategically manage emotions. At Green: Honor all emotions equally. At Teal: Feel emotions fully while not being controlled by them."
    },
    color: "#DC143C",
    wilberColor: "#FF0000"
  },
  {
    number: 3,
    leary: {
      name: "Semantic Circuit",
      shortName: "C3: Thinking/Symbols",
      description: "Activates in childhood (~3-7 years). Governs language, symbols, concepts, thinking, meaning-making. Uniquely human: abstract thought.",
      when_active: "Engaged in learning, reading, writing. Problem-solving, planning. Symbolic thinking (math, language, logic). Making mental maps.",
      insight: "This circuit lets you live in worlds of symbols and abstractions. Its limitation: mistaking the map for the territory, getting lost in concepts rather than direct experience.",
      quote: "What does this mean? How do things connect?"
    },
    wilber: {
      name: "Mythic (Amber) → Rational (Orange)",
      isState: false,
      description: "Amber (7-12 years, 35% of adults): Rule/role-based, single-perspective. Orange (Modernity): Rational, empirical, goal-oriented.",
      characteristics: "Amber: Loyalist, rule-following, narrative-based worldview. Orange: Strategic, scientific, individualistic.",
      insight: "The breakthrough that created science, rights, and democracy came from Orange. But Orange assumes ONLY rational thinking matters - missing embodied, emotional, and non-rational dimensions."
    },
    relationship: {
      similarity: "Both involve abstract thinking and symbolic representation.",
      difference: "Leary: C3 stays active your whole life for language/concepts. Wilber: Developmental stages where Orange transcends but includes Amber.",
      keyInsight: "You need C3 to learn, communicate, and solve problems. But over-reliance (analysis paralysis) means you're stuck in maps while missing direct experience. Mature consciousness uses C3 strategically while remaining grounded in C1-2."
    },
    color: "#FFD700",
    wilberColor: "#FFA500"
  },
  {
    number: 4,
    leary: {
      name: "Socio-Sexual Circuit",
      shortName: "C4: Bonding/Morality",
      description: "Activates around age 4-5 (with others). Governs bonding, love, morality, cooperation, altruism. Primate/mammalian affiliation system.",
      when_active: "Feeling love, empathy, moral concern, desire to belong, sexual attraction, cooperation, guilt (moral emotion). Group identification.",
      insight: "C4 is the heart circuit - what makes us capable of love, morality, and cooperation. Without positive C4 imprinting (secure attachment), you might have trouble with intimacy, trust, and moral empathy throughout life.",
      quote: "Do people care about me? Can I trust? Am I worthy of love?"
    },
    wilber: {
      name: "Pluralistic (Green)",
      isState: false,
      description: "Emerged 1960s. Emphasis on equality, inclusion, feelings, authenticity, community, sensitivity to power dynamics.",
      characteristics: "Egalitarian, relativistic ('all perspectives equally valid'), feelings-centered, inclusive, anti-hierarchical.",
      insight: "Green brought us feminism, environmentalism, civil rights, and therapy culture. Its strength: inclusion and empathy. Its shadow: false equivalence ('all views equally true'), moral relativism, decision paralysis."
    },
    relationship: {
      similarity: "Both emphasize belonging, bonding, empathy, and moral concern.",
      difference: "Leary: C4 is a neurological circuit for bonding/sexuality that lasts your whole life. Wilber: Green is a stage you develop through, transcending self-interest with Green-level concern for all.",
      keyInsight: "Healthy C4 + Green = genuine empathy and moral development. Unhealthy: C4 wounds create attachment issues; Green can become 'spiritual bypassing' where you use empathy language to avoid boundaries/discernment."
    },
    color: "#00CED1",
    wilberColor: "#00FF7F"
  },
  {
    number: 5,
    leary: {
      name: "Neurosomatic Circuit",
      shortName: "C5: Somatic/Bliss",
      description: "Activates through exercise, sex, yoga, dance, breathing. Governs bliss, sensory pleasure, body mastery, flow states. Higher-brain hedonic reward.",
      when_active: "Athletic flow state. Sexual pleasure and orgasm. Meditative bliss. Sensory absorption (music, food, art, nature). Feeling present in your body.",
      insight: "C5 is about transcending C1-4 limitations through the body. It's not spiritual - it's neurological reward for integrated sensorimotor excellence. Bliss isn't 'special' - it's your neurology rewarding whole-brain integration.",
      quote: "I'm completely present. No thinking, no history - just this. Pure sensation and flow."
    },
    wilber: {
      name: "Systemic (Teal)",
      isState: false,
      description: "Emerged 1990s. Integrative, complex-systems thinking. Can simultaneously hold multiple perspectives and hierarchies.",
      characteristics: "Systems-thinking, flexible, can shift perspectives, values-driven, post-materialist.",
      insight: "Teal brought us integral thinking - the ability to see partial truths in Red, Amber, Orange, Green simultaneously without collapsing into relativism. Only 5-10% of world population."
    },
    relationship: {
      similarity: "Both transcend lower circuits/stages through integration - C5 through body mastery, Teal through cognitive/systems integration.",
      difference: "Leary: C5 is accessible from any stage - your body always has capacity for pleasure/flow. Wilber: Teal is a rare developmental achievement requiring sustained development through previous stages.",
      keyInsight: "C5 + Teal = You can access nondual body states AND understand their place in the system. You feel the bliss while understanding its neurological basis. The paradox: understanding how it works doesn't diminish the experience."
    },
    color: "#00FF00",
    wilberColor: "#4169E1"
  },
  {
    number: 6,
    leary: {
      name: "Metaprogramming Circuit",
      shortName: "C6: Meta/Witness",
      description: "Access to metaprogramming - reprogramming your own circuits. Self-observation, self-reflection, changing beliefs, perspective-taking.",
      when_active: "Watching your own thoughts (mindfulness/metacognition). Deliberate belief-change. Recognizing patterns in your behavior. 'I notice I'm thinking in circles...'",
      insight: "C6 is the first 'self-aware' circuit - you can observe your own programming rather than just run it. Most humans rarely access this deliberately. This is where 'free will' begins - the ability to choose your programming.",
      quote: "I can see how I got here. I can choose differently. I'm not trapped - I'm observing the trap."
    },
    wilber: {
      name: "Integral/Aware (Turquoise/Aqua)",
      isState: false,
      description: "Holds both systemic complexity AND nondual awareness. Can move between different perspectives while maintaining non-dual consciousness.",
      characteristics: "Transcends and includes all previous stages. Holistic. Rare. Often has peak experiences of non-duality.",
      insight: "Very few people stably inhabit this. It requires development through Teal plus regular access to non-dual states plus continued integration."
    },
    relationship: {
      similarity: "Both are meta-level - standing apart from the machinery and observing it.",
      difference: "Leary: C6 gives you metaprogramming ability, but you still operate from your stage. Wilber: Integral combines all previous wisdom with nondual awareness.",
      keyInsight: "C6 is a superpower IF grounded in healthy C1-5. But C6 without grounding = dissociation, analysis paralysis, spiritual ego ('I'm so aware'). The mature approach: Feel C1-5 fully, observe with C6, understand with Teal thinking."
    },
    color: "#9370DB",
    wilberColor: "#8B00FF"
  },
  {
    number: 7,
    leary: {
      name: "Neurogenetic Circuit",
      shortName: "C7: Collective/Archetypal",
      description: "'Collective unconscious' - access to evolutionary memory. Governs archetypal visions, DNA memory, past life experiences, ancestral knowledge.",
      when_active: "Visions of other times, places, beings. Sense of ancient or future memory. Archetypal encounters (gods, demons, guides). 'Past life' experiences. Genetic/ancestral knowing.",
      insight: "C7 opens access to information stored in DNA and the collective unconscious. You're no longer just your individual life story - you're experiencing the entire evolutionary saga.",
      quote: "I experienced being in the womb, being born, being my grandmother, being an ancient hunter - it was all memory, all real somehow."
    },
    wilber: {
      name: "Archetypal/Causal States",
      isState: true,
      description: "Access to archetypal content and causal awareness. Can include both genuinely transpersonal experiences AND pre/trans confusion (mistaking regressive states for transcendent ones).",
      characteristics: "Profound but complex territory. Some experiences are genuinely transpersonal, some are pre-personal regression, some are symbolic processing.",
      insight: "Critical distinction: PRE-rational (regressing to womb, infantile fusion) vs TRANS-rational (genuine transpersonal archetypal wisdom). They FEEL similar (non-rational, non-egoic) but are opposite ends of development.",
      stageInterpretations: {
        "Amber": "I met Jesus/Allah - they confirmed my religion is true! - Interprets literally",
        "Orange": "Fascinating archetypal content, probably Jungian symbolic processing",
        "Green": "I accessed indigenous wisdom, earth consciousness, collective trauma",
        "Teal": "Archetypal forms arising from formless - personal, collective, and transpersonal dancing"
      }
    },
    relationship: {
      similarity: "Both recognize access to archetypal, collective, ancestral dimensions of consciousness.",
      difference: "Leary: C7 is objectively accessing past/ancestral information stored in DNA. Wilber: More cautious - could be genuine transpersonal OR symbolic/psychological. Needs discernment. Watch for pre/trans confusion.",
      keyInsight: "C7/Causal states open doors to vast territories. Without grounding in C1-4 and healthy stage development, can lead to: Psychotic breaks, Spiritual inflation ('I was Cleopatra'), Dissociation from ordinary reality. WITH grounding: profound archetypal wisdom.",
      warning: "⚠️ PRE/TRANS FALLACY: Don't mistake regressive (pre-rational) states for transcendent (trans-rational) ones. Both feel non-egoic but are opposites."
    },
    color: "#C0C0C0",
    wilberColor: "#E6E6FA"
  },
  {
    number: 8,
    leary: {
      name: "Neuro-Atomic/Quantum Non-Local Circuit",
      shortName: "C8: Unity/Non-Dual",
      description: "'Cosmic consciousness' - complete ego death, unity, infinity. Governs mystical union, non-duality, quantum consciousness. Our ultimate evolutionary destination.",
      when_active: "Complete ego dissolution. Subject/object collapse. Unity with everything. Timeless/spaceless awareness. Infinite love/bliss. 'God-realization'. No-self or True Self.",
      insight: "C8 is the furthest reach of consciousness - where individual awareness recognizes itself as universal awareness. This is what mystics throughout history accessed. It's our ultimate evolutionary destination.",
      quote: "There is no 'person' - just infinite awareness recognizing itself. Everything is That. I AM That."
    },
    wilber: {
      name: "Non-Dual States (Peak Experience)",
      isState: true,
      description: "Non-dual awareness - among the most important experiences available. Real and profound. But it's a STATE, not necessarily a STAGE. Accessible temporarily from any stage.",
      characteristics: "Genuine experience of unity consciousness. Can be life-changing. But permanent non-dual awareness (Turquoise+) is extremely rare. Most people visit and return to their stage.",
      insight: "Non-dual states are crucial BUT your stage MASSIVELY affects interpretation and integration. You need both: WAKING UP (accessing non-dual states) AND GROWING UP (developing through stages). Can have peak non-dual experiences but still be narcissistic (Red), fundamentalist (Amber), or relativistic (Green).",
      stageInterpretations: {
        "Red": "I AM GOD! Everyone should worship me! - Dangerous narcissism",
        "Amber": "I merged with God/Jesus - my faith is TRUE! - Strengthens fundamentalism",
        "Orange": "Incredible neurological state - probably DMN shutdown - Interprets materially",
        "Green": "We are all ONE! No hierarchy! - May lead to spiritual bypassing",
        "Teal": "Emptiness and form dancing. Hierarchy AND equality. Nothing to attain, development continues."
      }
    },
    relationship: {
      similarity: "Both recognize non-dual consciousness as among the most profound human experiences. Radically shifts sense of self and reality. Described consistently across cultures/eras.",
      difference: "Leary: C8 is the pinnacle - ultimate consciousness, our evolutionary goal, the Omega Point. Wilber: Non-dual awareness is crucial BUT not 'higher' than development - it's ORTHOGONAL to it. Access to C8 ≠ enlightenment unless integrated with mature stage development.",
      keyInsight: "The most mature approach combines: Regular access to non-dual awareness (C8 state practice) + Continued stage development (not using unity to bypass growth) + Integration of all circuits/levels (healthy C1-4, judicious C5-8).",
      warning: "⚠️ SPIRITUAL BYPASSING: People often use C8/non-dual experiences to AVOID stage-appropriate developmental work: 'We're all one, so I don't need to deal with my trauma' (bypassing C1). 'It's all perfect, so I don't need boundaries' (bypassing C2). 'Ego is illusion, so I don't need to mature my relationships' (bypassing C4). You need a strong, healthy ego before you can transcend it."
    },
    color: "#FFD700",
    wilberColor: "#FFFFFF"
  }
];

// Three.js Scene Component
function ThreeScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const lightsRef = useRef<THREE.Light[]>([]);
  const radarRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x000000, 0.002);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 30;

    // Renderer with post-processing
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    containerRef.current.appendChild(renderer.domElement);

    // Advanced Lighting Setup
    // Main directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.far = 100;
    scene.add(directionalLight);

    // Dynamic point lights (8 circuit colors)
    const circuitColors = [
      0x8B4513, 0xDC143C, 0xFFD700, 0x00CED1,
      0x00FF00, 0x9370DB, 0xC0C0C0, 0xFFD700
    ];

    circuitColors.forEach((color, i) => {
      const angle = (i / circuitColors.length) * Math.PI * 2;
      const light = new THREE.PointLight(color, 2, 50);
      light.position.set(
        Math.cos(angle) * 25,
        Math.sin(angle) * 15,
        Math.random() * 10 - 5
      );
      scene.add(light);
      lightsRef.current.push(light);
    });

    // Ambient light for general illumination
    const ambientLight = new THREE.AmbientLight(0x4a5568, 0.3);
    scene.add(ambientLight);

    // Advanced Particle System
    const particleCount = 2000;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 80;

      velocities[i * 3] = (Math.random() - 0.5) * 0.2;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.2;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.2;

      const hue = Math.random();
      const color = new THREE.Color().setHSL(hue, 0.8, 0.6);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.8,
      map: createParticleTexture()
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    particles.castShadow = true;
    scene.add(particles);
    particlesRef.current = particles;

    // Radar/Grid System - represents consciousness circuits
    const radarGroup = new THREE.Group();
    radarRef.current = radarGroup;

    // Create rotating rings representing circuits
    for (let i = 1; i <= 8; i++) {
      const radius = i * 3;
      const ringGeometry = new THREE.BufferGeometry();
      const ringPositions = [];

      for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
        ringPositions.push(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          0
        );
      }

      ringGeometry.setAttribute('position', new THREE.BufferAttribute(
        new Float32Array(ringPositions),
        3
      ));

      const ringMaterial = new THREE.LineBasicMaterial({
        color: circuitColors[i - 1],
        transparent: true,
        opacity: 0.3,
        fog: true
      });

      const ring = new THREE.Line(ringGeometry, ringMaterial);
      radarGroup.add(ring);
    }

    scene.add(radarGroup);

    // Animation loop with physics
    let animationId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Update particle physics
      if (particlesRef.current) {
        const posAttr = particlesRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
        const velAttr = particlesRef.current.geometry.getAttribute('velocity') as THREE.BufferAttribute;
        const positions = posAttr.array as Float32Array;
        const velocities = velAttr.array as Float32Array;

        for (let i = 0; i < particleCount; i++) {
          // Update position
          positions[i * 3] += velocities[i * 3] * 50 * delta;
          positions[i * 3 + 1] += velocities[i * 3 + 1] * 50 * delta;
          positions[i * 3 + 2] += velocities[i * 3 + 2] * 50 * delta;

          // Wrap around
          if (Math.abs(positions[i * 3]) > 40) positions[i * 3] *= -0.8;
          if (Math.abs(positions[i * 3 + 1]) > 40) positions[i * 3 + 1] *= -0.8;
          if (Math.abs(positions[i * 3 + 2]) > 40) positions[i * 3 + 2] *= -0.8;
        }

        posAttr.needsUpdate = true;
      }

      // Rotate radar
      if (radarRef.current) {
        radarRef.current.rotation.z += 0.0002;
      }

      // Animate lights
      lightsRef.current.forEach((light, i) => {
        const angle = (i / lightsRef.current.length) * Math.PI * 2 + clock.getElapsedTime();
        if (light instanceof THREE.PointLight) {
          light.position.x = Math.cos(angle) * 25;
          light.position.y = Math.sin(angle) * 15 + Math.sin(clock.getElapsedTime() * 0.5) * 5;
          light.intensity = 2 + Math.sin(clock.getElapsedTime() * 2 + i) * 1;
        }
      });

      // Subtle camera movement
      camera.position.x = Math.sin(clock.getElapsedTime() * 0.1) * 5;
      camera.position.y = Math.cos(clock.getElapsedTime() * 0.08) * 3;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      containerRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
    };
  }, []);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}

// Helper to create particle texture
function createParticleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = 'rgba(0, 0, 0, 0)';
  ctx.fillRect(0, 0, 32, 32);

  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export default function ConsciousnessGraph({ onClose }: ConsciousnessGraphProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('both');
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [showIntro, setShowIntro] = useState(true);

  const selectedData = selectedLevel !== null ? CONSCIOUSNESS_DATA[selectedLevel - 1] : null;

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-y-auto">
      {/* Three.js Background */}
      <div className="fixed inset-0 -z-10">
        <ThreeScene />
      </div>

      {/* Overlay Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-b from-black via-black/90 to-transparent backdrop-blur-sm border-b border-slate-800/30 p-4 sm:p-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-mono text-slate-100 tracking-tighter flex items-center gap-2">
              <Brain size={28} />
              Consciousness Map
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">Leary Circuits × Wilber Stages</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <X size={24} className="text-slate-300" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="sticky top-16 bg-black/50 backdrop-blur-sm border-b border-slate-800/20 p-4 flex gap-2 flex-wrap">
          <button
            onClick={() => setViewMode('both')}
            className={`px-3 py-2 rounded-lg font-mono text-sm transition-all ${
              viewMode === 'both' ? 'bg-accent text-black' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Both
          </button>
          <button
            onClick={() => setViewMode('leary')}
            className={`px-3 py-2 rounded-lg font-mono text-sm transition-all ${
              viewMode === 'leary' ? 'bg-accent text-black' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Lightbulb size={14} className="inline mr-1" />
            Leary
          </button>
          <button
            onClick={() => setViewMode('wilber')}
            className={`px-3 py-2 rounded-lg font-mono text-sm transition-all ${
              viewMode === 'wilber' ? 'bg-accent text-black' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Layers size={14} className="inline mr-1" />
            Wilber
          </button>
        </div>

        {/* Levels Grid */}
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {CONSCIOUSNESS_DATA.map(level => (
              <button
                key={level.number}
                onClick={() => setSelectedLevel(selectedLevel === level.number ? null : level.number)}
                className={`relative group p-4 rounded-lg border-2 transition-all duration-300 ${
                  selectedLevel === level.number
                    ? 'bg-slate-900/80 border-accent shadow-lg shadow-accent/50'
                    : 'bg-slate-900/40 border-slate-700/50 hover:border-slate-600'
                }`}
                style={{
                  borderColor: selectedLevel === level.number ? '#a855f7' : undefined
                }}
              >
                <div className="text-xs font-mono text-slate-400 mb-1">Circuit {level.number}</div>
                <h3 className="text-sm font-bold text-slate-100 line-clamp-2">{level.leary.name}</h3>
                <div className="mt-2 h-1 bg-gradient-to-r from-slate-700 to-transparent rounded"
                  style={{
                    background: `linear-gradient(90deg, ${level.color}, transparent)`
                  }}
                />
              </button>
            ))}
          </div>

          {/* Detail Panel */}
          {selectedData && (
            <div className="mt-8 bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-lg p-6 space-y-6">
              <button
                onClick={() => setSelectedLevel(null)}
                className="absolute top-4 right-4 p-1 hover:bg-slate-700/50 rounded transition-colors"
              >
                <X size={20} />
              </button>

              <h2 className="text-2xl font-bold text-slate-100">{selectedData.leary.name}</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {(viewMode === 'both' || viewMode === 'leary') && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                      <Lightbulb size={20} className="text-yellow-400" />
                      Leary Circuit
                    </h3>
                    <div className="space-y-3 text-sm text-slate-300">
                      <div>
                        <h4 className="font-bold text-slate-200 mb-1">When Active:</h4>
                        <p>{selectedData.leary.when_active}</p>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-200 mb-1">Key Insight:</h4>
                        <p>{selectedData.leary.insight}</p>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-200 mb-1 italic">"{selectedData.leary.quote}"</h4>
                      </div>
                    </div>
                  </div>
                )}

                {(viewMode === 'both' || viewMode === 'wilber') && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                      <Layers size={20} className="text-blue-400" />
                      Wilber Stage
                    </h3>
                    <div className="space-y-3 text-sm text-slate-300">
                      <div>
                        <h4 className="font-bold text-slate-200 mb-1">{selectedData.wilber.name}</h4>
                        <p className="text-xs text-slate-400 mb-2">{selectedData.wilber.isState ? 'STATE' : 'STAGE'}</p>
                        <p>{selectedData.wilber.description}</p>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-200 mb-1">Characteristics:</h4>
                        <p>{selectedData.wilber.characteristics}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {(viewMode === 'both') && (
                <div className="border-t border-slate-700 pt-6 space-y-4">
                  <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                    <GitCompare size={20} className="text-purple-400" />
                    Integration
                  </h3>
                  <div className="space-y-3 text-sm text-slate-300">
                    <div>
                      <h4 className="font-bold text-slate-200 mb-1">Key Insight:</h4>
                      <p>{selectedData.relationship.keyInsight}</p>
                    </div>
                    {selectedData.relationship.warning && (
                      <div className="flex gap-3 p-3 bg-red-900/20 border border-red-800/50 rounded">
                        <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                        <p>{selectedData.relationship.warning}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
