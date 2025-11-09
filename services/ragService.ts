/**
 * RAG Frontend Client Service
 * Integrates with backend RAG API endpoints
 * Handles recommendations, insights, personalization, and data sync
 */

import type {
  RecommendationResponse,
  GenerationResponse,
  SyncPayload,
  SyncResponse,
  UserSession,
} from '../api/lib/types';

/**
 * Base URL for RAG API
 * In development: http://localhost:3001/api
 * In production: /api
 */
const RAG_API_BASE = process.env.REACT_APP_RAG_API_BASE || '/api';

// ============================================
// RECOMMENDATIONS
// ============================================

/**
 * Get personalized recommendations for a user
 */
export async function getPersonalizedRecommendations(
  userId: string,
  query: string,
): Promise<RecommendationResponse> {
  try {
    const response = await fetch(`${RAG_API_BASE}/recommendations/personalized`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, query, type: 'recommendation' }),
    });

    if (!response.ok) {
      throw new Error(`Recommendations API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('[RAG] Error fetching recommendations:', error);
    throw error;
  }
}

/**
 * Get recommendations for a specific need
 */
export async function getRecommendationsForNeed(
  userId: string,
  need: string,
): Promise<RecommendationResponse> {
  return getPersonalizedRecommendations(userId, need);
}

/**
 * Get recommendations for current stack
 */
export async function getStackRecommendations(
  userId: string,
  currentStack: string[],
): Promise<RecommendationResponse> {
  const stackDescription = currentStack.length > 0
    ? `I'm currently doing: ${currentStack.join(', ')}. What should I add next?`
    : 'I want to start a new practice stack. Where should I begin?';

  return getPersonalizedRecommendations(userId, stackDescription);
}

/**
 * Get recommendations after an assessment
 */
export async function getAssessmentRecommendations(
  userId: string,
  assessmentType: string,
  results: Record<string, any>,
): Promise<RecommendationResponse> {
  try {
    const response = await fetch(`${RAG_API_BASE}/recommendations/assessment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        assessmentType,
        assessmentResults: results,
      }),
    });

    if (!response.ok) {
      throw new Error(`Assessment recommendations API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('[RAG] Error fetching assessment recommendations:', error);
    throw error;
  }
}

// ============================================
// INSIGHTS
// ============================================

/**
 * Generate insights from a session
 */
export async function generateSessionInsights(
  userId: string,
  sessionData: Record<string, any>,
  sessionType: string,
): Promise<GenerationResponse> {
  try {
    const response = await fetch(`${RAG_API_BASE}/insights/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        sessionData,
        sessionType,
      }),
    });

    if (!response.ok) {
      throw new Error(`Insights API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('[RAG] Error generating insights:', error);
    throw error;
  }
}

/**
 * Generate insights from Bias Detective session
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
  return generateSessionInsights(userId, sessionData, 'bias_detective');
}

/**
 * Generate insights from IFS session
 */
export async function generateIFSInsights(
  userId: string,
  sessionData: {
    identifiedParts: string[];
    conversations: Record<string, string>;
  },
): Promise<GenerationResponse> {
  return generateSessionInsights(userId, sessionData, 'ifs_work');
}

/**
 * Generate pattern insights from user history
 */
export async function generatePatternInsights(
  userId: string,
  timeWindow: 'week' | 'month' | 'all' = 'month',
): Promise<GenerationResponse> {
  try {
    const response = await fetch(`${RAG_API_BASE}/insights/patterns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        timeWindow,
      }),
    });

    if (!response.ok) {
      throw new Error(`Pattern insights API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('[RAG] Error generating pattern insights:', error);
    throw error;
  }
}

// ============================================
// PRACTICE PERSONALIZATION
// ============================================

/**
 * Get personalized practice steps
 */
export async function personalizePractice(
  userId: string,
  practiceId: string,
  practiceTitle: string,
  customContext?: Record<string, any>,
): Promise<GenerationResponse> {
  try {
    const response = await fetch(`${RAG_API_BASE}/practices/personalize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        practiceId,
        practiceTitle,
        customContext,
      }),
    });

    if (!response.ok) {
      throw new Error(`Personalization API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('[RAG] Error personalizing practice:', error);
    throw error;
  }
}

/**
 * Get suggested customizations for a practice
 */
export async function getSuggestedCustomizations(
  userId: string,
  practiceId: string,
): Promise<Record<string, any>> {
  try {
    const response = await fetch(
      `${RAG_API_BASE}/practices/customizations?userId=${userId}&practiceId=${practiceId}`,
    );

    if (!response.ok) {
      throw new Error(`Customizations API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('[RAG] Error getting customizations:', error);
    throw error;
  }
}

/**
 * Save customized practice
 */
export async function saveCustomizedPractice(
  userId: string,
  practiceId: string,
  customSteps: Array<{ order: number; instruction: string }>,
  notes?: string,
): Promise<{ success: boolean; customPracticeId: string }> {
  try {
    const response = await fetch(`${RAG_API_BASE}/practices/save-custom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        practiceId,
        customSteps,
        notes,
      }),
    });

    if (!response.ok) {
      throw new Error(`Save custom practice API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('[RAG] Error saving customized practice:', error);
    throw error;
  }
}

// ============================================
// USER DATA SYNC
// ============================================

/**
 * Sync a user session with backend
 * Called when user completes a session (BiasDetective, IFS, etc.)
 */
export async function syncUserSession(
  userId: string,
  sessionData: UserSession,
  userPreferences?: Record<string, any>,
): Promise<SyncResponse> {
  try {
    const payload: SyncPayload = {
      userId,
      sessionData,
      userPreferences: userPreferences || {},
      timestamp: new Date(),
    };

    const response = await fetch(`${RAG_API_BASE}/user/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Sync API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('[RAG] Error syncing session:', error);
    throw error;
  }
}

/**
 * Sync multiple sessions
 */
export async function batchSyncSessions(
  userId: string,
  sessions: UserSession[],
): Promise<SyncResponse[]> {
  try {
    const response = await fetch(`${RAG_API_BASE}/user/sync-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        sessions,
      }),
    });

    if (!response.ok) {
      throw new Error(`Batch sync API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('[RAG] Error batch syncing sessions:', error);
    throw error;
  }
}

/**
 * Get user sync status
 */
export async function getUserSyncStatus(userId: string): Promise<Record<string, any>> {
  try {
    const response = await fetch(`${RAG_API_BASE}/user/status?userId=${userId}`);

    if (!response.ok) {
      throw new Error(`Sync status API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('[RAG] Error getting sync status:', error);
    throw error;
  }
}

/**
 * Delete user data (GDPR)
 */
export async function deleteUserData(userId: string): Promise<SyncResponse> {
  try {
    const response = await fetch(`${RAG_API_BASE}/user/delete-data`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error(`Delete API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('[RAG] Error deleting user data:', error);
    throw error;
  }
}

// ============================================
// HEALTH CHECK
// ============================================

/**
 * Check if RAG system is healthy
 */
export async function checkRAGHealth(): Promise<{
  healthy: boolean;
  services: Record<string, { status: 'ok' | 'error'; message: string }>;
}> {
  try {
    const response = await fetch(`${RAG_API_BASE}/health`);

    if (!response.ok) {
      return {
        healthy: false,
        services: {
          api: { status: 'error', message: 'API server not responding' },
        },
      };
    }

    return response.json();
  } catch (error) {
    console.error('[RAG] Health check failed:', error);
    return {
      healthy: false,
      services: {
        api: { status: 'error', message: `Connection error: ${error}` },
      },
    };
  }
}
