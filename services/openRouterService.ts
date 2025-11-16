// services/openRouterService.ts
import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { executeWithFallback, getFallbackModel, shouldUseFallback, logFallbackAttempt } from '../utils/modelFallback';

// Lazy initialization to avoid crashes when API key is not set
let openRouter: OpenAI | null = null;
let geminiClient: GoogleGenAI | null = null;

function getOpenRouterClient(): OpenAI {
  if (!openRouter) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is not set. Please configure your API key.');
    }
    openRouter = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      dangerouslyAllowBrowser: true, // Allow usage in browser for Vercel deployment
      defaultHeaders: {
        "HTTP-Referer": process.env.SITE_URL || "https://auraos.app",
        "X-Title": "Aura OS - Integral Life Practice"
      }
    });
  }
  return openRouter;
}

function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error('API_KEY is not set. Please configure your Gemini API key.');
    }
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

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
 * Helper function to call Gemini API for fallback from OpenRouter
 */
async function callGeminiFallback(
  messages: OpenRouterMessage[],
  maxTokens: number = 1000,
  temperature: number = 0.7
): Promise<string> {
  try {
    const geminiMessages = messages.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    }));

    const response = await getGeminiClient().models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: geminiMessages,
      config: {
        temperature,
        maxOutputTokens: maxTokens,
      }
    });

    return response.text || '';
  } catch (error) {
    throw new Error(`Gemini fallback failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate a response using OpenRouter with streaming support
 */
export async function generateOpenRouterResponse(
  messages: OpenRouterMessage[],
  onStreamChunk?: (chunk: string) => void,
  options: OpenRouterOptions = {}
): Promise<ChatResponse> {
  const {
    model = DEEPSEEK_MODEL,
    maxTokens = 1000,
    temperature = 0.7,
    preset,
    provider
  } = options;

  // Use executeWithFallback for automatic fallback handling
  return await executeWithFallback(
    'OpenRouter',
    model,
    async (primaryModel) => {
      try {
        console.log('[OpenRouter] API call started');
        console.log('[OpenRouter] Model:', primaryModel);
        console.log('[OpenRouter] Messages:', messages.length);
        console.log('[OpenRouter] Max tokens:', maxTokens);

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

        // Use streaming if callback provided
        if (onStreamChunk) {
          console.log('[OpenRouter] Using streaming mode');
          console.log('[OpenRouter] Creating stream...');
          const stream = await getOpenRouterClient().chat.completions.create({
            model: primaryModel,
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
          const response = await getOpenRouterClient().chat.completions.create({
            model: primaryModel,
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
    },
    async (fallbackModel) => {
      try {
        console.log('[OpenRouter] Attempting fallback to Gemini:', fallbackModel);
        const text = await callGeminiFallback(messages, maxTokens, temperature);
        console.log('[OpenRouter] Gemini fallback succeeded. Length:', text.length);
        return { success: true, text };
      } catch (error) {
        console.error('OpenRouter Gemini fallback error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          success: false,
          text: 'Unable to generate response. Please try again.',
          error: errorMessage
        };
      }
    }
  );
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
