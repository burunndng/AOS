# Architecture Decision Record: Adaptive Tuning & Personalization

## Status
Implemented

## Context
The Integral Body Architect generates comprehensive weekly plans balancing Yang (strength training, nutrition, sleep) and Yin (breathing, Qigong, relaxation) practices. Initially, plans were generated without considering individual historical performance patterns. This meant:

1. Users with low compliance on certain practices got the same recommendations
2. Blockers from previous weeks weren't factored into new plan generation
3. Preferred practice times and high-compliance modalities weren't tracked
4. Plans didn't adapt to user's energy levels, intensity tolerance, or recovery needs

## Decision
Implement an **Adaptive Tuning Module** that:
- Analyzes plan history, completion data, and feedback to detect patterns
- Generates personalized adjustment directives and preferences
- Applies time decay so recent plans weigh more heavily than old ones
- Feeds insights into the LLM prompt for `generateIntegralWeeklyPlan`
- Logs insights in development mode for transparency

## Solution Architecture

### 1. Personalization Module (`services/integralBodyPersonalization.ts`)

The core module exports three main functions:

#### `analyzeHistoryAndPersonalize(planHistory, currentDate?): PersonalizationSummary`
Analyzes plan history and returns a comprehensive personalization summary including:
- **Time-weighted compliance metrics** (recent plans weighted 1.0x, decay to 0 by 28 days)
- **Adjustment directives** (e.g., "reduce intensity", "increase Yin duration", "avoid back-to-back heavy sessions")
- **Inferred preferences** (high-compliance modalities, preferred times, energy patterns)
- **Common blockers** (top recurring obstacles)
- **Best-performing day patterns** (days with >70% compliance)
- **Recommended adjustments** (intensity level, Yin duration, recovery days)

#### `buildPersonalizationPromptInsertion(summary): string`
Converts the personalization summary into a structured prompt insertion for the LLM, including:
- Compliance history with time-weighted averages
- Recommended adjustments with rationale
- Known blockers to avoid
- Best-performing day patterns
- Personalized directives

#### `calculateTimeDecayFactor(planDate, currentDate?): number`
Implements time decay for historical data:
- Plans from 0 days ago: 100% weight
- Plans from 14 days ago: 50% weight
- Plans from 28+ days ago: 0% weight (excluded)

This ensures recent behavior patterns influence new plans more than old ones.

### 2. Type Definitions (`types.ts`)

Three new types support personalization:

```typescript
interface AdjustmentDirective {
  type: 'intensity-nudge' | 'yin-duration' | 'yang-spacing' | 'practice-swap' 
       | 'time-shift' | 'recovery-boost' | 'load-reduction' | 'load-increase';
  description: string;
  rationale: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number; // 0-100
}

interface InferredPreference {
  type: 'preferred-time' | 'high-compliance-modality' | 'low-compliance-modality' 
       | 'energy-pattern' | 'blocker-pattern' | 'intensity-tolerance';
  value: string;
  frequency: number;
  compliance?: number;
  notes?: string;
}

interface PersonalizationSummary {
  planCount: number;
  analysisPeriodDays: number;
  timeWeightedAverage: {
    workoutCompliance: number;
    yinCompliance: number;
    averageIntensity: number;
    averageEnergy: number;
  };
  adjustmentDirectives: AdjustmentDirective[];
  inferredPreferences: InferredPreference[];
  commonBlockers: string[];
  bestPerformingDayPatterns: string[];
  recommendedIntensityLevel: 'low' | 'moderate' | 'high';
  recommendedYinDuration: number;
  recommendedRecoveryDays: number;
  summary: string;
}
```

### 3. Service Integration

#### In `integralBodyArchitectService.ts`:
- Updated `GeneratePlanInput` interface to include optional `personalizationSummary`
- Modified `generateIntegralWeeklyPlan` to build personalization prompt insertion
- Injected personalization directives into the main LLM prompt before plan synthesis

#### In `IntegralBodyArchitectWizard.tsx`:
- Added `personalizationSummary` prop
- Passes it to `generateIntegralWeeklyPlan` call

#### In `App.tsx`:
- Added `generatePersonalizationSummary()` callback that analyzes history
- Added `useEffect` to auto-trigger personalization when the wizard opens
- Logs insights in development mode
- Passes summary to the wizard component

### 4. Data Flow

```
Plan History (PlanHistoryEntry[])
    ↓
analyzeHistoryAndPersonalize()
    ├─ Apply time decay to recent plans
    ├─ Calculate time-weighted compliance
    ├─ Extract blockers
    ├─ Detect day patterns
    ├─ Generate directives
    └─ Infer preferences
    ↓
PersonalizationSummary
    ↓
buildPersonalizationPromptInsertion()
    ↓
Prompt Text (injected into LLM prompt)
    ↓
generateIntegralWeeklyPlan()
    ↓
IntegralBodyPlan (adapted to user patterns)
```

