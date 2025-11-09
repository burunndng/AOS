import React, { useMemo } from 'react';
import { CheckCircle2, AlertCircle, TrendingUp, BarChart3, RefreshCw } from 'lucide-react';
import { IntegralBodyPlan, PlanHistoryEntry, PersonalizationSummary } from '../types';

interface PlanHandoffReviewProps {
  plan: IntegralBodyPlan;
  planHistory: PlanHistoryEntry | null;
  personalizationSummary: PersonalizationSummary | null;
  onReviewFeedback: () => void;
  onMarkPlanComplete: () => void;
}

export default function PlanHandoffReview({
  plan,
  planHistory,
  personalizationSummary,
  onReviewFeedback,
  onMarkPlanComplete,
}: PlanHandoffReviewProps) {
  const feedbackStats = useMemo(() => {
    if (!planHistory || !planHistory.dailyFeedback.length) {
      return {
        workoutCompliance: 0,
        yinCompliance: 0,
        avgIntensity: 0,
        avgEnergy: 0,
        daysLogged: 0,
      };
    }

    const feedback = planHistory.dailyFeedback;
    const workoutDays = feedback.filter(f => f.completedWorkout).length;
    const totalYinPractices = feedback.reduce((sum, f) => sum + f.completedYinPractices.length, 0);
    const plannedYinDays = plan.days.filter(d => d.yinPractices.length > 0).length;

    return {
      workoutCompliance: Math.round((workoutDays / feedback.length) * 100),
      yinCompliance: plannedYinDays > 0 ? Math.round((totalYinPractices / (plannedYinDays * 1)) * 100) : 0,
      avgIntensity: Math.round(feedback.reduce((sum, f) => sum + f.intensityFelt, 0) / feedback.length),
      avgEnergy: Math.round(feedback.reduce((sum, f) => sum + f.energyLevel, 0) / feedback.length),
      daysLogged: feedback.length,
    };
  }, [planHistory, plan]);

  const complianceStatus = (compliance: number) => {
    if (compliance >= 80) return { color: 'text-green-400', bg: 'bg-green-900/20', label: 'Excellent' };
    if (compliance >= 60) return { color: 'text-teal-400', bg: 'bg-teal-900/20', label: 'Good' };
    if (compliance >= 40) return { color: 'text-amber-400', bg: 'bg-amber-900/20', label: 'Fair' };
    return { color: 'text-red-400', bg: 'bg-red-900/20', label: 'Low' };
  };

  const renderComplianceBar = (value: number) => (
    <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
      <div
        className={`h-full transition-all duration-300 ${
          value >= 80
            ? 'bg-green-500'
            : value >= 60
            ? 'bg-teal-500'
            : value >= 40
            ? 'bg-amber-500'
            : 'bg-red-500'
        }`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Feedback status */}
      <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
          <CheckCircle2 size={20} className="text-teal-400" />
          Feedback Summary
        </h3>
        
        {feedbackStats.daysLogged === 0 ? (
          <div className="text-center py-6">
            <AlertCircle size={24} className="mx-auto text-slate-500 mb-2" />
            <p className="text-slate-400">No feedback logged yet.</p>
            <p className="text-xs text-slate-500 mt-1">Log daily feedback to see your progress.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Workout compliance */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-300 font-medium">Workout Completion</span>
                <span className={`text-sm font-bold ${complianceStatus(feedbackStats.workoutCompliance).color}`}>
                  {feedbackStats.workoutCompliance}%
                </span>
              </div>
              {renderComplianceBar(feedbackStats.workoutCompliance)}
            </div>

            {/* Yin practices compliance */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-300 font-medium">Yin Practice Completion</span>
                <span className={`text-sm font-bold ${complianceStatus(feedbackStats.yinCompliance).color}`}>
                  {feedbackStats.yinCompliance}%
                </span>
              </div>
              {renderComplianceBar(feedbackStats.yinCompliance)}
            </div>

            {/* Average metrics */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-700">
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">{feedbackStats.avgIntensity}</div>
                <div className="text-xs text-slate-400">Avg Intensity</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-teal-400">{feedbackStats.avgEnergy}</div>
                <div className="text-xs text-slate-400">Avg Energy</div>
              </div>
            </div>

            <p className="text-xs text-slate-500 text-center pt-2">
              Based on {feedbackStats.daysLogged} day{feedbackStats.daysLogged !== 1 ? 's' : ''} of feedback
            </p>
          </div>
        )}
      </div>

      {/* Personalization insights (if available) */}
      {personalizationSummary && feedbackStats.daysLogged > 0 && (
        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-teal-400" />
            Personalization Insights
          </h3>
          
          <div className="space-y-3">
            {/* Adjustment directives */}
            {personalizationSummary.adjustmentDirectives.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-300 mb-2">Recommendations:</p>
                <ul className="space-y-2">
                  {personalizationSummary.adjustmentDirectives.slice(0, 3).map((directive, idx) => (
                    <li key={idx} className="text-xs text-slate-400 flex items-start gap-2">
                      <span className={`font-bold mt-0.5 ${
                        directive.impact === 'high' ? 'text-amber-400' : 
                        directive.impact === 'medium' ? 'text-accent' : 
                        'text-teal-400'
                      }`}>
                        •
                      </span>
                      <span>{directive.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Common blockers */}
            {personalizationSummary.commonBlockers.length > 0 && (
              <div className="pt-2 border-t border-slate-700">
                <p className="text-sm font-medium text-slate-300 mb-2">Common Challenges:</p>
                <ul className="space-y-1">
                  {personalizationSummary.commonBlockers.slice(0, 2).map((blocker, idx) => (
                    <li key={idx} className="text-xs text-slate-400 flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5">⚠</span>
                      <span>{blocker}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommended intensity level */}
            <div className="pt-2 border-t border-slate-700">
              <p className="text-sm font-medium text-slate-300 mb-1">
                Recommended Intensity: <span className="text-accent capitalize">{personalizationSummary.recommendedIntensityLevel}</span>
              </p>
              <p className="text-xs text-slate-400">
                Yin Duration: {personalizationSummary.recommendedYinDuration} min/day
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="flex gap-3">
        <button
          onClick={onReviewFeedback}
          className="flex-1 px-4 py-3 rounded-md font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 transition flex items-center justify-center gap-2"
        >
          <RefreshCw size={18} />
          Review Feedback
        </button>
        <button
          onClick={onMarkPlanComplete}
          className="flex-1 btn-luminous px-4 py-3 rounded-md font-medium flex items-center justify-center gap-2"
        >
          <CheckCircle2 size={18} />
          Mark Complete
        </button>
      </div>

      {/* Notes about feedback */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-xs text-slate-400">
        <p className="font-medium text-slate-300 mb-1">💡 Tip:</p>
        <p>Daily feedback helps refine your future plans. Log progress each day for personalized recommendations.</p>
      </div>
    </div>
  );
}
