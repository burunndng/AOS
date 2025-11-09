# RAG System Integration Guide

This document outlines how the RAG (Retrieval-Augmented Generation) system integrates with the frontend.

## Architecture Overview

The RAG system consists of three layers:

1. **Backend Infrastructure** (`/api/lib/`):
   - `db.ts`: MongoDB connection and collections
   - `pinecone.ts`: Vector database indexing
   - `embeddings.ts`: Embedding generation
   - `types.ts`: Shared type definitions

2. **Backend RAG Core** (`/api/rag/`):
   - `retrieve.ts`: Semantic search and context retrieval
   - `generate-prompt.ts`: RAG prompt generation for Gemini

3. **Backend API Endpoints** (`/api/`):
   - `/recommendations/personalized.ts`: Practice recommendations
   - `/insights/generate.ts`: Session insight generation
   - `/practices/personalize.ts`: Practice personalization
   - `/user/sync.ts`: User data synchronization

4. **Frontend Client** (`/services/`):
   - `ragService.ts`: Frontend API client for RAG endpoints

## Integration Points

### 1. App.tsx - Add User Context

**Changes:**
- Add `userId` state using `useLocalStorage`
- Initialize userId on first load
- Pass userId to components

```typescript
const [userId, setUserId] = useState<string>(() => {
  const stored = localStorage.getItem('userId');
  if (stored) return stored;

  const newId = `user-${crypto.randomUUID()}`;
  localStorage.setItem('userId', newId);
  return newId;
});
```

### 2. RecommendationsTab.tsx - Use RAG Recommendations

**Changes:**
- Replace hardcoded recommendations with RAG API calls
- Use `ragService.getPersonalizedRecommendations(userId, query)`
- Display personalized scores and reasoning

```typescript
const fetchRecommendations = async (query: string) => {
  const recs = await ragService.getPersonalizedRecommendations(userId, query);
  setRecommendations(recs.recommendations);
  setInsights(recs.insights);
};
```

### 3. BiasDetectiveWizard.tsx - Generate Insights & Sync

**Changes:**
- Generate insights after session completion
- Sync session data to backend
- Index session for future context

```typescript
const finishSession = async () => {
  // Generate insights
  const insights = await ragService.generateBiasDetectiveInsights(userId, {
    decision,
    reasoning,
    identifiedBiases,
    scenarios,
  });

  // Sync session
  await ragService.syncUserSession(userId, {
    id: sessionId,
    type: 'bias_detective',
    content: { decision, reasoning, identifiedBiases },
    insights: insights.metadata.insights,
    completedAt: new Date(),
  });
};
```

### 4. PracticeCustomizationModal.tsx - Personalize Steps

**Changes:**
- Call personalization API when customizing
- Display personalized steps with rationale
- Save customizations

```typescript
const personalizeSteps = async () => {
  const response = await ragService.personalizePractice(
    userId,
    practiceId,
    practiceName,
    { challenge, accessibility }
  );

  setPersonalizedSteps(response.metadata.personalizedSteps);
};
```

### 5. geminiService.ts - Add RAG Wrappers (Optional)

**Changes:**
- Add RAG-aware wrappers around Gemini calls
- Use retrieved context to enhance prompts
- Fall back to direct Gemini if RAG unavailable

```typescript
export async function generateWithRAG(
  userId: string,
  prompt: string,
  type: 'recommendation' | 'insight' | 'personalization'
) {
  try {
    const context = await ragService.getPersonalizedRecommendations(userId, prompt);
    return {
      ...context,
      geminiContent: await generateText(prompt),
    };
  } catch (e) {
    // Fall back to direct Gemini
    return { geminiContent: await generateText(prompt) };
  }
}
```

## Data Flow

### Session Completion Flow

```
User completes session (BiasDetective, IFS, etc.)
    ↓
Component calls ragService.generateSessionInsights()
    ↓
Backend retrieves user context via RAG
    ↓
Backend generates insights using Gemini + RAG context
    ↓
Component displays insights to user
    ↓
Component calls ragService.syncUserSession()
    ↓
Backend indexes session embedding in Pinecone
    ↓
Future recommendations are grounded in this session
```

