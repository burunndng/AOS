# Feature Integration Improvements

## Overview

This document describes the improved feature integration system that enables:
- Unified insight generation across all wizards
- Cross-feature access to insights and patterns
- Outcome tracking to show pattern improvement
- High-impact practice identification

## New Services

### 1. InsightGenerator Service (`services/insightGenerator.ts`)

**Purpose**: Unified insight generation for any wizard session

**Key Functions**:

```typescript
// Generate insight from any wizard session
const insight = await generateInsightFromSession({
  wizardType: '3-2-1 Reflection',
  sessionId: session.id,
  sessionName: 'My first reflection',
  sessionReport: 'Full markdown report of the session',
  sessionSummary: 'Brief summary',
  userId: userId,
  availablePractices: Object.values(corePractices).flat()
});

// Record when a practice is completed
const updatedInsight = recordPracticeCompletion(
  insight,
  practiceId,
  new Date().toISOString()
);

// Calculate if pattern improved
const improvement = calculatePatternImprovement(
  sessionFrequency,
  practiceFrequency,
  practitionerNotes
);
```

**Benefits over old system**:
- Generates BOTH shadow work + next steps (not just shadow work)
- Consistent format across all wizards
- Handles all 20 wizard types
- Automatic practice matching using Gemini
- Outcome tracking built-in

### 2. InsightContext Service (`services/insightContext.ts`)

**Purpose**: Cross-feature access to insights and pattern data

**Key Functions**:

```typescript
// Get insights relevant to a practice
const insightsForPractice = getInsightsForPractice(practiceId, allInsights);

// Get patterns that recommend a specific practice
const patterns = getPatternsThatRecommendPractice(practiceId, allInsights);

// Find high-impact practices (recommend multiple patterns)
const highImpactPractices = getHighImpactPractices(allInsights, allPractices);

// Get practice insight journey (why/how practice matters)
const journey = getPracticeInsightJourney(practiceId, allInsights);

// Calculate overall pattern improvement metrics
const metrics = calculatePatternMetrics(allInsights);

// Get context for BrowseTab to show practice relevance
const context = getRecommendationContextForPractice(practice, allInsights);
```

**Use Cases**:
- **BrowseTab**: Show users why/how each practice relates to their patterns
- **Dashboard**: Show pattern improvement metrics and high-impact practices
- **StackTab**: Show insight history for practices in user's stack
- **RecommendationsTab**: Recommend practices based on pending insights

## Migration Path for Wizards

### Step 1: Update Individual Wizard Save Handlers

**Before (old system - shadow work only)**:
```typescript
const handleSaveBiasSession = async (session: BiasDetectiveSession) => {
  setHistoryBias(prev => [...prev, session]);

  const report = `# Bias Detective: ${session.decisionText}...`;
  const insight = await geminiService.detectPatternsAndSuggestShadowWork(
    'Bias Detective', session.id, report, Object.values(corePractices.shadow)
  );

  if (insight) setIntegratedInsights(prev => [...prev, insight]);
};
```

**After (new system - shadow work + next steps)**:
```typescript
const handleSaveBiasSession = async (session: BiasDetectiveSession) => {
  setHistoryBias(prev => [...prev, session]);

  const report = `# Bias Detective: ${session.decisionText}...`;
  const summary = `Decision: ${session.decisionText}, Diagnosis: ${session.diagnosis}`;

  const insight = await generateInsightFromSession({
    wizardType: 'Bias Detective',
    sessionId: session.id,
    sessionName: 'Bias Detective Session',
    sessionReport: report,
    sessionSummary: summary,
    userId: userId,
    availablePractices: Object.values(corePractices).flat()
  });

  setIntegratedInsights(prev => [...prev, insight]);
};
```

### Step 2: Add Insight Generation to Non-Insight Wizards

**Currently NO insights** (need to add):
- 3-2-1 Reflection
- IFS Session
- Jhana Guide
- Somatic Practice
- Attachment Assessment
- Eight Zones
- Integral Body Plan
- Workout Program

**Pattern to add**:
```typescript
const handleSaveSomaticPractice = async (session: SomaticPracticeSession) => {
  setSomaticPracticeHistory(prev => [...prev, session]);

  // Generate insight from somatic session
  const insight = await generateInsightFromSession({
    wizardType: 'Somatic Practice',
    sessionId: session.id,
    sessionName: session.name || 'Somatic Practice Session',
    sessionReport: session.instructions?.join('\n') || 'Session completed',
    sessionSummary: `Duration: ${session.duration || 'N/A'}`,
    userId: userId,
    availablePractices: Object.values(corePractices).flat()
  });

  setIntegratedInsights(prev => [...prev, insight]);
};
```

## Outcome Tracking

When a user completes a practice recommended by an insight:

```typescript
// In togglePracticeCompletion or similar
const updateInsightOutcome = (insightId: string, practiceId: string) => {
  setIntegratedInsights(prev =>
    prev.map(insight => {
      if (insight.id === insightId) {
        return recordPracticeCompletion(
          insight,
          practiceId,
          new Date().toISOString()
        );
      }
      return insight;
    })
  );
};
```

## Using Insights in Features

### BrowseTab Enhancement

Show users why/how each practice matters:

```typescript
// In BrowseTab
import { getRecommendationContextForPractice } from '../services/insightContext';

