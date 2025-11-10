import React, { useState, useEffect, useCallback } from 'react';
import { X, ArrowLeft, ArrowRight, AlertCircle, Check, Loader, Shield, Brain, Sparkles, Heart } from 'lucide-react';
import * as Icons from 'lucide-react';
import { MemoryReconsolidationSession, ImplicitBelief, ContradictionInsight } from '../types.ts';
import { GROUNDING_OPTIONS } from '../constants.ts';
import * as memoryReconService from '../services/memoryReconsolidationService.ts';

interface MemoryReconsolidationWizardProps {
  onClose: () => void;
  onSave: (session: MemoryReconsolidationSession) => void;
  session: MemoryReconsolidationSession | null;
  setDraft: (session: MemoryReconsolidationSession | null) => void;
}

const STEP_LABELS = {
  ONBOARDING: 'Onboarding',
  MEMORY_SELECTION: 'Memory Selection',
  BELIEF_EXTRACTION: 'Belief Extraction',
  CONTRADICTION_MINING: 'Contradiction Mining',
} as const;

const MEMORY_ERAS = [
  'Early Childhood (0-5)',
  'Childhood (6-12)',
  'Adolescence (13-17)',
  'Young Adult (18-25)',
  'Adult (26-40)',
  'Midlife (41-60)',
  'Recent (Last 5 years)',
  'Very Recent (Last year)'
];

