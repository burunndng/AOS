/**
 * Tonal Shifter Service
 *
 * Adjusts AI-generated text to match appropriate confidence levels.
 * Ensures language reflects data strength, not overconfidence.
 *
 * Tonal Shifts:
 * - LOW confidence (< 0.5): Exploratory tone
 *   "I'm noticing some patterns worth exploring..."
 * - MEDIUM confidence (0.5-0.75): Observational tone
 *   "You're showing signs of... Consider exploring..."
 * - HIGH confidence (≥ 0.75): Definitive tone
 *   "You are demonstrating... This suggests..."
 */

/**
 * Tone type definitions
 */
export type ToneType = 'exploratory' | 'observational' | 'definitive';

/**
 * Tone configuration for each confidence level
 */
const TONE_CONFIGURATIONS: Record<ToneType, {
  certaintyWords: string[];
  actionWords: string[];
  evidenceFraming: string;
  disclaimer?: string;
}> = {
  exploratory: {
    certaintyWords: [
      'might',
      'could',
      'appears',
      'seems',
      'may',
      'worth exploring',
      'interesting pattern',
      'noticing',
      'consider',
    ],
    actionWords: [
      'explore',
      'investigate',
      'try',
      'observe',
      'notice',
      'pay attention to',
    ],
    evidenceFraming: 'based on early observations',
    disclaimer: 'Early data suggests this is worth exploring. More sessions will help clarify.',
  },
  observational: {
    certaintyWords: [
      'appears',
      'shows',
      'demonstrates',
      'suggests',
      'indicates',
      'points to',
      'likely',
      'tends to',
    ],
    actionWords: [
      'work with',
      'address',
      'develop',
      'strengthen',
      'practice',
    ],
    evidenceFraming: 'based on multiple observations',
  },
  definitive: {
    certaintyWords: [
      'is',
      'are',
      'clearly',
      'demonstrating',
      'shows',
      'confirms',
      'reveals',
      'indicates strongly',
    ],
    actionWords: [
      'practice',
      'integrate',
      'strengthen',
      'develop',
      'deepen',
    ],
    evidenceFraming: 'based on consistent evidence',
  },
};

/**
 * Determine appropriate tone based on confidence score
 */
export function determineTone(confidenceScore: number): ToneType {
  if (confidenceScore < 0.5) return 'exploratory';
  if (confidenceScore < 0.75) return 'observational';
  return 'definitive';
}

/**
 * Replace confidence language with appropriate tone
 */
function replaceConfidenceLanguage(text: string, fromTone: ToneType, toTone: ToneType): string {
  const fromConfig = TONE_CONFIGURATIONS[fromTone];
  const toConfig = TONE_CONFIGURATIONS[toTone];

  let result = text;

  // Replace certainty words
  fromConfig.certaintyWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const replacement = toConfig.certaintyWords[0]; // Use first word as default
    result = result.replace(regex, replacement);
  });

  // Replace action words
  fromConfig.actionWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const replacement = toConfig.actionWords[0]; // Use first word as default
    result = result.replace(regex, replacement);
  });

  return result;
}

/**
 * Remove overconfident percentage claims
 */
function removeOverconfidentClaims(text: string): string {
  // Remove "XX% confident" claims
  let result = text.replace(/\b\d+%\s*(?:confident|sure|certain|accurate)\b/gi, '');

  // Remove absolute statements
  result = result.replace(/\b(?:absolutely|definitely|certainly|unquestionably)\b\s+/gi, '');

  // Clean up double spaces
  result = result.replace(/\s{2,}/g, ' ');

  return result.trim();
}

/**
 * Add appropriate hedging or disclaimers based on tone
 */
function addConfidenceContext(text: string, tone: ToneType, actualConfidence: number): string {
  const config = TONE_CONFIGURATIONS[tone];
  const parts: string[] = [];

  // Add opening context if exploratory
  if (tone === 'exploratory') {
    parts.push("I'm noticing some patterns worth exploring:");
    parts.push('');
  }

  parts.push(text);

  // Add closing context based on tone
  if (tone === 'exploratory') {
    parts.push('');
    parts.push('💡 **This is early-stage data.** More sessions will help clarify these patterns. Feel free to try and observe what resonates.');
  } else if (tone === 'observational' && actualConfidence < 0.65) {
    parts.push('');
    parts.push(`_${config.evidenceFraming}, but more data would strengthen these insights._`);
  }

  return parts.join('\n');
}

/**
 * Shift text to appropriate tone based on confidence
 */
