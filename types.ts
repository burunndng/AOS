
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

/**
 * Enhanced AI Recommendation (Option B)
 * Structured recommendation with sequencing, guidance, and confidence
 */
export interface EnhancedRecommendation {
  id: string;
  practice: AllPractice;
  rationale: string;
  sequenceWeek: number;
  sequenceGuidance: string;
  expectedBenefits: string;
  integrationTips: string;
  timeCommitment: string;
  confidence: number; // 0.0 - 1.0
}

export interface EnhancedRecommendationSet {
  recommendations: EnhancedRecommendation[];
  overallGuidance: string;
  practiceSequence: string[];
  estimatedTimeToNoticeBenefit: string;
  confidence: number;
  generatedAt: Date;
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
  | 'spirit-tools'
  | 'library'
  | 'journal'
  | 'quiz'
  | 'journey';

/**
 * Navigation stack entry for tracking user navigation history (Phase 3)
 * Enables back button functionality and context preservation across tabs and wizards
 */
export interface NavigationEntry {
  tab: ActiveTab;
  activeWizard?: string | null;
  linkedInsightId?: string | null;
  timestamp: number;
}

export interface JourneyCard {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  interactionType: 'text' | 'drag-drop' | 'poll' | 'body-diagram' | 'quiz' | 'reflection';
  interactionData?: Record<string, any>;
  quizQuestion?: { question: string; options: string[]; correct: number };
}

export interface JourneyRegion {
  id: string;
  name: string;
  emoji: string;
  description: string;
  cards: JourneyCard[];
  unlocksAt?: number; // card index that unlocks this region
  unlockedPractices?: string[]; // practice IDs unlocked upon completion
}

export interface JourneyProgress {
  visitedRegions: string[];
  completedCards: string[];
  earnedBadges: string[];
  currentRegion?: string;
  currentCard?: string;
}

export interface CoachMessage {
  role: 'user' | 'coach';
  text: string;
}

export interface FaceItAnalysis {
  objectiveDescription: string; // What does the trigger do/act like?
  specificActions: string[]; // Specific behaviors or actions
  triggeredEmotions: string[]; // Emotions triggered by this quality
}

export interface DialogueEntry {
  role: 'user' | 'bot';
  text: string;
}

export interface EmbodimentAnalysis {
  embodimentStatement: string; // "I am..." statement from the quality's perspective
  somaticLocation: string; // Where is this felt in the body?
  coreMessage: string; // What is the core message of this quality?
}

export interface IntegrationPlan {
  reowningStatement: string; // How can you re-own this quality?
  actionableStep: string; // Specific action to integrate this insight
  relatedPracticeId?: string; // Link to practice for integration
}

export interface ThreeTwoOneSession {
  id: string;
  date: string;
  trigger: string;
  triggerDescription: string; // Legacy: kept for backward compatibility
  dialogue: string; // Legacy: kept for backward compatibility
  embodiment: string; // Legacy: kept for backward compatibility
  integration: string; // Legacy: kept for backward compatibility
  aiSummary?: string;
  linkedInsightId?: string;

