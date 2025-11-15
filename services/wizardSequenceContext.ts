/**
 * Wizard Sequence Context Service
 * Provides historical context when launching wizards
 * Shows users their developmental journey through repeated work
 */

import type { IntegratedInsight } from '../types';

export interface WizardHistoryEntry {
  sessionId: string;
  date: string;
  summary: string;
  keyPattern?: string;
  linkedInsightId?: string;
}

export interface WizardSequenceContext {
  // Previous work
  previousSessions: WizardHistoryEntry[];
  sessionCount: number;
  firstSessionDate: string | null;
  lastSessionDate: string | null;

  // Narrative connections
  buildingOn: string | null;
  patternEvolution: string[];
  suggestedFocus: string | null;

  // Cross-wizard connections
  relatedInsights: Array<{
    insightId: string;
    wizardType: string;
    pattern: string;
    relevance: 'same-pattern' | 'complementary' | 'prerequisite';
  }>;
}

/**
 * Get comprehensive context for a wizard launch
 */
export function getWizardSequenceContext(
  wizardType: string,
  allSessions: any[],
  allInsights: IntegratedInsight[],
  linkedInsightId?: string
): WizardSequenceContext {
  // Find all previous sessions of this wizard type
  const previousSessions = extractSessionHistory(wizardType, allSessions);

  // If launching from an insight, find related work
  const currentInsight = linkedInsightId
    ? allInsights.find(i => i.id === linkedInsightId)
    : null;

  // Find insights with similar patterns
  const relatedInsights = findRelatedInsights(
    wizardType,
    currentInsight,
    allInsights
  );

  // Build narrative
  const buildingOn = generateBuildingOnNarrative(
    previousSessions,
    currentInsight
  );

  const suggestedFocus = generateSuggestedFocus(
    previousSessions,
    relatedInsights,
    wizardType
  );

  const patternEvolution = trackPatternEvolution(
    previousSessions,
    allInsights
  );

  return {
    previousSessions: previousSessions.slice(-5), // Last 5 sessions
    sessionCount: previousSessions.length,
    firstSessionDate: previousSessions[0]?.date || null,
    lastSessionDate: previousSessions[previousSessions.length - 1]?.date || null,
    buildingOn,
    patternEvolution,
    suggestedFocus,
    relatedInsights: relatedInsights.slice(0, 3), // Top 3 related
  };
}

/**
 * Generate "Building on..." narrative
 */
function generateBuildingOnNarrative(
  previousSessions: WizardHistoryEntry[],
  currentInsight: IntegratedInsight | null
): string | null {
  if (previousSessions.length === 0) return null;

  const lastSession = previousSessions[previousSessions.length - 1];
  const date = new Date(lastSession.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });

  if (currentInsight) {
    return `Building on your ${date} discovery: "${currentInsight.detectedPattern}"`;
  }

  if (lastSession.keyPattern) {
    return `Building on your ${date} session about ${lastSession.keyPattern}`;
  }

  if (lastSession.summary) {
    // Extract first sentence or first 80 chars
    const summaryPreview = lastSession.summary.split('.')[0].substring(0, 80);
    return `Continuing from your ${date} session: ${summaryPreview}...`;
  }

  return `Continuing from your ${date} session`;
}

/**
 * Suggest focus areas based on history
 */
function generateSuggestedFocus(
  previousSessions: WizardHistoryEntry[],
  relatedInsights: any[],
  wizardType: string
): string | null {
  // If this is the first session
  if (previousSessions.length === 0) {
    return getFirstTimeGuidance(wizardType);
  }

  // If there are complementary insights from other wizards
  const complementary = relatedInsights.filter(
    i => i.relevance === 'complementary'
  );

  if (complementary.length > 0) {
    return `Consider how this connects to your ${complementary[0].wizardType} work on "${complementary[0].pattern}"`;
  }

  // If same pattern has emerged multiple times
  const recurringPatterns = findRecurringPatterns(previousSessions);
  if (recurringPatterns.length > 0) {
    return `This pattern "${recurringPatterns[0]}" has emerged ${recurringPatterns.length + 1} times. What deeper structure might be at play?`;
  }

  // If user has done this wizard many times
  if (previousSessions.length >= 5) {
    return 'With this much experience, what new depth can you discover today?';
  }

  return null;
}

/**
 * Track how pattern has evolved over time
 */
