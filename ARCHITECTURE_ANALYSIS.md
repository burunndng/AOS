# AOS (Aura Operating System) Codebase Architecture Analysis

## 1. Directory Structure Overview

```
/home/user/AOS/
├── components/                 # 43 React components
│   ├── Wizards/               # Modal wizards for practices
│   ├── Tabs/                  # Main navigation tabs
│   ├── Modals/                # Info & customization modals
│   └── Utils/                 # Helper components
├── services/                   # 5 API service modules
│   ├── geminiService.ts       # Google GenAI integration (primary)
│   ├── biasDetectiveService.ts
│   ├── somaticPracticeService.ts
│   ├── meditationRecommender.ts
│   └── perspectiveShifterService.ts
├── data/                       # Static data & configurations
│   ├── meditationPractices.ts
│   ├── attachmentAssessment.ts
│   ├── attachmentMappings.ts
│   ├── attachmentPracticeSequences.ts
│   ├── ilpGraphQuizzes.ts
│   ├── journeyContent.ts
│   └── practicePrompts.ts
├── utils/                      # Helper utilities
│   └── helpers.ts              # Date, ID, shuffle utilities
├── types.ts                    # 67+ type definitions
├── constants.ts                # Practice definitions & modules
├── App.tsx                     # Root component, state management
├── theme.ts                    # Tailwind theme configuration
├── index.html                  # HTML entry point
├── index.tsx                   # React mount point
├── package.json               # Dependencies
└── vite.config.ts            # Vite build config
```

## 2. Directory Structure Details

### Components Directory (43 components)

**Wizards (Step-by-step guided experiences):**
- BiasDetectiveWizard.tsx (decision analysis)
- KeganAssessmentWizard.tsx (developmental stage assessment)
- IFSWizard.tsx (Internal Family Systems dialogue)
- SubjectObjectWizard.tsx (shadow work)
- PerspectiveShifterWizard.tsx (perspective-taking)
- PolarityMapperWizard.tsx (dilemma mapping)
- SomaticGeneratorWizard.tsx (embodied practices)
- RelationalPatternChatbot.tsx (relationship analysis)
- JhanaTracker.tsx (meditation depth tracking)
- MeditationWizard.tsx (meditation finding)
- ThreeTwoOneWizard.tsx (integration practice)
- AttachmentAssessmentWizard.tsx (relationship patterns)
- RoleAlignmentWizard.tsx (role exploration)
- ConsciousnessGraph.tsx (consciousness mapping)

**Tabs (Main navigation views):**
- DashboardTab.tsx
- StackTab.tsx
- BrowseTab.tsx
- TrackerTab.tsx
- StreaksTab.tsx
- RecommendationsTab.tsx
- AqalTab.tsx
- MindToolsTab.tsx, ShadowToolsTab.tsx, BodyToolsTab.tsx, SpiritToolsTab.tsx
- LibraryTab.tsx
- JourneyTab.tsx
- ILPGraphQuiz.tsx

**Modals (Info displays & customization):**
- PracticeInfoModal.tsx
- PracticeExplanationModal.tsx
- PracticeCustomizationModal.tsx
- CustomPracticeModal.tsx
- GuidedPracticeGenerator.tsx

**Other Components:**
- NavSidebar.tsx (navigation)
- Coach.tsx (AI coach)
- PracticeChatbot.tsx
- LearningCard.tsx
- ILPKnowledgeGraph.tsx
- LoadingFallback.tsx

### Services Directory (5 services)

1. **geminiService.ts** (70KB - Primary AI integration)
   - Uses: Google GenAI API (@google/genai)
   - Model: gemini-2.5-flash-lite, gemini-2.5-pro
   - Functions: generateText, explainPractice, generateRecommendations, generateAqalReport, etc.

2. **somaticPracticeService.ts** (10KB)
   - Generates somatic scripts with safety validation
   - Validates content for pseudoscience

3. **biasDetectiveService.ts** (4.5KB)
   - Bias analysis functions
   - Decision framing