const Practice = ({ practice }) => {
  const context = getRecommendationContextForPractice(practice, integratedInsights);

  return (
    <div>
      <h3>{practice.name}</h3>
      {context.relatedPatterns.length > 0 && (
        <div className="insight-context">
          <p>Addresses these patterns:</p>
          <ul>
            {context.relatedPatterns.map(pattern => (
              <li key={pattern}>{pattern}</li>
            ))}
          </ul>
          <p>Relevance: {context.relevanceScore}%</p>
        </div>
      )}
    </div>
  );
};
```

### Dashboard Enhancement

Show pattern improvement and high-impact practices:

```typescript
// In DashboardTab
import {
  calculatePatternMetrics,
  getHighImpactPractices
} from '../services/insightContext';

const metrics = calculatePatternMetrics(integratedInsights);
const highImpact = getHighImpactPractices(integratedInsights, allPractices);

return (
  <div>
    <h2>Pattern Improvement: {metrics.addressedRate}%</h2>
    <p>{metrics.improved} patterns improved</p>

    <h3>High-Impact Practices</h3>
    {highImpact.map(practice => (
      <div key={practice.id}>
        {practice.name} - Addresses {practice.patternCount} patterns
      </div>
    ))}
  </div>
);
```

### RecommendationsTab Enhancement

Recommend practices based on pending insights:

```typescript
// In RecommendationsTab
import { getPendingInsights, getHighImpactPractices } from '../services/insightContext';

const pendingInsights = getPendingInsights(integratedInsights);
const highImpact = getHighImpactPractices(integratedInsights, allPractices, 2);

return (
  <div>
    {pendingInsights.map(insight => (
      <div key={insight.id}>
        <p>Pattern: {insight.detectedPattern}</p>
        <div>Recommended practices:</div>
        {insight.suggestedShadowWork.map(sw => (
          <button key={sw.practiceId}>
            Try {sw.practiceName} (reflection)
          </button>
        ))}
        {insight.suggestedNextSteps.map(ns => (
          <button key={ns.practiceId}>
            Try {ns.practiceName} (action)
          </button>
        ))}
      </div>
    ))}

    <h3>High-Impact Practices</h3>
    {highImpact.map(p => <div key={p.id}>{p.name}</div>)}
  </div>
);
```

## Data Structure Improvements

### Updated IntegratedInsight Type

```typescript
interface IntegratedInsight {
  // Core fields (existing)
  id: string;
  mindToolType: /* 20 wizard types */;
  sessionId: string;
  sessionName: string;
  sessionReport: string;
  detectedPattern: string;
  suggestedShadowWork: Practice[];
  suggestedNextSteps: Practice[];  // NOW POPULATED FOR ALL!
  dateCreated: string;
  status: 'pending' | 'addressed';

  // Outcome tracking (NEW)
  relatedPracticeSessions?: {
    practiceId: string;
    completionDates: string[];
    frequency: number;
  }[];
  practiceOutcome?: {
    practiceId: string;
    practiceFrequency: number;
    patternImprovement: 'improved' | 'stable' | 'worsened' | 'unknown';
    notes?: string;
  }[];
  patternEvolutionNotes?: string;
}
```

## Implementation Checklist

- [x] Create InsightGenerator service
- [x] Create InsightContext service
- [x] Update MindToolType enum for all wizards
- [ ] Update insight save handlers in App.tsx (8 that already generate insights)
- [ ] Add insight generation to wizards that don't (8 wizards)
- [ ] Add outcome tracking to togglePracticeCompletion
- [ ] Enhance BrowseTab with insight context
- [ ] Enhance Dashboard with metrics
- [ ] Enhance RecommendationsTab with insight-based suggestions
- [ ] Add pattern evolution view showing improvement over time

## Benefits

1. **Complete Coverage**: All 20 wizards generate insights
2. **Richer Data**: Both shadow work (reflection) AND next steps (action)
3. **Outcome Tracking**: See how practices impact patterns
4. **Cross-Feature Integration**: Insights accessible everywhere
5. **Pattern Evolution**: Track improvement over time
6. **High-Impact Identification**: Find which practices work best
7. **User Agency**: Users see WHY they're doing practices
8. **Closed Loop**: Session → Insight → Practice → Outcome feedback

## Next Steps

1. Update 8 existing insight handlers to use `generateInsightFromSession()`
2. Add insight generation to 8 non-insight wizards
3. Integrate InsightContext into relevant components
4. Add outcome tracking when practices are completed
5. Create pattern evolution visualization
