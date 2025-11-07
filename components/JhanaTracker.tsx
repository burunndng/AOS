import React, { useState } from 'react';
import { JhanaSession, JhanaLevel, JhanaFactor, NimittaType } from '../types.ts';
import { X, ArrowRight, Info, Sparkles, Book, Target, Lightbulb, CheckCircle } from 'lucide-react';

interface JhanaTrackerProps {
  onClose: () => void;
  onSave: (session: JhanaSession) => void;
}

const JHANA_INFO: Record<JhanaLevel, {
  description: string;
  markers: string[];
  howToRecognize: string;
  commonMistakes: string[];
  developmentTips: string[];
}> = {
  'Access Concentration': {
    description: 'The threshold state before jhana. Mind is relatively stable, hindrances are suppressed, nimitta may appear.',
    markers: ['Hindrances quieted', 'Sense of gathering/unification beginning', 'Breath becomes subtle', 'Pleasant sensations arising'],
    howToRecognize: 'The mind feels collected and relatively still, but not yet in full absorption. You can still think clearly about the meditation object. Pleasant sensations may arise, but they\'re not overwhelming. This is the "doorway" to jhana.',
    commonMistakes: [
      'Mistaking momentary concentration for access concentration',
      'Trying to force entry into jhana rather than allowing natural deepening',
      'Getting distracted by the pleasant sensations instead of staying with the object'
    ],
    developmentTips: [
      'Learn to recognize when hindrances have temporarily subsided',
      'Practice sustaining attention on the breath or chosen object without forcing',
      'Notice the natural deepening of concentration as you relax into the practice',
      'Be patient - access concentration is a skill that develops over time'
    ]
  },
  'Momentary Concentration': {
    description: 'Brief moments of strong concentration during insight practice, not sustained absorption.',
    markers: ['Flashes of clarity', 'Momentary stillness', 'Brief perceptual shifts', 'Not sustained'],
    howToRecognize: 'Quick moments of heightened clarity or stillness that come and go during meditation. These are not sustained states but rather glimpses of deeper concentration.',
    commonMistakes: [
      'Confusing momentary concentration with jhana',
      'Trying to hold onto these moments instead of letting them pass naturally'
    ],
    developmentTips: [
      'Note these moments but don\'t chase them',
      'Use them as indicators that your practice is deepening',
      'Continue with your practice without attachment to these experiences'
    ]
  },
  '1st Jhana': {
    description: 'Sustained absorption with all five factors present. Characterized by thinking about the object, joy (piti), and happiness (sukha).',
    markers: ['Applied & sustained attention to object', 'Piti (energetic joy, tingling, waves)', 'Sukha (contentment, ease)', 'Unification (one-pointed)', 'Can still think/reflect'],
    howToRecognize: 'The mind is absorbed in the meditation object with clear, sustained focus. You feel energetic joy (piti) that might manifest as tingling, waves of energy, or rapture, along with contentment (sukha). You can still think about the object and recognize "I am in jhana." All five factors are clearly present.',
    commonMistakes: [
      'Thinking every pleasant meditation is 1st jhana',
      'Not recognizing all five factors must be present',
      'Breaking the jhana by investigating it too analytically',
      'Confusing strong concentration with actual absorption'
    ],
    developmentTips: [
      'Learn to recognize each of the five factors individually',
      'Practice sustaining the state without excessive investigation',
      'Allow piti and sukha to arise naturally - don\'t manufacture them',
      'Notice how thinking gradually becomes more refined as you stabilize',
      'Start with 5-10 minute absorptions and gradually extend duration'
    ]
  },
  '2nd Jhana': {
    description: 'Thinking drops away. Stronger unification with piti and sukha. More absorbed, less doing.',
    markers: ['No more applied/sustained thought', 'Piti and sukha increase', 'Greater ease and confidence', 'Mind very bright', 'Less effort needed'],
    howToRecognize: 'The verbal/thinking quality of 1st jhana falls away. You\'re simply unified with the meditation object without needing to "think about" it. Joy and happiness intensify, and there\'s a sense of effortlessness. The mind feels very bright and clear.',
    commonMistakes: [
      'Trying to force thinking to stop rather than letting it naturally fade',
      'Clinging to the intense piti instead of allowing natural progression',
      'Not trusting the simplicity of just "being with" the object'
    ],
    developmentTips: [
      'Let go of any need to verbally note or think about the object',
      'Trust the unification - you don\'t need to "do" anything',
      'Notice the shift from "attending to" the object to "being unified with" it',
      'Practice transitioning smoothly from 1st to 2nd jhana',
      'Develop confidence in the stability of this state'
    ]
  },
  '3rd Jhana': {
    description: 'Energetic piti fades, leaving pure contentment (sukha). Equanimous happiness.',
    markers: ['Piti subsides', 'Deep contentment remains', 'Equanimity begins', 'Very refined pleasure', 'Profoundly peaceful'],
    howToRecognize: 'The energetic, buzzy quality of piti fades into the background, leaving a sublime contentment. There\'s still pleasure, but it\'s more refined - like a deep satisfaction rather than excitement. Equanimity strengthens. This is often described as "happiness without the joy."',
    commonMistakes: [
      'Trying to hold onto 2nd jhana\'s piti instead of allowing natural progression',
      'Mistaking dullness for the peace of 3rd jhana',
      'Not recognizing the subtle pleasure that\'s still present'
    ],
    developmentTips: [
      'Learn to appreciate the refined pleasure of sukha without piti',
      'Notice how equanimity allows the state to be more stable',
      'Don\'t confuse the calmness with dullness - awareness remains bright',
      'Practice recognizing this state\'s unique quality of contentment',
      'This is often the most comfortable jhana for sustained practice'
    ]
  },
  '4th Jhana': {
    description: 'Even sukha fades into pure equanimity. Effortless, spacious, neutral-toned absorption.',
    markers: ['Neither pleasant nor unpleasant', 'Perfect equanimity', 'Total ease', 'Mind extremely refined', 'Minimal body sensation'],
    howToRecognize: 'Even the subtle pleasure of 3rd jhana fades into pure equanimity and neutrality. The breath may become imperceptible. There\'s perfect stillness and balance - neither pleasant nor unpleasant, just profoundly unified and peaceful. Body sensations may nearly disappear.',
    commonMistakes: [
      'Confusing the neutral tone with dullness or spacing out',
      'Thinking "nothing is happening" when actually deeply absorbed',
      'Getting frightened by the disappearance of body sensations',
      'Not recognizing this as a valid jhana because it lacks obvious pleasure'
    ],
    developmentTips: [
      'Trust the neutral, equanimous quality - it\'s not dullness',
      'Notice the profound stillness and unification despite lack of pleasure',
      'This state is ideal for insight practice or transitioning to formless jhanas',
      'Practice emerging slowly and mindfully to maintain continuity',
      'The purity and stability of 4th jhana makes it a powerful base state'
    ]
  },
  '5th Jhana': {
    description: 'Infinite Space - perception of boundless space after dropping attention to material form.',
    markers: ['Boundless space', 'No form perception', 'Vast openness', 'Spacious awareness'],
    howToRecognize: 'From 4th jhana, attention to material form is released, and consciousness expands into perception of infinite space. It\'s like the walls of perception dissolve and there\'s only boundless openness.',
    commonMistakes: [
      'Visualizing space rather than resting in the perception of spaciousness',
      'Trying to enter without sufficient stability in 4th jhana',
      'Getting caught in conceptual ideas about "infinite space"'
    ],
    developmentTips: [
      'Stabilize 4th jhana first before attempting formless states',
      'Let go of attention to any material form or body sensation',
      'Rest in the perception of boundless openness without effort',
      'This is a perceptual shift, not a visualization exercise'
    ]
  },
  '6th Jhana': {
    description: 'Infinite Consciousness - awareness aware of itself, boundless knowing.',
    markers: ['Boundless consciousness', 'Aware of awareness', 'No space, just knowing', 'Very refined'],
    howToRecognize: 'Attention shifts from space to the consciousness that perceives space. Awareness becomes aware of itself - boundless knowing without any object.',
    commonMistakes: [
      'Thinking about consciousness instead of resting as consciousness',
      'Getting tangled in conceptual understanding rather than direct experience'
    ],
    developmentTips: [
      'Transition from 5th jhana by turning attention to the knowing itself',
      'Let go of the perception of space and rest as pure awareness',
      'This is consciousness knowing itself without an external object'
    ]
  },
  '7th Jhana': {
    description: 'Nothingness - perception that there is nothing, no thing-ness.',
    markers: ['Perception of nothingness', 'Absence', 'Very subtle', 'Neither something nor nothing clearly'],
    howToRecognize: 'A shift to perceiving "no-thing-ness" - neither space nor consciousness as objects. There\'s just a perception of absence or nothing.',
    commonMistakes: [
      'Confusing this with cessation or nibbana',
      'Trying to conceptualize "nothing" instead of resting in the perception'
    ],
    developmentTips: [
      'Let go of infinite consciousness perception',
      'Rest in the perception of absence without making it into something',
      'Extremely subtle - don\'t expect anything dramatic'
    ]
  },
  '8th Jhana': {
    description: 'Neither Perception Nor Non-Perception - the most refined material state, nearly imperceptible.',
    markers: ['Extremely subtle', 'Hard to describe', 'Perception barely present', 'At the edge of cessation'],
    howToRecognize: 'Perception is so refined it\'s barely present - not quite perception, not quite non-perception. This is at the very edge of consciousness before cessation.',
    commonMistakes: [
      'Expecting to clearly know you\'re in this state while in it',
      'Confusing it with dullness or falling asleep'
    ],
    developmentTips: [
      'This state is often only clearly recognized in retrospect',
      'Requires very refined concentration developed over long practice',
      'Not necessary for awakening - focus on 1st-4th jhanas first',
      'Can serve as springboard for cessation experiences'
    ]
  }
};

