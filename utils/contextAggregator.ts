/**
 * Context Aggregator - Collects all user data for intelligence analysis
 */

import type {
  IntelligenceContext,
  AllPractice,
  IntegratedInsight,
  CompletionRecord,
  KeganStage,
  PlanHistoryEntry,
} from '../types';
import { extractWizardSessions } from './sessionSummarizer';
import { generateText } from '../services/geminiService';

/**
 * User profile containing analyzed preferences, patterns, and experience
 */
export interface UserProfile {
  preferredModalities: {
    mind: number;
    body: number;
    spirit: number;
    shadow: number;
  };
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  recurringPatterns: string[];
  preferredIntensity: 'low' | 'moderate' | 'high' | 'variable';
  energyResponseToPractice: {
    highIntensityFeedback: string;
    lowIntensityFeedback: string;
    averageEnergyLevel: number;
  };
  commonBlockers: string[];
  practiceComplianceRate: number;
  primaryFocusArea?: string;
  developmentalStage?: KeganStage;
  attachmentStyle?: string;
  sentimentSummary?: {
    averageMoodScore: number; // -1.0 to 1.0 scale
    moodTrend: 'improving' | 'declining' | 'stable' | 'variable';
    recentMoodKeywords: string[]; // e.g., ['stress', 'anxiety', 'joy']
    lastAnalyzedDate: string;
  };
}

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
 * Analyze daily notes for sentiment and mood trends
 * Returns mood score, trend, and keywords for use in personalized recommendations
 */
async function analyzeDailyNotesSentiment(
  dailyNotes: Record<string, string>
): Promise<{
  averageMoodScore: number;
  moodTrend: 'improving' | 'declining' | 'stable' | 'variable';
  recentMoodKeywords: string[];
} | null> {
  // Return null if fewer than 3 notes available (per spec)
  const noteCount = Object.keys(dailyNotes || {}).length;
  if (noteCount < 3) {
    return null;
  }

  const sentiments: number[] = [];
  const allKeywords = new Map<string, number>();

  // Analyze the last 14 notes for sentiment (per spec)
  const recentNotes = Object.entries(dailyNotes)
    .sort((a, b) => (b[0] > a[0] ? 1 : -1))
    .slice(0, 14);

  for (const [_date, noteText] of recentNotes) {
    try {
      const prompt = `Analyze the following daily note for emotional sentiment and extract up to 3 key mood-related keywords. Return a JSON object with:
{
  "sentimentScore": number from -1.0 (very negative) to 1.0 (very positive),
  "keywords": string[] of mood-related keywords (e.g., "stressed", "hopeful", "energized")
}

Daily note: "${noteText}"

Return ONLY the JSON object.`;

      const response = await generateText(prompt);
      const parsed = JSON.parse(response);

      sentiments.push(parsed.sentimentScore || 0);

      // Aggregate keywords
      for (const keyword of parsed.keywords || []) {
        allKeywords.set(keyword, (allKeywords.get(keyword) || 0) + 1);
      }
    } catch (e) {
      console.warn('Error analyzing note sentiment:', e);
      sentiments.push(0); // Neutral fallback
    }
  }

  // Calculate average mood score
  const averageMoodScore =
    sentiments.length > 0
      ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length
      : 0;

  // Determine mood trend by comparing recent (last 3) to older (previous 3-7)
  let moodTrend: 'improving' | 'declining' | 'stable' | 'variable' = 'stable';
  if (sentiments.length >= 3) {
    const recentAvg =
      sentiments.slice(0, 3).reduce((a, b) => a + b, 0) / Math.min(3, sentiments.length);
    const olderAvg =
      sentiments.length > 3
        ? sentiments.slice(3).reduce((a, b) => a + b, 0) / (sentiments.length - 3)
        : recentAvg;

    const difference = recentAvg - olderAvg;
    // Use 0.15 threshold for improving/declining detection (per spec)
    if (difference > 0.15) {
      moodTrend = 'improving';
    } else if (difference < -0.15) {
      moodTrend = 'declining';
    } else if (Math.abs(difference) > 0.1) {
      moodTrend = 'variable';
    }
  }

  // Get top 3 keywords
  const recentMoodKeywords = Array.from(allKeywords.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([keyword]) => keyword);

  return {
    averageMoodScore: Math.round(averageMoodScore * 100) / 100,
    moodTrend,
    recentMoodKeywords,
  };
}

/**
 * Build comprehensive user profile from historical data
 * Analyzes completion history, plan feedback, and insights to understand preferences and patterns
 */
