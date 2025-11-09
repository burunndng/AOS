# Personalization Module - Quick Start Guide

## Overview

The adaptive tuning personalization module learns from plan history and automatically adjusts future recommendations. It analyzes completion patterns, blockers, and energy levels to provide personalized adjustments.

## For Developers

### Using Personalization in Your Code

```typescript
import { analyzeHistoryAndPersonalize, buildPersonalizationPromptInsertion } from './services/integralBodyPersonalization';
import { PlanHistoryEntry, PersonalizationSummary } from './types';

// Analyze history
const history: PlanHistoryEntry[] = [...];
const summary: PersonalizationSummary = analyzeHistoryAndPersonalize(history);

// Use in prompts
const promptText = buildPersonalizationPromptInsertion(summary);
```

### Key Functions

#### `analyzeHistoryAndPersonalize(planHistory, currentDate?)`
Analyzes plan history and returns personalization insights.

```typescript
const summary = analyzeHistoryAndPersonalize(integralBodyPlanHistory);

// Returns:
{
  planCount: 3,                           // Number of recent plans
  analysisPeriodDays: 21,                 // Days covered by analysis
  timeWeightedAverage: {
    workoutCompliance: 75.5,              // Weighted average %
    yinCompliance: 82.3,
    averageIntensity: 6.2,                // 1-10 scale
    averageEnergy: 7.1
  },
  adjustmentDirectives: [                 // Actionable recommendations
    {
      type: 'recovery-boost',
      description: 'Increase recovery and Yin practices',
      rationale: 'Workouts completed but energy is low',
      impact: 'high',
      confidence: 80
    }
  ],
  inferredPreferences: [                  // Detected user preferences
    {
      type: 'high-compliance-modality',
      value: 'Progressive Relaxation',
      frequency: 5,
      compliance: 100
    }
  ],
  commonBlockers: ['Time constraints', 'Fatigue'],
  bestPerformingDayPatterns: ['Monday', 'Wednesday', 'Friday'],
  recommendedIntensityLevel: 'moderate',   // 'low' | 'moderate' | 'high'
  recommendedYinDuration: 15,              // Minutes per day
  recommendedRecoveryDays: 2,              // Days per week
  summary: 'Human-readable summary...'
}
```

#### `buildPersonalizationPromptInsertion(summary)`
Converts summary to LLM prompt text.

```typescript
const promptText = buildPersonalizationPromptInsertion(summary);
// Returns formatted string for injecting into LLM prompts
```

### Data Flow in App.tsx

```typescript
// 1. When wizard opens, personalization is automatically triggered
useEffect(() => {
  if (activeWizard === 'integral-body-architect' && integralBodyPlanHistory.length > 0) {
    generatePersonalizationSummary();
  }
}, [activeWizard, integralBodyPlanHistory, generatePersonalizationSummary]);

// 2. Personalization summary passed to wizard
<IntegralBodyArchitectWizard
  personalizationSummary={currentPersonalizationSummary}
  ...
/>

// 3. Wizard passes to plan generation
const plan = await generateIntegralWeeklyPlan({
  goalStatement,
  yangConstraints,
  yinPreferences,
  personalizationSummary: personalizationSummary || undefined,
});
```

### Development Logging

Enable debug logging in console:

```javascript
// App.tsx logs this when personalization runs
console.log('📊 Personalization Analysis:', {
  planCount: number,
  analysisPeriodDays: number,
  timeWeightedCompliance: {
    workouts: "XX%",
    yinPractices: "XX%"
  },
  adjustmentDirectives: ["Reduce intensity", "Increase Yin duration", ...],
  inferredPreferences: ["preferred-time: morning", ...]
});
```

## Algorithm Reference

### Time Decay (Exponential Decay over 28 days)
```
decayFactor = max(0, 1 - daysDiff / 28)

Examples:
- Today (0 days): 100% weight
- 7 days ago: 75% weight  
- 14 days ago: 50% weight
- 21 days ago: 25% weight
- 28+ days ago: Excluded (0% weight)
```

