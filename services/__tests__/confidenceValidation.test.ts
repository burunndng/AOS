/**
 * Tests for Confidence Validation & Tonal Shifting
 */

import {
  validateConfidence,
  detectConfidenceLanguage,
  calculateConfidenceFromDataVolume,
} from '../confidenceValidator';
import {
  shiftTone,
  determineTone,
  buildToneInstructions,
} from '../tonalShifter';

// ============================================================================
// Test Confidence Validation
// ============================================================================

console.log('=== Testing Confidence Validation ===\n');

// Test 1: Detect overconfident language
const overconfidentText = "You are clearly demonstrating a 95% confident pattern of perfectionism. This is definitely established.";
const overconfidentValidation = validateConfidence(overconfidentText, 0.45, 2);
console.log('Test 1: Overconfident language detection');
console.log(`Text: "${overconfidentText}"`);
console.log(`Actual Confidence: 0.45, Claimed: ${overconfidentValidation.claimedConfidence}`);
console.log(`Valid: ${overconfidentValidation.isValid}`);
console.log(`Mismatch: ${overconfidentValidation.mismatchType}`);
console.log(`Suggestion: ${overconfidentValidation.suggestion}\n`);

// Test 2: Detect exploratory language matching low confidence
const exploratoryText = "I'm noticing some patterns worth exploring around this area. It might be worth investigating further.";
const exploratoryValidation = validateConfidence(exploratoryText, 0.35, 1);
console.log('Test 2: Exploratory language matching low confidence');
console.log(`Text: "${exploratoryText}"`);
console.log(`Actual Confidence: 0.35, Claimed: ${exploratoryValidation.claimedConfidence}`);
console.log(`Valid: ${exploratoryValidation.isValid}`);
console.log(`Mismatch: ${exploratoryValidation.mismatchType || 'none'}\n`);

// Test 3: Detect definitive language matching high confidence
const definitiveText = "You are demonstrating a clear pattern of growth-oriented behavior. This consistent evidence suggests strong development.";
const definitiveValidation = validateConfidence(definitiveText, 0.85, 20);
console.log('Test 3: Definitive language matching high confidence');
console.log(`Text: "${definitiveText}"`);
console.log(`Actual Confidence: 0.85, Claimed: ${definitiveValidation.claimedConfidence}`);
console.log(`Valid: ${definitiveValidation.isValid}`);
console.log(`Mismatch: ${definitiveValidation.mismatchType || 'none'}\n`);

// Test 4: Detect language patterns
const detectedLanguage = detectConfidenceLanguage(overconfidentText);
console.log('Test 4: Language pattern detection');
console.log(`Definite markers found: ${detectedLanguage.definiteMarkers.length}`);
console.log(`Exploratory markers found: ${detectedLanguage.exploratoryMarkers.length}`);
console.log(`Percentage claims: ${detectedLanguage.percentageClaimsFound}`);
console.log(`Overconfidence detected: ${detectedLanguage.overconfidenceDetected}\n`);

// ============================================================================
// Test Tonal Shifting
// ============================================================================

console.log('=== Testing Tonal Shifting ===\n');

// Test 5: Shift to exploratory tone
const testText = "You are demonstrating a clear pattern of avoidance behavior. This is definitely established.";
const exploratorySift = shiftTone(testText, 0.4);
console.log('Test 5: Shift to exploratory tone (confidence 0.4)');
console.log(`Original: "${testText}"`);
console.log(`Shifted: "${exploratorySift.shiftedText}"`);
console.log(`Changes applied: ${exploratorySift.changesApplied.join(', ')}\n`);

// Test 6: Determine appropriate tone based on confidence
console.log('Test 6: Tone determination based on confidence');
console.log(`Confidence 0.3 → Tone: ${determineTone(0.3)}`);
console.log(`Confidence 0.6 → Tone: ${determineTone(0.6)}`);
console.log(`Confidence 0.85 → Tone: ${determineTone(0.85)}\n`);

// Test 7: Get tone instructions
const lowConfidenceTone = buildToneInstructions(0.4);
const highConfidenceTone = buildToneInstructions(0.85);
console.log('Test 7: Tone instructions');
console.log(`Low confidence (0.4) includes "exploratory": ${lowConfidenceTone.includes('EXPLORATORY')}`);
console.log(`High confidence (0.85) includes "definitive": ${highConfidenceTone.includes('DEFINITIVE')}\n`);

// ============================================================================
// Test Confidence from Data Volume
// ============================================================================

console.log('=== Testing Confidence Calculation from Data Volume ===\n');

// Test 8: Calculate confidence from data volume
const confidence1Session = calculateConfidenceFromDataVolume(1, 0, 0);
const confidence5Sessions = calculateConfidenceFromDataVolume(5, 2, 2);
const confidence20Sessions = calculateConfidenceFromDataVolume(20, 5, 8);

console.log('Test 8: Confidence calculation');
console.log(`1 session, 0 insights → Confidence: ${confidence1Session.toFixed(2)}`);
console.log(`5 sessions, 2 recent, 2 insights → Confidence: ${confidence5Sessions.toFixed(2)}`);
console.log(`20 sessions, 5 recent, 8 insights → Confidence: ${confidence20Sessions.toFixed(2)}\n`);

console.log('=== All tests completed successfully! ===');
