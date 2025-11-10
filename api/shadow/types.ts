/**
 * Shadow Work Module Types
 * Type definitions for Memory Reconsolidation and belief work features
 */

export type BeliefCategory = 'identity' | 'capability' | 'worthiness' | 'safety' | 'belonging' | 'possibility' | 'other';
export type AffectTone = 'shame' | 'fear' | 'anger' | 'sadness' | 'grief' | 'confusion' | 'mixed' | 'neutral';

export interface ImplicitBelief {
  id: string;
  belief: string;
  emotionalCharge: number;
  category: BeliefCategory;
  affectTone: AffectTone;
  bodyLocation?: string;
  originStory?: string;
  limitingPatterns?: string[];
  depth: 'surface' | 'moderate' | 'deep';
}

export interface ContradictionInsight {
  beliefId: string;
  anchors: string[];
  newTruths: string[];
  regulationCues: string[];
  juxtapositionPrompts: string[];
  dateIdentified?: string;
}

export interface SessionCompletionSummary {
  acknowledgement: string;
  closingPrompt: string;
  integrationReminder: string;
}

export interface ExtractBeliefsRequest {
  memoryNarrative: string;
  emotionalTone?: string;
  bodySensations?: string;
  baselineIntensity?: number;
  additionalContext?: Record<string, any>;
}

export interface ExtractBeliefsResponse {
  beliefs: ImplicitBelief[];
  summary: string;
}

export interface MineContradictionsRequest {
  beliefIds: string[];
  beliefs: Array<{ id: string; belief: string }>;
  contradictionSeeds?: string[];
  userSuppliedResources?: string[];
}

export interface MineContradictionsResponse {
  contradictions: ContradictionInsight[];
  juxtapositionCyclePrompts: string[];
  integrationGuidance: string;
}

export interface CompleteSessionRequest {
  intensityShift: number;
  integrationChoice: string;
  notes?: string;
  sessionContext?: string;
}

export interface CompleteSessionResponse {
  acknowledgement: string;
  closingPrompt: string;
  integrationReminder: string;
}
