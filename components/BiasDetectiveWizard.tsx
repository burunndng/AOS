

import React, { useState, useEffect } from 'react';
import { BiasDetectiveSession, DiscoveryAnswers, BiasScenario } from '../types.ts';
import { X, ArrowLeft, ArrowRight, BrainCircuit, Lightbulb, Check, ChevronRight, Download } from 'lucide-react';
import { generateBiasedDecisionAnalysis, generateBiasScenarios } from '../services/biasDetectiveService.ts';
import * as ragService from '../services/ragService.ts';

interface BiasDetectiveWizardProps {
  onClose: () => void;
  onSave: (session: BiasDetectiveSession) => void;
  session: BiasDetectiveSession | null;
  setDraft: (session: BiasDetectiveSession | null) => void;
  userId: string;
}

type WizardStep = 'DECISION' | 'REASONING' | 'DISCOVERY' | 'DISCOVERING' | 'DIAGNOSIS' | 'SCENARIOS' | 'COMMITMENT' | 'LEARNING' | 'COMPLETE';

const STEP_LABELS: Record<WizardStep, string> = {
  DECISION: 'The Decision',
  REASONING: 'Your Reasoning',
  DISCOVERY: 'Discovering Patterns',
  DISCOVERING: 'Analyzing...',
  DIAGNOSIS: 'What\'s Operating',
  SCENARIOS: 'Practicing Different Moves',
  COMMITMENT: 'Your Commitment',
  LEARNING: 'Key Takeaway',
  COMPLETE: 'Complete'
};

const STEPS: WizardStep[] = ['DECISION', 'REASONING', 'DISCOVERY', 'DIAGNOSIS', 'SCENARIOS', 'COMMITMENT', 'LEARNING'];

