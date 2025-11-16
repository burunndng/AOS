import { GoogleGenAI, Type } from "@google/genai";
import OpenAI from 'openai';
import { executeWithFallback } from '../utils/modelFallback';
import { SomaticPacing, ValidationResult, ValidationWarning, WarningType, SomaticPracticeType } from "../types.ts";
import { PRACTICE_TYPES } from "../constants.ts";

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

interface SomaticScriptSegment {
    instruction: string;
    duration_seconds: number;
}

export interface SomaticScript {
    title: string;
    total_duration_minutes: number;
    script: SomaticScriptSegment[];
    safety_notes?: string[]; // AI-generated safety considerations
}

const PROBLEMATIC_PHRASES: { pattern: RegExp; type: WarningType; issue: string; suggestion: string; }[] = [
    { pattern: /massage.*vagus nerve/i, type: 'Misleading claim', issue: 'Misleading anatomical claim regarding vagus nerve', suggestion: 'Use "may influence vagal tone through slow breathing" or "stimulate the vagal nerve indirectly"' },
    { pattern: /release.*trauma/i, type: 'Overpromising effect', issue: 'Overpromising therapeutic effect for trauma', suggestion: 'Avoid claiming to release trauma; instead, use "may support emotional processing" or "create a sense of safety"' },
    { pattern: /\btoxins?\b/i, type: 'Pseudoscientific language', issue: 'Pseudoscientific language regarding toxins', suggestion: 'Remove references to toxins; focus on observable physiological processes' },
    { pattern: /cure|heal|fix/i, type: 'Medical claim', issue: 'Medical claims', suggestion: 'Use "support," "promote," or "may help with" instead of medical claims' },
    { pattern: /always|guaranteed|definitely/i, type: 'Overgeneralization', issue: 'Overgeneralization', suggestion: 'Acknowledge individual variation; use "you may notice" or "some people experience"' },
    { pattern: /energy block/i, type: 'Unverified construct', issue: 'Unverified construct of energy blocks', suggestion: 'Use observable sensations like "tension," "restriction," or "stagnation" instead of "energy block"' },
    { pattern: /vagal tone/i, type: 'Misleading claim', issue: 'Directly "toning" the vagal nerve through simple exercises is an oversimplification', suggestion: 'Rephrase to "may support the regulation of vagal tone" or "promote a sense of calm associated with vagal activation" for accuracy.' },
    { pattern: /chakras|meridians|aura/i, type: 'Unverified construct', issue: 'References to unverified constructs in scientific context', suggestion: 'While valid in specific traditions, avoid these terms in a general scientific/somatic context unless explicitly requested by user in prompt.' },
    { pattern: /flush.*lymph/i, type: 'Misleading claim', issue: 'Misleading claim about direct lymphatic flushing', suggestion: 'Use "may support lymphatic flow" or "promote circulation" instead.' },
    { pattern: /strengthen.*immune system/i, type: 'Overpromising effect', issue: 'Overpromising immune system strengthening', suggestion: 'Use "may support immune function" or "promote overall well-being that benefits immunity."'},
];

/**
 * Validates the generated practice content for scientific accuracy and safe language.
 */
export function validatePracticeContent(scriptText: string): ValidationResult {
    const warnings: ValidationWarning[] = [];
    
    PROBLEMATIC_PHRASES.forEach(phrase => {
        if (phrase.pattern.test(scriptText)) {
            warnings.push({
                type: phrase.type,
                issue: phrase.issue,
                suggestion: phrase.suggestion
            });
        }
    });

    return {
        isValid: warnings.length === 0,
        warnings
    };
}


