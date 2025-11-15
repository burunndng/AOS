# Wizard Context & Sequencing Implementation Plan

**Effort:** 20-30 minutes (core feature) + 40-60 minutes (full architectural improvements)
**Impact:** VERY HIGH
**Status:** Ready for Implementation

---

## 🔍 Current State Analysis

### Wizard System Architecture

**How Wizards Launch:**
```typescript
// App.tsx:269
const setActiveWizardAndLink = (wizardName: string | null, insightId?: string) => {
  setActiveWizard(wizardName);
  setLinkedInsightId(insightId);
}

// App.tsx:1281
const getActiveInsightContext = () => {
  if (!linkedInsightId) return null;
  return integratedInsights.find(i => i.id === linkedInsightId) || null;
}
```

**Problem:** Only the **current linked insight** is accessible. No awareness of:
- Previous sessions of the same wizard type
- Related patterns from other wizards
- Developmental journey/progression
- Pattern evolution over time

### Session Storage (11 history arrays)

```typescript
history321: ThreeTwoOneSession[]          // 3-2-1 sessions
historyIFS: IFSSession[]                  // IFS sessions
historyBias: BiasDetectiveSession[]       // Bias Detective
historyBiasFinder: BiasFinderSession[]    // Bias Finder
historySO: SubjectObjectSession[]         // Subject-Object
historyPS: PerspectiveShifterSession[]    // Perspective Shifter
historyPM: PolarityMap[]                  // Polarity Mapper
historyKegan: KeganAssessmentSession[]    // Kegan Assessment
historyRelational: RelationalPatternSession[] // Relational
historyAttachment: AttachmentAssessmentSession[] // Attachment
historyBigMind: BigMindSession[]          // Big Mind
historyJhana: JhanaSession[]              // Jhana
memoryReconHistory: MemoryReconsolidationSession[] // Memory Recon
eightZonesHistory: EightZonesSession[]    // Eight Zones
somaticPracticeHistory: SomaticPracticeSession[] // Somatic
```

**Data Available:**
- Each session has: `id`, `date`, `linkedInsightId?`
- Many have summaries/AI analysis
- All are chronologically ordered

**Gap:** No cross-wizard sequencing analysis

### Insight Generation (insightGenerator.ts)

**Current Prompt:**
```typescript
// Line 66-98: Generic prompt with NO historical context
Wizard Session: ${wizardType}
Session Name: ${sessionName}
Session Report: ${sessionReport}
Available Practices: ${practiceList}

Please analyze THIS session...
```

**Missing:**
- Previous session patterns
- Building-on narrative
- Developmental arc awareness
- Pattern evolution tracking

---

## 🎯 Proposed Solution: Wizard Context Sequencing

### Feature Overview

When a user launches a wizard (especially from an insight), provide:
1. **Previous Related Sessions** - "You've explored this 3 times before"
2. **Building-On Narrative** - "Building on your discovery about X..."
3. **Suggested Focus** - "Consider exploring Y this time"
4. **Pattern Evolution** - "This pattern first emerged on DATE"

### Implementation Components

#### **1. Core Service: `wizardSequenceContext.ts`**

**Location:** `services/wizardSequenceContext.ts`

