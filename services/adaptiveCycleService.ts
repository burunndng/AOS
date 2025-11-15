import { AdaptiveCycleDiagnosticAnswers, AdaptiveCycleSession, AdaptiveCycleQuadrantAnalysis } from '../types.ts';
import { generateText } from './geminiService.ts';

/**
 * Generate full four-quadrant Adaptive Cycle landscape
 * Creates a comprehensive map showing all phases specific to the user's system
 * Uses gemini-2.5-pro for high-quality, context-aware generation
 */
export const generateFullAdaptiveCycleLandscape = async (
  systemToAnalyze: string,
  userHint?: AdaptiveCycleDiagnosticAnswers
): Promise<AdaptiveCycleSession['cycleMap']> => {
  const hintContext = userHint
    ? `\n\n**User's Self-Assessment Hint (1-10 scale):**
- Potential for growth/change: ${userHint.potential}/10
- Connectedness/rigidity of current structure: ${userHint.connectedness}/10
- Resilience/capacity to absorb disruption: ${userHint.resilience}/10

Use these scores as a subtle hint to guide your analysis, but generate content for ALL four quadrants regardless.`
    : '';

  const prompt = `## ROLE
You are an expert facilitator of the Adaptive Cycle framework from systems ecology and resilience theory (C.S. Holling). You help people map their life situations onto this powerful four-phase model.

## TASK
Generate a complete four-quadrant Adaptive Cycle map for the user's specific system. Each quadrant should contain 3-5 concrete, specific bullet points that describe how that phase manifests in THEIR situation.

## USER'S SYSTEM
"${systemToAnalyze}"${hintContext}

## CRITICAL INSTRUCTIONS
- **BE SPECIFIC** to the user's system ("${systemToAnalyze}"), not generic
- **DO NOT use placeholders** like "[user's situation]" or "[their context]"
- **REFERENCE their actual words** from their system description
- Each bullet point should be actionable, concrete, or descriptive of their specific situation
- Generate meaningful content for ALL FOUR quadrants, even if one seems most relevant

## THE FOUR PHASES

**r - Growth / Exploitation (High Potential, Low Connectedness)**
- Rapid growth, experimentation, abundance
- Few constraints, high energy for new initiatives
- Innovation and expansion dominate

**K - Conservation (High Potential, High Connectedness)**
- Mature, stable, efficient, optimized
- Highly interconnected and productive, but rigid
- Vulnerability to disruption due to locked-in patterns

**Ω - Release / Collapse (Low Potential, High Connectedness)**
- Breakdown of old structures
- Chaos, uncertainty, letting go
- Resources being freed for recombination

**α - Reorganization (Low Potential, Low Connectedness)**
- Space for experimentation and emergence
- Renewal, innovation, recombination
- New patterns forming from released resources

## OUTPUT FORMAT
Return ONLY valid JSON with this exact structure:

{
  "r": {
    "phase": "r",
    "title": "Growth / Exploitation (r)",
    "points": [
      "Specific point about how growth phase manifests in their system",
      "Another concrete observation or opportunity",
      "Actionable insight for this quadrant",
      "Additional point if relevant"
    ]
  },
  "K": {
    "phase": "K",
    "title": "Conservation (K)",
    "points": [
      "Specific point about conservation/stability in their system",
      "What's optimized or locked in for them",
      "Vulnerabilities or rigidities",
      "Opportunities within this phase"
    ]
  },
  "Ω": {
    "phase": "Ω",
    "title": "Release / Collapse (Ω)",
    "points": [
      "What might be breaking down or needs releasing",
      "Sources of disruption or chaos",
      "What's being freed up",
      "Insights about this release phase"
    ]
  },
  "α": {
    "phase": "α",
    "title": "Reorganization (α)",
    "points": [
      "Spaces for experimentation in their context",
      "Emerging patterns or innovations",
      "Renewal opportunities",
      "How reorganization might look for them"
    ]
  }
}

Return ONLY valid JSON, no markdown code blocks, no additional commentary.`;

  const responseText = await generateText(prompt, { model: 'gemini-2.5-pro' });

  try {
    // Remove markdown code blocks if present
    const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    // Validate structure
    if (!parsed.r || !parsed.K || !parsed.Ω || !parsed.α) {
      throw new Error('Missing required quadrants in response');
    }

    return parsed as AdaptiveCycleSession['cycleMap'];
  } catch (error) {
    console.error('Failed to parse Adaptive Cycle landscape JSON:', error);
    console.error('Response text:', responseText);

    // Return a fallback structure
    return {
      r: {
        phase: 'r',
        title: 'Growth / Exploitation (r)',
        points: [
          `Exploring new possibilities within ${systemToAnalyze}`,
          'Experimenting with different approaches',
          'High energy and potential for expansion'
        ]
      },
      K: {
        phase: 'K',
        title: 'Conservation (K)',
        points: [
          `Established patterns and structures in ${systemToAnalyze}`,
          'Optimized systems that may resist change',
          'Stability with potential rigidity'
        ]
      },
      Ω: {
        phase: 'Ω',
        title: 'Release / Collapse (Ω)',
        points: [
          `What might need to be released in ${systemToAnalyze}`,
          'Patterns that are breaking down or completing',
          'Creating space through letting go'
        ]
      },
      α: {
        phase: 'α',
        title: 'Reorganization (α)',
        points: [
          `Opportunities for renewal in ${systemToAnalyze}`,
          'Space for emergence and innovation',
          'Recombining resources in new ways'
        ]
      }
    };
  }
};
