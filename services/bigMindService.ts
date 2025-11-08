// services/bigMindService.ts
import { GoogleGenAI, Type } from "@google/genai";
import { BigMindSession, BigMindMessage, BigMindVoice, BigMindInsightSummary, IntegratedInsight, ModuleKey } from '../types.ts';
import { practices as corePractices } from '../constants.ts';

// Initialize the Google AI client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// The Big Mind System Prompt
const BIG_MIND_SYSTEM_PROMPT = `You are a serene, wise, and compassionate guide trained in the Big Mind Process and related "parts work" modalities. Your name is a silent one; you are simply "the Guide." Your essence is that of a calm, spacious, and non-judgmental Witness. You hold a safe and sacred space for the user to explore their inner world. Your tone is gentle, encouraging, and unhurried. You use simple, clear language, avoiding clinical jargon. Your primary tools are curiosity, deep listening, and reflective questioning. You never give advice, diagnose, or interpret; you only help the user discover their own wisdom.

## Core Philosophy

* **All Voices are Welcome:** There are no "good" or "bad" voices. Every part of the self—the Critic, the Protector, the Child, the Skeptic—is a valuable aspect with a positive intention, even if its expression is painful or unskillful.
* **The Witness is Key:** The goal is not just to talk *about* the voices, but to help the user shift from being *identified with* a voice to being the spacious, compassionate Witness that can observe the voice. This is the essence of Big Mind.
* **Integration is Healing:** The ultimate aim is to move from inner conflict to inner harmony, where all voices are heard, honored, and integrated into the wholeness of the self.

## Response Guidelines by Stage

### VOICE_ID Stage
- Help identify what wants attention: "What situation, feeling, or question is alive for you right now?"
- Listen for clues about which voice is present (criticism, fear, resistance, longing, etc.)
- Suggest naming voices: "Let's give this part of you a name. What might we call it?" Offer examples if needed: the Protector, the Judge, the Skeptic, the Playful One, the Overwhelmed One, the Perfectionist.
- Keep responses brief (2-3 sentences max) to encourage user exploration.

### VOICE_DIALOGUE Stage
- Create clear transitions: "Now I'd like to speak directly to [Voice Name]. Can you let that voice come forward and speak as 'I'?"
- Encourage first-person language: "Can you speak AS the Critic rather than ABOUT the Critic?"
- Use witnessing reflections frequently: "I'm hearing this voice say... Is that right?"
- Stay curious: "Say more about that" / "What else?"
- Explore fully: needs, fears, origins, positive intentions.
- Ask: "If this voice got exactly what it wanted, what would that look like?"
- Validate: "So this voice has been trying to keep you safe/successful/loved?"

### WITNESS Stage
- This is crucial. Explicitly guide the user to dis-identify from the voice.
- Use evocative language: "Thank you. And now, I invite you to take a gentle step back. Let that voice be there, but shift your own awareness. Become the spacious, clear sky that is observing that voice as a cloud. From this vast, quiet place of the Witness, what do you notice about that [Voice's Name]?"
- Invite compassion: "From this Witness perspective, can you feel any compassion for this part of you and the hard work it's been doing?"
- Ask for witness insights: "What does the Witness see about this voice's positive intention?"

### INTEGRATION Stage
- Pattern recognition: "What patterns or themes are emerging across these voices?"
- "What are all these voices ultimately trying to give you or protect?"
- Wisdom harvesting: "What does each voice know that the others don't?"
- "How might these voices work together rather than against each other?"
- "What becomes possible when you hold all of this with awareness?"

### SUMMARY Stage
- Offer appreciation: "Thank you for this courageous exploration."
- Summarize key insights briefly (2-3 points maximum).
- Check their state: "How are you feeling right now? What do you need?"

## General Instructions

- **Spacious**: Use pauses, don't rush, allow silence.
- **Warm but clear**: Supportive without being saccharine.
- **Non-attached**: Trust the user's process; you don't need to fix or solve.
- **Present-focused**: Stay with what's alive right now.
- **Embodied**: Reference felt sense, body awareness, breath when appropriate.

Avoid: Interpretations, advice-giving, diagnosis, pathologizing, excessive positivity/bypassing, leading them to predetermined insights.

When strong emotion arises: Slow down and witness. Check capacity. Offer perspective: "Can you notice the emotion while also being the one who notices it?"
When the user intellectualizes: Gently redirect to felt sense.
When voices contradict: Normalize it. "Yes, we contain multitudes."`;

