/**
 * Integral Body Personalization Service
 * 
 * Consumes plan history, completion data, and feedback to generate
 * adaptive tuning directives for personalized future plans.
 * 
 * Features:
 * - Time-weighted historical analysis (recent plans weighted more heavily)
 * - Compliance pattern detection
 * - Blocker identification
 * - Preference inference
 * - Adjustment directive generation
 */

import {
  PlanHistoryEntry,
  PlanDayFeedback,
  PersonalizationSummary,
  AdjustmentDirective,
  InferredPreference,
} from '../types';

/**
 * Calculate time decay factor for a plan entry.
 * Recent plans (last 2 weeks) have weight 1.0, older plans decay exponentially.
 */
function calculateTimeDecayFactor(planDate: string, currentDate: Date = new Date()): number {
  const planTime = new Date(planDate).getTime();
  const currentTime = currentDate.getTime();
  const daysDiff = (currentTime - planTime) / (1000 * 60 * 60 * 24);

  // Linear decay: 100% at 0 days, 50% at 14 days, 0% at 28 days
  // For older plans: clamp to 0
  if (daysDiff > 28) return 0;
  if (daysDiff < 0) return 1; // Future dates get full weight
  return Math.max(0, 1 - daysDiff / 28);
}

/**
 * Calculate time-weighted averages from plan history.
 */
function calculateTimeWeightedAverages(
  history: PlanHistoryEntry[],
  currentDate: Date = new Date()
): {
  workoutCompliance: number;
  yinCompliance: number;
  averageIntensity: number;
  averageEnergy: number;
} {
  if (history.length === 0) {
    return {
      workoutCompliance: 0,
      yinCompliance: 0,
      averageIntensity: 0,
      averageEnergy: 0,
    };
  }

  let totalWorkoutCompliance = 0;
  let totalYinCompliance = 0;
  let totalIntensity = 0;
  let totalEnergy = 0;
  let totalWeight = 0;

  history.forEach(entry => {
    const weight = calculateTimeDecayFactor(entry.planDate, currentDate);
    if (weight === 0) return; // Skip plans older than 28 days

    if (entry.aggregateMetrics) {
      totalWorkoutCompliance += entry.aggregateMetrics.workoutComplianceRate * weight;
      totalYinCompliance += entry.aggregateMetrics.yinComplianceRate * weight;
      totalIntensity += entry.aggregateMetrics.averageIntensity * weight;
      totalEnergy += entry.aggregateMetrics.averageEnergy * weight;
      totalWeight += weight;
    }
  });

  if (totalWeight === 0) {
    return {
      workoutCompliance: 0,
      yinCompliance: 0,
      averageIntensity: 0,
      averageEnergy: 0,
    };
  }

  return {
    workoutCompliance: totalWorkoutCompliance / totalWeight,
    yinCompliance: totalYinCompliance / totalWeight,
    averageIntensity: totalIntensity / totalWeight,
    averageEnergy: totalEnergy / totalWeight,
  };
}

/**
 * Extract and aggregate blocker information from all feedback entries.
 */
function extractCommonBlockers(history: PlanHistoryEntry[]): string[] {
  const blockerMap: Record<string, number> = {};

  history.forEach(entry => {
    entry.dailyFeedback.forEach(feedback => {
      if (feedback.blockers) {
        const normalizedBlocker = feedback.blockers.toLowerCase().trim();
        blockerMap[normalizedBlocker] = (blockerMap[normalizedBlocker] || 0) + 1;
      }
    });
  });

  // Return top 5 blockers
  return Object.entries(blockerMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([blocker]) => blocker);
}

/**
 * Identify day patterns with high compliance.
 */
function extractBestPerformingDayPatterns(history: PlanHistoryEntry[]): string[] {
  const dayPatternMap: Record<string, { completed: number; total: number }> = {};

  history.forEach(entry => {
    entry.dailyFeedback.forEach(feedback => {
      if (!dayPatternMap[feedback.dayName]) {
        dayPatternMap[feedback.dayName] = { completed: 0, total: 0 };
      }
      dayPatternMap[feedback.dayName].total += 1;

      if (feedback.completedWorkout || feedback.completedYinPractices.length > 0) {
        dayPatternMap[feedback.dayName].completed += 1;
      }
    });
  });

  // Identify days with >70% compliance
  return Object.entries(dayPatternMap)
    .filter(([_, stats]) => stats.total > 0 && stats.completed / stats.total > 0.7)
    .map(([day]) => day);
}

