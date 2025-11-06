import React, { useState } from 'react';
import { JhanaSession, JhanaLevel, JhanaFactor, NimittaType } from '../types.ts';
import { X, ArrowRight, Info, Sparkles, Download, BookOpen, AlertCircle, Lightbulb } from 'lucide-react';

interface JhanaTrackerProps {
  onClose: () => void;
  onSave: (session: JhanaSession) => void;
}

const JHANA_INFO: Record<JhanaLevel, {
  description: string;
  markers: string[];
  howToEnter: string;
  commonMistakes: string[];
  tips: string[];
}> = {
  'Access Concentration': {
    description: 'The threshold state before first jhana. Mind is relatively stable, the five hindrances are suppressed (but not gone), and a nimitta may appear. This is where you develop the skill of staying with pleasant sensations.',
    markers: ['Hindrances quieted (not absent)', 'Sense of gathering/unification beginning', 'Breath becomes subtle', 'Pleasant sensations arising', 'Mind feels somewhat stable'],
    howToEnter: 'Continue developing continuous attention on your meditation object (breath, kasina, metta, etc.). When pleasant sensations arise, gently include them in awareness. Don\'t grasp or push - let concentration naturally collect. The nimitta often appears here as a subtle light or feeling.',
    commonMistakes: ['Trying too hard - forcing concentration', 'Ignoring pleasant sensations when they arise', 'Thinking this IS first jhana (it\'s not)', 'Not staying with it long enough before trying to enter jhana'],
    tips: ['This can be a stable "base camp" - spend time here', 'Learn to recognize when hindrances are suppressed vs. absent', 'If nimitta appears, practice steady attention without grasping', 'This is where most meditators spend their early practice']
  },
  'Momentary Concentration': {
    description: 'Brief moments of strong concentration during insight (vipassana) practice, not sustained absorption. Common in noting practice or during momentary access to jhanic states.',
    markers: ['Flashes of clarity', 'Momentary stillness', 'Brief perceptual shifts', 'Not sustained (seconds, not minutes)', 'Mind temporarily unified'],
    howToEnter: 'This arises naturally during insight practice when mindfulness becomes very continuous. Don\'t try to "enter" it - it\'s a side effect of strong momentary concentration.',
    commonMistakes: ['Trying to sustain it (this interferes)', 'Confusing it with jhana', 'Getting excited when it happens (which breaks it)'],
    tips: ['Just note it and continue practice', 'Useful for insight but different from jhana', 'Can alternate between insight practice and jhana cultivation']
  },
  '1st Jhana': {
    description: 'Sustained absorption with all five jhana factors present: applied attention (vitakka), sustained attention (vicara), joy (piti), happiness (sukha), and unification (ekaggata). You CAN still think and reflect, but attention stays with the pleasant object. The hindrances are completely absent - not suppressed.',
    markers: ['All five factors clearly present', 'Piti (energetic joy, tingling, waves, rapture)', 'Sukha (contentment, ease, bliss)', 'Can think/reflect but mind stays unified', 'Hindrances completely absent', 'Continuous - lasts minutes to hours'],
    howToEnter: 'From access concentration, when the nimitta or pleasant sensations become continuous, gently "step into" them. Let go of effort while maintaining continuity of attention. It feels like settling into a warm bath of pleasure. The key: gentle inclining toward pleasure while letting go of doing.',
    commonMistakes: ['Too much effort - trying to force it', 'Not recognizing it because expecting something more dramatic', 'Thinking you need to stop all thought (you don\'t in 1st)', 'Leaving too soon - stay and stabilize', 'Confusing pleasant access concentration with jhana'],
    tips: ['First jhana CAN feel subtle - don\'t need fireworks', 'Stay for 5-30+ minutes to stabilize', 'Notice all five factors are present', 'The hindrances being completely gone is key', 'Build up time in 1st before trying for 2nd']
  },
  '2nd Jhana': {
    description: 'Thinking (vitakka and vicara) drops away naturally. Only piti, sukha, and ekaggata remain. Stronger unification, more absorbed, less "doing". Mind becomes very bright and confident. Less effortful than first jhana.',
    markers: ['Thinking drops away (no more internal narrative)', 'Piti and sukha intensify', 'Profound confidence and ease', 'Mind very bright, luminous', 'Clearly less effort than 1st jhana', 'Deeper absorption'],
    howToEnter: 'From stable first jhana, notice how thinking is actually a subtle effort. When ready, let go of that effort. Don\'t try to stop thinking - just release the doing of it. Second jhana "receives" you when you stop maintaining first.',
    commonMistakes: ['Trying to stop thoughts (creates tension)', 'Leaving 1st jhana too soon', 'Thinking you\'re in 2nd when still in 1st with less thought', 'Not recognizing increased piti/sukha/brightness as markers'],
    tips: ['Stabilize 1st jhana thoroughly first (weeks/months of practice)', 'The shift feels like "letting go of steering"', 'Piti often becomes very strong here - embrace it', 'This is where concentration practice gets fun', 'Notice the quality of effortlessness']
  },
  '3rd Jhana': {
    description: 'The energetic, rapturous piti fades away, leaving pure contentment (sukha). Equanimity (upekkha) begins to emerge. This is often described as the most pleasant of the jhanas - deep contentment without the intensity of piti. Very refined, peaceful pleasure.',
    markers: ['Piti completely fades/subsides', 'Deep, stable contentment (sukha) remains', 'Equanimity begins to emerge', 'Profoundly peaceful', 'Refined pleasure (less intense than 2nd)', 'Breath may become imperceptible'],
    howToEnter: 'From 2nd jhana, when piti becomes intense or slightly agitating, incline toward the contentment underneath. As you settle into sukha and let go of the energy of piti, 3rd jhana emerges. Feels like waves calming into still, deep waters.',
    commonMistakes: ['Trying to make piti go away (it fades naturally)', 'Missing it because expecting more intensity (it\'s more subtle)', 'Not staying long enough to stabilize', 'Confusing lack of piti with dullness'],
    tips: ['This is many practitioners\' favorite jhana', 'The contentment is very "full" and satisfying', 'Equanimity is present but not dominant yet', 'Can stay here for extended periods', 'Breath often becomes nearly invisible']
  },
  '4th Jhana': {
    description: 'Even sukha fades into pure equanimity (upekkha). Neither pleasant nor unpleasant - neutral-toned but profoundly peaceful. Effortless, spacious, extremely refined. The mind is like a still, clear mirror. Often described as having an "infinite" quality.',
    markers: ['Neither pleasant nor unpleasant (neutral-toned)', 'Perfect, unshakeable equanimity', 'Total ease - no effort whatsoever', 'Mind extremely refined, still, bright', 'Minimal or no body sensation', 'Feels vast, spacious, infinite'],
    howToEnter: 'From 3rd jhana, as even the contentment begins to feel like a subtle agitation, let go into the equanimity underneath. The shift feels like releasing the last attachment to pleasure. Pure, bright, still awareness remains.',
    commonMistakes: ['Thinking it should feel "special" (it\'s remarkably simple)', 'Confusing it with dullness (it\'s very bright and clear)', 'Not recognizing the neutral tone as valid', 'Leaving because "nothing is happening"'],
    tips: ['This is the base for formless jhanas and many insight practices', 'The equanimity is unshakeable - very stable', 'Can feel "boring" but that\'s the mind craving stimulation', 'Extremely useful for purification and insight', 'Gateway to formless realms']
  },
  '5th Jhana': {
    description: 'Infinite Space (Akasanancayatana) - Having mastered 4th jhana, you can transcend even the perception of form. What remains is boundless space. Attention is on infinite, empty, open space.',
    markers: ['Boundless, infinite space', 'No perception of form/body', 'Vast openness', 'Spacious awareness with no center', 'Very refined, peaceful'],
    howToEnter: 'From 4th jhana, deliberately attend to the space around/within the meditation object. As you incline toward space and let go of form, the perception of boundless space emerges. Traditional instructions: "attend to the space left when form is removed."',
    commonMistakes: ['Trying to access without mastering 4th jhana', 'Visualizing space (it\'s a perception, not visualization)', 'Not being precise about the object (space itself)'],
    tips: ['Requires mastery of 4th jhana', 'This is the first "formless" jhana', 'Very peaceful but can feel strange initially', 'Traditional path to deeper formless states']
  },
  '6th Jhana': {
    description: 'Infinite Consciousness (Viññanancayatana) - From infinite space, attention shifts to the consciousness that knows space. Boundless knowing aware of itself. Awareness as object.',
    markers: ['Boundless consciousness/awareness', 'Awareness aware of itself', 'No space - just infinite knowing', 'Very refined, bright', 'Non-dual flavor'],
    howToEnter: 'From 5th jhana, notice the consciousness that is aware of space. Shift attention from space to the knowing itself. As you incline toward infinite awareness, 6th jhana arises.',
    commonMistakes: ['Trying to access before mastering 5th', 'Conceptualizing rather than direct perception', 'Confusing with emptiness insights'],
    tips: ['Even more refined than 5th', 'Can have insight implications', 'Some traditions use this for awakening practices', 'Requires stable formless practice']
  },
  '7th Jhana': {
    description: 'Nothingness (Akincaññayatana) - Attention shifts to the absence itself. Not space, not consciousness - nothing. The perception of "no-thing-ness." Very subtle and hard to describe.',
    markers: ['Perception of nothingness/absence', 'No space, no consciousness as object', 'Very subtle', 'Neither something nor nothing clearly', 'Extremely peaceful'],
    howToEnter: 'From 6th jhana, attend to the absence of even infinite consciousness. The gap, the nothing. Very subtle perceptual shift.',
    commonMistakes: ['Confusing with cessation (nirodha)', 'Too much conceptual overlay', 'Not subtle enough perception'],
    tips: ['Extremely refined practice', 'Requires mastery of previous formless jhanas', 'Can be confusing - work with a teacher', 'Traditional preparation for 8th jhana']
  },
  '8th Jhana': {
    description: 'Neither Perception Nor Non-Perception (Nevasaññanasaññayatana) - The most refined material state possible. Perception is barely present - nearly imperceptible. At the edge of cessation but not quite.',
    markers: ['Extremely subtle', 'Perception barely functioning', 'Hard/impossible to describe accurately', 'At the edge of cessation', 'May not remember clearly afterward'],
    howToEnter: 'From 7th jhana, let go even further into the most refined perception possible. This is at the limit of conditioned experience.',
    commonMistakes: ['Confusing with cessation (nirodha/nibbana)', 'Not having teacher guidance', 'Claiming this prematurely'],
    tips: ['Work with a qualified teacher for formless jhanas', 'This is as far as concentration alone goes', 'Traditional texts say this is not liberating in itself', 'Can be a launching point for cessation (nirodha samapatti)']
  }
};

