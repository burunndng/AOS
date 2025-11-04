import React from 'react';
import { X } from 'lucide-react';

interface PracticeExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  explanation: string;
}

export default function PracticeExplanationModal({ isOpen, onClose, title, explanation }: PracticeExplanationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-lg p-6 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start">
          <h2 className="text-xl font-bold text-slate-50">{title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X size={24} />
          </button>
        </div>
        <div className="mt-4">
          <p className="text-slate-300 leading-relaxed">{explanation}</p>
        </div>
      </div>
    </div>
  );
}
