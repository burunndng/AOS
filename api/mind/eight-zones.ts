/**
 * Mind - 8 Zones of Knowing API Endpoints
 * Provides AI-powered enhancement and synthesis for integral analysis
 * using the 8 Zones framework via Gemini API
 */

import { GoogleGenAI, Type } from '@google/genai';
import { ZoneAnalysis } from '../../types.js';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.API_KEY,
});

const MODEL = 'gemini-2.5-flash';

// ============================================
// ENHANCE ZONE ANALYSIS ENDPOINT
// ============================================

export interface EnhanceZoneRequest {
  zoneNumber: number;
  zoneFocus: string;
  userInput: string;
  focalQuestion: string;
  previousZones?: ZoneAnalysis[];
}

export interface EnhanceZoneResponse {
  enhancement: string;
  keyInsights: string[];
}

export async function enhanceZoneAnalysis(
  payload: EnhanceZoneRequest,
): Promise<EnhanceZoneResponse> {
  console.log(`[8 Zones] Enhancing Zone ${payload.zoneNumber} analysis for focal question: "${payload.focalQuestion}"`);

  try {
    // Validate API key
    if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_GENERATIVE_AI_API_KEY && !process.env.API_KEY) {
      throw new Error('GEMINI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, or API_KEY environment variable is not set');
    }

    if (!payload.userInput || payload.userInput.trim().length === 0) {
      throw new Error('userInput is required and cannot be empty');
    }

    const zoneContext = payload.previousZones && payload.previousZones.length > 0
      ? `\n\nContext from previous zones:\n${payload.previousZones
          .map((z) => `Zone ${z.zoneNumber} (${z.zoneFocus}): ${z.userInput}`)
          .join('\n')}`
      : '';

    const prompt = `You are an expert in Integral Theory and the 8 Zones of Knowing framework (Ken Wilber).

Your task is to provide deeper, nuanced insights into the user's analysis of their focal question through Zone ${payload.zoneNumber}.

**Focal Question Being Analyzed:** "${payload.focalQuestion}"

**Zone ${payload.zoneNumber} - ${payload.zoneFocus}**
The user is analyzing this question through the lens of: ${payload.zoneFocus}

**User's Analysis:**
${payload.userInput}
${zoneContext}

---

**Your Task:**
1. Acknowledge and validate what the user has identified
2. Offer 2-3 deeper insights they may not have considered
3. Point out any blind spots or missing perspectives within THIS zone
4. Suggest methodologies from this zone they could use to explore further
5. Connect their insights to how this zone influences other zones (if applicable from their previous inputs)

Keep your response focused, insightful, and specific to their focal question. Use 2-3 paragraphs.

Respond with a cohesive enhancement that flows naturally, not bullet points.`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const enhancement = response.text;

    if (!enhancement) {
      throw new Error('No text response from AI');
    }

    // Extract key insights (sentences starting with capital letters that are questions or statements)
    const sentences = enhancement.split(/(?<=[.!?])\s+/);
    const keyInsights = sentences
      .filter((s) => s.length > 20 && (s.includes('?') || s.match(/^[A-Z]/)))
      .slice(0, 3)
      .map((s) => s.trim());

    return {
      enhancement,
      keyInsights,
    };
  } catch (error) {
    console.error('[8 Zones] Error enhancing zone analysis:', error);
    throw error instanceof Error ? error : new Error('Failed to enhance zone analysis');
  }
}

// ============================================
// SYNTHESIZE ZONES ENDPOINT
// ============================================

export interface SynthesizeRequest {
  focalQuestion: string;
  zoneAnalyses: Record<number, ZoneAnalysis>;
}

export interface SynthesizeResponse {
  blindSpots: string[];
  novelInsights: string[];
  recommendations: string[];
  synthesisReport: string;
  connections: Array<{ fromZone: number; toZone: number; relationship: string }>;
}

