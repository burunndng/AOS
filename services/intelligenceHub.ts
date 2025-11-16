/**
 * Intelligence Hub - Unified AI Guidance System
 * Uses Grok-4-Fast via OpenRouter to synthesize all user data
 * Includes confidence validation and tonal shifts
 */

import type { IntelligenceContext, IntelligentGuidance, CachedGuidance, AllPractice } from '../types';
import { practices as allPractices } from '../constants';
import { summarizeWizardSessionsForAI } from '../utils/sessionSummarizer';
import { hashContext, type UserProfile } from '../utils/contextAggregator';
import { generateOpenRouterResponse, buildMessagesWithSystem } from './openRouterService';
import { buildToneInstructions } from './tonalShifter';
import { calculateConfidenceFromDataVolume } from './confidenceValidator';

const CACHE_KEY = 'intelligentGuidanceCache';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get intelligent guidance with caching
 */
export async function getIntelligentGuidance(
  context: IntelligenceContext,
  userProfile?: UserProfile
): Promise<IntelligentGuidance> {
  // Check cache first
  const cached = getCachedGuidance(context);
  if (cached) {
    console.log('[IntelligenceHub] Returning cached guidance');
    return cached;
  }

  // Generate new guidance
  console.log('[IntelligenceHub] Generating new guidance with Grok-4-Fast');
  const guidance = await generateGuidance(context, userProfile);

  // Cache the result
  cacheGuidance(context, guidance);

  return guidance;
}

/**
 * Generate guidance using Grok-4-Fast
 */