### Recommendation Flow

```
User opens RecommendationsTab or asks for guidance
    ↓
Component calls ragService.getPersonalizedRecommendations(userId, query)
    ↓
Backend runs semantic search via RAG system
    ↓
Backend retrieves relevant practices + user history
    ↓
Backend generates personalized recommendations
    ↓
Component displays recommendations with reasoning
```

### Personalization Flow

```
User opens PracticeCustomizationModal
    ↓
Component calls ragService.personalizePractice(userId, practiceId, title)
    ↓
Backend retrieves user history + practice details
    ↓
Backend generates personalized steps
    ↓
Component displays custom steps
    ↓
User saves customization via ragService.saveCustomizedPractice()
```

## API Endpoints

All endpoints require `userId` parameter and expect JSON request/response.

### Recommendations
- `POST /api/recommendations/personalized` - Get personalized recommendations
- `POST /api/recommendations/assessment` - Get assessment-based recommendations

### Insights
- `POST /api/insights/generate` - Generate session insights
- `POST /api/insights/patterns` - Generate pattern insights from history

### Practices
- `POST /api/practices/personalize` - Personalize practice steps
- `GET /api/practices/customizations` - Get customization suggestions
- `POST /api/practices/save-custom` - Save customized practice

### User Sync
- `POST /api/user/sync` - Sync a session
- `POST /api/user/sync-batch` - Sync multiple sessions
- `GET /api/user/status` - Get sync status
- `DELETE /api/user/delete-data` - Delete user data (GDPR)

### Health
- `GET /api/health` - Check RAG system health

## Environment Variables

Add to `.env`:

```
REACT_APP_RAG_API_BASE=http://localhost:3001/api  # Development
# or
REACT_APP_RAG_API_BASE=/api  # Production (proxy to same domain)
```

## Seeding Data

Before using the RAG system, seed practices and frameworks:

```bash
# Seed practices
npx ts-node scripts/seed-practices.ts

# Seed frameworks
npx ts-node scripts/seed-frameworks.ts

# Validate embeddings
npx ts-node scripts/validate-embeddings.ts
```

## Key Features

### 1. Semantic Search
The system uses embeddings to find contextually relevant practices and frameworks, not just keyword matches.

### 2. User Context
Every recommendation and insight is personalized based on:
- Completed practices
- Identified biases
- Developmental stage (Kegan)
- Attachment style
- Learning preferences

### 3. Multi-Step Reasoning
The Bias Detective insights are generated through:
- Semantic retrieval of relevant frameworks
- Understanding user's decision context
- Connecting to broader patterns
- Suggesting targeted practices

### 4. Persistent Indexing
User sessions are indexed in Pinecone, enabling:
- Future recommendations grounded in their history
- Pattern detection across sessions
- Longitudinal progress tracking

## Performance Optimization

1. **Batch Operations**: Use `batchSyncSessions()` for multiple sessions
2. **Lazy Loading**: Recommendations load in background while user views practices
3. **Caching**: Frontend caches recent recommendations (optional)
4. **Error Handling**: All endpoints have fallbacks if RAG fails

## Security Considerations

1. **User Privacy**: Sessions are indexed by userId, enabling data isolation
2. **GDPR Compliance**: `deleteUserData()` endpoint removes all user data
3. **API Authentication**: Add JWT tokens if deploying to production
4. **Rate Limiting**: Implement per-user rate limits on API endpoints

## Troubleshooting

### "RAG API not responding"
- Check backend is running on correct port
- Verify `REACT_APP_RAG_API_BASE` environment variable
- Check browser console for CORS errors

### "No recommendations found"
- Run seed scripts to populate database
- Check that practices are indexed in Pinecone
- Run `validate-embeddings.ts` to verify setup

### "Insights are generic"
- Ensure user has completed at least one session
- Check that sessions are being synced
- Verify embeddings are correctly generated

## Next Steps

1. **Integrate with geminiService.ts** for enhanced generation
2. **Add analytics** to track which recommendations are followed
3. **Implement user preferences UI** to let users customize recommendations
4. **Add practice progress tracking** to measure outcomes
5. **Create recommendation templates** for common scenarios
