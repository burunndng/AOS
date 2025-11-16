# AOS Wizard Integration Audit Report
**Wizard Integrations with IntegratedInsights & AI Intelligence Hub**

**Report Date:** November 16, 2025
**Audited Repository:** https://github.com/burunndng/AOS
**Scope:** All 19 wizard components and their integration points
**Audit Type:** Code analysis, data flow mapping, integration assessment

---

## EXECUTIVE SUMMARY

### Key Findings

| Category | Count | Status |
|----------|-------|--------|
| **Total Wizards** | 19 | - |
| **Fully Integrated with IntegratedInsights** | 13 | ✅ Excellent |
| **Partially Integrated (Custom Implementation)** | 1 | ⚠️ Functional |
| **Minimal Integration (History Only)** | 3 | ⚠️ Limited |
| **Missing Integration** | 2 | ❌ Gap |
| **Missing Save Handlers** | 3 | ❌ Critical |
| **Intelligence Hub Integration** | 0 | ❌ **Critical Gap** |

### Critical Issues

1. **🔴 CRITICAL: Zero Intelligence Hub Wizard Integration**
   - Intelligence Hub is implemented and functional but completely isolated from wizards
   - Service only called from RecommendationsTab manual button
   - **Impact:** Wizards cannot provide context-aware guidance or cross-wizard recommendations
   - **Recommendation:** Integrate Intelligence Hub calls into wizard save handlers

2. **🔴 CRITICAL: Three Wizards Missing Save Handlers**
   - Meditation Wizard
   - Role Alignment Wizard
   - Insight Practice Map Wizard
   - **Impact:** Sessions not persisted; no insight generation; lost user work
   - **Recommendation:** Implement save handlers immediately

3. **🟡 MEDIUM: Four Wizards Don't Generate IntegratedInsights**
   - Jhana Guide (saves but no insights)
   - Somatic Generator (no insights)
   - Integral Body Architect (no insights)
   - Dynamic Workout Architect (no insights)
   - **Impact:** These sessions isolated from intelligence system
   - **Recommendation:** Add insight generation for better cross-wizard analysis

4. **🟡 MEDIUM: Memory Reconsolidation Dual Implementation**
   - Two separate save handlers exist (lines 1024 and 1214)
   - First handler (line 1024) just saves to history
   - Second handler (line 1214) generates insights
   - **Impact:** Confusion about which is active; potential data loss
   - **Recommendation:** Consolidate to single, insight-generating handler

5. **🟡 MEDIUM: Attachment Assessment Wrong Draft State**
   - Line 669: `setDraftRelational(null)` should be `setDraftAttachment(null)`
   - **Impact:** Relational Pattern draft gets cleared when saving Attachment Assessment
   - **Recommendation:** Fix draft state management immediately

---

## DETAILED WIZARD INTEGRATION MAPPING

### SECTION 1: FULLY INTEGRATED WIZARDS (13 Total)

These wizards follow the **Rich Report Generation Pattern** and call `generateInsightFromSession` to create `IntegratedInsight` objects.

#### 1.1 **Bias Detective Wizard** ✅ FULLY INTEGRATED

**File:** `/home/user/AOS/components/BiasDetectiveWizard.tsx`
**Save Handler:** `handleSaveBiasSession` (App.tsx:528-549)

**Integration Points:**
- **IntegratedInsights:** ✅ YES
  - Line 535: Calls `generateInsightFromSession`
  - Generates `IntegratedInsight` with mindToolType: 'Bias Detective'
  - Creates shadow work and next steps recommendations

- **Intelligence Hub:** ❌ NO
  - Not called from save handler
  - Only accessible via RecommendationsTab manual refresh

- **Data Flow:**
  ```
  BiasDetectiveWizard (decision, diagnosis, takeaway)
    ↓
  handleSaveBiasSession()
    ↓
  Rich Report: "# Bias Detective: {decision}"
    ↓
  generateInsightFromSession(wizardType: 'Bias Detective')
    ↓
  IntegratedInsight (pattern, shadow work, next steps)
    ↓
  integratedInsights state + localStorage
  ```

- **Report Fields:**
  - `sessionReport`: Decision, diagnosis, takeaway
  - `sessionSummary`: "Identified bias in decision"
  - `userProfile`: Incorporated for adaptive recommendations

- **Data Retention:** ✅ Full session saved to `historyBias`

---

#### 1.2 **Bias Finder Wizard** ✅ FULLY INTEGRATED

**File:** `/home/user/AOS/components/BiasFinderWizard.tsx`
**Save Handler:** `handleSaveBiasFinderSession` (App.tsx:551-573)

**Integration Points:**
- **IntegratedInsights:** ✅ YES
  - Line 559: Calls `generateInsightFromSession`
  - Generates `IntegratedInsight` with mindToolType: 'Bias Finder'

- **Intelligence Hub:** ❌ NO
  - Not called from save handler

- **Data Flow:**
  ```
  BiasFinderWizard (targetDecision, hypotheses, diagnosticReport)
    ↓
  handleSaveBiasFinderSession()
    ↓
  Rich Report: "# Bias Finder: {decision}" + biases list + recommendations
    ↓
  generateInsightFromSession(wizardType: 'Bias Finder')
    ↓
  IntegratedInsight
    ↓
  integratedInsights state
  ```

- **Report Fields:**
  - Biases identified with confidence scores
  - Diagnostic report recommendations
  - Summary: Count of biases found

- **Data Retention:** ✅ Full session saved to `historyBiasFinder`

---

#### 1.3 **Subject-Object Explorer Wizard** ✅ FULLY INTEGRATED

**File:** `/home/user/AOS/components/SubjectObjectWizard.tsx`
**Save Handler:** `handleSaveSOSession` (App.tsx:575-596)

**Integration Points:**
- **IntegratedInsights:** ✅ YES
  - Line 582: Calls `generateInsightFromSession`
  - Generates `IntegratedInsight` with mindToolType: 'Subject-Object Explorer'

- **Intelligence Hub:** ❌ NO

- **Data Flow:**
  ```
  SubjectObjectWizard (pattern, subjectToStatement, integrationShift)
    ↓
  handleSaveSOSession()
    ↓
  Rich Report: "# S-O Explorer: {pattern}"
    ↓
  generateInsightFromSession(wizardType: 'Subject-Object Explorer')
    ↓
  IntegratedInsight
    ↓
  integratedInsights state
  ```

- **Kegan Framework:** Uses Kegan's subject-object theory for perspective-taking development

- **Data Retention:** ✅ Full session saved to `historySO`

---

#### 1.4 **Perspective Shifter Wizard** ✅ FULLY INTEGRATED

**File:** `/home/user/AOS/components/PerspectiveShifterWizard.tsx`
**Save Handler:** `handleSavePSSession` (App.tsx:598-619)

**Integration Points:**
- **IntegratedInsights:** ✅ YES
  - Line 605: Calls `generateInsightFromSession`
  - Generates `IntegratedInsight` with mindToolType: 'Perspective-Shifter'

- **Intelligence Hub:** ❌ NO

