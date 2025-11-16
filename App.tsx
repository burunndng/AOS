import React, { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { Menu, X } from 'lucide-react';

// Core Components (always loaded)
import NavSidebar from './components/NavSidebar.tsx';
import FlabbergasterPortal from './components/FlabbergasterPortal.tsx';
import LoadingFallback, { TabLoadingFallback, WizardLoadingFallback, ModalLoadingFallback } from './components/LoadingFallback.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';

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
const AdaptiveCycleWizard = lazy(() => import('./components/AdaptiveCycleWizard.tsx'));
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
  EightZonesDraft,
  AdaptiveCycleSession,
  EnhancedRecommendationSet,
  IntelligentGuidance,
  NavigationEntry
} from './types.ts';
import { practices as corePractices, starterStacks, modules } from './constants.ts'; // FIX: Moved import to prevent re-declaration.


// Services
import * as geminiService from './services/geminiService.ts';
import * as ragService from './services/ragService.ts';
import { generateInsightFromSession } from './services/insightGenerator.ts';
import { getWizardSequenceContext } from './services/wizardSequenceContext.ts';
import { logPlanDayFeedback, calculatePlanAggregates, mergePlanWithTracker } from './utils/planHistoryUtils.ts';
import { analyzeHistoryAndPersonalize } from './services/integralBodyPersonalization.ts';
import { generateEnhancedRecommendationsForApp } from './services/enhancedRecommendationHelper.ts';
import { getIntelligentGuidance, clearGuidanceCache } from './services/intelligenceHub.ts';
import { aggregateUserContext, buildUserProfile, type UserProfile } from './utils/contextAggregator.ts';

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

  // User profile for adaptive personalization
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

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
  const [draftAttachment, setDraftAttachment] = useLocalStorage<AttachmentAssessmentSession | null>('draftAttachment', null);
  const [draftRoleAlignment, setDraftRoleAlignment] = useLocalStorage<RoleAlignmentSession | null>('draftRoleAlignment', null);
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
  const [historyRoleAlignment, setHistoryRoleAlignment] = useLocalStorage<RoleAlignmentSession[]>('historyRoleAlignment', []);
  const [historyJhana, setHistoryJhana] = useLocalStorage<JhanaSession[]>('historyJhana', []);
  const [memoryReconHistory, setMemoryReconHistory] = useLocalStorage<MemoryReconsolidationSession[]>('memoryReconHistory', []);
  const [eightZonesHistory, setEightZonesHistory] = useLocalStorage<EightZonesSession[]>('eightZonesHistory', []);
  const [adaptiveCycleHistory, setAdaptiveCycleHistory] = useLocalStorage<AdaptiveCycleSession[]>('adaptiveCycleHistory', []);
  const [_draftAdaptiveCycle, setDraftAdaptiveCycle] = useLocalStorage<AdaptiveCycleSession | null>('draftAdaptiveCycle', null);
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
  const [enhancedRecommendations, setEnhancedRecommendations] = useState<EnhancedRecommendationSet | null>(null);
  const [intelligentGuidance, setIntelligentGuidance] = useState<IntelligentGuidance | null>(null);
  const [isGuidanceLoading, setIsGuidanceLoading] = useState(false);
  const [guidanceError, setGuidanceError] = useState<string | null>(null);
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

  // Navigation Stack (Phase 3: Back button functionality)
  const [navigationStack, setNavigationStack] = useState<NavigationEntry[]>([]);
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

  /**
   * Launch a wizard with optional linked insight (Phase 3: tracks in navigation stack)
   * Wraps the wizards with navigation history
   */
  const setActiveWizardAndLink = (wizardName: string | null, insightId?: string) => {
    navigateTo(activeTab, wizardName, insightId);
  }

  /**
   * Navigate to a new tab/view, pushing current state to navigation stack (Phase 3)
   * Handles back button history with max depth of 10 entries
   */
  const navigateTo = useCallback((
    newTab: ActiveTab,
    wizardId?: string | null,
    insightId?: string | null
  ) => {
    // Don't push to stack if navigating to same tab with same wizard
    if (activeTab === newTab && activeWizard === (wizardId ?? null)) {
      return;
    }

    // Push current state to navigation stack (max 10 entries)
    const currentEntry: NavigationEntry = {
      tab: activeTab,
      activeWizard: activeWizard,
      linkedInsightId: linkedInsightId,
      timestamp: Date.now(),
    };

    setNavigationStack(prev => {
      const updated = [...prev, currentEntry];
      // Keep only last 10 entries
      return updated.slice(-9);
    });

    // Update current state
    setActiveTab(newTab);
    setActiveWizard(wizardId ?? null);
    setLinkedInsightId(insightId);
  }, [activeTab, activeWizard, linkedInsightId]);

  /**
   * Navigate back using the navigation stack (Phase 3)
   */
  const navigateBack = useCallback(() => {
    if (navigationStack.length === 0) {
      // If stack is empty, just close the active wizard
      setActiveWizard(null);
      return;
    }

    setNavigationStack(prev => {
      const newStack = [...prev];
      const previousEntry = newStack.pop();

      if (previousEntry) {
        setActiveTab(previousEntry.tab);
        setActiveWizard(previousEntry.activeWizard ?? null);
        setLinkedInsightId(previousEntry.linkedInsightId);
      }

      return newStack;
    });
  }, [navigationStack]);

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

  const handleGenerateEnhancedRecommendations = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const enhanced = await generateEnhancedRecommendationsForApp(
        practiceStack,
        integratedInsights,
        Object.values(corePractices).flat(),
        practiceNotes,
        completedToday
      );
      setEnhancedRecommendations(enhanced);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Failed to generate enhanced recommendations.");
      console.error('[Enhanced Recommendations] Error:', e);
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateIntelligentGuidance = async () => {
    setIsGuidanceLoading(true);
    setGuidanceError(null);
    try {
      const context = aggregateUserContext(
        practiceStack,
        practiceNotes,
        integratedInsights,
        completedToday
      );
      const guidance = await getIntelligentGuidance(context, userProfile);
      setIntelligentGuidance(guidance);
    } catch (e) {
      setGuidanceError(e instanceof Error ? e.message : "Failed to generate intelligent guidance.");
      console.error('[Intelligent Guidance] Error:', e);
    } finally {
      setIsGuidanceLoading(false);
    }
  };

  const handleClearGuidanceCache = () => {
    clearGuidanceCache();
    setIntelligentGuidance(null);
    handleGenerateIntelligentGuidance();
  };

  const generateAqalReport = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      // Use rich context instead of basic practice list
      const richContext = aggregateUserContext(
        practiceStack,
        practiceNotes,
        integratedInsights,
        completedToday
      );
      const report = await geminiService.generateAqalReport(richContext);
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

  /**
   * Utility to generate an insight and auto-refresh Intelligence Hub
   * Ensures wizards automatically trigger guidance updates after completion
   * Returns the insight immediately, refreshes guidance in background
   */
  const generateInsightAndRefreshGuidance = async (
    input: Parameters<typeof generateInsightFromSession>[0]
  ): Promise<IntegratedInsight> => {
    try {
      const insight = await generateInsightFromSession(input);

      // Auto-refresh Intelligence Hub with updated context
      // Do this in the background without blocking wizard completion
      (async () => {
        try {
          const context = aggregateUserContext(
            practiceStack,
            practiceNotes,
            [...integratedInsights, insight], // Include new insight
            completedToday
          );
          const guidance = await getIntelligentGuidance(context, userProfile);
          setIntelligentGuidance(guidance);
          console.log('[Wizard Integration] Intelligence Hub refreshed after insight generation');
        } catch (err) {
          console.warn('[Wizard Integration] Failed to refresh Intelligence Hub:', err);
          // Graceful degradation - insight was still generated
        }
      })();

      return insight;
    } catch (err) {
      console.error('[generateInsightAndRefreshGuidance] Error:', err);
      throw err;
    }
  };

  const handleSaveBiasSession = async (session: BiasDetectiveSession) => {
    setHistoryBias(prev => [...prev.filter(s => s.id !== session.id), session]);
    setDraftBias(null);
    navigateBack();
    const report = `# Bias Detective: ${session.decisionText}\n- Diagnosis: ${session.diagnosis}\n- Takeaway: ${session.oneThingToRemember}`;
    const summary = `Identified bias in decision: ${session.decisionText}`;
    try {
      const insight = await generateInsightAndRefreshGuidance({
        wizardType: 'Bias Detective',
        sessionId: session.id,
        sessionName: 'Bias Detective Session',
        sessionReport: report,
        sessionSummary: summary,
        userId,
        availablePractices: Object.values(corePractices).flat(),
        userProfile
      });
      setIntegratedInsights(prev => [...prev, insight]);
    } catch (err) {
      console.error('[Bias Detective] Failed to generate insight:', err);
    }
  };

  const handleSaveBiasFinderSession = async (session: BiasFinderSession) => {
    setHistoryBiasFinder(prev => [...prev.filter(s => s.id !== session.id), session]);
    setDraftBiasFinder(null);
    navigateBack();
    const biasesSummary = session.hypotheses.filter(h => h.confidence).map(h => `${h.biasName} (${h.confidence}%)`).join(', ');
    const report = `# Bias Finder: ${session.targetDecision}\n- Biases Identified: ${biasesSummary}\n- Recommendations: ${session.diagnosticReport?.recommendations.join('; ') || 'N/A'}`;
    const summary = `Found ${session.hypotheses.filter(h => h.confidence).length} biases in decision`;
    try {
      const insight = await generateInsightAndRefreshGuidance({
        wizardType: 'Bias Finder',
        sessionId: session.id,
        sessionName: 'Bias Finder Session',
        sessionReport: report,
        sessionSummary: summary,
        userId,
        availablePractices: Object.values(corePractices).flat(),
        userProfile
      });
      setIntegratedInsights(prev => [...prev, insight]);
    } catch (err) {
      console.error('[Bias Finder] Failed to generate insight:', err);
    }
  };

  const handleSaveSOSession = async (session: SubjectObjectSession) => {
    setHistorySO(prev => [...prev.filter(s => s.id !== session.id), session]);
    setDraftSO(null);
    navigateBack();
    const report = `# S-O Explorer: ${session.pattern}\n- Subject to: ${session.subjectToStatement}\n- Insight: ${session.integrationShift}`;
    const summary = `Pattern identified: ${session.pattern}`;
    try {
      const insight = await generateInsightAndRefreshGuidance({
        wizardType: 'Subject-Object Explorer',
        sessionId: session.id,
        sessionName: 'Subject-Object Session',
        sessionReport: report,
        sessionSummary: summary,
        userId,
        availablePractices: Object.values(corePractices).flat(),
        userProfile
      });
      setIntegratedInsights(prev => [...prev, insight]);
    } catch (err) {
      console.error('[Subject-Object Explorer] Failed to generate insight:', err);
    }
  };

  const handleSavePSSession = async (session: PerspectiveShifterSession) => {
    setHistoryPS(prev => [...prev.filter(s => s.id !== session.id), session]);
    setDraftPS(null);
    navigateBack();
    const report = `# P-S Shifter: ${session.stuckSituation}\n- Synthesis: ${session.synthesis}\n- Action Plan: ${session.realityCheckRefinement}`;
    const summary = `Shifted perspective on: ${session.stuckSituation}`;
    try {
      const insight = await generateInsightAndRefreshGuidance({
        wizardType: 'Perspective-Shifter',
        sessionId: session.id,
        sessionName: 'Perspective-Shifter Session',
        sessionReport: report,
        sessionSummary: summary,
        userId,
        availablePractices: Object.values(corePractices).flat(),
        userProfile
      });
      setIntegratedInsights(prev => [...prev, insight]);
    } catch (err) {
      console.error('[Perspective-Shifter] Failed to generate insight:', err);
    }
  };

  const handleSavePMSession = async (map: PolarityMap) => {
    setHistoryPM(prev => [...prev.filter(m => m.id !== map.id), map]);
    setDraftPM(null);
    navigateBack();
    const report = `# Polarity Map: ${map.dilemma}\n- Pole A: ${map.poleA_name}\n- Pole B: ${map.poleB_name}`;
    const summary = `Mapped dilemma: ${map.dilemma}`;
    try {
      const insight = await generateInsightAndRefreshGuidance({
        wizardType: 'Polarity Mapper',
        sessionId: map.id,
        sessionName: 'Polarity Mapper Session',
        sessionReport: report,
        sessionSummary: summary,
        userId,
        availablePractices: Object.values(corePractices).flat(),
        userProfile
      });
      setIntegratedInsights(prev => [...prev, insight]);
    } catch (err) {
      console.error('[Polarity Mapper] Failed to generate insight:', err);
    }
  };

  const handleSaveKeganSession = async (session: KeganAssessmentSession) => {
    setHistoryKegan(prev => [...prev.filter(s => s.id !== session.id), session]);
    setDraftKegan(null);
    navigateBack();
    const report = `# Kegan Assessment\n- Stage: ${session.overallInterpretation?.centerOfGravity || 'Pending'}\n- Key Insights: ${JSON.stringify(session.responses).substring(0, 200)}`;
    const summary = `Development stage assessed: ${session.overallInterpretation?.centerOfGravity || 'Assessment completed'}`;
    try {
      const insight = await generateInsightAndRefreshGuidance({
        wizardType: 'Kegan Assessment',
        sessionId: session.id,
        sessionName: 'Kegan Assessment Session',
        sessionReport: report,
        sessionSummary: summary,
        userId,
        availablePractices: Object.values(corePractices).flat(),
        userProfile
      });
      setIntegratedInsights(prev => [...prev, insight]);
    } catch (err) {
      console.error('[Kegan Assessment] Failed to generate insight:', err);
    }
  };

  const handleSaveAttachmentAssessment = async (session: AttachmentAssessmentSession) => {
    setHistoryAttachment(prev => [...prev.filter(s => s.id !== session.id), session]);
    setDraftAttachment(null);
    navigateBack();

    const report = `# Attachment Assessment\n- Style: ${session.style}\n- Anxiety Score: ${session.scores.anxiety}\n- Avoidance Score: ${session.scores.avoidance}\n- Assessment Notes: ${session.notes || session.description}`;
    const summary = `Attachment style assessed: ${session.style} (anxiety: ${session.scores.anxiety}, avoidance: ${session.scores.avoidance})`;

    try {
      const insight = await generateInsightAndRefreshGuidance({
        wizardType: 'Attachment Assessment',
        sessionId: session.id,
        sessionName: 'Attachment Assessment Session',
        sessionReport: report,
        sessionSummary: summary,
        userId,
        availablePractices: Object.values(corePractices).flat(),
        userProfile
      });
      setIntegratedInsights(prev => [...prev, insight]);
    } catch (err) {
      console.error('[Attachment Assessment] Failed to generate insight:', err);
    }
  };

  const handleSaveRelationalSession = async (session: RelationalPatternSession) => {
    setHistoryRelational(prev => [...prev.filter(s => s.id !== session.id), session]);
    setDraftRelational(null);
    navigateBack();
    const report = `# Relational Pattern\n- Context: ${session.conversation.slice(-3).map(m => m.text).join(' ')}`;
    const summary = `Relational pattern explored through dialogue`;
    try {
      const insight = await generateInsightAndRefreshGuidance({
        wizardType: 'Relational Pattern',
        sessionId: session.id,
        sessionName: 'Relational Pattern Session',
        sessionReport: report,
        sessionSummary: summary,
        userId,
        availablePractices: Object.values(corePractices).flat(),
        userProfile
      });
      setIntegratedInsights(prev => [...prev, insight]);
    } catch (err) {
      console.error('[Relational Pattern] Failed to generate insight:', err);
    }
  };

  const handleSaveRoleAlignmentSession = async (session: RoleAlignmentSession) => {
    setHistoryRoleAlignment(prev => [...prev.filter(s => s.id !== session.id), session]);
    setDraftRoleAlignment(null);
    navigateBack();

    const rolesText = session.roles
      .filter(r => r.name.trim())
      .map(r => `### ${r.name}
- Why: ${r.why}
- Goal: ${r.goal}
- Alignment Score: ${r.valueScore}/10
- Values Note: ${r.valueNote}
${r.action ? `- Action Plan: ${r.action}` : ''}`)
      .join('\n\n');

    const report = `# Role Alignment Analysis
- Session Date: ${session.date}
- Roles Analyzed: ${session.roles.filter(r => r.name.trim()).length}

## Role Assessments
${rolesText}

${session.integralNote ? `## Integral Reflection
${session.integralNote}` : ''}

${session.aiIntegralReflection ? `## AI-Generated Integral Insights
${session.aiIntegralReflection.integralInsight}

### Quadrant Connections
${session.aiIntegralReflection.quadrantConnections}

### Recommendations
${session.aiIntegralReflection.recommendations.map(r => `- ${r}`).join('\n')}` : ''}`;

    const avgScore = session.roles.filter(r => r.name.trim()).reduce((sum, r) => sum + r.valueScore, 0) /
                     Math.max(1, session.roles.filter(r => r.name.trim()).length);
    const summary = `Assessed role alignment across ${session.roles.filter(r => r.name.trim()).length} life roles (avg alignment: ${avgScore.toFixed(1)}/10)`;

    try {
      const insight = await generateInsightAndRefreshGuidance({
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

  const handleSaveJhanaSession = async (session: JhanaSession) => {
    setHistoryJhana(prev => [...prev.filter(s => s.id !== session.id), session]);
    navigateBack();

    const report = `# Jhana Guide: ${session.practice}
- Duration: ${session.duration} minutes
- Jhana Level Reached: ${session.jhanaLevel}
- Time in Absorption: ${session.timeInState} minutes

## Jhana Factors
- Applied Attention: ${session.factors.appliedAttention.presence} (${session.factors.appliedAttention.intensity}/10)
- Sustained Attention: ${session.factors.sustainedAttention.presence} (${session.factors.sustainedAttention.intensity}/10)
- Joy (Piti): ${session.factors.joy.presence} (${session.factors.joy.intensity}/10)
- Happiness (Sukha): ${session.factors.happiness.presence} (${session.factors.happiness.intensity}/10)
- Unification (Ekaggata): ${session.factors.unification.presence} (${session.factors.unification.intensity}/10)

## Experience
- Body Experience: ${session.bodyExperience}
- Mind Quality: ${session.mindQuality}
- Hindrances: ${session.hindrances?.join(', ') || 'None noted'}
${session.comparison ? `\n- Progress: ${session.comparison}` : ''}`;

    const summary = `Meditated on ${session.practice} for ${session.duration}min, reached ${session.jhanaLevel} jhana`;

    try {
      const insight = await generateInsightAndRefreshGuidance({
        wizardType: 'Jhana Guide',
        sessionId: session.id,
        sessionName: 'Jhana Session',
        sessionReport: report,
        sessionSummary: summary,
        userId,
        availablePractices: Object.values(corePractices).flat(),
        userProfile
      });
      setIntegratedInsights(prev => [...prev, insight]);
    } catch (err) {
      console.error('[Jhana Guide] Failed to generate insight:', err);
    }
  };

  const handleSave321Session = async (session: ThreeTwoOneSession) => {
    setHistory321(prev => [...prev.filter(s => s.id !== session.id), session]);
    setDraft321(null);
    navigateBack();

    // Build rich report from new structured data model
    const report = `# 3-2-1 Reflection: ${session.trigger}

## Face It (3rd Person View)
${session.faceItAnalysis ? `
- **Objective Description:** ${session.faceItAnalysis.objectiveDescription || 'N/A'}
- **Specific Actions:** ${session.faceItAnalysis.specificActions?.join(', ') || 'N/A'}
- **Triggered Emotions:** ${session.faceItAnalysis.triggeredEmotions?.join(', ') || 'N/A'}
` : '- No Face It analysis recorded'}

## Talk To It (2nd Person Dialogue)
${session.dialogueTranscript && session.dialogueTranscript.length > 0 ? session.dialogueTranscript.map(d => `- **${d.role === 'user' ? 'You' : 'The Quality'}:** ${d.text}`).join('\n') : '- No dialogue recorded'}

## Be It (1st Person Embodiment)
${session.embodimentAnalysis ? `
- **Embodiment Statement:** "${session.embodimentAnalysis.embodimentStatement || 'N/A'}"
- **Somatic Location:** ${session.embodimentAnalysis.somaticLocation || 'N/A'}
- **Core Message/Gift:** ${session.embodimentAnalysis.coreMessage || 'N/A'}
` : '- No embodiment analysis recorded'}

## Integration Plan
${session.integrationPlan ? `
- **Re-owning Statement:** ${session.integrationPlan.reowningStatement || 'N/A'}
- **Actionable Step:** ${session.integrationPlan.actionableStep || 'N/A'}
${session.integrationPlan.relatedPracticeId ? `- **Related Practice:** ${session.integrationPlan.relatedPracticeId}` : ''}
` : '- No integration plan recorded'}`;

    const summary = `Reflected on trigger: ${session.trigger}${session.aiSummary ? ` - ${session.aiSummary}` : ''}`;

    try {
      const insight = await generateInsightAndRefreshGuidance({
        wizardType: '3-2-1 Reflection',
        sessionId: session.id,
        sessionName: '3-2-1 Reflection Session',
        sessionReport: report,
        sessionSummary: summary,
        userId,
        availablePractices: Object.values(corePractices).flat(),
        userProfile
      });
      setIntegratedInsights(prev => [...prev, insight]);
    } catch (err) {
      console.error('[3-2-1 Reflection] Failed to generate insight:', err);
    }
  };

  const handleSaveIFSSession = async (session: IFSSession) => {
    setHistoryIFS(prev => [...prev.filter(s => s.id !== session.id), session]);
    setDraftIFS(null);
    navigateBack();

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

    // Build rich report from IFS session data
    const transcriptByPhase = session.transcript.reduce((acc, entry) => {
      const phase = entry.phase || 'IDENTIFY';
      if (!acc[phase]) acc[phase] = [];
      acc[phase].push(`- **${entry.role === 'user' ? 'You' : 'Facilitator'}:** ${entry.text}`);
      return acc;
    }, {} as Record<string, string[]>);

    const report = `# IFS Session: ${session.partName || 'Unnamed Part'}

## Part Profile
${session.partRole || session.partFears || session.partPositiveIntent ? `
- **Role:** ${session.partRole || 'Not identified'}
- **Fears/Concerns:** ${session.partFears || 'Not identified'}
- **Positive Intent:** ${session.partPositiveIntent || 'Not identified'}
` : '- Part profile analysis pending'}

## Session Progression

${Object.entries(transcriptByPhase).map(([phase, entries]) => `
### ${phase.replace('_', ' ')} Phase
${entries.join('\n')}
`).join('\n')}

## Session Summary
${session.summary || 'Session completed at phase: ' + session.currentPhase}

${session.aiIndications && session.aiIndications.length > 0 ? `
## AI Indications for Follow-up
${session.aiIndications.map(ind => `- ${ind}`).join('\n')}
` : ''}

${session.integrationNote ? `
## Integration Note
${session.integrationNote}
` : ''}`;

    const summary = `Worked with part "${session.partName || 'Unnamed Part'}"${session.partRole ? ` (${session.partRole})` : ''} - reached ${session.currentPhase} phase${session.summary ? ` - ${session.summary}` : ''}`;

    try {
      const insight = await generateInsightAndRefreshGuidance({
        wizardType: 'IFS Session',
        sessionId: session.id,
        sessionName: 'IFS Session',
        sessionReport: report,
        sessionSummary: summary,
        userId,
        availablePractices: Object.values(corePractices).flat(),
        userProfile
      });
      setIntegratedInsights(prev => [...prev, insight]);
    } catch (err) {
      console.error('[IFS Session] Failed to generate insight:', err);
    }
  };

  const handleSaveSomaticPractice = async (session: SomaticPracticeSession) => {
    setSomaticPracticeHistory(prev => [...prev.filter(s => s.id !== session.id), session]);

    const report = `# Somatic Generator: ${session.title}
- Practice Type: ${session.practiceType}
- Duration: ${session.duration} minutes
- Focus Area: ${session.focusArea || 'Whole body'}
- Pacing: ${session.pacing || 'Moderate'}
- Intention: ${session.intention}
${session.safetyNotes ? `\n## Safety Notes\n${session.safetyNotes.map(n => `- ${n}`).join('\n')}` : ''}

## Practice Segments: ${session.script.length} components`;

    const summary = `Generated somatic practice: ${session.title} (${session.duration}min, ${session.practiceType})`;

    try {
      const insight = await generateInsightAndRefreshGuidance({
        wizardType: 'Somatic Practice',
        sessionId: session.id,
        sessionName: session.title,
        sessionReport: report,
        sessionSummary: summary,
        userId,
        availablePractices: Object.values(corePractices).flat(),
        userProfile
      });
      setIntegratedInsights(prev => [...prev, insight]);
    } catch (err) {
      console.error('[Somatic Generator] Failed to generate insight:', err);
    }

    alert(`Practice "${session.title}" saved! You can find it in your Library.`);
    setActiveTab('library');
  };

  const handleSaveIntegralBodyPlan = async (plan: IntegralBodyPlan) => {
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

    // Generate insight from embodied development plan
    const report = `# Integral Body Plan: ${plan.goalStatement}
- Week Starting: ${plan.weekStartDate}
- Daily Targets:
  - Protein: ${plan.dailyTargets.proteinGrams}g
  - Sleep: ${plan.dailyTargets.sleepHours}h
  - Workouts: ${plan.dailyTargets.workoutDays} days
  - Yin Practice: ${plan.dailyTargets.yinPracticeMinutes} min

## Yang Constraints
- Strength Focus: ${plan.yangConstraints.strengthFocus || 'N/A'}
- Cardio Preference: ${plan.yangConstraints.cardioPreference || 'N/A'}
- Available Days: ${plan.yangConstraints.availableDays}/week

## Yin Preferences
- Primary: ${plan.yinPreferences.primary || 'N/A'}
- Secondary: ${plan.yinPreferences.secondary || 'N/A'}

## Weekly Summary
${plan.weekSummary}`;

    const summary = `Created ${plan.dailyTargets.workoutDays}-day embodied development plan: ${plan.goalStatement}`;

    try {
      const insight = await generateInsightAndRefreshGuidance({
        wizardType: 'Integral Body Plan',
        sessionId: plan.id,
        sessionName: plan.goalStatement,
        sessionReport: report,
        sessionSummary: summary,
        userId,
        availablePractices: Object.values(corePractices).flat(),
        userProfile
      });
      setIntegratedInsights(prev => [...prev, insight]);
    } catch (err) {
      console.error('[Integral Body Architect] Failed to generate insight:', err);
    }

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

  // Compute user profile for adaptive personalization (Phase 4)
  // This uses async buildUserProfile for sentiment analysis integration
  useEffect(() => {
    const buildProfile = async () => {
      try {
        setIsProfileLoading(true);
        // Build completion history from completionHistory
        // NOTE: Don't depend on completedToday - it's recalculated on each render
        const today = new Date().toISOString().split('T')[0];
        const completionRecords = Object.entries(completionHistory)
          .filter(([_, dates]) => dates.includes(today))
          .map(([practiceId, _]) => ({
            practiceId,
            date: today,
            completed: true,
          }));

        // Extract wizard sessions for context
        const wizardSessions = [];
        if (historyKegan.length > 0) wizardSessions.push({ type: 'keganAssessment', sessionData: historyKegan[0] });
        if (historyAttachment.length > 0) wizardSessions.push({ type: 'attachmentAssessment', sessionData: historyAttachment[0] });

        const profile = await buildUserProfile(
          completionRecords,
          integratedInsights,
          integralBodyPlanHistory,
          practiceStack,
          wizardSessions,
          dailyNotes
        );
        setUserProfile(profile);
      } catch (error) {
        console.error('[App] Error building user profile:', error);
      } finally {
        setIsProfileLoading(false);
      }
    };

    buildProfile();
  }, [completionHistory, integratedInsights, integralBodyPlanHistory, practiceStack, historyKegan, historyAttachment, dailyNotes]);

  // Auto-generate personalization when the Integral Body Architect wizard is opened
  useEffect(() => {
    if (activeWizard === 'integral-body-architect' && integralBodyPlanHistory.length > 0) {
      generatePersonalizationSummary();
    }
  }, [activeWizard, integralBodyPlanHistory, generatePersonalizationSummary]);

  const handleSaveBigMindSession = async (session: BigMindSession) => {
    setHistoryBigMind(prev => [...prev.filter(s => s.id !== session.id), session]);
    setDraftBigMind(null);
    navigateBack();

    // Generate comprehensive report from Big Mind session
    if (session.summary) {
      const voicesText = session.voices.map(v => `- **${v.name}** (${v.archetype}): "${v.quality}"`).join('\n');
      const messagesText = session.messages.slice(-10).map(m => `- **${m.voiceName}:** ${m.text}`).join('\n');

      const report = `# Big Mind Process Session
- Stage: ${session.currentStage}
- Voices Explored: ${session.voices.length}
- Dialogue Messages: ${session.messages.length}

## Voices Channeled
${voicesText}

## Witness Perspective
${session.summary.witnessPerspective}

## Integration Commitments
${session.summary.integrationCommitments.map(c => `- ${c}`).join('\n')}

## Key Dialogue (Last 10 messages)
${messagesText}

## Recommended Practices
${session.summary.recommendedPractices.map(p => `- **${p.practiceName}**: ${p.rationale}`).join('\n')}`;

      const summary = `Explored ${session.voices.length} voices through Big Mind process, reached witness consciousness`;

      try {
        const insight = await generateInsightAndRefreshGuidance({
          wizardType: 'Big Mind Process',
          sessionId: session.id,
          sessionName: 'Big Mind Session',
          sessionReport: report,
          sessionSummary: summary,
          userId,
          availablePractices: Object.values(corePractices).flat(),
          userProfile
        });
        setIntegratedInsights(prev => [...prev, insight]);
      } catch (err) {
        console.error('[Big Mind Process] Failed to generate insight:', err);
      }
    }
  };

  const handleSaveEightZonesSession = async (session: EightZonesSession) => {
    setEightZonesHistory(prev => [...prev.filter(s => s.id !== session.id), session]);
    setDraftEightZones(null);
    navigateBack();

    // Build rich report from zone analyses and connection dialogues
    const zoneAnalysesText = Object.values(session.zoneAnalyses || {})
      .sort((a, b) => a.zoneNumber - b.zoneNumber)
      .map(zone => `### Zone ${zone.zoneNumber}: ${zone.zoneFocus}
**User Analysis:** ${zone.userInput}
${zone.aiEnhancement ? `\n**AI Enhancement:** ${zone.aiEnhancement}` : ''}`)
      .join('\n\n');

    const connectionReflectionsText = session.connectionReflections && session.connectionReflections.length > 0
      ? `\n\n## Connection Reflections\n\n${session.connectionReflections.map(conn => `### ${conn.zones}
${conn.dialogue.map(d => `- **${d.role === 'user' ? 'You' : 'Facilitator'}:** ${d.text}`).join('\n')}`).join('\n\n')}`
      : '';

    const sessionReport = `# Eight Zones Analysis: ${session.focalQuestion}

## Zone-by-Zone Analysis

${zoneAnalysesText}${connectionReflectionsText}

## Integral Synthesis

${session.synthesisReport || 'Synthesis pending'}

## Key Insights

### Blind Spots
${session.blindSpots?.map(spot => `- ${spot}`).join('\n') || '- None identified'}

### Novel Insights
${session.novelInsights?.map(insight => `- ${insight}`).join('\n') || '- None identified'}

### Recommendations
${session.recommendations?.map(rec => `- ${rec}`).join('\n') || '- None identified'}`;

    // Generate integrated insight for Journal
    if (session.synthesisReport) {
      try {
        const insight = await generateInsightAndRefreshGuidance({
          wizardType: 'Eight Zones',
          sessionId: session.id,
          sessionName: session.focalQuestion,
          sessionReport: sessionReport,
          sessionSummary: session.synthesisReport.substring(0, 200) + '...',
          userId: userId,
          availablePractices: Object.values(corePractices).flat(),
          userProfile,
        });

        setIntegratedInsights(prev => [...prev, insight]);
      } catch (error) {
        console.error('Failed to generate insight for Eight Zones session:', error);
      }
    }
  };

  const handleSaveAdaptiveCycleSession = async (session: AdaptiveCycleSession) => {
    console.log('🔄 [Adaptive Cycle] handleSaveAdaptiveCycleSession called with session:', session);

    const formatPoints = (points: string[]) =>
      points.length > 0 ? points.map((point) => `- ${point}`).join('\n') : '- No insights captured yet';

    const reportSections: string[] = [
      `# Adaptive Cycle Map: ${session.systemToAnalyze}`,
      '',
      '## 1. Growth / Exploitation (r)',
      formatPoints(session.cycleMap.r.points),
      '',
      '## 2. Conservation (K)',
      formatPoints(session.cycleMap.K.points),
      '',
      '## 3. Release / Collapse (Ω)',
      formatPoints(session.cycleMap.Ω.points),
      '',
      '## 4. Reorganization (α)',
      formatPoints(session.cycleMap.α.points),
    ];

    if (session.userHint) {
      reportSections.push(
        '',
        '## Self-Assessment Signals',
        `- Potential for innovation: ${session.userHint.potential}/10`,
        `- Structural connectedness: ${session.userHint.connectedness}/10`,
        `- Resilience & redundancy: ${session.userHint.resilience}/10`
      );
    }

    const sessionReport = reportSections.join('\n');

    const sessionWithReport: AdaptiveCycleSession = {
      ...session,
      fullReport: sessionReport,
    };

    setAdaptiveCycleHistory((prev) => [...prev.filter((s) => s.id !== sessionWithReport.id), sessionWithReport]);
    setDraftAdaptiveCycle(null);
    console.log('✅ [Adaptive Cycle] Session saved to history');

    const deriveDominantQuadrant = (): { key: keyof AdaptiveCycleSession['cycleMap']; label: string } | null => {
      if (!session.userHint) return null;

      const { potential, connectedness, resilience } = session.userHint;
      const quadrantScores: Array<{ key: keyof AdaptiveCycleSession['cycleMap']; label: string; score: number }> = [
        { key: 'r', label: 'Growth / Exploitation (r)', score: potential },
        { key: 'K', label: 'Conservation (K)', score: connectedness },
        { key: 'Ω', label: 'Release / Collapse (Ω)', score: 10 - resilience },
        { key: 'α', label: 'Reorganization (α)', score: resilience },
      ];

      return quadrantScores.reduce(
        (highest, current) => (current.score > highest.score ? current : highest),
        quadrantScores[0]
      );
    };

    const buildSessionSummary = (): string => {
      const dominant = deriveDominantQuadrant();
      if (dominant) {
        const keyPoint = session.cycleMap[dominant.key].points[0];
        const emphasis = keyPoint ? `, spotlighting "${keyPoint}"` : '';
        return `The map for "${session.systemToAnalyze}" shows the most energy in the ${dominant.label}${emphasis}.`;
      }

      const fallbackPoint =
        session.cycleMap.r.points[0] ||
        session.cycleMap.K.points[0] ||
        session.cycleMap.Ω.points[0] ||
        session.cycleMap.α.points[0];

      return fallbackPoint
        ? `Mapped "${session.systemToAnalyze}" across all Adaptive Cycle phases, noting "${fallbackPoint}".`
        : `Mapped "${session.systemToAnalyze}" across the full Adaptive Cycle to surface system dynamics.`;
    };

    const sessionSummary = buildSessionSummary();

    navigateBack();

    try {
      const insight = await generateInsightAndRefreshGuidance({
        wizardType: 'Adaptive Cycle Lens',
        sessionId: sessionWithReport.id,
        sessionName: sessionWithReport.systemToAnalyze,
        sessionReport,
        sessionSummary,
        userId,
        availablePractices: Object.values(corePractices).flat(),
        userProfile,
      });

      console.log('✅ [Adaptive Cycle] Insight generated:', insight);
      setIntegratedInsights((prev) => [...prev, insight]);
      console.log('✅ [Adaptive Cycle] Insight saved to state. Total insights:', integratedInsights.length + 1);
    } catch (error) {
      console.error('❌ [Adaptive Cycle] Failed to generate insight:', error);
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

  const handleSaveWorkoutProgram = async (program: WorkoutProgram) => {
    setWorkoutPrograms(prev => [...prev.filter(p => p.id !== program.id), program]);
    // Clear handoff source after saving
    setWorkoutHandoffSource(null);
    navigateBack();

    const report = `# Workout Program: ${program.title}
- Generated: ${program.date}
- Workouts: ${program.workouts.length} sessions

## Program Summary
${program.summary}

## Progression Recommendations
${program.progressionRecommendations?.map(r => `- ${r}`).join('\n') || '- Standard progression applied'}

## Personalization Notes
${program.personalizationNotes || 'Standard customization applied'}`;

    const summary = `Created ${program.workouts.length}-workout personalized program: ${program.title}`;

    try {
      const insight = await generateInsightAndRefreshGuidance({
        wizardType: 'Workout Program',
        sessionId: program.id,
        sessionName: program.title,
        sessionReport: report,
        sessionSummary: summary,
        userId,
        availablePractices: Object.values(corePractices).flat(),
        userProfile
      });
      setIntegratedInsights(prev => [...prev, insight]);
    } catch (err) {
      console.error('[Dynamic Workout Architect] Failed to generate insight:', err);
    }

    alert(`Your personalized workout program has been saved!`);
  };

  const handleSaveMemoryReconSession = async (session: MemoryReconsolidationSession) => {
    setMemoryReconHistory(prev => [...prev.filter(s => s.id !== session.id), session]);
    setDraftMemoryRecon(null);
    navigateBack();

    const selectedBelief = session.implicitBeliefs[0];
    const shiftPercentage = session.completionSummary?.intensityShift
      ? Math.round((session.completionSummary.intensityShift / session.baselineIntensity) * -100)
      : 0;

    const report = `# Memory Reconsolidation: ${selectedBelief?.belief || 'N/A'}\n- Intensity Shift: ${shiftPercentage}%\n- Integration: ${session.completionSummary?.selectedPractices.map(p => p.practiceName).join(', ')}`;
    const summary = `Reconsolidated belief shift: ${shiftPercentage}%`;

    try {
      const insight = await generateInsightAndRefreshGuidance({
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
      case 'recommendations': return <RecommendationsTab starterStacks={starterStacks} applyStarterStack={applyStarterStack} isLoading={aiLoading} error={aiError} intelligentGuidance={intelligentGuidance} isGuidanceLoading={isGuidanceLoading} guidanceError={guidanceError} onGenerateGuidance={handleGenerateIntelligentGuidance} onClearGuidanceCache={handleClearGuidanceCache} integratedInsights={integratedInsights} allPractices={Object.values(corePractices).flat()} addToStack={addToStack} personalizationSummary={currentPersonalizationSummary} />;
      case 'aqal': return <AqalTab report={aqalReport} isLoading={aiLoading} error={aiError} onGenerate={generateAqalReport} />;
      case 'mind-tools': return <MindToolsTab
        setActiveWizard={setActiveWizardAndLink}
        attachmentAssessment={historyAttachment[historyAttachment.length - 1]}
        onCompleteAttachmentAssessment={handleSaveAttachmentAssessment}
        addToStack={addToStack}
        practiceStack={practiceStack}
        userId={userId}
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

    // Generate wizard sequence context for current wizard
    let sequenceContext = null;
    if (activeWizard === '321') {
      sequenceContext = getWizardSequenceContext(
        '3-2-1 Reflection',
        history321,
        integratedInsights,
        linkedInsightId
      );
    }

    switch (activeWizard) {
      case '321':
        return (
          <ThreeTwoOneWizard
            onClose={() => navigateBack()}
            onSave={handleSave321Session}
            session={draft321}
            insightContext={insightContext}
            markInsightAsAddressed={markInsightAsAddressed}
            sequenceContext={sequenceContext}
          />
        );
      case 'ifs':
        return (
          <IFSWizard
            isOpen={true}
            onClose={(draft) => { setDraftIFS(draft); navigateBack(); }}
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
            onClose={() => navigateBack()}
            onSave={handleSaveBiasSession}
            session={draftBias}
            setDraft={setDraftBias}
          />
        );
      case 'biasfinder':
        return (
          <BiasFinderWizard
            onClose={() => navigateBack()}
            onSave={handleSaveBiasFinderSession}
            session={draftBiasFinder}
            setDraft={setDraftBiasFinder}
          />
        );
      case 'so':
        return (
          <SubjectObjectWizard
            onClose={() => navigateBack()}
            onSave={handleSaveSOSession}
            session={draftSO}
            setDraft={setDraftSO}
          />
        );
      case 'ps':
        return (
          <PerspectiveShifterWizard
            onClose={() => navigateBack()}
            onSave={handleSavePSSession}
            session={draftPS}
            setDraft={setDraftPS}
          />
        );
      case 'pm':
        return (
          <PolarityMapperWizard
            onClose={() => navigateBack()}
            onSave={handleSavePMSession}
            draft={draftPM}
            setDraft={setDraftPM}
          />
        );
      case 'kegan':
        return (
          <KeganAssessmentWizard
            onClose={() => navigateBack()}
            onSave={handleSaveKeganSession}
            session={draftKegan}
            setDraft={setDraftKegan}
          />
        );
      case 'relational':
        return (
          <RelationalPatternChatbot
            onClose={() => navigateBack()}
            onSave={handleSaveRelationalSession}
            session={draftRelational}
            setDraft={setDraftRelational}
          />
        );
      case 'jhana':
        return (
          <JhanaTracker
            onClose={() => navigateBack()}
            onSave={handleSaveJhanaSession}
          />
        );
      case 'somatic':
        return (
          <SomaticGeneratorWizard
            onClose={() => navigateBack()}
            onSave={handleSaveSomaticPractice}
          />
        );
      case 'meditation':
        return (
          <MeditationWizard
            onClose={() => navigateBack()}
          />
        );
      case 'consciousness-graph':
        return (
          <ConsciousnessGraph
            onClose={() => navigateBack()}
          />
        );
      case 'role-alignment':
        return (
          <RoleAlignmentWizard
            onClose={() => navigateBack()}
            onSave={handleSaveRoleAlignmentSession}
            session={draftRoleAlignment}
            setDraft={setDraftRoleAlignment}
            userId={userId}
          />
        );
      case 'eight-zones':
        return (
          <EightZonesWizard
            onClose={() => navigateBack()}
            onSave={handleSaveEightZonesSession}
            session={draftEightZones}
            setDraft={setDraftEightZones}
            userId={userId}
          />
        );
      case 'adaptive-cycle':
        return (
          <AdaptiveCycleWizard
            onClose={() => navigateBack()}
            onSave={handleSaveAdaptiveCycleSession}
          />
        );
      case 'big-mind':
        return (
          <BigMindProcessWizard
            onClose={(draft) => { setDraftBigMind(draft); navigateBack(); }}
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
            onClose={() => navigateBack()}
            onSave={handleSaveMemoryReconSession}
            session={draftMemoryRecon}
            setDraft={setDraftMemoryRecon}
            userId={userId}
          />
        );
      case 'integral-body-architect':
        return (
          <IntegralBodyArchitectWizard
            onClose={() => navigateBack()}
            onSave={handleSaveIntegralBodyPlan}
            onLaunchYangPractice={handleLaunchYangPractice}
            onLaunchYinPractice={handleLaunchYinPractice}
            personalizationSummary={currentPersonalizationSummary}
          />
        );
      case 'dynamic-workout-architect':
        return (
          <DynamicWorkoutArchitectWizard
            onClose={() => navigateBack()}
            onSave={handleSaveWorkoutProgram}
          />
        );
      case 'insight-practice-map':
        return (
          <InsightPracticeMapWizard
            onClose={() => navigateBack()}
          />
        );
      // DISABLED: Memory Reconsolidation - keeping code for future reference
      /* case 'memory-reconsolidation':
        return (
          <MemoryReconsolidationWizard
            onClose={() => navigateBack()}
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
  
  // Close sidebar on mobile when tab changes (Phase 3: uses navigateTo for history)
  const handleTabChange = (tab: ActiveTab) => {
    navigateTo(tab);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <ErrorBoundary>
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
        {/* Header with Hamburger and Back Button */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-accent/20 flex-shrink-0">
          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center gap-2">
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

          {/* Back Button (visible on both mobile and desktop when history exists) */}
          {navigationStack.length > 0 && (
            <button
              onClick={navigateBack}
              className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800/50 transition-colors text-slate-300 hover:text-accent"
              aria-label="Go back"
              title="Back to previous view"
            >
              <span className="text-sm font-medium">← Back</span>
            </button>
          )}

          {/* Mobile Back Button (right side) */}
          {navigationStack.length > 0 && (
            <button
              onClick={navigateBack}
              className="md:hidden p-2 hover:bg-slate-800/50 rounded-lg transition-colors text-slate-300 hover:text-accent"
              aria-label="Go back"
              title="Back to previous view"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
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
            userProfile={userProfile}
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
    </ErrorBoundary>
  );
}