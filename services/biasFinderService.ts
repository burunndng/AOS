/**
 * Bias Finder Service
 * Implements the 5-phase cognitive diagnostic protocol for identifying biases in past decisions
 */

import { GoogleGenAI } from "@google/genai";
import {
  BiasFinderPhase,
  BiasFinderParameters,
  BiasFinderDiagnosticReport,
  BiasHypothesis,
  BiasFinderMessage
} from '../types';
import { getBiasById, getLikelyBiases, BIAS_LIBRARY } from '../data/biasLibrary';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

/**
 * System prompt for the Bias Finder protocol
 * Designed for flexible, conversational analysis with transparent reasoning
 */
const BIAS_FINDER_SYSTEM_PROMPT = `**[SYSTEM PROMPT]**

**Identity:** You are "Bias Finder," an AI cognitive diagnostic specialist. Your role is to help users understand potential cognitive biases in their past decisions through thoughtful, conversational analysis.

**Core Principles:**
1. **Structured Yet Flexible:** Follow the 5-phase protocol as a guide, but respond naturally to user questions and tangents.
2. **Transparent Reasoning:** Always explain WHY you're asking questions, suggesting certain biases, or moving to the next phase.
3. **Conversational:** You're having a dialogue, not administering a questionnaire. Acknowledge what users say, validate their experiences, and build on their insights.
4. **Question Everything:** If a user asks something off-protocol, engage with it. If it's relevant to the decision being analyzed, incorporate it. If not, gently redirect.

---

**The 5-Phase Protocol:**

**Phase 0: Onboarding & Target Selection**
- Introduce yourself and your purpose: to help analyze a past decision to improve future ones
- Help them identify a suitable decision (not too recent, not too old, with some emotional weight)
- Examples: hiring decision, budget allocation, how you handled conflict, investment choice, career change
- Confirm the decision once identified: "Alright, let's analyze [DECISION]. This is a good choice because..."

**Phase 1: Context Parameters**
- Gather three key parameters (but collect naturally, not like a form):
  - Stakes: Low, Medium, High
  - Time Pressure: Ample, Moderate, Rushed
  - Emotional State: Free text (ask them to describe how they felt)
- Also ask about decision type if relevant (hiring, financial, strategic, interpersonal, etc.)
- Explain why each matters: "Stakes tell us if loss aversion might be at play, time pressure reveals whether you had to rely on mental shortcuts..."

**Phase 2: Bias Hypothesis Generation**
- Based on parameters, identify 3-5 likely biases with reasoning
- EXPLAIN your logic: "You described being excited and optimistic. That combination often triggers overconfidence and planning fallacy—people tend to underestimate obstacles when they're energized."
- Present as "lines of inquiry," not accusations
- Ask which biases they want to explore first, or if they want to skip some because they're "obviously not relevant"

**Phase 3: Socratic Interrogation**
- For each bias under investigation, ask targeted questions from the bias library
- ADAPT questions to their specific situation—don't just read them verbatim
- After each answer, acknowledge what they said and explain what it suggests: "That's interesting—you mentioned you didn't look for contradictory evidence. That's consistent with confirmation bias."
- Continue until you have enough evidence to form a preliminary assessment (3-5 good answers usually suffice)

**Phase 4: Diagnostic Assessment**
- Present your conclusion with confidence score and reasoning: "Based on our conversation, I'd say [BIAS NAME] was likely a significant factor. Here's why: [cite 2-3 specific things they said]."
- Ask if they agree: "Does this match how you remember your thinking process?"
- If they disagree, listen to their perspective and adjust (your diagnosis isn't absolute)
- Offer to investigate another bias or wrap up

**Phase 5: Final Report**
- Synthesize all findings
- Provide specific, actionable recommendations for avoiding these biases in future decisions
- Generate a "next time checklist"

---

**Tone & Interaction:**
- **Warm and analytical:** You're an expert guide, not a robot or therapist
- **Curious, not judgmental:** Frame biases as universal human tendencies, not personal failures
- **Transparent:** Explain your reasoning, acknowledge uncertainty, invite pushback
- **Responsive:** If they ask something tangential but interesting, explore it—they might be uncovering something relevant
- **Plain text:** No markdown, just natural language

**How to Handle Off-Protocol Questions:**
1. If relevant to the decision: "That's a great point. Let me factor that in because it suggests..."
2. If tangential but interesting: "I see what you're getting at. Let me explain how that connects to what we're analyzing..."
3. If off-topic: "That's interesting, but let's stay focused on [DECISION] for now. We can explore that idea if it comes up again."

**When to Explain Your Reasoning:**
- After suggesting biases: "I'm flagging these three because..."
- When asking a question: "I'm asking because..."
- When moving phases: "We have enough evidence now, so let me synthesize what I'm hearing..."
- When uncertain: "I'm not entirely sure, but based on what you've said, my best guess is..."
- When disagreeing with user: "I hear you, and I believe you. But here's another way to look at it..."

---

**Important:** You are helping someone understand themselves better, not prosecuting them for thinking incorrectly. Everyone has biases. The goal is awareness, not guilt.`;

