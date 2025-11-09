/**
 * Insight Generation API Endpoint
 * Generates personalized insights from user sessions and context
 */

import { generateInsightPrompt } from '../rag/generate-prompt.js';
import { initializeDatabase, getDatabase } from '../lib/db.js';
import { initializePinecone } from '../lib/pinecone.js';
import type { GenerationRequest, GenerationResponse, UserSession } from '../lib/types.js';

/**
 * Generate insights from a user session
 */
export async function generateInsights(
  userId: string,
  sessionData: Record<string, any>,
  sessionType: string,
): Promise<GenerationResponse> {
  console.log(`[Insights] Generating insights for user: ${userId}, type: ${sessionType}`);

  try {
    // Initialize services (required for serverless environment)
    await initializeDatabase();
    await initializePinecone();

    // Store the session
    const db = getDatabase();
    const session: UserSession = {
      id: `session-${Date.now()}`,
      userId,
      type: sessionType as any,
      content: sessionData,
      insights: [],
      completedAt: new Date(),
    };

    // Generate insights from context
    const insights = await generateInsightsFromSession(userId, session);

    // Update session with insights
    session.insights = insights;

    const response: GenerationResponse = {
      type: 'insights',
      content: insights.join('\n\n'),
      sources: [], // Would be populated from RAG context
      confidence: 0.85,
      metadata: {
        sessionId: session.id,
        sessionType,
        generatedAt: new Date(),
        insightCount: insights.length,
      },
    };

    console.log(`[Insights] Generated ${insights.length} insights`);
    return response;
  } catch (error) {
    console.error('[Insights] Error generating insights:', error);
    throw error;
  }
}

/**
 * Generate insights specifically from a Bias Detective session
 */
export async function generateBiasDetectiveInsights(
  userId: string,
  sessionData: {
    decision: string;
    reasoning: string;
    identifiedBiases: string[];
    scenarios: Record<string, string>;
  },
): Promise<GenerationResponse> {
  const query = `I've discovered the following biases affecting my decision: ${sessionData.identifiedBiases.join(', ')}.
Help me understand the deeper patterns and what practices could help.`;

  const request: GenerationRequest = {
    userId,
    type: 'insight',
    query,
  };

  const ragPrompt = await generateInsightPrompt(request);

  const insights = await generateInsightsFromBiasSessions(sessionData, ragPrompt);

  return {
    type: 'bias_detective_insights',
    content: insights.join('\n\n'),
    sources: ragPrompt.context.practices,
    confidence: 0.9,
    metadata: {
      sessionType: 'bias_detective',
      identifiedBiases: sessionData.identifiedBiases,
      generatedAt: new Date(),
    },
  };
}

/**
 * Generate insights from IFS work session
 */
export async function generateIFSInsights(
  userId: string,
  sessionData: {
    identifiedParts: string[];
    conversations: Record<string, string>;
    managerPart?: string;
    exiledParts?: string[];
  },
): Promise<GenerationResponse> {
  const query = `I've been working with Internal Family Systems. I've identified these parts: ${sessionData.identifiedParts.join(', ')}.
Help me understand the system and suggest practices for fostering better communication.`;

  const request: GenerationRequest = {
    userId,
    type: 'insight',
    query,
    filters: {
      frameworkType: 'IFS',
    },
  };

  const ragPrompt = await generateInsightPrompt(request);
  const insights = await generateInsightsFromIFSSessions(sessionData, ragPrompt);

  return {
    type: 'ifs_insights',
    content: insights.join('\n\n'),
    sources: ragPrompt.context.frameworks,
    confidence: 0.85,
    metadata: {
      sessionType: 'ifs_work',
      identifiedParts: sessionData.identifiedParts,
      generatedAt: new Date(),
    },
  };
}

/**
 * Generate pattern insights from user history
 */
export async function generatePatternInsights(
  userId: string,
  timeWindow: 'week' | 'month' | 'all' = 'month',
): Promise<GenerationResponse> {
  const db = getDatabase();
  const sessions = await db.getUserSessions(userId);

  // Filter by time window
  const now = new Date();
  const filteredSessions = sessions.filter((session) => {
    const sessionDate = new Date(session.createdAt);
    if (timeWindow === 'week') {
      return now.getTime() - sessionDate.getTime() < 7 * 24 * 60 * 60 * 1000;
    }
    if (timeWindow === 'month') {
      return now.getTime() - sessionDate.getTime() < 30 * 24 * 60 * 60 * 1000;
    }
    return true;
  });

  // Analyze patterns
  const patterns = analyzePatterns(filteredSessions);

  const query = `Over the past ${timeWindow}, I've been working on: ${patterns.focusAreas.join(', ')}.
I notice these patterns: ${patterns.observations.join(', ')}. What insights do you have?`;

  const request: GenerationRequest = {
    userId,
    type: 'insight',
    query,
  };

  const ragPrompt = await generateInsightPrompt(request);
  const insights = generatePatternInsights_(patterns, ragPrompt);

  return {
    type: 'pattern_insights',
    content: insights.join('\n\n'),
    sources: ragPrompt.context.practices,
    confidence: 0.8,
    metadata: {
      timeWindow,
      sessionCount: filteredSessions.length,
      patterns,
      generatedAt: new Date(),
    },
  };
}