- **Data Flow:**
  ```
  PerspectiveShifterWizard (stuckSituation, synthesis, realityCheckRefinement)
    ↓
  handleSavePSSession()
    ↓
  Rich Report: "# P-S Shifter: {situation}" + synthesis + action plan
    ↓
  generateInsightFromSession(wizardType: 'Perspective-Shifter')
    ↓
  IntegratedInsight
    ↓
  integratedInsights state
  ```

- **Purpose:** Role-taking exercises to build empathy and reframe situations

- **Data Retention:** ✅ Full session saved to `historyPS`

---

#### 1.5 **Polarity Mapper Wizard** ✅ FULLY INTEGRATED

**File:** `/home/user/AOS/components/PolarityMapperWizard.tsx`
**Save Handler:** `handleSavePMSession` (App.tsx:621-642)

**Integration Points:**
- **IntegratedInsights:** ✅ YES
  - Line 628: Calls `generateInsightFromSession`
  - Generates `IntegratedInsight` with mindToolType: 'Polarity Mapper'

- **Intelligence Hub:** ❌ NO

- **Data Flow:**
  ```
  PolarityMapperWizard (dilemma, poleA_name, poleB_name)
    ↓
  handleSavePMSession()
    ↓
  Rich Report: "# Polarity Map: {dilemma}" + pole definitions
    ↓
  generateInsightFromSession(wizardType: 'Polarity Mapper')
    ↓
  IntegratedInsight
    ↓
  integratedInsights state
  ```

- **Framework:** Dynamic polarity exploration for "either/or" thinking

- **Data Retention:** ✅ Full session saved to `historyPM`

---

#### 1.6 **Kegan Assessment Wizard** ✅ FULLY INTEGRATED

**File:** `/home/user/AOS/components/KeganAssessmentWizard.tsx`
**Save Handler:** `handleSaveKeganSession` (App.tsx:644-665)

**Integration Points:**
- **IntegratedInsights:** ✅ YES
  - Line 651: Calls `generateInsightFromSession`
  - Generates `IntegratedInsight` with mindToolType: 'Kegan Assessment'

- **Intelligence Hub:** ❌ NO

- **Data Flow:**
  ```
  KeganAssessmentWizard (responses, overallInterpretation)
    ↓
  handleSaveKeganSession()
    ↓
  Rich Report: "# Kegan Assessment" + stage + insights from responses
    ↓
  generateInsightFromSession(wizardType: 'Kegan Assessment')
    ↓
  IntegratedInsight
    ↓
  integratedInsights state + userProfile (developmental stage)
  ```

- **Development Stages:** Assesses Kegan's developmental orders (2, 2/3, 3, 3/4, 4)

- **Data Retention:** ✅ Full session saved to `historyKegan`

- **Special Notes:** Used to populate `userProfile.developmentalStage` for adaptive personalization

---

#### 1.7 **Attachment Assessment Wizard** ⚠️ MOSTLY INTEGRATED (Bug Found)

**File:** `MindToolsTab.tsx` (no separate component file)
**Save Handler:** `handleSaveAttachmentAssessment` (App.tsx:667-690)

**Integration Points:**
- **IntegratedInsights:** ✅ YES
  - Line 676: Calls `generateInsightFromSession`
  - Generates `IntegratedInsight` with mindToolType: 'Attachment Assessment'

- **Intelligence Hub:** ❌ NO

- **⚠️ BUG ALERT - Line 669:**
  ```typescript
  setDraftRelational(null);  // ❌ WRONG - should be setDraftAttachment(null)
  ```
  - Clears RelationalPattern draft instead of Attachment draft
  - Will cause RelationalPattern wizard to lose unsaved work
  - **Fix Required:** Change to `setDraftAttachment(null)`

- **Data Flow:**
  ```
  AttachmentAssessmentWizard (style, scores, notes)
    ↓
  handleSaveAttachmentAssessment()
    ↓
  Rich Report: "# Attachment Assessment" + style + scores + notes
    ↓
  generateInsightFromSession(wizardType: 'Attachment Assessment')
    ↓
  IntegratedInsight
    ↓
  integratedInsights state + userProfile (attachmentStyle)
  ```

- **Data Retention:** ✅ Full session saved to `historyAttachment`

- **Special Notes:** Used to populate `userProfile.attachmentStyle` for relational pattern analysis

---

#### 1.8 **Relational Pattern Wizard** ✅ FULLY INTEGRATED

**File:** `CoachTab.tsx` (integrated into Coach chatbot)
**Save Handler:** `handleSaveRelationalSession` (App.tsx:692-713)

**Integration Points:**
- **IntegratedInsights:** ✅ YES
  - Line 699: Calls `generateInsightFromSession`
  - Generates `IntegratedInsight` with mindToolType: 'Relational Pattern'

- **Intelligence Hub:** ❌ NO

- **Data Flow:**
  ```
  RelationalPatternWizard (conversation dialogue)
    ↓
  handleSaveRelationalSession()
    ↓
  Rich Report: "# Relational Pattern" + last 3 dialogue messages
    ↓
  generateInsightFromSession(wizardType: 'Relational Pattern')
    ↓
  IntegratedInsight
    ↓
  integratedInsights state
  ```

- **Purpose:** Coach-guided exploration of relational dynamics and patterns

- **Data Retention:** ✅ Full session saved to `historyRelational`

---

#### 1.9 **3-2-1 Reflection Wizard** ✅ FULLY INTEGRATED

**File:** `/home/user/AOS/components/ThreeTwoOneWizard.tsx`
**Save Handler:** `handleSave321Session` (App.tsx:720-769)

**Integration Points:**
- **IntegratedInsights:** ✅ YES
  - Line 755: Calls `generateInsightFromSession`
  - Generates `IntegratedInsight` with mindToolType: '3-2-1 Reflection'

- **Intelligence Hub:** ❌ NO

- **Data Flow:**
  ```
  ThreeTwoOneWizard (trigger, faceItAnalysis, dialogueTranscript, embodimentAnalysis, integrationPlan)
    ↓
  handleSave321Session()
    ↓
  Rich Report: "# 3-2-1 Reflection: {trigger}" + all 4 phases
  - Face It (3rd person)
  - Talk To It (2nd person dialogue)
  - Be It (1st person embodiment)
  - Integration Plan
    ↓
  generateInsightFromSession(wizardType: '3-2-1 Reflection')
    ↓
  IntegratedInsight
    ↓
  integratedInsights state
  ```

- **Advanced Features:**
  - Real-time Socratic dialogue (AI-guided conversation)
  - Somatic check-ins (body-based awareness)
  - Comprehensive markdown report generation

- **Data Retention:** ✅ Full session saved to `history321`

- **AI Integration:** Uses `gemini-2.5-flash` for real-time dialogue facilitation

---

#### 1.10 **IFS (Internal Family Systems) Wizard** ✅ FULLY INTEGRATED

**File:** `/home/user/AOS/components/IFSWizard.tsx`
**Save Handler:** `handleSaveIFSSession` (App.tsx:771-844)

