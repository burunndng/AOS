// FIX: Create the BiasDetectiveWizard.tsx component file to resolve the module not found error.
import React, { useState, useEffect } from 'react';
import { BiasDetectiveSession, BiasDetectiveStep, IdentifiedBias } from '../types.ts';
import { X, ArrowLeft, ArrowRight, BrainCircuit, Lightbulb, Check, ChevronRight } from 'lucide-react';
import * as geminiService from '../services/geminiService.ts';

interface BiasDetectiveWizardProps {
  onClose: () => void;
  onSave: (session: BiasDetectiveSession) => void;
  session: BiasDetectiveSession | null;
  setDraft: (session: BiasDetectiveSession | null) => void;
}

const STEPS: BiasDetectiveStep[] = ['DECISION', 'REASONING', 'DIAGNOSTIC', 'TESTING_BIASES', 'FRAMINGS', 'SHIFT', 'LEARNING'];

export default function BiasDetectiveWizard({ onClose, onSave, session: draft, setDraft }: BiasDetectiveWizardProps) {
  const [session, setSession] = useState<BiasDetectiveSession>(draft || {
      id: `bias-${Date.now()}`,
      date: new Date().toISOString(),
      currentStep: 'DECISION',
      decisionText: '',
      reasoning: '',
      identifiedBiases: [],
      alternativeFramings: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeBiasTestIndex, setActiveBiasTestIndex] = useState(0);

  useEffect(() => {
    if (draft) {
      setSession(draft);
      if (draft.currentStep === 'TESTING_BIASES') {
        const firstUnanswered = draft.identifiedBiases.findIndex(b => b.userTestAnswer === undefined);
        setActiveBiasTestIndex(firstUnanswered >= 0 ? firstUnanswered : 0);
      }
    }
  }, [draft]);

  const handleSaveDraftAndClose = () => {
    setDraft(session);
    onClose();
  };

  const updateField = (field: keyof BiasDetectiveSession, value: any) => {
    setSession(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = async () => {
    setIsLoading(true);
    setError('');
    try {
      const currentIndex = STEPS.indexOf(session.currentStep);
      let nextStep = STEPS[currentIndex + 1] || 'COMPLETE';

      if (session.currentStep === 'REASONING') {
        updateField('currentStep', 'DIAGNOSTIC'); // Show loading state
        const biases = await geminiService.diagnoseBiases(session.decisionText, session.reasoning);
        updateField('identifiedBiases', biases);
        updateField('currentStep', 'TESTING_BIASES');
      } else if (session.currentStep === 'TESTING_BIASES') {
        // This step is handled by its own button logic
        return; 
      } else if (session.currentStep === 'LEARNING') {
        onSave({ ...session, currentStep: 'COMPLETE' });
        onClose();
      } else {
        updateField('currentStep', nextStep as BiasDetectiveStep);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An AI service error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBack = () => {
    const currentIndex = STEPS.indexOf(session.currentStep);
    if (currentIndex > 0) {
      updateField('currentStep', STEPS[currentIndex - 1]);
    }
  };

  const handleBiasTestSubmit = async () => {
    setIsLoading(true);
    setError('');
    try {
        const currentBias = session.identifiedBiases[activeBiasTestIndex];
        const { llmTestResponse, isOperating } = await geminiService.testBiasAnalysis(
            currentBias.name, currentBias.howItWorks, session.reasoning, currentBias.questionToTest, currentBias.userTestAnswer || ''
        );
        
        const updatedBiases = [...session.identifiedBiases];
        updatedBiases[activeBiasTestIndex] = { ...currentBias, llmTestResponse, isOperating };
        updateField('identifiedBiases', updatedBiases);

        if (activeBiasTestIndex < session.identifiedBiases.length - 1) {
            setActiveBiasTestIndex(prev => prev + 1);
        } else {
            // Last bias, move to next major step
            updateField('currentStep', 'FRAMINGS');
            const framings = await geminiService.generateAlternativeFramings(session.decisionText, session.reasoning);
            updateField('alternativeFramings', framings);
        }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An AI service error occurred.');
    } finally {
        setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (session.currentStep) {
      case 'DECISION':
        return (
          <>
            <h3 className="text-lg font-semibold font-mono">Step 1: The Decision</h3>
            <p className="text-slate-400">Describe a specific, recent decision you made.</p>
            <textarea value={session.decisionText} onChange={e => updateField('decisionText', e.target.value)} rows={5} className="w-full bg-slate-900/50 border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent" />
          </>
        );
      case 'REASONING':
        return (
          <>
            <h3 className="text-lg font-semibold font-mono">Step 2: Your Reasoning</h3>
            <p className="text-slate-400">What was your thought process? What were the key factors that led to your decision?</p>
            <textarea value={session.reasoning} onChange={e => updateField('reasoning', e.target.value)} rows={8} className="w-full bg-slate-900/50 border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent" />
          </>
        );
       case 'DIAGNOSTIC':
        return (
          <div className="text-center">
            <BrainCircuit size={48} className="mx-auto text-accent animate-pulse" />
            <h3 className="text-lg font-semibold font-mono mt-4">Diagnosing Biases...</h3>
            <p className="text-slate-400">Aura is analyzing your reasoning for common cognitive biases.</p>
          </div>
        );
      case 'TESTING_BIASES':
        const bias = session.identifiedBiases[activeBiasTestIndex];
        if (!bias) return <p>Loading biases...</p>;
        return (
            <>
                <h3 className="text-lg font-semibold font-mono">Step 3: Test for Biases ({activeBiasTestIndex + 1}/{session.identifiedBiases.length})</h3>
                <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                    <h4 className="font-bold font-mono text-blue-300">{bias.name}</h4>
                    <p className="text-sm text-slate-400 mt-1">{bias.howItWorks}</p>
                </div>
                <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-300 mb-2">{bias.questionToTest}</label>
                    <textarea 
                        value={bias.userTestAnswer || ''}
                        onChange={e => {
                            const updatedBiases = [...session.identifiedBiases];
                            updatedBiases[activeBiasTestIndex].userTestAnswer = e.target.value;
                            updateField('identifiedBiases', updatedBiases);
                        }}
                        rows={5} className="w-full bg-slate-900/50 border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent"
                        disabled={!!bias.llmTestResponse}
                    />
                </div>
                {bias.llmTestResponse && (
                     <div className="mt-4 bg-slate-900/50 p-3 rounded-md border border-slate-700">
                        <p className="text-sm text-slate-300 italic">{bias.llmTestResponse}</p>
                        <p className={`text-xs font-bold mt-2 ${bias.isOperating ? 'text-red-400' : 'text-green-400'}`}>
                            {bias.isOperating ? 'Bias likely operating' : 'Bias likely not operating'}
                        </p>
                    </div>
                )}
            </>
        );
      case 'FRAMINGS':
        return (
          <>
            <h3 className="text-lg font-semibold font-mono">Step 4: Alternative Framings</h3>
            <p className="text-slate-400">Here are some different ways to look at the decision. Select one that resonates most, or write your own.</p>
            <div className="space-y-2 my-4">
                {session.alternativeFramings.map((frame, i) => (
                    <button key={i} onClick={() => updateField('selectedFraming', frame)} className={`w-full text-left p-3 rounded-md border transition-colors ${session.selectedFraming === frame ? 'bg-accent/20 border-accent' : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700'}`}>
                        {frame}
                    </button>
                ))}
            </div>
            <textarea value={session.selectedFraming || ''} onChange={e => updateField('selectedFraming', e.target.value)} rows={2} placeholder="Or write your own framing..." className="w-full bg-slate-900/50 border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent" />
          </>
        );
      case 'SHIFT':
        return (
            <>
                <h3 className="text-lg font-semibold font-mono">Step 5: Decision Shift</h3>
                <p className="text-slate-400">Considering the new framing and potential biases, how might your original decision shift? What new options are available?</p>
                <textarea value={session.decisionShift || ''} onChange={e => updateField('decisionShift', e.target.value)} rows={8} className="w-full bg-slate-900/50 border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent" />
            </>
        );
      case 'LEARNING':
         return (
            <>
                <h3 className="text-lg font-semibold font-mono">Step 6: Capture Your Learning</h3>
                <p className="text-slate-400">What is the one key takeaway from this process?</p>
                <textarea value={session.oneThingToRemember || ''} onChange={e => updateField('oneThingToRemember', e.target.value)} rows={3} className="w-full bg-slate-900/50 border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent" />
                <p className="text-slate-400 mt-4">What will you do differently next time?</p>
                <textarea value={session.nextTimeAction || ''} onChange={e => updateField('nextTimeAction', e.target.value)} rows={3} className="w-full bg-slate-900/50 border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent" />
            </>
        );
      default:
        return <p>Loading step...</p>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in">
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <header className="p-4 border-b border-slate-700 flex justify-between items-center">
                <h2 className="text-2xl font-bold font-mono tracking-tight text-blue-300">Bias Detective</h2>
                <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X size={24} /></button>
            </header>
            <main className="p-6 flex-grow overflow-y-auto space-y-4">
                {error && <p className="text-red-400 text-sm bg-red-900/30 p-2 rounded-md">{error}</p>}
                {renderStep()}
            </main>
            <footer className="p-4 border-t border-slate-700 flex justify-between items-center">
                <button onClick={handleSaveDraftAndClose} className="text-sm text-slate-400 hover:text-white transition">Save Draft & Close</button>
                <div className="flex gap-4">
                    {session.currentStep !== 'DECISION' && session.currentStep !== 'DIAGNOSTIC' && <button onClick={handleBack} disabled={isLoading} className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-md font-medium"><ArrowLeft size={16}/></button>}
                    {session.currentStep === 'TESTING_BIASES' ? (
                        <button onClick={handleBiasTestSubmit} disabled={isLoading || !session.identifiedBiases[activeBiasTestIndex]?.userTestAnswer} className="btn-luminous px-4 py-2 rounded-md font-medium flex items-center gap-2">
                             {isLoading ? 'Analyzing...' : session.identifiedBiases[activeBiasTestIndex]?.llmTestResponse ? 'Next Bias' : 'Analyze Answer'} <ChevronRight size={16}/>
                        </button>
                    ) : (
                        <button onClick={handleNext} disabled={isLoading} className="btn-luminous px-4 py-2 rounded-md font-medium flex items-center gap-2">
                            {isLoading ? 'Processing...' : session.currentStep === 'LEARNING' ? 'Finish & Save' : 'Next'} <ArrowRight size={16}/>
                        </button>
                    )}
                </div>
            </footer>
        </div>
    </div>
  );
}