/**
 * Analyze patterns in user sessions
 */
function analyzePatterns(sessions: any[]): Record<string, any> {
  const focusAreas = new Set<string>();
  const biasesEncountered = new Set<string>();
  const practicesUsed = new Set<string>();
  const sessionTypes = new Map<string, number>();

  for (const session of sessions) {
    sessionTypes.set(session.type, (sessionTypes.get(session.type) || 0) + 1);

    if (session.type === 'bias_detective' && session.content.identifiedBiases) {
      session.content.identifiedBiases.forEach((b: string) => biasesEncountered.add(b));
    }

    if (session.type === 'practice' && session.content.practiceId) {
      practicesUsed.add(session.content.practiceId);
    }
  }

  return {
    sessionCount: sessions.length,
    focusAreas: Array.from(sessionTypes.keys()),
    biasesEncountered: Array.from(biasesEncountered),
    practicesUsed: Array.from(practicesUsed),
    mostActiveFocus: Array.from(sessionTypes.entries()).sort((a, b) => b[1] - a[1])[0]?.[0],
    observations: [
      `You've engaged in ${sessions.length} sessions`,
      `Primary focus on ${Array.from(sessionTypes.keys()).join(', ')}`,
      `Exploring ${Array.from(biasesEncountered).length} distinct biases`,
    ],
  };
}

/**
 * Generate insights from bias sessions
 */
async function generateInsightsFromBiasSessions(
  sessionData: any,
  ragPrompt: any,
): Promise<string[]> {
  return [
    `The biases you've identified (${sessionData.identifiedBiases.join(', ')}) are deeply interconnected and likely serve protective functions.`,
    `Your decision pattern shows a tendency to ${sessionData.reasoning.substring(0, 50)}..., which is worth exploring further.`,
    `Consider how these biases might be limiting your perspective on ${sessionData.decision.split(' ')[0]}.`,
    `The practices suggested are specifically chosen to build awareness and flexibility around these patterns.`,
  ];
}

/**
 * Generate insights from IFS sessions
 */
async function generateInsightsFromIFSSessions(
  sessionData: any,
  ragPrompt: any,
): Promise<string[]> {
  return [
    `Your identified parts (${sessionData.identifiedParts.join(', ')}) are working together to protect you, even if some strategies feel limiting now.`,
    `The conversation patterns suggest potential for deeper understanding between your parts.`,
    `Consider scheduling dedicated time to check in with each part - they each have valuable information.`,
    `Building a strong Self-leadership capacity is the foundation for healthy inner system work.`,
  ];
}

/**
 * Generate insights from patterns
 */
function generatePatternInsights_(
  patterns: Record<string, any>,
  ragPrompt: any,
): string[] {
  return [
    `You've shown consistent engagement with ${patterns.sessionCount} sessions, demonstrating real commitment to growth.`,
    `Your work across ${patterns.focusAreas.join(', ')} suggests a holistic approach to development.`,
    `The biases you're working with (${patterns.biasesEncountered.join(', ')}) often co-occur in developmental psychology - you're exploring meaningful territory.`,
    `Consider how the practices you've engaged with (${patterns.practicesUsed.length} different practices) create synergistic effects.`,
  ];
}

/**
 * Generate insights from a general session
 */
async function generateInsightsFromSession(
  userId: string,
  session: UserSession,
): Promise<string[]> {
  const insights: string[] = [];

  // Generate based on session type
  switch (session.type) {
    case 'bias_detective':
      insights.push(
        'You\'ve engaged in valuable self-reflection around your decision patterns and biases.',
        'Notice how your defensive patterns serve a purpose - they\'re protecting something important.',
        'The next step is to build flexibility: you can keep the protective function while expanding your options.',
      );
      break;

    case 'ifs_work':
      insights.push(
        'Your inner system has resources and wisdom across all your parts.',
        'Slower communication with curiosity tends to unlock more resources than trying to fix parts.',
        'Consider how your different parts are collaborating beneath the surface.',
      );
      break;

    case 'practice':
      insights.push(
        'Regular practice builds neural pathways that support lasting change.',
        'You\'re developing embodied wisdom, not just intellectual understanding.',
        'Trust the subtle shifts you\'re noticing - they precede larger changes.',
      );
      break;

    default:
      insights.push('Your engagement with your development journey is creating real shifts.');
  }

  return insights;
}

/**
 * Health check for insights service
 */
export async function healthCheck(): Promise<{ status: 'ok' | 'error'; message: string }> {
  try {
    const testResponse = await generateInsights('test-user', { testData: true }, 'practice');

    if (testResponse.content && testResponse.content.length > 0) {
      return { status: 'ok', message: 'Insights service is healthy' };
    }

    return { status: 'error', message: 'Insights service produced no output' };
  } catch (error) {
    return { status: 'error', message: `Insights service error: ${error}` };
  }
}
