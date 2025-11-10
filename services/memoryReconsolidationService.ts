/**
 * Memory Reconsolidation Service
 * Frontend client for memory reconsolidation endpoints
 * Handles belief extraction, contradiction mining, and session completion
 */

import type {
  ImplicitBelief,
  ContradictionInsight,
  JuxtapositionCycle,
  MemoryReconsolidationSession,
  SessionCompletionPayload,
  SessionCompletionResponse,
} from '../types';

const RAG_API_BASE = process.env.REACT_APP_RAG_API_BASE || '/api';

// ============================================
// CACHING
// ============================================

/**
 * Module-level cache for the most recent belief extraction result
 * Supports session recovery if the wizard needs to restore state
 */
let beliefsCache: {
  beliefs: ImplicitBelief[];
  timestamp: number;
} | null = null;

const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Get cached beliefs if they're still valid
 */
function getCachedBeliefs(): ImplicitBelief[] | null {
  if (!beliefsCache) return null;
  const now = Date.now();
  if (now - beliefsCache.timestamp > CACHE_EXPIRY_MS) {
    beliefsCache = null;
    return null;
  }
  return beliefsCache.beliefs;
}

/**
 * Store beliefs in cache
 */
function setCachedBeliefs(beliefs: ImplicitBelief[]): void {
  beliefsCache = {
    beliefs,
    timestamp: Date.now(),
  };
}

/**
 * Clear the beliefs cache
 */
export function clearBeliefsCache(): void {
  beliefsCache = null;
}

// ============================================
// BELIEF EXTRACTION
// ============================================

/**
 * Extract implicit beliefs from user input
 * Analyzes user responses to identify underlying beliefs, assumptions, and patterns
 */
