# TypeScript Type Errors Audit Report - AOS Codebase

## Summary
The codebase contains **38+ files** with TypeScript type safety issues. The most critical problems are:
- **25+ unsafe type assertions** (`as any`, `as unknown`)
- **40+ implicit `any` parameters** in functions and callbacks
- **Untyped error handling** in catch blocks
- **Missing type guards** for API response parsing
- **Unsafe property access** on objects/arrays

---

## 1. UNSAFE TYPE ASSERTIONS (`as any` / `as unknown`)

### Critical Issues

#### App.tsx
- **Line 127**: `return item as unknown as T;` - Double casting with unknown
  - **Issue**: Bypasses type safety for localStorage parsing
  - **Fix**: Create proper type guard function instead
  ```typescript
  function parseStoredValue<T>(item: string, fallback: T): T {
    try {
      return JSON.parse(item) as T;
    } catch {
      return fallback;
    }
  }
  ```

### Audio Context Type Issues (8 occurrences)

Files with unsafe webkitAudioContext casting:
- **components/IFSWizard.tsx:517-518**
- **components/SomaticGeneratorWizard.tsx:213**
- **components/PracticeChatbot.tsx:130-131**
- **components/BiasFinderAudioPlayer.tsx:60**
- **components/GuidedPracticeGenerator.tsx:275**

**Issue**: `(window as any).webkitAudioContext`
**Fix**: Create proper type definition:
```typescript
interface WindowWithAudio extends Window {
  webkitAudioContext?: typeof AudioContext;
}

const audioContext = new (window.AudioContext || (window as WindowWithAudio).webkitAudioContext)();
```

### Form Element Casting

#### components/BiasFinderWizard.tsx:627
```typescript
const decisionType = (document.getElementById('decision-type-select') as HTMLSelectElement).value.trim() as any;
```
**Issue**: Unnecessary secondary `as any` cast
**Fix**: Remove the second assertion - the first is sufficient

#### components/IntegralBodyArchitectWizard.tsx:760, 789, 809, 971
```typescript
onChange={e => onActivityLevelChange(e.target.value as any)}
```
**Issue**: Type coercion on select/input value
**Fix**: Properly type the callback:
```typescript
const onActivityLevelChange = (value: 'sedentary' | 'lightly-active' | 'moderately-active' | 'very-active' | 'athlete') => { ... }
```

### Service Layer Casting Issues

#### services/meditationRecommender.ts:167
```typescript
const matches = userApproaches.filter(a => practiceApproaches.includes(a as any));
```
**Fix**: Use type-safe comparison:
```typescript
const matches = userApproaches.filter(a => practiceApproaches.includes(a as unknown as typeof practiceApproaches[number]));
```

#### services/planExportUtils.ts:310, 364
```typescript
if (existingScript && (window as any).html2pdf)
const html2pdfLib = (window as any).html2pdf;
```
**Fix**: Declare proper interface:
```typescript
declare global {
  interface Window {
    html2pdf?: typeof html2pdf;
  }
}
```

#### services/biasFinderService.ts:702
```typescript
const response = await (ai.models as any).generateContent({
```
**Fix**: Use proper GoogleGenAI typing

#### api/insights/generate.ts:36
```typescript
type: sessionType as any,
```
**Fix**: Use string literal types or create proper union type

---

## 2. MISSING TYPE ANNOTATIONS IN PARAMETERS (40+ occurrences)

### Critical Function Parameter Issues

#### utils/contextAggregator.ts
- **Line 98**: `function extractDevelopmentalStage(wizardSessions: any[])`
  - **Fix**: `wizardSessions: WizardSessionSummary[]`
  
- **Line 109**: `function extractAttachmentStyle(wizardSessions: any[])`
  - **Fix**: `wizardSessions: WizardSessionSummary[]`
  
- **Line 122**: `wizardSessions: any[]` (parameter in extractPrimaryChallenges)
  - **Fix**: Properly type the wizard sessions