export function shiftTone(
  text: string,
  targetConfidence: number,
  detectedCurrentTone?: ToneType
): {
  originalText: string;
  shiftedText: string;
  toneUsed: ToneType;
  changesApplied: string[];
} {
  const targetTone = determineTone(targetConfidence);
  const currentTone = detectedCurrentTone || 'definitive'; // Assume definitive by default
  const changes: string[] = [];

  let result = text;

  // Step 1: Remove overconfident claims
  if (targetTone !== 'definitive') {
    const beforeRemoval = result;
    result = removeOverconfidentClaims(result);
    if (beforeRemoval !== result) {
      changes.push('Removed overconfident percentage claims');
    }
  }

  // Step 2: If tone shift needed, apply replacements
  if (currentTone !== targetTone) {
    const beforeShift = result;
    result = replaceConfidenceLanguage(result, currentTone, targetTone);
    if (beforeShift !== result) {
      changes.push(`Shifted tone from ${currentTone} to ${targetTone}`);
    }
  }

  // Step 3: Add confidence context
  const beforeContext = result;
  result = addConfidenceContext(result, targetTone, targetConfidence);
  if (beforeContext !== result) {
    changes.push(`Added ${targetTone} tone context`);
  }

  return {
    originalText: text,
    shiftedText: result,
    toneUsed: targetTone,
    changesApplied: changes,
  };
}

/**
 * Specific patterns for different insight types
 */
const INSIGHT_PATTERN_TEMPLATES: Record<ToneType, Record<string, string>> = {
  exploratory: {
    pattern_detected: "I'm noticing a pattern around {pattern}. It might be worth exploring further by {suggestion}.",
    recommendation: "You could try {practice} to explore this area more deeply.",
    next_step: "Consider {wizard} as a way to investigate {topic} further.",
  },
  observational: {
    pattern_detected: "You're showing signs of {pattern}. This suggests {interpretation}.",
    recommendation: "Working with {practice} could help you develop {benefit}.",
    next_step: "{wizard} would help you address {topic}.",
  },
  definitive: {
    pattern_detected: "You are demonstrating {pattern}. This indicates {interpretation}.",
    recommendation: "Practicing {practice} will strengthen {benefit}.",
    next_step: "{wizard} is well-suited to deepen your work on {topic}.",
  },
};

/**
 * Format insight using tone-appropriate templates
 */
export function formatInsightWithTone(
  pattern: string,
  interpretation: string,
  suggestion: string,
  confidenceScore: number
): string {
  const tone = determineTone(confidenceScore);
  const template = INSIGHT_PATTERN_TEMPLATES[tone].pattern_detected;

  return template
    .replace('{pattern}', pattern)
    .replace('{interpretation}', interpretation)
    .replace('{suggestion}', suggestion);
}

/**
 * Format recommendation using tone-appropriate language
 */
export function formatRecommendationWithTone(
  practice: string,
  benefit: string,
  confidenceScore: number
): string {
  const tone = determineTone(confidenceScore);
  const template = INSIGHT_PATTERN_TEMPLATES[tone].recommendation;

  return template
    .replace('{practice}', practice)
    .replace('{benefit}', benefit);
}

/**
 * Format next step using tone-appropriate language
 */
export function formatNextStepWithTone(
  wizard: string,
  topic: string,
  confidenceScore: number
): string {
  const tone = determineTone(confidenceScore);
  const template = INSIGHT_PATTERN_TEMPLATES[tone].next_step;

  return template
    .replace('{wizard}', wizard)
    .replace('{topic}', topic);
}

/**
 * Build system prompt instruction for maintaining appropriate tone
 */
export function buildToneInstructions(confidenceScore: number): string {
  const tone = determineTone(confidenceScore);

  if (tone === 'exploratory') {
    return `
## TONE: EXPLORATORY (Early Data)

When confidence is low, use exploratory language:
- Use "might," "could," "appears to," "seems," "worth exploring"
- Avoid absolute statements or high percentages
- Frame as patterns worth noticing, not conclusions
- Example: "I'm noticing a pattern here that might be worth exploring..."
- Add disclaimer: "This is based on early observations. More sessions will help clarify."
`;
  } else if (tone === 'observational') {
    return `
## TONE: OBSERVATIONAL (Medium Data)

When confidence is medium, use observational language:
- Use "shows," "demonstrates," "suggests," "indicates," "tends to"
- Ground claims in specific observations
- Example: "You're showing a pattern of... Consider exploring..."
- Acknowledge: "Based on multiple observations..."
`;
  } else {
    return `
## TONE: DEFINITIVE (Strong Data)

When confidence is high, use definitive language:
- Use "is," "are," "clearly," "demonstrates," "shows"
- Make clear, direct statements backed by evidence
- Example: "You are demonstrating a clear pattern of..."
- State: "This consistent evidence suggests..."
`;
  }
}
