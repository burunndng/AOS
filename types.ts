
export type ModuleKey = 'body' | 'mind' | 'spirit' | 'shadow';

export interface Practice {
  id: string;
  name: string;
  description: string;
  why: string;
  evidence: string;
  timePerWeek: number;
  roi: 'EXTREME' | 'VERY HIGH' | 'HIGH' | 'MEDIUM' | 'LOW';
  difficulty: 'Trivial' | 'Very Low' | 'Low' | 'Low-Medium' | 'Medium' | 'Medium-High' | 'High';
  affectsSystem: string[];
  how: string[];
  imageUrl?: string;
  customizationQuestion?: string;
}

export interface CustomPractice extends Omit<Practice, 'how'> {
  isCustom: true;
  module: ModuleKey;
  how: string[]; // Overriding to be just strings
}

export type AllPractice = Practice | CustomPractice;

export interface PracticesData {
  body: Practice[];
  mind: Practice[];
  spirit: Practice[];
  shadow: Practice[];
}

export interface ModuleInfo {
  name: string;
  color: string;
  textColor: string;
  borderColor: string;
  lightBg: string;
}

export interface StarterStack {
  name: string;
  description: string;
  practices: string[];
  difficulty: string;
  aggressiveness: 'Relaxed' | 'Moderate' | 'Focused' | 'Intensive' | 'Transformative';
  why: string;
}

export interface StarterStacksData {
  [key: string]: StarterStack;
}

export type ActiveTab = 
  | 'dashboard'
  | 'stack'
  | 'browse'
  | 'tracker'
  | 'streaks'
  | 'recommendations'
  | 'aqal'
  | 'mind-tools'
  | 'shadow-tools'
  | 'body-tools'
  | 'library';

export interface CoachMessage {
  role: 'user' | 'coach';
  text: string;
}

export interface ThreeTwoOneSession {
  id: string;
  date: string;
  trigger: string;
  triggerDescription: string;
  dialogue: string;
  embodiment: string;
  integration: string;
  aiSummary?: string;
  linkedInsightId?: string;
}

export type WizardPhase = 'IDENTIFY' | 'EXPLORE' | 'DEEPEN' | 'UNBURDEN' | 'INTEGRATE' | 'CLOSING';

export interface IFSDialogueEntry {
  role: 'user' | 'bot';
  text: string;
  phase: WizardPhase;
}

export interface IFSPart {
  id: string;
  name: string;
  role: string;
  fears: string;
  positiveIntent: string;
  lastSessionDate: string;
}

export interface IFSSession {
  id:string;
  date: string;
  partId: string;
  partName: string;
  transcript: IFSDialogueEntry[];
  integrationNote: string;
  currentPhase: WizardPhase;
  partRole?: string;
  partFears?: string;
  partPositiveIntent?: string;
  summary?: string;
  aiIndications?: string[];
  linkedInsightId?: string;
}

export interface AqalReportData {
    summary: string;
    quadrantInsights: {
        I: string;
        It: string;
        We: string;
        Its: string;
    };
    recommendations: string[];
}

export interface DiscoveryAnswers {
    alternativesConsidered: string;
    informationSources: string;
    timePressure: string;
    emotionalState: string;
    influencers: string;
}

export interface IdentifiedBias {
    name: string;
    description: string;
    relevance: string;
}
  
export interface BiasScenario {
    biasName: string;
    howItInfluenced: string;
    scenario: string;
    alternativeDecision: string;
}

export interface BiasDetectiveSession {
    id: string;
    date: string;
    currentStep: string;
    decisionText: string;
    reasoning: string;
    discoveryAnswers: DiscoveryAnswers;
    identifiedBiases: IdentifiedBias[];
    alternativeFramings: string[];
    diagnosis?: string;
    scenarios?: BiasScenario[];
    oneThingToRemember: string;
    nextTimeAction: string;
}

export type SubjectObjectStep = 'RECOGNIZE_PATTERN' | 'TRUTH_FEELINGS' | 'NAME_SUBJECT' | 'EVIDENCE_SUBJECT' | 'TRACE_ORIGIN' | 'COST' | 'FIRST_OBSERVATION' | 'SMALL_EXPERIMENT' | 'INTEGRATION_SHIFT' | 'COMPLETE';

export interface SubjectObjectSession {
    id: string;
    date: string;
    currentStep: SubjectObjectStep;
    pattern: string;
    truthFeelings: string;
    subjectToStatement: string;
    evidenceChecks: { pro?: string; con?: string };
    origin: string;
    cost: string;
    firstObservation: string;
    dailyTracking: Record<string, string>;
    reviewInsights: string;
    integrationShift: string;
    ongoingPracticePlan: string[];
    smallExperimentChosen?: string;
}

export interface Perspective {
    type: 'First Person (You)' | 'Second Person (Them)' | 'Third Person (Observer)' | 'Witness (Pure Awareness)';
    description: string;
    // FIX: Changed 'llmReflection' to 'reflection' for consistency with how the state is managed and passed to components.
    reflection?: string; 
}
  
export interface PerspectiveShifterSession {
    id: string;
    date: string;
    currentStep: string;
    stuckSituation: string;
    perspectives: Perspective[];
    synthesis: string;
    realityCheckRefinement: string;
    dailyTracking: Record<string, { rating: number; note: string }>;
}

export type PolarityMapperStep = 'INTRODUCTION' | 'DEFINE_DILEMMA' | 'POLE_A_UPSIDE' | 'POLE_A_DOWNSIDE' | 'POLE_B_UPSIDE' | 'POLE_B_DOWNSIDE' | 'REVIEW' | 'COMPLETE';
  
