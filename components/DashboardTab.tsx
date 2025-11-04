// FIX: Removed erroneous file separator from the beginning of the file content.
import React from 'react';
import { Sparkles, Search, GitMerge, Users, BrainCircuit, Target, Layers, GitCompareArrows, CheckCircle, Lightbulb } from 'lucide-react'; // NEW: Import more icons
import { ActiveTab, IntegratedInsight } from '../types.ts'; // NEW: Import IntegratedInsight
import { MerkabaIcon } from './MerkabaIcon.tsx';


interface DashboardTabProps {
  openGuidedPracticeGenerator: () => void;
  setActiveTab: (tab: ActiveTab) => void;
  integratedInsights: IntegratedInsight[]; // NEW prop
  markInsightAsAddressed: (insightId: string, shadowToolType: string, shadowSessionId: string) => void; // NEW prop
  setActiveWizard: (wizardName: string | null, linkedInsightId?: string) => void; // NEW prop for directly opening wizards
}

export default function DashboardTab({ openGuidedPracticeGenerator, setActiveTab, integratedInsights, markInsightAsAddressed, setActiveWizard }: DashboardTabProps) {

  const handleStartShadowWork = (insightId: string, practiceId: string) => {
    let wizardName: string | null = null;
    let shadowToolType: string = '';

    // Map practiceId to wizard name and human-readable tool type
    switch (practiceId) {
        case 'three-two-one':
            wizardName = '321';
            shadowToolType = '3-2-1 Process';
            break;
        case 'parts-dialogue': // Assuming 'parts-dialogue' maps to IFS wizard
            wizardName = 'ifs';
            shadowToolType = 'Internal Family Systems';
            break;
        // Add more mappings for other shadow tools as they are implemented
        default:
            alert("This shadow work practice does not have a guided wizard yet. Please consult the 'Shadow Tools' tab.");
            return;
    }
    
    setActiveWizard(wizardName, insightId); // Pass linkedInsightId
  };

  const pendingInsights = integratedInsights.filter(insight => insight.status === 'pending');
  const addressedInsights = integratedInsights.filter(insight => insight.status === 'addressed');

  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center overflow-hidden">
      {/* FIX: Remove 'size' prop as width/height are controlled by Tailwind classes for full container fill. */}
      <MerkabaIcon className="absolute inset-0 w-full h-full text-slate-800/50 opacity-10" style={{ transform: 'scale(2.5)' }}/>
      <div className="relative z-10">
        <header className="mb-8 animate-fade-in">
          <h1 className="text-5xl font-bold font-mono text-slate-100 tracking-tighter">Welcome to Aura OS</h1>
          <p className="text-slate-400 mt-2 max-w-lg">Your operating system for personal transformation. Begin your journey by exploring practices or generating a custom one.</p>
        </header>
        
        <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          {/* FIX: Use the 'size' prop for MerkabaIcon instead of Tailwind 'w-x h-y' classes for consistent sizing control. 'w-48' translates to 12rem or 192px. */}
          <MerkabaIcon size={192} className="text-accent mx-auto" />
        </div>

        <div className="mt-12 flex flex-col sm:flex-row gap-4 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <button 
            onClick={openGuidedPracticeGenerator} 
            className="btn-luminous font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 shadow-lg"
          >
            <Sparkles size={20} />
            Generate a Practice
          </button>
          <button 
            onClick={() => setActiveTab('browse')} 
            className="bg-slate-700/80 hover:bg-slate-700 text-slate-100 font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition transform hover:scale-105 shadow-lg"
          >
            <Search size={20} />
            Browse Practices
          </button>
        </div>

        {/* --- NEW: Integrated Insights Section --- */}
        {(pendingInsights.length > 0 || addressedInsights.length > 0) && (
            <section className="mt-16 w-full max-w-3xl mx-auto text-left animate-fade-in-up" style={{ animationDelay: '600ms' }}>
                <h2 className="text-3xl font-bold font-mono text-slate-100 tracking-tight mb-6 text-center">Integrated Insights</h2>
                
                {pendingInsights.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-xl font-semibold text-amber-300 mb-4 flex items-center gap-2">
                            <Lightbulb size={20} className="text-amber-400"/> Pending Shadow Work Connections ({pendingInsights.length})
                        </h3>
                        <div className="space-y-4">
                            {pendingInsights.map(insight => (
                                <div key={insight.id} className="bg-slate-800/50 border border-amber-700/50 rounded-lg p-4 shadow-md">
                                    <p className="text-xs text-slate-500 mb-1">{new Date(insight.dateCreated).toLocaleDateString()} • {insight.mindToolType}</p>
                                    <h4 className="text-lg font-semibold text-slate-200">{insight.mindToolName}</h4>
                                    <p className="text-slate-400 text-sm mt-2">{insight.mindToolShortSummary}</p>
                                    <div className="mt-4 bg-slate-900/50 border border-slate-700 rounded-md p-3">
                                        <p className="font-semibold text-slate-300 flex items-center gap-2"><BrainCircuit size={16} className="text-blue-400"/> Detected Pattern:</p>
                                        <p className="text-sm text-slate-200 mt-1">{insight.detectedPattern}</p>
                                    </div>
                                    <div className="mt-4">
                                        <p className="font-semibold text-slate-300 flex items-center gap-2"><GitMerge size={16} className="text-amber-400"/> Suggested Shadow Work:</p>
                                        <ul className="mt-2 space-y-2">
                                            {insight.suggestedShadowWork.map((sw, idx) => (
                                                <li key={idx} className="bg-slate-700/50 rounded-md p-3 flex justify-between items-center">
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-200">{sw.practiceName}</p>
                                                        <p className="text-xs text-slate-400">{sw.rationale}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleStartShadowWork(insight.id, sw.practiceId)}
                                                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium px-3 py-1 rounded-md transition flex items-center gap-1"
                                                    >
                                                        <Sparkles size={14} /> Start
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {addressedInsights.length > 0 && (
                    <div>
                        <h3 className="text-xl font-semibold text-green-400 mb-4 flex items-center gap-2">
                            <CheckCircle size={20} className="text-green-500"/> Addressed Insights ({addressedInsights.length})
                        </h3>
                        <div className="space-y-4">
                            {addressedInsights.map(insight => (
                                <div key={insight.id} className="bg-slate-800/50 border border-green-700/50 rounded-lg p-4 opacity-70">
                                    <p className="text-xs text-slate-500 mb-1">{new Date(insight.dateCreated).toLocaleDateString()} • {insight.mindToolType}</p>
                                    <h4 className="text-lg font-semibold text-slate-200">{insight.mindToolName}</h4>
                                    <p className="text-slate-400 text-sm mt-2">{insight.detectedPattern}</p>
                                    <div className="mt-4">
                                        <p className="font-semibold text-slate-300 flex items-center gap-2"><CheckCircle size={16} className="text-green-500"/> Addressed with:</p>
                                        <ul className="mt-2 space-y-1 text-sm text-slate-300">
                                            {insight.shadowWorkSessionsAddressed?.map((sw, idx) => (
                                                <li key={idx}>{sw.shadowToolType} on {new Date(sw.dateCompleted).toLocaleDateString()}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </section>
        )}
        {/* --- END NEW: Integrated Insights Section --- */}
      </div>
    </div>
  );
}