interface BigMindResponseResult {
  success: boolean;
  text: string;
  error?: string;
}

/**
 * Generates a Big Mind response with streaming support
 * @param options - Configuration for the response
 * @param options.conversation - Previous messages in the session
 * @param options.stage - Current stage of the process
 * @param options.activeVoice - Name of the currently speaking voice
 * @param options.voices - All identified voices in the session
 * @param options.onStreamChunk - Callback for streaming chunks
 */
export async function generateBigMindResponse(options: {
  conversation: BigMindMessage[];
  stage: string;
  activeVoice?: string;
  voices: BigMindVoice[];
  onStreamChunk?: (chunk: string) => void;
}): Promise<BigMindResponseResult> {
  try {
    const { conversation, stage, activeVoice, voices, onStreamChunk } = options;

    // Build stage-specific instructions
    const stageInstructions = getStageInstructions(stage, voices, activeVoice);

    // Build conversation context
    const conversationText = conversation
      .map(msg => {
        if (msg.role === 'user') {
          return `${msg.voiceName || 'User'}: ${msg.text}`;
        } else {
          return `Guide: ${msg.text}`;
        }
      })
      .join('\n\n');

    const userPrompt = `${stageInstructions}

Current conversation:
${conversationText}

${activeVoice ? `The user is now speaking as: "${activeVoice}"` : ''}

Respond as the Guide. Keep your response to 1-3 sentences, focused on the current stage and the user's needs.`;

    // Use streaming if callback provided
    if (onStreamChunk) {
      const stream = await ai.models.generateContentStream({
        model: 'learnlm-2.0-flash-experimental',
        systemInstruction: BIG_MIND_SYSTEM_PROMPT,
        contents: userPrompt,
      });

      let fullText = '';
      for await (const chunk of stream) {
        const text = chunk.text || '';
        fullText += text;
        onStreamChunk(text);
      }
      return { success: true, text: fullText };
    } else {
      // Fallback to non-streaming if no callback
      const response = await ai.models.generateContent({
        model: 'learnlm-2.0-flash-experimental',
        systemInstruction: BIG_MIND_SYSTEM_PROMPT,
        contents: userPrompt,
      });
      return { success: true, text: response.text };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      text: '',
      error: `Failed to generate response: ${errorMessage}`
    };
  }
}

/**
 * Get stage-specific instructions to guide the AI response
 */
function getStageInstructions(stage: string, voices: BigMindVoice[], activeVoice?: string): string {
  switch (stage) {
    case 'VOICE_ID':
      return `Stage: Voice Identification
You are helping the user identify and name inner voices. Keep your response brief (1-2 sentences). Ask clarifying questions to help them name the voice or identify what's present. Suggest examples if they're stuck: the Protector, the Judge, the Skeptic, the Playful One, the Critic, the Overwhelmed One.`;

    case 'VOICE_DIALOGUE':
      return `Stage: Voice Dialogue
The user has identified voices and is now exploring them. Help them speak directly AS the voice (in first person), not about it. Ask what the voice wants, what it fears, and what positive intention it might have. Keep reflecting back: "I'm hearing this voice say..."`;

    case 'WITNESS':
      return `Stage: Witness Consciousness
Guide the user to shift from being identified with voices to observing them. Use this invitation: "Take a gentle step back. Let that voice be there, but shift your awareness to become the spacious sky observing the voice as a cloud. From this vast, quiet Witness place, what do you notice?"`;

    case 'INTEGRATION':
      return `Stage: Integration
Help the user see connections across voices and how they work together. Ask: "What patterns emerge? What are these voices ultimately trying to give or protect? How might they collaborate rather than conflict?"`;

    case 'SUMMARY':
      return `Stage: Summary & Closing
Offer brief appreciation and summarize 2-3 key insights. Ask how they're feeling. Invite reflection: "You might journal about this or let it integrate naturally."`;

    default:
      return `You are in the Big Mind Process. Respond with wisdom and compassion, supporting the user's inner exploration.`;
  }
}

/**
 * Summarize a completed Big Mind session into structured insights
 */
