
import React, { useState } from 'react';
// FIX: Add file extension to import path.
import { StarterStack } from '../types.ts';
import { Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import { SectionDivider } from './SectionDivider.tsx';
import * as ragService from '../services/ragService.ts';
import type { PersonalizedRecommendation, RecommendationResponse } from '../api/lib/types.ts';

interface RecommendationsTabProps {
  starterStacks: Record<string, StarterStack>;
  applyStarterStack: (practiceIds: string[]) => void;
  userId: string;
  recommendations: string[];
  isLoading: boolean;
  error: string | null;
  onGenerate: () => void;
}

export default function RecommendationsTab({
  starterStacks,
  applyStarterStack,
  userId,
  recommendations,
  isLoading,
  error,
  onGenerate
}: RecommendationsTabProps) {
  // RAG-powered recommendations state
  const [ragRecommendations, setRagRecommendations] = useState<PersonalizedRecommendation[]>([]);
  const [ragInsights, setRagInsights] = useState<string[]>([]);
  const [ragLoading, setRagLoading] = useState(false);
  const [ragError, setRagError] = useState<string | null>(null);
  const [userQuery, setUserQuery] = useState('');

  // Fetch RAG recommendations
  const fetchRagRecommendations = async (query: string) => {
    setRagLoading(true);
    setRagError(null);
    try {
      const response = await ragService.getPersonalizedRecommendations(userId, query || 'What practices should I do next?');
      setRagRecommendations(response.recommendations);
      setRagInsights(response.insights);
    } catch (err) {
      setRagError(err instanceof Error ? err.message : 'Failed to fetch recommendations');
      console.error('[RecommendationsTab] Error:', err);
    } finally {
      setRagLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold font-mono text-slate-100 tracking-tighter">Recommendations</h1>
        <p className="text-slate-400 mt-2">Get suggestions for your practice stack, from starter kits to personalized AI insights grounded in your history.</p>
      </header>

      {/* RAG AI Recommendations Section */}
      <section className="bg-slate-800/50 border border-blue-700/50 rounded-lg p-6">
        <h2 className="text-3xl font-bold tracking-tight text-slate-100 mb-2 flex items-center gap-3">
          <Sparkles className="text-blue-400"/> Context-Aware RAG Recommendations
        </h2>
        <p className="text-slate-400 mb-4">Get recommendations based on your practice history, identified patterns, and developmental stage.</p>

        {/* Query Input */}
        <div className="mb-4">
          <input
            id="rag-query-input"
            name="ragQuery"
            type="text"
            placeholder="What practices would help right now? (leave blank for general recommendations)"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && fetchRagRecommendations(userQuery)}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => fetchRagRecommendations(userQuery)}
            disabled={ragLoading}
            className="btn-luminous font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition disabled:cursor-not-allowed"
          >
            {ragLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles size={16} /> Get RAG Recommendations
              </>
            )}
          </button>

          <button
            onClick={onGenerate}
            disabled={isLoading}
            className="bg-slate-700/50 hover:bg-slate-700 text-slate-300 font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Classic AI...
              </>
            ) : (
              <>
                <Sparkles size={16} /> Classic AI Recommendations
              </>
            )}
          </button>
        </div>

        {(ragError || error) && (
          <div className="text-red-400 text-sm mt-4 flex items-center gap-2">
            <AlertCircle size={16} />
            {ragError || error}
          </div>
        )}

        {/* RAG Insights */}
        {ragInsights.length > 0 && (
          <div className="mt-6 border-t border-slate-700 pt-4">
            <h3 className="font-semibold text-lg font-mono text-blue-200 mb-3">📊 Key Insights</h3>
            <div className="space-y-2">
              {ragInsights.map((insight, idx) => (
                <p key={idx} className="text-slate-300 text-sm bg-slate-700/30 p-3 rounded border-l-2 border-blue-500">
                  {insight}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* RAG Recommendations Display */}
        {ragRecommendations.length > 0 && (
          <div className="mt-6 border-t border-slate-700 pt-4">
            <h3 className="font-semibold text-lg font-mono text-slate-200 mb-4">✨ Personalized Recommendations</h3>
            <div className="space-y-4">
              {ragRecommendations.map((rec, idx) => (
                <div key={idx} className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-lg font-semibold text-slate-100">{rec.practiceTitle}</h4>
                    <span className="text-xs font-mono bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                      {(rec.relevanceScore * 100).toFixed(0)}% match
                    </span>
                  </div>

                  <p className="text-slate-300 text-sm mb-3">{rec.reasoning}</p>

                  {rec.personalizationNotes.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-slate-400 mb-2">Customization Tips:</p>
                      <ul className="text-xs text-slate-400 space-y-1">
                        {rec.personalizationNotes.map((note, nIdx) => (
                          <li key={nIdx} className="flex items-start gap-2">
                            <span className="text-blue-400 mt-0.5">•</span>
                            <span>{note}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {rec.customSteps && rec.customSteps.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-slate-400 mb-2">Personalized Steps:</p>
                      <ol className="text-xs text-slate-400 space-y-1 ml-2">
                        {rec.customSteps.map((step, sIdx) => (
                          <li key={sIdx} className="flex gap-2">
                            <span className="font-semibold text-blue-400 min-w-[1.5rem]">{sIdx + 1}.</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Classic AI Recommendations Section */}
      <section className="bg-slate-800/50 border border-slate-700/80 rounded-lg p-6">
        <h2 className="text-3xl font-bold tracking-tight text-slate-100 mb-2 flex items-center gap-3"><Sparkles className="text-accent"/> Classic AI Recommendations</h2>
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