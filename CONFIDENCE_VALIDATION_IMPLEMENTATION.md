# Confidence Validation & Tonal Shifts Implementation

## Overview

This implementation addresses the **P3: Implement Algorithmic Confidence Validation & Tonal Shifts** ticket by introducing a system that ensures AI-generated language matches actual data strength, preventing overconfidence on weak data while supporting definitive language when evidence is strong.

## Problem Solved

**The Issue**: The app could previously tell a new user it's "95% confident" in a diagnosis after only two sessions, which disrespects user agency and promotes overconfidence on weak data.

**The Solution**: Algorithmic validation that:
1. Detects confidence language in AI-generated text
2. Compares it to actual data-based confidence scores
3. Applies tonal shifts to align language with evidence strength

## Architecture

### Three Main Services

#### 1. **confidenceValidator.ts** (8.8 KB)
- **Purpose**: Validates that claimed confidence matches actual data strength
- **Key Functions**:
  - `validateConfidence()` - Main validation function
  - `detectConfidenceLanguage()` - Analyzes text for confidence markers
  - `calculateConfidenceFromDataVolume()` - Computes confidence based on data volume

- **How it Works**:
  - Analyzes generated text for definitive language patterns ("clearly", "definitely", "95% confident")
  - Extracts claimed confidence level from text
  - Compares to actual confidence score
  - Flags mismatches and provides suggestions

**Example**:
```typescript
const validation = validateConfidence(
  "You are clearly demonstrating a 95% confident pattern",
  0.45,  // actual confidence from 2 sessions
  2      // number of sessions
);

// Result:
// isValid: false
// mismatchType: "overconfident"
// suggestion: "Text claims 95% confidence but actual is 45%..."
```

#### 2. **tonalShifter.ts** (9.4 KB)
- **Purpose**: Adjusts language tone to match confidence levels
- **Key Functions**:
  - `determineTone()` - Maps confidence score to tone type
  - `shiftTone()` - Adjusts text to appropriate tone
  - `buildToneInstructions()` - Generates system prompt instructions

- **Tone Levels**:
  - **Exploratory** (confidence < 0.5): "I'm noticing... might be worth exploring..."
  - **Observational** (0.5 ≤ confidence < 0.75): "You're showing... suggests..."
  - **Definitive** (confidence ≥ 0.75): "You are demonstrating... indicates strongly..."

**Example**:
```typescript
const shifted = shiftTone(
  "You are definitely showing a 95% confident pattern",
  0.35  // confidence from early data
);

// Result:
// shiftedText: "I'm noticing a pattern around this... it might be worth exploring..."
// toneUsed: "exploratory"
// changesApplied: ["Removed overconfident percentage claims", "Shifted tone from definitive to exploratory"]
```

#### 3. **confidenceAwareToning.ts** (6.3 KB)
- **Purpose**: High-level integration service combining validation + shifting
- **Key Functions**:
  - `applyConfidenceAwareToning()` - Main entry point
  - `needsConfidenceAwareToning()` - Check if toning is needed
  - `generateConfidenceContext()` - Create confidence disclaimers
  - `formatWithTone.*()` - Template-based formatting

**Example**:
```typescript
const result = applyConfidenceAwareToning(
  text,
  0.45,  // actual confidence
  { autoCorrect: true, dataPoints: 2 }
);

// Returns validated and tone-shifted text with full audit trail
```

### Integration Points

#### 1. **intelligenceHub.ts** - Intelligence Guidance Generation
```typescript
// Calculate confidence from data volume
const dataConfidence = calculateConfidenceFromDataVolume(
  context.wizardSessions.length,
  sessionsInLastWeek,
  context.integratedInsights.length
);

// Include tone instructions in system prompt
const toneInstructions = buildToneInstructions(dataConfidence);
const systemPrompt = buildSystemPrompt(dataConfidence);
```

**Effect**: The AI system receives explicit instructions about what tone to use based on actual data strength. Low data → exploratory tone. High data → definitive tone.

