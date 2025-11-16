
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
    <div className={`bg-slate-800/70 border-l-4 ${moduleInfo.borderColor} rounded-r-lg`}>
      <div className="flex items-center p-4">
        <button onClick={onToggle} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isComplete ? 'bg-green-500 border-green-400' : 'border-slate-600 hover:border-green-500'}`}>
          {isComplete && <Check size={20} className="text-white animate-pop-in" />}
        </button>
        <div className="ml-4 flex-grow">
          <h3 className={`font-medium font-mono text-slate-100 transition-colors ${isComplete ? 'line-through text-slate-500' : ''}`}>{practice.name}</h3>
          <p className={`text-sm text-slate-400 transition-colors ${isComplete ? 'line-through' : ''}`}>{practice.description}</p>
        </div>
        <button onClick={() => setIsNoteOpen(!isNoteOpen)} className="text-slate-400 hover:text-white p-2 ml-4">
          {isNoteOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>
      {isNoteOpen && (
        <div className="px-4 pb-4 border-t border-slate-700/50">
          <textarea
            value={dailyNote}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder={`Add a note for ${todayKey}...`}
            rows={2}
            className="w-full text-sm bg-slate-700/50 border border-slate-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent resize-y mt-3"
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
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm font-medium text-slate-300">
              <span>Progress</span>
              <span>{completedCount} / {totalCount} Completed</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2.5">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
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
