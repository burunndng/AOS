


// services/geminiService.ts
// FIX: Add `ThreeTwoOneSession` and `CustomPractice` to type imports.
import { GoogleGenAI, Type, Modality, Blob, Content } from "@google/genai";
import { Practice, IdentifiedBias, Perspective, AqalReportData, ThreeTwoOneSession, CustomPractice, ModuleKey, IntegratedInsight, KeganResponse, KeganStage, KeganDomain, KeganAssessmentSession, KeganProbeExchange, RelationshipContext, RelationshipType } from '../types.ts';
import { practices as corePractaces } from '../constants.ts';
import { AttachmentStyle, getRecommendedPracticesBySystem } from '../data/attachmentMappings.ts';


// Initialize the Google AI client
// FIX: Initialize GoogleGenAI with apiKey from environment variables as per guidelines.
// Make initialization lazy to handle missing API keys gracefully
let ai: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!ai) {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'undefined') {
      throw new Error('Gemini API key not configured. Please set GEMINI_API_KEY environment variable.');
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

// Helper function to generate text
export async function generateText(prompt: string): Promise<string> {
  // FIX: Use the correct API call `ai.models.generateContent` for text generation.
  const client = getAIClient();
  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: prompt,
  });
  // FIX: Access the generated text directly from the `text` property of the response.
  return response.text;
}

// FIX: Added missing `explainPractice` function called from `App.tsx`.
export async function explainPractice(practice: Practice): Promise<string> {
    const prompt = `Generate a concise explanation of the practice "${practice.name}" for a beginner, formatted using Markdown for clarity. The explanation should be 2-3 *short* paragraphs, providing very clear, condensed information.

**Paragraph 1: Introduction and Mechanics**
Begin with a brief **History/Origin** of the practice, then describe **What it Involves** in simple terms, outlining the basic actions a beginner would take.

**Paragraph 2: Impact and Validation**
Detail the **Core Benefits** and positive impacts for someone practicing it. Conclude with a mention of its **Research/Sources** or key supporting concepts.

Use the following information as context:
- Practice Name: "${practice.name}"
- Description: "${practice.description}"
- Why it's valuable (Core Benefit): "${practice.why}"
- How to do it (Basic Steps): "${practice.how.join('\n- ')}"
- Evidence/Research: "${practice.evidence}"

Ensure the language is accessible and encouraging for a beginner.
Return ONLY the explanation as a string.`;
    return await generateText(prompt);
}

// FIX: Added missing `populateCustomPractice` function called from `CustomPracticeModal.tsx`.
export async function populateCustomPractice(practiceName: string): Promise<{ description: string; why: string; how: string[]; }> {
    const prompt = `A user wants to create a custom practice called "${practiceName}".
    Generate a concise description, a compelling "why" (the core benefit), and an array of 3-4 simple "how-to" steps.
    Return a JSON object with keys: "description" (string), "why" (string), and "how" (array of strings).
    Return ONLY the JSON object.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    description: { type: Type.STRING },
                    why: { type: Type.STRING },
                    how: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['description', 'why', 'how']
            }
        }
    });

    return JSON.parse(response.text);
}

// FIX: Added missing `getDailyReflection` function called from `TrackerTab.tsx`.
export async function getDailyReflection(notes: { practiceName: string; note: string; }[]): Promise<string> {
    const context = notes.map(n => `- ${n.practiceName}: "${n.note}"`).join('\n');
    const prompt = `Based on a user's daily practice notes, generate a short, encouraging 1-2 sentence reflection.
    Look for themes or connections.
    Notes:
    ${context}
    
    Return only the reflection as a string.`;
    return await generateText(prompt);
}

// FIX: Added missing `summarizeThreeTwoOneSession` function called from `ThreeTwoOneWizard.tsx`.
export async function summarizeThreeTwoOneSession(session: ThreeTwoOneSession): Promise<string> {
    const prompt = `Summarize this 3-2-1 shadow work session in 2-3 sentences.
    Focus on the core pattern and the key insight from the integration step.
    - Trigger: ${session.trigger}
    - Description (Face It): ${session.triggerDescription}
    - Embodiment (Be It): ${session.embodiment}
    - Integration: ${session.integration}
    
    Return only the summary as a string.`;
    return await generateText(prompt);
}

// Function used in Coach.tsx and ThreeTwoOneWizard.tsx
export const getCoachResponse = generateText;

// Function for PracticeCustomizationModal.tsx
export async function getPersonalizedHowTo(practice: Practice, userAnswer: string): Promise<string[]> {
    const prompt = `A user wants to personalize the practice "${practice.name}".
    Original "how-to" steps:
    - ${practice.how.join('\n- ')}
    
    The customization question was: "${practice.customizationQuestion}"
    The user's answer is: "${userAnswer}"
    
    Based on their answer, generate a new, personalized list of 3-5 "how-to" steps.
    Each step should be actionable and concise.
    Return ONLY the steps, each on a new line. Do not include numbering or bullet points.`;

    const response = await generateText(prompt);
    return response.split('\n').filter(line => line.trim() !== '');
}

// Function for GuidedPracticeGenerator.tsx (Script)
export async function generatePracticeScript(userPrompt: string): Promise<{ title: string, script: string }> {
    const prompt = `Generate a guided practice script based on this user request: "${userPrompt}".
    The output should be a JSON object with two keys: "title" (a creative and fitting title for the practice) and "script" (the full text of the guided meditation script, around 300-500 words).
    The script should be gentle, guiding, and paced appropriately for a spoken meditation. Include pauses where appropriate, indicated by "(...)"
    
    Example output format:
    {
      "title": "Finding Your Calm Center",
      "script": "Begin by finding a comfortable position. (...) Gently close your eyes. (...)"
    }
    
    Return ONLY the JSON object.`;

    // FIX: Use `gemini-2.5-flash-lite` for complex JSON generation and define the response schema correctly.
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    script: { type: Type.STRING }
                },
                required: ['title', 'script']
            }
        }
    });

    return JSON.parse(response.text);
}

// Function for GuidedPracticeGenerator.tsx (Speech)
export async function generateSpeechFromText(text: string, voiceName: string = 'Kore'): Promise<string> {
    // FIX: Use the correct model and configuration for text-to-speech generation.
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName },
                },
            },
        },
    });
    // FIX: Correctly access the base64 audio data from the response.
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("Failed to generate audio from the provided text.");
    }
    return base64Audio;
}


// Functions for SubjectObjectWizard.tsx
export async function articulateSubjectTo(pattern: string, feelings: string): Promise<string> {
    const prompt = `A user is exploring an unconscious pattern.
    - Pattern: "${pattern}"
    - Feelings/beliefs when in it: "${feelings}"
    
    Based on this, articulate the core belief they are "subject to" in a concise "I am..." or "The world is..." statement.
    Return ONLY the statement as a string.`;
    return await generateText(prompt);
}

export async function suggestSubjectObjectExperiments(pattern: string, subjectToStatement: string, costs: string[]): Promise<string[]> {
    const prompt = `A user is working on making a pattern object.
    - Pattern: "${pattern}"
    - Subject to: "${subjectToStatement}"
    - Costs: "${costs.join(', ')}"

    Suggest 3 small, safe, actionable experiments they could try for one week to gently challenge this pattern. Frame them as questions or simple actions.
    Return a JSON array of strings.
    Example: ["For one day, what if you acted as if the opposite were true?", "Notice the physical sensation just before the pattern starts."]
    Return ONLY the JSON array.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            }
        }
    });
    return JSON.parse(response.text);
}

