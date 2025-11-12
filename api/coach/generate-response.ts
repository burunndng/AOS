/**
 * AI Practice Coach Backend API with Upstash Vector Integration
 * Enhances coach responses with semantic search, user history, and personalized context
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateEmbedding } from '../lib/embeddings.ts';
import { semanticSearch } from '../lib/upstash-vector.ts';
import { getDatabase } from '../lib/db.ts';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

interface CoachRequest {
  userId: string;
  message: string;
  practiceStack: Array<{
    id: string;
    name: string;
    module?: string;
  }>;
  completedCount: number;
  completionRate: number;
  timeCommitment: number;
  timeIndicator: string;
  modules: Record<string, { name: string; count: number }>;
  practiceNotes: Record<string, string>;
  dailyNotes: Record<string, string>;
}

interface CoachResponse {
  response: string;
  suggestedPractices?: Array<{
    id: string;
    name: string;
    reason: string;
    similarity: number;
  }>;
  relevantInsights?: string[];
  userContext?: {
    developmentalStage?: string;
    attachmentStyle?: string;
    identifiedBiases?: string[];
  };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,OPTIONS,PATCH,DELETE,POST,PUT',
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    console.log('[Coach API] Received request:', {
      method: req.method,
      hasBody: !!req.body,
      bodyKeys: req.body ? Object.keys(req.body) : [],
    });

    const coachRequest = req.body as CoachRequest;
    const {
      userId,
      message,
      practiceStack,
      completedCount,
      completionRate,
      timeCommitment,
      timeIndicator,
      modules,
      practiceNotes,
      dailyNotes,
    } = coachRequest;

    if (!userId || !message) {
      console.error('[Coach API] Missing required fields:', { userId: !!userId, message: !!message });
      res.status(400).json({ error: 'Missing required fields: userId, message' });
      return;
    }

    console.log(`[Coach API] Processing request for user ${userId}: "${message}"`);

    // 1. Get user profile and history
    let userProfile;
    try {
      const db = getDatabase();
      userProfile = await db.getUserProfile(userId);
    } catch (error) {
      console.error('[Coach API] Error getting user profile:', error);
      userProfile = null;
    }

    // 2. Generate embedding and perform semantic search (optional - gracefully degrade if fails)
    let relevantPractices: any[] = [];
    let relevantFrameworks: any[] = [];

    try {
      const messageEmbedding = await generateEmbedding(message);

      // 3. Semantic search for relevant practices using Upstash Vector
      try {
        relevantPractices = await semanticSearch(messageEmbedding, {
          topK: 5,
          type: 'practice',
          minSimilarity: 0.6,
        });
        console.log(`[Coach API] Found ${relevantPractices.length} relevant practices`);
      } catch (error) {
        console.error('[Coach API] Error in practice semantic search:', error);
      }

      // 4. Semantic search for relevant frameworks/insights
      try {
        relevantFrameworks = await semanticSearch(messageEmbedding, {
          topK: 3,
          type: 'framework',
          minSimilarity: 0.65,
        });
        console.log(`[Coach API] Found ${relevantFrameworks.length} relevant frameworks`);
      } catch (error) {
        console.error('[Coach API] Error in framework semantic search:', error);
      }
    } catch (error) {
      console.error('[Coach API] Error generating embedding:', error);
    }

    // 5. Build enhanced context
    const today = new Date().toISOString().split('T')[0];
    const stackContext =
      practiceStack.length > 0
        ? `Current practice stack:\n${practiceStack
            .map((p) => {
              const generalNote = practiceNotes[p.id]
                ? ` (General note: "${practiceNotes[p.id]}")`
                : '';
              const dailyNoteKey = `${p.id}-${today}`;
              const todayNote = dailyNotes[dailyNoteKey]
                ? ` (Today's note: "${dailyNotes[dailyNoteKey]}")`
                : '';
              return `- ${p.name}${generalNote}${todayNote}`;
            })
            .join('\n')}`
        : 'User has not selected any practices yet.';

    const moduleBreakdown = Object.entries(modules)
      .map(([key, mod]) => (mod.count > 0 ? `${mod.name}: ${mod.count}` : null))
      .filter(Boolean)
      .join(', ');

    const completionContext =
      practiceStack.length > 0
        ? `Completion status today: ${completedCount}/${practiceStack.length} practices marked complete (${completionRate}%).`
        : '';

    const timeContext = `Total weekly commitment: ${timeCommitment.toFixed(1)} hours (${timeIndicator}).`;

    // 6. Build user context from profile
    const userContext: string[] = [];
    if (userProfile?.developmentalStage) {
      userContext.push(
        `Developmental stage: ${userProfile.developmentalStage}`,
      );
    }
    if (userProfile?.attachmentStyle) {
      userContext.push(`Attachment style: ${userProfile.attachmentStyle}`);
    }
    if (userProfile?.identifiedBiases && userProfile.identifiedBiases.length > 0) {
      userContext.push(
        `Identified biases: ${userProfile.identifiedBiases.join(', ')}`,
      );
    }

    // 7. Build relevant practices context from vector search
    const suggestedPracticesContext =
      relevantPractices.length > 0
        ? `\nRelevant practices from knowledge base (based on semantic similarity to your question):\n${relevantPractices
            .map(
              (p, i) =>
                `${i + 1}. ${p.metadata.practiceTitle || 'Practice'} (${p.metadata.category || 'general'}) - Similarity: ${(p.score * 100).toFixed(1)}%\n   Description: ${p.metadata.description || 'No description'}`,
            )
            .join('\n')}`
        : '';

    // 8. Build frameworks context from vector search
    const frameworksContext =
      relevantFrameworks.length > 0
        ? `\nRelevant frameworks/insights:\n${relevantFrameworks
            .map(
              (f, i) =>
                `${i + 1}. ${f.metadata.frameworkType || 'Framework'} - ${f.metadata.description || 'No description'}`,
            )
            .join('\n')}`
        : '';

    // 9. Generate AI response with enhanced prompt
    const enhancedPrompt = `You are an intelligent ILP (Integrative Life Practices) coach with access to a comprehensive knowledge base. You're helping someone build and sustain transformative life practices.

User's current context:
- ${stackContext}
- Modules breakdown: ${moduleBreakdown || 'None selected yet'}
- ${completionContext}
- ${timeContext}
${userContext.length > 0 ? `- User profile: ${userContext.join('; ')}` : ''}
${suggestedPracticesContext}
${frameworksContext}

The user just asked: "${message}"

Guidelines:
- Be conversational, warm, and grounded in their actual selections. Pay close attention to any general and daily user notes on their practices, as they are critical context.
- If they ask for the "why" of practices, explain the research and benefits.
- If they're struggling (especially if mentioned in notes), suggest making it smaller or easier.
- If they're motivated, suggest adding one more practice.
- **If relevant practices were found in the knowledge base above, you can reference them specifically and explain why they might be helpful.**
- **Consider their developmental stage, attachment style, and identified biases when making suggestions.**
- Keep responses to 2-4 sentences. Be direct and authentic.
- If you suggest a specific practice from the knowledge base, be specific about WHY it's relevant to their question or situation.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: enhancedPrompt,
    });

    const coachResponseText = response.text;

    // 10. Format suggested practices for frontend
    const suggestedPractices = relevantPractices.map((p) => ({
      id: p.id,
      name: p.metadata.practiceTitle || 'Practice',
      reason: p.metadata.description || 'Recommended based on your question',
      similarity: p.score,
    }));

    // 11. Format relevant insights
    const relevantInsights: string[] = [];
    if (userProfile?.developmentalStage) {
      relevantInsights.push(
        `Your ${userProfile.developmentalStage} stage suggests practices that support your growth edge.`,
      );
    }
    if (userProfile?.identifiedBiases && userProfile.identifiedBiases.length > 0) {
      relevantInsights.push(
        `Consider how these recommendations address your identified biases: ${userProfile.identifiedBiases.join(', ')}.`,
      );
    }

    const coachResponse: CoachResponse = {
      response: coachResponseText,
      suggestedPractices: suggestedPractices.length > 0 ? suggestedPractices : undefined,
      relevantInsights: relevantInsights.length > 0 ? relevantInsights : undefined,
      userContext: {
        developmentalStage: userProfile?.developmentalStage,
        attachmentStyle: userProfile?.attachmentStyle,
        identifiedBiases: userProfile?.identifiedBiases,
      },
    };

    console.log(`[Coach API] Successfully generated response for user ${userId}`);
    console.log(`[Coach API] Found ${suggestedPractices.length} relevant practices via Upstash Vector`);

    res.status(200).json(coachResponse);
  } catch (error) {
    console.error('[Coach API] Error:', error);
    res.status(500).json({
      error: 'Failed to generate coach response',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