**Integration Points:**
- **IntegratedInsights:** ✅ YES
  - Line 830: Calls `generateInsightFromSession`
  - Generates `IntegratedInsight` with mindToolType: 'IFS Session'

- **Intelligence Hub:** ❌ NO

- **Data Flow:**
  ```
  IFSWizard (partName, partRole, partFears, partPositiveIntent, transcript phases)
    ↓
  handleSaveIFSSession()
    ↓
  Update parts library (setPartsLibrary)
    ↓
  Rich Report: "# IFS Session: {part}"
  - Part Profile (role, fears, positive intent)
  - Session Progression (IDENTIFY → UNBURDEN phases)
  - AI Indications for follow-up
  - Integration Note
    ↓
  generateInsightFromSession(wizardType: 'IFS Session')
    ↓
  IntegratedInsight
    ↓
  integratedInsights state + partsLibrary
  ```

- **Advanced Features:**
  - Phase-aware AI analysis (automatic "AI Part Info" when reaching DEEPEN/UNBURDEN)
  - Parts library management (tracks identified internal parts)
  - Comprehensive transcript with role attribution
  - AI indications for follow-up work

- **Data Retention:**
  - ✅ Full session saved to `historyIFS`
  - ✅ Parts saved/updated in `partsLibrary`

- **AI Integration:** Uses `gemini-2.5-flash` for real-time phase-aware facilitation

---

#### 1.11 **Eight Zones Wizard** ✅ FULLY INTEGRATED

**File:** `/home/user/AOS/components/EightZonesWizard.tsx`
**Save Handler:** `handleSaveEightZonesSession` (App.tsx:1030-1088)

**Integration Points:**
- **IntegratedInsights:** ✅ YES (Conditional: Only if `synthesisReport` exists)
  - Line 1072: Calls `generateInsightFromSession`
  - Generates `IntegratedInsight` with mindToolType: 'Eight Zones'

- **Intelligence Hub:** ❌ NO

- **Data Flow:**
  ```
  EightZonesWizard (focalQuestion, zoneAnalyses, connectionReflections, synthesisReport, blindSpots, novelInsights, recommendations)
    ↓
  handleSaveEightZonesSession()
    ↓
  Rich Report: "# Eight Zones Analysis: {focalQuestion}"
  - Zone-by-Zone Analysis (all 8 zones)
  - Connection Reflections (relationships between zones)
  - Integral Synthesis
  - Key Insights (blind spots, novelties, recommendations)
    ↓
  IF synthesisReport exists:
    generateInsightFromSession(wizardType: 'Eight Zones')
      ↓
    IntegratedInsight
      ↓
    integratedInsights state
  ```

- **Framework:** Wilber's AQAL (All Quadrants, All Levels) integral analysis
  - 8 zones covering individual/collective × interior/exterior

- **Data Retention:** ✅ Full session saved to `eightZonesHistory`

- **Conditional Insight Generation:** Only generates insight if synthesis is complete

---

#### 1.12 **Adaptive Cycle Wizard** ✅ FULLY INTEGRATED

**File:** `/home/user/AOS/components/AdaptiveCycleWizard.tsx`
**Save Handler:** `handleSaveAdaptiveCycleSession` (App.tsx:1090-1191)

**Integration Points:**
- **IntegratedInsights:** ✅ YES
  - Line 1174: Calls `generateInsightFromSession`
  - Generates `IntegratedInsight` with mindToolType: 'Adaptive Cycle Lens'

- **Intelligence Hub:** ❌ NO

- **Data Flow:**
  ```
  AdaptiveCycleWizard (systemToAnalyze, cycleMap {r, K, Ω, α}, userHint {potential, connectedness, resilience})
    ↓
  handleSaveAdaptiveCycleSession()
    ↓
  Derive dominant quadrant from userHint scores
    ↓
  Rich Report: "# Adaptive Cycle Map: {system}"
  - Growth / Exploitation (r)
  - Conservation (K)
  - Release / Collapse (Ω)
  - Reorganization (α)
  - Self-Assessment Signals (if userHint provided)
    ↓
  Build session summary emphasizing dominant phase
    ↓
  generateInsightFromSession(wizardType: 'Adaptive Cycle Lens')
    ↓
  IntegratedInsight with dominant phase context
    ↓
  integratedInsights state
  ```

- **Framework:** Panarchy/Adaptive Cycle theory (r→K→Ω→α)
  - Identifies system resilience dynamics
  - Maps where system has most energy/attention

- **Data Retention:** ✅ Full session saved to `adaptiveCycleHistory` with embedded fullReport

- **Advanced Features:**
  - Intelligent quadrant scoring from user assessment
  - Context-aware session summary with dominant phase emphasis
  - Logging for debugging data flow

---

#### 1.13 **Memory Reconsolidation Wizard** ⚠️ DUAL IMPLEMENTATION (Bug Found)

**File:** `/home/user/AOS/components/MemoryReconsolidationWizard.tsx`
**Save Handlers:**
- `handleSaveMemoryReconsolidationSession` (App.tsx:1024-1028) - ❌ **INACTIVE**
- `handleSaveMemoryReconSession` (App.tsx:1214-1244) - ✅ **ACTIVE**

**Integration Points:**

**First Handler (Line 1024) - INACTIVE:**
```typescript
const handleSaveMemoryReconsolidationSession = (session: MemoryReconsolidationSession) => {
  setMemoryReconHistory(prev => [...prev.filter(s => s.id !== session.id), session]);
  setDraftMemoryRecon(null);
  navigateBack();
  // ❌ NO INSIGHT GENERATION - data isolated from intelligence system
};
```

**Second Handler (Line 1214) - ACTIVE:**
```typescript
const handleSaveMemoryReconSession = async (session: MemoryReconsolidationSession) => {
  // ... session saved ...
  // ✅ GENERATES INSIGHT
  const insight = await generateInsightFromSession({
    wizardType: 'Memory Reconsolidation',
    sessionId: session.id,
    sessionName: 'Memory Reconsolidation Session',
    sessionReport: report,
    sessionSummary: summary,
    userId,
    availablePractices: Object.values(corePractices).flat(),
    userProfile
  });
  setIntegratedInsights(prev => [...prev, insight]);
};
```

- **IntegratedInsights:** ✅ YES (via second handler only)
  - Line 1228: Calls `generateInsightFromSession`
  - Generates `IntegratedInsight` with mindToolType: 'Memory Reconsolidation'

- **Intelligence Hub:** ❌ NO

- **Data Flow (Active Handler):**
  ```
  MemoryReconsolidationWizard (implicitBeliefs, completionSummary, baselineIntensity)
    ↓
  handleSaveMemoryReconSession()
    ↓
  Rich Report: "# Memory Reconsolidation" + belief + intensity shift + practices
    ↓
  generateInsightFromSession(wizardType: 'Memory Reconsolidation')
    ↓
  IntegratedInsight
    ↓
  integratedInsights state
  ```

- **Purpose:** 6-step trauma/memory processing protocol for limiting belief transformation

- **Data Retention:** ✅ Full session saved to `memoryReconHistory`

