# Memory Reconsolidation Service Integration Guide

## Overview

The Memory Reconsolidation Service provides a typed frontend API client for orchestrating belief extraction, contradiction mining, and session completion workflows. It's designed to work with wizard components that guide users through the memory reconsolidation process.

## Service Location

```typescript
// services/memoryReconsolidationService.ts (372 lines)
```

## Core Functions

### 1. Extract Implicit Beliefs

Extract implicit beliefs from user input and conversation history.

```typescript
import { extractImplicitBeliefs } from '@/services/memoryReconsolidationService';
import type { ImplicitBelief } from '@/types';

// Within your wizard component:
const beliefs = await extractImplicitBeliefs(
  userId,
  'User context or description',
  conversationHistory // Optional: array of { role: 'user' | 'assistant', content: string }
);

// Returns: ImplicitBelief[]
// - id: string
// - belief: string
// - confidence: 0-1
// - sourceContext: string
// - emotionalCharge?: string
// - limitingPattern?: string
```

**Features:**
- Automatic caching for session recovery (30-minute expiry)
- Prevents duplicate API calls within cache window
- Graceful error handling with human-readable messages

### 2. Mine Contradictions

Analyze beliefs to identify contradictory patterns and juxtaposition cycles.

```typescript
import { mineContradictions } from '@/services/memoryReconsolidationService';
import type { ContradictionInsight } from '@/types';

const contradictions = await mineContradictions(userId, beliefs);

// Returns: ContradictionInsight[]
// - id: string
// - juxtapositionCycles: JuxtapositionCycle[]
// - integrationPath: string
// - underlyingUnity?: string
// - psychologicalContext?: string
```

**Features:**
- Validates input (throws error if beliefs array is empty)
- Returns structured contradiction analysis
- Provides integration pathways

### 3. Submit Session Completion

Save the completed session with final beliefs, contradictions, and user reflection.

```typescript
import { submitSessionCompletion } from '@/services/memoryReconsolidationService';
import type { SessionCompletionResponse } from '@/types';

const response = await submitSessionCompletion({
  sessionId: 'session-123',
  userId: 'user-123',
  finalBeliefs: updatedBeliefs,
  contradictionInsights: analyzedContradictions,
  personalReflection: 'User\'s reflection on the process',
  commitments: ['Practice 1', 'Practice 2'],
  timestamp: new Date(),
});

// Returns: SessionCompletionResponse
// - success: boolean
// - sessionId: string
// - integrationSummary: string
// - suggestedPractices: string[]
// - followUpRecommendations: string[]
```

**Features:**
- Syncs work back to backend for storage and insights generation
- Clears cache on successful completion
- Returns AI-generated integration summary and recommendations

## Helper Functions

### Reformat Juxtaposition Cycles

Convert cycles to a display-friendly format.

```typescript
import { reformatJuxtapositionCycles } from '@/services/memoryReconsolidationService';

const formattedCycles = reformatJuxtapositionCycles(cycles);

// Returns array of:
// - id: string
// - beliefPair: [string, string]
// - contradiction: string
// - depth: 'surface' | 'moderate' | 'deep'
```

### Analyze Contradiction Depth

Get distribution of contradiction depths.

```typescript
import { analyzeContradictionDepth } from '@/services/memoryReconsolidationService';

const distribution = analyzeContradictionDepth(cycles);
// Returns: { deep: number; moderate: number; surface: number; }
```

## Additional Functions

### Get Session

Retrieve a previously saved memory reconsolidation session.

```typescript
const session = await getSession(userId, sessionId);
// Returns: MemoryReconsolidationSession
```

### List Sessions

Get all sessions for a user.

```typescript
const sessions = await listSessions(userId);
// Returns: MemoryReconsolidationSession[]
```

### Clear Cache

Manually clear the beliefs cache.

```typescript
import { clearBeliefsCache } from '@/services/memoryReconsolidationService';
clearBeliefsCache();
```

### Health Check

Verify service availability.

```typescript
import { checkMemoryReconHealth } from '@/services/memoryReconsolidationService';

const health = await checkMemoryReconHealth();
// Returns: { available: boolean; message: string }
```

## Type Definitions

All types are exported from `types.ts`:

