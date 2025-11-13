/**
 * Wizard-to-Practice Linking Module
 * Connects wizard outputs to recommended practices for integrated learning
 */

import { semanticSearch } from '../lib/upstash-vector';
import { generateEmbedding } from '../lib/embeddings';
import type { QueryResult } from '../lib/types';

/**
 * Map wizard types to their natural practice domains
 */
const WIZARD_PRACTICE_MAPPING: Record<string, { domain: string; contexts: string[] }> = {
  bias_detective: {
    domain: 'shadow_work',
    contexts: [
      'shadow work practice for self-inquiry',
      'cognitive flexibility and perspective-taking',
      'defense mechanism understanding',
      'protective pattern integration',
    ],
  },
  ifs_work: {
    domain: 'relational_practice',
    contexts: [
      'compassionate communication practice',
      'parts work and internal family dialogue',
      'inner wisdom and resource accessing',
      'self-leadership and part coordination',
    ],
  },
  subject_object: {
    domain: 'contemplative_practice',
    contexts: [
      'mindfulness meditation for perspective shifting',
      'inquiry into the nature of perspective',
      'developmental reflective practice',
      'meta-awareness building',
    ],
  },
  somatic_generator: {
    domain: 'somatic_practice',
    contexts: [
      'body awareness and somatic integration',
      'grounding and embodiment practices',
      'nervous system regulation',
      'sensorimotor awareness',
    ],
  },
  big_mind_process: {
    domain: 'voice_dialogue',
    contexts: [
      'witnessing and perspective expansion',
      'multi-perspective awareness practice',
      'inner multiplicity integration',
      'voice dialogue continuation',
    ],
  },
  insight_practice_map: {
    domain: 'meditation_insight',
    contexts: [
      'insight meditation and jhana cultivation',
      'progress of insight practice stages',
      'vipassana technique refinement',
      'concentration and clear comprehension',
    ],
  },
  integral_body_architect: {
    domain: 'embodied_practice',
    contexts: [
      'whole-body integration practice',
      'movement and somatic coordination',
      'weekly practice scheduling and sustainability',
      'yin-yang balance in physical practice',
    ],
  },
  dynamic_workout_architect: {
    domain: 'movement_practice',
    contexts: [
      'structured workout and movement practice',
      'body conditioning and strength practice',
      'athletic skill development',
      'movement pattern optimization',
    ],
  },
  meditation_wizard: {
    domain: 'meditation',
    contexts: [
      'meditation practice finder and guidance',
      'technique-specific meditation instructions',
      'meditation consistency and habit building',
      'specific meditation benefits for current needs',
    ],
  },
  attachment_assessment: {
    domain: 'relational_practice',
    contexts: [
      'attachment-informed relationship practice',
      'secure base development',
      'emotional regulation and connection practice',
      'relational pattern transformation',
    ],
  },
  polarity_mapper: {
    domain: 'integration_practice',
    contexts: [
      'both-and thinking practice',
      'paradox integration and resolution',
      'complementary opposite integration',
      'systems thinking and balance practice',
    ],
  },
  eight_zones: {
    domain: 'integral_practice',
    contexts: [
      'integral AQAL framework practice',
      'multi-dimensional development practice',
      'quadrant-specific practice focus',
      'wholeness and integration practice',
    ],
  },
  kegan_assessment: {
    domain: 'developmental_practice',
    contexts: [
      'meaning-making and perspective evolution',
      'developmental capacity building',
      'stage-appropriate growth practice',
      'immunity to change and growth edge',
    ],
  },
  memory_reconsolidation: {
    domain: 'trauma_integration',
    contexts: [
      'belief reconsolidation through contradiction',
      'trauma integration and healing',
      'emotional processing and transformation',
      'memory reconsolidation technique follow-up',
    ],
  },
  perspective_shifter: {
    domain: 'perspective_practice',
    contexts: [
      'multi-perspective reframing practice',
      'empathy and perspective-taking development',
      'reality testing and belief examination',
      'cognitive flexibility building',
    ],
  },
  three_two_one: {
    domain: 'somatic_integration',
    contexts: [
      'witnessed experience and dialogue practice',
      'trigger transformation through witnessing',
      'somatic and dialogue integration',
      'embodied shadow work',
    ],
  },
  relational_pattern_chatbot: {
    domain: 'relational_exploration',
    contexts: [
      'relationship pattern awareness practice',
      'couples and relational dynamics exploration',
      'attachment and relational pattern work',
      'communication skill development',
    ],
  },
};

