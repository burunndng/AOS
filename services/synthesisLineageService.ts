/**
 * Synthesis Lineage Service
 *
 * Tracks the complete data lineage for every insight and recommendation.
 * Enables transparency by recording:
 * - Which wizard sessions contributed to each recommendation
 * - What patterns were detected
 * - Why each practice was recommended
 * - Confidence metrics for each recommendation
 *
 * This service mitigates the Barnum Effect by making the app's reasoning
 * visible and verifiable to users.
 */

import { v4 as uuidv4 } from 'uuid';
import type { IntegratedInsight } from '../types.ts';

/**
 * Represents the lineage of a single recommendation
 */
export interface RecommendationLineage {
  recommendationId: string;
  practiceId: string;
  practiceName: string;

  // Sources
  contributingInsights: {
    insightId: string;
    mindToolType: string;
    mindToolSessionId: string;
    detectedPattern: string;
    confidence: 'high' | 'medium' | 'low';
  }[];

  // Reasoning
  primaryReason: string;
  secondaryReasons?: string[];
  detectedPatterns: string[];

  // Context
  recommendationType: 'shadow-work' | 'next-step' | 'high-impact' | 'sequential';
  sequenceOrder?: number;
  integrationTiming?: 'immediate' | 'after-shadow' | 'after-foundation' | 'ongoing';

  // Metadata
  generatedAt: string;
  generatedBy: 'grok' | 'gemini';
  confidenceScore: number; // 0-1
  supportingDataPoints?: string[];
}

/**
 * Complete lineage for a synthesis (batch of recommendations)
 */
export interface SynthesisLineage {
  synthesisId: string;
  userId: string;

  // What triggered this synthesis
  trigger: {
    type: 'new-insight' | 'batch-insights' | 'user-requested' | 'periodic';
    insightIds: string[];
  };

  // The recommendations and their lineage
  recommendations: RecommendationLineage[];

  // Overall reasoning
  synthesisReasoning: string;
  overallContext: string;
  developmentalEdge: string;

  // Metadata
  generatedAt: string;
  generatedBy: 'grok' | 'gemini';

  // Traceability
  rawInput?: {
    insightSummaries: string[];
    userProfileContext?: string;
    availablePractices?: number;
  };
}

/**
 * In-memory store for lineage data
 * In production, this would be persisted to database
 */
const lineageStore = new Map<string, SynthesisLineage>();
const recommendationIndex = new Map<string, RecommendationLineage>();

/**
 * Record a recommendation with full lineage information
 */
export function recordRecommendationLineage(
  recommendationId: string,
  practiceId: string,
  practiceName: string,
  options: {
    contributingInsights: {
      insightId: string;
      mindToolType: string;
      mindToolSessionId: string;
      detectedPattern: string;
      confidence: 'high' | 'medium' | 'low';
    }[];
    primaryReason: string;
    secondaryReasons?: string[];
    detectedPatterns: string[];
    recommendationType: 'shadow-work' | 'next-step' | 'high-impact' | 'sequential';
    sequenceOrder?: number;
    integrationTiming?: 'immediate' | 'after-shadow' | 'after-foundation' | 'ongoing';
    generatedBy: 'grok' | 'gemini';
    confidenceScore?: number;
    supportingDataPoints?: string[];
  }
): RecommendationLineage {
  const lineage: RecommendationLineage = {
    recommendationId,
    practiceId,
    practiceName,
    contributingInsights: options.contributingInsights,
    primaryReason: options.primaryReason,
    secondaryReasons: options.secondaryReasons,
    detectedPatterns: options.detectedPatterns,
    recommendationType: options.recommendationType,
    sequenceOrder: options.sequenceOrder,
    integrationTiming: options.integrationTiming,
    generatedAt: new Date().toISOString(),
    generatedBy: options.generatedBy,
    confidenceScore: options.confidenceScore ?? 0.75,
    supportingDataPoints: options.supportingDataPoints,
  };

  recommendationIndex.set(recommendationId, lineage);
  return lineage;
}

/**
 * Record a complete synthesis with all recommendations
 */
export function recordSynthesisLineage(
  userId: string,
  options: {
    trigger: {
      type: 'new-insight' | 'batch-insights' | 'user-requested' | 'periodic';
      insightIds: string[];
    };
    recommendations: RecommendationLineage[];
    synthesisReasoning: string;
    overallContext: string;
    developmentalEdge: string;
    generatedBy: 'grok' | 'gemini';
    rawInput?: {
      insightSummaries: string[];
      userProfileContext?: string;
      availablePractices?: number;
    };
  }
): SynthesisLineage {
  const synthesisId = uuidv4();

  const lineage: SynthesisLineage = {
    synthesisId,
    userId,
    trigger: options.trigger,
    recommendations: options.recommendations,
    synthesisReasoning: options.synthesisReasoning,
    overallContext: options.overallContext,
    developmentalEdge: options.developmentalEdge,
    generatedAt: new Date().toISOString(),
    generatedBy: options.generatedBy,
    rawInput: options.rawInput,
  };

  lineageStore.set(synthesisId, lineage);

  // Index all recommendations
  options.recommendations.forEach(rec => {
    recommendationIndex.set(rec.recommendationId, rec);
  });

  return lineage;
}

/**
 * Retrieve lineage for a specific recommendation
 */
export function getRecommendationLineage(
  recommendationId: string
): RecommendationLineage | undefined {
  return recommendationIndex.get(recommendationId);
}

/**
 * Retrieve complete synthesis lineage
 */