// FIX: Add new function to provide AI suggestions for tracing the origin of a pattern.
export async function exploreOrigin(pattern: string, subjectToStatement: string): Promise<string> {
    const prompt = `A user is exploring the origin of an unconscious pattern.
    - Their pattern: "${pattern}"
    - The core belief they are subject to: "${subjectToStatement}"

    Suggest a likely origin for this belief in 2-3 probing sentences. Frame it as a gentle hypothesis, possibly relating to childhood experiences, family dynamics, or a key past event.
    The goal is to jog their memory, not to state a definitive fact.
    Example: "This belief often forms in environments where expressing needs was seen as demanding. Does that resonate with any part of your past?"

    Return ONLY the suggested origin as a string.`;
    return await generateText(prompt);
}

// FIX: Add new function to synthesize user input and generate a final integration insight.
export async function generateIntegrationInsight(pattern: string, subjectToStatement: string, cost: string, experiment: string): Promise<string> {
    const prompt = `A user has completed a Subject-Object exploration and is ready for integration.
    - Pattern: "${pattern}"
    - Subject To: "${subjectToStatement}"
    - Cost of Pattern: "${cost}"
    - Their Chosen Experiment: "${experiment}"

    Synthesize this information and generate a powerful, concise (2-3 sentences) integration insight. Articulate the shift from the old belief to a new, more empowering one.
    Example: "By seeing that you are not your defensiveness, but the one who can compassionately observe it, you can shift from a need to be 'right' to a desire to 'connect'."

    Return ONLY the insight as a string.`;
    return await generateText(prompt);
}


// Functions for IFSWizard.tsx
export async function extractPartInfo(transcript: string): Promise<{ role: string, fears: string, positiveIntent: string }> {
    const prompt = `Analyze this IFS session transcript to identify the part's role, fears, and positive intent.
    Transcript:
    ---
    ${transcript}
    ---
    Return a JSON object with three keys: "role" (e.g., "Protector," "Critic"), "fears" (what it's afraid of), and "positiveIntent" (what it's trying to achieve for the user).
    Be concise.
    Return ONLY the JSON object.`;
     const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    role: { type: Type.STRING },
                    fears: { type: Type.STRING },
                    positiveIntent: { type: Type.STRING },
                },
                required: ['role', 'fears', 'positiveIntent']
            }
        }
    });
    return JSON.parse(response.text);
}

export async function summarizeIFSSession(transcript: string, partInfo: { role: string, fears: string, positiveIntent: string }): Promise<{ summary: string, aiIndications: string[] }> {
    const prompt = `Analyze this IFS session transcript and part info.
    Part Info:
    - Role: ${partInfo.role}
    - Fears: ${partInfo.fears}
    - Positive Intent: ${partInfo.positiveIntent}

    Transcript:
    ---
    ${transcript}
    ---
    Provide a 2-3 sentence summary of the session. Then, provide 2-3 "AI Indications" - potential themes, connections to other parts, or areas for future exploration.
    Return a JSON object with keys: "summary" (string) and "aiIndications" (array of strings).
    Return ONLY the JSON object.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    summary: { type: Type.STRING },
                    aiIndications: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['summary', 'aiIndications']
            }
        }
    });
    return JSON.parse(response.text);
}

// Function for RecommendationsTab.tsx
export async function generateRecommendations(context: string): Promise<string[]> {
    const prompt = `Based on the user's current ILP context, provide 3 actionable recommendations.
    Context:
    ---
    ${context}
    ---
    Recommendations should be specific and encouraging. They could suggest adding a new practice, modifying an existing one, or using a mind/shadow tool.
    Return a JSON array of strings.
    Example: ["You're doing great with Body practices. Consider adding 'Daily Meditation' to bring in the Spirit module.", "Your notes mention feeling overwhelmed. The '3-2-1 Process' could help you work with that feeling."]
    Return ONLY the JSON array.`;
     const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            }
        }
    });
    return JSON.parse(response.text);
}

// Function for AqalTab.tsx
export async function generateAqalReport(context: string): Promise<AqalReportData> {
     const prompt = `Analyze the user's ILP context through the AQAL (All Quadrants, All Levels) lens.
    Context:
    ---
    ${context}
    ---
    Provide an AQAL report.
    - summary: A 2-3 sentence overview of their practice's balance.
    - quadrantInsights: An object with keys I, It, We, Its. For each, provide a 1-2 sentence insight on how their practice addresses that quadrant.
    - recommendations: An array of 2-3 strings with specific suggestions to create a more balanced, integral practice.

    Return a JSON object matching this structure.
    Return ONLY the JSON object.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    summary: { type: Type.STRING },
                    quadrantInsights: {
                        type: Type.OBJECT,
                        properties: {
                            I: { type: Type.STRING },
                            It: { type: Type.STRING },
                            We: { type: Type.STRING },
                            Its: { type: Type.STRING },
                        },
                        required: ['I', 'It', 'We', 'Its']
                    },
                    recommendations: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                },
                required: ['summary', 'quadrantInsights', 'recommendations']
            }
        }
    });

    return JSON.parse(response.text);
}

// --- Functions for CustomPracticeModal ---

export async function generatePracticeResearch(goal: string): Promise<{ why: string, evidence: string, roi: 'HIGH' | 'VERY HIGH' | 'EXTREME' }> {
    const prompt = `A user is creating a custom practice for the goal: "${goal}".
    Act as a health and performance researcher. Generate a compelling "why" (the core benefit), plausible "evidence" (citing key concepts or researchers), and an estimated "roi" (Return on Investment).
    Return a JSON object with keys: "why" (string), "evidence" (string), and "roi" ('HIGH', 'VERY HIGH', or 'EXTREME').
    Return ONLY the JSON object.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    why: { type: Type.STRING },
                    evidence: { type: Type.STRING },
                    roi: { type: Type.STRING, enum: ['HIGH', 'VERY HIGH', 'EXTREME'] }
                },
                required: ['why', 'evidence', 'roi']
            }
        }
    });
    return JSON.parse(response.text);
}

export async function generatePracticeStructure(goal: string, why: string, timePerWeek: number): Promise<{ name: string, description: string, howSteps: string[], difficulty: 'Low' | 'Medium' | 'High', affectsSystem: string[] }> {
    const prompt = `A user is creating a custom practice.
    - Goal: "${goal}"
    - Why it's valuable: "${why}"
    - Time commitment: ${timePerWeek} hours/week.
    
    Act as a practice designer. Generate a fitting "name", a concise "description" (1 sentence), an array of 3-5 actionable "howSteps", a "difficulty" ('Low', 'Medium', or 'High'), and an array of 3-4 "affectsSystem" (body/mind systems it impacts).
    Return a JSON object with these keys.
    Return ONLY the JSON object.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    howSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
                    difficulty: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
                    affectsSystem: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['name', 'description', 'howSteps', 'difficulty', 'affectsSystem']
            }
        }
    });
    return JSON.parse(response.text);
}