#### utils/sessionSummarizer.ts
- **Line 96**: `function summarizeSession(wizardType: string, session: any)`
  - **Issue**: Untyped session parameter
  - **Fix**: Create union type for all possible wizard sessions

- **Line 102**: `session.identifiedBiases.map((b: any) => b.name || b)`
  - **Issue**: Callback parameter typed as `any`
  - **Fix**: `(b: IdentifiedBias) => b.name`

#### api/insights/generate.ts
- **Line 21**: `sessionData: Record<string, any>` - Too broad
- **Line 328**: `sessionData: any` - Untyped parameter
- **Line 343**: `sessionData: any` - Untyped parameter

**Fix**: Create specific interface types for each session type:
```typescript
export interface SessionDataMap {
  'bias_detective': BiasDetectiveSession;
  'ifs': IFSSession;
  'three_two_one': ThreeTwoOneSession;
  // ... other types
}
```

### Callback Parameters

#### components/SubjectObjectWizard.tsx:74
```typescript
const updateField = (field: keyof SubjectObjectSession, value: any) => {
```
**Fix**: Create a union type for values or use conditional types

#### components/MeditationWizard.tsx:36, 178
```typescript
const handleAnswer = (questionId: string, value: any) => {
```
**Fix**: Type based on question content

#### components/LearningCard.tsx:199
```typescript
{card.interactionData.pairs.map((pair: any, idx: number) => (
```
**Fix**: Type pair based on `card.interactionType`

#### api/insights/generate.ts:115
```typescript
(ragPrompt.context.practices || []).map((practice: any, index: number) =>
```
**Fix**: Type as `Practice[]`

---

## 3. UNTYPED ERROR HANDLING (30+ occurrences)

### Pattern: `catch (error)` without type

All of these lack proper error typing:
- services/coachChatService.ts:167
- services/flabbergasterChatService.ts:85
- services/openRouterService.ts:136
- services/biasFinderService.ts:402, 720, 826
- services/eightZonesService.ts:150
- services/insightPracticeMapService.ts:510
- services/adaptiveCycleService.ts:121
- services/intelligenceHub.ts:87, 368, 467, 486
- services/ragService.ts (25+ occurrences)
- components/PracticeChatbot.tsx:273
- services/planExportUtils.ts:393

**Fix**: Use proper error typing:
```typescript
catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  // ... handle error
}
```

---

## 4. MISSING TYPE GUARDS ON API RESPONSES (15+ occurrences)

### JSON.parse without validation

#### App.tsx:122
```typescript
const item = window.localStorage.getItem(key);
// ...
return JSON.parse(item);  // No type validation
```
**Fix**: Add validation:
```typescript
const parsed = JSON.parse(item) as unknown;
if (typeof parsed !== 'object' || parsed === null) {
  throw new TypeError('Invalid stored value');
}
```

#### services/memoryReconsolidationService.ts:99
```typescript
const parsed = JSON.parse(cleanJson);
const beliefs: ImplicitBelief[] = parsed.beliefs.map((b: any, idx: number) => ({
```
**Issue**: No validation that `parsed.beliefs` exists
**Fix**: Add runtime validation:
```typescript
if (!Array.isArray(parsed.beliefs)) {
  throw new Error('Invalid beliefs response format');
}
```

#### services/biasFinderService.ts:398
```typescript
reportData = JSON.parse(jsonMatch[0]);
```
**Issue**: `jsonMatch[0]` accessed without null check
**Fix**: Check array bounds first

#### services/geminiRecommendationService.ts:298
```typescript
const parsed = JSON.parse(jsonString);
```
**Fix**: Add try-catch and validation

#### services/bigMindService.ts:487
```typescript
const parsed = JSON.parse(responseText);
```
**Fix**: Add validation

---

## 5. UNSAFE PROPERTY ACCESS (20+ occurrences)

### Missing Optional Chaining

#### contextAggregator.ts:100-101
```typescript
if (keganSession?.sessionData?.overallInterpretation?.centerOfGravity) {
  return keganSession.sessionData.overallInterpretation.centerOfGravity as KeganStage;
}
```
**Issue**: Good use of optional chaining, but could be safer

