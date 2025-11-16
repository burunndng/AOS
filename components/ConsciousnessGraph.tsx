import React, { useState, useRef, useEffect } from 'react';
import { X, Brain, Layers, GitCompare, Lightbulb, AlertTriangle, ChevronDown } from 'lucide-react';

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
      description: "Mythic/Amber: Concrete operational thinking, rules, roles, order. Rational/Orange: Formal operational thinking, hypothetical reasoning, scientific method.",
      characteristics: "Abstract thought emerges. Can take other perspectives. Linear, logical reasoning. Belief in objective truth.",
      insight: "Amber and Orange both use concepts/thinking but differently: Amber: 'The book says it, therefore it's true.' Orange: 'Let me test it and see if it's true.'"
    },
    relationship: {
      similarity: "Both recognize the emergence of conceptual, symbolic thinking as distinctly human.",
      difference: "Leary: One circuit for all semantic/rational activity. Wilber: Distinguishes between conformist-rational (Amber) and scientific-rational (Orange).",
      keyInsight: "Your C3 circuit enables thinking. Your stage determines WHAT KIND of thinking: Mythic thinkers use concepts to reinforce tradition. Rational thinkers use concepts to achieve and discover. Pluralistic thinkers use concepts to deconstruct and include. Integral thinkers use concepts while recognizing their limits."
    },
    color: "#FFD700",
    wilberColor: "#FF8C00"
  },
  {
    number: 4,
    leary: {
      name: "Socio-Sexual Circuit",
      shortName: "C4: Social/Moral",
      description: "Activates in puberty/adolescence. Governs sexual identity, social roles, moral codes, tribal belonging, adult personality. Cultural imprinting.",
      when_active: "Strong sense of cultural identity. Moral clarity (this is right/wrong). Sexual attraction and bonding. Feeling 'in' or 'out' of groups. Playing social roles.",
      insight: "This circuit creates your 'personality' and social self. It's the sum of cultural programming. Most people never question it. Psychedelics (C6) can make you see C4 as constructed rather than absolute.",
      quote: "Who am I in society? What's right and wrong? Who's my tribe?"
    },
    wilber: {
      name: "Mythic (Amber) → Pluralistic (Green)",
      isState: false,
      description: "Amber: Ethnocentric, clear social hierarchy. Orange: Achievement-oriented roles, merit-based. Green: World-centric, egalitarian, multiple identities celebrated.",
      characteristics: "Social identity development. Moral frameworks. Relationship to community. Sexual/gender identity.",
      insight: "Same social-moral circuit, different stages of complexity: Amber: 'Be a good Christian man/woman in your proper role.' Orange: 'Be successful; relationships should work for both.' Green: 'All identities valid; dismantle oppressive structures.'"
    },
    relationship: {
      similarity: "Both recognize a stage/circuit centered on social identity, moral codes, sexuality, and cultural programming.",
      difference: "Leary: One socio-sexual circuit (though acknowledges it's culturally programmed). Wilber: Maps the EVOLUTION of moral/social thinking (Amber → Orange → Green).",
      keyInsight: "Everyone has a 'social self' (C4). But that self can be: Traditional and role-based (Amber), Individual and achievement-based (Orange), Inclusive and justice-oriented (Green), Integrative and systems-aware (Teal)."
    },
    color: "#32CD32",
    wilberColor: "#00FF00"
  },
  {
    number: 5,
    leary: {
      name: "Neurosomatic Circuit",
      shortName: "C5: Somatic Bliss",
      description: "'Rapture circuit' - body-based bliss. First post-terrestrial circuit. Governs somatic ecstasy, sensory enhancement, hedonic consciousness.",
      when_active: "Body high, sensory enhancement. Time slows down. Euphoria without reason. Everything feels good. Synesthesia possible. Hedonic glow.",
      insight: "This circuit is mostly dormant in ordinary consciousness. When activated, you realize pleasure and bliss are neurological states, not dependent on external rewards. This can free you from addiction to external validation.",
      quote: "I feel incredible, alive in every cell, like my body is made of light and pleasure."
    },
    wilber: {
      name: "Somatic Bliss State (Accessible from Any Stage)",
      isState: true,
      description: "A STATE of somatic bliss - which can be accessed from any developmental stage. Traditionally through cannabis, tantra, yoga mastery, ecstatic practices.",
      characteristics: "Temporary experience of body euphoria. Can be accessed through practice or substances. NOT a developmental stage.",
      insight: "Somatic bliss is a state anyone can access (dancers, yogis, athletes, cannabis users), but your developmental stage determines: Whether you seek it addictively or use it wisely. How you interpret what's happening. Whether it leads to growth or spiritual bypassing.",
      stageInterpretations: {
        "Red": "I feel amazing, I'm invincible! - Interprets as personal power, might become hedonistic",
        "Amber": "This is divine grace OR this is sinful pleasure - Interprets religiously",
        "Orange": "Interesting endorphin response, I should track this - Interprets scientifically",
        "Green": "This healing should be available to everyone - Interprets through social justice lens",
        "Teal": "Somatic intelligence arising - Interprets as one state among many, doesn't cling"
      }
    },
    relationship: {
      similarity: "Both recognize somatic bliss as a distinct territory of consciousness.",
      difference: "Leary: C5 is a new circuit that most people haven't activated - it's evolutionary potential. Wilber: Somatic bliss is a STATE anyone can access, but your developmental STAGE determines how you relate to it.",
      keyInsight: "You can be highly developed (Teal) and never access C5. You can frequently access C5 (through cannabis) but remain at Red or Amber. State access ≠ stage development.",
      warning: "⚠️ THE GREAT DIVIDE: From here on, Leary and Wilber fundamentally diverge. Leary sees C5-8 as evolutionary circuits to activate. Wilber sees them as STATES accessible from any STAGE. This distinction is crucial."
    },
    color: "#4169E1",
    wilberColor: "#1E90FF"
  },
  {
    number: 6,
    leary: {
      name: "Neuroelectric/Metaprogramming Circuit",
      shortName: "C6: Reprogramming",
      description: "'Reprogramming consciousness' - the mind editing itself. Governs belief system recognition, reality-tunnel flexibility, self-authoring. The 'psychedelic' circuit.",
      when_active: "Thoughts themselves become objects of awareness. Beliefs visible as constructs, not truths. Reality feels malleable. Meta-cognitive clarity. 'Aha!' insights cascade.",
      insight: "C6 lets you see and edit the programs C1-4 installed. You realize your personality, beliefs, and reality-tunnel are constructed. This is the 'psychedelic' circuit - not just from drugs, but any practice that lets you reprogram your mind.",
      quote: "I can see how I created this belief, this fear, this story - and I can choose differently."
    },
    wilber: {
      name: "Meta-Awareness States (Subtle/Causal)",
      isState: true,
      description: "Access to meta-awareness - witnessing consciousness, ability to observe and shift mental content. Traditionally through LSD, psilocybin, meditation retreats, intensive therapy.",
      characteristics: "Temporary capacity to see beliefs as beliefs. Powerful for insight and growth. But you return to your baseline stage.",
      insight: "Meta-awareness states are real and powerful, but your stage determines what you can reprogram: Can't reprogram beyond your current stage's complexity. A person at Orange can't truly think in Teal without years of development. Psychedelics give temporary access; development requires integration work.",
      stageInterpretations: {
        "Amber": "Might see specific dogma as constructed, but usually doubles down on 'the truth'",
        "Orange": "Therapeutic insights - 'I see how my childhood created this pattern'",
        "Green": "Deconstructs oppressive narratives, may become relativistic",
        "Teal": "Sees ALL perspectives as partial truths, can hold multiple contradictory programs"
      }
    },
    relationship: {
      similarity: "Both recognize meta-awareness as a distinct mode - the ability to see and edit your mental programming.",
      difference: "Leary: C6 = THE psychedelic circuit - grants god-like power to edit your mind. Wilber: Powerful STATE for insight, but can't reprogram beyond your current STAGE's capacity. Temporary access ≠ permanent transformation.",
      keyInsight: "Use C6 states to ACCELERATE growth through your current stage's challenges, not to SKIP stages. Integration is key.",
      warning: "Without grounding in C1-4 and healthy stage development, C6 can lead to spiritual inflation or dissociation."
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

// Particle system for dynamic backgrounds
function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      opacity: number;
      color: string;
      pulse: number;
    }

    const particles: Particle[] = [];
    const colors = ['#a855f7', '#06b6d4', '#0ea5e9', '#8b5cf6', '#6366f1'];

    // Create particles
    for (let i = 0; i < 20; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
        opacity: Math.random() * 0.3 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
        pulse: Math.random() * Math.PI * 2
      });
    }

    let animationId: number;
    let time = 0;

    const animate = () => {
      time += 0.01;

      // Clear with gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
      gradient.addColorStop(0.5, 'rgba(10, 10, 10, 1)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += 0.02;

        // Wrap around edges
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Pulsing opacity
        const pulseOpacity = p.opacity + Math.sin(p.pulse) * 0.15;

        // Draw glow
        const glowGradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 8);
        glowGradient.addColorStop(0, p.color + Math.floor(pulseOpacity * 255).toString(16).padStart(2, '0'));
        glowGradient.addColorStop(1, p.color + '00');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(p.x - p.radius * 8, p.y - p.radius * 8, p.radius * 16, p.radius * 16);

        // Draw core
        ctx.fillStyle = p.color + Math.floor(pulseOpacity * 200).toString(16).padStart(2, '0');
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw connecting lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            ctx.strokeStyle = particles[i].color + Math.floor((1 - distance / 150) * 50).toString(16).padStart(2, '0');
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" />;
}

