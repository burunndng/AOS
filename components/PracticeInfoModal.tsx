import React from 'react';
import { Practice } from '../types.ts';
// FIX: Import Sparkles and Lightbulb icons for the new AI feature buttons.
import { X, Plus, Clock, BarChart, Zap, Sparkles, Lightbulb } from 'lucide-react';

interface PracticeInfoModalProps {
  practice: Practice | null;
  onClose: () => void;
  onAdd: (practice: Practice) => void;
  isInStack: boolean;
  // FIX: Add props to handle AI-powered explanation and personalization.
  onExplainClick: (practice: Practice) => void;
  onPersonalizeClick: (practice: Practice) => void;
}

export default function PracticeInfoModal({ practice, onClose, onAdd, isInStack, onExplainClick, onPersonalizeClick }: PracticeInfoModalProps) {
  if (!practice) return null;

  const handleExplain = () => {
    onExplainClick(practice);
    onClose();
  };

  const handlePersonalize = () => {
    onPersonalizeClick(practice);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-slate-800 border border-slate-700/80 rounded-lg shadow-2xl w-full max-w-2xl p-6 animate-fade-in-up flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold font-mono tracking-tight text-slate-50">{practice.name}</h2>
            <p className="text-slate-400 mt-1">{practice.description}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 p-1">
            <X size={24} />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto mt-4 pr-4 -mr-4 space-y-6">
          {practice.imageUrl && (
            <div className="mb-4 bg-slate-900 rounded-lg shadow-lg">
              <img src={practice.imageUrl} alt={practice.name} className="w-full h-48 object-contain rounded-lg" />
            </div>
          )}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-slate-900/50 p-3 rounded-lg">
              <Clock size={20} className="mx-auto text-cyan-400 mb-1" />
              <p className="font-bold text-slate-200">{practice.timePerWeek} hrs</p>
              <p className="text-xs text-slate-400">per week</p>
            </div>
             <div className="bg-slate-900/50 p-3 rounded-lg">
              <BarChart size={20} className="mx-auto text-purple-400 mb-1" />
              <p className="font-bold text-slate-200">{practice.difficulty}</p>
              <p className="text-xs text-slate-400">Difficulty</p>
            </div>
             <div className="bg-slate-900/50 p-3 rounded-lg">
              <Zap size={20} className="mx-auto text-amber-400 mb-1" />
              <p className="font-bold text-slate-200">{practice.roi}</p>
              <p className="text-xs text-slate-400">ROI</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold font-mono text-slate-200 mb-2">Why Practice This?</h3>
            <p className="text-slate-300 text-sm leading-relaxed">{practice.why}</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold font-mono text-slate-200 mb-2">How to Do It</h3>
            <ul className="list-disc list-inside space-y-2 text-slate-300 text-sm">
              {practice.how.map((step, index) => <li key={index}>{step}</li>)}
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold font-mono text-slate-200 mb-2">Evidence</h3>
            <p className="text-slate-400 text-xs italic">{practice.evidence}</p>
          </div>
        </div>
        
        <div className="mt-6 flex-shrink-0 space-y-2">
          {/* FIX: Add buttons for AI features, wiring up the new props. */}
          <div className="flex gap-2">
            <button
              onClick={handleExplain}
              className="w-full bg-slate-700/80 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
            >
              <Lightbulb size={16} /> Explain with AI
            </button>
            {practice.customizationQuestion && (
              <button
                onClick={handlePersonalize}
                className="w-full btn-luminous font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
              >
                <Sparkles size={16} /> Personalize
              </button>
            )}
          </div>
          <button 
            onClick={() => onAdd(practice)}
            disabled={isInStack}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition disabled:bg-slate-600 disabled:cursor-not-allowed"
          >
            <Plus size={18}/> {isInStack ? 'Already in Stack' : 'Add to Stack'}
          </button>
        </div>
      </div>
    </div>
  );
}