
import React, { useState, useEffect } from 'react';
import { PolarityMap, PolarityMapperStep, PolarityMapDraft } from '../types.ts';
import { X, ArrowLeft, ArrowRight, Lightbulb, Download, GitCompareArrows, Check } from 'lucide-react';

interface PolarityMapperWizardProps {
  onClose: (draft: PolarityMapDraft | null) => void;
  onSave: (map: PolarityMap) => void;
  draft: PolarityMapDraft | null;
  setDraft: (draft: PolarityMapDraft | null) => void;
}

const ProgressBar = ({ currentStep }: { currentStep: PolarityMapperStep }) => {
  const steps: { label: string; wizardSteps: PolarityMapperStep[] }[] = [
    { label: 'Intro', wizardSteps: ['INTRODUCTION'] },
    { label: 'Dilemma', wizardSteps: ['DEFINE_DILEMMA'] },
    { label: 'Pole A', wizardSteps: ['POLE_A_UPSIDE', 'POLE_A_DOWNSIDE'] },
    { label: 'Pole B', wizardSteps: ['POLE_B_UPSIDE', 'POLE_B_DOWNSIDE'] },
    { label: 'Review', wizardSteps: ['REVIEW'] },
    { label: 'Complete', wizardSteps: ['COMPLETE'] },
  ];

  const currentStepIndex = steps.findIndex(s => s.wizardSteps.includes(currentStep));

  return (
    <div className="flex items-center justify-between mt-4">
      {steps.map((step, index) => (
        <React.Fragment key={step.label}>
          <div className="flex flex-col items-center flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${index < currentStepIndex ? 'bg-green-500 text-white' : index === currentStepIndex ? 'bg-green-600 text-white ring-4 ring-green-500/50' : 'bg-slate-700 text-slate-400'}`}>
              {index < currentStepIndex ? '✓' : index + 1}
            </div>
            <p className={`mt-2 text-xs text-center max-w-[80px] ${index === currentStepIndex ? 'text-green-300 font-bold' : 'text-slate-400'}`}>{step.label}</p>
          </div>
          {index < steps.length - 1 && (
            <div className={`flex-auto h-0.5 transition-all duration-300 ${index < currentStepIndex ? 'bg-green-500' : 'bg-slate-700'}`}></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};


export default function PolarityMapperWizard({ onClose, onSave, draft, setDraft }: PolarityMapperWizardProps) {
  // FIX: Initialize currentStep state by checking draft.currentStep.
  const [currentStep, setCurrentStep] = useState<PolarityMapperStep>(draft?.currentStep || 'INTRODUCTION');
  const [dilemma, setDilemma] = useState('');
  const [poleA_name, setPoleA_name] = useState('');
  const [poleA_upside, setPoleA_upside] = useState('');
  const [poleA_downside, setPoleA_downside] = useState('');
  const [poleB_name, setPoleB_name] = useState('');
  const [poleB_upside, setPoleB_upside] = useState('');
  const [poleB_downside, setPoleB_downside] = useState('');
  const [error, setError] = useState('');

  // Hydrate from draft
  useEffect(() => {
    if (draft) {
      setCurrentStep(draft.currentStep || 'INTRODUCTION');
      setDilemma(draft.dilemma || '');
      setPoleA_name(draft.poleA_name || '');
      setPoleA_upside(draft.poleA_upside || '');
      setPoleA_downside(draft.poleA_downside || '');
      setPoleB_name(draft.poleB_name || '');
      setPoleB_upside(draft.poleB_upside || '');
      setPoleB_downside(draft.poleB_downside || '');
    }
  }, [draft]);

  const handleSaveDraft = () => {
    setDraft({
      id: draft?.id || `pm-${Date.now()}`,
      date: draft?.date || new Date().toISOString(),
      // FIX: Add currentStep to the draft object.
      currentStep, 
      dilemma,
      poleA_name,
      poleA_upside,
      poleA_downside,
      poleB_name,
      poleB_upside,
      poleB_downside,
    });
    onClose(null); // Close the wizard
  };

  const handleNext = () => {
    setError('');
    switch (currentStep) {
      case 'INTRODUCTION':
        setCurrentStep('DEFINE_DILEMMA');
        break;
      case 'DEFINE_DILEMMA':
        if (!dilemma.trim()) { setError('Please define the dilemma.'); return; }
        if (!poleA_name.trim() || !poleB_name.trim()) { setError('Please name both poles of the dilemma.'); return; }
        setCurrentStep('POLE_A_UPSIDE');
        break;
      case 'POLE_A_UPSIDE':
        if (!poleA_upside.trim()) { setError('Please describe the upside of Pole A.'); return; }
        setCurrentStep('POLE_A_DOWNSIDE');
        break;
      case 'POLE_A_DOWNSIDE':
        if (!poleA_downside.trim()) { setError('Please describe the downside of Pole A.'); return; }
        setCurrentStep('POLE_B_UPSIDE');
        break;
      case 'POLE_B_UPSIDE':
        if (!poleB_upside.trim()) { setError('Please describe the upside of Pole B.'); return; }
        setCurrentStep('POLE_B_DOWNSIDE');
        break;
      case 'POLE_B_DOWNSIDE':
        if (!poleB_downside.trim()) { setError('Please describe the downside of Pole B.'); return; }
        setCurrentStep('REVIEW');
        break;
      case 'REVIEW':
        const finalMap: PolarityMap = {
          id: draft?.id || `pm-${Date.now()}`,
          date: draft?.date || new Date().toISOString(),
          dilemma,
          poleA_name,
          poleA_upside,
          poleA_downside,
          poleB_name,
          poleB_upside,
          poleB_downside,
        };
        onSave(finalMap);
        setCurrentStep('COMPLETE');
        break;
      case 'COMPLETE':
        onClose(null);
        break;
    }
  };

  const handleBack = () => {
    setError('');
    switch (currentStep) {
      case 'DEFINE_DILEMMA':
        setCurrentStep('INTRODUCTION');
        break;
      case 'POLE_A_UPSIDE':
        setCurrentStep('DEFINE_DILEMMA');
        break;
      case 'POLE_A_DOWNSIDE':
        setCurrentStep('POLE_A_UPSIDE');
        break;
      case 'POLE_B_UPSIDE':
        setCurrentStep('POLE_A_DOWNSIDE');
        break;
      case 'POLE_B_DOWNSIDE':
        setCurrentStep('POLE_B_UPSIDE');
        break;
      case 'REVIEW':
        setCurrentStep('POLE_B_DOWNSIDE');
        break;
      case 'COMPLETE':
        setCurrentStep('REVIEW'); // Allow back from complete to review
        break;
    }
  };

  const handleDownload = () => {
    const reportContent = `# Polarity Map Session Report
Date: ${new Date().toLocaleDateString()}

## The Dilemma
${dilemma}

---

## Pole A: ${poleA_name}
### Upsides
${poleA_upside}

### Downsides
${poleA_downside}

---

## Pole B: ${poleB_name}
### Upsides
${poleB_upside}

### Downsides
${poleB_downside}

---
Generated by Aura ILP
`;

    const blob = new Blob([reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `polarity-map-report-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'INTRODUCTION':
        return (
          <>
            <h3 className="text-lg font-semibold text-slate-100">Welcome to Polarity Mapper</h3>
            <p className="text-slate-400 text-sm mt-2">
              Many challenges aren't problems to be solved, but polarities to be managed. This tool helps you reframe "either/or" dilemmas into "both/and" dynamics, allowing you to leverage tension for growth.
            </p>
            <div className="bg-slate-900/40 border border-slate-700 p-4 rounded-md text-sm text-slate-300 mt-4">
              <p className="font-semibold mb-2 flex items-center gap-2"><Lightbulb size={16}/> What is a Polarity?</p>
              <p>A pair of interdependent opposites that need each other over time, like "Activity and Rest" or "Stability and Change." They are like two sides of the same coin: you can't get rid of one without losing the value of the other.</p>
            </div>
          </>
        );
      case 'DEFINE_DILEMMA':
        return (
          <>
            <h3 className="text-lg font-semibold text-slate-100">Step 1: Define Your Polarity</h3>
            <p className="text-slate-400 text-sm mt-2">
              What is the persistent "either/or" dilemma you're facing? Then, name the two poles (opposing sides) of this tension.
            </p>
            <label className="block text-sm font-medium text-slate-300 mb-1 mt-4">The Dilemma / Central Tension:</label>
            <textarea
              value={dilemma}
              onChange={e => setDilemma(e.target.value)}
              rows={3}
              placeholder="E.g., 'The tension between focusing on short-term profits versus long-term innovation'"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-100"
            />
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Pole A Name:</label>
                <input
                  type="text"
                  value={poleA_name}
                  onChange={e => setPoleA_name(e.target.value)}
                  placeholder="E.g., 'Short-Term Profits'"
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Pole B Name:</label>
                <input
                  type="text"
                  value={poleB_name}
                  onChange={e => setPoleB_name(e.target.value)}
                  placeholder="E.g., 'Long-Term Innovation'"
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-100"
                />
              </div>
            </div>
          </>
        );
      case 'POLE_A_UPSIDE':
        return (
          <>
            <h3 className="text-lg font-semibold text-slate-100">Step 2: Pole A - Upsides</h3>
            <p className="text-slate-400 text-sm mt-2">
              What are the **positive results** of focusing on "{poleA_name}" when it's functioning well?
            </p>
            <textarea
              value={poleA_upside}
              onChange={e => setPoleA_upside(e.target.value)}
              rows={6}
              placeholder="E.g., 'Increased revenue, immediate shareholder satisfaction, clear performance metrics, quick wins.'"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-100 mt-4"
            />
          </>
        );
      case 'POLE_A_DOWNSIDE':
        return (
          <>
            <h3 className="text-lg font-semibold text-slate-100">Step 2: Pole A - Downsides</h3>
            <p className="text-slate-400 text-sm mt-2">
              What are the **negative results** when you over-focus on "{poleA_name}" to the exclusion of "{poleB_name}"?
            </p>
            <textarea
              value={poleA_downside}
              onChange={e => setPoleA_downside(e.target.value)}
              rows={6}
              placeholder="E.g., 'Stagnation, loss of competitive edge, burnout, lack of future-proofing, talent leaving for more dynamic environments.'"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-100 mt-4"
            />
          </>
        );
      case 'POLE_B_UPSIDE':
        return (
          <>
            <h3 className="text-lg font-semibold text-slate-100">Step 3: Pole B - Upsides</h3>
            <p className="text-slate-400 text-sm mt-2">
              What are the **positive results** of focusing on "{poleB_name}" when it's functioning well?
            </p>
            <textarea
              value={poleB_upside}
              onChange={e => setPoleB_upside(e.target.value)}
              rows={6}
              placeholder="E.g., 'Breakthrough products, employee engagement, market leadership, adaptability to future changes, long-term sustainability.'"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-100 mt-4"
            />
          </>
        );
      case 'POLE_B_DOWNSIDE':
        return (
          <>
            <h3 className="text-lg font-semibold text-slate-100">Step 3: Pole B - Downsides</h3>
            <p className="text-slate-400 text-sm mt-2">
              What are the **negative results** when you over-focus on "{poleB_name}" to the exclusion of "{poleA_name}"?
            </p>
            <textarea
              value={poleB_downside}
              onChange={e => setPoleB_downside(e.target.value)}
              rows={6}
              placeholder="E.g., 'Lack of immediate financial stability, impatient stakeholders, unfocused efforts, projects never finishing, loss of current market share.'"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-100 mt-4"
            />
          </>
        );
      case 'REVIEW':
        return (
          <>
            <h3 className="text-lg font-semibold text-slate-100">Step 4: Review Your Polarity Map</h3>
            <p className="text-slate-400 text-sm mt-2">
              See how both poles, with their upsides and downsides, are part of a larger dynamic.
            </p>
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-5 mt-4 space-y-4">
              <div className="text-center">
                <p className="text-sm text-slate-400 mb-1">Central Dilemma:</p>
                <p className="text-lg font-bold text-slate-100">{dilemma}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800 border border-green-600 rounded-lg p-3">
                  <p className="font-semibold text-green-300 mb-2">{poleA_name}</p>
                  <p className="text-sm text-slate-300"><strong>Upsides:</strong> {poleA_upside}</p>
                  <p className="text-sm text-slate-300 mt-2"><strong>Downsides:</strong> {poleA_downside}</p>
                </div>
                <div className="bg-slate-800 border border-green-600 rounded-lg p-3">
                  <p className="font-semibold text-green-300 mb-2">{poleB_name}</p>
                  <p className="text-sm text-slate-300"><strong>Upsides:</strong> {poleB_upside}</p>
                  <p className="text-sm text-slate-300 mt-2"><strong>Downsides:</strong> {poleB_downside}</p>
                </div>
              </div>
            </div>
            <p className="text-slate-400 text-xs italic mt-4">
              The goal isn't to pick a side, but to actively manage the tension between them, seeking both upsides and avoiding both downsides.
            </p>
          </>
        );
      case 'COMPLETE':
        return (
          <div className="text-center py-12 space-y-4">
            <Check size={48} className="mx-auto text-green-400" />
            <h3 className="text-2xl font-bold text-slate-100">Polarity Map Complete!</h3>
            <p className="text-slate-400 max-w-md mx-auto">
              You've successfully mapped your dilemma. This insight can help you manage tension and make more integral decisions.
            </p>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition"
            >
              <Download size={18} /> Download Map Report
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  const isFirstStep = currentStep === 'INTRODUCTION';
  const isFinalStep = currentStep === 'COMPLETE';
  const isReviewStep = currentStep === 'REVIEW';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in">
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        <header className="p-4 border-b border-slate-700 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold font-mono text-green-300 flex items-center gap-3">
              <GitCompareArrows size={28} /> Polarity Mapper
            </h2>
            <ProgressBar currentStep={currentStep} />
          </div>
          <button onClick={handleSaveDraft} className="text-slate-500 hover:text-slate-300 p-1">
            <X size={24} />
          </button>
        </header>

        <main className="p-6 flex-grow overflow-y-auto space-y-4">
          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded-md p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          {renderStepContent()}
        </main>

        <footer className="p-4 border-t border-slate-700 flex justify-between items-center">
          {!isFinalStep && (
            <button onClick={handleSaveDraft} className="text-sm text-slate-400 hover:text-white transition">
              Save Draft & Exit
            </button>
          )}
          <div className="flex gap-3 ml-auto">
            {!isFirstStep && !isFinalStep && (
              <button
                onClick={handleBack}
                className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 transition"
              >
                <ArrowLeft size={16} /> Back
              </button>
            )}
            <button
              onClick={handleNext}
              className={`px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 transition ${
                isFinalStep ? 'bg-green-600 hover:bg-green-700 text-white' : 'btn-luminous'
              }`}
            >
              {isReviewStep ? 'Finish & Save' : isFinalStep ? 'Close' : 'Next'} <ArrowRight size={16} />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