```typescript
/**
 * Wizard Sequence Context Service
 * Provides historical context when launching wizards
 * Shows users their developmental journey through repeated work
 */

import type { IntegratedInsight } from '../types';

interface WizardHistoryEntry {
  sessionId: string;
  date: string;
  summary: string;
  keyPattern?: string;
  linkedInsightId?: string;
}

interface WizardSequenceContext {
  // Previous work
  previousSessions: WizardHistoryEntry[];
  sessionCount: number;
  firstSessionDate: string | null;
  lastSessionDate: string | null;

  // Narrative connections
  buildingOn: string | null; // "Building on your March 15th discovery about..."
  patternEvolution: string[]; // Timeline of how pattern evolved
  suggestedFocus: string | null; // "Consider exploring the role this plays in relationships"

  // Cross-wizard connections
  relatedInsights: Array<{
    insightId: string;
    wizardType: string;
    pattern: string;
    relevance: 'same-pattern' | 'complementary' | 'prerequisite';
  }>;
}

/**
 * Get comprehensive context for a wizard launch
 */
export function getWizardSequenceContext(
  wizardType: string,
  allSessions: any[], // Type varies by wizard
  allInsights: IntegratedInsight[],
  linkedInsightId?: string
): WizardSequenceContext {
  // Find all previous sessions of this wizard type
  const previousSessions = extractSessionHistory(wizardType, allSessions);

  // If launching from an insight, find related work
  const currentInsight = linkedInsightId
    ? allInsights.find(i => i.id === linkedInsightId)
    : null;

  // Find insights with similar patterns
  const relatedInsights = findRelatedInsights(
    wizardType,
    currentInsight,
    allInsights
  );

  // Build narrative
  const buildingOn = generateBuildingOnNarrative(
    previousSessions,
    currentInsight
  );

  const suggestedFocus = generateSuggestedFocus(
    previousSessions,
    relatedInsights,
    wizardType
  );

  const patternEvolution = trackPatternEvolution(
    previousSessions,
    allInsights
  );

  return {
    previousSessions: previousSessions.slice(0, 5), // Last 5
    sessionCount: previousSessions.length,
    firstSessionDate: previousSessions[0]?.date || null,
    lastSessionDate: previousSessions[previousSessions.length - 1]?.date || null,
    buildingOn,
    patternEvolution,
    suggestedFocus,
    relatedInsights,
  };
}

/**
 * Generate "Building on..." narrative
 */
function generateBuildingOnNarrative(
  previousSessions: WizardHistoryEntry[],
  currentInsight: IntegratedInsight | null
): string | null {
  if (previousSessions.length === 0) return null;

  const lastSession = previousSessions[previousSessions.length - 1];
  const date = new Date(lastSession.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });

  if (currentInsight) {
    return `Building on your ${date} discovery: "${currentInsight.detectedPattern}"`;
  }

  if (lastSession.keyPattern) {
    return `Building on your ${date} session about ${lastSession.keyPattern}`;
  }

  return `Continuing from your ${date} session`;
}

/**
 * Suggest focus areas based on history
 */
function generateSuggestedFocus(
  previousSessions: WizardHistoryEntry[],
  relatedInsights: any[],
  wizardType: string
): string | null {
  // If this is the first session
  if (previousSessions.length === 0) {
    return getFirstTimeGuidance(wizardType);
  }

  // If there are complementary insights from other wizards
  const complementary = relatedInsights.filter(
    i => i.relevance === 'complementary'
  );

  if (complementary.length > 0) {
    return `Consider how this connects to your ${complementary[0].wizardType} work on "${complementary[0].pattern}"`;
  }

  // If same pattern has emerged multiple times
  const recurringPatterns = findRecurringPatterns(previousSessions);
  if (recurringPatterns.length > 0) {
    return `This pattern "${recurringPatterns[0]}" has emerged ${recurringPatterns.length + 1} times. What deeper structure might be at play?`;
  }

  return null;
}

/**
 * Track how pattern has evolved over time
 */
function trackPatternEvolution(
  previousSessions: WizardHistoryEntry[],
  allInsights: IntegratedInsight[]
): string[] {
  const evolution: string[] = [];

  for (const session of previousSessions) {
    if (session.linkedInsightId) {
      const insight = allInsights.find(i => i.id === session.linkedInsightId);
      if (insight) {
        const date = new Date(session.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });
        evolution.push(`${date}: ${insight.detectedPattern}`);
      }
    }
  }

  return evolution;
}

/**
 * Find insights related to current wizard launch
 */
function findRelatedInsights(
  wizardType: string,
  currentInsight: IntegratedInsight | null,
  allInsights: IntegratedInsight[]
): Array<{
  insightId: string;
  wizardType: string;
  pattern: string;
  relevance: 'same-pattern' | 'complementary' | 'prerequisite';
}> {
  const related: any[] = [];

  if (!currentInsight) return related;

  // Find insights from same wizard type (recurring patterns)
  const sameType = allInsights.filter(i =>
    i.mindToolType === wizardType &&
    i.id !== currentInsight.id
  );

  for (const insight of sameType) {
    related.push({
      insightId: insight.id,
      wizardType: insight.mindToolType,
      pattern: insight.detectedPattern,
      relevance: 'same-pattern',
    });
  }

  // Find complementary insights (shadow work pairs with action, etc.)
  // This could use semantic similarity in future
  const complementary = allInsights.filter(i =>
    i.mindToolType !== wizardType &&
    i.suggestedShadowWork.some(sw =>
      currentInsight.suggestedShadowWork.some(csw =>
        csw.practiceId === sw.practiceId
      )
    )
  );

  for (const insight of complementary) {
    related.push({
      insightId: insight.id,
      wizardType: insight.mindToolType,
      pattern: insight.detectedPattern,
      relevance: 'complementary',
    });
  }

  return related;
}

/**
 * Extract session history for a wizard type
 */
function extractSessionHistory(
  wizardType: string,
  allSessions: any[]
): WizardHistoryEntry[] {
  // Map wizard type to session data extraction
  // This varies by wizard structure
  return allSessions.map(session => ({
    sessionId: session.id,
    date: session.date,
    summary: session.aiSummary || session.summary || '',
    keyPattern: session.detectedPattern || session.keyInsight || null,
    linkedInsightId: session.linkedInsightId,
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * First-time guidance for each wizard type
 */
function getFirstTimeGuidance(wizardType: string): string | null {
  const guidance: Record<string, string> = {
    '3-2-1 Reflection': 'Start with a strong emotional charge or projection onto someone',
    'IFS Session': 'Choose a part that feels active or troubling right now',
    'Bias Detective': 'Pick a recent decision where you felt conflicted',
    'Subject-Object Explorer': 'Notice what you can observe vs. what you are',
    'Perspective-Shifter': 'Choose a viewpoint you typically avoid or resist',
    'Polarity Mapper': 'Identify an either/or dilemma you\'re facing',
  };

  return guidance[wizardType] || null;
}

/**
 * Find patterns that have recurred across sessions
 */
function findRecurringPatterns(sessions: WizardHistoryEntry[]): string[] {
  const patternCounts = new Map<string, number>();

  for (const session of sessions) {
    if (session.keyPattern) {
      const count = patternCounts.get(session.keyPattern) || 0;
      patternCounts.set(session.keyPattern, count + 1);
    }
  }

  return Array.from(patternCounts.entries())
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([pattern]) => pattern);
}
```

