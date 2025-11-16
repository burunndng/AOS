# ERROR HANDLING GAPS - QUICK REFERENCE
## Critical Files & Line Numbers

### CRITICAL FILES NEEDING FIXES

#### 1. `/home/user/AOS/services/geminiService.ts` - HIGHEST PRIORITY
**Status:** 14+ functions without error handling

**Functions without try/catch (in order of severity):**

| Line | Function | Issue | Impact |
|------|----------|-------|--------|
| 17-25 | generateText() | No try/catch on API call | CASCADING - Called by 15+ functions |
| 50-74 | populateCustomPractice() | No try/catch, unprotected JSON.parse() | Silent failures |
| 77-86 | getDailyReflection() | No error handling | Promise rejection |
| 90-119 | summarizeThreeTwoOneSession() | No error handling | ThreeTwoOneWizard affected |
| 125-152 | generateSocraticProbe() | No error handling | Promise rejection |
| 158-201 | generateReflectiveProbe() | No error handling | Promise rejection |
| 207-221 | getPersonalizedHowTo() | No error handling | Promise rejection |
| 224-255 | generatePracticeScript() | No try/catch, unprotected JSON.parse() | Silent failures |
| 258-278 | generateSpeechFromText() | No try/catch on API call | Promise rejection |
| 282-290 | articulateSubjectTo() | No error handling | Promise rejection |
| 292-314 | suggestSubjectObjectExperiments() | No try/catch, unprotected JSON.parse() | Silent failures |
| 317-327+ | exploreOrigin() | No error handling | Promise rejection |
| 331-343 | generateIntegrationInsight() | No error handling | Promise rejection |
| 347-373 | extractPartInfo() | No try/catch, unprotected JSON.parse() | Silent failures |

**Unprotected JSON.parse() calls:**
- Line 73: populateCustomPractice()
- Line 254: generatePracticeScript()
- Line 313: suggestSubjectObjectExperiments()
- Line 372: extractPartInfo()
- Line 404: summarizeIFSSession()
- Line 429: generateRecommendations()
- Line 541: generateAqalReport()
- Line 592: generatePracticeResearch()
- And more...

---

#### 2. `/home/user/AOS/App.tsx` - HIGH PRIORITY
**Status:** Missing Error Boundary component

**What's needed:**
- No Error Boundary component exists
- Should wrap entire app content
- Should handle component crashes gracefully

**Lazy-loaded components without error boundary:**
- Lines 10-57: All lazy-loaded components need ErrorBoundary wrapper
- Around Suspense boundaries

---

#### 3. `/home/user/AOS/components/GuidedPracticeGenerator.tsx` - MEDIUM PRIORITY
**Status:** Data fetching without comprehensive error handling

**Issues:**
- Calls generatePracticeScript() (unprotected JSON.parse)
- Calls generateSpeechFromText() (no try/catch on API)
- No fallback UI on error

---

#### 4. `/home/user/AOS/components/ThreeTwoOneWizard.tsx` - MEDIUM PRIORITY
**Status:** Depends on unprotected service

**Issues:**
- Calls summarizeThreeTwoOneSession() (no error handling in service)
- generateText() has no error handling (called internally)
- Should validate response structure

---

#### 5. `/home/user/AOS/components/CustomPracticeModal.tsx` - MEDIUM PRIORITY
**Status:** Some error handling, needs service-layer fixes

**Issues:**
- Multiple AI service calls (lines 110, 143, 155, 187)
- Services lack error handling (cascading failures)
- Component error handling is good, but service failures not handled

---

### GOOD EXAMPLES TO FOLLOW

#### `/home/user/AOS/hooks/useExplanation.ts` - EXCELLENT PATTERN
**Status:** ✓ Proper error handling

**Why it's good:**
- try/catch blocks around async operations (lines 47-76, 95-140)
- Error state management (lines 14, 30, 71-75)
- Proper error message extraction (line 70)

**Pattern to replicate:**
```typescript
try {
  const response = await fetch(...);
  if (!response.ok) throw new Error(...);
  const data = await response.json();
  setState({ data, error: null });
} catch (err) {
  const errorMessage = err instanceof Error ? err.message : 'Unknown error';
  setState({ error: errorMessage });
}
```