export async function generateShadowPatternInsights(pattern: string): Promise<{ origin: string, framework: string }> {
    const prompt = `A user is creating a shadow work practice for the pattern: "${pattern}".
    Act as a depth psychologist. Suggest a likely "origin" for this pattern (e.g., childhood dynamics, formative experiences) and a relevant psychological "framework" for understanding it (e.g., IFS, Attachment Theory, Jungian archetypes).
    Return a JSON object with keys: "origin" (string) and "framework" (string).
    Return ONLY the JSON object.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    origin: { type: Type.STRING },
                    framework: { type: Type.STRING }
                },
                required: ['origin', 'framework']
            }
        }
    });
    return JSON.parse(response.text);
}

export async function generateShadowWorkStructure(pattern: string, origin: string): Promise<{ name: string, description: string, inquiryQuestions: string[], affectsSystem: string[] }> {
    const prompt = `A user is creating a shadow work practice.
    - Pattern: "${pattern}"
    - Likely Origin: "${origin}"
    
    Design a practice structure. Generate a creative "name", a concise "description", an array of 3-4 deep "inquiryQuestions" (instead of steps), and an array of psychological "affectsSystem" it impacts (e.g., 'reactivity', 'self-awareness').
    Return a JSON object with these keys.
    Return ONLY the JSON object.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    inquiryQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
                    affectsSystem: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['name', 'description', 'inquiryQuestions', 'affectsSystem']
            }
        }
    });
    return JSON.parse(response.text);
}

export async function generateSpiritualContext(aspiration: string): Promise<{ tradition: string, teachings: string }> {
    const prompt = `A user wants to create a spiritual practice for the aspiration: "${aspiration}".
    Act as a comparative spirituality expert. Identify the primary contemplative "tradition" this aspiration draws from (e.g., Zen Buddhism, Sufism) and summarize the key "teachings" or principles related to it.
    Return a JSON object with keys: "tradition" (string) and "teachings" (string).
    Return ONLY the JSON object.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    tradition: { type: Type.STRING },
                    teachings: { type: Type.STRING }
                },
                required: ['tradition', 'teachings']
            }
        }
    });
    return JSON.parse(response.text);
}

export async function generateSpiritualPracticeStructure(aspiration: string, tradition: string): Promise<{ name: string, description: string, stages: string[], consciousnessAspects: string[] }> {
    const prompt = `A user is creating a spiritual practice.
    - Aspiration: "${aspiration}"
    - Tradition: "${tradition}"
    
    Design a contemplative practice structure. Generate a fitting "name", a poetic "description", an array of 3-4 "stages" or movements for the practice, and an array of "consciousnessAspects" it cultivates (e.g., 'presence', 'non-duality').
    Return a JSON object with these keys.
    Return ONLY the JSON object.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    stages: { type: Type.ARRAY, items: { type: Type.STRING } },
                    consciousnessAspects: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['name', 'description', 'stages', 'consciousnessAspects']
            }
        }
    });
    return JSON.parse(response.text);
}

