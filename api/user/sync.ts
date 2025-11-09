/**
 * User Data Sync API Endpoint
 * Synchronizes user sessions with backend and indexes them in Pinecone
 */

import { generateEmbeddingWithMetadata } from '../lib/embeddings.js';
import { upsertVectors } from '../lib/pinecone.js';
import { getDatabase, initializeDatabase } from '../lib/db.js';
import type { SyncPayload, SyncResponse, PineconeVector, PineconeVectorMetadata, UserSessionDocument } from '../lib/types.js';

/**
 * Sync user session data with backend
 * Called when user completes a session (BiasDetectiveWizard, IFS session, etc.)
 */
export async function syncUserSession(
  payload: SyncPayload,
): Promise<SyncResponse> {
  const { userId, sessionData, userPreferences, timestamp } = payload;

  console.log(`[Sync] Syncing session for user: ${userId}, type: ${sessionData.type}`);

  try {
    // Initialize database if needed
    const db = await initializeDatabase();

    // Store session in MongoDB
    const sessionDoc: UserSessionDocument = {
      userId,
      sessionId: sessionData.id,
      type: sessionData.type,
      content: sessionData.content,
      insights: sessionData.insights || [],
      completedAt: sessionData.completedAt,
      createdAt: new Date(),
    };

    const storedSessionId = await db.addUserSession(sessionDoc);
    console.log(`[Sync] Stored session in database: ${storedSessionId}`);

    // Generate embedding for the session
    const sessionSummary = generateSessionSummary(sessionData);
    const embeddingResult = await generateEmbeddingWithMetadata(sessionSummary, {
      type: 'user_session',
      userId,
      sessionId: sessionData.id,
      sessionType: sessionData.type,
      completionDate: timestamp.toISOString(),
    } as PineconeVectorMetadata);

    // Index session in Pinecone
    const vector: PineconeVector = {
      id: `user-session-${userId}-${sessionData.id}`,
      values: embeddingResult.embedding,
      metadata: embeddingResult.metadata as PineconeVectorMetadata,
    };

    await upsertVectors([vector]);
    console.log(`[Sync] Indexed session in Pinecone: ${vector.id}`);

    // Store updated user preferences if provided
    if (userPreferences) {
      // This would be stored in a user preferences collection in production
      console.log(`[Sync] Updated user preferences for: ${userId}`);
    }

    // Generate user profile embedding
    const userEmbedding = await generateUserEmbedding(userId, db);

    const response: SyncResponse = {
      success: true,
      message: `Successfully synced session ${sessionData.id} for user ${userId}`,
      indexedSessionId: vector.id,
      updatedUserEmbedding: userEmbedding,
    };

    return response;
  } catch (error) {
    console.error('[Sync] Error syncing session:', error);
    return {
      success: false,
      message: `Error syncing session: ${error}`,
    };
  }
}

/**
 * Sync multiple sessions in batch
 */
export async function batchSyncUserSessions(
  payloads: SyncPayload[],
): Promise<SyncResponse[]> {
  console.log(`[Sync] Batch syncing ${payloads.length} sessions`);

  const responses = await Promise.all(
    payloads.map((payload) => syncUserSession(payload)),
  );

  const successCount = responses.filter((r) => r.success).length;
  console.log(`[Sync] Batch sync complete: ${successCount}/${payloads.length} successful`);

  return responses;
}

/**
 * Generate a summary of a session for embedding
 */
function generateSessionSummary(sessionData: any): string {
  const summaryParts: string[] = [];

  summaryParts.push(`Session type: ${sessionData.type}`);

  switch (sessionData.type) {
    case 'bias_detective':
      if (sessionData.content.decision) {
        summaryParts.push(`Decision: ${sessionData.content.decision}`);
      }
      if (sessionData.content.identifiedBiases && sessionData.content.identifiedBiases.length > 0) {
        summaryParts.push(`Identified biases: ${sessionData.content.identifiedBiases.join(', ')}`);
      }
      break;

    case 'ifs_work':
      if (sessionData.content.identifiedParts && sessionData.content.identifiedParts.length > 0) {
        summaryParts.push(`Parts identified: ${sessionData.content.identifiedParts.join(', ')}`);
      }
      if (sessionData.content.insights && sessionData.content.insights.length > 0) {
        summaryParts.push(`Insights: ${sessionData.content.insights.join('; ')}`);
      }
      break;

    case 'practice':
      if (sessionData.content.practiceTitle) {
        summaryParts.push(`Practice: ${sessionData.content.practiceTitle}`);
      }
      if (sessionData.content.notes) {
        summaryParts.push(`Notes: ${sessionData.content.notes}`);
      }
      break;

    case 'framework_assessment':
      if (sessionData.content.assessmentType) {
        summaryParts.push(`Framework: ${sessionData.content.assessmentType}`);
      }
      if (sessionData.content.result) {
        summaryParts.push(`Result: ${sessionData.content.result}`);
      }
      break;

    default:
      if (sessionData.content.summary) {
        summaryParts.push(`Summary: ${sessionData.content.summary}`);
      }
  }

  return summaryParts.join('. ');
}

