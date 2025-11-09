# Backend RAG API Server Setup Guide

**Status**: Ready for Deployment
**Date**: November 9, 2025

## Overview

This guide walks you through setting up the RAG backend API server, seeding your practice database, and testing the system end-to-end.

---

## 📋 Quick Start

```bash
# 1. Install dependencies
npm install express cors

# 2. Start the server
npm run dev:api

# 3. In a new terminal, seed the database
npx ts-node scripts/seed-practices.ts
npx ts-node scripts/seed-frameworks.ts

# 4. Validate the setup
npx ts-node scripts/validate-embeddings.ts

# 5. Test the API
curl http://localhost:3001/api/health
```

Expected output: Server runs on port 3001 with all services initialized.

---

## 🔧 Installation & Setup

### Step 1: Install Dependencies

The server requires Express and CORS. Add them to package.json:

```bash
npm install express cors
npm install --save-dev @types/express @types/cors
```

Or manually add to package.json:

```json
{
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/cors": "^2.8.0"
  }
}
```

### Step 2: Create npm Scripts

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "dev:api": "npx ts-node api/server.ts",
    "seed:practices": "npx ts-node scripts/seed-practices.ts",
    "seed:frameworks": "npx ts-node scripts/seed-frameworks.ts",
    "validate:seed": "npx ts-node scripts/validate-embeddings.ts"
  }
}
```

### Step 3: Configure Environment

#### For Local Development (with Mocks - Recommended)

1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. The default configuration works with in-memory mocks:
```env
PORT=3001
NODE_ENV=development
REACT_APP_RAG_API_BASE=http://localhost:3001/api
```

**No Pinecone or MongoDB keys needed!** The system uses mocks by default.

#### For Local Development (with Real Services - Optional)

If you want to test with real Pinecone/MongoDB locally:

1. Update `.env.local` with your credentials:
```env
PORT=3001
NODE_ENV=development
REACT_APP_RAG_API_BASE=http://localhost:3001/api
PINECONE_API_KEY=your-api-key-from-pinecone.io
PINECONE_ENVIRONMENT=us-east-1
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/aura
```

2. Update `api/lib/pinecone.ts` and `api/lib/db.ts` to use real SDKs instead of mocks

#### For Production (Vercel)

**Do NOT use `.env` files.** Instead:

1. Set environment variables in Vercel:
   - Go to Project Settings → Environment Variables
   - Add: `PINECONE_API_KEY`, `PINECONE_ENVIRONMENT`, `MONGODB_URI`, etc.

2. Vercel will automatically use these for deployments

#### Security Best Practices

✅ **DO:**
- Store sensitive keys only in Vercel Environment Variables
- Use `.env.example` as a template (no secrets)
- Add `.env` to `.gitignore` (already configured)
- Rotate API keys regularly

❌ **DON'T:**
- Commit `.env` files to GitHub
- Expose API keys in code or logs
- Use the same key across environments
- Share `.env` files in messages/emails

---

## 🚀 Running the Server

### Start the Backend Server

```bash
npm run dev:api
```

**Expected Output:**

```
🚀 Aura OS RAG Backend Server Starting...

📦 Initializing services...
  ✓ Database initialized
  ✓ Pinecone initialized
  ✓ Embeddings initialized

✅ Server Running!
📍 http://localhost:3001
📊 Health: http://localhost:3001/api/health

📚 Available Endpoints:
  • POST /api/recommendations/personalized
  • POST /api/recommendations/assessment
  • POST /api/insights/generate
  • POST /api/insights/patterns
  • POST /api/practices/personalize
  • GET  /api/practices/customizations
  • POST /api/practices/save-custom
  • POST /api/user/sync
  • POST /api/user/sync-batch
  • GET  /api/user/status
  • DELETE /api/user/delete-data

🌐 CORS enabled for: http://localhost:3000, http://localhost:5173

💡 To test health: curl http://localhost:3001/api/health
```

### Keep the Server Running

The server will run in the foreground. Keep this terminal open while developing.

To stop: `Ctrl+C`

---

## 🌱 Seeding the Database

Run these commands in a **separate terminal** while the server is running.

### Seed All Practices

```bash
npm run seed:practices
```

This will:
1. Load all 400+ practices from `constants.ts`
2. Generate 1536-dimensional embeddings for each
3. Insert into MongoDB
4. Index in Pinecone

**Expected Output:**

```
🌱 SEEDING PRACTICES