const FACTOR_EXPLANATIONS = {
  appliedAttention: 'Vitakka (Applied/Initial Attention) - Directing and placing attention on the meditation object. Like touching or reaching toward the object. In 1st jhana, this is clearly present as the mind continues to find and place attention on the pleasant sensations or nimitta. It\'s not effortful, but there\'s a sense of "attending to." This drops away in 2nd jhana.',
  sustainedAttention: 'Vicara (Sustained Attention) - Keeping attention on the object, rubbing or examining it, sustaining contact. Slightly more subtle than vitakka. It\'s the continuity of attention, like keeping your hand on something warm. Present in 1st jhana, drops in 2nd. Some describe it as the "examining" quality.',
  joy: 'Piti (Joy/Rapture) - Energetic, rapturous joy. Physical-emotional. Can manifest as tingling, waves of pleasure, energy coursing through the body, goosebumps, lightness, even shaking or crying. Five grades described in suttas: minor (goosebumps), momentary (flashes), showering (waves), uplifting (feeling of lightness), and pervading (fills whole body). Strong in 1st jhana, stronger in 2nd, fades completely in 3rd.',
  happiness: 'Sukha (Happiness/Bliss) - Contentment, ease, bliss, pleasure. Softer and more emotional-mental than piti. Like deep satisfaction, peace, comfort. While piti is energetic/rapturous, sukha is content/pleasant. Present in 1st, strong in 2nd, becomes the dominant factor in 3rd (without piti), fades in 4th leaving only equanimity.',
  unification: 'Ekaggata (One-Pointedness/Unification) - The mind collected into a unified whole, undistracted, absorbed in the object. Not concentration as effort, but as natural gathering. The mind is "all here," not split or pulled away. Present in all jhanas, becomes progressively more complete and effortless. This is the core of jhana - the mind becomes unified around a single quality.'
};

