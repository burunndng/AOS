/**
 * Unified Insight Generator Service
 * Handles insight generation for all wizards uniformly
 *
 * This service:
 * 1. Takes any wizard session and converts to standardized format
 * 2. Uses Grok-4-Fast (primary) or Gemini (fallback) to detect patterns
 * 3. Suggests both shadow work (reflection) and next steps (action)
 * 4. Tailors recommendations based on user profile (Phase 2)
 * 5. Tracks outcomes to show pattern improvement over time
 */

import { v4 as uuidv4 } from 'uuid';
import type { IntegratedInsight } from '../types.ts';
import { generateText } from './geminiService.ts';
import { generateOpenRouterResponse, buildMessagesWithSystem } from './openRouterService.ts';
import { createInsightLineage } from './synthesisLineageService.ts';
import type { UserProfile } from '../utils/contextAggregator.ts';
import { buildToneInstructions } from './tonalShifter.ts';
import { validateConfidence, calculateConfidenceFromDataVolume } from './confidenceValidator.ts';

interface InsightGenerationInput {
  wizardType:
    | '3-2-1 Reflection'
    | 'IFS Session'
    | 'Bias Detective'
    | 'Bias Finder'
    | 'Subject-Object Explorer'
    | 'Perspective-Shifter'
    | 'Polarity Mapper'
    | 'Kegan Assessment'
    | 'Relational Pattern'
    | 'Role Alignment'
    | 'Big Mind Process'
    | 'Memory Reconsolidation'
    | 'Eight Zones'
    | 'Adaptive Cycle Mapper'
    | 'Adaptive Cycle Lens'
    | 'Somatic Practice'
    | 'Jhana Guide'
    | 'Attachment Assessment'
    | 'Integral Body Plan'
    | 'Workout Program';
  sessionId: string;
  sessionName: string;
  sessionReport: string;
  sessionSummary: string;
  userId: string;
  availablePractices: Array<{ id: string; name: string; category?: string }>;
  userProfile?: UserProfile;
  dataContext?: {
    totalSessions?: number;
    sessionsInLastWeek?: number;
    existingInsights?: number;
  };
}

/**
 * Generate a comprehensive insight from any wizard session
 * Uses Grok-4-Fast (primary) with Gemini fallback (Phase 2)
 * Incorporates user profile for adaptive recommendations
 */
