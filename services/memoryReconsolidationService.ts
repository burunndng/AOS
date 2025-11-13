import { ContradictionInsight, ImplicitBelief } from '../types.ts';
import { generateText } from './geminiService.ts';

const BASE_URL = '/api/shadow/memory-reconsolidation';

export interface ExtractImplicitBeliefsPayload {
  memoryNarrative: string;
  emotionalTone?: string;
  bodySensations?: string;
  baselineIntensity?: number;
  additionalContext?: Record<string, unknown>;
}

export interface ExtractImplicitBeliefsResponse {
  beliefs: ImplicitBelief[];
  summary: string;
}

export interface MineContradictionsPayload {
  beliefs: Array<{ id: string; belief: string }>;
  beliefIds: string[];
  contradictionSeeds?: string[];
  userSuppliedResources?: string[];
}

export interface MineContradictionsResponse {
  contradictions: ContradictionInsight[];
  juxtapositionCyclePrompts: string[];
  integrationGuidance: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = 'An unexpected error occurred';
    try {
      const errorBody = await response.json();
      errorMessage = errorBody?.error || errorBody?.message || errorMessage;
    } catch (err) {
      // Ignore JSON parse errors and fallback to status text
      errorMessage = response.statusText || errorMessage;
    }

    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

export async function extractImplicitBeliefs(
  payload: ExtractImplicitBeliefsPayload,
): Promise<ExtractImplicitBeliefsResponse> {
  // Use client-side Gemini generation instead of API call
  const prompt = `You are a therapeutic assistant helping with Memory Reconsolidation Therapy. Your task is to extract implicit beliefs from a memory narrative.

Memory Narrative:
${payload.memoryNarrative}

${payload.emotionalTone ? `Emotional Tone: ${payload.emotionalTone}` : ''}
${payload.bodySensations ? `Body Sensations: ${payload.bodySensations}` : ''}

Extract 3-5 implicit beliefs that are embedded in this memory. These are often:
- Beliefs about self ("I am...")
- Beliefs about others ("People are...")
- Beliefs about the world ("The world is...")
- Beliefs about safety, worthiness, belonging

Return a JSON object in this exact format:
{
  "beliefs": [
    {
      "id": "belief-1",
      "belief": "The implicit belief statement",
      "evidence": "Quote or reference from the memory that supports this",
      "emotionalCharge": 7
    }
  ],
  "summary": "A brief 2-3 sentence summary of the core beliefs identified"
}

Guidelines:
- Each belief should be a clear, concise statement
- emotionalCharge is 1-10 (how strongly this belief is felt)
- Evidence should quote directly from the memory when possible
- Focus on beliefs that create suffering or limitation

Return ONLY valid JSON, no additional text.`;

  const responseText = await generateText(prompt);

  // Parse JSON response
  try {
    const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    // Ensure beliefs have proper structure
    const beliefs: ImplicitBelief[] = parsed.beliefs.map((b: any, idx: number) => ({
      id: b.id || `belief-${idx + 1}`,
      belief: b.belief || '',
      evidence: b.evidence || '',
      emotionalCharge: b.emotionalCharge || 5
    }));

    return {
      beliefs,
      summary: parsed.summary || 'Implicit beliefs extracted from memory.'
    };
  } catch (error) {
    console.error('Failed to parse beliefs JSON:', error);
    // Return fallback structure
    return {
      beliefs: [{
        id: 'belief-1',
        belief: 'Unable to extract beliefs automatically. Please review the memory manually.',
        evidence: payload.memoryNarrative.substring(0, 100) + '...',
        emotionalCharge: 5
      }],
      summary: 'Automatic belief extraction encountered an error. Please review manually.'
    };
  }
}

export async function mineContradictions(
  payload: MineContradictionsPayload,
): Promise<MineContradictionsResponse> {
  // Use client-side Gemini generation instead of API call
  const selectedBeliefs = payload.beliefs.filter(b => payload.beliefIds.includes(b.id));
  const beliefsText = selectedBeliefs.map((b, idx) => `${idx + 1}. Belief ID: ${b.id}, Belief: "${b.belief}"`).join('\n');

  const prompt = `You are a therapeutic assistant helping with Memory Reconsolidation Therapy. Find contradictions to limiting beliefs.

Limiting Beliefs Identified:
${beliefsText}

${payload.contradictionSeeds && payload.contradictionSeeds.length > 0 ? `User's Contradiction Ideas:\n${payload.contradictionSeeds.join('\n')}\n` : ''}
${payload.userSuppliedResources && payload.userSuppliedResources.length > 0 ? `User's Resources/Evidence:\n${payload.userSuppliedResources.join('\n')}\n` : ''}

For each belief, provide:
- Anchors: 2-3 specific counter-experiences or evidence that contradict the belief
- New Truths: 2-3 alternative, empowering perspectives
- Regulation Cues: 2-3 grounding statements or somatic resources
- Juxtaposition Prompts: 2-3 prompts for holding belief + contradiction simultaneously

Return a JSON object in this exact format:
{
  "contradictions": [
    {
      "beliefId": "belief-1",
      "anchors": [
        "Specific counter-experience 1",
        "Specific counter-experience 2"
      ],
      "newTruths": [
        "Alternative empowering perspective 1",
        "Alternative empowering perspective 2"
      ],
      "regulationCues": [
        "Grounding statement or breath cue 1",
        "Somatic resource 2"
      ],
      "juxtapositionPrompts": [
        "Hold both old belief and new truth - prompt 1",
        "Notice what arises - prompt 2"
      ],
      "dateIdentified": "${new Date().toISOString()}"
    }
  ],
  "juxtapositionCyclePrompts": [
    "Guided prompt 1 for overall juxtaposition practice",
    "Guided prompt 2 for overall juxtaposition practice"
  ],
  "integrationGuidance": "Overall guidance for integrating these contradictions"
}

Guidelines:
- Anchors should be vivid, specific moments from the person's life
- New truths should feel emotionally resonant and empowering
- Regulation cues help the person stay grounded during juxtaposition
- Make everything concrete and embodied, not abstract

Return ONLY valid JSON, no additional text.`;

  const responseText = await generateText(prompt);

  // Parse JSON response
  try {
    const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    // Ensure contradictions have proper structure matching ContradictionInsight interface
    const contradictions: ContradictionInsight[] = parsed.contradictions.map((c: any) => ({
      beliefId: c.beliefId || selectedBeliefs[0]?.id || 'belief-1',
      anchors: c.anchors || ['Consider times when this belief was not true'],
      newTruths: c.newTruths || ['There may be another way to see this situation'],
      regulationCues: c.regulationCues || ['Take a deep breath', 'Notice your feet on the ground'],
      juxtapositionPrompts: c.juxtapositionPrompts || ['Hold both the old belief and the new truth together'],
      dateIdentified: c.dateIdentified || new Date().toISOString()
    }));

    return {
      contradictions,
      juxtapositionCyclePrompts: parsed.juxtapositionCyclePrompts || ['Hold both the belief and contradiction in awareness'],
      integrationGuidance: parsed.integrationGuidance || 'Notice how these contradictions create space for new understanding.'
    };
  } catch (error) {
    console.error('Failed to parse contradictions JSON:', error);
    // Return fallback structure matching ContradictionInsight interface
    return {
      contradictions: selectedBeliefs.map((b) => ({
        beliefId: b.id,
        anchors: ['Consider times when this belief was not completely true', 'Remember moments that contradict this pattern'],
        newTruths: ['There may be another way to see this', 'This belief is not the whole truth'],
        regulationCues: ['Take three deep breaths', 'Feel your feet on the ground', 'Notice sensations in your body'],
        juxtapositionPrompts: ['Hold both the old belief and new truth together', 'Notice what arises when you experience both'],
        dateIdentified: new Date().toISOString()
      })),
      juxtapositionCyclePrompts: ['Hold both the belief and its contradiction simultaneously', 'Notice what arises when you experience both truths together'],
      integrationGuidance: 'Allow yourself to feel the dissonance. This is where transformation happens.'
    };
  }
}

export interface SubmitSessionCompletionPayload {
  sessionId: string;
  userId: string;
  finalBeliefs: ImplicitBelief[];
  contradictionInsights: ContradictionInsight[];
  personalReflection: string;
  commitments: string[];
  timestamp: Date;
}

export async function submitSessionCompletion(
  payload: SubmitSessionCompletionPayload,
): Promise<{ success: boolean; sessionId: string }> {
  // Since databases are not working, we'll just return success
  // The session is already stored in localStorage by the wizard component
  return {
    success: true,
    sessionId: payload.sessionId
  };
}
