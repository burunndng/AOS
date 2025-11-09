/**
 * RAG Retrieval Module
 * Handles semantic search and context retrieval for RAG system
 */

import { generateEmbedding } from '../lib/embeddings.js';
import { semanticSearch, queryVectors } from '../lib/pinecone.js';
import { getDatabase } from '../lib/db.js';
import type {
  RAGContext,
  QueryResult,
  UserHistory,
  UserSession,
  GenerationRequest,
} from '../lib/types.js';

/**
 * Retrieve RAG context for a user query
 */
export async function retrieveContext(
  request: GenerationRequest,
): Promise<RAGContext> {
  const { userId, query, filters = {}, topK = 5 } = request;

  console.log(`[RAG] Retrieving context for user: ${userId}, query: ${query}`);

  // Generate embedding for the query
  const queryEmbedding = await generateEmbedding(query);

  // Retrieve relevant practices, frameworks, and user sessions in parallel
  const [practices, frameworks, userSessions] = await Promise.all([
    retrievePractices(queryEmbedding, filters, topK),
    retrieveFrameworks(queryEmbedding, filters, topK),
    retrieveUserSessions(userId, topK),
  ]);

  // Build user history from sessions
  const userHistory = await buildUserHistory(userId, userSessions);

  // Generate insights from retrieved context
  const relevantInsights = generateInsightsFromContext(practices, frameworks);

  const context: RAGContext = {
    userId,
    userHistory,
    retrievedPractices: practices,
    retrievedFrameworks: frameworks,
    userSessions,
    relevantInsights,
  };

  console.log(`[RAG] Retrieved ${practices.length} practices, ${frameworks.length} frameworks`);
  return context;
}

/**
 * Retrieve relevant practices
 */
export async function retrievePractices(
  embedding: number[],
  filters: Record<string, any> = {},
  topK: number = 5,
): Promise<QueryResult[]> {
  const results = await semanticSearch(embedding, {
    topK,
    type: 'practice' as const,
    ...filters,
  });

  console.log(`[RAG] Retrieved ${results.length} practices`);
  return results;
}

/**
 * Retrieve relevant frameworks
 */
export async function retrieveFrameworks(
  embedding: number[],
  filters: Record<string, any> = {},
  topK: number = 5,
): Promise<QueryResult[]> {
  const results = await semanticSearch(embedding, {
    topK,
    type: 'framework' as const,
    ...filters,
  });

  console.log(`[RAG] Retrieved ${results.length} frameworks`);
  return results;
}

/**
 * Retrieve user's past sessions for context
 */
export async function retrieveUserSessions(
  userId: string,
  topK: number = 5,
): Promise<UserSession[]> {
  const db = getDatabase();
  const sessionDocs = await db.getUserSessions(userId);

  // Convert documents to UserSession format
  return sessionDocs
    .map((doc) => ({
      id: doc._id?.toString() || '',
      userId: doc.userId,
      type: doc.type,
      content: doc.content,
      insights: doc.insights,
      completedAt: new Date(doc.createdAt),
      embedding: doc.embedding,
    }))
    .slice(-topK); // Get most recent sessions
}

/**
 * Build user history from sessions
 */
export async function buildUserHistory(
  userId: string,
  userSessions: UserSession[],
): Promise<UserHistory> {
  const db = getDatabase();

  // Get completed practices from sessions
  const completedPractices: string[] = [];
  const biases: string[] = [];
  let attachmentStyle = '';
  let developmentalStage = '';

  for (const session of userSessions) {
    if (session.type === 'practice' && session.content.practiceId) {
      completedPractices.push(session.content.practiceId);
    }
    if (session.type === 'bias_detective' && session.content.identifiedBiases) {
      biases.push(...session.content.identifiedBiases);
    }
    if (session.type === 'framework_assessment') {
      if (session.content.assessmentType === 'Attachment') {
        attachmentStyle = session.content.result;
      }
      if (session.content.assessmentType === 'Kegan') {
        developmentalStage = session.content.result;
      }
    }
  }

  const userHistory: UserHistory = {
    completedPractices: [...new Set(completedPractices)], // Remove duplicates
    currentStack: [], // Can be loaded from separate storage
    preferences: {
      preferredDuration: 'medium',
      preferredModalities: [],
      preferredFrameworks: [],
      focusAreas: [],
    },
    biases: [...new Set(biases)],
    attachmentStyle,
    developmentalStage,
  };

  return userHistory;
}

