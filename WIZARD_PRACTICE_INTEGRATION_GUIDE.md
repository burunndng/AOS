# Wizard-to-Practice Integration Guide

## Overview

This guide documents the improved integration between wizards, insights generation, and practice recommendations in the AOS (Aura Integral Learning Platform). The system now provides seamless linking where completing a wizard automatically generates personalized insights AND recommends practices aligned with what was discovered.

## Architecture Improvements

### 1. Proper RAG Implementation (Semantic Search)

**File**: `api/rag/generate-prompt.ts`

Previously, this was a stub implementation returning hardcoded data. Now it:

- **Generates embeddings** for user queries using the embedding service
- **Performs semantic search** in Pinecone to find relevant practices and frameworks
- **Retrieves user history** (completed practices, preferences, identified biases, developmental stage)
- **Assembles context-aware prompts** with actual retrieved data

**Key Functions**:
- `generateRecommendationPrompt()` - Finds practices for recommendations
- `generateInsightPrompt()` - Finds practices for insights specific to wizard output
- `generatePersonalizationPrompt()` - Suggests adaptations for specific practices
- `generateCustomizationPrompt()` - Generates customization suggestions

### 2. Wizard-to-Practice Linking

**File**: `api/insights/wizard-linking.ts`

A new module that maps each wizard type to appropriate practice domains:

```typescript
WIZARD_PRACTICE_MAPPING = {
  bias_detective: 'shadow_work',
  ifs_work: 'relational_practice',
  subject_object: 'contemplative_practice',
  somatic_generator: 'somatic_practice',
  big_mind_process: 'voice_dialogue',
  insight_practice_map: 'meditation_insight',
  // ... 10+ more mappings
}
```

**Key Functions**:
- `findWizardAlignedPractices()` - Uses semantic search to find practices matching wizard output
- `generateWizardLinkedRecommendations()` - Returns practices, rationale, and suggested sequence
- `buildIntegratedInsightWithPractices()` - Creates a single insight that includes both insights and practice recommendations

### 3. Re-enabled API Endpoints

**File**: `api/server.ts`

The following endpoints are now **fully functional** with proper RAG:

#### Recommendations Endpoints
```
POST /api/recommendations/personalized   - Custom recommendations
POST /api/recommendations/need           - For specific needs
POST /api/recommendations/stack          - For current practice stack
POST /api/recommendations/assessment     - Based on assessment results
```

#### Insights Endpoints
```
POST /api/insights/generate          - Generic session insights
POST /api/insights/bias-detective    - Bias-specific insights with practice linking
POST /api/insights/ifs               - IFS-specific insights with practice linking
POST /api/insights/patterns          - Cross-session pattern analysis with practices
```

## Wizard Integration Flow

### Complete User Journey

```
1. User launches Wizard (e.g., BiasFinderWizard)
   ↓
2. Wizard collects data through multi-phase UI
   ↓
3. On completion → Call `/api/insights/bias-detective` or equivalent
   ↓
4. Backend:
   a) Analyze wizard output
   b) Query Pinecone for aligned practices via semantic search
   c) Generate personalized insights
   d) Link to specific recommended practices
   e) Create practice sequence suggestion
   ↓
5. Return to Frontend:
   - Insights about wizard discoveries
   - List of 3-5 recommended practices
   - Rationale for each practice
   - Suggested practice sequence
   - Option to start recommended practice immediately
```

### Example: Bias Detective Wizard

**What happens when user completes Bias Detective:**

```javascript
// User completes BiasFinderWizard and gets these results:
const sessionData = {
  decision: "Should I hire this candidate?",
  reasoning: "They're very similar to me and charismatic...",
  identifiedBiases: ["Similarity bias", "Halo effect", "Confirmation bias"]
};

// Call insights endpoint
POST /api/insights/bias-detective
{
  userId: "user-123",
  sessionData: sessionData
}

// Response includes:
{
  type: "bias_detective_insights",
  content: "You've identified important biases... Here are practices that help:
    • Journaling for Self-Inquiry (beginner, ~15 min)
    • Shadow Work Dialogue (intermediate, ~30 min)
    • Perspective-Taking Practice (intermediate, ~20 min)",
  sources: [
    {
      id: "practice-1",
      metadata: {
        practiceTitle: "Journaling for Self-Inquiry",
        difficulty: "beginner"
      }
    },
    // ... more practices
  ],
  metadata: {
    linkedPracticesCount: 3,
    practiceRationale: "These practices help you work with biases at a deeper level through shadow work...",
    confidence: 0.95
  }
}
```