---

#### **2. UI Integration: Wizard Context Display**

**Location:** Each wizard component (start with `ThreeTwoOneWizard.tsx`)

**Add Context Section:**

```typescript
// At wizard start screen
{sequenceContext && (
  <div className="mb-6 bg-purple-900/20 border border-purple-700/50 rounded-lg p-5">
    <h3 className="text-sm font-semibold text-purple-300 mb-3 uppercase tracking-wider flex items-center gap-2">
      <span className="text-purple-500">⬢</span>
      Your Journey with this Practice
    </h3>

    {/* Session count */}
    {sequenceContext.sessionCount > 0 && (
      <p className="text-sm text-slate-300 mb-3">
        This is your <strong>{sequenceContext.sessionCount + 1}th</strong> time with this wizard.
        First session: {new Date(sequenceContext.firstSessionDate!).toLocaleDateString()}
      </p>
    )}

    {/* Building on narrative */}
    {sequenceContext.buildingOn && (
      <div className="bg-slate-800/60 border-l-2 border-purple-500 p-3 mb-3">
        <p className="text-sm text-purple-200">
          <strong>Building on:</strong> {sequenceContext.buildingOn}
        </p>
      </div>
    )}

    {/* Suggested focus */}
    {sequenceContext.suggestedFocus && (
      <div className="bg-slate-800/60 border-l-2 border-blue-500 p-3 mb-3">
        <p className="text-sm text-blue-200">
          <strong>Suggested focus:</strong> {sequenceContext.suggestedFocus}
        </p>
      </div>
    )}

    {/* Pattern evolution */}
    {sequenceContext.patternEvolution.length > 0 && (
      <details className="mt-3">
        <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-300">
          View pattern evolution ({sequenceContext.patternEvolution.length} sessions)
        </summary>
        <div className="mt-2 space-y-1 pl-4 border-l border-slate-700">
          {sequenceContext.patternEvolution.map((entry, idx) => (
            <p key={idx} className="text-xs text-slate-400">{entry}</p>
          ))}
        </div>
      </details>
    )}

    {/* Related insights from other wizards */}
    {sequenceContext.relatedInsights.length > 0 && (
      <div className="mt-3 pt-3 border-t border-purple-900/50">
        <p className="text-xs text-slate-400 mb-2">
          Related work from other wizards:
        </p>
        <div className="space-y-1">
          {sequenceContext.relatedInsights.slice(0, 2).map(insight => (
            <div key={insight.insightId} className="text-xs text-slate-500">
              <span className="text-purple-400">{insight.wizardType}:</span> {insight.pattern}
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
)}
```