export async function buildUserProfile(
  completionHistory: CompletionRecord[],
  integratedInsights: IntegratedInsight[],
  planHistory: PlanHistoryEntry[],
  currentPracticeStack: AllPractice[],
  wizardSessions: any[],
  dailyNotes?: Record<string, string>
): Promise<UserProfile> {
  // Calculate modality preferences from completion history
  const modalityCount = { mind: 0, body: 0, spirit: 0, shadow: 0 };
  const practiceModalities: Record<string, string> = {};

  // Build modality map from current stack
  for (const practice of currentPracticeStack) {
    if ('module' in practice && practice.module) {
      practiceModalities[practice.id] = practice.module;
    }
  }

  // Count completions by modality
  for (const record of completionHistory) {
    const modality = practiceModalities[record.practiceId];
    if (modality && record.completed) {
      modalityCount[modality as keyof typeof modalityCount]++;
    }
  }

  const totalCompletions = Object.values(modalityCount).reduce((a, b) => a + b, 0);
  const preferredModalities = {
    mind: totalCompletions > 0 ? modalityCount.mind / totalCompletions : 0.25,
    body: totalCompletions > 0 ? modalityCount.body / totalCompletions : 0.25,
    spirit: totalCompletions > 0 ? modalityCount.spirit / totalCompletions : 0.25,
    shadow: totalCompletions > 0 ? modalityCount.shadow / totalCompletions : 0.25,
  };

  // Calculate practice compliance rate
  const completedCount = completionHistory.filter((r) => r.completed).length;
  const practiceComplianceRate =
    completionHistory.length > 0 ? completedCount / completionHistory.length : 0;

  // Determine experience level based on insight count and plan history
  let experienceLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
  if (integratedInsights.length >= 10 || planHistory.length >= 3) {
    experienceLevel = 'advanced';
  } else if (integratedInsights.length >= 5 || planHistory.length >= 1) {
    experienceLevel = 'intermediate';
  }

  // Extract recurring patterns from insights
  const recurringPatterns: string[] = [];
  const patternFrequency: Record<string, number> = {};

  for (const insight of integratedInsights) {
    const pattern = insight.detectedPattern.toLowerCase();
    patternFrequency[pattern] = (patternFrequency[pattern] || 0) + 1;
  }

  for (const [pattern, frequency] of Object.entries(patternFrequency)) {
    if (frequency >= 2) {
      recurringPatterns.push(pattern);
    }
  }

  // Analyze energy response to practices from plan history
  let highIntensityFeedback = 'Data pending';
  let lowIntensityFeedback = 'Data pending';
  let totalIntensity = 0;
  let totalEnergy = 0;
  let feedbackCount = 0;

  for (const entry of planHistory) {
    if (entry.aggregateMetrics) {
      totalIntensity += entry.aggregateMetrics.averageIntensity || 0;
      totalEnergy += entry.aggregateMetrics.averageEnergy || 0;
      feedbackCount++;

      // Analyze blockers for feedback patterns
      if (entry.aggregateMetrics.totalBlockerDays > 3) {
        if (entry.aggregateMetrics.averageIntensity > 7) {
          highIntensityFeedback = 'User reports fatigue after high-intensity practices';
        }
      }
    }
  }

  const averageEnergyLevel = feedbackCount > 0 ? totalEnergy / feedbackCount : 5;
  const averageIntensity = feedbackCount > 0 ? totalIntensity / feedbackCount : 5;

  // Determine preferred intensity based on feedback patterns
  let preferredIntensity: 'low' | 'moderate' | 'high' | 'variable' = 'moderate';
  if (averageIntensity < 4) {
    preferredIntensity = 'low';
  } else if (averageIntensity > 7) {
    preferredIntensity = 'high';
  } else if (Math.abs(averageIntensity - 5) > 2) {
    preferredIntensity = 'variable';
  }

  // Extract common blockers from insights
  const commonBlockers: string[] = [];
  const blockerFrequency: Record<string, number> = {};

  for (const insight of integratedInsights) {
    // Extract blocker-like patterns (challenges, struggles, fears)
    const text = insight.detectedPattern.toLowerCase();
    if (
      text.includes('blocker') ||
      text.includes('challenge') ||
      text.includes('struggle') ||
      text.includes('resistance')
    ) {
      blockerFrequency[insight.detectedPattern] = (blockerFrequency[insight.detectedPattern] || 0) + 1;
    }
  }

  for (const [blocker, frequency] of Object.entries(blockerFrequency)) {
    if (frequency >= 1) {
      commonBlockers.push(blocker);
    }
  }

  // Extract developmental stage and attachment style
  const developmentalStage = extractDevelopmentalStage(wizardSessions);
  const attachmentStyle = extractAttachmentStyle(wizardSessions);

  // Determine primary focus area based on pending insights
  const pendingInsights = integratedInsights.filter((i) => i.status === 'pending');
  let primaryFocusArea: string | undefined;
  if (pendingInsights.length > 0) {
    primaryFocusArea = pendingInsights[0].detectedPattern;
  }

  // Analyze daily notes for sentiment and mood trends
  const sentimentAnalysis = await analyzeDailyNotesSentiment(dailyNotes || {});

  return {
    preferredModalities,
    experienceLevel,
    recurringPatterns: recurringPatterns.slice(0, 5),
    preferredIntensity,
    energyResponseToPractice: {
      highIntensityFeedback,
      lowIntensityFeedback,
      averageEnergyLevel: Math.round(averageEnergyLevel * 10) / 10,
    },
    commonBlockers: commonBlockers.slice(0, 5),
    practiceComplianceRate: Math.round(practiceComplianceRate * 100) / 100,
    primaryFocusArea,
    developmentalStage,
    attachmentStyle,
    sentimentSummary: sentimentAnalysis ? {
      averageMoodScore: sentimentAnalysis.averageMoodScore,
      moodTrend: sentimentAnalysis.moodTrend,
      recentMoodKeywords: sentimentAnalysis.recentMoodKeywords,
      lastAnalyzedDate: new Date().toISOString(),
    } : undefined,
  };
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
