import { ZoneAnalysis } from '../types.ts';
import { generateText } from './geminiService.ts';

/**
 * Enhance user's zone analysis with AI-generated insights
 */
export const enhanceZoneAnalysis = async (
  userId: string,
  zoneNumber: number,
  zoneFocus: string,
  userInput: string,
  focalQuestion: string,
  previousZones?: ZoneAnalysis[]
): Promise<string> => {
  // Use client-side Gemini generation instead of API call
  const previousContext = previousZones && previousZones.length > 0
    ? `\n\nPrevious zones explored:\n${previousZones.map(z => `Zone ${z.zoneNumber} (${z.zoneFocus}): ${z.userInput}`).join('\n')}`
    : '';

  const prompt = `You are guiding someone through the "Eight Zones of Knowing" framework to explore different perspectives on their focal question.

Focal Question: "${focalQuestion}"

Current Zone: Zone ${zoneNumber} - ${zoneFocus}
User's Input: "${userInput}"${previousContext}

Provide a thoughtful enhancement to their analysis that:
1. Deepens their reflection on this zone's unique perspective
2. Points out insights they may have missed
3. Connects to their focal question
4. Is 2-3 paragraphs, encouraging and reflective

Return only the enhancement text.`;

  return await generateText(prompt);
};

/**
 * Generate synthesis report showing connections between all zones
 */
export const generateSynthesis = async (
  userId: string,
  focalQuestion: string,
  zoneAnalyses: Record<number, ZoneAnalysis>
): Promise<{
  blindSpots: string[];
  novelInsights: string[];
  recommendations: string[];
  synthesisReport: string;
  connections: Array<{ fromZone: number; toZone: number; relationship: string }>;
}> => {
  // Use client-side Gemini generation instead of API call
  const zonesText = Object.values(zoneAnalyses)
    .map(zone => `**Zone ${zone.zoneNumber}: ${zone.zoneFocus}**\nUser Input: ${zone.userInput}\nAI Enhancement: ${zone.aiEnhancement || 'N/A'}`)
    .join('\n\n');

  const prompt = `You are synthesizing insights from the "Eight Zones of Knowing" framework exploration.

Focal Question: "${focalQuestion}"

All Zones Explored:
${zonesText}

Generate a comprehensive synthesis in the following JSON format:
{
  "blindSpots": ["insight 1", "insight 2", "insight 3"],
  "novelInsights": ["insight 1", "insight 2", "insight 3"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "synthesisReport": "A comprehensive 3-4 paragraph synthesis that weaves together all zones, highlighting patterns, tensions, and emergent wisdom",
  "connections": [
    {"fromZone": 1, "toZone": 3, "relationship": "description of connection"},
    {"fromZone": 2, "toZone": 5, "relationship": "description of connection"},
    {"fromZone": 4, "toZone": 7, "relationship": "description of connection"}
  ]
}

Guidelines:
- blindSpots: What perspectives or aspects are missing or underexplored?
- novelInsights: What unexpected or profound realizations emerged from seeing all zones together?
- recommendations: What are 3 actionable next steps based on this exploration?
- synthesisReport: A narrative that integrates all zones meaningfully
- connections: Identify 3-5 key relationships between different zones

Return ONLY valid JSON, no additional text.`;

  const responseText = await generateText(prompt);

  // Parse JSON response
  try {
    // Remove markdown code blocks if present
    const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('Failed to parse synthesis JSON:', error);
    // Return a fallback structure
    return {
      blindSpots: ['Unable to generate blind spots analysis'],
      novelInsights: ['Please review the zones manually for insights'],
      recommendations: ['Consider revisiting zones with less detail', 'Reflect on connections between zones', 'Journal about your focal question'],
      synthesisReport: responseText,
      connections: []
    };
  }
};

/**
 * Submit completed session for archiving
 * Note: Currently stores locally only (database integration disabled)
 */
export const submitSessionCompletion = async (
  sessionId: string,
  userId: string,
  focalQuestion: string,
  zoneAnalyses: Record<number, ZoneAnalysis>,
  synthesisReport: string
): Promise<{ success: boolean; sessionId: string }> => {
  // Since databases are not working, we'll just return success
  // The session is already stored in localStorage by the wizard component
  return {
    success: true,
    sessionId: sessionId
  };
};