export default function BiasDetectiveWizard({ onClose, onSave, session: draft, setDraft, userId }: BiasDetectiveWizardProps) {
  const [step, setStep] = useState<WizardStep>(draft?.currentStep as WizardStep || 'DECISION');
  const [decisionText, setDecisionText] = useState(draft?.decisionText || '');
  const [reasoning, setReasoning] = useState(draft?.reasoning || '');
  const [discoveryAnswers, setDiscoveryAnswers] = useState<DiscoveryAnswers>(draft?.discoveryAnswers || {
    alternativesConsidered: '',
    informationSources: '',
    timePressure: '',
    emotionalState: '',
    influencers: ''
  });
  const [biasesIdentified, setBiasesIdentified] = useState<string>(draft?.diagnosis || ''); // LLM diagnosis summary
  const [scenarios, setScenarios] = useState<BiasScenario[]>(draft?.scenarios || []);
  const [selectedScenario, setSelectedScenario] = useState<number | null>(null);
  const [commitment, setCommitment] = useState(draft?.nextTimeAction || '');
  const [learning, setLearning] = useState(draft?.oneThingToRemember || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [ragSyncing, setRagSyncing] = useState(false);
  const [ragInsights, setRagInsights] = useState<string[]>([]);

  // Hydrate from draft if it exists
  useEffect(() => {
    if (draft) {
      setDecisionText(draft.decisionText || '');
      setReasoning(draft.reasoning || '');
      if (draft.discoveryAnswers) setDiscoveryAnswers(draft.discoveryAnswers);
      if (draft.diagnosis) setBiasesIdentified(draft.diagnosis);
      if (draft.scenarios) setScenarios(draft.scenarios);
      if (draft.oneThingToRemember) setLearning(draft.oneThingToRemember);
      if (draft.nextTimeAction) setCommitment(draft.nextTimeAction);
    }
  }, [draft]);

  const handleSaveDraft = () => {
    const session: BiasDetectiveSession = {
      id: draft?.id || `bias-${Date.now()}`,
      date: draft?.date || new Date().toISOString(),
      currentStep: step,
      decisionText,
      reasoning,
      discoveryAnswers,
      diagnosis: biasesIdentified,
      scenarios: scenarios,
      oneThingToRemember: learning,
      nextTimeAction: commitment,
      // Deprecated fields, kept for type compatibility
      identifiedBiases: [],
      alternativeFramings: [],
    };
    setDraft(session);
    onClose();
  };

  // RAG: Generate insights and sync session
  const handleCompleteWithRAG = async (session: BiasDetectiveSession) => {
    // First save the session normally
    onSave(session);

    // Then generate RAG insights and sync
    setRagSyncing(true);
    try {
      // Extract identified biases from diagnosis text
      const biasPatterns = biasesIdentified.match(/\b\w+\s+bias\b/gi) || [];
      const identifiedBiases = biasPatterns.length > 0
        ? biasPatterns
        : ['confirmation bias', 'availability bias', 'anchoring bias']; // Fallback

      // Generate RAG insights
      const insights = await ragService.generateBiasDetectiveInsights(userId, {
        decision: decisionText,
        reasoning: reasoning,
        identifiedBiases: identifiedBiases,
        scenarios: scenarios.reduce((acc: Record<string, string>, s, i) => {
          acc[`scenario_${i}`] = s.scenario;
          return acc;
        }, {}),
      });

      setRagInsights(insights.metadata?.insights || []);

      // Sync the completed session to backend
      await ragService.syncUserSession(userId, {
        id: session.id,
        userId: userId,
        type: 'bias_detective',
        content: {
          decision: decisionText,
          reasoning: reasoning,
          identifiedBiases: identifiedBiases,
          diagnosis: biasesIdentified,
          scenarios: scenarios,
        },
        insights: insights.metadata?.insights || [],
        completedAt: new Date(),
      });

      console.log('[BiasDetectiveWizard] Session synced and indexed');
    } catch (err) {
      console.error('[BiasDetectiveWizard] RAG sync error:', err);
      // Don't block completion if RAG fails - session is already saved locally
    } finally {
      setRagSyncing(false);
    }
  };

  const handleNext = async () => {
    setError('');
    const currentIdx = STEPS.indexOf(step);
    
    if (step === 'REASONING') {
      setStep('DISCOVERY');
    } else if (step === 'DISCOVERY') {
      // Trigger Socratic analysis → diagnosis
      setIsLoading(true);
      setStep('DISCOVERING');
      try {
        const diagnosis = await generateBiasedDecisionAnalysis(
          decisionText,
          reasoning,
          discoveryAnswers
        );
        setBiasesIdentified(diagnosis);
        setStep('DIAGNOSIS');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Analysis failed');
        setStep('DISCOVERY');
      } finally {
        setIsLoading(false);
      }
    } else if (step === 'DIAGNOSIS') {
      // Generate scenario-based reframings
      setIsLoading(true);
      try {
        const scenariosData = await generateBiasScenarios(
          decisionText,
          reasoning,
          biasesIdentified
        );
        setScenarios(scenariosData);
        setStep('SCENARIOS');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Scenario generation failed');
      } finally {
        setIsLoading(false);
      }
    } else if (step === 'SCENARIOS') {
        setStep('COMMITMENT');
    } else if (step === 'COMMITMENT') {
        setStep('LEARNING');
    } else if (step === 'LEARNING') {
        const session: BiasDetectiveSession = {
            id: draft?.id || `bias-${Date.now()}`,
            date: draft?.date || new Date().toISOString(),
            currentStep: 'COMPLETE',
            decisionText,
            reasoning,
            discoveryAnswers,
            diagnosis: biasesIdentified,
            scenarios: scenarios,
            oneThingToRemember: learning,
            nextTimeAction: commitment,
            // Deprecated fields
            identifiedBiases: [],
            alternativeFramings: [],
        };
        // Use RAG-aware completion handler
        handleCompleteWithRAG(session);
    } else {
        const nextStep = STEPS[currentIdx + 1];
        if (nextStep) {
            setStep(nextStep);
        }
    }
  };

  const handleBack = () => {
    const currentIdx = STEPS.indexOf(step);
    if (currentIdx > 0) {
      setStep(STEPS[currentIdx - 1]);
    }
  };

  const handleDownload = () => {
    const reportContent = `# Bias Detective Session Report
Date: ${new Date().toLocaleDateString()}

## 1. The Decision
${decisionText}

## 2. Your Reasoning
${reasoning}

## 3. Discovering Patterns (Your Answers)
- **Alternatives Considered:** ${discoveryAnswers.alternativesConsidered || 'N/A'}
- **Information Sources & Gaps:** ${discoveryAnswers.informationSources || 'N/A'}
- **Time Pressure:** ${discoveryAnswers.timePressure || 'N/A'}
- **Emotional State:** ${discoveryAnswers.emotionalState || 'N/A'}
- **Influencers:** ${discoveryAnswers.influencers || 'N/A'}

## 4. What's Operating (Aura's Diagnosis)
${biasesIdentified || 'No diagnosis generated yet.'}

## 5. Practicing Different Moves (Scenarios)
${scenarios.length > 0 ? scenarios.map((s, i) => `### Scenario ${i + 1}: ${s.biasName}
*   **How it Influenced:** ${s.howItInfluenced}
*   **What if?:** ${s.scenario}
*   **Alternative Decision:** ${s.alternativeDecision}`).join('\n\n') : 'No scenarios generated yet.'}

## 6. Your Commitment
${commitment || 'No commitment yet.'}

## 7. Key Takeaway
${learning || 'No key takeaway yet.'}

---
Generated by Aura ILP
`;

    const blob = new Blob([reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bias-detective-report-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderStep = () => {
    switch (step) {
      case 'DECISION':
        return (
          <>
            <h3 className="text-lg font-semibold font-mono text-blue-300">Step 1: The Decision</h3>
            <p className="text-slate-400 text-sm">Describe a specific decision you made recently. Be concrete.</p>
            <textarea
              value={decisionText}
              onChange={e => setDecisionText(e.target.value)}
              rows={5}
              placeholder="E.g., 'I decided to hire candidate A instead of B' or 'I chose to invest in option X over Y'"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-100"
            />
          </>
        );

      case 'REASONING':
        return (
          <>
            <h3 className="text-lg font-semibold font-mono text-blue-300">Step 2: Your Reasoning</h3>
            <p className="text-slate-400 text-sm">Walk through your thought process. What facts, feelings, or assumptions drove this decision?</p>
            <textarea
              value={reasoning}
              onChange={e => setReasoning(e.target.value)}
              rows={6}
              placeholder="E.g., 'Candidate A had more relevant experience, seemed more confident in the interview, and my gut feeling was strong...'"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-100"
            />
          </>
        );

      case 'DISCOVERY':
        return (
          <>
            <h3 className="text-lg font-semibold font-mono text-blue-300">Step 3: Discovering Patterns</h3>
            <p className="text-slate-400 text-sm mb-4">Answer these questions to uncover how your decision was made.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">What alternatives did you seriously consider (or not consider)?</label>
                <textarea
                  value={discoveryAnswers.alternativesConsidered}
                  onChange={e => setDiscoveryAnswers({...discoveryAnswers, alternativesConsidered: e.target.value})}
                  rows={2}
                  placeholder="E.g., 'I considered 2 other candidates but dismissed them quickly because...'"
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Where did you get your information? What did you ignore or not look for?</label>
                <textarea
                  value={discoveryAnswers.informationSources}
                  onChange={e => setDiscoveryAnswers({...discoveryAnswers, informationSources: e.target.value})}
                  rows={2}
                  placeholder="E.g., 'I relied on the interview and resume, but didn't check references or do a skills test...'"
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Were you under time pressure? Did that influence you?</label>
                <textarea
                  value={discoveryAnswers.timePressure}
                  onChange={e => setDiscoveryAnswers({...discoveryAnswers, timePressure: e.target.value})}
                  rows={2}
                  placeholder="E.g., 'Yes, I had to decide by Friday, which pushed me to choose quickly...'"
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">What emotions were present? (Fear, confidence, frustration, excitement?)</label>
                <textarea
                  value={discoveryAnswers.emotionalState}
                  onChange={e => setDiscoveryAnswers({...discoveryAnswers, emotionalState: e.target.value})}
                  rows={2}
                  placeholder="E.g., 'I was anxious about making the wrong choice, which made me gravitate toward the safe pick...'"
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Who influenced your thinking? (Boss, friend, your own assumptions?)</label>
                <textarea
                  value={discoveryAnswers.influencers}
                  onChange={e => setDiscoveryAnswers({...discoveryAnswers, influencers: e.target.value})}
                  rows={2}
                  placeholder="E.g., 'My manager mentioned the first candidate was impressive, which stuck with me...'"
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-100"
                />
              </div>
            </div>
          </>
        );

      case 'DISCOVERING':
        return (
          <div className="text-center py-8">
            <BrainCircuit size={48} className="mx-auto text-blue-400 animate-pulse" />
            <h3 className="text-lg font-semibold font-mono mt-4 text-blue-300">Aura is analyzing your decision...</h3>
            <p className="text-slate-400 text-sm mt-2">Examining the patterns and biases at play.</p>
          </div>
        );

      case 'DIAGNOSIS':
        return (
          <>
            <h3 className="text-lg font-semibold font-mono text-blue-300">Step 4: What's Operating</h3>
            <p className="text-slate-400 text-sm mb-4">Based on your patterns, here's what Aura sees:</p>
            <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 text-slate-100 text-sm leading-relaxed whitespace-pre-wrap">
              {biasesIdentified}
            </div>
            <p className="text-slate-400 text-xs mt-4 italic">This isn't judgment—it's clarity. These patterns operate in all of us.</p>
          </>
        );

      case 'SCENARIOS':
        return (
          <>
            <h3 className="text-lg font-semibold font-mono text-blue-300">Step 5: Practicing Different Moves</h3>
            <p className="text-slate-400 text-sm mb-4">Here are different ways you could have approached this decision. Which resonates? What would change?</p>
            <div className="space-y-3">
              {scenarios.map((scenario, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedScenario(selectedScenario === i ? null : i)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedScenario === i
                      ? 'bg-blue-900/40 border-blue-500'
                      : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
                  }`}
                >
                  <h4 className="font-semibold text-blue-300 text-sm mb-1">{scenario.biasName}</h4>
                  <p className="text-slate-300 text-sm mb-2">{scenario.scenario}</p>
                  <p className="text-slate-400 text-xs italic">Alternative: {scenario.alternativeDecision}</p>
                </button>
              ))}
            </div>
          </>
        );

      case 'COMMITMENT':
        return (
          <>
            <h3 className="text-lg font-semibold font-mono text-blue-300">Step 6: Your Commitment</h3>
            <p className="text-slate-400 text-sm mb-4">
              The next time you face a similar decision, what's ONE concrete action you'll take differently?
            </p>
            <textarea
              value={commitment}
              onChange={e => setCommitment(e.target.value)}
              rows={4}
              placeholder="E.g., 'I'll make a rule: interview at least 3 candidates before deciding' or 'I'll wait 24 hours before deciding under time pressure' or 'I'll write down alternatives I'm rejecting and why'"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-100"
            />
            <p className="text-slate-400 text-xs mt-3">Be specific so you can actually do it.</p>
          </>
        );

      case 'LEARNING':
        return (
          <>
            <h3 className="text-lg font-semibold font-mono text-blue-300">Step 7: What You've Learned</h3>
            <p className="text-slate-400 text-sm mb-3">Reflect on this process. What's the deepest insight?</p>
            <textarea
              value={learning}
              onChange={e => setLearning(e.target.value)}
              rows={3}
              placeholder="E.g., 'I realize I rush to judgment when anxious and then defend my choice rather than staying open' or 'My confidence often masks missed information'"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-100 mb-3"
            />
            <p className="text-slate-400 text-xs">This insight is your compass for next time.</p>
            <button
                onClick={handleDownload}
                className="mt-6 w-full btn-luminous px-4 py-2 rounded-md font-medium flex items-center justify-center gap-2"
            >
                <Download size={16} /> Download Report
            </button>
          </>
        );

      default:
        return <p>Loading...</p>;
    }
  };

  const stepIndex = STEPS.indexOf(step);
  const isFirstStep = step === 'DECISION';
  const isLastStep = step === 'LEARNING';
  const isProcessing = step === 'DISCOVERING' || isLoading;
  const canProceed = step === 'DECISION' ? !!decisionText 
    : step === 'REASONING' ? !!reasoning 
    // FIX: Cast `answer` to string to ensure `.trim()` can be called.
    : step === 'DISCOVERY' ? Object.values(discoveryAnswers).every(answer => typeof answer === 'string' && answer.trim() !== '')
    : step === 'COMMITMENT' ? !!commitment
    : step === 'LEARNING' ? !!learning
    : true;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <header className="p-4 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold font-mono text-blue-300">Bias Detective</h2>
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
          {renderStep()}
        </main>

        <footer className="p-4 border-t border-slate-700 flex justify-between items-center">
          <button
            onClick={handleSaveDraft}
            className="text-sm text-slate-400 hover:text-white transition"
          >
            Save & Exit
          </button>
          <div className="flex gap-3">
            {!isFirstStep && !isProcessing && (
              <button
                onClick={handleBack}
                className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 transition"
              >
                <ArrowLeft size={16} /> Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={isProcessing || !canProceed}
              className={`px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 transition ${
                isProcessing || !canProceed
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isProcessing ? (
                <>
                  <BrainCircuit size={16} className="animate-spin" /> Analyzing...
                </>
              ) : isLastStep ? (
                <>
                  <Check size={16} /> Complete Session
                </>
              ) : (
                <>
                  Next <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}