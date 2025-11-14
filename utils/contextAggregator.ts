/**
 * Context Aggregator - Collects all user data for intelligence analysis
 */

import type {
  IntelligenceContext,
  AllPractice,
  IntegratedInsight,
  CompletionRecord,
  KeganStage,
} from '../types';
import { extractWizardSessions } from './sessionSummarizer';

/**
 * Aggregate all user context from app state
 */
export function aggregateUserContext(
  practiceStack: AllPractice[],
  practiceNotes: Record<string, string>,
  integratedInsights: IntegratedInsight[],
  completedToday: Record<string, boolean>,
): IntelligenceContext {
  // Extract wizard sessions from localStorage
  const wizardSessions = extractWizardSessions();

  // Build completion history from recent activity
  const completionHistory: CompletionRecord[] = Object.entries(completedToday).map(
    ([practiceId, completed]) => ({
      practiceId,
      date: new Date().toISOString().split('T')[0],
      completed,
    })
  );

  // Extract pending patterns from insights
  const pendingPatterns = integratedInsights
    .filter((i) => i.status === 'pending')
    .map((i) => i.detectedPattern);

  // Try to extract developmental stage from Kegan sessions
  const developmentalStage = extractDevelopmentalStage(wizardSessions);

  // Try to extract attachment style
  const attachmentStyle = extractAttachmentStyle(wizardSessions);

  // Extract primary challenges from insights and wizard sessions
  const primaryChallenges = extractPrimaryChallenges(integratedInsights, wizardSessions);

  return {
    currentPracticeStack: practiceStack,
    practiceNotes,
    completionHistory,
    wizardSessions,
    integratedInsights,
    pendingPatterns,
    developmentalStage,
    attachmentStyle,
    primaryChallenges,
  };
}

/**
 * Extract developmental stage from Kegan assessment
 */
function extractDevelopmentalStage(wizardSessions: any[]): KeganStage | undefined {
  const keganSession = wizardSessions.find((s) => s.type === 'keganAssessment');
  if (keganSession?.sessionData?.overallInterpretation?.centerOfGravity) {
    return keganSession.sessionData.overallInterpretation.centerOfGravity as KeganStage;
  }
  return undefined;
}

/**
 * Extract attachment style from assessment
 */
function extractAttachmentStyle(wizardSessions: any[]): string | undefined {
  const attachmentSession = wizardSessions.find((s) => s.type === 'attachmentAssessment');
  if (attachmentSession?.sessionData?.assessedStyle) {
    return attachmentSession.sessionData.assessedStyle;
  }
  return undefined;
}

/**
 * Extract primary challenges from insights and sessions
 */
function extractPrimaryChallenges(
  integratedInsights: IntegratedInsight[],
  wizardSessions: any[]
): string[] {
  const challenges = new Set<string>();

  // From integrated insights
  for (const insight of integratedInsights.filter((i) => i.status === 'pending')) {
    if (insight.detectedPattern) {
      challenges.add(insight.detectedPattern);
    }
  }

  // From wizard sessions
  for (const session of wizardSessions.slice(0, 5)) {
    // Most recent 5 sessions
    for (const insight of session.keyInsights) {
      // Extract challenge-related insights
      if (
        insight.toLowerCase().includes('fear') ||
        insight.toLowerCase().includes('pattern') ||
        insight.toLowerCase().includes('challenge') ||
        insight.toLowerCase().includes('struggle')
      ) {
        challenges.add(insight);
      }
    }
  }

  return Array.from(challenges).slice(0, 5); // Limit to top 5
}

/**
 * Generate a hash of the context for cache invalidation
 */
export function hashContext(context: IntelligenceContext): string {
  const key = JSON.stringify({
    stackLength: context.currentPracticeStack.length,
    stackIds: context.currentPracticeStack.map((p) => p.id).sort(),
    insightsCount: context.integratedInsights.length,
    pendingPatternsCount: context.pendingPatterns.length,
    wizardSessionsCount: context.wizardSessions.length,
    lastWizardDate: context.wizardSessions[0]?.date || '',
  });

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return Math.abs(hash).toString(36);
}
