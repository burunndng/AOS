import { ContradictionInsight, ImplicitBelief } from '../types.ts';

const BASE_URL = '/api/shadow/memory-reconsolidation';

export interface ExtractImplicitBeliefsPayload {
  memoryNarrative: string;
  emotionalTone?: string;
  bodySensations?: string;
  baselineIntensity?: number;
  additionalContext?: Record<string, unknown>;
}

export interface ExtractImplicitBeliefsResponse {
  beliefs: ImplicitBelief[];
  summary: string;
}

export interface MineContradictionsPayload {
  beliefs: Array<{ id: string; belief: string }>;
  beliefIds: string[];
  contradictionSeeds?: string[];
  userSuppliedResources?: string[];
}

export interface MineContradictionsResponse {
  contradictions: ContradictionInsight[];
  juxtapositionCyclePrompts: string[];
  integrationGuidance: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = 'An unexpected error occurred';
    try {
      const errorBody = await response.json();
      errorMessage = errorBody?.error || errorBody?.message || errorMessage;
    } catch (err) {
      // Ignore JSON parse errors and fallback to status text
      errorMessage = response.statusText || errorMessage;
    }

    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

export async function extractImplicitBeliefs(
  payload: ExtractImplicitBeliefsPayload,
): Promise<ExtractImplicitBeliefsResponse> {
  const response = await fetch(`${BASE_URL}/extract-beliefs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<ExtractImplicitBeliefsResponse>(response);
}

export async function mineContradictions(
  payload: MineContradictionsPayload,
): Promise<MineContradictionsResponse> {
  const response = await fetch(`${BASE_URL}/mine-contradictions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<MineContradictionsResponse>(response);
}

export interface SubmitSessionCompletionPayload {
  sessionId: string;
  userId: string;
  finalBeliefs: ImplicitBelief[];
  contradictionInsights: ContradictionInsight[];
  personalReflection: string;
  commitments: string[];
  timestamp: Date;
}

export async function submitSessionCompletion(
  payload: SubmitSessionCompletionPayload,
): Promise<{ success: boolean; sessionId: string }> {
  const response = await fetch(`${BASE_URL}/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<{ success: boolean; sessionId: string }>(response);
}
