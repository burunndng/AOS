/**
 * Explanation API Endpoint
 *
 * Provides detailed explanations for recommendations and insights.
 * Returns the complete lineage trail showing:
 * - Which wizard sessions contributed
 * - What patterns were detected
 * - Why each practice was recommended
 * - Confidence levels and reasoning
 *
 * This endpoint powers the "Why?" transparency feature.
 */

import { Router } from 'express';
import {
  getRecommendationExplanation,
  getSynthesisExplanation,
  getUserSyntheses,
  getRecommendationLineage,
} from '../../services/synthesisLineageService.ts';

const router = Router();

/**
 * GET /api/insights/explain/recommendation/:recommendationId
 *
 * Get explanation for a specific recommendation
 *
 * Response: {
 *   success: boolean,
 *   recommendation?: {
 *     recommendation: string,
 *     whyThis: string[],
 *     sources: Array<{ wizard, pattern, confidence }>,
 *     sequence: string,
 *     confidence: string
 *   },
 *   error?: string
 * }
 */
router.get('/recommendation/:recommendationId', (req, res) => {
  try {
    const { recommendationId } = req.params;

    const result = getRecommendationExplanation(recommendationId);

    if (!result.isValid) {
      return res.status(404).json({
        success: false,
        error: result.message || 'Explanation not found',
      });
    }

    res.json({
      success: true,
      recommendation: result.explanation,
    });
  } catch (error) {
    console.error('[ExplainAPI] Error retrieving recommendation explanation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve explanation',
    });
  }
});

/**
 * GET /api/insights/explain/synthesis/:synthesisId
 *
 * Get explanation for a synthesis (batch of recommendations)
 *
 * Response: {
 *   success: boolean,
 *   synthesis?: {
 *     context: string,
 *     developmentalEdge: string,
 *     recommendations: Array<{ practice, reason, sources, confidence }>,
 *     overallStrategy: string
 *   },
 *   error?: string
 * }
 */
router.get('/synthesis/:synthesisId', (req, res) => {
  try {
    const { synthesisId } = req.params;

    const result = getSynthesisExplanation(synthesisId);

    if (!result.isValid) {
      return res.status(404).json({
        success: false,
        error: result.message || 'Synthesis explanation not found',
      });
    }

    res.json({
      success: true,
      synthesis: result.explanation,
    });
  } catch (error) {
    console.error('[ExplainAPI] Error retrieving synthesis explanation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve synthesis explanation',
    });
  }
});

/**
 * GET /api/insights/explain/lineage/:recommendationId
 *
 * Get complete raw lineage data for advanced inspection
 * (Shows full technical details)
 *
 * Response: {
 *   success: boolean,
 *   lineage?: RecommendationLineage,
 *   error?: string
 * }
 */
router.get('/lineage/:recommendationId', (req, res) => {
  try {
    const { recommendationId } = req.params;

    const lineage = getRecommendationLineage(recommendationId);

    if (!lineage) {
      return res.status(404).json({
        success: false,
        error: 'Lineage data not found',
      });
    }

    res.json({
      success: true,
      lineage,
    });
  } catch (error) {
    console.error('[ExplainAPI] Error retrieving lineage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve lineage data',
    });
  }
});

/**
 * GET /api/insights/explain/history/:userId?limit=10&offset=0
 *
 * Get user's synthesis history with explanations
 *
 * Response: {
 *   success: boolean,
 *   syntheses?: Array<{
 *     synthesisId: string,
 *     generatedAt: string,
 *     recommendationCount: number,
 *     developmentalEdge: string
 *   }>,
 *   error?: string
 * }
 */
router.get('/history/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;

    const syntheses = getUserSyntheses(userId);

    const paginated = syntheses
      .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
      .slice(offset, offset + limit)
      .map(s => ({
        synthesisId: s.synthesisId,
        generatedAt: s.generatedAt,
        recommendationCount: s.recommendations.length,
        developmentalEdge: s.developmentalEdge,
        trigger: s.trigger.type,
      }));

    res.json({
      success: true,
      syntheses: paginated,
      total: syntheses.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error('[ExplainAPI] Error retrieving synthesis history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve synthesis history',
    });
  }
});

/**
 * POST /api/insights/explain/verify
 *
 * Verify that a recommendation's lineage is complete and valid
 * Used for user verification/transparency checks
 *
 * Request: { recommendationId: string }
 *
 * Response: {
 *   success: boolean,
 *   isValid: boolean,
 *   issues?: string[],
 *   summary?: string
 * }
 */
router.post('/verify', (req, res) => {
  try {
    const { recommendationId } = req.body;

    if (!recommendationId) {
      return res.status(400).json({
        success: false,
        error: 'recommendationId is required',
      });
    }

    const lineage = getRecommendationLineage(recommendationId);

    if (!lineage) {
      return res.json({
        success: true,
        isValid: false,
        issues: ['No lineage data found for this recommendation'],
      });
    }

    const issues: string[] = [];

    // Validate lineage structure
    if (!lineage.contributingInsights || lineage.contributingInsights.length === 0) {
      issues.push('No contributing insights found');
    }

    if (!lineage.primaryReason || lineage.primaryReason.trim().length === 0) {
      issues.push('No primary reason provided');
    }

    if (lineage.confidenceScore < 0.5) {
      issues.push('Confidence score is below 0.5 (exploratory only)');
    }

    const isValid = issues.length === 0;

    res.json({
      success: true,
      isValid,
      issues: issues.length > 0 ? issues : undefined,
      summary: isValid
        ? `✓ Valid recommendation with ${lineage.contributingInsights.length} source(s)`
        : `⚠ Recommendation has ${issues.length} issue(s)`,
    });
  } catch (error) {
    console.error('[ExplainAPI] Error verifying lineage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify lineage',
    });
  }
});

export default router;
