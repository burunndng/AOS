/**
 * Shadow Memory Reconsolidation API Endpoints
 * Provides stateless endpoints for implicit belief extraction, contradiction mining,
 * and session completion acknowledgements using Gemini API
 */

import { GoogleGenAI, Type } from '@google/genai';
import type { ImplicitBelief, ContradictionInsight, SessionCompletionSummary } from './types.js';

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY,
});

// ============================================
// EXTRACT BELIEFS ENDPOINT
// ============================================

export interface ExtractBeliefsRequest {
  memoryNarrative: string;
  emotionalTone?: string;
  bodySensations?: string;
  baselineIntensity?: number;
  additionalContext?: Record<string, any>;
}

export interface ExtractBeliefsResponse {
  beliefs: ImplicitBelief[];
  summary: string;
}

export async function extractBeliefsFromMemory(
  payload: ExtractBeliefsRequest,
): Promise<ExtractBeliefsResponse> {
  console.log('[Memory Reconsolidation] Extracting implicit beliefs from memory narrative');

  try {
    // Validate required fields
    if (!payload.memoryNarrative || payload.memoryNarrative.trim().length === 0) {
      throw new Error('memoryNarrative is required and cannot be empty');
    }

    const emotionalToneContext = payload.emotionalTone ? `\nEmotional tone: ${payload.emotionalTone}` : '';
    const bodySensationsContext = payload.bodySensations ? `\nBody sensations: ${payload.bodySensations}` : '';
    const baselineIntensityContext = payload.baselineIntensity
      ? `\nBaseline emotional intensity: ${payload.baselineIntensity}/10`
      : '';

    const prompt = `You are an expert shadow work facilitator analyzing a memory narrative for implicit beliefs.

Memory Narrative:
${payload.memoryNarrative}${emotionalToneContext}${bodySensationsContext}${baselineIntensityContext}

Extract implicit beliefs that are embedded in this narrative. For each belief, identify:
1. The core belief statement
2. Emotional charge (1-10 scale where 10 is most charged)
3. Physical location where this belief is held in the body (if mentioned or implied)
4. The origin story or context that established this belief
5. Limiting patterns that result from this belief
6. Depth assessment (surface, moderate, or deep)

Return a JSON array of beliefs with proper structure.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            beliefs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  belief: { type: Type.STRING },
                  emotionalCharge: { type: Type.NUMBER },
                  bodyLocation: { type: Type.STRING },
                  originStory: { type: Type.STRING },
                  limitingPatterns: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  depth: { type: Type.STRING },
                },
                required: ['id', 'belief', 'emotionalCharge', 'depth'],
              },
            },
            summary: { type: Type.STRING },
          },
          required: ['beliefs', 'summary'],
        },
      },
    });

    const result = JSON.parse(response.text) as ExtractBeliefsResponse;

    // Validate and normalize response
    if (!Array.isArray(result.beliefs)) {
      throw new Error('Response beliefs is not an array');
    }

    result.beliefs.forEach((belief, index) => {
      if (!belief.id) {
        belief.id = `belief-${Date.now()}-${index}`;
      }
      if (!belief.depth) {
        belief.depth = 'moderate';
      }
    });

    console.log(`[Memory Reconsolidation] Extracted ${result.beliefs.length} beliefs`);
    return result;
  } catch (error) {
    console.error('[Memory Reconsolidation] Error extracting beliefs:', error);
    throw error;
  }
}

// ============================================
// MINE CONTRADICTIONS ENDPOINT
// ============================================

export interface MineContradictionsRequest {
  beliefIds: string[];
  beliefs: Array<{ id: string; belief: string }>;
  contradictionSeeds?: string[];
  userSuppliedResources?: string[];
}

export interface MineContradictionsResponse {
  contradictions: ContradictionInsight[];
  juxtapositionCyclePrompts: string[];
  integrationGuidance: string;
}

export async function mineContradictions(
  payload: MineContradictionsRequest,
): Promise<MineContradictionsResponse> {
  console.log('[Memory Reconsolidation] Mining contradictions for belief set');

  try {
    // Validate required fields
    if (!payload.beliefs || payload.beliefs.length === 0) {
      throw new Error('beliefs array is required and cannot be empty');
    }

    if (!payload.beliefIds || payload.beliefIds.length === 0) {
      throw new Error('beliefIds array is required and cannot be empty');
    }

    const beliefContext = payload.beliefs.map((b) => `- ID: ${b.id}, Belief: ${b.belief}`).join('\n');
    const seedsContext = payload.contradictionSeeds
      ? `\nContradiction seeds to explore:\n${payload.contradictionSeeds.map((s) => `- ${s}`).join('\n')}`
      : '';
    const resourcesContext = payload.userSuppliedResources
      ? `\nUser-supplied counter-evidence/resources:\n${payload.userSuppliedResources.map((r) => `- ${r}`).join('\n')}`
      : '';

    const prompt = `You are an expert in shadow work contradiction mining and belief reconsolidation.

Your task is to identify contradictions, counter-evidence, and alternative perspectives for these core beliefs:
${beliefContext}${seedsContext}${resourcesContext}

For each belief, provide:
1. Anchors: Grounding points, counter-evidence, or moments when the belief was not true
2. New truths: Alternative perspectives or reframes that contradict the limiting belief
3. Regulation cues: Somatic (body-based) and cognitive resources that support the new truth
4. Juxtaposition prompts: Prompts designed to juxtapose the old belief with new evidence

Return a JSON object with:
- contradictions: array of objects with beliefId, anchors[], newTruths[], regulationCues[], juxtapositionPrompts[]
- juxtapositionCyclePrompts: array of full prompts for the juxtaposition meditation/cycle
- integrationGuidance: guidance on embodying and integrating these new truths`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            contradictions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  beliefId: { type: Type.STRING },
                  anchors: { type: Type.ARRAY, items: { type: Type.STRING } },
                  newTruths: { type: Type.ARRAY, items: { type: Type.STRING } },
                  regulationCues: { type: Type.ARRAY, items: { type: Type.STRING } },
                  juxtapositionPrompts: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['beliefId', 'anchors', 'newTruths', 'regulationCues', 'juxtapositionPrompts'],
              },
            },
            juxtapositionCyclePrompts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            integrationGuidance: { type: Type.STRING },
          },
          required: ['contradictions', 'juxtapositionCyclePrompts', 'integrationGuidance'],
        },
      },
    });

    const result = JSON.parse(response.text) as MineContradictionsResponse;

    // Validate response
    if (!Array.isArray(result.contradictions)) {
      throw new Error('Response contradictions is not an array');
    }
    if (!Array.isArray(result.juxtapositionCyclePrompts)) {
      throw new Error('Response juxtapositionCyclePrompts is not an array');
    }

    console.log(`[Memory Reconsolidation] Mined ${result.contradictions.length} contradictions`);
    return result;
  } catch (error) {
    console.error('[Memory Reconsolidation] Error mining contradictions:', error);
    throw error;
  }
}

// ============================================
// COMPLETE SESSION ENDPOINT
// ============================================

export interface CompleteSessionRequest {
  intensityShift: number;
  integrationChoice: string;
  notes?: string;
  sessionContext?: string;
}

export interface CompleteSessionResponse {
  acknowledgement: string;
  closingPrompt: string;
  integrationReminder: string;
}

export async function completeSession(
  payload: CompleteSessionRequest,
): Promise<CompleteSessionResponse> {
  console.log('[Memory Reconsolidation] Processing session completion');

  try {
    // Validate required fields
    if (payload.intensityShift === undefined || payload.intensityShift === null) {
      throw new Error('intensityShift is required');
    }
    if (!payload.integrationChoice || payload.integrationChoice.trim().length === 0) {
      throw new Error('integrationChoice is required');
    }

    const notesContext = payload.notes ? `\nUser notes: ${payload.notes}` : '';
    const sessionContext = payload.sessionContext ? `\nSession context: ${payload.sessionContext}` : '';

    const prompt = `You are a compassionate shadow work facilitator creating a closure statement for a reconsolidation session.

Session completion data:
- Intensity shift: ${payload.intensityShift} points
- Integration choice: ${payload.integrationChoice}${notesContext}${sessionContext}

Create a JSON response with:
1. acknowledgement: A compassionate acknowledgement of the work done (2-3 sentences)
2. closingPrompt: A final grounding or integration prompt (1-2 sentences)
3. integrationReminder: A brief reminder for how to carry this work forward (1-2 sentences)

Make the response warm, affirming, and genuinely supportive.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            acknowledgement: { type: Type.STRING },
            closingPrompt: { type: Type.STRING },
            integrationReminder: { type: Type.STRING },
          },
          required: ['acknowledgement', 'closingPrompt', 'integrationReminder'],
        },
      },
    });

    const result = JSON.parse(response.text) as CompleteSessionResponse;

    // Validate response
    if (!result.acknowledgement || !result.closingPrompt || !result.integrationReminder) {
      throw new Error('Response missing required fields');
    }

    console.log('[Memory Reconsolidation] Session completion processed successfully');
    return result;
  } catch (error) {
    console.error('[Memory Reconsolidation] Error completing session:', error);
    throw error;
  }
}

// ============================================
// HEALTH CHECK
// ============================================

export async function healthCheck(): Promise<{ status: 'ok' | 'error'; message?: string }> {
  try {
    // Verify Gemini API key is configured
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      return {
        status: 'error',
        message: 'Gemini API key not configured',
      };
    }

    return { status: 'ok' };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
