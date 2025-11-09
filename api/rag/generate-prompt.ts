/**
 * RAG Prompt Generation Module
 * Creates context-aware prompts for Gemini API using retrieved documents
 */

import type {
  RAGContext,
  RAGPrompt,
  UserHistory,
  QueryResult,
  GenerationRequest,
} from '../lib/types.js';
import { retrieveContext } from './retrieve.js';

/**
 * Generate a RAG prompt for recommendations
 */
export async function generateRecommendationPrompt(
  request: GenerationRequest,
): Promise<RAGPrompt> {
  const context = await retrieveContext(request);

  const systemPrompt = buildSystemPrompt('recommendation');
  const userPrompt = buildUserPrompt(request, context, 'recommendation');

  return {
    system: systemPrompt,
    user: userPrompt,
    context: {
      practices: context.retrievedPractices,
      frameworks: context.retrievedFrameworks,
      userProfile: context.userHistory,
      userInsights: context.relevantInsights,
    },
  };
}

/**
 * Generate a RAG prompt for personalized insights
 */
export async function generateInsightPrompt(
  request: GenerationRequest,
): Promise<RAGPrompt> {
  const context = await retrieveContext(request);

  const systemPrompt = buildSystemPrompt('insight');
  const userPrompt = buildUserPrompt(request, context, 'insight');

  return {
    system: systemPrompt,
    user: userPrompt,
    context: {
      practices: context.retrievedPractices,
      frameworks: context.retrievedFrameworks,
      userProfile: context.userHistory,
      userInsights: context.relevantInsights,
    },
  };
}

/**
 * Generate a RAG prompt for practice personalization
 */
export async function generatePersonalizationPrompt(
  request: GenerationRequest,
  practiceTitle: string,
): Promise<RAGPrompt> {
  const context = await retrieveContext(request);

  const systemPrompt = buildSystemPrompt('personalization');
  const userPrompt = buildUserPromptForPersonalization(request, context, practiceTitle);

  return {
    system: systemPrompt,
    user: userPrompt,
    context: {
      practices: context.retrievedPractices,
      frameworks: context.retrievedFrameworks,
      userProfile: context.userHistory,
      userInsights: context.relevantInsights,
    },
  };
}

/**
 * Build system prompt based on request type
 */
function buildSystemPrompt(type: 'recommendation' | 'insight' | 'personalization'): string {
  const basePrompt = `You are an expert personal development coach specializing in integral transformation,
bias awareness, somatic practices, and consciousness development. You provide evidence-based,
personalized guidance grounded in practices from the Integral Life Practice framework.`;

  const typeSpecificPrompts: Record<string, string> = {
    recommendation: `${basePrompt}

Your task is to provide personalized practice recommendations based on:
1. The user's demonstrated needs and interests
2. Their current developmental stage and attachment style
3. Identified cognitive biases affecting their decisions
4. Their practice history and preferences

Recommendations should be:
- Highly specific and actionable
- Grounded in evidence-based practices
- Tailored to the user's current capacity and preferences
- Sequenced for optimal integration
- Include clear reasoning for why each practice is recommended

Format: JSON with structure { recommendations: [{ practice, reasoning, difficulty, estimatedTime }], keyInsights: [] }`,

    insight: `${basePrompt}

Your task is to generate personalized insights that help the user:
1. Understand their deeper patterns and blind spots
2. Connect their immediate concerns to larger developmental arcs
3. Recognize opportunities for growth
4. See how different practices and frameworks support their evolution

Insights should be:
- Profound yet accessible
- Grounded in the frameworks and practices the user is exploring
- Respectful of their current capacity
- Actionable and empowering

Format: JSON with structure { insights: [{ insight, relatedPractices, frameworkContext }], actionableSteps: [] }`,

    personalization: `${basePrompt}

Your task is to personalize a specific practice for the user by:
1. Adapting it to their unique circumstances and constraints
2. Making it resonate with their identified learning modalities
3. Integrating it with their current stack and developmental work
4. Addressing any obvious obstacles or resistance

Personalizations should:
- Maintain the practice's core benefits and mechanisms
- Make it immediately more relevant and doable
- Include specific adaptations for their unique situation
- Suggest integration points with other practices

Format: JSON with structure { personalizedSteps: [{ step, adaptation, rationale }], commonPitfalls: [], successIndicators: [] }`,
  };

  return typeSpecificPrompts[type] || basePrompt;
}

/**
 * Build user prompt with context
 */
function buildUserPrompt(
  request: GenerationRequest,
  context: RAGContext,
  type: 'recommendation' | 'insight',
): string {
  const { query } = request;
  const { userHistory, retrievedPractices, retrievedFrameworks } = context;

  const userContext = formatUserContext(userHistory);
  const practicesContext = formatRetrievedPractices(retrievedPractices);
  const frameworksContext = formatRetrievedFrameworks(retrievedFrameworks);

  return `
## User Profile
${userContext}

## Retrieved Relevant Practices
${practicesContext}

## Relevant Frameworks
${frameworksContext}

## User Query / Needs
${query}

Please provide thoughtful, personalized ${type}s based on this context. Be specific and grounded in the practices and frameworks mentioned.
`;
}