- **⚠️ DUAL IMPLEMENTATION BUG:**
  - First handler (line 1024) just saves, doesn't generate insights
  - Second handler (line 1214) includes full insight generation
  - Should consolidate to single handler
  - **Recommendation:** Delete first handler, keep second as primary

- **Report Fields:**
  - Selected implicit belief
  - Intensity shift percentage (baseline vs. post-session)
  - Integration practices used

---

### SECTION 2: CUSTOM INTEGRATED INSIGHT (1 Total)

#### 2.1 **Big Mind Process Wizard** ✅ CUSTOM INTEGRATION

**File:** `/home/user/AOS/components/BigMindProcessWizard.tsx`
**Save Handler:** `handleSaveBigMindSession` (App.tsx:1012-1022)

**Integration Points:**
- **IntegratedInsights:** ✅ YES (via custom function)
  - Line 1019: Calls `createBigMindIntegratedInsight(sessionId, summary)`
  - Not using standard `generateInsightFromSession` pattern
  - Generates custom `IntegratedInsight` with mindToolType: 'Big Mind Process'

- **Intelligence Hub:** ❌ NO

- **Data Flow:**
  ```
  BigMindProcessWizard (voices dialogue, summary)
    ↓
  handleSaveBigMindSession()
    ↓
  IF session.summary exists:
    createBigMindIntegratedInsight(sessionId, summary)
      ↓
    Custom IntegratedInsight (doesn't use AI insight generation)
      ↓
    setIntegratedInsights(prev => [...prev, insight])
    ↓
  integratedInsights state
  ```

- **Purpose:** Voice dialogue using Big Mind process for perspective expansion and witnessing

- **Data Retention:** ✅ Full session saved to `historyBigMind`

- **Special Implementation:**
  - Uses custom insight creation function instead of `generateInsightFromSession`
  - Creates basic insight structure without AI pattern detection
  - **Recommendation:** Consider refactoring to use `generateInsightFromSession` for consistency and AI-generated recommendations

- **Limitation:** No AI-generated shadow work or next steps recommendations

---

### SECTION 3: MINIMAL INTEGRATION (3 Total)

These wizards save sessions but **do NOT generate IntegratedInsights**, missing connection to intelligence system.

#### 3.1 **Jhana Guide Wizard** ⚠️ MINIMAL INTEGRATION

**File:** `SpiritToolsTab.tsx` (meditation practice selector)
**Save Handler:** `handleSaveJhanaSession` (App.tsx:715-718)

**Integration Points:**
- **IntegratedInsights:** ❌ NO
  ```typescript
  const handleSaveJhanaSession = (session: JhanaSession) => {
    setHistoryJhana(prev => [...prev.filter(s => s.id !== session.id), session]);
    navigateBack();
    // ❌ No insight generation - session isolated from intelligence
  };
  ```

- **Intelligence Hub:** ❌ NO

- **Data Flow:**
  ```
  JhanaWizard (jhanaLevel, meditationNotes)
    ↓
  handleSaveJhanaSession()
    ↓
  Save to historyJhana only
    ↓
  ❌ NO INSIGHT GENERATION
  ❌ NO INTELLIGENCE HUB INTEGRATION
  ```

- **Purpose:** Tracks meditation absorption states (Jhanas 1-8) and progress

- **Data Retention:** ✅ Full session saved to `historyJhana`

- **Gap Analysis:**
  - No pattern detection from meditation progression
  - No AI-generated recommendations for deepening practice
  - No shadow work suggestions based on jhana stage
  - **Recommendation:** Add `generateInsightFromSession` call with wizardType: 'Jhana Guide'

---

#### 3.2 **Somatic Generator Wizard** ⚠️ MINIMAL INTEGRATION

**File:** `/home/user/AOS/components/SomaticGeneratorWizard.tsx`
**Save Handler:** `handleSaveSomaticPractice` (App.tsx:846-850)

**Integration Points:**
- **IntegratedInsights:** ❌ NO
  ```typescript
  const handleSaveSomaticPractice = (session: SomaticPracticeSession) => {
    setSomaticPracticeHistory(prev => [...prev.filter(s => s.id !== session.id), session]);
    alert(`Practice "${session.title}" saved! You can find it in your Library.`);
    setActiveTab('library');
    // ❌ No insight generation - navigates directly to library
  };
  ```

- **Intelligence Hub:** ❌ NO

- **Data Flow:**
  ```
  SomaticGeneratorWizard (title, description, instructions, body focus)
    ↓
  handleSaveSomaticPractice()
    ↓
  Save to somaticPracticeHistory only
    ↓
  Navigate to Library tab
    ↓
  ❌ NO INSIGHT GENERATION
  ❌ NO INTELLIGENCE HUB INTEGRATION
  ```

- **Purpose:** AI-generated somatic (body-based) practices based on identified needs

- **Data Retention:** ✅ Full session saved to `somaticPracticeHistory`

- **Gap Analysis:**
  - No connection between generated practice and user's development pattern
  - No tracking of which somatic modalities user engages with most
  - No intelligent recommendations for deepening somatic work
  - **Recommendation:** Add `generateInsightFromSession` with wizardType: 'Somatic Practice'

---

#### 3.3 **Integral Body Architect Wizard** ⚠️ MINIMAL INTEGRATION

**File:** `/home/user/AOS/components/IntegralBodyArchitectWizard.tsx`
**Save Handler:** `handleSaveIntegralBodyPlan` (App.tsx:852-890)

**Integration Points:**
- **IntegratedInsights:** ❌ NO
  ```typescript
  const handleSaveIntegralBodyPlan = (plan: IntegralBodyPlan) => {
    setIntegralBodyPlans(prev => [...prev.filter(p => p.id !== plan.id), plan]);
    // ... plan history tracking ...
    // ... progress tracking initialization ...
    alert(`Your Integral Week has been saved! Access it from your Library.`);
    // ❌ No insight generation - full body-based development plan isolated
  };
  ```

- **Intelligence Hub:** ❌ NO

- **Data Flow:**
  ```
  IntegralBodyArchitectWizard (goalStatement, exercises, practices, schedule)
    ↓
  handleSaveIntegralBodyPlan()
    ↓
  Save to integralBodyPlans
    ↓
  Initialize in integralBodyPlanHistory
    ↓
  Initialize in planProgressByDay
    ↓
  ❌ NO INSIGHT GENERATION
  ❌ NO INTELLIGENCE HUB INTEGRATION
  ```

- **Purpose:** Comprehensive embodied development plan integrating
  - Yang practices (strength, cardio, mobility)
  - Yin practices (flexibility, recovery, breath)
  - Somatic awareness work

- **Data Retention:**
  - ✅ Full plan saved to `integralBodyPlans`
  - ✅ History entry created in `integralBodyPlanHistory`
  - ✅ Progress tracking initialized in `planProgressByDay`

- **Advanced Features:**
  - Daily feedback logging system
  - Time-weighted compliance analysis
  - Personalization summary generation
  - Integration with Dynamic Workout Architect for yang practice refinement

