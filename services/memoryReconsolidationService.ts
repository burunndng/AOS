/**
 * Memory Reconsolidation Service
 *
 * Handles API communication for the Memory Reconsolidation feature.
 * Includes error handling, retry logic, timeouts, and request cancellation.
 */

import { ContradictionInsight, ImplicitBelief } from '../types.ts';

// =============================================================================
// Configuration
// =============================================================================

const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    // Client-side
    return process.env.NEXT_PUBLIC_API_URL || '/api';
  }
  // Server-side
  return process.env.API_URL || 'http://localhost:3000/api';
};

const BASE_URL = `${getBaseUrl()}/shadow/memory-reconsolidation`;

interface RequestConfig {
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

const DEFAULT_CONFIG: RequestConfig = {
  timeout: 30000, // 30 seconds
  retries: 3,
  headers: {},
};

// =============================================================================
// Custom Error Class
// =============================================================================

export class MemoryReconsolidationError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public endpoint?: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'MemoryReconsolidationError';
  }
}

// =============================================================================
// Type Definitions
// =============================================================================

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

export interface SubmitSessionCompletionPayload {
  sessionId: string;
  userId: string;
  finalBeliefs: ImplicitBelief[];
  contradictionInsights: ContradictionInsight[];
  personalReflection: string;
  commitments: string[];
  timestamp: string; // ISO string instead of Date
}

export interface RequestHandle<T> {
  cancel: () => void;
  promise: Promise<T>;
}

// =============================================================================
// Validation Functions
// =============================================================================

/**
 * Validates the Extract Beliefs payload
 * @throws {MemoryReconsolidationError} if validation fails
 */
function validateExtractBeliefsPayload(payload: ExtractImplicitBeliefsPayload): void {
  if (!payload.memoryNarrative?.trim()) {
    throw new MemoryReconsolidationError('Memory narrative is required');
  }
  if (payload.memoryNarrative.trim().length < 10) {
    throw new MemoryReconsolidationError('Memory narrative must be at least 10 characters');
  }
  if (payload.baselineIntensity !== undefined &&
      (payload.baselineIntensity < 1 || payload.baselineIntensity > 10)) {
    throw new MemoryReconsolidationError('Baseline intensity must be between 1 and 10');
  }
}

/**
 * Validates the Mine Contradictions payload
 * @throws {MemoryReconsolidationError} if validation fails
 */
function validateMineContradictionsPayload(payload: MineContradictionsPayload): void {
  if (!payload.beliefs || payload.beliefs.length === 0) {
    throw new MemoryReconsolidationError('At least one belief is required');
  }
  if (!payload.beliefIds || payload.beliefIds.length === 0) {
    throw new MemoryReconsolidationError('At least one belief ID is required');
  }
  if (payload.beliefs.length !== payload.beliefIds.length) {
    throw new MemoryReconsolidationError('Beliefs and belief IDs must have the same length');
  }
}

/**
 * Validates the Session Completion payload
 * @throws {MemoryReconsolidationError} if validation fails
 */
function validateSessionCompletionPayload(payload: SubmitSessionCompletionPayload): void {
  if (!payload.sessionId?.trim()) {
    throw new MemoryReconsolidationError('Session ID is required');
  }
  if (!payload.userId?.trim()) {
    throw new MemoryReconsolidationError('User ID is required');
  }
  if (!payload.timestamp) {
    throw new MemoryReconsolidationError('Timestamp is required');
  }
}

// =============================================================================
// Core HTTP Functions
// =============================================================================

/**
 * Helper function to serialize payloads, handling Date objects
 */
function serializePayload(payload: unknown): string {
  return JSON.stringify(payload, (key, value) => {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  });
}

/**
 * Handles API responses with proper error handling
 * @throws {MemoryReconsolidationError} if response is not ok or JSON parsing fails
 */
async function handleResponse<T>(response: Response, endpoint?: string): Promise<T> {
  if (!response.ok) {
    let errorMessage = 'An unexpected error occurred';

    try {
      const errorBody = await response.json();
      errorMessage = errorBody?.error || errorBody?.message || errorMessage;
    } catch (parseError) {
      errorMessage = response.statusText || errorMessage;
    }

    throw new MemoryReconsolidationError(
      errorMessage,
      response.status,
      endpoint
    );
  }

  try {
    return await response.json();
  } catch (parseError) {
    throw new MemoryReconsolidationError(
      'Failed to parse response JSON',
      response.status,
      endpoint,
      parseError as Error
    );
  }
}

/**
 * Makes a fetch request with timeout support
 * @throws {MemoryReconsolidationError} on timeout or network errors
 */
async function makeRequest<T>(
  endpoint: string,
  payload: unknown,
  config: RequestConfig = DEFAULT_CONFIG
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      body: serializePayload(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return handleResponse<T>(response, endpoint);
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new MemoryReconsolidationError('Request timeout', 408, endpoint);
    }
    throw error;
  }
}

/**
 * Makes a request with automatic retry on network failures
 * Uses exponential backoff for retries
 * @throws {MemoryReconsolidationError} after all retries exhausted
 */
