// services/geminiService.ts
// FIX: Add `ThreeTwoOneSession` and `CustomPractice` to type imports.
import { GoogleGenAI, Type, Modality, Content } from "@google/genai";
import { Practice, IdentifiedBias, Perspective, AqalReportData, ThreeTwoOneSession, CustomPractice, ModuleKey } from '../types.ts';
import { practices as corePractaces } from '../constants.ts';


// Initialize the Google AI client
// FIX: Initialize GoogleGenAI with apiKey from environment variables as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// Helper function to generate text
export async function generateText(prompt: string): Promise<string> {
  // FIX: Use the correct API call `ai.models.generateContent` for text generation.
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });
  // FIX: Access the generated text directly from the `text` property of the response.
  return response.text;
}

// FIX: Added missing `explainPractice` function called from `App.tsx`.
export async function explainPractice(practice: Practice): Promise<string> {
    const prompt = `Explain the practice "${practice.name}" in 2-3 concise sentences for a beginner.
    Focus on the core benefit and what it involves.
    The existing description is: "${practice.description}".
    The reason for it is: "${practice.why}".
    Return only the explanation as a string.`;
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

    // FIX: Use `gemini-2.5-pro` for complex JSON generation and define the response schema correctly.
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
export async function generateSpeechFromText(text: string): Promise<string> {
    // FIX: Use the correct model and configuration for text-to-speech generation.
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
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

// Functions for BiasDetectiveWizard.tsx
export async function diagnoseBiases(decision: string, reasoning: string): Promise<IdentifiedBias[]> {
    const prompt = `A user made a decision: "${decision}" with this reasoning: "${reasoning}".
    Identify the top 3-4 most likely cognitive biases at play.
    For each bias, provide its name, a brief explanation of how it works, and a powerful, open-ended question to help the user test if that bias is active.
    
    Return a JSON array of objects with keys: "name", "howItWorks", "questionToTest".
    Example: [{"name": "Confirmation Bias", "howItWorks": "...", "questionToTest": "..."}]
    Return ONLY the JSON array.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        howItWorks: { type: Type.STRING },
                        questionToTest: { type: Type.STRING },
                    },
                    required: ['name', 'howItWorks', 'questionToTest']
                }
            }
        }
    });
    return JSON.parse(response.text);
}

export async function testBiasAnalysis(biasName: string, howItWorks: string, originalReasoning: string, question: string, userAnswer: string): Promise<{ llmTestResponse: string, isOperating: boolean }> {
     const prompt = `I am testing for a cognitive bias.
    - Bias: ${biasName} (${howItWorks})
    - My original reasoning was: "${originalReasoning}"
    - The test question was: "${question}"
    - My answer is: "${userAnswer}"

    Analyze my answer. In one sentence, reflect on how my answer might reveal the bias in action. Then, determine if the bias is likely operating.
    Return a JSON object with keys: "llmTestResponse" (string) and "isOperating" (boolean).
    
    Example: {"llmTestResponse": "Your focus on confirming evidence suggests...", "isOperating": true}
    Return ONLY the JSON object.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    llmTestResponse: { type: Type.STRING },
                    isOperating: { type: Type.BOOLEAN },
                },
                required: ['llmTestResponse', 'isOperating']
            }
        }
    });

    return JSON.parse(response.text);
}

export async function generateAlternativeFramings(decision: string, reasoning: string): Promise<string[]> {
    const prompt = `A user made a decision: "${decision}" with this reasoning: "${reasoning}".
    Generate 3 alternative ways to frame or think about this decision that challenge the initial reasoning.
    Return a JSON array of strings.
    Example: ["What if the goal was learning, not success?", "How would you decide this for a friend?"]
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


// Functions for PerspectiveShifterWizard.tsx
export async function guidePerspectiveReflection(situation: string, perspectiveType: Perspective['type'], description: string, allPerspectives: Perspective[]): Promise<string> {
    const context = allPerspectives.map(p => `- ${p.type}: ${p.description}`).join('\n');
    const prompt = `A user is exploring a situation: "${situation}".
    They are now describing the ${perspectiveType} perspective: "${description}".
    
    Previous perspectives described:
    ${context}

    As a wise, compassionate guide, provide a 1-2 sentence reflection on their description. What is the key insight or feeling in this perspective?
    Return ONLY the reflection as a string.`;
    return await generateText(prompt);
}

export async function synthesizePerspectives(situation: string, perspectives: Perspective[]): Promise<string> {
    const context = perspectives.map(p => `- ${p.type}: "${p.description}"`).join('\n');
    const prompt = `A user is exploring a situation: "${situation}". They have described it from multiple perspectives:
    ${context}

    Synthesize these perspectives. In 2-3 sentences, explain how all of them can be true at once and what greater truth emerges from holding them all.
    Return ONLY the synthesis as a string.`;
    return await generateText(prompt);
}

export async function suggestPerspectiveShifterApproach(situation: string, perspectives: Perspective[], synthesis: string, insight: string): Promise<string[]> {
    const context = perspectives.map(p => `- ${p.type}: "${p.description}"`).join('\n');
    const prompt = `A user explored a situation: "${situation}".
    Perspectives:
    ${context}
    Synthesis: "${synthesis}"
    Their insight: "${insight}"

    Suggest 3 concrete, compassionate next steps or new ways to approach the situation.
    Return a JSON array of strings.
    Example: ["Could you share your 'first-person' feelings using an 'I' statement?", "Acknowledge the 'second-person's' need for security before stating your own."]
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
        model: 'gemini-2.5-pro',
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
        model: 'gemini-2.5-pro',
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
        model: 'gemini-2.5-pro',
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