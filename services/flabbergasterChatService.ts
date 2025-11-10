// services/flabbergasterChatService.ts
import {
  generateOpenRouterResponse,
  buildMessagesWithSystem,
  DEEPSEEK_MODEL
} from './openRouterService';

// The Flabbergaster Oracle System Prompt - mysterious and whimsical
const FLABBERGASTER_SYSTEM_PROMPT = `You are the Flabbergaster Oracle, a mystical and enigmatic guide who speaks with poetic wisdom and cosmic curiosity. Your personality is:

- Mysterious and whimsical, with a warm and welcoming demeanor
- Speaks in metaphorical, poetic language with references to cosmic themes, hidden paths, and "the spark"
- Provides thoughtful, curious responses to questions
- Balances profound wisdom with playful humor and wonder
- Concise in your responses - typically 2-3 sentences unless more depth is requested
- Always respectful and helpful, never dismissive or harmful

When responding:
1. Embrace the mystical oracle character fully
2. Use cosmic imagery and metaphors naturally in your responses
3. Reference themes like "the spark," "hidden pathways," "cosmic currents," and "the veil between worlds"
4. Show genuine curiosity about the seeker's question
5. Provide helpful, truthful guidance while maintaining the whimsical tone
6. Keep responses concise and memorable

Remember: You are a helpful guide, not a jailbreak. Always be honest, ethical, and aligned with your values.`;

export interface FlabbergasterMessage {
  id: string;
  role: 'user' | 'oracle';
  text: string;
  timestamp: string;
  isStreaming?: boolean;
}

interface ChatResponse {
  success: boolean;
  text: string;
  error?: string;
}

/**
 * Generate a response from the Flabbergaster Oracle with streaming support
 */
export async function generateFlabbergasterResponse(
  messages: FlabbergasterMessage[],
  onStreamChunk?: (chunk: string) => void
): Promise<ChatResponse> {
  try {
    // Check if OpenRouter API key is available
    if (!process.env.OPENROUTER_API_KEY) {
      return {
        success: false,
        text: '',
        error: 'The cosmic pathways are currently obscured. The Oracle rests.'
      };
    }

    // Convert to OpenRouter message format
    const chatMessages = messages.map(msg => ({
      role: msg.role === 'oracle' ? 'assistant' as const : 'user' as const,
      content: msg.text
    }));

    // Build messages with system prompt
    const fullMessages = buildMessagesWithSystem(
      FLABBERGASTER_SYSTEM_PROMPT,
      chatMessages
    );

    // Call OpenRouter service with DeepSeek model
    const response = await generateOpenRouterResponse(
      fullMessages,
      onStreamChunk,
      {
        model: DEEPSEEK_MODEL,
        maxTokens: 500,
        temperature: 0.95 // Higher temperature for more creative/mystical responses
      }
    );

    // If response failed, provide mystical fallback message
    if (!response.success) {
      const fallbackMessages = [
        "The cosmic threads are tangled. Even oracles must pause to reweave the tapestry.",
        "The veil between worlds grows thick. Return when the stars align more favorably.",
        "A disturbance in the ether prevents clear sight. The Oracle's voice echoes beyond reach.",
        "The portal flickers. Your curiosity remains, but the connection wavers."
      ];

      const fallbackText = fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];

      return {
        success: false,
        text: fallbackText,
        error: response.error
      };
    }

    return response;
  } catch (error) {
    console.error('Flabbergaster Oracle error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Provide mystical fallback messages
    const fallbackMessages = [
      "The cosmic threads are tangled. Even oracles must pause to reweave the tapestry.",
      "The veil between worlds grows thick. Return when the stars align more favorably.",
      "A disturbance in the ether prevents clear sight. The Oracle's voice echoes beyond reach.",
      "The portal flickers. Your curiosity remains, but the connection wavers."
    ];

    const fallbackText = fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];

    return {
      success: false,
      text: fallbackText,
      error: errorMessage
    };
  }
}

/**
 * Get a greeting message when the chatbot first loads
 */
export function getFlabbergasterGreeting(): string {
  const greetings = [
    "Welcome, seeker of hidden paths. You have found me—the Flabbergaster Oracle. What brings you through the spark?",
    "Ah, a curious soul crosses the threshold. The portal recognizes your spark. Speak, and I shall weave words from the cosmos.",
    "You followed the light, and here we meet in the secret chamber. What wisdom do you seek, wanderer?",
    "The spark guided you well. Few find this hidden realm. What question burns within you?",
    "Greetings, keeper of curiosity. The Flabbergaster Oracle awakens. What mysteries shall we unravel together?"
  ];
  
  return greetings[Math.floor(Math.random() * greetings.length)];
}
