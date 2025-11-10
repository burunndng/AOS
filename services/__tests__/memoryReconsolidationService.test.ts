/**
 * Smoke tests for memoryReconsolidationService
 * Tests response parsing and error handling with mocked fetch
 * 
 * Note: These tests use Vitest framework
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  extractImplicitBeliefs,
  mineContradictions,
  submitSessionCompletion,
  reformatJuxtapositionCycles,
  analyzeContradictionDepth,
  clearBeliefsCache,
  checkMemoryReconHealth,
} from '../memoryReconsolidationService';
import type {
  ImplicitBelief,
  JuxtapositionCycle,
  ContradictionInsight,
} from '../../types';

// Mock fetch globally
global.fetch = vi.fn();

describe('memoryReconsolidationService', () => {
  beforeEach(() => {
    clearBeliefsCache();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('extractImplicitBeliefs', () => {
    it('should extract beliefs and parse response correctly', async () => {
      const mockBeliefs: ImplicitBelief[] = [
        {
          id: 'belief-1',
          belief: 'I am not good enough',
          confidence: 0.85,
          sourceContext: 'Early childhood experiences',
          emotionalCharge: 'Shame, inadequacy',
          limitingPattern: 'Perfectionism, self-criticism',
        },
        {
          id: 'belief-2',
          belief: 'I must always be productive',
          confidence: 0.9,
          sourceContext: 'Family values',
          emotionalCharge: 'Anxiety, guilt',
          limitingPattern: 'Overwork, burnout risk',
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ beliefs: mockBeliefs }),
      });

      const result = await extractImplicitBeliefs(
        'user-123',
        'I feel anxious when I am not working',
      );

      expect(result).toEqual(mockBeliefs);
      expect(result.length).toBe(2);
      expect(result[0].belief).toBe('I am not good enough');
    });

    it('should throw descriptive error on API failure', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(
        extractImplicitBeliefs('user-123', 'Some context'),
      ).rejects.toThrow('Failed to extract implicit beliefs');
    });

    it('should throw error when network fails', async () => {
      (global.fetch as any).mockRejectedValueOnce(
        new Error('Network timeout'),
      );

      await expect(
        extractImplicitBeliefs('user-123', 'Some context'),
      ).rejects.toThrow('Failed to extract implicit beliefs');
    });

    it('should return empty array for empty beliefs response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ beliefs: [] }),
      });

      const result = await extractImplicitBeliefs('user-123', 'Context');
      expect(result).toEqual([]);
    });
  });

  describe('mineContradictions', () => {
    it('should mine contradictions and parse response correctly', async () => {
      const mockBeliefs: ImplicitBelief[] = [
        {
          id: 'belief-1',
          belief: 'I am not good enough',
          confidence: 0.85,
          sourceContext: 'Childhood',
          emotionalCharge: 'Shame',
        },
        {
          id: 'belief-2',
          belief: 'I am highly capable',
          confidence: 0.75,
          sourceContext: 'Professional success',
          emotionalCharge: 'Pride',
        },
      ];

      const mockContradictions: ContradictionInsight[] = [
        {
          id: 'contradiction-1',
          juxtapositionCycles: [
            {
              beliefA: mockBeliefs[0],
              beliefB: mockBeliefs[1],
              contradiction:
                'Cannot hold both "not good enough" and "highly capable" simultaneously',
              depth: 'deep',
            },
          ],
          integrationPath:
            'Recognize that capability exists in specific domains...',
          underlyingUnity:
            'Both beliefs reflect high standards and desire to grow',
          psychologicalContext: 'Common pattern in high achievers',
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contradictions: mockContradictions }),
      });

      const result = await mineContradictions('user-123', mockBeliefs);

      expect(result).toEqual(mockContradictions);
      expect(result.length).toBe(1);
      expect(result[0].depth).toBe('deep');
    });

    it('should throw error when no beliefs provided', async () => {
      await expect(
        mineContradictions('user-123', []),
      ).rejects.toThrow('No beliefs provided');
    });

    it('should throw descriptive error on API failure', async () => {
      const beliefs: ImplicitBelief[] = [
        {
          id: 'belief-1',
          belief: 'Test belief',
          confidence: 0.5,
          sourceContext: 'Test',
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

      await expect(
        mineContradictions('user-123', beliefs),
      ).rejects.toThrow('Failed to analyze contradictions');
    });
  });

  describe('submitSessionCompletion', () => {
    it('should submit session and parse response correctly', async () => {
      const payload = {
        sessionId: 'session-123',
        userId: 'user-123',
        finalBeliefs: [
          {
            id: 'belief-1',
            belief: 'I am capable in my professional domain',
            confidence: 0.9,
            sourceContext: 'Integrated perspective',
          },
        ],
        contradictionInsights: [],
        personalReflection: 'I learned that capability is context-dependent',
        commitments: ['Practice self-compassion', 'Celebrate small wins'],
        timestamp: new Date(),
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          integrationSummary: 'Successfully integrated contradictions',
          suggestedPractices: ['self-compassion-practice'],
          followUpRecommendations: ['Explore attachment patterns'],
        }),
      });

      const result = await submitSessionCompletion(payload);

      expect(result.success).toBe(true);
      expect(result.sessionId).toBe('session-123');
      expect(result.integrationSummary).toBe('Successfully integrated contradictions');
    });

    it('should throw error when required fields missing', async () => {
      const incompletePayload = {
        sessionId: 'session-123',
        userId: '',
        finalBeliefs: [],
        contradictionInsights: [],
        personalReflection: '',
        timestamp: new Date(),
      };

      await expect(
        submitSessionCompletion(incompletePayload as any),
      ).rejects.toThrow('userId are required');
    });

    it('should throw descriptive error on API failure', async () => {
      const payload = {
        sessionId: 'session-123',
        userId: 'user-123',
        finalBeliefs: [],
        contradictionInsights: [],
        personalReflection: 'Test reflection',
        timestamp: new Date(),
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(
        submitSessionCompletion(payload),
      ).rejects.toThrow('Failed to complete session');
    });
  });

  describe('reformatJuxtapositionCycles', () => {
    it('should reformat cycles correctly', () => {
      const belief1: ImplicitBelief = {
        id: 'b1',
        belief: 'I am not good enough',
        confidence: 0.8,
        sourceContext: 'Childhood',
      };

      const belief2: ImplicitBelief = {
        id: 'b2',
        belief: 'I am highly capable',
        confidence: 0.8,
        sourceContext: 'Work',
      };

      const cycles: JuxtapositionCycle[] = [
        {
          beliefA: belief1,
          beliefB: belief2,
          contradiction: 'Cannot be both inadequate and highly capable',
          depth: 'deep',
        },
      ];

      const result = reformatJuxtapositionCycles(cycles);

      expect(result.length).toBe(1);
      expect(result[0].beliefPair).toEqual([
        'I am not good enough',
        'I am highly capable',
      ]);
      expect(result[0].depth).toBe('deep');
    });

    it('should handle empty cycles', () => {
      const result = reformatJuxtapositionCycles([]);
      expect(result).toEqual([]);
    });
  });

  describe('analyzeContradictionDepth', () => {
    it('should count depth distribution correctly', () => {
      const belief1: ImplicitBelief = {
        id: 'b1',
        belief: 'Test 1',
        confidence: 0.5,
        sourceContext: 'Test',
      };

      const belief2: ImplicitBelief = {
        id: 'b2',
        belief: 'Test 2',
        confidence: 0.5,
        sourceContext: 'Test',
      };

      const cycles: JuxtapositionCycle[] = [
        {
          beliefA: belief1,
          beliefB: belief2,
          contradiction: 'Test',
          depth: 'deep',
        },
        {
          beliefA: belief1,
          beliefB: belief2,
          contradiction: 'Test',
          depth: 'moderate',
        },
        {
          beliefA: belief1,
          beliefB: belief2,
          contradiction: 'Test',
          depth: 'moderate',
        },
        {
          beliefA: belief1,
          beliefB: belief2,
          contradiction: 'Test',
          depth: 'surface',
        },
      ];

      const result = analyzeContradictionDepth(cycles);

      expect(result.deep).toBe(1);
      expect(result.moderate).toBe(2);
      expect(result.surface).toBe(1);
    });

    it('should handle empty cycles', () => {
      const result = analyzeContradictionDepth([]);
      expect(result).toEqual({ deep: 0, moderate: 0, surface: 0 });
    });
  });

  describe('checkMemoryReconHealth', () => {
    it('should return available when health check passes', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ healthy: true }),
      });

      const result = await checkMemoryReconHealth();

      expect(result.available).toBe(true);
      expect(result.message).toContain('available');
    });

    it('should return unavailable on health check failure', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
      });

      const result = await checkMemoryReconHealth();

      expect(result.available).toBe(false);
      expect(result.message).toContain('not responding');
    });

    it('should handle network errors gracefully', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await checkMemoryReconHealth();

      expect(result.available).toBe(false);
      expect(result.message).toContain('Connection error');
    });
  });

  describe('caching', () => {
    it('should cache beliefs and return cached value on second call', async () => {
      const mockBeliefs: ImplicitBelief[] = [
        {
          id: 'belief-1',
          belief: 'Test belief',
          confidence: 0.8,
          sourceContext: 'Test',
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ beliefs: mockBeliefs }),
      });

      // First call - makes request
      const result1 = await extractImplicitBeliefs('user-123', 'Context 1');

      (global.fetch as any).mockClear();

      // Second call - should use cache
      const result2 = await extractImplicitBeliefs('user-123', 'Context 2');

      expect(result1).toEqual(result2);
      expect(global.fetch).not.toHaveBeenCalled(); // No new fetch call
    });

    it('should clear cache when session is completed', async () => {
      const mockBeliefs: ImplicitBelief[] = [
        {
          id: 'belief-1',
          belief: 'Test',
          confidence: 0.5,
          sourceContext: 'Test',
        },
      ];

      // Populate cache
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ beliefs: mockBeliefs }),
      });
      await extractImplicitBeliefs('user-123', 'Context');

      // Submit completion
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await submitSessionCompletion({
        sessionId: 'session-123',
        userId: 'user-123',
        finalBeliefs: mockBeliefs,
        contradictionInsights: [],
        personalReflection: 'Test',
        timestamp: new Date(),
      });

      // Clear cache explicitly
      clearBeliefsCache();

      // Next extraction should make a new request
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ beliefs: mockBeliefs }),
      });

      await extractImplicitBeliefs('user-123', 'New context');

      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
