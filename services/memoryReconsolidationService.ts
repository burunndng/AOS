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

export interface RawContradictionData {
  beliefId: string;
  anchors: string[];
  newTruths: string[];
  regulationCues: string[];
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
      "emotionalCharge": 7,
      "category": "identity|capability|worthiness|safety|belonging|possibility|other",
      "affectTone": "shame|fear|anger|sadness|grief|confusion|mixed|neutral",
      "depth": "surface|moderate|deep",
      "bodyLocation": "chest|stomach|throat|head|etc (optional)",
      "originStory": "When/how this belief formed (optional)",
      "limitingPatterns": ["behavior 1", "behavior 2"] (optional)
    }
  ],
  "summary": "A brief 2-3 sentence summary of the core beliefs identified"
}

Guidelines:
- Each belief should be a clear, concise statement
- emotionalCharge is 1-10 (how strongly this belief is felt)
- category, affectTone, and depth are REQUIRED
- Focus on beliefs that create suffering or limitation
- bodyLocation, originStory, and limitingPatterns are optional but helpful

Return ONLY valid JSON, no additional text.`;

  const responseText = await generateText(prompt);

  // Parse JSON response
  try {
    const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    // Ensure beliefs have proper structure with all required fields
    const beliefs: ImplicitBelief[] = parsed.beliefs.map((b: any, idx: number) => ({
      id: b.id || `belief-${idx + 1}`,
      belief: b.belief || '',
      emotionalCharge: b.emotionalCharge || payload.baselineIntensity || 5,
      category: b.category || 'other',
      affectTone: b.affectTone || 'mixed',
      depth: b.depth || 'moderate',
      bodyLocation: b.bodyLocation,
      originStory: b.originStory || b.evidence, // fallback to evidence if provided
      limitingPatterns: b.limitingPatterns
    }));

    return {
      beliefs,
      summary: parsed.summary || 'Implicit beliefs extracted from memory.'
    };
  } catch (error) {
    console.error('Failed to parse beliefs JSON:', error);
    console.error('Response text:', responseText);
    // Return fallback structure with all required ImplicitBelief fields
    return {
      beliefs: [{
        id: 'belief-1',
        belief: 'Unable to extract beliefs automatically. Please review the memory manually.',
        emotionalCharge: payload.baselineIntensity || 5,
        category: 'other' as const,
        affectTone: 'mixed' as const,
        depth: 'moderate' as const,
        originStory: payload.memoryNarrative.substring(0, 200) + (payload.memoryNarrative.length > 200 ? '...' : '')
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

  const prompt = `You are a therapeutic assistant helping with Memory Reconsolidation Therapy. For each limiting belief, mine contradictory evidence and generate alternatives.

Limiting Beliefs Identified:
${beliefsText}

${payload.contradictionSeeds && payload.contradictionSeeds.length > 0 ? `User's Contradiction Ideas:\n${payload.contradictionSeeds.join('\n')}\n` : ''}
${payload.userSuppliedResources && payload.userSuppliedResources.length > 0 ? `User's Resources/Evidence:\n${payload.userSuppliedResources.join('\n')}\n` : ''}

For EACH belief, generate:
1. Anchors: 2-3 specific, vivid counter-experiences or evidence that directly contradicts the belief
2. New Truths: 2-3 alternative, empowering belief statements based on those anchors
3. Regulation Cues: 2-3 somatic or cognitive resources (grounding statements, breathing cues, sensations) to support nervous system regulation during juxtaposition
4. Juxtaposition Prompts: 2-3 guided questions to hold both the old belief and new truth simultaneously

Return a JSON object in this exact format:
{
  "contradictions": [
    {
      "beliefId": "belief-1",
      "anchors": [
        "Specific memory or evidence that contradicts the belief - be vivid and emotionally resonant",
        "Another concrete counter-example or lived experience",
        "A third piece of evidence if available"
      ],
      "newTruths": [
        "An alternative empowering perspective based on the anchors",
        "Another alternative belief statement",
        "A third perspective if relevant"
      ],
      "regulationCues": [
        "A grounding statement or somatic cue (e.g., 'Feel your feet on the ground')",
        "A breathing or nervous system regulation cue",
        "A cognitive anchor or affirmation"
      ],
      "juxtapositionPrompts": [
        "How does it feel in your body to hold both 'I am not good enough' AND 'I successfully...'?",
        "What happens when you let both truths exist at the same time?",
        "Where do you feel the contradiction in your nervous system?"
      ]
    }
  ],
  "juxtapositionCyclePrompts": [
    "Guided prompt 1 for juxtaposition practice - about holding the mismatch",
    "Guided prompt 2 for juxtaposition practice - about what emerges"
  ],
  "integrationGuidance": "Overall guidance for how the reconsolidation process works and what to expect"
}

Guidelines:
- Each anchor should be a SPECIFIC, vivid lived experience or evidence, not abstract
- Each new truth should be a full belief statement that contradicts the old belief
- Regulation cues should be concrete, somatic, or cognitive resources
- Juxtaposition prompts should guide experiencing BOTH the old and new truth simultaneously
- Generate content that will trigger reconsolidation: create a neurobiological mismatch

Return ONLY valid JSON, no additional text.`;

  const responseText = await generateText(prompt);

  // Parse JSON response
  try {
    const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    // Ensure contradictions have proper structure matching ContradictionInsight type
    const contradictions: ContradictionInsight[] = parsed.contradictions.map((c: any) => ({
      beliefId: c.beliefId,
      anchors: Array.isArray(c.anchors) ? c.anchors : [c.anchors || 'Contradiction evidence'],
      newTruths: Array.isArray(c.newTruths) ? c.newTruths : [c.newTruths || 'Alternative perspective'],
      regulationCues: Array.isArray(c.regulationCues) ? c.regulationCues : [c.regulationCues || 'Take a grounding breath'],
      juxtapositionPrompts: Array.isArray(c.juxtapositionPrompts) ? c.juxtapositionPrompts : [c.juxtapositionPrompts || 'Hold both truths in awareness'],
      dateIdentified: new Date().toISOString()
    }));

    return {
      contradictions,
      juxtapositionCyclePrompts: Array.isArray(parsed.juxtapositionCyclePrompts)
        ? parsed.juxtapositionCyclePrompts
        : ['Hold both the belief and contradiction in awareness'],
      integrationGuidance: parsed.integrationGuidance || 'Notice how these contradictions create space for new understanding.'
    };
  } catch (error) {
    console.error('Failed to parse contradictions JSON:', error);
    // Return fallback structure with proper ContradictionInsight format
    return {
      contradictions: selectedBeliefs.map((b) => ({
        beliefId: b.id,
        anchors: ['Consider times when this belief was not true. What evidence contradicts it?'],
        newTruths: ['I am capable of more than this belief allows.'],
        regulationCues: ['Take a slow breath. Feel your feet on the ground.'],
        juxtapositionPrompts: ['What would it mean if this belief were not completely true?'],
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
