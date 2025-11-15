import { AdaptiveCycleDiagnosticAnswers, AdaptiveCyclePhaseAnalysis } from '../types.ts';
import { generateText } from './geminiService.ts';

/**
 * Diagnose which phase of the Adaptive Cycle the user is in
 * This is a local, deterministic function based on the 2x2 framework:
 * - Potential (Vertical Axis): Low to High
 * - Connectedness (Horizontal Axis): Low to High
 *
 * Quadrants:
 * - r (Growth/Exploitation): High Potential, Low Connectedness
 * - K (Conservation): High Potential, High Connectedness
 * - Ω (Release/Collapse): Low Potential, High Connectedness
 * - α (Reorganization): Low Potential, Low Connectedness
 */
export const diagnoseAdaptiveCyclePhase = (
  answers: AdaptiveCycleDiagnosticAnswers
): 'r' | 'K' | 'Ω' | 'α' => {
  const { potential, connectedness } = answers;

  // Midpoint is 5.5 on a 1-10 scale
  const isPotentialHigh = potential > 5.5;
  const isConnectednessHigh = connectedness > 5.5;

  if (isPotentialHigh && !isConnectednessHigh) {
    return 'r'; // Growth: High potential, low structure
  } else if (isPotentialHigh && isConnectednessHigh) {
    return 'K'; // Conservation: High potential, high structure (locked in)
  } else if (!isPotentialHigh && isConnectednessHigh) {
    return 'Ω'; // Release: Low potential, high rigidity (collapse imminent)
  } else {
    return 'α'; // Reorganization: Low potential, low structure (renewal space)
  }
};

/**
 * Generate AI-powered, personalized phase analysis
 * Uses gemini-2.5-pro for high-quality synthesis
 */
export const generateAdaptiveCycleAnalysis = async (
  systemToAnalyze: string,
  phase: 'r' | 'K' | 'Ω' | 'α',
  answers: AdaptiveCycleDiagnosticAnswers
): Promise<AdaptiveCyclePhaseAnalysis> => {
  const phaseNames = {
    'r': 'Growth/Exploitation (r)',
    'K': 'Conservation (K)',
    'Ω': 'Release/Collapse (Ω)',
    'α': 'Reorganization (α)'
  };

  const phaseDescriptions = {
    'r': 'A phase of rapid growth, experimentation, and expansion. Resources are abundant, rules are loose, and there\'s high energy for trying new things.',
    'K': 'A phase of stability, efficiency, and consolidation. The system is mature, highly connected, and optimized—but also rigid and vulnerable to disruption.',
    'Ω': 'A phase of breakdown and release. Old structures are collapsing, creating uncertainty and chaos, but also freeing up resources for renewal.',
    'α': 'A phase of reorganization and innovation. The old has been released, and there\'s space for experimentation, recombination, and emergence of new patterns.'
  };

  const prompt = `You are an expert in systems thinking and the Adaptive Cycle framework (developed by C.S. Holling). A user is analyzing their life situation using this framework.

**User's Context:** "${systemToAnalyze}"
**Diagnosed Phase:** ${phaseNames[phase]}
**Phase Description:** ${phaseDescriptions[phase]}

**Diagnostic Scores (1-10 scale):**
- Potential for growth/change: ${answers.potential}/10
- Connectedness/rigidity of current structure: ${answers.connectedness}/10
- Resilience/capacity to absorb disruption: ${answers.resilience}/10

Your task: Generate a personalized, actionable analysis for this user in JSON format.

Return ONLY valid JSON with this exact structure:
{
  "phase": "${phase}",
  "title": "${phaseNames[phase]}",
  "description": "A 2-3 sentence personalized description of what it means for THIS user to be in THIS phase for THIS specific system. Reference their context directly.",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "risks": ["risk 1", "risk 2", "risk 3"],
  "strategies": ["actionable strategy 1", "actionable strategy 2", "actionable strategy 3"]
}

Guidelines:
- **description**: Make it specific to their context ("${systemToAnalyze}"), not generic. Help them see what this phase means for them.
- **strengths**: What are the inherent advantages of being in this phase? What opportunities does it create?
- **risks**: What are the shadow aspects or vulnerabilities? What should they watch out for?
- **strategies**: Concrete, actionable strategies for navigating this phase effectively. Each should be 1-2 sentences and highly specific to their situation.

Return ONLY valid JSON, no markdown, no additional text.`;

  const responseText = await generateText(prompt);

  try {
    // Remove markdown code blocks if present
    const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('Failed to parse Adaptive Cycle analysis JSON:', error);
    // Return a fallback structure
    return {
      phase,
      title: phaseNames[phase],
      description: `You appear to be in the ${phaseNames[phase]} phase regarding ${systemToAnalyze}.`,
      strengths: ['Analysis pending - please review the framework'],
      risks: ['Analysis pending - please review the framework'],
      strategies: ['Review the diagnostic scores and reflect on your current situation', 'Consider retaking the assessment', 'Explore the framework documentation']
    };
  }
};
