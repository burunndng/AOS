import React, { useState } from 'react';
import { JhanaSession, JhanaLevel, JhanaFactor, NimittaType, MeditationType } from '../types.ts';
import { X, ArrowRight, Info, Sparkles, Download, HelpCircle, Lightbulb, AlertCircle } from 'lucide-react';

interface JhanaTrackerProps {
  onClose: () => void;
  onSave: (session: JhanaSession) => void;
}

const MEDITATION_TYPE_INFO: Record<MeditationType, { description: string; focus: string; tips: string[] }> = {
  'Samatha (Concentration)': {
    description: 'Concentration practice developing sustained attention and jhana states.',
    focus: 'Single-pointed focus on one object (breath, kasina, mantra)',
    tips: [
      'Stay with one object the whole session',
      'Let the mind gather naturally - don\'t force',
      'Jhanas arise when concentration deepens',
      'Notice joy, happiness, and stillness building'
    ]
  },
  'Vipassana (Insight)': {
    description: 'Insight practice investigating the nature of experience.',
    focus: 'Observing changing phenomena, impermanence, patterns',
    tips: [
      'Note what arises and passes',
      'Concentration supports but isn\'t the goal',
      'Momentary concentration is common here',
      'Look for impermanence, unsatisfactoriness, non-self'
    ]
  },
  'Metta (Loving-Kindness)': {
    description: 'Heart practice cultivating unconditional goodwill.',
    focus: 'Generating warm feelings toward self and others',
    tips: [
      'Start with someone easy to love',
      'Use phrases or feelings that work for you',
      'Can develop deep concentration and joy',
      'Piti (joy) often very strong in metta practice'
    ]
  },
  'Mixed/Other': {
    description: 'Combination of practices or other meditation styles.',
    focus: 'Your unique approach',
    tips: [
      'Track what actually happens in your practice',
      'No wrong answers - be honest about your experience',
      'Different practices develop different states'
    ]
  }
};

const JHANA_INFO: Record<JhanaLevel, { description: string; markers: string[]; beginnerNote?: string }> = {
  'Just Practicing': {
    description: 'Regular meditation without deep absorption states. This is completely normal and valuable!',
    markers: ['Mind somewhat settled', 'Some periods of focus', 'Maybe some pleasant sensations', 'Still experiencing thoughts'],
    beginnerNote: 'Most meditation sessions are like this. Building consistency matters more than states.'
  },
  'Not Sure': {
    description: 'You experienced something but aren\'t sure what to call it. That\'s okay!',
    markers: ['Something felt different', 'More concentrated than usual', 'Unusual experiences', 'Hard to describe'],
    beginnerNote: 'Concentration develops gradually. Keep practicing and the signs will become clearer.'
  },
  'Access Concentration': {
    description: 'The threshold before jhana. Mind is stable, hindrances quieted, pleasant sensations.',
    markers: ['Hindrances quieted', 'Mind gathering', 'Breath very subtle', 'Pleasant feelings building'],
    beginnerNote: 'This is the doorway! With more practice, jhana becomes accessible from here.'
  },
  'Momentary Concentration': {
    description: 'Brief moments of strong focus during insight practice.',
    markers: ['Flashes of clarity', 'Momentary stillness', 'Brief but strong', 'Not sustained'],
    beginnerNote: 'Common in vipassana. Supports seeing clearly even without sustained jhana.'
  },
  '1st Jhana': {
    description: 'Sustained absorption with joy, happiness, and some thinking still present.',
    markers: ['Mind locked on object', 'Strong joy/tingling', 'Deep contentment', 'Can still think', 'Feels effortless'],
    beginnerNote: 'First real jhana! The mind has unified. This is a significant milestone.'
  },
  '2nd Jhana': {
    description: 'Thinking drops away. Stronger absorption with joy and happiness.',
    markers: ['No more thinking', 'Joy intensifies', 'Mind very bright', 'Even less effort', 'Deep confidence'],
    beginnerNote: 'Deeper than 1st jhana. The mental chatter has stopped.'
  },
  '3rd Jhana': {
    description: 'Energetic joy fades, leaving pure contentment and equanimity.',
    markers: ['Joy subsides', 'Pure contentment', 'Equanimity grows', 'Refined pleasure', 'Profound peace'],
    beginnerNote: 'Calmer than 2nd jhana. The excitement settles into deep peace.'
  },
  '4th Jhana': {
    description: 'Pure equanimity. Neither pleasant nor unpleasant. Perfectly balanced.',
    markers: ['No joy or pleasure', 'Perfect equanimity', 'Effortless ease', 'Mind very refined', 'Body barely felt'],
    beginnerNote: 'The deepest of the material jhanas. Extremely subtle and balanced.'
  },
  '5th Jhana': {
    description: 'Infinite Space - boundless spatial awareness.',
    markers: ['Boundless space', 'No solid form', 'Vast openness'],
    beginnerNote: 'First formless jhana. Usually requires mastery of 4th jhana first.'
  },
  '6th Jhana': {
    description: 'Infinite Consciousness - awareness of boundless knowing.',
    markers: ['Pure consciousness', 'Aware of awareness', 'No space, just knowing'],
    beginnerNote: 'Very refined formless state. Consciousness without objects.'
  },
  '7th Jhana': {
    description: 'Nothingness - perception of nothing.',
    markers: ['Nothingness', 'Absence', 'Very subtle'],
    beginnerNote: 'Extremely subtle formless jhana.'
  },
  '8th Jhana': {
    description: 'Neither Perception Nor Non-Perception - the most refined state.',
    markers: ['Almost imperceptible', 'Barely there', 'At edge of cessation'],
    beginnerNote: 'The subtlest concentration state before cessation.'
  }
};

