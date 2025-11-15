
import React, { useState, useEffect } from 'react';
import { ThreeTwoOneSession, IntegratedInsight } from '../types.ts';
import { X, ArrowLeft, ArrowRight, Lightbulb, TrendingUp } from 'lucide-react';
import { summarizeThreeTwoOneSession } from '../services/geminiService.ts';
import { getWizardSequenceContext } from '../services/insightContext.ts';

type Step = 'TRIGGER' | 'FACE_IT' | 'TALK_TO_IT' | 'BE_IT' | 'INTEGRATE' | 'SUMMARY';

interface ThreeTwoOneWizardProps {
  onClose: () => void;
  onSave: (session: ThreeTwoOneSession) => void;
  session: Partial<ThreeTwoOneSession> | null;
  insightContext?: IntegratedInsight | null;
  allInsights?: IntegratedInsight[];
  markInsightAsAddressed: (insightId: string, shadowToolType: string, shadowSessionId: string) => void;
}

export default function ThreeTwoOneWizard({ onClose, onSave, session: draft, insightContext, allInsights = [], markInsightAsAddressed }: ThreeTwoOneWizardProps) {
  const sequenceContext = getWizardSequenceContext('3-2-1 Reflection', allInsights);
  const [session, setSession] = useState<Partial<ThreeTwoOneSession>>(() => {
    if (insightContext && (!draft || !draft.linkedInsightId)) {
      return { ...draft, linkedInsightId: insightContext.id };
    }
    return draft || {};
  });
  const [step, setStep] = useState<Step>('TRIGGER');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (draft) {
      setSession(draft);
      if (!draft.trigger) setStep('TRIGGER');
      else if (!draft.triggerDescription) setStep('FACE_IT');
      else if (!draft.dialogue) setStep('TALK_TO_IT');
      else if (!draft.embodiment) setStep('BE_IT');
      else if (!draft.integration) setStep('INTEGRATE');
    }
    if (insightContext && session.linkedInsightId !== insightContext.id) {
        setSession(prev => ({ ...prev, linkedInsightId: insightContext.id }));
    }
  }, [draft, insightContext]);

  const updateSession = (field: keyof ThreeTwoOneSession, value: string) => {
    setSession(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = async () => {
    switch (step) {
      case 'TRIGGER': setStep('FACE_IT'); break;
      case 'FACE_IT': setStep('TALK_TO_IT'); break;
      case 'TALK_TO_IT': setStep('BE_IT'); break;
      case 'BE_IT': setStep('INTEGRATE'); break;
      case 'INTEGRATE':
        setIsLoading(true);
        const finalSessionData: ThreeTwoOneSession = {
          id: session.id || `321-${Date.now()}`,
          date: session.date || new Date().toISOString(),
          trigger: session.trigger || '',
          triggerDescription: session.triggerDescription || '',
          dialogue: session.dialogue || '',
          embodiment: session.embodiment || '',
          integration: session.integration || '',
          linkedInsightId: session.linkedInsightId // Persist the linked insight ID
        };
        try {
          const summary = await summarizeThreeTwoOneSession(finalSessionData);
          setSession({ ...finalSessionData, aiSummary: summary });
        } catch (e) {
            console.error("Error generating summary:", e);
             setSession({ ...finalSessionData, aiSummary: "Could not generate summary." });
        } finally {
            setIsLoading(false);
            setStep('SUMMARY');
        }
        break;
      case 'SUMMARY':
        const sessionToSave: ThreeTwoOneSession = {
            id: session.id || `321-${Date.now()}`,
            date: session.date || new Date().toISOString(),
            trigger: session.trigger || '',
            triggerDescription: session.triggerDescription || '',
            dialogue: session.dialogue || '',
            embodiment: session.embodiment || '',
            integration: session.integration || '',
            aiSummary: session.aiSummary,
            linkedInsightId: session.linkedInsightId // Ensure linkedInsightId is saved
        };
        onSave(sessionToSave);
        if (sessionToSave.linkedInsightId) {
            markInsightAsAddressed(sessionToSave.linkedInsightId, '3-2-1 Process', sessionToSave.id);
        }
        break;
    }
  };
  
  const handleBack = () => {
    switch (step) {
      case 'FACE_IT': setStep('TRIGGER'); break;
      case 'TALK_TO_IT': setStep('FACE_IT'); break;
      case 'BE_IT': setStep('TALK_TO_IT'); break;
      case 'INTEGRATE': setStep('BE_IT'); break;
      case 'SUMMARY': setStep('INTEGRATE'); break; // Allow going back from summary
    }
  };
  
  const renderStep = () => {
    switch (step) {
      case 'TRIGGER':
        return (
          <>
            <h3 className="text-lg font-semibold font-mono text-slate-100">Step 1: The Trigger</h3>

            {sequenceContext && !insightContext && (
              <div className="bg-cyan-900/20 border border-cyan-600/50 rounded-md p-4 my-4 text-sm text-cyan-200">
                <p className="font-semibold flex items-center gap-2 mb-2">
                  <TrendingUp size={16}/> Building on Your Previous Work
                </p>
                <p className="text-cyan-300">
                  {sequenceContext.progressionNote}
                </p>
                <p className="text-xs text-cyan-400 mt-2">
                  Last session: {sequenceContext.lastSessionDate} • Total: {sequenceContext.totalSessions} {sequenceContext.totalSessions === 1 ? 'session' : 'sessions'}
                </p>
              </div>
            )}

            {insightContext && (
                <div className="bg-blue-900/30 border border-blue-700 rounded-md p-4 my-4 text-sm text-blue-200 space-y-3">
                    <p className="font-bold flex items-center gap-2"><Lightbulb size={16}/> Starting from an Insight:</p>
                    <p><strong className="text-blue-300">Session Context:</strong> {insightContext.mindToolShortSummary}</p>
                    <p><strong className="text-blue-300">Detected Pattern:</strong> "{insightContext.detectedPattern}"</p>
                    <div className="mt-2">
                      <p className="text-xs text-blue-400 mb-1">Full context from your {insightContext.mindToolType} session:</p>
                      <div className="bg-slate-900/50 p-3 rounded-md max-h-48 overflow-y-auto text-xs whitespace-pre-wrap font-mono">
                        {insightContext.mindToolReport}
                      </div>
                    </div>
                    <p className="text-xs text-blue-400 mt-2">Use this context to define the quality that triggers you below.</p>
                </div>
            )}
            <p className="text-slate-400">What person or situation is bothering you? Name the quality that triggers you in one or two words.</p>
            <input
              type="text"
              value={session.trigger || ''}
              onChange={(e) => updateSession('trigger', e.target.value)}
              placeholder="e.g., My boss's arrogance"
              className="w-full bg-slate-900/50 border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </>
        );
      case 'FACE_IT':
        return (
          <>
            <h3 className="text-lg font-semibold font-mono text-slate-100">Step 2: Face It (3rd Person)</h3>
            <p className="text-slate-400">Describe the person/quality that triggers you in detail. What do they do? How do they act? Be objective.</p>
            <textarea
              value={session.triggerDescription || ''}
              onChange={(e) => updateSession('triggerDescription', e.target.value)}
              rows={8}
              className="w-full bg-slate-900/50 border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </>
        );
      case 'TALK_TO_IT':
        return (
          <>
            <h3 className="text-lg font-semibold font-mono text-slate-100">Step 3: Talk To It (2nd Person)</h3>
            <p className="text-slate-400">Write a short dialogue with this quality. Ask it questions like: "What do you want?" "What is your gift for me?"</p>
            <textarea
              value={session.dialogue || ''}
              onChange={(e) => updateSession('dialogue', e.target.value)}
              rows={8}
              className="w-full bg-slate-900/50 border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </>
        );
      case 'BE_IT':
        return (
          <>
            <h3 className="text-lg font-semibold font-mono text-slate-100">Step 4: Be It (1st Person)</h3>
            <p className="text-slate-400">Now, embody this quality. Speak from its perspective using "I". For example: "I am arrogance. My purpose is..."</p>
            <textarea
              value={session.embodiment || ''}
              onChange={(e) => updateSession('embodiment', e.target.value)}
              rows={8}
              className="w-full bg-slate-900/50 border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </>
        );
      case 'INTEGRATE':
         return (
          <>
            <h3 className="text-lg font-semibold font-mono text-slate-100">Step 5: Integration</h3>
            <p className="text-slate-400">How can you re-own this quality in a healthy way? How is this part of you?</p>
            <textarea
              value={session.integration || ''}
              onChange={(e) => updateSession('integration', e.target.value)}
              rows={8}
              className="w-full bg-slate-900/50 border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </>
        );
       case 'SUMMARY':
        return (
            <>
                <h3 className="text-lg font-semibold font-mono text-slate-100">Session Summary</h3>
                <p className="text-slate-400">Here's Aura's summary of your session. Reflect on it before saving.</p>
                <div className="bg-slate-700/50 p-4 rounded-md mt-4">
                    <p className="text-slate-300 italic">{session.aiSummary}</p>
                </div>
            </>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in">
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <header className="p-4 border-b border-slate-700 flex justify-between items-center">
                <h2 className="text-2xl font-bold font-mono tracking-tight text-amber-300">3-2-1 Process Wizard</h2>
                <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X size={24} /></button>
            </header>
            <main className="p-6 flex-grow overflow-y-auto space-y-4">
                {renderStep()}
                {isLoading && <p className="text-slate-400 animate-pulse">Aura is generating your summary...</p>}
            </main>
            <footer className="p-4 border-t border-slate-700 flex justify-between items-center">
                <button onClick={onClose} className="text-sm text-slate-400 hover:text-white transition">Save Draft & Close</button>
                <div className="flex gap-4">
                    {step !== 'TRIGGER' && <button onClick={handleBack} className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-md font-medium" disabled={isLoading}><ArrowLeft size={16}/></button>}
                    <button onClick={handleNext} disabled={isLoading} className="btn-luminous px-4 py-2 rounded-md font-medium flex items-center gap-2">
                         {step === 'INTEGRATE' ? 'Generate Summary' : step === 'SUMMARY' ? 'Finish & Save' : 'Next'} <ArrowRight size={16}/>
                    </button>
                </div>
            </footer>
        </div>
    </div>
  );
}