4. **meditationRecommender.ts** (20KB)
   - Meditation recommendations
   - Progress tracking

5. **perspectiveShifterService.ts** (3KB)
   - Perspective exploration logic

### Data Directory (8 files)

Contains static data and reference information:
- **meditationPractices.ts**: Practice library definitions
- **attachmentAssessment.ts**: ECR-R questionnaire (30 questions)
- **attachmentMappings.ts**: Practice recommendations by attachment style
- **attachmentPracticeSequences.ts**: Sequenced practice plans
- **ilpGraphQuizzes.ts**: Quiz questions and knowledge graph
- **journeyContent.ts**: Journey onboarding content
- **practicePrompts.ts**: AI prompts for practice generation

## 3. Type Definitions Pattern

**File Location:** `/home/user/AOS/types.ts` (593 lines, 67+ definitions)

**Naming Convention:** PascalCase for types and interfaces

**Categories:**

```typescript
// Core Practice Types
interface Practice { id, name, description, why, evidence, timePerWeek, roi, difficulty, affectsSystem, how, imageUrl, customizationQuestion }
interface CustomPractice extends Omit<Practice, 'how'> { isCustom: true, module: ModuleKey, how: string[] }
type AllPractice = Practice | CustomPractice

// Session/Draft Types (for wizards)
interface BiasDetectiveSession { id, date, currentStep, decisionText, reasoning, discoveryAnswers, identifiedBiases, diagnosis, scenarios, oneThingToRemember, nextTimeAction }
interface IFSSession { id, date, partId, partName, transcript, integrationNote, currentPhase, summary, aiIndications, linkedInsightId }
interface KeganAssessmentSession { id, date, responses, overallInterpretation, selfReflection, notes }
interface AttachmentAssessmentSession { id, date, answers, scores, style, description, notes }

// Step Enums
type BiasDetectiveStep = 'DECISION' | 'REASONING' | 'DISCOVERY' | 'DIAGNOSIS' | 'SCENARIOS' | 'COMMITMENT' | 'LEARNING' | 'COMPLETE'
type KeganAssessmentStep = 'INTRODUCTION' | 'RELATIONSHIPS' | 'WORK_PURPOSE' | 'VALUES_BELIEFS' | 'CONFLICT_FEEDBACK' | 'IDENTITY_SELF' | 'ANALYSIS' | 'RESULTS' | 'REFLECTION' | 'POST_DIALOGUE'

// Integration Types
interface IntegratedInsight { id, mindToolType, mindToolSessionId, detectedPattern, suggestedShadowWork, dateCreated, status }

// Tab Navigation
type ActiveTab = 'dashboard' | 'stack' | 'browse' | 'tracker' | 'streaks' | 'recommendations' | 'aqal' | 'mind-tools' | 'shadow-tools' | 'body-tools' | 'spirit-tools' | 'library' | 'quiz' | 'journey'

// Module System
type ModuleKey = 'body' | 'mind' | 'spirit' | 'shadow'
interface PracticesData { body: Practice[], mind: Practice[], spirit: Practice[], shadow: Practice[] }
```

## 4. How Wizards Are Implemented

### Wizard Pattern (Example: BiasDetectiveWizard)

