/**
 * Gemini-Powered Recommendation Service
 * Generates practice recommendations using Gemini AI without external databases
 * Uses local practice data to create personalized, sequenced guidance
 */

import { generateText } from './geminiService';
import { practices as allPractices } from '../constants';
import type { Practice, AllPractice } from '../types';

export interface GeminiRecommendation {
  selectedPractices: Array<{
    id: string;
    name: string;
    rationale: string;
    difficulty: string;
    timePerWeek: number;
    why: string;
  }>;
  sequenceGuidance: string;
  integratedGuidance: string;
  practiceSequence: string[];
  confidence: number;
}

/**
 * Mapping of wizard types to practice domains and key principles
 */
const WIZARD_CONTEXT_MAP: Record<
  string,
  { domains: string[]; principles: string[] }
> = {
  bias_detective: {
    domains: ['shadow', 'mind'],
    principles: [
      'self-inquiry and awareness',
      'understanding defensive patterns',
      'cognitive flexibility',
      'belief examination',
    ],
  },
  ifs_work: {
    domains: ['shadow', 'spirit'],
    principles: [
      'compassionate inner communication',
      'parts work and integration',
      'self-leadership',
      'inner system balance',
    ],
  },
  subject_object: {
    domains: ['mind', 'spirit'],
    principles: [
      'perspective development',
      'meta-awareness',
      'developmental capacity',
      'reflection on experience',
    ],
  },
  somatic_generator: {
    domains: ['body', 'spirit'],
    principles: [
      'body awareness and embodiment',
      'nervous system regulation',
      'somatic integration',
      'grounding in physical experience',
    ],
  },
  big_mind_process: {
    domains: ['spirit', 'mind'],
    principles: [
      'witnessing consciousness',
      'multiple perspectives',
      'voice dialogue integration',
      'transcendent awareness',
    ],
  },
  three_two_one: {
    domains: ['shadow', 'body'],
    principles: [
      'witnessed experience',
      'somatic and dialogue integration',
      'trigger transformation',
      'embodied shadow work',
    ],
  },
  attachment_assessment: {
    domains: ['mind', 'spirit'],
    principles: [
      'relational awareness',
      'secure base building',
      'emotional regulation',
      'connection practices',
    ],
  },
  polarity_mapper: {
    domains: ['mind', 'spirit'],
    principles: [
      'both-and thinking',
      'paradox integration',
      'systems perspective',
      'wholeness seeking',
    ],
  },
  eight_zones: {
    domains: ['mind', 'spirit'],
    principles: [
      'integral development',
      'multi-dimensional growth',
      'wholeness and balance',
      'AQAL framework application',
    ],
  },
  kegan_assessment: {
    domains: ['mind', 'spirit'],
    principles: [
      'developmental growth',
      'meaning-making evolution',
      'stage-appropriate practice',
      'capacity building',
    ],
  },
  memory_reconsolidation: {
    domains: ['shadow', 'body'],
    principles: [
      'belief transformation',
      'trauma healing',
      'emotional processing',
      'reconsolidation integration',
    ],
  },
  perspective_shifter: {
    domains: ['mind', 'spirit'],
    principles: [
      'empathy development',
      'reality testing',
      'cognitive flexibility',
      'perspective-taking',
    ],
  },
};

/**
 * Format all available practices for Gemini context
 */
function formatPracticesForGemini(): string {
  const lines: string[] = [];

  Object.entries(allPractices).forEach(([domain, practiceList]) => {
    lines.push(`\n## ${domain.toUpperCase()} Practices:`);
    practiceList.forEach((practice: Practice) => {
      lines.push(
        `- **${practice.name}** (${practice.difficulty}, ${practice.timePerWeek}h/week): ${practice.description}`,
      );
    });
  });

  return lines.join('\n');
}

/**
 * Extract session context from wizard data
 */
function extractSessionContext(
  wizardType: string,
  sessionData: Record<string, any>,
): string {
  const contextParts: string[] = [];

  switch (wizardType) {
    case 'bias_detective':
      if (sessionData.identifiedBiases)
        contextParts.push(
          `Identified biases: ${sessionData.identifiedBiases.join(', ')}`,
        );
      if (sessionData.decision)
        contextParts.push(`Decision context: ${sessionData.decision}`);
      break;

    case 'ifs_work':
      if (sessionData.identifiedParts)
        contextParts.push(
          `Inner parts: ${sessionData.identifiedParts.join(', ')}`,
        );
      if (sessionData.managerPart)
        contextParts.push(`Manager part: ${sessionData.managerPart}`);
      break;

    case 'subject_object':
      if (sessionData.currentSubject)
        contextParts.push(`Subject of inquiry: ${sessionData.currentSubject}`);
      break;

    case 'big_mind_process':
      if (sessionData.exploredVoices)
        contextParts.push(
          `Explored voices: ${sessionData.exploredVoices.join(', ')}`,
        );
      break;

    case 'attachment_assessment':
      if (sessionData.assessedStyle)
        contextParts.push(`Attachment style: ${sessionData.assessedStyle}`);
      break;

    case 'polarity_mapper':
      if (sessionData.polarity)
        contextParts.push(`Polarity: ${sessionData.polarity.join(' / ')}`);
      break;

    case 'kegan_assessment':
      if (sessionData.stage)
        contextParts.push(`Developmental stage: ${sessionData.stage}`);
      break;

    case 'eight_zones':
      if (sessionData.focalQuestion)
        contextParts.push(`Focal question: ${sessionData.focalQuestion}`);
      break;

    case 'memory_reconsolidation':
      if (sessionData.detectedPattern)
        contextParts.push(`Pattern detected: ${sessionData.detectedPattern}`);
      break;

    case 'three_two_one':
      if (sessionData.trigger)
        contextParts.push(`Trigger explored: ${sessionData.trigger}`);
      break;

    default:
      contextParts.push('Personal development session completed');
  }

  return contextParts.join('. ');
}