## Key Algorithms

### Time Decay
Plans older than 28 days are excluded from analysis. Plans within 28 days receive exponential decay:
```
decayFactor = max(0, 1 - daysDiff / 28)
```

This ensures recent behavior strongly influences new plans while still considering longer-term patterns.

### Compliance Thresholds
Adjustment directives are generated based on:
- **Low workout compliance** (<50%): Suggest load reduction
- **Low Yin compliance** (<50%): Reduce practice duration to 5-10 min
- **High intensity + low energy**: Suggest recovery boost
- **High consecutive intensity**: Flag back-to-back heavy sessions

### Preference Inference
- **High-compliance modalities**: Practices completed >80% of attempts
- **Best-performing days**: Days with >70% task completion
- **Energy patterns**: Tracked from feedback data
- **Blocker patterns**: Top 5 recurring obstacles

## Testing & Validation

Unit tests in `services/__tests__/integralBodyPersonalization.test.ts` validate:
1. **Empty history**: Returns sensible defaults
2. **High compliance history**: Correctly calculates metrics and generates appropriate directives
3. **Low compliance with blockers**: Suggests load reduction and identifies blockers
4. **Time decay application**: Correctly weights recent plans
5. **Deterministic output**: Same input always produces same output
6. **Confidence scores**: All between 0-100
7. **Impact levels**: Valid enum values

### Test Fixtures
- `highComplianceHistory`: 1 week of high completion, high energy
- `lowComplianceHistory`: Low completion, multiple blockers, low energy
- `highIntensityHistory`: High intensity days, potential back-to-back pattern

## Development Mode Logging

When `NODE_ENV === 'development'`, the console logs:
```javascript
📊 Personalization Analysis: {
  planCount: number,
  analysisPeriodDays: number,
  timeWeightedCompliance: {
    workouts: "XX%",
    yinPractices: "XX%"
  },
  adjustmentDirectives: ["directive 1", "directive 2", ...],
  inferredPreferences: ["type: value", ...]
}
```

This transparency helps understand what's driving plan adaptation.

## Extensibility

To add new personalization features:

1. **New adjustment directive type**:
   - Add to `AdjustmentDirective.type` union
   - Add detection logic to `generateAdjustmentDirectives()`
   - Update prompt insertion in `buildPersonalizationPromptInsertion()`

2. **New preference type**:
   - Add to `InferredPreference.type` union
   - Add inference logic to `inferPreferences()`
   - Include in prompt insertion

3. **New analysis metric**:
   - Add to `PersonalizationSummary`
   - Calculate in `analyzeHistoryAndPersonalize()`
   - Include rationale in `generatePersonalizationSummary()` logging

## Future Enhancements

1. **Seasonal patterns**: Track compliance changes across seasons/weather
2. **Exercise-level tracking**: Remember which specific exercises had highest compliance
3. **Circadian preferences**: Infer optimal practice times from completion patterns
4. **Recovery correlations**: Track correlation between recovery activities and next-day performance
5. **Peer benchmarking**: Compare against anonymized aggregate statistics
6. **Predictive modeling**: Use past patterns to predict future compliance and preemptively adjust

## Example Outputs

### High Compliance User
```
Personalization Summary for High Performer:
- 5 plans analyzed over 35 days
- Workout compliance: 85%
- Yin practice compliance: 92%
- Adjustment: Load increase (consider more challenging workouts)
- Best days: Monday, Wednesday, Friday (structure similarly)
- Recommended: High intensity, 18 min Yin practices daily
```

### Low Compliance User
```
Personalization Summary for Struggling User:
- 2 plans analyzed over 14 days
- Workout compliance: 30%
- Yin practice compliance: 15%
- Adjustments: 
  1. Load reduction (cut workout frequency in half)
  2. Yin duration reduction (start with 5-min practices)
  3. Recovery boost (add extra rest days)
- Known blockers: "Time constraints", "Fatigue"
- Recommended: Low intensity, 8 min Yin practices, 3 recovery days
```

## Success Metrics

- Plans adapted based on feedback history (qualitative evaluation)
- Unit tests pass with deterministic outputs
- Dev logs show directives being applied
- User reports improved plan relevance over time (future user feedback)

## Related Documents
- `QA_PLAN_HISTORY.md`: Plan history feature specification
- `TICKET_IMPLEMENTATION_SUMMARY.md`: Ticket 1 & 2 implementation details
- `integralBodyPersonalization.ts`: Implementation source
- Test file: `services/__tests__/integralBodyPersonalization.test.ts`