This ensures recent behavior strongly influences recommendations while still considering longer-term patterns.

### Compliance Thresholds for Directives

```
Low Workout Compliance (<50%)
  → Suggests: "Load reduction"
  → Rationale: Consider reducing frequency or making workouts shorter

Low Yin Compliance (<50%)
  → Suggests: "Yin duration reduction"
  → Rationale: Start with shorter 5-10 min practices

Low Energy + High Compliance
  → Suggests: "Recovery boost"
  → Rationale: Need more rest/recovery time

High Consecutive Intensity
  → Suggests: "Yang spacing"
  → Rationale: Avoid back-to-back heavy sessions
```

### Preference Thresholds

```
High-compliance modality: >80% completion rate
Best-performing day: >70% task completion rate
Blocker frequency: Top 5 recurring obstacles
```

## Extension Points

### Adding a New Adjustment Directive Type

1. Add to `AdjustmentDirective.type` union in `types.ts`:
```typescript
type: 'intensity-nudge' | 'yin-duration' | 'yang-spacing' | 'MY-NEW-TYPE'
```

2. Add detection logic to `generateAdjustmentDirectives()` in `integralBodyPersonalization.ts`:
```typescript
if (someCondition) {
  directives.push({
    type: 'MY-NEW-TYPE',
    description: 'Human-readable description',
    rationale: 'Why this matters',
    impact: 'high' | 'medium' | 'low',
    confidence: 75
  });
}
```

3. Include in prompt insertion in `buildPersonalizationPromptInsertion()`:
```typescript
// Already auto-included via loop, no changes needed!
```

### Adding New Analysis Metrics

1. Add to `PersonalizationSummary` interface in `types.ts`
2. Calculate in `analyzeHistoryAndPersonalize()` in `integralBodyPersonalization.ts`
3. Include in `buildPersonalizationPromptInsertion()` prompt text
4. Optionally add to dev logging in `App.tsx`

## Testing Your Changes

### Run the Build
```bash
npm run build
```
Should output: `✓ built in X.XXs`

### Check Development Logging
1. Set `NODE_ENV=development`
2. Open DevTools (F12)
3. Navigate to Body Tools → Integral Body Architect
4. Look for: `📊 Personalization Analysis: {...}`

### Unit Tests
```bash
# Note: Project uses Vitest
# To run: npm test (if configured)
# Test file: services/__tests__/integralBodyPersonalization.test.ts
```

## Common Scenarios

### User with No History
- Personalization skipped
- Default moderate settings used
- No log output in console

### User with 1 Week of History
- Time-weighted metrics calculated
- Compliance patterns emerge
- Adjustment directives generated if patterns detected
- Console log shows analysis

### User with 4+ Weeks of History
- Multiple plans analyzed
- Time decay applied (older plans down-weighted)
- Strong patterns detected
- Confident recommendations

## Troubleshooting

### Personalization Not Running
Check:
1. `activeWizard === 'integral-body-architect'`
2. `integralBodyPlanHistory.length > 0` (needs at least one plan)
3. Check browser console for errors

### Logs Not Showing
- Verify `NODE_ENV === 'development'`
- Check DevTools Console (F12)
- Search for "📊 Personalization Analysis"

### Plans Not Adapting
1. Ensure history has feedback (completedWorkout, intensity, energy levels)
2. Check that blockers are in daily feedback (`blockers` field)
3. Verify directives are generated (check console log)
4. Ensure directive prompt is injected (check LLM prompt in network tab)

## References

- **Full Architecture:** `ADAPTIVE_TUNING_ADR.md`
- **Implementation Details:** `ADAPTIVE_TUNING_IMPLEMENTATION.md`
- **Source Code:** `services/integralBodyPersonalization.ts`
- **Tests:** `services/__tests__/integralBodyPersonalization.test.ts`
- **Types:** `types.ts` (search for `PersonalizationSummary`)