## Wizard Type → Practice Domain Mappings

| Wizard | Practice Domain | Examples |
|--------|-----------------|----------|
| **Bias Detective** | Shadow Work | Self-inquiry, cognitive flexibility, protective patterns |
| **IFS Work** | Relational | Compassionate communication, parts work, inner dialogue |
| **Subject-Object** | Contemplative | Mindfulness, perspective shifting, meta-awareness |
| **Somatic Generator** | Somatic | Body awareness, grounding, nervous system regulation |
| **Big Mind Process** | Voice Dialogue | Witnessing, perspective expansion, inner multiplicity |
| **Insight Practice Map** | Meditation Insight | Vipassana, jhana cultivation, insight stages |
| **Integral Body Architect** | Embodied Practice | Whole-body integration, movement, weekly scheduling |
| **Dynamic Workout Architect** | Movement | Physical conditioning, athletic skill, optimization |
| **Meditation Wizard** | Meditation | Technique-specific guidance, consistency building |
| **Attachment Assessment** | Relational | Secure base development, emotional regulation |
| **Polarity Mapper** | Integration | Both-and thinking, paradox, systems thinking |
| **Eight Zones** | Integral AQAL | Multi-dimensional development, quadrant-specific focus |
| **Kegan Assessment** | Developmental | Stage-appropriate growth, meaning-making, capacity building |
| **Memory Reconsolidation** | Trauma Integration | Belief change, emotional processing, transformation |
| **Perspective Shifter** | Perspective Practice | Empathy, perspective-taking, cognitive flexibility |
| **3-2-1 Process** | Somatic Integration | Witnessed dialogue, trigger transformation |
| **Relational Pattern** | Relational Exploration | Couples work, relational dynamics, communication |

## Implementation Details

### Semantic Search Process

1. **Wizard Output** → User completes wizard with specific discoveries
2. **Query Generation** → Create semantic search query from wizard output
3. **Embedding** → Generate 1536-dimensional embedding of query
4. **Vector Search** → Query Pinecone index with filters for practice type
5. **Result Ranking** → Return top 5 practices by similarity score
6. **Context Assembly** → Add user history, preferences, recommendations

### Practice Sequencing

Practices are automatically sequenced by difficulty:

```
Beginner (5-15 min) → Intermediate (15-30 min) → Advanced (30+ min)
```

This allows users to start simple and deepen practice gradually.

## Key Features

### 1. Context-Aware Recommendations

The system considers:
- Previous practices completed
- Identified biases or patterns
- Developmental stage (Kegan)
- Attachment style
- Preference for meditation, body work, dialogue, etc.
- Time availability (short/medium/long)

### 2. Confidence Scoring

- **0.95** when practices are directly linked to wizard output (via wizard-linking)
- **0.85** when using generic RAG recommendations
- Higher confidence indicates better personalization

### 3. Fallback Mechanisms

If Pinecone is unavailable:
- Falls back to mock Pinecone (for development)
- Still returns reasonable practice suggestions
- Provides confidence indication of quality

### 4. Rationale Explanations

Each recommendation includes a specific rationale:

```
"You've identified important biases. These practices help you work
with these patterns at a deeper level through shadow work and self-inquiry."
```

## Testing the Integration

### 1. Health Check

```bash
curl http://localhost:3001/api/health
```

Verify these services are healthy:
- `pinecone` ✓
- `recommendations` ✓
- `insights` ✓
- `embeddings` ✓

### 2. Test Bias Detective Flow

```bash
curl -X POST http://localhost:3001/api/insights/bias-detective \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-1",
    "sessionData": {
      "decision": "Should I change careers?",
      "reasoning": "I feel stuck in my current role",
      "identifiedBiases": ["Status quo bias", "Loss aversion"],
      "scenarios": {}
    }
  }'
```

Expected response includes:
- `linkedPracticesCount > 0`
- `practiceRationale` explaining the link
- `sources` array with practice recommendations
- `confidence: 0.95`

### 3. Test IFS Flow

```bash
curl -X POST http://localhost:3001/api/insights/ifs \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-1",
    "sessionData": {
      "identifiedParts": ["Protector", "Performer", "Inner Critic"],
      "conversations": {},
      "managerPart": "Inner Adult"
    }
  }'
```

### 4. Test Pattern Insights

```bash
curl -X POST http://localhost:3001/api/insights/patterns \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-1",
    "timeWindow": "month"
  }'
```