export async function generateInsightFromSession(
  input: InsightGenerationInput
): Promise<IntegratedInsight> {
  const {
    wizardType,
    sessionId,
    sessionName,
    sessionReport,
    sessionSummary,
    availablePractices,
    userProfile,
    dataContext,
  } = input;

  try {
    console.log(`[InsightGenerator] Generating insight for ${wizardType}: ${sessionId}`);

    // Calculate actual confidence from data volume
    const dataConfidence = dataContext
      ? calculateConfidenceFromDataVolume(
          dataContext.totalSessions || 1,
          dataContext.sessionsInLastWeek || 0,
          dataContext.existingInsights || 0
        )
      : 0.65; // Default moderate confidence if no data context

    // Prepare context for AI
    const practiceList = availablePractices.map((p) => `- ${p.name} (${p.category || 'General'})`).join('\n');

    // Build adaptive prompt with user profile context
    const prompt = buildAdaptivePrompt(
      wizardType,
      sessionName,
      sessionReport,
      practiceList,
      userProfile,
      dataConfidence
    );

    let response: string;
    let usedGrok = false;

    // Try Grok-4-Fast first (primary)
    try {
      console.log('[InsightGenerator] Attempting Grok-4-Fast for insight generation');
      const messages = buildMessagesWithSystem(
        'You are an expert at analyzing personal development sessions and suggesting transformative practices.',
        [{ role: 'user' as const, content: prompt }]
      );

      const grokResponse = await generateOpenRouterResponse(
        messages,
        undefined,
        {
          model: 'x-ai/grok-4.1-fast',
          maxTokens: 1500,
          temperature: 0.7,
        }
      );

      if (grokResponse.success && grokResponse.text) {
        response = grokResponse.text;
        usedGrok = true;
        console.log('[InsightGenerator] Successfully used Grok-4-Fast');
      } else {
        throw new Error('Grok response was not successful');
      }
    } catch (grokError) {
      console.warn('[InsightGenerator] Grok-4-Fast failed, falling back to Gemini:', grokError);

      // Fallback to Gemini-2.5-flash-lite
      console.log('[InsightGenerator] Using Gemini-2.5-flash-lite fallback');
      response = await generateText(prompt);
      usedGrok = false;
    }

    // Parse response
    const { pattern, shadowWork, nextSteps } = parseInsightResponse(response, availablePractices);

    // Create insight
    const insightId = uuidv4();
    const insight: IntegratedInsight = {
      id: insightId,
      mindToolType: wizardType,
      mindToolSessionId: sessionId,
      mindToolName: sessionName,
      mindToolReport: sessionReport,
      mindToolShortSummary: sessionSummary,
      detectedPattern: pattern,
      suggestedShadowWork: shadowWork,
      suggestedNextSteps: nextSteps,
      dateCreated: new Date().toISOString(),
      status: 'pending',
      generatedBy: usedGrok ? 'grok' : 'gemini',
      confidenceScore: dataConfidence, // Use calculated confidence from data volume
    };

    // Validate confidence language matches actual confidence
    const confidenceValidation = validateConfidence(
      pattern,
      dataConfidence,
      dataContext?.totalSessions
    );

    if (!confidenceValidation.isValid && confidenceValidation.suggestion) {
      console.warn(`[InsightGenerator] Confidence mismatch detected: ${confidenceValidation.suggestion}`);
      // Note: In a production system, we might log this for review or adjust the language
    }

    // Track lineage for transparency
    try {
      createInsightLineage(insight, insight.generatedBy as 'grok' | 'gemini');
      insight.lineageId = insightId; // Use insight ID as lineage ID
    } catch (lineageError) {
      console.warn('[InsightGenerator] Failed to create lineage record:', lineageError);
      // Continue even if lineage tracking fails - it's not critical
    }

    console.log(
      `[InsightGenerator] Successfully generated insight with ${shadowWork.length} shadow work and ${nextSteps.length} next steps (${usedGrok ? 'Grok' : 'Gemini'})`
    );

    return insight;
  } catch (error) {
    console.error('[InsightGenerator] Error generating insight:', error);
    throw error;
  }
}

/**
 * Build adaptive prompt that incorporates user profile for personalization
 */