export async function refinePractice(name: string, description: string, why: string, howSteps: string[], timePerWeek: number, module: ModuleKey): Promise<string[]> {
    const prompt = `A user has drafted a custom practice for the "${module}" module.
    - Name: ${name}
    - Description: ${description}
    - Why: ${why}
    - Steps/Questions: ${howSteps.join('; ')}
    - Time: ${timePerWeek}h/week
    
    Act as a practice design coach. Provide an array of 3 short, actionable suggestions to refine or improve this practice. Focus on clarity, safety, or deepening the impact.
    Return a JSON array of strings.
    Return ONLY the JSON array.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            }
        }
    });
    return JSON.parse(response.text);
}

/**
 * Detects patterns from a Mind tool session and suggests relevant Shadow work practices.
 * @param mindToolType The type of Mind tool used (e.g., 'BiasDetective').
 * @param mindToolSessionId The ID of the completed Mind tool session.
 * @param mindToolSessionReport A full markdown report of the Mind tool session's key findings.
 * @param availableShadowPractices The list of available shadow practices.
 * @returns An IntegratedInsight object with detected patterns and suggested shadow work, or null if no suggestions.
 */
export async function detectPatternsAndSuggestShadowWork(
  mindToolType: IntegratedInsight['mindToolType'],
  mindToolSessionId: string,
  mindToolSessionReport: string,
  availableShadowPractices: Practice[]
): Promise<IntegratedInsight | null> {
  const shadowPracticeList = availableShadowPractices
    .map(p => `- ID: ${p.id}, Name: ${p.name}, Description: ${p.description}`)
    .join('\n');

  const prompt = `
    As an Integral Coach specializing in shadow work integration, analyze the following report from a user's "${mindToolType}" session.

    **Mind Tool Session Report:**
    "${mindToolSessionReport}"

    **Your Task:**
    1.  **Generate Short Summary:** Create a very concise, one-sentence summary of the session report. This should capture the essence of the user's work.
    2.  **Identify Core Patterns:** Based on the full report, articulate 1-2 core underlying psychological patterns, beliefs, or emotional drivers that seem to be operating for the user. These should be framed in terms of potential shadow material (e.g., a disowned quality, a reactive pattern, a limiting belief).
    3.  **Suggest Shadow Work:** From the provided list of available shadow work practices, recommend 1-3 highly relevant practices that could help the user deepen their insight and work with the detected pattern. **Crucially, for 'practiceId', you MUST use one of the exact IDs provided in the list below.**
    4.  **Provide Rationale:** For each suggested practice, briefly explain (1-2 sentences) *why* it is relevant and *how* it would help address the detected pattern.

    **Available Shadow Work Practices (choose relevant IDs only):**
    ${shadowPracticeList}

    **Output Format:**
    Return a JSON object with the following structure. If no clear shadow-related pattern is detected, return 'null'.

    {
      "shortSummary": "string (a concise one-sentence summary of the session)",
      "detectedPattern": "string (1-2 sentences describing the core shadow-related pattern)",
      "suggestedShadowWork": [
        {
          "practiceId": "MUST be one of the IDs from the 'Available Shadow Work Practices' list (e.g., 'three-two-one' or 'parts-dialogue')",
          "practiceName": "string (use the 'Name' from the list for the corresponding practiceId)",
          "rationale": "string (1-2 sentences explaining relevance)"
        }
      ]
    }
    Return ONLY the JSON object or 'null'.
    `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          nullable: true,
          properties: {
            shortSummary: { type: Type.STRING },
            detectedPattern: { type: Type.STRING },
            suggestedShadowWork: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  practiceId: { type: Type.STRING },
                  practiceName: { type: Type.STRING },
                  rationale: { type: Type.STRING },
                },
                required: ['practiceId', 'practiceName', 'rationale'],
              },
            },
          },
          required: ['shortSummary', 'detectedPattern', 'suggestedShadowWork'],
        },
      },
    });

    const result = JSON.parse(response.text);

    if (!result || !result.detectedPattern || !result.shortSummary || !Array.isArray(result.suggestedShadowWork)) {
        return null;
    }

    const validSuggestions = result.suggestedShadowWork
      .map((s: any) => {
        const normalizedPracticeId = s.practiceId?.toLowerCase().trim();
        const foundPractice = availableShadowPractices.find(p => p.id === normalizedPracticeId);
        if (foundPractice) {
          return {
            practiceId: foundPractice.id,
            practiceName: foundPractice.name,
            rationale: s.rationale,
          };
        }
        return null;
      })
      .filter(Boolean);

    if (validSuggestions.length === 0) return null;

    return {
      id: `integrated-insight-${Date.now()}`,
      mindToolType,
      mindToolSessionId,
      mindToolName: `${mindToolType} session on "${result.shortSummary.substring(0, 50)}${result.shortSummary.length > 50 ? '...' : ''}"`,
      mindToolReport: mindToolSessionReport,
      mindToolShortSummary: result.shortSummary,
      detectedPattern: result.detectedPattern,
      suggestedShadowWork: validSuggestions as IntegratedInsight['suggestedShadowWork'],
      dateCreated: new Date().toISOString(),
      status: 'pending',
    };
  } catch (error) {
    console.error("Error in detectPatternsAndSuggestShadowWork:", error);
    return null;
  }
}

// Kegan Developmental Stage Assessment Analysis
export async function analyzeKeganStage(responses: KeganResponse[]): Promise<{
  centerOfGravity: KeganStage;
  confidence: 'Low' | 'Medium' | 'High';
  domainVariation: Record<KeganDomain, KeganStage>;
  developmentalEdge: string;
  recommendations: string[];
  fullAnalysis: string;
}> {
  const responsesContext = responses.map(r =>
    `Domain: ${r.domain}\nResponse: ${r.response}`
  ).join('\n\n---\n\n');

  const prompt = `You are a developmental psychologist trained in Robert Kegan's constructive-developmental theory. Analyze these responses from a self-assessment based on Kegan's framework.

# Kegan's Framework Overview

**Socialized Mind (Stage 3):**
- Subject to: relationships, others' expectations, mutually-reciprocal role consciousness
- Object: impulses, needs, perceptions
- Key marker: Cannot step outside relationships to examine them. Identity IS relationships. External validation defines worth.

**Self-Authoring Mind (Stage 4):**
- Subject to: own ideology, internal system, identity, self-authorship
- Object: relationships, expectations, social roles
- Key marker: Has internal compass, can examine relationships objectively, self-governed, but cannot see own ideology as partial.

**Self-Transforming Mind (Stage 5):**
- Subject to: dialectical process, inter-penetration of systems
- Object: ideology, identity, authorship
- Key marker: Can step back from own ideology, holds contradictions, sees all systems as partial, comfort with paradox.

**Transitional Stages:**
- People are often between stages (3/4 or 4/5), showing elements of both.

# Assessment Responses

${responsesContext}

# Your Task

Analyze these responses for:
1. What is SUBJECT (embedded in, cannot see) vs OBJECT (can observe, reflect on)
2. How meaning is being made
3. Center of gravity (most consistent stage)
4. Domain variation (different stages in different areas)
5. Developmental edge (where they're growing)

Return a JSON object with this exact structure:
{
  "centerOfGravity": "Socialized Mind" | "Socialized/Self-Authoring Transition" | "Self-Authoring Mind" | "Self-Authoring/Self-Transforming Transition" | "Self-Transforming Mind",
  "confidence": "Low" | "Medium" | "High",
  "domainVariation": {
    "Relationships": [stage],
    "Work & Purpose": [stage],
    "Values & Beliefs": [stage],
    "Conflict & Feedback": [stage],
    "Identity & Self": [stage]
  },
  "fullAnalysis": "A comprehensive 4-6 paragraph analysis explaining:\n- What you notice about subject-object structure\n- Key indicators in their responses\n- Patterns across domains\n- Where they show consistency and variation\n- Evidence for the center of gravity assessment",
  "developmentalEdge": "2-3 sentences describing where this person appears to be growing and what might support that growth",
  "recommendations": [
    "Specific practice recommendation 1 (e.g., 'Work with the Subject-Object Explorer on [specific pattern]')",
    "Specific practice recommendation 2 (e.g., 'Engage shadow work around [specific theme]')",
    "Specific practice recommendation 3 (e.g., 'Read [book] or work with [type of practitioner]')",
    "Specific practice recommendation 4"
  ]
}

Important:
- Be nuanced. Most people are in transition.
- Look for what they CAN'T see, not just what they say.
- Later stages aren't "better" - be descriptive, not prescriptive.
- Base assessment on actual response content, not assumptions.
- If responses show inconsistency, note lower confidence.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            centerOfGravity: { type: Type.STRING },
            confidence: { type: Type.STRING },
            domainVariation: {
              type: Type.OBJECT,
              properties: {
                'Relationships': { type: Type.STRING },
                'Work & Purpose': { type: Type.STRING },
                'Values & Beliefs': { type: Type.STRING },
                'Conflict & Feedback': { type: Type.STRING },
                'Identity & Self': { type: Type.STRING }
              }
            },
            fullAnalysis: { type: Type.STRING },
            developmentalEdge: { type: Type.STRING },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['centerOfGravity', 'confidence', 'domainVariation', 'fullAnalysis', 'developmentalEdge', 'recommendations']
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error('Error analyzing Kegan stage:', error);
    // Fallback
    return {
      centerOfGravity: 'Self-Authoring Mind',
      confidence: 'Low',
      domainVariation: {
        'Relationships': 'Self-Authoring Mind',
        'Work & Purpose': 'Self-Authoring Mind',
        'Values & Beliefs': 'Self-Authoring Mind',
        'Conflict & Feedback': 'Self-Authoring Mind',
        'Identity & Self': 'Self-Authoring Mind'
      },
      fullAnalysis: 'Analysis could not be completed. Please try again.',
      developmentalEdge: 'Unable to determine at this time.',
      recommendations: [
        'Retake the assessment with more detailed responses',
        'Work with the Subject-Object Explorer tool',
        'Consider working with a developmental coach or therapist',
        'Read "Immunity to Change" by Kegan & Lahey'
      ]
    };
  }
}

// Kegan Post-Dialogue Probe Generation Functions

/**
 * Generate a probe that explores contradictions and nuances in the assessment responses
 */
