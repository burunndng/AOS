/**
 * Insight Context Service
 * Provides unified access to insights across all features
 * Enables cross-feature integration and pattern tracking
 *
 * This service:
 * 1. Aggregates insights from all wizards
 * 2. Finds relevant insights for current context (practice, user state, etc.)
 * 3. Tracks practice outcomes related to insights
 * 4. Shows pattern evolution over time
 */

import type { IntegratedInsight, AllPractice } from '../types.ts';
import { enrichInsightWithAIGuidance } from './geminiRecommendationService.ts';

/**
 * Find insights relevant to a specific practice
 * Used to show users why/how a practice relates to their patterns
 */
export function getInsightsForPractice(
  practiceId: string,
  allInsights: IntegratedInsight[]
): Array<IntegratedInsight & { relevanceType: 'shadow' | 'next' }> {
  const relevantInsights: Array<IntegratedInsight & { relevanceType: 'shadow' | 'next' }> = [];

  for (const insight of allInsights) {
    // Check if practice is suggested as shadow work
    if (insight.suggestedShadowWork.some((sw) => sw.practiceId === practiceId)) {
      relevantInsights.push({ ...insight, relevanceType: 'shadow' });
    }
    // Check if practice is suggested as next step
    else if (insight.suggestedNextSteps.some((ns) => ns.practiceId === practiceId)) {
      relevantInsights.push({ ...insight, relevanceType: 'next' });
    }
  }

  return relevantInsights;
}

/**
 * Get all insights for a specific wizard type
 * Useful for showing insight history in wizard components
 */
export function getInsightsForWizardType(
  wizardType: IntegratedInsight['mindToolType'],
  allInsights: IntegratedInsight[]
): IntegratedInsight[] {
  return allInsights.filter((insight) => insight.mindToolType === wizardType);
}

/**
 * Find insights that suggest a specific practice
 * Shows all the patterns that recommend doing a practice
 */
export function getPatternsThatRecommendPractice(
  practiceId: string,
  allInsights: IntegratedInsight[]
): Array<{
  insight: IntegratedInsight;
  asType: 'shadow' | 'next';
  rationale: string;
}> {
  const patterns: Array<{
    insight: IntegratedInsight;
    asType: 'shadow' | 'next';
    rationale: string;
  }> = [];

  for (const insight of allInsights) {
    // Check shadow work
    const shadowRec = insight.suggestedShadowWork.find((sw) => sw.practiceId === practiceId);
    if (shadowRec) {
      patterns.push({
        insight,
        asType: 'shadow',
        rationale: shadowRec.rationale,
      });
    }

    // Check next steps
    const nextRec = insight.suggestedNextSteps.find((ns) => ns.practiceId === practiceId);
    if (nextRec) {
      patterns.push({
        insight,
        asType: 'next',
        rationale: nextRec.rationale,
      });
    }
  }

  return patterns;
}

/**
 * Get pending insights (not yet addressed)
 * Used for Dashboard to show actionable insights
 */
export function getPendingInsights(allInsights: IntegratedInsight[]): IntegratedInsight[] {
  return allInsights.filter((insight) => insight.status === 'pending').sort((a, b) => {
    return new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime();
  });
}

/**
 * Get addressed insights (completed work on the pattern)
 * Shows user's progress and pattern resolution
 */
export function getAddressedInsights(allInsights: IntegratedInsight[]): IntegratedInsight[] {
  return allInsights.filter((insight) => insight.status === 'addressed').sort((a, b) => {
    return new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime();
  });
}

/**
 * Get insights that have outcome tracking (pattern improvement detected)
 * Shows areas where user's practice is making a difference
 */
export function getInsightsWithOutcome(allInsights: IntegratedInsight[]): IntegratedInsight[] {
  return allInsights.filter((insight) => insight.practiceOutcome && insight.practiceOutcome.length > 0);
}

/**
 * Calculate pattern improvement metrics
 * Shows overall progress in addressing detected patterns
 */
