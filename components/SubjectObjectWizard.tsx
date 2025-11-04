import React, { useState, useEffect } from 'react';
import { SubjectObjectSession, SubjectObjectStep } from '../types.ts';
import { X, ArrowLeft, ArrowRight, Lightbulb, Download } from 'lucide-react';
import * as geminiService from '../services/geminiService.ts';

interface SubjectObjectWizardProps {
  onClose: () => void;
  onSave: (session: SubjectObjectSession) => void;
  session: SubjectObjectSession | null;
  setDraft: (session: SubjectObjectSession | null) => void;
}

const STEPS: SubjectObjectStep[] = [
    'RECOGNIZE_PATTERN', 'TRUTH_FEELINGS', 'NAME_SUBJECT', 'EVIDENCE_SUBJECT', 'TRACE_ORIGIN',
    'COST', 'FIRST_OBSERVATION', 'SMALL_EXPERIMENT', 'INTEGRATION_SHIFT'
];
const TOTAL_STEPS = STEPS.length;


export default function SubjectObjectWizard({ onClose, onSave, session: draft, setDraft }: SubjectObjectWizardProps) {
  const [session, setSession] = useState<SubjectObjectSession>(draft || {
      id: `so-${Date.now()}`, date: new Date().toISOString(), currentStep: 'RECOGNIZE_PATTERN',
      pattern: '', truthFeelings: '', subjectToStatement: '', evidenceChecks: {}, origin: '',
      cost: '', firstObservation: '', dailyTracking: {}, reviewInsights: '', integrationShift: '',
      ongoingPracticePlan: []
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { if (draft) setSession(draft); }, [draft]);

  const handleSaveDraftAndClose = () => { setDraft(session); onClose(); };

  const updateField = (field: keyof SubjectObjectSession, value: any) => {
    setSession(prev => ({ ...prev, [field]: value }));
  };
  
  const canProceedToNext = () => {
    if (isLoading) return false;
    switch (session.currentStep) {
        case 'RECOGNIZE_PATTERN': return session.pattern.trim().length > 20;
        case 'TRUTH_FEELINGS': return session.truthFeelings.trim().length > 20;
        case 'EVIDENCE_SUBJECT': return (session.evidenceChecks?.pro?.length > 10 && session.evidenceChecks?.con?.length > 10);
        case 'TRACE_ORIGIN': return session.origin.trim().length > 20;
        case 'COST': return session.cost.trim().length > 20;
        case 'FIRST_OBSERVATION': return session.firstObservation.trim().length > 20;
        case 'SMALL_EXPERIMENT': return (session.smallExperimentChosen || '').trim().length > 10;
        case 'INTEGRATION_SHIFT': return session.integrationShift.trim().length > 20;
        default: return true;
    }
  };

  const handleNext = async () => {
    setIsLoading(true);
    try {
        const currentIndex = STEPS.indexOf(session.currentStep);
        let nextStep = STEPS[currentIndex + 1] || session.currentStep;

        if (session.currentStep === 'TRUTH_FEELINGS') {
            const subjectStatement = await geminiService.articulateSubjectTo(session.pattern, session.truthFeelings);
            updateField('subjectToStatement', subjectStatement);
            nextStep = 'NAME_SUBJECT';
        } else if (session.currentStep === 'COST') {
            const experiments = await geminiService.suggestSubjectObjectExperiments(session.pattern, session.subjectToStatement, [session.cost]);
            updateField('ongoingPracticePlan', experiments);
            nextStep = 'FIRST_OBSERVATION';
        } else if (session.currentStep === 'INTEGRATION_SHIFT') {
            onSave({ ...session, currentStep: 'COMPLETE' });
            return; // Exit before setting state
        }
        
        updateField('currentStep', nextStep);

    } catch (error) {
        console.error("AI service error", error);
        // Fallback to next step even if AI fails
        const currentIndex = STEPS.indexOf(session.currentStep);
        if (currentIndex < STEPS.length - 1) {
            updateField('currentStep', STEPS[currentIndex + 1]);
        }
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

  const handleDownload = () => {
    const reportContent = `# Subject-Object Explorer Session Report
Date: ${new Date().toLocaleDateString()}

## 1. Recognize a Pattern
${session.pattern}

## 2. The 'Truth' of the Pattern
${session.truthFeelings}

## 3. What You're Subject To (Aura's Articulation)
${session.subjectToStatement}

## 4. Check the Evidence
### Evidence FOR "${session.subjectToStatement}"
${session.evidenceChecks?.pro || 'N/A'}

### Evidence AGAINST "${session.subjectToStatement}"
${session.evidenceChecks?.con || 'N/A'}

## 5. Trace Its Origin
${session.origin || 'N/A'}

## 6. The Cost of this Pattern
${session.cost || 'N/A'}

## 7. The First Observation
${session.firstObservation || 'N/A'}

## 8. A Small, Safe Experiment
${session.smallExperimentChosen || 'No experiment chosen.'}
${session.ongoingPracticePlan && session.ongoingPracticePlan.length > 0 ? `\n\n**AI-suggested experiments:**\n- ` + session.ongoingPracticePlan.join('\n- ') : ''}

## 9. Integration & Shift
${session.integrationShift || 'N/A'}

---
Generated by Aura ILP
`;

    const blob = new Blob([reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subject-object-report-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const renderStep = () => {
    switch (session.currentStep) {
      case 'RECOGNIZE_PATTERN':
        return (
          <>
            <h3 className="text-lg font-semibold font-mono text-slate-100">Step 1: Recognize a Pattern</h3>
            <p className="text-slate-400">Describe a recurring pattern of thought, feeling, or behavior that you find yourself caught in. Be specific.</p>
            <div className="text-sm text-slate-500 mt-2 p-3 bg-slate-900/40 rounded-md border border-slate-700">Example: "When someone disagrees with me in a meeting, I immediately get defensive and spend all my energy trying to prove them wrong, rather than actually listening to their point."</div>
            <textarea value={session.pattern} onChange={e => updateField('pattern', e.target.value)} rows={6} className="w-full bg-slate-900/50 border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent mt-2" />
          </>
        );
       case 'TRUTH_FEELINGS':
        return (
          <>
            <h3 className="text-lg font-semibold font-mono text-slate-100">Step 2: The 'Truth' of the Pattern</h3>
            <p className="text-slate-400">When you are fully inside this pattern, what feels absolutely true? What are the core feelings or beliefs driving your actions?</p>
            <div className="text-sm text-slate-500 mt-2 p-3 bg-slate-900/40 rounded-md border border-slate-700">Example: "It feels like my competence is being attacked. I believe that if I don't win this argument, I will lose everyone's respect and be seen as a fraud."</div>
            <textarea value={session.truthFeelings} onChange={e => updateField('truthFeelings', e.target.value)} rows={6} className="w-full bg-slate-900/50 border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent mt-2" />
          </>
        );
      case 'NAME_SUBJECT':
        return (
          <>
            <h3 className="text-lg font-semibold font-mono text-slate-100">Step 3: What You're Subject To</h3>
            <p className="text-slate-400">Based on your input, Aura has articulated the core belief you might be "subject to"—the lens you're unconsciously looking through. You can edit it if needed.</p>
            <textarea value={session.subjectToStatement} onChange={e => updateField('subjectToStatement', e.target.value)} rows={3} className="w-full bg-slate-700/50 border-slate-600 rounded-md p-3 text-lg text-amber-300 italic focus:outline-none focus:ring-2 focus:ring-accent mt-2" />
          </>
        );
      case 'EVIDENCE_SUBJECT':
        return (
          <>
            <h3 className="text-lg font-semibold font-mono text-slate-100">Step 4: Check the Evidence</h3>
            <p className="text-slate-400">Let's test this belief. What is the actual evidence for and against it being 100% true all the time?</p>
            <label className="text-sm text-green-400 font-semibold mt-4 block">Evidence FOR "{session.subjectToStatement}"</label>
            <textarea value={session.evidenceChecks?.pro || ''} onChange={e => updateField('evidenceChecks', {...session.evidenceChecks, pro: e.target.value})} rows={4} className="w-full bg-slate-900/50 border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent mt-1" />
            <label className="text-sm text-red-400 font-semibold mt-2 block">Evidence AGAINST "{session.subjectToStatement}"</label>
            <textarea value={session.evidenceChecks?.con || ''} onChange={e => updateField('evidenceChecks', {...session.evidenceChecks, con: e.target.value})} rows={4} className="w-full bg-slate-900/50 border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent mt-1" />
          </>
        );
      case 'TRACE_ORIGIN':
        return (
            <>
                <h3 className="text-lg font-semibold font-mono text-slate-100">Step 5: Trace Its Origin</h3>
                <p className="text-slate-400">Where did this belief system come from? When did you first start to feel this way?</p>
                <button onClick={async () => { setIsLoading(true); const suggestion = await geminiService.exploreOrigin(session.pattern, session.subjectToStatement); updateField('origin', session.origin ? `${session.origin}\n\nAI Suggestion:\n${suggestion}` : suggestion); setIsLoading(false); }} className="text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1 rounded-md my-2 flex items-center gap-2"><Lightbulb size={14}/> Get AI Suggestion</button>
                <textarea value={session.origin} onChange={e => updateField('origin', e.target.value)} rows={6} className="w-full bg-slate-900/50 border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent" />
            </>
        );
       case 'COST':
        return (
          <>
            <h3 className="text-lg font-semibold font-mono text-slate-100">Step 6: The Cost of this Pattern</h3>
            <p className="text-slate-400">Be honest and direct. What has being subject to "{session.subjectToStatement}" cost you in your life, relationships, and well-being?</p>
            <div className="text-sm text-slate-500 mt-2 p-3 bg-slate-900/40 rounded-md border border-slate-700">Example: "It has cost me genuine connection because I'm too busy defending. It has cost me learning opportunities. It costs me enormous energy and leaves me feeling isolated and anxious afterwards."</div>
            <textarea value={session.cost} onChange={e => updateField('cost', e.target.value)} rows={6} className="w-full bg-slate-900/50 border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent mt-2" />
          </>
        );
      case 'FIRST_OBSERVATION':
        return (
            <>
                <h3 className="text-lg font-semibold font-mono text-slate-100">Step 7: The First Observation</h3>
                <p className="text-slate-400">Imagine the next time this pattern arises. From a compassionate, objective viewpoint, what would you see? Describe the "you" who is caught in the pattern as if you were a neutral observer.</p>
                <div className="text-sm text-slate-500 mt-2 p-3 bg-slate-900/40 rounded-md border border-slate-700">This step is crucial. It is the mental act of making the pattern "object" for the first time.</div>
                <textarea value={session.firstObservation} onChange={e => updateField('firstObservation', e.target.value)} rows={6} className="w-full bg-slate-900/50 border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent mt-2" />
            </>
        );
       case 'SMALL_EXPERIMENT':
         return (
           <>
            <h3 className="text-lg font-semibold font-mono text-slate-100">Step 8: A Small, Safe Experiment</h3>
            <p className="text-slate-400">To make this pattern "object" in real life, we need a small experiment. Below are AI suggestions. Choose one that feels slightly uncomfortable but safe, or write your own.</p>
            <div className="space-y-2 my-4">
                {session.ongoingPracticePlan && session.ongoingPracticePlan.map((exp, i) => (
                    <div key={i} className="bg-slate-700/50 p-3 rounded-md text-sm">{exp}</div>
                ))}
            </div>
            <textarea value={session.smallExperimentChosen || ''} onChange={e => updateField('smallExperimentChosen', e.target.value)} rows={2} placeholder="Your chosen experiment for the next week..." className="w-full bg-slate-900/50 border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent" />
           </>
         );
       case 'INTEGRATION_SHIFT':
        return (
            <>
                <h3 className="text-lg font-semibold font-mono text-slate-100">Step 9: Integration & Shift</h3>
                <p className="text-slate-400">Having observed this pattern, what is the key insight? What new, more empowering belief or action is now available to you?</p>
                <button onClick={async () => { setIsLoading(true); const suggestion = await geminiService.generateIntegrationInsight(session.pattern, session.subjectToStatement, session.cost, session.smallExperimentChosen || ''); updateField('integrationShift', session.integrationShift ? `${session.integrationShift}\n\nAI Suggestion:\n${suggestion}` : suggestion); setIsLoading(false); }} className="text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1 rounded-md my-2 flex items-center gap-2"><Lightbulb size={14}/> Get AI Suggestion</button>
                <textarea value={session.integrationShift} onChange={e => updateField('integrationShift', e.target.value)} rows={6} className="w-full bg-slate-900/50 border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent" />
                <button
                    onClick={handleDownload}
                    className="mt-6 w-full btn-luminous px-4 py-2 rounded-md font-medium flex items-center justify-center gap-2"
                >
                    <Download size={16} /> Download Report
                </button>
            </>
        );
      default:
        return <p>Loading step...</p>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in">
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">
            <header className="p-4 border-b border-slate-700 flex-shrink-0">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-2xl font-bold font-mono tracking-tight text-purple-300">Subject-Object Explorer</h2>
                    <span className="text-sm text-slate-400 font-mono">Step {STEPS.indexOf(session.currentStep) + 1} of {TOTAL_STEPS}</span>
                </div>
                <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
                    <div
                        className="bg-purple-500 h-full transition-all duration-300"
                        style={{ width: `${((STEPS.indexOf(session.currentStep) + 1) / TOTAL_STEPS) * 100}%` }}
                    />
                </div>
            </header>
            <main className="p-6 flex-grow overflow-y-auto">
                 <div className="flex gap-6">
                    <div className="flex-1 space-y-4">
                        {isLoading && <p className="text-slate-400 animate-pulse">Aura is thinking...</p>}
                        {renderStep()}
                    </div>
                    <aside className="w-56 bg-slate-900/50 p-4 rounded-lg border border-slate-700 max-h-[60vh] overflow-y-auto hidden md:block">
                        <h4 className="font-mono text-slate-400 mb-3 text-sm">Session Context</h4>
                        {session.pattern && (
                            <div className="mb-3 text-xs">
                                <p className="text-slate-500 font-semibold">Pattern:</p>
                                <p className="text-slate-300">{session.pattern.substring(0, 100)}...</p>
                            </div>
                        )}
                        {session.truthFeelings && (
                            <div className="mb-3 text-xs">
                                <p className="text-slate-500 font-semibold">Core Feelings:</p>
                                <p className="text-slate-300">{session.truthFeelings.substring(0, 80)}...</p>
                            </div>
                        )}
                        {session.subjectToStatement && (
                            <div className="mb-3 text-xs">
                                <p className="text-slate-500 font-semibold">Subject To:</p>
                                <p className="text-slate-300">{session.subjectToStatement}</p>
                            </div>
                        )}
                    </aside>
                </div>
            </main>
            <footer className="p-4 border-t border-slate-700 flex justify-between items-center flex-shrink-0">
                <button onClick={handleSaveDraftAndClose} className="text-sm text-slate-400 hover:text-white transition">Save Draft & Close</button>
                <div className="flex gap-4">
                    {session.currentStep !== 'RECOGNIZE_PATTERN' && <button onClick={handleBack} disabled={isLoading} className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-md font-medium"><ArrowLeft size={16}/></button>}
                    <button
                        onClick={handleNext}
                        disabled={!canProceedToNext()}
                        className="btn-luminous px-4 py-2 rounded-md font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                         {session.currentStep === 'INTEGRATION_SHIFT' ? 'Finish & Save' : 'Next'} <ArrowRight size={16}/>
                    </button>
                </div>
            </footer>
        </div>
    </div>
  );
}