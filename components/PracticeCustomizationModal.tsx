

import React, { useState } from 'react';
// FIX: Correct import paths for types and services.
import { Practice } from '../types.ts';
import { getPersonalizedHowTo } from '../services/geminiService.ts';
import * as ragService from '../services/ragService.ts';
import { X, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import type { GenerationResponse } from '../api/lib/types.ts';

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
  const [useRag, setUseRag] = useState(true);
  const [ragResponse, setRagResponse] = useState<GenerationResponse | null>(null);

  const handleGenerateRag = async () => {
    if (!answer.trim()) {
      setError('Please provide an answer to personalize your practice.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const response = await ragService.personalizePractice(
        userId,
        practice.id,
        practice.name,
        { challenge: answer }
      );
      setRagResponse(response);

      // Extract steps from personalized response
      const personalizedSteps = response.metadata?.personalizedSteps?.map(
        (step: any) => `${step.order}. ${step.instruction}${step.adaptation ? ` (${step.adaptation})` : ''}`
      ) || [];

      onSave(practice.id, personalizedSteps);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to personalize with RAG: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateClassic = async () => {
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

  const handleGenerate = useRag ? handleGenerateRag : handleGenerateClassic;

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
          {/* RAG Toggle */}
          <div className="flex items-center gap-2 bg-slate-700/30 p-3 rounded border border-slate-600/50">
            <input
              type="checkbox"
              id="use-rag"
              checked={useRag}
              onChange={(e) => {
                setUseRag(e.target.checked);
                setError('');
              }}
              disabled={isLoading}
              className="w-4 h-4 cursor-pointer"
            />
            <label htmlFor="use-rag" className="text-sm text-slate-300 cursor-pointer flex-1">
              <span className="font-semibold">Use Context-Aware RAG</span>
              <p className="text-xs text-slate-400">Personalizes based on your history and preferences</p>
            </label>
          </div>

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
                  {useRag ? 'Personalizing with RAG...' : 'Generating Plan...'}
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  {useRag ? 'Personalize with RAG' : 'Classic Personalization'}
                </>
              )}
            </button>
          </div>

          {/* RAG Response Display */}
          {ragResponse && !isLoading && (
            <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3 text-blue-300">
                <CheckCircle size={18} />
                <h3 className="font-semibold">RAG Personalization Applied</h3>
              </div>
              <p className="text-sm text-slate-300 mb-3">{ragResponse.content}</p>
              {ragResponse.metadata?.personalizedSteps && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 mb-2">Adaptations:</p>
                  <ul className="text-xs text-slate-400 space-y-1">
                    {ragResponse.metadata.personalizedSteps.map((step: any, idx: number) => (
                      <li key={idx} className="flex gap-2">
                        <span className="text-blue-400">✓</span>
                        <span>{step.adaptation || step.instruction}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}