## Frontend Integration

### Example: Wizard Completion Handler

```typescript
// When wizard completes
async function handleWizardComplete(wizardType: string, sessionData: any) {
  try {
    // Call appropriate insights endpoint
    const response = await fetch('/api/insights/' + getEndpointForWizard(wizardType), {
      method: 'POST',
      body: JSON.stringify({ userId, sessionData })
    });

    const insights = await response.json();

    // Show insights modal
    showInsightsModal({
      insights: insights.content,
      practices: insights.sources,
      rationale: insights.metadata.practiceRationale,
      confidence: insights.confidence
    });

    // Offer to start first practice
    if (insights.sources.length > 0) {
      showPracticeRecommendation(insights.sources[0]);
    }
  } catch (error) {
    console.error('Failed to generate insights:', error);
  }
}

function getEndpointForWizard(wizardType: string): string {
  const mapping: Record<string, string> = {
    'BiasFinderWizard': 'bias-detective',
    'IFSWizard': 'ifs',
    // ... map other wizards
  };
  return mapping[wizardType] || 'generate';
}
```

## Performance Characteristics

### Latency

- Embedding generation: ~100ms
- Semantic search in Pinecone: ~200ms (mock: ~50ms)
- RAG prompt generation: ~150ms
- LLM API call: 500ms - 2s
- **Total end-to-end**: 1-3 seconds

### Scalability

- Handles thousands of practices in Pinecone
- User history queries scale with session count
- Parallel semantic searches for multiple contexts
- Mock Pinecone works offline for development

## Debugging

### Enable Detailed Logging

```bash
DEBUG=rag:* node api/server.ts
```

### Check Pinecone Status

```typescript
import { getIndexStats } from './api/lib/pinecone.ts';

const stats = await getIndexStats();
console.log('Total vectors:', stats.totalVectorCount);
```

### Test RAG Prompt Generation

```typescript
import { generateInsightPrompt } from './api/rag/generate-prompt.ts';

const prompt = await generateInsightPrompt({
  userId: 'test',
  type: 'insight',
  query: 'I identified these biases...'
});

console.log('Retrieved practices:', prompt.context.practices?.length);
```

## Future Improvements

1. **Wizard Output → User Profile** - Store wizard discoveries in user profile for context in future wizards
2. **Practice Streak Integration** - Link practice recommendations to existing practice streak tracking
3. **Feedback Loop** - Track which recommended practices users actually do, improve recommendations
4. **A/B Testing** - Compare different linking strategies, measure engagement
5. **Multi-stage Sequencing** - Suggest full 12-week practice progression after wizard
6. **Outcome Tracking** - Connect completed practices back to original wizard issues (e.g., "Did this help with bias?")

## API Reference

### POST /api/insights/bias-detective

Generate insights from a Bias Detective session.

**Request**:
```json
{
  "userId": "string",
  "sessionData": {
    "decision": "string",
    "reasoning": "string",
    "identifiedBiases": ["string"],
    "scenarios": {}
  }
}
```

**Response**:
```json
{
  "type": "bias_detective_insights",
  "content": "string (markdown-formatted insights with practices)",
  "sources": [
    {
      "id": "string",
      "score": 0.8,
      "metadata": {
        "practiceTitle": "string",
        "difficulty": "beginner|intermediate|advanced",
        "duration": 20
      }
    }
  ],
  "confidence": 0.95,
  "metadata": {
    "linkedPracticesCount": 3,
    "practiceRationale": "string"
  }
}
```

### POST /api/insights/ifs

Generate insights from an IFS work session.

**Request**:
```json
{
  "userId": "string",
  "sessionData": {
    "identifiedParts": ["string"],
    "conversations": {},
    "managerPart": "string",
    "exiledParts": ["string"]
  }
}
```

### POST /api/insights/patterns

Analyze patterns across sessions.

**Request**:
```json
{
  "userId": "string",
  "timeWindow": "week|month|all"
}
```

### POST /api/recommendations/personalized

Get personalized recommendations.

**Request**:
```json
{
  "userId": "string",
  "query": "string",
  "topK": 10,
  "filters": {
    "frameworkType": "string"
  }
}
```

## Conclusion

The integrated wizard-to-practice system transforms AOS into a truly coherent learning platform where:

1. **Wizards discover** what needs attention
2. **Insights synthesize** what was learned
3. **Practices apply** the insights with real-world techniques

This creates a virtuous cycle of discovery → learning → practice → integration that supports deep personal transformation.
