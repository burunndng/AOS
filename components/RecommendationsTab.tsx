import React from 'react';
// FIX: Add file extension to import path.
import { StarterStack } from '../types.ts';
import { Sparkles, CheckCircle } from 'lucide-react';
import { SectionDivider } from './SectionDivider.tsx';

interface RecommendationsTabProps {
  starterStacks: Record<string, StarterStack>;
  applyStarterStack: (practiceIds: string[]) => void;
  recommendations: string[];
  isLoading: boolean;
  error: string | null;
  onGenerate: () => void;
}

export default function RecommendationsTab({
  starterStacks,
  applyStarterStack,
  recommendations,
  isLoading,
  error,
  onGenerate
}: RecommendationsTabProps) {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold font-mono text-slate-100 tracking-tighter">Recommendations</h1>
        <p className="text-slate-400 mt-2">Get suggestions for your practice stack, from starter kits to personalized AI insights.</p>
      </header>

      {/* AI Recommendations Section */}
      <section className="bg-slate-800/50 border border-slate-700/80 rounded-lg p-6">
        <h2 className="text-3xl font-bold tracking-tight text-slate-100 mb-2 flex items-center gap-3"><Sparkles className="text-accent"/> Personalized AI Recommendations</h2>
        <p className="text-slate-400 mb-4">Aura can analyze your current stack, notes, and progress to suggest your next best steps.</p>
        <button
          onClick={onGenerate}
          disabled={isLoading}
          className="btn-luminous font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles size={16} /> Generate My Recommendations
            </>
          )}
        </button>

        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

        {recommendations.length > 0 && (
          <div className="mt-6 border-t border-slate-700 pt-4">
            <h3 className="font-semibold text-lg font-mono text-slate-200">Here are your recommendations:</h3>
            <ul className="mt-3 space-y-2 list-disc list-inside text-slate-300">
              {recommendations.map((rec, index) => (
                <li key={index} className="pl-2">{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <SectionDivider />

      {/* Starter Stacks Section */}
      <section>
        <h2 className="text-3xl font-bold tracking-tight text-slate-100 mb-4">Starter Stacks</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.values(starterStacks).map(stack => (
            <div key={stack.name} className="bg-slate-800/50 border border-slate-800 rounded-lg p-5 flex flex-col card-luminous-hover">
              <h3 className="text-xl font-bold font-mono text-slate-100">{stack.name}</h3>
              <p className="text-sm text-slate-400 mt-1">{stack.description}</p>
              <p className="text-xs text-slate-500 mt-2">Difficulty: {stack.difficulty}</p>
              <div className="mt-4 border-t border-slate-700/50 pt-3">
                <p className="text-sm font-semibold text-slate-300 mb-2">Includes:</p>
                <ul className="space-y-1">
                  {stack.practices.map(pId => (
                     <li key={pId} className="text-xs text-slate-400 flex items-center gap-2">
                        <CheckCircle size={14} className="text-green-500"/> {pId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                     </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => applyStarterStack(stack.practices)}
                className="mt-5 bg-slate-700/80 hover:bg-slate-700 text-slate-200 text-sm font-medium py-2 px-3 rounded-md transition"
              >
                Apply this Stack
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}