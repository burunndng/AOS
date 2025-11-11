/**
 * RAG Prompt Generation Module
 * Generates context-aware prompts for LLM API calls by querying Pinecone
 * Implements semantic search to find relevant practices and frameworks
 */

import { semanticSearch } from '../lib/pinecone.ts';
import { generateEmbedding } from '../lib/embeddings.ts';
import { getDatabase } from '../lib/db.ts';
import type { GenerationRequest, RAGContext, UserHistory, QueryResult } from '../lib/types.ts';

export interface RAGPromptResponse {
  prompt: string;
  context: {
    practices?: QueryResult[];
    frameworks?: QueryResult[];
    userInsights?: string[];
    userHistory?: UserHistory;
    relevantData?: Record<string, any>;
  };
}

/**
 * Generate personalized recommendations by semantic search
 */
export async function generateRecommendationPrompt(
  request: GenerationRequest,
): Promise<RAGPromptResponse> {
  const { userId, query, topK = 10, filters } = request;

  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query || 'practices for personal growth');

    // Retrieve relevant practices from Pinecone
    const practiceResults = await semanticSearch(queryEmbedding, {
      topK: topK || 10,
      type: 'practice',
      minSimilarity: 0.5,
    });

    // Retrieve relevant frameworks if specified
    let frameworkResults: QueryResult[] = [];
    if (filters?.frameworkType) {
      const frameworkQuery = await generateEmbedding(
        `${filters.frameworkType} framework for ${query || 'personal development'}`,
      );
      frameworkResults = await semanticSearch(frameworkQuery, {
        topK: 5,
        type: 'framework',
        minSimilarity: 0.6,
      });
    }

    // Retrieve user history
    const userHistory = await getUserHistory(userId);

    // Generate context-aware insights based on user history
    const relevantInsights = generateRelevantInsights(userHistory, practiceResults);

    const prompt = buildRecommendationPrompt(
      query,
      userHistory,
      practiceResults,
      frameworkResults,
      relevantInsights,
    );

    return {
      prompt,
      context: {
        practices: practiceResults,
        frameworks: frameworkResults,
        userInsights: relevantInsights,
        userHistory,
        relevantData: {
          queryType: request.type,
          filters,
        },
      },
    };
  } catch (error) {
    console.error('[RAG] Error generating recommendation prompt:', error);
    // Fallback to generic response if semantic search fails
    return generateFallbackRecommendationPrompt(query);
  }
}

/**
 * Generate insights prompt by analyzing session data
 */
export async function generateInsightPrompt(
  request: GenerationRequest,
): Promise<RAGPromptResponse> {
  const { userId, query, topK = 8, filters } = request;

  try {
    // Generate embedding for the insight query
    const queryEmbedding = await generateEmbedding(
      query || 'practices for integrating insights and growth',
    );

    // Retrieve relevant practices that match the insight context
    const practiceResults = await semanticSearch(queryEmbedding, {
      topK: topK || 8,
      type: 'practice',
      minSimilarity: 0.5,
    });

    // Retrieve relevant frameworks
    let frameworkResults: QueryResult[] = [];
    if (filters?.frameworkType) {
      const frameworkEmbedding = await generateEmbedding(
        `${filters.frameworkType} framework insights for ${query || 'growth'}`,
      );
      frameworkResults = await semanticSearch(frameworkEmbedding, {
        topK: 3,
        type: 'framework',
        minSimilarity: 0.6,
      });
    }

    // Get user history for context
    const userHistory = await getUserHistory(userId);

    // Generate insight-specific content
    const relevantInsights = generateInsightContext(userHistory, practiceResults, query);

    const prompt = buildInsightPrompt(query, userHistory, practiceResults, relevantInsights);

    return {
      prompt,
      context: {
        practices: practiceResults,
        frameworks: frameworkResults,
        userInsights: relevantInsights,
        userHistory,
        relevantData: {
          queryType: request.type,
          sessionContext: filters,
        },
      },
    };
  } catch (error) {
    console.error('[RAG] Error generating insight prompt:', error);
    return generateFallbackInsightPrompt(query);
  }
}

