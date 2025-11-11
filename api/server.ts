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
// Recommendations endpoints re-enabled - now with proper RAG via semantic search
import {
  generatePersonalizedRecommendations,
  getRecommendationsForNeed,
  getStackRecommendations,
  getAssessmentBasedRecommendations,
  healthCheck as recommendationsHealth,
} from './recommendations/personalized.ts';

// Insights endpoints re-enabled - now with proper RAG via semantic search
import {
  generateInsights,
  generateBiasDetectiveInsights,
  generateIFSInsights,
  generatePatternInsights,
  healthCheck as insightsHealth,
} from './insights/generate.ts';

import {
  getSuggestedCustomizations,
  saveCustomizedPractice,
  healthCheck as practicesHealth,
} from './practices/personalize.ts';

import {
  getUserSyncStatus,
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

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[ERROR]', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err instanceof Error ? err.message : 'Unknown error',
  });
});

// ============================================
// RECOMMENDATIONS ENDPOINTS - RE-ENABLED
// ============================================

// Recommendations endpoints re-enabled with proper RAG implementation
const recommendationsRouter = Router();

recommendationsRouter.post('/personalized', async (req: Request, res: Response) => {
  try {
    const { userId, query, topK, filters } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }
    const recommendations = await generatePersonalizedRecommendations({
      userId,
      type: 'recommendation',
      query: query || 'general guidance',
      topK: topK || 10,
      filters,
    });
    res.json(recommendations);
  } catch (error) {
    console.error('[Recommendations] Error:', error);
    res.status(500).json({
      error: 'Failed to generate recommendations',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

recommendationsRouter.post('/need', async (req: Request, res: Response) => {
  try {
    const { userId, need } = req.body;
    if (!userId || !need) {
      return res.status(400).json({ error: 'userId and need required' });
    }
    const recommendations = await getRecommendationsForNeed(userId, need);
    res.json(recommendations);
  } catch (error) {
    console.error('[Recommendations] Error:', error);
    res.status(500).json({
      error: 'Failed to get recommendations for need',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

recommendationsRouter.post('/stack', async (req: Request, res: Response) => {
  try {
    const { userId, currentStack } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }
    const recommendations = await getStackRecommendations(userId, currentStack || []);
    res.json(recommendations);
  } catch (error) {
    console.error('[Recommendations] Error:', error);
    res.status(500).json({
      error: 'Failed to get stack recommendations',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

recommendationsRouter.post('/assessment', async (req: Request, res: Response) => {
  try {
    const { userId, assessmentType, assessmentResults } = req.body;
    if (!userId || !assessmentType || !assessmentResults) {
      return res.status(400).json({
        error: 'userId, assessmentType, and assessmentResults required',
      });
    }
    const recommendations = await getAssessmentBasedRecommendations(
      userId,
      assessmentType,
      assessmentResults,
    );
    res.json(recommendations);
  } catch (error) {
    console.error('[Recommendations] Error:', error);
    res.status(500).json({
      error: 'Failed to get assessment-based recommendations',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.use(`${API_BASE}/recommendations`, recommendationsRouter);

// ============================================
// INSIGHTS ENDPOINTS - RE-ENABLED
// ============================================

// Insights endpoints re-enabled with proper RAG implementation
const insightsRouter = Router();

insightsRouter.post('/generate', async (req: Request, res: Response) => {
  try {
    const { userId, sessionData, sessionType } = req.body;
    if (!userId || !sessionData || !sessionType) {
      return res.status(400).json({
        error: 'userId, sessionData, and sessionType required',
      });
    }
    const insights = await generateInsights(userId, sessionData, sessionType);
    res.json(insights);
  } catch (error) {
    console.error('[Insights] Error:', error);
    res.status(500).json({
      error: 'Failed to generate insights',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

insightsRouter.post('/bias-detective', async (req: Request, res: Response) => {
  try {
    const { userId, sessionData } = req.body;
    if (!userId || !sessionData) {
      return res.status(400).json({
        error: 'userId and sessionData required',
      });
    }
    const insights = await generateBiasDetectiveInsights(userId, sessionData);
    res.json(insights);
  } catch (error) {
    console.error('[Insights] Error:', error);
    res.status(500).json({
      error: 'Failed to generate bias detective insights',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

insightsRouter.post('/ifs', async (req: Request, res: Response) => {
  try {
    const { userId, sessionData } = req.body;
    if (!userId || !sessionData) {
      return res.status(400).json({
        error: 'userId and sessionData required',
      });
    }
    const insights = await generateIFSInsights(userId, sessionData);
    res.json(insights);
  } catch (error) {
    console.error('[Insights] Error:', error);
    res.status(500).json({
      error: 'Failed to generate IFS insights',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

insightsRouter.post('/patterns', async (req: Request, res: Response) => {
  try {
    const { userId, timeWindow } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }
    const insights = await generatePatternInsights(userId, timeWindow || 'month');
    res.json(insights);
  } catch (error) {
    console.error('[Insights] Error:', error);
    res.status(500).json({
      error: 'Failed to generate pattern insights',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.use(`${API_BASE}/insights`, insightsRouter);

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
    services.pinecone = await pineconeHealth();
    services.recommendations = await recommendationsHealth();
    services.insights = await insightsHealth();
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
    name: 'Aura OS RAG Backend API',
    version: '1.0.0',
    description: 'Personalized insights and recommendations via semantic search and RAG',
    endpoints: {
      recommendations: {
        personalized: `POST ${API_BASE}/recommendations/personalized`,
        need: `POST ${API_BASE}/recommendations/need`,
        stack: `POST ${API_BASE}/recommendations/stack`,
        assessment: `POST ${API_BASE}/recommendations/assessment`,
      },
      insights: {
        generate: `POST ${API_BASE}/insights/generate`,
        biasDetective: `POST ${API_BASE}/insights/bias-detective`,
        ifs: `POST ${API_BASE}/insights/ifs`,
        patterns: `POST ${API_BASE}/insights/patterns`,
      },
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

    await initializePinecone();
    console.log('  ✓ Pinecone initialized');

    initializeEmbeddingClient();
    console.log('  ✓ Embeddings initialized');

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
      console.log(`\n⚠️  DISABLED (Pinecone dependencies):`);
      console.log(`  • POST ${API_BASE}/recommendations/personalized`);
      console.log(`  • POST ${API_BASE}/recommendations/assessment`);
      console.log(`  • POST ${API_BASE}/insights/generate`);
      console.log(`  • POST ${API_BASE}/insights/patterns`);
      console.log(`  • POST ${API_BASE}/practices/personalize`);
      console.log(`  • POST ${API_BASE}/user/sync`);
      console.log(`  • POST ${API_BASE}/user/sync-batch`);
      console.log(`  • DELETE ${API_BASE}/user/delete-data`);
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
