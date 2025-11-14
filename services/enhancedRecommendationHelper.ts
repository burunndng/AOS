/**
 * Enhanced Recommendation Helper for RecommendationsTab
 * Converts geminiRecommendationService output to UI-ready format
 * Integrates with App.tsx state management
 */

import { v4 as uuidv4 } from 'uuid';
import type { EnhancedRecommendationSet, EnhancedRecommendation, AllPractice, IntegratedInsight } from '../types';
import { generateGeminiRecommendations } from './geminiRecommendationService';

/**
 * Generate enhanced recommendations for the App
 * Orchestrates the full recommendation pipeline
 */
export async function generateEnhancedRecommendationsForApp(
  userPracticeStack: AllPractice[],
  integratedInsights: IntegratedInsight[],
  allPractices: AllPractice[],
  practiceNotes: Record<string, string>,
  completedToday: Record<string, boolean>
): Promise<EnhancedRecommendationSet> {
  try {
    // Determine primary wizard type and context from recent insights
    const recentInsight = integratedInsights
      .filter(i => i.status === 'pending')
      .sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime())[0];

    const wizardType = recentInsight?.mindToolType || 'bias_detective';
    const detectedPattern = recentInsight?.detectedPattern || 'General pattern development';

    // Extract session data from current state
    const sessionData = extractSessionContext(
      userPracticeStack,
      integratedInsights,
      practiceNotes,
      completedToday
    );

    // Generate recommendations using Gemini
    const geminiRecs = await generateGeminiRecommendations(
      wizardType,
      sessionData,
      detectedPattern
    );

    // Convert to EnhancedRecommendationSet format
    const recommendations: EnhancedRecommendation[] = geminiRecs.selectedPractices
      .map((rec: any, index: number) => {
        // Find the practice object
        const practice = allPractices.find(p => p.name === rec.name);

        if (!practice) {
          throw new Error(`Practice not found: ${rec.name}`);
        }

        return {
          id: uuidv4(),
          practice,
          rationale: rec.rationale,
          sequenceWeek: (index + 1) * 2, // Week 2, 4, 6, etc.
          sequenceGuidance: rec.sequence || `Start in week ${(index + 1) * 2}`,
          expectedBenefits: rec.expectedBenefits || 'Improved pattern awareness and flexibility',
          integrationTips: rec.integration || 'Begin with 5-10 minutes daily to build momentum',
          timeCommitment: `${practice.timePerWeek}h/week`,
          confidence: 0.95
        };
      });

    return {
      recommendations,
      overallGuidance: geminiRecs.integratedGuidance,
      practiceSequence: geminiRecs.practiceSequence,
      estimatedTimeToNoticeBenefit: '2-3 weeks of consistent practice',
      confidence: geminiRecs.confidence,
      generatedAt: new Date()
    };
  } catch (error) {
    console.error('[EnhancedRecommendationHelper] Error generating recommendations:', error);
    throw new Error('Failed to generate enhanced recommendations');
  }
}

/**
 * Extract relevant session context from App state
 */
function extractSessionContext(
  practiceStack: AllPractice[],
  insights: IntegratedInsight[],
  practiceNotes: Record<string, string>,
  completedToday: Record<string, boolean>
): Record<string, any> {
  const pendingInsights = insights.filter(i => i.status === 'pending');
  const completedCount = Object.values(completedToday).filter(Boolean).length;

  return {
    currentStack: practiceStack.map(p => ({
      id: p.id,
      name: p.name,
      notes: practiceNotes[p.id]
    })),
    stackSize: practiceStack.length,
    completedToday: completedCount,
    pendingPatterns: pendingInsights.map(i => ({
      pattern: i.detectedPattern,
      wizardType: i.mindToolType,
      suggestedPractices: [
        ...i.suggestedShadowWork.map(s => s.practiceName),
        ...i.suggestedNextSteps.map(n => n.practiceName)
      ]
    })),
    recentWizardTypes: [...new Set(insights.map(i => i.mindToolType))],
    totalInsights: insights.length
  };
}

/**
 * Format recommendations for console logging (debug)
 */
export function logEnhancedRecommendations(recs: EnhancedRecommendationSet): void {
  console.group('[Enhanced Recommendations]');
  console.log('Overall Guidance:', recs.overallGuidance);
  console.log('Recommended Practices:');
  recs.recommendations.forEach((rec, i) => {
    console.log(`  ${i + 1}. ${rec.practice.name}`);
    console.log(`     - Rationale: ${rec.rationale}`);
    console.log(`     - Week ${rec.sequenceWeek}: ${rec.sequenceGuidance}`);
  });
  console.log('Time to notice benefits:', recs.estimatedTimeToNoticeBenefit);
  console.log('Confidence:', Math.round(recs.confidence * 100) + '%');
  console.groupEnd();
}
