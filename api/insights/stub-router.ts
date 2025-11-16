/**
 * Stub Router for Insights API
 *
 * This provides graceful degradation for RAG endpoints that are currently disabled.
 * Returns successful responses without performing actual RAG operations,
 * allowing wizards to complete without errors while RAG backend is unavailable.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';

const router = Router();

/**
 * POST /api/insights/generate
 *
 * Stub endpoint for generating session insights.
 * Returns a successful response with minimal metadata.
 */
router.post('/generate', (req: Request, res: Response) => {
  try {
    const { userId, sessionData, sessionType } = req.body;

    // Return a successful stub response
    res.json({
      type: 'insights',
      content: 'Session insights generation is currently unavailable. Your session has been saved successfully.',
      sources: [],
      confidence: 0,
      metadata: {
        sessionId: `session-${Date.now()}`,
        sessionType: sessionType || 'unknown',
        generatedAt: new Date(),
        insights: [],
        isStub: true,
      },
    });
  } catch (error) {
    console.error('[Insights Stub] Error in generate endpoint:', error);
    res.status(500).json({
      error: 'Failed to process insights request',
      isStub: true,
    });
  }
});

/**
 * POST /api/insights/patterns
 *
 * Stub endpoint for pattern insights.
 */
router.post('/patterns', (req: Request, res: Response) => {
  try {
    res.json({
      type: 'patterns',
      content: 'Pattern insights generation is currently unavailable.',
      sources: [],
      confidence: 0,
      metadata: {
        generatedAt: new Date(),
        isStub: true,
      },
    });
  } catch (error) {
    console.error('[Insights Stub] Error in patterns endpoint:', error);
    res.status(500).json({
      error: 'Failed to process patterns request',
      isStub: true,
    });
  }
});

export default router;