export function calculatePatternMetrics(allInsights: IntegratedInsight[]): {
  total: number;
  pending: number;
  addressed: number;
  withOutcome: number;
  improved: number;
  stable: number;
  worsened: number;
  addressedRate: number;
} {
  const addressed = allInsights.filter((i) => i.status === 'addressed').length;
  const improved = allInsights.filter(
    (i) => i.practiceOutcome?.some((o) => o.patternImprovement === 'improved')
  ).length;
  const stable = allInsights.filter(
    (i) => i.practiceOutcome?.some((o) => o.patternImprovement === 'stable')
  ).length;
  const worsened = allInsights.filter(
    (i) => i.practiceOutcome?.some((o) => o.patternImprovement === 'worsened')
  ).length;
  const withOutcome = allInsights.filter((i) => i.practiceOutcome && i.practiceOutcome.length > 0).length;

  return {
    total: allInsights.length,
    pending: allInsights.length - addressed,
    addressed,
    withOutcome,
    improved,
    stable,
    worsened,
    addressedRate: allInsights.length > 0 ? Math.round((addressed / allInsights.length) * 100) : 0,
  };
}

/**
 * Get related insights for a practice
 * Shows the insight journey for a practice (which patterns recommend it, outcomes)
 */
export function getPracticeInsightJourney(
  practiceId: string,
  allInsights: IntegratedInsight[]
): {
  recommendedBy: Array<IntegratedInsight & { asType: 'shadow' | 'next'; rationale: string }>;
  outcomes: Array<{ insight: IntegratedInsight; improvement: string; frequency: number }>;
  impact: {
    patternsAddressed: number;
    estimatedImpactScore: number;
  };
} {
  const recommendedBy: Array<IntegratedInsight & { asType: 'shadow' | 'next'; rationale: string }> = [];
  const outcomes: Array<{ insight: IntegratedInsight; improvement: string; frequency: number }> = [];

  for (const insight of allInsights) {
    // Collect recommendations
    const shadowRec = insight.suggestedShadowWork.find((sw) => sw.practiceId === practiceId);
    if (shadowRec) {
      recommendedBy.push({
        ...insight,
        asType: 'shadow',
        rationale: shadowRec.rationale,
      });
    }

    const nextRec = insight.suggestedNextSteps.find((ns) => ns.practiceId === practiceId);
    if (nextRec) {
      recommendedBy.push({
        ...insight,
        asType: 'next',
        rationale: nextRec.rationale,
      });
    }

    // Collect outcomes
    const session = insight.relatedPracticeSessions?.find((s) => s.practiceId === practiceId);
    const outcome = insight.practiceOutcome?.find((o) => o.practiceId === practiceId);
    if (session && outcome) {
      outcomes.push({
        insight,
        improvement: outcome.patternImprovement,
        frequency: session.frequency,
      });
    }
  }

  // Calculate impact score
  // More patterns recommending + more positive outcomes = higher impact
  const positiveOutcomes = outcomes.filter((o) => o.improvement === 'improved').length;
  const totalRecommendations = recommendedBy.length;
  const estimatedImpactScore = Math.round((positiveOutcomes / Math.max(totalRecommendations, 1)) * 100);

  return {
    recommendedBy,
    outcomes,
    impact: {
      patternsAddressed: recommendedBy.length,
      estimatedImpactScore,
    },
  };
}

/**
 * Get practice recommendations from insights
 * Used by BrowseTab to show why a practice matters
 */
export function getRecommendationContextForPractice(
  practice: AllPractice,
  allInsights: IntegratedInsight[]
): {
  relatedPatterns: string[];
  shadowWorkFor: string[];
  nextStepsFor: string[];
  relevanceScore: number;
} {
  const relatedPatterns: string[] = [];
  const shadowWorkFor: string[] = [];
  const nextStepsFor: string[] = [];

  for (const insight of allInsights) {
    const shadowRec = insight.suggestedShadowWork.find((sw) => sw.practiceId === practice.id);
    const nextRec = insight.suggestedNextSteps.find((ns) => ns.practiceId === practice.id);

    if (shadowRec) {
      relatedPatterns.push(insight.detectedPattern);
      shadowWorkFor.push(insight.detectedPattern);
    }

    if (nextRec) {
      relatedPatterns.push(insight.detectedPattern);
      nextStepsFor.push(insight.detectedPattern);
    }
  }

  // Remove duplicates
  const uniquePatterns = [...new Set(relatedPatterns)];

  // Relevance score: how many patterns recommend this practice
  const relevanceScore = Math.min(
    100,
    Math.round((relatedPatterns.length / Math.max(allInsights.length, 1)) * 100)
  );

  return {
    relatedPatterns: uniquePatterns,
    shadowWorkFor,
    nextStepsFor,
    relevanceScore,
  };
}

/**
 * Find practices that address multiple patterns
 * These are high-impact practices that work across different development areas
 */
