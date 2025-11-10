import React, { useState } from 'react';
import { Activity, CalendarRange, FileText, ChevronDown, ChevronUp, Calendar, Dumbbell, Download } from 'lucide-react';
import { SectionDivider } from './SectionDivider.tsx';
import { IntegralBodyPlan, PlanHistoryEntry, WorkoutProgram } from '../types.ts';
import { formatIntegralBodyPlanAsText, formatWorkoutProgramAsText, downloadAsFile } from '../services/planExportUtils.ts';

interface BodyToolsTabProps {
  setActiveWizard: (wizardName: string | null, linkedInsightId?: string) => void;
  integralBodyPlans?: IntegralBodyPlan[];
  workoutPrograms?: WorkoutProgram[];
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

export default function BodyToolsTab({
  setActiveWizard,
  integralBodyPlans = [],
  workoutPrograms = []
}: BodyToolsTabProps) {
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);

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

      {/* Saved Reports Section */}
      {(integralBodyPlans.length > 0 || workoutPrograms.length > 0) && (
        <>
          <SectionDivider />
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-100">Your Saved Reports</h2>

            {/* Integral Body Plans */}
            {integralBodyPlans.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
                  <CalendarRange size={20} className="text-accent" />
                  Integral Body Plans ({integralBodyPlans.length})
                </h3>
                <div className="space-y-3">
                  {integralBodyPlans.map((plan) => (
                    <PlanReportCard
                      key={plan.id}
                      plan={plan}
                      isExpanded={expandedPlan === plan.id}
                      onToggle={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Workout Programs */}
            {workoutPrograms.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
                  <Dumbbell size={20} className="text-teal-400" />
                  Workout Programs ({workoutPrograms.length})
                </h3>
                <div className="space-y-3">
                  {workoutPrograms.map((program) => (
                    <WorkoutReportCard
                      key={program.id}
                      program={program}
                      isExpanded={expandedWorkout === program.id}
                      onToggle={() => setExpandedWorkout(expandedWorkout === program.id ? null : program.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

// Plan Report Card Component
function PlanReportCard({
  plan,
  isExpanded,
  onToggle
}: {
  plan: IntegralBodyPlan;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/80 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-start justify-between hover:bg-slate-800/70 transition text-left"
      >
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Calendar size={18} className="text-accent" />
            <h4 className="text-lg font-semibold text-slate-100">{plan.goalStatement}</h4>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-slate-400">
            <span>📅 Week of {new Date(plan.weekStartDate).toLocaleDateString()}</span>
            <span>🏋️ {plan.dailyTargets.workoutDays}x workouts</span>
            <span>🧘 {plan.dailyTargets.yinPracticeMinutes}min Yin daily</span>
            <span>💪 {plan.dailyTargets.proteinGrams}g protein target</span>
          </div>
        </div>
        {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
      </button>

      {isExpanded && (
        <div className="border-t border-slate-700 p-4 bg-slate-900/30 space-y-4">
          {/* Export Buttons */}
          <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-700">
            <button
              onClick={(e) => {
                e.stopPropagation();
                const textContent = formatIntegralBodyPlanAsText(plan);
                downloadAsFile(textContent, `Integral-Body-Plan-${new Date().toISOString().split('T')[0]}`, 'txt');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-md font-medium transition-colors text-sm"
            >
              <FileText size={16} />
              Download as TXT
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const textContent = formatIntegralBodyPlanAsText(plan);
                downloadAsFile(textContent, `Integral-Body-Plan-${new Date().toISOString().split('T')[0]}`, 'pdf');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-md font-medium transition-colors text-sm"
            >
              <Download size={16} />
              Download as PDF
            </button>
          </div>

          <div>
            <h5 className="font-semibold text-slate-200 mb-2">Week Summary</h5>
            <p className="text-slate-300 text-sm">{plan.weekSummary}</p>
          </div>

          <div>
            <h5 className="font-semibold text-slate-200 mb-2">Daily Schedule</h5>
            <div className="space-y-2">
              {plan.days.map((day, idx) => (
                <div key={idx} className="bg-slate-800/50 rounded p-3">
                  <h6 className="font-medium text-slate-100 mb-1">{day.dayName}</h6>
                  <p className="text-xs text-slate-400">{day.summary}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {day.workout && (
                      <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                        💪 {day.workout.name}
                      </span>
                    )}
                    {day.yinPractices.map((practice, pIdx) => (
                      <span key={pIdx} className="bg-teal-500/20 text-teal-300 px-2 py-1 rounded">
                        🧘 {practice.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {plan.shoppingList && plan.shoppingList.length > 0 && (
            <div>
              <h5 className="font-semibold text-slate-200 mb-2">Shopping List</h5>
              <div className="bg-slate-800/50 rounded p-3">
                <ul className="text-sm text-slate-300 space-y-1">
                  {plan.shoppingList.slice(0, 5).map((item, idx) => (
                    <li key={idx}>• {item}</li>
                  ))}
                  {plan.shoppingList.length > 5 && (
                    <li className="text-slate-500">... and {plan.shoppingList.length - 5} more items</li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Workout Report Card Component
function WorkoutReportCard({
  program,
  isExpanded,
  onToggle
}: {
  program: WorkoutProgram;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/80 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-start justify-between hover:bg-slate-800/70 transition text-left"
      >
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Dumbbell size={18} className="text-teal-400" />
            <h4 className="text-lg font-semibold text-slate-100">{program.title}</h4>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-slate-400">
            <span>📅 {new Date(program.date).toLocaleDateString()}</span>
            <span>💪 {program.workouts.length} workout{program.workouts.length > 1 ? 's' : ''}</span>
          </div>
        </div>
        {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
      </button>

      {isExpanded && (
        <div className="border-t border-slate-700 p-4 bg-slate-900/30 space-y-4">
          {/* Export Buttons */}
          <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-700">
            <button
              onClick={(e) => {
                e.stopPropagation();
                const textContent = formatWorkoutProgramAsText(program);
                downloadAsFile(textContent, `Dynamic-Workout-${new Date().toISOString().split('T')[0]}`, 'txt');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-md font-medium transition-colors text-sm"
            >
              <FileText size={16} />
              Download as TXT
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const textContent = formatWorkoutProgramAsText(program);
                downloadAsFile(textContent, `Dynamic-Workout-${new Date().toISOString().split('T')[0]}`, 'pdf');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-md font-medium transition-colors text-sm"
            >
              <Download size={16} />
              Download as PDF
            </button>
          </div>

          <div>
            <h5 className="font-semibold text-slate-200 mb-2">Program Summary</h5>
            <p className="text-slate-300 text-sm">{program.summary}</p>
          </div>

          {program.personalizationNotes && (
            <div>
              <h5 className="font-semibold text-slate-200 mb-2">Personalization Notes</h5>
              <p className="text-slate-300 text-sm">{program.personalizationNotes}</p>
            </div>
          )}

          <div>
            <h5 className="font-semibold text-slate-200 mb-2">Workouts</h5>
            <div className="space-y-2">
              {program.workouts.map((workout, idx) => (
                <div key={idx} className="bg-slate-800/50 rounded p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <h6 className="font-medium text-slate-100">{workout.name}</h6>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      workout.intensity === 'light' ? 'bg-blue-500/20 text-blue-300' :
                      workout.intensity === 'moderate' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-red-500/20 text-red-300'
                    }`}>
                      {workout.intensity}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 space-y-1">
                    <p>⏱️ {workout.duration}min • 🎯 {workout.muscleGroupsFocused.join(', ')}</p>
                    <p>📝 {workout.exercises.length} exercises</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {program.progressionRecommendations && program.progressionRecommendations.length > 0 && (
            <div>
              <h5 className="font-semibold text-slate-200 mb-2">Progression Tips</h5>
              <div className="bg-slate-800/50 rounded p-3">
                <ul className="text-sm text-slate-300 space-y-1">
                  {program.progressionRecommendations.map((rec, idx) => (
                    <li key={idx}>→ {rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
