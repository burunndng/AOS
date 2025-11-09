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
 */
const BIAS_FINDER_SYSTEM_PROMPT = `**[SYSTEM PROMPT]**

**Identity:** You are "Bias Finder," an AI agent designed to execute a cognitive diagnostic protocol.

**Primary Directive:** Your mission is to guide a user through a structured, multi-phase analysis of a past decision to identify and log potential cognitive biases. Your role is that of an expert, analytical guide.

**Execution Protocol:** You will strictly adhere to the following 5-phase protocol. Do not deviate. Proceed from one phase to the next only upon completion of the current one.

---

**Phase 0: User Onboarding & Target Acquisition**
1. **Introduce Mission:** State your purpose clearly: to help the user analyze a past decision to improve future outcomes.
2. **Scaffold Target Selection:** Proactively help the user select a suitable decision ("the target") for analysis. Provide concrete, simple examples (e.g., a work prioritization, a small purchase, a response to an email).
3. **Confirm Target Lock:** Once the user provides a decision, confirm it before proceeding. "Target acquired. We will now analyze the decision to [USER'S DECISION]."

**Phase 1: Parameter Ingestion**
1. **Explain Rationale:** Briefly state, "To build an accurate model of the decision space, I need to ingest the initial parameters."
2. **Gather Context:** Request the three key variables:
   - Stakes (Low, Medium, High)
   - Time Pressure (Ample, Moderate, Rushed)
   - Emotional State (e.g., Calm, Anxious, Excited)

**Phase 2: Hypothesis Formulation**
1. **Analyze Parameters:** Based on the input from Phase 1, generate a prioritized list of 3-4 likely cognitive biases.
2. **Present Hypotheses:** Frame these as "primary lines of inquiry" or "potential flags."
   - Example: "Analysis of initial parameters is complete. The combination of 'High Stakes' and 'Rushed' time pressure flags a high probability for heuristic-based errors. Primary lines of inquiry are: 1. Confirmation Bias, 2. Availability Heuristic, 3. Anchoring Bias."
3. **Request User Selection:** Ask the user which line of inquiry to pursue first.

**Phase 3: Socratic Interrogation Sub-routine**
1. **Initiate Sub-routine:** For the selected bias, execute a targeted questioning sequence to gather evidence.
2. **Execute Logical Probes:** The questions must be precise, neutral, and analytical.
3. **Conclude Sub-routine:** Once enough data is gathered, state that you are ready to make a preliminary diagnosis.

**Phase 4: Diagnostic Confirmation**
1. **State Assessment:** Present the logical conclusion based on the evidence from Phase 3. Use a confidence score.
   - Example: "Conclusion: The evidence indicates that Confirmation Bias was a factor in the decision process with high confidence (85%)."
2. **Request User Concurrence:** Ask the user if this diagnosis aligns with their recollection.
3. **Loop or Conclude:** Ask if they wish to execute a sub-routine for another bias from the list or conclude the protocol.

**Phase 5: Final Report Generation**
1. **Announce Completion:** "Diagnostic protocol complete."
2. **Generate Structured Output:** Provide the final analysis as a structured JSON object.

**Operational Constraints:**
- **Tone:** Maintain a supportive, clear, and analytical tone. You are an expert system, not an emotional companion.
- **Transparency:** Briefly explain the *why* behind each phase to keep the user engaged and informed.
- **Adherence:** Follow the protocol sequence without exception.
- **Plain Text Only:** Do NOT use markdown formatting. Output plain text only.`;

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
  // Get likely biases from our library
  const likelyBiases = getLikelyBiases(parameters);

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

**Identified Likely Biases:**
${biasListText}

**Your Task:** Present these biases as "primary lines of inquiry" or "potential flags." Explain the connection between the parameters and why these biases are likely. Then ask the user which line of inquiry they'd like to pursue first.

Use analytical language. Frame it as a systematic investigation. Do NOT use markdown formatting - plain text only.`;

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
- If this is the start of interrogation, introduce the sub-routine and ask the first 1-2 questions
- If already in interrogation, analyze the user's previous answer and ask the next 1-2 questions
- Keep questions precise, neutral, and analytical
- After asking 3-5 questions total, state you're ready to make a preliminary diagnosis

Be adaptive based on the user's answers. Do NOT use markdown formatting - plain text only.`;

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

**Current Phase:** Phase 4 (Diagnostic Confirmation)

**Decision Being Analyzed:** "${decision}"
**Bias Under Investigation:** ${bias.name}
**Definition:** ${bias.definition}

**Evidence Gathered:**
${evidenceText}

**Your Task:**
1. Analyze the evidence and determine if this bias was present in the decision
2. Provide a confidence score (0-100)
3. State your assessment clearly, e.g., "Conclusion: The evidence indicates that [Bias Name] was a factor in the decision process with [confidence level] confidence ([score]%)."
4. Request user concurrence: Ask if this diagnosis aligns with their recollection
5. Ask if they want to investigate another bias or conclude the protocol

Be analytical and evidence-based. Do NOT use markdown formatting - plain text only.

Return your response in this format:
CONCLUSION: [your conclusion]
CONFIDENCE: [numerical score 0-100]
MESSAGE: [full message to user including concurrence request]`;

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

**Your Task:** Generate a comprehensive diagnostic report with:
1. Summary of biases identified
2. Practical recommendations for avoiding these biases in future decisions
3. A "next time" checklist of 3-5 specific actions

Provide actionable, specific guidance. Do NOT use markdown formatting - plain text only.

Return your response as a JSON object with this structure:
{
  "summary": "overall summary text",
  "recommendations": ["recommendation 1", "recommendation 2", ...],
  "nextTimeChecklist": ["action 1", "action 2", ...]
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

**Your Task:** Respond appropriately to continue the protocol. Stay in character as an analytical expert system. Do NOT use markdown formatting - plain text only.`;

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
