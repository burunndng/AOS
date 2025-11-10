# Memory Reconsolidation Wizard - Step 2 Fix Summary

## Issues Fixed

### 1. "Identify Beliefs" Button Not Working
**Problem:** The button was calling `handleNext()`, which tried to both extract beliefs AND move to the next step in one action. This caused the beliefs to be extracted but immediately moved past before the user could see them.

**Solution:** Created a separate `handleExtractBeliefs()` function that ONLY extracts beliefs without changing the current step.

### 2. Next Button Greyed Out
**Problem:** The Next button relied on `canProceedToNext()` which required both context input AND extracted beliefs. Since beliefs were being extracted at the same time as moving to next step, this condition was never properly met.

**Solution:** Split the workflow into two distinct actions:
1. Extract beliefs (via "Identify Beliefs" button)
2. Move to next step (via footer "Next" button)

### 3. API Integration Issues
**Problem:** Multiple service call signature mismatches and undefined variables:
- `extractImplicitBeliefs(userId, beliefContext)` instead of proper payload object
- `memoryReconsolidationIntegrationOptions` undefined
- `submitSessionCompletion()` function not imported
- `memoryReconsolidationGroundingOptions` undefined

**Solution:** Fixed all API calls to use correct payload structures and replaced undefined variables with proper references.

## Changes Made

### File: `components/MemoryReconsolidationWizard.tsx`

#### 1. Updated Imports (lines 16-22)
```typescript
import { 
  extractImplicitBeliefs, 
  mineContradictions,
  type ExtractImplicitBeliefsPayload,
  type MineContradictionsPayload
} from '../services/memoryReconsolidationService.ts';
import { GROUNDING_OPTIONS } from '../constants.ts';
```

#### 2. Added State Variable (line 102)
```typescript
const [selectedBeliefId, setSelectedBeliefId] = useState<string | null>(null);
```

#### 3. Created `handleExtractBeliefs` Function (lines 176-204)
- Validates context length (50+ characters)
- Shows loading state
- Calls `extractImplicitBeliefs` API with proper payload structure
- Updates session with extracted beliefs
- Sets baseline intensity from first belief's emotional charge
- Handles errors with user-friendly messages

#### 4. Updated "Identify Beliefs" Button (lines 495-502)
```typescript
<button
  onClick={handleExtractBeliefs}  // Changed from handleNext
  disabled={beliefContext.trim().length < 50 || isLoading}
  className="btn-luminous px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
>
  {isLoading ? 'Identifying...' : 'Identify Beliefs'}
</button>
```

#### 5. Updated `handleNext` Function (lines 231-321)
- **BELIEF_IDENTIFICATION step:** Now just moves to next step (beliefs already extracted)
- **CONTRADICTION_MINING step:** Fixed to use correct `MineContradictionsPayload` structure
- **INTEGRATION step:** 
  - Uses `integrationOptions` instead of undefined variable
  - Removed call to non-existent `submitSessionCompletion()`
  - Sets completion data manually for display

#### 6. Fixed Grounding Options Reference (line 874)
Changed from undefined `memoryReconsolidationGroundingOptions` to `session.groundingOptions`

## User Flow (After Fix)

1. **Step 1: ONBOARDING** - User reads intro and clicks Next
2. **Step 2: BELIEF_IDENTIFICATION**
   - User enters context (minimum 50 characters)
   - "Identify Beliefs" button becomes enabled
   - User clicks "Identify Beliefs"
   - Loading spinner appears with "Identifying..." text
   - API call extracts implicit beliefs
   - Beliefs appear in UI as cards with details
   - Footer "Next" button becomes enabled
   - User clicks "Next" to proceed
3. **Step 3: CONTRADICTION_MINING** - Continues with workflow

## Testing Checklist

- [x] Build succeeds without errors
- [x] No TypeScript type errors
- [x] "Identify Beliefs" button triggers API call
- [x] Loading state shows during API call
- [x] Beliefs appear after extraction
- [x] "Next" button becomes enabled after beliefs extracted
- [x] "Next" button moves to next step without re-calling API
- [x] Error handling displays user-friendly messages
- [x] All imports resolve correctly

## Technical Notes

### Service Signatures Used
```typescript
// Correct payload structure for extracting beliefs
interface ExtractImplicitBeliefsPayload {
  memoryNarrative: string;
  emotionalTone?: string;
  bodySensations?: string;
  baselineIntensity?: number;
  additionalContext?: Record<string, unknown>;
}

// Correct payload structure for mining contradictions
interface MineContradictionsPayload {
  beliefs: Array<{ id: string; belief: string }>;
  beliefIds: string[];
  contradictionSeeds?: string[];
  userSuppliedResources?: string[];
}
```

### canProceedToNext Logic for BELIEF_IDENTIFICATION
```typescript
case 'BELIEF_IDENTIFICATION':
  return beliefContext.trim().length > 50 && session.implicitBeliefs.length > 0;
```
This ensures both conditions are met:
1. User has entered sufficient context
2. Beliefs have been successfully extracted

## Acceptance Criteria Met

✅ Clicking "Identify Beliefs" triggers the API call and shows loading state  
✅ Belief options appear after successful extraction  
✅ User can view extracted beliefs with details  
✅ "Next" button becomes enabled and functional after beliefs are extracted  
✅ No console errors  
✅ Proper error messages if API call fails  
✅ Loading states are clear and informative  
✅ Workflow is intuitive and follows expected UX patterns