---

#### **3. Enhanced Insight Generation**

**Location:** `services/insightGenerator.ts` (line 66-98)

**Update Prompt:**

```typescript
export async function generateInsightFromSession(
  input: InsightGenerationInput,
  sequenceContext?: WizardSequenceContext // NEW PARAMETER
): Promise<IntegratedInsight> {

  // Build historical context section
  let contextSection = '';

  if (sequenceContext && sequenceContext.sessionCount > 0) {
    contextSection = `

HISTORICAL CONTEXT:
- This is session #${sequenceContext.sessionCount + 1} with this wizard
- Previous sessions: ${sequenceContext.previousSessions.map(s => s.date).join(', ')}
${sequenceContext.buildingOn ? `- Building on: ${sequenceContext.buildingOn}` : ''}
${sequenceContext.patternEvolution.length > 0 ? `
- Pattern evolution:
${sequenceContext.patternEvolution.map(p => `  * ${p}`).join('\n')}
` : ''}

Please note how this session builds on or diverges from previous work.`;
  }

  const prompt = `You are an expert at analyzing personal development sessions and suggesting transformative practices.

Wizard Session: ${wizardType}
Session Name: ${sessionName}
${contextSection}

Session Report:
${sessionReport}

Available Practices:
${practiceList}

Please analyze this session and provide:

1. DETECTED PATTERN (1-2 sentences): What core pattern or insight emerged from this session?
   ${sequenceContext ? 'Note how this relates to previous sessions if relevant.' : ''}

2. SHADOW WORK RECOMMENDATIONS (reflection/inquiry practices to understand the pattern deeper):
   - List 2-3 shadow work practices that would help explore this pattern
   - For each: [Practice Name] | Rationale: [why it helps]

3. NEXT STEPS (action practices to work with this pattern):
   - List 2-3 action practices that would help move forward
   - For each: [Practice Name] | Rationale: [why it helps]

Format your response EXACTLY as:
PATTERN: [detected pattern]
---
SHADOW WORK:
- [Practice Name] | Rationale: [rationale]
- [Practice Name] | Rationale: [rationale]
---
NEXT STEPS:
- [Practice Name] | Rationale: [rationale]
- [Practice Name] | Rationale: [rationale]`;

  // ... rest of function
}
```

---

## 🔧 Additional Improvements Identified

### 1. **Routing Architecture Issues**

**Current State:**
- Flat tab structure (`activeTab` string)
- No breadcrumbs or navigation history
- Modal-based wizards lose context on close

**Problems:**
- Hard to return to where you came from
- No "back" functionality
- Wizards feel disconnected from tabs

**Proposed Fix:** Navigation Stack

