import { ZoneAnalysis, DialogueEntry } from '../types.ts';
import { generateText } from './geminiService.ts';

/**
 * Generate AI-facilitated connection dialogue between zones
 * Acts as an Integral Theory facilitator using Socratic questioning
 */
export const generateConnectionDialogue = async (
  focalQuestion: string,
  zoneA: ZoneAnalysis,
  zoneB: ZoneAnalysis,
  dialogueHistory: DialogueEntry[]
): Promise<string> => {
  const previousContext = dialogueHistory.length > 0
    ? `\n\n**Previous Dialogue:**\n${dialogueHistory.map(d => `- ${d.role === 'user' ? 'User' : 'Facilitator'}: ${d.text}`).join('\n')}`
    : '';

  const prompt = `## PERSONA
You are an expert facilitator of Integral Theory, guiding a user through the 8 Zones of Knowing framework. Your tone is insightful, curious, and encouraging. Your goal is to help the user discover the connections between different perspectives on their own.

## YOUR TASK
You will be given the user's main topic, their analysis from two different zones, and the current dialogue history. Your task is to generate the *next* Socratic question to continue the dialogue. If the history is empty, generate the *first* question.

## CRITICAL INSTRUCTIONS
- **DIRECTLY QUOTE or PARAPHRASE the user's actual words** from their zone analyses
- **DO NOT use placeholders** like "[mention user's topic]" or "[user's challenge]"
- **BE SPECIFIC** to what they actually wrote, not generic
- Your question should help them see connections between the two zones by referencing their concrete statements

## CONTEXT

**User's Focal Question:**
"${focalQuestion}"

**Zone ${zoneA.zoneNumber} (${zoneA.zoneFocus}) - User's Analysis:**
"${zoneA.userInput}"

**Zone ${zoneB.zoneNumber} (${zoneB.zoneFocus}) - User's Analysis:**
"${zoneB.userInput}"${previousContext}

## INSTRUCTION
${dialogueHistory.length === 0
  ? `Generate your FIRST question to help the user connect these two zones. Quote or reference their specific words from both zones. Make it open-ended and thought-provoking.`
  : dialogueHistory.length >= 3
    ? `The user has reflected enough on this connection. Acknowledge their insight with a brief, specific summary of what they discovered, then warmly invite them to continue to the next zone.`
    : `Generate your NEXT question based on the dialogue so far. Build on what they've shared, quote their words, and probe deeper into the connection.`
}

Return ONLY the question/response text (no preamble, no meta-commentary).`;

  return await generateText(prompt);
};

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
  zoneAnalyses: Record<number, ZoneAnalysis>,
  connectionReflections?: Array<{ zones: string; dialogue: DialogueEntry[] }>
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

  const connectionsText = connectionReflections && connectionReflections.length > 0
    ? `\n\nUser's Connection Reflections:\n${connectionReflections.map(conn =>
        `**${conn.zones}:**\n${conn.dialogue.map(d => `- ${d.role === 'user' ? 'User' : 'Facilitator'}: ${d.text}`).join('\n')}`
      ).join('\n\n')}`
    : '';

  const prompt = `You are synthesizing insights from the "Eight Zones of Knowing" framework exploration.

Focal Question: "${focalQuestion}"

All Zones Explored:
${zonesText}${connectionsText}

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
- novelInsights: What unexpected or profound realizations emerged from seeing all zones together? ${connectionsText ? 'Pay special attention to insights the user discovered in their connection reflections.' : ''}
- recommendations: What are 3 actionable next steps based on this exploration?
- synthesisReport: A narrative that integrates all zones meaningfully${connectionsText ? ', building on the user\'s own articulated connections between zones' : ''}
- connections: Identify 3-5 key relationships between different zones${connectionsText ? ' (include and expand on the connections the user already discovered)' : ''}

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