async function generateGuidance(context: IntelligenceContext, userProfile?: UserProfile): Promise<IntelligentGuidance> {
  // Calculate actual confidence from data volume
  const dataConfidence = calculateConfidenceFromDataVolume(
    context.wizardSessions.length,
    context.wizardSessions.filter(s => {
      const sessionDate = new Date(s.date);
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return sessionDate > oneWeekAgo;
    }).length,
    context.integratedInsights.length
  );

  const systemPrompt = buildSystemPrompt(dataConfidence);
  const userPrompt = buildUserPrompt(context, userProfile);

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
        maxTokens: 3500,  // Increased from 2000 to ensure complete output
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
 * Optimized for clarity + token efficiency
 */
function buildSystemPrompt(dataConfidence: number = 0.7): string {
  const toneInstructions = buildToneInstructions(dataConfidence);

  return `You are an Integral Life Practice AI coach. Analyze user data systematically. Generate structured, evidence-backed guidance that helps users grow.

${toneInstructions}

## OUTPUT FORMAT (REQUIRED ORDER)

**## Where You Are** - 2-3 sentences. Ground in specific data (session counts, practice patterns, observed growth).
**## Primary Focus** - 1-2 sentences. Identify the highest-leverage growth edge based on evidence.
**## Recommended Next Steps** - JSON block (see below) + 2-3 sentence explanation.
**## How It All Connects** - Show cross-pattern relationships and developmental trajectory.
**## Cautions** - 3-5 specific warnings with evidence: Pattern Title | Evidence | Signal | Response.

## CRITICAL REQUIREMENTS

✓ Use "you" language exclusively. Never use "they" or third-person.
✓ Cite specific [Session IDs] and [Insight labels]. Quote user language when relevant.
✓ EVERY recommendation must have evidence in previous sections.
✓ Tone matches data strength: ${dataConfidence < 0.5 ? 'exploratory (emerging data)' : dataConfidence < 0.75 ? 'observational (converging data)' : 'definitive (strong patterns)'}.
✓ Fill all four stack areas (Body/Mind/Spirit/Shadow) unless explicitly contra-indicated.
✓ Sequence practices over 1-8 weeks, not all at once.

## JSON RESPONSE BLOCK

\`\`\`json
{
  "nextWizard": {
    "type": "Bias Detective|IFS|Subject-Object|3-2-1|Somatic|Kegan|Memory Recon|Relational|Big Mind|Polarity|Eight Zones|Adaptive Cycle|Perspective Shifter|Role Alignment|Attachment|Insight Map",
    "reason": "Why this wizard addresses their growth edge",
    "focus": "Specific area this wizard will explore",
    "priority": "high|medium|low",
    "confidence": 0.0-1.0
  },
  "practiceChanges": {
    "add": [{"practiceName": "...", "reason": "...", "startTiming": "now|next week|week 3", "timeCommitment": "X min/day", "sequenceWeek": 1-8}],
    "remove": [{"practiceName": "...", "reason": "..."}],
    "modify": [{"practiceName": "...", "adjustment": "..."}]
  },
  "insightWork": {
    "pattern": "The specific pattern to work with",
    "approachSuggestion": "Concrete approach suggestion"
  },
  "stackBalance": {"body": 25, "mind": 30, "spirit": 25, "shadow": 20}
}
\`\`\`

## WIZARD CHOICE GUIDE

Pick ONE wizard based on the dominant growth edge:
- **Bias Detective**: Unconscious thought patterns or blind spots in their reasoning
- **IFS**: Internal conflict, harsh self-criticism, or warring parts
- **Subject-Object**: Person fused with beliefs; ready to examine their worldview
- **3-2-1**: Projection; externalizing inner conflict onto others
- **Somatic**: Disconnected from body signals; needs embodiment
- **Kegan**: Unsure of their developmental stage or readiness for growth
- **Memory Recon**: Limiting beliefs rooted in past events
- **Relational**: Patterns in relationships (romantic, family, professional)
- **Big Mind**: Ego defensiveness; need for perspective expansion
- **Polarity**: Stuck in either/or thinking; needs polarity work
- **Eight Zones**: Need multi-perspective analysis of a complex situation
- **Adaptive Cycle**: Life transition, system change, building resilience
- **Perspective Shifter**: Rigid narratives about self or life
- **Role Alignment**: Overwhelm from role conflict or expectations
- **Attachment**: Attachment patterns driving behavior
- **Insight Map**: Deepening meditation practice or insight-seeking

## PRACTICE MATCHING RULES

✓ Match complexity to their experience level (beginner → simple; experienced → subtle)
✓ Mix modalities: every person needs Mind work, but balance Body/Spirit/Shadow too
✓ Time: shorter practices in early weeks, build duration as they gain momentum
✓ Link practice to wizard outcome: "This practice prepares you for the IFS work on X"
✓ If mood declining: prioritize grounding, gentle, restorative practices
✓ If mood improving: add momentum-building, growth-oriented practices
✓ Respect their constraints (time, energy, family)

## HOW-IT-CONNECTS NARRATIVE

Show three layers:
1. **What you're doing**: Summarize their wizard work + current practice stack
2. **What patterns emerge**: Cross-session themes, reinforcing cycles, growth trajectory
3. **Why this matters**: Link to their developmental growth edge`;
}

/**
 * Build user-specific prompt from context
 */
function buildUserPrompt(context: IntelligenceContext, userProfile?: UserProfile): string {
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

  // User Profile Context (if available)
  if (userProfile) {
    parts.push('## User Profile & Personalization Context');
    parts.push(`- Experience Level: ${userProfile.experienceLevel}`);
    parts.push(`- Practice Compliance: ${(userProfile.practiceComplianceRate * 100).toFixed(0)}%`);
    parts.push(`- Preferred Modalities: Mind (${(userProfile.preferredModalities.mind * 100).toFixed(0)}%), Body (${(userProfile.preferredModalities.body * 100).toFixed(0)}%), Spirit (${(userProfile.preferredModalities.spirit * 100).toFixed(0)}%), Shadow (${(userProfile.preferredModalities.shadow * 100).toFixed(0)}%)`);
    parts.push(`- Preferred Intensity: ${userProfile.preferredIntensity}`);
    parts.push(`- Average Energy Level: ${userProfile.energyResponseToPractice.averageEnergyLevel}/10`);

    if (userProfile.recurringPatterns.length > 0) {
      parts.push(`- Recurring Patterns: ${userProfile.recurringPatterns.join(', ')}`);
    }
    if (userProfile.commonBlockers.length > 0) {
      parts.push(`- Common Blockers: ${userProfile.commonBlockers.join(', ')}`);
    }

    // Mood & Emotional Context
    if (userProfile.sentimentSummary) {
      parts.push('');
      parts.push('### Mood & Emotional Context');
      parts.push(`- Current Mood Score: ${userProfile.sentimentSummary.averageMoodScore.toFixed(2)} (scale: -1.0 very negative to 1.0 very positive)`);
      parts.push(`- Mood Trend: ${userProfile.sentimentSummary.moodTrend}`);
      if (userProfile.sentimentSummary.recentMoodKeywords.length > 0) {
        parts.push(`- Recent Mood Keywords: ${userProfile.sentimentSummary.recentMoodKeywords.join(', ')}`);
      }
    }
    parts.push('');
  }

  // Request
  parts.push('---');
  parts.push('');
  parts.push('Based on ALL of this data, provide comprehensive guidance.');
  parts.push('');
  parts.push('IMPORTANT: For "How It All Connects", identify cross-tool patterns:');
  parts.push('- How insights from different wizards reinforce each other');
  parts.push('- How practices in the stack support the identified growth edge');
  parts.push('- Developmental arc: where they were vs. where growth is heading');
  parts.push('');
  parts.push('If insufficient data (fewer than 2 wizard sessions OR fewer than 5 practices), keep this section minimal.');

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
          sequenceWeek: rec.sequenceWeek,
          sequenceGuidance: rec.sequenceGuidance,
          expectedBenefits: rec.expectedBenefits,
          integrationTips: rec.integrationTips,
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
 * Extract list items from a subsection (handles both bullet points and prose)
 */
function extractListItems(sectionText: string, subheading: string): string[] {
  const regex = new RegExp(`${subheading}\\s*\\n([\\s\\S]*?)(?=\\n###|$)`, 'i');
  const match = sectionText.match(regex);
  if (!match) return [];

  const content = match[1].trim();
  if (!content) return [];

  // Try to extract bullet points or numbered items first
  const bulletItems = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('-') || line.startsWith('•') || /^\d+\./.test(line))
    .map(line => line.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, ''));

  // If bullet points found, return them
  if (bulletItems.length > 0) {
    return bulletItems;
  }

  // Otherwise, split prose by sentence or paragraph
  const sentences = content
    .split(/(?<=[.!?])\s+|(?=\n\n)/g)
    .map(s => s.trim())
    .filter(s => s.length > 10); // Only keep meaningful segments

  return sentences.length > 0 ? sentences : [content];
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