/**
 * Generate practice customization prompt
 */
export async function generatePracticePrompt(request: GenerationRequest): Promise<RAGPromptResponse> {
  const { userId, query, topK = 5 } = request;

  try {
    // Generate embedding for practice customization
    const queryEmbedding = await generateEmbedding(
      query || 'customizing practices for individual needs',
    );

    // Find similar practices for reference
    const practiceResults = await semanticSearch(queryEmbedding, {
      topK: topK || 5,
      type: 'practice',
      minSimilarity: 0.5,
    });

    const userHistory = await getUserHistory(userId);

    const prompt = buildPracticePrompt(query, practiceResults, userHistory);

    return {
      prompt,
      context: {
        practices: practiceResults,
        userHistory,
        relevantData: {
          queryType: 'practice_customization',
        },
      },
    };
  } catch (error) {
    console.error('[RAG] Error generating practice prompt:', error);
    return generateFallbackPracticePrompt(query);
  }
}

/**
 * Generate personalization suggestions for a specific practice
 */
export async function generatePersonalizationPrompt(
  request: GenerationRequest,
  practiceTitle?: string,
): Promise<RAGPromptResponse> {
  const { userId, topK = 5 } = request;

  try {
    // Generate embedding for the practice title
    const practiceEmbedding = await generateEmbedding(
      `Personalizing ${practiceTitle || 'this practice'} for individual needs`,
    );

    // Find similar practices and personalization approaches
    const practiceResults = await semanticSearch(practiceEmbedding, {
      topK: topK || 5,
      type: 'practice',
      minSimilarity: 0.5,
    });

    const userHistory = await getUserHistory(userId);

    // Generate personalization-specific insights
    const personalizationInsights = generatePersonalizationInsights(
      practiceTitle,
      userHistory,
      practiceResults,
    );

    const prompt = buildPersonalizationPrompt(practiceTitle, userHistory, personalizationInsights);

    return {
      prompt,
      context: {
        practices: practiceResults,
        userInsights: personalizationInsights,
        userHistory,
        relevantData: {
          practiceTitle,
          queryType: 'personalization',
        },
      },
    };
  } catch (error) {
    console.error('[RAG] Error generating personalization prompt:', error);
    return generateFallbackPersonalizationPrompt(practiceTitle);
  }
}

/**
 * Generate customization suggestions
 */