export async function generateSomaticScript(
    intention: string,
    practiceType: SomaticPracticeType, // Changed from 'style'
    duration: number, // in minutes
    focusArea: string, // e.g., "shoulders and neck", "lower back", "whole body"
    pacing: SomaticPacing // e.g., "slow", "moderate", "dynamic", "fluid"
): Promise<SomaticScript> {
    const typeInfo = PRACTICE_TYPES.find(pt => pt.name === practiceType)!;

    const prompt = `
    You are an AI expert in embodied practices, human biomechanics, and AI robotics. Your role is to actively guide a user through a somatic practice.
    You have a deep understanding of human kinematics, spatial awareness, and the subtle energetic flows of various somatic practices.

    Generate a complete, ready-to-follow script, broken down into timed segments, for a "${practiceType}" somatic practice.

    **PRACTICE TYPE DEFINITION & GUIDANCE:**
    - **Practice Type:** "${typeInfo.name}"
    - **Description:** "${typeInfo.description}"
    - **Primary Mechanism:** "${typeInfo.primaryMechanism}"
    - **Best For:** ${typeInfo.bestFor.join(', ')}
    - **Example Techniques to Draw From:** ${typeInfo.exampleTechniques.join(', ')}
    - **Contraindications to Avoid Aggravating:** ${typeInfo.contraindications?.join('; ') || 'None specific. If mentioned, explicitly instruct to avoid movements that might aggravate these.'}

    **SCIENTIFIC ACCURACY REQUIREMENTS (STRICTLY ADHERE):**
    - Use accurate anatomical terminology where appropriate (e.g., "diaphragm," "pelvis," "cervical spine").
    - Avoid metaphysical claims or pseudoscientific language (e.g., "energy blockages," "toxin release," "unblocking chakras").
    - For nervous system effects, use cautious phrasing like "may influence parasympathetic activation," "support nervous system regulation," or "promote a sense of calm" NOT "massage the vagus nerve" or "heal your nervous system."
    - For breathing instructions, refer to observable physiological effects or techniques (e.g., "diaphragmatic breathing," "extended exhales for vagal engagement") rather than making unverified claims.
    - Acknowledge individual variation: "you may notice" or "some people experience" NOT "you will feel" or "you will release."
    - Never claim to "release trauma," "cure" conditions, "fix" problems, or provide medical advice.

    **SAFETY REQUIREMENTS (STRICTLY ADHERE):**
    - Include explicit instructions to: "Stop if you experience any sharp pain or discomfort."
    - Emphasize: "Move gently and within your comfortable range of motion."
    - For breath work: "If you feel dizzy, lightheaded, or anxious, return to your natural breathing rhythm."
    - Avoid forced or extreme movements.

    **LANGUAGE GUIDELINES:**
    - Use supportive and encouraging language.
    - "May promote," "can support," "may help with" NOT "will release," "will fix," "will heal."
    - "Some people notice," "you might feel" NOT "you will experience."
    - Focus on specific, actionable, and observable cues (e.g., "soften your jaw," "lengthen your spine") over vague instructions ("release tension" without context).

    **User's Request for Somatic Practice:**
    - **Intention:** "${intention}"
    - **Total Duration:** ${duration} minutes
    - **Primary Focus Area:** "${focusArea}" (Be highly specific in your instructions for this area, guiding awareness to this region)
    - **Desired Pacing:** "${pacing}" (Ensure movements and transitions precisely match this speed and flow)

    **Your Task:**
    Generate a complete, ready-to-follow script, broken down into timed segments. The total duration of all segments should approximate the user's requested duration.
    Focus on creating a flowing, coherent practice that embodies the requested practice type, intention, focus area, and pacing, while strictly adhering to all scientific accuracy, safety, and language guidelines.
    Also, generate 2-3 brief, general safety notes relevant to somatic practice, but ensure they are *generic* and not specific to any medical condition.

    **Instructions for your guidance:**
    - **Be the Instructor:** Speak directly to the user as if you are guiding them in real-time. Use imperatives and encouraging language.
    - **Spatially Rich Descriptions:** Provide instructions like: "Slowly lift your right arm, allowing your elbow to lead, as if gently pushing a cloud away from your chest. Feel the expansion across your shoulder blade and the subtle stretch along your your rib cage. Your palm softly faces downward, fingers relaxed, as you maintain a soft gaze."
    - **Internal Sensation:** Guide attention to internal feelings, breath coordination, and subtle energetic shifts. "As you exhale, imagine any held tension in your lower back softening, flowing down through your feet and into the earth, promoting a feeling of release."
    - **Body Alignment:** Offer precise cues for posture and alignment. "Ensure your spine remains long and buoyant, as if suspended from above, with your hips rooted and stable below, maintaining a neutral pelvis."
    - **Pacing & Transitions:** Ensure smooth, explicit transitions between movements and clear indications of when to hold or shift, aligning precisely with the requested pacing.

    **Output Format:**
    Return a JSON object with the following structure:
    {
      "title": "string (A fitting, poetic title for the practice, reflecting its intention and practiceType)",
      "total_duration_minutes": number (The requested duration),
      "script": [
        {
          "instruction": "string (The detailed, spatially-aware instruction for this segment)",
          "duration_seconds": number (The duration of this segment in seconds)
        }
      ],
      "safety_notes": ["string (general safety note 1)", "string (general safety note 2)"]
    }

    Return ONLY the JSON object.
    `;
    
    const response = await ai.models.generateContent({
        model: 'gemini-robotics-er-1.5-preview',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    total_duration_minutes: { type: Type.NUMBER },
                    script: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                instruction: { type: Type.STRING },
                                duration_seconds: { type: Type.NUMBER },
                            },
                            required: ['instruction', 'duration_seconds'],
                        },
                    },
                    safety_notes: { // Add safety notes to the schema
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        nullable: true,
                    },
                },
                required: ['title', 'total_duration_minutes', 'script'],
            },
        },
    });

    return JSON.parse(response.text);
}