const FACTOR_EXPLANATIONS = {
  appliedAttention: {
    pali: 'Vitakka',
    definition: 'Directing attention to the meditation object. The initial placement of mind.',
    howToWork: 'Gently place attention on your chosen object (breath, kasina, body sensation). Like touching the object with awareness. Not forcing, just clear contact.',
    signs: 'You can clearly direct your attention where you want it to go. The mind "reaches out" to the object.'
  },
  sustainedAttention: {
    pali: 'Vicara',
    definition: 'Keeping attention on the object. Rubbing, sustaining contact.',
    howToWork: 'Once attention is placed, sustain contact with the object. Like rubbing or massaging - maintaining continuous connection without drifting away.',
    signs: 'Attention remains with the object continuously. You\'re not just touching it momentarily but staying with it.'
  },
  joy: {
    pali: 'Piti',
    definition: 'Energetic joy. Can feel like tingling, waves, rapture, energy flowing through body.',
    howToWork: 'Don\'t manufacture piti - let it arise naturally as concentration deepens. It often starts subtle and builds. Enjoy it without getting lost in it.',
    signs: 'Tingles, waves of energy, goosebumps, rapture, excitement, bright energy. Can be gentle or intense.'
  },
  happiness: {
    pali: 'Sukha',
    definition: 'Contentment, ease, bliss. Softer than piti, more like deep satisfaction.',
    howToWork: 'Notice the ease and contentment that comes with stable concentration. Softer and more suffused than piti. Like a warm glow of well-being.',
    signs: 'Contentment, ease, satisfaction, well-being, comfort. Less energetic than piti, more peaceful.'
  },
  unification: {
    pali: 'Ekaggata',
    definition: 'One-pointedness. Mind collected, undistracted, absorbed in object.',
    howToWork: 'As other factors strengthen, the mind naturally unifies around the object. Everything comes together into coherent, stable absorption.',
    signs: 'Mind feels collected, unified, coherent. Distractions drop away. Strong sense of "wholeness" or "togetherness."'
  }
};