---

### COMPONENTS WITH GOOD ERROR HANDLING

These components can serve as models:

| Component | File | Status |
|-----------|------|--------|
| Coach.tsx | lines 84-185 | ✓ Proper try/catch with error display |
| CustomPracticeModal.tsx | lines 89-130 | ✓ Multiple try/catch blocks |
| useExplanation.ts | lines 47-140 | ✓ Complete error handling pattern |
| coachChatService.ts | lines 127-177 | ✓ Try/catch with fallback |

---

### COMPONENTS WITH MISSING ERROR STATES

Review these for missing error handling:

| Component | Issue | Fix |
|-----------|-------|-----|
| GuidedPracticeGenerator.tsx | No error UI | Add error state display |
| BiasDetectiveWizard.tsx | Service errors may not display | Add error boundary |
| BiasFinderWizard.tsx | Service errors may not display | Add error boundary |
| ILPKnowledgeGraph.tsx | Service errors may not display | Add error boundary |
| InsightPracticeMapWizard.tsx | Service errors may not display | Add error boundary |

---

## ACTION ITEMS BY PRIORITY

### PRIORITY 1: CRITICAL (Must fix before production)

1. **Fix generateText() function**
   - File: `/home/user/AOS/services/geminiService.ts` line 17
   - Time: 5 minutes
   - Impact: Fixes cascading failures for 15+ functions

2. **Protect all JSON.parse() calls**
   - File: `/home/user/AOS/services/geminiService.ts`
   - Count: 8+ locations
   - Time: 30 minutes
   - Pattern: Try/catch with typed fallback

3. **Add Error Boundary to App.tsx**
   - File: `/home/user/AOS/App.tsx`
   - Time: 15 minutes
   - Impact: Prevents entire app crash on component errors

---

### PRIORITY 2: HIGH (Do within sprint)

4. **Add error handling to remaining service functions**
   - File: `/home/user/AOS/services/geminiService.ts`
   - Count: 14+ functions
   - Time: 2-3 hours

5. **Add error boundaries to component tree**
   - Files: Various components
   - Scope: Wizards, Modals, Lazy-loaded components
   - Time: 1 hour

6. **Review component error states**
   - Ensure all data-fetching components show error UI
   - Time: 1 hour

---

### PRIORITY 3: MEDIUM (Next iteration)

7. **Add retry logic for network failures**
   - Pattern: Exponential backoff on API failures
   - Scope: All service functions

8. **Add error monitoring/logging**
   - Tool: Sentry or similar
   - Track error rates by function

---

## FILES MAPPED BY LOCATION

### Services with Error Handling Gaps

**Main culprit:**
- `/home/user/AOS/services/geminiService.ts` (1975 lines, multiple failures)

**Other services to review:**
- `/home/user/AOS/services/intelligenceHub.ts`
- `/home/user/AOS/services/biasFinderService.ts`
- `/home/user/AOS/services/dynamicWorkoutArchitectService.ts`

### Components Most Affected

**High Impact:**
- `/home/user/AOS/components/CustomPracticeModal.tsx`
- `/home/user/AOS/components/ThreeTwoOneWizard.tsx`
- `/home/user/AOS/components/GuidedPracticeGenerator.tsx`

**Medium Impact:**
- `/home/user/AOS/components/BiasDetectiveWizard.tsx`
- `/home/user/AOS/components/SubjectObjectWizard.tsx`
- `/home/user/AOS/components/IFSWizard.tsx`

### App Structure

**Root app:**
- `/home/user/AOS/App.tsx` (needs Error Boundary wrapper)

**Good hook example:**
- `/home/user/AOS/hooks/useExplanation.ts` (proper error handling pattern)

---

## QUICK STATS

- Total components: 34
- Components with error state: 17 (50%)
- Service functions without try/catch: 40+
- JSON.parse() calls without protection: 8+
- Error Boundaries in app: 0
- Hooks with proper error handling: 1/1 (100%)

---

## NEXT STEPS

1. Review this document with team
2. Start with Priority 1 items
3. Create GitHub issues for tracking
4. Implement error handling patterns
5. Add unit tests for error scenarios
6. Consider error monitoring service