/**
 * Build user prompt for practice personalization
 */
function buildUserPromptForPersonalization(
  request: GenerationRequest,
  context: RAGContext,
  practiceTitle: string,
): string {
  const { userHistory, retrievedPractices } = context;

  const userContext = formatUserContext(userHistory);
  const practiceDetails = retrievedPractices[0]; // The main practice being personalized

  return `
## User Profile
${userContext}

## Practice to Personalize
Title: ${practiceTitle}
${practiceDetails ? `Description: ${practiceDetails.metadata.description || 'N/A'}` : ''}
${practiceDetails ? `Difficulty: ${practiceDetails.metadata.difficulty || 'N/A'}` : ''}

## User's Specific Request
${request.query}

Please provide personalized steps and adaptations for this practice tailored to this specific user.
`;
}

/**
 * Format user context for prompt
 */
function formatUserContext(userHistory: UserHistory): string {
  const lines: string[] = [];

  lines.push(`**Completed Practices**: ${userHistory.completedPractices.join(', ') || 'None yet'}`);

  if (userHistory.attachmentStyle) {
    lines.push(`**Attachment Style**: ${userHistory.attachmentStyle}`);
  }

  if (userHistory.developmentalStage) {
    lines.push(`**Developmental Stage (Kegan)**: ${userHistory.developmentalStage}`);
  }

  if (userHistory.biases.length > 0) {
    lines.push(`**Identified Biases**: ${userHistory.biases.slice(0, 5).join(', ')}`);
  }

  if (userHistory.preferences.preferredModalities.length > 0) {
    lines.push(`**Learning Modalities**: ${userHistory.preferences.preferredModalities.join(', ')}`);
  }

  if (userHistory.preferences.focusAreas.length > 0) {
    lines.push(`**Current Focus Areas**: ${userHistory.preferences.focusAreas.join(', ')}`);
  }

  return lines.join('\n');
}

/**
 * Format retrieved practices for prompt
 */
function formatRetrievedPractices(practices: QueryResult[]): string {
  if (practices.length === 0) {
    return 'No relevant practices found.';
  }

  return practices
    .slice(0, 5)
    .map(
      (p, i) => `
${i + 1}. **${p.metadata.practiceTitle || p.id}** (Relevance: ${(p.score * 100).toFixed(0)}%)
   - Difficulty: ${p.metadata.difficulty || 'N/A'}
   - Duration: ${p.metadata.duration || 'N/A'} min
   - Evidence: ${p.metadata.evidence?.slice(0, 2).join('; ') || 'N/A'}
   - ROI: ${p.metadata.roi || 'N/A'}
`,
    )
    .join('\n');
}

/**
 * Format retrieved frameworks for prompt
 */
function formatRetrievedFrameworks(frameworks: QueryResult[]): string {
  if (frameworks.length === 0) {
    return 'No relevant frameworks found.';
  }

  return frameworks
    .slice(0, 3)
    .map(
      (f, i) => `
${i + 1}. **${f.metadata.frameworkType || f.id}** (Relevance: ${(f.score * 100).toFixed(0)}%)
   - Description: ${f.metadata.description || 'N/A'}
`,
    )
    .join('\n');
}

/**
 * Build a multi-stage prompt for complex reasoning
 */
export function buildMultiStagePrompt(
  stage: 'analysis' | 'synthesis' | 'action',
  context: RAGContext,
  previousAnalysis?: string,
): string {
  const stagePrompts: Record<string, string> = {
    analysis: `Analyze the user's situation deeply, considering:
- Their patterns and tendencies
- The frameworks and practices most relevant to them
- Their current developmental edge
- Potential blind spots or resistance

Provide a structured analysis.`,

    synthesis: `Building on this analysis:
${previousAnalysis || ''}

Synthesize recommendations that:
- Address root causes, not just symptoms
- Build on their strengths
- Honor their current capacity
- Create an integrated development path`,

    action: `From this synthesis, create:
- Specific, sequenced practices
- Clear success metrics
- Expected obstacles and how to navigate them
- How to integrate these with existing work`,
  };

  return stagePrompts[stage] || '';
}

/**
 * Health check for prompt generation
 */
export async function healthCheck(): Promise<{ status: 'ok' | 'error'; message: string }> {
  try {
    const testRequest: GenerationRequest = {
      userId: 'test-user',
      type: 'recommendation',
      query: 'test query',
    };

    const prompt = await generateRecommendationPrompt(testRequest);

    if (prompt.system && prompt.user && prompt.context) {
      return { status: 'ok', message: 'Prompt generation service is healthy' };
    }

    return { status: 'error', message: 'Prompt generation produced invalid output' };
  } catch (error) {
    return { status: 'error', message: `Prompt generation error: ${error}` };
  }
}
