import React, { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { Menu, X } from 'lucide-react';

// Core Components (always loaded)
import NavSidebar from './components/NavSidebar.tsx';
import FlabbergasterPortal from './components/FlabbergasterPortal.tsx';
import LoadingFallback, { TabLoadingFallback, WizardLoadingFallback, ModalLoadingFallback } from './components/LoadingFallback.tsx';

// Lazy-loaded Core Enhancements
const Coach = lazy(() => import('./components/Coach.tsx'));

// Lazy-loaded Tab Components
const DashboardTab = lazy(() => import('./components/DashboardTab.tsx'));
const StackTab = lazy(() => import('./components/StackTab.tsx'));
const BrowseTab = lazy(() => import('./components/BrowseTab.tsx'));
const TrackerTab = lazy(() => import('./components/TrackerTab.tsx'));
const StreaksTab = lazy(() => import('./components/StreaksTab.tsx'));
const RecommendationsTab = lazy(() => import('./components/RecommendationsTab.tsx'));
const AqalTab = lazy(() => import('./components/AqalTab.tsx'));
const MindToolsTab = lazy(() => import('./components/MindToolsTab.tsx'));
const ShadowToolsTab = lazy(() => import('./components/ShadowToolsTab.tsx'));
const BodyToolsTab = lazy(() => import('./components/BodyToolsTab.tsx'));
const SpiritToolsTab = lazy(() => import('./components/SpiritToolsTab.tsx'));
const LibraryTab = lazy(() => import('./components/LibraryTab.tsx'));
const JournalTab = lazy(() => import('./components/JournalTab.tsx'));
const JourneyTab = lazy(() => import('./components/JourneyTab.tsx'));
const ILPGraphQuiz = lazy(() => import('./components/ILPGraphQuiz.tsx').then(module => ({ default: module.ILPGraphQuiz })));

// Lazy-loaded Modal Components
const PracticeInfoModal = lazy(() => import('./components/PracticeInfoModal.tsx'));
const PracticeExplanationModal = lazy(() => import('./components/PracticeExplanationModal.tsx'));
const PracticeCustomizationModal = lazy(() => import('./components/PracticeCustomizationModal.tsx'));
const CustomPracticeModal = lazy(() => import('./components/CustomPracticeModal.tsx'));
const GuidedPracticeGenerator = lazy(() => import('./components/GuidedPracticeGenerator.tsx'));

// Lazy-loaded Wizard Components
const ThreeTwoOneWizard = lazy(() => import('./components/ThreeTwoOneWizard.tsx'));
const IFSWizard = lazy(() => import('./components/IFSWizard.tsx'));
const BiasDetectiveWizard = lazy(() => import('./components/BiasDetectiveWizard.tsx'));
const BiasFinderWizard = lazy(() => import('./components/BiasFinderWizard.tsx'));
const SubjectObjectWizard = lazy(() => import('./components/SubjectObjectWizard.tsx'));
const PerspectiveShifterWizard = lazy(() => import('./components/PerspectiveShifterWizard.tsx'));
const PolarityMapperWizard = lazy(() => import('./components/PolarityMapperWizard.tsx'));
const SomaticGeneratorWizard = lazy(() => import('./components/SomaticGeneratorWizard.tsx'));
const KeganAssessmentWizard = lazy(() => import('./components/KeganAssessmentWizard.tsx'));
const RelationalPatternChatbot = lazy(() => import('./components/RelationalPatternChatbot.tsx'));
const JhanaTracker = lazy(() => import('./components/JhanaTracker.tsx'));
const MeditationWizard = lazy(() => import('./components/MeditationWizard.tsx'));
const ConsciousnessGraph = lazy(() => import('./components/ConsciousnessGraph.tsx'));
const RoleAlignmentWizard = lazy(() => import('./components/RoleAlignmentWizard.tsx'));
const EightZonesWizard = lazy(() => import('./components/EightZonesWizard.tsx'));
const BigMindProcessWizard = lazy(() => import('./components/BigMindProcessWizard.tsx'));
const IntegralBodyArchitectWizard = lazy(() => import('./components/IntegralBodyArchitectWizard.tsx'));
const DynamicWorkoutArchitectWizard = lazy(() => import('./components/DynamicWorkoutArchitectWizard.tsx'));
const InsightPracticeMapWizard = lazy(() => import('./components/InsightPracticeMapWizard.tsx'));
const MemoryReconsolidationWizard = lazy(() => import('./components/MemoryReconsolidationWizard.tsx'));


// Constants & Types
import {
  ActiveTab,
  AllPractice,
  Practice,
  CustomPractice,
  ModuleKey,
  ThreeTwoOneSession,
  IFSSession,
  IFSPart,
  BiasDetectiveSession,
  BiasFinderSession,
  SubjectObjectSession,
  PerspectiveShifterSession,
  PolarityMap,
  AqalReportData,
  IntegratedInsight,
  SomaticPracticeSession,
  PolarityMapDraft, // FIX: Imported PolarityMapDraft
  KeganAssessmentSession,
  RelationalPatternSession,
  JhanaSession,
  JourneyProgress,
  AttachmentAssessmentSession,
  BigMindSession,
  IntegralBodyPlan,
  PlanHistoryEntry,
  PlanProgressByDay,
  PersonalizationSummary,
  WorkoutProgram,
  MemoryReconsolidationSession,
  MemoryReconsolidationDraft,
  EightZonesSession,
  EightZonesDraft
} from './types.ts';
import { practices as corePractices, starterStacks, modules } from './constants.ts'; // FIX: Moved import to prevent re-declaration.


// Services
import * as geminiService from './services/geminiService.ts';
import * as ragService from './services/ragService.ts';
import { generateInsightFromSession } from './services/insightGenerator.ts';
import { createBigMindIntegratedInsight } from './services/bigMindService.ts';
import { logPlanDayFeedback, calculatePlanAggregates, mergePlanWithTracker } from './utils/planHistoryUtils.ts';
import { analyzeHistoryAndPersonalize } from './services/integralBodyPersonalization.ts';

// Custom Hook for Local Storage
function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (!item) return initialValue;

      // Try to parse as JSON first
      try {
        return JSON.parse(item);
      } catch {
        // If JSON.parse fails, handle legacy plain string format
        // For userId, just return the plain string
        if (key === 'userId') {
          return item as unknown as T;
        }
        // For other keys, return initial value
        return initialValue;
      }
    } catch (error) {
      console.error(`[useLocalStorage] Error with key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

export default function App() {
  const [activeTab, setActiveTab] = useLocalStorage<ActiveTab>('activeTab', 'dashboard');
  const [highlightPracticeId, setHighlightPracticeId] = useState<string | null>(null);

  // Clear highlight when changing tabs
  useEffect(() => {
    if (activeTab !== 'browse') {
      setHighlightPracticeId(null);
    }
  }, [activeTab]);

  // RAG System & User Context
  const [userId] = useLocalStorage<string>('userId', (() => {
    const newId = `user-${Math.random().toString(36).substr(2, 9)}`;
    return newId;
  })());

  // Core Data
  const [practiceStack, setPracticeStack] = useLocalStorage<AllPractice[]>('practiceStack', []);
  const [practiceNotes, setPracticeNotes] = useLocalStorage<Record<string, string>>('practiceNotes', {});
  const [dailyNotes, setDailyNotes] = useLocalStorage<Record<string, string>>('dailyNotes', {});
  const [completionHistory, setCompletionHistory] = useLocalStorage<Record<string, string[]>>('completionHistory', {});
  
  // Session Drafts
  const [draft321, setDraft321] = useLocalStorage<Partial<ThreeTwoOneSession> | null>('draft321', null);
  const [draftIFS, setDraftIFS] = useLocalStorage<IFSSession | null>('draftIFS', null);
  const [draftBias, setDraftBias] = useLocalStorage<BiasDetectiveSession | null>('draftBias', null);
  const [draftBiasFinder, setDraftBiasFinder] = useLocalStorage<BiasFinderSession | null>('draftBiasFinder', null);
  const [draftSO, setDraftSO] = useLocalStorage<SubjectObjectSession | null>('draftSO', null);
  const [draftPS, setDraftPS] = useLocalStorage<PerspectiveShifterSession | null>('draftPS', null);
  // FIX: Updated draftPM to use PolarityMapDraft type.
  const [draftPM, setDraftPM] = useLocalStorage<PolarityMapDraft | null>('draftPM', null);
  const [draftKegan, setDraftKegan] = useLocalStorage<KeganAssessmentSession | null>('draftKegan', null);
  const [draftRelational, setDraftRelational] = useLocalStorage<RelationalPatternSession | null>('draftRelational', null);
  const [draftBigMind, setDraftBigMind] = useLocalStorage<Partial<BigMindSession> | null>('draftBigMind', null);
  const [draftMemoryRecon, setDraftMemoryRecon] = useLocalStorage<MemoryReconsolidationDraft | null>('memoryReconDraft', null);
  const [draftEightZones, setDraftEightZones] = useLocalStorage<EightZonesDraft | null>('draftEightZones', null);

  // Session History
  const [history321, setHistory321] = useLocalStorage<ThreeTwoOneSession[]>('history321', []);
  const [historyIFS, setHistoryIFS] = useLocalStorage<IFSSession[]>('historyIFS', []);
  const [historyBias, setHistoryBias] = useLocalStorage<BiasDetectiveSession[]>('historyBias', []);
  const [historyBiasFinder, setHistoryBiasFinder] = useLocalStorage<BiasFinderSession[]>('historyBiasFinder', []);
  const [historySO, setHistorySO] = useLocalStorage<SubjectObjectSession[]>('historySO', []);
  const [historyPS, setHistoryPS] = useLocalStorage<PerspectiveShifterSession[]>('historyPS', []);
  const [historyPM, setHistoryPM] = useLocalStorage<PolarityMap[]>('historyPM', []);
  const [historyKegan, setHistoryKegan] = useLocalStorage<KeganAssessmentSession[]>('historyKegan', []);
  const [historyRelational, setHistoryRelational] = useLocalStorage<RelationalPatternSession[]>('historyRelational', []);
  const [historyJhana, setHistoryJhana] = useLocalStorage<JhanaSession[]>('historyJhana', []);
  const [memoryReconHistory, setMemoryReconHistory] = useLocalStorage<MemoryReconsolidationSession[]>('memoryReconHistory', []);
  const [eightZonesHistory, setEightZonesHistory] = useLocalStorage<EightZonesSession[]>('eightZonesHistory', []);
  const [partsLibrary, setPartsLibrary] = useLocalStorage<IFSPart[]>('partsLibrary', []);
  const [somaticPracticeHistory, setSomaticPracticeHistory] = useLocalStorage<SomaticPracticeSession[]>('somaticPracticeHistory', []);
  const [historyAttachment, setHistoryAttachment] = useLocalStorage<AttachmentAssessmentSession[]>('historyAttachment', []);
  const [historyBigMind, setHistoryBigMind] = useLocalStorage<BigMindSession[]>('historyBigMind', []);
  const [integralBodyPlans, setIntegralBodyPlans] = useLocalStorage<IntegralBodyPlan[]>('integralBodyPlans', []);
  const [workoutPrograms, setWorkoutPrograms] = useLocalStorage<WorkoutProgram[]>('workoutPrograms', []);
  
  // Plan History State
  const [integralBodyPlanHistory, setIntegralBodyPlanHistory] = useLocalStorage<PlanHistoryEntry[]>('integralBodyPlanHistory', []);
  const [planProgressByDay, setPlanProgressByDay] = useLocalStorage<PlanProgressByDay>('planProgressByDay', {});
  const [currentPersonalizationSummary, setCurrentPersonalizationSummary] = useState<PersonalizationSummary | null>(null);
  
  // AI-generated data
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [aqalReport, setAqalReport] = useLocalStorage<AqalReportData | null>('aqalReport', null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  
  // Modals state
  const [activeWizard, setActiveWizard] = useLocalStorage<string | null>('activeWizard', null);
  const [linkedInsightId, setLinkedInsightId] = useState<string | undefined>(undefined);
  const [infoModalPractice, setInfoModalPractice] = useState<Practice | null>(null);
  const [explanationModal, setExplanationModal] = useState<{ isOpen: boolean; title: string; explanation: string }>({ isOpen: false, title: '', explanation: '' });
  const [customizationModalPractice, setCustomizationModalPractice] = useState<Practice | null>(null);
  const [isCustomPracticeModalOpen, setIsCustomPracticeModalOpen] = useState(false);
  const [isGuidedPracticeGeneratorOpen, setIsGuidedPracticeGeneratorOpen] = useState(false);
  const [bodyArchitectHandoff, setBodyArchitectHandoff] = useState<{ type: 'yin' | 'yang'; payload: any } | null>(null);
  const [workoutHandoffSource, setWorkoutHandoffSource] = useState<'integral-body' | 'standalone' | null>(null);
  
  // Integrated Insights
  const [integratedInsights, setIntegratedInsights] = useLocalStorage<IntegratedInsight[]>('integratedInsights', []);

  // Journey Progress
  const [journeyProgress, setJourneyProgress] = useLocalStorage<JourneyProgress>('journeyProgress', {
    visitedRegions: [],
    completedCards: [],
    earnedBadges: [],
  });

  // Flabbergaster Easter Egg
  const [isFlabbergasterPortalOpen, setIsFlabbergasterPortalOpen] = useLocalStorage<boolean>('isFlabbergasterPortalOpen', false);
  const [hasUnlockedFlabbergaster, setHasUnlockedFlabbergaster] = useLocalStorage<boolean>('hasUnlockedFlabbergaster', false);
  const [hasDiscoveredHiddenMode, setHasDiscoveredHiddenMode] = useLocalStorage<boolean>('hasDiscoveredHiddenMode', false);

  // Mobile sidebar toggle
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const onSummonFlabbergaster = () => {
    console.log('🌑 onSummonFlabbergaster called! Current state:', isFlabbergasterPortalOpen);
    setIsFlabbergasterPortalOpen(prev => {
      console.log('🌑 Toggling portal state from', prev, 'to', !prev);
      return !prev;
    });
    if (!hasUnlockedFlabbergaster) {
      setHasUnlockedFlabbergaster(true);
      console.log('🌑 Marked Flabbergaster as unlocked');
    }
  };

  const onHiddenModeDiscovered = () => {
    if (!hasDiscoveredHiddenMode) {
      setHasDiscoveredHiddenMode(true);
      console.log('🌈 Prismatic Flux mode discovered!');
    }
  };

  const setActiveWizardAndLink = (wizardName: string | null, insightId?: string) => {
    setActiveWizard(wizardName);
    setLinkedInsightId(insightId);
  }

  const findModuleKey = useCallback((practiceId: string): ModuleKey => {
    const practice = practiceStack.find(p => p.id === practiceId);
    if (practice && 'isCustom' in practice && practice.isCustom) {
      return practice.module;
    }
    for (const key in corePractices) {
      if (corePractices[key as ModuleKey].some(p => p.id === practiceId)) {
        return key as ModuleKey;
      }
    }
    return 'mind'; // Default
  }, [practiceStack]);

  const addToStack = (practice: Practice) => {
    if (!practiceStack.some(p => p.id === practice.id)) {
      setPracticeStack(prev => [...prev, practice]);
      setActiveTab('stack');
    }
  };

  const removeFromStack = (practiceId: string) => {
    setPracticeStack(prev => prev.filter(p => p.id !== practiceId));
  };
  
  const handleSaveCustomPractice = (practice: CustomPractice, module: ModuleKey) => {
    setPracticeStack(prev => [...prev, { ...practice, module }]);
    setIsCustomPracticeModalOpen(false);
  };

  const updatePracticeNote = (practiceId: string, note: string) => {
    setPracticeNotes(prev => ({ ...prev, [practiceId]: note }));
  };
  
  const updateDailyNote = (practiceId: string, note: string) => {
    const todayKey = new Date().toISOString().split('T')[0];
    setDailyNotes(prev => ({ ...prev, [`${practiceId}-${todayKey}`]: note }));
  };

  const today = new Date().toISOString().split('T')[0];
  const completedToday = Object.entries(completionHistory)
    .filter(([_, dates]) => dates.includes(today))
    .reduce((acc, [id, _]) => ({ ...acc, [id]: true }), {});
  
  const togglePracticeCompletion = (practiceId: string) => {
    setCompletionHistory(prev => {
      const history = prev[practiceId] || [];
      const today = new Date().toISOString().split('T')[0];
      if (history.includes(today)) {
        return { ...prev, [practiceId]: history.filter(d => d !== today) };
      } else {
        return { ...prev, [practiceId]: [...history, today] };
      }
    });
  };

  const applyStarterStack = (practiceIds: string[]) => {
    const practicesToAdd = Object.values(corePractices).flat().filter(p => practiceIds.includes(p.id));
    setPracticeStack(practicesToAdd);
    setActiveTab('stack');
  };
  
  const getContextForAI = () => {
    const stackInfo = practiceStack.map(p => `- ${p.name}: ${practiceNotes[p.id] || 'No notes.'}`).join('\n');
    const completionInfo = `Completed today: ${Object.values(completedToday).filter(Boolean).length}/${practiceStack.length}`;
    return `Current Stack:\n${stackInfo}\n\n${completionInfo}`;
  };

  const generateRecommendations = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const recs = await geminiService.generateRecommendations(getContextForAI());
      setRecommendations(recs);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Failed to get recommendations.");
    } finally {
      setAiLoading(false);
    }
  };

  const generateAqalReport = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const report = await geminiService.generateAqalReport(getContextForAI());
      setAqalReport(report);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Failed to generate AQAL report.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleExplainPractice = async (practice: Practice) => {
    setExplanationModal({ isOpen: true, title: practice.name, explanation: "Aura is thinking..." });
    try {
      const explanation = await geminiService.explainPractice(practice);
      setExplanationModal({ isOpen: true, title: practice.name, explanation });
    } catch (e) {
      setExplanationModal({ isOpen: true, title: practice.name, explanation: "Sorry, I couldn't generate an explanation." });
    }
  };

  const handlePersonalizePractice = async (practiceId: string, personalizedSteps: string[]) => {
    setPracticeStack(prev => prev.map(p => {
      if (p.id === practiceId) {
        return { ...p, how: personalizedSteps, name: `${p.name} (Personalized)` };
      }
      return p;
    }));
    setCustomizationModalPractice(null);
  };
  
  const getStreak = (practiceId: string) => {
      const dates = completionHistory[practiceId] || [];
      if (dates.length === 0) return 0;
      const sortedDates = [...new Set(dates)].sort().reverse();
      let streak = 0;
      let expectedDate = new Date();
      expectedDate.setHours(0,0,0,0);

      for(const dateStr of sortedDates) {
          const d = new Date(dateStr);
          d.setHours(0,0,0,0);
          if (d.getTime() === expectedDate.getTime()) {
              streak++;
              expectedDate.setDate(expectedDate.getDate() - 1);
          } else {
              break;
          }
      }
      return streak;
  }
  
  const handleSaveBiasSession = async (session: BiasDetectiveSession) => {
    setHistoryBias(prev => [...prev.filter(s => s.id !== session.id), session]);
    setDraftBias(null);
    setActiveWizard(null);
    const report = `# Bias Detective: ${session.decisionText}\n- Diagnosis: ${session.diagnosis}\n- Takeaway: ${session.oneThingToRemember}`;
    const summary = `Identified bias in decision: ${session.decisionText}`;
    try {
      const insight = await generateInsightFromSession({
        wizardType: 'Bias Detective',
        sessionId: session.id,
        sessionName: 'Bias Detective Session',
        sessionReport: report,
        sessionSummary: summary,
        userId,
        availablePractices: Object.values(corePractices).flat()
      });
      setIntegratedInsights(prev => [...prev, insight]);
    } catch (err) {
      console.error('[Bias Detective] Failed to generate insight:', err);
    }
  };

  const handleSaveBiasFinderSession = async (session: BiasFinderSession) => {
    setHistoryBiasFinder(prev => [...prev.filter(s => s.id !== session.id), session]);
    setDraftBiasFinder(null);
    setActiveWizard(null);
    const biasesSummary = session.hypotheses.filter(h => h.confidence).map(h => `${h.biasName} (${h.confidence}%)`).join(', ');
    const report = `# Bias Finder: ${session.targetDecision}\n- Biases Identified: ${biasesSummary}\n- Recommendations: ${session.diagnosticReport?.recommendations.join('; ') || 'N/A'}`;
    const summary = `Found ${session.hypotheses.filter(h => h.confidence).length} biases in decision`;
    try {
      const insight = await generateInsightFromSession({
        wizardType: 'Bias Finder',
        sessionId: session.id,
        sessionName: 'Bias Finder Session',
        sessionReport: report,
        sessionSummary: summary,
        userId,
        availablePractices: Object.values(corePractices).flat()
      });
      setIntegratedInsights(prev => [...prev, insight]);
    } catch (err) {
      console.error('[Bias Finder] Failed to generate insight:', err);
    }
  };

  const handleSaveSOSession = async (session: SubjectObjectSession) => {
    setHistorySO(prev => [...prev.filter(s => s.id !== session.id), session]);
    setDraftSO(null);
    setActiveWizard(null);
    const report = `# S-O Explorer: ${session.pattern}\n- Subject to: ${session.subjectToStatement}\n- Insight: ${session.integrationShift}`;
    const summary = `Pattern identified: ${session.pattern}`;
    try {
      const insight = await generateInsightFromSession({
        wizardType: 'Subject-Object Explorer',
        sessionId: session.id,
        sessionName: 'Subject-Object Session',
        sessionReport: report,
        sessionSummary: summary,
        userId,
        availablePractices: Object.values(corePractices).flat()
      });
      setIntegratedInsights(prev => [...prev, insight]);
    } catch (err) {
      console.error('[Subject-Object Explorer] Failed to generate insight:', err);
    }
  };

  const handleSavePSSession = async (session: PerspectiveShifterSession) => {
    setHistoryPS(prev => [...prev.filter(s => s.id !== session.id), session]);
    setDraftPS(null);
    setActiveWizard(null);
    const report = `# P-S Shifter: ${session.stuckSituation}\n- Synthesis: ${session.synthesis}\n- Action Plan: ${session.realityCheckRefinement}`;
    const summary = `Shifted perspective on: ${session.stuckSituation}`;
    try {
      const insight = await generateInsightFromSession({
        wizardType: 'Perspective-Shifter',
        sessionId: session.id,
        sessionName: 'Perspective-Shifter Session',
        sessionReport: report,
        sessionSummary: summary,
        userId,
        availablePractices: Object.values(corePractices).flat()
      });
      setIntegratedInsights(prev => [...prev, insight]);
    } catch (err) {
      console.error('[Perspective-Shifter] Failed to generate insight:', err);
    }
  };
  
  const handleSavePMSession = async (map: PolarityMap) => {
    setHistoryPM(prev => [...prev.filter(m => m.id !== map.id), map]);
    setDraftPM(null);
    setActiveWizard(null);
    const report = `# Polarity Map: ${map.dilemma}\n- Pole A: ${map.poleA_name}\n- Pole B: ${map.poleB_name}`;
    const summary = `Mapped dilemma: ${map.dilemma}`;
    try {
      const insight = await generateInsightFromSession({
        wizardType: 'Polarity Mapper',
        sessionId: map.id,
        sessionName: 'Polarity Mapper Session',
        sessionReport: report,
        sessionSummary: summary,
        userId,
        availablePractices: Object.values(corePractices).flat()
      });
      setIntegratedInsights(prev => [...prev, insight]);
    } catch (err) {
      console.error('[Polarity Mapper] Failed to generate insight:', err);
    }
  };

  const handleSaveKeganSession = async (session: KeganAssessmentSession) => {
    setHistoryKegan(prev => [...prev.filter(s => s.id !== session.id), session]);
    setDraftKegan(null);
    setActiveWizard(null);
    const report = `# Kegan Assessment\n- Stage: ${session.overallInterpretation?.centerOfGravity || 'Pending'}\n- Key Insights: ${JSON.stringify(session.responses).substring(0, 200)}`;
    const summary = `Development stage assessed: ${session.overallInterpretation?.centerOfGravity || 'Assessment completed'}`;
    try {
      const insight = await generateInsightFromSession({
        wizardType: 'Kegan Assessment',
        sessionId: session.id,
        sessionName: 'Kegan Assessment Session',
        sessionReport: report,
        sessionSummary: summary,
        userId,
        availablePractices: Object.values(corePractices).flat()
      });
      setIntegratedInsights(prev => [...prev, insight]);
    } catch (err) {
      console.error('[Kegan Assessment] Failed to generate insight:', err);
    }
  };

  const handleSaveAttachmentAssessment = async (session: AttachmentAssessmentSession) => {
    setHistoryAttachment(prev => [...prev.filter(s => s.id !== session.id), session]);
    setDraftRelational(null);
    setActiveWizard(null);

    const report = `# Attachment Assessment\n- Style: ${session.style}\n- Anxiety Score: ${session.scores.anxiety}\n- Avoidance Score: ${session.scores.avoidance}\n- Assessment Notes: ${session.notes || session.description}`;
    const summary = `Attachment style assessed: ${session.style} (anxiety: ${session.scores.anxiety}, avoidance: ${session.scores.avoidance})`;

    try {
      const insight = await generateInsightFromSession({
        wizardType: 'Attachment Assessment',
        sessionId: session.id,
        sessionName: 'Attachment Assessment Session',
        sessionReport: report,
        sessionSummary: summary,
        userId,
        availablePractices: Object.values(corePractices).flat()
      });
      setIntegratedInsights(prev => [...prev, insight]);
    } catch (err) {
      console.error('[Attachment Assessment] Failed to generate insight:', err);
    }
  };

  const handleSaveRelationalSession = async (session: RelationalPatternSession) => {
    setHistoryRelational(prev => [...prev.filter(s => s.id !== session.id), session]);
    setDraftRelational(null);
    setActiveWizard(null);
    const report = `# Relational Pattern\n- Context: ${session.conversation.slice(-3).map(m => m.text).join(' ')}`;
    const summary = `Relational pattern explored through dialogue`;
    try {
      const insight = await generateInsightFromSession({
        wizardType: 'Relational Pattern',
        sessionId: session.id,
        sessionName: 'Relational Pattern Session',
        sessionReport: report,
        sessionSummary: summary,
        userId,
        availablePractices: Object.values(corePractices).flat()
      });
      setIntegratedInsights(prev => [...prev, insight]);
    } catch (err) {
      console.error('[Relational Pattern] Failed to generate insight:', err);
    }
  };

  const handleSaveJhanaSession = (session: JhanaSession) => {
    setHistoryJhana(prev => [...prev.filter(s => s.id !== session.id), session]);
    setActiveWizard(null);
  };

  const handleSave321Session = async (session: ThreeTwoOneSession) => {
    setHistory321(prev => [...prev.filter(s => s.id !== session.id), session]);
    setDraft321(null);
    setActiveWizard(null);

    const report = `# 3-2-1 Reflection: ${session.trigger}\n- Trigger: ${session.triggerDescription}\n- Dialogue: ${session.dialogue}\n- Embodiment: ${session.embodiment}\n- Integration: ${session.integration}`;
    const summary = `Reflected on trigger: ${session.trigger}${session.aiSummary ? ` - ${session.aiSummary}` : ''}`;

    try {
      const insight = await generateInsightFromSession({
        wizardType: '3-2-1 Reflection',
        sessionId: session.id,
        sessionName: '3-2-1 Reflection Session',
        sessionReport: report,
        sessionSummary: summary,
        userId,
        availablePractices: Object.values(corePractices).flat()
      });
      setIntegratedInsights(prev => [...prev, insight]);
    } catch (err) {
      console.error('[3-2-1 Reflection] Failed to generate insight:', err);
    }
  };
  
  const handleSaveIFSSession = async (session: IFSSession) => {
    setHistoryIFS(prev => [...prev.filter(s => s.id !== session.id), session]);
    setDraftIFS(null);
    setActiveWizard(null);

    // Update parts library
    if (session.partId && session.partName) {
      const newPart: IFSPart = {
        id: session.partId, name: session.partName, role: session.partRole || 'Unknown',
        fears: session.partFears || 'Unknown', positiveIntent: session.partPositiveIntent || 'Unknown',
        lastSessionDate: session.date
      };
      setPartsLibrary(prev => {
        const existing = prev.find(p => p.id === newPart.id);
        if (existing) return prev.map(p => p.id === newPart.id ? newPart : p);
        return [...prev, newPart];
      });
    }

    // Generate insight from IFS session
    const transcriptSummary = session.transcript.slice(-5).map(t => t.text).join(' ');
    const report = `# IFS Session: ${session.partName}\n- Part: ${session.partName}${session.partRole ? ` (${session.partRole})` : ''}\n- Phase: ${session.currentPhase}\n- Dialogue: ${transcriptSummary}\n- Integration: ${session.integrationNote || 'Pending'}`;
    const summary = `Worked with part "${session.partName}" at phase: ${session.currentPhase}${session.summary ? ` - ${session.summary}` : ''}`;

    try {
      const insight = await generateInsightFromSession({
        wizardType: 'IFS Session',
        sessionId: session.id,
        sessionName: 'IFS Session',
        sessionReport: report,
        sessionSummary: summary,
        userId,
        availablePractices: Object.values(corePractices).flat()
      });
      setIntegratedInsights(prev => [...prev, insight]);
    } catch (err) {
      console.error('[IFS Session] Failed to generate insight:', err);
    }
  };
  
  const handleSaveSomaticPractice = (session: SomaticPracticeSession) => {
    setSomaticPracticeHistory(prev => [...prev.filter(s => s.id !== session.id), session]);
    alert(`Practice "${session.title}" saved! You can find it in your Library.`);
    setActiveTab('library');
  };

  const handleSaveIntegralBodyPlan = (plan: IntegralBodyPlan) => {
    setIntegralBodyPlans(prev => [...prev.filter(p => p.id !== plan.id), plan]);

    // Initialize history entry if it doesn't exist
    setIntegralBodyPlanHistory(prev => {
      const existingEntry = prev.find(entry => entry.planId === plan.id);
      if (existingEntry) {
        return prev.map(entry =>
          entry.planId === plan.id
            ? {
                ...entry,
                goalStatement: plan.goalStatement,
                planDate: plan.date,
                weekStartDate: plan.weekStartDate,
              }
            : entry,
        );
      }

      const newEntry: PlanHistoryEntry = {
        planId: plan.id,
        planDate: plan.date,
        weekStartDate: plan.weekStartDate,
        goalStatement: plan.goalStatement,
        startedAt: new Date().toISOString(),
        status: 'active',
        dailyFeedback: [],
      };

      return [...prev, newEntry];
    });

    setPlanProgressByDay(prev => ({
      ...prev,
      [plan.id]: prev[plan.id] || {},
    }));

    alert(`Your Integral Week has been saved! Access it from your Library.`);
  };

  const logPlanFeedback = useCallback((
    planId: string,
    dayDate: string,
    dayName: string,
    feedback: {
      completedWorkout: boolean;
      completedYinPractices: string[];
      intensityFelt: number;
      energyLevel: number;
      blockers?: string;
      notes?: string;
    }
  ) => {
    const plan = integralBodyPlans.find(p => p.id === planId);
    if (!plan) {
      console.error('Plan not found:', planId);
      return;
    }

    const result = logPlanDayFeedback(
      plan,
      dayDate,
      { ...feedback, dayName },
      integralBodyPlanHistory,
      planProgressByDay
    );

    setIntegralBodyPlanHistory(result.updatedHistory.map(entry =>
      entry.planId === planId ? calculatePlanAggregates(entry) : entry
    ));
    setPlanProgressByDay(result.updatedProgress);
  }, [integralBodyPlans, integralBodyPlanHistory, planProgressByDay]);

  const getPlanProgress = useCallback((planId: string): PlanHistoryEntry | null => {
    return integralBodyPlanHistory.find(entry => entry.planId === planId) || null;
  }, [integralBodyPlanHistory]);

  const updatePlanStatus = useCallback((planId: string, status: 'active' | 'completed' | 'abandoned') => {
    setIntegralBodyPlanHistory(prev => prev.map(entry => {
      if (entry.planId === planId) {
        return {
          ...entry,
          status,
          completedAt: status === 'completed' ? new Date().toISOString() : entry.completedAt,
        };
      }
      return entry;
    }));
  }, []);


  const generatePersonalizationSummary = useCallback(() => {
    const personalizationSummary = analyzeHistoryAndPersonalize(integralBodyPlanHistory);
    setCurrentPersonalizationSummary(personalizationSummary);
    
    // Log personalization insights in dev mode
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Personalization Analysis:', {
        planCount: personalizationSummary.planCount,
        analysisPeriodDays: personalizationSummary.analysisPeriodDays,
        timeWeightedCompliance: {
          workouts: personalizationSummary.timeWeightedAverage.workoutCompliance.toFixed(1) + '%',
          yinPractices: personalizationSummary.timeWeightedAverage.yinCompliance.toFixed(1) + '%',
        },
        adjustmentDirectives: personalizationSummary.adjustmentDirectives.map(d => d.description),
        inferredPreferences: personalizationSummary.inferredPreferences.map(p => `${p.type}: ${p.value}`),
      });
    }
    
    return personalizationSummary;
  }, [integralBodyPlanHistory]);

  // Auto-generate personalization when the Integral Body Architect wizard is opened
  useEffect(() => {
    if (activeWizard === 'integral-body-architect' && integralBodyPlanHistory.length > 0) {
      generatePersonalizationSummary();
    }
  }, [activeWizard, integralBodyPlanHistory, generatePersonalizationSummary]);

  const handleSaveBigMindSession = (session: BigMindSession) => {
    setHistoryBigMind(prev => [...prev.filter(s => s.id !== session.id), session]);
    setDraftBigMind(null);
    setActiveWizard(null);

    // Create integrated insight from the session
    if (session.summary) {
      const insight = createBigMindIntegratedInsight(session.id, session.summary);
      setIntegratedInsights(prev => [...prev, insight]);
    }
  };

  const handleSaveEightZonesSession = async (session: EightZonesSession) => {
    setEightZonesHistory(prev => [...prev.filter(s => s.id !== session.id), session]);
    setDraftEightZones(null);
    setActiveWizard(null);

    // Generate integrated insight for Journal
    if (session.synthesisReport) {
      const sessionReport = `# Eight Zones Analysis: ${session.focalQuestion}

${session.synthesisReport}

## Blind Spots
${session.blindSpots?.map(spot => `- ${spot}`).join('\n') || 'None identified'}

## Novel Insights
${session.novelInsights?.map(insight => `- ${insight}`).join('\n') || 'None identified'}

## Recommendations
${session.recommendations?.map(rec => `- ${rec}`).join('\n') || 'None identified'}`;

      try {
        const insight = await generateInsightFromSession({
          wizardType: 'Eight Zones',
          sessionId: session.id,
          sessionName: session.focalQuestion,
          sessionReport: sessionReport,
          sessionSummary: session.synthesisReport.substring(0, 200) + '...',
          userId: userId,
          availablePractices: Object.values(corePractices).flat(),
        });

        setIntegratedInsights(prev => [...prev, insight]);
      } catch (error) {
        console.error('Failed to generate insight for Eight Zones session:', error);
      }
    }
  };

  const handleLaunchYangPractice = (payload: any) => {
    // Store the handoff payload and switch to Dynamic Workout Architect
    setBodyArchitectHandoff({ type: 'yang', payload });
    setWorkoutHandoffSource('integral-body');
    setActiveWizard('dynamic-workout-architect');
  };

  const handleLaunchYinPractice = (payload: any) => {
    // Store the handoff payload (for future Yin practice launcher)
    setBodyArchitectHandoff({ type: 'yin', payload });
    // For now, just keep this handler available for future expansion
  };

  const handleSaveWorkoutProgram = (program: WorkoutProgram) => {
    setWorkoutPrograms(prev => [...prev.filter(p => p.id !== program.id), program]);
    // Clear handoff source after saving
    setWorkoutHandoffSource(null);
    setActiveWizard(null);
    alert(`Your personalized workout program has been saved!`);
  };

  const handleSaveMemoryReconSession = async (session: MemoryReconsolidationSession) => {
    setMemoryReconHistory(prev => [...prev.filter(s => s.id !== session.id), session]);
    setDraftMemoryRecon(null);
    setActiveWizard(null);

    const selectedBelief = session.implicitBeliefs[0];
    const shiftPercentage = session.completionSummary?.intensityShift
      ? Math.round((session.completionSummary.intensityShift / session.baselineIntensity) * -100)
      : 0;

    const report = `# Memory Reconsolidation: ${selectedBelief?.belief || 'N/A'}\n- Intensity Shift: ${shiftPercentage}%\n- Integration: ${session.completionSummary?.selectedPractices.map(p => p.practiceName).join(', ')}`;
    const summary = `Reconsolidated belief shift: ${shiftPercentage}%`;

    try {
      const insight = await generateInsightFromSession({
        wizardType: 'Memory Reconsolidation',
        sessionId: session.id,
        sessionName: 'Memory Reconsolidation Session',
        sessionReport: report,
        sessionSummary: summary,
        userId,
        availablePractices: Object.values(corePractices).flat()
      });
      setIntegratedInsights(prev => [...prev, insight]);
    } catch (err) {
      console.error('[Memory Reconsolidation] Failed to generate insight:', err);
    }

    alert('Memory Reconsolidation session saved! Your shift has been added to history.');
  };

  const markInsightAsAddressed = (insightId: string, shadowToolType: string, shadowSessionId: string) => {
    setIntegratedInsights(prev => prev.map(insight => {
        if (insight.id === insightId) {
            return {
                ...insight,
                status: 'addressed',
                shadowWorkSessionsAddressed: [
                    ...(insight.shadowWorkSessionsAddressed || []),
                    { shadowToolType, shadowSessionId, dateCompleted: new Date().toISOString() }
                ]
            };
        }
        return insight;
    }));
  };

  const handleExport = () => {
    const data = {
        // Core practice data
        practiceStack, practiceNotes, dailyNotes, completionHistory,

        // Session histories - all reflection and development tools
        history321, historyIFS, historyBias, historyBiasFinder, historySO, historyPS, historyPM,
        historyKegan, historyRelational, historyAttachment, historyBigMind, historyJhana,

        // Additional tracking data
        partsLibrary, somaticPracticeHistory, memoryReconHistory, eightZonesHistory,

        // Insights and reports
        integratedInsights, aqalReport, journeyProgress,

        // Integral body work
        integralBodyPlans, workoutPrograms, integralBodyPlanHistory, planProgressByDay
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aura-os-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target?.result as string);
                    if (window.confirm('This will overwrite all current data. Are you sure?')) {
                        // Core practice data
                        setPracticeStack(data.practiceStack || []);
                        setPracticeNotes(data.practiceNotes || {});
                        setDailyNotes(data.dailyNotes || {});
                        setCompletionHistory(data.completionHistory || {});

                        // Session histories - all reflection and development tools
                        setHistory321(data.history321 || []);
                        setHistoryIFS(data.historyIFS || []);
                        setHistoryBias(data.historyBias || []);
                        setHistoryBiasFinder(data.historyBiasFinder || []);
                        setHistorySO(data.historySO || []);
                        setHistoryPS(data.historyPS || []);
                        setHistoryPM(data.historyPM || []);
                        setHistoryKegan(data.historyKegan || []);
                        setHistoryRelational(data.historyRelational || []);
                        setHistoryAttachment(data.historyAttachment || []);
                        setHistoryBigMind(data.historyBigMind || []);
                        setHistoryJhana(data.historyJhana || []);

                        // Additional tracking data
                        setPartsLibrary(data.partsLibrary || []);
                        setSomaticPracticeHistory(data.somaticPracticeHistory || []);
                        setMemoryReconHistory(data.memoryReconHistory || []);
                        setEightZonesHistory(data.eightZonesHistory || []);

                        // Insights and reports
                        setIntegratedInsights(data.integratedInsights || []);
                        setAqalReport(data.aqalReport || null);
                        setJourneyProgress(data.journeyProgress || { visitedRegions: [], completedCards: [], earnedBadges: [] });

                        // Integral body work
                        setIntegralBodyPlans(data.integralBodyPlans || []);
                        setWorkoutPrograms(data.workoutPrograms || []);
                        setIntegralBodyPlanHistory(data.integralBodyPlanHistory || []);
                        setPlanProgressByDay(data.planProgressByDay || {});

                        alert('Data imported successfully!');
                    }
                } catch (err) {
                    alert('Error importing file. It may be corrupted.');
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
  };

  const handleReset = () => {
      if (window.confirm('ARE YOU SURE? This will delete all your data permanently and cannot be undone.')) {
          localStorage.clear();
          window.location.reload();
      }
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardTab openGuidedPracticeGenerator={() => setIsGuidedPracticeGeneratorOpen(true)} setActiveTab={setActiveTab} />;
      case 'stack': return <StackTab practiceStack={practiceStack} removeFromStack={removeFromStack} practiceNotes={practiceNotes} updatePracticeNote={updatePracticeNote} openCustomPracticeModal={() => setIsCustomPracticeModalOpen(true)} openGuidedPracticeGenerator={() => setIsGuidedPracticeGeneratorOpen(true)} />;
      case 'browse': return <BrowseTab practiceStack={practiceStack} addToStack={addToStack} onExplainClick={handleExplainPractice} onPersonalizeClick={setCustomizationModalPractice} highlightPracticeId={highlightPracticeId} />;
      case 'tracker': return <TrackerTab practiceStack={practiceStack} completedPractices={completedToday} togglePracticeCompletion={togglePracticeCompletion} dailyNotes={dailyNotes} updateDailyNote={updateDailyNote} findModuleKey={findModuleKey} />;
      case 'streaks': return <StreaksTab practiceStack={practiceStack} completionHistory={completionHistory} findModuleKey={findModuleKey} />;
      case 'recommendations': return <RecommendationsTab userId={userId} starterStacks={starterStacks} applyStarterStack={applyStarterStack} recommendations={recommendations} isLoading={aiLoading} error={aiError} onGenerate={generateRecommendations} integratedInsights={integratedInsights} allPractices={Object.values(corePractices).flat()} addToStack={addToStack} />;
      case 'aqal': return <AqalTab report={aqalReport} isLoading={aiLoading} error={aiError} onGenerate={generateAqalReport} />;
      case 'mind-tools': return <MindToolsTab
        setActiveWizard={setActiveWizardAndLink}
        attachmentAssessment={historyAttachment[historyAttachment.length - 1]}
        onCompleteAttachmentAssessment={handleSaveAttachmentAssessment}
        addToStack={addToStack}
        practiceStack={practiceStack}
      />;
      // FIX: Changed prop `setDraftIFSSession` to `setDraftIFS` to match the updated ShadowToolsTabProps interface.
      case 'shadow-tools': return <ShadowToolsTab onStart321={(id) => setActiveWizardAndLink('321', id)} onStartIFS={(id) => setActiveWizardAndLink('ifs', id)} onStartMemoryRecon={(id) => setActiveWizardAndLink('memory-reconsolidation', id)} setActiveWizard={setActiveWizardAndLink} sessionHistory321={history321} sessionHistoryIFS={historyIFS} memoryReconHistory={memoryReconHistory} draft321Session={draft321} draftIFSSession={draftIFS} draftMemoryRecon={draftMemoryRecon} setDraft321Session={setDraft321} setDraftIFS={setDraftIFS} partsLibrary={partsLibrary} markInsightAsAddressed={markInsightAsAddressed} />;
      case 'body-tools': return <BodyToolsTab
        setActiveWizard={setActiveWizardAndLink}
        integralBodyPlans={integralBodyPlans}
        workoutPrograms={workoutPrograms}
        planHistory={integralBodyPlanHistory}
        onLogPlanFeedback={logPlanFeedback}
        getPlanProgress={getPlanProgress}
        onUpdatePlanStatus={updatePlanStatus}
      />;
      case 'spirit-tools': return <SpiritToolsTab setActiveWizard={setActiveWizardAndLink} historyBigMind={historyBigMind} />;
      case 'library': return <LibraryTab />;
      case 'journal': return <JournalTab integratedInsights={integratedInsights} setActiveWizard={setActiveWizardAndLink} setActiveTab={setActiveTab} setHighlightPracticeId={setHighlightPracticeId} />;
      case 'quiz': return <ILPGraphQuiz />;
      case 'journey': return <JourneyTab journeyProgress={journeyProgress} updateJourneyProgress={setJourneyProgress} />;
      default: return <DashboardTab openGuidedPracticeGenerator={() => setIsGuidedPracticeGeneratorOpen(true)} setActiveTab={setActiveTab} />;
    }
  };

  const renderActiveWizard = () => {
    if (!activeWizard) return null;
    const insightContext = getActiveInsightContext();

    switch (activeWizard) {
      case '321':
        return (
          <ThreeTwoOneWizard
            onClose={() => setActiveWizard(null)}
            onSave={handleSave321Session}
            session={draft321}
            insightContext={insightContext}
            markInsightAsAddressed={markInsightAsAddressed}
          />
        );
      case 'ifs':
        return (
          <IFSWizard
            isOpen={true}
            onClose={(draft) => { setDraftIFS(draft); setActiveWizard(null); }}
            onSaveSession={handleSaveIFSSession}
            draft={draftIFS}
            partsLibrary={partsLibrary}
            insightContext={insightContext}
            markInsightAsAddressed={markInsightAsAddressed}
          />
        );
      case 'bias':
        return (
          <BiasDetectiveWizard
            userId={userId}
            onClose={() => setActiveWizard(null)}
            onSave={handleSaveBiasSession}
            session={draftBias}
            setDraft={setDraftBias}
          />
        );
      case 'biasfinder':
        return (
          <BiasFinderWizard
            onClose={() => setActiveWizard(null)}
            onSave={handleSaveBiasFinderSession}
            session={draftBiasFinder}
            setDraft={setDraftBiasFinder}
          />
        );
      case 'so':
        return (
          <SubjectObjectWizard
            onClose={() => setActiveWizard(null)}
            onSave={handleSaveSOSession}
            session={draftSO}
            setDraft={setDraftSO}
          />
        );
      case 'ps':
        return (
          <PerspectiveShifterWizard
            onClose={() => setActiveWizard(null)}
            onSave={handleSavePSSession}
            session={draftPS}
            setDraft={setDraftPS}
          />
        );
      case 'pm':
        return (
          <PolarityMapperWizard
            onClose={() => setActiveWizard(null)}
            onSave={handleSavePMSession}
            draft={draftPM}
            setDraft={setDraftPM}
          />
        );
      case 'kegan':
        return (
          <KeganAssessmentWizard
            onClose={() => setActiveWizard(null)}
            onSave={handleSaveKeganSession}
            session={draftKegan}
            setDraft={setDraftKegan}
          />
        );
      case 'relational':
        return (
          <RelationalPatternChatbot
            onClose={() => setActiveWizard(null)}
            onSave={handleSaveRelationalSession}
            session={draftRelational}
            setDraft={setDraftRelational}
          />
        );
      case 'jhana':
        return (
          <JhanaTracker
            onClose={() => setActiveWizard(null)}
            onSave={handleSaveJhanaSession}
          />
        );
      case 'somatic':
        return (
          <SomaticGeneratorWizard
            onClose={() => setActiveWizard(null)}
            onSave={handleSaveSomaticPractice}
          />
        );
      case 'meditation':
        return (
          <MeditationWizard
            onClose={() => setActiveWizard(null)}
          />
        );
      case 'consciousness-graph':
        return (
          <ConsciousnessGraph
            onClose={() => setActiveWizard(null)}
          />
        );
      case 'role-alignment':
        return (
          <RoleAlignmentWizard
            onClose={() => setActiveWizard(null)}
          />
        );
      case 'eight-zones':
        return (
          <EightZonesWizard
            onClose={() => setActiveWizard(null)}
            onSave={handleSaveEightZonesSession}
            session={draftEightZones}
            setDraft={setDraftEightZones}
            userId={userId}
          />
        );
      case 'big-mind':
        return (
          <BigMindProcessWizard
            onClose={(draft) => { setDraftBigMind(draft); setActiveWizard(null); }}
            onSave={handleSaveBigMindSession}
            session={draftBigMind}
            practiceStack={practiceStack.map(p => p.id)}
            completionHistory={completionHistory}
            addPracticeToStack={(practiceId: string) => {
              const practice = Object.values(corePractices).flat().find(p => p.id === practiceId);
              if (practice && !practiceStack.some(p => p.id === practiceId)) {
                addToStack(practice);
              }
            }}
            userId={userId}
          />
        );
      case 'memory-reconsolidation':
        return (
          <MemoryReconsolidationWizard
            onClose={() => setActiveWizard(null)}
            onSave={handleSaveMemoryReconSession}
            session={draftMemoryRecon}
            setDraft={setDraftMemoryRecon}
            userId={userId}
          />
        );
      case 'integral-body-architect':
        return (
          <IntegralBodyArchitectWizard
            onClose={() => setActiveWizard(null)}
            onSave={handleSaveIntegralBodyPlan}
            onLaunchYangPractice={handleLaunchYangPractice}
            onLaunchYinPractice={handleLaunchYinPractice}
            personalizationSummary={currentPersonalizationSummary}
          />
        );
      case 'dynamic-workout-architect':
        return (
          <DynamicWorkoutArchitectWizard
            onClose={() => setActiveWizard(null)}
            onSave={handleSaveWorkoutProgram}
          />
        );
      case 'insight-practice-map':
        return (
          <InsightPracticeMapWizard
            onClose={() => setActiveWizard(null)}
          />
        );
      // DISABLED: Memory Reconsolidation - keeping code for future reference
      /* case 'memory-reconsolidation':
        return (
          <MemoryReconsolidationWizard
            onClose={() => setActiveWizard(null)}
            onSave={handleSaveMemoryReconSession}
            session={draftMemoryRecon}
            setDraft={setDraftMemoryRecon}
            userId={userId}
          />
        ); */
      default:
        return null;
    }
  };

  const getActiveInsightContext = () => {
    if (!linkedInsightId) return null;
    return integratedInsights.find(i => i.id === linkedInsightId) || null;
  }
  
  // Close sidebar on mobile when tab changes
  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-100 font-sans relative overflow-hidden">
      {/* Layer 1: Solid dark base */}
      <div className="absolute inset-0 bg-black" />

      {/* Layer 2: Subtle depth gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 opacity-60" />

      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:flex md:w-64 md:flex-shrink-0 relative z-20">
        <NavSidebar activeTab={activeTab} setActiveTab={handleTabChange} onExport={handleExport} onImport={handleImport} onReset={handleReset} onSummonFlabbergaster={onSummonFlabbergaster} hasUnlockedFlabbergaster={hasUnlockedFlabbergaster} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setSidebarOpen(false)} aria-label="Close menu" />
      )}

      {/* Mobile Sidebar - slides from left on mobile */}
      <div className="md:hidden fixed top-0 left-0 h-screen w-64 z-40 transform transition-transform duration-300 ease-out" style={{transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)'}}>
        <NavSidebar activeTab={activeTab} setActiveTab={handleTabChange} onExport={handleExport} onImport={handleImport} onReset={handleReset} onSummonFlabbergaster={onSummonFlabbergaster} hasUnlockedFlabbergaster={hasUnlockedFlabbergaster} />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Mobile Header with Hamburger */}
        <div className="md:hidden flex items-center gap-4 px-4 py-3 border-b border-accent/20 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors touch-target"
            aria-label="Toggle menu"
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? (
              <X size={24} className="text-accent" />
            ) : (
              <Menu size={24} className="text-slate-400" />
            )}
          </button>
          <h1 className="text-lg font-bold font-mono tracking-tighter bg-gradient-to-r from-accent to-accent-gold bg-clip-text text-transparent">Aura OS</h1>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 md:p-8 relative z-10" style={{background: 'linear-gradient(180deg, rgba(10, 10, 10, 0.4) 0%, rgba(10, 10, 10, 0.6) 100%)', backdropFilter: 'blur(4px)'}}>
          <div className="relative z-10">
            <Suspense fallback={<TabLoadingFallback />}>
              {renderActiveTab()}
            </Suspense>
          </div>
        </div>
      </main>
      <Suspense fallback={<div className="fixed bottom-6 right-6 z-50"><LoadingFallback text="Loading coach..." size="small" /></div>}>
        <Coach
            userId={userId}
            practiceStack={practiceStack}
            completedCount={Object.values(completedToday).filter(Boolean).length}
            completionRate={practiceStack.length > 0 ? (Object.values(completedToday).filter(Boolean).length / practiceStack.length) * 100 : 0}
            timeCommitment={practiceStack.reduce((sum, p) => sum + p.timePerWeek, 0)}
            timeIndicator={"Balanced"}
            modules={modules}
            getStreak={getStreak}
            practiceNotes={practiceNotes}
            dailyNotes={dailyNotes}
        />
      </Suspense>
      {infoModalPractice && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <PracticeInfoModal practice={infoModalPractice} onClose={() => setInfoModalPractice(null)} onAdd={addToStack} isInStack={practiceStack.some(p => p.id === infoModalPractice.id)} onExplainClick={handleExplainPractice} onPersonalizeClick={setCustomizationModalPractice} />
        </Suspense>
      )}
      {explanationModal.isOpen && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <PracticeExplanationModal isOpen={explanationModal.isOpen} onClose={() => setExplanationModal({ isOpen: false, title: '', explanation: '' })} title={explanationModal.title} explanation={explanationModal.explanation} />
        </Suspense>
      )}
      {customizationModalPractice && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <PracticeCustomizationModal userId={userId} practice={customizationModalPractice} onClose={() => setCustomizationModalPractice(null)} onSave={handlePersonalizePractice} />
        </Suspense>
      )}
      {isCustomPracticeModalOpen && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <CustomPracticeModal isOpen={isCustomPracticeModalOpen} onClose={() => setIsCustomPracticeModalOpen(false)} onSave={handleSaveCustomPractice} />
        </Suspense>
      )}
      {isGuidedPracticeGeneratorOpen && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <GuidedPracticeGenerator isOpen={isGuidedPracticeGeneratorOpen} onClose={() => setIsGuidedPracticeGeneratorOpen(false)} onLogPractice={() => alert('Practice logged!')} />
        </Suspense>
      )}
      <Suspense fallback={<WizardLoadingFallback />}>
        {renderActiveWizard()}
      </Suspense>
      <FlabbergasterPortal
        isOpen={isFlabbergasterPortalOpen}
        onClose={() => setIsFlabbergasterPortalOpen(false)}
        hasUnlocked={hasUnlockedFlabbergaster}
        onHiddenModeDiscovered={onHiddenModeDiscovered}
      />
    </div>
  );
}