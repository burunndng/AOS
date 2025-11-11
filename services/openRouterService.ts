// services/openRouterService.ts
import OpenAI from 'openai';

// Initialize OpenRouter client (OpenAI-compatible)
const openRouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  dangerouslyAllowBrowser: true // Allow usage in browser for Vercel deployment
});

// Default model for IntegralBodyArchitect (using a reliable model for JSON output)
export const DEFAULT_MODEL = 'openai/gpt-4o-mini';

// Alternative models for testing
export const DEEPSEEK_MODEL = 'deepseek/deepseek-v3.2-exp';
export const QWEN_MODEL = 'qwen/qwen3-235b-a22b-2507';

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
    // Check if OpenRouter API key is available
    if (!process.env.OPENROUTER_API_KEY) {
      console.error('[OpenRouter] API key not configured');
      return {
        success: false,
        text: '',
        error: 'OpenRouter API key is not configured.'
      };
    }

    const {
      model = DEFAULT_MODEL,
      maxTokens = 1000,
      temperature = 0.7,
      preset
    } = options;

    console.log(`[OpenRouter] Calling model: ${model} with maxTokens: ${maxTokens}`);

    // Use streaming if callback provided
    if (onStreamChunk) {
      console.log('[OpenRouter] Using streaming mode');
      const stream = await openRouter.chat.completions.create({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        stream: true,
        ...(preset ? { preset } : {}),
      });

      let fullText = '';
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || '';
        fullText += text;
        if (text) {
          onStreamChunk(text);
        }
      }
      console.log(`[OpenRouter] Stream complete, received ${fullText.length} characters`);
      return { success: true, text: fullText };
    } else {
      // Fallback to non-streaming
      console.log('[OpenRouter] Using non-streaming mode');
      const response = await openRouter.chat.completions.create({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        ...(preset ? { preset } : {}),
      });

      const text = response.choices[0]?.message?.content || '';
      console.log(`[OpenRouter] Received response: ${text.length} characters`);
      return { success: true, text };
    }
  } catch (error) {
    console.error('[OpenRouter] API error:', error);
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
