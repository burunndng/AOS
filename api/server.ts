/**
 * RAG Backend API Server
 * Express.js server for RAG endpoints
 * Run with: npx ts-node api/server.ts
 * Or: node build/api/server.js (after compilation)
 */

import express, { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { initializeDatabase, getDatabase } from './lib/db.ts';
import { initializePinecone, getIndexStats, healthCheck as pineconeHealth } from './lib/pinecone.ts';
import { initializeEmbeddingClient, healthCheck as embeddingsHealth } from './lib/embeddings.ts';

// Import endpoint handlers
import {
  syncUserSession,
  batchSyncUserSessions,
  getUserSyncStatus,
  deleteUserData,
  healthCheck as syncHealth,
} from './user/sync.ts';

import {
  extractBeliefsFromMemory,
  mineContradictions,
  completeSession,
  healthCheck as shadowHealth,
} from './shadow/memory-reconsolidation.ts';

import {
  enhanceZoneAnalysis,
  synthesizeZones,
  submitSessionCompletion,
} from './mind/eight-zones.ts';

// ============================================
// SERVER SETUP
// ============================================

const app = express();
const PORT = process.env.PORT || 3001;
const API_BASE = '/api';

// ============================================
// MIDDLEWARE
// ============================================

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  }),
);

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize services middleware (runs once on first request)
let servicesInitialized = false;
let pineconeInitialized = false;
app.use(async (req: Request, res: Response, next: NextFunction) => {
  if (!servicesInitialized) {
    try {
      console.log('[Server] Initializing services on first request...');
      await initializeDatabase();
      initializeEmbeddingClient();
      servicesInitialized = true;
      console.log('[Server] ✓ Core services initialized');

      // Initialize Pinecone asynchronously without blocking
      if (!pineconeInitialized) {
        initializePinecone()
          .then(() => {
            pineconeInitialized = true;
            console.log('[Server] ✓ Pinecone initialized');
          })
          .catch((error) => {
            console.error('[Server] Failed to initialize Pinecone:', error);
            console.log('[Server] Using mock Pinecone for development');
            pineconeInitialized = true;
          });
      }
    } catch (error) {
      console.error('[Server] Failed to initialize core services:', error);
      // Continue anyway - some endpoints might still work
    }
  }
  next();
});

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// NOTE: Recommendations, Insights, and Practices endpoints removed
// to reduce serverless function count. These were RAG-based features
// that are not essential for core Memory Reconsolidation functionality.

// ============================================
// USER SYNC ENDPOINTS
// ============================================

const userRouter = Router();