export async function generateContradictionProbe(
  assessmentSession: KeganAssessmentSession
): Promise<string> {
  const responsesContext = assessmentSession.responses.map(r =>
    `Domain: ${r.domain}\nResponse: ${r.response}`
  ).join('\n\n---\n\n');

  const analysisContext = assessmentSession.overallInterpretation
    ? `Center of Gravity: ${assessmentSession.overallInterpretation.centerOfGravity}\n` +
      `Domain Variation: ${JSON.stringify(assessmentSession.overallInterpretation.domainVariation)}\n` +
      `Analysis: ${assessmentSession.overallInterpretation.fullAnalysis}`
    : '';

  const prompt = `You are a skilled developmental interviewer trained in the Subject-Object Interview method. Your role is to probe for contradictions and nuances to reveal the boundaries of someone's meaning-making system.

# Assessment Context

${responsesContext}

# Current Analysis

${analysisContext}

# Your Task

Examine the responses for areas where values, self-perceptions, or commitments might clash or create internal tension. Generate ONE specific, scenario-based question that:

1. Identifies a potential contradiction between two responses or values
2. Creates a specific, high-stakes scenario where this tension becomes impossible to ignore
3. Asks them to resolve the tension and reveal what is ACTUALLY at stake internally
4. Uses the format: "In one response you described X. In another, you described Y. Let's explore that edge. Imagine [specific high-stakes scenario]. What is *actually* at stake for you in that moment? Walk me through the internal conflict."

Requirements:
- Be specific and personal (reference their actual words)
- Make the scenario realistic and emotionally resonant
- Focus on what they CAN'T see (subject) vs what they CAN see (object)
- The goal is to reveal their current developmental structure, not to judge it

Return ONLY the probe question as plain text, no JSON or markdown formatting.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt
    });

    return response.text.trim();
  } catch (error) {
    console.error('Error generating contradiction probe:', error);
    return "Looking at your responses, I notice some interesting tensions. Can you describe a recent situation where you had to choose between meeting others' expectations and protecting your own well-being? What was actually at stake for you in that moment?";
  }
}

/**
 * Generate a probe that helps make "subject" into "object"
 */
export async function generateSubjectByObjectProbe(
  assessmentSession: KeganAssessmentSession
): Promise<string> {
  const responsesContext = assessmentSession.responses.map(r =>
    `Domain: ${r.domain}\nResponse: ${r.response}`
  ).join('\n\n---\n\n');

  const analysisContext = assessmentSession.overallInterpretation
    ? `Center of Gravity: ${assessmentSession.overallInterpretation.centerOfGravity}\n` +
      `Analysis: ${assessmentSession.overallInterpretation.fullAnalysis}`
    : '';

  const prompt = `You are a skilled developmental interviewer. Your task is to help someone step back from what they are "subject to" (embedded in, fused with) and begin to see it as "object" (something they can observe and reflect on).

# Assessment Context

${responsesContext}

# Current Analysis

${analysisContext}

# Your Task

Identify something the person appears to be "subject to" - embedded in and unable to step back from. This might be:
- An emotional reaction they describe but can't observe
- A belief or value they ARE rather than HAVE
- A role or identity they're fused with
- A defensive pattern they're inside of

Generate ONE specific probe that:
1. Identifies the pattern/reaction/belief they're subject to
2. Invites them to treat it as an object - something separate from themselves
3. Asks them to analyze its purpose, origin, or protective function
4. Uses the metaphor of "a part of you" or similar externalizing language

Format: "You mentioned [specific reaction/pattern]. Let's step back from that reaction. Imagine that [the pattern] is an object—like a [metaphor: guard dog, shield, voice]. What is that [metaphor] trying to protect? What does it believe will happen if it fails to protect you? What is its origin story?"

Requirements:
- Reference their specific words and patterns
- Use externalizing language ("that part of you" not "you")
- Make it feel curious and compassionate, not judgmental
- Aim to create distance between them and the pattern

Return ONLY the probe question as plain text.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt
    });

    return response.text.trim();
  } catch (error) {
    console.error('Error generating subject-object probe:', error);
    return "You mentioned experiencing strong emotional reactions in certain situations. Let's step back from that. Imagine that reactive part of you is like a guard dog inside your mind. What is that guard dog trying to protect? What does it believe will happen if it fails to protect you?";
  }
}

/**
 * Generate a probe that explores the boundaries of "Big Assumptions"
 */
export async function generateAssumptionBoundaryProbe(
  assessmentSession: KeganAssessmentSession
): Promise<string> {
  const responsesContext = assessmentSession.responses.map(r =>
    `Domain: ${r.domain}\nResponse: ${r.response}`
  ).join('\n\n---\n\n');

  const analysisContext = assessmentSession.overallInterpretation
    ? `Center of Gravity: ${assessmentSession.overallInterpretation.centerOfGravity}\n` +
      `Developmental Edge: ${assessmentSession.overallInterpretation.developmentalEdge}\n` +
      `Analysis: ${assessmentSession.overallInterpretation.fullAnalysis}`
    : '';

  const prompt = `You are a skilled developmental interviewer specializing in uncovering "Big Assumptions" - the hidden beliefs that organize someone's current meaning-making system.

# Assessment Context

${responsesContext}

# Current Analysis

${analysisContext}

# Your Task

Identify a potential "Big Assumption" - an unconscious belief that seems to organize their identity, worth, or safety. Common examples:
- "My value comes from being useful/competent/needed"
- "If I'm not in control, everything will fall apart"
- "Conflict means rejection"
- "I must never be a burden"

Generate ONE specific probe that:
1. Names the suspected big assumption clearly
2. Asks them to imagine a world where it's no longer true (through no fault of their own)
3. Explores what would have to be true for them to still feel okay/whole/worthy
4. Reveals what their identity/worth is currently dependent on

Format: "Your responses suggest a deep connection between [domain] and [self-worth/identity]. It sounds like you operate from an assumption that '[the big assumption]'. Let's test that. Imagine for a moment you woke up tomorrow and, through no fault of your own, [the assumption is no longer available - you can't be competent, can't be in control, etc.]. After the initial panic, what would have to be true for you to still feel [okay/worthy/whole]? Where would your value come from then?"

Requirements:
- Be specific about the identified assumption
- Make the scenario feel impossible but important to explore
- The question should reveal the foundation of their current system
- Frame it as a thought experiment, not a threat

Return ONLY the probe question as plain text.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt
    });

    return response.text.trim();
  } catch (error) {
    console.error('Error generating assumption boundary probe:', error);
    return "Your responses suggest a connection between your competence and your sense of worth. Let's test that assumption. Imagine you woke up tomorrow and, through no fault of your own, you simply couldn't solve problems or be useful anymore. After the initial panic, what would have to be true for you to still feel a sense of self-worth? Where would your value come from then?";
  }
}

/**
 * Analyze a user's response to a probe
 */
export async function analyzeProbeResponse(
  probe: KeganProbeExchange,
  assessmentSession: KeganAssessmentSession
): Promise<{
  subjectObjectReveal: string;
  developmentalInsight: string;
  nextProbe?: string;
}> {
  if (!probe.userResponse || probe.userResponse.trim() === '') {
    return {
      subjectObjectReveal: 'No response provided',
      developmentalInsight: 'Unable to analyze without a response',
    };
  }

  const prompt = `You are analyzing a response from a developmental probe in the Kegan framework.

# Probe Type: ${probe.probeType}

# Question Asked:
${probe.question}

# User's Response:
${probe.userResponse}

# Original Assessment Context:
Center of Gravity: ${assessmentSession.overallInterpretation?.centerOfGravity || 'Unknown'}

# Your Task

Analyze this response for:

1. **Subject-Object Structure**: What did this response reveal about what they're subject to (embedded in, can't see) vs object (can observe and reflect on)?

2. **Developmental Insight**: What does their way of answering reveal about their current stage?
   - Did they struggle to answer? (might indicate hitting the edge of their system)
   - Did they quickly resolve the tension with their existing framework? (indicates that framework is subject)
   - Could they step back and examine the assumption/pattern/belief? (indicates it's becoming object)

3. **Next Probe** (optional): If there's a promising edge to explore further with a follow-up question, suggest it.

Return a JSON object:
{
  "subjectObjectReveal": "2-3 sentences about what became visible in terms of subject/object structure",
  "developmentalInsight": "2-3 sentences about what this reveals about their current developmental stage",
  "nextProbe": "Optional follow-up question if there's a promising edge to explore further"
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subjectObjectReveal: { type: Type.STRING },
            developmentalInsight: { type: Type.STRING },
            nextProbe: { type: Type.STRING }
          },
          required: ['subjectObjectReveal', 'developmentalInsight']
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error('Error analyzing probe response:', error);
    return {
      subjectObjectReveal: 'Analysis unavailable at this time.',
      developmentalInsight: 'Please continue with the exploration.',
    };
  }
}