export interface PolarityMap {
    id: string;
    date: string;
    dilemma: string;
    poleA_name: string;
    poleA_upside: string;
    poleA_downside: string;
    poleB_name: string;
    poleB_upside: string;
    poleB_downside: string;
}

// FIX: Added PolarityMapDraft interface to include currentStep for wizard state.
export interface PolarityMapDraft extends Partial<PolarityMap> {
  currentStep: PolarityMapperStep;
}

export interface IntegratedInsight {
  id: string;
  mindToolType: 'Bias Detective' | 'Subject-Object Explorer' | 'Perspective-Shifter' | 'Polarity Mapper';
  mindToolSessionId: string;
  mindToolName: string;
  mindToolReport: string;
  mindToolShortSummary: string;
  detectedPattern: string;
  suggestedShadowWork: {
    practiceId: string;
    practiceName: string;
    rationale: string;
  }[];
  dateCreated: string;
  status: 'pending' | 'addressed';
  shadowWorkSessionsAddressed?: {
    shadowToolType: string;
    shadowSessionId: string;
    dateCompleted: string;
  }[];
}

export interface SomaticScriptSegment {
  instruction: string;
  duration_seconds: number;
}

export type SomaticPacing = 'slow' | 'moderate' | 'dynamic' | 'fluid';
export type SafetyLevel = 'strong' | 'moderate' | 'low'; // Added for somatic presets

export type SomaticPracticeType = 
  | 'Breath-Centered'           // Primary: Respiratory techniques
  | 'Progressive Relaxation'    // Systematic tension-release
  | 'Gentle Movement'           // Slow somatic exploration
  | 'Mindful Flow'              // Continuous meditative movement
  | 'Grounding & Stability'     // Anchoring, proprioceptive
  | 'Dynamic Activation';       // Energizing, circulation

export interface PracticeTypeInfo {
  name: SomaticPracticeType;
  description: string;
  primaryMechanism: string;
  bestFor: string[];
  evidenceBase: string;
  contraindications?: string[];
  exampleTechniques: string[];
}

export interface SomaticPracticeSession {
  id: string;
  date: string;
  title: string;
  intention: string;
  practiceType: SomaticPracticeType; // Changed from 'style'
  duration: number; // in minutes
  focusArea?: string; // e.g., "shoulders and neck", "lower back", "whole body"
  pacing?: SomaticPacing; // e.g., "slow", "moderate", "dynamic", "fluid"
  script: SomaticScriptSegment[];
  safetyNotes?: string[]; // AI-generated safety considerations
  validationWarnings?: ValidationWarning[]; // Store warnings from content validation
}

// For content validation
export type WarningType = 'Misleading claim' | 'Overpromising effect' | 'Pseudoscientific language' | 'Medical claim' | 'Overgeneralization' | 'Unverified construct' | 'Safety oversight';

export interface ValidationWarning {
  type: WarningType;
  issue: string; // The problematic phrase or concept
  suggestion: string; // How to rephrase or what to consider
}

export interface ValidationResult {
  isValid: boolean;
  warnings: ValidationWarning[];
}

export interface SomaticPreset {
  name: string;
  intention: string;
  practiceType: SomaticPracticeType; // Changed from 'style'
  duration: number;
  focusArea?: string;
  pacing?: SomaticPacing;
  description: string;
  evidenceLevel?: SafetyLevel;
  contraindications?: string[];
  safetyNotes?: string[];
  citations?: string[];
}

// Kegan Developmental Stage Assessment Types
export type KeganStage = 'Socialized Mind' | 'Socialized/Self-Authoring Transition' | 'Self-Authoring Mind' | 'Self-Authoring/Self-Transforming Transition' | 'Self-Transforming Mind';

export type KeganDomain = 'Relationships' | 'Work & Purpose' | 'Values & Beliefs' | 'Conflict & Feedback' | 'Identity & Self';

export interface KeganPrompt {
  id: string;
  domain: KeganDomain;
  prompt: string;
  instruction: string;
  stage3Indicator: string; // What Socialized Mind would say/do
  stage4Indicator: string; // What Self-Authoring Mind would say/do
  stage5Indicator: string; // What Self-Transforming Mind would say/do
}

export interface KeganResponse {
  promptId: string;
  domain: KeganDomain;
  response: string;
  aiAnalysis?: {
    likelyStage: KeganStage;
    reasoning: string;
    subjectObjectStructure: string; // What is subject vs object for this person
  };
}

export interface KeganAssessmentSession {
  id: string;
  date: string;
  responses: KeganResponse[];
  overallInterpretation?: {
    centerOfGravity: KeganStage;
    confidence: 'Low' | 'Medium' | 'High';
    domainVariation: Record<KeganDomain, KeganStage>; // Different stages in different domains
    developmentalEdge: string; // Where they're growing
    recommendations: string[];
    fullAnalysis: string;
  };
  selfReflection?: string; // After seeing results, what does the user think?
  notes?: string;
}

export type KeganAssessmentStep =
  | 'INTRODUCTION'
  | 'RELATIONSHIPS'
  | 'WORK_PURPOSE'
  | 'VALUES_BELIEFS'
  | 'CONFLICT_FEEDBACK'
  | 'IDENTITY_SELF'
  | 'ANALYSIS'
  | 'RESULTS'
  | 'REFLECTION';
