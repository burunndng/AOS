# API Integration Status - Comprehensive Audit Report

**Generated:** 2025-11-16  
**Codebase:** /home/user/AOS  
**Status:** CRITICAL ISSUES FOUND

## Executive Summary

The codebase has **CRITICAL ISSUES** with API integration error handling, API key validation, and error recovery. Multiple services expose unhandled errors that could crash the application during API failures. At least 3 major services have zero error handling on their API calls.

**Risk Level:** HIGH - Production use not recommended without fixes  
**Estimated Fix Time:** 2-3 days for critical issues  
**Affected Components:** 10+ wizards and major features

---

## Critical Issues by Severity

### CRITICAL (Immediate Action Required)

#### 1. Gemini Service - 30+ API Calls Without Error Handling
- **File:** `/home/user/AOS/services/geminiService.ts`
- **Lines Affected:** 17, 28, 50, 73, 77, 90, 125, 158, 207, 220, 224, 254, 258, 282, 292, 313, 317, 331, and many more
- **Issue:** Direct API calls without try/catch blocks
- **Functions Missing Error Handling:**
  ```
  - generateText() [17]
  - explainPractice() [28]
  - populateCustomPractice() [50] - JSON.parse unsafely at line 73
  - getDailyReflection() [77]
  - summarizeThreeTwoOneSession() [90]
  - generateSocraticProbe() [125]
  - generateReflectiveProbe() [158]
  - getPersonalizedHowTo() [207] - JSON.parse at line 220
  - generatePracticeScript() [224] - JSON.parse at line 254
  - generateSpeechFromText() [258]
  - articulateSubjectTo() [282]
  - suggestSubjectObjectExperiments() [292] - JSON.parse at line 313
  - exploreOrigin() [317]
  - generateIntegrationInsight() [331]
  And 20+ more functions...
  ```
- **Impact:** Any API failure crashes the calling component
- **Example Problem Code:**
  ```typescript
  // Line 19-24: Direct await without error handling
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: prompt,
  });
  return response.text; // Could be undefined
  ```

#### 2. Bias Detective Service - Critical Functions Unprotected
- **File:** `/home/user/AOS/services/biasDetectiveService.ts`
- **Lines:** 4, 25-63, 69-116
- **Issues:**
  - Line 4: `process.env.API_KEY!` - No runtime validation
  - Line 25: `generateBiasedDecisionAnalysis()` - No try/catch
  - Line 58: Direct await of `ai.models.generateContent()`
  - Line 69: `generateBiasScenarios()` - No try/catch
  - Line 115: `JSON.parse(response.text)` - Will crash on invalid JSON
- **Called From:** BiasDetectiveWizard.tsx line 150

#### 3. Bias Finder Service - Multiple Functions Unprotected
- **File:** `/home/user/AOS/services/biasFinderService.ts`
- **Lines:** 16, 101-520
- **Issues:**
  - Line 16: `process.env.API_KEY!` - No validation
  - Lines 101-520: Multiple export functions without try/catch
  - Lines 214, 273, 383+: Unsafe JSON.parse calls
- **Functions Affected:**
  ```
  - generateOnboardingMessage() [101]
  - processTargetDecision() [121]
  - generateParameterRequest() [143]
  - generateHypotheses() [166] - JSON.parse line 214
  - generateSocraticQuestions() [228] - JSON.parse line 273
  - generateDiagnostic() [284] - Multiple JSON.parse
  - generateFinalReport() [345] - JSON.parse line 383
  - generateHypothesesStreaming() [430] - Streaming errors
  - generateSocraticQuestionsStreaming() [497] - Streaming errors
  ```

---

### HIGH Priority

#### 4. API Key Validation - Non-null Assertions
- **Files with unsafe pattern:**
  - `/home/user/AOS/services/geminiService.ts` line 14
  - `/home/user/AOS/services/biasDetectiveService.ts` line 4
  - `/home/user/AOS/services/biasFinderService.ts` line 16
  - `/home/user/AOS/services/perspectiveShifterService.ts` line 5

**Unsafe Pattern:**
```typescript
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
```

**Correct Pattern:**
```typescript
const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error('API_KEY environment variable is not set');
}
const ai = new GoogleGenAI({ apiKey });
```

#### 5. JSON Parsing Without Error Handling
- **biasDetectiveService.ts** line 115: `JSON.parse(response.text)`
- **geminiService.ts** lines 73, 254, 313: Unsafe JSON.parse
- **biasFinderService.ts** lines 214, 273, 383: Multiple unsafe parse
- **geminiRecommendationService.ts** line 298: Limited error handling

**Each should be wrapped:**
```typescript
try {
  const cleanJson = jsonString.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const parsed = JSON.parse(cleanJson);
  // Validate structure
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid response structure');
  }
  return parsed;
} catch (error) {
  console.error('Failed to parse JSON:', error);
  throw new Error('Invalid API response format');
}
```

#### 6. Missing Timeout Handling
- **Issue:** Only 4 instances of timeout handling across entire codebase
- **All Gemini API calls:** No timeout protection (can hang indefinitely)
- **Most OpenRouter calls:** No timeout protection
- **Streaming:** No timeout on stream