- **Gap Analysis:**
  - No insight generation from weekly review (major missed opportunity)
  - No AI pattern detection for embodied development
  - No connection to other mind/shadow/spirit practices
  - **Recommendation:** Add `generateInsightFromSession` with wizardType: 'Integral Body Plan' after plan completion or weekly review

---

### SECTION 4: MISSING SAVE HANDLERS (3 Total)

These wizards are implemented but have **NO save handlers** in App.tsx, resulting in **lost user work**.

#### 4.1 **Meditation Wizard** ❌ CRITICAL - NOT INTEGRATED INTO SAVE FLOW

**File:** `/home/user/AOS/components/MeditationWizard.tsx`
**Render Location:** App.tsx line 1510 (case 'meditation')

**Issue:**
- ✅ Component EXISTS
- ❌ Not passed `onSave` prop
- ❌ No draft state management (`draftMeditation`, `setDraftMeditation`)
- ❌ No `handleSaveMeditationSession` function in App.tsx
- ❌ Sessions are not persisted
- ❌ No IntegratedInsights generated
- ❌ User work is lost when navigating away

**Current Rendering (Line 1510-1515):**
```typescript
case 'meditation':
  return (
    <MeditationWizard
      onClose={() => navigateBack()}
    />
  );
```

**Needed Integration Pattern:**
```typescript
case 'meditation':
  return (
    <MeditationWizard
      onClose={() => navigateBack()}
      onSave={handleSaveMeditationSession}      // ✨ MISSING
      session={draftMeditation}                 // ✨ MISSING
      setDraft={setDraftMeditation}             // ✨ MISSING
    />
  );
```

**Data Flow (Broken):**
```
MeditationWizard (practice type, duration, findings)
  ↓
onClose() → navigateBack() only
  ↓
❌ NO SAVE HANDLER
  ↓
Sessions are not persisted
  ↓
No integratedInsights created
  ↓
Lost data when user navigates away
```

**Impact:**
- Users cannot track meditation practice progress
- No insight generation for meditation patterns
- No cross-wizard intelligence about meditation engagement
- **Critical Recommendation:** Integrate into save flow (similar to other wizards)

---

#### 4.2 **Role Alignment Wizard** ❌ CRITICAL - NO SAVE HANDLER

**File:** `/home/user/AOS/components/RoleAlignmentWizard.tsx`
**Render Location:** Not found in `renderActiveWizard` switch statement

**Issue:**
- ❌ No `handleSaveRoleAlignmentSession` function in App.tsx
- ❌ Sessions are not persisted anywhere
- ❌ No IntegratedInsights generated
- ❌ User work is lost when navigating away

**Data Flow (Broken):**
```
RoleAlignmentWizard (currentRoles, desiredRoles, alignment, challenges)
  ↓
❌ NO SAVE HANDLER
  ↓
Sessions are not persisted
  ↓
No integratedInsights created
  ↓
Lost data when user navigates away
```

**Impact:**
- Users cannot track life role analysis
- No insight generation for role-related patterns
- No recommendations for role integration
- **Critical Recommendation:** Implement save handler immediately

**Expected Handler Pattern:**
```typescript
const handleSaveRoleAlignmentSession = async (session: RoleAlignmentSession) => {
  setHistoryRoleAlignment(prev => [...prev.filter(s => s.id !== session.id), session]);
  setDraftRoleAlignment(null);
  navigateBack();

  const report = `# Role Alignment: ${session.primaryRole}\n- Alignment Score: ${session.alignmentScore}\n- Challenges: ${session.challenges.join(', ')}`;
  const summary = `Analyzed ${session.currentRoles.length} roles for alignment`;

  try {
    const insight = await generateInsightFromSession({
      wizardType: 'Role Alignment',
      sessionId: session.id,
      sessionName: 'Role Alignment Session',
      sessionReport: report,
      sessionSummary: summary,
      userId,
      availablePractices: Object.values(corePractices).flat(),
      userProfile
    });
    setIntegratedInsights(prev => [...prev, insight]);
  } catch (err) {
    console.error('[Role Alignment] Failed to generate insight:', err);
  }
};
```

---

#### 4.3 **Insight Practice Map Wizard** ❌ CRITICAL - NO SAVE HANDLER

**File:** `/home/user/AOS/components/InsightPracticeMapWizard.tsx`
**Render Location:** Not found in `renderActiveWizard` switch statement

**Issue:**
- ❌ No `handleSaveInsightPracticeMapSession` function in App.tsx
- ❌ Sessions are not persisted anywhere
- ❌ No IntegratedInsights generated
- ❌ Advanced knowledge graph linking is lost

**Data Flow (Broken):**
```
InsightPracticeMapWizard (insightId, linkedPractices, relationships)
  ↓
❌ NO SAVE HANDLER
  ↓
Knowledge graph links are not persisted
  ↓
No integratedInsights created
  ↓
