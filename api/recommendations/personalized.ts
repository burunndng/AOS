/**
 * Personalized Recommendations API Endpoint
 * Generates context-aware practice recommendations for users
 */

import { generateRecommendationPrompt } from '../rag/generate-prompt.js';
import { initializeDatabase } from '../lib/db.js';
import type { GenerationRequest, RecommendationResponse, PersonalizedRecommendation } from '../lib/types.js';

/**
 * Generate personalized recommendations for a user
 * Can be called from frontend after user completes an assessment or needs guidance
 */
export async function generatePersonalizedRecommendations(
  request: GenerationRequest,
): Promise<RecommendationResponse> {
  const { userId, query } = request;

  console.log(`[Recommendations] Generating recommendations for user: ${userId}`);

  try {
    // Initialize database (required for serverless environment)
    await initializeDatabase();

    // Generate RAG prompt with context
    const ragPrompt = await generateRecommendationPrompt(request);

    // In production, call Gemini API here
    // For now, we'll generate recommendations from the context
    const recommendations = await generateRecommendationsFromContext(ragPrompt);

    const response: RecommendationResponse = {
      userId,
      recommendations,
      insights: ragPrompt.context.userInsights,
      generatedAt: new Date(),
    };

    console.log(`[Recommendations] Generated ${recommendations.length} recommendations`);
    return response;
  } catch (error) {
    console.error('[Recommendations] Error generating recommendations:', error);
    throw error;
  }
}

/**
 * Generate recommendations based on retrieved context
 * This is where Gemini API would be called in production
 */
async function generateRecommendationsFromContext(ragPrompt: any): Promise<PersonalizedRecommendation[]> {
  const recommendations: PersonalizedRecommendation[] = [];

  // Use retrieved practices from context
  const { practices } = ragPrompt.context;

  // Map practices to personalized recommendations
  for (const practice of practices.slice(0, 5)) {
    const recommendation: PersonalizedRecommendation = {
      practiceId: practice.id,
      practiceTitle: practice.metadata.practiceTitle || practice.id,
      reasoning: generateRecommendationReasoning(practice, ragPrompt.context),
      relevanceScore: practice.score || 0.8,
      personalizationNotes: generatePersonalizationNotes(practice, ragPrompt.context),
    };

    recommendations.push(recommendation);
  }

  return recommendations;
}

/**
 * Generate human-readable reasoning for a recommendation
 */
function generateRecommendationReasoning(practice: any, context: any): string {
  const practiceTitle = practice.metadata.practiceTitle || 'this practice';
  const userProfile = context.userProfile;

  const reasons: string[] = [];

  // Check relevance to completed practices
  if (
    userProfile.completedPractices &&
    userProfile.completedPractices.length > 0
  ) {
    reasons.push(`Builds on your existing practice history`);
  }

  // Check relevance to identified biases
  if (userProfile.biases && userProfile.biases.length > 0) {
    reasons.push(`Directly addresses biases you've identified`);
  }

  // Check relevance to developmental stage
  if (userProfile.developmentalStage) {
    reasons.push(`Aligned with your current developmental stage (${userProfile.developmentalStage})`);
  }

  // Check difficulty progression
  if (userProfile.completedPractices && userProfile.completedPractices.length > 5) {
    reasons.push(`Next logical step in your practice progression`);
  }

  return reasons.length > 0
    ? `${practiceTitle} is recommended because it ${reasons.join(', ')}.`
    : `${practiceTitle} is a powerful practice for your current growth edge.`;
}

/**
 * Generate personalization notes for a recommendation
 */
function generatePersonalizationNotes(practice: any, context: any): string[] {
  const notes: string[] = [];
  const userProfile = context.userProfile;

  // Suggest shorter durations if user is busy
  if (practice.metadata.duration && practice.metadata.duration > 20) {
    notes.push(`Consider starting with a shorter duration (5-10 min) and building up`);
  }

  // Suggest adaptations for learning style
  if (
    userProfile.preferences.preferredModalities &&
    userProfile.preferences.preferredModalities.length > 0
  ) {
    notes.push(
      `Can be adapted to your preferred learning style: ${userProfile.preferences.preferredModalities.join(', ')}`,
    );
  }

  // Note common pitfalls
  if (practice.metadata.evidence && practice.metadata.evidence.length > 0) {
    notes.push(`Evidence base: ${practice.metadata.evidence[0]}`);
  }

  // Suggest sequencing
  notes.push('Best done in the morning for sustained benefits');

  return notes.length > 0 ? notes : ['Start with 5 minutes and extend as it becomes natural'];
}

/**
 * Get recommendations for a specific user query/need
 * Called from RecommendationsTab
 */
export async function getRecommendationsForNeed(
  userId: string,
  need: string,
): Promise<RecommendationResponse> {
  const request: GenerationRequest = {
    userId,
    type: 'recommendation',
    query: need,
    topK: 10,
  };

  return generatePersonalizedRecommendations(request);
}

/**
 * Get recommendations based on current practice stack
 */
export async function getStackRecommendations(
  userId: string,
  currentStack: string[],
): Promise<RecommendationResponse> {
  const stackDescription = currentStack.length > 0
    ? `I'm currently doing: ${currentStack.join(', ')}. What should I add next?`
    : 'I want to start a new practice stack. Where should I begin?';

  const request: GenerationRequest = {
    userId,
    type: 'recommendation',
    query: stackDescription,
    topK: 8,
  };

  return generatePersonalizedRecommendations(request);
}

/**
 * Get targeted recommendations after assessment
 */
export async function getAssessmentBasedRecommendations(
  userId: string,
  assessmentType: string,
  assessmentResults: Record<string, any>,
): Promise<RecommendationResponse> {
  const query = buildAssessmentQuery(assessmentType, assessmentResults);

  const request: GenerationRequest = {
    userId,
    type: 'recommendation',
    query,
    filters: {
      frameworkType: assessmentType === 'Kegan' ? 'Kegan' : assessmentType,
    },
    topK: 8,
  };

  return generatePersonalizedRecommendations(request);
}

/**
 * Build a query string from assessment results
 */
function buildAssessmentQuery(assessmentType: string, results: Record<string, any>): string {
  const queries: Record<string, string> = {
    Kegan: `I'm at the ${results.stage} stage of development. What practices would support my growth?`,
    Attachment: `My attachment style is ${results.style}. What practices would help me develop more security?`,
    Biases: `I struggle with ${results.dominantBiases?.join(', ') || 'various cognitive biases'}. What practices help overcome these?`,
    AQAL: `I want to develop across all dimensions: ${results.dimensions?.join(', ') || 'body, mind, spirit, and shadow'}. What's a good starting point?`,
    IFS: `I've identified these inner voices: ${results.identifiedParts?.join(', ') || 'protective and exiled parts'}. How can I work with them?`,
  };

  return queries[assessmentType] || 'What practices would help me grow?';
}

/**
 * Health check for recommendations service
 */
export async function healthCheck(): Promise<{ status: 'ok' | 'error'; message: string }> {
  try {
    const testRequest: GenerationRequest = {
      userId: 'test-user',
      type: 'recommendation',
      query: 'test query',
    };

    const response = await generatePersonalizedRecommendations(testRequest);

    if (response.recommendations && response.recommendations.length > 0) {
      return { status: 'ok', message: 'Recommendations service is healthy' };
    }

    return { status: 'error', message: 'Recommendations service produced no results' };
  } catch (error) {
    return { status: 'error', message: `Recommendations service error: ${error}` };
  }
}