function buildAdaptivePrompt(
  wizardType: string,
  sessionName: string,
  sessionReport: string,
  practiceList: string,
  userProfile?: UserProfile,
  dataConfidence: number = 0.65
): string {
  const toneInstructions = buildToneInstructions(dataConfidence);

  let basePrompt = `You are an expert at analyzing personal development sessions and suggesting transformative practices.

Wizard Session: ${wizardType}
Session Name: ${sessionName}

Session Report:
${sessionReport}

Available Practices:
${practiceList}

${toneInstructions}`;

  // Add user profile context if available
  if (userProfile) {
    basePrompt += `

USER PROFILE (Personalization Context):
- Experience Level: ${userProfile.experienceLevel}
- Practice Compliance: ${(userProfile.practiceComplianceRate * 100).toFixed(0)}%
- Preferred Modalities: Mind (${(userProfile.preferredModalities.mind * 100).toFixed(0)}%), Body (${(userProfile.preferredModalities.body * 100).toFixed(0)}%), Spirit (${(userProfile.preferredModalities.spirit * 100).toFixed(0)}%), Shadow (${(userProfile.preferredModalities.shadow * 100).toFixed(0)}%)
- Preferred Intensity Level: ${userProfile.preferredIntensity}
- Average Energy Level: ${userProfile.energyResponseToPractice.averageEnergyLevel}/10
- Recurring Patterns: ${userProfile.recurringPatterns.join(', ') || 'None identified'}
- Common Blockers: ${userProfile.commonBlockers.join(', ') || 'None identified'}
${userProfile.developmentalStage ? `- Developmental Stage: ${userProfile.developmentalStage}` : ''}
${userProfile.sentimentSummary ? `
MOOD & EMOTIONAL CONTEXT:
- Current Mood Score: ${userProfile.sentimentSummary.averageMoodScore.toFixed(2)} (scale: -1.0 very negative to 1.0 very positive)
- Mood Trend: ${userProfile.sentimentSummary.moodTrend}
- Recent Keywords: ${userProfile.sentimentSummary.recentMoodKeywords.join(', ') || 'neutral'}
` : ''}

PERSONALIZATION INSTRUCTIONS:
- Tailor recommendations to match this user's experience level and modality preferences
- Consider their preferred intensity: ${userProfile.preferredIntensity === 'low' ? 'avoid intense practices; focus on gentle inquiry' : userProfile.preferredIntensity === 'high' ? 'can handle challenging practices; encourage growth-edge work' : 'vary intensity; offer options'}
- Be mindful of their recurring patterns (${userProfile.recurringPatterns[0] || 'general patterns'}) - use it as a lens for understanding the current session
- If their compliance is low, suggest simpler, more achievable practices
- If their compliance is high, can suggest more complex integrated practices
${userProfile.sentimentSummary ? `
EMOTIONAL TONE GUIDANCE:
- User's emotional state: ${userProfile.sentimentSummary.moodTrend === 'declining' || userProfile.sentimentSummary.averageMoodScore < -0.3 ? 'Current mood is low or declining - prioritize gentle, supportive practices that build capacity without adding pressure' : userProfile.sentimentSummary.moodTrend === 'improving' || userProfile.sentimentSummary.averageMoodScore > 0.3 ? 'User is in positive or improving mood - can suggest momentum-building practices that leverage current energy' : 'Mood is stable - balanced approach works well'}
- Keywords to consider (${userProfile.sentimentSummary.recentMoodKeywords.join(', ') || 'neutral'}): Avoid practices that trigger these emotions; suggest practices that help process or transform them
- If mood score is below -0.5: recommend grounding, embodiment, and self-compassion practices
- If mood score is above 0.5: recommend practices that sustain momentum and deepen engagement` : ''}`;
  }

  basePrompt += `

Please analyze this session and provide:

1. DETECTED PATTERN (1-2 sentences): What core pattern or insight emerged from this session?

2. SHADOW WORK RECOMMENDATIONS (reflection/inquiry practices to understand the pattern deeper):
   - List 2-3 shadow work practices that would help explore this pattern
   - For each: [Practice Name] | Rationale: [why it helps]

3. NEXT STEPS (action practices to work with this pattern):
   - List 2-3 action practices that would help move forward
   - For each: [Practice Name] | Rationale: [why it helps]

Format your response EXACTLY as:
PATTERN: [detected pattern]
---
SHADOW WORK:
- [Practice Name] | Rationale: [rationale]
- [Practice Name] | Rationale: [rationale]
---
NEXT STEPS:
- [Practice Name] | Rationale: [rationale]
- [Practice Name] | Rationale: [rationale]`;

  return basePrompt;
}

/**
 * Parse Gemini response into structured insight components
 */
function parseInsightResponse(
  response: string,
  availablePractices: Array<{ id: string; name: string }>
): {
  pattern: string;
  shadowWork: Array<{ practiceId: string; practiceName: string; rationale: string }>;
  nextSteps: Array<{ practiceId: string; practiceName: string; rationale: string }>;
} {
  const sections = response.split('---');

  let pattern = 'No pattern detected';
  let shadowWork: Array<{ practiceId: string; practiceName: string; rationale: string }> = [];
  let nextSteps: Array<{ practiceId: string; practiceName: string; rationale: string }> = [];

  // Extract pattern
  if (sections[0]) {
    const patternMatch = sections[0].match(/PATTERN:\s*(.+?)(?:\n|$)/i);
    if (patternMatch) {
      pattern = patternMatch[1].trim();
    }
  }

  // Extract shadow work
  if (sections[1]) {
    shadowWork = parsePracticeRecommendations(sections[1], availablePractices);
  }

  // Extract next steps
  if (sections[2]) {
    nextSteps = parsePracticeRecommendations(sections[2], availablePractices);
  }

  return { pattern, shadowWork, nextSteps };
}