```typescript
// 1. Structure
interface BiasDetectiveWizardProps {
  onClose: () => void
  onSave: (session: BiasDetectiveSession) => void
  session: BiasDetectiveSession | null  // Draft data
  setDraft: (session: BiasDetectiveSession | null) => void
}

// 2. Step Management
type WizardStep = 'DECISION' | 'REASONING' | 'DISCOVERY' | 'DISCOVERING' | 'DIAGNOSIS' | 'SCENARIOS' | 'COMMITMENT' | 'LEARNING' | 'COMPLETE'
const STEPS: WizardStep[] = ['DECISION', 'REASONING', 'DISCOVERY', 'DIAGNOSIS', 'SCENARIOS', 'COMMITMENT', 'LEARNING']
const STEP_LABELS: Record<WizardStep, string> = { DECISION: 'The Decision', ... }

// 3. State Management (local)
const [step, setStep] = useState<WizardStep>(draft?.currentStep as WizardStep || 'DECISION')
const [decisionText, setDecisionText] = useState(draft?.decisionText || '')
const [isLoading, setIsLoading] = useState(false)

// 4. Draft Persistence (on App level with useLocalStorage)
const handleSaveDraft = () => {
  const session: BiasDetectiveSession = { id, date, currentStep: step, decisionText, ... }
  setDraft(session)
  onClose()
}

// 5. AI Integration (for steps requiring analysis)
const handleNext = async () => {
  if (step === 'DISCOVERY') {
    setStep('DISCOVERING')
    const diagnosis = await generateBiasedDecisionAnalysis(decisionText, reasoning, discoveryAnswers)
    setBiasesIdentified(diagnosis)
    setStep('DIAGNOSIS')
  }
}

// 6. Completion & Integration
const handleSave = () => {
  onSave(completeSession) // Parent handles saving to history
  // Parent may call geminiService.detectPatternsAndSuggestShadowWork()
  // to create IntegratedInsight
}
```

### Wizard UI Pattern

```tsx
// Fixed overlay modal
<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
  <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-2xl w-full p-8">
    {/* Header with title and close button */}
    {/* Step-specific content */}
    {/* Navigation buttons (back, next) */}
    {/* Progress indicator */}
  </div>
</div>
```

### Available Wizards in App.tsx (renderActiveWizard)

```typescript
activeWizard can be:
'321', 'ifs', 'bias', 'so', 'ps', 'pm', 'kegan', 'relational', 
'jhana', 'somatic', 'meditation', 'consciousness-graph', 'role-alignment'
```

## 5. Services Architecture

### Gemini Service Pattern

```typescript
// Initialization
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! })

// Text Generation
export async function generateText(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: prompt,
  })
  return response.text
}

// JSON Generation (with schema)
export async function populateCustomPractice(practiceName: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: { description: { type: Type.STRING }, ... },
        required: ['description', 'why', 'how']
      }
    }
  })
  return JSON.parse(response.text)
}

// Service Functions (called from components)
- explainPractice(practice: Practice)
- generateRecommendations(context: string)
- generateAqalReport(context: string)
- populateCustomPractice(name: string)
- getPersonalizedHowTo(practice: Practice, answer: string)
- generatePracticeScript(userPrompt: string)
- summarizeThreeTwoOneSession(session: ThreeTwoOneSession)
- detectPatternsAndSuggestShadowWork(type: string, sessionId: string, report: string, shadowPractices: Practice[])
```

### Other Service Patterns

**SomaticPracticeService:**
- validatePracticeContent() - Validates for pseudoscience
- generateSomaticScript() - Creates embodied practice scripts

**BiasDetectiveService:**
- generateBiasedDecisionAnalysis() - Analyzes cognitive biases
- generateBiasScenarios() - Creates alternative scenarios

## 6. State Management in App.tsx

### Architecture

