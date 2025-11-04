import React, { useState } from 'react';
// FIX: Correct import path for types.
import { BiasDetectiveSession, SubjectObjectSession, PerspectiveShifterSession, PolarityMap } from '../types.ts';
import { ChevronDown, ChevronUp, BrainCircuit, Target, Layers, GitCompareArrows } from 'lucide-react';
import { SectionDivider } from './SectionDivider.tsx';

interface MindToolsTabProps {
  onStartBiasDetective: () => void;
  sessionHistoryBias: BiasDetectiveSession[];
  draftBiasSession: BiasDetectiveSession | null;
  
  onStartSubjectObject: () => void;
  sessionHistorySO: SubjectObjectSession[];
  draftSOSession: SubjectObjectSession | null;

  onStartPerspectiveShifter: () => void;
  sessionHistoryPS: PerspectiveShifterSession[];
  draftPSSession: PerspectiveShifterSession | null;

  onStartPolarityMapper: () => void;
  polarityMapHistory: PolarityMap[];
  draftPolarityMap: Partial<PolarityMap> | null;
}

const ToolCard = ({ icon, title, description, onStart, onResume, hasDraft }: { icon: React.ReactNode, title: string, description: string, onStart: () => void, onResume: () => void, hasDraft: boolean }) => (
    <div className="bg-slate-800/50 border border-slate-700/80 rounded-lg p-6 flex flex-col">
        <div className="flex items-center gap-4 mb-3">
            {icon}
            <h2 className="text-2xl font-bold tracking-tight text-slate-100">{title}</h2>
        </div>
        <p className="text-slate-400 mb-5 flex-grow">{description}</p>
        <div className="flex gap-4">
          <button onClick={onStart} className="btn-luminous px-4 py-2 rounded-md font-medium transition text-sm">
            Start New
          </button>
          {hasDraft && (
            <button onClick={onResume} className="bg-slate-600/80 hover:bg-slate-700 text-white px-4 py-2 rounded-md font-medium transition text-sm">
              Resume Draft
            </button>
          )}
        </div>
    </div>
);


export default function MindToolsTab({ 
  onStartBiasDetective, sessionHistoryBias, draftBiasSession,
  onStartSubjectObject, sessionHistorySO, draftSOSession,
  onStartPerspectiveShifter, sessionHistoryPS, draftPSSession,
  onStartPolarityMapper, polarityMapHistory, draftPolarityMap
}: MindToolsTabProps) {
  const [expandedBias, setExpandedBias] = useState<string | null>(null);
  const [expandedSO, setExpandedSO] = useState<string | null>(null);
  const [expandedPS, setExpandedPS] = useState<string | null>(null);
  const [expandedPolarity, setExpandedPolarity] = useState<string | null>(null);

  return (
    <div className="space-y-8">
       <header>
        <h1 className="text-4xl font-bold font-mono text-slate-100 tracking-tighter">Mind Tools</h1>
        <p className="text-slate-400 mt-2">Advanced wizards to explore cognitive biases, developmental patterns, and perspective-taking.</p>
      </header>
      
      <SectionDivider />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ToolCard 
          icon={<BrainCircuit size={28} className="text-blue-400"/>}
          title="Bias Detective"
          description="Uncover the hidden biases in your thinking and decision-making processes."
          onStart={onStartBiasDetective}
          onResume={onStartBiasDetective}
          hasDraft={!!draftBiasSession}
        />
        <ToolCard 
          icon={<Target size={28} className="text-purple-400"/>}
          title="Subject-Object Explorer"
          description="Make unconscious patterns visible and workable, unlocking vertical development."
          onStart={onStartSubjectObject}
          onResume={onStartSubjectObject}
          hasDraft={!!draftSOSession}
        />
        <ToolCard 
          icon={<Layers size={28} className="text-orange-400"/>}
          title="Perspective-Shifter"
          description="Get unstuck from conflict and confusion by systematically exploring multiple viewpoints."
          onStart={onStartPerspectiveShifter}
          onResume={onStartPerspectiveShifter}
          hasDraft={!!draftPSSession}
        />
        <ToolCard 
          icon={<GitCompareArrows size={28} className="text-green-400"/>}
          title="Polarity Mapper"
          description="Reframe 'either/or' problems into 'both/and' polarities to manage tension productively."
          onStart={onStartPolarityMapper}
          onResume={onStartPolarityMapper}
          hasDraft={!!draftPolarityMap && Object.keys(draftPolarityMap).length > 0}
        />
      </div>

    </div>
  );
}