📦 Initializing services...
✓ Found 400+ practices to seed

Processing: 100% (400+/400+) - [Practice Name]

📝 Inserting 400+ practices into database...
✓ Inserted 400+ practices

📍 Indexing 400+ practices in Pinecone...
Indexing: 100% (400+/400+)
✓ All 400+ practices indexed in Pinecone

📊 SEED SUMMARY:
  • Practices in database: 400+
  • Frameworks in database: 0
  • User sessions indexed: 0

✅ SEEDING COMPLETE!
```

**Time**: ~2-3 minutes for 400+ practices

### Seed All Frameworks

```bash
npm run seed:frameworks
```

This will:
1. Load 5 developmental frameworks
2. Generate embeddings for each
3. Insert into MongoDB
4. Index in Pinecone

**Expected Output:**

```
🎯 SEEDING FRAMEWORKS

📦 Initializing services...
✓ Found 5 frameworks to seed

Processing: 100% (5/5) - [Framework Name]

📝 Inserting 5 frameworks into database...
✓ Inserted 5 frameworks

📍 Indexing 5 frameworks in Pinecone...
Indexing: 100% (5/5)
✓ All 5 frameworks indexed in Pinecone

📊 SEED SUMMARY:
  • Practices in database: 400+
  • Frameworks in database: 5
  • User sessions indexed: 0

✅ SEEDING COMPLETE!
```

**Time**: ~10-15 seconds

---

## ✅ Validation

### Validate Embeddings & Setup

```bash
npm run validate:seed
```

This will:
1. Verify database initialization
2. Check Pinecone indexing
3. Validate embedding dimensions (1536)
4. Test semantic search
5. Check topic coverage
6. Verify query performance

**Expected Output:**

```
=== VALIDATING EMBEDDINGS ===

Checking database contents...
✓ Database contains:
  - 400+ practices
  - 5 frameworks
  - 0 user sessions

Checking Pinecone index...
✓ Pinecone index contains:
  - 400+ vectors

Validating embedding dimensions...
✓ Embedding dimensions correct (1536)

Testing semantic search...
✓ Semantic search working (found 5 results)
  Top results:
    - Sleep Foundation (95.2% match)
    - Resistance Training (91.8% match)
    - Zone 2 Cardio (89.3% match)

Checking for coverage gaps...
Coverage by topic:
  ✓ mindfulness meditation: 95.2% coverage
  ✓ trauma healing: 87.3% coverage
  ✓ somatic practice: 91.5% coverage
  ✓ shadow work: 88.7% coverage
  ✓ relationships: 92.1% coverage
  ✓ attachment patterns: 89.4% coverage

Performance validation...
✓ Query completed in 45.32ms

Consistency validation...
✓ Vector count consistent: 405+ ≥ 405+ expected

=== VALIDATION SUMMARY ===
✓ Database initialized with 405+ documents
✓ Pinecone index contains 405+ vectors
✓ Embedding dimensions verified (1536-dimensional)
✓ Semantic search operational
✓ Query performance: 45.32ms
✓ Good topic coverage across all areas

✓ RAG SYSTEM READY FOR USE
```

---

## 🧪 Testing the API

### Health Check

```bash
curl http://localhost:3001/api/health
```

Response:

```json
{
  "healthy": true,
  "timestamp": "2025-11-09T10:30:00.000Z",
  "services": {
    "database": {
      "status": "ok",
      "message": "Database is healthy"
    },
    "pinecone": {
      "status": "ok",
      "message": "Pinecone healthy. Total vectors: 405"
    },
    "embeddings": {
      "status": "ok",
      "message": "Embedding service is healthy"
    },
    "retrieval": {
      "status": "ok",
      "message": "Retrieval service is healthy"
    },
    "prompts": {
      "status": "ok",
      "message": "Prompt generation service is healthy"
    },
    "recommendations": {
      "status": "ok",
      "message": "Recommendations service is healthy"
    },
    "insights": {
      "status": "ok",
      "message": "Insights service is healthy"
    },
    "practices": {
      "status": "ok",
      "message": "Practice personalization service is healthy"
    },
    "sync": {
      "status": "ok",
      "message": "Sync service is healthy"
    }
  },
  "stats": {
    "uptime": 123.456,
    "memoryUsage": { /* ... */ }
  }
}
```

### Get Recommendations

```bash
curl -X POST http://localhost:3001/api/recommendations/personalized \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "query": "I want to manage stress better",
    "topK": 5
  }'