```typescript
// Custom Hook: useLocalStorage<T>(key: string, initialValue: T)
// Automatically syncs to localStorage on every change

// Core State (persisted)
const [activeTab, setActiveTab] = useLocalStorage<ActiveTab>('activeTab', 'dashboard')
const [practiceStack, setPracticeStack] = useLocalStorage<AllPractice[]>('practiceStack', [])
const [practiceNotes, setPracticeNotes] = useLocalStorage<Record<string, string>>('practiceNotes', {})
const [dailyNotes, setDailyNotes] = useLocalStorage<Record<string, string>>('dailyNotes', {})
const [completionHistory, setCompletionHistory] = useLocalStorage<Record<string, string[]>>('completionHistory', {})

// Draft Sessions (in-progress wizard work)
const [draft321, setDraft321] = useLocalStorage<Partial<ThreeTwoOneSession> | null>('draft321', null)
const [draftIFS, setDraftIFS] = useLocalStorage<IFSSession | null>('draftIFS', null)
const [draftBias, setDraftBias] = useLocalStorage<BiasDetectiveSession | null>('draftBias', null)
const [draftSO, setDraftSO] = useLocalStorage<SubjectObjectSession | null>('draftSO', null)
const [draftPS, setDraftPS] = useLocalStorage<PerspectiveShifterSession | null>('draftPS', null)
const [draftPM, setDraftPM] = useLocalStorage<PolarityMapDraft | null>('draftPM', null)
const [draftKegan, setDraftKegan] = useLocalStorage<KeganAssessmentSession | null>('draftKegan', null)
const [draftRelational, setDraftRelational] = useLocalStorage<RelationalPatternSession | null>('draftRelational', null)

// Session History (completed sessions)
const [history321, setHistory321] = useLocalStorage<ThreeTwoOneSession[]>('history321', [])
const [historyIFS, setHistoryIFS] = useLocalStorage<IFSSession[]>('historyIFS', [])
const [historyBias, setHistoryBias] = useLocalStorage<BiasDetectiveSession[]>('historyBias', [])
const [historySO, setHistorySO] = useLocalStorage<SubjectObjectSession[]>('historySO', [])
const [historyPS, setHistoryPS] = useLocalStorage<PerspectiveShifterSession[]>('historyPS', [])
const [historyPM, setHistoryPM] = useLocalStorage<PolarityMap[]>('historyPM', [])
const [historyKegan, setHistoryKegan] = useLocalStorage<KeganAssessmentSession[]>('historyKegan', [])
const [historyRelational, setHistoryRelational] = useLocalStorage<RelationalPatternSession[]>('historyRelational', [])
const [historyJhana, setHistoryJhana] = useLocalStorage<JhanaSession[]>('historyJhana', [])
const [somaticPracticeHistory, setSomaticPracticeHistory] = useLocalStorage<SomaticPracticeSession[]>('somaticPracticeHistory', [])
const [historyAttachment, setHistoryAttachment] = useLocalStorage<AttachmentAssessmentSession[]>('historyAttachment', [])

// Library & References
const [partsLibrary, setPartsLibrary] = useLocalStorage<IFSPart[]>('partsLibrary', [])

// Insights & Analysis
const [integratedInsights, setIntegratedInsights] = useLocalStorage<IntegratedInsight[]>('integratedInsights', [])
const [aqalReport, setAqalReport] = useLocalStorage<AqalReportData | null>('aqalReport', null)

// Transient State (NOT persisted, resets on refresh)
const [recommendations, setRecommendations] = useState<string[]>([])
const [aiLoading, setAiLoading] = useState(false)
const [aiError, setAiError] = useState<string | null>(null)

// Modal State (transient)
const [activeWizard, setActiveWizard] = useLocalStorage<string | null>('activeWizard', null)
const [infoModalPractice, setInfoModalPractice] = useState<Practice | null>(null)
const [isCustomPracticeModalOpen, setIsCustomPracticeModalOpen] = useState(false)
```

### Wizard Activation Pattern

```typescript
const setActiveWizardAndLink = (wizardName: string | null, insightId?: string) => {
  setActiveWizard(wizardName)
  setLinkedInsightId(insightId)
}

// From components
setActiveWizardAndLink('bias', undefined)
setActiveWizardAndLink('ifs', insightId)
```

### Session Saving Pattern

