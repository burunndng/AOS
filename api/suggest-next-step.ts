/**
 * Cross-Wizard Intelligence API
 * Analyzes completed therapeutic sessions and recommends the most appropriate next wizard
 * Uses OpenRouter with minimax/minimax-m2 for rich contextual analysis
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { SuggestNextStepRequest, SuggestNextStepResponse, AnalysisResult } from '../services/openRouterService';

const SYSTEM_PROMPT = `You are an expert integral psychotherapist with deep knowledge of multiple therapeutic modalities. Your role is to analyze completed therapeutic sessions and recommend the most appropriate next step in the user's healing journey.

You have access to four powerful therapeutic wizards:

1. **Memory Reconsolidation** (memory-recon)
   - Based on Ecker et al.'s research on belief change
   - Best for: Persistent emotional patterns, limiting beliefs, contradictory thoughts
   - Uses juxtaposition cycles to create experiential dissonance
   - Ideal when: User has identified a specific belief or emotional pattern they want to transform

2. **Internal Family Systems** (ifs)
   - Based on Richard Schwartz's IFS therapy
   - Best for: Internal conflicts, parts work, self-compassion
   - Explores protective parts, exiled parts, and the Self
   - Ideal when: User experiences internal conflict or needs to work with a specific "part" of themselves

3. **3-2-1 Shadow Process** (3-2-1)
   - Based on Ken Wilber's integral shadow work
   - Best for: Projections, triggers, disowned qualities
   - Moves from 3rd person (it) → 2nd person (you) → 1st person (I)
   - Ideal when: User is triggered by someone/something or projecting onto others

4. **Eight Zones of Enneagram** (eight-zones)
   - Integrative practice combining Enneagram with awareness cultivation
   - Best for: Self-understanding, blind spots, developmental work
   - Maps eight zones of consciousness and their blind spots
   - Ideal when: User needs broader self-awareness or pattern recognition

Analyze the completed session and provide recommendations in this EXACT JSON format:
{
  "recommendations": [
    {
      "wizard": "memory-recon" | "ifs" | "3-2-1" | "eight-zones",
      "confidence": 0.0-1.0,
      "reason": "Brief explanation of why this wizard is recommended (1-2 sentences)",
      "specificFocus": "Specific question or area to explore in this wizard"
    }
  ],
  "synthesis": "A 2-3 sentence synthesis of the session and the therapeutic direction suggested",
  "caution": "Optional: Any important considerations or cautions for the user (1-2 sentences)"
}

Guidelines:
- Provide 2-4 recommendations, ordered by confidence (highest first)
- Confidence should reflect how well the wizard matches the user's current needs
- Be specific in the "specificFocus" - give the user a concrete starting point
- Consider the natural flow between modalities (e.g., 3-2-1 → IFS for integration, Memory Recon → Eight Zones for broader patterns)
- If the user might benefit from continuing with the same wizard, include it as an option
- Include "caution" only if there are genuine concerns (e.g., highly activated state, need for professional support)
- Be warm but professional - this is therapeutic work

Return ONLY the JSON object, no additional text.`;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({
      success: false,
      error: 'Method not allowed',
      analysis: null
    } as SuggestNextStepResponse);
    return;
  }

  try {
    console.log('[Suggest Next Step] Received request');

    const { sessionSummary, wizardType, threadContext } = req.body as SuggestNextStepRequest;

    if (!sessionSummary || !wizardType) {
      console.error('[Suggest Next Step] Missing required fields');
      res.status(400).json({
        success: false,
        error: 'Missing required fields: sessionSummary, wizardType',
        analysis: null
      } as SuggestNextStepResponse);
      return;
    }

    console.log(`[Suggest Next Step] Analyzing ${wizardType} session`);

    // Build context
    let contextText = `Just completed wizard: ${wizardType}\n\nSession summary:\n${sessionSummary}`;

    if (threadContext && threadContext.length > 0) {
      contextText += `\n\nPrevious sessions in this therapeutic journey:\n${threadContext.join('\n')}`;
    }

    // Call OpenRouter API
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is not set');
    }

    console.log('[Suggest Next Step] Calling OpenRouter API...');

    const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://auraos.app',
        'X-Title': 'Aura OS - Integral Life Practice',
      },
      body: JSON.stringify({
        model: 'minimax/minimax-m2',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: contextText,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' }, // Request JSON mode
      }),
    });

    if (!openrouterResponse.ok) {
      const errorData = await openrouterResponse.json();
      throw new Error(`OpenRouter API error: ${errorData.error?.message || openrouterResponse.statusText}`);
    }

    const data = await openrouterResponse.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in OpenRouter response');
    }

    console.log('[Suggest Next Step] Received response, parsing JSON...');

    // Parse the JSON response
    let analysis: AnalysisResult;
    try {
      analysis = JSON.parse(content);

      // Validate the structure
      if (!analysis.recommendations || !Array.isArray(analysis.recommendations)) {
        throw new Error('Invalid response structure: missing recommendations array');
      }

      if (!analysis.synthesis) {
        throw new Error('Invalid response structure: missing synthesis');
      }

      // Validate each recommendation
      for (const rec of analysis.recommendations) {
        if (!rec.wizard || !rec.confidence || !rec.reason || !rec.specificFocus) {
          throw new Error('Invalid recommendation structure');
        }
      }

      console.log(`[Suggest Next Step] Successfully generated ${analysis.recommendations.length} recommendations`);
    } catch (parseError) {
      console.error('[Suggest Next Step] Failed to parse AI response:', content);
      throw new Error(`Failed to parse AI response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }

    // Return success response
    const response: SuggestNextStepResponse = {
      success: true,
      analysis,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('[Suggest Next Step] Error:', error);

    const response: SuggestNextStepResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      analysis: null as any, // Type assertion for error case
    };

    res.status(500).json(response);
  }
}
