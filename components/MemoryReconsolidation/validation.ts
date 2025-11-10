// Validation utilities for Memory Reconsolidation Wizard

import { MemoryReconsolidationStep } from '../../types';
import { VALIDATION_CONSTANTS } from './constants';

export interface ValidationContext {
  currentStep: MemoryReconsolidationStep;
  beliefContext: string;
  implicitBeliefsCount: number;
  contradictionInsightsCount: number;
  currentCycleIndex: number;
  juxtapositionCyclesLength: number;
  postIntensity: number | null;
  emotionalNotes: string;
  integrationChoice: 'curated' | 'self-guided' | null;
  selectedPracticesCount: number;
  customPlan: string;
  schedulingCommitment: string;
  selectedGroundingCount: number;
  isLoading: boolean;
}

export function canProceedToNext(context: ValidationContext): boolean {
  if (context.isLoading) return false;

  switch (context.currentStep) {
    case 'ONBOARDING':
      return true;

    case 'BELIEF_IDENTIFICATION':
      return (
        context.beliefContext.trim().length > VALIDATION_CONSTANTS.MIN_BELIEF_CONTEXT_LENGTH &&
        context.implicitBeliefsCount > 0
      );

    case 'CONTRADICTION_MINING':
      return context.contradictionInsightsCount > 0;

    case 'JUXTAPOSITION':
      return context.currentCycleIndex >= Math.min(VALIDATION_CONSTANTS.MAX_JUXTAPOSITION_CYCLES, context.juxtapositionCyclesLength);

    case 'GROUNDING':
      return context.postIntensity !== null && context.emotionalNotes.trim().length > 0;

    case 'INTEGRATION':
      return (
        context.integrationChoice !== null &&
        ((context.integrationChoice === 'curated' && context.selectedPracticesCount > 0) ||
          (context.integrationChoice === 'self-guided' && context.customPlan.trim().length > VALIDATION_CONSTANTS.MIN_CUSTOM_PLAN_LENGTH)) &&
        context.schedulingCommitment.trim().length > 0 &&
        context.selectedGroundingCount > 0
      );

    default:
      return true;
  }
}

export function validateBeliefContext(context: string): { isValid: boolean; error?: string } {
  if (context.trim().length < VALIDATION_CONSTANTS.MIN_BELIEF_CONTEXT_LENGTH) {
    return {
      isValid: false,
      error: `Please provide at least ${VALIDATION_CONSTANTS.MIN_BELIEF_CONTEXT_LENGTH} characters of context`,
    };
  }
  return { isValid: true };
}