#### 2. **insightGenerator.ts** - Individual Insight Generation
```typescript
// Calculate confidence from session context
const dataConfidence = calculateConfidenceFromDataVolume(
  dataContext.totalSessions || 1,
  dataContext.sessionsInLastWeek || 0,
  dataContext.existingInsights || 0
);

// Apply tone instructions to prompt
const prompt = buildAdaptivePrompt(
  wizardType,
  sessionName,
  sessionReport,
  practiceList,
  userProfile,
  dataConfidence
);

// Validate generated insight
const confidenceValidation = validateConfidence(
  pattern,
  dataConfidence,
  dataContext?.totalSessions
);
```

**Effect**: Each insight is generated with appropriate confidence level and validated for overconfidence.

### Types Added to types.ts

```typescript
export interface ConfidenceValidationResult {
  isValid: boolean;
  claimedConfidence: 'high' | 'medium' | 'low' | 'unknown';
  actualConfidence: 'high' | 'medium' | 'low';
  mismatchFound: boolean;
  mismatchType?: 'overconfident' | 'underconfident';
  suggestion?: string;
}

export type ToneType = 'exploratory' | 'observational' | 'definitive';

export interface TonalShiftResult {
  originalText: string;
  shiftedText: string;
  toneUsed: ToneType;
  changesApplied: string[];
}
```

## How It Works: The Full Flow

### Example Scenario: New User, 2 Sessions

1. **Data Volume Assessment**
   - Total sessions: 2
   - Sessions in last week: 2
   - Related insights: 1
   - **Calculated confidence: 0.35** (low)

2. **System Prompt Adjustment**
   - intelligenceHub receives: `TONE: EXPLORATORY (Early Data)`
   - Instructions to use: "might", "could", "appears", "worth exploring"
   - Explicit warning: avoid high percentages, use disclaimers

3. **Insight Generation**
   - insightGenerator creates insight with confidence 0.35
   - Initial language from AI: "You are showing avoidance patterns" (could be overconfident)
   - Validation detects: mismatch between definitive tone and low confidence
   - Correction applied: "I'm noticing patterns around avoidance... worth exploring..."

4. **User Presentation**
   - Insight displayed with exploratory framing
   - Context: "💡 **Early-stage pattern.** This is based on emerging data after 2 sessions. More sessions will clarify these insights."
   - User understands: "This is a suggestion to explore, not a definitive diagnosis"

### Example Scenario: Established User, 25 Sessions

1. **Data Volume Assessment**
   - Total sessions: 25
   - Sessions in last week: 8
   - Related insights: 12
   - **Calculated confidence: 0.88** (high)

2. **System Prompt Adjustment**
   - intelligenceHub receives: `TONE: DEFINITIVE (Strong Data)`
   - Instructions to use: "is", "clearly", "demonstrates", "shows strongly"
   - Permission for confident language and high percentages

3. **Insight Generation**
   - Validation passes: definitive tone matches high confidence
   - Language like "You are demonstrating..." is appropriate and validated
   - Context: "✓ **Supported by evidence.** This pattern is consistent across your data and warrants direct attention."

4. **User Presentation**
   - Insight displayed with confidence and clarity
   - User understands: "This is based on solid evidence across many sessions"

## Key Features

### 1. **Automatic Confidence Calculation**
```typescript
calculateConfidenceFromDataVolume(
  totalSessions: number,
  sessionsInLastWeek: number,
  relatedInsights: number,
  consistencyScore?: number
): number
```

Translates data volume into confidence scores:
- 1 session → 0.30 (very low)
- 2-5 sessions → 0.40-0.50 (low)
- 5-10 sessions → 0.50-0.65 (medium)
- 10-20 sessions → 0.65-0.85 (high)
- 20+ sessions → 0.85-0.95 (very high)

### 2. **Confidence Language Detection**
Analyzes text for patterns:
- **Definitive**: "clearly", "definitely", "95% confident", "proven"
- **Exploratory**: "might", "could", "noticing", "worth exploring"
- **Uncertainty**: "unclear", "need more data", "preliminary"

### 3. **Automatic Tone Shifting**
When overconfidence detected, automatically:
- Removes percentage claims
- Replaces definitive language with exploratory equivalents
- Adds appropriate disclaimers
- Maintains meaning while reducing overconfidence

