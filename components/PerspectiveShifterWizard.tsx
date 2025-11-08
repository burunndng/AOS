
import React, { useState, useEffect } from 'react';
import { PerspectiveShifterSession, Perspective } from '../types.ts';
import { X, ArrowLeft, ArrowRight, Download, Check } from 'lucide-react';
import { 
  generatePerspectiveReflection, 
  synthesizeAllPerspectives, 
  generateActionPlanFromPerspectives 
} from '../services/perspectiveShifterService.ts';

interface PerspectiveShifterWizardProps {
  onClose: () => void;
  onSave: (session: PerspectiveShifterSession) => void;
  session: PerspectiveShifterSession | null;
  setDraft: (session: PerspectiveShifterSession | null) => void;
}

type SimplifiedStep = 'SITUATION' | 'FIRST_PERSON' | 'SECOND_PERSON' | 'THIRD_PERSON' | 'WITNESS' | 'MAP' | 'ACTION' | 'COMPLETE';

const STEP_LABELS: Record<SimplifiedStep, string> = {
  SITUATION: 'The Stuck Situation',
  FIRST_PERSON: 'Your Perspective',
  SECOND_PERSON: 'Their Perspective',
  THIRD_PERSON: 'Observer View',
  WITNESS: 'Witness View',
  MAP: 'Perspective Map',
  ACTION: 'Your Action Plan',
  COMPLETE: 'Complete'
};

const STEPS: SimplifiedStep[] = ['SITUATION', 'FIRST_PERSON', 'SECOND_PERSON', 'THIRD_PERSON', 'WITNESS', 'MAP', 'ACTION'];

// Guiding questions for each perspective
const GUIDANCE: Record<string, string[]> = {
  FIRST_PERSON: [
    'What do I need or want in this situation?',
    'What am I afraid of?',
    'What am I protecting?',
    'What would feel fair or right to me?'
  ],
  SECOND_PERSON: [
    'What might they need or want?',
    'What might they be afraid of?',
    'What are they protecting?',
    'What would feel fair or right to them?'
  ],
  THIRD_PERSON: [
    'What is the pattern I notice?',
    'What are both sides defending?',
    'Where is there real disagreement vs. misunderstanding?',
    'What is each side not seeing?'
  ],
  WITNESS: [
    'What is shared humanity here?',
    'What is the deeper need beneath the conflict?',
    'How could both be right?',
    'What wisdom is available from this wider view?'
  ]
};

// FIX: Defined an interface for PerspectiveCard props for clearer typing.
interface PerspectiveCardProps { 
  type: Perspective['type']; 
  description: string;
  reflection?: string;
  isActive: boolean;
}

// FIX: Explicitly typed PerspectiveCard as a React.FC with PerspectiveCardProps.
const PerspectiveCard: React.FC<PerspectiveCardProps> = ({ 
  type, 
  description, 
  reflection,
  isActive 
}) => {
  const colors: Record<Perspective['type'], { bg: string; border: string; text: string }> = {
    'First Person (You)': { bg: 'bg-neutral-900/40', border: 'border-neutral-600', text: 'text-neutral-300' },
    'Second Person (Them)': { bg: 'bg-neutral-900/40', border: 'border-neutral-600', text: 'text-neutral-300' },
    'Third Person (Observer)': { bg: 'bg-amber-900/40', border: 'border-amber-600', text: 'text-amber-300' },
    'Witness (Pure Awareness)': { bg: 'bg-neutral-900/40', border: 'border-neutral-600', text: 'text-neutral-300' }
  };
  
  const color = colors[type];
  
  return (
    <div className={`${color.bg} border-2 ${color.border} rounded-lg p-4 ${isActive ? 'ring-2 ring-offset-2 ring-offset-slate-800' : ''}`}>
      <h4 className={`font-bold text-sm mb-2 ${color.text}`}>{type}</h4>
      <p className="text-slate-300 text-sm mb-3 leading-relaxed">{description || '[Empty]'}</p>
      {reflection && (
        <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
          <p className="text-xs text-slate-400 italic">Aura: {reflection}</p>
        </div>
      )}
    </div>
  );
};

