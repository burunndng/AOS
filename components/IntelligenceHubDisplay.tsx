import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, Target, BookOpen } from 'lucide-react';
import type { IntelligentGuidance, AllPractice } from '../types';

interface IntelligenceHubDisplayProps {
  guidance: IntelligentGuidance;
  onLaunchWizard: (wizardType: string) => void;
  onAddPractice: (practice: AllPractice) => void;
  isLoading?: boolean;
}

export function IntelligenceHubDisplay({
  guidance,
  onLaunchWizard,
  onAddPractice,
  isLoading = false,
}: IntelligenceHubDisplayProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mb-4"></div>
        <p className="text-slate-400">Synthesizing your developmental data...</p>
      </div>
    );
  }

  const { synthesis, primaryFocus, recommendations, reasoning, cautions } = guidance;

  return (
    <div className="space-y-6">
      {/* Where You Are Section */}
      <section className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Target className="text-cyan-400" size={24} />
          <h2 className="text-2xl font-bold text-slate-100">Where You Are</h2>
        </div>
        <div className="prose prose-invert prose-slate max-w-none">
          <ReactMarkdown>{synthesis}</ReactMarkdown>
        </div>
      </section>

      {/* Primary Focus Section */}
      <section className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-700/50 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Lightbulb className="text-blue-400" size={24} />
          <h2 className="text-2xl font-bold text-slate-100">Primary Focus</h2>
        </div>
        <div className="prose prose-invert prose-slate max-w-none">
          <ReactMarkdown>{primaryFocus}</ReactMarkdown>
        </div>
      </section>

      {/* Next Wizard Recommendation */}
      {recommendations.nextWizard && (
        <WizardRecommendationCard
          wizard={recommendations.nextWizard}
          onLaunch={onLaunchWizard}
        />
      )}

      {/* Practice Recommendations */}
      {recommendations.practiceChanges?.add && recommendations.practiceChanges.add.length > 0 && (
        <PracticeRecommendationsCard
          practices={recommendations.practiceChanges.add}
          onAdd={onAddPractice}
        />
      )}

      {/* Stack Balance Visualization */}
      {recommendations.stackBalance && (
        <StackBalanceCard balance={recommendations.stackBalance} />
      )}

      {/* How It All Connects */}
      <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="text-green-400" size={24} />
          <h2 className="text-2xl font-bold text-slate-100">How It All Connects</h2>
        </div>

        {reasoning.whatINoticed.length > 0 && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-cyan-300 mb-2">What I Noticed:</h3>
            <ul className="space-y-2">
              {reasoning.whatINoticed.map((item, idx) => (
                <li key={idx} className="text-slate-300 flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {reasoning.howItConnects.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-cyan-300 mb-2">Connections:</h3>
            <ul className="space-y-2">
              {reasoning.howItConnects.map((item, idx) => (
                <li key={idx} className="text-slate-300 flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Cautions */}
      {cautions.length > 0 && (
        <section className="bg-amber-900/20 border border-amber-600/50 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="text-amber-400" size={24} />
            <h2 className="text-2xl font-bold text-amber-100">Cautions</h2>
          </div>
          <div className="space-y-4">
            {cautions.map((caution, idx) => (
              <div key={idx} className="text-amber-200 text-sm leading-relaxed">
                <ReactMarkdown>{caution}</ReactMarkdown>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// Wizard Recommendation Card Component
function WizardRecommendationCard({
  wizard,
  onLaunch,
}: {
  wizard: any;
  onLaunch: (type: string) => void;
}) {
  const confidenceColor =
    wizard.confidence >= 0.8
      ? 'text-green-400'
      : wizard.confidence >= 0.6
        ? 'text-yellow-400'
        : 'text-orange-400';

  const priorityBadgeColor =
    wizard.priority === 'high'
      ? 'bg-red-500/20 text-red-300 border-red-500/50'
      : wizard.priority === 'medium'
        ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
        : 'bg-blue-500/20 text-blue-300 border-blue-500/50';

  return (
    <section className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border-2 border-cyan-500/50 rounded-lg p-6 hover:border-cyan-400 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Sparkles className="text-cyan-400" size={24} />
          <h2 className="text-2xl font-bold text-slate-100">Recommended Wizard</h2>
        </div>
        <div className="flex items-center gap-2">
          {wizard.confidence && (
            <div className="text-xs font-mono px-2 py-1 rounded bg-slate-800 border border-slate-600">
              <span className="text-slate-400">Confidence: </span>
              <span className={confidenceColor}>{Math.round(wizard.confidence * 100)}%</span>
            </div>
          )}
          <span className={`text-xs font-semibold px-2 py-1 rounded border ${priorityBadgeColor}`}>
            {wizard.priority.toUpperCase()}
          </span>
        </div>
      </div>

      <h3 className="text-xl font-semibold text-cyan-100 mb-3">{wizard.name}</h3>

      <div className="space-y-3 mb-4">
        <div>
          <p className="text-sm text-slate-400 mb-1">Why this wizard:</p>
          <p className="text-slate-200">{wizard.reason}</p>
        </div>

        <div>
          <p className="text-sm text-slate-400 mb-1">What to focus on:</p>
          <p className="text-cyan-200 italic">"{wizard.focus}"</p>
        </div>

        {wizard.timing && (
          <div>
            <p className="text-sm text-slate-400 mb-1">Timing:</p>
            <p className="text-slate-200">{wizard.timing}</p>
          </div>
        )}

        {wizard.evidence && wizard.evidence.length > 0 && (
          <div>
            <p className="text-sm text-slate-400 mb-1">Based on:</p>
            <div className="flex flex-wrap gap-2">
              {wizard.evidence.map((ev: string, idx: number) => (
                <span key={idx} className="text-xs px-2 py-1 bg-slate-800 text-slate-300 rounded font-mono">
                  {ev}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => onLaunch(wizard.type)}
        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <BookOpen size={18} />
        Start {wizard.name}
      </button>
    </section>
  );
}

// Practice Recommendations Card Component
function PracticeRecommendationsCard({
  practices,
  onAdd,
}: {
  practices: any[];
  onAdd: (practice: AllPractice) => void;
}) {
  return (
    <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <Target className="text-green-400" size={24} />
        <h2 className="text-2xl font-bold text-slate-100">Suggested Practices</h2>
      </div>

      <div className="space-y-3">
        {practices.map((rec, idx) => (
          <div
            key={idx}
            className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 hover:border-green-500/50 transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-slate-100">{rec.practice.name}</h3>
              <span
                className={`text-xs font-semibold px-2 py-1 rounded ${
                  rec.priority === 'high'
                    ? 'bg-red-500/20 text-red-300'
                    : rec.priority === 'medium'
                      ? 'bg-yellow-500/20 text-yellow-300'
                      : 'bg-blue-500/20 text-blue-300'
                }`}
              >
                {rec.priority}
              </span>
            </div>

            <p className="text-sm text-slate-400 mb-3">{rec.reason}</p>

            {rec.integration && (
              <p className="text-xs text-cyan-300 mb-3 italic">💡 {rec.integration}</p>
            )}

            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-500 space-y-1">
                {rec.timeCommitment && <p>⏱️ {rec.timeCommitment}</p>}
                {rec.startTiming && <p>📅 {rec.startTiming}</p>}
              </div>

              <button
                onClick={() => onAdd(rec.practice)}
                className="bg-green-600 hover:bg-green-500 text-white text-sm font-semibold py-2 px-4 rounded transition-colors"
              >
                Add to Stack
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// Stack Balance Visualization Component
function StackBalanceCard({ balance }: { balance: any }) {
  const modules = [
    { key: 'body', label: 'Body', color: 'bg-red-500', textColor: 'text-red-300' },
    { key: 'mind', label: 'Mind', color: 'bg-blue-500', textColor: 'text-blue-300' },
    { key: 'spirit', label: 'Spirit', color: 'bg-purple-500', textColor: 'text-purple-300' },
    { key: 'shadow', label: 'Shadow', color: 'bg-slate-600', textColor: 'text-slate-300' },
  ];

  return (
    <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
      <h2 className="text-xl font-bold text-slate-100 mb-4">Stack Balance</h2>

      <div className="space-y-3">
        {modules.map((module) => {
          const percentage = parseInt(balance[module.key]) || 0;

          return (
            <div key={module.key}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-medium ${module.textColor}`}>{module.label}</span>
                <span className="text-xs text-slate-400">{balance[module.key]}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2.5">
                <div
                  className={`${module.color} h-2.5 rounded-full transition-all duration-500`}
                  style={{ width: balance[module.key] }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