/**
 * Practice metadata categories for alignment
 */
const PRACTICE_CATEGORY_KEYWORDS: Record<string, string[]> = {
  shadow_work: ['shadow', 'unconscious', 'integration', 'inner', 'defensive'],
  relational_practice: [
    'compassion',
    'relationships',
    'communication',
    'connection',
    'attachment',
    'others',
  ],
  contemplative_practice: [
    'mindfulness',
    'meditation',
    'inquiry',
    'perspective',
    'reflection',
    'awareness',
  ],
  somatic_practice: [
    'body',
    'somatic',
    'embodiment',
    'nervous system',
    'sensory',
    'movement',
  ],
  voice_dialogue: [
    'voice',
    'dialogue',
    'witness',
    'multiplicity',
    'parts',
    'witnessing',
  ],
  meditation_insight: ['vipassana', 'jhana', 'insight', 'meditation', 'noting', 'ñana'],
  embodied_practice: [
    'embodied',
    'whole-body',
    'integration',
    'movement',
    'coordination',
    'balance',
  ],
  movement_practice: ['workout', 'exercise', 'movement', 'conditioning', 'physical'],
  meditation: ['meditation', 'mindfulness', 'sitting', 'zazen', 'breath'],
  integration_practice: ['integration', 'polarity', 'both-and', 'paradox', 'wholeness'],
  integral_practice: ['integral', 'AQAL', 'quadrant', 'multi-dimensional', 'holistic'],
  developmental_practice: ['development', 'growth', 'stage', 'evolution', 'capacity'],
  trauma_integration: ['trauma', 'reconsolidation', 'belief', 'healing', 'transformation'],
  perspective_practice: [
    'perspective',
    'reframing',
    'empathy',
    'cognitive',
    'flexibility',
  ],
  somatic_integration: ['somatic', 'dialogue', 'integration', 'embodied', 'witnessed'],
  relational_exploration: [
    'relationship',
    'pattern',
    'couples',
    'dynamics',
    'communication',
  ],
};

/**
 * Generate wizard-specific insight context for practice retrieval
 */
export async function generateWizardInsightQuery(
  sessionType: string,
  sessionData: Record<string, any>,
): Promise<string> {
  const mapping = WIZARD_PRACTICE_MAPPING[sessionType] || WIZARD_PRACTICE_MAPPING.bias_detective;

  // Build context from session data
  const contextParts: string[] = [];

  // Extract key insights from session data
  switch (sessionType) {
    case 'bias_detective':
      if (sessionData.identifiedBiases) {
        contextParts.push(
          `I've identified these biases: ${sessionData.identifiedBiases.join(', ')}`,
        );
      }
      if (sessionData.decision) {
        contextParts.push(`My decision involved: ${sessionData.decision}`);
      }
      break;

    case 'ifs_work':
      if (sessionData.identifiedParts) {
        contextParts.push(`My inner parts include: ${sessionData.identifiedParts.join(', ')}`);
      }
      if (sessionData.managerPart) {
        contextParts.push(`My manager part is: ${sessionData.managerPart}`);
      }
      break;

    case 'subject_object':
      if (sessionData.currentSubject) {
        contextParts.push(`I'm examining my relationship to: ${sessionData.currentSubject}`);
      }
      break;

    case 'big_mind_process':
      if (sessionData.exploredVoices) {
        contextParts.push(`I explored these voices: ${sessionData.exploredVoices.join(', ')}`);
      }
      break;

    case 'attachment_assessment':
      if (sessionData.assessedStyle) {
        contextParts.push(`My attachment style is: ${sessionData.assessedStyle}`);
      }
      break;

    case 'polarity_mapper':
      if (sessionData.polarity) {
        contextParts.push(`I'm exploring the polarity: ${sessionData.polarity.join(' / ')}`);
      }
      break;

    case 'kegan_assessment':
      if (sessionData.stage) {
        contextParts.push(`My developmental stage is: ${sessionData.stage}`);
      }
      break;

    case 'eight_zones':
      if (sessionData.zones) {
        contextParts.push(`I've analyzed across all AQAL quadrants: ${sessionData.zones}`);
      }
      break;

    default:
      contextParts.push('I completed a development session');
  }

  // Combine into insight query
  const baseQuery = `${contextParts.join('. ')}. ${mapping.contexts[0] || 'personal development'}`;

  return baseQuery;
}

