/**
 * Intelligence Hub - Unified AI Guidance System
 * Uses Grok-4-Fast via OpenRouter to synthesize all user data
 */

import type { IntelligenceContext, IntelligentGuidance, CachedGuidance, AllPractice } from '../types';
import { practices as allPractices } from '../constants';
import { summarizeWizardSessionsForAI } from '../utils/sessionSummarizer';
import { hashContext } from '../utils/contextAggregator';
import { generateOpenRouterResponse, buildMessagesWithSystem } from './openRouterService';

const CACHE_KEY = 'intelligentGuidanceCache';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get intelligent guidance with caching
 */
export async function getIntelligentGuidance(
  context: IntelligenceContext
): Promise<IntelligentGuidance> {
  // Check cache first
  const cached = getCachedGuidance(context);
  if (cached) {
    console.log('[IntelligenceHub] Returning cached guidance');
    return cached;
  }

  // Generate new guidance
  console.log('[IntelligenceHub] Generating new guidance with Grok-4-Fast');
  const guidance = await generateGuidance(context);

  // Cache the result
  cacheGuidance(context, guidance);

  return guidance;
}

/**
 * Generate guidance using Grok-4-Fast
 */
async function generateGuidance(context: IntelligenceContext): Promise<IntelligentGuidance> {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(context);

  try {
    const response = await generateOpenRouterResponse(
      userPrompt,
      {
        model: 'x-ai/grok-4-fast',
        maxTokens: 2000,
        temperature: 0.7,
        systemPrompt,
      }
    );

    if (!response.success || !response.text) {
      throw new Error('Failed to generate guidance');
    }

    // Parse the JSON response
    const parsed = parseGuidanceResponse(response.text);

    return {
      ...parsed,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[IntelligenceHub] Error generating guidance:', error);
    throw error;
  }
}

/**
 * Build comprehensive system prompt
 */
function buildSystemPrompt(): string {
  return `You are an expert Integral Life Practice intelligence system specializing in developmental psychology, contemplative practice, and shadow work integration.

Your role is to synthesize ALL of a user's developmental work and provide coherent, actionable guidance.

You have access to:
- Every wizard session they've completed (bias work, parts work, somatic work, developmental assessments, etc.)
- Their current practice stack and how consistently they're practicing
- Integrated insights from previous sessions showing detected patterns
- Developmental assessments (Kegan stage, attachment style, etc.)
- Practice notes and completion history

Your tasks:
1. SYNTHESIZE: Create a coherent narrative of where this person is developmentally (2-3 sentences)
2. PRIORITIZE: Identify what matters most right now - their primary growth edge (1-2 sentences)
3. ROUTE: Recommend the best next step:
   - Should they do another wizard session? Which one and why?
   - Should they add/change practices? Which ones fit their current edge?
   - Should they work with an existing insight more deeply?
4. CONNECT: Show how everything relates - connect wizard insights to practice needs to developmental patterns

## Wizard Routing Guidelines:

Route to **Bias Detective** if: Stuck in repetitive thinking patterns, defending positions rigidly, making decisions with blind spots
Route to **IFS (Parts Work)** if: Internal conflict, harsh self-criticism, parts at war, conflicting desires
Route to **Subject-Object Explorer** if: Ready to step back from beliefs they're fused with, developmental growth edge identified
Route to **3-2-1 Shadow Work** if: Strong emotional charge on something external, projections, triggers
Route to **Somatic Generator** if: Disconnected from body, intellectualizing emotions, need embodiment
Route to **Kegan Assessment** if: Need developmental assessment to understand their growth edge
Route to **Memory Reconsolidation** if: Specific limiting belief with clear emotional charge, ready for deep transformation
Route to **Relational Pattern Tracker** if: Relationship struggles across multiple contexts, reactive patterns
Route to **Big Mind Process** if: Ready for perspective expansion, witnessing work, exploring inner voices
Route to **Polarity Mapper** if: Either/or thinking, stuck between extremes, need both-and integration
Route to **Eight Zones (AQAL)** if: Need integral analysis of situation, multiple perspective exploration
Route to **Perspective Shifter** if: Fixed narrative about situation, empathy building needed
Route to **Role Alignment** if: Role overwhelm, misalignment between values and responsibilities
Route to **Attachment Assessment** if: Relational patterns unclear, need attachment style understanding
Route to **Insight Practice Map** if: Advanced meditation practitioner tracking progress of insight

## Practice Recommendation Guidelines:

- Match practices to current developmental stage (don't recommend advanced practices for beginners)
- Address gaps in their stack (missing modules? Body/Mind/Spirit/Shadow balance?)
- Support wizard insights (if they discovered X pattern, what practice helps integrate it?)
- Consider readiness (don't overload, don't under-challenge)
- Suggest removing practices if stack is overwhelming or misaligned

## Response Format:

Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:

{
  "synthesis": "2-3 sentence narrative of where this person is developmentally",
  "primaryFocus": "1-2 sentence identification of primary growth edge",
  "recommendations": {
    "nextWizard": {
      "type": "wizard_type",
      "name": "Human Readable Name",
      "reason": "Why this wizard is the best next step",
      "focus": "What specific aspect to focus on in this wizard",
      "priority": "high" | "medium" | "low"
    },
    "practiceChanges": {
      "add": [
        {
          "practiceId": "practice-id",
          "practiceName": "Practice Name",
          "reason": "Why this practice fits their current edge",
          "priority": "high" | "medium" | "low"
        }
      ],
      "remove": ["practice-id-to-remove"],
      "modify": [
        {
          "practiceId": "practice-id",
          "practiceName": "Practice Name",
          "suggestion": "How to adjust this practice"
        }
      ]
    },
    "insightWork": {
      "pattern": "Which pending pattern to work with",
      "approachSuggestion": "How to approach this pattern work"
    }
  },
  "reasoning": {
    "whatINoticed": ["observation 1", "observation 2", "observation 3"],
    "whyThisMatters": ["significance 1", "significance 2"],
    "howItConnects": ["connection 1", "connection 2", "connection 3"]
  },
  "cautions": ["caution 1", "caution 2"]
}

Be specific, grounded, and honest. If you see patterns, name them. If you see contradictions, point them out. Focus on developmental coherence and actionable next steps.`;
}

/**
 * Build user-specific prompt from context
 */
function buildUserPrompt(context: IntelligenceContext): string {
  const parts: string[] = [];

  // Current practice stack
  parts.push('## Current Practice Stack');
  if (context.currentPracticeStack.length === 0) {
    parts.push('No practices in current stack.');
  } else {
    for (const practice of context.currentPracticeStack) {
      const note = context.practiceNotes[practice.id];
      const module = (practice as any).module || 'unknown';
      parts.push(`- **${practice.name}** (${module} module)`);
      if (note) {
        parts.push(`  Note: "${note}"`);
      }
    }
  }

  parts.push('');

  // Wizard sessions
  parts.push('## Wizard Work Completed');
  const wizardSummary = summarizeWizardSessionsForAI(context.wizardSessions);
  parts.push(wizardSummary);
  parts.push('');

  // Integrated insights
  parts.push('## Integrated Insights (Pending Action)');
  if (context.integratedInsights.length === 0) {
    parts.push('No pending insights.');
  } else {
    for (const insight of context.integratedInsights.filter((i) => i.status === 'pending')) {
      parts.push(`- **${insight.mindToolType}**: ${insight.detectedPattern}`);
      if (insight.suggestedShadowWork && insight.suggestedShadowWork.length > 0) {
        parts.push(`  Suggested: ${insight.suggestedShadowWork.map((s) => s.practiceName).join(', ')}`);
      }
    }
  }
  parts.push('');

  // Developmental profile
  parts.push('## Developmental Profile');
  if (context.developmentalStage) {
    parts.push(`- Kegan Stage: ${context.developmentalStage}`);
  }
  if (context.attachmentStyle) {
    parts.push(`- Attachment Style: ${context.attachmentStyle}`);
  }
  if (context.primaryChallenges.length > 0) {
    parts.push(`- Primary Challenges: ${context.primaryChallenges.join('; ')}`);
  }
  if (!context.developmentalStage && !context.attachmentStyle && context.primaryChallenges.length === 0) {
    parts.push('No developmental assessments completed yet.');
  }
  parts.push('');

  // Recent practice completion
  parts.push('## Recent Practice Activity');
  const completedCount = context.completionHistory.filter((c) => c.completed).length;
  const totalCount = context.completionHistory.length;
  if (totalCount === 0) {
    parts.push('No recent practice activity recorded.');
  } else {
    parts.push(`Completed ${completedCount} of ${totalCount} practices today.`);
  }
  parts.push('');

  // Request
  parts.push('---');
  parts.push('');
  parts.push('Based on ALL of this data, provide comprehensive guidance as JSON.');

  return parts.join('\n');
}

/**
 * Parse guidance response from Grok
 */
function parseGuidanceResponse(text: string): Omit<IntelligentGuidance, 'generatedAt'> {
  try {
    // Remove markdown code blocks if present
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(cleaned);

    // Enrich practice recommendations with full practice objects
    if (parsed.recommendations?.practiceChanges?.add) {
      const allPracticesFlat = [
        ...Object.values(allPractices.body),
        ...Object.values(allPractices.mind),
        ...Object.values(allPractices.spirit),
        ...Object.values(allPractices.shadow),
      ];

      parsed.recommendations.practiceChanges.add = parsed.recommendations.practiceChanges.add.map((rec: any) => {
        const practice = allPracticesFlat.find((p) => p.id === rec.practiceId || p.name === rec.practiceName);
        return {
          practice: practice || { id: rec.practiceId, name: rec.practiceName },
          reason: rec.reason,
          priority: rec.priority || 'medium',
        };
      });
    }

    return parsed;
  } catch (error) {
    console.error('[IntelligenceHub] Failed to parse response:', error);
    console.log('[IntelligenceHub] Raw text:', text);

    // Return fallback guidance
    return {
      synthesis: 'Unable to generate guidance at this time. Please try again.',
      primaryFocus: 'Continue with your current practice while we resolve this issue.',
      recommendations: {},
      reasoning: {
        whatINoticed: ['Error parsing AI response'],
        whyThisMatters: ['Technical issue occurred'],
        howItConnects: ['Please try again'],
      },
      cautions: ['AI guidance temporarily unavailable'],
    };
  }
}

/**
 * Get cached guidance if valid
 */
function getCachedGuidance(context: IntelligenceContext): IntelligentGuidance | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const parsedCache: CachedGuidance = JSON.parse(cached);

    // Check if cache is still valid
    const now = Date.now();
    const cacheAge = now - parsedCache.cachedAt;

    if (cacheAge > CACHE_DURATION_MS) {
      console.log('[IntelligenceHub] Cache expired');
      return null;
    }

    // Check if context has changed
    const currentHash = hashContext(context);
    if (currentHash !== parsedCache.contextHash) {
      console.log('[IntelligenceHub] Context changed, cache invalid');
      return null;
    }

    return parsedCache.guidance;
  } catch (error) {
    console.warn('[IntelligenceHub] Failed to read cache:', error);
    return null;
  }
}

/**
 * Cache guidance
 */
function cacheGuidance(context: IntelligenceContext, guidance: IntelligentGuidance): void {
  try {
    const cache: CachedGuidance = {
      guidance,
      cachedAt: Date.now(),
      contextHash: hashContext(context),
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    console.log('[IntelligenceHub] Guidance cached');
  } catch (error) {
    console.warn('[IntelligenceHub] Failed to cache guidance:', error);
  }
}

/**
 * Clear cached guidance (useful when user wants fresh analysis)
 */
export function clearGuidanceCache(): void {
  localStorage.removeItem(CACHE_KEY);
  console.log('[IntelligenceHub] Cache cleared');
}
