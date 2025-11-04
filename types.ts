// FIX: Removed erroneous file separator from the beginning of the file content.
// FIX: Removed self-import of 'ModuleKey' which was causing a name conflict.

export type ModuleKey = 'body' | 'mind' | 'spirit' | 'shadow';

export interface Practice {
  id: string;
  name: string;
  description: string;
  why: string;
  evidence: string;
  timePerWeek: number;
  roi: 'EXTREME' | 'VERY HIGH' | 'HIGH' | 'MEDIUM';
  difficulty: 'Trivial' | 'Very Low' | 'Low' | 'Low-Medium' | 'Medium' | 'Medium-High' | 'High';
  affectsSystem: string[];
  how: string[];
  customizationQuestion?: string;
  imageUrl?: string;
}

export interface CustomPractice extends Omit<Practice, 'customizationQuestion'> {
  isCustom: true;
  module: ModuleKey;
}

export type AllPractice = Practice | CustomPractice;

export interface ModuleInfo {
  name: string;
  color: string;
  textColor: string;
  borderColor: string;
  lightBg: string;
}

export interface PracticesData {
  body: Practice[];
  mind: Practice[];
  spirit: Practice[];
  shadow: Practice[];
}

export interface StarterStack {
    name: string;
    description: string;
    practices: string[];
    difficulty: string;
    // FIX: Corrected malformed 'aggressiveness' property.
    aggressiveness: string;
    why: string;
}

export interface StarterStacksData {
    [key: string]: StarterStack;
}

export type ActiveTab = 'dashboard' | 'stack' | 'browse' | 'tracker' | 'streaks' | 'recommendations' | 'aqal' | 'mind-tools' | 'shadow-tools' | 'library';

export interface CoachMessage {
  role: 'user' | 'coach';
  text: string;
}

// AQAL Report
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

// 3-2-1 Process
export interface ThreeTwoOneSession {
    id: string;
    date: string; // ISO string
    trigger: string;
    triggerDescription: string; // Step 1
    dialogue: string; // Step 2
    embodiment: string; // Step 3
    integration: string;
    aiSummary?: string;
    linkedInsightId?: string; // NEW: Link to an IntegratedInsight
}

// IFS
export type WizardPhase = 'IDENTIFY' | 'UNBLEND' | 'SELF_CHECK' | 'GET_TO_KNOW' | 'INTEGRATE' | 'CLOSING';

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
    lastActive: string; // ISO string
}

export interface IFSSession {
    id: string;
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
    linkedInsightId?: string; // NEW: Link to an IntegratedInsight
}

// Bias Detective
export type BiasDetectiveStep = 'DECISION' | 'REASONING' | 'DISCOVERY' | 'DISCOVERING' | 'DIAGNOSIS' | 'SCENARIOS' | 'COMMITMENT' | 'LEARNING' | 'COMPLETE';
export interface IdentifiedBias {
    name: string;
    howItWorks: string;
    questionToTest: string;
    userTestAnswer?: string;
    llmTestResponse?: string;
    isOperating?: boolean;
}
export interface DiscoveryAnswers {
  alternativesConsidered: string;
  informationSources: string;
  timePressure: string;
  emotionalState: string;
  influencers: string;
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
    currentStep: BiasDetectiveStep;
    decisionText: string;
    reasoning: string;
    identifiedBiases: IdentifiedBias[];
    alternativeFramings: string[];
    selectedFraming?: string;
    decisionShift?: string;
    oneThingToRemember?: string;
    nextTimeAction?: string;
    // NEW: Fields to store full context
    discoveryAnswers?: DiscoveryAnswers;
    diagnosis?: string;
    scenarios?: BiasScenario[];
}

// Subject-Object Explorer
export type SubjectObjectStep = 'RECOGNIZE_PATTERN' | 'TRUTH_FEELINGS' | 'NAME_SUBJECT' | 'EVIDENCE_SUBJECT' | 'TRACE_ORIGIN' | 'COST' | 'FIRST_OBSERVATION' | 'TRACK_WEEK' | 'REVIEW_VISIBLE' | 'SMALL_EXPERIMENT' | 'INTEGRATION_SHIFT' | 'ONGOING_PRACTICE' | 'COMPLETE';
export interface SubjectObjectSession {
    id: string;
    date: string;
    currentStep: SubjectObjectStep;
    pattern: string;
    truthFeelings: string;
    subjectToStatement: string;
    // FIX: Corrected the type for evidenceChecks from boolean to string to match its usage in textareas and for length checks.
    evidenceChecks: Record<string, string>;
    origin: string;
    cost: string;
    firstObservation: string;
    smallExperimentChosen?: string;
    dailyTracking: Record<string, string[]>;
    reviewInsights: string;
    integrationShift: string;
    ongoingPracticePlan: string[];
}

// Perspective Shifter
export type PerspectiveShifterStep = 'CHOOSE_SITUATION' | 'FIRST_PERSON' | 'SECOND_PERSON' | 'THIRD_PERSON' | 'WITNESS' | 'INTEGRATION_MAP' | 'SHIFT' | 'NEW_POSSIBILITY' | 'REALITY_CHECK' | 'TRACK_CONVERSATION' | 'COMPLETE';
export interface Perspective {
    type: 'First Person (You)' | 'Second Person (Them)' | 'Third Person (Observer)' | 'Witness (Pure Awareness)';
    description: string;
    llmReflection?: string;
}
export interface PerspectiveShifterSession {
    id: string;
    date: string;
    currentStep: PerspectiveShifterStep;
    stuckSituation: string;
    perspectives: Perspective[];
    synthesis?: string;
    shiftInsight?: string;
    newPossibility?: string;
    realityCheckRefinement?: string;
    dailyTracking: Record<string, string[]>;
}

// Polarity Mapper
export interface PolarityMap {
    id: string;
    date: string; // ISO string
    dilemma: string;
    poleA_name: string;
    poleA_upside: string;
    poleA_downside: string;
    poleB_name: string;
    poleB_upside: string;
    poleB_downside: string;
}
export type PolarityMapperStep = 'INTRODUCTION' | 'DEFINE_DILEMMA' | 'POLE_A_UPSIDE' | 'POLE_A_DOWNSIDE' | 'POLE_B_UPSIDE' | 'POLE_B_DOWNSIDE' | 'REVIEW' | 'COMPLETE';

// NEW: Integrated Insight interface
export interface IntegratedInsight {
  id: string; // Unique ID for the insight
  mindToolType: 'BiasDetective' | 'PerspectiveShifter' | 'SubjectObject' | 'PolarityMapper';
  mindToolSessionId: string;
  mindToolName: string; // e.g., "Bias Detective Session on 'Candidate A'"
  mindToolReport: string; // The full markdown report from the mind tool session
  mindToolShortSummary: string; // A concise, one-sentence summary for UI display
  detectedPattern: string; // The pattern detected by AI
  suggestedShadowWork: {
    practiceId: string; // e.g., 'three-two-one'
    practiceName: string; // e.g., '3-2-1 Process'
    rationale: string; // why it's relevant
  }[];
  dateCreated: string; // ISO string
  status: 'pending' | 'addressed' | 'deferred'; // pending, addressed (completed), or deferred (ignored)
  shadowWorkSessionsAddressed?: {
    shadowToolType: string; // e.g., '3-2-1 Process' or 'IFS'
    sessionId: string;
    dateCompleted: string; // ISO string
  }[];
}