```typescript
import type {
  ImplicitBelief,
  JuxtapositionCycle,
  ContradictionInsight,
  MemoryReconsolidationSession,
  SessionCompletionPayload,
  SessionCompletionResponse,
} from '@/types';
```

### ImplicitBelief

```typescript
interface ImplicitBelief {
  id: string;
  belief: string;
  confidence: number; // 0-1 scale
  sourceContext: string;
  emotionalCharge?: string;
  limitingPattern?: string;
}
```

### JuxtapositionCycle

```typescript
interface JuxtapositionCycle {
  beliefA: ImplicitBelief;
  beliefB: ImplicitBelief;
  contradiction: string;
  depth: 'surface' | 'moderate' | 'deep';
}
```

### ContradictionInsight

```typescript
interface ContradictionInsight {
  id: string;
  juxtapositionCycles: JuxtapositionCycle[];
  integrationPath: string;
  underlyingUnity?: string;
  psychologicalContext?: string;
}
```

## Error Handling

All functions return rejected Promises with human-readable error messages:

```typescript
try {
  const beliefs = await extractImplicitBeliefs(userId, context);
} catch (error) {
  // Error messages like:
  // "Failed to extract implicit beliefs: Network timeout. Please try again."
  // "Failed to analyze contradictions: No beliefs provided for contradiction mining"
  console.error(error.message);
  // Display user-friendly error UI
}
```

## Caching & Session Recovery

The service implements automatic caching to support session recovery:

- **Cache Duration:** 30 minutes
- **Cache Content:** Most recent belief extraction result
- **When Cleared:** On successful session completion or manual `clearBeliefsCache()`
- **Use Case:** If user navigates away and returns, previously extracted beliefs can be recovered without API call

## Configuration

The service uses the `REACT_APP_RAG_API_BASE` environment variable:

```
REACT_APP_RAG_API_BASE=http://localhost:3001/api  // development
REACT_APP_RAG_API_BASE=/api                       // production (relative)
```

See `.env.example` for setup.

## API Endpoints Called

The service makes requests to these backend endpoints:

- `POST /memory/beliefs` - Extract implicit beliefs
- `POST /memory/contradictions` - Mine contradictions
- `POST /memory/complete` - Submit session completion
- `GET /memory/sessions/{sessionId}` - Get specific session
- `GET /memory/sessions` - List user sessions
- `GET /health` - Health check

## Testing

Comprehensive test suite: `services/__tests__/memoryReconsolidationService.test.ts`

30+ test cases covering:
- Response parsing and typing
- Error handling and network failures
- Edge cases (empty inputs, missing fields)
- Caching behavior and expiry
- Cache clearing on completion
- Health checks

Run tests with test runner (tests currently available but no npm test script configured).

## Example Wizard Component Flow

```typescript
import { useState } from 'react';
import {
  extractImplicitBeliefs,
  mineContradictions,
  submitSessionCompletion,
  reformatJuxtapositionCycles,
} from '@/services/memoryReconsolidationService';
import type { ImplicitBelief, ContradictionInsight } from '@/types';

export function MemoryReconsolidationWizard() {
  const [step, setStep] = useState('extraction'); // extraction | mining | completion
  const [beliefs, setBeliefs] = useState<ImplicitBelief[]>([]);
  const [contradictions, setContradictions] = useState<ContradictionInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExtractBeliefs = async (context: string) => {
    try {
      setLoading(true);
      setError(null);
      const extracted = await extractImplicitBeliefs(userId, context);
      setBeliefs(extracted);
      setStep('mining');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleMineContradictions = async () => {
    try {
      setLoading(true);
      setError(null);
      const mined = await mineContradictions(userId, beliefs);
      setContradictions(mined);
      setStep('completion');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSession = async (reflection: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await submitSessionCompletion({
        sessionId: `session-${Date.now()}`,
        userId,
        finalBeliefs: beliefs,
        contradictionInsights: contradictions,
        personalReflection: reflection,
        timestamp: new Date(),
      });
      
      // Show success message and suggestions
      console.log('Session completed:', result);
      setStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Render wizard UI based on step...
}
```

## Notes

- All functions are async and return Promises
- Strong TypeScript support with full type definitions
- Retry-safe behavior prevents duplicate processing
- Network errors are gracefully handled with recovery suggestions
- Service is production-ready with comprehensive error handling
