
import React, { useState } from 'react';
import { AllPractice, ModuleKey } from '../types.ts';
import { modules } from '../constants.ts';
import { Check, Edit, ChevronDown, ChevronUp } from 'lucide-react';

interface PracticeTrackerItemProps {
  practice: AllPractice;
  isComplete: boolean;
  onToggle: () => void;
  dailyNote: string;
  onNoteChange: (note: string) => void;
  moduleKey: ModuleKey;
}

const PracticeTrackerItem: React.FC<PracticeTrackerItemProps> = ({ practice, isComplete, onToggle, dailyNote, onNoteChange, moduleKey }) => {
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const moduleInfo = modules[moduleKey];
  const todayKey = new Date().toISOString().split('T')[0];

  return (
    <div className={`relative group bg-gradient-to-r border-l-4 ${moduleInfo.borderColor} rounded-xl overflow-hidden transition-all duration-300 ${isComplete ? 'from-green-900/40 to-emerald-900/20 shadow-lg shadow-green-500/20' : 'from-slate-800/70 to-slate-800/40 hover:from-slate-800/90 hover:to-slate-800/60'}`}>
      {/* Completion celebration glow */}
      {isComplete && (
        <div className="absolute inset-0 -z-10 opacity-50 group-hover:opacity-75 transition-opacity" style={{
          background: 'radial-gradient(circle at center, rgba(34, 197, 233, 0.2), transparent)',
          filter: 'blur(20px)'
        }}></div>
      )}

      <div className="flex items-center p-5 relative z-10">
        <button
          onClick={onToggle}
          className={`w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isComplete ? 'bg-gradient-to-br from-green-500 to-emerald-600 border-green-400 shadow-lg shadow-green-500/50 scale-110' : 'border-slate-500 hover:border-green-500 hover:shadow-md hover:shadow-green-500/30'}`}
        >
          {isComplete && <Check size={20} className="text-white animate-pop-in" />}
        </button>
        <div className="ml-5 flex-grow">
          <h3 className={`font-medium font-mono text-base transition-all ${isComplete ? 'line-through text-slate-400 font-light' : 'text-slate-100'}`}>{practice.name}</h3>
          <p className={`text-sm transition-all ${isComplete ? 'line-through text-slate-500 font-light' : 'text-slate-400 group-hover:text-slate-300'}`}>{practice.description}</p>
        </div>
        <button
          onClick={() => setIsNoteOpen(!isNoteOpen)}
          className="text-slate-400 hover:text-accent p-2 ml-4 transition-colors rounded-lg hover:bg-slate-700/30"
        >
          {isNoteOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>
      {isNoteOpen && (
        <div className="px-5 pb-5 border-t border-slate-700/50 bg-slate-900/30">
          <textarea
            value={dailyNote}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder={`Add a note for ${todayKey}...`}
            rows={2}
            className="w-full text-sm bg-slate-800/60 border border-slate-600/50 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-accent/50 resize-y mt-3 placeholder-slate-500 text-slate-100"
          />
        </div>
      )}
    </div>
  );
};

interface TrackerTabProps {
  practiceStack: AllPractice[];
  completedPractices: Record<string, boolean>;
  togglePracticeCompletion: (practiceId: string) => void;
  dailyNotes: Record<string, string>;
  updateDailyNote: (practiceId: string, note: string) => void;
  findModuleKey: (practiceId: string) => ModuleKey;
}

export default function TrackerTab({
  practiceStack,
  completedPractices,
  togglePracticeCompletion,
  dailyNotes,
  updateDailyNote,
  findModuleKey,
}: TrackerTabProps) {
  const todayKey = new Date().toISOString().split('T')[0];
  const completedCount = Object.values(completedPractices).filter(Boolean).length;
  const totalCount = practiceStack.length;
  const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const todayFormatted = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-mono text-slate-100 tracking-tighter">Daily Tracker</h1>
        <p className="text-slate-400 mt-2">Track your practices for {todayFormatted}.</p>
      </header>

      {practiceStack.length > 0 ? (
        <>
          <div className="space-y-4 bg-gradient-to-br from-slate-800/50 to-slate-900/30 rounded-xl p-6 border border-slate-700/50">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-100">Today's Progress</h2>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">{completedCount}</span>
                <span className="text-sm text-slate-400">/ {totalCount}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative w-full h-3 bg-slate-700/50 rounded-full overflow-hidden border border-slate-600/30">
                {/* Milestone markers */}
                {[25, 50, 75].map(milestone => (
                  <div
                    key={milestone}
                    className="absolute top-0 w-0.5 h-full bg-slate-600/40"
                    style={{ left: `${milestone}%` }}
                  />
                ))}
                {/* Progress fill */}
                <div
                  className="h-full bg-gradient-to-r from-green-500 via-emerald-500 to-cyan-400 rounded-full transition-all duration-700 shadow-lg shadow-green-500/50 relative"
                  style={{ width: `${completionRate}%` }}
                >
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse rounded-full"></div>
                </div>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
            {completionRate === 100 && (
              <div className="text-center py-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500/30">
                <p className="text-sm font-semibold text-green-300">🎉 All Practices Completed!</p>
              </div>
            )}
          </div>
          <div className="space-y-3">
            {practiceStack.map(p => (
              <PracticeTrackerItem
                key={p.id}
                practice={p}
                isComplete={!!completedPractices[p.id]}
                onToggle={() => togglePracticeCompletion(p.id)}
                dailyNote={dailyNotes[`${p.id}-${todayKey}`] || ''}
                onNoteChange={(note) => updateDailyNote(p.id, note)}
                moduleKey={findModuleKey(p.id)}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-slate-700 rounded-lg">
          <h2 className="text-xl font-semibold font-mono text-slate-300">No Practices to Track</h2>
          <p className="text-slate-500 mt-2">Add some practices to your stack from the "Browse" tab to get started.</p>
        </div>
      )}
    </div>
  );
}
