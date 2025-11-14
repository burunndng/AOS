// services/openRouterService.ts
import OpenAI from 'openai';

// Initialize OpenRouter client (OpenAI-compatible)
const openRouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  dangerouslyAllowBrowser: true, // Allow usage in browser for Vercel deployment
  defaultHeaders: {
    "HTTP-Referer": process.env.SITE_URL || "https://auraos.app",
    "X-Title": "Aura OS - Integral Life Practice"
  }
});

// Default model for IntegralBodyArchitect
export const DEFAULT_MODEL = 'qwen/qwen3-235b-a22b-2507';

// Fast Qwen model optimized for low latency
export const QWEN_FAST_MODEL = 'qwen/qwen3-30b-a3b-instruct-2507';

// Default DeepSeek model (kept for backward compatibility)
export const DEEPSEEK_MODEL = 'deepseek/deepseek-v3.2-exp';

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  preset?: string;
  provider?: {
    quantizations?: string[];
    sort?: string;
  };
}

interface ChatResponse {
  success: boolean;
  text: string;
  error?: string;
}

/**
 * Generate a response using OpenRouter with streaming support
 */
export async function generateOpenRouterResponse(
  messages: OpenRouterMessage[],
  onStreamChunk?: (chunk: string) => void,
  options: OpenRouterOptions = {}
): Promise<ChatResponse> {
  try {
    console.log('[OpenRouter] API call started');
    console.log('[OpenRouter] Model:', options.model || DEEPSEEK_MODEL);
    console.log('[OpenRouter] Messages:', messages.length);
    console.log('[OpenRouter] Max tokens:', options.maxTokens || 1000);

    // Check if OpenRouter API key is available
    if (!process.env.OPENROUTER_API_KEY) {
      console.error('[OpenRouter] API key is missing!');
      return {
        success: false,
        text: '',
        error: 'OpenRouter API key is not configured.'
      };
    }

    console.log('[OpenRouter] API key is configured');

    const {
      model = DEEPSEEK_MODEL,
      maxTokens = 1000,
      temperature = 0.7,
      preset,
      provider
    } = options;

    // Use streaming if callback provided
    if (onStreamChunk) {
      console.log('[OpenRouter] Using streaming mode');
      console.log('[OpenRouter] Creating stream...');
      const stream = await openRouter.chat.completions.create({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        stream: true,
        ...(preset ? { preset } : {}),
        ...(provider ? { provider } : {}),
      });

      console.log('[OpenRouter] Stream created, reading chunks...');
      let fullText = '';
      let chunkCount = 0;
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || '';
        fullText += text;
        chunkCount++;
        if (text) {
          onStreamChunk(text);
        }
      }
      console.log('[OpenRouter] Stream completed. Chunks:', chunkCount, 'Total length:', fullText.length);
      return { success: true, text: fullText };
    } else {
      // Fallback to non-streaming
      console.log('[OpenRouter] Using non-streaming mode');
      console.log('[OpenRouter] Making API call...');
      const response = await openRouter.chat.completions.create({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        ...(preset ? { preset } : {}),
        ...(provider ? { provider } : {}),
      });

      const text = response.choices[0]?.message?.content || '';
      console.log('[OpenRouter] Response received. Length:', text.length);
      return { success: true, text };
    }
  } catch (error) {
    console.error('OpenRouter API error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      success: false,
      text: 'Unable to generate response. Please try again.',
      error: errorMessage
    };
  }
}

/**
 * Helper function to build messages array with system prompt
 */
export function buildMessagesWithSystem(
  systemPrompt: string,
  conversationMessages: Array<{ role: 'user' | 'assistant'; content: string }>
): OpenRouterMessage[] {
  return [
    { role: 'system', content: systemPrompt },
    ...conversationMessages
  ];
}

// ============================================================================
// Cross-Wizard Intelligence Types
// ============================================================================

/**
 * Represents a recommendation for the next therapeutic wizard to use
 */
export interface WizardRecommendation {
  /** The recommended wizard to use next */
  wizard: 'memory-recon' | 'ifs' | '3-2-1' | 'eight-zones';

  /** Confidence score (0-1) for this recommendation */
  confidence: number;

  /** Brief explanation of why this wizard is recommended */
  reason: string;

  /** Specific focus area or question to explore in the recommended wizard */
  specificFocus: string;
}

/**
 * Complete analysis result with recommendations and synthesis
 */
export interface AnalysisResult {
  /** List of recommended wizards, ordered by confidence */
  recommendations: WizardRecommendation[];

  /** Overall synthesis of the session and suggested therapeutic direction */
  synthesis: string;

  /** Optional caution or important consideration for the user */
  caution?: string;
}

/**
 * Request payload for suggesting next step
 */
export interface SuggestNextStepRequest {
  /** Summary of the completed session */
  sessionSummary: string;

  /** Type of wizard that was just completed */
  wizardType: 'memory-recon' | 'ifs' | '3-2-1' | 'eight-zones';

  /** Optional: Previous sessions in the thread for context */
  threadContext?: string[];
}

/**
 * Response from suggest-next-step API
 */
export interface SuggestNextStepResponse {
  /** Analysis result with recommendations */
  analysis: AnalysisResult;

  /** Whether the request was successful */
  success: boolean;

  /** Error message if request failed */
  error?: string;
}