**Example Pattern Needed:**
```typescript
const timeout = setTimeout(() => {
  throw new Error('API request timeout (30s)');
}, 30000);

try {
  const response = await ai.models.generateContent({...});
  clearTimeout(timeout);
  return response.text;
} catch (error) {
  clearTimeout(timeout);
  throw error;
}
```

---

### MEDIUM Priority

#### 7. Component-Level Error Handling Issues
- **ThreeTwoOneWizard.tsx** line 82: No user feedback on error, silent failure
- **BiasDetectiveWizard.tsx** line 150: No timeout handling
- **CustomPracticeModal.tsx** line 110-122: Generic error messages
- **GuidedPracticeGenerator.tsx** line 414: On-the-fly error without feedback

#### 8. Streaming Error Handling
- **File:** `/home/user/AOS/services/openRouterService.ts` lines 96-116
- **Issue:** No error handling inside streaming loop
- **Problem:** Returns `success: true` even on partial failures

#### 9. Response Validation Gaps
- **geminiService.ts:** No validation that `response.text` exists
- **geminiService.ts:** No validation of `response.candidates` structure
- **RAG Service:** Assumes response.json() is valid JSON
- **biasDetectiveService.ts:** No validation of parsed JSON structure

---

## Component Impact Analysis

### Components That Will Crash on API Failure:
1. **BiasDetectiveWizard** - Calls `generateBiasedDecisionAnalysis()` at line 150
2. **CustomPracticeModal** - Calls `geminiService` functions at lines 110-122
3. **ThreeTwoOneWizard** - Calls `generateSocraticProbe()` at lines 80, 93, 106
4. **GuidedPracticeGenerator** - Calls `generatePracticeScript()` at line 363

### Components With Partial Protection:
- **Coach.tsx** - Has try/catch at lines 171-184, but service has no error handling
- **BiasDetectiveWizard** - Has try/catch at lines 131-136, 149-169

### Components Without Protection:
- **RelationalPatternChatbot**
- **KeganAssessmentWizard**
- **IFSWizard** (mostly)
- **DynamicWorkoutArchitectWizard**

---

## Summary Table

| Issue | Severity | Count | Files |
|-------|----------|-------|-------|
| Missing try/catch on API calls | CRITICAL | 30+ | geminiService.ts, biasDetectiveService.ts, biasFinderService.ts |
| Unsafe JSON.parse | HIGH | 10+ | geminiService.ts, biasDetectiveService.ts, biasFinderService.ts |
| API key non-null assertion | HIGH | 4 | geminiService.ts, biasDetectiveService.ts, biasFinderService.ts, perspectiveShifterService.ts |
| Missing timeout handling | HIGH | 40+ | All services |
| Unhandled streaming errors | MEDIUM | 2 | openRouterService.ts, biasFinderService.ts |
| Missing response validation | MEDIUM | 15+ | Multiple services |
| Silent component errors | MEDIUM | 5+ | Multiple wizards |

---

## Recommended Action Plan

### URGENT (Day 1-2):
1. Add try/catch to geminiService.ts main functions (lines 17, 50, 77, 90, 125, 158, 207, 224, 258, 282, 292, 317, 331+)
2. Add try/catch to biasDetectiveService.ts functions (lines 25, 69)
3. Fix unsafe JSON.parse at biasDetectiveService.ts:115
4. Add validation for API keys in initialization (lines 4, 14, 16 of respective files)

### THIS WEEK:
1. Add try/catch to all biasFinderService.ts functions
2. Replace non-null assertions with runtime checks (4 files)
3. Add timeout handling to Gemini calls (30-60 second default)
4. Improve streaming error handling in openRouterService.ts:96-116
5. Add user feedback for errors in components

### THIS SPRINT:
1. Create response validation helper functions
2. Implement centralized error recovery strategy
3. Add comprehensive error logging
4. Add retry logic for transient failures
5. Create fallback responses for common failures

---

## Files Requiring Changes

### Priority 1 (Critical):
- `/home/user/AOS/services/geminiService.ts`
- `/home/user/AOS/services/biasDetectiveService.ts`
- `/home/user/AOS/services/biasFinderService.ts`

### Priority 2 (High):
- `/home/user/AOS/services/openRouterService.ts`
- `/home/user/AOS/services/geminiRecommendationService.ts`
- `/home/user/AOS/services/perspectiveShifterService.ts`
- `/home/user/AOS/components/BiasDetectiveWizard.tsx`
- `/home/user/AOS/components/CustomPracticeModal.tsx`
- `/home/user/AOS/components/ThreeTwoOneWizard.tsx`

### Priority 3 (Medium):
- `/home/user/AOS/components/GuidedPracticeGenerator.tsx`
- `/home/user/AOS/components/RelationalPatternChatbot.tsx`
- `/home/user/AOS/components/IFSWizard.tsx`
- `/home/user/AOS/services/ragService.ts`

---

## Validation Checklist

After implementing fixes, verify:
- [ ] All API calls wrapped in try/catch
- [ ] All JSON.parse wrapped in try/catch
- [ ] All API keys validated at runtime (no non-null assertions)
- [ ] All API calls have 30-60 second timeout
- [ ] All components show error messages to user
- [ ] Streaming has per-chunk error handling
- [ ] Response structures validated before use
- [ ] No unhandled promise rejections
- [ ] All error paths logged
- [ ] Fallback responses provided where appropriate

---

**Report Generated:** 2025-11-16  
**Next Review:** After implementing Priority 1 fixes