export default function MemoryReconsolidationWizard({ 
  onClose, 
  onSave, 
  session: draft, 
  setDraft 
}: MemoryReconsolidationWizardProps) {
  const [step, setStep] = useState<MemoryReconsolidationSession['currentStep']>(
    draft?.currentStep || 'ONBOARDING'
  );
  
  // ONBOARDING state
  const [intention, setIntention] = useState(draft?.intention || '');
  const [safetyAcknowledged, setSafetyAcknowledged] = useState(draft?.safetyAcknowledged || false);
  const [baselineIntensity, setBaselineIntensity] = useState(draft?.baselineIntensity || 5);
  
  // MEMORY_SELECTION state
  const [memoryTitle, setMemoryTitle] = useState(draft?.memoryTitle || '');
  const [memoryEra, setMemoryEra] = useState(draft?.memoryEra || MEMORY_ERAS[0]);
  const [keyEmotions, setKeyEmotions] = useState(draft?.keyEmotions || '');
  const [bodySensations, setBodySensations] = useState(draft?.bodySensations || '');
  const [protectorStrategies, setProtectorStrategies] = useState(draft?.protectorStrategies || '');
  const [sensoryAnchors, setSensoryAnchors] = useState(draft?.sensoryAnchors || '');
  const [memoryNarrative, setMemoryNarrative] = useState(draft?.memoryNarrative || '');
  
  // BELIEF_EXTRACTION state
  const [extractedBeliefs, setExtractedBeliefs] = useState<ImplicitBelief[]>(draft?.extractedBeliefs || []);
  const [selectedBeliefIds, setSelectedBeliefIds] = useState<string[]>(draft?.selectedBeliefIds || []);
  const [beliefExtractionError, setBeliefExtractionError] = useState(draft?.beliefExtractionError || '');
  
  // CONTRADICTION_MINING state
  const [contradictionSeeds, setContradictionSeeds] = useState<string[]>(draft?.contradictionSeeds?.length ? draft.contradictionSeeds : ['']);
  const [contradictionInsights, setContradictionInsights] = useState<ContradictionInsight[]>(draft?.contradictionInsights || []);
  const [juxtapositionPrompts, setJuxtapositionPrompts] = useState<string[]>(draft?.juxtapositionPrompts || []);
  const [integrationGuidance, setIntegrationGuidance] = useState(draft?.integrationGuidance || '');
  const [contradictionMiningError, setContradictionMiningError] = useState(draft?.contradictionMiningError || '');
  
  const hasGeneratedContradictions = contradictionInsights.length > 0;
  
  const [isLoading, setIsLoading] = useState(false);
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [showRecoveryBanner, setShowRecoveryBanner] = useState(false);
  
  // Session recovery detection
  useEffect(() => {
    if (draft && draft.intention) {
      setShowRecoveryBanner(true);
    }
  }, []);
  
  // Close break modal on ESC
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showBreakModal) {
        setShowBreakModal(false);
        event.stopPropagation();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showBreakModal]);
  
  // Auto-save every 30 seconds
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      saveDraft();
    }, 30000);
    
    return () => clearInterval(autoSaveInterval);
  }, [
    step, intention, safetyAcknowledged, baselineIntensity, memoryTitle, memoryEra,
    keyEmotions, bodySensations, protectorStrategies, sensoryAnchors, memoryNarrative,
    extractedBeliefs, selectedBeliefIds, beliefExtractionError, contradictionSeeds,
    contradictionInsights, juxtapositionPrompts, integrationGuidance, contradictionMiningError
  ]);
  
  const saveDraft = useCallback(() => {
    const session: MemoryReconsolidationSession = {
      id: draft?.id || `memory-recon-${Date.now()}`,
      date: draft?.date || new Date().toISOString(),
      currentStep: step,
      intention,
      safetyAcknowledged,
      baselineIntensity,
      memoryTitle,
      memoryEra,
      keyEmotions,
      bodySensations,
      protectorStrategies,
      sensoryAnchors,
      memoryNarrative,
      extractedBeliefs,
      selectedBeliefIds,
      beliefExtractionError,
      contradictionSeeds,
      contradictionInsights,
      juxtapositionPrompts,
      integrationGuidance,
      contradictionMiningError
    };
    setDraft(session);
  }, [
    draft, step, intention, safetyAcknowledged, baselineIntensity, memoryTitle, memoryEra,
    keyEmotions, bodySensations, protectorStrategies, sensoryAnchors, memoryNarrative,
    extractedBeliefs, selectedBeliefIds, beliefExtractionError, contradictionSeeds,
    contradictionInsights, juxtapositionPrompts, integrationGuidance, contradictionMiningError,
    setDraft
  ]);
  
  const canProceedFromOnboarding = intention.trim().length > 0 && safetyAcknowledged;
  const canProceedFromMemorySelection = memoryTitle.trim().length > 0 && memoryNarrative.trim().length > 20;
  const canProceedFromBeliefExtraction = selectedBeliefIds.length > 0;
  const canProceedFromContradictionMining = contradictionSeeds.some(s => s.trim().length > 0);
  
  const handleNext = async () => {
    if (step === 'ONBOARDING' && canProceedFromOnboarding) {
      setStep('MEMORY_SELECTION');
    } else if (step === 'MEMORY_SELECTION' && canProceedFromMemorySelection) {
      // Call API to extract beliefs
      setIsLoading(true);
      setBeliefExtractionError('');
      try {
        const response = await memoryReconService.extractImplicitBeliefs({
          memoryNarrative,
          emotionalTone: keyEmotions,
          bodySensations,
          baselineIntensity,
          additionalContext: {
            memoryTitle,
            memoryEra,
            protectorStrategies,
            sensoryAnchors
          }
        });
        
        setExtractedBeliefs(response.beliefs);
        setSelectedBeliefIds([]);
        setStep('BELIEF_EXTRACTION');
      } catch (error) {
        setBeliefExtractionError(error instanceof Error ? error.message : 'Failed to extract beliefs');
      } finally {
        setIsLoading(false);
      }
    } else if (step === 'BELIEF_EXTRACTION' && canProceedFromBeliefExtraction) {
      setStep('CONTRADICTION_MINING');
    } else if (step === 'CONTRADICTION_MINING') {
      if (hasGeneratedContradictions) {
        handleComplete();
        return;
      }

      if (!canProceedFromContradictionMining) {
        return;
      }

      // Call API to mine contradictions
      setIsLoading(true);
      setContradictionMiningError('');
      try {
        const selectedBeliefs = extractedBeliefs.filter(b => selectedBeliefIds.includes(b.id));
        const response = await memoryReconService.mineContradictions({
          beliefs: selectedBeliefs.map(b => ({ id: b.id, belief: b.belief })),
          beliefIds: selectedBeliefIds,
          contradictionSeeds: contradictionSeeds.filter(s => s.trim().length > 0),
          userSuppliedResources: []
        });
        
        setContradictionInsights(response.contradictions);
        setJuxtapositionPrompts(response.juxtapositionCyclePrompts);
        setIntegrationGuidance(response.integrationGuidance);

      } catch (error) {
        setContradictionMiningError(error instanceof Error ? error.message : 'Failed to mine contradictions');
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleBack = () => {
    if (step === 'MEMORY_SELECTION') {
      setStep('ONBOARDING');
    } else if (step === 'BELIEF_EXTRACTION') {
      setStep('MEMORY_SELECTION');
    } else if (step === 'CONTRADICTION_MINING') {
      setStep('BELIEF_EXTRACTION');
    }
  };
  
  const handleRetry = () => {
    if (step === 'BELIEF_EXTRACTION' && beliefExtractionError) {
      setBeliefExtractionError('');
      handleNext();
    } else if (step === 'CONTRADICTION_MINING' && contradictionMiningError) {
      setContradictionMiningError('');
      setContradictionInsights([]);
      setJuxtapositionPrompts([]);
      setIntegrationGuidance('');
      handleNext();
    }
  };
  
  const handleComplete = () => {
    const session: MemoryReconsolidationSession = {
      id: draft?.id || `memory-recon-${Date.now()}`,
      date: draft?.date || new Date().toISOString(),
      currentStep: 'CONTRADICTION_MINING',
      intention,
      safetyAcknowledged,
      baselineIntensity,
      memoryTitle,
      memoryEra,
      keyEmotions,
      bodySensations,
      protectorStrategies,
      sensoryAnchors,
      memoryNarrative,
      extractedBeliefs,
      selectedBeliefIds,
      contradictionSeeds,
      contradictionInsights,
      juxtapositionPrompts,
      integrationGuidance,
      completedAt: new Date().toISOString()
    };
    
    onSave(session);
    setDraft(null);
    onClose();
  };
  
  
  const handleClose = () => {
    saveDraft();
    onClose();
  };
  
  const toggleBeliefSelection = (beliefId: string) => {
    setSelectedBeliefIds(prev =>
      prev.includes(beliefId)
        ? prev.filter(id => id !== beliefId)
        : [...prev, beliefId]
    );
  };
  
  const addContradictionSeed = () => {
    setContradictionSeeds(prev => [...prev, '']);
  };
  
  const updateContradictionSeed = (index: number, value: string) => {
    setContradictionSeeds(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };
  
  const removeContradictionSeed = (index: number) => {
    setContradictionSeeds(prev => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.length > 0 ? updated : [''];
    });
  };
  
  const getStepNumber = (currentStep: MemoryReconsolidationSession['currentStep']) => {
    const steps: MemoryReconsolidationSession['currentStep'][] = ['ONBOARDING', 'MEMORY_SELECTION', 'BELIEF_EXTRACTION', 'CONTRADICTION_MINING'];
    return steps.indexOf(currentStep);
  };
  
  const renderStepper = () => {
    const steps: MemoryReconsolidationSession['currentStep'][] = ['ONBOARDING', 'MEMORY_SELECTION', 'BELIEF_EXTRACTION', 'CONTRADICTION_MINING'];
    const currentStepIndex = getStepNumber(step);
    
    return (
      <div className="flex items-center justify-center gap-2 mb-6">
        {steps.map((s, index) => {
          const isActive = index === currentStepIndex;
          const isComplete = index < currentStepIndex;
          
          return (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-2 ${isActive ? 'text-amber-400' : isComplete ? 'text-emerald-400' : 'text-neutral-500'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  isActive ? 'bg-amber-400/20 border-2 border-amber-400' :
                  isComplete ? 'bg-emerald-400/20 border-2 border-emerald-400' :
                  'bg-neutral-800 border-2 border-neutral-600'
                }`}>
                  {isComplete ? <Check size={16} /> : index + 1}
                </div>
                <span className="text-sm font-medium hidden md:block">{STEP_LABELS[s as keyof typeof STEP_LABELS]}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-8 md:w-16 h-0.5 ${index < currentStepIndex ? 'bg-emerald-400' : 'bg-neutral-600'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };
  
  const renderOnboarding = () => (
    <div className="space-y-6 animate-fade-in-up">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-amber-400/10 rounded-full">
            <Shield size={48} className="text-amber-400" />
          </div>
        </div>
        <h2 className="text-3xl font-bold font-mono mb-3 text-slate-100">Memory Reconsolidation</h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          This process helps you identify and transform limiting beliefs stored in memory. You'll explore a significant memory,
          extract implicit beliefs, and discover contradicting evidence to facilitate reconsolidation.
        </p>
      </div>
      
      <div className="bg-neutral-900/40 border border-neutral-700/40 rounded-xl p-6 space-y-4">
        <h3 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
          <Brain size={20} className="text-cyan-400" />
          Your Intention
        </h3>
        <p className="text-slate-400 text-sm">What brings you to this work today?</p>
        <textarea
          value={intention}
          onChange={(e) => setIntention(e.target.value)}
          placeholder="e.g., I want to explore a belief that I'm not good enough..."
          className="w-full bg-neutral-800 border border-neutral-600 rounded-lg p-3 text-slate-100 min-h-[100px] focus:outline-none focus:border-amber-400"
        />
      </div>
      
      <div className="bg-neutral-900/40 border border-neutral-700/40 rounded-xl p-6 space-y-4">
        <h3 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
          <Heart size={20} className="text-rose-400" />
          Baseline Emotional Intensity
        </h3>
        <p className="text-slate-400 text-sm">How intense do you feel about this memory right now? (0 = neutral, 10 = very intense)</p>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="10"
            value={baselineIntensity}
            onChange={(e) => setBaselineIntensity(Number(e.target.value))}
            className="flex-1"
          />
          <div className="w-12 text-center text-2xl font-bold text-amber-400">{baselineIntensity}</div>
        </div>
      </div>
      
      <div className="bg-rose-900/20 border border-rose-500/40 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-3">Safety Check</h3>
        <ul className="text-slate-400 text-sm space-y-2 mb-4">
          <li className="flex items-start gap-2">
            <AlertCircle size={16} className="text-rose-400 mt-0.5 flex-shrink-0" />
            <span>This work may bring up difficult emotions. You can pause anytime.</span>
          </li>
          <li className="flex items-start gap-2">
            <AlertCircle size={16} className="text-rose-400 mt-0.5 flex-shrink-0" />
            <span>If you're currently in crisis, please reach out to a mental health professional.</span>
          </li>
          <li className="flex items-start gap-2">
            <AlertCircle size={16} className="text-rose-400 mt-0.5 flex-shrink-0" />
            <span>This is not a substitute for therapy or medical treatment.</span>
          </li>
        </ul>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={safetyAcknowledged}
            onChange={(e) => setSafetyAcknowledged(e.target.checked)}
            className="w-5 h-5 rounded border-neutral-600 text-amber-400 focus:ring-amber-400"
          />
          <span className="text-slate-100 font-medium">I understand and wish to continue</span>
        </label>
      </div>
    </div>
  );
  
  const renderMemorySelection = () => (
    <div className="space-y-6 animate-fade-in-up">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold font-mono mb-2 text-slate-100">Memory Selection</h2>
        <p className="text-slate-400">Gather the details of the memory you'd like to work with</p>
      </div>

      {beliefExtractionError && (
        <div className="bg-rose-900/20 border border-rose-500/40 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-rose-300 font-medium">We couldn't extract beliefs</p>
            <p className="text-rose-400/80 text-sm mt-1">{beliefExtractionError}</p>
            <button
              onClick={handleRetry}
              className="mt-3 inline-flex items-center gap-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
      
      <div className="bg-neutral-900/40 border border-neutral-700/40 rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Memory Title</label>
          <input
            type="text"
            value={memoryTitle}
            onChange={(e) => setMemoryTitle(e.target.value)}
            placeholder="e.g., The presentation where I froze"
            className="w-full bg-neutral-800 border border-neutral-600 rounded-lg p-3 text-slate-100 focus:outline-none focus:border-amber-400"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Era</label>
          <select
            value={memoryEra}
            onChange={(e) => setMemoryEra(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-600 rounded-lg p-3 text-slate-100 focus:outline-none focus:border-amber-400"
          >
            {MEMORY_ERAS.map(era => (
              <option key={era} value={era}>{era}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Key Emotions</label>
          <input
            type="text"
            value={keyEmotions}
            onChange={(e) => setKeyEmotions(e.target.value)}
            placeholder="e.g., shame, fear, inadequacy"
            className="w-full bg-neutral-800 border border-neutral-600 rounded-lg p-3 text-slate-100 focus:outline-none focus:border-amber-400"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Body Sensations</label>
          <input
            type="text"
            value={bodySensations}
            onChange={(e) => setBodySensations(e.target.value)}
            placeholder="e.g., tightness in chest, heat in face"
            className="w-full bg-neutral-800 border border-neutral-600 rounded-lg p-3 text-slate-100 focus:outline-none focus:border-amber-400"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Protector Strategies (Optional)</label>
          <input
            type="text"
            value={protectorStrategies}
            onChange={(e) => setProtectorStrategies(e.target.value)}
            placeholder="e.g., avoiding public speaking, perfectionism"
            className="w-full bg-neutral-800 border border-neutral-600 rounded-lg p-3 text-slate-100 focus:outline-none focus:border-amber-400"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Sensory Anchors (Optional)</label>
          <input
            type="text"
            value={sensoryAnchors}
            onChange={(e) => setSensoryAnchors(e.target.value)}
            placeholder="e.g., fluorescent lights, smell of coffee"
            className="w-full bg-neutral-800 border border-neutral-600 rounded-lg p-3 text-slate-100 focus:outline-none focus:border-amber-400"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Memory Narrative</label>
          <textarea
            value={memoryNarrative}
            onChange={(e) => setMemoryNarrative(e.target.value)}
            placeholder="Describe the memory in detail. What happened? Who was there? What did you think and feel?"
            className="w-full bg-neutral-800 border border-neutral-600 rounded-lg p-3 text-slate-100 min-h-[150px] focus:outline-none focus:border-amber-400"
          />
          <p className="text-xs text-slate-500 mt-1">Minimum 20 characters</p>
        </div>
      </div>
    </div>
  );
  
  const renderBeliefExtraction = () => (
    <div className="space-y-6 animate-fade-in-up">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold font-mono mb-2 text-slate-100">Belief Extraction</h2>
        <p className="text-slate-400">Select the beliefs that resonate most strongly</p>
      </div>
      
      {beliefExtractionError && (
        <div className="bg-rose-900/20 border border-rose-500/40 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-rose-300 font-medium">Error extracting beliefs</p>
            <p className="text-rose-400/80 text-sm mt-1">{beliefExtractionError}</p>
          </div>
          <button
            onClick={handleRetry}
            className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 px-4 py-2 rounded-lg font-medium transition"
          >
            Retry
          </button>
        </div>
      )}
      
      {extractedBeliefs.length === 0 && !beliefExtractionError && (
        <div className="bg-neutral-900/40 border border-neutral-700/40 rounded-xl p-8 text-center">
          <p className="text-slate-400">No beliefs extracted yet.</p>
        </div>
      )}
      
      <div className="space-y-4">
        {extractedBeliefs.map((belief) => {
          const isSelected = selectedBeliefIds.includes(belief.id);
          
          return (
            <div
              key={belief.id}
              onClick={() => toggleBeliefSelection(belief.id)}
              className={`bg-neutral-900/40 border rounded-xl p-6 cursor-pointer transition ${
                isSelected
                  ? 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.2)]'
                  : 'border-neutral-700/40 hover:border-neutral-600'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                  isSelected ? 'bg-amber-400 border-amber-400' : 'border-neutral-600'
                }`}>
                  {isSelected && <Check size={16} className="text-neutral-900" />}
                </div>
                
                <div className="flex-1 space-y-3">
                  <p className="text-lg font-semibold text-slate-100">{belief.belief}</p>
                  
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      belief.depth === 'deep' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50' :
                      belief.depth === 'moderate' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' :
                      'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                    }`}>
                      Depth: {belief.depth}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-neutral-700/50 text-neutral-300 border border-neutral-600">
                      Charge: {belief.emotionalCharge}/10
                    </span>
                    {belief.bodyLocation && (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-neutral-700/50 text-neutral-300 border border-neutral-600">
                        {belief.bodyLocation}
                      </span>
                    )}
                  </div>
                  
                  {belief.originStory && (
                    <div className="bg-neutral-800/50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-slate-400 mb-1">Origin</p>
                      <p className="text-sm text-slate-300">{belief.originStory}</p>
                    </div>
                  )}
                  
                  {belief.limitingPatterns && belief.limitingPatterns.length > 0 && (
                    <div className="bg-neutral-800/50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-slate-400 mb-2">Limiting Patterns</p>
                      <ul className="space-y-1">
                        {belief.limitingPatterns.map((pattern, idx) => (
                          <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                            <span className="text-amber-400 mt-0.5">•</span>
                            <span>{pattern}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {extractedBeliefs.length > 0 && selectedBeliefIds.length === 0 && (
        <div className="bg-cyan-900/20 border border-cyan-500/40 rounded-xl p-4 text-center">
          <p className="text-cyan-300">Select at least one belief to continue</p>
        </div>
      )}
    </div>
  );
  
  const renderContradictionMining = () => (
    <div className="space-y-6 animate-fade-in-up">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold font-mono mb-2 text-slate-100">Contradiction Mining</h2>
        <p className="text-slate-400">Identify experiences or resources that contradict these beliefs</p>
      </div>
      
      {contradictionMiningError && (
        <div className="bg-rose-900/20 border border-rose-500/40 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-rose-300 font-medium">Error mining contradictions</p>
            <p className="text-rose-400/80 text-sm mt-1">{contradictionMiningError}</p>
          </div>
          <button
            onClick={handleRetry}
            className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 px-4 py-2 rounded-lg font-medium transition"
          >
            Retry
          </button>
        </div>
      )}
      
      <div className="bg-neutral-900/40 border border-neutral-700/40 rounded-xl p-6 space-y-4">
        <h3 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
          <Sparkles size={20} className="text-emerald-400" />
          Selected Beliefs
        </h3>
        <div className="space-y-2">
          {extractedBeliefs
            .filter(b => selectedBeliefIds.includes(b.id))
            .map((belief) => (
              <div key={belief.id} className="bg-neutral-800/50 rounded-lg p-3">
                <p className="text-slate-100 font-medium">{belief.belief}</p>
              </div>
            ))}
        </div>
      </div>
      
      <div className="bg-neutral-900/40 border border-neutral-700/40 rounded-xl p-6 space-y-4">
        <h3 className="text-xl font-semibold text-slate-100">Disconfirming Experiences</h3>
        <p className="text-slate-400 text-sm">
          Think of times when these beliefs weren't true, or resources that contradict them.
        </p>
        
        {contradictionSeeds.map((seed, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={seed}
              onChange={(e) => updateContradictionSeed(index, e.target.value)}
              placeholder="e.g., I gave a successful presentation last month..."
              className="flex-1 bg-neutral-800 border border-neutral-600 rounded-lg p-3 text-slate-100 focus:outline-none focus:border-amber-400"
            />
            {contradictionSeeds.length > 1 && (
              <button
                onClick={() => removeContradictionSeed(index)}
                className="bg-neutral-700 hover:bg-neutral-600 text-slate-300 px-3 py-2 rounded-lg transition"
              >
                <X size={20} />
              </button>
            )}
          </div>
        ))}
        
        <button
          onClick={addContradictionSeed}
          className="bg-neutral-700 hover:bg-neutral-600 text-slate-100 px-4 py-2 rounded-lg font-medium transition w-full"
        >
          + Add Another
        </button>
      </div>
    </div>
  );
  
  const renderComplete = () => (
    <div className="space-y-6 animate-fade-in-up">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-emerald-400/10 rounded-full">
            <Check size={48} className="text-emerald-400" />
          </div>
        </div>
        <h2 className="text-3xl font-bold font-mono mb-2 text-slate-100">Contradictions Identified</h2>
        <p className="text-slate-400">Here are the insights discovered to help reconsolidate these beliefs</p>
      </div>
      
      {contradictionInsights.length > 0 && (
        <div className="space-y-6">
          {contradictionInsights.map((insight, index) => {
            const belief = extractedBeliefs.find(b => b.id === insight.beliefId);
            
            return (
              <div key={insight.beliefId} className="bg-neutral-900/40 border border-neutral-700/40 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-amber-400">
                  {belief?.belief || `Belief ${index + 1}`}
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-400 mb-2">Anchors (Counter-Evidence)</p>
                    <ul className="space-y-1">
                      {insight.anchors.map((anchor, idx) => (
                        <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                          <span className="text-emerald-400 mt-0.5">✓</span>
                          <span>{anchor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <p className="text-sm font-semibold text-slate-400 mb-2">New Truths</p>
                    <ul className="space-y-1">
                      {insight.newTruths.map((truth, idx) => (
                        <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                          <span className="text-cyan-400 mt-0.5">→</span>
                          <span>{truth}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <p className="text-sm font-semibold text-slate-400 mb-2">Regulation Cues</p>
                    <ul className="space-y-1">
                      {insight.regulationCues.map((cue, idx) => (
                        <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                          <span className="text-amber-400 mt-0.5">•</span>
                          <span>{cue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {integrationGuidance && (
        <div className="bg-cyan-900/20 border border-cyan-500/40 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-cyan-300 mb-3">Integration Guidance</h3>
          <p className="text-slate-300 whitespace-pre-wrap">{integrationGuidance}</p>
        </div>
      )}
      
      {juxtapositionPrompts.length > 0 && (
        <div className="bg-neutral-900/40 border border-neutral-700/40 rounded-xl p-6 space-y-3">
          <h3 className="text-lg font-semibold text-slate-100">Juxtaposition Prompts</h3>
          <p className="text-slate-400 text-sm">Use these prompts during meditation or journaling to deepen the reconsolidation</p>
          <ol className="space-y-2">
            {juxtapositionPrompts.map((prompt, idx) => (
              <li key={idx} className="text-sm text-slate-300 flex gap-3">
                <span className="text-amber-400 font-semibold flex-shrink-0">{idx + 1}.</span>
                <span>{prompt}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
  
  const renderBreakModal = () => {
    if (!showBreakModal) return null;
    
    return (
      <div
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) setShowBreakModal(false);
        }}
      >
        <div className="bg-neutral-900 border border-neutral-700 rounded-xl max-w-lg w-full p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-slate-100">I Need a Break</h3>
            <button
              onClick={() => setShowBreakModal(false)}
              className="text-slate-400 hover:text-slate-200 transition"
            >
              <X size={24} />
            </button>
          </div>
          
          <p className="text-slate-400 mb-4">
            It's completely okay to pause. Here are some grounding options:
          </p>
          
          <div className="space-y-3">
            {GROUNDING_OPTIONS.map((option) => {
              const IconComponent = (Icons as any)[option.icon] || AlertCircle;
              
              return (
                <div
                  key={option.id}
                  className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4 flex items-start gap-3 hover:border-amber-400/50 transition cursor-pointer"
                  onClick={() => {
                    if (option.id === 'pause') {
                      saveDraft();
                      onClose();
                    }
                  }}
                >
                  <IconComponent size={24} className="text-amber-400 flex-shrink-0" />
                  <div>
                    <p className="text-slate-100 font-semibold">{option.name}</p>
                    <p className="text-slate-400 text-sm mt-1">{option.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-40 p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl w-full max-w-4xl my-8">
        {/* Header */}
        <div className="border-b border-neutral-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold font-mono text-slate-100">Memory Reconsolidation</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBreakModal(true)}
                className="bg-neutral-800 hover:bg-neutral-700 text-slate-300 px-4 py-2 rounded-lg font-medium transition text-sm"
              >
                I need a break
              </button>
              <button
                onClick={handleClose}
                className="text-slate-400 hover:text-slate-200 transition"
              >
                <X size={24} />
              </button>
            </div>
          </div>
          
          {renderStepper()}
          
          {showRecoveryBanner && (
            <div className="bg-cyan-900/20 border border-cyan-500/40 rounded-lg p-3 flex items-center justify-between">
              <p className="text-cyan-300 text-sm">
                Draft session recovered. Continue where you left off or start fresh.
              </p>
              <button
                onClick={() => setShowRecoveryBanner(false)}
                className="text-cyan-400 hover:text-cyan-300 transition"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {step === 'ONBOARDING' && renderOnboarding()}
          {step === 'MEMORY_SELECTION' && renderMemorySelection()}
          {step === 'BELIEF_EXTRACTION' && renderBeliefExtraction()}
          {step === 'CONTRADICTION_MINING' && (hasGeneratedContradictions ? renderComplete() : renderContradictionMining())}
        </div>
        
        {/* Footer */}
        <div className="border-t border-neutral-700 p-6">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={step === 'ONBOARDING' || hasGeneratedContradictions}
              className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-slate-300 px-6 py-3 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft size={20} />
              Back
            </button>
            
            <div className="flex items-center gap-3">
              {isLoading && (
                <div className="flex items-center gap-2 text-slate-400">
                  <Loader size={20} className="animate-spin" />
                  <span>Processing...</span>
                </div>
              )}
              
              {hasGeneratedContradictions && step === 'CONTRADICTION_MINING' ? (
                <button
                  onClick={handleComplete}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                >
                  <Check size={20} />
                  Complete Session
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={
                    isLoading ||
                    (step === 'ONBOARDING' && !canProceedFromOnboarding) ||
                    (step === 'MEMORY_SELECTION' && !canProceedFromMemorySelection) ||
                    (step === 'BELIEF_EXTRACTION' && !canProceedFromBeliefExtraction) ||
                    (step === 'CONTRADICTION_MINING' && !canProceedFromContradictionMining)
                  }
                  className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {step === 'MEMORY_SELECTION' || (step === 'CONTRADICTION_MINING' && !hasGeneratedContradictions) ? 'Generate' : 'Next'}
                  <ArrowRight size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {renderBreakModal()}
    </div>
  );
}
