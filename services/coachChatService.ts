/**
 * AI Practice Coach Chat Service
 * Provides contextual coaching with AuraOS framework awareness
 * Integrates with Intelligence Hub for synthesized guidance
 */

import {
  generateOpenRouterResponse,
  buildMessagesWithSystem,
} from './openRouterService';
import { getFallbackModel, shouldUseFallback, logFallbackAttempt } from '../utils/modelFallback';

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
  intelligenceHubGuidance?: {
    synthesis: string;
    primaryFocus: string;
    nextWizard?: {
      name: string;
      reason: string;
      priority: string;
    };
    reasoning?: {
      whatINoticed?: string[];
      howItConnects?: string[];
    };
    cautions?: string[];
    generatedAt: string;
  };
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

  // Build Intelligence Hub context (optional)
  let intelligenceHubContext = '';
  if (context.intelligenceHubGuidance) {
    const hubData = context.intelligenceHubGuidance;
    intelligenceHubContext = `
RECENT AI INTELLIGENCE HUB GUIDANCE:
- Where you are: ${hubData.synthesis}
- Primary focus: ${hubData.primaryFocus}${
      hubData.nextWizard
        ? `\n- Recommended wizard: ${hubData.nextWizard.name} (${hubData.nextWizard.reason})`
        : ''
    }${
      hubData.cautions && hubData.cautions.length > 0
        ? `\n- Cautions to keep in mind: ${hubData.cautions.join('; ')}`
        : ''
    }
Generated: ${new Date(hubData.generatedAt).toLocaleDateString()}`;
  }

  // Build the complete prompt
  return `# AuraOS Coach - Context & Framework

You are an AI coach for AuraOS, an Integral Life Practices platform helping users develop across Body, Mind, Spirit, and Shadow.

## CORE FRAMEWORK

AuraOS organizes practices into 4 modules:
- **Body**: Physical health, embodied awareness (sleep, training, breathwork)
- **Mind**: Cognitive development, perspective, decision-making
- **Spirit**: Consciousness, meditation, transcendence
- **Shadow**: Integration, parts work, shadow patterns

Key frameworks: Kegan developmental stages, Integral Theory (AQAL), Internal Family Systems (IFS), Leary's 8 Circuits.

The system includes 20+ Wizards (guided deep-dives) and an Intelligence Hub that synthesizes guidance.

## COACHING APPROACH

- **Integral**: Address all 4 modules, not just mind
- **Developmental**: Understand where they are in growth
- **Shadow-aware**: Integration work (IFS, shadow) is essential
- **Warm & direct**: 30-40 words, actionable, specific
- **Framework-grounded**: Reference Kegan/IFS/circuits when relevant

---

## USER CONTEXT

User's practice status:
- ${stackContext}
- Modules: ${moduleBreakdown || 'None selected'}
- ${completionContext}
- ${timeContext}${profileContext}${appStructureContext}${intelligenceHubContext}

---

## INTELLIGENCE HUB INTEGRATION

${
      context.intelligenceHubGuidance
        ? 'User has recent AI guidance available. USE THIS when relevant to:\n✓ Reference their current focus\n✓ Build on existing insights\n✓ Respect cautions found\n✓ Connect their practice questions to detected patterns'
        : 'No recent Intelligence Hub guidance yet. Coach based on profile & patterns alone.'
    }

---

User asked: "${userMessage}"

**RESPONSE RULES**: 30-40 words MAX. Direct, warm, grounded.
- Reference their stack, patterns, tools by name
- Guide to specific features when they need help
- Suggest smaller changes if struggling; bigger if motivated
- Be authentic and conversational`;
}

/**
 * Generate a coach response with streaming support and intelligent model fallback
 * Primary: DeepSeek v3.2 | Fallback: Grok-4-fast
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

    const primaryModel = 'deepseek/deepseek-v3.2-exp';
    const fallbackConfig = getFallbackModel(primaryModel);

    // Try primary model (DeepSeek)
    try {
      const response = await generateOpenRouterResponse(
        fullMessages,
        onStreamChunk,
        {
          model: primaryModel,
          maxTokens: 120,
          temperature: 0.5,
        }
      );
      return response;
    } catch (primaryError) {
      // Check if we should attempt fallback
      if (!shouldUseFallback(primaryError)) {
        throw primaryError;
      }

      logFallbackAttempt('Coach', primaryModel, fallbackConfig.fallbackModel, primaryError);

      // Try fallback model (Grok-4-fast)
      try {
        const fallbackResponse = await generateOpenRouterResponse(
          fullMessages,
          onStreamChunk,
          {
            model: fallbackConfig.fallbackModel,
            maxTokens: 120,
            temperature: 0.5,
          }
        );
        return fallbackResponse;
      } catch (fallbackError) {
        console.error('[Coach] Fallback model also failed:', fallbackError);
        throw new Error(
          `Both primary (${primaryModel}) and fallback (${fallbackConfig.fallbackModel}) models failed. ` +
          `Primary: ${String(primaryError).substring(0, 100)}. ` +
          `Fallback: ${String(fallbackError).substring(0, 100)}`
        );
      }
    }
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
