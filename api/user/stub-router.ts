/**
 * Stub Router for User API
 *
 * Provides graceful degradation for user session sync endpoints.
 * Returns successful responses without performing actual backend operations.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';

const router = Router();

/**
 * POST /api/user/sessions
 *
 * Stub endpoint for syncing user sessions.
 * Returns a successful response confirming the session was "synced".
 */
router.post('/sessions', (req: Request, res: Response) => {
  try {
    const { userId, sessionData } = req.body;

    // Return a successful stub response
    res.json({
      success: true,
      syncedAt: new Date(),
      userId: userId || 'unknown',
      sessionId: sessionData?.id || `session-${Date.now()}`,
      metadata: {
        isStub: true,
        message: 'Session sync is currently unavailable. Data saved locally.',
      },
    });
  } catch (error) {
    console.error('[User Stub] Error in sessions endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync session',
      isStub: true,
    });
  }
});

/**
 * GET /api/user/sessions/:userId
 *
 * Stub endpoint for retrieving user sessions.
 */
router.get('/sessions/:userId', (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      sessions: [],
      metadata: {
        isStub: true,
        message: 'Session retrieval is currently unavailable.',
      },
    });
  } catch (error) {
    console.error('[User Stub] Error in sessions retrieval:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve sessions',
      isStub: true,
    });
  }
});

export default router;