```typescript
// New state in App.tsx
const [navigationStack, setNavigationStack] = useState<Array<{
  tab: ActiveTab;
  wizardId?: string;
  insightId?: string;
  timestamp: string;
}>>([]);

// Enhanced navigation
const navigateTo = (tab: ActiveTab, context?: { wizardId?: string; insightId?: string }) => {
  setNavigationStack(prev => [...prev, {
    tab: activeTab,
    wizardId: activeWizard,
    insightId: linkedInsightId,
    timestamp: new Date().toISOString()
  }]);
  setActiveTab(tab);
  if (context?.wizardId) setActiveWizard(context.wizardId);
  if (context?.insightId) setLinkedInsightId(context.insightId);
};

const navigateBack = () => {
  if (navigationStack.length === 0) return;
  const previous = navigationStack[navigationStack.length - 1];
  setNavigationStack(prev => prev.slice(0, -1));
  setActiveTab(previous.tab);
  setActiveWizard(previous.wizardId || null);
  setLinkedInsightId(previous.insightId);
};
```

**Benefits:**
- User can go "back" to previous context
- Wizard → Insight → Practice flows are preserved
- Better UX for complex journeys

**Effort:** 15-20 minutes

---

### 2. **Insight Routing Improvements**

**Current Issues:**
- Insights live in JournalTab only
- "Start Wizard" buttons just open wizard (no context shown)
- No visual indication of addressed vs pending

**Proposed Fixes:**

**A. Insight Quick Actions Everywhere**

```typescript
// New component: InsightQuickAction.tsx
export function InsightQuickAction({ insight }: { insight: IntegratedInsight }) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setActiveWizardAndLink(getWizardForInsight(insight.mindToolType), insight.id)}
        className="text-xs bg-purple-600 hover:bg-purple-500 px-3 py-1 rounded"
      >
        Deepen with {insight.mindToolType}
      </button>
      <span className={`text-xs px-2 py-1 rounded ${
        insight.status === 'addressed'
          ? 'bg-green-900/30 text-green-300'
          : 'bg-amber-900/30 text-amber-300'
      }`}>
        {insight.status}
      </span>
    </div>
  );
}
```

**Use in:**
- RecommendationsTab (show related insights for practices)
- BrowseTab (show insights that recommend each practice)
- Dashboard (quick access to pending insights)

**B. Insight Context in Practice Cards**

```typescript
// In BrowseTab practice cards
{getInsightsForPractice(practice.id, integratedInsights).map(insight => (
  <div key={insight.id} className="text-xs text-slate-400 mt-2 border-l-2 border-purple-500 pl-2">
    <strong>{insight.mindToolType}:</strong> {insight.detectedPattern}
  </div>
))}
```

**Effort:** 10-15 minutes

---

### 3. **Insight Quality Improvements**

**Current Issues:**
- Generic AI prompts don't consider user context deeply
- No follow-up depth questions
- Practices recommended may not fit user's actual stack/preferences

**Proposed Fixes:**

**A. User Profile Context**

```typescript
// Build user profile from data
interface UserProfile {
  preferredModalities: ('mind' | 'body' | 'shadow' | 'spirit')[];
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  recurringPatterns: string[];
  practicedFrequently: string[]; // Practice IDs
  avoided: string[]; // Practices suggested but never added
}

// Use in insight generation
function buildUserProfile(
  completionHistory: CompletionHistoryEntry[],
  practiceStack: Practice[],
  integralInsights: IntegratedInsight[]
): UserProfile {
  // Analyze completion history to find preferred modalities
  // Analyze which suggested practices were added vs ignored
  // Identify recurring patterns across insights
}
```

**B. Adaptive Prompting**

```typescript
// In insightGenerator.ts
const userContext = buildUserProfile(...);

const prompt = `
User Profile:
- Experience: ${userContext.experienceLevel}
- Prefers: ${userContext.preferredModalities.join(', ')}
- Recurring themes: ${userContext.recurringPatterns.join(', ')}
- Actively practices: ${userContext.practicedFrequently.map(id => getPracticeName(id)).join(', ')}

Given this user's background, tailor your recommendations to:
1. Match their experience level
2. Build on practices they already do
3. Address their recurring patterns
4. Suggest practices they're likely to actually use
...
`;
```