export async function generateCustomizationPrompt(
  request: GenerationRequest,
): Promise<RAGPromptResponse> {
  const { userId, query, topK = 5 } = request;

  try {
    const queryEmbedding = await generateEmbedding(
      query || 'customizing practices for better integration',
    );

    const practiceResults = await semanticSearch(queryEmbedding, {
      topK: topK || 5,
      type: 'practice',
      minSimilarity: 0.5,
    });

    const userHistory = await getUserHistory(userId);

    const customizationSuggestions = generateCustomizationSuggestions(
      practiceResults,
      userHistory,
    );

    const prompt = buildCustomizationPrompt(query, customizationSuggestions);

    return {
      prompt,
      context: {
        practices: practiceResults,
        userInsights: customizationSuggestions,
        userHistory,
        relevantData: {
          queryType: 'customization',
        },
      },
    };
  } catch (error) {
    console.error('[RAG] Error generating customization prompt:', error);
    return generateFallbackCustomizationPrompt();
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Retrieve user's historical data and preferences
 */
async function getUserHistory(userId: string): Promise<UserHistory> {
  try {
    const db = getDatabase();
    const sessions = await db.getUserSessions(userId);
    const user = await db.getUserProfile(userId);

    return {
      completedPractices: user?.completedPractices || [],
      currentStack: user?.currentStack || [],
      preferences: user?.preferences || {
        preferredDuration: 'medium',
        preferredModalities: [],
        preferredFrameworks: [],
        focusAreas: [],
      },
      biases: user?.identifiedBiases || [],
      developmentalStage: user?.developmentalStage,
      attachmentStyle: user?.attachmentStyle,
    };
  } catch (error) {
    console.error('[RAG] Error retrieving user history:', error);
    return {
      completedPractices: [],
      currentStack: [],
      preferences: {
        preferredDuration: 'medium',
        preferredModalities: [],
        preferredFrameworks: [],
        focusAreas: [],
      },
      biases: [],
    };
  }
}

/**
 * Generate insights based on user history and retrieved practices
 */
function generateRelevantInsights(
  userHistory: UserHistory,
  practices: QueryResult[],
): string[] {
  const insights: string[] = [];

  // Add insights about completed practices
  if (userHistory.completedPractices.length > 0) {
    insights.push(
      `You've completed ${userHistory.completedPractices.length} practices. The recommendations below build on this foundation.`,
    );
  }

  // Add insights about identified biases
  if (userHistory.biases.length > 0) {
    insights.push(
      `Based on the biases you've identified (${userHistory.biases.join(', ')}), these practices offer targeted support.`,
    );
  }

  // Add insights about developmental stage
  if (userHistory.developmentalStage) {
    insights.push(
      `Aligned with your developmental stage (${userHistory.developmentalStage}), these practices support your growth edge.`,
    );
  }

  // Add insights about practice diversity
  if (practices.length > 0) {
    const categories = new Set(
      practices
        .map((p) => p.metadata.category)
        .filter((c) => c !== undefined),
    );
    if (categories.size > 0) {
      insights.push(
        `This selection spans multiple domains: ${Array.from(categories).join(', ')}.`,
      );
    }
  }

  return insights.length > 0
    ? insights
    : ['These practices are recommended to support your ongoing growth and integration.'];
}

/**
 * Generate insights specific to insight generation requests
 */
function generateInsightContext(
  userHistory: UserHistory,
  practices: QueryResult[],
  query?: string,
): string[] {
  const insights: string[] = [];

  insights.push(
    'The following practices are specifically chosen to support the insights and patterns you\'ve been exploring.',
  );

  if (userHistory.currentStack.length > 0) {
    insights.push(`These complement your current practice stack: ${userHistory.currentStack.join(', ')}.`);
  }

  if (practices.length > 0) {
    const avgDifficulty =
      practices.filter((p) => p.metadata.difficulty).length > 0
        ? practices.reduce((sum, p) => {
            const diff = p.metadata.difficulty || 'medium';
            const score =
              diff === 'beginner'
                ? 1
                : diff === 'intermediate'
                  ? 2
                  : 3;
            return sum + score;
          }, 0) / practices.length
        : 2;

    insights.push(
      avgDifficulty < 1.5
        ? 'These are foundational practices suitable for building new capacities.'
        : avgDifficulty > 2.5
          ? 'These practices are for advanced practitioners ready to deepen their work.'
          : 'These are accessible practices appropriate for your current level of experience.',
    );
  }

  return insights;
}

/**
 * Generate personalization insights
 */
function generatePersonalizationInsights(
  practiceTitle: string | undefined,
  userHistory: UserHistory,
  practices: QueryResult[],
): string[] {
  const insights: string[] = [];

  insights.push(
    `${practiceTitle || 'This practice'} can be personalized in several ways to match your needs.`,
  );

  if (userHistory.preferences.preferredDuration) {
    insights.push(
      `Based on your preference for ${userHistory.preferences.preferredDuration} practices, consider adjusting the timing.`,
    );
  }

  if (userHistory.preferences.preferredModalities.length > 0) {
    insights.push(
      `You've shown preference for ${userHistory.preferences.preferredModalities.join(', ')} approaches. Look for adaptations in these modalities.`,
    );
  }

  return insights;
}

/**
 * Generate customization suggestions
 */
function generateCustomizationSuggestions(
  practices: QueryResult[],
  userHistory: UserHistory,
): string[] {
  const suggestions: string[] = [];

  if (practices.length > 0) {
    suggestions.push(
      'Consider modifying the following elements to match your individual needs and preferences:',
    );

    // Suggest timing modifications
    const hasLongPractices = practices.some(
      (p) => (p.metadata.duration || 0) > 20,
    );
    if (hasLongPractices && userHistory.preferences.preferredDuration === 'short') {
      suggestions.push('Break longer practices into shorter sessions (5-10 min)');
    }

    // Suggest modality adaptations
    if (userHistory.preferences.preferredModalities.length > 0) {
      suggestions.push(
        `Adapt to your preferred learning modalities: ${userHistory.preferences.preferredModalities.join(', ')}`,
      );
    }
  }

  return suggestions;
}

// ============================================
// PROMPT BUILDERS
// ============================================

/**
 * Build recommendation prompt with context
 */
function buildRecommendationPrompt(
  query: string | undefined,
  userHistory: UserHistory,
  practices: QueryResult[],
  frameworks: QueryResult[],
  insights: string[],
): string {
  const parts: string[] = [
    'Based on the following context, generate personalized practice recommendations:',
    '',
    `User Request: ${query || 'Looking for guidance on next steps'}`,
  ];

  if (userHistory.completedPractices.length > 0) {
    parts.push(`Completed Practices: ${userHistory.completedPractices.join(', ')}`);
  }

  if (userHistory.biases.length > 0) {
    parts.push(`Identified Biases: ${userHistory.biases.join(', ')}`);
  }

  if (frameworks.length > 0) {
    parts.push(
      `Relevant Frameworks: ${frameworks.map((f) => f.metadata.frameworkType).join(', ')}`,
    );
  }

  if (practices.length > 0) {
    parts.push(
      `Retrieved Relevant Practices: ${practices.map((p) => p.metadata.practiceTitle).join(', ')}`,
    );
  }

  if (insights.length > 0) {
    parts.push(`Context: ${insights.join(' ')}`);
  }

  parts.push('');
  parts.push('Provide specific, actionable recommendations that build on their history.');

  return parts.join('\n');
}

/**
 * Build insight prompt
 */
function buildInsightPrompt(
  query: string | undefined,
  userHistory: UserHistory,
  practices: QueryResult[],
  insights: string[],
): string {
  const parts: string[] = [
    'Generate personalized insights based on the following session data:',
    '',
    `Insight Query: ${query || 'Exploring patterns and growth opportunities'}`,
  ];

  if (userHistory.biases.length > 0) {
    parts.push(`Working with Biases: ${userHistory.biases.join(', ')}`);
  }

  if (practices.length > 0) {
    parts.push(
      `Supporting Practices: ${practices.map((p) => p.metadata.practiceTitle).join(', ')}`,
    );
  }

  if (insights.length > 0) {
    parts.push(`Context: ${insights.join(' ')}`);
  }

  parts.push('');
  parts.push('Provide deep, personalized insights that connect their work to transformative practices.');

  return parts.join('\n');
}

/**
 * Build practice customization prompt
 */
function buildPracticePrompt(
  query: string | undefined,
  practices: QueryResult[],
  userHistory: UserHistory,
): string {
  const parts: string[] = [
    'Generate customization suggestions for the following practice context:',
    '',
    `Request: ${query || 'Customizing practices for individual needs'}`,
  ];

  if (userHistory.preferences.preferredDuration) {
    parts.push(`Preferred Duration: ${userHistory.preferences.preferredDuration}`);
  }

  if (practices.length > 0) {
    parts.push(
      `Reference Practices: ${practices.map((p) => p.metadata.practiceTitle).join(', ')}`,
    );
  }

  parts.push('');
  parts.push('Provide specific suggestions for adapting practices to individual needs and contexts.');

  return parts.join('\n');
}

/**
 * Build personalization prompt
 */
function buildPersonalizationPrompt(
  practiceTitle: string | undefined,
  userHistory: UserHistory,
  insights: string[],
): string {
  const parts: string[] = [
    `Generate personalization recommendations for: ${practiceTitle || 'this practice'}`,
    '',
  ];

  if (userHistory.preferences.preferredModalities.length > 0) {
    parts.push(`Preferred Modalities: ${userHistory.preferences.preferredModalities.join(', ')}`);
  }

  if (userHistory.biases.length > 0) {
    parts.push(`Considerations: ${userHistory.biases.join(', ')}`);
  }

  if (insights.length > 0) {
    parts.push(`Context: ${insights.join(' ')}`);
  }

  parts.push('');
  parts.push(
    'Provide specific, personalized adaptations that make this practice more effective for this individual.',
  );

  return parts.join('\n');
}

/**
 * Build customization prompt
 */
function buildCustomizationPrompt(query: string | undefined, suggestions: string[]): string {
  const parts: string[] = [
    'Generate practical customization suggestions:',
    '',
    `Request: ${query || 'Customizing practices'}`,
  ];

  if (suggestions.length > 0) {
    parts.push(`Key Suggestions: ${suggestions.join(' ')}`);
  }

  parts.push('');
  parts.push('Provide specific, actionable modifications to practices.');

  return parts.join('\n');
}

// ============================================
// FALLBACK FUNCTIONS (when semantic search fails)
// ============================================

function generateFallbackRecommendationPrompt(query: string | undefined): RAGPromptResponse {
  return {
    prompt: `Generate a recommendation based on this request: ${query || 'looking for guidance'}`,
    context: {
      practices: [],
      userInsights: ['General recommendation mode - semantic search unavailable'],
      userHistory: {
        completedPractices: [],
        currentStack: [],
        preferences: {
          preferredDuration: 'medium',
          preferredModalities: [],
          preferredFrameworks: [],
          focusAreas: [],
        },
        biases: [],
      },
    },
  };
}

function generateFallbackInsightPrompt(query: string | undefined): RAGPromptResponse {
  return {
    prompt: `Generate insights based on: ${query || 'user development'}`,
    context: {
      practices: [],
      userInsights: ['Insight generation - semantic search unavailable'],
      userHistory: {
        completedPractices: [],
        currentStack: [],
        preferences: {
          preferredDuration: 'medium',
          preferredModalities: [],
          preferredFrameworks: [],
          focusAreas: [],
        },
        biases: [],
      },
    },
  };
}

function generateFallbackPracticePrompt(query: string | undefined): RAGPromptResponse {
  return {
    prompt: `Generate practice customization for: ${query || 'personal needs'}`,
    context: {
      practices: [],
      userHistory: {
        completedPractices: [],
        currentStack: [],
        preferences: {
          preferredDuration: 'medium',
          preferredModalities: [],
          preferredFrameworks: [],
          focusAreas: [],
        },
        biases: [],
      },
    },
  };
}

function generateFallbackPersonalizationPrompt(practiceTitle: string | undefined): RAGPromptResponse {
  return {
    prompt: `Generate personalization suggestions for ${practiceTitle || 'this practice'}`,
    context: {
      practices: [],
      userHistory: {
        completedPractices: [],
        currentStack: [],
        preferences: {
          preferredDuration: 'medium',
          preferredModalities: [],
          preferredFrameworks: [],
          focusAreas: [],
        },
        biases: [],
      },
    },
  };
}

function generateFallbackCustomizationPrompt(): RAGPromptResponse {
  return {
    prompt: 'Generate customization suggestions for practices',
    context: {
      practices: [],
      userHistory: {
        completedPractices: [],
        currentStack: [],
        preferences: {
          preferredDuration: 'medium',
          preferredModalities: [],
          preferredFrameworks: [],
          focusAreas: [],
        },
        biases: [],
      },
    },
  };
}

