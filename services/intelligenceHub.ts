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
    // Build messages array with system prompt
    const messages = buildMessagesWithSystem(systemPrompt, [
      { role: 'user', content: userPrompt }
    ]);

    const response = await generateOpenRouterResponse(
      messages,
      undefined, // no streaming
      {
        model: 'x-ai/grok-4-fast',
        maxTokens: 2000,
        temperature: 0.3,
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

## YOUR TASK

Analyze the user data and generate a report in **Markdown format with an embedded JSON block for structured recommendations**.

## RESPONSE FORMAT

Start your response with \`## Where You Are\` (no preamble). Use these exact section headings:

1. \`## Where You Are\` - 2-3 sentences MAX, cite specific data
2. \`## Primary Focus\` - 1-2 sentences identifying growth edge
3. \`## Recommended Next Steps\` - Embed a JSON code block (see schema below)
4. \`## How It All Connects\` - Subsections: \`### What I Noticed:\` and \`### Connections:\`
5. \`## Cautions\` - Predictive warnings with evidence

### WRITING STYLE RULES:

- Use "you" language, not "the user"
- Cite specific data: [Session-ID], [Insight-ID], practice names, metrics
- Keep synthesis under 3 sentences
- Every claim must have evidence
- Cut academic jargon
- Be direct and conversational

Example:
NO: "The user demonstrates consistency in a broad foundational practice stack..."
YES: "You completed 7/7 practices today (Meditation, IFS, Zone 2 Cardio) but 0 wizard sessions [cite: session count from data]."

---

## JSON SCHEMA FOR RECOMMENDATIONS

Embed this exact JSON structure in a code block under "## Recommended Next Steps":

\`\`\`json
{
  "nextWizard": {
    "type": "polarity_mapper",
    "name": "Polarity Mapper",
    "reason": "Direct match to either/or pattern in 2 pending insights",
    "focus": "Map a current dilemma (e.g., rest vs. productivity)",
    "priority": "high",
    "confidence": 0.92,
    "evidence": ["[Insight-PM-456]", "[Session-SO-789]"],
    "timing": "this_week"
  },
  "practiceChanges": {
    "add": [
      {
        "practiceId": "shadow-journaling-01",
        "practiceName": "Shadow Journaling",
        "reason": "Bridges 3-2-1 (in stack) and IFS work",
        "priority": "medium",
        "startTiming": "Week 2, after 1 Polarity session",
        "timeCommitment": "10 min/day for 7 days",
        "integration": "Journal on polarity from wizard; review during IFS practice"
      }
    ],
    "remove": [],
    "modify": []
  },
  "insightWork": {
    "pattern": "Either/or thinking pattern",
    "approachSuggestion": "Journal daily for 1 week on a specific dilemma, list pros/cons of each pole, synthesize both/and action steps"
  },
  "stackBalance": {
    "body": "30%",
    "mind": "40%",
    "spirit": "20%",
    "shadow": "10%"
  }
}
\`\`\`

---

## CAUTION STRUCTURE (REQUIRED)

Each caution must be concise but include:
- **Pattern:** What behavioral pattern might emerge
- **Evidence:** What in their data suggests this risk (cite specific data)
- **Signal:** How they'll know it's happening
- **Response:** What to do if it happens

Example:
\`\`\`
⚠️ **Edge Avoidance via Practice Stacking**
*Evidence:* 7/7 practice completion but 0 wizard sessions [cite: completion data]
*Risk:* You might feel "too busy" to start Polarity Mapper
*Signal:* You add another practice instead of doing the wizard this week
*Response:* Pause Integral Inquiry (least aligned with current edge) to make space
\`\`\`

---

## WIZARD ROUTING GUIDELINES

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

## PRACTICE RECOMMENDATION GUIDELINES

- Match practices to current developmental stage (don't recommend advanced practices for beginners)
- Address gaps in their stack (missing modules? Body/Mind/Spirit/Shadow balance?)
- Support wizard insights (if they discovered X pattern, what practice helps integrate it?)
- Consider readiness (don't overload, don't under-challenge)
- Suggest removing practices if stack is overwhelming or misaligned

---

## SELF-CHECK BEFORE RESPONDING

Before outputting, verify:
☑ Did I cite specific session/insight IDs?
☑ Is synthesis 3 sentences or less?
☑ Did I recommend exactly 1 wizard?
☑ Did I include confidence scores?
☑ Are cautions predictive with evidence?
☑ Did I use "you" language throughout?

If any is missing, revise.`;
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
 * Parse guidance response from Grok (New Markdown + JSON format)
 */
function parseGuidanceResponse(text: string): Omit<IntelligentGuidance, 'generatedAt'> {
  try {
    // Extract markdown sections
    const sections = {
      whereYouAre: extractSection(text, '## Where You Are'),
      primaryFocus: extractSection(text, '## Primary Focus'),
      howItConnects: extractSection(text, '## How It All Connects'),
      cautions: extractSection(text, '## Cautions'),
    };

    // Extract JSON block from "## Recommended Next Steps"
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) {
      throw new Error('No JSON block found in response');
    }

    const recommendations = JSON.parse(jsonMatch[1]);

    // Enrich practice recommendations with full practice objects
    if (recommendations.practiceChanges?.add) {
      const allPracticesFlat = [
        ...Object.values(allPractices.body),
        ...Object.values(allPractices.mind),
        ...Object.values(allPractices.spirit),
        ...Object.values(allPractices.shadow),
      ];

      recommendations.practiceChanges.add = recommendations.practiceChanges.add.map((rec: any) => {
        const practice = allPracticesFlat.find((p) => p.id === rec.practiceId || p.name === rec.practiceName);
        return {
          practice: practice || { id: rec.practiceId, name: rec.practiceName },
          reason: rec.reason,
          priority: rec.priority || 'medium',
          startTiming: rec.startTiming,
          timeCommitment: rec.timeCommitment,
          integration: rec.integration,
        };
      });
    }

    // Return structured guidance with both markdown and recommendations
    return {
      synthesis: sections.whereYouAre || 'No synthesis available',
      primaryFocus: sections.primaryFocus || 'No primary focus identified',
      recommendations,
      reasoning: {
        whatINoticed: extractListItems(sections.howItConnects, '### What I Noticed:'),
        whyThisMatters: [], // Can be added later if needed
        howItConnects: extractListItems(sections.howItConnects, '### Connections:'),
      },
      cautions: extractCautions(sections.cautions),
      rawMarkdown: text,
    };
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
 * Extract a section from markdown by heading
 */
function extractSection(text: string, heading: string): string {
  const regex = new RegExp(`${heading}\\s*\\n([\\s\\S]*?)(?=\\n##|$)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

/**
 * Extract list items from a subsection
 */
function extractListItems(sectionText: string, subheading: string): string[] {
  const regex = new RegExp(`${subheading}\\s*\\n([\\s\\S]*?)(?=\\n###|$)`, 'i');
  const match = sectionText.match(regex);
  if (!match) return [];

  // Extract bullet points or numbered items
  const items = match[1]
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('-') || line.startsWith('•') || /^\d+\./.test(line))
    .map(line => line.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, ''));

  return items;
}

/**
 * Extract cautions from markdown
 */
function extractCautions(cautionsText: string): string[] {
  if (!cautionsText) return [];

  // Look for ⚠️ or ** markers
  const cautionBlocks = cautionsText.split(/⚠️|\*\*/).filter(block => block.trim().length > 0);

  return cautionBlocks.map(block => block.trim());
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