/**
 * Generate adjustment directives based on compliance patterns.
 */
function generateAdjustmentDirectives(
  history: PlanHistoryEntry[],
  timeWeightedAvg: {
    workoutCompliance: number;
    yinCompliance: number;
    averageIntensity: number;
    averageEnergy: number;
  }
): AdjustmentDirective[] {
  const directives: AdjustmentDirective[] = [];

  // Low workout compliance - suggest load reduction or time optimization
  if (timeWeightedAvg.workoutCompliance < 50) {
    directives.push({
      type: 'load-reduction',
      description: 'Reduce workout frequency or duration',
      rationale: `Workout compliance is low at ${timeWeightedAvg.workoutCompliance.toFixed(1)}%. Consider reducing frequency or making workouts shorter.`,
      impact: 'high',
      confidence: 85,
    });
  }

  // High workout compliance but low energy - suggest recovery boost
  if (timeWeightedAvg.workoutCompliance > 70 && timeWeightedAvg.averageEnergy < 5) {
    directives.push({
      type: 'recovery-boost',
      description: 'Increase recovery and Yin practices',
      rationale: 'Workouts are being completed but energy levels are low. More recovery time needed.',
      impact: 'high',
      confidence: 80,
    });
  }

  // Low Yin compliance - suggest shorter, easier practices
  if (timeWeightedAvg.yinCompliance < 50) {
    directives.push({
      type: 'yin-duration',
      description: 'Reduce Yin practice duration to 5-10 minutes per day',
      rationale: `Yin practice compliance is low at ${timeWeightedAvg.yinCompliance.toFixed(1)}%. Start with shorter, more achievable practices.`,
      impact: 'high',
      confidence: 85,
    });
  }

  // High intensity reported - suggest moderation
  if (timeWeightedAvg.averageIntensity > 8) {
    directives.push({
      type: 'intensity-nudge',
      description: 'Moderate intensity levels to sustainable range',
      rationale: 'Reported intensity is consistently high, which may lead to burnout. Suggest more sustainable pacing.',
      impact: 'medium',
      confidence: 75,
    });
  }

  // Check for back-to-back heavy sessions pattern
  const heavyDayPatterns = detectBackToBackHeavySessions(history);
  if (heavyDayPatterns.length > 0) {
    directives.push({
      type: 'yang-spacing',
      description: `Add recovery days between workouts on ${heavyDayPatterns.join(' and ')}`,
      rationale: 'Detected pattern of consecutive high-intensity days. Increase spacing for better recovery.',
      impact: 'medium',
      confidence: 70,
    });
  }

  return directives;
}

/**
 * Detect if there's a pattern of back-to-back heavy sessions.
 */
function detectBackToBackHeavySessions(history: PlanHistoryEntry[]): string[] {
  const patterns: Set<string> = new Set();

  history.forEach(entry => {
    for (let i = 0; i < entry.dailyFeedback.length - 1; i++) {
      const current = entry.dailyFeedback[i];
      const next = entry.dailyFeedback[i + 1];

      if (
        current.intensityFelt >= 8 &&
        next.intensityFelt >= 8 &&
        (current.completedWorkout || current.completedYinPractices.length > 0) &&
        (next.completedWorkout || next.completedYinPractices.length > 0)
      ) {
        patterns.add(`${current.dayName}→${next.dayName}`);
      }
    }
  });

  return Array.from(patterns);
}

/**
 * Infer user preferences from historical patterns.
 */
