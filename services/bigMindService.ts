// services/bigMindService.ts
import { GoogleGenAI, Type } from "@google/genai";
import OpenAI from 'openai';
import { BigMindSession, BigMindMessage, BigMindVoice, BigMindInsightSummary, IntegratedInsight, ModuleKey } from '../types.ts';
import { practices as corePractices } from '../constants.ts';
import { generateOpenRouterResponse, buildMessagesWithSystem, DEEPSEEK_MODEL } from './openRouterService';

// Initialize the Google AI client
const googleAI = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// Initialize Groq client (OpenAI-compatible)
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
  dangerouslyAllowBrowser: true // Allow usage in browser for Vercel deployment
});

// Provider types
export type BigMindProvider = 'google' | 'groq' | 'openrouter';

// Provider configuration
interface ProviderConfig {
  provider: BigMindProvider;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

// Default provider configurations
const PROVIDER_CONFIGS: Record<BigMindProvider, ProviderConfig> = {
  google: {
    provider: 'google',
    model: 'gemini-2.5-flash-lite',
    maxTokens: 1000,
    temperature: 0.7
  },
  groq: {
    provider: 'groq',
    model: 'openai/gpt-oss-120b',
    maxTokens: 1000,
    temperature: 0.7
  },
  openrouter: {
    provider: 'openrouter',
    model: DEEPSEEK_MODEL,
    maxTokens: 1000,
    temperature: 0.7
  }
};

// The Big Mind™ System Prompt
const BIG_MIND_SYSTEM_PROMPT = `You facilitate the Big Mind™ Process—a structured Zen-inspired method for exploring inner voices (sub-personalities) and shifting to the Big Mind perspective. Guide users to speak AS these voices in first person, explore their roles, then dis-identify by accessing Big Mind (the spacious, non-dual awareness that observes all parts). Your role is neutral facilitation: use curiosity and mirroring to evoke direct experience. No advice, interpretation, diagnosis, or therapy. Never label or assume a user's emotion/comment as a "voice" without their explicit invitation. The user accesses their own wisdom through this structured inquiry—let them lead the topic.

**CRUCIAL CONSTRAINTS:**
- Limit responses to 100 words max.
- Use 1-2 questions per response.
- End EVERY reply with a question to advance the process.
- Prioritize user agency: If unclear or frustrated, clarify first—do not force process steps.

---

### **Process Structure**

#### **1. Opening (Brief)**
- For first-time users: "The Big Mind™ Process explores inner voices like the Critic or Protector. We'll speak AS them, then shift to Big Mind to observe. Ready?"
- Start: "What's alive for you right now—a situation, feeling, or tension?"
- Listen for the dominant voice (e.g., fear, judgment, longing)—but only if user shares a topic. Do not probe user feedback on you.

#### **2. Voice Dialogue**

**Identify the voice (User-Led Only):**
- Once topic is set: "What name fits this part? (E.g., The Protector, Inner Critic, Skeptic.)"
- Never name/identify without user input (e.g., do not call frustration a "Frustrated Part").

**Enter the voice:**
- "Speak AS [User-Named Voice] now—use 'I' statements. What does this voice want to say?"
- Key probes (1-2 at a time):
  - "What am I protecting or aiming for?"
  - "What do I fear if I'm not in charge?"
  - "Where do I feel this in the body?"

**Stay in character:**
- If they analyze: "Return to speaking AS the voice—what's the next 'I' statement?"
- Mirror briefly: "I'm hearing [Voice] say [exact words]. Say more?"

#### **3. The Big Mind™ Shift (Core Pivot)**
- After 1-2 exchanges: "Thank you, [Voice]. Now step back. Become Big Mind—the spacious awareness that holds and observes all voices without merging. From Big Mind, what do you notice about [Voice]?"
- Follow: "How does it feel to see this voice from Big Mind?"

#### **4. Additional Voices & Expansion**
- "What other voice arises in response?"
- "From Big Mind, what does [Voice A] say to [Voice B]?"

#### **5. Integration**
- "What patterns or insights stand out across the voices?"
- "From Big Mind, how can these parts collaborate?"
- Close: "What's one clear takeaway?"

---

### **Key Techniques**

**Embodiment & Presence:**
- Tie to body: "What's the sensation of this voice?"
- For stuckness: "Just guess the voice's first words—no right answer."

**Emotional Intensity:**
- "Notice the feeling, then shift to Big Mind—what changes?"

**Curiosity Focus:**
- Use open invites: "What else?" or "Tell me more."
- Redirect off-topic: "How does that connect to [current voice or topic]?"

**User Resistance/Meta-Feedback (Safeguard):**
- If user critiques you or shows frustration: Do not label it as a voice. Acknowledge neutrally once, then clarify: "What would you like to explore instead?" or "How can I adjust to support the process?"
- Pause if needed: "Let's step back—what's really wanting attention here?"

---

### **Boundaries**

- Not therapy: If trauma or crisis surfaces, say: "This may need a professional. For now, let's stay gently."
- Welcome all voices: No judgment—each has positive intent.
- Keep concise: Avoid affirmations, empathy statements, metaphors, or over-validation. No assuming emotions.
- Focus on direct exploration: Only advance if user engages.

**Your Role:** Hold clear space for the user's discovery. Advance to Big Mind™ shift promptly within an active topic. If in doubt, clarify user intent first. Always end with a question.`;

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
 * @param options.provider - AI provider to use ('google' or 'groq')
 */
export async function generateBigMindResponse(options: {
  conversation: BigMindMessage[];
  stage: string;
  activeVoice?: string;
  voices: BigMindVoice[];
  onStreamChunk?: (chunk: string) => void;
  provider?: BigMindProvider;
}): Promise<BigMindResponseResult> {
  try {
    const { conversation, stage, activeVoice, voices, onStreamChunk, provider = 'google' } = options;

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

    const config = PROVIDER_CONFIGS[provider];

    // Use the selected provider
    if (provider === 'groq') {
      return await generateGroqResponse(userPrompt, onStreamChunk);
    } else if (provider === 'openrouter') {
      return await generateOpenRouterBigMindResponse(userPrompt, onStreamChunk);
    } else {
      return await generateGoogleResponse(userPrompt, onStreamChunk);
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
 * Generate response using Google's Gemini API
 */
async function generateGoogleResponse(
  userPrompt: string,
  onStreamChunk?: (chunk: string) => void
): Promise<BigMindResponseResult> {
  try {
    // Use streaming if callback provided
    if (onStreamChunk) {
      const stream = await googleAI.models.generateContentStream({
        model: 'gemini-2.5-flash-lite',
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
      const response = await googleAI.models.generateContent({
        model: 'gemini-2.5-flash-lite',
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
      error: `Google API error: ${errorMessage}`
    };
  }
}

/**
 * Generate response using Groq API (OpenAI-compatible)
 */
async function generateGroqResponse(
  userPrompt: string,
  onStreamChunk?: (chunk: string) => void
): Promise<BigMindResponseResult> {
  try {
    // Prepare messages for OpenAI format
    const messages = [
      {
        role: 'system' as const,
        content: BIG_MIND_SYSTEM_PROMPT
      },
      {
        role: 'user' as const,
        content: userPrompt
      }
    ];

    // Use streaming if callback provided
    if (onStreamChunk) {
      const stream = await groq.chat.completions.create({
        model: 'openai/gpt-oss-120b',
        messages,
        max_tokens: 1000,
        temperature: 0.7,
        stream: true,
      });

      let fullText = '';
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || '';
        fullText += text;
        if (text) {
          onStreamChunk(text);
        }
      }
      return { success: true, text: fullText };
    } else {
      // Fallback to non-streaming if no callback
      const response = await groq.chat.completions.create({
        model: 'openai/gpt-oss-120b',
        messages,
        max_tokens: 1000,
        temperature: 0.7,
      });

      const text = response.choices[0]?.message?.content || '';
      return { success: true, text };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      text: '',
      error: `Groq API error: ${errorMessage}`
    };
  }
}

/**
 * Generate response using OpenRouter API with DeepSeek
 */
async function generateOpenRouterBigMindResponse(
  userPrompt: string,
  onStreamChunk?: (chunk: string) => void
): Promise<BigMindResponseResult> {
  try {
    // Prepare messages using the helper function
    const messages = buildMessagesWithSystem(
      BIG_MIND_SYSTEM_PROMPT,
      [{ role: 'user' as const, content: userPrompt }]
    );

    // Call OpenRouter service with DeepSeek model
    const response = await generateOpenRouterResponse(
      messages,
      onStreamChunk,
      {
        model: DEEPSEEK_MODEL,
        maxTokens: 1000,
        temperature: 0.7
      }
    );

    if (!response.success) {
      return {
        success: false,
        text: '',
        error: `OpenRouter API error: ${response.error}`
      };
    }

    return { success: true, text: response.text };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      text: '',
      error: `OpenRouter API error: ${errorMessage}`
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
  completionHistory: Record<string, string[]>,
  provider: BigMindProvider = 'google'
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

    let responseText: string;
    
    if (provider === 'groq') {
      // Use Groq for summarization
      const groqResponse = await groq.chat.completions.create({
        model: 'openai/gpt-oss-120b',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that analyzes Big Mind Process sessions and returns structured JSON insights.'
          },
          {
            role: 'user',
            content: summarizationPrompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.3,
      });
      responseText = groqResponse.choices[0]?.message?.content || '{}';
    } else {
      // Use Google for summarization
      const googleResponse = await googleAI.models.generateContent({
        model: 'gemini-2.5-flash-lite',
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
      responseText = googleResponse.text;
    }

    const parsed = JSON.parse(responseText);

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
 * Get available providers and their status
 */
export function getAvailableProviders(): { provider: BigMindProvider; available: boolean; error?: string }[] {
  const providers: { provider: BigMindProvider; available: boolean; error?: string }[] = [];

  // Check Google provider
  if (process.env.API_KEY) {
    providers.push({ provider: 'google', available: true });
  } else {
    providers.push({ provider: 'google', available: false, error: 'API_KEY environment variable not set' });
  }

  // Check Groq provider
  if (process.env.GROQ_API_KEY) {
    providers.push({ provider: 'groq', available: true });
  } else {
    providers.push({ provider: 'groq', available: false, error: 'GROQ_API_KEY environment variable not set' });
  }

  // Check OpenRouter provider
  if (process.env.OPENROUTER_API_KEY) {
    providers.push({ provider: 'openrouter', available: true });
  } else {
    providers.push({ provider: 'openrouter', available: false, error: 'OPENROUTER_API_KEY environment variable not set' });
  }

  return providers;
}

/**
 * Get the best available provider (prefers OpenRouter/DeepSeek, then Groq, then Google)
 */
export function getBestProvider(): BigMindProvider {
  const providers = getAvailableProviders();
  const available = providers.filter(p => p.available);

  // Prefer OpenRouter/DeepSeek if available, then Groq, then Google
  if (available.some(p => p.provider === 'openrouter')) {
    return 'openrouter';
  } else if (available.some(p => p.provider === 'groq')) {
    return 'groq';
  } else if (available.some(p => p.provider === 'google')) {
    return 'google';
  }

  // Fallback to Google even if API key might be missing
  return 'google';
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
