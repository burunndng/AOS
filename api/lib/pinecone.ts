/**
 * Pinecone Vector Database Client
 * Handles indexing and querying of 1536-dimensional embeddings
 * Supports both real Pinecone (production) and mock (development)
 */

import { Pinecone } from '@pinecone-database/pinecone';
import { cosineSimilarity } from './embeddings';
import type { PineconeVector, QueryResult, PineconeVectorMetadata } from './types';

interface PineconeIndexClient {
  upsert(vectors: PineconeVector[]): Promise<number>;
  query(embedding: number[], topK: number, filter?: Record<string, any>): Promise<QueryResult[]>;
  fetch(ids: string[]): Promise<PineconeVector[]>;
  delete(ids: string[]): Promise<void>;
  describeIndexStats(): Promise<{ vectorCount: number; totalVectorCount: number }>;
}

/**
 * Real Pinecone Index for production
 */
class RealPineconeIndex implements PineconeIndexClient {
  private index: any; // Pinecone Index type

  constructor(index: any) {
    this.index = index;
  }

  async upsert(vectors: PineconeVector[]): Promise<number> {
    try {
      // Convert to Pinecone format (id, values, metadata)
      const pineconeVectors = vectors.map((v) => ({
        id: v.id,
        values: v.values,
        metadata: v.metadata,
      }));

      await this.index.upsert(pineconeVectors);
      console.log(`[Pinecone] Upserted ${vectors.length} vectors to real index`);
      return vectors.length;
    } catch (error) {
      console.error('[Pinecone] Error upserting vectors:', error);
      throw error;
    }
  }

  async query(
    embedding: number[],
    topK: number = 5,
    filter?: Record<string, any>,
  ): Promise<QueryResult[]> {
    try {
      const queryRequest: any = {
        vector: embedding,
        topK,
        includeMetadata: true,
      };

      if (filter) {
        queryRequest.filter = filter;
      }

      const results = await this.index.query(queryRequest);

      return (results.matches || []).map((match: any) => ({
        id: match.id,
        score: match.score || 0,
        metadata: (match.metadata || {}) as PineconeVectorMetadata,
      }));
    } catch (error) {
      console.error('[Pinecone] Error querying vectors:', error);
      throw error;
    }
  }

  async fetch(ids: string[]): Promise<PineconeVector[]> {
    try {
      const results = await this.index.fetch(ids);
      return Object.values(results.records || {}).map((record: any) => ({
        id: record.id,
        values: record.values,
        metadata: record.metadata as PineconeVectorMetadata,
      }));
    } catch (error) {
      console.error('[Pinecone] Error fetching vectors:', error);
      throw error;
    }
  }

  async delete(ids: string[]): Promise<void> {
    try {
      await this.index.deleteMany(ids);
      console.log(`[Pinecone] Deleted ${ids.length} vectors from real index`);
    } catch (error) {
      console.error('[Pinecone] Error deleting vectors:', error);
      throw error;
    }
  }

  async describeIndexStats(): Promise<{ vectorCount: number; totalVectorCount: number }> {
    try {
      const stats = await this.index.describeIndexStats();
      return {
        vectorCount: stats.totalVectorCount || 0,
        totalVectorCount: stats.totalVectorCount || 0,
      };
    } catch (error) {
      console.error('[Pinecone] Error getting index stats:', error);
      throw error;
    }
  }
}

/**
 * Mock Pinecone Index for development
 */
class MockPineconeIndex implements PineconeIndexClient {
  private vectors: Map<string, PineconeVector> = new Map();
  private idCounter = 0;

  async upsert(vectors: PineconeVector[]): Promise<number> {
    for (const vector of vectors) {
      this.vectors.set(vector.id, vector);
    }
    console.log(`[Pinecone] Upserted ${vectors.length} vectors (mock)`);
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
    console.log(`[Pinecone] Deleted ${ids.length} vectors (mock)`);
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
let indexInstance: PineconeIndexClient | null = null;

/**
 * Initialize Pinecone index - detects production credentials and uses real API
 */
export async function initializePinecone(): Promise<PineconeIndexClient> {
  if (!indexInstance) {
    const apiKey = process.env.PINECONE_API_KEY;
    const hostname = process.env.PINECONE_HOSTNAME;

    if (apiKey && hostname) {
      try {
        // Use real Pinecone in production
        const pc = new Pinecone({ apiKey });

        // Extract index name from hostname if it's a full URL
        // Format: https://aura-os-telq8p6.svc.aped-4627-b74a.pinecone.io
        // Index name is the first part before the first dot or hyphen: aura-os
        let indexName = hostname;
        if (hostname.includes('http')) {
          // Remove protocol and extract index name
          const host = hostname.replace(/^https?:\/\//, '').split('.')[0];
          // Index name is typically the first part (before first hyphen with region info)
          indexName = host.split('-')[0] + '-' + host.split('-')[1]; // e.g., "aura-os"
        }

        const index = pc.Index(indexName);
        indexInstance = new RealPineconeIndex(index);
        console.log(`[Pinecone] Index initialized (using real Pinecone: ${indexName})`);
      } catch (error) {
        console.error('[Pinecone] Failed to initialize real Pinecone:', error);
        console.log('[Pinecone] Falling back to mock index');
        indexInstance = new MockPineconeIndex();
      }
    } else {
      // Use mock for development
      indexInstance = new MockPineconeIndex();
      console.log('[Pinecone] Index initialized (using mock for development)');
      if (!apiKey) console.log('[Pinecone] Tip: Set PINECONE_API_KEY to use real index');
      if (!hostname) console.log('[Pinecone] Tip: Set PINECONE_HOSTNAME to use real index');
    }
  }
  return indexInstance;
}

/**
 * Get Pinecone index instance
 */
export function getPineconeIndex(): PineconeIndexClient {
  if (!indexInstance) {
    throw new Error('Pinecone index not initialized. Call initializePinecone() first.');
  }
  return indexInstance;
}

/**
 * Upsert vectors to Pinecone
 */
export async function upsertVectors(vectors: PineconeVector[]): Promise<number> {
  const index = indexInstance || (await initializePinecone());
  return index.upsert(vectors);
}

/**
 * Query vectors from Pinecone
 */
export async function queryVectors(
  embedding: number[],
  topK: number = 5,
  filter?: Record<string, any>,
): Promise<QueryResult[]> {
  const index = indexInstance || (await initializePinecone());
  return index.query(embedding, topK, filter);
}

/**
 * Fetch specific vectors by ID
 */
export async function fetchVectors(ids: string[]): Promise<PineconeVector[]> {
  const index = indexInstance || (await initializePinecone());
  return index.fetch(ids);
}

/**
 * Delete vectors from Pinecone
 */
export async function deleteVectors(ids: string[]): Promise<void> {
  const index = indexInstance || (await initializePinecone());
  await index.delete(ids);
}

/**
 * Get index statistics
 */
export async function getIndexStats(): Promise<{
  vectorCount: number;
  totalVectorCount: number;
}> {
  const index = indexInstance || (await initializePinecone());
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
  const index = indexInstance || (await initializePinecone());
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
 * Health check for Pinecone
 */
export async function healthCheck(): Promise<{ status: 'ok' | 'error'; message: string }> {
  try {
    const stats = await getIndexStats();
    return {
      status: 'ok',
      message: `Pinecone healthy. Total vectors: ${stats.totalVectorCount}`,
    };
  } catch (error) {
    return {
      status: 'error',
      message: `Pinecone error: ${error}`,
    };
  }
}
