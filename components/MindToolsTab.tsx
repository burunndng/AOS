import React from 'react';
import { BrainCircuit, GitCompareArrows, Layers, Shuffle } from 'lucide-react'; // Removed Activity
import { SectionDivider } from './SectionDivider.tsx';
import { ActiveTab } from '../types.ts';

interface MindToolsTabProps {
  setActiveWizard: (wizardName: string | null, linkedInsightId?: string) => void;
}

const ToolCard = ({ icon, title, description, onStart }: { icon: React.ReactNode, title: string, description: string, onStart: () => void }) => (
    <div className="bg-slate-800/50 border border-slate-700/80 rounded-lg p-6 flex flex-col">
        <div className="flex items-center gap-4 mb-3">
            {icon}
            <h2 className="text-2xl font-bold tracking-tight text-slate-100">{title}</h2>
        </div>
        <p className="text-slate-400 mb-5 flex-grow">{description}</p>
        <button onClick={onStart} className="btn-luminous px-4 py-2 rounded-md font-medium transition text-sm self-start">
            Start New Session
        </button>
    </div>
);

export default function MindToolsTab({ setActiveWizard }: MindToolsTabProps) {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold font-mono text-slate-100 tracking-tighter">Mind Tools</h1>
        <p className="text-slate-400 mt-2">Wizards to train metacognition, reveal blind spots, and accelerate your cognitive development.</p>
      </header>
      
      <SectionDivider />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ToolCard 
          icon={<BrainCircuit size={28} className="text-blue-400"/>}
          title="Bias Detective"
          description="Uncover the unconscious cognitive biases that shape your decisions and learn to think with greater clarity."
          onStart={() => setActiveWizard('bias')}
        />
        <ToolCard 
          icon={<Layers size={28} className="text-purple-400"/>}
          title="Subject-Object Explorer"
          description="A guided process to make unconscious patterns visible, moving them from 'subject' (what runs you) to 'object' (what you can see)."
          onStart={() => setActiveWizard('so')}
        />
        <ToolCard 
          icon={<GitCompareArrows size={28} className="text-orange-400"/>}
          title="Perspective Shifter"
          description="Dissolve stuck situations and conflicts by systematically adopting 1st, 2nd, 3rd, and Witness perspectives."
          onStart={() => setActiveWizard('ps')}
        />
        <ToolCard 
          icon={<Shuffle size={28} className="text-green-400"/>}
          title="Polarity Mapper"
          description="Reframe 'either/or' problems into 'both/and' polarities, developing the capacity to manage complex tensions productively."
          onStart={() => setActiveWizard('pm')}
        />
      </div>
    </div>
  );
}