  // New structured fields (Phase 5)
  faceItAnalysis?: FaceItAnalysis;
  dialogueTranscript?: DialogueEntry[]; // Chat interface transcription
  embodimentAnalysis?: EmbodimentAnalysis;
  integrationPlan?: IntegrationPlan;
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
  identifiedParts?: Array<{ name: string; role?: string }>;
}

export interface AqalReportData {
    summary: string;
    quadrantInsights: {
        I: string;
        It: string;
        We: string;
        Its: string;
    };
    quadrantScores?: {
        I: number;
        It: number;
        We: number;
        Its: number;
    };
    recommendations: string[];
    generatedAt?: string;
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
  mindToolType:
    | '3-2-1 Reflection'
    | 'IFS Session'
    | 'Bias Detective'
    | 'Bias Finder'
    | 'Subject-Object Explorer'
    | 'Perspective-Shifter'
    | 'Polarity Mapper'
    | 'Kegan Assessment'
    | 'Relational Pattern'
    | 'Role Alignment'
    | 'Big Mind Process'
    | 'Memory Reconsolidation'
    | 'Eight Zones'
    | 'Adaptive Cycle Mapper'
    | 'Adaptive Cycle Lens'
    | 'Somatic Practice'
    | 'Jhana Guide'
    | 'Meditation Finder'
    | 'Consciousness Graph'
    | 'Attachment Assessment'
    | 'Integral Body Plan'
    | 'Workout Program';
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
  suggestedNextSteps: {
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

  // Outcome tracking
  relatedPracticeSessions?: {
    practiceId: string;
    completionDates: string[];
    frequency: number;
  }[];
  practiceOutcome?: {
    practiceId: string;
    practiceFrequency: number;
    patternImprovement: 'improved' | 'stable' | 'worsened' | 'unknown';
    notes?: string;
  }[];
  patternEvolutionNotes?: string;

  // Transparency & Lineage Tracking
  lineageId?: string; // Reference to synthesisLineageService lineage record
  generatedBy?: 'grok' | 'gemini'; // Which AI model generated this insight
  confidenceScore?: number; // 0-1 confidence in the insight
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
  | 'REFLECTION'
  | 'POST_DIALOGUE';

// Kegan Post-Dialogue Probe Types
export type KeganProbeType =
  | 'CONTRADICTION'      // Probing for contradiction and nuance
  | 'SUBJECT_OBJECT'     // Testing Subject by making it Object
  | 'ASSUMPTIONS';       // Exploring boundaries of "Big Assumptions"

export interface KeganProbeExchange {
  id: string;
  probeType: KeganProbeType;
  question: string;
  userResponse?: string;
  aiAnalysis?: {
    subjectObjectReveal: string;  // What became visible about subject-object structure
    developmentalInsight: string; // What this reveals about current stage
    nextProbe?: string;           // Follow-up question if needed
  };
}

export interface KeganProbeSession {
  id: string;
  assessmentSessionId: string;   // Link back to original assessment
  date: string;
  exchanges: KeganProbeExchange[];
  integratedInsights?: {
    confirmedStage: KeganStage;
    refinedAnalysis: string;      // Updated understanding after probes
    edgeOfDevelopment: string;    // More precise developmental edge
    bigAssumptions: string[];     // Identified limiting assumptions
    subjectStructure: string[];   // What they're currently subject to
    objectStructure: string[];    // What they can reflect on
    recommendations: string[];    // Updated developmental recommendations
  };
}

// Attachment Assessment Types
export interface AttachmentAssessmentSession {
  id: string;
  date: string;
  answers: Record<string, number>; // Question ID -> response (1-7)
  scores: {
    anxiety: number;
    avoidance: number;
  };
  style: 'secure' | 'anxious' | 'avoidant' | 'fearful';
  description: string;
  notes?: string;
}

// Relational Pattern Tracking Types
export type RelationshipType = 'Romantic Partner' | 'Parent' | 'Child' | 'Sibling' | 'Friend' | 'Boss/Authority' | 'Colleague' | 'Direct Report' | 'Stranger/Public';

export interface RelationalPatternMessage {
  role: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export interface RelationshipContext {
  type: RelationshipType;
  personDescription?: string; // "my mother", "my partner Sarah", etc.
  triggerSituation?: string;
  yourReaction?: string;
  underlyingFear?: string;
  pattern?: string;
}

export interface RelationalPatternSession {
  id: string;
  date: string;
  conversation: RelationalPatternMessage[];
  relationships: RelationshipContext[];
  attachmentStyle?: 'secure' | 'anxious' | 'avoidant' | 'fearful' | null;
  analysis?: {
    corePatterns: string[]; // Recurring themes across relationships
    reactiveSignatures: string[]; // How reactivity shows up (withdrawal, anger, people-pleasing, etc.)
    relationshipSpecificPatterns: Record<RelationshipType, string>; // Different patterns in different contexts
    developmentalHypothesis: string; // Where this might come from
    shadowWork: string; // What needs integration
    recommendations: string[];
  };
  notes?: string;
}

// Role Alignment Session
export interface RoleAlignmentRole {
  name: string;
  why: string;
  goal: string;
  valueScore: number; // 1-10 alignment score
  valueNote: string;
  shadowNudge?: string;
  action?: string;
}

export interface RoleAlignmentSession {
  id: string;
  date: string;
  roles: RoleAlignmentRole[];
  integralNote?: string;
  aiIntegralReflection?: {
    integralInsight: string;
    quadrantConnections: string;
    recommendations: string[];
  };
}

// Jhana/Samadhi Tracking Types
export type JhanaLevel = '1st Jhana' | '2nd Jhana' | '3rd Jhana' | '4th Jhana' | '5th Jhana' | '6th Jhana' | '7th Jhana' | '8th Jhana' | 'Access Concentration' | 'Momentary Concentration';

export interface JhanaFactor {
  name: string;
  present: boolean;
  intensity: number; // 1-10
  notes?: string;
}

export type NimittaType = 'Visual Light' | 'Tactile Sensation' | 'Auditory' | 'Whole-Body' | 'Spatial' | 'None Yet' | 'Other';

export interface JhanaSession {
  id: string;
  date: string;
  practice: string; // What meditation practice
  duration: number; // minutes
  jhanaLevel: JhanaLevel;
  timeInState: number; // minutes in jhana/absorption

  // Five Jhana Factors (for 1st-4th)
  factors: {
    appliedAttention: JhanaFactor; // vitakka - directing attention
    sustainedAttention: JhanaFactor; // vicara - sustaining attention
    joy: JhanaFactor; // piti - energetic joy
    happiness: JhanaFactor; // sukha - contentment
    unification: JhanaFactor; // ekaggata - one-pointedness
  };

  // Nimitta/Sign
  nimittaPresent: boolean;
  nimittaType?: NimittaType;
  nimittaDescription?: string;
  nimittaStability?: number; // 1-10

  // Phenomenology
  bodyExperience: string; // How did body feel?
  mindQuality: string; // Quality of mind (bright, stable, spacious, etc.)
  hindrances?: string[]; // Any hindrances encountered

  // Progress Notes
  comparison?: string; // How does this compare to previous sits?
  insights?: string;
  difficulties?: string;
  questions?: string;
}

// ILP Graph Quiz Types
export type ILPGraphCategory = 'core' | 'body' | 'mind' | 'spirit' | 'shadow' | 'integral-theory';
export type QuizQuestionType = 'multiple-choice' | 'true-false' | 'matching' | 'ranking' | 'scenario';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface ILPGraphNode {
  id: string;
  label: string;
  category: ILPGraphCategory;
  description: string;
  importance: number; // 1-10
}

export interface QuizAnswer {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  category: ILPGraphCategory;
  difficulty: DifficultyLevel;
  question: string;
  description?: string;
  answers: QuizAnswer[];
  correctExplanation: string;
  relatedNodes: string[]; // IDs of related graph nodes
  points?: number;
}

export interface QuizResult {
  id: string;
  quizId: string;
  date: string;
  difficulty: DifficultyLevel;
  category: ILPGraphCategory;
  totalQuestions: number;
  correctAnswers: number;
  score: number; // percentage
  timeSpent: number; // seconds
  categoryBreakdown: Record<ILPGraphCategory, { correct: number; total: number }>;
  answers: {
    questionId: string;
    selectedAnswerId: string;
    isCorrect: boolean;
  }[];
}

export interface ILPGraphQuizSession {
  id: string;
  date: string;
  category: ILPGraphCategory;
  difficulty: DifficultyLevel;
  currentQuestionIndex: number;
  answers: { questionId: string; selectedAnswerId: string }[];
  startTime: number;
  results?: QuizResult;
}

// Big Mind Process Types
export type BigMindStage = 'VOICE_ID' | 'VOICE_DIALOGUE' | 'WITNESS' | 'INTEGRATION' | 'SUMMARY';

export interface BigMindVoice {
  id: string;
  name: string;
  isDefault: boolean;
  description?: string;
}

export interface BigMindMessage {
  id: string;
  role: 'user' | 'witness';
  text: string;
  voiceName?: string; // Name of voice speaking (for user messages)
  timestamp: string;
  stage: BigMindStage;
  isStreaming?: boolean;
}

export interface BigMindInsightSummary {
  primaryVoices: string[]; // Voice names identified
  witnessPerspective: string; // Key insight from witness
  integrationCommitments: string[]; // What user commits to
  recommendedPractices: {
    practiceId: string;
    practiceName: string;
    rationale: string;
    alreadyInStack: boolean;
  }[];
}

export interface BigMindSession {
  id: string;
  date: string;
  currentStage: BigMindStage;
  voices: BigMindVoice[];
  messages: BigMindMessage[];
  summary?: BigMindInsightSummary;
  linkedInsightId?: string;
  completedAt?: string;
}

// Bias Finder Types
export type BiasFinderPhase =
  | 'ONBOARDING'      // Phase 0: Target acquisition
  | 'PARAMETERS'      // Phase 1: Gather context
  | 'HYPOTHESIS'      // Phase 2: Select bias to investigate
  | 'INTERROGATION'   // Phase 3: Socratic questioning
  | 'DIAGNOSTIC'      // Phase 4: Confirmation & loop decision
  | 'REPORT';         // Phase 5: Final report generation

export interface BiasFinderParameters {
  stakes: 'Low' | 'Medium' | 'High';
  timePressure: 'Ample' | 'Moderate' | 'Rushed';
  emotionalState: string; // Free text: e.g., "Calm", "Anxious", "Excited"
  decisionType?: 'hiring' | 'financial' | 'strategic' | 'interpersonal' | 'evaluation' | 'technical' | 'belief' | 'other'; // Type of decision for better bias detection
  context?: string; // Additional contextual information (e.g., "group meeting", "investment decision", "performance review")
}

export interface BiasHypothesis {
  biasId: string;
  biasName: string;
  confidence?: number; // 0-100, set after interrogation
  evidence?: string[]; // Collected during interrogation
  userConcurrence?: boolean; // Set in diagnostic phase
}

export interface BiasFinderMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  phase: BiasFinderPhase;
  timestamp: string;
}

export interface BiasFinderDiagnosticReport {
  decisionAnalyzed: string;
  parameters: BiasFinderParameters;
  biasesInvestigated: {
    biasId: string;
    biasName: string;
    confidence: number;
    keyFindings: string[];
    userConcurrence: boolean;
  }[];
  recommendations: string[];
  nextTimeChecklist: string[];
  generatedAt: string;
}

export interface BiasFinderSession {
  id: string;
  date: string;
  currentPhase: BiasFinderPhase;
  targetDecision: string; // The decision being analyzed
  parameters?: BiasFinderParameters;
  hypotheses: BiasHypothesis[]; // List of biases to investigate
  currentHypothesisIndex: number; // Which bias is being investigated
  messages: BiasFinderMessage[];
  diagnosticReport?: BiasFinderDiagnosticReport;
  completedAt?: string;
}

// Integral Body Architect Types
export type IntegralBodyArchitectStep = 'BLUEPRINT' | 'SYNTHESIS' | 'DELIVERY' | 'HANDOFF';

export type YinPracticeGoal = 'reduce-stress' | 'increase-focus' | 'wind-down' | 'increase-energy' | 'balance';

export interface TimeWindow {
  dayOfWeek: string;
  startHour: number;
  endHour: number;
}

export interface InjuryRestriction {
  bodyPart: string;
  severity: 'mild' | 'moderate' | 'severe';
  restrictions: string[]; // e.g., "no overhead pressing", "avoid running"
  affectedMovements?: string[]; // e.g., ['squatting', 'overhead pressing', 'running']
  painLevel?: number; // 1-10 scale
  medicalClearance?: boolean; // Has doctor cleared for exercise?
  notes?: string;
}

export interface YangConstraints {
  // Core Biometrics (PHASE 1 - Essential)
  bodyweight?: number; // in kg
  height?: number; // in cm
  age?: number; // years
  sex?: 'male' | 'female' | 'other';
  activityLevel?: 'sedentary' | 'lightly-active' | 'moderately-active' | 'very-active' | 'athlete';

  // Training Background (PHASE 1)
  strengthTrainingExperience?: 'never' | 'beginner' | 'intermediate' | 'advanced';
  primaryGoal?: 'lose-fat' | 'gain-muscle' | 'recomp' | 'maintain' | 'performance' | 'general-health';

  // Session Constraints (PHASE 1)
  maxWorkoutDuration?: number; // minutes per session
  sleepHours?: number; // target hours per night
  equipment: string[];
  unavailableDays: string[];
  preferredWorkoutTimes?: ('morning' | 'afternoon' | 'evening')[];

  // Advanced Constraints (Existing)
  availableTimeWindows?: TimeWindow[]; // Optional: specific availability windows
  injuryRestrictions?: InjuryRestriction[]; // Optional: injury/pain restrictions
  nutritionFocus?: string;
  additionalConstraints?: string;

  // Body Composition (Optional)
  targetBodyComposition?: {
    currentBodyFat?: number; // percentage
    targetBodyFat?: number; // percentage
    targetWeight?: number; // kg
  };

  // Enhanced Nutrition (PHASE 2)
  nutritionDetails?: {
    targetCalories?: number; // kcal/day (if known by user)
    proteinGramsPerKg?: number; // e.g., 1.6-2.2 for muscle gain
    dietaryRestrictions?: string[]; // ['gluten-free', 'dairy-free', 'vegetarian', 'vegan']
    mealsPerDay?: number; // 2, 3, 4, 5+
    cookingSkill?: 'minimal' | 'basic' | 'intermediate' | 'advanced';
  };
}

export interface YinPreferences {
  goal: YinPracticeGoal;
  experienceLevel: 'Beginner' | 'Intermediate';
  intentions?: string[];
  additionalNotes?: string;
}

export interface WorkoutRoutine {
  name: string;
  exercises: {
    name: string;
    sets: number;
    reps: string;
    notes?: string;
  }[];
  duration: number; // minutes
  notes?: string;
}

export interface MealPlan {
  breakfast: { description: string; protein: number; };
  lunch: { description: string; protein: number; };
  dinner: { description: string; protein: number; };
  snacks?: { description: string; protein: number; };
  totalProtein: number;
  totalCalories?: number;
  notes?: string;
}

export interface SynergyNote {
  type: 'pairing-benefit' | 'conflict-warning' | 'timing-optimization' | 'constraint-note';
  message: string;
  relatedItems?: string[]; // Names of practices or activities this relates to
}

export interface YinPracticeDetail {
  name: string;
  practiceType: string; // e.g., "Coherent Breathing", "Qigong"
  duration: number; // minutes
  timeOfDay: string; // e.g., "Morning", "30min before bedtime"
  intention: string;
  instructions: string[];
  synergyNotes?: SynergyNote[]; // Why this practice works well in this plan
  schedulingConfidence?: number; // 0-100: How confident LLM is about this placement
}

export interface DayPlan {
  dayName: string; // e.g., "Monday"
  summary: string; // e.g., "Workout A | Morning Qigong | Meal Plan"
  workout?: WorkoutRoutine;
  yinPractices: YinPracticeDetail[];
  nutrition: MealPlan;
  sleepHygiene: string[];
  notes?: string;
  synergyMetadata?: {
    yangYinBalance: string; // e.g., "High intensity workout balanced with calming evening practice"
    restSpacingNotes?: string; // Notes about rest/recovery spacing
    constraintResolution?: string; // How conflicts were resolved
  };
}

export interface HistoricalComplianceSummary {
  totalPlansAnalyzed: number;
  averageWorkoutCompliance: number;
  averageYinCompliance: number;
  commonBlockers: string[];
  bestPerformingDayPatterns: string[];
  recommendedAdjustments: string[];
}

export interface PlanSynthesisMetadata {
  llmConfidenceScore: number; // 0-100: Overall confidence in the plan
  constraintConflicts: {
    type: string; // e.g., "injury-restriction", "unavailable-window", "rest-spacing"
    description: string;
    resolution: string; // How it was resolved
  }[];
  synergyScoring: {
    yangYinPairingScore: number; // 0-100: How well Yang/Yin are balanced
    restSpacingScore: number; // 0-100: How well rest is spaced
    overallIntegrationScore: number; // 0-100: Overall integration quality
  };
  fallbackOptions?: string[]; // Alternative scheduling if conflicts arise
}

export interface IntegralBodyPlan {
  id: string;
  date: string;
  weekStartDate: string; // ISO date string for the Monday of the plan
  goalStatement: string;
  yangConstraints: YangConstraints;
  yinPreferences: YinPreferences;
  weekSummary: string;
  dailyTargets: {
    proteinGrams: number;
    sleepHours: number;
    workoutDays: number;
    yinPracticeMinutes: number;
  };
  days: DayPlan[];
  shoppingList?: string[];
  synthesisMetadata?: PlanSynthesisMetadata; // Metadata about plan generation and constraints
  historicalContext?: HistoricalComplianceSummary; // Compliance history from previous plans
}

export interface IntegralBodyArchitectSession {
  id: string;
  date: string;
  currentStep: IntegralBodyArchitectStep;
  goalStatement?: string;
  yangConstraints?: YangConstraints;
  yinPreferences?: YinPreferences;
  generatedPlan?: IntegralBodyPlan;
}

// Insight Practice Map (Progress of Insight / 16 Ñanas) Types
export type InsightPhase = 'Pre-Vipassana' | 'Vipassana Begins' | 'Dark Night' | 'High Equanimity';

export interface InsightStage {
  stage: number;
  name: string;
  code: string;
  phase: InsightPhase;
  description: string;
  keyMarkers: string[];
  practiceTips: string[];
  duration: string;
  warnings?: string[];
}

export interface InsightStageLog {
  stageNumber: number;
  stageName: string;
  dateNoted: string;
  notes?: string;
  cycleNumber?: number;
}

export interface InsightChatMessage {
  id: string;
  role: 'user' | 'grok';
  text: string;
  timestamp: string;
}

export interface InsightPracticeMapSession {
  id: string;
  date: string;
  currentStage?: number; // Which stage the user thinks they're at
  stageHistory: InsightStageLog[]; // Log of stages they've been through
  cycleCount: number; // How many times through all 16 stages
  chatHistory: InsightChatMessage[];
  notes?: string;
}

// Plan History Types
export interface PlanDayFeedback {
  date: string; // ISO date string (YYYY-MM-DD)
  dayName: string; // e.g., "Monday"
  completedWorkout: boolean;
  completedYinPractices: string[]; // Array of practice names completed
  intensityFelt: number; // 1-10 scale
  energyLevel: number; // 1-10 scale
  blockers?: string; // Notes about what got in the way
  notes?: string; // General reflections
  timestamp: string; // ISO timestamp when feedback was logged
}

export interface PlanHistoryEntry {
  planId: string;
  planDate: string;
  weekStartDate: string;
  goalStatement: string;
  startedAt: string; // ISO timestamp when plan was activated
  dailyFeedback: PlanDayFeedback[]; // One entry per day
  aggregateMetrics?: {
    workoutComplianceRate: number; // % of planned workouts completed
    yinComplianceRate: number; // % of planned yin practices completed
    averageIntensity: number;
    averageEnergy: number;
    totalBlockerDays: number;
  };
  completedAt?: string; // ISO timestamp when plan was completed (end of week)
  status: 'active' | 'completed' | 'abandoned';
}

export interface PlanProgressByDay {
  [planId: string]: {
    [dateKey: string]: PlanDayFeedback; // dateKey is ISO date string
  };
}

// Personalization & Adaptive Tuning Types
export interface AdjustmentDirective {
  type: 'intensity-nudge' | 'yin-duration' | 'yang-spacing' | 'practice-swap' | 'time-shift' | 'recovery-boost' | 'load-reduction' | 'load-increase';
  description: string;
  rationale: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number; // 0-100
}

export interface InferredPreference {
  type: 'preferred-time' | 'high-compliance-modality' | 'low-compliance-modality' | 'energy-pattern' | 'blocker-pattern' | 'intensity-tolerance';
  value: string;
  frequency: number; // Times observed in history
  compliance?: number; // Compliance rate for this preference
  notes?: string;
}

export interface PersonalizationSummary {
  planCount: number;
  analysisPeriodDays: number;
  timeWeightedAverage: {
    workoutCompliance: number;
    yinCompliance: number;
    averageIntensity: number;
    averageEnergy: number;
  };
  adjustmentDirectives: AdjustmentDirective[];
  inferredPreferences: InferredPreference[];
  commonBlockers: string[];
  bestPerformingDayPatterns: string[];
  recommendedIntensityLevel: 'low' | 'moderate' | 'high';
  recommendedYinDuration: number; // minutes per day
  recommendedRecoveryDays: number;
  summary: string; // Human-readable summary of personalization insights
}

// Workout Architecture Types
export interface WorkoutExercise {
  name: string;
  sets: number;
  reps: string;
  duration?: number;
  tempo?: string;
  restSeconds?: number;
  notes?: string;
  modifications?: string[];
  formGuidance?: string[];
}

export interface GeneratedWorkout {
  id: string;
  name: string;
  intensity: 'light' | 'moderate' | 'intense';
  duration: number;
  equipment: string[];
  exercises: WorkoutExercise[];
  warmup?: {
    name: string;
    duration: number;
    description: string;
  };
  cooldown?: {
    name: string;
    duration: number;
    description: string;
  };
  muscleGroupsFocused: string[];
  caloriesBurned?: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  notes?: string;
  somaticGuidance?: string;
}

export interface WorkoutProgram {
  id: string;
  date: string;
  title: string;
  summary: string;
  workouts: GeneratedWorkout[];
  weekView?: Record<string, GeneratedWorkout>;
  personalizationNotes?: string;
  progressionRecommendations?: string[];
}

// Memory Reconsolidation Types
export type MemoryReconsolidationStep = 'ONBOARDING' | 'BELIEF_IDENTIFICATION' | 'CONTRADICTION_MINING' | 'JUXTAPOSITION' | 'GROUNDING' | 'INTEGRATION' | 'COMPLETE';

export type BeliefCategory = 'identity' | 'capability' | 'worthiness' | 'safety' | 'belonging' | 'possibility' | 'other';

export type AffectTone = 'shame' | 'fear' | 'anger' | 'sadness' | 'grief' | 'confusion' | 'mixed' | 'neutral';

export type NervousSystemCueType = 'breath' | 'body-sensation' | 'grounding' | 'resourcing' | 'movement' | 'sound';

export type GroundingModality = 'breath' | 'somatic' | 'cognitive' | 'relational' | 'environmental' | 'sound';

export type IntegrationChoiceType = 'embodied-action' | 'cognitive-reframe' | 'somatic-anchor' | 'relational-shift' | 'practice-stack';

/** Represents an implicit belief surfaced during session. */
export interface ImplicitBelief {
  id: string;
  belief: string; // The belief statement itself (e.g., "I'm not good enough")
  emotionalCharge: number; // 1-10 intensity scale
  category: BeliefCategory; // Categorization of belief type
  affectTone: AffectTone; // Emotional signature
  bodyLocation?: string; // Where held in body (e.g., "chest", "stomach")
  originStory?: string; // When/how belief formed
  limitingPatterns?: string[]; // Behaviors/thoughts this belief drives
  depth: 'surface' | 'moderate' | 'deep'; // How entrenched the belief is
}

/** Baseline and post-shift intensity tracking. */
export interface IntensityReading {
  baselineIntensity: number; // 1-10 scale at session start
  postIntensity?: number; // 1-10 scale after processing
  shiftPercentage?: number; // % change: ((post - baseline) / baseline) * 100
}

/** Contradictory evidence and resources for working with a belief. */
export interface ContradictionInsight {
  beliefId: string; // References the ImplicitBelief being worked with
  anchors: string[]; // Counter-evidence or lived examples contradicting the belief
  newTruths: string[]; // Alternative, more empowering perspectives
  regulationCues: string[]; // Somatic/cognitive resources (breath, grounding statements, sensations)
  juxtapositionPrompts: string[]; // Guided prompts for holding both old belief and new truth
  dateIdentified: string; // ISO timestamp when contradiction was mined
}

/** Metadata for a juxtaposition cycle step. */
export interface JuxtapositionCycleStep {
  stepNumber: number; // 1, 2, 3... for cycling through prompts
  prompt: string; // The juxtaposition prompt given to user
  userResponse?: string; // User's response to the prompt
  timestamp?: string; // When step was completed
  somaticNotations?: string; // Observations of body/nervous system state
}

/** A cycle of holding both belief and contradiction. */
export interface JuxtapositionCycle {
  id: string;
  beliefId: string; // The belief being worked with
  cycleNumber: number; // 1st, 2nd, 3rd cycle through prompts
  steps: JuxtapositionCycleStep[];
  intensity: IntensityReading; // Intensity before/after cycle
  completedAt?: string;
  notes?: string;
}

/** Grounding/regulation resource selected for nervous system support. */
export interface GroundingOption {
  id: string;
  name: string; // e.g., "5-4-3-2-1 Grounding", "Vagus Tapping", "Safe Place Visualization"
  modality: GroundingModality;
  description: string;
  duration: number; // seconds or minutes
  instructions: string[];
  cueType: NervousSystemCueType;
  supportedAffects: AffectTone[];
}

/** Integration practice selection for post-reconsolidation anchoring. */
export interface IntegrationSelection {
  id: string;
  practiceId: string; // References existing practice from constants
  practiceName: string;
  rationale: string; // Why this practice supports the new perspective
  frequency?: 'daily' | 'weekly' | 'as-needed';
  durationMinutes?: number;
  notes?: string;
}

/** Summary of session outcomes. */
export interface SessionCompletionSummary {
  intensityShift: number; // Change from baseline intensity (e.g., -2, 0, +1)
  integrationChoice: IntegrationChoiceType;
  selectedPractices: IntegrationSelection[];
  userInsights?: string; // User's own reflections on the shift
  nextStepRecommendations?: string[];
  notes?: string;
  completedAt?: string;
}

/** Main Memory Reconsolidation session data. */
export interface MemoryReconsolidationSession {
  id: string;
  date: string;
  currentStep: MemoryReconsolidationStep;
  implicitBeliefs: ImplicitBelief[];
  contradictionInsights: ContradictionInsight[];
  juxtapositionCycles: JuxtapositionCycle[];
  groundingOptions: GroundingOption[];
  selectedGrounding?: GroundingOption; // Currently active grounding resource
  integrationSelections: IntegrationSelection[];
  baselineIntensity: number; // Overall intensity at session start
  completionSummary?: SessionCompletionSummary;
  sessionNotes?: string;
  completedAt?: string;
  linkedInsightId?: string; // Link to IntegratedInsight for tracking patterns
}

/** Draft/in-progress Memory Reconsolidation session (extends Session with partial fields). */
export interface MemoryReconsolidationDraft extends Partial<MemoryReconsolidationSession> {
  currentStep: MemoryReconsolidationStep;
  id: string;
  date: string;
}

export type MemoryReconsolidationStep = 'ONBOARDING' | 'MEMORY_SELECTION' | 'BELIEF_EXTRACTION' | 'CONTRADICTION_MINING';

export interface MemoryReconsolidationSession {
  id: string;
  date: string;
  currentStep: MemoryReconsolidationStep;
  
  // ONBOARDING
  intention?: string;
  safetyAcknowledged?: boolean;
  baselineIntensity?: number;
  
  // MEMORY_SELECTION
  memoryTitle?: string;
  memoryEra?: string;
  keyEmotions?: string;
  bodySensations?: string;
  protectorStrategies?: string;
  sensoryAnchors?: string;
  memoryNarrative?: string;
  
  // BELIEF_EXTRACTION
  extractedBeliefs?: ImplicitBelief[];
  selectedBeliefIds?: string[];
  beliefExtractionError?: string;
  
  // CONTRADICTION_MINING
  contradictionSeeds?: string[];
  contradictionInsights?: ContradictionInsight[];
  juxtapositionPrompts?: string[];
  integrationGuidance?: string;
  contradictionMiningError?: string;
  
  completedAt?: string;
}

export interface GroundingOption {
  id: string;
  name: string;
  description: string;
  icon: string;
}

// 8 Zones of Knowing Types
export type EightZonesStep = 'ONBOARDING' | 'TOPIC_DEFINITION' | 'ZONE_1' | 'ZONE_2' | 'ZONE_3' | 'ZONE_4' | 'ZONE_5' | 'ZONE_6' | 'ZONE_7' | 'ZONE_8' | 'SYNTHESIS' | 'COMPLETE';

export interface ZoneDefinition {
  zoneNumber: number;
  quadrant: 'UL' | 'UR' | 'LL' | 'LR';
  perspective: 'inside' | 'outside';
  focus: string; // e.g., "Subjective Experience"
  keyQuestion: string; // e.g., "What is the direct, first-person experience?"
  methodologies: string[]; // e.g., ["Phenomenology", "Meditation", "Introspection"]
  description: string; // Detailed explanation of the zone
  examples: string[]; // Real-world examples
}

export interface ZoneAnalysis {
  zoneNumber: number;
  zoneFocus: string;
  userInput: string; // User's reflection/analysis for this zone
  aiEnhancement?: string; // AI-generated deeper insights
  keyInsights?: string[]; // Extracted key points
  generatedAt?: string;
}

export interface ZoneConnection {
  fromZone: number;
  toZone: number;
  relationship: string; // Describes how these zones relate
  bidirectional?: boolean;
}

export interface EightZonesSession {
  id: string;
  userId: string;
  date: string;
  focalQuestion: string; // The main topic/issue being analyzed
  focalQuestionContext?: string; // Additional context about the topic
  currentStep: EightZonesStep;

  // Analyses for each zone
  zoneAnalyses: Record<number, ZoneAnalysis>; // Key: zone number 1-8, Value: analysis data

  // AI-facilitated connection dialogues (new!)
  connectionReflections?: {
    zones: string; // e.g., "Zones 1-2"
    dialogue: DialogueEntry[]; // Re-use the { role: 'user' | 'bot', text: string } type
  }[];

  // Connections discovered between zones
  zoneConnections?: ZoneConnection[];

  // Synthesis data
  blindSpots?: string[]; // Missing perspectives revealed
  novelInsights?: string[]; // New understandings discovered
  recommendations?: string[]; // Actionable recommendations
  synthesisReport?: string; // Full integrated analysis

  // Session metadata
  completedAt?: string;
  draftSavedAt?: string;
}

export interface EightZonesDraft extends Partial<EightZonesSession> {
  id?: string;
  userId: string;
}

// ============================================================================
// Intelligence Hub Types - Unified AI Guidance System
// ============================================================================

export interface CompletionRecord {
  practiceId: string;
  date: string;
  completed: boolean;
}

export interface WizardSessionSummary {
  type: string;
  date: string;
  keyInsights: string[];
  sessionData?: any;
}

export interface IntelligenceContext {
  // Current state
  currentPracticeStack: AllPractice[];
  practiceNotes: Record<string, string>;
  completionHistory: CompletionRecord[];

  // Wizard sessions
  wizardSessions: WizardSessionSummary[];

  // Insights
  integratedInsights: IntegratedInsight[];
  pendingPatterns: string[];

  // User profile
  developmentalStage?: KeganStage;
  attachmentStyle?: string;
  primaryChallenges: string[];
}

export interface PracticeRecommendation {
  practice: AllPractice;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  startTiming?: string; // e.g., "Week 2, after 1 Polarity session"
  timeCommitment?: string; // e.g., "10 min/day for 7 days"
  integration?: string; // How to integrate with existing practices
  sequenceWeek?: number; // Which week to start this practice
  sequenceGuidance?: string; // When to start (e.g., "Week 2, after 1 Polarity session")
  expectedBenefits?: string; // Expected benefits from this practice
  integrationTips?: string; // Tips for integrating with existing practices
}

export interface PracticeAdjustment {
  practiceId: string;
  practiceName: string;
  suggestion: string;
}

export interface StackBalance {
  body: string;
  mind: string;
  spirit: string;
  shadow: string;
}

export interface WizardRecommendation {
  type: string;
  name: string;
  reason: string;
  focus: string;
  priority: 'high' | 'medium' | 'low';
  confidence?: number; // 0-1 scale
  evidence?: string[]; // [Session-ID], [Insight-ID]
  timing?: string; // e.g., "this_week", "next_week"
}

export interface IntelligentGuidance {
  synthesis: string; // Coherent narrative of where user is
  primaryFocus: string; // What matters most right now

  recommendations: {
    nextWizard?: WizardRecommendation;

    practiceChanges?: {
      add?: PracticeRecommendation[];
      remove?: string[];
      modify?: PracticeAdjustment[];
    };

    insightWork?: {
      pattern: string;
      approachSuggestion: string;
    };

    stackBalance?: StackBalance;
  };

  reasoning: {
    whatINoticed: string[];
    whyThisMatters: string[];
    howItConnects: string[];
  };

  cautions: string[];
  generatedAt: string;
  rawMarkdown?: string; // Full markdown response for UI rendering
}

export interface CachedGuidance {
  guidance: IntelligentGuidance;
  cachedAt: number; // timestamp
  contextHash: string; // hash of context to detect changes
}

// ============================================================================
// Confidence Validation & Tonal Shifts
// ============================================================================

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

// ============================================================================
// Adaptive Cycle Wizard Types
// ============================================================================

// Optional user self-assessment (used as "hint" for AI, not a hard diagnosis)
export interface AdaptiveCycleDiagnosticAnswers {
  potential: number; // Score from 1-10 (Low to High)
  connectedness: number; // Score from 1-10 (Low to High)
  resilience: number; // Score from 1-10 (Low to High)
}

// Content for a single quadrant on the Adaptive Cycle map
export interface AdaptiveCycleQuadrantAnalysis {
  phase: 'r' | 'K' | 'Ω' | 'α';
  title: string; // e.g., "Growth / Exploitation (r)"
  points: string[]; // 3-5 specific bullet points for this quadrant
}

export interface AdaptiveCycleSession {
  id: string;
  date: string;
  systemToAnalyze: string; // The user's context, e.g., "My Career"
  // Optional self-assessment from the user (used as hint for AI)
  userHint?: AdaptiveCycleDiagnosticAnswers;
  // The main data: the full, four-quadrant map
  cycleMap: {
    r: AdaptiveCycleQuadrantAnalysis;
    K: AdaptiveCycleQuadrantAnalysis;
    Ω: AdaptiveCycleQuadrantAnalysis;
    α: AdaptiveCycleQuadrantAnalysis;
  };
  // This will be used for the rich report in the insight journal
  fullReport?: string;
}