async function makeRequestWithRetry<T>(
  endpoint: string,
  payload: unknown,
  config: RequestConfig = DEFAULT_CONFIG
): Promise<T> {
  let lastError: Error;
  const maxRetries = config.retries || 1;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await makeRequest<T>(endpoint, payload, config);
    } catch (error) {
      lastError = error as Error;

      // Don't retry on client errors (4xx) - these won't succeed on retry
      if (error instanceof MemoryReconsolidationError &&
          error.statusCode &&
          error.statusCode >= 400 &&
          error.statusCode < 500) {
        throw error;
      }

      // If this isn't the last attempt, wait before retrying
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff: 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));

        // Log retry attempt in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`Retrying request to ${endpoint} (attempt ${attempt + 1}/${maxRetries})`);
        }
      }
    }
  }

  throw lastError!;
}

/**
 * Makes a request with cancellation support
 */
function makeRequestWithCancellation<T>(
  endpoint: string,
  payload: unknown,
  config: RequestConfig = DEFAULT_CONFIG
): RequestHandle<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);

  const promise = fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...config.headers,
    },
    body: serializePayload(payload),
    signal: controller.signal,
  })
    .then(response => {
      clearTimeout(timeoutId);
      return handleResponse<T>(response, endpoint);
    })
    .catch(error => {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new MemoryReconsolidationError('Request cancelled or timeout', 408, endpoint);
      }
      throw error;
    });

  return {
    cancel: () => controller.abort(),
    promise,
  };
}

// =============================================================================
// Public API Functions
// =============================================================================

/**
 * Extracts implicit beliefs from a memory narrative
 *
 * @param payload - The memory narrative and optional context
 * @returns Extracted beliefs and summary
 * @throws {MemoryReconsolidationError} on validation or network errors
 *
 * @example
 * ```typescript
 * const response = await extractImplicitBeliefs({
 *   memoryNarrative: "I always feel inadequate at work...",
 *   baselineIntensity: 7
 * });
 * console.log(response.beliefs);
 * ```
 */
export async function extractImplicitBeliefs(
  payload: ExtractImplicitBeliefsPayload,
): Promise<ExtractImplicitBeliefsResponse> {
  validateExtractBeliefsPayload(payload);
  return makeRequestWithRetry('/extract-beliefs', payload);
}

/**
 * Extracts implicit beliefs with cancellation support
 * Useful for components that may unmount before request completes
 *
 * @example
 * ```typescript
 * const { promise, cancel } = extractImplicitBeliefsWithCancellation(payload);
 *
 * // Later, if component unmounts:
 * cancel();
 * ```
 */
export function extractImplicitBeliefsWithCancellation(
  payload: ExtractImplicitBeliefsPayload,
): RequestHandle<ExtractImplicitBeliefsResponse> {
  validateExtractBeliefsPayload(payload);
  return makeRequestWithCancellation('/extract-beliefs', payload);
}

/**
 * Mines contradictions for given beliefs
 *
 * @param payload - Beliefs to find contradictions for
 * @returns Contradictory evidence and integration guidance
 * @throws {MemoryReconsolidationError} on validation or network errors
 *
 * @example
 * ```typescript
 * const response = await mineContradictions({
 *   beliefs: [{ id: '1', belief: 'I am not good enough' }],
 *   beliefIds: ['1']
 * });
 * console.log(response.contradictions);
 * ```
 */
export async function mineContradictions(
  payload: MineContradictionsPayload,
): Promise<MineContradictionsResponse> {
  validateMineContradictionsPayload(payload);
  return makeRequestWithRetry('/mine-contradictions', payload);
}

/**
 * Mines contradictions with cancellation support
 */
export function mineContradictionsWithCancellation(
  payload: MineContradictionsPayload,
): RequestHandle<MineContradictionsResponse> {
  validateMineContradictionsPayload(payload);
  return makeRequestWithCancellation('/mine-contradictions', payload);
}

/**
 * Submits a completed memory reconsolidation session
 *
 * @param payload - Session completion data
 * @returns Success status and session ID
 * @throws {MemoryReconsolidationError} on validation or network errors
 *
 * @example
 * ```typescript
 * const response = await submitSessionCompletion({
 *   sessionId: 'session-123',
 *   userId: 'user-456',
 *   finalBeliefs: [...],
 *   contradictionInsights: [...],
 *   personalReflection: 'I learned...',
 *   commitments: ['Practice daily meditation'],
 *   timestamp: new Date().toISOString()
 * });
 * ```
 */
export async function submitSessionCompletion(
  payload: SubmitSessionCompletionPayload,
): Promise<{ success: boolean; sessionId: string }> {
  validateSessionCompletionPayload(payload);
  return makeRequestWithRetry('/complete', payload);
}

/**
 * Submits session completion with cancellation support
 */
export function submitSessionCompletionWithCancellation(
  payload: SubmitSessionCompletionPayload,
): RequestHandle<{ success: boolean; sessionId: string }> {
  validateSessionCompletionPayload(payload);
  return makeRequestWithCancellation('/complete', payload);
}