export async function extractImplicitBeliefs(
  userId: string,
  context: string,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
): Promise<ImplicitBelief[]> {
  try {
    // Check cache first for session recovery
    const cached = getCachedBeliefs();
    if (cached) {
      console.log('[Memory Recon] Using cached beliefs for session recovery');
      return cached;
    }

    const response = await fetch(`${RAG_API_BASE}/memory/beliefs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        context,
        conversationHistory: conversationHistory || [],
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Belief extraction failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    const beliefs: ImplicitBelief[] = data.beliefs || [];

    // Cache the result for session recovery
    setCachedBeliefs(beliefs);

    console.log(`[Memory Recon] Extracted ${beliefs.length} implicit beliefs`);
    return beliefs;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('[Memory Recon] Error extracting beliefs:', errorMessage);
    throw new Error(
      `Failed to extract implicit beliefs: ${errorMessage}. Please try again.`,
    );
  }
}

// ============================================
// CONTRADICTION MINING
// ============================================

/**
 * Mine contradictions between beliefs
 * Identifies juxtaposition cycles and contradictory patterns
 */
export async function mineContradictions(
  userId: string,
  beliefs: ImplicitBelief[],
): Promise<ContradictionInsight[]> {
  try {
    if (!beliefs || beliefs.length === 0) {
      throw new Error('No beliefs provided for contradiction mining');
    }

    const response = await fetch(`${RAG_API_BASE}/memory/contradictions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        beliefs,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Contradiction mining failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    const contradictions: ContradictionInsight[] = data.contradictions || [];

    console.log(
      `[Memory Recon] Identified ${contradictions.length} contradiction insights`,
    );
    return contradictions;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('[Memory Recon] Error mining contradictions:', errorMessage);
    throw new Error(
      `Failed to analyze contradictions: ${errorMessage}. Please try again.`,
    );
  }
}

// ============================================
// JUXTAPOSITION CYCLE HELPERS
// ============================================

/**
 * Reformat juxtaposition cycles for display/processing
 * Useful for organizing contradictions into a more digestible format
 */
export function reformatJuxtapositionCycles(
  cycles: JuxtapositionCycle[],
): Array<{
  id: string;
  beliefPair: [string, string];
  contradiction: string;
  depth: 'surface' | 'moderate' | 'deep';
}> {
  return cycles.map((cycle, index) => ({
    id: `cycle-${index}`,
    beliefPair: [cycle.beliefA.belief, cycle.beliefB.belief],
    contradiction: cycle.contradiction,
    depth: cycle.depth,
  }));
}

/**
 * Extract depth distribution from cycles
 * Shows how many deep, moderate, and surface-level contradictions exist
 */
export function analyzeContradictionDepth(
  cycles: JuxtapositionCycle[],
): {
  deep: number;
  moderate: number;
  surface: number;
} {
  return cycles.reduce(
    (acc, cycle) => {
      acc[cycle.depth] = (acc[cycle.depth] || 0) + 1;
      return acc;
    },
    { deep: 0, moderate: 0, surface: 0 },
  );
}

// ============================================
// SESSION COMPLETION
// ============================================

/**
 * Submit session completion with final beliefs and contradictions resolved
 * Syncs the user's work back to the backend for storage and insights generation
 */
export async function submitSessionCompletion(
  payload: SessionCompletionPayload,
): Promise<SessionCompletionResponse> {
  try {
    if (!payload.sessionId || !payload.userId) {
      throw new Error('sessionId and userId are required');
    }

    const response = await fetch(`${RAG_API_BASE}/memory/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: payload.sessionId,
        userId: payload.userId,
        finalBeliefs: payload.finalBeliefs,
        contradictionInsights: payload.contradictionInsights,
        personalReflection: payload.personalReflection,
        commitments: payload.commitments || [],
        timestamp: payload.timestamp,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Session completion failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    // Clear cache on successful completion
    clearBeliefsCache();

    console.log(
      `[Memory Recon] Session ${payload.sessionId} completed successfully`,
    );
    return {
      success: true,
      sessionId: payload.sessionId,
      integrationSummary: data.integrationSummary || '',
      suggestedPractices: data.suggestedPractices || [],
      followUpRecommendations: data.followUpRecommendations || [],
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('[Memory Recon] Error completing session:', errorMessage);
    throw new Error(
      `Failed to complete session: ${errorMessage}. Your progress may still be recoverable.`,
    );
  }
}

/**
 * Get a previously saved memory reconsolidation session
 * Useful for resuming or reviewing past work
 */
export async function getSession(
  userId: string,
  sessionId: string,
): Promise<MemoryReconsolidationSession> {
  try {
    const response = await fetch(
      `${RAG_API_BASE}/memory/sessions/${sessionId}?userId=${userId}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Session retrieval failed: ${response.status} ${response.statusText}`,
      );
    }

    const session = await response.json();
    console.log(`[Memory Recon] Retrieved session ${sessionId}`);
    return session;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('[Memory Recon] Error retrieving session:', errorMessage);
    throw new Error(
      `Failed to retrieve session: ${errorMessage}. Please check the session ID.`,
    );
  }
}

/**
 * List all sessions for a user
 */
export async function listSessions(userId: string): Promise<MemoryReconsolidationSession[]> {
  try {
    const response = await fetch(`${RAG_API_BASE}/memory/sessions?userId=${userId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(
        `Sessions listing failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    console.log(`[Memory Recon] Retrieved ${data.sessions?.length || 0} sessions`);
    return data.sessions || [];
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('[Memory Recon] Error listing sessions:', errorMessage);
    throw new Error(
      `Failed to list sessions: ${errorMessage}.`,
    );
  }
}

// ============================================
// HEALTH CHECK
// ============================================

/**
 * Check if memory reconsolidation service is available
 */
export async function checkMemoryReconHealth(): Promise<{
  available: boolean;
  message: string;
}> {
  try {
    const response = await fetch(`${RAG_API_BASE}/health`);

    if (!response.ok) {
      return {
        available: false,
        message: 'RAG API not responding',
      };
    }

    const health = await response.json();
    const isHealthy = health.healthy === true;

    return {
      available: isHealthy,
      message: isHealthy ? 'Memory reconsolidation service is available' : 'Service degraded',
    };
  } catch (error) {
    console.error('[Memory Recon] Health check failed:', error);
    return {
      available: false,
      message: 'Connection error - service unavailable',
    };
  }
}