/**
 * Generate Gemini-powered practice recommendations
 */
export async function generateGeminiRecommendations(
  wizardType: string,
  sessionData: Record<string, any>,
  detectedPattern?: string,
): Promise<GeminiRecommendation> {
  const contextMap = WIZARD_CONTEXT_MAP[wizardType] || WIZARD_CONTEXT_MAP.bias_detective;
  const sessionContext = extractSessionContext(wizardType, sessionData);
  const practicesFormatted = formatPracticesForGemini();

  const prompt = `You are an expert in integral human development and practice recommendation.

A user has completed a development session of type: "${wizardType}"
Session details: ${sessionContext}
${detectedPattern ? `Pattern detected: ${detectedPattern}` : ''}

AVAILABLE PRACTICES:
${practicesFormatted}

TASK: Based on the wizard session and detected patterns, recommend the 3-4 BEST practices from the list above.

For each recommendation, provide:
1. **Practice name** - Exact name from the list above
2. **Why this practice** - How it directly addresses their pattern/work
3. **Sequence guidance** - When to start (week 1, week 2, etc.) and for how long
4. **Integration tips** - Practical advice for successful practice
5. **Expected benefits** - What transformation to expect

Key principles for this person's work: ${contextMap.principles.join(', ')}
Focus on practices from these domains: ${contextMap.domains.join(', ')}

Generate recommendations in this JSON format:
{
  "selectedPractices": [
    {
      "name": "Practice Name (must be exact match from list)",
      "rationale": "Why this practice addresses their pattern",
      "sequence": "When to start and how long",
      "integration": "Practical tips for success",
      "expectedBenefits": "What they'll notice"
    }
  ],
  "overallGuidance": "Comprehensive guidance for approaching these practices as an integrated sequence",
  "warningOrConsideration": "Any important considerations (optional)",
  "estimatedTimeToNoticeBenefit": "When they'll see results"
}`;

  try {
    const response = await generateText(prompt);

    // Strip markdown code blocks if present (Gemini sometimes wraps JSON in ```json ... ```)
    let jsonString = response.trim();
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(jsonString);

    // Map practices to their full data
    const allPracticesList = Object.values(allPractices).flat() as Practice[];
    const selectedPractices = parsed.selectedPractices
      .map((rec: any) => {
        const practice = allPracticesList.find(
          (p: Practice) => p.name === rec.name || p.name.includes(rec.name),
        );
        if (!practice) return null;

        return {
          id: practice.id,
          name: practice.name,
          rationale: rec.rationale,
          difficulty: practice.difficulty,
          timePerWeek: practice.timePerWeek,
          why: practice.why,
          sequence: rec.sequence,
          integration: rec.integration,
          expectedBenefits: rec.expectedBenefits,
        };
      })
      .filter(Boolean);

    return {
      selectedPractices,
      sequenceGuidance: generateSequenceGuidance(selectedPractices),
      integratedGuidance: parsed.overallGuidance,
      practiceSequence: selectedPractices.map((p: any) => p.name),
      confidence: 0.95,
    };
  } catch (error) {
    console.error('[Gemini Recommendations] Error generating recommendations:', error);
    throw new Error('Failed to generate practice recommendations');
  }
}

/**
 * Generate natural language sequence guidance
 */
function generateSequenceGuidance(
  practices: Array<{
    name: string;
    sequence?: string;
    integration?: string;
  }>,
): string {
  const lines: string[] = ['**Suggested Practice Sequence:**', ''];

  practices.forEach((p: any, index: number) => {
    lines.push(`**Week ${(index + 1) * 2}: ${p.name}**`);
    if (p.sequence) lines.push(`Start: ${p.sequence}`);
    if (p.integration) lines.push(`How: ${p.integration}`);
    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Enrich an insight with AI-powered practice guidance
 */
export async function enrichInsightWithAIGuidance(
  detectedPattern: string,
  wizardType: string,
  sessionData: Record<string, any>,
): Promise<{
  guidance: string;
  practiceSequence: string[];
  confidence: number;
}> {
  const recommendations = await generateGeminiRecommendations(
    wizardType,
    sessionData,
    detectedPattern,
  );

  return {
    guidance: recommendations.integratedGuidance,
    practiceSequence: recommendations.practiceSequence,
    confidence: recommendations.confidence,
  };
}