function trackPatternEvolution(
  previousSessions: WizardHistoryEntry[],
  allInsights: IntegratedInsight[]
): string[] {
  const evolution: string[] = [];

  for (const session of previousSessions) {
    if (session.linkedInsightId) {
      const insight = allInsights.find(i => i.id === session.linkedInsightId);
      if (insight) {
        const date = new Date(session.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
        evolution.push(`${date}: ${insight.detectedPattern}`);
      }
    } else if (session.keyPattern) {
      const date = new Date(session.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      evolution.push(`${date}: ${session.keyPattern}`);
    }
  }

  return evolution;
}

/**
 * Find insights related to current wizard launch
 */
function findRelatedInsights(
  wizardType: string,
  currentInsight: IntegratedInsight | null,
  allInsights: IntegratedInsight[]
): Array<{
  insightId: string;
  wizardType: string;
  pattern: string;
  relevance: 'same-pattern' | 'complementary' | 'prerequisite';
}> {
  const related: any[] = [];

  if (!currentInsight) return related;

  // Find insights from same wizard type (recurring patterns)
  const sameType = allInsights.filter(i =>
    i.mindToolType === wizardType &&
    i.id !== currentInsight.id
  );

  for (const insight of sameType) {
    related.push({
      insightId: insight.id,
      wizardType: insight.mindToolType,
      pattern: insight.detectedPattern,
      relevance: 'same-pattern' as const,
    });
  }

  // Find complementary insights (shadow work pairs with action, etc.)
  const complementary = allInsights.filter(i =>
    i.mindToolType !== wizardType &&
    i.suggestedShadowWork.some(sw =>
      currentInsight.suggestedShadowWork.some(csw =>
        csw.practiceId === sw.practiceId
      )
    )
  );

  for (const insight of complementary) {
    related.push({
      insightId: insight.id,
      wizardType: insight.mindToolType,
      pattern: insight.detectedPattern,
      relevance: 'complementary' as const,
    });
  }

  // Sort by date (most recent first)
  return related.sort((a, b) => {
    const dateA = allInsights.find(i => i.id === a.insightId)?.dateCreated || '';
    const dateB = allInsights.find(i => i.id === b.insightId)?.dateCreated || '';
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });
}

/**
 * Extract session history for a wizard type
 */
function extractSessionHistory(
  wizardType: string,
  allSessions: any[]
): WizardHistoryEntry[] {
  // Map wizard sessions to standardized format
  return allSessions.map(session => ({
    sessionId: session.id,
    date: session.date,
    summary: session.aiSummary || session.summary || '',
    keyPattern: extractKeyPattern(session),
    linkedInsightId: session.linkedInsightId,
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Extract key pattern from session (varies by wizard type)
 */
function extractKeyPattern(session: any): string | undefined {
  // Try common pattern fields
  if (session.trigger) return session.trigger; // 3-2-1
  if (session.partName) return `Part: ${session.partName}`; // IFS
  if (session.decisionText) return session.decisionText; // Bias Detective
  if (session.currentSubject) return session.currentSubject; // Subject-Object
  if (session.conflictDescription) return session.conflictDescription; // Polarity
  if (session.situation) return session.situation; // Perspective Shifter

  return undefined;
}

/**
 * First-time guidance for each wizard type
 */
function getFirstTimeGuidance(wizardType: string): string | null {
  const guidance: Record<string, string> = {
    '3-2-1 Reflection': 'Start with a strong emotional charge or projection onto someone',
    'IFS Session': 'Choose a part that feels active or troubling right now',
    'Bias Detective': 'Pick a recent decision where you felt conflicted',
    'Subject-Object Explorer': 'Notice what you can observe vs. what you are',
    'Perspective-Shifter': 'Choose a viewpoint you typically avoid or resist',
    'Polarity Mapper': 'Identify an either/or dilemma you\'re facing',
    'Kegan Assessment': 'Reflect honestly on how you make meaning of your experience',
    'Relational Pattern': 'Choose a recurring dynamic in your relationships',
    'Big Mind Process': 'Prepare to speak from different voices within',
    'Memory Reconsolidation': 'Choose a belief you know intellectually is false but emotionally feels true',
    'Eight Zones': 'Explore your experience across all quadrants and levels',
    'Jhana Guide': 'Notice the quality of your present-moment awareness',
  };

  return guidance[wizardType] || 'Begin with curiosity and openness';
}

/**
 * Find patterns that have recurred across sessions
 */
function findRecurringPatterns(sessions: WizardHistoryEntry[]): string[] {
  const patternCounts = new Map<string, number>();

  for (const session of sessions) {
    if (session.keyPattern) {
      const normalized = session.keyPattern.toLowerCase();
      const count = patternCounts.get(normalized) || 0;
      patternCounts.set(normalized, count + 1);
    }
  }

  return Array.from(patternCounts.entries())
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([pattern]) => pattern);
}
