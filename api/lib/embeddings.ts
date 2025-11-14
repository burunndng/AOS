/**
 * Embeddings Generation Module
 * Handles generation of 1024-dimensional embeddings (BGE_LARGE_EN_V1_5)
 */

import type { EmbeddingResult } from './types';

// Using a mock implementation for embeddings
// In production, use: @google/generative-ai's embedContent method

interface EmbeddingClient {
  generateEmbedding(text: string): Promise<number[]>;
  generateEmbeddings(texts: string[]): Promise<number[][]>;
}

/**
 * Mock Embedding Client for development
 * Generates deterministic embeddings based on text hash
 */
class MockEmbeddingClient implements EmbeddingClient {
  private readonly dimensions = 1024; // Match Upstash Vector BGE_LARGE_EN_V1_5

  /**
   * Generate a deterministic embedding from text
   * In production, this would use actual ML model
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const hash = this.hashText(text);
    const embedding: number[] = [];

    for (let i = 0; i < this.dimensions; i++) {
      // Generate deterministic values based on hash and position
      const value = Math.sin(hash + i) * 0.5 + 0.5; // Normalize to 0-1 range
      embedding.push(value);
    }

    // Normalize embedding to unit vector
    return this.normalizeEmbedding(embedding);
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((text) => this.generateEmbedding(text)));
  }

  /**
   * Simple hash function for deterministic embedding generation
   */
  private hashText(text: string): number {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Normalize embedding to unit vector
   */
  private normalizeEmbedding(embedding: number[]): number[] {
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude === 0) return embedding;
    return embedding.map((val) => val / magnitude);
  }
}

// Singleton instance
let embeddingClient: EmbeddingClient | null = null;

/**
 * Initialize the embedding client
 */
export function initializeEmbeddingClient(): EmbeddingClient {
  if (!embeddingClient) {
    embeddingClient = new MockEmbeddingClient();
    console.log('[Embeddings] Embedding client initialized');
  }
  return embeddingClient;
}

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const client = embeddingClient || initializeEmbeddingClient();
  return client.generateEmbedding(text);
}

/**
 * Generate embeddings for multiple texts
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const client = embeddingClient || initializeEmbeddingClient();
  return client.generateEmbeddings(texts);
}

/**
 * Generate embedding with metadata
 */
export async function generateEmbeddingWithMetadata(
  text: string,
  metadata: Record<string, any>,
): Promise<EmbeddingResult> {
  const embedding = await generateEmbedding(text);
  return {
    text,
    embedding,
    metadata,
  };
}

/**
 * Generate embeddings for batch of texts with metadata
 */
export async function generateEmbeddingsWithMetadata(
  items: Array<{ text: string; metadata: Record<string, any> }>,
): Promise<EmbeddingResult[]> {
  const texts = items.map((item) => item.text);
  const embeddings = await generateEmbeddings(texts);

  return items.map((item, index) => ({
    text: item.text,
    embedding: embeddings[index],
    metadata: item.metadata,
  }));
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(embedding1: number[], embedding2: number[]): number {
  if (embedding1.length !== embedding2.length) {
    throw new Error('Embeddings must have the same length');
  }

  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    magnitude1 += embedding1[i] * embedding1[i];
    magnitude2 += embedding2[i] * embedding2[i];
  }

  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);

  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }

  return dotProduct / (magnitude1 * magnitude2);
}

/**
 * Find top K most similar embeddings
 */
export function findTopKSimilar(
  query: number[],
  candidates: Array<{ embedding: number[]; id: string; metadata?: Record<string, any> }>,
  k: number = 5,
): Array<{ id: string; similarity: number; metadata?: Record<string, any> }> {
  const similarities = candidates.map((candidate) => ({
    id: candidate.id,
    similarity: cosineSimilarity(query, candidate.embedding),
    metadata: candidate.metadata,
  }));

  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, k);
}

/**
 * Batch generate embeddings with progress tracking
 */
export async function generateEmbeddingsBatch(
  texts: string[],
  batchSize: number = 100,
  onProgress?: (current: number, total: number) => void,
): Promise<number[][]> {
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, Math.min(i + batchSize, texts.length));
    const batchEmbeddings = await generateEmbeddings(batch);
    results.push(...batchEmbeddings);

    if (onProgress) {
      onProgress(Math.min(i + batchSize, texts.length), texts.length);
    }
  }

  return results;
}

/**
 * Health check for embedding service
 */
export async function healthCheck(): Promise<{ status: 'ok' | 'error'; message: string }> {
  try {
    const testEmbedding = await generateEmbedding('test');
    if (testEmbedding.length === 1024) {
      return { status: 'ok', message: 'Embedding service is healthy' };
    }
    return { status: 'error', message: 'Embedding dimension mismatch' };
  } catch (error) {
    return { status: 'error', message: `Embedding service error: ${error}` };
  }
}
