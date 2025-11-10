import React, { useState, useEffect, useRef } from 'react';
import {
  MemoryReconsolidationSession,
  MemoryReconsolidationStep,
  MemoryReconsolidationDraft,
  ImplicitBelief,
  ContradictionInsight,
  JuxtapositionCycle,
  IntegrationSelection,
  IntensityReading,
  GroundingOption,
  SessionCompletionSummary,
  IntegrationChoiceType
} from '../types.ts';
import { X, ArrowLeft, ArrowRight, Play, Pause, Download, Copy, Search, CheckCircle } from 'lucide-react';
import { extractImplicitBeliefs, mineContradictions } from '../services/memoryReconsolidationService.ts';
import { GROUNDING_OPTIONS } from '../constants.ts';

interface MemoryReconsolidationWizardProps {
  onClose: () => void;
  onSave: (session: MemoryReconsolidationSession) => void;
  session: MemoryReconsolidationDraft | null;
  setDraft: (session: MemoryReconsolidationDraft | null) => void;
  userId: string;
}

const STEPS: MemoryReconsolidationStep[] = [
  'ONBOARDING', 'BELIEF_IDENTIFICATION', 'CONTRADICTION_MINING', 'JUXTAPOSITION', 'GROUNDING', 'INTEGRATION', 'COMPLETE'
];

const createBaseSession = (): MemoryReconsolidationSession => ({
  id: `memrecon-${Date.now()}`,
  date: new Date().toISOString(),
  currentStep: 'ONBOARDING',
  implicitBeliefs: [],
  contradictionInsights: [],
  juxtapositionCycles: [],
  groundingOptions: GROUNDING_OPTIONS,
  integrationSelections: [],
  baselineIntensity: 5,
});

const hydrateSession = (draft?: MemoryReconsolidationDraft | null): MemoryReconsolidationSession => {
  const base = createBaseSession();
  const baseline = draft?.baselineIntensity ?? base.baselineIntensity;

  return {
    ...base,
    ...draft,
    id: draft?.id ?? base.id,
    date: draft?.date ?? base.date,
    currentStep: draft?.currentStep ?? base.currentStep,
    implicitBeliefs: draft?.implicitBeliefs ?? base.implicitBeliefs,
    contradictionInsights: draft?.contradictionInsights ?? base.contradictionInsights,
    groundingOptions:
      draft?.groundingOptions && draft.groundingOptions.length > 0
        ? draft.groundingOptions
        : base.groundingOptions,
    integrationSelections: draft?.integrationSelections ?? base.integrationSelections,
    baselineIntensity: baseline,
    juxtapositionCycles: (draft?.juxtapositionCycles ?? base.juxtapositionCycles).map((cycle, index) => ({
      ...cycle,
      id: cycle.id || `cycle-${index}`,
      steps: cycle.steps || [],
      intensity: {
        baselineIntensity: cycle.intensity?.baselineIntensity ?? baseline,
        postIntensity: cycle.intensity?.postIntensity,
        shiftPercentage: cycle.intensity?.shiftPercentage,
      },
    })),
  };
};

const mapUiChoiceToIntegrationType = (choice: 'curated' | 'self-guided'): IntegrationChoiceType =>
  choice === 'curated' ? 'practice-stack' : 'embodied-action';

const mapIntegrationTypeToUi = (
  choice?: IntegrationChoiceType,
  selections?: IntegrationSelection[],
): 'curated' | 'self-guided' | null => {
  if (selections?.some(sel => sel.practiceId === 'custom-plan')) return 'self-guided';
  if (choice === 'practice-stack') return 'curated';
  if (choice) return 'self-guided';
  if (selections && selections.length > 0) return 'curated';
  return null;
};