/**
 * Generate integrated insights after all probes are complete
 */
export async function generateProbeIntegratedInsights(
  assessmentSession: KeganAssessmentSession,
  probeSession: { exchanges: KeganProbeExchange[] }
): Promise<{
  confirmedStage: KeganStage;
  refinedAnalysis: string;
  edgeOfDevelopment: string;
  bigAssumptions: string[];
  subjectStructure: string[];
  objectStructure: string[];
  recommendations: string[];
}> {
  const probesContext = probeSession.exchanges.map(ex =>
    `Type: ${ex.probeType}\nQuestion: ${ex.question}\nResponse: ${ex.userResponse || 'No response'}\n` +
    `Analysis: ${ex.aiAnalysis ? `${ex.aiAnalysis.subjectObjectReveal}\n${ex.aiAnalysis.developmentalInsight}` : 'Not analyzed'}`
  ).join('\n\n---\n\n');

  const originalAnalysis = assessmentSession.overallInterpretation
    ? `Original Center of Gravity: ${assessmentSession.overallInterpretation.centerOfGravity}\n` +
      `Original Analysis: ${assessmentSession.overallInterpretation.fullAnalysis}`
    : '';

  const prompt = `You are completing a developmental assessment that used interactive probing to test the boundaries of someone's meaning-making system.

# Original Assessment

${originalAnalysis}

# Interactive Probes and Responses

${probesContext}

# Your Task

Integrate the original assessment with the insights from the probes to provide a refined developmental analysis.

Return a JSON object:
{
  "confirmedStage": "Socialized Mind" | "Socialized/Self-Authoring Transition" | "Self-Authoring Mind" | "Self-Authoring/Self-Transforming Transition" | "Self-Transforming Mind",
  "refinedAnalysis": "3-4 paragraphs integrating original assessment with probe insights. What became clearer through the interactive exploration?",
  "edgeOfDevelopment": "2-3 sentences describing with more precision where they're growing and what would support that growth",
  "bigAssumptions": [
    "First identified limiting assumption",
    "Second identified limiting assumption",
    "Third identified limiting assumption (if applicable)"
  ],
  "subjectStructure": [
    "First thing they're currently subject to (embedded in)",
    "Second thing they're subject to",
    "Third thing they're subject to (if applicable)"
  ],
  "objectStructure": [
    "First thing they can now hold as object (reflect on)",
    "Second thing they can hold as object",
    "Third thing they can hold as object (if applicable)"
  ],
  "recommendations": [
    "Specific developmental recommendation 1",
    "Specific developmental recommendation 2",
    "Specific developmental recommendation 3",
    "Specific developmental recommendation 4"
  ]
}

Be specific and reference actual content from their responses. The probes should have revealed more nuanced understanding of their current structure.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            confirmedStage: { type: Type.STRING },
            refinedAnalysis: { type: Type.STRING },
            edgeOfDevelopment: { type: Type.STRING },
            bigAssumptions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            subjectStructure: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            objectStructure: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['confirmedStage', 'refinedAnalysis', 'edgeOfDevelopment', 'bigAssumptions', 'subjectStructure', 'objectStructure', 'recommendations']
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error('Error generating integrated insights:', error);
    return {
      confirmedStage: assessmentSession.overallInterpretation?.centerOfGravity || 'Self-Authoring Mind',
      refinedAnalysis: 'The interactive probes provided additional context for understanding your developmental structure.',
      edgeOfDevelopment: assessmentSession.overallInterpretation?.developmentalEdge || 'Continue exploring the boundaries of your current meaning-making system.',
      bigAssumptions: ['Unable to determine at this time'],
      subjectStructure: ['Analysis incomplete'],
      objectStructure: ['Analysis incomplete'],
      recommendations: assessmentSession.overallInterpretation?.recommendations || [
        'Work with the Subject-Object Explorer tool',
        'Continue developmental practices',
        'Consider working with a developmental coach'
      ]
    };
  }
}

// Relational Pattern Tracking - Chatbot Conversation
export async function getRelationalPatternResponse(
  conversationContext: string,
  userMessage: string,
  exploredRelationships: RelationshipContext[]
): Promise<{
  message: string;
  extractedRelationship?: RelationshipContext;
  shouldOfferAnalysis: boolean;
}> {
  const prompt = `You are a compassionate relational pattern guide helping someone explore how they show up in different relationships and where they're reactive.

# Conversation Context
${conversationContext}

# User's Latest Message
${userMessage}

# Relationships Already Explored
${exploredRelationships.map((r, i) => `${i + 1}. ${r.type}: ${r.pattern || 'In progress'}`).join('\n')}

# Your Role
- Ask gentle, probing questions to help them see patterns
- Help them identify: the trigger situation, their automatic reaction, and the underlying fear/need
- Once you have those three things for a relationship, extract the pattern and move to another relationship type
- Guide them to explore different relationship types (romantic, parent, boss, friend, etc.)
- Look for reactivity: withdrawal, anger, people-pleasing, defensiveness, collapse, controlling behavior
- Be curious, not judgmental
- Keep responses conversational and under 4 sentences

# Instructions
1. Respond to their message
2. If they've given enough info about a relationship (trigger + reaction + fear), summarize the pattern and suggest exploring a different relationship type
3. Ask one clear question to deepen understanding
4. Track whether this conversation has extracted a complete relationship pattern

Return JSON:
{
  "message": "Your conversational response",
  "extractedRelationship": {
    "type": "Boss/Authority" | "Romantic Partner" | etc.,
    "personDescription": "my boss",
    "triggerSituation": "what triggers the reaction",
    "yourReaction": "how they react automatically",
    "underlyingFear": "the fear or need driving it",
    "pattern": "1-2 sentence pattern summary"
  } | null,
  "shouldOfferAnalysis": true if 3+ relationships explored AND user seems ready
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message: { type: Type.STRING },
            extractedRelationship: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                personDescription: { type: Type.STRING },
                triggerSituation: { type: Type.STRING },
                yourReaction: { type: Type.STRING },
                underlyingFear: { type: Type.STRING },
                pattern: { type: Type.STRING }
              },
              nullable: true
            },
            shouldOfferAnalysis: { type: Type.BOOLEAN }
          },
          required: ['message', 'shouldOfferAnalysis']
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error('Error getting relational response:', error);
    return {
      message: "Could you tell me more about that?",
      shouldOfferAnalysis: false
    };
  }
}