```

Response:

```json
{
  "userId": "user-123",
  "recommendations": [
    {
      "practiceId": "physiological-sigh",
      "practiceTitle": "Physiological Sigh",
      "reasoning": "This practice is recommended because it directly addresses stress reduction and nervous system regulation.",
      "relevanceScore": 0.94,
      "personalizationNotes": [
        "Takes only 1-3 minutes, perfect for quick stress relief",
        "Can be done anywhere - no special setup needed",
        "Evidence-based technique from neuroscience research"
      ]
    },
    {
      "practiceId": "coherent-breathing",
      "practiceTitle": "Coherent Breathing",
      "reasoning": "This framework-aligned practice builds long-term nervous system resilience.",
      "relevanceScore": 0.89,
      "personalizationNotes": [
        "Best done regularly (3-5x per week)",
        "Can be combined with meditation practice",
        "Improves HRV (Heart Rate Variability) over time"
      ]
    }
    /* ... more recommendations */
  ],
  "insights": [
    "Physiological Sigh: The double inhale re-expands collapsed air sacs in the lungs",
    "Consider Coherent Breathing framework for deeper understanding",
    /* ... more insights */
  ],
  "generatedAt": "2025-11-09T10:35:00.000Z"
}
```

### Sync a User Session

```bash
curl -X POST http://localhost:3001/api/user/sync \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "sessionData": {
      "id": "session-001",
      "userId": "user-123",
      "type": "bias_detective",
      "content": {
        "decision": "Should I take the new job?",
        "reasoning": "Higher salary but farther commute",
        "identifiedBiases": ["confirmation bias", "anchoring bias"]
      },
      "insights": ["You tend to overweight salary factors"],
      "completedAt": "2025-11-09T10:30:00.000Z"
    },
    "userPreferences": {},
    "timestamp": "2025-11-09T10:35:00.000Z"
  }'
```

Response:

```json
{
  "success": true,
  "message": "Successfully synced session session-001 for user user-123",
  "indexedSessionId": "user-session-user-123-session-001",
  "updatedUserEmbedding": [0.123, -0.456, /* ... 1534 more dimensions */]
}
```

---

## 🔄 Development Workflow

### Terminal Layout (Recommended)

```
┌─────────────────────┬─────────────────────┐
│  Terminal 1         │  Terminal 2         │
│  npm run dev        │  npm run dev:api    │
│  (Frontend on 5173) │  (Backend on 3001)  │
├─────────────────────┼─────────────────────┤
│  Terminal 3         │  Terminal 4         │
│  npm run seed:...   │  Debugging/Testing  │
│  (Run seeds here)   │  (curl requests)    │
└─────────────────────┴─────────────────────┘
```

### Development Workflow

1. **Terminal 1**: Start frontend
   ```bash
   npm run dev
   ```

2. **Terminal 2**: Start backend
   ```bash
   npm run dev:api
   ```

3. **Terminal 3**: Seed database (run once)
   ```bash
   npm run seed:practices
   npm run seed:frameworks
   npm run validate:seed
   ```

4. **Terminal 4**: Test API
   ```bash
   curl http://localhost:3001/api/health
   ```

5. Open browser: `http://localhost:5173`

---

## 🛠️ Troubleshooting

### Server Won't Start

**Error**: `Error: listen EADDRINUSE: address already in use :::3001`

**Solution**: Port 3001 is already in use. Either:
- Kill the process using port 3001:
  ```bash
  lsof -ti:3001 | xargs kill -9
  ```
- Or use a different port:
  ```bash
  PORT=3002 npm run dev:api
  ```

### Seeding Fails

**Error**: `Error: ENOENT: no such file or directory`

**Solution**: Make sure you're in the `/home/user/AOS` directory:
```bash
cd /home/user/AOS
npm run seed:practices
```

**Error**: `TypeError: practices is not iterable`

**Solution**: The constants.ts import is failing. Verify:
1. constants.ts exists
2. It exports `practices` as the default export
3. TypeScript is configured correctly