```typescript
const handleSaveBiasSession = async (session: BiasDetectiveSession) => {
  // 1. Save to history
  setHistoryBias(prev => [...prev.filter(s => s.id !== session.id), session])
  
  // 2. Clear draft & close wizard
  setDraftBias(null)
  setActiveWizard(null)
  
  // 3. Generate report & detect patterns
  const report = `# Bias Detective: ${session.decisionText}\n- Diagnosis: ${session.diagnosis}\n- Takeaway: ${session.oneThingToRemember}`
  const insight = await geminiService.detectPatternsAndSuggestShadowWork(
    'Bias Detective', session.id, report, Object.values(corePractices.shadow)
  )
  
  // 4. Store insight for integration into Shadow Tools
  if (insight) setIntegratedInsights(prev => [...prev, insight])
}
```

## 7. How Practices Are Stored & Persisted

### Practice Definitions

**Location:** `/home/user/AOS/constants.ts` (666 lines)

```typescript
export const practices: PracticesData = {
  body: [
    { id: 'sleep', name: 'Sleep Foundation', description: '...', why: '...', 
      evidence: '...', timePerWeek: 0, roi: 'EXTREME', difficulty: 'Medium',
      affectsSystem: ['nervous-system', 'hormones', ...], 
      how: ['Aim for 7-9 hours nightly', ...], imageUrl: '...' },
    // ... more body practices
  ],
  mind: [ ... ],
  spirit: [ ... ],
  shadow: [ ... ]
}

export const modules: Record<ModuleKey, ModuleInfo> = {
  body: { name: 'Body', color: 'text-cyan-400', textColor: 'text-slate-100', borderColor: 'border-cyan-600', lightBg: 'bg-cyan-400/20' },
  mind: { ... },
  spirit: { ... },
  shadow: { ... }
}

export const starterStacks: StarterStacksData = {
  'foundation': { name: 'Foundation', description: '...', practices: ['sleep', 'zone2-cardio', ...], difficulty: 'Beginner', aggressiveness: 'Relaxed', why: '...' },
  // ... more starter stacks
}
```

### Practice Persistence

**Pattern 1: Practice Stack (selected practices)**
```typescript
// useLocalStorage key: 'practiceStack'
practiceStack: AllPractice[]
// Includes both core practices and custom practices
// Custom practices: { ...practice, isCustom: true, module: ModuleKey }
```

**Pattern 2: Practice Notes**
```typescript
// useLocalStorage key: 'practiceNotes'
practiceNotes: Record<string, string>  // { [practiceId]: note }
updatePracticeNote(practiceId: string, note: string)
```

**Pattern 3: Daily Notes**
```typescript
// useLocalStorage key: 'dailyNotes'
dailyNotes: Record<string, string>  // { [practiceId-YYYY-MM-DD]: note }
updateDailyNote(practiceId: string, note: string)
// Key format: `${practiceId}-${today}`
```

**Pattern 4: Completion Tracking**
```typescript
// useLocalStorage key: 'completionHistory'
completionHistory: Record<string, string[]>  // { [practiceId]: [date, date, date, ...] }
togglePracticeCompletion(practiceId: string)
// Dates in ISO format: YYYY-MM-DD
```

**Pattern 5: Streak Calculation**
```typescript
const getStreak = (practiceId: string) => {
  const dates = completionHistory[practiceId] || []
  // Sort descending, check consecutive dates from today backwards
  // Returns current streak length
}
```

### Custom Practices

```typescript
// User-created practices stored in practiceStack with isCustom flag
interface CustomPractice extends Omit<Practice, 'how'> {
  isCustom: true
  module: ModuleKey  // User specifies which module
  how: string[]
}