export async function synthesizeZones(
  payload: SynthesizeRequest,
): Promise<SynthesizeResponse> {
  console.log('[8 Zones] Synthesizing all zones for focal question:', payload.focalQuestion);

  try {
    // Validate API key
    if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_GENERATIVE_AI_API_KEY && !process.env.API_KEY) {
      throw new Error('GEMINI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, or API_KEY environment variable is not set');
    }

    if (!payload.focalQuestion || payload.focalQuestion.trim().length === 0) {
      throw new Error('focalQuestion is required');
    }

    if (!payload.zoneAnalyses || Object.keys(payload.zoneAnalyses).length === 0) {
      throw new Error('zoneAnalyses is required and must not be empty');
    }

    const zonesSummary = Object.entries(payload.zoneAnalyses)
      .map(([zoneNum, analysis]) => `Zone ${zoneNum} (${analysis.zoneFocus}): ${analysis.userInput}`)
      .join('\n\n');

    const prompt = `You are a master practitioner of Integral Theory applying the 8 Zones of Knowing framework.

The user has completed an 8-zone analysis of the following focal question:

**FOCAL QUESTION:** "${payload.focalQuestion}"

**THEIR ZONE-BY-ZONE ANALYSIS:**
${zonesSummary}

---

**YOUR TASK - Generate an integrated synthesis:**

1. **BLIND SPOTS** (2-3 critical perspectives they missed or underexplored)
   - What important dimensions of their focal question are they NOT seeing?
   - Which zones feel shallow or underdeveloped?

2. **NOVEL INSIGHTS** (2-3 surprising connections or realizations)
   - What emerges when you integrate across all zones?
   - What patterns or relationships become visible only through this integral lens?
   - What contradictions or tensions are revealed?

3. **RECOMMENDATIONS** (3-4 actionable next steps)
   - What further inquiry or exploration would deepen their understanding?
   - What practices or methodologies from the zones should they explore?
   - How might they test or validate their emerging understanding?

4. **SYNTHESIS REPORT** (2-3 paragraphs)
   - Weave together the insights from all 8 zones into a coherent, holistic understanding
   - Show HOW the different perspectives interconnect
   - Reveal the "integral view" of their focal question
   - Point toward emergent possibilities or solutions that honor all zones

5. **KEY CONNECTIONS** (identify 3-4 important relationships between zones)
   - How does Zone X influence or shape Zone Y?
   - What feedback loops exist?

Format your response as a JSON object with keys: blindSpots (array of strings), novelInsights (array of strings), recommendations (array of strings), synthesisReport (string), connections (array of objects with fromZone (number), toZone (number), relationship (string)).`;

    let response;
    try {
      console.log('[8 Zones] Calling Gemini API with model:', MODEL);
      response = await ai.models.generateContent({
        model: MODEL,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              blindSpots: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              novelInsights: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              synthesisReport: { type: Type.STRING },
              connections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    fromZone: { type: Type.NUMBER },
                    toZone: { type: Type.NUMBER },
                    relationship: { type: Type.STRING },
                  },
                  required: ['fromZone', 'toZone', 'relationship'],
                },
              },
            },
            required: ['blindSpots', 'novelInsights', 'recommendations', 'synthesisReport', 'connections'],
          },
        },
      });

      if (!response) {
        throw new Error('No response received from Gemini API');
      }

      if (!response.text) {
        console.error('[8 Zones] Response object:', JSON.stringify(response, null, 2));
        throw new Error('Gemini API response has no text property');
      }

      console.log('[8 Zones] Gemini API response received, text length:', response.text.length);
    } catch (apiError) {
      const errorMsg = apiError instanceof Error ? apiError.message : String(apiError);
      console.error('[8 Zones] Gemini API call failed:', errorMsg);
      console.error('[8 Zones] Full error:', apiError);
      throw new Error(`Gemini API error: ${errorMsg}`);
    }

    let parsed: SynthesizeResponse;
    try {
      parsed = JSON.parse(response.text) as SynthesizeResponse;
    } catch (parseError) {
      console.error('[8 Zones] JSON parse error:', parseError);
      console.error('[8 Zones] Response text:', response.text.substring(0, 500));
      throw new Error(`Failed to parse synthesis response as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }

    // Validate required fields
    if (!parsed.blindSpots || !parsed.novelInsights || !parsed.recommendations || !parsed.synthesisReport) {
      console.error('[8 Zones] Missing required fields in synthesis response:', {
        hasBlindSpots: !!parsed.blindSpots,
        hasNovelInsights: !!parsed.novelInsights,
        hasRecommendations: !!parsed.recommendations,
        hasSynthesisReport: !!parsed.synthesisReport,
      });
      throw new Error('Synthesis response missing required fields');
    }

    return {
      blindSpots: Array.isArray(parsed.blindSpots) ? parsed.blindSpots : [],
      novelInsights: Array.isArray(parsed.novelInsights) ? parsed.novelInsights : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      synthesisReport: typeof parsed.synthesisReport === 'string' ? parsed.synthesisReport : '',
      connections: Array.isArray(parsed.connections) ? parsed.connections : [],
    };
  } catch (error) {
    console.error('[8 Zones] Error synthesizing zones:', error);
    throw error instanceof Error ? error : new Error('Failed to synthesize zones');
  }
}

// ============================================
// SUBMIT SESSION ENDPOINT
// ============================================

export interface SubmitSessionRequest {
  sessionId: string;
  focalQuestion: string;
  zoneAnalyses: Record<number, ZoneAnalysis>;
  synthesisReport: string;
  completedAt: string;
}

export async function submitSessionCompletion(
  payload: SubmitSessionRequest,
): Promise<{ success: boolean; sessionId: string }> {
  console.log('[8 Zones] Submitting session completion:', payload.sessionId);

  try {
    // In a real implementation, this would save to a database
    // For now, we just acknowledge receipt
    console.log('[8 Zones] Session archived:', {
      sessionId: payload.sessionId,
      focalQuestion: payload.focalQuestion,
      zonesCount: Object.keys(payload.zoneAnalyses).length,
      completedAt: payload.completedAt,
    });

    return {
      success: true,
      sessionId: payload.sessionId,
    };
  } catch (error) {
    console.error('[8 Zones] Error submitting session:', error);
    throw error instanceof Error ? error : new Error('Failed to submit session');
  }
}
