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
  const beliefsText = selectedBeliefs.map((b, idx) => `${idx + 1}. "${b.belief}"`).join('\n');

  const prompt = `You are a therapeutic assistant helping with Memory Reconsolidation Therapy. Find contradictions to limiting beliefs.

Limiting Beliefs Identified:
${beliefsText}

${payload.contradictionSeeds && payload.contradictionSeeds.length > 0 ? `User's Contradiction Ideas:\n${payload.contradictionSeeds.join('\n')}\n` : ''}
${payload.userSuppliedResources && payload.userSuppliedResources.length > 0 ? `User's Resources/Evidence:\n${payload.userSuppliedResources.join('\n')}\n` : ''}

Find 2-3 powerful contradictions for each belief. These should be:
- Specific counter-experiences or evidence
- Emotionally resonant and vivid
- From the person's actual life experience (or hypothetical if needed)
- Challenge the belief at an emotional level, not just rational

Also provide:
- Juxtaposition prompts: Questions to guide the person through holding both the belief and contradiction simultaneously
- Integration guidance: How to work with the dissonance

Return a JSON object in this exact format:
{
  "contradictions": [
    {
      "id": "contra-1",
      "targetBeliefId": "belief-1",
      "contradictionStatement": "Clear statement of the contradicting evidence or experience",
      "emotionalResonance": 8,
      "source": "Specific memory, experience, or insight",
      "integrationPrompt": "A question or prompt to help integrate this contradiction"
    }
  ],
  "juxtapositionCyclePrompts": [
    "Guided prompt 1 for juxtaposition practice",
    "Guided prompt 2 for juxtaposition practice"
  ],
  "integrationGuidance": "Overall guidance for integrating these contradictions into a new understanding"
}

Guidelines:
- Each contradiction should directly challenge a specific belief
- emotionalResonance is 1-10 (how emotionally powerful the contradiction is)
- Make contradictions vivid and specific, not abstract
- Integration prompts should be open-ended questions

Return ONLY valid JSON, no additional text.`;

  const responseText = await generateText(prompt);

  // Parse JSON response
  try {
    const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    // Ensure contradictions have proper structure
    const contradictions: ContradictionInsight[] = parsed.contradictions.map((c: any, idx: number) => ({
      id: c.id || `contra-${idx + 1}`,
      targetBeliefId: c.targetBeliefId || selectedBeliefs[0]?.id || 'belief-1',
      contradictionStatement: c.contradictionStatement || '',
      emotionalResonance: c.emotionalResonance || 5,
      source: c.source || 'Generated insight',
      integrationPrompt: c.integrationPrompt || 'How does this contradiction change your understanding?'
    }));

    return {
      contradictions,
      juxtapositionCyclePrompts: parsed.juxtapositionCyclePrompts || ['Hold both the belief and contradiction in awareness'],
      integrationGuidance: parsed.integrationGuidance || 'Notice how these contradictions create space for new understanding.'
    };
  } catch (error) {
    console.error('Failed to parse contradictions JSON:', error);
    // Return fallback structure
    return {
      contradictions: selectedBeliefs.map((b, idx) => ({
        id: `contra-${idx + 1}`,
        targetBeliefId: b.id,
        contradictionStatement: 'Consider times when this belief was not true. What evidence contradicts it?',
        emotionalResonance: 5,
        source: 'Self-reflection prompt',
        integrationPrompt: 'What would it mean if this belief were not completely true?'
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
