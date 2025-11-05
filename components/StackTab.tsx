
import React, { useState } from 'react';
// FIX: Correct import path for types.
import { AllPractice, ModuleKey, Practice } from '../types.ts';
// FIX: Add file extension to import path.
import { modules, practices as corePractices } from '../constants.ts';
import { X, GripVertical, Edit2, Save, Plus, Sparkles } from 'lucide-react';

interface StackItemProps {
  practice: AllPractice;
  moduleKey: ModuleKey;
  onRemove: (practiceId: string) => void;
  notes: string;
  onNoteChange: (note: string) => void;
}

// FIX: Explicitly type StackItem as a React.FC to resolve the incorrect TypeScript error where the 'key' prop was being considered part of the component's props.
const StackItem: React.FC<StackItemProps> = ({ practice, moduleKey, onRemove, notes, onNoteChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [note, setNote] = useState(notes);
  const moduleInfo = modules[moduleKey];

  const handleSaveNote = () => {
    onNoteChange(note);
    setIsEditing(false);
  };

  return (
    <div className={`bg-slate-800/50 border border-slate-800 card-luminous-hover border-l-4 ${moduleInfo.borderColor} rounded-r-lg p-4 flex flex-col`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold font-mono text-lg text-slate-100">{practice.name}</h3>
          <p className="text-sm text-slate-400 mt-1">{practice.description}</p>
        </div>
        <button onClick={() => onRemove(practice.id)} className="text-slate-500 hover:text-red-400 p-1">
          <X size={18} />
        </button>
      </div>
      <div className="mt-3 pt-3 border-t border-slate-700/50">
        {isEditing ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full text-sm bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent resize-y"
              rows={3}
              placeholder="Add your personal 'why' or customization notes..."
            />
            <button onClick={handleSaveNote} className="self-start bg-accent/80 hover:bg-accent text-white text-xs font-bold py-1 px-3 rounded-md flex items-center gap-1">
              <Save size={12} /> Save
            </button>
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <p className="text-sm text-slate-300 italic whitespace-pre-wrap flex-grow">
              {note || "No notes yet. Click edit to add your personal 'why'."}
            </p>
            <button onClick={() => setIsEditing(true)} className="text-slate-400 hover:text-accent p-1 flex items-center gap-1 text-xs">
              <Edit2 size={12} /> Edit
            </button>
          </div>
        )}
      </div>
    </div>
  );
};


interface StackTabProps {
  practiceStack: AllPractice[];
  removeFromStack: (practiceId: string) => void;
  practiceNotes: Record<string, string>;
  updatePracticeNote: (practiceId: string, note: string) => void;
  openCustomPracticeModal: () => void;
  openGuidedPracticeGenerator: () => void;
}

export default function StackTab({ practiceStack, removeFromStack, practiceNotes, updatePracticeNote, openCustomPracticeModal, openGuidedPracticeGenerator }: StackTabProps) {

  const findModuleKey = (practice: AllPractice): ModuleKey => {
    // FIX: Use a type guard to safely access the 'isCustom' and 'module' property.
    if ('isCustom' in practice && practice.isCustom) {
      return practice.module;
    }
    for (const key in corePractices) {
      if (corePractices[key as ModuleKey].some(p => p.id === practice.id)) {
        return key as ModuleKey;
      }
    }
    return 'mind'; // Fallback
  };

  return (
    <div className="space-y-6">
       <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
            <h1 className="text-4xl font-bold font-mono text-slate-100 tracking-tighter">My Practice Stack</h1>
            <p className="text-slate-400 mt-2">This is your curated list of practices. Track them daily and add notes to personalize your journey.</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
             <button onClick={openCustomPracticeModal} className="bg-slate-700/80 hover:bg-slate-700 text-slate-100 font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition">
                <Plus size={18}/> Add Custom
            </button>
             <button onClick={openGuidedPracticeGenerator} className="btn-luminous font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition">
                <Sparkles size={18}/> Generate Practice
            </button>
        </div>
      </header>

      {practiceStack.length > 0 ? (
        <div className="space-y-4">
          {practiceStack.map(p => (
            <StackItem
              key={p.id}
              practice={p}
              moduleKey={findModuleKey(p)}
              onRemove={removeFromStack}
              notes={practiceNotes[p.id] || ''}
              onNoteChange={(note) => updatePracticeNote(p.id, note)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-slate-700 rounded-lg">
          <h2 className="text-xl font-semibold font-mono text-slate-300">Your Stack is Empty</h2>
          <p className="text-slate-500 mt-2">Go to the "Browse Practices" tab to build your stack.</p>
        </div>
      )}
    </div>
  );
}
