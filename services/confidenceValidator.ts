/**
 * Confidence Validator Service
 *
 * Validates that AI-generated language matches actual confidence scores.
 * Prevents overconfident statements on weak data and ensures honest communication.
 *
 * This service:
 * 1. Analyzes generated text for confidence language markers
 * 2. Extracts claimed confidence levels from text
 * 3. Compares to actual data-based confidence scores
 * 4. Flags mismatches for correction
 */

/**
 * Detected confidence language markers in text
 */
export interface ConfidenceLanguageDetection {
  definiteMarkers: string[];
  exploratoryMarkers: string[];
  uncertaintyMarkers: string[];
  percentageClaimsFound: number[];
  extractedConfidenceLevel: 'high' | 'medium' | 'low' | 'unknown';
  overconfidenceDetected: boolean;
  underconfidenceDetected: boolean;
}

/**
 * Result of confidence validation
 */
export interface ConfidenceValidationResult {
  isValid: boolean;
  claimedConfidence: 'high' | 'medium' | 'low' | 'unknown';
  actualConfidence: 'high' | 'medium' | 'low';
  mismatchFound: boolean;
  mismatchType?: 'overconfident' | 'underconfident';
  detectedMarkers: ConfidenceLanguageDetection;
  suggestion?: string;
}

/**
 * Definitive language patterns that indicate high confidence
 */
const DEFINITE_PATTERNS = [
  /\b(clearly|definitely|certainly|unquestionably|undoubtedly)\b/gi,
  /\b(is demonstrating|are showing|exhibits|displays)\b/gi,
  /\b(proven|established|confirmed|verified)\b/gi,
  /\b(must|will|should definitely)\b/gi,
  /(\d+%\s*(?:confident|sure|certain))/gi,
  /\b(no doubt|without question|obviously)\b/gi,
  /\b(strong evidence|clear evidence)\b/gi,
];

/**
 * Exploratory language patterns that indicate low confidence
 */
const EXPLORATORY_PATTERNS = [
  /\b(might|may|could|possibly|perhaps)\b/gi,
  /\b(seems to|appears to|looks like)\b/gi,
  /\b(noticing|exploring|investigating)\b/gi,
  /\b(patterns? worth exploring|worth considering)\b/gi,
  /\b(tentative|preliminary|early)\b/gi,
  /\b(suggest|propose|consider)\b/gi,
  /\b(limited data|small sample|insufficient evidence)\b/gi,
];

/**
 * Uncertainty markers
 */
const UNCERTAINTY_PATTERNS = [
  /\b(uncertain|unclear|ambiguous|unclear)\b/gi,
  /\b(not sure|can't say|difficult to determine)\b/gi,
  /\b(more data needed|needs more evidence)\b/gi,
];

/**
 * Extract numeric confidence claims from text (e.g., "95% confident")
 */
function extractPercentageClaims(text: string): number[] {
  const matches = text.match(/(\d+)%\s*(?:confident|sure|certain|accuracy|confident)/gi);
  if (!matches) return [];
  return matches.map(m => {
    const num = m.match(/\d+/);
    return num ? parseInt(num[0]) : 0;
  }).filter(n => n > 0);
}

/**
 * Count pattern matches in text
 */
function countPatternMatches(text: string, patterns: RegExp[]): number {
  let count = 0;
  patterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) count += matches.length;
  });
  return count;
}

/**
 * Normalize confidence score to categorical level
 */
function normalizeConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 0.75) return 'high';
  if (score >= 0.5) return 'medium';
  return 'low';
}

/**
 * Detect confidence language in generated text
 */
