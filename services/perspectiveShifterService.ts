
import { GoogleGenAI } from "@google/genai";
import OpenAI from 'openai';
import { executeWithFallback } from '../utils/modelFallback';
import { Perspective } from '../types.ts';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// Initialize OpenRouter client for fallback
let openRouter: OpenAI | null = null;

function getOpenRouterClient(): OpenAI {
  if (!openRouter) {
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      throw new Error('OPENROUTER_API_KEY is not set. Please configure your API key.');
    }
    openRouter = new OpenAI({
      apiKey: openRouterKey,
      baseURL: 'https://openrouter.ai/api/v1',
      dangerouslyAllowBrowser: true,
    });
  }
  return openRouter;
}

async function callOpenRouterFallback(prompt: string, maxTokens: number = 2000): Promise<string> {
  try {
    const response = await getOpenRouterClient().chat.completions.create({
      model: 'openai/gpt-oss-120b:exacto',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: maxTokens,
      provider: { quantizations: ['bf16'] }
    });
    return response.choices[0]?.message?.content || '';
  } catch (error) {
    throw new Error(`OpenRouter fallback failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate a reflective summary for a specific perspective
 * Helps users deepen their understanding of that viewpoint
 */
export async function generatePerspectiveReflection(
  situation: string,
  perspectiveType: string,
  userDescription: string
): Promise<string> {
  const prompt = `A user is exploring "${perspectiveType}" in a stuck situation.

SITUATION: "${situation}"

THEIR DESCRIPTION OF THIS PERSPECTIVE: "${userDescription}"

Generate a brief, empathetic reflection (1-2 sentences) that:
1. Acknowledges what's valid or true in their perspective
2. Asks a deeper question or offers a reframe that helps them see it more fully

Be warm and non-judgmental. Help them go deeper. Return only the reflection as a string.`;

  const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
  return response.text;
}

/**
 * Generate a synthesis showing how all four perspectives can be true at once
 * This is the core "aha" moment
 */
export async function synthesizeAllPerspectives(
  situation: string,
  perspectives: Perspective[]
): Promise<string> {
  const perspectiveTexts = perspectives
    .map(p => `${p.type}: ${p.description}`)
    .join('\n\n');

  const prompt = `A user has explored a stuck situation from four perspectives. Help them integrate all viewpoints.

SITUATION: "${situation}"

THE FOUR PERSPECTIVES:
${perspectiveTexts}

Generate a brief integration (3-4 sentences) that shows:
1. How all four perspectives can be true at the same time
2. What becomes visible when you hold them all together
3. The shared humanity or underlying need beneath the surface conflict

This is the core insight moment. Make it simple, wise, and practical. Return only the synthesis as a string.`;

  const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
  return response.text;
}


/**
 * Generate a guided action plan based on the synthesized perspectives
 * This helps users move from insight to concrete action
 */
export async function generateActionPlanFromPerspectives(
  situation: string,
  synthesis: string
): Promise<string> {
  const prompt = `Based on this stuck situation and the synthesis of all perspectives, generate a concrete action plan.

SITUATION: "${situation}"

SYNTHESIS: "${synthesis}"

Create a clear, actionable communication or approach that:
1. Honors all perspectives (what you learned from each viewpoint)
2. Expresses the user's needs clearly (from their authentic perspective)
3. Shows understanding of the other person's perspective
4. Proposes a specific next step or conversation

Format as a direct statement the user could make or action they could take. Make it practical and emotionally grounded, not abstract.

Write 3-4 sentences that they could actually say or do. Return only the action plan as a string.`;

  const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
  return response.text;
}