// Analyze Relational Patterns Across Relationships
export async function analyzeRelationalPatterns(
  relationships: RelationshipContext[],
  conversation: any[]
): Promise<{
  corePatterns: string[];
  reactiveSignatures: string[];
  relationshipSpecificPatterns: Record<string, string>;
  developmentalHypothesis: string;
  shadowWork: string;
  recommendations: string[];
}> {
  // Build relationship context from both structured data and conversation
  const relationshipSummaries = relationships.map((r, i) => `
${i + 1}. **${r.type}**${r.personDescription ? ` (${r.personDescription})` : ''}
   - Trigger: ${r.triggerSituation || 'Not captured'}
   - Reaction: ${r.yourReaction || 'Not captured'}
   - Fear/Need: ${r.underlyingFear || 'Not captured'}
   - Pattern: ${r.pattern || 'Not captured'}
`).join('\n');

  // Include relevant conversation excerpts for additional context
  const conversationContext = conversation
    .filter(m => m.role === 'user')
    .slice(-10) // Last 10 user messages for context
    .map(m => `User: ${m.text.substring(0, 200)}...`)
    .join('\n');

  const prompt = `You are an expert depth psychologist and relational coach. Analyze this relational pattern session and identify recurring themes, reactive signatures, and developmental insights.

# Relationships Explored
${relationshipSummaries}

# Recent Conversation Context (for additional insight)
${conversationContext}

# Your Analysis Task

Analyze the patterns for:
1. **Core patterns** - Recurring themes/beliefs that show up across different relationships (2-3 key patterns)
2. **Reactive signatures** - HOW the person reacts when triggered (e.g., withdraws, gets defensive, people-pleases, collapses, controls, etc.) - list 3-5 signature reactions
3. **Relationship-specific patterns** - Different ways these show up in different contexts
4. **Developmental hypothesis** - What early experiences might have shaped these patterns? (Early attachment, family dynamics, trauma, cultural messaging, etc.)
5. **Shadow work needed** - What's being disowned, rejected, or unconscious? What needs integration?
6. **Recommendations** - 2-3 specific, actionable practices or approaches to work with these patterns

Be specific and psychologically sophisticated. Base your analysis on the actual relationship data provided.

Return ONLY valid JSON (no markdown, no code blocks):
{
  "corePatterns": ["pattern 1", "pattern 2", "pattern 3"],
  "reactiveSignatures": ["signature 1", "signature 2", "signature 3"],
  "relationshipSpecificPatterns": {
    "Romantic Partner": "specific pattern",
    "Boss/Authority": "specific pattern",
    "Friend": "specific pattern"
  },
  "developmentalHypothesis": "2-3 sentences about origins",
  "shadowWork": "2-3 sentences about what needs integration",
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            corePatterns: { type: Type.ARRAY, items: { type: Type.STRING } },
            reactiveSignatures: { type: Type.ARRAY, items: { type: Type.STRING } },
            relationshipSpecificPatterns: {
              type: Type.OBJECT,
              additionalProperties: { type: Type.STRING }
            },
            developmentalHypothesis: { type: Type.STRING },
            shadowWork: { type: Type.STRING },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['corePatterns', 'reactiveSignatures', 'relationshipSpecificPatterns', 'developmentalHypothesis', 'shadowWork', 'recommendations']
        }
      }
    });

    const result = JSON.parse(response.text);

    // Validate that we got good data
    if (result.corePatterns?.length > 0 && result.reactiveSignatures?.length > 0) {
      return result;
    }

    // If analysis is empty, throw error to trigger fallback
    throw new Error('Analysis returned empty results');
  } catch (error) {
    console.error('Error analyzing relational patterns:', error);

    // Generate a basic analysis from the data we have
    if (relationships.length > 0) {
      // Extract patterns from the relationship data itself
      const allPatterns = relationships
        .map(r => r.pattern)
        .filter(p => p && p.length > 0);

      const allReactions = relationships
        .map(r => r.yourReaction)
        .filter(r => r && r.length > 0);

      const allFears = relationships
        .map(r => r.underlyingFear)
        .filter(f => f && f.length > 0);

      return {
        corePatterns: allPatterns.length > 0
          ? allPatterns.slice(0, 3)
          : ['Pattern identified across relationships'],
        reactiveSignatures: allReactions.length > 0
          ? Array.from(new Set(allReactions.map(r => {
              // Extract main reactive signature from reaction text
              if (r.toLowerCase().includes('withdraw')) return 'Withdrawal/Avoidance';
              if (r.toLowerCase().includes('defend')) return 'Defensiveness';
              if (r.toLowerCase().includes('please')) return 'People-pleasing';
              if (r.toLowerCase().includes('collapse')) return 'Collapse/Shutdown';
              if (r.toLowerCase().includes('control')) return 'Control/Dominance';
              if (r.toLowerCase().includes('angry') || r.toLowerCase().includes('anger')) return 'Anger/Reactivity';
              return 'Reactive Pattern';
            })))
          : ['Reactive patterns present across relationships'],
        relationshipSpecificPatterns: relationships.reduce((acc, r) => {
          if (r.type) {
            acc[r.type] = r.pattern || r.yourReaction || 'Pattern observed';
          }
          return acc;
        }, {} as Record<string, string>),
        developmentalHypothesis: 'These patterns likely stem from early relational experiences and how safety and connection were established in your family of origin.',
        shadowWork: 'Integration work involves making conscious the reactive patterns that operate automatically, and discovering what needs or fears are being protected by these reactions.',
        recommendations: [
          'Work with a therapist or coach to trace these patterns to their origins',
          'Practice mindfulness to observe reactions before they automatic',
          'Experiment with responding differently in low-stakes situations'
        ]
      };
    }

    // Final fallback if no relationships
    return {
      corePatterns: ['Explore more relationships to identify patterns'],
      reactiveSignatures: ['Please share more details about your reactions'],
      relationshipSpecificPatterns: {},
      developmentalHypothesis: 'Additional relationship contexts would help build a fuller picture of your patterns.',
      shadowWork: 'As patterns emerge across relationships, shadow work will focus on integrating disowned aspects.',
      recommendations: ['Continue exploring different relationship types', 'Share specific triggers and reactions', 'Work with a skilled relational coach or therapist']
    };
  }
}

// Role Alignment Wizard - Gemini Integration Functions

/**
 * Generates a personalized action suggestion for a role based on its alignment score and context
 */
export async function generateRoleActionSuggestion(
  roleName: string,
  why: string,
  goal: string,
  valueScore: number,
  valueNote: string,
  shadowNudge?: string
): Promise<string> {
  const prompt = `You are an integral life coach helping someone align their roles with their deeper values.

# Role Context
- Role: ${roleName}
- Why they have this role: ${why}
- Core goal: ${goal}
- Value alignment score: ${valueScore}/10
- Why that score: ${valueNote}
${shadowNudge ? `- Shadow work note: ${shadowNudge}` : ''}

# Your Task
Generate ONE specific, actionable, personalized suggestion for this person to either:
- If score >= 7: Amplify and celebrate this alignment
- If score < 7: Make a small shift to increase alignment

Requirements:
- Be specific to THEIR role and context (not generic)
- Make it small and achievable (can be done this week)
- Frame it positively and encouragingly
- Keep it to one sentence
- Start with an action verb

Examples of good suggestions:
- "Schedule a 15-minute coffee chat with your team to share one win from this role"
- "Identify one task this week that doesn't align with your core goal and delegate it"
- "Write down three ways this role connects to your deeper values and place it where you'll see it daily"

Return ONLY the action suggestion as a string.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt
    });
    return response.text.trim();
  } catch (error) {
    console.error('Error generating role action suggestion:', error);
    // Fallback to original template behavior
    const templates = valueScore >= 7
      ? [
          "Share one win in your next interaction",
          "Amplify: Celebrate this alignment with someone close",
          "Document what's working to reinforce it"
        ]
      : [
          "Try a 5-min boundary: Delegate one task tomorrow",
          "Identify one small shift you can make this week",
          "Say 'no' to one request that doesn't align"
        ];
    return templates[Math.floor(Math.random() * templates.length)];
  }
}

