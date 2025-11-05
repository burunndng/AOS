
import React, { useState } from 'react';
// FIX: Add `Practice` to the type imports to resolve errors on lines 29 and 36.
import { CustomPractice, ModuleKey, Practice } from '../types.ts';
import { modules } from '../constants.ts';
import { X, Save, Sparkles, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import * as geminiService from '../services/geminiService.ts';
import { practices as corePractices } from '../constants.ts';

interface CustomPracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (practice: CustomPractice, module: ModuleKey) => void;
}

type BuilderStep = 'MODULE' | 'GOAL' | 'RESEARCH' | 'STRUCTURE' | 'REFINE' | 'REVIEW';

export default function CustomPracticeModal({ isOpen, onClose, onSave }: CustomPracticeModalProps) {
  // Navigation
  const [step, setStep] = useState<BuilderStep>('MODULE');
  const [isLoading, setIsLoading] = useState(false);
  const [module, setModule] = useState<ModuleKey>('mind');

  // Step 2: Goal
  const [goal, setGoal] = useState('');
  const [similarPractices, setSimilarPractices] = useState<string[]>([]);

  // Step 3: Research
  const [why, setWhy] = useState('');
  const [evidence, setEvidence] = useState('');
  const [roi, setRoi] = useState<Practice['roi']>('HIGH');

  // Step 4: Structure
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [howSteps, setHowSteps] = useState<string[]>([]);
  const [timePerWeek, setTimePerWeek] = useState(1);
  const [difficulty, setDifficulty] = useState<Practice['difficulty']>('Medium');
  const [affectsSystem, setAffectsSystem] = useState<string[]>([]);

  // Step 5: Refine
  const [refinementNotes, setRefinementNotes] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  const [error, setError] = useState('');

  // =====================
  // Step Handlers
  // =====================

  const handleModuleSelect = (selectedModule: ModuleKey) => {
    setModule(selectedModule);
    // Reset all fields when changing module
    setGoal(''); setWhy(''); setEvidence(''); setName('');
    setDescription(''); setHowSteps([]); setAffectsSystem([]);
    setRefinementNotes(''); setAiSuggestions([]); setSimilarPractices([]);
    setError('');
    setTimePerWeek(1);
    setRoi('HIGH'); setDifficulty('Medium');
    setStep('GOAL');
  };

  const handleGoalSubmit = async () => {
    if (!goal.trim()) {
      setError('Please describe what you want to accomplish.');
      return;
    }
    setIsLoading(true);
    try {
      // FIX: Cast the result of flat() to Practice[] to ensure type safety.
      const allPractices: Practice[] = Object.values(corePractices).flat();
      const similar = allPractices
        .filter(p =>
            p.name.toLowerCase().includes(goal.toLowerCase()) ||
            p.description.toLowerCase().includes(goal.toLowerCase()) ||
            p.why.toLowerCase().includes(goal.toLowerCase())
        ).map(p => p.name);
      setSimilarPractices(similar);
      setError('');
      setStep('RESEARCH');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGenerateResearch = async () => {
    setIsLoading(true);
    try {
      if (module === 'shadow') {
        const research = await geminiService.generateShadowPatternInsights(goal);
        setWhy(research.origin);
        setEvidence(research.framework);
      } else if (module === 'spirit') {
        const research = await geminiService.generateSpiritualContext(goal);
        setWhy(research.tradition);
        setEvidence(research.teachings);
        setRoi('EXTREME');
      } else {
        const research = await geminiService.generatePracticeResearch(goal);
        setWhy(research.why);
        setEvidence(research.evidence);
        setRoi(research.roi);
      }
      setError('');
    } catch (err) {
      setError('Failed to generate research. Try editing manually.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResearchNext = () => {
    if (!why.trim() || !evidence.trim()) {
      setError('Please provide or generate both sections.'); return;
    }
    setError(''); setStep('STRUCTURE');
  };

  const handleGenerateStructure = async () => {
    setIsLoading(true);
    try {
      if (module === 'shadow') {
        const structure = await geminiService.generateShadowWorkStructure(goal, why);
        setName(structure.name);
        setDescription(structure.description);
        setHowSteps(structure.inquiryQuestions);
        setAffectsSystem(['weekly', ...structure.affectsSystem]);
      } else if (module === 'spirit') {
        const structure = await geminiService.generateSpiritualPracticeStructure(goal, why);
        setName(structure.name);
        setDescription(structure.description);
        setHowSteps(structure.stages);
        setAffectsSystem(['meditation', ...structure.consciousnessAspects]);
      } else {
        const structure = await geminiService.generatePracticeStructure(goal, why, timePerWeek);
        setName(structure.name);
        setDescription(structure.description);
        setHowSteps(structure.howSteps);
        setDifficulty(structure.difficulty);
        setAffectsSystem(structure.affectsSystem);
      }
      setError('');
    } catch (err) {
      setError('Failed to generate structure. Try editing manually.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddHowStep = () => setHowSteps([...howSteps, '']);
  const handleUpdateHowStep = (index: number, value: string) => setHowSteps(howSteps.map((s, i) => i === index ? value : s));
  const handleRemoveHowStep = (index: number) => setHowSteps(howSteps.filter((_, i) => i !== index));

  const handleStructureNext = () => {
    if (!name.trim() || !description.trim() || howSteps.length === 0) {
      setError('Name, description, and at least one step are required.'); return;
    }
    if (howSteps.some(s => !s.trim())) {
      setError('All steps/prompts/stages must be filled in.'); return;
    }
    setError(''); setStep('REFINE');
  };

  const handleGetRefinementSuggestions = async () => {
    setIsLoading(true);
    try {
      const suggestions = await geminiService.refinePractice(name, description, why, howSteps, timePerWeek, module);
      setAiSuggestions(suggestions);
      setError('');
    } catch (err) {
      setError('Failed to generate suggestions.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleApplySuggestion = (suggestion: string) => setRefinementNotes(prev => (prev ? `${prev}\n- ${suggestion}` : `- ${suggestion}`));
  const handleRefineNext = () => { setError(''); setStep('REVIEW'); };

  const handleSave = () => {
    const newPractice: CustomPractice = {
      id: `custom-${Date.now()}`, name, description, timePerWeek, module, isCustom: true,
      why, evidence, roi, difficulty, affectsSystem: affectsSystem.length > 0 ? affectsSystem : ['custom'], how: howSteps,
    };
    onSave(newPractice, module);
    onClose();
  };

  const renderModuleSelection = () => (
    <>
      <h3 className="text-lg font-semibold text-slate-100 mb-4">Which module are you creating for?</h3>
      <p className="text-sm text-slate-400 mb-6">Each module has a different approach:</p>
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(modules).map(([key, info]) => (
          <button key={key} onClick={() => handleModuleSelect(key as ModuleKey)}
            className={`p-4 rounded-lg border-2 transition text-left ${module === key ? `${info.borderColor} border-opacity-100` : `bg-slate-700/50 border-slate-600 hover:border-slate-500`}`}>
            <p className={`font-semibold ${info.textColor}`}>{info.name}</p>
            <p className={`text-xs mt-1 ${info.textColor} opacity-80`}>
              {key === 'body' && 'Physical practices with measurable outcomes'}
              {key === 'mind' && 'Cognitive & learning practices with evidence'}
              {key === 'spirit' && 'Contemplative practices for consciousness'}
              {key === 'shadow' && 'Psychological integration & self-discovery'}
            </p>
          </button>
        ))}
      </div>
    </>
  );

  const renderGoalStep = () => {
    const commonProps = { value: goal, onChange: (e: any) => setGoal(e.target.value), rows: 4, className: "w-full text-sm bg-slate-700/50 border border-slate-600 rounded-md p-3 focus:outline-none focus:ring-2 mb-4" };
    if (module === 'shadow') {
      return <>
        <h3 className="text-lg font-semibold text-slate-100 mb-2">What shadow pattern are you exploring?</h3>
        <p className="text-sm text-slate-400 mb-4">Describe an unconscious pattern, disowned part, or internal conflict you want to integrate.</p>
        <textarea {...commonProps} placeholder="E.g., 'My tendency to people-please and lose my own voice' or 'The inner critic that sabotages my creativity'" className={`${commonProps.className} focus:ring-amber-500`} />
        <div className="bg-amber-900/30 border border-amber-700 rounded-md p-3 mb-4 text-xs"><p className="font-semibold text-amber-300">💡 Shadow Work Focus</p><p className="text-amber-200 mt-1">The best shadow practices help you notice what you're "subject to" and make it "object" for conscious work.</p></div>
      </>;
    } else if (module === 'spirit') {
       return <>
        <h3 className="text-lg font-semibold text-slate-100 mb-2">What state of consciousness are you cultivating?</h3>
        <p className="text-sm text-slate-400 mb-4">Describe the inner quality, presence, or spiritual state you want to develop.</p>
        <textarea {...commonProps} placeholder="E.g., 'Non-dual awareness and resting in the Witness' or 'Deep compassion and loving presence'" className={`${commonProps.className} focus:ring-purple-500`} />
        <div className="bg-purple-900/30 border border-purple-700 rounded-md p-3 mb-4 text-xs"><p className="font-semibold text-purple-300">✨ Contemplative Focus</p><p className="text-purple-200 mt-1">The best spirit practices are gateways to direct experience, not just intellectual understanding.</p></div>
      </>;
    } else {
       return <>
        <h3 className="text-lg font-semibold text-slate-100 mb-2">What do you want to accomplish?</h3>
        <p className="text-sm text-slate-400 mb-4">Be specific about the outcome or skill you're building.</p>
        <textarea {...commonProps} rows={3} placeholder="E.g., 'Build mental resilience through deliberate discomfort' or 'Improve my posture and reduce back pain'" className={`${commonProps.className} focus:ring-blue-500`} />
        {similarPractices.length > 0 && <div className="bg-blue-900/30 border border-blue-700 rounded-md p-3 mb-4 text-sm"><p className="font-semibold text-blue-300 mb-2 flex items-center gap-2"><AlertCircle size={16}/> Similar practices found:</p><ul className="text-blue-200 space-y-1 list-disc list-inside">{similarPractices.map((p, i) => <li key={i}>{p}</li>)}</ul><p className="text-xs text-blue-400 mt-2">Consider whether you want to customize one of these instead.</p></div>}
      </>;
    }
  };

    const renderResearchStep = () => {
    const ringColor = module === 'shadow' ? 'focus:ring-amber-500' : module === 'spirit' ? 'focus:ring-purple-500' : 'focus:ring-blue-500';
    return <>
        <h3 className="text-lg font-semibold text-slate-100 mb-4">{module === 'shadow' ? 'Understanding the Pattern' : module === 'spirit' ? 'Contemplative Foundation' : 'Research & Evidence'}</h3>
        <div className="bg-slate-900/50 p-3 rounded-md mb-4 border border-slate-700"><p className="text-xs text-slate-400 mb-2">{module === 'shadow' ? 'Your Pattern:' : module === 'spirit' ? 'Your Aspiration:' : 'Your Goal:'}</p><p className="text-sm text-slate-200 font-mono">{goal}</p></div>
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">{module === 'shadow' ? 'Where does this pattern come from?' : module === 'spirit' ? 'What contemplative tradition(s) does this draw from?' : 'Why is this valuable?'}</label>
                <textarea value={why} onChange={(e) => setWhy(e.target.value)} rows={3} className={`w-full text-sm bg-slate-700/50 border border-slate-600 rounded-md p-2 focus:outline-none focus:ring-2 ${ringColor}`} />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">{module === 'shadow' ? 'What wisdom traditions or psychological frameworks inform this?' : module === 'spirit' ? 'Key teachings or principles' : 'Evidence / Research'}</label>
                <textarea value={evidence} onChange={(e) => setEvidence(e.target.value)} rows={3} className={`w-full text-sm bg-slate-700/50 border border-slate-600 rounded-md p-2 focus:outline-none focus:ring-2 ${ringColor}`} />
            </div>
            {(module === 'body' || module === 'mind') && <div><label className="block text-sm font-medium text-slate-300 mb-2">ROI</label><select value={roi} onChange={(e) => setRoi(e.target.value as any)} className={`w-full text-sm bg-slate-700/50 border border-slate-600 rounded-md p-2 focus:outline-none focus:ring-2 ${ringColor}`}><option>HIGH</option><option>VERY HIGH</option><option>EXTREME</option></select></div>}
        </div>
        <button onClick={handleGenerateResearch} disabled={isLoading} className="w-full mt-4 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-600 text-white font-medium py-2 rounded-md transition flex items-center justify-center gap-2"><Sparkles size={16}/> {isLoading ? 'Generating...' : 'AI Help Me Articulate'}</button>
    </>;
  };
  
    const renderStructureStep = () => {
    const ringColor = module === 'shadow' ? 'focus:ring-amber-500' : module === 'spirit' ? 'focus:ring-purple-500' : 'focus:ring-blue-500';
    return <>
        <h3 className="text-lg font-semibold text-slate-100 mb-4">{module === 'shadow' ? 'Shadow Work Structure' : module === 'spirit' ? 'Contemplative Practice Structure' : 'Practice Structure'}</h3>
        <div className="space-y-4">
            <div><label className="block text-sm font-medium text-slate-300 mb-2">Practice Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className={`w-full text-sm bg-slate-700/50 border border-slate-600 rounded-md p-2 focus:outline-none focus:ring-2 ${ringColor}`} /></div>
            <div><label className="block text-sm font-medium text-slate-300 mb-2">1-line Description</label><input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={`w-full text-sm bg-slate-700/50 border border-slate-600 rounded-md p-2 focus:outline-none focus:ring-2 ${ringColor}`} /></div>
            <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-sm font-medium text-slate-300 mb-2">{module==='shadow'||module==='spirit' ? 'Duration (mins)' : 'Time/Week (hrs)'}</label><input type="number" value={module==='shadow'||module==='spirit' ? Math.round(timePerWeek * 60) : timePerWeek} onChange={(e) => setTimePerWeek(module==='shadow'||module==='spirit' ? parseInt(e.target.value)/60 : parseFloat(e.target.value))} step="0.25" min="0" className={`w-full text-sm bg-slate-700/50 border border-slate-600 rounded-md p-2 focus:outline-none focus:ring-2 ${ringColor}`} /></div>
                <div><label className="block text-sm font-medium text-slate-300 mb-2">Difficulty</label><select value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)} className={`w-full text-sm bg-slate-700/50 border border-slate-600 rounded-md p-2 focus:outline-none focus:ring-2 ${ringColor}`}><option>Low</option><option>Medium</option><option>High</option></select></div>
                <div><label className="block text-sm font-medium text-slate-300 mb-2">Module</label><select value={module} onChange={(e) => setModule(e.target.value as ModuleKey)} className={`w-full text-sm bg-slate-700/50 border border-slate-600 rounded-md p-2 focus:outline-none focus:ring-2 ${ringColor}`}>{Object.entries(modules).map(([key, info]) => <option key={key} value={key}>{info.name}</option>)}</select></div>
            </div>
            <div>
                <div className="flex justify-between items-center mb-2"><label className="block text-sm font-medium text-slate-300">{module==='shadow' ? 'Inquiry Questions' : module==='spirit' ? 'Stages/Movements' : 'How-to Steps'}</label><button onClick={handleAddHowStep} className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-2 py-1 rounded">+ Add</button></div>
                <div className="space-y-2">{howSteps.map((step, i) => <div key={i} className="flex gap-2 items-center"><span className="text-slate-500 font-mono">{module==='shadow' ? '?' : `${i+1}.`}</span><input type="text" value={step} onChange={(e) => handleUpdateHowStep(i, e.target.value)} className={`flex-1 text-sm bg-slate-700/50 border border-slate-600 rounded-md p-2 focus:outline-none focus:ring-2 ${ringColor}`} /><button onClick={() => handleRemoveHowStep(i)} className="text-red-400 hover:text-red-300">✕</button></div>)}</div>
            </div>
            <div><label className="block text-sm font-medium text-slate-300 mb-2">{module==='shadow' ? 'Psychological Systems' : module==='spirit' ? 'Consciousness Aspects' : 'Systems Affected'}</label><input type="text" value={affectsSystem.join(', ')} onChange={(e) => setAffectsSystem(e.target.value.split(',').map(s => s.trim()))} placeholder="E.g., reactivity, self-awareness, compassion (comma-separated)" className={`w-full text-sm bg-slate-700/50 border border-slate-600 rounded-md p-2 focus:outline-none focus:ring-2 ${ringColor}`} /></div>
        </div>
        <button onClick={handleGenerateStructure} disabled={isLoading} className="w-full mt-4 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-600 text-white font-medium py-2 rounded-md transition flex items-center justify-center gap-2"><Sparkles size={16}/> {isLoading ? 'Generating...' : 'AI Generate Structure'}</button>
    </>;
  };
  
  const renderRefineStep = () => (
    <>
      <h3 className="text-lg font-semibold text-slate-100 mb-4">Refine Your Practice</h3>
      <div className="bg-slate-900/50 p-3 rounded-md mb-4 border border-slate-700 max-h-32 overflow-y-auto"><p className="text-xs text-slate-400 mb-2">Practice Preview:</p><p className="text-sm text-slate-200 font-bold">{name || '(no name yet)'}</p><p className="text-xs text-slate-400 mt-1">{description || '(no description)'}</p></div>
      <textarea value={refinementNotes} onChange={(e) => setRefinementNotes(e.target.value)} placeholder="Add any refinement notes or changes..." rows={4} className="w-full text-sm bg-slate-700/50 border border-slate-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4" />
      <button onClick={handleGetRefinementSuggestions} disabled={isLoading} className="w-full bg-slate-700 hover:bg-slate-600 disabled:bg-slate-600 text-white font-medium py-2 rounded-md transition flex items-center justify-center gap-2 mb-4"><Sparkles size={16}/> {isLoading ? 'Generating...' : 'Get AI Suggestions'}</button>
      {aiSuggestions.length > 0 && <div className="bg-purple-900/30 border border-purple-700 rounded-md p-3 mb-4"><p className="text-sm text-purple-300 mb-2 font-medium">💡 Suggestions to improve:</p><div className="space-y-2">{aiSuggestions.map((suggestion, i) => <button key={i} onClick={() => handleApplySuggestion(suggestion)} className="w-full text-left text-xs bg-purple-800/50 hover:bg-purple-800 p-2 rounded border border-purple-600 text-purple-100 transition">{suggestion}</button>)}</div></div>}
    </>
  );

  const renderReviewStep = () => (
    <>
      <h3 className="text-lg font-semibold text-slate-100 mb-4">Review Your Practice</h3>
      <div className="space-y-3 text-sm max-h-96 overflow-y-auto bg-slate-900/40 p-4 rounded-md border border-slate-700">
        <div><p className="text-slate-400">Name</p><p className="text-slate-100 font-mono">{name}</p></div>
        <div><p className="text-slate-400">Description</p><p className="text-slate-100">{description}</p></div>
        <div><p className="text-slate-400">{module === 'shadow' ? 'Pattern Origin & Framework' : module === 'spirit' ? 'Tradition & Teachings' : 'Why'}</p><p className="text-slate-100">{why}</p></div>
        <div><p className="text-slate-400">{module === 'shadow' ? 'Frameworks' : module === 'spirit' ? 'Key Teachings' : 'Evidence'}</p><p className="text-slate-100">{evidence}</p></div>
        <div><p className="text-slate-400">{module === 'shadow' ? 'Inquiry Questions' : module === 'spirit' ? 'Stages / Movements' : 'How to Do It'}</p><ol className="text-slate-100 list-decimal list-inside space-y-1">{howSteps.map((step, i) => <li key={i}>{step}</li>)}</ol></div>
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-700"><div className="text-xs"><p className="text-slate-400">ROI</p><p className="text-slate-100 font-mono">{roi}</p></div><div className="text-xs"><p className="text-slate-400">Difficulty</p><p className="text-slate-100 font-mono">{difficulty}</p></div><div className="text-xs"><p className="text-slate-400">{module === 'shadow' || module === 'spirit' ? 'Duration' : 'Time/Week'}</p><p className="text-slate-100 font-mono">{module === 'shadow' || module === 'spirit' ? `${Math.round(timePerWeek * 60)} min` : `${timePerWeek}h`}</p></div><div className="text-xs"><p className="text-slate-400">Module</p><p className="text-slate-100 font-mono capitalize">{module}</p></div></div>
        <div><p className="text-slate-400">{module === 'shadow' ? 'Psychological Systems' : module === 'spirit' ? 'Consciousness Aspects' : 'Affects Systems'}</p><div className="flex flex-wrap gap-1 mt-1">{affectsSystem.map((sys, i) => <span key={i} className="bg-slate-700 text-slate-200 text-xs px-2 py-1 rounded">{sys}</span>)}</div></div>
        {refinementNotes && <div><p className="text-slate-400">Refinement Notes</p><p className="text-slate-100 text-xs whitespace-pre-wrap">{refinementNotes}</p></div>}
      </div>
    </>
  );

  const renderStep = () => {
    switch (step) {
      case 'MODULE': return renderModuleSelection();
      case 'GOAL': return renderGoalStep();
      case 'RESEARCH': return renderResearchStep();
      case 'STRUCTURE': return renderStructureStep();
      case 'REFINE': return renderRefineStep();
      case 'REVIEW': return renderReviewStep();
      default: return null;
    }
  };

  const STEPS: BuilderStep[] = ['MODULE', 'GOAL', 'RESEARCH', 'STRUCTURE', 'REFINE', 'REVIEW'];
  const currentStepIndex = STEPS.indexOf(step);
  const getStepLabel = () => `Step ${currentStepIndex + 1} of 6: ${step.replace('_', ' ')}`;
  const handleGoBack = () => currentStepIndex > 0 && setStep(STEPS[currentStepIndex - 1]);
  const handleNext = () => {
      switch(step) {
          case 'MODULE': setStep('GOAL'); break;
          case 'GOAL': handleGoalSubmit(); break;
          case 'RESEARCH': handleResearchNext(); break;
          case 'STRUCTURE': handleStructureNext(); break;
          case 'REFINE': handleRefineNext(); break;
          case 'REVIEW': handleSave(); break;
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in">
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <header className="p-4 border-b border-slate-700"><div className="flex justify-between items-start mb-3"><div><h2 className="text-2xl font-bold text-slate-50">Practice Builder</h2><p className="text-xs text-slate-400 mt-1">{getStepLabel()}</p></div><button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X size={24}/></button></div><div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden"><div className="bg-blue-500 h-full transition-all" style={{ width: `${((currentStepIndex + 1) / 6) * 100}%` }}/></div></header>
        <main className="p-6 flex-grow overflow-y-auto">{error && <p className="text-red-400 text-sm mb-4 bg-red-900/30 p-2 rounded-md">{error}</p>}{renderStep()}</main>
        <footer className="p-4 border-t border-slate-700 flex justify-between items-center">
          <button onClick={onClose} className="text-sm text-slate-400 hover:text-white transition">Close</button>
          <div className="flex gap-3">
            {step !== 'MODULE' && <button onClick={handleGoBack} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2"><ArrowLeft size={16}/> Back</button>}
            {step !== 'MODULE' && <button onClick={handleNext} disabled={isLoading || (step === 'GOAL' && !goal.trim()) || (step === 'RESEARCH' && (!why.trim() || !evidence.trim())) || (step === 'STRUCTURE' && (!name.trim() || !description.trim() || howSteps.length === 0 || howSteps.some(s => !s.trim())))} className={`${step === 'REVIEW' ? 'bg-green-600 hover:bg-green-700' : 'btn-luminous'} disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-medium flex items-center gap-2`}>{step === 'REVIEW' ? <><Save size={16}/> Save Practice</> : <>Next <ArrowRight size={16}/></>}</button>}
          </div>
        </footer>
      </div>
    </div>
  );
}