### 4. **Confidence Context Generation**
Creates appropriate disclaimers based on tone:
- **Exploratory**: "💡 Early-stage pattern. More sessions will clarify..."
- **Observational**: "📊 Observed pattern. Strong suggestion worth exploring..."
- **Definitive**: "✓ Supported by evidence. Warrants direct attention..."

## Usage Examples

### In insightGenerator.ts

```typescript
const insight = await generateInsightFromSession({
  wizardType: 'Bias Detective',
  sessionId: 'session-123',
  // ... other fields ...
  dataContext: {
    totalSessions: 3,
    sessionsInLastWeek: 2,
    existingInsights: 2
  }
});

// The insight will have appropriate confidence level and validated language
// Output confidence: 0.45 (based on 3 sessions)
// Language will be exploratory, not overconfident
```

### In intelligenceHub.ts

```typescript
const guidance = await getIntelligentGuidance(context, userProfile);

// System receives tone instructions based on calculated confidence
// If confidence < 0.5: "Use exploratory tone..."
// If confidence >= 0.75: "Use definitive tone..."

// AI generates recommendations with appropriate confidence language
```

### Using the Integration Service

```typescript
import { applyConfidenceAwareToning } from './services/confidenceAwareToning';

const result = applyConfidenceAwareToning(
  aiGeneratedText,
  0.45,
  {
    dataPoints: 2,
    autoCorrect: true,
    verbose: true
  }
);

console.log(result.tonedText);           // Corrected text
console.log(result.recommendations);     // Should toning be applied?
console.log(result.validationResults);   // Detailed validation info
```

## Testing

Test file: `services/__tests__/confidenceValidation.test.ts`

Verifies:
- Overconfident language detection (95% with 2 sessions)
- Exploratory language validation (matches low confidence)
- Definitive language validation (matches high confidence)
- Tone determination (0.3 → exploratory, 0.6 → observational, 0.85 → definitive)
- Confidence calculations (1, 5, 20 sessions)
- Language pattern detection
- Tone shifting applicability

## Benefits

1. **Honest Communication**: AI language never exceeds data strength
2. **User Agency**: Users can assess reliability based on tone
3. **Overconfidence Prevention**: Explicit checks prevent "95% confident" on weak data
4. **Tone Appropriateness**: Language automatically matches evidence level
5. **Compliance**: Aligns with guidelines on responsible AI communication
6. **Transparency**: Clear context provided with each confidence level

## Technical Details

### Pattern Matching
- Uses regex to detect 20+ definitive language patterns
- Extracts percentage claims for comparison
- Counts confidence markers to determine claimed level

### Tone Shifting
- Replaces confidence words in-place
- Removes overconfident claims
- Adds contextual disclaimers
- Preserves core meaning while adjusting certainty

### Confidence Calculation
- Data volume weighted: recent sessions count more
- Consistency bonus if available
- Capped at 0.95 maximum (prevents absolute certainty claims)
- Minimum 0.30 for any data (respects exploratory principle)

## Backwards Compatibility

- All changes are additive
- Existing code continues to work
- New imports optional for gradual adoption
- System prompts enhanced but compatible
- Types extended without breaking changes

## Files Modified/Created

### Created (4 new files)
- `services/confidenceValidator.ts` - Confidence validation logic
- `services/tonalShifter.ts` - Tonal adjustment logic
- `services/confidenceAwareToning.ts` - Integration service
- `services/__tests__/confidenceValidation.test.ts` - Test suite

### Modified (3 files)
- `services/intelligenceHub.ts` - Added tone instructions to system prompt
- `services/insightGenerator.ts` - Added confidence calculation and validation
- `types.ts` - Added confidence validation types

## Future Enhancements

1. **User Preference**: Let users set confidence thresholds
2. **Feedback Loop**: Learn from user confidence assessments
3. **Domain-Specific**: Adjust calculations per wizard type
4. **A/B Testing**: Compare response rates with/without tone awareness
5. **Analytics**: Track confidence-language mismatches over time
6. **Multi-language**: Extend pattern matching for other languages

## Conclusion

This implementation ensures the AOS app respects user agency by providing honest, data-appropriate language in all AI-generated insights and recommendations. The system automatically prevents overconfidence on weak data while supporting clear, definitive language when evidence is strong.
