

import React, { useState } from 'react';
// FIX: Correct import paths for types and services.
import { Practice } from '../types.ts';
import { getPersonalizedHowTo } from '../services/geminiService.ts';
import { X, Sparkles, AlertCircle } from 'lucide-react';

interface PracticeCustomizationModalProps {
  practice: Practice;
  onSave: (practiceId: string, personalizedSteps: string[]) => void;
  onClose: () => void;
  userId: string;
}

export default function PracticeCustomizationModal({ practice, onSave, onClose, userId }: PracticeCustomizationModalProps) {
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!answer.trim()) {
      setError('Please provide an answer to personalize your practice.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const personalizedSteps = await getPersonalizedHowTo(practice, answer);
      onSave(practice.id, personalizedSteps);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate plan: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 border border-slate-700/80 rounded-lg shadow-2xl w-full max-w-lg p-6 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start">
            <div>
                <h2 className="text-2xl font-bold font-mono tracking-tight text-slate-50 flex items-center gap-2">
                    <Sparkles size={20} className="text-accent"/>
                    Personalize Your Practice
                </h2>
                <p className="text-slate-400 mt-1">AI-powered customization for <span className="font-semibold text-slate-300">{practice.name}</span></p>
            </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X size={24} />
          </button>
        </div>
        
        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="customization-q" className="block text-sm font-medium text-slate-300 mb-2">
              {practice.customizationQuestion}
            </label>
            <textarea
              id="customization-q"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Your answer here..."
              className="w-full text-sm bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              rows={3}
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded border border-red-500/30">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="flex-1 btn-luminous font-medium py-2 px-4 rounded-md transition flex items-center justify-center gap-2 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                  Generating Plan...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Personalize Practice
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}