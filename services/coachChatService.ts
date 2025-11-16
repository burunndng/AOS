/**
 * AI Practice Coach Chat Service
 * Uses OpenRouter API for conversational coaching (frontend implementation)
 */

import {
  generateOpenRouterResponse,
  buildMessagesWithSystem,
} from './openRouterService';

export interface CoachMessage {
  role: 'user' | 'coach';
  text: string;
}

export interface AppStructure {
  tabs: {
    dashboard: string;
    stack: string;
    browse: string;
    tracker: string;
    streaks: string;
    recommendations: string;
    aqal: string;
    mindTools: string;
    bodyTools: string;
    spiritTools: string;
    shadowTools: string;
    library: string;
    journal: string;
    quiz: string;
  };
  modules: {
    body: string;
    mind: string;
    spirit: string;
    shadow: string;
  };
  frameworks: {
    learyCircuits: string;
    wilberStages: string;
  };
}

export interface CoachContext {
  practiceStack: Array<{ id: string; name: string; module?: string }>;
  completedCount: number;
  completionRate: number;
  timeCommitment: number;
  timeIndicator: string;
  modules: Record<string, { name: string; count: number }>;
  practiceNotes: Record<string, string>;
  dailyNotes: Record<string, string>;
  userProfile?: {
    experienceLevel: 'beginner' | 'intermediate' | 'advanced';
    preferredIntensity: 'low' | 'moderate' | 'high' | 'variable';
    recurringPatterns?: string[];
    commonBlockers?: string[];
    practiceComplianceRate?: number;
  };
  appStructure?: AppStructure;
}

interface ChatResponse {
  success: boolean;
  text: string;
  error?: string;
}

/**
 * Build the coach system prompt with user context
 */
function buildCoachPrompt(context: CoachContext, userMessage: string): string {
  const today = new Date().toISOString().split('T')[0];

  // Build practice stack context
  const stackContext =
    context.practiceStack.length > 0
      ? `Current practice stack:\n${context.practiceStack
          .map((p) => {
            const generalNote = context.practiceNotes[p.id]
              ? ` (General note: "${context.practiceNotes[p.id]}")`
              : '';
            const dailyNoteKey = `${p.id}-${today}`;
            const todayNote = context.dailyNotes[dailyNoteKey]
              ? ` (Today's note: "${context.dailyNotes[dailyNoteKey]}")`
              : '';
            return `- ${p.name}${generalNote}${todayNote}`;
          })
          .join('\n')}`
      : 'User has not selected any practices yet.';

  // Build module breakdown
  const moduleBreakdown = Object.entries(context.modules)
    .map(([key, mod]) => (mod.count > 0 ? `${mod.name}: ${mod.count}` : null))
    .filter(Boolean)
    .join(', ');

  // Build completion context
  const completionContext =
    context.practiceStack.length > 0
      ? `Completion status today: ${context.completedCount}/${context.practiceStack.length} practices marked complete (${context.completionRate}%).`
      : '';

  // Build time context
  const timeContext = `Total weekly commitment: ${context.timeCommitment.toFixed(
    1
  )} hours (${context.timeIndicator}).`;

  // Build user profile context
  let profileContext = '';
  if (context.userProfile) {
    profileContext = `
User profile:
- Experience: ${context.userProfile.experienceLevel}
- Intensity preference: ${context.userProfile.preferredIntensity}
- Compliance: ${((context.userProfile.practiceComplianceRate ?? 0) * 100).toFixed(
      0
    )}%${
      context.userProfile.recurringPatterns &&
      context.userProfile.recurringPatterns.length > 0
        ? `\n- Recurring patterns: ${context.userProfile.recurringPatterns.slice(0, 2).join(', ')}`
        : ''
    }${
      context.userProfile.commonBlockers && context.userProfile.commonBlockers.length > 0
        ? `\n- Blockers to address: ${context.userProfile.commonBlockers.slice(0, 2).join(', ')}`
        : ''
    }`;
  }

  // Build app structure context
  let appStructureContext = '';
  if (context.appStructure) {
    appStructureContext = `
Available tools & features:
- Dashboard: Daily overview & quick access
- Stack: Manage your practice list
- Browse: Discover & add new practices
- Tracker: Log daily completions
- Streaks: Track consistency over time
- Recommendations: Get AI-powered suggestions
- AQAL Map: Understand your development across all dimensions
- Module Tools: Dive deep into Body, Mind, Spirit, Shadow work
- Library: Search all available practices
- Journal: Track insights & address them with practices
- Quiz: Self-assess your experience level
- Consciousness Map: Explore Leary's 8 Circuits & Wilber's stages of development`;
  }

  // Build the complete prompt
  return `You are a concise ILP (Integrative Life Practices) coach helping someone with transformative practices.

FRAMEWORKS: Grounded in Leary's 8 Neurological Circuits & Wilber's developmental stages. Reference these when relevant.

User's context:
- ${stackContext}
- Modules: ${moduleBreakdown || 'None selected'}
- ${completionContext}
- ${timeContext}${profileContext}${appStructureContext}

User asked: "${userMessage}"

CRITICAL: Respond in 30-40 words MAX. Be direct, warm, and grounded.
- Reference their profile/patterns & available features when relevant
- Guide them to specific tabs/tools when they need guidance
- Suggest smaller changes if struggling, bigger if motivated
- Be authentic and conversational
- Mention relevant frameworks (Leary circuits, Wilber stages) when addressing consciousness/development`;
}

/**
 * Generate a coach response with streaming support
 */
export async function generateCoachResponse(
  context: CoachContext,
  userMessage: string,
  conversationHistory: CoachMessage[],
  onStreamChunk?: (chunk: string) => void
): Promise<ChatResponse> {
  try {
    // Check if OpenRouter API key is available
    if (!process.env.OPENROUTER_API_KEY) {
      return {
        success: false,
        text: '',
        error: 'OpenRouter API key is not configured.',
      };
    }

    // Build the prompt
    const systemPrompt = buildCoachPrompt(context, userMessage);

    // Convert conversation history to OpenRouter message format
    const chatMessages = conversationHistory.map((msg) => ({
      role: msg.role === 'coach' ? ('assistant' as const) : ('user' as const),
      content: msg.text,
    }));

    // Add the current user message
    chatMessages.push({
      role: 'user' as const,
      content: userMessage,
    });

    // Build messages with system prompt
    const fullMessages = buildMessagesWithSystem(systemPrompt, chatMessages);

    // Call OpenRouter service with DeepSeek model
    const response = await generateOpenRouterResponse(
      fullMessages,
      onStreamChunk,
      {
        model: 'deepseek/deepseek-v3.2-exp',
        maxTokens: 120,
        temperature: 0.5,
      }
    );

    return response;
  } catch (error) {
    console.error('[Coach] Error generating response:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      success: false,
      text: "Sorry, I'm having trouble connecting.",
      error: errorMessage,
    };
  }
}
