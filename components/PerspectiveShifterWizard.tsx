import React, { useState, useEffect } from 'react';
// FIX: Correct import paths for types and services.
import { PerspectiveShifterSession, PerspectiveShifterStep, Perspective } from '../types.ts';
import { X, ArrowLeft, ArrowRight } from 'lucide-react';
import * as geminiService from '../services/geminiService.ts';

// FIX: Define the PerspectiveShifterWizardProps interface for type safety.
interface PerspectiveShifterWizardProps {
  onClose: () => void;
  onSave: (session: PerspectiveShifterSession) => void;
  session: PerspectiveShifterSession | null;
  setDraft: (session: PerspectiveShifterSession | null) => void;
}

const ProgressBar = ({ currentStep }: { currentStep: number }) => {
  const steps = ['Situation', 'Your View', 'Their View', 'Observer', 'Witness', 'Integrate'];
  return (
    <div className="flex items-center">
      {steps.map((step, index) => (
        <React.Fragment key={step}>
          <div className={`flex flex-col items-center`}>
             <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${index < currentStep ? 'bg-orange-500 text-white' : index === currentStep ? 'bg-orange-600 text-white ring-4 ring-orange-500/50' : 'bg-slate-700 text-slate-400'}`}>
              {index < currentStep ? '✓' : index + 1}
            </div>
            <p className={`mt-2 text-xs text-center ${index === currentStep ? 'text-orange-300 font-bold' : 'text-slate-400'}`}>{step}</p>
          </div>
          {index < steps.length - 1 && <div className={`flex-1 h-1 mx-2 transition-colors ${index < currentStep ? 'bg-orange-500' : 'bg-slate-700'}`}></div>}
        </React.Fragment>
      ))}
    </div>
  );
};


const PerspectiveInput = ({
    title,
    description,
    value,
    onChange,
    aiReflection,
    isLoading
}: {
    title: string;
    description: string;
    value: string;
    onChange: (value: string) => void;
    aiReflection?: string;
    isLoading: boolean;
}) => (
    <div className="space-y-4 animate-fade-in">
        <h3 className="text-lg font-semibold font-mono text-slate-100">{title}</h3>
        <p className="text-slate-400">{description}</p>
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={8}
            className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-accent"
            disabled={isLoading}
        />
        {aiReflection && (
             <div className="bg-slate-700/50 p-3 rounded-lg border border-slate-600">
                <p className="text-sm text-slate-300 italic">{aiReflection}</p>
            </div>
        )}
    </div>
);


export default function PerspectiveShifterWizard({ onClose, onSave, session: draft, setDraft }: PerspectiveShifterWizardProps) {
    const [session, setSession] = useState<PerspectiveShifterSession>(draft || {
        id: `ps-${Date.now()}`, date: new Date().toISOString(), currentStep: 'CHOOSE_SITUATION', stuckSituation: '', perspectives: [], dailyTracking: {}
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [suggestedApproaches, setSuggestedApproaches] = useState<string[]>([]);
    
    useEffect(() => { if (draft) setSession(draft); }, [draft]);

    const handleSaveDraftAndClose = () => { setDraft(session); onClose(); };

    const updatePerspective = (type: Perspective['type'], description: string, llmReflection?: string) => {
        const existingIndex = session.perspectives.findIndex(p => p.type === type);
        let newPerspectives = [...session.perspectives];
        if (existingIndex > -1) {
            newPerspectives[existingIndex] = { ...newPerspectives[existingIndex], description, llmReflection: llmReflection ?? newPerspectives[existingIndex].llmReflection };
        } else {
            newPerspectives.push({ type, description, llmReflection });
        }
        setSession(prev => ({ ...prev, perspectives: newPerspectives }));
    };

    const getPerspective = (type: Perspective['type']) => session.perspectives.find(p => p.type === type) || { type, description: '' };
    
    const handleNext = async () => {
        setError('');
        setIsLoading(true);
        try {
            const currentDesc = getPerspective(
                session.currentStep === 'FIRST_PERSON' ? 'First Person (You)' :
                session.currentStep === 'SECOND_PERSON' ? 'Second Person (Them)' :
                session.currentStep === 'THIRD_PERSON' ? 'Third Person (Observer)' : 'Witness (Pure Awareness)'
            ).description;

            const order: PerspectiveShifterStep[] = ['CHOOSE_SITUATION', 'FIRST_PERSON', 'SECOND_PERSON', 'THIRD_PERSON', 'WITNESS', 'INTEGRATION_MAP', 'SHIFT', 'NEW_POSSIBILITY', 'REALITY_CHECK', 'TRACK_CONVERSATION'];
            const currentIndex = order.indexOf(session.currentStep);
            let nextStep: PerspectiveShifterStep = currentIndex < order.length - 1 ? order[currentIndex + 1] : session.currentStep;

            if (['FIRST_PERSON', 'SECOND_PERSON', 'THIRD_PERSON', 'WITNESS'].includes(session.currentStep)) {
                const perspectiveType = getPerspective(
                    session.currentStep === 'FIRST_PERSON' ? 'First Person (You)' :
                    session.currentStep === 'SECOND_PERSON' ? 'Second Person (Them)' :
                    session.currentStep === 'THIRD_PERSON' ? 'Third Person (Observer)' : 'Witness (Pure Awareness)'
                ).type;

                // Only generate reflection if it doesn't exist yet for this description
                if(currentDesc && !getPerspective(perspectiveType).llmReflection){
                    const reflection = await geminiService.guidePerspectiveReflection(session.stuckSituation, perspectiveType, currentDesc, session.perspectives);
                    updatePerspective(perspectiveType, currentDesc, reflection);
                }
                
                if (session.currentStep === 'WITNESS') {
                    const synthesis = await geminiService.synthesizePerspectives(session.stuckSituation, session.perspectives);
                    setSession(s => ({...s, synthesis, currentStep: 'INTEGRATION_MAP'}));
                } else {
                    setSession(s => ({...s, currentStep: nextStep}));
                }
            } else if (session.currentStep === 'SHIFT') {
                const approaches = await geminiService.suggestPerspectiveShifterApproach(session.stuckSituation, session.perspectives, session.synthesis || '', session.shiftInsight || '');
                setSuggestedApproaches(approaches);
                setSession(s => ({...s, currentStep: 'NEW_POSSIBILITY'}));
            } else if (session.currentStep === 'TRACK_CONVERSATION') {
                onSave({ ...session, currentStep: 'COMPLETE' });
                onClose();
            } else {
                setSession(s => ({...s, currentStep: nextStep}));
            }
        } catch(e) {
            setError(e instanceof Error ? e.message : 'An AI error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleBack = () => {
      const order: PerspectiveShifterStep[] = ['CHOOSE_SITUATION', 'FIRST_PERSON', 'SECOND_PERSON', 'THIRD_PERSON', 'WITNESS', 'INTEGRATION_MAP', 'SHIFT', 'NEW_POSSIBILITY', 'REALITY_CHECK', 'TRACK_CONVERSATION'];
      const index = order.indexOf(session.currentStep);
      if (index > 0) setSession(s => ({...s, currentStep: order[index - 1]}));
    };
    
    const stepNumber: Record<PerspectiveShifterStep, number> = { CHOOSE_SITUATION: 0, FIRST_PERSON: 1, SECOND_PERSON: 2, THIRD_PERSON: 3, WITNESS: 4, INTEGRATION_MAP: 5, SHIFT: 5, NEW_POSSIBILITY: 5, REALITY_CHECK: 5, TRACK_CONVERSATION: 5, COMPLETE: 6};

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in">
          <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
            <header className="p-4 border-b border-slate-700 flex justify-between items-center"><h2 className="text-2xl font-bold font-mono tracking-tight text-orange-300">Perspective Shifter</h2><button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X size={24} /></button></header>
            <div className="p-6"><ProgressBar currentStep={stepNumber[session.currentStep]} /></div>
            <main className="p-6 flex-grow overflow-y-auto">
                {error && <p className="text-red-400 text-sm mb-4 bg-red-900/50 p-3 rounded-md">{error}</p>}
                {isLoading && session.currentStep !== 'INTEGRATION_MAP' && <p className="text-slate-400 text-sm animate-pulse mb-4">Aura is thinking...</p>}

                {session.currentStep === 'CHOOSE_SITUATION' && <PerspectiveInput title="Step 1: Choose Your Stuck Situation" description="Describe a situation where you feel stuck or can't see the other side." value={session.stuckSituation} onChange={val => setSession(s=>({...s, stuckSituation: val}))} isLoading={isLoading} />}
                {session.currentStep === 'FIRST_PERSON' && <PerspectiveInput title="Step 2: 1st Person Perspective (Your View)" description="From your own eyes, what's true about this situation? What do you feel and need?" value={getPerspective('First Person (You)').description} onChange={val => updatePerspective('First Person (You)', val)} aiReflection={getPerspective('First Person (You)').llmReflection} isLoading={isLoading} />}
                {session.currentStep === 'SECOND_PERSON' && <PerspectiveInput title="Step 3: 2nd Person Perspective (Their View)" description="Genuinely imagine you are them. What is their experience? What might they be needing or fearing?" value={getPerspective('Second Person (Them)').description} onChange={val => updatePerspective('Second Person (Them)', val)} aiReflection={getPerspective('Second Person (Them)').llmReflection} isLoading={isLoading} />}
                {session.currentStep === 'THIRD_PERSON' && <PerspectiveInput title="Step 4: 3rd Person Perspective (Observer)" description="Step back and view the situation as a caring, neutral observer. What is the pattern? What is the system dynamic at play?" value={getPerspective('Third Person (Observer)').description} onChange={val => updatePerspective('Third Person (Observer)', val)} aiReflection={getPerspective('Third Person (Observer)').llmReflection} isLoading={isLoading} />}
                {session.currentStep === 'WITNESS' && <PerspectiveInput title="Step 5: Witness Perspective (Pure Awareness)" description="From a place of pure awareness and compassion, what is visible? No blame, no judgment. What is the shared humanity here?" value={getPerspective('Witness (Pure Awareness)').description} onChange={val => updatePerspective('Witness (Pure Awareness)', val)} aiReflection={getPerspective('Witness (Pure Awareness)').llmReflection} isLoading={isLoading} />}
                
                {session.currentStep === 'INTEGRATION_MAP' && <div className="space-y-4 animate-fade-in"><h3>Step 6: Integration</h3><p className="text-slate-400 mb-4">Here are all four perspectives. Aura's synthesis highlights how they can all be true at once.</p>{isLoading ? <p className="text-slate-400 animate-pulse">Synthesizing...</p> : <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600"><p className="text-slate-300 italic">{session.synthesis}</p></div>}</div>}
                {session.currentStep === 'SHIFT' && <div className="space-y-4 animate-fade-in"><h3>How does seeing all perspectives change things?</h3><p className="text-slate-400 mb-4">What becomes possible now that you can hold all four?</p><textarea value={session.shiftInsight || ''} onChange={e => setSession(s => ({...s, shiftInsight: e.target.value}))} rows={5} className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent" /></div>}
                {session.currentStep === 'NEW_POSSIBILITY' && <div className="space-y-4 animate-fade-in"><h3>New Possibilities</h3><p className="text-slate-400 mb-4">Based on your insight, here are some new approaches. Choose one or write your own.</p>{suggestedApproaches.map((app, i) => <div key={i} className="bg-slate-700/50 p-3 rounded-md">{app}</div>)}<textarea value={session.newPossibility || ''} onChange={e => setSession(s => ({...s, newPossibility: e.target.value}))} rows={3} placeholder="Copy & paste or write your own new approach..." className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 mt-4 focus:outline-none focus:ring-2 focus:ring-accent" /></div>}
                {session.currentStep === 'REALITY_CHECK' && <div className="space-y-4 animate-fade-in"><h3>Reality Check</h3><p className="text-slate-400 mb-4">This doesn't mean you minimize your needs. It means you can advocate for yourself FROM compassion. Refine your chosen approach into a clear, actionable communication.</p><textarea value={session.realityCheckRefinement || ''} onChange={e => setSession(s => ({...s, realityCheckRefinement: e.target.value}))} rows={5} className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent" /></div>}
                {session.currentStep === 'TRACK_CONVERSATION' && <div className="space-y-4 animate-fade-in"><h3>Track the Conversation</h3><p className="text-slate-400 mb-4">This week, try this new approach. You can add notes here to track how it goes.</p><textarea value={Object.values(session.dailyTracking)[0]?.[0] || ''} onChange={e => setSession(s => ({...s, dailyTracking: { [new Date().toISOString().split('T')[0]]: [e.target.value] }}))} rows={5} className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent" /></div>}
            </main>
            <footer className="p-4 border-t border-slate-700 flex justify-between items-center">
                <button onClick={handleSaveDraftAndClose} className="text-sm text-slate-400 hover:text-white transition">Save Draft & Close</button>
                <div className="flex gap-4">
                    {session.currentStep !== 'CHOOSE_SITUATION' && <button onClick={handleBack} disabled={isLoading} className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-md font-medium"><ArrowLeft size={16}/></button>}
                    <button onClick={handleNext} disabled={isLoading} className="btn-luminous px-4 py-2 rounded-md font-medium flex items-center gap-2">
                        {session.currentStep === 'TRACK_CONVERSATION' ? 'Finish & Save' : 'Next'} <ArrowRight size={16}/>
                    </button>
                </div>
            </footer>
          </div>
        </div>
    );
}