// Creation flow:
1. CustomPracticeModal.tsx -> user enters practice name
2. geminiService.populateCustomPractice() -> AI generates description, why, how
3. handleSaveCustomPractice() -> adds to practiceStack with module
```

## 8. Google API Integration

### Implementation Details

**Service:** `geminiService.ts`

**Initialization:**
```typescript
import { GoogleGenAI, Type, Modality, Blob, Content } from "@google/genai"

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! })
```

**Models Used:**
- `gemini-2.5-flash-lite` - Lightweight text generation
- `gemini-2.5-pro` - Complex JSON generation with schemas

**Key Features:**

1. **Text Generation**
   - Prompts sent as: `contents: prompt` (string)
   - Response accessed via: `response.text`

2. **Structured JSON Output**
   - Uses `responseMimeType: 'application/json'`
   - Includes `responseSchema` with Type definitions
   - Response parsed: `JSON.parse(response.text)`

3. **Primary Use Cases in AOS:**

   **a) Practice Explanation**
   ```typescript
   explainPractice(practice: Practice): Promise<string>
   // Generates markdown explanation for any practice
   // Called from: PracticeInfoModal.tsx
   ```

   **b) Custom Practice Generation**
   ```typescript
   populateCustomPractice(practiceName: string)
   // Generates: { description, why, how: string[] }
   // Called from: CustomPracticeModal.tsx
   ```

   **c) Recommendation Generation**
   ```typescript
   generateRecommendations(context: string): Promise<string[]>
   // Context: current practice stack + completion info
   // Called from: RecommendationsTab.tsx
   ```

   **d) AQAL Report Generation**
   ```typescript
   generateAqalReport(context: string): Promise<AqalReportData>
   // Four quadrant analysis: I, It, We, Its
   // Called from: AqalTab.tsx
   ```

   **e) Practice Personalization**
   ```typescript
   getPersonalizedHowTo(practice: Practice, userAnswer: string): Promise<string[]>
   // Customizes practice steps based on user context
   // Called from: PracticeCustomizationModal.tsx
   ```

   **f) Session Summarization**
   ```typescript
   summarizeThreeTwoOneSession(session: ThreeTwoOneSession): Promise<string>
   // Creates 2-3 sentence summary of shadow work
   // Called from: ThreeTwoOneWizard.tsx
   ```

   **g) Pattern Detection & Shadow Work Recommendation**
   ```typescript
   detectPatternsAndSuggestShadowWork(
     type: string, sessionId: string, report: string, shadowPractices: Practice[]
   ): Promise<IntegratedInsight>
   // Creates IntegratedInsight linking mind tool to shadow work
   // Called from: handleSaveBiasSession, handleSaveSOSession, etc.
   ```

4. **Integration Points:**

   **a) App.tsx functions that call geminiService:**
   ```typescript
   - generateRecommendations() -> RecommendationsTab
   - generateAqalReport() -> AqalTab
   - handleExplainPractice() -> PracticeExplanationModal
   - handlePersonalizePractice() -> PracticeCustomizationModal
   - handleSaveBiasSession() -> detectPatternsAndSuggestShadowWork()
   - handleSaveSOSession() -> detectPatternsAndSuggestShadowWork()
   - handleSavePSSession() -> detectPatternsAndSuggestShadowWork()
   - handleSavePMSession() -> detectPatternsAndSuggestShadowWork()
   - handleSaveKeganSession() -> detectPatternsAndSuggestShadowWork()
   - handleSaveRelationalSession() -> detectPatternsAndSuggestShadowWork()
   ```

   **b) Component-specific calls:**
   ```typescript
   - BiasDetectiveWizard: generateBiasedDecisionAnalysis()
   - Coach: getCoachResponse() [alias for generateText()]
   - PracticeCustomizationModal: getPersonalizedHowTo()
   - GuidedPracticeGenerator: generatePracticeScript()
   - ThreeTwoOneWizard: summarizeThreeTwoOneSession()
   - RelationalPatternChatbot: getCoachResponse()
   ```

## 9. Architecture Patterns & Conventions

### Naming Conventions

```typescript
// Components: PascalCase
BiasDetectiveWizard.tsx, PracticeInfoModal.tsx

// Types/Interfaces: PascalCase
interface BiasDetectiveSession
type WizardStep = 'DECISION' | 'REASONING' | ...

// Functions: camelCase
const generateRecommendations = async () => {}
const handleSaveBiasSession = async () => {}

// Constants: snake_case (in enums/lists) or UPPER_CASE (simple values)
const STEP_LABELS: Record<WizardStep, string> = { ... }
const STEPS: WizardStep[] = ['DECISION', 'REASONING', ...]