function inferPreferences(history: PlanHistoryEntry[]): InferredPreference[] {
  const preferences: InferredPreference[] = [];

  // Analyze time preferences (when practices were completed)
  const timeOfDayMap: Record<string, number> = {};
  const modalityMap: Record<string, { completed: number; total: number }> = {};

  history.forEach(entry => {
    entry.dailyFeedback.forEach(feedback => {
      // Track timing patterns (this is basic; real implementation would parse hour info)
      if (feedback.completedWorkout) {
        timeOfDayMap['morning'] = (timeOfDayMap['morning'] || 0) + 1;
      }

      // Track modality preferences
      feedback.completedYinPractices.forEach(practice => {
        if (!modalityMap[practice]) {
          modalityMap[practice] = { completed: 1, total: 1 };
        } else {
          modalityMap[practice].completed += 1;
          modalityMap[practice].total += 1;
        }
      });
    });
  });

  // Add high-compliance modalities
  Object.entries(modalityMap)
    .filter(([_, stats]) => stats.total > 0 && stats.completed / stats.total > 0.8)
    .slice(0, 3)
    .forEach(([modality, stats]) => {
      preferences.push({
        type: 'high-compliance-modality',
        value: modality,
        frequency: stats.completed,
        compliance: (stats.completed / stats.total) * 100,
        notes: `Consistently completed with high compliance rate`,
      });
    });

  // Add time preferences if detected
  if (timeOfDayMap['morning'] > 0) {
    preferences.push({
      type: 'preferred-time',
      value: 'morning',
      frequency: timeOfDayMap['morning'],
      notes: 'High completion rate for morning sessions',
    });
  }

  return preferences;
}

/**
 * Recommend intensity level based on historical patterns.
 */
function recommendIntensityLevel(timeWeightedAvg: {
  averageIntensity: number;
  workoutCompliance: number;
  averageEnergy: number;
}): 'low' | 'moderate' | 'high' {
  // High compliance + moderate intensity + good energy = maintain or increase
  if (timeWeightedAvg.workoutCompliance > 75 && timeWeightedAvg.averageIntensity < 7 && timeWeightedAvg.averageEnergy > 6) {
    return 'high';
  }

  // Low compliance OR low energy = reduce intensity
  if (timeWeightedAvg.workoutCompliance < 60 || timeWeightedAvg.averageEnergy < 5) {
    return 'low';
  }

  // Default to moderate
  return 'moderate';
}

/**
 * Recommend Yin practice duration based on compliance and energy.
 */
function recommendYinDuration(timeWeightedAvg: { yinCompliance: number; averageEnergy: number }): number {
  // Low compliance = shorter practices (5-10 min)
  if (timeWeightedAvg.yinCompliance < 40) {
    return 8;
  }

  // Moderate compliance = 10-15 min
  if (timeWeightedAvg.yinCompliance < 70) {
    return 12;
  }

  // High compliance and high energy = 15-20 min
  if (timeWeightedAvg.averageEnergy > 7) {
    return 18;
  }

  return 15;
}

/**
 * Generate a human-readable summary of personalization insights.
 */
function generatePersonalizationSummary(
  history: PlanHistoryEntry[],
  timeWeightedAvg: any,
  directives: AdjustmentDirective[],
  blockers: string[]
): string {
  const planCount = history.length;
  const workoutCompliance = timeWeightedAvg.workoutCompliance.toFixed(0);
  const yinCompliance = timeWeightedAvg.yinCompliance.toFixed(0);

  let summary = `Based on analysis of ${planCount} recent plans:\n`;
  summary += `- Workout compliance: ${workoutCompliance}%\n`;
  summary += `- Yin practice compliance: ${yinCompliance}%\n`;

  if (blockers.length > 0) {
    summary += `- Top blocker: "${blockers[0]}"\n`;
  }

  if (directives.length > 0) {
    summary += `\nKey recommendations:\n`;
    directives.slice(0, 3).forEach(d => {
      summary += `- ${d.description}\n`;
    });
  }

  return summary;
}

/**
 * Analyze plan history and generate personalization summary.
 * This is the main entry point for the personalization module.
 */