**Effort:** 20-25 minutes

---

## 📊 Implementation Roadmap

### **Phase 1: Core Feature (20-30 minutes)**

**Priority: HIGH**

1. ✅ Create `services/wizardSequenceContext.ts` (15 min)
2. ✅ Add `getWizardSequenceContext()` to App.tsx wizard launches (5 min)
3. ✅ Add context display UI to `ThreeTwoOneWizard.tsx` (10 min)
4. ✅ Test with existing 3-2-1 sessions

**Result:** Users see their developmental journey when launching wizards

---

### **Phase 2: Enhanced Insights (20-25 minutes)**

**Priority: MEDIUM-HIGH**

1. ✅ Update `generateInsightFromSession()` to accept sequence context (10 min)
2. ✅ Build user profile from completion history (10 min)
3. ✅ Add adaptive prompting to insight generation (5 min)

**Result:** Insights are contextual and personalized

---

### **Phase 3: Routing Improvements (15-20 minutes)**

**Priority: MEDIUM**

1. ✅ Add navigation stack state to App.tsx (5 min)
2. ✅ Implement `navigateTo()` and `navigateBack()` (5 min)
3. ✅ Add back button to header (3 min)
4. ✅ Update wizard/insight links to use new navigation (7 min)

**Result:** Users can navigate back through their journey

---

### **Phase 4: Insight Routing (10-15 minutes)**

**Priority: LOW-MEDIUM**

1. ✅ Create `InsightQuickAction.tsx` component (5 min)
2. ✅ Add to RecommendationsTab (3 min)
3. ✅ Add insight context to BrowseTab practice cards (5 min)
4. ✅ Show related insights on Dashboard (2 min)

**Result:** Insights are accessible from anywhere

---

### **Phase 5: Roll Out to All Wizards (30-40 minutes)**

**Priority: LOW (after Phase 1 proves valuable)**

1. ✅ Add context to IFSWizard (5 min)
2. ✅ Add context to BiasDetective (5 min)
3. ✅ Add context to Subject-Object Explorer (5 min)
4. ✅ Add context to Perspective Shifter (5 min)
5. ✅ Add context to Polarity Mapper (5 min)
6. ✅ Add context to remaining 9 wizards (15 min)

**Result:** All wizards show journey context

---

## 🎯 Success Metrics

**User Experience:**
- Users should feel "the app remembers my journey"
- Wizards feel connected, not isolated
- Pattern evolution is visible and trackable

**Technical:**
- `sequenceContext` passed to all wizard launches
- Historical sessions displayed in wizard UI
- Insight generation includes context
- Navigation stack enables "back" functionality

**Data Quality:**
- Insights reference previous work
- Recommendations build on user's actual practices
- Patterns show evolution over time

---

## 💡 Future Enhancements (Post-Implementation)

1. **Pattern Graph Visualization** - Show how patterns connect across wizards
2. **Smart Wizard Routing** - "You've done Bias Detective 3 times, maybe try Perspective Shifter?"
3. **Insight Clustering** - Group similar insights into themes
4. **Progress Metrics** - "Your shadow work practice increased 40% after this insight"
5. **Semantic Pattern Matching** - Use embeddings to find truly similar patterns, not just keyword matches

---

## 🚀 Ready to Implement

This plan is comprehensive, incremental, and high-value. Start with **Phase 1** to prove the concept, then expand based on user feedback.

**Key Files to Modify:**
- ✅ `services/wizardSequenceContext.ts` (new)
- ✅ `App.tsx` (add context to wizard launches)
- ✅ `components/ThreeTwoOneWizard.tsx` (add UI)
- ✅ `services/insightGenerator.ts` (enhance prompts)
- ⏸ `components/RecommendationsTab.tsx` (insight routing)
- ⏸ `components/BrowseTab.tsx` (show insight context)

**Estimated Total Time:** 60-90 minutes for full implementation
**Core Feature Time:** 20-30 minutes

---

**Next Step:** Shall I proceed with Phase 1 implementation?