/**
 * Find practices aligned with wizard output using semantic search
 */
export async function findWizardAlignedPractices(
  sessionType: string,
  sessionData: Record<string, any>,
  topK: number = 5,
): Promise<QueryResult[]> {
  // Generate insight query
  const insightQuery = await generateWizardInsightQuery(sessionType, sessionData);

  // Generate embedding for the query
  const queryEmbedding = await generateEmbedding(insightQuery);

  // Get the practice contexts for this wizard type
  const mapping = WIZARD_PRACTICE_MAPPING[sessionType] || WIZARD_PRACTICE_MAPPING.bias_detective;

  // Search for practices using multiple context approaches
  const allResults: QueryResult[] = [];
  const resultIds = new Set<string>();

  // First search: use the primary mapping context
  if (mapping.contexts.length > 0) {
    for (const context of mapping.contexts.slice(0, 2)) {
      // Use top 2 contexts
      const contextEmbedding = await generateEmbedding(context);
      const results = await semanticSearch(contextEmbedding, {
        topK: Math.ceil(topK / 2),
        type: 'practice',
        minSimilarity: 0.5,
      });

      for (const result of results) {
        if (!resultIds.has(result.id)) {
          allResults.push(result);
          resultIds.add(result.id);
        }
      }
    }
  }

  // Second search: use the general insight query
  const queryResults = await semanticSearch(queryEmbedding, {
    topK: topK,
    type: 'practice',
    minSimilarity: 0.5,
  });

  for (const result of queryResults) {
    if (!resultIds.has(result.id)) {
      allResults.push(result);
      resultIds.add(result.id);
    }
  }

  // Return top K results
  return allResults.slice(0, topK);
}

/**
 * Generate practice recommendations specifically linked to wizard output
 */
export async function generateWizardLinkedRecommendations(
  sessionType: string,
  sessionData: Record<string, any>,
): Promise<{
  linkedPractices: QueryResult[];
  rationale: string;
  suggestedSequence: string[];
}> {
  // Find aligned practices
  const linkedPractices = await findWizardAlignedPractices(sessionType, sessionData, 5);

  // Generate rationale based on wizard type
  const rationale = generateWizardRationale(sessionType, sessionData, linkedPractices);

  // Suggest a practice sequence based on difficulty and natural progression
  const suggestedSequence = generatePracticeSequence(linkedPractices);

  return {
    linkedPractices,
    rationale,
    suggestedSequence,
  };
}

/**
 * Generate human-readable rationale for wizard-linked practices
 */
