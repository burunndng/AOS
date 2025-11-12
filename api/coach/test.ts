/**
 * Test endpoint to verify Upstash Vector and Gemini setup
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { getIndexStats } from '../lib/upstash-vector.js';
import { generateEmbedding } from '../lib/embeddings.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: {},
  };

  // Test 1: Environment variables
  results.tests.envVars = {
    hasApiKey: !!process.env.API_KEY,
    hasVectorUrl: !!process.env.UPSTASH_VECTOR_REST_URL,
    hasVectorToken: !!process.env.UPSTASH_VECTOR_REST_TOKEN,
    vectorUrl: process.env.UPSTASH_VECTOR_REST_URL?.substring(0, 30) + '...',
  };

  // Test 2: Gemini API
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Say "Hello, Coach!" in 2 words.',
    });
    results.tests.gemini = {
      status: 'success',
      response: response.text?.substring(0, 100),
    };
  } catch (error) {
    results.tests.gemini = {
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // Test 3: Upstash Vector stats
  try {
    const stats = await getIndexStats();
    results.tests.upstashVector = {
      status: 'success',
      vectorCount: stats.vectorCount,
      totalVectorCount: stats.totalVectorCount,
    };
  } catch (error) {
    results.tests.upstashVector = {
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // Test 4: Embeddings generation
  try {
    const embedding = await generateEmbedding('test');
    results.tests.embeddings = {
      status: 'success',
      dimensions: embedding.length,
      firstValues: embedding.slice(0, 3),
    };
  } catch (error) {
    results.tests.embeddings = {
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
    };
  }

  res.status(200).json(results);
}
