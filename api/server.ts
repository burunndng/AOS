/**
 * RAG Backend API Server
 * Express.js server for RAG endpoints
 * Run with: npx ts-node api/server.ts
 * Or: node build/api/server.js (after compilation)
 */

import express, { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { initializeDatabase, getDatabase } from './lib/db';

// Import endpoint handlers
// Note: RAG endpoints (recommendations, insights) have been disabled as they depend on
// Upstash Vector which is no longer being used. The coach API works independently.

import {
  getSuggestedCustomizations,
  saveCustomizedPractice,
  healthCheck as practicesHealth,
} from './practices/personalize';

import {
  getUserSyncStatus,
  healthCheck as syncHealth,
} from './user/sync';

import {
  extractBeliefsFromMemory,
  mineContradictions,
  completeSession,
  healthCheck as shadowHealth,
} from './shadow/memory-reconsolidation';

import {
  enhanceZoneAnalysis,
  synthesizeZones,
  submitSessionCompletion,
} from './mind/eight-zones';

// Coach API handler (imported from serverless function)
import coachHandler from './coach/generate-response';

// Image generation handler
import { generateImage } from './images/generate-image';

// Import insights endpoints
import explainRouter from './insights/explain';
import insightsStubRouter from './insights/stub-router';

// Import user stub endpoints
import userStubRouter from './user/stub-router';

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
app.use(async (req: Request, res: Response, next: NextFunction) => {
  if (!servicesInitialized) {
    try {
      console.log('[Server] Initializing services on first request...');
      await initializeDatabase();
      servicesInitialized = true;
      console.log('[Server] ✓ Core services initialized');
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

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[ERROR]', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err instanceof Error ? err.message : 'Unknown error',
  });
});

// ============================================
// RAG ENDPOINTS - DISABLED
// ============================================
// Recommendations and Insights endpoints have been disabled as they depend on
// Upstash Vector which is no longer part of the system. The AI Coach API
// (api/coach/generate-response.ts) works independently using Gemini.

// ============================================
// PRACTICES ENDPOINTS
// ============================================

const practicesRouter = Router();

// POST /personalize endpoint disabled (Pinecone dependency via RAG)
// practicesRouter.post('/personalize', ...);

// GET /customizations endpoint retained (local database operation)
practicesRouter.get('/customizations', async (req: Request, res: Response) => {
  try {
    const { userId, practiceId } = req.query;
    if (!userId || !practiceId) {
      return res.status(400).json({ error: 'userId and practiceId required' });
    }
    const customizations = await getSuggestedCustomizations(
      userId as string,
      practiceId as string,
    );
    res.json(customizations);
  } catch (error) {
    console.error('[Customizations] Error:', error);
    res.status(500).json({
      error: 'Failed to get customizations',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

practicesRouter.post('/save-custom', async (req: Request, res: Response) => {
  try {
    const { userId, practiceId, customSteps, notes } = req.body;
    const response = await saveCustomizedPractice(userId, practiceId, customSteps, notes);
    res.json(response);
  } catch (error) {
    console.error('[Save Custom] Error:', error);
    res.status(500).json({
      error: 'Failed to save customized practice',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.use(`${API_BASE}/practices`, practicesRouter);

// ============================================
// USER SYNC ENDPOINTS
// ============================================

const userRouter = Router();

// POST /sync and /sync-batch endpoints disabled (Pinecone dependency)
// These endpoints index sessions in Pinecone and generate embeddings
// userRouter.post('/sync', ...);
// userRouter.post('/sync-batch', ...);

// GET /status endpoint retained (local database operation)
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

// DELETE /delete-data endpoint disabled (Pinecone dependency)
// This endpoint needs to remove data from Pinecone index
// userRouter.delete('/delete-data', ...);

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
// COACH API ENDPOINT
// ============================================

const coachRouter = Router();

coachRouter.post('/generate-response', async (req: Request, res: Response) => {
  try {
    console.log('[Coach API] Handling request via Express server');
    // Call the Vercel handler directly - it's compatible with Express req/res
    await coachHandler(req as any, res as any);
  } catch (error) {
    console.error('[Coach API] Error in Express handler:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Failed to generate coach response',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

app.use(`${API_BASE}/coach`, coachRouter);

// ============================================
// IMAGE GENERATION ENDPOINT
// ============================================

const imagesRouter = Router();

imagesRouter.post('/generate', generateImage);

app.use(`${API_BASE}/images`, imagesRouter);

// ============================================
// INSIGHTS ENDPOINTS (Stub + Transparency)
// ============================================

// Mount stub router first for /generate and /patterns
app.use(`${API_BASE}/insights`, insightsStubRouter);

// Mount explain router for /explain/*
app.use(`${API_BASE}/insights`, explainRouter);

// ============================================
// USER ENDPOINTS (Stub)
// ============================================

app.use(`${API_BASE}/user`, userStubRouter);

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

    services.practices = await practicesHealth();
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
    name: 'Aura OS Backend API',
    version: '1.0.0',
    description: 'Local development API for Aura OS. The AI Coach API is a serverless function (api/coach/generate-response.ts)',
    note: 'RAG/Vector endpoints have been removed',
    endpoints: {
      practices: `${API_BASE}/practices/customizations, /practices/save-custom`,
      user: `${API_BASE}/user/status`,
      shadow: `${API_BASE}/shadow/memory-reconsolidation/*`,
      mind: `${API_BASE}/mind/eight-zones/*`,
      health: `${API_BASE}/health`,
    },
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

    // Start server
    app.listen(PORT, () => {
      console.log('\n✅ Server Running!');
      console.log(`📍 http://localhost:${PORT}`);
      console.log(`📊 Health: http://localhost:${PORT}${API_BASE}/health`);
      console.log(`\n📚 Available Endpoints (Local Operations Only):`);
      console.log(`  • GET  ${API_BASE}/practices/customizations`);
      console.log(`  • POST ${API_BASE}/practices/save-custom`);
      console.log(`  • GET  ${API_BASE}/user/status`);
      console.log(`  • POST ${API_BASE}/shadow/memory-reconsolidation/extract-beliefs`);
      console.log(`  • POST ${API_BASE}/shadow/memory-reconsolidation/mine-contradictions`);
      console.log(`  • POST ${API_BASE}/shadow/memory-reconsolidation/complete`);
      console.log(`  • POST ${API_BASE}/mind/eight-zones/enhance-zone`);
      console.log(`  • POST ${API_BASE}/mind/eight-zones/synthesize`);
      console.log(`  • POST ${API_BASE}/mind/eight-zones/submit`);
      console.log(`  • POST ${API_BASE}/coach/generate-response (Streaming)`);
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