export function getSynthesisLineage(synthesisId: string): SynthesisLineage | undefined {
  return lineageStore.get(synthesisId);
}

/**
 * Retrieve all syntheses for a user
 */
export function getUserSyntheses(userId: string): SynthesisLineage[] {
  return Array.from(lineageStore.values()).filter(s => s.userId === userId);
}

/**
 * Get explanation for a recommendation in user-friendly format
 */
export function getRecommendationExplanation(
  recommendationId: string
): {
  isValid: boolean;
  explanation?: {
    recommendation: string;
    whyThis: string[];
    sources: {
      wizard: string;
      pattern: string;
      confidence: string;
    }[];
    sequence: string;
    confidence: string;
  };
  message?: string;
} {
  const lineage = getRecommendationLineage(recommendationId);

  if (!lineage) {
    return {
      isValid: false,
      message: 'No explanation available for this recommendation',
    };
  }

  return {
    isValid: true,
    explanation: {
      recommendation: `${lineage.practiceName}`,
      whyThis: [
        lineage.primaryReason,
        ...(lineage.secondaryReasons || []),
      ],
      sources: lineage.contributingInsights.map(insight => ({
        wizard: insight.mindToolType,
        pattern: insight.detectedPattern,
        confidence: insight.confidence,
      })),
      sequence: lineage.integrationTiming || 'As appropriate',
      confidence: formatConfidence(lineage.confidenceScore),
    },
  };
}

/**
 * Get explanation for an entire synthesis
 */
export function getSynthesisExplanation(synthesisId: string): {
  isValid: boolean;
  explanation?: {
    context: string;
    developmentalEdge: string;
    recommendations: Array<{
      practice: string;
      reason: string;
      sources: number;
      confidence: string;
    }>;
    overallStrategy: string;
  };
  message?: string;
} {
  const lineage = getSynthesisLineage(synthesisId);

  if (!lineage) {
    return {
      isValid: false,
      message: 'No explanation available for this synthesis',
    };
  }

  return {
    isValid: true,
    explanation: {
      context: lineage.overallContext,
      developmentalEdge: lineage.developmentalEdge,
      recommendations: lineage.recommendations.map(rec => ({
        practice: rec.practiceName,
        reason: rec.primaryReason,
        sources: rec.contributingInsights.length,
        confidence: formatConfidence(rec.confidenceScore),
      })),
      overallStrategy: lineage.synthesisReasoning,
    },
  };
}

/**
 * Format confidence score for display
 */
function formatConfidence(score: number): string {
  if (score >= 0.85) return 'High confidence';
  if (score >= 0.65) return 'Medium-high confidence';
  if (score >= 0.5) return 'Moderate confidence';
  return 'Lower confidence (exploratory)';
}

/**
 * Create lineage from an IntegratedInsight
 * Useful for tracking individual insights before synthesis
 */
export function createInsightLineage(
  insight: IntegratedInsight,
  generatedBy: 'grok' | 'gemini'
): {
  shadowWorkLineages: RecommendationLineage[];
  nextStepsLineages: RecommendationLineage[];
} {
  const shadowWorkLineages = insight.suggestedShadowWork.map((rec, idx) =>
    recordRecommendationLineage(
      `${insight.id}-shadow-${idx}`,
      rec.practiceId,
      rec.practiceName,
      {
        contributingInsights: [
          {
            insightId: insight.id,
            mindToolType: insight.mindToolType,
            mindToolSessionId: insight.mindToolSessionId,
            detectedPattern: insight.detectedPattern,
            confidence: 'high',
          },
        ],
        primaryReason: rec.rationale,
        detectedPatterns: [insight.detectedPattern],
        recommendationType: 'shadow-work',
        sequenceOrder: idx,
        integrationTiming: idx === 0 ? 'immediate' : 'after-shadow',
        generatedBy,
        confidenceScore: 0.85,
      }
    )
  );

  const nextStepsLineages = insight.suggestedNextSteps.map((rec, idx) =>
    recordRecommendationLineage(
      `${insight.id}-next-${idx}`,
      rec.practiceId,
      rec.practiceName,
      {
        contributingInsights: [
          {
            insightId: insight.id,
            mindToolType: insight.mindToolType,
            mindToolSessionId: insight.mindToolSessionId,
            detectedPattern: insight.detectedPattern,
            confidence: 'high',
          },
        ],
        primaryReason: rec.rationale,
        detectedPatterns: [insight.detectedPattern],
        recommendationType: 'next-step',
        sequenceOrder: idx,
        integrationTiming: 'after-foundation',
        generatedBy,
        confidenceScore: 0.8,
      }
    )
  );

  return { shadowWorkLineages, nextStepsLineages };
}

/**
 * Export lineage data for inspection/debugging
 */
export function exportLineageData(synthesisId?: string): {
  syntheses: SynthesisLineage[];
  recommendations: Map<string, RecommendationLineage>;
} {
  if (synthesisId) {
    const synthesis = getSynthesisLineage(synthesisId);
    return {
      syntheses: synthesis ? [synthesis] : [],
      recommendations: new Map(
        synthesis?.recommendations.map(r => [r.recommendationId, r]) || []
      ),
    };
  }

  return {
    syntheses: Array.from(lineageStore.values()),
    recommendations: recommendationIndex,
  };
}

/**
 * Clear all lineage data (for testing/reset)
 */
export function clearAllLineageData(): void {
  lineageStore.clear();
  recommendationIndex.clear();
}