function generateWizardRationale(
  sessionType: string,
  sessionData: Record<string, any>,
  practices: QueryResult[],
): string {
  const mapping = WIZARD_PRACTICE_MAPPING[sessionType];

  if (!mapping) {
    return 'These practices complement your development work.';
  }

  const practiceTitles = practices.map((p) => p.metadata.practiceTitle).join(', ');

  const rationales: Record<string, string> = {
    bias_detective: `You've identified important biases. These practices help you work with these patterns at a deeper level through shadow work and self-inquiry: ${practiceTitles}`,

    ifs_work: `You've engaged with your inner parts. These practices help foster compassionate communication between parts and deepen your inner system work: ${practiceTitles}`,

    subject_object: `You've been examining your perspective. These contemplative practices support the kind of developmental work you're doing: ${practiceTitles}`,

    somatic_generator: `You've generated somatic practices. These complementary practices help you integrate bodily awareness and embodied wisdom: ${practiceTitles}`,

    big_mind_process: `You've explored multiple voices. These practices support continued witnessing and perspective expansion: ${practiceTitles}`,

    insight_practice_map: `You've mapped your meditation progress. These practices support continued development through your current stage of insight: ${practiceTitles}`,

    integral_body_architect: `You've created a weekly practice plan. These practices complement your embodied integration work: ${practiceTitles}`,

    dynamic_workout_architect: `You've designed a workout program. These practices support whole-person development alongside your physical practice: ${practiceTitles}`,

    meditation_wizard: `You've found your meditation practice. These complementary practices deepen your sitting practice: ${practiceTitles}`,

    attachment_assessment: `You've explored your attachment style. These practices support developing secure relational patterns: ${practiceTitles}`,

    polarity_mapper: `You've mapped polarities. These integration practices help you embody both-and thinking: ${practiceTitles}`,

    eight_zones: `You've analyzed across all dimensions. These practices support development across the integral framework: ${practiceTitles}`,

    kegan_assessment: `You've assessed your developmental stage. These practices support growth at your current stage: ${practiceTitles}`,

    memory_reconsolidation: `You've worked with belief reconsolidation. These practices support ongoing trauma integration and transformation: ${practiceTitles}`,

    perspective_shifter: `You've practiced perspective-taking. These practices deepen cognitive flexibility and empathy: ${practiceTitles}`,

    three_two_one: `You've engaged in witnessed dialogue. These somatic practices support continued integration: ${practiceTitles}`,

    relational_pattern_chatbot: `You've explored relational patterns. These practices help transform relationship dynamics: ${practiceTitles}`,
  };

  return (
    rationales[sessionType] ||
    `These practices are specifically chosen to complement your ${sessionType} work: ${practiceTitles}`
  );
}

/**
 * Generate a suggested practice sequence based on difficulty progression
 */
function generatePracticeSequence(practices: QueryResult[]): string[] {
  // Sort by difficulty: beginner → intermediate → advanced
  const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };

  const sorted = [...practices].sort((a, b) => {
    const diffA = difficultyOrder[(a.metadata.difficulty as any) || 'medium'] || 2;
    const diffB = difficultyOrder[(b.metadata.difficulty as any) || 'medium'] || 2;
    return diffA - diffB;
  });

  return sorted.map((p) => p.metadata.practiceTitle || `practice-${p.id}`);
}

/**
 * Build integrated insight including wizard output and practice linking
 */
export function buildIntegratedInsightWithPractices(
  wizardType: string,
  sessionData: Record<string, any>,
  practices: QueryResult[],
  baseInsights: string[],
): string {
  const insightParts: string[] = [];

  // Add wizard-specific insights
  insightParts.push(...baseInsights);

  // Add practice linking narrative
  if (practices.length > 0) {
    insightParts.push('');
    insightParts.push('The following practices directly support this work:');

    for (const practice of practices) {
      const title = practice.metadata.practiceTitle || 'Untitled Practice';
      const difficulty = practice.metadata.difficulty || 'medium';
      const duration = practice.metadata.duration || 15;

      insightParts.push(
        `• ${title} (${difficulty}, ~${duration} min) - A practice that builds on what you discovered`,
      );
    }
  }

  // Add integration guidance
  insightParts.push('');
  insightParts.push(
    'I recommend starting with one practice that resonates most, then gradually integrating others. Each practice deepens your capacity for the transformation you\'ve begun.',
  );

  return insightParts.join('\n');
}
