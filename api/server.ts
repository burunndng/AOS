/**
 * RAG Backend API Server
 * Express.js server for RAG endpoints
 * Run with: npx ts-node api/server.ts
 * Or: node build/api/server.js (after compilation)
 */

import express, { Request, Response, NextFunction, Router } from 'express';
import cors from 'cors';
import { initializeDatabase, getDatabase } from './lib/db.js';
import { initializePinecone, getIndexStats, healthCheck as pineconeHealth } from './lib/pinecone.js';
import { initializeEmbeddingClient, healthCheck as embeddingsHealth } from './lib/embeddings.js';

// Import endpoint handlers
import {
  generatePersonalizedRecommendations,
  getRecommendationsForNeed,
  getStackRecommendations,
  getAssessmentBasedRecommendations,
  healthCheck as recommendationsHealth,
} from './recommendations/personalized.js';

import {
  generateInsights,
  generateBiasDetectiveInsights,
  generateIFSInsights,
  generatePatternInsights,
  healthCheck as insightsHealth,
} from './insights/generate.js';

import {
  personalizePractice,
  getSuggestedCustomizations,
  saveCustomizedPractice,
  healthCheck as practicesHealth,
} from './practices/personalize.js';

import {
  syncUserSession,
  batchSyncUserSessions,
  getUserSyncStatus,
  deleteUserData,
  healthCheck as syncHealth,
} from './user/sync.js';

import { healthCheck as retrievalHealth } from './rag/retrieve.js';
import { healthCheck as promptHealth } from './rag/generate-prompt.js';

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
      await initializePinecone();
      initializeEmbeddingClient();
      servicesInitialized = true;
      console.log('[Server] ✓ All services initialized');
    } catch (error) {
      console.error('[Server] Failed to initialize services:', error);
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
// RECOMMENDATIONS ENDPOINTS
// ============================================

const recommendationsRouter = Router();

recommendationsRouter.post('/personalized', async (req: Request, res: Response) => {
  try {
    const { userId, query, filters, topK } = req.body;
    const response = await generatePersonalizedRecommendations({
      userId,
      type: 'recommendation',
      query: query || 'What practices should I do next?',
      filters,
      topK: topK || 5,
    });
    res.json(response);
  } catch (error) {
    console.error('[Recommendations] Error:', error);
    res.status(500).json({
      error: 'Failed to generate recommendations',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

recommendationsRouter.post('/assessment', async (req: Request, res: Response) => {
  try {
    const { userId, assessmentType, assessmentResults } = req.body;
    const response = await getAssessmentBasedRecommendations(userId, assessmentType, assessmentResults);
    res.json(response);
  } catch (error) {
    console.error('[Assessment Recommendations] Error:', error);
    res.status(500).json({
      error: 'Failed to generate assessment recommendations',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.use(`${API_BASE}/recommendations`, recommendationsRouter);

// ============================================
// INSIGHTS ENDPOINTS
// ============================================

const insightsRouter = Router();

insightsRouter.post('/generate', async (req: Request, res: Response) => {
  try {
    const { userId, sessionData, sessionType } = req.body;
    const response = await generateInsights(userId, sessionData, sessionType);
    res.json(response);
  } catch (error) {
    console.error('[Insights] Error:', error);
    res.status(500).json({
      error: 'Failed to generate insights',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

insightsRouter.post('/patterns', async (req: Request, res: Response) => {
  try {
    const { userId, timeWindow } = req.body;
    const response = await generatePatternInsights(userId, timeWindow || 'month');
    res.json(response);
  } catch (error) {
    console.error('[Pattern Insights] Error:', error);
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

practicesRouter.post('/personalize', async (req: Request, res: Response) => {
  try {
    const { userId, practiceId, practiceTitle, customContext } = req.body;
    const response = await personalizePractice(userId, practiceId, practiceTitle, customContext);
    res.json(response);
  } catch (error) {
    console.error('[Personalize] Error:', error);
    res.status(500).json({
      error: 'Failed to personalize practice',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

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

    services.pinecone = await pineconeHealth();
    services.embeddings = await embeddingsHealth();
    services.retrieval = await retrievalHealth();
    services.prompts = await promptHealth();
    services.recommendations = await recommendationsHealth();
    services.insights = await insightsHealth();
    services.practices = await practicesHealth();
    services.sync = await syncHealth();

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