Lost mapping data when user navigates away
```

**Purpose:** Creates knowledge graph linking insights to specific practices and showing relationships

**Impact:**
- Advanced users cannot build personal knowledge graphs
- No linking between insights and recommended practices
- No tracking of which practices address which insight patterns
- **Critical Recommendation:** Implement save handler immediately

**Expected Handler Pattern:**
```typescript
const handleSaveInsightPracticeMapSession = async (session: InsightPracticeMapSession) => {
  setHistoryInsightPracticeMap(prev => [...prev.filter(s => s.id !== session.id), session]);
  setDraftInsightPracticeMap(null);
  navigateBack();

  const report = `# Insight Practice Map\n- Mapped Insight: ${session.insightId}\n- Linked Practices: ${session.linkedPractices.length}\n- Relationships: ${JSON.stringify(session.relationships)}`;
  const summary = `Created knowledge graph for insight with ${session.linkedPractices.length} practices`;

  try {
    const insight = await generateInsightFromSession({
      wizardType: 'Insight Practice Map',
      sessionId: session.id,
      sessionName: 'Insight Practice Map Session',
      sessionReport: report,
      sessionSummary: summary,
      userId,
      availablePractices: Object.values(corePractices).flat(),
      userProfile
    });
    setIntegratedInsights(prev => [...prev, insight]);
  } catch (err) {
    console.error('[Insight Practice Map] Failed to generate insight:', err);
  }
};
```

---

### SECTION 5: ADDITIONAL WIZARD WITHOUT INSIGHT GENERATION

#### 5.1 **Dynamic Workout Architect Wizard** ⚠️ MINIMAL INTEGRATION

**File:** `/home/user/AOS/components/DynamicWorkoutArchitectWizard.tsx`
**Save Handler:** `handleSaveWorkoutProgram` (App.tsx:1206-1212)

**Integration Points:**
- **IntegratedInsights:** ❌ NO
  ```typescript
  const handleSaveWorkoutProgram = (program: WorkoutProgram) => {
    setWorkoutPrograms(prev => [...prev.filter(p => p.id !== program.id), program]);
    setWorkoutHandoffSource(null);
    navigateBack();
    alert(`Your personalized workout program has been saved!`);
  };
  ```

- **Intelligence Hub:** ❌ NO

- **Data Flow:**
  ```
  DynamicWorkoutArchitectWizard (exercises, schedule, intensity, goals)
    ↓
  handleSaveWorkoutProgram()
    ↓
  Save to workoutPrograms only
    ↓
  ❌ NO INSIGHT GENERATION
  ❌ NO INTELLIGENCE HUB INTEGRATION
  ```

- **Purpose:** AI-generated personalized workout program for yang (active) body practices

- **Data Retention:** ✅ Full program saved to `workoutPrograms`

- **Relationship:** Handoff from Integral Body Architect wizard (via `bodyArchitectHandoff`)

- **Gap Analysis:**
  - No insight generation from workout design
  - No pattern detection for preferred exercise types
  - No adaptive recommendations based on completion history
  - **Recommendation:** Add `generateInsightFromSession` call with wizardType: 'Workout Program'

---

## SECTION 6: INTELLIGENCE HUB INTEGRATION STATUS

### Current State: 🔴 **ZERO WIZARD INTEGRATION**

**Critical Finding:** The Intelligence Hub is fully implemented and functional but **completely isolated from all wizard save handlers**.

#### 6.1 Intelligence Hub Architecture

**File:** `/home/user/AOS/services/intelligenceHub.ts`
**Type Definitions:** `/home/user/AOS/types.ts` (lines 1388+)
**Context Building:** `/home/user/AOS/utils/contextAggregator.ts`

**Key Functions:**
- `getIntelligentGuidance(context: IntelligenceContext): Promise<IntelligentGuidance>`
- Imported in: `/home/user/AOS/App.tsx` (line 111)
- Called from: `handleGenerateIntelligentGuidance()` (App.tsx:448-466) - **MANUAL BUTTON ONLY**

**System Prompt Wizard Routing (intelligenceHub.ts:180-196):**

The Intelligence Hub's system prompt includes detailed routing for these wizards:
- Bias Detective
- IFS (Parts Work)
- Subject-Object Explorer
- 3-2-1 Shadow Work
- Somatic Generator
- Kegan Assessment
- Memory Reconsolidation
- Relational Pattern Tracker
- Big Mind Process
- Polarity Mapper
- Eight Zones (AQAL)
- Perspective Shifter
- Role Alignment
- Attachment Assessment
- Insight Practice Map

#### 6.2 Current Integration Points

**App.tsx:**
- Line 111: Import `getIntelligentGuidance`
- Line 224: State variables (`intelligentGuidance`, `isGuidanceLoading`, `guidanceError`)
- Line 448-466: `handleGenerateIntelligentGuidance()` - **Manual button handler**
- Line 468-472: `handleClearGuidanceCache()` - Cache refresh
- Line 1364: Pass props to RecommendationsTab

**RecommendationsTab.tsx:**
- Lines 79-103: "Generate AI Guidance" button calls `onGenerateGuidance()`
- Lines 105-286: Display guidance sections with wizard recommendations

**How It Works:**
1. User clicks "Generate AI Guidance" button in RecommendationsTab
2. App calls `handleGenerateIntelligentGuidance()`
3. Aggregates user context from:
   - practiceStack
   - practiceNotes
   - integratedInsights
   - completedToday
4. Calls `getIntelligentGuidance(context)`
5. Grok-4-Fast analyzes and returns:
   - Where You Are (synthesis)
   - Primary Focus (growth edge)
   - Recommended Next Steps (nextWizard + practice changes)
   - How It All Connects (reasoning)
   - Cautions (predictive warnings)
6. RecommendationsTab renders IntelligenceHubDisplay component
7. User sees wizard recommendations with launch buttons

#### 6.3 Critical Gap: No Wizard → Intelligence Hub Flow

**Current One-Way Flow:**
```
Intelligence Hub ← RecommendationsTab (manual refresh button)
```

**Missing Two-Way Flow:**
```
Wizard Save → Generate Insight → (❌ MISSING) → Intelligence Hub (auto-refresh)
```

**Impact:**
- When a wizard completes, Intelligence Hub is not refreshed
- User must manually click "Generate AI Guidance" to get new recommendations
- Intelligence Hub doesn't know about the newly completed wizard session
- Context becomes stale; guidance doesn't reflect latest work
- **Recommendation:** Auto-trigger `handleGenerateIntelligentGuidance()` after wizard saves

#### 6.4 Recommended Integration Pattern

**For each wizard save handler, add:**

```typescript
// After generateInsightFromSession call
try {
  const insight = await generateInsightFromSession({...});
  setIntegratedInsights(prev => [...prev, insight]);

  // ✨ NEW: Auto-refresh Intelligence Hub with latest context
  await handleGenerateIntelligentGuidance();
} catch (err) {
  console.error('[WizardName] Failed to generate insight:', err);
  // Continue without Intelligence Hub update (graceful degradation)
}
```

**Or better yet, create a wrapper utility:**

```typescript
async function generateInsightAndRefreshGuidance(input: InsightGenerationInput) {
  // 1. Generate insight
  const insight = await generateInsightFromSession(input);

  // 2. Auto-refresh Intelligence Hub
  try {
    const context = aggregateUserContext(practiceStack, practiceNotes, integratedInsights, completedToday);
    const guidance = await getIntelligentGuidance(context);
    setIntelligentGuidance(guidance);
  } catch (err) {
    console.warn('Failed to refresh Intelligence Hub:', err);
    // Graceful degradation - insight still saved
  }

  return insight;
}
```

---

## SECTION 7: SUMMARY TABLE - ALL WIZARDS AT A GLANCE

| # | Wizard | Component | IntegratedInsights | Intelligence Hub | Data Flow | Status |
|---|--------|-----------|-------------------|------------------|-----------|--------|
| 1 | 3-2-1 Reflection | ThreeTwoOneWizard.tsx | ✅ YES (Line 755) | ❌ NO | Comprehensive 4-phase report | ✅ FULL |
| 2 | Adaptive Cycle Lens | AdaptiveCycleWizard.tsx | ✅ YES (Line 1174) | ❌ NO | 4-quadrant map with dominant phase | ✅ FULL |
| 3 | Attachment Assessment | MindToolsTab | ✅ YES (Line 676) | ❌ NO | Style + scores + notes | ✅ FULL⚠️ BUG |
| 4 | Big Mind Process | BigMindProcessWizard.tsx | ✅ CUSTOM (Line 1019) | ❌ NO | Voice dialogue summary | ⚠️ PARTIAL |
| 5 | Bias Detective | BiasDetectiveWizard.tsx | ✅ YES (Line 535) | ❌ NO | Decision + diagnosis | ✅ FULL |
| 6 | Bias Finder | BiasFinderWizard.tsx | ✅ YES (Line 559) | ❌ NO | Biases + confidence scores | ✅ FULL |
| 7 | Dynamic Workout Architect | DynamicWorkoutArchitectWizard.tsx | ❌ NO | ❌ NO | Exercises + schedule | ⚠️ MINIMAL |
| 8 | Eight Zones | EightZonesWizard.tsx | ✅ YES (Line 1072) | ❌ NO | 8 zones + synthesis + insights | ✅ FULL |
| 9 | Insight Practice Map | InsightPracticeMapWizard.tsx | ❌ NO HANDLER | ❌ NO | Knowledge graph mapping | ❌ MISSING |
| 10 | Integral Body Architect | IntegralBodyArchitectWizard.tsx | ❌ NO | ❌ NO | Yang/Yin/somatic plan | ⚠️ MINIMAL |
| 11 | IFS Session | IFSWizard.tsx | ✅ YES (Line 830) | ❌ NO | Parts transcript + profile | ✅ FULL |
| 12 | Jhana Guide | SpiritToolsTab | ❌ NO | ❌ NO | Jhana level + notes | ⚠️ MINIMAL |
| 13 | Kegan Assessment | KeganAssessmentWizard.tsx | ✅ YES (Line 651) | ❌ NO | Development stage | ✅ FULL |
| 14 | Meditation | MeditationWizard.tsx | ❌ NO HANDLER | ❌ NO | Practice type + duration | ❌ MISSING |
| 15 | Memory Reconsolidation | MemoryReconsolidationWizard.tsx | ✅ YES (Line 1228) | ❌ NO | Belief + intensity shift | ✅ FULL⚠️ DUAL |
| 16 | Polarity Mapper | PolarityMapperWizard.tsx | ✅ YES (Line 628) | ❌ NO | Dilemma + poles | ✅ FULL |
| 17 | Perspective Shifter | PerspectiveShifterWizard.tsx | ✅ YES (Line 605) | ❌ NO | Situation + synthesis | ✅ FULL |
| 18 | Role Alignment | RoleAlignmentWizard.tsx | ❌ NO HANDLER | ❌ NO | Roles + alignment + challenges | ❌ MISSING |
| 19 | Somatic Generator | SomaticGeneratorWizard.tsx | ❌ NO | ❌ NO | Practice generator | ⚠️ MINIMAL |
| 20 | Subject-Object Explorer | SubjectObjectWizard.tsx | ✅ YES (Line 582) | ❌ NO | Pattern + subject-to statement | ✅ FULL |

---

## SECTION 8: DATA FLOW ARCHITECTURE

### Complete User Journey with Wizards

```
User completes Wizard Session
  ↓
