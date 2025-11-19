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
import { X, ArrowRight, Download, Copy, Search, CheckCircle } from 'lucide-react';
import { 
  extractImplicitBeliefs, 
  mineContradictions,
  type ExtractImplicitBeliefsPayload,
  type MineContradictionsPayload
} from '../services/memoryReconsolidationService.ts';
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
  const [selectedBeliefId, setSelectedBeliefId] = useState<string | null>(null);
  
  // Juxtaposition state
  const [currentCycleIndex, setCurrentCycleIndex] = useState(0);
  const [currentCycleStep, setCurrentCycleStep] = useState<'old-truth' | 'new-truth' | 'complete'>('old-truth');
  const [cycleIntensities, setCycleIntensities] = useState<Record<number, IntensityReading>>({});
  const [cycleNotes, setCycleNotes] = useState<Record<number, string>>({});
  
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
  }, []);

  // Initialize postIntensity when entering GROUNDING step
  useEffect(() => {
    if (session.currentStep === 'GROUNDING' && postIntensity === null) {
      setPostIntensity(session.baselineIntensity);
    }
  }, [session.currentStep, session.baselineIntensity, postIntensity]);

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
        return true;
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

  const handleExtractBeliefs = async () => {
    if (beliefContext.trim().length < 50) {
      setError('Please provide at least 50 characters of context');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const payload: ExtractImplicitBeliefsPayload = {
        memoryNarrative: beliefContext,
        baselineIntensity: session.baselineIntensity
      };
      
      const response = await extractImplicitBeliefs(payload);
      
      updateSession({ 
        implicitBeliefs: response.beliefs,
        baselineIntensity: response.beliefs[0]?.emotionalCharge || session.baselineIntensity
      });
      setSelectedBeliefId(response.beliefs[0]?.id ?? null);
    } catch (err) {
      console.error('[MemoryRecon] Error extracting beliefs:', err);
      setError(err instanceof Error ? err.message : 'Failed to extract beliefs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  const handleNext = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const currentIndex = STEPS.indexOf(session.currentStep);
      let nextStep = STEPS[currentIndex + 1] || session.currentStep;

      if (session.currentStep === 'BELIEF_IDENTIFICATION') {
        // Beliefs should already be extracted via handleExtractBeliefs
        // Just move to next step
        nextStep = 'CONTRADICTION_MINING';
      } else if (session.currentStep === 'CONTRADICTION_MINING') {
        const payload: MineContradictionsPayload = {
          beliefs: session.implicitBeliefs.map(b => ({ id: b.id, belief: b.belief })),
          beliefIds: session.implicitBeliefs.map(b => b.id)
        };

        const response = await mineContradictions(payload);

        // Generate juxtaposition cycles from contradictions
        // Create one cycle per new truth (up to 3 cycles total)
        const cycles: JuxtapositionCycle[] = response.contradictions.flatMap((insight, insightIdx) => {
          const newTruths = Array.isArray(insight.newTruths) ? insight.newTruths : [insight.newTruths || 'Alternative perspective'];

          // Create up to 3 cycles total across all insights
          return newTruths.slice(0, 3).map((newTruth, truthIdx) => {
            const cycleNumber = insightIdx * 3 + truthIdx + 1;
            const correspondingAnchor = Array.isArray(insight.anchors) && insight.anchors[truthIdx]
              ? insight.anchors[truthIdx]
              : Array.isArray(insight.anchors) && insight.anchors[0]
              ? insight.anchors[0]
              : 'Lived evidence that contradicts the old belief';

            return {
              id: `cycle-${insightIdx}-${truthIdx}`,
              beliefId: insight.beliefId,
              cycleNumber,
              steps: [
                {
                  stepNumber: 1,
                  prompt: `Hold the old belief: "${session.implicitBeliefs.find(b => b.id === insight.beliefId)?.belief || ''}"`,
                  timestamp: new Date().toISOString()
                },
                {
                  stepNumber: 2,
                  prompt: `Now hold the contradiction: "${correspondingAnchor}"`,
                  timestamp: new Date().toISOString()
                },
                {
                  stepNumber: 3,
                  prompt: `Experience both simultaneously. Let your nervous system feel the mismatch.`,
                  timestamp: new Date().toISOString()
                }
              ],
              intensity: {
                baselineIntensity: session.baselineIntensity
              },
              notes: `New truth: ${newTruth}`
            };
          });
        }).slice(0, 3); // Cap total cycles at 3

        updateSession({ contradictionInsights: response.contradictions, juxtapositionCycles: cycles });
        nextStep = 'JUXTAPOSITION';
      } else if (session.currentStep === 'INTEGRATION') {
        // Build integration selections
        const selections: IntegrationSelection[] = integrationChoice === 'curated'
          ? selectedPractices.map(practiceId => {
              const practice = integrationOptions.find(p => p.practiceId === practiceId);
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
        
        // Set completion data for display
        setCompletionData({
          success: true,
          sessionId: session.id,
          integrationSummary: 'Your memory reconsolidation work has been saved',
          suggestedPractices: selections.map(s => s.practiceName)
        });
        
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
${session.contradictionInsights.map((c, i) => `${i + 1}. ${(c.anchors || []).join(', ')}`).join('\n')}

## Intensity Shift
Baseline: ${session.baselineIntensity}/10
Post-Session: ${postIntensity}/10
Change: ${shiftPercentage}%

## Integration Plan
${(session.completionSummary?.selectedPractices || []).map(p => `- ${p.practiceName}: ${p.rationale}`).join('\n') || 'N/A'}

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
Integration: ${(session.completionSummary?.selectedPractices || []).map(p => p.practiceName).join(', ')}`;
    
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
            
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
              <p className="text-cyan-100 font-medium mb-2">What You're About to Do:</p>
              <p className="text-slate-300 text-sm leading-relaxed">
                Memory reconsolidation is a neurobiological process that allows deeply held beliefs to be updated at their source. 
                This isn't just talk therapy—it's a guided protocol that creates the precise conditions for lasting change.
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-slate-200 font-medium">This session will guide you through:</p>
              <ul className="space-y-3 text-slate-300">
                <li className="flex items-start gap-3">
                  <span className="text-cyan-400 font-bold">1.</span>
                  <div>
                    <span className="font-medium text-slate-200">Belief Identification</span>
                    <p className="text-sm text-slate-400 mt-1">We'll help you uncover the implicit beliefs driving your patterns</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cyan-400 font-bold">2.</span>
                  <div>
                    <span className="font-medium text-slate-200">Contradiction Mining</span>
                    <p className="text-sm text-slate-400 mt-1">Find real evidence that contradicts these beliefs</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cyan-400 font-bold">3.</span>
                  <div>
                    <span className="font-medium text-slate-200">Juxtaposition Experience</span>
                    <p className="text-sm text-slate-400 mt-1">Hold both truths simultaneously—this is where reconsolidation happens</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cyan-400 font-bold">4.</span>
                  <div>
                    <span className="font-medium text-slate-200">Grounding & Integration</span>
                    <p className="text-sm text-slate-400 mt-1">Anchor the shift with practices that support lasting change</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mt-6">
              <p className="text-amber-200 text-sm font-medium mb-2">⏱️ Time & Readiness:</p>
              <p className="text-amber-100 text-sm">
                Set aside 30-45 minutes of uninterrupted time. This process works best when you feel emotionally 
                resourced and have the capacity to engage with difficult material.
              </p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mt-4">
              <p className="text-slate-300 text-sm">
                <span className="text-cyan-300 font-medium">What's next: </span>
                You'll describe a situation or pattern you'd like to work with, and we'll identify the beliefs underneath.
              </p>
            </div>
          </div>
        );

      case 'BELIEF_IDENTIFICATION':
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold font-mono text-slate-100">Belief Identification</h3>
            
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
              <p className="text-cyan-100 font-medium mb-2">What You're Doing:</p>
              <p className="text-slate-300 text-sm leading-relaxed">
                Most beliefs that shape our experience operate outside conscious awareness. By describing a situation 
                or pattern in detail, we can help you identify the implicit beliefs underneath—the hidden assumptions 
                that drive your reactions, feelings, and behaviors.
              </p>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="text-slate-200 font-medium mb-2 block">
                  Describe a situation, pattern, or recurring feeling:
                </span>
                <textarea
                  value={beliefContext}
                  onChange={e => setBeliefContext(e.target.value)}
                  rows={8}
                  placeholder="Example: 'Whenever I try to speak up in meetings, I feel my throat tighten and I convince myself that what I have to say isn't important enough. I end up staying quiet and feeling frustrated with myself afterward...'"
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </label>
              <div className="text-sm text-slate-400">
                Minimum 50 characters • {beliefContext.length}/50
              </div>
            </div>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-400">Identifying implicit beliefs...</p>
              </div>
            ) : session.implicitBeliefs.length > 0 ? (
              <div className="space-y-4 mt-6">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                  <p className="text-emerald-100 text-sm">
                    We mapped the core beliefs hidden inside your description. If you add more detail later, we'll bring you back here automatically so your contradictions stay aligned with the updated narrative.
                  </p>
                </div>
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
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-lg p-4 text-sm text-slate-300">
                  <span className="text-cyan-300 font-medium">What's next: </span>
                  We'll surface real-life contradictions that loosen these beliefs.
                </div>
              </div>
            ) : (
              <button
                onClick={handleExtractBeliefs}
                disabled={beliefContext.trim().length < 50 || isLoading}
                className="btn-luminous px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Identifying...' : 'Identify Beliefs'}
              </button>
            )}
          </div>
        );

      case 'CONTRADICTION_MINING':
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold font-mono text-slate-100">Contradiction Mining</h3>
            
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
              <p className="text-cyan-100 font-medium mb-2">What You're Doing:</p>
              <p className="text-slate-300 text-sm leading-relaxed">
                Memory reconsolidation requires a specific condition: your brain must experience contradictory evidence 
                that disconfirms the old belief <em>while the belief is active</em>. We'll mine your life experience 
                for moments that contradict what you just identified—these become the anchors for new neural patterns.
              </p>
            </div>
            
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              <p className="text-amber-100 text-sm">
                💡 These contradictions don't have to be dramatic—small, real moments are often more powerful than grand narratives.
              </p>
            </div>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-400">Mining contradictions...</p>
              </div>
            ) : session.contradictionInsights.length > 0 ? (
              <div className="space-y-4">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                  <p className="text-emerald-100 text-sm">
                    These are the real-life experiences that contradict your old belief. We'll automatically carry forward 
                    the rich contradictions for juxtaposition. If you refine your belief narrative, we'll loop you back here 
                    so everything stays coherent.
                  </p>
                </div>
                {session.contradictionInsights.map((insight, idx) => {
                  const belief = session.implicitBeliefs.find(b => b.id === insight.beliefId);
                  return (
                    <div key={insight.beliefId} className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-cyan-500/30 rounded-lg p-6 space-y-4">
                      <div className="font-semibold text-slate-100">Belief: {belief?.belief}</div>
                      <div>
                        <div className="text-sm font-medium text-cyan-300 mb-2">Contradictory Evidence:</div>
                        <ul className="space-y-2">
                          {(insight.anchors || []).map((anchor, aIdx) => (
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
                          {(insight.newTruths || []).map((truth, tIdx) => (
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
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-lg p-4 text-sm text-slate-300">
                  <span className="text-cyan-300 font-medium">What's next: </span>
                  We'll move into juxtaposition to let your nervous system hold both realities at once.
                </div>
              </div>
            ) : (
              <button
                onClick={handleNext}
                disabled={session.implicitBeliefs.length === 0}
                className="btn-luminous px-6 py-3 rounded-lg font-semibold"
              >
                Surface Contradictions
              </button>
            )}
          </div>
        );

      case 'JUXTAPOSITION':
        const currentCycle = session.juxtapositionCycles[currentCycleIndex];
        const totalCycles = Math.min(3, session.juxtapositionCycles.length);
        const belief = session.implicitBeliefs.find(b => b.id === currentCycle?.beliefId);
        const insight = session.contradictionInsights.find(c => c.beliefId === currentCycle?.beliefId);

        // Reset cycle step when moving to a new cycle
        useEffect(() => {
          setCurrentCycleStep('old-truth');
        }, [currentCycleIndex]);

        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold font-mono text-slate-100">Juxtaposition Experience</h3>
              <div className="text-slate-400">Cycle {currentCycleIndex + 1} of {totalCycles}</div>
            </div>

            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
              <p className="text-cyan-100 font-medium mb-2">What You're Doing:</p>
              <p className="text-slate-300 text-sm leading-relaxed">
                Hold each truth in your awareness. Feel it in your body. When you feel ready, switch to the other.
                The goal is to experience the mismatch between these two realities at the same time.
              </p>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              <p className="text-amber-100 text-sm">
                💡 There's no "right" amount of time to spend with each perspective. Go at your own pace.
              </p>
            </div>

            {currentCycle ? (
              <div className="space-y-6 mt-6">
                {/* Old Truth Panel */}
                <div className={`bg-slate-800/60 border-2 rounded-xl p-6 transition-all duration-500 min-h-24 flex flex-col justify-center ${
                  currentCycleStep === 'old-truth'
                    ? 'border-red-500/50 opacity-100 scale-100'
                    : 'border-slate-700 opacity-50 scale-95'
                }`}>
                  <div className="text-sm font-semibold text-red-300 mb-2">OLD TRUTH</div>
                  <div className="text-lg text-slate-100">{belief?.belief}</div>
                </div>

                {/* New Truth Panel */}
                <div className={`bg-slate-800/60 border-2 rounded-xl p-6 transition-all duration-500 min-h-24 flex flex-col justify-center ${
                  currentCycleStep === 'new-truth'
                    ? 'border-emerald-500/50 opacity-100 scale-100'
                    : 'border-slate-700 opacity-50 scale-95'
                }`}>
                  <div className="text-sm font-semibold text-emerald-300 mb-2">NEW TRUTH</div>
                  <div className="text-lg text-slate-100">
                    {currentCycle.notes?.replace('New truth: ', '') || 'Alternative perspective'}
                  </div>
                </div>

                {/* User Control Buttons */}
                {currentCycleStep !== 'complete' ? (
                  <div className="flex flex-col gap-3 pt-6 border-t border-slate-700">
                    <button
                      onClick={() => setCurrentCycleStep(currentCycleStep === 'old-truth' ? 'new-truth' : 'old-truth')}
                      className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 rounded-lg font-semibold text-lg w-full text-white shadow-lg transition"
                    >
                      Switch Perspective
                    </button>
                    <button
                      onClick={() => setCurrentCycleStep('complete')}
                      className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 transition text-sm w-full"
                    >
                      I'm ready to reflect on this cycle
                    </button>
                  </div>
                ) : (
                  /* Reflection UI */
                  <div className="space-y-4 animate-fade-in-up pt-4 border-t border-slate-700">
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
            ) : (
              <div className="bg-amber-500/20 border border-amber-500/50 rounded-lg p-6 text-center">
                <p className="text-amber-100 text-lg mb-2">Loading juxtaposition cycles...</p>
                <p className="text-amber-200 text-sm">If this persists, try going back to refresh the contradictions.</p>
              </div>
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
            
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
              <p className="text-cyan-100 font-medium mb-2">What You're Doing:</p>
              <p className="text-slate-300 text-sm leading-relaxed">
                After juxtaposition work, it's important to ground and assess what's shifted. You'll track changes in 
                emotional intensity, body sensations, and cognitive patterns. This data helps you see the impact of 
                the work and prepares you for integration.
              </p>
            </div>
            
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

            <div className="bg-slate-800/40 border border-slate-700/60 rounded-lg p-4 text-sm text-slate-300">
              <span className="text-cyan-300 font-medium">What's next: </span>
              Once you capture your check-in, we'll guide you into integration planning so the new learning has a home in daily life.
            </div>
          </div>
        );

      case 'INTEGRATION':
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold font-mono text-slate-100">Integration Protocol</h3>
            
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
              <p className="text-cyan-100 font-medium mb-2">What You're Doing:</p>
              <p className="text-slate-300 text-sm leading-relaxed">
                Reconsolidation is a window—it opens the belief for updating, but integration is what cements the new pattern. 
                You'll select practices, schedule them into your life, and choose nervous system support to help the shift 
                stabilize over the coming days and weeks.
              </p>
            </div>
            
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              <p className="text-amber-100 text-sm">
                💡 Concrete commitments (specific time + context) are far more effective than vague intentions.
              </p>
            </div>

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
                  {(session.groundingOptions || []).slice(0, 5).map(grounding => (
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

            <div className="bg-slate-800/40 border border-slate-700/60 rounded-lg p-4 text-sm text-slate-300">
              <span className="text-cyan-300 font-medium">What's next: </span>
              Once your integration plan is set, we'll generate a session summary you can download or copy for future reference.
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
                  {(session.completionSummary?.selectedPractices || []).map(p => (
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

        <div className="p-6 border-t border-slate-700 flex items-center justify-end bg-slate-900/50">
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
                  Continue
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
