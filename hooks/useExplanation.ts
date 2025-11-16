/**
 * useExplanation Hook
 *
 * Fetches explanation data for recommendations and syntheses.
 * Handles loading, error states, and caching.
 */

import { useState, useCallback } from 'react';
import type { ExplanationData } from '../components/ExplanationModal.tsx';

interface UseExplanationState {
  explanation: ExplanationData | null;
  isLoading: boolean;
  error: string | null;
}

interface UseExplanationResult extends UseExplanationState {
  fetchRecommendationExplanation: (recommendationId: string) => Promise<void>;
  fetchSynthesisExplanation: (synthesisId: string) => Promise<void>;
  reset: () => void;
}

// Simple in-memory cache for explanations
const explanationCache = new Map<string, ExplanationData>();

export function useExplanation(): UseExplanationResult {
  const [state, setState] = useState<UseExplanationState>({
    explanation: null,
    isLoading: false,
    error: null,
  });

  const fetchRecommendationExplanation = useCallback(
    async (recommendationId: string) => {
      // Check cache first
      if (explanationCache.has(recommendationId)) {
        setState({
          explanation: explanationCache.get(recommendationId) || null,
          isLoading: false,
          error: null,
        });
        return;
      }

      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch(`/api/insights/explain/recommendation/${recommendationId}`);

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch explanation');
        }

        const data = await response.json();

        if (data.success && data.recommendation) {
          const explanation = data.recommendation as ExplanationData;
          explanationCache.set(recommendationId, explanation);

          setState({
            explanation,
            isLoading: false,
            error: null,
          });
        } else {
          throw new Error('Invalid explanation format');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setState({
          explanation: null,
          isLoading: false,
          error: errorMessage,
        });
      }
    },
    []
  );

  const fetchSynthesisExplanation = useCallback(
    async (synthesisId: string) => {
      // Check cache first
      if (explanationCache.has(synthesisId)) {
        setState({
          explanation: explanationCache.get(synthesisId) || null,
          isLoading: false,
          error: null,
        });
        return;
      }

      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch(`/api/insights/explain/synthesis/${synthesisId}`);

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch synthesis explanation');
        }

        const data = await response.json();

        if (data.success && data.synthesis) {
          // Transform synthesis explanation to match ExplanationData format
          const synthesis = data.synthesis;
          const explanation: ExplanationData = {
            recommendation: 'Complete Analysis',
            whyThis: [synthesis.overallStrategy, synthesis.context],
            sources: synthesis.recommendations.map((rec: any) => ({
              wizard: rec.practice,
              pattern: rec.reason,
              confidence:
                rec.confidence.includes('High') ? 'high'
                  : rec.confidence.includes('Medium') ? 'medium'
                    : 'low',
            })),
            sequence: 'See recommendations above',
            confidence: 'Synthesis completed',
          };

          explanationCache.set(synthesisId, explanation);

          setState({
            explanation,
            isLoading: false,
            error: null,
          });
        } else {
          throw new Error('Invalid synthesis format');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setState({
          explanation: null,
          isLoading: false,
          error: errorMessage,
        });
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({
      explanation: null,
      isLoading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    fetchRecommendationExplanation,
    fetchSynthesisExplanation,
    reset,
  };
}
