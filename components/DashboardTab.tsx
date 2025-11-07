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

  const getToolCategory = (toolType: string): { name: string; color: string } => {
    const mindTools = ['Bias Detective', 'Subject-Object Explorer', 'Perspective-Shifter', 'Polarity Mapper', 'Kegan Assessment', 'Role Alignment'];
    const shadowTools = ['Relational Pattern'];
    const bodyTools = ['Somatic Practice'];
    const spiritTools = ['Jhana Guide', 'Meditation Finder', 'Consciousness Graph'];

    if (mindTools.includes(toolType)) return { name: 'Mind', color: 'text-blue-400 bg-blue-900/30 border-blue-700/50' };
    if (shadowTools.includes(toolType)) return { name: 'Shadow', color: 'text-amber-400 bg-amber-900/30 border-amber-700/50' };
    if (bodyTools.includes(toolType)) return { name: 'Body', color: 'text-teal-400 bg-teal-900/30 border-teal-700/50' };
    if (spiritTools.includes(toolType)) return { name: 'Spirit', color: 'text-purple-400 bg-purple-900/30 border-purple-700/50' };
    return { name: 'Other', color: 'text-slate-400 bg-slate-800/30 border-slate-700/50' };
  };

  const handleStartShadowWork = (insightId: string, practiceId: string) => {
    let wizardName: string | null = null;
    let shadowToolType: string = '';

    // Map practiceId to wizard name and human-readable tool type
    switch (practiceId) {
        // Shadow Tools
        case 'three-two-one':
            wizardName = '321';
            shadowToolType = '3-2-1 Process';
            break;
        case 'parts-dialogue':
            wizardName = 'ifs';
            shadowToolType = 'Internal Family Systems';
            break;
        case 'relational-pattern':
            wizardName = 'relational';
            shadowToolType = 'Relational Pattern Tracker';
            break;
        // Mind Tools
        case 'bias-detective':
            wizardName = 'bias';
            shadowToolType = 'Bias Detective';
            break;
        case 'subject-object':
            wizardName = 'so';
            shadowToolType = 'Subject-Object Explorer';
            break;
        case 'perspective-shifter':
            wizardName = 'ps';
            shadowToolType = 'Perspective Shifter';
            break;
        case 'polarity-mapper':
            wizardName = 'pm';
            shadowToolType = 'Polarity Mapper';
            break;
        case 'kegan-assessment':
            wizardName = 'kegan';
            shadowToolType = 'Kegan Stage Assessment';
            break;
        case 'role-alignment':
            wizardName = 'role-alignment';
            shadowToolType = 'Role Alignment Wizard';
            break;
        // Body Tools
        case 'somatic-generator':
            wizardName = 'somatic';
            shadowToolType = 'Somatic Practice Generator';
            break;
        // Spirit Tools
        case 'jhana-tracker':
            wizardName = 'jhana';
            shadowToolType = 'Jhana/Samadhi Guide';
            break;
        case 'meditation-finder':
            wizardName = 'meditation';
            shadowToolType = 'Meditation Practice Finder';
            break;
        case 'consciousness-graph':
            wizardName = 'consciousness-graph';
            shadowToolType = 'Interactive Consciousness Graph';
            break;
        default:
            alert(`Practice "${practiceId}" is not yet linked to a wizard. Please check the tool tabs.`);
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
            <section className="mt-16 w-full max-w-4xl mx-auto text-left animate-fade-in-up" style={{ animationDelay: '600ms' }}>
                <h2 className="text-3xl font-bold font-mono text-slate-100 tracking-tight mb-2 text-center">Integrated Insights</h2>
                <p className="text-slate-400 text-center mb-6">Cross-tool pattern detection and personalized practice recommendations</p>

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 border border-amber-700/50 rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-amber-300">{pendingInsights.length}</div>
                        <div className="text-xs text-slate-400 mt-1">Pending Connections</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-700/50 rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-green-300">{addressedInsights.length}</div>
                        <div className="text-xs text-slate-400 mt-1">Completed Integrations</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border border-blue-700/50 rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-blue-300">{integratedInsights.length}</div>
                        <div className="text-xs text-slate-400 mt-1">Total Insights</div>
                    </div>
                </div>
                
                {pendingInsights.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-xl font-semibold text-amber-300 mb-4 flex items-center gap-2">
                            <Lightbulb size={20} className="text-amber-400"/> Pending Shadow Work Connections ({pendingInsights.length})
                        </h3>
                        <div className="space-y-4">
                            {pendingInsights.map(insight => {
                                const category = getToolCategory(insight.mindToolType);
                                return (
                                <div key={insight.id} className="bg-slate-800/50 border border-amber-700/50 rounded-lg p-4 shadow-md">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`text-xs px-2 py-1 rounded-full border font-semibold ${category.color}`}>
                                            {category.name}
                                        </span>
                                        <p className="text-xs text-slate-500">{new Date(insight.dateCreated).toLocaleDateString()} • {insight.mindToolType}</p>
                                    </div>
                                    <h4 className="text-lg font-semibold text-slate-200">{insight.mindToolName}</h4>
                                    <p className="text-slate-400 text-sm mt-2">{insight.mindToolShortSummary}</p>
                                    <div className="mt-4 bg-slate-900/50 border border-slate-700 rounded-md p-3">
                                        <p className="font-semibold text-slate-300 flex items-center gap-2"><BrainCircuit size={16} className="text-blue-400"/> Detected Pattern:</p>
                                        <p className="text-sm text-slate-200 mt-1">{insight.detectedPattern}</p>
                                    </div>
                                    {insight.suggestedShadowWork && insight.suggestedShadowWork.length > 0 && (
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
                                    )}
                                    {insight.suggestedNextSteps && insight.suggestedNextSteps.length > 0 && (
                                        <div className="mt-4">
                                            <p className="font-semibold text-slate-300 flex items-center gap-2"><Target size={16} className="text-green-400"/> Suggested Next Steps:</p>
                                            <ul className="mt-2 space-y-2">
                                                {insight.suggestedNextSteps.map((step, idx) => (
                                                    <li key={idx} className="bg-slate-700/50 rounded-md p-3 flex justify-between items-center">
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-200">{step.practiceName}</p>
                                                            <p className="text-xs text-slate-400">{step.rationale}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleStartShadowWork(insight.id, step.practiceId)}
                                                            className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1 rounded-md transition flex items-center gap-1"
                                                        >
                                                            <Sparkles size={14} /> Start
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {addressedInsights.length > 0 && (
                    <div>
                        <h3 className="text-xl font-semibold text-green-400 mb-4 flex items-center gap-2">
                            <CheckCircle size={20} className="text-green-500"/> Addressed Insights ({addressedInsights.length})
                        </h3>
                        <div className="space-y-4">
                            {addressedInsights.map(insight => {
                                const category = getToolCategory(insight.mindToolType);
                                return (
                                <div key={insight.id} className="bg-slate-800/50 border border-green-700/50 rounded-lg p-4 opacity-70">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`text-xs px-2 py-1 rounded-full border font-semibold ${category.color}`}>
                                            {category.name}
                                        </span>
                                        <p className="text-xs text-slate-500">{new Date(insight.dateCreated).toLocaleDateString()} • {insight.mindToolType}</p>
                                    </div>
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
                                );
                            })}
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