export default function PerspectiveShifterWizard({ 
  onClose, 
  onSave, 
  session: draft, 
  setDraft 
}: PerspectiveShifterWizardProps) {
  const [step, setStep] = useState<SimplifiedStep>('SITUATION');
  // FIX: Added 'situation' state to manage the stuck situation description.
  const [situation, setSituation] = useState(draft?.stuckSituation || '');
  // FIX: Explicitly typed the keys of the perspectives state to `Perspective['type']` for better type inference.
  const [perspectives, setPerspectives] = useState<Record<Perspective['type'], { description: string; reflection?: string }>>({
    'First Person (You)': { description: '' },
    'Second Person (Them)': { description: '' },
    'Third Person (Observer)': { description: '' },
    'Witness (Pure Awareness)': { description: '' }
  });
  const [synthesis, setSynthesis] = useState('');
  const [actionPlan, setActionPlan] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (draft) {
      // FIX: Set 'situation' state from draft.stuckSituation.
      setSituation(draft.stuckSituation);
      if (draft.perspectives.length > 0) {
        const perspectiveMap: Record<Perspective['type'], { description: string; reflection?: string }> = {
            'First Person (You)': { description: '' }, // Ensure all keys are present
            'Second Person (Them)': { description: '' },
            'Third Person (Observer)': { description: '' },
            'Witness (Pure Awareness)': { description: '' }
        };
        draft.perspectives.forEach(p => {
          // FIX: Access 'reflection' property, which is now consistent in the Perspective interface.
          perspectiveMap[p.type] = { description: p.description, reflection: p.reflection };
        });
        setPerspectives(perspectiveMap);
      }
      if (draft.synthesis) setSynthesis(draft.synthesis);
      if (draft.realityCheckRefinement) setActionPlan(draft.realityCheckRefinement);
    }
  }, [draft]);

  const handleSaveDraft = () => {
    const perspectivesList: Perspective[] = Object.entries(perspectives).map(([type, data]) => {
      const typedData = data as { description: string; reflection?: string };
      return {
        type: type as Perspective['type'],
        description: typedData.description,
        // FIX: Use 'reflection' property, consistent with the Perspective interface.
        reflection: typedData.reflection
      };
    });
    
    const session: PerspectiveShifterSession = {
      id: draft?.id || `ps-${Date.now()}`,
      date: draft?.date || new Date().toISOString(),
      currentStep: step, // Save current step for draft
      stuckSituation: situation,
      perspectives: perspectivesList,
      synthesis,
      realityCheckRefinement: actionPlan,
      dailyTracking: {}
    };
    setDraft(session);
    onClose();
  };

  const currentPerspectiveType = (): Perspective['type'] | null => {
    const map: Record<SimplifiedStep, Perspective['type'] | null> = {
      SITUATION: null,
      FIRST_PERSON: 'First Person (You)',
      SECOND_PERSON: 'Second Person (Them)',
      THIRD_PERSON: 'Third Person (Observer)',
      WITNESS: 'Witness (Pure Awareness)',
      MAP: null,
      ACTION: null,
      COMPLETE: null
    };
    return map[step];
  };

  const handleNext = async () => {
    setError('');
    
    if (step === 'SITUATION' && !situation.trim()) {
      setError('Please describe your stuck situation.');
      return;
    }

    if (['FIRST_PERSON', 'SECOND_PERSON', 'THIRD_PERSON', 'WITNESS'].includes(step)) {
      const perspectiveType: Perspective['type'] = currentPerspectiveType()!; // Explicitly assert type here
      if (!perspectives[perspectiveType]?.description.trim()) {
        setError(`Please describe the ${perspectiveType} perspective.`);
        return;
      }
    }


    setIsLoading(true);
    try {
      if (['FIRST_PERSON', 'SECOND_PERSON', 'THIRD_PERSON', 'WITNESS'].includes(step)) {
        const perspectiveType: Perspective['type'] = currentPerspectiveType()!; // Explicitly assert type here
        // Generate AI reflection on their perspective
        const reflection = await generatePerspectiveReflection(
          situation,
          perspectiveType,
          perspectives[perspectiveType].description
        );
        
        setPerspectives(prev => ({
          ...prev,
          [perspectiveType]: { ...prev[perspectiveType], reflection }
        }));

        // Move to next step
        if (step === 'WITNESS') {
          // Generate synthesis of all perspectives
          const perspectivesList = Object.entries(perspectives).map(([type, data]) => {
            const typedData = data as { description: string; reflection?: string };
            return {
              type: type as Perspective['type'],
              description: typedData.description,
              // FIX: Use 'reflection' property, consistent with the Perspective interface.
              reflection: typedData.reflection
            };
          });
          const synth = await synthesizeAllPerspectives(situation, perspectivesList);
          setSynthesis(synth);
          setStep('MAP');
        } else {
          const stepOrder: SimplifiedStep[] = ['FIRST_PERSON', 'SECOND_PERSON', 'THIRD_PERSON', 'WITNESS'];
          const nextIdx = stepOrder.indexOf(step as SimplifiedStep) + 1;
          setStep(stepOrder[nextIdx]);
        }
      } else if (step === 'MAP') {
        // Generate action plan based on synthesis
        const plan = await generateActionPlanFromPerspectives(situation, synthesis);
        setActionPlan(plan);
        setStep('ACTION');
      } else if (step === 'ACTION') {
        // Save and complete
        const perspectivesList: Perspective[] = Object.entries(perspectives).map(([type, data]) => {
          const typedData = data as { description: string; reflection?: string };
          return {
            type: type as Perspective['type'],
            description: typedData.description,
            // FIX: Use 'reflection' property, consistent with the Perspective interface.
            reflection: typedData.reflection
          };
        });
        
        const session: PerspectiveShifterSession = {
          id: draft?.id || `ps-${Date.now()}`,
          date: new Date().toISOString(),
          currentStep: 'COMPLETE',
          stuckSituation: situation,
          perspectives: perspectivesList,
          synthesis,
          realityCheckRefinement: actionPlan,
          dailyTracking: {}
        };
        onSave(session);
        setStep('COMPLETE');
      } else {
        const currentIndex = STEPS.indexOf(step);
        if (currentIndex < STEPS.length - 1) {
            setStep(STEPS[currentIndex + 1]);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    const currentIdx = STEPS.indexOf(step);
    if (currentIdx > 0) {
      setStep(STEPS[currentIdx - 1]);
    }
  };

  const handleDownload = () => {
    const content = `# Perspective Shifter Session
Date: ${new Date().toLocaleDateString()}

## The Stuck Situation
${situation}

---

## Perspectives

### Your Perspective (1st Person)
${perspectives['First Person (You)'].description}

**Aura's Reflection**: ${perspectives['First Person (You)'].reflection || 'None yet'}

---

### Their Perspective (2nd Person)
${perspectives['Second Person (Them)'].description}

**Aura's Reflection**: ${perspectives['Second Person (Them)'].reflection || 'None yet'}

---

### Observer Perspective (3rd Person)
${perspectives['Third Person (Observer)'].description}

**Aura's Reflection**: ${perspectives['Third Person (Observer)'].reflection || 'None yet'}

---

### Witness Perspective (Pure Awareness)
${perspectives['Witness (Pure Awareness)'].description}

**Aura's Reflection**: ${perspectives['Witness (Pure Awareness)'].reflection || 'None yet'}

---

## Synthesis
${synthesis}

---

## Your Action Plan
${actionPlan}

---

Generated by Aura ILP
`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `perspective-shifter-report-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stepIndex = STEPS.indexOf(step);
  const canProceed = 
    (step === 'SITUATION' && !!situation.trim()) ||
    (step === 'FIRST_PERSON' && !!perspectives['First Person (You)'].description.trim()) ||
    (step === 'SECOND_PERSON' && !!perspectives['Second Person (Them)'].description.trim()) ||
    (step === 'THIRD_PERSON' && !!perspectives['Third Person (Observer)'].description.trim()) ||
    (step === 'WITNESS' && !!perspectives['Witness (Pure Awareness)'].description.trim()) ||
    step === 'MAP' ||
    (step === 'ACTION' && !!actionPlan.trim());

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        <header className="p-4 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold font-mono text-orange-300">Perspective Shifter</h2>
            <p className="text-xs text-slate-400 mt-1">
              Step {stepIndex + 1} of {STEPS.length}: {STEP_LABELS[step]}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition">
            <X size={24} />
          </button>
        </header>

        <main className="p-6 flex-grow overflow-y-auto space-y-4">
          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded-md p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {step === 'SITUATION' && (
            <>
              <h3 className="text-lg font-semibold text-slate-100">Describe Your Stuck Situation</h3>
              <p className="text-slate-400 text-sm">A situation where you feel stuck or misunderstood. Who is involved? What's the conflict or confusion?</p>
              <textarea
                value={situation}
                onChange={e => setSituation(e.target.value)}
                rows={6}
                placeholder="E.g., 'I want to set boundaries with my partner about work stress, but they think I'm being cold...'"
                className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-100"
              />
            </>
          )}

          {['FIRST_PERSON', 'SECOND_PERSON', 'THIRD_PERSON', 'WITNESS'].includes(step) && (
            <>
              <h3 className="text-lg font-semibold text-slate-100">
                {step === 'FIRST_PERSON' && 'Your Perspective'}
                {step === 'SECOND_PERSON' && 'Their Perspective'}
                {step === 'THIRD_PERSON' && 'Observer View'}
                {step === 'WITNESS' && 'Witness View'}
              </h3>
              <p className="text-slate-400 text-sm">
                {step === 'FIRST_PERSON' && 'From your own eyes, what is true? What do you need?'}
                {step === 'SECOND_PERSON' && 'Genuinely imagine you are them. What is their experience?'}
                {step === 'THIRD_PERSON' && 'Step back as a caring observer. What is the pattern?'}
                {step === 'WITNESS' && 'From pure awareness and compassion, what is visible?'}
              </p>

              <div className="bg-slate-900/30 border border-slate-700 rounded-lg p-4 mb-4">
                <p className="text-xs text-slate-400 font-semibold mb-2">Guiding questions:</p>
                <ul className="space-y-1">
                  {GUIDANCE[step]?.map((q, i) => (
                    <li key={i} className="text-xs text-slate-400">• {q}</li>
                  ))}
                </ul>
              </div>
              
              {(() => {
                const perspectiveType: Perspective['type'] = currentPerspectiveType()!;
                return (
                  <textarea
                    value={perspectives[perspectiveType]?.description || ''}
                    onChange={e => {
                      setPerspectives(prev => ({
                        ...prev,
                        [perspectiveType]: { ...prev[perspectiveType], description: e.target.value }
                      }));
                    }}
                    rows={6}
                    placeholder="Write from this perspective..."
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-100"
                  />
                );
              })()}


              {(() => {
                const perspectiveType: Perspective['type'] = currentPerspectiveType()!;
                return perspectives[perspectiveType]?.reflection && !isLoading && (
                  <div className="bg-orange-900/30 border border-orange-700 rounded-lg p-4 animate-fade-in">
                    <p className="text-xs text-orange-300 font-semibold mb-1">Aura's Reflection</p>
                    <p className="text-sm text-slate-300">{perspectives[perspectiveType].reflection}</p>
                  </div>
                );
              })()}
               {isLoading && <p className="text-slate-400 text-sm animate-pulse">Aura is reflecting...</p>}
            </>
          )}

          {step === 'MAP' && (
            <>
              <h3 className="text-lg font-semibold text-slate-100">Your Perspective Map</h3>
              <p className="text-slate-400 text-sm mb-4">All four perspectives, showing how they fit together:</p>
              
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-slate-400 animate-pulse">Synthesizing perspectives...</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* FIX: Ensure description and reflection are correctly typed strings. */}
                    <PerspectiveCard type="First Person (You)" description={perspectives['First Person (You)'].description} reflection={perspectives['First Person (You)'].reflection} isActive={false} />
                    <PerspectiveCard type="Second Person (Them)" description={perspectives['Second Person (Them)'].description} reflection={perspectives['Second Person (Them)'].reflection} isActive={false} />
                    <PerspectiveCard type="Third Person (Observer)" description={perspectives['Third Person (Observer)'].description} reflection={perspectives['Third Person (Observer)'].reflection} isActive={false} />
                    <PerspectiveCard type="Witness (Pure Awareness)" description={perspectives['Witness (Pure Awareness)'].description} reflection={perspectives['Witness (Pure Awareness)'].reflection} isActive={false} />
                  </div>

                  <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                    <h4 className="font-semibold text-slate-200 mb-2">Integration Synthesis</h4>
                    <p className="text-slate-300 text-sm leading-relaxed">{synthesis}</p>
                  </div>
                </>
              )}
            </>
          )}

          {step === 'ACTION' && (
            <>
              <h3 className="text-lg font-semibold text-slate-100">Your Action Plan</h3>
              <p className="text-slate-400 text-sm mb-3">
                Now that you can hold all perspectives, here's a concrete approach:
              </p>
              
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-slate-400 animate-pulse">Generating action plan...</p>
                </div>
              ) : (
                <>
                  {actionPlan && (
                    <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 mb-4">
                      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{actionPlan}</p>
                    </div>
                  )}
                  
                  <label className="block text-sm font-medium text-slate-300 mb-2">Refine it or write your own:</label>
                  <textarea
                    value={actionPlan}
                    onChange={e => setActionPlan(e.target.value)}
                    rows={5}
                    placeholder="E.g., 'I will tell them: I value our connection. When work gets stressful, I need some quiet time to recharge—not because I don't care about you, but because it helps me be present for us. Can we...'"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-100"
                  />
                </>
              )}
            </>
          )}

          {step === 'COMPLETE' && (
            <div className="text-center py-12 space-y-4">
              <Check size={48} className="mx-auto text-green-400" />
              <h3 className="text-2xl font-bold text-slate-100">Session Complete</h3>
              <p className="text-slate-400 max-w-md mx-auto">
                You've mapped all perspectives and created an action plan. Download it to remember this shift.
              </p>
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition"
              >
                <Download size={18} /> Download Session
              </button>
            </div>
          )}
        </main>

        <footer className="p-4 border-t border-slate-700 flex justify-between items-center">
          <button onClick={handleSaveDraft} className="text-sm text-slate-400 hover:text-white transition"> Save & Exit </button>
          <div className="flex gap-3">
            {step !== 'SITUATION' && step !== 'COMPLETE' && (
              <button onClick={handleBack} disabled={isLoading} className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 transition"> <ArrowLeft size={16} /> Back </button>
            )}
            {step !== 'COMPLETE' && (
              <button onClick={handleNext} disabled={isLoading || !canProceed}
                className={`px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 transition ${ isLoading || !canProceed ? 'bg-slate-600 text-slate-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700 text-white' }`}
              >
                {isLoading ? 'Processing...' : step === 'ACTION' ? 'Complete & Save' : 'Next'} <ArrowRight size={16} />
              </button>
            )}
            {step === 'COMPLETE' && (
              <button onClick={onClose} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 transition"> <Check size={16} /> Done </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