Wizard calls onSave callback
  ↓
App handler triggered (handleSave[Wizard]Session)
  ↓
Session saved to localStorage (historyX)
  ↓
SPLIT (Integration Type):
  ├─ FULLY INTEGRATED (13 wizards)
  │  ├─ Build rich markdown report
  │  ├─ Call generateInsightFromSession(wizardType, report)
  │  ├─ Grok-4-Fast analyzes via insightGenerator.ts
  │  ├─ AI detects patterns, suggests shadow work + next steps
  │  ├─ IntegratedInsight created
  │  ├─ Save to integratedInsights state
  │  └─ ❌ MISSING: Auto-trigger Intelligence Hub refresh
  │
  ├─ CUSTOM INTEGRATED (1 wizard - BigMind)
  │  ├─ Call createBigMindIntegratedInsight()
  │  ├─ Manual insight creation (no AI pattern detection)
  │  ├─ Save to integratedInsights state
  │  └─ ❌ MISSING: Auto-trigger Intelligence Hub refresh
  │
  ├─ MINIMAL INTEGRATION (4 wizards)
  │  ├─ Session saved only
  │  └─ ❌ NO insight generation
  │
  ├─ MISSING SAVE HANDLERS (3 wizards)
  │  ├─ ❌ Session not persisted
  │  ├─ ❌ Data lost
  │  └─ ❌ No insight generation
  │
  └─ NO INTEGRATION (0 wizards)

User opens Recommendations Tab
  ↓
RecommendationsTab rendered
  ├─ Display current intelligentGuidance (if exists)
  ├─ "Generate AI Guidance" button
  └─ User clicks button
      ↓
      handleGenerateIntelligentGuidance()
      ↓
      aggregateUserContext()
      ├─ Collects: practiceStack, notes, integratedInsights, completion history
      ├─ Extracts: wizard sessions, user profile, sentiment analysis
      └─ Creates: IntelligenceContext object
      ↓
      getIntelligentGuidance(context)
      ↓
      Grok-4-Fast (via OpenRouter)
      ├─ Analyzes all user data
      ├─ Routes to next recommended wizard
      ├─ Suggests practice changes
      ├─ Identifies patterns and cautions
      └─ Returns: IntelligentGuidance (JSON + Markdown)
      ↓
      RecommendationsTab displays:
      ├─ Where You Are (synthesis)
      ├─ Primary Focus
      ├─ Wizard Recommendation (with launch button)
      ├─ Practice Changes (add/remove/modify)
      ├─ How It All Connects (reasoning)
      └─ Cautions (warnings)