/**
 * Parse practice recommendations from text
 */
function parsePracticeRecommendations(
  text: string,
  availablePractices: Array<{ id: string; name: string }>
): Array<{ practiceId: string; practiceName: string; rationale: string }> {
  const recommendations: Array<{ practiceId: string; practiceName: string; rationale: string }> = [];

  // Split by lines that start with - or •
  const lines = text.split('\n').filter((line) => /^[\s]*[-•]/.test(line));

  for (const line of lines) {
    const match = line.match(/^[\s]*[-•]\s*(.+?)\s*\|\s*Rationale:\s*(.+)$/i);
    if (match) {
      const practiceName = match[1].trim();
      const rationale = match[2].trim();

      // Find matching practice by name
      const practice = availablePractices.find((p) =>
        p.name.toLowerCase().includes(practiceName.toLowerCase()) ||
        practiceName.toLowerCase().includes(p.name.toLowerCase())
      );

      if (practice) {
        recommendations.push({
          practiceId: practice.id,
          practiceName: practice.name,
          rationale,
        });
      }
    }
  }

  return recommendations;
}

/**
 * Calculate pattern improvement based on practice frequency and outcomes
 */
export function calculatePatternImprovement(
  sessionFrequency: number,
  practiceFrequency: number,
  practitionerNotes?: string
): 'improved' | 'stable' | 'worsened' | 'unknown' {
  // Heuristic: if practice frequency is increasing and session shows progress
  // This could be enhanced with ML later
  if (practiceFrequency > sessionFrequency * 1.5) {
    if (practitionerNotes?.toLowerCase().includes('better') ||
        practitionerNotes?.toLowerCase().includes('improved') ||
        practitionerNotes?.toLowerCase().includes('progress')) {
      return 'improved';
    }
    return 'stable';
  }

  if (practitionerNotes?.toLowerCase().includes('harder') ||
      practitionerNotes?.toLowerCase().includes('struggle') ||
      practitionerNotes?.toLowerCase().includes('worse')) {
    return 'worsened';
  }

  return 'unknown';
}

/**
 * Get practice recommendations specific to a pattern
 * Useful for other features to suggest practices based on detected patterns
 */
export function getPracticeRecommendationsForPattern(
  insight: IntegratedInsight
): Array<{ id: string; name: string; type: 'shadow' | 'next'; rationale: string }> {
  const recommendations: Array<{ id: string; name: string; type: 'shadow' | 'next'; rationale: string }> = [];

  // Add shadow work
  for (const sw of insight.suggestedShadowWork) {
    recommendations.push({
      id: sw.practiceId,
      name: sw.practiceName,
      type: 'shadow',
      rationale: sw.rationale,
    });
  }

  // Add next steps
  for (const ns of insight.suggestedNextSteps) {
    recommendations.push({
      id: ns.practiceId,
      name: ns.practiceName,
      type: 'next',
      rationale: ns.rationale,
    });
  }

  return recommendations;
}

/**
 * Track when a recommended practice is completed
 * This enables outcome tracking and pattern improvement detection
 */
export function recordPracticeCompletion(
  insight: IntegratedInsight,
  practiceId: string,
  completionDate: string
): IntegratedInsight {
  if (!insight.relatedPracticeSessions) {
    insight.relatedPracticeSessions = [];
  }

  let session = insight.relatedPracticeSessions.find((s) => s.practiceId === practiceId);

  if (!session) {
    session = {
      practiceId,
      completionDates: [],
      frequency: 0,
    };
    insight.relatedPracticeSessions.push(session);
  }

  session.completionDates.push(completionDate);
  session.frequency = session.completionDates.length;

  return insight;
}