export default function JhanaTracker({ onClose, onSave }: JhanaTrackerProps) {
  const [step, setStep] = useState<'introduction' | 'basic' | 'jhana' | 'factors' | 'nimitta' | 'phenomenology' | 'notes'>('introduction');

  const [session, setSession] = useState<JhanaSession>({
    id: `jhana-${Date.now()}`,
    date: new Date().toISOString(),
    practice: '',
    duration: 30,
    jhanaLevel: '1st Jhana',
    timeInState: 5,
    factors: {
      appliedAttention: { name: 'Applied Attention (Vitakka)', present: false, intensity: 5 },
      sustainedAttention: { name: 'Sustained Attention (Vicara)', present: false, intensity: 5 },
      joy: { name: 'Joy (Piti)', present: false, intensity: 5 },
      happiness: { name: 'Happiness (Sukha)', present: false, intensity: 5 },
      unification: { name: 'Unification (Ekaggata)', present: false, intensity: 5 }
    },
    nimittaPresent: false,
    bodyExperience: '',
    mindQuality: ''
  });

  const updateFactor = (key: keyof typeof session.factors, updates: Partial<JhanaFactor>) => {
    setSession(prev => ({
      ...prev,
      factors: {
        ...prev.factors,
        [key]: { ...prev.factors[key], ...updates }
      }
    }));
  };

  const canProceed = () => {
    if (step === 'basic') return session.practice.trim() && session.duration > 0;
    if (step === 'phenomenology') return session.bodyExperience.trim() && session.mindQuality.trim();
    return true;
  };

  const handleSave = () => {
    onSave(session);
    onClose();
  };

  const renderIntroduction = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <BookOpen size={48} className="mx-auto text-accent mb-4" />
        <h2 className="text-3xl font-bold text-slate-100 mb-2">What Are Jhanas?</h2>
        <p className="text-slate-400">A brief guide to concentrated absorption states</p>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 space-y-4">
        <h3 className="text-xl font-bold text-slate-100">The Basics</h3>
        <p className="text-slate-300 leading-relaxed">
          <strong className="text-accent">Jhanas</strong> (Sanskrit: dhyānas) are states of deep meditative absorption that arise when the mind becomes completely unified
          around a single pleasant object. They are characterized by profound concentration, joy, contentment, and freedom from the five hindrances
          (desire, aversion, sloth/torpor, restlessness, doubt).
        </p>
        <p className="text-slate-300 leading-relaxed">
          The Buddha taught jhanas as <strong>both skillful states in themselves</strong> (providing rest, purification, and well-being) and as
          <strong> platforms for insight practice</strong> that can lead to liberating wisdom. They are NOT enlightenment, but they are powerful
          tools for transformation.
        </p>
      </div>

      <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-5 space-y-3">
        <div className="flex items-start gap-3">
          <AlertCircle size={24} className="text-blue-400 flex-shrink-0 mt-1" />
          <div className="space-y-2">
            <h4 className="font-bold text-blue-300">Important: Be Honest, Not Aspirational</h4>
            <p className="text-sm text-slate-300">
              It's extremely common for meditators to overestimate their jhanic attainments, especially early on. <strong>Access concentration</strong> (pleasant,
              somewhat stable states with suppressed hindrances) is often mistaken for jhana. True first jhana has ALL five factors present,
              hindrances <em>completely absent</em> (not just weakened), and can be sustained for many minutes.
            </p>
            <p className="text-sm text-slate-300">
              If you're unsure, err on the side of claiming less. It's better to track "Access Concentration" honestly than claim "1st Jhana" prematurely.
              <strong> Progress comes from accurate assessment, not wishful thinking.</strong>
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5 space-y-3">
          <h4 className="font-bold text-accent flex items-center gap-2">
            <Sparkles size={18} />
            The Four Material Jhanas
          </h4>
          <ul className="text-sm text-slate-300 space-y-2">
            <li><strong>1st Jhana:</strong> Thinking, joy, happiness, unification</li>
            <li><strong>2nd Jhana:</strong> Thinking drops, stronger joy & happiness</li>
            <li><strong>3rd Jhana:</strong> Joy fades, pure contentment remains</li>
            <li><strong>4th Jhana:</strong> Perfect equanimity, no pleasure/pain</li>
          </ul>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5 space-y-3">
          <h4 className="font-bold text-purple-300 flex items-center gap-2">
            <Sparkles size={18} />
            The Four Formless Jhanas
          </h4>
          <ul className="text-sm text-slate-300 space-y-2">
            <li><strong>5th:</strong> Infinite Space</li>
            <li><strong>6th:</strong> Infinite Consciousness</li>
            <li><strong>7th:</strong> Nothingness</li>
            <li><strong>8th:</strong> Neither Perception Nor Non-Perception</li>
          </ul>
          <p className="text-xs text-slate-400 italic">*Formless jhanas require mastery of 4th jhana</p>
        </div>
      </div>

      <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-5">
        <h4 className="font-bold text-amber-300 mb-3 flex items-center gap-2">
          <Lightbulb size={18} />
          How Jhanas Develop
        </h4>
        <ol className="text-sm text-slate-300 space-y-2 list-decimal list-inside">
          <li><strong>Build foundational concentration</strong> - Consistent daily practice with a single object (breath, metta, kasina)</li>
          <li><strong>Develop continuous attention</strong> - Reduce mind-wandering through gentle persistence</li>
          <li><strong>Learn to find pleasure in the practice</strong> - Notice and incline toward pleasant sensations</li>
          <li><strong>Reach Access Concentration</strong> - Hindrances suppressed, some stability, nimitta may appear</li>
          <li><strong>Enter 1st Jhana</strong> - When conditions ripen, "step into" the continuous pleasure while letting go of doing</li>
          <li><strong>Stabilize before progressing</strong> - Spend weeks/months mastering each jhana before attempting the next</li>
        </ol>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5 space-y-3">
        <h4 className="font-bold text-slate-100">What This Tracker Is For</h4>
        <p className="text-sm text-slate-300">
          This tool helps you log and track your jhana practice with precision. It's designed to help you:
        </p>
        <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
          <li>Identify which jhana factors are actually present in your sits</li>
          <li>Track your progress over time with honesty and accuracy</li>
          <li>Notice patterns in how you enter, sustain, and exit jhanic states</li>
          <li>Avoid common mistakes like claiming jhanas prematurely</li>
          <li>Develop a clear, phenomenological understanding of your practice</li>
        </ul>
      </div>

      <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-5">
        <h4 className="font-bold text-red-300 mb-2 flex items-center gap-2">
          <AlertCircle size={18} />
          When to Work With a Teacher
        </h4>
        <p className="text-sm text-slate-300">
          While this tracker can support self-practice, jhana practice is traditionally taught one-on-one. Consider working with a qualified teacher if:
        </p>
        <ul className="text-sm text-slate-300 mt-2 space-y-1 list-disc list-inside">
          <li>You're unsure if you're actually experiencing jhana</li>
          <li>You're attempting the formless jhanas (5-8)</li>
          <li>You experience unusual phenomena, fear, or instability</li>
          <li>You want to use jhanas for deep insight or awakening work</li>
        </ul>
      </div>
    </div>
  );

  const renderBasic = () => (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Meditation Session Details</h2>
        <p className="text-slate-400 text-sm">Start by logging the basics of your sit.</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-200 mb-2">
          What practice were you doing?
        </label>
        <input
          type="text"
          value={session.practice}
          onChange={(e) => setSession(prev => ({ ...prev, practice: e.target.value }))}
          placeholder="e.g., Breath meditation, Metta, Kasina, Body scanning..."
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-2">
            Total Duration (minutes)
          </label>
          <input
            type="number"
            value={session.duration}
            onChange={(e) => setSession(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-2">
            Time in Jhana/Absorption (minutes)
          </label>
          <input
            type="number"
            value={session.timeInState}
            onChange={(e) => setSession(prev => ({ ...prev, timeInState: parseInt(e.target.value) || 0 }))}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>
      </div>
    </div>
  );

  const renderJhanaSelection = () => {
    const [expandedJhana, setExpandedJhana] = useState<JhanaLevel | null>(null);

    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Which Jhana/State?</h2>
          <p className="text-slate-400 text-sm">Select the deepest state you reached. Click for detailed guidance.</p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {(Object.keys(JHANA_INFO) as JhanaLevel[]).map(jhana => {
            const info = JHANA_INFO[jhana];
            const isExpanded = expandedJhana === jhana;
            const isSelected = session.jhanaLevel === jhana;

            return (
              <div key={jhana} className="space-y-2">
                <button
                  onClick={() => {
                    setSession(prev => ({ ...prev, jhanaLevel: jhana }));
                    setExpandedJhana(isExpanded ? null : jhana);
                  }}
                  className={`w-full text-left p-4 rounded-lg border-2 transition ${
                    isSelected
                      ? 'border-accent bg-accent/10'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-slate-100">{jhana}</h3>
                    <Info size={16} className={`${isSelected ? 'text-accent' : 'text-slate-500'} transition`} />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{info.description}</p>
                  {!isExpanded && (
                    <p className="text-xs text-accent mt-2">Click for detailed guide →</p>
                  )}
                </button>

                {isExpanded && (
                  <div className="ml-4 space-y-3 animate-fade-in">
                    <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 space-y-3">
                      <div>
                        <h4 className="text-sm font-bold text-green-300 mb-1 flex items-center gap-2">
                          <Sparkles size={14} />
                          Key Markers
                        </h4>
                        <ul className="text-xs text-slate-400 space-y-1">
                          {info.markers.map((marker, i) => (
                            <li key={i}>• {marker}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-blue-300 mb-1 flex items-center gap-2">
                          <BookOpen size={14} />
                          How to Enter
                        </h4>
                        <p className="text-xs text-slate-300">{info.howToEnter}</p>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-amber-300 mb-1 flex items-center gap-2">
                          <AlertCircle size={14} />
                          Common Mistakes
                        </h4>
                        <ul className="text-xs text-slate-300 space-y-1">
                          {info.commonMistakes.map((mistake, i) => (
                            <li key={i}>• {mistake}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-purple-300 mb-1 flex items-center gap-2">
                          <Lightbulb size={14} />
                          Tips
                        </h4>
                        <ul className="text-xs text-slate-300 space-y-1">
                          {info.tips.map((tip, i) => (
                            <li key={i}>• {tip}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderFactors = () => {
    const relevantFactors = ['1st Jhana', '2nd Jhana', '3rd Jhana', '4th Jhana'].includes(session.jhanaLevel);

    if (!relevantFactors) {
      return (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-6 text-center">
            <Info size={32} className="mx-auto text-blue-400 mb-3" />
            <p className="text-slate-300">
              The five jhana factors apply primarily to the first four jhanas. The formless jhanas (5-8) are characterized differently.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 mb-2">The Five Jhana Factors</h2>
          <p className="text-slate-400 text-sm">Rate the presence and intensity of each factor in your {session.jhanaLevel}.</p>
        </div>

        {(Object.keys(session.factors) as Array<keyof typeof session.factors>).map(key => {
          const factor = session.factors[key];
          const explanation = FACTOR_EXPLANATIONS[key];

          return (
            <div key={key} className="bg-slate-800/50 border border-slate-700 rounded-lg p-5">
              <div className="flex items-start gap-3 mb-3">
                <input
                  type="checkbox"
                  checked={factor.present}
                  onChange={(e) => updateFactor(key, { present: e.target.checked })}
                  className="mt-1 w-5 h-5 rounded border-slate-600 text-accent focus:ring-accent/50"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-slate-100">{factor.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{explanation}</p>
                </div>
              </div>

              {factor.present && (
                <div className="ml-8 space-y-3 animate-fade-in">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-300">Intensity</span>
                      <span className="text-accent font-semibold">{factor.intensity}/10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={factor.intensity}
                      onChange={(e) => updateFactor(key, { intensity: parseInt(e.target.value) })}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-accent"
                    />
                  </div>
                  <input
                    type="text"
                    value={factor.notes || ''}
                    onChange={(e) => updateFactor(key, { notes: e.target.value })}
                    placeholder="Any specific notes about this factor?"
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-accent/50"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderNimitta = () => (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Nimitta (Sign)</h2>
        <p className="text-slate-400 text-sm">The nimitta is a mental image/sensation that can arise as concentration deepens.</p>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={session.nimittaPresent}
            onChange={(e) => setSession(prev => ({ ...prev, nimittaPresent: e.target.checked }))}
            className="w-5 h-5 rounded border-slate-600 text-accent focus:ring-accent/50"
          />
          <span className="font-semibold text-slate-100">A nimitta was present</span>
        </label>
      </div>

      {session.nimittaPresent && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">Type of Nimitta</label>
            <select
              value={session.nimittaType || 'Visual Light'}
              onChange={(e) => setSession(prev => ({ ...prev, nimittaType: e.target.value as NimittaType }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent/50"
            >
              <option value="Visual Light">Visual Light (bright spot, color, glow)</option>
              <option value="Tactile Sensation">Tactile Sensation (pressure, tingling, warmth)</option>
              <option value="Auditory">Auditory (internal sound)</option>
              <option value="Whole-Body">Whole-Body (suffused sensation)</option>
              <option value="Spatial">Spatial (sense of space/openness)</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">Describe the Nimitta</label>
            <textarea
              value={session.nimittaDescription || ''}
              onChange={(e) => setSession(prev => ({ ...prev, nimittaDescription: e.target.value }))}
              placeholder="What did it look/feel like? How did it change?"
              className="w-full h-24 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-300">Stability (how steady was it?)</span>
              <span className="text-accent font-semibold">{session.nimittaStability || 5}/10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={session.nimittaStability || 5}
              onChange={(e) => setSession(prev => ({ ...prev, nimittaStability: parseInt(e.target.value) }))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-accent"
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderPhenomenology = () => (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Phenomenology</h2>
        <p className="text-slate-400 text-sm">Describe the direct experience of body and mind.</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-200 mb-2">
          Body Experience
        </label>
        <textarea
          value={session.bodyExperience}
          onChange={(e) => setSession(prev => ({ ...prev, bodyExperience: e.target.value }))}
          placeholder="How did the body feel? Dissolved? Heavy? Light? Tingling? Still?"
          className="w-full h-24 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-200 mb-2">
          Mind Quality
        </label>
        <textarea
          value={session.mindQuality}
          onChange={(e) => setSession(prev => ({ ...prev, mindQuality: e.target.value }))}
          placeholder="Bright? Stable? Spacious? Dull? Restless? Unified?"
          className="w-full h-24 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-200 mb-2">
          Hindrances Encountered (optional)
        </label>
        <input
          type="text"
          value={session.hindrances?.join(', ') || ''}
          onChange={(e) => setSession(prev => ({ ...prev, hindrances: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
          placeholder="e.g., restlessness, doubt, drowsiness..."
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
      </div>
    </div>
  );

  const renderNotes = () => (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Progress Notes</h2>
        <p className="text-slate-400 text-sm">Reflect on this session in context of your practice.</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-200 mb-2">
          Comparison to Previous Sits
        </label>
        <textarea
          value={session.comparison || ''}
          onChange={(e) => setSession(prev => ({ ...prev, comparison: e.target.value }))}
          placeholder="How does this compare to recent meditation sessions? Deeper? Shallower? Different quality?"
          className="w-full h-20 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-200 mb-2">
          Insights or Realizations
        </label>
        <textarea
          value={session.insights || ''}
          onChange={(e) => setSession(prev => ({ ...prev, insights: e.target.value }))}
          placeholder="Any insights about the practice, the mind, or the nature of experience?"
          className="w-full h-20 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-200 mb-2">
          Difficulties or Challenges
        </label>
        <textarea
          value={session.difficulties || ''}
          onChange={(e) => setSession(prev => ({ ...prev, difficulties: e.target.value }))}
          placeholder="What was difficult? What's getting in the way?"
          className="w-full h-20 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-200 mb-2">
          Questions for Teacher/Sangha
        </label>
        <textarea
          value={session.questions || ''}
          onChange={(e) => setSession(prev => ({ ...prev, questions: e.target.value }))}
          placeholder="What questions do you have about this experience?"
          className="w-full h-20 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
      </div>
    </div>
  );

  const steps = ['introduction', 'basic', 'jhana', 'factors', 'nimitta', 'phenomenology', 'notes'] as const;
  const currentStepIndex = steps.indexOf(step);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-6 z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Sparkles size={28} className="text-accent" />
              <h1 className="text-2xl font-bold text-slate-100">Jhana/Samadhi Tracker</h1>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition">
              <X size={24} className="text-slate-400" />
            </button>
          </div>

          {/* Progress */}
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div
              className="bg-accent rounded-full h-2 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">
            Step {currentStepIndex + 1} of {steps.length}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'introduction' && renderIntroduction()}
          {step === 'basic' && renderBasic()}
          {step === 'jhana' && renderJhanaSelection()}
          {step === 'factors' && renderFactors()}
          {step === 'nimitta' && renderNimitta()}
          {step === 'phenomenology' && renderPhenomenology()}
          {step === 'notes' && renderNotes()}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-900 border-t border-slate-700 p-6 flex justify-between">
          {currentStepIndex > 0 && (
            <button
              onClick={() => setStep(steps[currentStepIndex - 1])}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition"
            >
              Back
            </button>
          )}
          <div className="flex-1" />
          {currentStepIndex < steps.length - 1 ? (
            <button
              onClick={() => setStep(steps[currentStepIndex + 1])}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-6 py-2 btn-luminous rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next
              <ArrowRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2 btn-luminous rounded-lg font-semibold transition"
            >
              <Sparkles size={20} />
              Save Session
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