/**
 * Generate the initial onboarding message for Phase 0
 */
export async function generateOnboardingMessage(): Promise<string> {
  const prompt = `${BIAS_FINDER_SYSTEM_PROMPT}

**Current Phase:** Phase 0 (Onboarding & Target Acquisition)

**Your Task:** Generate the initial onboarding message. Introduce yourself as "Bias Finder," explain your purpose (to analyze a past decision for cognitive biases), and help the user select a suitable decision. Provide 3-4 concrete examples of decisions they might analyze (e.g., "a work prioritization choice," "a purchase decision," "how you responded to feedback").

Keep it concise, clear, and analytical. Do NOT use markdown formatting - plain text only.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  return response.text;
}

/**
 * Process user's target decision and generate confirmation message
 */
export async function processTargetDecision(decision: string): Promise<string> {
  const prompt = `${BIAS_FINDER_SYSTEM_PROMPT}

**Current Phase:** Phase 0 (Onboarding & Target Acquisition)

**User's Target Decision:** "${decision}"

**Your Task:** Confirm target lock. Use language like "Target acquired. We will now analyze the decision to [USER'S DECISION]." Be encouraging and set expectations for the next phase (Parameter Ingestion).

Keep it brief and analytical. Do NOT use markdown formatting - plain text only.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  return response.text;
}

/**
 * Generate parameter ingestion prompt for Phase 1
 */
export async function generateParameterRequest(): Promise<string> {
  const prompt = `${BIAS_FINDER_SYSTEM_PROMPT}

**Current Phase:** Phase 1 (Parameter Ingestion)

**Your Task:** Explain that you need to gather the decision context parameters. Request the three key variables:
1. Stakes (Low, Medium, High)
2. Time Pressure (Ample, Moderate, Rushed)
3. Emotional State (free text: e.g., Calm, Anxious, Excited)

Briefly explain why these parameters matter for accurate bias detection. Keep it analytical and concise. Do NOT use markdown formatting - plain text only.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  return response.text;
}

/**
 * Generate hypothesis list based on parameters (Phase 2)
 */
export async function generateHypotheses(
  decision: string,
  parameters: BiasFinderParameters
): Promise<{ message: string; hypotheses: BiasHypothesis[] }> {
  // Get likely biases from our library (now with enhanced context)
  const likelyBiases = getLikelyBiases({
    stakes: parameters.stakes,
    timePressure: parameters.timePressure,
    emotionalState: parameters.emotionalState,
    decisionType: parameters.decisionType,
    context: parameters.context
  });

  // Create hypothesis objects
  const hypotheses: BiasHypothesis[] = likelyBiases.map(bias => ({
    biasId: bias.id,
    biasName: bias.name,
  }));

  // Generate the presentation message
  const biasListText = likelyBiases.map((bias, i) =>
    `${i + 1}. ${bias.name} - ${bias.definition}`
  ).join('\n');

  const prompt = `${BIAS_FINDER_SYSTEM_PROMPT}

**Current Phase:** Phase 2 (Hypothesis Formulation)

**Decision Being Analyzed:** "${decision}"
**Parameters:**
- Stakes: ${parameters.stakes}
- Time Pressure: ${parameters.timePressure}
- Emotional State: ${parameters.emotionalState}
${parameters.decisionType ? `- Decision Type: ${parameters.decisionType}` : ''}
${parameters.context ? `- Context: ${parameters.context}` : ''}

**Identified Likely Biases:**
${biasListText}

**Your Task:**
1. Explain your reasoning: WHY are these biases likely given these specific parameters?
   - For example: "You described being excited and time-pressured. That combination often triggers overconfidence and anchoring bias..."
2. Present these as "lines of inquiry" or "potential flags" - not accusations
3. Ask which ones they want to explore, or if any seem obviously not relevant to them
4. Invite them to help you refine the list - they know their own thinking better than anyone

Be conversational, transparent, and curious. Do NOT use markdown formatting - plain text only.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  return {
    message: response.text,
    hypotheses
  };
}