// CSS Classes: kebab-case (Tailwind classes)
className="bg-slate-800 border border-slate-700 rounded-lg"
```

### Component Props Pattern

```typescript
interface ComponentProps {
  // Required callback props
  onClose: () => void
  onSave: (data: SomeType) => void
  
  // Data props
  session: SessionType | null
  practiceStack: Practice[]
  
  // Setter props (for drafts)
  setDraft: (draft: DraftType | null) => void
  
  // Optional feature flags
  isOpen?: boolean
}
```

### Modal Pattern

```tsx
// All modals use: fixed positioning, backdrop blur, z-50
<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
  <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-2xl w-full p-8">
    {/* Content with close button in top-right */}
  </div>
</div>

// Prevent background scroll
useEffect(() => {
  document.body.style.overflow = 'hidden'
  return () => { document.body.style.overflow = '' }
}, [step])
```

### Service Function Pattern

```typescript
// 1. Takes semantic input
// 2. Constructs detailed prompt
// 3. Calls AI with appropriate model
// 4. Validates/transforms output
// 5. Returns typed result

export async function explainPractice(practice: Practice): Promise<string> {
  const prompt = `... ${practice.name} ...`
  return await generateText(prompt)
}
```

### State Composition Pattern

```typescript
// Related states grouped by concern
// 1. Core data (practice stack, notes)
// 2. Draft sessions (in-progress)
// 3. Session history (completed)
// 4. Libraries (reference data)
// 5. Insights (AI analysis results)
// 6. Transient (UI state, loading flags)
```

### Form Handling Pattern

```typescript
// Local component state for form
const [decisionText, setDecisionText] = useState(draft?.decisionText || '')

// Save to parent's draft on close
const handleSaveDraft = () => {
  setDraft({ ...prevDraft, decisionText, ... })
  onClose()
}

// Complete and save to history
const handleSave = () => {
  onSave(completeSession)
}
```

## 10. Key Architectural Principles

### 1. Lazy Loading with Suspense
- All tabs and wizards lazy-loaded
- Loading fallbacks for smooth UX
- Reduces initial bundle size

### 2. Draft System for Wizards
- In-progress wizards persist as drafts in localStorage
- User can close wizard, resume later
- Separated from completed history

### 3. Integrated Insights
- Mind tools (bias, subject-object, etc.) create structured insights
- Shadow tools can address these insights
- Tracks which shadow work addressed which insight

### 4. Modular Practice System
- 4 modules: body, mind, spirit, shadow
- Attachment styles recommend practices by module
- Custom practices can be created for any module

### 5. localStorage-Centric
- All persistent data in localStorage
- Custom useLocalStorage hook handles syncing
- Import/export for data portability
- Reset clears everything

### 6. AI-Driven Personalization
- Every major feature calls Google GenAI
- Explains practices in user-friendly language
- Personalizes step-by-step instructions
- Detects patterns across multiple sessions

### 7. Responsive Modal System
- All wizards/modals are overlays
- Prevent background scroll
- Click-outside to close
- Progress indicators for multi-step

## File Summary

| File | Lines | Purpose |
|------|-------|---------|
| types.ts | 593 | Type definitions for entire app |
| constants.ts | 666 | Practice library & module definitions |
| App.tsx | 695 | Root component, state management, routing |
| geminiService.ts | 70KB | AI integration, text & JSON generation |
| components/ | 43 files | React components (wizards, tabs, modals) |
| services/ | 5 files | Business logic for wizards & AI |
| data/ | 8 files | Static data (practices, quizzes, etc.) |
| utils/helpers.ts | 82 | Common utilities (ID, date, shuffle) |
| theme.ts | 110 | Tailwind theme configuration |

## Technology Stack

- **Framework:** React 19.2.0
- **Build:** Vite 6.2.0
- **Language:** TypeScript 5.8
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Visualization:** D3.js (for graphs)
- **AI:** Google GenAI SDK (@google/genai 1.28.0)
- **Environment:** Node.js/ES Modules

