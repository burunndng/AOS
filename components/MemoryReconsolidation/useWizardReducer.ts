// useWizardReducer - Centralized state management for Memory Reconsolidation Wizard

import { useReducer, Dispatch } from 'react';
import {
  MemoryReconsolidationSession,
  ImplicitBelief,
  ContradictionInsight,
  JuxtapositionCycle,
  IntegrationSelection,
  IntensityReading,
  SessionCompletionSummary,
  MemoryReconsolidationStep,
} from '../../types';

// Wizard state structure
export interface WizardState {
  session: MemoryReconsolidationSession;

  // UI state
  isLoading: boolean;
  error: string | null;

  // Belief identification state
  beliefContext: string;
  selectedBeliefId: string | null;

  // Juxtaposition state
  currentCycleIndex: number;
  currentCycleStep: 'old-truth' | 'pause' | 'new-truth' | 'complete';
  cycleIntensities: Record<number, IntensityReading>;
  isPaused: boolean;
  cycleNotes: Record<number, string>;

  // Post check-in state
  postIntensity: number | null;
  emotionalNotes: string;
  somaticNotes: string;
  cognitiveShifts: string;

  // Integration state
  searchFilter: string;
  selectedPractices: string[];
  customPlan: string;
  schedulingCommitment: string;
  selectedGrounding: string[];
  integrationChoice: 'curated' | 'self-guided' | null;

  // Completion state
  completionData: { success: boolean; sessionId: string; integrationSummary: string; suggestedPractices: string[] } | null;
  copied: boolean;
}