export function getHighImpactPractices(
  allInsights: IntegratedInsight[],
  allPractices: AllPractice[],
  minPatternsCount: number = 3
): Array<AllPractice & { patternCount: number; asType: ('shadow' | 'next')[] }> {
  const practicePatternMap: Map<
    string,
    { count: number; types: Set<'shadow' | 'next'> }
  > = new Map();

  // Count how many patterns recommend each practice
  for (const insight of allInsights) {
    for (const sw of insight.suggestedShadowWork) {
      const current = practicePatternMap.get(sw.practiceId) || { count: 0, types: new Set() };
      current.count++;
      current.types.add('shadow');
      practicePatternMap.set(sw.practiceId, current);
    }

    for (const ns of insight.suggestedNextSteps) {
      const current = practicePatternMap.get(ns.practiceId) || { count: 0, types: new Set() };
      current.count++;
      current.types.add('next');
      practicePatternMap.set(ns.practiceId, current);
    }
  }

  // Filter practices that address multiple patterns
  const highImpact: Array<AllPractice & { patternCount: number; asType: ('shadow' | 'next')[] }> = [];

  for (const practice of allPractices) {
    const patternData = practicePatternMap.get(practice.id);
    if (patternData && patternData.count >= minPatternsCount) {
      highImpact.push({
        ...practice,
        patternCount: patternData.count,
        asType: Array.from(patternData.types),
      });
    }
  }

  // Sort by pattern count (highest first)
  return highImpact.sort((a, b) => b.patternCount - a.patternCount);
}

/**
 * Enrich an insight with AI-powered practice guidance
 * Provides sequencing, timing, and integration tips using Gemini
 *
 * This is Option B: Enhanced recommendations with AI guidance
 */
export async function enrichInsightWithGuidance(
  insight: IntegratedInsight,
  wizardType: string,
  sessionData: Record<string, any>
): Promise<{
  insight: IntegratedInsight;
  guidance: string;
  practiceSequence: string[];
  confidence: number;
}> {
  try {
    const { guidance, practiceSequence, confidence } = await enrichInsightWithAIGuidance(
      insight.detectedPattern,
      wizardType,
      sessionData
    );

    return {
      insight,
      guidance,
      practiceSequence,
      confidence
    };
  } catch (error) {
    console.error('[InsightContext] Error enriching insight with guidance:', error);
    // Fallback: return insight without enhanced guidance
    return {
      insight,
      guidance: `Based on your detected pattern "${insight.detectedPattern}", we recommend exploring the shadow work and next step practices linked to this insight.`,
      practiceSequence: [
        ...insight.suggestedShadowWork.map(s => s.practiceName),
        ...insight.suggestedNextSteps.map(n => n.practiceName)
      ],
      confidence: 0.80
    };
  }
}

/**
 * Get wizard sequence context - MVP version
 * Shows simple "last session" info to help users build on previous work
 */
export interface WizardSequenceContext {
  totalSessions: number;
  lastSessionDate: string;
  lastSessionSummary: string;
  progressionNote: string;
}

export function getWizardSequenceContext(
  wizardType: IntegratedInsight['mindToolType'],
  allInsights: IntegratedInsight[]
): WizardSequenceContext | null {
  // Get all insights for this wizard type, sorted by date
  const wizardInsights = allInsights
    .filter(insight => insight.mindToolType === wizardType)
    .sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime());

  if (wizardInsights.length === 0) {
    return null; // First time using this wizard
  }

  const lastInsight = wizardInsights[0];
  const totalSessions = wizardInsights.length;

  // Format date nicely
  const lastDate = new Date(lastInsight.dateCreated);
  const daysSince = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  let dateString: string;
  if (daysSince === 0) dateString = 'earlier today';
  else if (daysSince === 1) dateString = 'yesterday';
  else if (daysSince < 7) dateString = `${daysSince} days ago`;
  else if (daysSince < 30) dateString = `${Math.floor(daysSince / 7)} weeks ago`;
  else dateString = lastDate.toLocaleDateString();

  // Create progression note
  let progressionNote: string;
  if (totalSessions === 1) {
    progressionNote = `You explored: "${lastInsight.detectedPattern}"`;
  } else if (totalSessions === 2) {
    progressionNote = `Building on your previous session where you explored: "${lastInsight.detectedPattern}"`;
  } else {
    progressionNote = `This is your ${totalSessions}th session. Last time you explored: "${lastInsight.detectedPattern}"`;
  }

  return {
    totalSessions,
    lastSessionDate: dateString,
    lastSessionSummary: lastInsight.mindToolShortSummary,
    progressionNote
  };
}
