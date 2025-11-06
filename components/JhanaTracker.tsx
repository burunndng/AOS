import React, { useState } from 'react';
import { JhanaSession, JhanaLevel, JhanaFactor, NimittaType } from '../types.ts';
import { X, ArrowRight, Info, Sparkles, Download } from 'lucide-react';

interface JhanaTrackerProps {
  onClose: () => void;
  onSave: (session: JhanaSession) => void;
}

const JHANA_INFO: Record<JhanaLevel, { description: string; markers: string[] }> = {
  'Access Concentration': {
    description: 'The threshold state before jhana. Mind is relatively stable, hindrances are suppressed, nimitta may appear.',
    markers: ['Hindrances quieted', 'Sense of gathering/unification beginning', 'Breath becomes subtle', 'Pleasant sensations arising']
  },
  'Momentary Concentration': {
    description: 'Brief moments of strong concentration during insight practice, not sustained absorption.',
    markers: ['Flashes of clarity', 'Momentary stillness', 'Brief perceptual shifts', 'Not sustained']
  },
  '1st Jhana': {
    description: 'Sustained absorption with all five factors present. Characterized by thinking about the object, joy (piti), and happiness (sukha).',
    markers: ['Applied & sustained attention to object', 'Piti (energetic joy, tingling, waves)', 'Sukha (contentment, ease)', 'Unification (one-pointed)', 'Can still think/reflect']
  },
  '2nd Jhana': {
    description: 'Thinking drops away. Stronger unification with piti and sukha. More absorbed, less doing.',
    markers: ['No more applied/sustained thought', 'Piti and sukha increase', 'Greater ease and confidence', 'Mind very bright', 'Less effort needed']
  },
  '3rd Jhana': {
    description: 'Energetic piti fades, leaving pure contentment (sukha). Equanimous happiness.',
    markers: ['Piti subsides', 'Deep contentment remains', 'Equanimity begins', 'Very refined pleasure', 'Profoundly peaceful']
  },
  '4th Jhana': {
    description: 'Even sukha fades into pure equanimity. Effortless, spacious, neutral-toned absorption.',
    markers: ['Neither pleasant nor unpleasant', 'Perfect equanimity', 'Total ease', 'Mind extremely refined', 'Minimal body sensation']
  },
  '5th Jhana': {
    description: 'Infinite Space - perception of boundless space after dropping attention to material form.',
    markers: ['Boundless space', 'No form perception', 'Vast openness', 'Spacious awareness']
  },
  '6th Jhana': {
    description: 'Infinite Consciousness - awareness aware of itself, boundless knowing.',
    markers: ['Boundless consciousness', 'Aware of awareness', 'No space, just knowing', 'Very refined']
  },
  '7th Jhana': {
    description: 'Nothingness - perception that there is nothing, no thing-ness.',
    markers: ['Perception of nothingness', 'Absence', 'Very subtle', 'Neither something nor nothing clearly']
  },
  '8th Jhana': {
    description: 'Neither Perception Nor Non-Perception - the most refined material state, nearly imperceptible.',
    markers: ['Extremely subtle', 'Hard to describe', 'Perception barely present', 'At the edge of cessation']
  }
};

const FACTOR_EXPLANATIONS = {
  appliedAttention: 'Vitakka - Directing attention to the meditation object. The initial placement of mind.',
  sustainedAttention: 'Vicara - Keeping attention on the object. Rubbing, sustaining contact.',
  joy: 'Piti - Energetic joy. Can feel like tingling, waves, rapture, energy flowing through body.',
  happiness: 'Sukha - Contentment, ease, bliss. Softer than piti, more like deep satisfaction.',
  unification: 'Ekaggata - One-pointedness. Mind collected, undistracted, absorbed in object.'
};

export default function JhanaTracker({ onClose, onSave }: JhanaTrackerProps) {
  const [step, setStep] = useState<'basic' | 'jhana' | 'factors' | 'nimitta' | 'phenomenology' | 'notes'>('basic');

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

  const renderJhanaSelection = () => (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Which Jhana/State?</h2>
        <p className="text-slate-400 text-sm">Select the deepest state you reached. Hover for details.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {(Object.keys(JHANA_INFO) as JhanaLevel[]).map(jhana => (
          <button
            key={jhana}
            onClick={() => setSession(prev => ({ ...prev, jhanaLevel: jhana }))}
            className={`text-left p-4 rounded-lg border-2 transition group ${
              session.jhanaLevel === jhana
                ? 'border-accent bg-accent/10'
                : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
            }`}
          >
            <div className="flex items-start justify-between">
              <h3 className="font-bold text-slate-100">{jhana}</h3>
              <Info size={16} className="text-slate-500 group-hover:text-accent transition" />
            </div>
            <p className="text-xs text-slate-400 mt-1">{JHANA_INFO[jhana].description}</p>
            <ul className="text-xs text-slate-500 mt-2 space-y-1">
              {JHANA_INFO[jhana].markers.map((marker, i) => (
                <li key={i}>• {marker}</li>
              ))}
            </ul>
          </button>
        ))}
      </div>
    </div>
  );

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

  const steps = ['basic', 'jhana', 'factors', 'nimitta', 'phenomenology', 'notes'] as const;
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