// Action types
export type WizardAction =
  | { type: 'UPDATE_SESSION'; payload: Partial<MemoryReconsolidationSession> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_BELIEF_CONTEXT'; payload: string }
  | { type: 'SET_SELECTED_BELIEF_ID'; payload: string | null }
  | { type: 'SET_BELIEFS'; payload: ImplicitBelief[] }
  | { type: 'SET_CONTRADICTIONS'; payload: { insights: ContradictionInsight[]; cycles: JuxtapositionCycle[] } }
  | { type: 'SET_CURRENT_CYCLE_INDEX'; payload: number }
  | { type: 'SET_CURRENT_CYCLE_STEP'; payload: 'old-truth' | 'pause' | 'new-truth' | 'complete' }
  | { type: 'SET_CYCLE_INTENSITY'; payload: { index: number; intensity: IntensityReading } }
  | { type: 'SET_IS_PAUSED'; payload: boolean }
  | { type: 'SET_CYCLE_NOTE'; payload: { index: number; note: string } }
  | { type: 'SET_POST_INTENSITY'; payload: number | null }
  | { type: 'SET_EMOTIONAL_NOTES'; payload: string }
  | { type: 'SET_SOMATIC_NOTES'; payload: string }
  | { type: 'SET_COGNITIVE_SHIFTS'; payload: string }
  | { type: 'SET_SEARCH_FILTER'; payload: string }
  | { type: 'TOGGLE_PRACTICE'; payload: string }
  | { type: 'SET_CUSTOM_PLAN'; payload: string }
  | { type: 'SET_SCHEDULING_COMMITMENT'; payload: string }
  | { type: 'TOGGLE_GROUNDING'; payload: string }
  | { type: 'SET_INTEGRATION_CHOICE'; payload: 'curated' | 'self-guided' | null }
  | { type: 'SET_COMPLETION_DATA'; payload: { success: boolean; sessionId: string; integrationSummary: string; suggestedPractices: string[] } }
  | { type: 'SET_COPIED'; payload: boolean }
  | { type: 'SET_CURRENT_STEP'; payload: MemoryReconsolidationStep };

// Reducer function
function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'UPDATE_SESSION':
      return {
        ...state,
        session: { ...state.session, ...action.payload },
      };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_BELIEF_CONTEXT':
      return { ...state, beliefContext: action.payload };

    case 'SET_SELECTED_BELIEF_ID':
      return { ...state, selectedBeliefId: action.payload };

    case 'SET_BELIEFS':
      return {
        ...state,
        session: {
          ...state.session,
          implicitBeliefs: action.payload,
          baselineIntensity: action.payload[0]?.emotionalCharge || state.session.baselineIntensity,
        },
        selectedBeliefId: action.payload[0]?.id ?? null,
      };

    case 'SET_CONTRADICTIONS':
      return {
        ...state,
        session: {
          ...state.session,
          contradictionInsights: action.payload.insights,
          juxtapositionCycles: action.payload.cycles,
        },
      };

    case 'SET_CURRENT_CYCLE_INDEX':
      return { ...state, currentCycleIndex: action.payload };

    case 'SET_CURRENT_CYCLE_STEP':
      return { ...state, currentCycleStep: action.payload };

    case 'SET_CYCLE_INTENSITY':
      return {
        ...state,
        cycleIntensities: {
          ...state.cycleIntensities,
          [action.payload.index]: action.payload.intensity,
        },
      };

    case 'SET_IS_PAUSED':
      return { ...state, isPaused: action.payload };

    case 'SET_CYCLE_NOTE':
      return {
        ...state,
        cycleNotes: {
          ...state.cycleNotes,
          [action.payload.index]: action.payload.note,
        },
      };

    case 'SET_POST_INTENSITY':
      return { ...state, postIntensity: action.payload };

    case 'SET_EMOTIONAL_NOTES':
      return { ...state, emotionalNotes: action.payload };

    case 'SET_SOMATIC_NOTES':
      return { ...state, somaticNotes: action.payload };

    case 'SET_COGNITIVE_SHIFTS':
      return { ...state, cognitiveShifts: action.payload };

    case 'SET_SEARCH_FILTER':
      return { ...state, searchFilter: action.payload };

    case 'TOGGLE_PRACTICE':
      return {
        ...state,
        selectedPractices: state.selectedPractices.includes(action.payload)
          ? state.selectedPractices.filter(id => id !== action.payload)
          : [...state.selectedPractices, action.payload],
      };

    case 'SET_CUSTOM_PLAN':
      return { ...state, customPlan: action.payload };

    case 'SET_SCHEDULING_COMMITMENT':
      return { ...state, schedulingCommitment: action.payload };

    case 'TOGGLE_GROUNDING':
      return {
        ...state,
        selectedGrounding: state.selectedGrounding.includes(action.payload)
          ? state.selectedGrounding.filter(id => id !== action.payload)
          : [...state.selectedGrounding, action.payload],
      };

    case 'SET_INTEGRATION_CHOICE':
      return { ...state, integrationChoice: action.payload };

    case 'SET_COMPLETION_DATA':
      return { ...state, completionData: action.payload };

    case 'SET_COPIED':
      return { ...state, copied: action.payload };

    case 'SET_CURRENT_STEP':
      return {
        ...state,
        session: { ...state.session, currentStep: action.payload },
      };

    default:
      return state;
  }
}

// Custom hook
export function useWizardReducer(initialSession: MemoryReconsolidationSession): [WizardState, Dispatch<WizardAction>] {
  const initialState: WizardState = {
    session: initialSession,
    isLoading: false,
    error: null,
    beliefContext: '',
    selectedBeliefId: null,
    currentCycleIndex: 0,
    currentCycleStep: 'old-truth',
    cycleIntensities: {},
    isPaused: false,
    cycleNotes: {},
    postIntensity: null,
    emotionalNotes: '',
    somaticNotes: '',
    cognitiveShifts: '',
    searchFilter: '',
    selectedPractices: [],
    customPlan: '',
    schedulingCommitment: '',
    selectedGrounding: [],
    integrationChoice: null,
    completionData: null,
    copied: false,
  };

  return useReducer(wizardReducer, initialState);
}