export function detectConfidenceLanguage(text: string): ConfidenceLanguageDetection {
  const definiteMatches = text.match(/\b(?:clearly|definitely|certainly|unquestionably|undoubtedly|is demonstrating|are showing|exhibits|displays|proven|established|confirmed|verified|must|will|should definitely|no doubt|without question|obviously|strong evidence|clear evidence)\b/gi) || [];
  const exploratoryMatches = text.match(/\b(?:might|may|could|possibly|perhaps|seems to|appears to|looks like|noticing|exploring|investigating|patterns? worth exploring|worth considering|tentative|preliminary|early|suggest|propose|consider|limited data|small sample|insufficient evidence)\b/gi) || [];
  const uncertaintyMatches = text.match(/\b(?:uncertain|unclear|ambiguous|not sure|can't say|difficult to determine|more data needed|needs more evidence)\b/gi) || [];

  const percentages = extractPercentageClaims(text);

  // Determine claimed confidence level based on language
  let claimedLevel: 'high' | 'medium' | 'low' | 'unknown' = 'unknown';

  if (definiteMatches.length > exploratoryMatches.length && definiteMatches.length > 0) {
    claimedLevel = 'high';
  } else if (exploratoryMatches.length > definiteMatches.length && exploratoryMatches.length > 0) {
    claimedLevel = 'low';
  } else if (definiteMatches.length > 0 || exploratoryMatches.length > 0) {
    claimedLevel = 'medium';
  }

  // Check for overconfidence (high percentage claims)
  const overconfidenceDetected = percentages.some(p => p >= 90);

  return {
    definiteMarkers: definiteMatches,
    exploratoryMarkers: exploratoryMatches,
    uncertaintyMarkers: uncertaintyMatches,
    percentageClaimsFound: percentages,
    extractedConfidenceLevel: claimedLevel,
    overconfidenceDetected,
    underconfidenceDetected: exploratoryMatches.length > 5 && definiteMatches.length === 0,
  };
}

/**
 * Validate that claimed confidence matches actual confidence
 */
export function validateConfidence(
  text: string,
  actualConfidenceScore: number,
  dataPoints?: number // Optional: number of data points (sessions, insights, etc.)
): ConfidenceValidationResult {
  const detection = detectConfidenceLanguage(text);
  const actualLevel = normalizeConfidenceLevel(actualConfidenceScore);

  // Determine if there's a mismatch
  const claimedLevel = detection.extractedConfidenceLevel;

  let mismatchFound = false;
  let mismatchType: 'overconfident' | 'underconfident' | undefined;
  let suggestion: string | undefined;

  // Map language levels to comparable categories
  if (claimedLevel !== 'unknown') {
    // High claimed vs low actual = OVERCONFIDENT
    if (claimedLevel === 'high' && (actualLevel === 'low' || actualLevel === 'medium')) {
      mismatchFound = true;
      mismatchType = 'overconfident';
      suggestion = `Text claims high confidence but actual confidence is ${actualLevel}. Use exploratory language instead.`;
    }
    // Low claimed vs high actual = UNDERCONFIDENT
    else if (claimedLevel === 'low' && actualLevel === 'high') {
      mismatchFound = true;
      mismatchType = 'underconfident';
      suggestion = `Text claims low confidence but actual confidence is high. Use more definitive language.`;
    }
    // Medium claimed vs high actual = OK
    // Medium claimed vs low actual = borderline, flag for review
    else if (claimedLevel === 'medium' && actualLevel === 'low') {
      mismatchFound = true;
      mismatchType = 'overconfident';
      suggestion = `Text uses medium confidence but actual confidence is low. Consider more exploratory language.`;
    }
  }

  // Also check for percentage claims that are clearly too high
  if (detection.percentageClaimsFound.length > 0) {
    const avgPercentage = detection.percentageClaimsFound.reduce((a, b) => a + b, 0) / detection.percentageClaimsFound.length;
    const actualPercentage = actualConfidenceScore * 100;

    if (avgPercentage > actualPercentage + 15) {
      mismatchFound = true;
      mismatchType = 'overconfident';
      suggestion = `Text claims ${Math.round(avgPercentage)}% confidence but actual is ${Math.round(actualPercentage)}%. Adjust claims down by ~${Math.round(avgPercentage - actualPercentage)}%.`;
    }
  }

  // Check data volume concern: low confidence with only a few data points
  if (dataPoints !== undefined && dataPoints < 3 && actualConfidenceScore > 0.7) {
    mismatchFound = true;
    mismatchType = 'overconfident';
    suggestion = `Only ${dataPoints} data point(s) but confidence is ${actualConfidenceScore}. Consider toning down certainty.`;
  }

  return {
    isValid: !mismatchFound,
    claimedConfidence: claimedLevel,
    actualConfidence: actualLevel,
    mismatchFound,
    mismatchType,
    detectedMarkers: detection,
    suggestion,
  };
}

/**
 * Get confidence data from a user's history for validation context
 */
export function calculateConfidenceFromDataVolume(
  totalSessions: number,
  sessionsInLastWeek: number,
  relatedInsights: number,
  consistencyScore?: number // 0-1, how consistent the pattern is
): number {
  // Low confidence if very few sessions
  if (totalSessions < 2) return 0.3;
  if (totalSessions < 5) return 0.4;
  if (totalSessions < 10) return 0.5;
  if (totalSessions < 20) return 0.65;

  // Boost confidence based on consistency
  let baseScore = Math.min(0.85, 0.5 + totalSessions * 0.02);

  // Consistency bonus
  if (consistencyScore !== undefined) {
    baseScore = baseScore * 0.7 + consistencyScore * 0.3;
  }

  // Recent activity bonus
  if (sessionsInLastWeek >= 5) {
    baseScore = Math.min(0.95, baseScore + 0.1);
  }

  return Math.min(0.95, Math.max(0.3, baseScore));
}