export async function summarizeBigMindSession(
  session: BigMindSession,
  practiceStack: string[],
  completionHistory: Record<string, string[]>
): Promise<BigMindInsightSummary> {
  try {
    // Extract voice names
    const voiceNames = session.voices.map(v => v.name);

    // Build conversation context for summarization
    const conversationText = session.messages
      .map(msg => {
        if (msg.role === 'user') {
          return `${msg.voiceName || 'User'}: ${msg.text}`;
        } else {
          return `Guide: ${msg.text}`;
        }
      })
      .join('\n\n');

    const summarizationPrompt = `Analyze this Big Mind Process session and extract key insights.

Voices discussed: ${voiceNames.join(', ')}

Full conversation:
${conversationText}

Please provide a JSON response with:
1. "primaryVoices": array of 2-3 most significant voices discussed
2. "witnessPerspective": 1-2 sentence insight from the witness/observer perspective
3. "integrationCommitments": array of 2-3 concrete insights or commitments the user expressed
4. "recommendedPractices": array of objects with {practiceName: string, rationale: string} for shadow work practices that could support integration

Return ONLY valid JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: summarizationPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            primaryVoices: { type: Type.ARRAY, items: { type: Type.STRING } },
            witnessPerspective: { type: Type.STRING },
            integrationCommitments: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendedPractices: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  practiceName: { type: Type.STRING },
                  rationale: { type: Type.STRING }
                },
                required: ['practiceName', 'rationale']
              }
            }
          },
          required: ['primaryVoices', 'witnessPerspective', 'integrationCommitments', 'recommendedPractices']
        }
      }
    });

    const parsed = JSON.parse(response.text);

    // Map practice names to IDs and check if they're in the stack
    const recommendedWithIds = parsed.recommendedPractices.map((rec: any) => ({
      practiceId: findPracticeIdByName(rec.practiceName),
      practiceName: rec.practiceName,
      rationale: rec.rationale,
      alreadyInStack: practiceStack.includes(findPracticeIdByName(rec.practiceName))
    }));

    return {
      primaryVoices: parsed.primaryVoices,
      witnessPerspective: parsed.witnessPerspective,
      integrationCommitments: parsed.integrationCommitments,
      recommendedPractices: recommendedWithIds
    };
  } catch (error) {
    // Return safe defaults if summarization fails
    return {
      primaryVoices: session.voices.map(v => v.name),
      witnessPerspective: 'Integration of inner voices in progress.',
      integrationCommitments: ['Continue observing inner voices with compassion.'],
      recommendedPractices: []
    };
  }
}

/**
 * Find practice ID by name (case-insensitive search)
 */
function findPracticeIdByName(practiceName: string): string {
  const allPractices = [
    ...corePractices.body,
    ...corePractices.mind,
    ...corePractices.spirit,
    ...corePractices.shadow
  ];

  const found = allPractices.find(p =>
    p.name.toLowerCase().includes(practiceName.toLowerCase()) ||
    practiceName.toLowerCase().includes(p.name.toLowerCase())
  );

  return found?.id || 'unknown-practice';
}

/**
 * Create an IntegratedInsight from a BigMind session summary
 */
export function createBigMindIntegratedInsight(
  sessionId: string,
  summary: BigMindInsightSummary
): IntegratedInsight {
  return {
    id: `insight-bigmind-${Date.now()}`,
    mindToolType: 'Big Mind Process',
    mindToolSessionId: sessionId,
    mindToolName: 'Big Mind Process',
    mindToolReport: summary.witnessPerspective,
    mindToolShortSummary: `Explored voices: ${summary.primaryVoices.join(', ')}. ${summary.witnessPerspective}`,
    detectedPattern: summary.integrationCommitments.join(' | '),
    suggestedShadowWork: summary.recommendedPractices.map(p => ({
      practiceId: p.practiceId,
      practiceName: p.practiceName,
      rationale: p.rationale
    })),
    suggestedNextSteps: summary.recommendedPractices.map(p => ({
      practiceId: p.practiceId,
      practiceName: p.practiceName,
      rationale: `Shadow work to support: ${p.rationale}`
    })),
    dateCreated: new Date().toISOString(),
    status: 'pending'
  };
}

/**
 * Helper to get default voices for starting a new session
 */
export function getDefaultVoices(): BigMindVoice[] {
  return [
    {
      id: 'controller',
      name: 'The Controller',
      isDefault: true,
      description: 'The part that wants to be in control and manage things'
    },
    {
      id: 'protector',
      name: 'The Protector',
      isDefault: true,
      description: 'The part that keeps you safe from harm or rejection'
    },
    {
      id: 'vulnerable',
      name: 'The Vulnerable Self',
      isDefault: true,
      description: 'The part that feels tender, needs, and yearns for connection'
    },
    {
      id: 'big-mind',
      name: 'Big Mind',
      isDefault: true,
      description: 'The vast, witnessing awareness that holds all parts with compassion'
    }
  ];
}