export default function MemoryReconsolidationWizard({ onClose, onSave, session: draft, setDraft, userId }: MemoryReconsolidationWizardProps) {
  const [session, setSession] = useState<MemoryReconsolidationSession>(() => hydrateSession(draft));

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  // Belief identification state
  const [beliefContext, setBeliefContext] = useState('');
  
  // Juxtaposition state
  const [currentCycleIndex, setCurrentCycleIndex] = useState(0);
  const [currentCycleStep, setCurrentCycleStep] = useState<'old-truth' | 'pause' | 'new-truth' | 'complete'>('old-truth');
  const [cycleIntensities, setCycleIntensities] = useState<Record<number, IntensityReading>>({});
  const [isPaused, setIsPaused] = useState(false);
  const [cycleNotes, setCycleNotes] = useState<Record<number, string>>({});
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Post check-in state
  const [postIntensity, setPostIntensity] = useState<number | null>(null);
  const [emotionalNotes, setEmotionalNotes] = useState('');
  const [somaticNotes, setSomaticNotes] = useState('');
  const [cognitiveShifts, setCognitiveShifts] = useState('');
  
  // Integration state
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedPractices, setSelectedPractices] = useState<string[]>([]);
  const [customPlan, setCustomPlan] = useState('');
  const [schedulingCommitment, setSchedulingCommitment] = useState('');
  const [selectedGrounding, setSelectedGrounding] = useState<string[]>([]);
  const [integrationChoice, setIntegrationChoice] = useState<'curated' | 'self-guided' | null>(null);
  
  // Completion state
  const [completionData, setCompletionData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (draft) setSession(hydrateSession(draft));
  }, [draft]);

  useEffect(() => {
    setPrefersReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }
    };
  }, []);

  const handleSaveDraftAndClose = () => {
    setDraft({ ...session, sessionNotes: beliefContext });
    onClose();
  };

  const updateSession = (updates: Partial<MemoryReconsolidationSession>) => {
    setSession(prev => ({ ...prev, ...updates }));
  };

  const canProceedToNext = () => {
    if (isLoading) return false;
    switch (session.currentStep) {
      case 'ONBOARDING':
        return true;
      case 'BELIEF_IDENTIFICATION':
        return beliefContext.trim().length > 50 && session.implicitBeliefs.length > 0;
      case 'CONTRADICTION_MINING':
        return session.contradictionInsights.length > 0;
      case 'JUXTAPOSITION':
        return currentCycleIndex >= Math.min(5, session.juxtapositionCycles.length);
      case 'GROUNDING':
        return postIntensity !== null && emotionalNotes.trim().length > 0;
      case 'INTEGRATION':
        return integrationChoice !== null && 
               ((integrationChoice === 'curated' && selectedPractices.length > 0) ||
                (integrationChoice === 'self-guided' && customPlan.trim().length > 20)) &&
               schedulingCommitment.trim().length > 0 &&
               selectedGrounding.length > 0;
      default:
        return true;
    }
  };

  const startJuxtapositionCycle = (cycleNum: number) => {
    if (prefersReducedMotion || isPaused) return;
    
    setCurrentCycleStep('old-truth');
    animationTimerRef.current = setTimeout(() => {
      setCurrentCycleStep('pause');
      animationTimerRef.current = setTimeout(() => {
        setCurrentCycleStep('new-truth');
        animationTimerRef.current = setTimeout(() => {
          setCurrentCycleStep('complete');
        }, 8000);
      }, 3000);
    }, 8000);
  };

  const pauseJuxtaposition = () => {
    setIsPaused(true);
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
      animationTimerRef.current = null;
    }
  };

  const resumeJuxtaposition = () => {
    setIsPaused(false);
    startJuxtapositionCycle(currentCycleIndex);
  };

  const handleNext = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const currentIndex = STEPS.indexOf(session.currentStep);
      let nextStep = STEPS[currentIndex + 1] || session.currentStep;

      if (session.currentStep === 'BELIEF_IDENTIFICATION') {
        const beliefs = await extractImplicitBeliefs(userId, beliefContext);
        updateSession({ 
          implicitBeliefs: beliefs,
          baselineIntensity: beliefs[0]?.emotionalCharge || 5
        });
        nextStep = 'CONTRADICTION_MINING';
      } else if (session.currentStep === 'CONTRADICTION_MINING') {
        const contradictions = await mineContradictions(userId, session.implicitBeliefs);
        
        // Generate juxtaposition cycles from contradictions
        const cycles: JuxtapositionCycle[] = contradictions.flatMap((insight, idx) => 
          insight.anchors.slice(0, 5).map((anchor, anchorIdx) => ({
            id: `cycle-${idx}-${anchorIdx}`,
            beliefId: insight.beliefId,
            cycleNumber: idx * 5 + anchorIdx + 1,
            steps: insight.juxtapositionPrompts.map((prompt, stepNum) => ({
              stepNumber: stepNum + 1,
              prompt,
              timestamp: new Date().toISOString()
            })),
            intensity: {
              baselineIntensity: session.baselineIntensity,
            },
          }))
        );
        
        updateSession({ contradictionInsights: contradictions, juxtapositionCycles: cycles });
        nextStep = 'JUXTAPOSITION';
      } else if (session.currentStep === 'INTEGRATION') {
        // Build integration selections
        const selections: IntegrationSelection[] = integrationChoice === 'curated'
          ? selectedPractices.map(practiceId => {
              const practice = memoryReconsolidationIntegrationOptions.find(p => p.practiceId === practiceId);
              return {
                id: `integration-${Date.now()}-${practiceId}`,
                practiceId,
                practiceName: practice?.practiceName || '',
                rationale: `Supports integration of new belief patterns`,
              };
            })
          : [{
              id: `integration-${Date.now()}-custom`,
              practiceId: 'custom-plan',
              practiceName: 'Self-Guided Integration',
              rationale: customPlan,
            }];

        const completionSummary: SessionCompletionSummary = {
          intensityShift: (postIntensity || session.baselineIntensity) - session.baselineIntensity,
          integrationChoice: mapUiChoiceToIntegrationType(integrationChoice!),
          selectedPractices: selections,
          userInsights: `${emotionalNotes}\n\nSomatic: ${somaticNotes}\n\nCognitive: ${cognitiveShifts}`,
          notes: schedulingCommitment,
        };

        updateSession({ 
          integrationSelections: selections,
          completionSummary,
          selectedGrounding: session.groundingOptions.find(g => selectedGrounding.includes(g.id))
        });
        
        // Submit to backend
        const response = await submitSessionCompletion({
          sessionId: session.id,
          userId,
          finalBeliefs: session.implicitBeliefs,
          contradictionInsights: session.contradictionInsights,
          personalReflection: `${emotionalNotes}\n\n${somaticNotes}\n\n${cognitiveShifts}`,
          commitments: integrationChoice === 'curated' ? selectedPractices : [customPlan],
          timestamp: new Date(),
        });
        
        setCompletionData(response);
        nextStep = 'COMPLETE';
      }

      updateSession({ currentStep: nextStep });
    } catch (err) {
      console.error('[MemoryRecon] Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    const currentIndex = STEPS.indexOf(session.currentStep);
    if (currentIndex > 0) {
      updateSession({ currentStep: STEPS[currentIndex - 1] });
    }
  };

  const handleComplete = () => {
    const finalSession: MemoryReconsolidationSession = {
      ...session,
      completedAt: new Date().toISOString(),
    };
    onSave(finalSession);
    setDraft(null);
  };

  const handleDownload = () => {
    const selectedBelief = session.implicitBeliefs[0];
    const shiftPercentage = session.completionSummary?.intensityShift 
      ? Math.round((session.completionSummary.intensityShift / session.baselineIntensity) * 100)
      : 0;

    const reportContent = `# Memory Reconsolidation Session Report
Date: ${new Date(session.date).toLocaleDateString()}

## Memory/Belief Addressed
${selectedBelief?.belief || 'N/A'}

Category: ${selectedBelief?.category || 'N/A'}
Emotional Charge: ${selectedBelief?.emotionalCharge || 'N/A'}/10
Body Location: ${selectedBelief?.bodyLocation || 'N/A'}

## Contradictions Explored
${session.contradictionInsights.map((c, i) => `${i + 1}. ${c.anchors.join(', ')}`).join('\n')}

## Intensity Shift
Baseline: ${session.baselineIntensity}/10
Post-Session: ${postIntensity}/10
Change: ${shiftPercentage}%

## Integration Plan
${session.completionSummary?.selectedPractices.map(p => `- ${p.practiceName}: ${p.rationale}`).join('\n') || 'N/A'}

## Grounding Resources Selected
${selectedGrounding.map(id => {
  const grounding = session.groundingOptions.find(g => g.id === id);
  return `- ${grounding?.name}: ${grounding?.description}`;
}).join('\n')}

## Insights & Notes
${session.completionSummary?.userInsights || 'N/A'}

## Scheduling Commitment
${schedulingCommitment}

---
Generated by Aura ILP - Memory Reconsolidation Protocol
`;

    const blob = new Blob([reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memory-reconsolidation-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    const selectedBelief = session.implicitBeliefs[0];
    const shiftPercentage = session.completionSummary?.intensityShift 
      ? Math.round((session.completionSummary.intensityShift / session.baselineIntensity) * 100)
      : 0;
    
    const text = `Memory Reconsolidation Session Summary

Belief: ${selectedBelief?.belief}
Intensity Shift: ${shiftPercentage}%
Integration: ${session.completionSummary?.selectedPractices.map(p => p.practiceName).join(', ')}`;
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const integrationOptions = [
    { practiceId: 'meditation', practiceName: 'Daily Meditation', description: 'Mindful awareness practice', bestFor: ['grounding', 'awareness'] },
    { practiceId: 'expressive-writing', practiceName: 'Expressive Writing', description: 'Process emotions through writing', bestFor: ['emotional-regulation', 'integration'] },
    { practiceId: 'loving-kindness', practiceName: 'Loving-Kindness Meditation', description: 'Cultivate self-compassion', bestFor: ['compassion', 'self-acceptance'] },
    { practiceId: 'coherent-breathing', practiceName: 'Coherent Breathing', description: 'Regulate nervous system through breath', bestFor: ['regulation', 'grounding'] },
  ];
  
  const filteredPractices = integrationOptions.filter(p =>
    p.practiceName.toLowerCase().includes(searchFilter.toLowerCase()) ||
    p.description.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const renderStep = () => {
    switch (session.currentStep) {
      case 'ONBOARDING':
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold font-mono text-slate-100">Welcome to Memory Reconsolidation</h3>
            <p className="text-slate-300 leading-relaxed">
              Memory reconsolidation is a neurobiological process that allows deeply held beliefs to be updated at their source.
              This guided protocol will help you:
            </p>
            <ul className="space-y-3 text-slate-300">
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 font-bold">1.</span>
                <span>Identify implicit beliefs that shape your experience</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 font-bold">2.</span>
                <span>Discover contradictory evidence that challenges these beliefs</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 font-bold">3.</span>
                <span>Hold both old and new truths simultaneously (juxtaposition)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 font-bold">4.</span>
                <span>Ground and integrate the shift with ongoing practices</span>
              </li>
            </ul>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mt-6">
              <p className="text-amber-200 text-sm font-medium">
                💡 This process works best when you have 30-45 minutes of uninterrupted time and feel emotionally resourced.
              </p>
            </div>
          </div>
        );

      case 'BELIEF_IDENTIFICATION':
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold font-mono text-slate-100">Belief Identification</h3>
            <p className="text-slate-300">
              Describe a situation, pattern, or recurring feeling that you'd like to work with.
              The AI will help identify the implicit beliefs underneath.
            </p>
            <textarea
              value={beliefContext}
              onChange={e => setBeliefContext(e.target.value)}
              rows={8}
              placeholder="Example: 'Whenever I try to speak up in meetings, I feel my throat tighten and I convince myself that what I have to say isn't important enough. I end up staying quiet and feeling frustrated with myself afterward...'"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
            <div className="text-sm text-slate-400">
              Minimum 50 characters • {beliefContext.length}/50
            </div>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-400">Identifying implicit beliefs...</p>
              </div>
            ) : session.implicitBeliefs.length > 0 ? (
              <div className="space-y-4 mt-6">
                <h4 className="font-semibold text-slate-200">Identified Beliefs:</h4>
                {session.implicitBeliefs.map((belief, idx) => (
                  <div key={belief.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-2">
                    <div className="font-medium text-slate-100">{belief.belief}</div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-slate-400">
                      <div>Category: <span className="text-cyan-300">{belief.category}</span></div>
                      <div>Intensity: <span className="text-amber-300">{belief.emotionalCharge}/10</span></div>
                      <div>Affect: <span className="text-slate-300">{belief.affectTone}</span></div>
                      {belief.bodyLocation && <div>Body: <span className="text-slate-300">{belief.bodyLocation}</span></div>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <button
                onClick={handleNext}
                disabled={beliefContext.trim().length < 50}
                className="btn-luminous px-6 py-3 rounded-lg font-semibold"
              >
                Identify Beliefs
              </button>
            )}
          </div>
        );

      case 'CONTRADICTION_MINING':
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold font-mono text-slate-100">Contradiction Mining</h3>
            <p className="text-slate-300">
              Now we'll search for evidence and experiences that contradict your identified beliefs.
              These contradictions create the conditions for belief reconsolidation.
            </p>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-400">Mining contradictions...</p>
              </div>
            ) : session.contradictionInsights.length > 0 ? (
              <div className="space-y-4">
                {session.contradictionInsights.map((insight, idx) => {
                  const belief = session.implicitBeliefs.find(b => b.id === insight.beliefId);
                  return (
                    <div key={insight.beliefId} className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-cyan-500/30 rounded-lg p-6 space-y-4">
                      <div className="font-semibold text-slate-100">Belief: {belief?.belief}</div>
                      <div>
                        <div className="text-sm font-medium text-cyan-300 mb-2">Contradictory Evidence:</div>
                        <ul className="space-y-2">
                          {insight.anchors.map((anchor, aIdx) => (
                            <li key={aIdx} className="text-slate-300 flex items-start gap-2">
                              <span className="text-cyan-400">•</span>
                              <span>{anchor}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-emerald-300 mb-2">New Truths:</div>
                        <ul className="space-y-2">
                          {insight.newTruths.map((truth, tIdx) => (
                            <li key={tIdx} className="text-slate-300 flex items-start gap-2">
                              <span className="text-emerald-400">•</span>
                              <span>{truth}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <button
                onClick={handleNext}
                disabled={session.implicitBeliefs.length === 0}
                className="btn-luminous px-6 py-3 rounded-lg font-semibold"
              >
                Start Contradiction Mining
              </button>
            )}
          </div>
        );

      case 'JUXTAPOSITION':
        const currentCycle = session.juxtapositionCycles[currentCycleIndex];
        const totalCycles = Math.min(5, session.juxtapositionCycles.length);
        const belief = session.implicitBeliefs.find(b => b.id === currentCycle?.beliefId);
        const insight = session.contradictionInsights.find(c => c.beliefId === currentCycle?.beliefId);

        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold font-mono text-slate-100">Juxtaposition Experience</h3>
              <div className="text-slate-400">Cycle {currentCycleIndex + 1} of {totalCycles}</div>
            </div>
            <p className="text-slate-300">
              Hold both the old belief and new truth in awareness simultaneously. Notice what happens in your body and mind.
            </p>
            
            {prefersReducedMotion ? (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                <p className="text-amber-200 text-sm">
                  Animations disabled due to your reduced motion preference. Cycle content is displayed statically below.
                </p>
              </div>
            ) : (
              <div className="flex gap-4">
                <button
                  onClick={() => isPaused ? resumeJuxtaposition() : pauseJuxtaposition()}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 transition"
                >
                  {isPaused ? <Play size={18} /> : <Pause size={18} />}
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
              </div>
            )}

            {currentCycle && (
              <div className="space-y-6 mt-6">
                <div className={`bg-slate-800/60 border-2 rounded-xl p-6 transition-all duration-1000 ${
                  (prefersReducedMotion || currentCycleStep === 'old-truth' || currentCycleStep === 'pause') 
                    ? 'border-red-500/50 opacity-100' 
                    : 'border-red-500/20 opacity-40'
                }`}>
                  <div className="text-sm font-semibold text-red-300 mb-2">OLD TRUTH</div>
                  <div className="text-lg text-slate-100">{belief?.belief}</div>
                </div>

                <div className="flex justify-center">
                  <div className="w-0.5 h-16 bg-gradient-to-b from-red-500/50 via-cyan-500/50 to-emerald-500/50"></div>
                </div>

                <div className={`bg-slate-800/60 border-2 rounded-xl p-6 transition-all duration-1000 ${
                  (prefersReducedMotion || currentCycleStep === 'new-truth' || currentCycleStep === 'complete') 
                    ? 'border-emerald-500/50 opacity-100' 
                    : 'border-emerald-500/20 opacity-40'
                }`}>
                  <div className="text-sm font-semibold text-emerald-300 mb-2">NEW TRUTH</div>
                  <div className="text-lg text-slate-100">
                    {insight?.newTruths[0] || 'Generating...'}
                  </div>
                </div>

                {currentCycleStep === 'complete' && (
                  <div className="space-y-4 animate-fade-in-up">
                    <label className="block">
                      <span className="text-slate-300 text-sm font-medium mb-2 block">
                        Felt Shift (1-10):
                      </span>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={cycleIntensities[currentCycleIndex]?.postIntensity || 5}
                        onChange={e => setCycleIntensities(prev => ({
                          ...prev,
                          [currentCycleIndex]: {
                            baselineIntensity: session.baselineIntensity,
                            postIntensity: parseInt(e.target.value),
                          }
                        }))}
                        className="w-full"
                      />
                      <div className="text-slate-400 text-sm text-center mt-1">
                        {cycleIntensities[currentCycleIndex]?.postIntensity || 5}
                      </div>
                    </label>
                    <textarea
                      value={cycleNotes[currentCycleIndex] || ''}
                      onChange={e => setCycleNotes(prev => ({ ...prev, [currentCycleIndex]: e.target.value }))}
                      placeholder="What did you notice in your body? Any shifts in perspective?"
                      rows={3}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                    {currentCycleIndex < totalCycles - 1 ? (
                      <button
                        onClick={() => {
                          setCurrentCycleIndex(prev => prev + 1);
                          setCurrentCycleStep('old-truth');
                          if (!prefersReducedMotion) startJuxtapositionCycle(currentCycleIndex + 1);
                        }}
                        className="btn-luminous px-6 py-2 rounded-lg font-semibold w-full"
                      >
                        Next Cycle
                      </button>
                    ) : (
                      <button
                        onClick={() => updateSession({ currentStep: 'GROUNDING' })}
                        className="btn-luminous px-6 py-2 rounded-lg font-semibold w-full"
                      >
                        Complete Juxtaposition
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {!prefersReducedMotion && currentCycleStep !== 'complete' && currentCycle && (
              <button
                onClick={() => {
                  if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
                  startJuxtapositionCycle(currentCycleIndex);
                }}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 transition w-full"
              >
                Restart Cycle
              </button>
            )}
          </div>
        );

      case 'GROUNDING':
        const shiftPercentage = postIntensity !== null
          ? Math.round(((postIntensity - session.baselineIntensity) / session.baselineIntensity) * -100)
          : 0;

        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold font-mono text-slate-100">Post-Session Check-In</h3>
            <p className="text-slate-300">
              Take a moment to assess how you're feeling now compared to when we started.
            </p>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-2">Baseline Intensity</div>
                <div className="text-3xl font-bold text-red-300">{session.baselineIntensity}/10</div>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-2">Current Intensity</div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={postIntensity || session.baselineIntensity}
                  onChange={e => setPostIntensity(parseInt(e.target.value))}
                  className="w-full mb-2"
                />
                <div className="text-3xl font-bold text-emerald-300">{postIntensity || session.baselineIntensity}/10</div>
              </div>
            </div>

            {postIntensity !== null && (
              <div className="bg-gradient-to-br from-cyan-900/20 to-emerald-900/20 border border-cyan-500/30 rounded-lg p-4">
                <div className="text-lg font-semibold text-cyan-200">
                  Intensity Shift: {shiftPercentage > 0 ? '+' : ''}{shiftPercentage}%
                </div>
              </div>
            )}

            <div className="space-y-4">
              <label className="block">
                <span className="text-slate-300 font-medium mb-2 block">Emotional Notes:</span>
                <textarea
                  value={emotionalNotes}
                  onChange={e => setEmotionalNotes(e.target.value)}
                  placeholder="What emotions are present now? How have they shifted?"
                  rows={3}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </label>

              <label className="block">
                <span className="text-slate-300 font-medium mb-2 block">Somatic/Body Notes:</span>
                <textarea
                  value={somaticNotes}
                  onChange={e => setSomaticNotes(e.target.value)}
                  placeholder="What sensations do you notice in your body? Where is tension or ease?"
                  rows={3}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </label>

              <label className="block">
                <span className="text-slate-300 font-medium mb-2 block">Cognitive Shifts:</span>
                <textarea
                  value={cognitiveShifts}
                  onChange={e => setCognitiveShifts(e.target.value)}
                  placeholder="What new perspectives or insights emerged? How is your thinking different?"
                  rows={3}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </label>
            </div>
          </div>
        );

      case 'INTEGRATION':
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold font-mono text-slate-100">Integration Protocol</h3>
            <p className="text-slate-300">
              Choose how you'll integrate and anchor this shift. Selection is required to complete the session.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setIntegrationChoice('curated')}
                className={`p-4 rounded-lg border-2 transition ${
                  integrationChoice === 'curated'
                    ? 'bg-cyan-900/30 border-cyan-500'
                    : 'bg-slate-800/30 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="font-semibold text-slate-100">Curated Practices</div>
                <div className="text-sm text-slate-400 mt-1">Choose from evidence-based practices</div>
              </button>
              <button
                onClick={() => setIntegrationChoice('self-guided')}
                className={`p-4 rounded-lg border-2 transition ${
                  integrationChoice === 'self-guided'
                    ? 'bg-cyan-900/30 border-cyan-500'
                    : 'bg-slate-800/30 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="font-semibold text-slate-100">Self-Guided Plan</div>
                <div className="text-sm text-slate-400 mt-1">Create your own integration approach</div>
              </button>
            </div>

            {integrationChoice === 'curated' && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={e => setSearchFilter(e.target.value)}
                    placeholder="Search practices..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {filteredPractices.map(practice => (
                    <div
                      key={practice.practiceId}
                      onClick={() => {
                        setSelectedPractices(prev =>
                          prev.includes(practice.practiceId)
                            ? prev.filter(id => id !== practice.practiceId)
                            : [...prev, practice.practiceId]
                        );
                      }}
                      className={`p-4 rounded-lg border cursor-pointer transition ${
                        selectedPractices.includes(practice.practiceId)
                          ? 'bg-cyan-900/30 border-cyan-500'
                          : 'bg-slate-800/30 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-slate-100">{practice.practiceName}</div>
                          <div className="text-sm text-slate-400 mt-1">{practice.description}</div>
                          <div className="text-xs text-cyan-300 mt-2">
                            Best for: {practice.bestFor.join(', ')}
                          </div>
                        </div>
                        {selectedPractices.includes(practice.practiceId) && (
                          <CheckCircle className="text-cyan-400 flex-shrink-0 ml-2" size={20} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {integrationChoice === 'self-guided' && (
              <textarea
                value={customPlan}
                onChange={e => setCustomPlan(e.target.value)}
                placeholder="Describe your self-guided integration plan... (minimum 20 characters)"
                rows={6}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            )}

            <div className="space-y-4 pt-4 border-t border-slate-700">
              <label className="block">
                <span className="text-slate-300 font-medium mb-2 block">Scheduling Commitment:</span>
                <textarea
                  value={schedulingCommitment}
                  onChange={e => setSchedulingCommitment(e.target.value)}
                  placeholder="When and how will you practice? Be specific (e.g., 'Morning meditation for 10 minutes before work, 5 days/week')"
                  rows={3}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </label>

              <div>
                <span className="text-slate-300 font-medium mb-3 block">Nervous System Support:</span>
                <div className="space-y-2">
                  {memoryReconsolidationGroundingOptions.slice(0, 5).map(grounding => (
                    <div
                      key={grounding.id}
                      onClick={() => {
                        setSelectedGrounding(prev =>
                          prev.includes(grounding.id)
                            ? prev.filter(id => id !== grounding.id)
                            : [...prev, grounding.id]
                        );
                      }}
                      className={`p-3 rounded-lg border cursor-pointer transition ${
                        selectedGrounding.includes(grounding.id)
                          ? 'bg-cyan-900/30 border-cyan-500'
                          : 'bg-slate-800/30 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-slate-100 text-sm">{grounding.name}</div>
                          <div className="text-xs text-slate-400 mt-1">{grounding.description}</div>
                        </div>
                        {selectedGrounding.includes(grounding.id) && (
                          <CheckCircle className="text-cyan-400 flex-shrink-0 ml-2" size={18} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'COMPLETE':
        const selectedBelief = session.implicitBeliefs[0];
        const finalShift = session.completionSummary?.intensityShift 
          ? Math.round((session.completionSummary.intensityShift / session.baselineIntensity) * -100)
          : 0;

        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-white" size={32} />
              </div>
              <h3 className="text-2xl font-bold font-mono text-slate-100">Session Complete</h3>
              <p className="text-slate-300 mt-2">Your memory reconsolidation work has been saved.</p>
            </div>

            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-cyan-500/30 rounded-xl p-6 space-y-4">
              <div>
                <div className="text-sm text-slate-400 mb-1">Memory/Belief Addressed</div>
                <div className="text-lg font-medium text-slate-100">{selectedBelief?.belief}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-slate-400 mb-1">Intensity Shift</div>
                  <div className="text-2xl font-bold text-emerald-300">{finalShift}%</div>
                </div>
                <div>
                  <div className="text-sm text-slate-400 mb-1">Cycles Completed</div>
                  <div className="text-2xl font-bold text-cyan-300">{currentCycleIndex + 1}</div>
                </div>
              </div>

              <div>
                <div className="text-sm text-slate-400 mb-2">Integration Practices</div>
                <div className="space-y-1">
                  {session.completionSummary?.selectedPractices.map(p => (
                    <div key={p.id} className="text-slate-300 text-sm">• {p.practiceName}</div>
                  ))}
                </div>
              </div>

              {completionData?.suggestedPractices && completionData.suggestedPractices.length > 0 && (
                <div>
                  <div className="text-sm text-slate-400 mb-2">AI-Suggested Follow-Up</div>
                  <div className="space-y-1">
                    {completionData.suggestedPractices.map((practice: string, idx: number) => (
                      <div key={idx} className="text-slate-300 text-sm">• {practice}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 transition"
              >
                <Download size={18} />
                Download Report
              </button>
              <button
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 transition"
              >
                <Copy size={18} />
                {copied ? 'Copied!' : 'Copy Summary'}
              </button>
            </div>

            <button
              onClick={handleComplete}
              className="btn-luminous px-6 py-3 rounded-lg font-semibold w-full"
            >
              Save & Close
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  const currentStepIndex = STEPS.indexOf(session.currentStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl w-full max-w-4xl border border-slate-700 shadow-2xl my-8">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-100">Memory Reconsolidation</h2>
            <div className="text-sm text-slate-400 mt-1">
              Step {currentStepIndex + 1} of {STEPS.length}: {session.currentStep.replace(/_/g, ' ')}
            </div>
          </div>
          <button onClick={handleSaveDraftAndClose} className="text-slate-400 hover:text-slate-200 transition">
            <X size={24} />
          </button>
        </div>

        <div className="h-1 bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-8 max-h-[calc(100vh-16rem)] overflow-y-auto">
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="text-red-200 font-medium mb-2">Error</div>
              <div className="text-red-300 text-sm">{error}</div>
              <button
                onClick={() => setError(null)}
                className="mt-3 px-4 py-2 bg-red-900/30 hover:bg-red-900/50 rounded text-red-200 text-sm transition"
              >
                Retry
              </button>
            </div>
          )}
          
          {renderStep()}
        </div>

        <div className="p-6 border-t border-slate-700 flex items-center justify-between bg-slate-900/50">
          <button
            onClick={handleBack}
            disabled={currentStepIndex === 0 || session.currentStep === 'COMPLETE'}
            className="flex items-center gap-2 px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          {session.currentStep !== 'COMPLETE' && (
            <button
              onClick={handleNext}
              disabled={!canProceedToNext()}
              className="flex items-center gap-2 px-6 py-2 btn-luminous rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Processing...
                </>
              ) : (
                <>
                  Next
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
