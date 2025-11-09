import React from 'react';
import { Activity, CalendarRange } from 'lucide-react';
import { SectionDivider } from './SectionDivider.tsx';
import { IntegralBodyPlan, PlanHistoryEntry } from '../types.ts';

interface BodyToolsTabProps {
  setActiveWizard: (wizardName: string | null, linkedInsightId?: string) => void;
  integralBodyPlans?: IntegralBodyPlan[];
  planHistory?: PlanHistoryEntry[];
  onLogPlanFeedback?: (
    planId: string,
    dayDate: string,
    dayName: string,
    feedback: {
      completedWorkout: boolean;
      completedYinPractices: string[];
      intensityFelt: number;
      energyLevel: number;
      blockers?: string;
      notes?: string;
    }
  ) => void;
  getPlanProgress?: (planId: string) => PlanHistoryEntry | null;
  onUpdatePlanStatus?: (planId: string, status: 'active' | 'completed' | 'abandoned') => void;
}

const ToolCard = ({ icon, title, description, onStart }: { icon: React.ReactNode; title: string; description: string; onStart: () => void }) => (
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

export default function BodyToolsTab({ setActiveWizard }: BodyToolsTabProps) {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold font-mono text-slate-100 tracking-tighter">Body Tools</h1>
        <p className="text-slate-400 mt-2">Wizards and guided experiences for physical and energetic cultivation.</p>
      </header>

      <SectionDivider />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ToolCard
          icon={<CalendarRange size={28} className="text-accent" />}
          title="Integral Body Architect"
          description="Synthesize a 7-day plan that balances Yang programming (training, sleep, nutrition) with Yin cultivation (Qigong, breathing, subtle body work)."
          onStart={() => setActiveWizard('integral-body-architect')}
        />
        <ToolCard
          icon={<Activity size={28} className="text-teal-400" />}
          title="Somatic Practice Generator"
          description="Generate precise, spatially-aware guided practices like Qigong or Somatic Movement using an AI trained on human movement."
          onStart={() => setActiveWizard('somatic')}
        />
      </div>
    </div>
  );
}
