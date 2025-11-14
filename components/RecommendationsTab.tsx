
import React, { useState } from 'react';
// FIX: Add file extension to import path.
import { StarterStack, IntegratedInsight, AllPractice, EnhancedRecommendationSet } from '../types.ts';
import { Sparkles, CheckCircle, Lightbulb, ArrowRight, Zap, Clock, Target } from 'lucide-react';
import { SectionDivider } from './SectionDivider.tsx';
import { getPendingInsights, getHighImpactPractices } from '../services/insightContext.ts';

interface RecommendationsTabProps {
  starterStacks: Record<string, StarterStack>;
  applyStarterStack: (practiceIds: string[]) => void;
  userId: string;
  recommendations: string[];
  enhancedRecommendations?: EnhancedRecommendationSet; // NEW: Option B Gemini recommendations
  isLoading: boolean;
  error: string | null;
  onGenerate: () => void;
  onGenerateEnhanced?: () => void; // NEW: Trigger enhanced recommendations generation
  integratedInsights: IntegratedInsight[];
  allPractices: AllPractice[];
  addToStack: (practice: AllPractice) => void;
}

export default function RecommendationsTab({
  starterStacks,
  applyStarterStack,
  userId,
  recommendations,
  enhancedRecommendations,
  isLoading,
  error,
  onGenerate,
  onGenerateEnhanced,
  integratedInsights,
  allPractices,
  addToStack
}: RecommendationsTabProps) {
  const pendingInsights = getPendingInsights(integratedInsights);
  const highImpactPractices = getHighImpactPractices(integratedInsights, allPractices, 2);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold font-mono text-slate-100 tracking-tighter">Recommendations</h1>
        <p className="text-slate-400 mt-2">Get suggestions for your practice stack, from starter kits to personalized AI insights grounded in your history.</p>
      </header>

      {/* Insight-Based Recommendations Section */}
      {pendingInsights.length > 0 && (
        <section className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-700/50 rounded-lg p-6">
          <h2 className="text-3xl font-bold tracking-tight text-slate-100 mb-2 flex items-center gap-3">
            <Lightbulb className="text-blue-400"/> Pattern-Based Recommendations
          </h2>
          <p className="text-slate-400 mb-6">Based on patterns detected in your recent sessions:</p>

          <div className="space-y-6">
            {pendingInsights.map((insight) => (
              <div key={insight.id} className="bg-slate-800/60 border border-slate-700/80 rounded-lg p-5">
                {/* Pattern Header */}
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-slate-100">{insight.mindToolName}</h3>
                    <span className="text-xs font-mono bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                      {insight.mindToolType}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 bg-slate-700/30 p-3 rounded border-l-2 border-blue-500">
                    {insight.detectedPattern}
                  </p>
                </div>

                {/* Recommended Practices */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Shadow Work (Reflection) */}
                  {insight.suggestedShadowWork.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-400 mb-3 uppercase">Reflect (Shadow Work)</h4>
                      <div className="space-y-2">
                        {insight.suggestedShadowWork.map((sw) => {
                          const practice = allPractices.find(p => p.id === sw.practiceId);
                          return practice ? (
                            <button
                              key={sw.practiceId}
                              onClick={() => addToStack(practice)}
                              className="w-full text-left p-3 bg-slate-700/50 hover:bg-slate-700 rounded border border-slate-600/50 hover:border-blue-500/50 transition group"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="font-medium text-slate-200 group-hover:text-blue-300">{sw.practiceName}</p>
                                  <p className="text-xs text-slate-400 mt-1">{sw.rationale}</p>
                                </div>
                                <ArrowRight size={16} className="text-slate-500 group-hover:text-blue-400 mt-1 flex-shrink-0" />
                              </div>
                            </button>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}

                  {/* Next Steps (Action) */}
                  {insight.suggestedNextSteps.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-400 mb-3 uppercase">Act (Next Steps)</h4>
                      <div className="space-y-2">
                        {insight.suggestedNextSteps.map((ns) => {
                          const practice = allPractices.find(p => p.id === ns.practiceId);
                          return practice ? (
                            <button
                              key={ns.practiceId}
                              onClick={() => addToStack(practice)}
                              className="w-full text-left p-3 bg-slate-700/50 hover:bg-slate-700 rounded border border-slate-600/50 hover:border-green-500/50 transition group"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="font-medium text-slate-200 group-hover:text-green-300">{ns.practiceName}</p>
                                  <p className="text-xs text-slate-400 mt-1">{ns.rationale}</p>
                                </div>
                                <ArrowRight size={16} className="text-slate-500 group-hover:text-green-400 mt-1 flex-shrink-0" />
                              </div>
                            </button>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* High-Impact Practices */}
      {highImpactPractices.length > 0 && (
        <section className="bg-slate-800/50 border border-slate-700/80 rounded-lg p-6">
          <h2 className="text-3xl font-bold tracking-tight text-slate-100 mb-4 flex items-center gap-3">
            <Sparkles className="text-accent"/> High-Impact Practices
          </h2>
          <p className="text-slate-400 mb-6">These practices address multiple patterns from your sessions:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {highImpactPractices.map((practice) => (
              <button
                key={practice.id}
                onClick={() => addToStack(practice)}
                className="text-left p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg border border-slate-600/50 hover:border-accent/50 transition group"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-semibold text-slate-100 group-hover:text-accent">{practice.name}</h4>
                  <span className="text-xs font-mono bg-accent/20 text-accent px-2 py-1 rounded whitespace-nowrap">
                    {practice.patternCount} patterns
                  </span>
                </div>
                <p className="text-sm text-slate-400 line-clamp-2">{practice.description}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      <SectionDivider />

      {/* Enhanced AI Recommendations Generator Section - NEW */}
      {(!enhancedRecommendations || enhancedRecommendations.recommendations.length === 0) && (
        <section className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 border border-amber-700/50 rounded-lg p-6">
          <h2 className="text-3xl font-bold tracking-tight text-slate-100 mb-2 flex items-center gap-3">
            <Zap className="text-amber-400"/> AI-Powered Practice Sequencing
          </h2>
          <p className="text-slate-400 mb-4">Get intelligently sequenced practice recommendations with integration guidance and expected timelines.</p>
          <button
            onClick={onGenerateEnhanced}
            disabled={isLoading}
            className="btn-luminous font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Generating Sequenced Recommendations...
              </>
            ) : (
              <>
                <Zap size={16} /> Generate Sequenced Plan
              </>
            )}
          </button>

          {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
        </section>
      )}

      <SectionDivider />

      {/* Enhanced AI Recommendations Display Section (Option B) - NEW */}
      {enhancedRecommendations && enhancedRecommendations.recommendations.length > 0 && (
        <section className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 border border-amber-700/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
              <Zap className="text-amber-400"/> AI-Powered Practice Sequencing
            </h2>
            <span className="text-xs font-mono bg-amber-500/20 text-amber-300 px-3 py-1 rounded">
              {Math.round(enhancedRecommendations.confidence * 100)}% Confidence
            </span>
          </div>
          <p className="text-slate-400 mb-6">Personalized practice recommendations based on Gemini AI analysis:</p>

          {/* Overall Guidance */}
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-lg p-4 mb-6 border-l-4 border-l-amber-500">
            <p className="text-slate-200 text-sm leading-relaxed">{enhancedRecommendations.overallGuidance}</p>
            <div className="mt-3 flex gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-1">
                <Clock size={14} className="text-amber-400"/>
                <span>First benefits: {enhancedRecommendations.estimatedTimeToNoticeBenefit}</span>
              </div>
            </div>
          </div>

          {/* Practice Recommendations */}
          <div className="space-y-3">
            {enhancedRecommendations.recommendations.map((rec) => (
              <button
                key={rec.id}
                onClick={() => addToStack(rec.practice)}
                className="w-full text-left bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/50 rounded-lg p-4 transition group"
              >
                {/* Header with sequence and confidence */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-baseline gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold">
                      {rec.sequenceWeek}
                    </span>
                    <h4 className="text-lg font-semibold text-slate-100 group-hover:text-amber-300">{rec.practice.name}</h4>
                  </div>
                  <span className="text-xs font-mono bg-slate-700/80 text-slate-300 px-2 py-1 rounded">
                    {rec.practice.difficulty}
                  </span>
                </div>

                {/* Rationale */}
                <p className="text-sm text-slate-300 mb-3 pl-8">{rec.rationale}</p>

                {/* Grid of details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 pl-8">
                  {/* Time */}
                  <div className="flex items-start gap-2 text-xs">
                    <Clock size={14} className="text-amber-400 mt-0.5 flex-shrink-0"/>
                    <div>
                      <p className="text-slate-400">Time Commitment</p>
                      <p className="text-slate-200 font-mono">{rec.timeCommitment}</p>
                    </div>
                  </div>

                  {/* Sequence */}
                  <div className="flex items-start gap-2 text-xs">
                    <Target size={14} className="text-amber-400 mt-0.5 flex-shrink-0"/>
                    <div>
                      <p className="text-slate-400">When to Start</p>
                      <p className="text-slate-200 font-mono">{rec.sequenceGuidance}</p>
                    </div>
                  </div>

                  {/* Benefits */}
                  <div className="flex items-start gap-2 text-xs">
                    <Sparkles size={14} className="text-amber-400 mt-0.5 flex-shrink-0"/>
                    <div>
                      <p className="text-slate-400">Expected Benefits</p>
                      <p className="text-slate-200">{rec.expectedBenefits}</p>
                    </div>
                  </div>
                </div>

                {/* Integration Tips */}
                <div className="bg-slate-700/30 rounded p-3 pl-8 mb-3">
                  <p className="text-xs text-slate-400 font-semibold mb-1">Integration Tips:</p>
                  <p className="text-xs text-slate-300">{rec.integrationTips}</p>
                </div>

                {/* Add Button */}
                <div className="flex items-center justify-between pl-8">
                  <span className="text-xs text-slate-500">Click to add to your stack</span>
                  <ArrowRight size={16} className="text-slate-400 group-hover:text-amber-400 transition"/>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      <SectionDivider />

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