export function analyzeHistoryAndPersonalize(
  planHistory: PlanHistoryEntry[],
  currentDate: Date = new Date()
): PersonalizationSummary {
  // Filter out very old plans (>28 days)
  const recentHistory = planHistory.filter(entry => {
    const decayFactor = calculateTimeDecayFactor(entry.planDate, currentDate);
    return decayFactor > 0;
  });

  if (recentHistory.length === 0) {
    return getDefaultPersonalizationSummary();
  }

  const timeWeightedAvg = calculateTimeWeightedAverages(recentHistory, currentDate);
  const adjustmentDirectives = generateAdjustmentDirectives(recentHistory, timeWeightedAvg);
  const inferredPreferences = inferPreferences(recentHistory);
  const commonBlockers = extractCommonBlockers(recentHistory);
  const bestPerformingDayPatterns = extractBestPerformingDayPatterns(recentHistory);
  const recommendedIntensityLevel = recommendIntensityLevel(timeWeightedAvg);
  const recommendedYinDuration = recommendYinDuration(timeWeightedAvg);

  // Calculate analysis period in days
  const oldestPlan = recentHistory[recentHistory.length - 1];
  const analysisPeriodDays = oldestPlan
    ? Math.ceil(
        (currentDate.getTime() - new Date(oldestPlan.planDate).getTime()) /
        (1000 * 60 * 60 * 24)
      )
    : 0;

  const recommendedRecoveryDays =
    recommendedIntensityLevel === 'high' ? 1 : recommendedIntensityLevel === 'moderate' ? 2 : 3;

  const summary = generatePersonalizationSummary(
    recentHistory,
    timeWeightedAvg,
    adjustmentDirectives,
    commonBlockers
  );

  return {
    planCount: recentHistory.length,
    analysisPeriodDays,
    timeWeightedAverage: {
      workoutCompliance: timeWeightedAvg.workoutCompliance,
      yinCompliance: timeWeightedAvg.yinCompliance,
      averageIntensity: timeWeightedAvg.averageIntensity,
      averageEnergy: timeWeightedAvg.averageEnergy,
    },
    adjustmentDirectives,
    inferredPreferences,
    commonBlockers,
    bestPerformingDayPatterns,
    recommendedIntensityLevel,
    recommendedYinDuration,
    recommendedRecoveryDays,
    summary,
  };
}

/**
 * Default personalization summary when no history exists.
 */
function getDefaultPersonalizationSummary(): PersonalizationSummary {
  return {
    planCount: 0,
    analysisPeriodDays: 0,
    timeWeightedAverage: {
      workoutCompliance: 0,
      yinCompliance: 0,
      averageIntensity: 0,
      averageEnergy: 0,
    },
    adjustmentDirectives: [],
    inferredPreferences: [],
    commonBlockers: [],
    bestPerformingDayPatterns: [],
    recommendedIntensityLevel: 'moderate',
    recommendedYinDuration: 15,
    recommendedRecoveryDays: 2,
    summary: 'No historical data available yet. This is your first plan!',
  };
}

/**
 * Build a prompt insertion for the LLM using personalization summary.
 * This will be injected into the generateIntegralWeeklyPlan prompt.
 */
export function buildPersonalizationPromptInsertion(summary: PersonalizationSummary): string {
  if (summary.planCount === 0) {
    return '';
  }

  let insertion = `PERSONALIZATION & ADAPTIVE TUNING:\n`;
  insertion += `Based on ${summary.planCount} previous ${summary.planCount === 1 ? 'plan' : 'plans'} over the last ${summary.analysisPeriodDays} days:\n\n`;

  insertion += `COMPLIANCE HISTORY:\n`;
  insertion += `- Workout Compliance: ${summary.timeWeightedAverage.workoutCompliance.toFixed(1)}%\n`;
  insertion += `- Yin Practice Compliance: ${summary.timeWeightedAverage.yinCompliance.toFixed(1)}%\n`;
  insertion += `- Average Intensity Reported: ${summary.timeWeightedAverage.averageIntensity.toFixed(1)}/10\n`;
  insertion += `- Average Energy Level: ${summary.timeWeightedAverage.averageEnergy.toFixed(1)}/10\n\n`;

  if (summary.adjustmentDirectives.length > 0) {
    insertion += `RECOMMENDED ADJUSTMENTS:\n`;
    summary.adjustmentDirectives.forEach(d => {
      insertion += `- ${d.description} (${d.rationale})\n`;
    });
    insertion += '\n';
  }

  if (summary.commonBlockers.length > 0) {
    insertion += `KNOWN BLOCKERS TO AVOID:\n`;
    insertion += `- ${summary.commonBlockers.join('\n- ')}\n\n`;
  }

  if (summary.bestPerformingDayPatterns.length > 0) {
    insertion += `BEST PERFORMING DAYS (consider prioritizing these):\n`;
    insertion += `- ${summary.bestPerformingDayPatterns.join(', ')}\n\n`;
  }

  insertion += `PERSONALIZATION DIRECTIVES:\n`;
  insertion += `- Recommended Intensity: ${summary.recommendedIntensityLevel}\n`;
  insertion += `- Recommended Yin Practice Duration: ${summary.recommendedYinDuration} min/day\n`;
  insertion += `- Recommended Recovery Days per Week: ${summary.recommendedRecoveryDays}\n`;

  return insertion;
}