/**
 * Generate and store user profile embedding
 * This represents the user's overall development profile
 */
async function generateUserEmbedding(
  userId: string,
  db: any,
): Promise<number[]> {
  // Retrieve user's recent sessions
  const sessions = await db.getUserSessions(userId);
  const recentSessions = sessions.slice(-10);

  // Build user profile summary
  const profileSummary = buildUserProfileSummary(recentSessions);

  // Generate embedding
  const embeddingResult = await generateEmbeddingWithMetadata(profileSummary, {
    type: 'user_profile',
    userId,
  } as PineconeVectorMetadata);

  // Store in Pinecone
  const vector: PineconeVector = {
    id: `user-profile-${userId}`,
    values: embeddingResult.embedding,
    metadata: embeddingResult.metadata as PineconeVectorMetadata,
  };

  await upsertVectors([vector]);

  return embeddingResult.embedding;
}

/**
 * Build user profile summary from sessions
 */
function buildUserProfileSummary(sessions: any[]): string {
  const summary: string[] = [];

  const sessionTypes = new Map<string, number>();
  const allBiases = new Set<string>();
  const allParts = new Set<string>();
  const allPractices = new Set<string>();

  for (const session of sessions) {
    sessionTypes.set(session.type, (sessionTypes.get(session.type) || 0) + 1);

    if (session.content.identifiedBiases) {
      session.content.identifiedBiases.forEach((b: string) => allBiases.add(b));
    }

    if (session.content.identifiedParts) {
      session.content.identifiedParts.forEach((p: string) => allParts.add(p));
    }

    if (session.content.practiceTitle) {
      allPractices.add(session.content.practiceTitle);
    }
  }

  summary.push(`User has completed ${sessions.length} sessions`);

  if (sessionTypes.size > 0) {
    summary.push(`Focus areas: ${Array.from(sessionTypes.keys()).join(', ')}`);
  }

  if (allBiases.size > 0) {
    summary.push(`Cognitive patterns explored: ${Array.from(allBiases).join(', ')}`);
  }

  if (allParts.size > 0) {
    summary.push(`Internal parts identified: ${Array.from(allParts).join(', ')}`);
  }

  if (allPractices.size > 0) {
    summary.push(`Practices engaged: ${Array.from(allPractices).join(', ')}`);
  }

  return summary.join('. ');
}

/**
 * Get user sync status and recommendations
 */
export async function getUserSyncStatus(
  userId: string,
): Promise<Record<string, any>> {
  const db = await initializeDatabase();

  try {
    const sessions = await db.getUserSessions(userId);

    return {
      userId,
      sessionCount: sessions.length,
      lastSyncDate: sessions.length > 0 ? new Date(sessions[sessions.length - 1].createdAt) : null,
      isInitialized: sessions.length > 0,
      recommendedNextAction: getRecommendedNextAction(sessions),
      syncStatus: 'up-to-date',
    };
  } catch (error) {
    console.error('[Sync] Error getting user sync status:', error);
    return {
      userId,
      syncStatus: 'error',
      message: 'Could not retrieve sync status',
    };
  }
}

/**
 * Get recommended next action based on user's session history
 */
function getRecommendedNextAction(sessions: any[]): string {
  if (sessions.length === 0) {
    return 'Start with a Bias Detective session to understand your patterns';
  }

  const recentSession = sessions[sessions.length - 1];
  const sessionsByType = new Map<string, number>();

  for (const session of sessions) {
    sessionsByType.set(session.type, (sessionsByType.get(session.type) || 0) + 1);
  }

  if (!sessionsByType.has('bias_detective')) {
    return 'Try a Bias Detective session to discover your patterns';
  }

  if (!sessionsByType.has('ifs_work')) {
    return 'Explore your inner system with an IFS session';
  }

  if (!sessionsByType.has('practice')) {
    return 'Start integrating practices based on your insights';
  }

  if (sessions.length < 5) {
    return 'Build momentum with more sessions to deepen insights';
  }

  return 'Consider a framework assessment (Kegan, AQAL, or Attachment) to gain perspective';
}

/**
 * Clear user data (GDPR compliance)
 */
export async function deleteUserData(userId: string): Promise<SyncResponse> {
  const db = await initializeDatabase();

  try {
    await db.deleteUserData(userId);

    console.log(`[Sync] Deleted all data for user: ${userId}`);

    return {
      success: true,
      message: `Successfully deleted all data for user ${userId}`,
    };
  } catch (error) {
    console.error('[Sync] Error deleting user data:', error);
    return {
      success: false,
      message: `Error deleting user data: ${error}`,
    };
  }
}

/**
 * Health check for sync service
 */
export async function healthCheck(): Promise<{ status: 'ok' | 'error'; message: string }> {
  try {
    const db = await initializeDatabase();
    const dbHealth = await db.health();

    if (dbHealth.status === 'ok') {
      return { status: 'ok', message: 'Sync service is healthy' };
    }

    return { status: 'error', message: 'Sync service database is not healthy' };
  } catch (error) {
    return { status: 'error', message: `Sync service error: ${error}` };
  }
}