userRouter.post('/sync', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const response = await syncUserSession(payload);
    res.json(response);
  } catch (error) {
    console.error('[Sync] Error:', error);
    res.status(500).json({
      error: 'Failed to sync session',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

userRouter.post('/sync-batch', async (req: Request, res: Response) => {
  try {
    const { userId, sessions } = req.body;
    const responses = await batchSyncUserSessions(
      sessions.map((s: any) => ({
        userId,
        sessionData: s,
        userPreferences: {},
        timestamp: new Date(),
      })),
    );
    res.json(responses);
  } catch (error) {
    console.error('[Batch Sync] Error:', error);
    res.status(500).json({
      error: 'Failed to batch sync sessions',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

userRouter.get('/status', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }
    const status = await getUserSyncStatus(userId as string);
    res.json(status);
  } catch (error) {
    console.error('[Status] Error:', error);
    res.status(500).json({
      error: 'Failed to get sync status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

userRouter.delete('/delete-data', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }
    const response = await deleteUserData(userId);
    res.json(response);
  } catch (error) {
    console.error('[Delete] Error:', error);
    res.status(500).json({
      error: 'Failed to delete user data',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.use(`${API_BASE}/user`, userRouter);

// ============================================
// SHADOW MEMORY RECONSOLIDATION ENDPOINTS
// ============================================

const shadowRouter = Router();

shadowRouter.post('/extract-beliefs', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const response = await extractBeliefsFromMemory(payload);
    res.json(response);
  } catch (error) {
    console.error('[Shadow] Error extracting beliefs:', error);
    const statusCode = error instanceof Error && error.message.includes('required') ? 400 : 502;
    res.status(statusCode).json({
      error: 'Failed to extract beliefs',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

shadowRouter.post('/mine-contradictions', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const response = await mineContradictions(payload);
    res.json(response);
  } catch (error) {
    console.error('[Shadow] Error mining contradictions:', error);
    const statusCode = error instanceof Error && error.message.includes('required') ? 400 : 502;
    res.status(statusCode).json({
      error: 'Failed to mine contradictions',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

shadowRouter.post('/complete', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const response = await completeSession(payload);
    res.json(response);
  } catch (error) {
    console.error('[Shadow] Error completing session:', error);
    const statusCode = error instanceof Error && error.message.includes('required') ? 400 : 502;
    res.status(statusCode).json({
      error: 'Failed to complete session',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.use(`${API_BASE}/shadow/memory-reconsolidation`, shadowRouter);

// ============================================
// MIND ROUTER - 8 ZONES OF KNOWING
// ============================================

const mindRouter = Router();

mindRouter.post('/eight-zones/enhance-zone', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const response = await enhanceZoneAnalysis(payload);
    res.json(response);
  } catch (error) {
    console.error('[Mind] Error enhancing zone:', error);
    const statusCode = error instanceof Error && error.message.includes('required') ? 400 : 502;
    res.status(statusCode).json({
      error: 'Failed to enhance zone analysis',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

mindRouter.post('/eight-zones/synthesize', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const response = await synthesizeZones(payload);
    res.json(response);
  } catch (error) {
    console.error('[Mind] Error synthesizing zones:', error);
    const statusCode = error instanceof Error && error.message.includes('required') ? 400 : 502;
    res.status(statusCode).json({
      error: 'Failed to synthesize zones',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

mindRouter.post('/eight-zones/submit', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const response = await submitSessionCompletion(payload);
    res.json(response);
  } catch (error) {
    console.error('[Mind] Error submitting session:', error);
    const statusCode = error instanceof Error && error.message.includes('required') ? 400 : 502;
    res.status(statusCode).json({
      error: 'Failed to submit session',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.use(`${API_BASE}/mind`, mindRouter);

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================

app.get(`${API_BASE}/health`, async (req: Request, res: Response) => {
  try {
    const services: Record<string, any> = {};

    // Check individual services
    services.database = await (async () => {
      try {
        const db = getDatabase();
        const health = await db.health();
        return health;
      } catch (e) {
        return { status: 'error' as const, message: 'Database not initialized' };
      }
    })();

    services.embeddings = await embeddingsHealth();
    services.sync = await syncHealth();
    services.shadow = await shadowHealth();

    // Determine overall health
    const allHealthy = Object.values(services).every((s) => s.status === 'ok');

    res.json({
      healthy: allHealthy,
      timestamp: new Date().toISOString(),
      services,
      stats: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      },
    });
  } catch (error) {
    res.status(500).json({
      healthy: false,
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================
// ROOT ENDPOINT
// ============================================

app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Aura OS RAG Backend API',
    version: '1.0.0',
    endpoints: {
      recommendations: `${API_BASE}/recommendations/*`,
      insights: `${API_BASE}/insights/*`,
      practices: `${API_BASE}/practices/*`,
      user: `${API_BASE}/user/*`,
      health: `${API_BASE}/health`,
    },
  });
});

// ============================================
// ERROR HANDLING MIDDLEWARE (MUST BE LAST)
// ============================================

// Error handling middleware - MUST be defined after all routes
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[ERROR]', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err instanceof Error ? err.message : 'Unknown error',
  });
});

// ============================================
// SERVER STARTUP
// ============================================

async function startServer() {
  try {
    console.log('\n🚀 Aura OS RAG Backend Server Starting...\n');

    // Initialize services
    console.log('📦 Initializing services...');
    await initializeDatabase();
    console.log('  ✓ Database initialized');

    await initializePinecone();
    console.log('  ✓ Pinecone initialized');

    initializeEmbeddingClient();
    console.log('  ✓ Embeddings initialized');

    // Start server
    app.listen(PORT, () => {
      console.log('\n✅ Server Running!');
      console.log(`📍 http://localhost:${PORT}`);
      console.log(`📊 Health: http://localhost:${PORT}${API_BASE}/health`);
      console.log(`\n📚 Available Endpoints:`);
      console.log(`  • POST ${API_BASE}/recommendations/personalized`);
      console.log(`  • POST ${API_BASE}/recommendations/assessment`);
      console.log(`  • POST ${API_BASE}/insights/generate`);
      console.log(`  • POST ${API_BASE}/insights/patterns`);
      console.log(`  • POST ${API_BASE}/practices/personalize`);
      console.log(`  • GET  ${API_BASE}/practices/customizations`);
      console.log(`  • POST ${API_BASE}/practices/save-custom`);
      console.log(`  • POST ${API_BASE}/user/sync`);
      console.log(`  • POST ${API_BASE}/user/sync-batch`);
      console.log(`  • GET  ${API_BASE}/user/status`);
      console.log(`  • DELETE ${API_BASE}/user/delete-data`);
      console.log(`  • POST ${API_BASE}/shadow/memory-reconsolidation/extract-beliefs`);
      console.log(`  • POST ${API_BASE}/shadow/memory-reconsolidation/mine-contradictions`);
      console.log(`  • POST ${API_BASE}/shadow/memory-reconsolidation/complete`);
      console.log(`\n🌐 CORS enabled for: http://localhost:3000, http://localhost:5173`);
      console.log('\n💡 To test health: curl http://localhost:3001/api/health\n');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Server shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Server terminated...');
  process.exit(0);
});

// Start the server only in local development (not on Vercel)
// Vercel runs the app as a serverless function, so we don't need app.listen()
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  startServer();
}

export default app;