export default function JhanaTracker({ onClose, onSave }: JhanaTrackerProps) {
  const [mode, setMode] = useState<'guide' | 'practice-log'>('guide');
  const [selectedJhana, setSelectedJhana] = useState<JhanaLevel>('1st Jhana');
  const [view, setView] = useState<'overview' | 'factors' | 'log'>('overview');

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

  const renderGuideMode = () => {
    const jhana = JHANA_INFO[selectedJhana];
    const isFormJhana = ['1st Jhana', '2nd Jhana', '3rd Jhana', '4th Jhana'].includes(selectedJhana);

    return (
      <div className="space-y-6">
        {/* Mode Selector */}
        <div className="flex gap-2 bg-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setMode('guide')}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition ${
              mode === 'guide' ? 'bg-accent text-slate-900' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Book size={16} className="inline mr-2" />
            Instructional Guide
          </button>
          <button
            onClick={() => setMode('practice-log')}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition ${
              mode === 'practice-log' ? 'bg-accent text-slate-900' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles size={16} className="inline mr-2" />
            Log Practice Session
          </button>
        </div>

        {/* Jhana Selector */}
        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-3">
            Select Jhana State to Learn About:
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {(Object.keys(JHANA_INFO) as JhanaLevel[]).map(jhana => (
              <button
                key={jhana}
                onClick={() => setSelectedJhana(jhana)}
                className={`text-left p-3 rounded-lg border-2 transition text-sm ${
                  selectedJhana === jhana
                    ? 'border-accent bg-accent/10 font-semibold'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                }`}
              >
                {jhana}
              </button>
            ))}
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex gap-2 border-b border-slate-700">
          <button
            onClick={() => setView('overview')}
            className={`px-4 py-2 font-medium transition border-b-2 ${
              view === 'overview'
                ? 'border-accent text-accent'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Overview
          </button>
          {isFormJhana && (
            <button
              onClick={() => setView('factors')}
              className={`px-4 py-2 font-medium transition border-b-2 ${
                view === 'factors'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Jhana Factors
            </button>
          )}
        </div>

        {/* Content */}
        {view === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h3 className="text-xl font-bold text-slate-100 mb-3">{selectedJhana}</h3>
              <p className="text-slate-300 leading-relaxed">{jhana.description}</p>
            </div>

            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <Target className="text-blue-400" size={20} />
                <h4 className="font-bold text-slate-100">How to Recognize This State</h4>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{jhana.howToRecognize}</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5">
              <h4 className="font-bold text-slate-100 mb-3">Key Markers:</h4>
              <ul className="space-y-2">
                {jhana.markers.map((marker, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                    <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span>{marker}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-orange-900/20 border border-orange-700/50 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <Info className="text-orange-400" size={20} />
                <h4 className="font-bold text-slate-100">Common Mistakes</h4>
              </div>
              <ul className="space-y-2">
                {jhana.commonMistakes.map((mistake, i) => (
                  <li key={i} className="text-slate-300 text-sm">• {mistake}</li>
                ))}
              </ul>
            </div>

            <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="text-green-400" size={20} />
                <h4 className="font-bold text-slate-100">Development Tips</h4>
              </div>
              <ul className="space-y-2">
                {jhana.developmentTips.map((tip, i) => (
                  <li key={i} className="text-slate-300 text-sm">• {tip}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {view === 'factors' && isFormJhana && (
          <div className="space-y-5 animate-fade-in">
            {(Object.keys(FACTOR_EXPLANATIONS) as Array<keyof typeof FACTOR_EXPLANATIONS>).map(key => {
              const factor = FACTOR_EXPLANATIONS[key];
              return (
                <div key={key} className="bg-slate-800/50 border border-slate-700 rounded-lg p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                      <Sparkles size={20} className="text-accent" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-100">{factor.pali}</h4>
                      <p className="text-xs text-slate-400">{factor.definition}</p>
                    </div>
                  </div>

                  <div className="space-y-3 ml-13">
                    <div>
                      <h5 className="text-sm font-semibold text-slate-200 mb-1">How to Work With It:</h5>
                      <p className="text-sm text-slate-300">{factor.howToWork}</p>
                    </div>

                    <div>
                      <h5 className="text-sm font-semibold text-slate-200 mb-1">Signs It's Present:</h5>
                      <p className="text-sm text-slate-300">{factor.signs}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderPracticeLog = () => {
    // Simplified practice log - keeping the essential logging functionality
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Mode Selector */}
        <div className="flex gap-2 bg-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setMode('guide')}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition ${
              mode === 'guide' ? 'bg-accent text-slate-900' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Book size={16} className="inline mr-2" />
            Instructional Guide
          </button>
          <button
            onClick={() => setMode('practice-log')}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition ${
              mode === 'practice-log' ? 'bg-accent text-slate-900' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles size={16} className="inline mr-2" />
            Log Practice Session
          </button>
        </div>

        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
          <p className="text-slate-300 text-sm">
            <Info size={16} className="inline mr-2 text-blue-400" />
            Quick log for tracking your meditation sessions. For detailed guidance on jhana states, switch to Instructional Guide mode.
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-2">
            Practice Type
          </label>
          <input
            type="text"
            value={session.practice}
            onChange={(e) => setSession(prev => ({ ...prev, practice: e.target.value }))}
            placeholder="e.g., Breath meditation, Metta, Kasina..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              Duration (min)
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
              Deepest State Reached
            </label>
            <select
              value={session.jhanaLevel}
              onChange={(e) => setSession(prev => ({ ...prev, jhanaLevel: e.target.value as JhanaLevel }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent/50"
            >
              {(Object.keys(JHANA_INFO) as JhanaLevel[]).map(jhana => (
                <option key={jhana} value={jhana}>{jhana}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-2">
            Notes
          </label>
          <textarea
            value={session.bodyExperience}
            onChange={(e) => setSession(prev => ({ ...prev, bodyExperience: e.target.value }))}
            placeholder="Brief notes about your practice..."
            className="w-full h-24 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>

        <button
          onClick={() => {
            onSave(session);
            onClose();
          }}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 btn-luminous rounded-lg font-semibold transition"
        >
          <Sparkles size={20} />
          Save Session Log
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-6 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles size={28} className="text-accent" />
              <h1 className="text-2xl font-bold text-slate-100">Jhana/Samadhi Guide</h1>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition">
              <X size={24} className="text-slate-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {mode === 'guide' ? renderGuideMode() : renderPracticeLog()}
        </div>
      </div>
    </div>
  );
}
