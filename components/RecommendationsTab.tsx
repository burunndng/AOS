
import React, { useState } from 'react';
// FIX: Add file extension to import path.
import { StarterStack, IntegratedInsight, AllPractice, EnhancedRecommendationSet, IntelligentGuidance, PersonalizationSummary } from '../types.ts';
import { Sparkles, CheckCircle, Lightbulb, ArrowRight, Zap, Clock, Target, Brain, AlertTriangle, TrendingUp, RefreshCw } from 'lucide-react';
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
  intelligentGuidance?: IntelligentGuidance; // NEW: Intelligent Guidance from Grok
  isGuidanceLoading?: boolean;
  guidanceError?: string | null;
  onGenerateGuidance?: () => void;
  onClearGuidanceCache?: () => void;
  integratedInsights: IntegratedInsight[];
  allPractices: AllPractice[];
  addToStack: (practice: AllPractice) => void;
  personalizationSummary?: PersonalizationSummary | null;
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
  intelligentGuidance,
  isGuidanceLoading,
  guidanceError,
  onGenerateGuidance,
  onClearGuidanceCache,
  integratedInsights,
  allPractices,
  addToStack,
  personalizationSummary
}: RecommendationsTabProps) {
  const pendingInsights = getPendingInsights(integratedInsights);
  const highImpactPractices = getHighImpactPractices(integratedInsights, allPractices, 2);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold font-mono text-slate-100 tracking-tighter">Recommendations</h1>
        <p className="text-slate-400 mt-2">Get AI-powered guidance that synthesizes all your wizard sessions, practices, and insights into coherent next steps.</p>
      </header>

      {/* Intelligent Guidance Section - Primary Feature */}
      <section className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/50 rounded-lg p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-100 mb-2 flex items-center gap-3">
              <Brain className="text-purple-400"/> AI Intelligence Hub
            </h2>
            <p className="text-slate-300 text-sm">Comprehensive guidance synthesizing all your developmental work</p>
          </div>
          {intelligentGuidance && onClearGuidanceCache && (
            <button
              onClick={onClearGuidanceCache}
              className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
              title="Clear cache and regenerate fresh guidance"
            >
              <RefreshCw size={14} /> Refresh
            </button>
          )}
        </div>

        {!intelligentGuidance && onGenerateGuidance && (
          <div>
            <p className="text-slate-400 mb-4">
              Get intelligent routing to your next wizard, practice recommendations tailored to your current edge,
              and coherent synthesis of your entire developmental journey.
            </p>
            <button
              onClick={onGenerateGuidance}
              disabled={isGuidanceLoading}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isGuidanceLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Analyzing your developmental journey...
                </>
              ) : (
                <>
                  <Brain size={20} /> Generate AI Guidance
                </>
              )}
            </button>
            {guidanceError && <p className="text-red-400 text-sm mt-4">{guidanceError}</p>}
          </div>
        )}

        {intelligentGuidance && (
          <div className="space-y-6">
            {/* Synthesis */}
            <div className="bg-slate-800/60 border border-purple-500/30 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-purple-300 mb-3 flex items-center gap-2">
                <TrendingUp size={18} /> Where You Are
              </h3>
              <p className="text-slate-200 leading-relaxed">{intelligentGuidance.synthesis}</p>
            </div>

            {/* Primary Focus */}
            <div className="bg-slate-800/60 border border-blue-500/30 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-blue-300 mb-3 flex items-center gap-2">
                <Target size={18} /> Primary Focus
              </h3>
              <p className="text-slate-200 leading-relaxed">{intelligentGuidance.primaryFocus}</p>
            </div>

            {/* Recommendations */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-slate-100">Recommended Next Steps</h3>

              {/* Next Wizard */}
              {intelligentGuidance.recommendations.nextWizard && (
                <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 border border-purple-500/50 rounded-lg p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-lg font-semibold text-purple-200">{intelligentGuidance.recommendations.nextWizard.name}</h4>
                      <span className="text-xs font-mono bg-purple-500/20 text-purple-300 px-2 py-1 rounded mt-1 inline-block">
                        {intelligentGuidance.recommendations.nextWizard.priority} priority
                      </span>
                    </div>
                    <Sparkles className="text-purple-400" size={24} />
                  </div>
                  <p className="text-slate-300 mb-2"><strong>Why:</strong> {intelligentGuidance.recommendations.nextWizard.reason}</p>
                  <p className="text-slate-300"><strong>Focus on:</strong> {intelligentGuidance.recommendations.nextWizard.focus}</p>
                </div>
              )}

              {/* Practice Changes */}
              {intelligentGuidance.recommendations.practiceChanges?.add && intelligentGuidance.recommendations.practiceChanges.add.length > 0 && (
                <div>
                  <h4 className="text-md font-semibold text-slate-200 mb-3">Practices to Add</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {intelligentGuidance.recommendations.practiceChanges.add.map((rec, idx) => (
                      <button
                        key={idx}
                        onClick={() => rec.practice && addToStack(rec.practice)}
                        className="text-left p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg border border-slate-600/50 hover:border-purple-500/50 transition group"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h5 className="font-semibold text-slate-100 group-hover:text-purple-300">
                            {rec.practice?.name || 'Practice'}
                          </h5>
                          <span className={`text-xs font-mono px-2 py-1 rounded ${
                            rec.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                            rec.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-blue-500/20 text-blue-300'
                          }`}>
                            {rec.priority}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400">{rec.reason}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Insight Work */}
              {intelligentGuidance.recommendations.insightWork && (
                <div className="bg-slate-800/60 border border-amber-500/30 rounded-lg p-5">
                  <h4 className="text-md font-semibold text-amber-300 mb-2">Pattern to Work With</h4>
                  <p className="text-slate-200 mb-2"><strong>{intelligentGuidance.recommendations.insightWork.pattern}</strong></p>
                  <p className="text-slate-300 text-sm">{intelligentGuidance.recommendations.insightWork.approachSuggestion}</p>
                </div>
              )}
            </div>

            {/* Reasoning */}
            <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-slate-200 mb-4">How It All Connects</h3>
              <div className="space-y-3 text-sm">
                {intelligentGuidance.reasoning.whatINoticed.length > 0 && (
                  <div>
                    <p className="text-slate-400 font-medium mb-1">What I Noticed:</p>
                    <ul className="list-disc list-inside text-slate-300 space-y-1">
                      {intelligentGuidance.reasoning.whatINoticed.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {intelligentGuidance.reasoning.howItConnects.length > 0 && (
                  <div>
                    <p className="text-slate-400 font-medium mb-1">Connections:</p>
                    <ul className="list-disc list-inside text-slate-300 space-y-1">
                      {intelligentGuidance.reasoning.howItConnects.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Cautions */}
            {intelligentGuidance.cautions && intelligentGuidance.cautions.length > 0 && (
              <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-4">
                <h3 className="text-md font-semibold text-amber-300 mb-2 flex items-center gap-2">
                  <AlertTriangle size={18} /> Cautions
                </h3>
                <ul className="list-disc list-inside text-amber-200/90 text-sm space-y-1">
                  {intelligentGuidance.cautions.map((caution, idx) => (
                    <li key={idx}>{caution}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-xs text-slate-500 text-center">
              Generated {new Date(intelligentGuidance.generatedAt).toLocaleString()} • Cached for 24 hours
            </p>
          </div>
        )}
      </section>

      <SectionDivider />

      {/* Adaptive Body Plan Recommendations Section */}
      {personalizationSummary && personalizationSummary.adjustmentDirectives && personalizationSummary.adjustmentDirectives.length > 0 && (
        <section className="bg-gradient-to-br from-green-900/20 to-teal-900/20 border border-green-700/50 rounded-lg p-6">
          <h2 className="text-3xl font-bold tracking-tight text-slate-100 mb-2 flex items-center gap-3">
            <TrendingUp className="text-green-400"/> Adaptive Body Plan Recommendations
          </h2>
          <p className="text-slate-400 mb-6">Based on your plan feedback, here are data-driven adjustments for your next plan:</p>

          <div className="space-y-4">
            {personalizationSummary.adjustmentDirectives.map((directive, idx) => (
              <div
                key={idx}
                className={`bg-slate-800/60 border rounded-lg p-5 ${
                  directive.impact === 'high'
                    ? 'border-red-500/50 bg-red-900/10'
                    : directive.impact === 'medium'
                    ? 'border-amber-500/50 bg-amber-900/10'
                    : 'border-blue-500/50 bg-blue-900/10'
                }`}
              >
                <div className="flex items-start gap-4">
                  <AlertTriangle
                    className={`mt-1 flex-shrink-0 ${
                      directive.impact === 'high'
                        ? 'text-red-400'
                        : directive.impact === 'medium'
                        ? 'text-amber-400'
                        : 'text-blue-400'
                    }`}
                    size={24}
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-100 mb-2">
                      {directive.description}
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed mb-3">
                      {directive.rationale}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-mono px-3 py-1 rounded ${
                        directive.impact === 'high'
                          ? 'bg-red-500/20 text-red-300'
                          : directive.impact === 'medium'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}>
                        {directive.impact} impact
                      </span>
                      <span className="text-xs font-mono bg-slate-700/80 text-slate-300 px-3 py-1 rounded">
                        {directive.confidence}% confident
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-slate-800/40 border border-slate-700 rounded-lg p-4">
            <p className="text-sm text-slate-300">
              <strong className="text-slate-200">How it works:</strong> The app analyzes your daily feedback (intensity felt, energy levels, blockers)
              and automatically generates these personalized adjustments. They'll be incorporated into your next plan generation.
            </p>
          </div>
        </section>
      )}

      <SectionDivider />

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