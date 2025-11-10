import React from 'react';
import { Activity, CalendarRange, Download, Eye } from 'lucide-react';
import { SectionDivider } from './SectionDivider.tsx';
import { IntegralBodyPlan, PlanHistoryEntry, WorkoutProgram } from '../types.ts';

interface BodyToolsTabProps {
  setActiveWizard: (wizardName: string | null, linkedInsightId?: string) => void;
  integralBodyPlans?: IntegralBodyPlan[];
  planHistory?: PlanHistoryEntry[];
  workoutPrograms?: WorkoutProgram[];
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

export default function BodyToolsTab({ setActiveWizard, workoutPrograms = [] }: BodyToolsTabProps) {
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
          title="Dynamic Workout Architect"
          description="Generate personalized, adaptive workout programs tailored to your goals, equipment, experience level, and somatic awareness."
          onStart={() => setActiveWizard('dynamic-workout-architect')}
        />
        <ToolCard
          icon={<Activity size={28} className="text-teal-400" />}
          title="Somatic Practice Generator"
          description="Generate precise, spatially-aware guided practices like Qigong or Somatic Movement using an AI trained on human movement."
          onStart={() => setActiveWizard('somatic')}
        />
      </div>

      {workoutPrograms.length > 0 && (
        <>
          <SectionDivider />

          <section>
            <h2 className="text-2xl font-bold font-mono text-slate-100 mb-4">Saved Workouts</h2>
            <p className="text-slate-400 mb-6">Your generated workout programs are saved here for easy access and reuse.</p>

            <div className="grid grid-cols-1 gap-4">
              {workoutPrograms.map((program) => (
                <div key={program.id} className="bg-slate-800/50 border border-slate-700/80 rounded-lg p-4 hover:border-slate-600/80 transition">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-grow">
                      <h3 className="font-semibold text-slate-100">{program.goal || 'Untitled Workout'}</h3>
                      <p className="text-sm text-slate-400 mt-1">
                        {program.intensity && `${program.intensity.charAt(0).toUpperCase() + program.intensity.slice(1)} intensity`}
                        {program.duration && ` • ${program.duration} min`}
                        {program.focusAreas && program.focusAreas.length > 0 && ` • ${program.focusAreas.join(', ')}`}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        Created {new Date(program.createdAt || '').toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        // Could expand to view full details
                        const textContent = `
${program.goal || 'Workout Program'}

Focus: ${program.focusAreas?.join(', ') || 'N/A'}
Intensity: ${program.intensity || 'N/A'}
Duration: ${program.duration} minutes
Experience Level: ${program.experienceLevel || 'N/A'}

${program.workoutSessions?.map(s => `${s.name}\n${s.exercises?.map(e => `- ${e.name}`).join('\n')}`).join('\n\n') || 'No sessions'}
                        `;
                        downloadAsText(textContent, `Workout-${program.id}`);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-md font-medium text-sm transition whitespace-nowrap"
                    >
                      <Download size={16} />
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

// Helper function to download text
const downloadAsText = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