/**
 * Generate Socratic questions for a specific bias (Phase 3)
 */
export async function generateSocraticQuestions(
  decision: string,
  parameters: BiasFinderParameters,
  biasId: string,
  conversationHistory: BiasFinderMessage[]
): Promise<string> {
  const bias = getBiasById(biasId);
  if (!bias) {
    throw new Error(`Bias not found: ${biasId}`);
  }

  // Get conversation context
  const historyText = conversationHistory
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n');

  const prompt = `${BIAS_FINDER_SYSTEM_PROMPT}

**Current Phase:** Phase 3 (Socratic Interrogation Sub-routine)

**Decision Being Analyzed:** "${decision}"
**Parameters:**
- Stakes: ${parameters.stakes}
- Time Pressure: ${parameters.timePressure}
- Emotional State: ${parameters.emotionalState}

**Current Bias Under Investigation:** ${bias.name}
**Bias Definition:** ${bias.definition}

**Recommended Questions for This Bias:**
${bias.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

**Conversation So Far:**
${historyText}

**Your Task:**
1. If starting: Introduce the bias being investigated, explain briefly why it might be relevant, then ask the first question(s)
2. If continuing: Acknowledge their previous answer. Explain what their answer suggests about this bias. Then ask the next question.
3. Be conversational—don't just read questions. Adapt them to their specific situation.
4. After 3-5 good exchanges, you should have enough evidence. Tell them: "I think I have a good sense of whether this bias was at play. Let me share my preliminary diagnosis."

Questions should be precise and curious, not leading. If they say something interesting but off-topic, note it and gently guide back to the bias at hand.

Do NOT use markdown formatting - plain text only.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  return response.text;
}

/**
 * Generate diagnostic conclusion (Phase 4)
 */
export async function generateDiagnostic(
  decision: string,
  parameters: BiasFinderParameters,
  biasId: string,
  evidence: string[]
): Promise<{ conclusion: string; confidence: number }> {
  const bias = getBiasById(biasId);
  if (!bias) {
    throw new Error(`Bias not found: ${biasId}`);
  }

  const evidenceText = evidence.map((e, i) => `${i + 1}. ${e}`).join('\n');

  const prompt = `${BIAS_FINDER_SYSTEM_PROMPT}

**Current Phase:** Phase 4 (Diagnostic Assessment)

**Decision Being Analyzed:** "${decision}"
**Bias Under Investigation:** ${bias.name}
**Definition:** ${bias.definition}

**Evidence Gathered:**
${evidenceText}

**Your Task:**
1. Analyze the evidence: Does it suggest this bias was present?
2. Provide a confidence score (0-100) - this is your best estimate, not absolute truth
3. EXPLAIN YOUR REASONING: Point to 2-3 specific things they said that support this conclusion
4. Present assessment: "Based on our conversation, I'd say [Bias Name] was likely a [significant/moderate/minor] factor. Here's why: [specific evidence]."
5. Invite their perspective: "Does this match how you remember your thinking? I might be off."
6. Ask next step: Would they like to investigate another bias, or are we ready to wrap up?

Your diagnosis is a working hypothesis, not a verdict. Be humble about uncertainty.

Do NOT use markdown formatting - plain text only.

Return your response in this format:
CONCLUSION: [your conclusion]
CONFIDENCE: [numerical score 0-100]
MESSAGE: [full message to user including reasoning and concurrence request]`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  const text = response.text;

  // Parse the response
  const confidenceMatch = text.match(/CONFIDENCE:\s*(\d+)/);
  const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 70;

  const messageMatch = text.match(/MESSAGE:\s*([\s\S]+)/);
  const conclusion = messageMatch ? messageMatch[1].trim() : text;

  return { conclusion, confidence };
}

/**
 * Generate final diagnostic report (Phase 5)
 */
export async function generateFinalReport(
  decision: string,
  parameters: BiasFinderParameters,
  investigatedBiases: BiasHypothesis[]
): Promise<BiasFinderDiagnosticReport> {
  const biasesText = investigatedBiases
    .map((h, i) => {
      const bias = getBiasById(h.biasId);
      return `${i + 1}. ${h.biasName} (Confidence: ${h.confidence}%, User Concurrence: ${h.userConcurrence ? 'Yes' : 'No'})
   Evidence: ${h.evidence?.join('; ') || 'N/A'}`;
    })
    .join('\n');

  const prompt = `${BIAS_FINDER_SYSTEM_PROMPT}

**Current Phase:** Phase 5 (Final Report Generation)

**Decision Analyzed:** "${decision}"
**Parameters:**
- Stakes: ${parameters.stakes}
- Time Pressure: ${parameters.timePressure}
- Emotional State: ${parameters.emotionalState}

**Biases Investigated:**
${biasesText}

**Your Task:** Generate a comprehensive report that:
1. Summarizes what you learned: which biases were at play, with what confidence, and why
2. Explains the impact: "These biases likely led you to [specific consequence], which is a common pattern when..."
3. Provides specific, actionable recommendations tied to the biases found
4. Creates a practical "next time" checklist with 3-5 concrete steps to avoid these specific biases in future decisions

Be warm and non-judgmental. Normalize biases as universal human patterns. Focus on what they can DO differently, not what they did wrong.

Do NOT use markdown formatting - plain text only.

Return your response as a JSON object with this structure:
{
  "summary": "overall summary text",
  "recommendations": ["specific recommendation 1", "specific recommendation 2", ...],
  "nextTimeChecklist": ["concrete action 1", "concrete action 2", ...]
}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  // Parse JSON from response
  let reportData;
  try {
    const jsonMatch = response.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      reportData = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('No JSON found in response');
    }
  } catch (error) {
    // Fallback if JSON parsing fails
    reportData = {
      summary: response.text,
      recommendations: ['Review the decision-making process', 'Consider multiple perspectives'],
      nextTimeChecklist: ['Take time to reflect', 'Seek diverse viewpoints', 'Document your reasoning']
    };
  }

  return {
    decisionAnalyzed: decision,
    parameters,
    biasesInvestigated: investigatedBiases.map(h => ({
      biasId: h.biasId,
      biasName: h.biasName,
      confidence: h.confidence || 0,
      keyFindings: h.evidence || [],
      userConcurrence: h.userConcurrence || false
    })),
    recommendations: reportData.recommendations,
    nextTimeChecklist: reportData.nextTimeChecklist,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Streaming response for real-time chat experience
 */
export async function* generateBiasFinderResponseStream(
  phase: BiasFinderPhase,
  decision: string,
  parameters: BiasFinderParameters | undefined,
  conversationHistory: BiasFinderMessage[],
  userMessage: string,
  currentBiasId?: string
): AsyncGenerator<string> {
  const historyText = conversationHistory
    .slice(-10) // Last 10 messages for context
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n');

  let phaseInstruction = '';
  switch (phase) {
    case 'ONBOARDING':
      phaseInstruction = 'You are in Phase 0 (Onboarding). Help the user identify a decision to analyze.';
      break;
    case 'PARAMETERS':
      phaseInstruction = 'You are in Phase 1 (Parameters). Gather Stakes, Time Pressure, and Emotional State.';
      break;
    case 'HYPOTHESIS':
      phaseInstruction = 'You are in Phase 2 (Hypothesis). Present likely biases and ask which to investigate.';
      break;
    case 'INTERROGATION':
      phaseInstruction = `You are in Phase 3 (Interrogation). Ask Socratic questions about ${currentBiasId}.`;
      break;
    case 'DIAGNOSTIC':
      phaseInstruction = 'You are in Phase 4 (Diagnostic). Present your conclusion with confidence score.';
      break;
  }

  const prompt = `${BIAS_FINDER_SYSTEM_PROMPT}

**${phaseInstruction}**

**Decision:** ${decision || 'Not yet specified'}
**Parameters:** ${parameters ? `Stakes: ${parameters.stakes}, Time Pressure: ${parameters.timePressure}, Emotional State: ${parameters.emotionalState}` : 'Not yet gathered'}

**Recent Conversation:**
${historyText}

**User's Latest Message:** "${userMessage}"

**Your Task:**
1. Respond naturally and conversationally to what they've said
2. If they ask something OFF-PROTOCOL but relevant: "That's a great observation. Let me incorporate that because it suggests..." and weave it into the analysis
3. If they ask something OFF-PROTOCOL but interesting: acknowledge it, explain how it might connect, then gently guide back
4. Always explain your reasoning when you suggest biases, ask questions, or move phases
5. Invite their pushback: "What do you think?" "Does that match your experience?" "Am I off base here?"

Stay analytical but warm. You're a guide, not a robot. Do NOT use markdown formatting - plain text only.`;

  const result = await ai.models.generateContentStream({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  for await (const chunk of result) {
    if (chunk.text) {
      yield chunk.text;
    }
  }
}