### Frontend Can't Connect to Backend

**Error**: `CORS error` or `Failed to fetch`

**Solution**:
1. Verify backend is running: `curl http://localhost:3001/api/health`
2. Check CORS_ORIGIN in .env matches your frontend URL
3. Update REACT_APP_RAG_API_BASE:
   ```bash
   export REACT_APP_RAG_API_BASE=http://localhost:3001/api
   npm run dev
   ```

### Seeding Takes Too Long

**Info**: Seeding 400+ practices can take 2-3 minutes.

To speed up:
- Use fewer practices for testing
- Increase batch size in `seed-practices.ts` (line 144)

### Memory Issues

**Error**: `JavaScript heap out of memory`

**Solution**: Increase Node.js memory:
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run seed:practices
```

---

## 📊 Architecture

### Server Structure

```
/api/
├── server.ts                 # Express server entry point
├── lib/
│   ├── db.ts                 # MongoDB connection
│   ├── pinecone.ts           # Pinecone client
│   ├── embeddings.ts         # Embedding generation
│   └── types.ts              # TypeScript types
├── rag/
│   ├── retrieve.ts           # Semantic search
│   └── generate-prompt.ts    # Prompt generation
├── recommendations/
│   └── personalized.ts       # Recommendations endpoint
├── insights/
│   └── generate.ts           # Insights endpoint
├── practices/
│   └── personalize.ts        # Personalization endpoint
└── user/
    └── sync.ts               # Sync endpoint
```

### Data Flow

```
Frontend (React)
       ↓
ragService (API client)
       ↓
Express Server (api/server.ts)
       ↓
Endpoint Handlers (/api/recommendations/*, /api/insights/*, etc.)
       ↓
RAG Core (rag/retrieve.ts, rag/generate-prompt.ts)
       ↓
Vector DB + Database
       ├── Pinecone (semantic search)
       └── MongoDB (persistence)
```

---

## 🚢 Production Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://yourdomain.com

# Database (replace with real MongoDB)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aura

# Pinecone (replace with real Pinecone API)
PINECONE_API_KEY=your-api-key
PINECONE_ENVIRONMENT=us-east-1

# Embeddings (if using real embedding service)
EMBEDDING_API_KEY=your-google-api-key
```

### Deployment Checklist

- [ ] Install production dependencies: `npm install --production`
- [ ] Build TypeScript: `npm run build`
- [ ] Set environment variables
- [ ] Run database migrations
- [ ] Seed production database
- [ ] Test health endpoint
- [ ] Set up monitoring/logging
- [ ] Configure CORS for production domain
- [ ] Enable HTTPS
- [ ] Set up automated backups

---

## 📞 Support

### Common Questions

**Q: Can I use a different database?**
A: Yes, update `api/lib/db.ts` to connect to PostgreSQL, MySQL, etc.

**Q: Can I use a real Pinecone index?**
A: Yes, install `@pinecone-database/pinecone` and update `api/lib/pinecone.ts`

**Q: Can I use a different embedding model?**
A: Yes, update `api/lib/embeddings.ts` to use OpenAI or other providers

**Q: How do I scale this?**
A: Use a real database (MongoDB Atlas), Pinecone SaaS, and deploy to a cloud platform (Vercel, AWS Lambda, etc.)

---

## ✅ Success Indicators

Once everything is set up correctly, you should see:

✅ Server starts without errors
✅ All services initialized
✅ Seeding scripts run to completion
✅ 400+ practices indexed
✅ 5 frameworks indexed
✅ Health check returns all services "ok"
✅ API requests return valid JSON
✅ Frontend connects to backend without CORS errors
✅ Recommendations appear in UI
✅ Sessions sync to backend

---

## 📈 Next Steps

Once the backend is running:

1. **Test Frontend Integration**
   - Go to Recommendations tab
   - Enter a query
   - Verify RAG recommendations appear

2. **Run End-to-End Test**
   - Complete a Bias Detective session
   - Verify insights are generated
   - Confirm session syncs to backend

3. **Monitor Performance**
   - Check query response times
   - Monitor memory usage
   - Track error logs

4. **Optimize**
   - Cache user profile embeddings
   - Add database indexing
   - Implement rate limiting

---

**Setup Complete!** Your RAG backend is ready for production use. 🎉