export default function ConsciousnessGraph({ onClose }: ConsciousnessGraphProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('both');
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedData = selectedLevel !== null ? CONSCIOUSNESS_DATA[selectedLevel - 1] : null;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black z-50 overflow-y-auto"
      style={{
        background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(168, 85, 247, 0.05), transparent 50%),
                     linear-gradient(180deg, rgba(0, 0, 0, 1) 0%, rgba(10, 10, 10, 1) 50%, rgba(0, 0, 0, 1) 100%)`
      }}
    >
      <ParticleBackground />

      <style>{`
        @keyframes glow-pulse {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(168, 85, 247, 0.3)); }
          50% { filter: drop-shadow(0 0 20px rgba(168, 85, 247, 0.7)); }
        }

        @keyframes light-flare {
          0% { opacity: 0; }
          50% { opacity: 0.5; }
          100% { opacity: 0; }
        }

        @keyframes float-up {
          0% { opacity: 0; transform: translateY(20px); }
          50% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-60px); }
        }

        @keyframes rotate-glow {
          0% { transform: rotate(0deg) translateX(100px) rotate(0deg); opacity: 0.2; }
          50% { opacity: 0.5; }
          100% { transform: rotate(360deg) translateX(100px) rotate(-360deg); opacity: 0.2; }
        }

        @keyframes shimmer-scan {
          0% { left: -100%; }
          100% { left: 100%; }
        }

        @keyframes neon-flicker {
          0%, 100% { text-shadow: 0 0 10px rgba(168, 85, 247, 0.8), 0 0 20px rgba(168, 85, 247, 0.4); }
          50% { text-shadow: 0 0 20px rgba(168, 85, 247, 1), 0 0 40px rgba(168, 85, 247, 0.6), 0 0 60px rgba(106, 90, 255, 0.4); }
        }

        .animate-glow-pulse { animation: glow-pulse 4s ease-in-out infinite; }
        .animate-light-flare { animation: light-flare 6s ease-in-out infinite; }
        .animate-neon-flicker { animation: neon-flicker 3s ease-in-out infinite; }

        .consciousness-card {
          position: relative;
          background: linear-gradient(135deg, rgba(30, 30, 40, 0.4), rgba(20, 20, 30, 0.4));
          border: 1px solid rgba(168, 85, 247, 0.2);
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          overflow: hidden;
          backdrop-filter: blur(10px);
        }

        .consciousness-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
                      rgba(168, 85, 247, 0.2), transparent 60%);
          opacity: 0;
          transition: opacity 0.3s;
          pointer-events: none;
        }

        .consciousness-card:hover::before {
          opacity: 1;
        }

        .consciousness-card::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(45deg,
            transparent 0%,
            rgba(255, 255, 255, 0.1) 50%,
            transparent 100%);
          opacity: 0;
          transition: opacity 0.5s;
          pointer-events: none;
        }

        .consciousness-card:hover::after {
          opacity: 1;
          animation: shimmer-scan 2s infinite;
        }

        .consciousness-card:hover {
          border-color: rgba(168, 85, 247, 0.6);
          transform: translateY(-8px) perspective(1000px) rotateX(5deg);
          box-shadow:
            0 20px 40px rgba(168, 85, 247, 0.2),
            0 0 30px rgba(168, 85, 247, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          background: linear-gradient(135deg, rgba(40, 40, 50, 0.6), rgba(30, 30, 45, 0.6));
        }

        .level-orb {
          position: relative;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
        }

        .level-orb::before {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          background: inherit;
          opacity: 0.4;
          filter: blur(8px);
          z-index: -1;
        }

        .consciousness-card:hover .level-orb {
          transform: scale(1.15) translateY(-4px);
          box-shadow: 0 0 50px rgba(0, 0, 0, 0.6);
        }

        .card-content {
          transition: all 0.4s ease;
        }

        .consciousness-card:hover .card-content {
          color: #e0e7ff;
          text-shadow: 0 0 10px rgba(168, 85, 247, 0.3);
        }

        .modal-overlay {
          background: radial-gradient(circle at center, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.95));
          backdrop-filter: blur(8px);
        }

        .modal-content {
          background: linear-gradient(135deg, rgba(30, 30, 45, 0.95), rgba(20, 20, 35, 0.95));
          border: 1px solid rgba(168, 85, 247, 0.3);
          box-shadow:
            0 0 60px rgba(168, 85, 247, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
        }

        .btn-active {
          background: linear-gradient(135deg, rgba(168, 85, 247, 0.8), rgba(139, 92, 246, 0.6));
          box-shadow:
            0 0 30px rgba(168, 85, 247, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          border-color: rgba(168, 85, 247, 0.8);
        }

        .chevron-icon {
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .consciousness-card.selected .chevron-icon {
          transform: rotate(180deg);
        }

        /* Floating light effects */
        .light-ray {
          position: absolute;
          pointer-events: none;
        }
      `}</style>

      {/* Floating light rays */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-light-flare pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-light-flare pointer-events-none" style={{ animationDelay: '3s' }} />

      <div className="relative z-10 min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-start mb-8 relative">
            <div>
              <h1 className="text-6xl md:text-7xl font-black font-mono tracking-tighter mb-2 animate-neon-flicker relative">
                <span className="bg-clip-text text-transparent bg-gradient-to-br from-violet-300 via-cyan-200 to-purple-300">
                  Consciousness Graph
                </span>
              </h1>
              <p className="text-slate-300 text-lg font-light drop-shadow-lg">Leary's 8 Circuits × Wilber's Integral Development</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-violet-300 transition-all p-3 rounded-xl hover:bg-slate-800/50 backdrop-blur-sm group"
            >
              <X size={32} className="group-hover:drop-shadow-lg group-hover:drop-shadow-violet-500/50" />
            </button>
          </div>

          {/* Introduction */}
          {showIntro && (
            <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-violet-500/30 rounded-2xl p-8 mb-8 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-violet-500/5 to-violet-500/0 pointer-events-none" />
              <div className="relative z-10 flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-gradient-to-br from-violet-600/30 to-cyan-600/30 rounded-xl backdrop-blur-sm border border-violet-500/30">
                    <Lightbulb size={32} className="text-violet-300 drop-shadow-lg" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-100">Two Maps, One Territory</h2>
                </div>
                <button
                  onClick={() => setShowIntro(false)}
                  className="text-slate-400 hover:text-slate-200 transition-colors p-2 rounded-lg"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4 text-slate-300 leading-relaxed relative z-10">
                <p>
                  <strong className="text-violet-300 text-lg">Timothy Leary's 8 Circuits</strong> map the different <em>functions</em> of consciousness.
                </p>
                <p>
                  <strong className="text-violet-300 text-lg">Ken Wilber's Integral Stages</strong> map how you <em>develop</em> through life.
                </p>
              </div>
            </div>
          )}

          {/* View Toggles */}
          <div className="flex gap-3 mb-8 flex-wrap">
            {(['both', 'leary', 'wilber'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 backdrop-blur-sm border ${
                  viewMode === mode
                    ? 'btn-active text-white'
                    : 'bg-slate-700/20 text-slate-300 hover:bg-slate-700/40 border-slate-700/40'
                }`}
              >
                {mode === 'both' && <GitCompare className="inline mr-2" size={18} />}
                {mode === 'leary' && <Brain className="inline mr-2" size={18} />}
                {mode === 'wilber' && <Layers className="inline mr-2" size={18} />}
                {mode === 'both' && 'Compare'}
                {mode === 'leary' && 'Leary'}
                {mode === 'wilber' && 'Wilber'}
              </button>
            ))}
          </div>

          {/* Consciousness Cards */}
          <div className="grid grid-cols-1 gap-4 mb-8 relative z-10">
            {CONSCIOUSNESS_DATA.map((level, idx) => (
              <div key={level.number} style={{ animationDelay: `${idx * 50}ms` }} className="group">
                <button
                  onClick={() => setSelectedLevel(selectedLevel === level.number ? null : level.number)}
                  className="consciousness-card w-full text-left p-6 rounded-2xl"
                  style={{
                    '--mouse-x': `${mousePosition.x}px`,
                    '--mouse-y': `${mousePosition.y}px`
                  } as any}
                >
                  <div className="flex items-center gap-6">
                    {/* Level Orb */}
                    <div
                      className="level-orb text-2xl font-bold w-20 h-20 rounded-full flex items-center justify-center text-white font-mono flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${level.color}, ${level.wilberColor})`,
                        boxShadow: `0 0 40px ${level.color}80`
                      }}
                    >
                      {level.number}
                    </div>

                    {/* Content */}
                    <div className="flex-1 card-content">
                      {(viewMode === 'both' || viewMode === 'leary') && (
                        <div>
                          <h3 className="text-lg font-bold text-slate-100 mb-1">{level.leary.shortName}</h3>
                          <p className="text-sm text-slate-400 line-clamp-2">{level.leary.description}</p>
                        </div>
                      )}
                    </div>

                    {(viewMode === 'both' || viewMode === 'wilber') && (
                      <div className="flex-1 card-content">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-slate-100">{level.wilber.name}</h3>
                          <span className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap font-medium ${
                            level.wilber.isState
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {level.wilber.isState ? 'STATE' : 'STAGE'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400 line-clamp-2">{level.wilber.description}</p>
                      </div>
                    )}

                    <ChevronDown
                      size={24}
                      className="chevron-icon text-slate-500 flex-shrink-0 group-hover:text-violet-400 transition-colors"
                    />
                  </div>
                </button>
              </div>
            ))}
          </div>

          {/* Modal */}
          {selectedData && (
            <div className="fixed inset-0 modal-overlay z-40 flex items-center justify-center p-4" onClick={() => setSelectedLevel(null)}>
              <div
                className="modal-content rounded-3xl max-h-[90vh] overflow-y-auto w-full max-w-4xl shadow-2xl relative"
                onClick={e => e.stopPropagation()}
              >
                <div className="sticky top-0 bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-b border-violet-500/30 px-8 py-6 flex justify-between items-start backdrop-blur-xl z-10 flex">
                  <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-cyan-300">
                    Level {selectedData.number} — Deep Dive
                  </h2>
                  <button
                    onClick={() => setSelectedLevel(null)}
                    className="text-slate-400 hover:text-slate-200 transition-colors p-2 rounded-xl hover:bg-slate-700/50"
                  >
                    <X size={28} />
                  </button>
                </div>

                <div className="p-8 space-y-8">
                  {/* Two Column */}
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="border-l-4 pl-5" style={{ borderColor: selectedData.color }}>
                        <h3 className="text-2xl font-bold text-slate-100 mb-3">{selectedData.leary.name}</h3>
                        <p className="text-slate-300 mb-4">{selectedData.leary.description}</p>

                        <div className="bg-neutral-900/50 border border-neutral-500/30 rounded-xl p-4 mb-4">
                          <p className="text-sm text-slate-400 mb-2 font-semibold">When Active:</p>
                          <p className="text-sm text-slate-300">{selectedData.leary.when_active}</p>
                        </div>

                        <div className="bg-violet-900/20 border border-violet-500/30 rounded-xl p-4 mb-4">
                          <p className="text-sm text-violet-300 mb-2 font-semibold">Key Questions:</p>
                          <p className="text-sm text-violet-200 italic">"{selectedData.leary.quote}"</p>
                        </div>

                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                          <p className="text-sm text-slate-400 mb-2 font-semibold">Leary's Insight:</p>
                          <p className="text-sm text-slate-300">{selectedData.leary.insight}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="border-l-4 pl-5" style={{ borderColor: selectedData.wilberColor }}>
                        <div className="flex items-center gap-2 mb-3">
                          <h3 className="text-2xl font-bold text-slate-100">{selectedData.wilber.name}</h3>
                          <span className={`text-xs px-3 py-1 rounded-full font-medium border ${
                            selectedData.wilber.isState
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          }`}>
                            {selectedData.wilber.isState ? 'STATE' : 'STAGE'}
                          </span>
                        </div>
                        <p className="text-slate-300 mb-4">{selectedData.wilber.description}</p>

                        <div className="bg-slate-800/50 rounded-xl p-4 mb-4 border border-slate-700/50">
                          <p className="text-sm text-slate-400 mb-2 font-semibold">Characteristics:</p>
                          <p className="text-sm text-slate-300">{selectedData.wilber.characteristics}</p>
                        </div>

                        <div className="bg-slate-800/50 rounded-xl p-4 mb-4 border border-slate-700/50">
                          <p className="text-sm text-slate-400 mb-2 font-semibold">Wilber's Insight:</p>
                          <p className="text-sm text-slate-300">{selectedData.wilber.insight}</p>
                        </div>

                        {selectedData.wilber.stageInterpretations && (
                          <div className="bg-neutral-900/40 border border-neutral-500/30 rounded-xl p-4">
                            <p className="text-sm text-neutral-300 mb-3 font-semibold">How Different Stages Experience This:</p>
                            <div className="space-y-2.5">
                              {Object.entries(selectedData.wilber.stageInterpretations).map(([stage, interpretation]) => (
                                <div key={stage} className="text-sm">
                                  <span className="text-neutral-400 font-semibold">{stage}:</span>{' '}
                                  <span className="text-slate-300">{interpretation}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Relationships */}
                  <div className="pt-8 border-t border-violet-500/20">
                    <h3 className="text-2xl font-bold text-slate-100 mb-6">How They Relate</h3>

                    <div className="grid md:grid-cols-3 gap-6 mb-6">
                      <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-5">
                        <p className="text-sm text-emerald-300 mb-3 font-semibold">Similarity</p>
                        <p className="text-sm text-slate-300">{selectedData.relationship.similarity}</p>
                      </div>

                      <div className="bg-orange-900/20 border border-orange-500/30 rounded-xl p-5">
                        <p className="text-sm text-orange-300 mb-3 font-semibold">Difference</p>
                        <p className="text-sm text-slate-300">{selectedData.relationship.difference}</p>
                      </div>

                      <div className="bg-violet-900/20 border border-violet-500/30 rounded-xl p-5">
                        <p className="text-sm text-violet-300 mb-3 font-semibold">Key Insight</p>
                        <p className="text-sm text-slate-300">{selectedData.relationship.keyInsight}</p>
                      </div>
                    </div>

                    {selectedData.relationship.warning && (
                      <div className="bg-red-900/20 border-2 border-red-500/40 rounded-xl p-5 flex items-start gap-4">
                        <AlertTriangle size={28} className="text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-red-300 font-semibold mb-1">Important Warning</p>
                          <p className="text-sm text-slate-300">{selectedData.relationship.warning}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
