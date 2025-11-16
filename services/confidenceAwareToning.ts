/**
 * Confidence-Aware Toning Service
 *
 * Integrates confidence validation and tonal shifting to ensure AI language
 * matches actual data strength. Prevents overconfidence on weak data while
 * supporting definitive language when evidence is strong.
 *
 * This service coordinates between:
 * - confidenceValidator.ts (detects confidence mismatches)
 * - tonalShifter.ts (adjusts language tone)
 */

import type { ConfidenceValidationResult, TonalShiftResult } from '../types';
import {
  validateConfidence,
  detectConfidenceLanguage,
  calculateConfidenceFromDataVolume,
  type ConfidenceLanguageDetection,
} from './confidenceValidator';
import {
  shiftTone,
  determineTone,
  formatInsightWithTone,
  formatRecommendationWithTone,
  formatNextStepWithTone,
  type ToneType,
} from './tonalShifter';

/**
 * Result of full confidence-aware toning operation
 */
export interface ConfidenceAwareTonedResult {
  originalText: string;
  tonedText: string;
  confidenceScore: number;
  detectionResults: ConfidenceLanguageDetection;
  validationResults: ConfidenceValidationResult;
  tonalShiftApplied?: TonalShiftResult;
  recommendations: {
    isAccurate: boolean;
    shouldApplyTone: boolean;
    suggestedTone: ToneType;
  };
}

/**
 * Apply confidence-aware toning to AI-generated insight text
 * This is the main entry point for the service
 */
export function applyConfidenceAwareToning(
  text: string,
  confidenceScore: number,
  options?: {
    dataPoints?: number;
    autoCorrect?: boolean; // If true, applies tone shifts automatically
    verbose?: boolean; // If true, returns detailed analysis
  }
): ConfidenceAwareTonedResult {
  const autoCorrect = options?.autoCorrect ?? true;
  const verbose = options?.verbose ?? false;

  // Step 1: Detect what confidence language is present
  const detectionResults = detectConfidenceLanguage(text);

  // Step 2: Validate confidence
  const validationResults = validateConfidence(
    text,
    confidenceScore,
    options?.dataPoints
  );

  // Step 3: Determine what tone should be used
  const suggestedTone = determineTone(confidenceScore);

  // Step 4: Optionally apply tone shift
  let tonedText = text;
  let tonalShiftApplied: TonalShiftResult | undefined;

  if (autoCorrect && !validationResults.isValid) {
    const tonalResult = shiftTone(text, confidenceScore);
    tonedText = tonalResult.shiftedText;
    tonalShiftApplied = tonalResult;

    if (verbose) {
      console.log(`[ConfidenceAwareToning] Applied tone shift: ${tonalResult.changesApplied.join('; ')}`);
    }
  }

  return {
    originalText: text,
    tonedText,
    confidenceScore,
    detectionResults,
    validationResults,
    tonalShiftApplied,
    recommendations: {
      isAccurate: validationResults.isValid,
      shouldApplyTone: !validationResults.isValid,
      suggestedTone,
    },
  };
}

/**
 * Tone an entire guidance object with confidence awareness
 */
export function applyConfidenceAwareToningToGuidance(
  guidance: {
    synthesis: string;
    primaryFocus: string;
    recommendations?: {
      nextWizard?: { reason: string };
      insightWork?: { pattern: string; approachSuggestion: string };
    };
    rawMarkdown?: string;
  },
  confidenceScore: number,
  options?: {
    autoCorrect?: boolean;
    verbose?: boolean;
  }
): ConfidenceAwareTonedResult {
  // For guidance, we apply toning to the synthesis and key sections
  const keyText = [
    guidance.synthesis,
    guidance.primaryFocus,
    guidance.recommendations?.nextWizard?.reason || '',
    guidance.recommendations?.insightWork?.approachSuggestion || '',
  ]
    .filter(t => t)
    .join('\n\n');

  return applyConfidenceAwareToning(keyText, confidenceScore, options);
}

/**
 * Check if text needs confidence-aware toning
 */
export function needsConfidenceAwareToning(
  text: string,
  confidenceScore: number,
  dataPoints?: number
): {
  needed: boolean;
  reason?: string;
  mismatchType?: 'overconfident' | 'underconfident';
} {
  const validation = validateConfidence(text, confidenceScore, dataPoints);

  if (!validation.isValid) {
    return {
      needed: true,
      reason: validation.suggestion,
      mismatchType: validation.mismatchType,
    };
  }

  return { needed: false };
}

/**
 * Generate a confidence-appropriate disclaimer or context
 */
export function generateConfidenceContext(
  confidenceScore: number,
  dataPoints?: number,
  dataContext?: {
    totalSessions?: number;
    sessionsInLastWeek?: number;
    relatedInsights?: number;
  }
): string {
  const tone = determineTone(confidenceScore);

  if (tone === 'exploratory') {
    const sessionText = dataPoints ? ` after ${dataPoints} session${dataPoints === 1 ? '' : 's'}` : '';
    return `💡 **Early-stage pattern.** This is based on emerging data${sessionText}. More sessions will clarify these insights.`;
  } else if (tone === 'observational') {
    return `📊 **Observed pattern.** This is based on multiple data points. Consider it a strong suggestion worth exploring further.`;
  } else {
    return `✓ **Supported by evidence.** This pattern is consistent across your data and warrants direct attention.`;
  }
}

/**
 * Calculate if data volume supports the claimed confidence level
 */
export function validateDataSufficiency(
  totalSessions: number,
  sessionsInLastWeek: number,
  relatedInsights: number,
  claimedConfidenceScore: number
): {
  isSufficient: boolean;
  recommendedConfidence: number;
  gap?: number;
} {
  const calculatedConfidence = calculateConfidenceFromDataVolume(
    totalSessions,
    sessionsInLastWeek,
    relatedInsights
  );

  const isSufficient = claimedConfidenceScore <= calculatedConfidence;
  const gap = isSufficient ? 0 : claimedConfidenceScore - calculatedConfidence;

  return {
    isSufficient,
    recommendedConfidence: calculatedConfidence,
    gap,
  };
}

/**
 * Apply formatting helpers with confidence awareness
 */
export const formatWithTone = {
  insight: formatInsightWithTone,
  recommendation: formatRecommendationWithTone,
  nextStep: formatNextStepWithTone,
};

/**
 * Export useful utilities
 */
export {
  calculateConfidenceFromDataVolume,
  detectConfidenceLanguage,
  validateConfidence,
} from './confidenceValidator';

export { shiftTone, buildToneInstructions, determineTone, type ToneType } from './tonalShifter';