```

---

## SECTION 9: RECOMMENDATIONS & ACTION ITEMS

### Priority 1 - Critical (Implement Immediately)

#### P1.1 Implement Missing Save Handlers
**Affected Wizards:** Meditation, Role Alignment, Insight Practice Map
**Effort:** 1-2 hours per wizard
**Impact:** Enables data persistence and insight generation

**Tasks:**
- [ ] Create `handleSaveMeditationSession` in App.tsx
- [ ] Create `handleSaveRoleAlignmentSession` in App.tsx
- [ ] Create `handleSaveInsightPracticeMapSession` in App.tsx
- [ ] Add state variables for draft and history
- [ ] Add to `renderActiveWizard` switch statement
- [ ] Test data persistence and insight generation

---

#### P1.2 Fix Attachment Assessment Draft State Bug
**File:** App.tsx line 669
**Change:** `setDraftRelational(null)` → `setDraftAttachment(null)`
**Effort:** 5 minutes
**Impact:** Prevents data loss in RelationalPattern wizard

---

#### P1.3 Fix Memory Reconsolidation Dual Implementation
**File:** App.tsx
**Action:** Delete first handler (line 1024), keep second (line 1214)
**Effort:** 10 minutes
**Impact:** Eliminates confusion and ensures insight generation

---

### Priority 2 - High (Implement This Sprint)

#### P2.1 Integrate Intelligence Hub with All Wizard Saves
**Affected:** All 17 wizards that generate or should generate insights
**Effort:** 4-6 hours
**Impact:** Auto-refresh guidance after every wizard completion

**Implementation:**
1. Create utility function `generateInsightAndRefreshGuidance()`
2. Update all 17 wizard save handlers to call this utility
3. Add graceful error handling for failed Intelligence Hub updates
4. Test context aggregation and guidance generation

**Code Pattern:**
```typescript
// After insight generation:
// Auto-refresh Intelligence Hub with updated context
if (handleGenerateIntelligentGuidance) {
  handleGenerateIntelligentGuidance().catch(err =>
    console.warn('[Wizard] Failed to refresh Intelligence Hub:', err)
  );
}
```

---

#### P2.2 Add Insight Generation to 4 Non-Integrated Wizards
**Affected:** Jhana Guide, Somatic Generator, Integral Body Architect, Dynamic Workout Architect
**Effort:** 2-3 hours
**Impact:** Expands intelligence system coverage to all major wizards

**For each wizard:**
1. Add `generateInsightFromSession()` call in save handler
2. Build appropriate report/summary from session data
3. Include wizardType in insight generation call
4. Test insight creation and Intelligence Hub refresh

---

### Priority 3 - Medium (Implement Next Sprint)

#### P3.1 Refactor Big Mind Process to Use Standard Insight Pattern
**Current:** Custom `createBigMindIntegratedInsight()` function
**Recommended:** Use `generateInsightFromSession()` with AI pattern detection
**Effort:** 1-2 hours
**Impact:** Consistent pattern across all wizards, AI-generated recommendations

**Steps:**
1. Build comprehensive markdown report from voice dialogue
2. Replace custom function with `generateInsightFromSession()` call
3. Ensure voice dialogue transcript is included in report
4. Test that Grok-4-Fast generates meaningful patterns from voices

---

#### P3.2 Create Intelligence Hub Documentation
**Effort:** 2-3 hours
**Content:**
- System prompt overview and wizard routing logic
- Data flow from wizards → insights → Intelligence Hub
- Caching strategy and cache invalidation
- Type definitions and context building
- Example integrations and best practices

**Audience:** Future developers, code reviewers

---

### Priority 4 - Nice-to-Have (Future Enhancement)

#### P4.1 Add Auto-Save Insight Drafts
**Concept:** As user progresses through wizard, draft insight is generated and shown
**Benefit:** Real-time feedback on detected patterns
**Effort:** 3-4 hours

#### P4.2 Create Wizard Sequencing Recommendations
**Concept:** Intelligence Hub suggests optimal wizard sequence based on patterns
**Benefit:** Structured learning path through reflection tools
**Effort:** 2-3 hours

#### P4.3 Build Wizard Completion Dashboard
**Concept:** Track which wizards user has completed and when
**Benefit:** Progress visualization and habit formation
**Effort:** 2-3 hours

---

## SECTION 10: CODE REFERENCES

### Key Files to Review

| File | Purpose | Lines | Impact |
|------|---------|-------|--------|
| App.tsx | Main orchestrator, all save handlers | 528-1244 | CRITICAL - All wizard saves routed here |
| insightGenerator.ts | Universal insight generation service | 1-396 | Core pattern detection engine |
| intelligenceHub.ts | AI guidance synthesis system | 1-500+ | Isolated from wizard saves |
| contextAggregator.ts | User context building | 1-300+ | Builds input for Intelligence Hub |
| types.ts | Type definitions | 321-400+ | IntegratedInsight, IntelligenceContext |
| RecommendationsTab.tsx | Intelligence Hub display | 1-300+ | Only manual trigger point |
| Each WizardComponent.tsx | Wizard UI and logic | Varies | Calls onSave callbacks |

### Specific Integration Points to Monitor

1. **generateInsightFromSession calls:** App.tsx lines 535, 559, 582, 605, 628, 651, 676, 699, 755, 830, 1072, 1174, 1228
2. **Intelligence Hub calls:** App.tsx line 458 (only location)
3. **User profile building:** App.tsx lines 986-1003 (uses integratedInsights)
4. **Sentiment analysis:** contextAggregator.ts (mood-aware recommendations)
5. **Wizard routing logic:** intelligenceHub.ts lines 180-196 (system prompt)

---

## SECTION 11: METRICS & STATISTICS

### Codebase Coverage

- **Total Wizard Code:** 13,625 lines across 19 components
- **App.tsx Handler Code:** ~1,500 lines dedicated to wizard orchestration
- **Intelligence Hub Code:** 500+ lines (underutilized)
- **Insight Generation Code:** 400+ lines (core pattern detection)
- **Context Building Code:** 300+ lines

### Integration Status Distribution

```
✅ FULLY INTEGRATED:         13 wizards  (68%)
⚠️  CUSTOM INTEGRATED:       1 wizard    (5%)
⚠️  MINIMAL INTEGRATION:     3 wizards   (16%)
❌ MISSING HANDLERS:         2 wizards   (11%)
❌ MISSING HANDLERS:         1 wizard    (5%)
────────────────────────────────────────────
TOTAL:                        19 wizards  (100%)
```

### Intelligence Hub Integration

```
Wizards calling Intelligence Hub:     0 / 19 (0%)
Wizards with auto-refresh:            0 / 19 (0%)
Manual trigger points:                1 (RecommendationsTab button)
System prompt wizard routes defined:  15 (unused in practice)
```

---

## SECTION 12: TESTING RECOMMENDATIONS

### Unit Tests to Add

1. **Test each save handler generates IntegratedInsight**
   - Input: Valid session data
   - Output: IntegratedInsight object with correct mindToolType
   - Verify: Pattern detected, shadow work + next steps generated

2. **Test Intelligence Hub auto-refresh integration**
   - Input: Wizard completion
   - Output: IntegratedInsight + Updated intelligentGuidance
   - Verify: Context reflects new wizard session

3. **Test context aggregation includes all wizards**
   - Input: Multiple completed wizard sessions
   - Output: IntelligenceContext with all sessions
   - Verify: Grok-4-Fast receives complete context

4. **Test missing save handlers**
   - Verify: 3 wizards can be opened and closed without errors
   - Verify: Sessions not saved (as expected for now)
   - After fix: Sessions are persisted

### Integration Tests

1. **Full wizard → insight → guidance flow**
   - Complete a wizard
   - Verify insight is generated
   - Verify Intelligence Hub refreshes (after fix)
   - Verify RecommendationsTab shows updated guidance

2. **Cross-wizard pattern detection**
   - Complete Bias Detective session
   - Complete IFS session
   - Verify Intelligence Hub detects connections
   - Verify guidance acknowledges both patterns

3. **User profile adaptation**
   - Complete Kegan Assessment (set developmental stage)
   - Complete Attachment Assessment (set attachment style)
   - Verify next wizard recommendations adapt to profile
   - Verify Gemini/Grok recommendations incorporate profile data

---

## CONCLUSION

The AOS codebase has **strong foundational integration** of wizards with the `IntegratedInsights` system (13/19 wizards fully integrated, 68% coverage). However, there are **critical gaps** that prevent the system from reaching its full potential:

1. **Intelligence Hub is isolated** - Not called from any wizard save handler
2. **Three wizards have no save handlers** - User work is lost
3. **Four wizards don't generate insights** - Incomplete coverage
4. **One wizard has dual implementations** - Source of confusion
5. **One bug in draft state management** - Can cause data loss

**Immediate actions (Priority 1) will take 2-3 hours and fix critical issues.**
**High priority actions (Priority 2) will take 4-6 hours and fully integrate Intelligence Hub.**
**Together these changes will transform the app from a collection of isolated tools into a unified intelligence system.**

---

**Report prepared by:** Claude Code Audit Agent
**Date:** November 16, 2025
**Status:** Complete and ready for implementation
