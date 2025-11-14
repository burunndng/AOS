/**
 * Upstash Vector Database Client
 * Handles indexing and querying of 1536-dimensional embeddings using Upstash's serverless vector DB
 * Supports both real Upstash (production) and mock (development)
 */

import { cosineSimilarity } from './embeddings';
import type { PineconeVector, QueryResult, PineconeVectorMetadata } from './types';

interface UpstashIndexClient {
  upsert(vectors: PineconeVector[]): Promise<number>;
  query(embedding: number[], topK: number, filter?: Record<string, any>): Promise<QueryResult[]>;
  fetch(ids: string[]): Promise<PineconeVector[]>;
  delete(ids: string[]): Promise<void>;
  describeIndexStats(): Promise<{ vectorCount: number; totalVectorCount: number }>;
}

/**
 * Real Upstash Vector Index for production
 */
class RealUpstashIndex implements UpstashIndexClient {
  private restUrl: string;
  private restToken: string;

  constructor(restUrl: string, restToken: string) {
    this.restUrl = restUrl;
    this.restToken = restToken;
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.restToken}`,
      'Content-Type': 'application/json',
    };
  }

  async upsert(vectors: PineconeVector[]): Promise<number> {
    try {
      // Upstash uses REST API for upsert
      // Format: POST /upsert with body containing vectors array
      const upstashVectors = vectors.map((v) => ({
        id: v.id,
        vector: v.values,
        metadata: v.metadata,
      }));

      const response = await fetch(`${this.restUrl}/upsert`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ vectors: upstashVectors }),
      });

      if (!response.ok) {
        throw new Error(`Upstash upsert failed: ${response.statusText}`);
      }

      console.log(`[Upstash] Upserted ${vectors.length} vectors to real index`);
      return vectors.length;
    } catch (error) {
      console.error('[Upstash] Error upserting vectors:', error);
      throw error;
    }
  }

  async query(
    embedding: number[],
    topK: number = 5,
    filter?: Record<string, any>,
  ): Promise<QueryResult[]> {
    try {
      // Upstash uses REST API for query
      // Format: POST /query with vector and topK
      const body: any = {
        vector: embedding,
        topK,
        includeMetadata: true,
      };

      if (filter) {
        body.filter = filter;
      }

      const response = await fetch(`${this.restUrl}/query`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Upstash query failed: ${response.statusText}`);
      }

      const data = await response.json();
      const results = (data.results || []).map((match: any) => ({
        id: match.id,
        score: match.score || 0,
        metadata: (match.metadata || {}) as PineconeVectorMetadata,
      }));

      return results;
    } catch (error) {
      console.error('[Upstash] Error querying vectors:', error);
      throw error;
    }
  }

  async fetch(ids: string[]): Promise<PineconeVector[]> {
    try {
      // Upstash uses REST API for fetch
      // Format: POST /fetch with ids array
      const response = await fetch(`${this.restUrl}/fetch`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) {
        throw new Error(`Upstash fetch failed: ${response.statusText}`);
      }

      const data = await response.json();
      return (data.vectors || []).map((record: any) => ({
        id: record.id,
        values: record.vector,
        metadata: record.metadata as PineconeVectorMetadata,
      }));
    } catch (error) {
      console.error('[Upstash] Error fetching vectors:', error);
      throw error;
    }
  }

  async delete(ids: string[]): Promise<void> {
    try {
      // Upstash uses REST API for delete
      // Format: POST /delete with ids array
      const response = await fetch(`${this.restUrl}/delete`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) {
        throw new Error(`Upstash delete failed: ${response.statusText}`);
      }

      console.log(`[Upstash] Deleted ${ids.length} vectors from real index`);
    } catch (error) {
      console.error('[Upstash] Error deleting vectors:', error);
      throw error;
    }
  }

  async describeIndexStats(): Promise<{ vectorCount: number; totalVectorCount: number }> {
    try {
      // Upstash uses REST API for info
      // Format: GET /info
      const response = await fetch(`${this.restUrl}/info`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Upstash info failed: ${response.statusText}`);
      }

      const data = await response.json();
      const vectorCount = data.vectorCount || data.totalVectorCount || 0;

      return {
        vectorCount,
        totalVectorCount: vectorCount,
      };
    } catch (error) {
      console.error('[Upstash] Error getting index stats:', error);
      throw error;
    }
  }
}

/**
 * Mock Upstash Vector Index for development
 */
class MockUpstashIndex implements UpstashIndexClient {
  private vectors: Map<string, PineconeVector> = new Map();

  async upsert(vectors: PineconeVector[]): Promise<number> {
    for (const vector of vectors) {
      this.vectors.set(vector.id, vector);
    }
    console.log(`[Upstash] Upserted ${vectors.length} vectors (mock)`);
    return vectors.length;
  }

  async query(
    embedding: number[],
    topK: number = 5,
    filter?: Record<string, any>,
  ): Promise<QueryResult[]> {
    const results: Array<{ id: string; score: number; metadata: PineconeVectorMetadata }> = [];

    for (const [id, vector] of this.vectors) {
      // Check filter if provided
      if (filter && !this.matchesFilter(vector.metadata, filter)) {
        continue;
      }

      const similarity = cosineSimilarity(embedding, vector.values);
      results.push({
        id,
        score: similarity,
        metadata: vector.metadata,
      });
    }

    // Sort by similarity score (descending) and return top K
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  async fetch(ids: string[]): Promise<PineconeVector[]> {
    return ids.map((id) => this.vectors.get(id)).filter((v) => v !== undefined) as PineconeVector[];
  }

  async delete(ids: string[]): Promise<void> {
    for (const id of ids) {
      this.vectors.delete(id);
    }
    console.log(`[Upstash] Deleted ${ids.length} vectors (mock)`);
  }

  async describeIndexStats(): Promise<{ vectorCount: number; totalVectorCount: number }> {
    const count = this.vectors.size;
    return {
      vectorCount: count,
      totalVectorCount: count,
    };
  }

  private matchesFilter(metadata: PineconeVectorMetadata, filter: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(filter)) {
      if (metadata[key as keyof PineconeVectorMetadata] !== value) {
        return false;
      }
    }
    return true;
  }
}

// Singleton instance
let indexInstance: UpstashIndexClient | null = null;

/**
 * Initialize Upstash Vector index - detects production credentials and uses real API
 */
export async function initializeUpstash(): Promise<UpstashIndexClient> {
  if (!indexInstance) {
    const restUrl = process.env.UPSTASH_VECTOR_REST_URL;
    const restToken = process.env.UPSTASH_VECTOR_REST_TOKEN;

    if (restUrl && restToken) {
      try {
        // Validate credentials by making a test request
        const response = await fetch(`${restUrl}/info`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${restToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          // Use real Upstash in production
          indexInstance = new RealUpstashIndex(restUrl, restToken);
          console.log(`[Upstash] Index initialized (using real Upstash)`);
        } else {
          throw new Error(`Failed to authenticate with Upstash: ${response.statusText}`);
        }
      } catch (error) {
        console.error('[Upstash] Failed to initialize real Upstash:', error);
        console.log('[Upstash] Falling back to mock index');
        indexInstance = new MockUpstashIndex();
      }
    } else {
      // Use mock for development
      indexInstance = new MockUpstashIndex();
      console.log('[Upstash] Index initialized (using mock for development)');
      if (!restUrl) console.log('[Upstash] Tip: Set UPSTASH_VECTOR_REST_URL to use real index');
      if (!restToken) console.log('[Upstash] Tip: Set UPSTASH_VECTOR_REST_TOKEN to use real index');
    }
  }
  return indexInstance;
}

/**
 * Get Upstash Vector index instance
 */
export function getUpstashIndex(): UpstashIndexClient {
  if (!indexInstance) {
    throw new Error('Upstash Vector index not initialized. Call initializeUpstash() first.');
  }
  return indexInstance;
}

/**
 * Upsert vectors to Upstash Vector
 */
export async function upsertVectors(vectors: PineconeVector[]): Promise<number> {
  const index = indexInstance || (await initializeUpstash());
  return index.upsert(vectors);
}

/**
 * Query vectors from Upstash Vector
 */
export async function queryVectors(
  embedding: number[],
  topK: number = 5,
  filter?: Record<string, any>,
): Promise<QueryResult[]> {
  const index = indexInstance || (await initializeUpstash());
  return index.query(embedding, topK, filter);
}

/**
 * Fetch specific vectors by ID
 */
export async function fetchVectors(ids: string[]): Promise<PineconeVector[]> {
  const index = indexInstance || (await initializeUpstash());
  return index.fetch(ids);
}

/**
 * Delete vectors from Upstash Vector
 */
export async function deleteVectors(ids: string[]): Promise<void> {
  const index = indexInstance || (await initializeUpstash());
  await index.delete(ids);
}

/**
 * Get index statistics
 */
export async function getIndexStats(): Promise<{
  vectorCount: number;
  totalVectorCount: number;
}> {
  const index = indexInstance || (await initializeUpstash());
  return index.describeIndexStats();
}

/**
 * Batch upsert with progress tracking
 */
export async function batchUpsertVectors(
  vectors: PineconeVector[],
  batchSize: number = 100,
  onProgress?: (current: number, total: number) => void,
): Promise<number> {
  const index = indexInstance || (await initializeUpstash());
  let totalUpserted = 0;

  for (let i = 0; i < vectors.length; i += batchSize) {
    const batch = vectors.slice(i, Math.min(i + batchSize, vectors.length));
    const upserted = await index.upsert(batch);
    totalUpserted += upserted;

    if (onProgress) {
      onProgress(Math.min(i + batchSize, vectors.length), vectors.length);
    }
  }

  return totalUpserted;
}

/**
 * Semantic search with filters
 */
export async function semanticSearch(
  embedding: number[],
  options: {
    topK?: number;
    type?: 'practice' | 'framework' | 'user_session' | 'insight';
    category?: string;
    difficulty?: string;
    minSimilarity?: number;
  } = {},
): Promise<QueryResult[]> {
  const { topK = 5, type, category, difficulty, minSimilarity = 0 } = options;

  const filter: Record<string, any> = {};
  if (type) filter.type = type;
  if (category) filter.category = category;
  if (difficulty) filter.difficulty = difficulty;

  const results = await queryVectors(embedding, topK, filter);
  return results.filter((result) => result.score >= minSimilarity);
}

/**
 * Health check for Upstash Vector
 */
export async function healthCheck(): Promise<{ status: 'ok' | 'error'; message: string }> {
  try {
    const stats = await getIndexStats();
    return {
      status: 'ok',
      message: `Upstash Vector healthy. Total vectors: ${stats.totalVectorCount}`,
    };
  } catch (error) {
    return {
      status: 'error',
      message: `Upstash Vector error: ${error}`,
    };
  }
}