#### memoryReconsolidationService.ts:102-112
```typescript
const beliefs: ImplicitBelief[] = parsed.beliefs.map((b: any, idx: number) => ({
  id: b.id || `belief-${idx + 1}`,
  belief: b.belief || '',
  // ... accessing undefined properties
}));
```
**Fix**: Validate object structure first:
```typescript
if (!Array.isArray(parsed?.beliefs)) {
  throw new Error('Invalid beliefs structure');
}
```

#### Components/CustomPracticeModal.tsx:270
```typescript
{(module === 'body' || module === 'mind') && <div>...setRoi(e.target.value as any)</div>}
```
**Issue**: Type coercion on select value
**Fix**: Type the value properly

---

## 6. MISSING INTERFACE DEFINITIONS (5+ occurrences)

### Incomplete type definitions

#### types.ts:1420
```typescript
interface WizardSessionSummary {
  type: string;
  date: string;
  keyInsights: string[];
  sessionData?: any;  // <-- TOO BROAD
}
```
**Fix**: Create specific interfaces:
```typescript
interface WizardSessionSummary<T = Record<string, unknown>> {
  type: WizardType;
  date: string;
  keyInsights: string[];
  sessionData?: T;
}

type WizardType = 'biasDetective' | 'ifs' | 'threeTwoOne' | ...;
```

#### api/lib/types.ts
Missing proper typing for:
- `GenerationRequest.sessionData`
- `UserSession.content`
- `RecommendationResponse` structure

---

## 7. FUNCTION RETURN TYPE ISSUES

### Functions with implicit return types

#### hooks/useExplanation.ts:38
```typescript
explanation: explanationCache.get(recommendationId) || null,
```
**Issue**: `.get()` returns `T | undefined`, then `|| null` creates `T | null` but type might not be properly inferred

#### utils/helpers.ts:49
```typescript
export function debounce<T extends (...args: any[]) => any>(
  // ... parameters without explicit return type
)
```
**Fix**: Add return type:
```typescript
export function debounce<T extends (...args: any[]) => any>(
  // ...
): (...args: Parameters<T>) => void {
  // ...
}
```

---

## Priority Fix Recommendations

### HIGH PRIORITY (Security/Correctness)
1. **Remove all `as any` assertions** - 25+ instances
   - Especially in geminiService.ts and biasFinderService.ts
   
2. **Add proper error typing in catch blocks** - 30+ instances
   - Critical for error handling reliability

3. **Validate JSON parsing results** - 15+ instances
   - Prevents runtime errors from malformed responses

### MEDIUM PRIORITY (Type Safety)
4. **Type all function parameters** - 40+ untyped parameters
   - Especially callbacks and API data structures

5. **Create proper session type definitions** - WizardSessionSummary needs specialization
   - Currently too loose with `any` properties

6. **Add type guards for property access** - 20+ unsafe accesses
   - Especially in API response handling

### LOW PRIORITY (Code Quality)
7. **Define global interface extensions** - AudioContext, html2pdf
   - Instead of casting to `any`

8. **Add discriminated union types** - For session types
   - Better than string + any pattern

---

## Files Requiring Most Attention

1. **services/intelligenceHub.ts** - 8+ `as any` issues
2. **api/insights/generate.ts** - 6+ untyped parameters
3. **utils/contextAggregator.ts** - 3 untyped wizard session parameters
4. **services/memoryReconsolidationService.ts** - JSON parsing without validation
5. **services/biasFinderService.ts** - Multiple casting and parsing issues
6. **types.ts** - WizardSessionSummary.sessionData: any

---

## Testing Recommendations

Add comprehensive type tests:
```typescript
// Type test for session summaries
const testSession: WizardSessionSummary = {
  type: 'ifs',
  date: new Date().toISOString(),
  keyInsights: [],
  sessionData: {} // This should be typed properly
};
```

Enable stricter tsconfig.json settings:
```json
{
  "compilerOptions": {
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUncheckedIndexedAccess": true
  }
}
```