const FACTOR_EXPLANATIONS = {
  appliedAttention: {
    pali: 'Vitakka',
    simple: 'Directing attention',
    full: 'The initial placement of mind on the meditation object. Like hitting a nail with a hammer.',
    example: 'Finding the breath and putting attention on it'
  },
  sustainedAttention: {
    pali: 'Vicara',
    simple: 'Staying with it',
    full: 'Keeping attention on the object. Like rubbing the head of the nail.',
    example: 'Staying with the breath, feeling each sensation'
  },
  joy: {
    pali: 'Piti',
    simple: 'Energetic joy',
    full: 'Energetic excitement, rapture. Can be subtle or overwhelming.',
    example: 'Tingling, waves of energy, goosebumps, feeling uplifted'
  },
  happiness: {
    pali: 'Sukha',
    simple: 'Contentment',
    full: 'Ease, bliss, satisfaction. Softer than piti.',
    example: 'Feeling content, at ease, deeply satisfied'
  },
  unification: {
    pali: 'Ekaggata',
    simple: 'One-pointedness',
    full: 'Mind collected, undistracted, absorbed in the object.',
    example: 'Mind very steady, not wandering, locked in'
  }
};

export default function JhanaTracker({ onClose, onSave }: JhanaTrackerProps) {
  const [step, setStep] = useState<'type' | 'basic' | 'jhana' | 'factors' | 'nimitta' | 'phenomenology' | 'notes'>('type');
  const [beginnerMode, setBeginnerMode] = useState(true);

  const [session, setSession] = useState<JhanaSession>({
    id: `jhana-${Date.now()}`,
    date: new Date().toISOString(),
    meditationType: 'Samatha (Concentration)',
    practice: '',
    duration: 30,
    jhanaLevel: 'Just Practicing',
    timeInState: 0,
    isBeginnerMode: true,
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

  const [showHelp, setShowHelp] = useState<string | null>(null);

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

  const getProactiveTip = () => {
    // Proactive suggestions based on current state
    if (step === 'jhana' && session.jhanaLevel === 'Just Practicing') {
      return 'Remember: Most sessions are just practice! Building consistency is what matters.';
    }
    if (step === 'factors' && !Object.values(session.factors).some(f => f.present)) {
      return 'If none of these factors were strong, that\'s okay! You might have been in "Just Practicing" mode.';
    }
    if (step === 'phenomenology' && session.meditationType === 'Vipassana (Insight)') {
      return 'In vipassana, notice what arose and passed. Did you see impermanence clearly?';
    }
    return null;
  };

  const handleSave = () => {
    onSave({ ...session, isBeginnerMode: beginnerMode });
    onClose();
  };

  const renderMeditationType = () => (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-slate-100">What type of meditation?</h2>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={beginnerMode}
              onChange={(e) => {
                setBeginnerMode(e.target.checked);
                setSession(prev => ({ ...prev, isBeginnerMode: e.target.checked }));
              }}
              className="w-4 h-4 rounded border-slate-600 text-accent focus:ring-accent/50"
            />
            <span className="text-slate-300">Beginner mode (simpler language)</span>
          </label>
        </div>
        <p className="text-slate-400 text-sm mb-6">This helps us give you relevant guidance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(Object.keys(MEDITATION_TYPE_INFO) as MeditationType[]).map(type => (
          <button
            key={type}
            onClick={() => setSession(prev => ({ ...prev, meditationType: type }))}
            className={`text-left p-5 rounded-lg border-2 transition ${
              session.meditationType === type
                ? 'border-accent bg-accent/10'
                : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
            }`}
          >
            <h3 className="font-bold text-slate-100 mb-2">{type}</h3>
            <p className="text-sm text-slate-400 mb-3">{MEDITATION_TYPE_INFO[type].description}</p>
            <p className="text-xs text-slate-500"><strong>Focus:</strong> {MEDITATION_TYPE_INFO[type].focus}</p>
          </button>
        ))}
      </div>

      <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Lightbulb size={20} className="text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-blue-300 mb-2">Tips for {session.meditationType}</h4>
            <ul className="text-sm text-slate-300 space-y-1">
              {MEDITATION_TYPE_INFO[session.meditationType].tips.map((tip, i) => (
                <li key={i}>• {tip}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBasic = () => (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Session Details</h2>
        <p className="text-slate-400 text-sm">Tell us about your sit.</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-200 mb-2">
          {beginnerMode ? 'What were you doing?' : 'Specific practice/technique'}
        </label>
        <input
          type="text"
          value={session.practice}
          onChange={(e) => setSession(prev => ({ ...prev, practice: e.target.value }))}
          placeholder={
            session.meditationType === 'Samatha (Concentration)' ? 'e.g., Breath at nose, Kasina, Body scanning' :
            session.meditationType === 'Metta (Loving-Kindness)' ? 'e.g., Metta phrases, Heart opening' :
            session.meditationType === 'Vipassana (Insight)' ? 'e.g., Noting, Body scan, Choiceless awareness' :
            'e.g., Breath meditation'
          }
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-2">
            {beginnerMode ? 'How long did you sit?' : 'Total duration'} (minutes)
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
            {beginnerMode ? 'Time in deep state' : 'Time in jhana/absorption'} (min)
            <button
              onClick={() => setShowHelp('timeInState')}
              className="ml-2 text-slate-500 hover:text-slate-300"
            >
              <HelpCircle size={14} className="inline" />
            </button>
          </label>
          <input
            type="number"
            value={session.timeInState}
            onChange={(e) => setSession(prev => ({ ...prev, timeInState: parseInt(e.target.value) || 0 }))}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
          {showHelp === 'timeInState' && (
            <p className="text-xs text-slate-400 mt-2">
              How long you were in a deeper state (if any). Put 0 if you were just practicing normally.
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderJhanaSelection = () => {
    const tip = getProactiveTip();
    const relevantLevels: JhanaLevel[] = beginnerMode
      ? ['Just Practicing', 'Not Sure', 'Access Concentration', '1st Jhana', '2nd Jhana', '3rd Jhana', '4th Jhana']
      : Object.keys(JHANA_INFO) as JhanaLevel[];

    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 mb-2">
            {beginnerMode ? 'How was your meditation?' : 'Which state did you reach?'}
          </h2>
          <p className="text-slate-400 text-sm">
            {beginnerMode ? 'Be honest - most sessions are just practice!' : 'Select the deepest state you reached.'}
          </p>
        </div>

        {tip && (
          <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 flex items-start gap-3">
            <Lightbulb size={20} className="text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-slate-300">{tip}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
          {relevantLevels.map(jhana => (
            <button
              key={jhana}
              onClick={() => setSession(prev => ({ ...prev, jhanaLevel: jhana }))}
              className={`text-left p-4 rounded-lg border-2 transition group ${
                session.jhanaLevel === jhana
                  ? 'border-accent bg-accent/10'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-slate-100">{jhana}</h3>
                <Info size={16} className="text-slate-500 group-hover:text-accent transition flex-shrink-0 ml-2" />
              </div>
              <p className="text-xs text-slate-400 mb-2">{JHANA_INFO[jhana].description}</p>
              {beginnerMode && JHANA_INFO[jhana].beginnerNote && (
                <p className="text-xs text-blue-400 mb-2">💡 {JHANA_INFO[jhana].beginnerNote}</p>
              )}
              <ul className="text-xs text-slate-500 space-y-1">
                {JHANA_INFO[jhana].markers.slice(0, beginnerMode ? 3 : 4).map((marker, i) => (
                  <li key={i}>• {marker}</li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        {!beginnerMode && (
          <button
            onClick={() => setBeginnerMode(true)}
            className="text-sm text-slate-400 hover:text-slate-300 flex items-center gap-2"
          >
            <AlertCircle size={16} />
            Feeling overwhelmed? Switch to beginner mode
          </button>
        )}
      </div>
    );
  };

  const renderFactors = () => {
    const relevantFactors = ['1st Jhana', '2nd Jhana', '3rd Jhana', '4th Jhana'].includes(session.jhanaLevel);
    const tip = getProactiveTip();

    if (!relevantFactors) {
      const message = session.jhanaLevel === 'Just Practicing'
        ? 'These factors apply when you reach jhana states. For regular practice, skip to the next step!'
        : session.jhanaLevel === 'Not Sure'
        ? 'If you\'re not sure about these factors, that\'s okay! Skip ahead or mark what you noticed.'
        : 'The five jhana factors apply mainly to the first four jhanas. The formless states (5-8) work differently.';

      return (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-6 text-center">
            <Info size={32} className="mx-auto text-blue-400 mb-3" />
            <p className="text-slate-300">{message}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 mb-2">
            {beginnerMode ? 'What did you notice?' : 'The Five Jhana Factors'}
          </h2>
          <p className="text-slate-400 text-sm">
            {beginnerMode
              ? 'Check what was present in your meditation. Don\'t worry if you\'re not sure!'
              : 'Rate the presence and intensity of each factor.'
            }
          </p>
        </div>

        {tip && (
          <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-slate-300">{tip}</p>
          </div>
        )}

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
                  <h3 className="font-bold text-slate-100">
                    {beginnerMode ? explanation.simple : `${explanation.simple} (${explanation.pali})`}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {beginnerMode ? explanation.example : explanation.full}
                  </p>
                </div>
                <button
                  onClick={() => setShowHelp(showHelp === key ? null : key)}
                  className="text-slate-500 hover:text-slate-300 flex-shrink-0"
                >
                  <HelpCircle size={16} />
                </button>
              </div>

              {showHelp === key && (
                <div className="ml-8 mb-3 p-3 bg-blue-900/20 border border-blue-700/50 rounded text-xs text-slate-300">
                  <p className="mb-1"><strong>Full explanation:</strong> {explanation.full}</p>
                  <p><strong>Example:</strong> {explanation.example}</p>
                </div>
              )}

              {factor.present && (
                <div className="ml-8 space-y-3 animate-fade-in">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-300">{beginnerMode ? 'How strong?' : 'Intensity'}</span>
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
                    placeholder="Any specific notes? (optional)"
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
        <h2 className="text-2xl font-bold text-slate-100 mb-2">
          {beginnerMode ? 'Did you see or feel anything unusual?' : 'Nimitta (Sign)'}
        </h2>
        <p className="text-slate-400 text-sm">
          {beginnerMode
            ? 'Sometimes lights, sensations, or images appear when concentrating. This is normal!'
            : 'The nimitta is a mental image/sensation that arises as concentration deepens.'
          }
        </p>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={session.nimittaPresent}
            onChange={(e) => setSession(prev => ({ ...prev, nimittaPresent: e.target.checked }))}
            className="w-5 h-5 rounded border-slate-600 text-accent focus:ring-accent/50"
          />
          <span className="font-semibold text-slate-100">
            {beginnerMode ? 'Yes, I noticed something' : 'A nimitta was present'}
          </span>
        </label>
      </div>

      {session.nimittaPresent && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              {beginnerMode ? 'What kind?' : 'Type of nimitta'}
            </label>
            <select
              value={session.nimittaType || 'Visual Light'}
              onChange={(e) => setSession(prev => ({ ...prev, nimittaType: e.target.value as NimittaType }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent/50"
            >
              <option value="Visual Light">Light or color</option>
              <option value="Tactile Sensation">Pressure, tingling, warmth</option>
              <option value="Auditory">Sound or vibration</option>
              <option value="Whole-Body">Whole body sensation</option>
              <option value="Spatial">Sense of space or openness</option>
              <option value="Other">Something else</option>
              <option value="None Yet">Nothing specific yet</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              {beginnerMode ? 'Can you describe it?' : 'Describe the nimitta'}
            </label>
            <textarea
              value={session.nimittaDescription || ''}
              onChange={(e) => setSession(prev => ({ ...prev, nimittaDescription: e.target.value }))}
              placeholder={beginnerMode ? 'What did you see, feel, or experience?' : 'What did it look/feel like? How did it change?'}
              className="w-full h-24 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-300">{beginnerMode ? 'How steady was it?' : 'Stability'}</span>
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
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Very flickering</span>
              <span>Rock solid</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderPhenomenology = () => {
    const tip = getProactiveTip();

    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 mb-2">
            {beginnerMode ? 'How did it feel?' : 'Phenomenology'}
          </h2>
          <p className="text-slate-400 text-sm">
            {beginnerMode ? 'Describe what you actually experienced.' : 'Describe the direct experience of body and mind.'}
          </p>
        </div>

        {tip && (
          <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 flex items-start gap-3">
            <Lightbulb size={20} className="text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-slate-300">{tip}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-2">
            {beginnerMode ? 'Body sensations' : 'Body experience'}
          </label>
          <textarea
            value={session.bodyExperience}
            onChange={(e) => setSession(prev => ({ ...prev, bodyExperience: e.target.value }))}
            placeholder={beginnerMode ? 'Heavy? Light? Tingling? Dissolved? Relaxed?' : 'How did the body feel? Dissolved? Heavy? Light? Tingling? Still?'}
            className="w-full h-24 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-2">
            {beginnerMode ? 'Mind quality' : 'Quality of mind'}
          </label>
          <textarea
            value={session.mindQuality}
            onChange={(e) => setSession(prev => ({ ...prev, mindQuality: e.target.value }))}
            placeholder={beginnerMode ? 'Clear? Foggy? Calm? Busy? Bright?' : 'Bright? Stable? Spacious? Dull? Restless? Unified?'}
            className="w-full h-24 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-2">
            {beginnerMode ? 'Any difficulties?' : 'Hindrances encountered'} (optional)
          </label>
          <input
            type="text"
            value={session.hindrances?.join(', ') || ''}
            onChange={(e) => setSession(prev => ({ ...prev, hindrances: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
            placeholder={beginnerMode ? 'Sleepy, distracted, restless, doubting...' : 'e.g., restlessness, doubt, drowsiness...'}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>
      </div>
    );
  };

  const renderNotes = () => (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">
          {beginnerMode ? 'Final reflections' : 'Progress notes'}
        </h2>
        <p className="text-slate-400 text-sm">
          {beginnerMode ? 'Any thoughts about this session? (All optional)' : 'Reflect on this session in context of your practice.'}
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-200 mb-2">
          {beginnerMode ? 'Compared to other sessions' : 'Comparison to previous sits'}
        </label>
        <textarea
          value={session.comparison || ''}
          onChange={(e) => setSession(prev => ({ ...prev, comparison: e.target.value }))}
          placeholder={beginnerMode ? 'Better? Worse? Different somehow?' : 'Deeper? Shallower? Different quality?'}
          className="w-full h-20 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-200 mb-2">
          {beginnerMode ? 'Any insights or realizations' : 'Insights or realizations'}
        </label>
        <textarea
          value={session.insights || ''}
          onChange={(e) => setSession(prev => ({ ...prev, insights: e.target.value }))}
          placeholder={beginnerMode ? 'Did you understand something about your mind or experience?' : 'Any insights about the practice, mind, or nature of experience?'}
          className="w-full h-20 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-200 mb-2">
          {beginnerMode ? 'What was hard' : 'Difficulties or challenges'}
        </label>
        <textarea
          value={session.difficulties || ''}
          onChange={(e) => setSession(prev => ({ ...prev, difficulties: e.target.value }))}
          placeholder={beginnerMode ? 'What made it challenging?' : 'What was difficult? What\'s getting in the way?'}
          className="w-full h-20 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-200 mb-2">
          {beginnerMode ? 'Questions for teacher' : 'Questions for teacher/sangha'}
        </label>
        <textarea
          value={session.questions || ''}
          onChange={(e) => setSession(prev => ({ ...prev, questions: e.target.value }))}
          placeholder={beginnerMode ? 'Anything you want to ask about?' : 'What questions do you have about this experience?'}
          className="w-full h-20 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
      </div>

      <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
        <p className="text-sm text-slate-300">
          <strong className="text-green-300">Great work!</strong> Consistent tracking helps you see patterns over time.
          {beginnerMode && ' Remember: just showing up to practice is what matters most.'}
        </p>
      </div>
    </div>
  );

  const steps = ['type', 'basic', 'jhana', 'factors', 'nimitta', 'phenomenology', 'notes'] as const;
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
              <h1 className="text-2xl font-bold text-slate-100">
                {beginnerMode ? 'Meditation Tracker' : 'Jhana/Samadhi Tracker'}
              </h1>
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
          {step === 'type' && renderMeditationType()}
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
              {beginnerMode ? 'Next' : 'Continue'}
              <ArrowRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2 btn-luminous rounded-lg font-semibold transition"
            >
              <Sparkles size={20} />
              {beginnerMode ? 'Save Session' : 'Save'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