/**
 * Analyzes a single role and provides insights about its alignment
 */
export async function analyzeRoleAlignment(
  roleName: string,
  why: string,
  goal: string,
  valueScore: number,
  valueNote: string
): Promise<{ insight: string; question: string }> {
  const prompt = `You are an integral coach analyzing how someone's role aligns with their values.

# Role
- Name: ${roleName}
- Why they have it: ${why}
- Core goal: ${goal}
- Alignment score: ${valueScore}/10
- Why that score: ${valueNote}

# Your Task
Provide:
1. A brief insight (1-2 sentences) about what this alignment pattern reveals
2. A probing question (1 sentence) to deepen their reflection

Focus on:
- What the score reveals about their relationship to this role
- Any tension between the goal and the alignment
- Opportunities for growth or celebration

Return a JSON object:
{
  "insight": "Your observation about the alignment pattern",
  "question": "A question to deepen reflection"
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insight: { type: Type.STRING },
            question: { type: Type.STRING }
          },
          required: ['insight', 'question']
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error('Error analyzing role alignment:', error);
    return {
      insight: "Every role carries an opportunity for deeper alignment.",
      question: "What would it feel like if this role was in perfect harmony with your values?"
    };
  }
}

/**
 * Generates shadow work insights for low-scoring roles
 */
export async function generateShadowWorkInsight(
  roleName: string,
  valueScore: number,
  valueNote: string
): Promise<string> {
  const prompt = `You are a depth psychologist helping someone explore shadow material in a role that doesn't align with their values.

# Role Context
- Role: ${roleName}
- Alignment score: ${valueScore}/10 (low alignment)
- Why that score: ${valueNote}

# Your Task
Generate ONE insightful, compassionate prompt (2 sentences max) that helps them explore what might be underneath this misalignment.

Consider:
- What might they be avoiding?
- What need might this role be meeting (even if unconsciously)?
- What pattern from the past might be playing out?
- What would it cost them to let go or transform this role?

Be gentle but direct. Use curious language ("I wonder if...", "What if...").

Return ONLY the insight as a string.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt
    });
    return response.text.trim();
  } catch (error) {
    console.error('Error generating shadow work insight:', error);
    return "What might this role be protecting you from? Sometimes misalignment reveals an unconscious need for safety or belonging.";
  }
}

/**
 * Generates an integral reflection by analyzing all roles together
 */
export async function generateIntegralReflection(
  roles: Array<{
    name: string;
    why: string;
    goal: string;
    valueScore: number;
    valueNote: string;
    shadowNudge?: string;
    action?: string;
  }>
): Promise<{
  integralInsight: string;
  quadrantConnections: string;
  recommendations: string[];
}> {
  const rolesContext = roles.map((r, i) => `
${i + 1}. **${r.name}** (Alignment: ${r.valueScore}/10)
   - Why: ${r.why}
   - Goal: ${r.goal}
   - Alignment note: ${r.valueNote}
   ${r.shadowNudge ? `- Shadow note: ${r.shadowNudge}` : ''}
   ${r.action ? `- Action: ${r.action}` : ''}
`).join('\n');

  const prompt = `You are an integral coach analyzing someone's role ecosystem through the AQAL framework (I, We, It, Its quadrants).

# Roles Explored
${rolesContext}

# Your Task

Provide an integral analysis:

1. **Integral Insight** (2-3 sentences): What patterns do you see across their roles? How do the high and low scoring roles relate? What does their role ecosystem reveal about their current life structure?

2. **Quadrant Connections** (2-3 sentences): How do these Its-quadrant roles (external roles in systems) connect to:
   - I (interior individual): their inner experience, values, consciousness
   - We (interior collective): their relationships, culture, sense of belonging
   - It (exterior individual): their behaviors, practices, health

3. **Recommendations** (3-4 specific suggestions): What would create more balance and integration across quadrants?

Return JSON:
{
  "integralInsight": "Pattern analysis across roles",
  "quadrantConnections": "How roles connect to I, We, It quadrants",
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            integralInsight: { type: Type.STRING },
            quadrantConnections: { type: Type.STRING },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['integralInsight', 'quadrantConnections', 'recommendations']
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error('Error generating integral reflection:', error);
    return {
      integralInsight: "Your roles form an interconnected system, each influencing your overall alignment.",
      quadrantConnections: "Consider how your external roles (Its) reflect and shape your inner values (I) and relationships (We).",
      recommendations: [
        "Bring more awareness to how your roles affect your inner state",
        "Notice how your relationships influence your role choices",
        "Consider which roles deserve more energy and which might need boundaries"
      ]
    };
  }
}

/**
 * Detect attachment style from relational patterns
 */
export async function detectAttachmentStyle(
  relationshipContexts: RelationshipContext[]
): Promise<AttachmentStyle> {
  if (relationshipContexts.length === 0) {
    return 'secure'; // Default fallback
  }

  const contextSummary = relationshipContexts.map(ctx =>
    `Type: ${ctx.type}, Fear: ${ctx.underlyingFear || 'N/A'}, Pattern: ${ctx.pattern || 'N/A'}`
  ).join('\n');

  const prompt = `Based on these relationship patterns, determine the person's primary attachment style. Return ONLY the style name: "secure", "anxious", "avoidant", or "fearful".

Relationship Contexts:
${contextSummary}

Analysis: Look for:
- Secure: Comfortable with intimacy, healthy boundaries, direct conflict management
- Anxious: Fears abandonment, seeks reassurance, over-focuses on relationships
- Avoidant: Values independence, distances from emotional intimacy, suppresses feelings
- Fearful: Oscillates between clinging and withdrawing, fear and shame present

Return only one word: secure | anxious | avoidant | fearful`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
    });

    const style = response.text.toLowerCase().trim() as AttachmentStyle;
    if (['secure', 'anxious', 'avoidant', 'fearful'].includes(style)) {
      return style;
    }
    return 'secure';
  } catch (error) {
    console.error('Error detecting attachment style:', error);
    return 'secure';
  }
}

/**
 * Generate personalized practice recommendations based on attachment style
 */
export async function explainAttachmentPractices(
  attachmentStyle: AttachmentStyle,
  selectedPracticeIds: string[]
): Promise<string> {
  // Get practice details
  const allPractices = { ...corePractaces.body, ...corePractaces.mind, ...corePractaces.spirit, ...corePractaces.shadow };
  const selectedPractices = selectedPracticeIds
    .map(id => allPractices[id as keyof typeof allPractices])
    .filter(Boolean);

  const practicesInfo = selectedPractices
    .map((p: any) => `- ${p.name}: ${p.description}`)
    .join('\n');

  const prompt = `You are a somatic psychology expert. A person with ${attachmentStyle} attachment style is exploring these practices:

${practicesInfo}

Explain in 2-3 sentences why these specific practices help heal ${attachmentStyle} attachment patterns. Focus on:
1. How each practice addresses their specific attachment wound
2. The mechanism of change (what shifts in their nervous system/mind)
3. How they'll feel different as they practice

Be warm, encouraging, and specific to their attachment style.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error('Error explaining attachment practices:', error);
    return `These practices support healing your ${attachmentStyle} attachment patterns by helping you develop a more secure nervous system and healthier relationship skills. Regular practice will help you feel safer in intimacy and more grounded in yourself.`;
  }
}
