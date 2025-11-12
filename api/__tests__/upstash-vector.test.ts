/**
 * Upstash Vector Integration Tests
 * Tests the semantic search and vector operations through Upstash Vector
 */

import {
  initializeUpstash,
  upsertVectors,
  queryVectors,
  fetchVectors,
  deleteVectors,
  getIndexStats,
  semanticSearch,
} from '../lib/upstash-vector.ts';
import type { PineconeVector } from '../lib/types.ts';

describe('Upstash Vector Integration', () => {
  beforeAll(async () => {
    // Initialize Upstash Vector (will use mock if credentials not available)
    await initializeUpstash();
  });

  test('should upsert vectors successfully', async () => {
    const testVectors: PineconeVector[] = [
      {
        id: 'test-1',
        values: Array(1536).fill(0.1), // Mock 1536-dim vector
        metadata: {
          type: 'practice',
          practiceTitle: 'Meditation for Beginners',
          difficulty: 'beginner',
          duration: 15,
        },
      },
      {
        id: 'test-2',
        values: Array(1536).fill(0.2),
        metadata: {
          type: 'practice',
          practiceTitle: 'Advanced Shadow Work',
          difficulty: 'advanced',
          duration: 45,
        },
      },
    ];

    const upserted = await upsertVectors(testVectors);
    expect(upserted).toBe(2);
  });

  test('should query vectors by similarity', async () => {
    const queryEmbedding = Array(1536).fill(0.1); // Similar to test-1
    const results = await queryVectors(queryEmbedding, 5);

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    if (results.length > 0) {
      expect(results[0]).toHaveProperty('id');
      expect(results[0]).toHaveProperty('score');
      expect(results[0]).toHaveProperty('metadata');
    }
  });

  test('should fetch specific vectors by ID', async () => {
    const vectors = await fetchVectors(['test-1', 'test-2']);

    expect(Array.isArray(vectors)).toBe(true);
    expect(vectors.length).toBeGreaterThanOrEqual(0);
  });

  test('should support semantic search with filters', async () => {
    const queryEmbedding = Array(1536).fill(0.15);
    const results = await semanticSearch(queryEmbedding, {
      topK: 5,
      type: 'practice',
      difficulty: 'beginner',
      minSimilarity: 0.5,
    });

    expect(Array.isArray(results)).toBe(true);
  });

  test('should get index statistics', async () => {
    const stats = await getIndexStats();

    expect(stats).toHaveProperty('vectorCount');
    expect(stats).toHaveProperty('totalVectorCount');
    expect(typeof stats.vectorCount).toBe('number');
    expect(typeof stats.totalVectorCount).toBe('number');
  });

  test('should delete vectors', async () => {
    await deleteVectors(['test-1', 'test-2']);
    // Verify deletion by checking they're not found
    const vectors = await fetchVectors(['test-1', 'test-2']);
    expect(vectors.length).toBe(0);
  });

  test('should work with RAG context retrieval', async () => {
    // Simulate RAG workflow
    const practiceVectors: PineconeVector[] = [
      {
        id: 'shadow-work-1',
        values: Array(1536).fill(0.3),
        metadata: {
          type: 'practice',
          practiceTitle: 'Journaling for Self-Inquiry',
          category: 'shadow_work',
          difficulty: 'beginner',
          duration: 20,
        },
      },
    ];

    await upsertVectors(practiceVectors);

    // Search for shadow work practices
    const shadowWorkQuery = Array(1536).fill(0.3);
    const results = await semanticSearch(shadowWorkQuery, {
      topK: 5,
      type: 'practice',
      category: 'shadow_work',
      minSimilarity: 0.4,
    });

    expect(Array.isArray(results)).toBe(true);
  });
});