/**
 * Retrieve similar practices based on a practice ID
 */
export async function retrieveSimilarPractices(
  practiceId: string,
  topK: number = 5,
): Promise<QueryResult[]> {
  const db = getDatabase();
  const practice = await db.getPractice(practiceId);

  if (!practice || !practice.embedding) {
    console.warn(`[RAG] Practice ${practiceId} not found or has no embedding`);
    return [];
  }

  return semanticSearch(practice.embedding, {
    topK,
    type: 'practice',
  });
}

/**
 * Find practices by category with semantic ranking
 */
export async function findPracticesByCategory(
  category: string,
  query?: string,
  topK: number = 10,
): Promise<QueryResult[]> {
  let embedding: number[];

  if (query) {
    embedding = await generateEmbedding(query);
  } else {
    embedding = await generateEmbedding(category);
  }

  return semanticSearch(embedding, {
    topK,
    type: 'practice',
    category,
  });
}

/**
 * Advanced search with multi-criteria filtering
 */
export async function advancedSearch(
  query: string,
  criteria: {
    type?: 'practice' | 'framework' | 'user_session';
    difficulty?: string;
    duration?: number; // max duration in minutes
    frameworks?: string[];
    excludeCompleted?: boolean;
    userId?: string;
  } = {},
  topK: number = 10,
): Promise<QueryResult[]> {
  const embedding = await generateEmbedding(query);

  const filters: Record<string, any> = {};

  if (criteria.type) filters.type = criteria.type;
  if (criteria.difficulty) filters.difficulty = criteria.difficulty;

  let results = await queryVectors(embedding, topK * 2, filters); // Get more results to filter

  // Additional filtering
  if (criteria.duration) {
    results = results.filter((r) => !r.metadata.duration || r.metadata.duration <= criteria.duration!);
  }

  if (criteria.frameworks && criteria.frameworks.length > 0) {
    results = results.filter((r) =>
      r.metadata.frameworks?.some((f) => criteria.frameworks!.includes(f)),
    );
  }

  if (criteria.excludeCompleted && criteria.userId) {
    const db = getDatabase();
    const sessions = await db.getUserSessions(criteria.userId);
    const completedPracticeIds = new Set(
      sessions
        .filter((s) => s.type === 'practice')
        .map((s) => s.content.practiceId),
    );
    results = results.filter((r) => !completedPracticeIds.has(r.id));
  }

  return results.slice(0, topK);
}

/**
 * Health check for retrieval service
 */
export async function healthCheck(): Promise<{ status: 'ok' | 'error'; message: string }> {
  try {
    const testEmbedding = await generateEmbedding('health check');
    if (testEmbedding.length !== 1536) {
      return { status: 'error', message: 'Embedding dimension mismatch' };
    }

    return { status: 'ok', message: 'Retrieval service is healthy' };
  } catch (error) {
    return { status: 'error', message: `Retrieval service error: ${error}` };
  }
}

/**
 * Generate insights from retrieved context
 */
function generateInsightsFromContext(
  practices: QueryResult[],
  frameworks: QueryResult[],
): string[] {
  const insights: string[] = [];

  // Extract key insights from practice metadata
  for (const practice of practices.slice(0, 3)) {
    if (practice.metadata.evidence && practice.metadata.evidence.length > 0) {
      insights.push(`${practice.metadata.practiceTitle}: ${practice.metadata.evidence[0]}`);
    }
  }

  // Extract framework insights
  for (const framework of frameworks.slice(0, 2)) {
    if (framework.metadata.frameworkType) {
      insights.push(`Consider ${framework.metadata.frameworkType} framework for deeper understanding`);
    }
  }

  return insights;
}
