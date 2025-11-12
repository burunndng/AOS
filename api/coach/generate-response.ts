/**
 * AI Practice Coach Backend API with Upstash RAG Chat
 * Uses @upstash/rag-chat for intelligent, context-aware coaching with built-in vector search
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { RAGChat, google } from '@upstash/rag-chat';
import { Index } from '@upstash/vector';
import { Redis } from '@upstash/redis';
import { getDatabase } from '../lib/db.ts';

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
    console.log('[Coach API] Received request');

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
      console.error('[Coach API] Missing required fields');
      res.status(400).json({ error: 'Missing required fields: userId, message' });
      return;
    }

    console.log(`[Coach API] Processing request for user ${userId}: "${message}"`);

    // Get user profile for additional context
    let userProfile;
    try {
      const db = getDatabase();
      userProfile = await db.getUserProfile(userId);
    } catch (error) {
      console.error('[Coach API] Error getting user profile:', error);
      userProfile = null;
    }

    // Build rich context about the user's current state
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

    // Build user profile context
    const userContext: string[] = [];
    if (userProfile?.developmentalStage) {
      userContext.push(`Developmental stage: ${userProfile.developmentalStage}`);
    }
    if (userProfile?.attachmentStyle) {
      userContext.push(`Attachment style: ${userProfile.attachmentStyle}`);
    }
    if (userProfile?.identifiedBiases && userProfile.identifiedBiases.length > 0) {
      userContext.push(`Identified biases: ${userProfile.identifiedBiases.join(', ')}`);
    }

    // Build the complete context message
    const contextMessage = `
You are an intelligent ILP (Integrative Life Practices) coach. You're helping someone build and sustain transformative life practices.

User's current context:
- ${stackContext}
- Modules breakdown: ${moduleBreakdown || 'None selected yet'}
- ${completionContext}
- ${timeContext}
${userContext.length > 0 ? `- User profile: ${userContext.join('; ')}` : ''}

Guidelines:
- Be conversational, warm, and grounded in their actual selections
- Pay close attention to any general and daily user notes on their practices, as they are critical context
- If they ask for the "why" of practices, explain the research and benefits
- If they're struggling (especially if mentioned in notes), suggest making it smaller or easier
- If they're motivated, suggest adding one more practice
- Keep responses to 2-4 sentences. Be direct and authentic.
- When suggesting practices from the knowledge base, be specific about WHY they're relevant
    `.trim();

    // Initialize RAGChat with Gemini and Upstash Vector
    const ragChat = new RAGChat({
      model: google('gemini-2.0-flash-exp', {
        apiKey: process.env.API_KEY!,
      }),
      vector: new Index({
        url: process.env.UPSTASH_VECTOR_REST_URL!,
        token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
      }),
      redis: process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
        ? new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
          })
        : undefined,
    });

    // Use RAG Chat with streaming and context
    const response = await ragChat.chat(message, {
      sessionId: userId,
      streaming: true,
      historyLength: 10,
      topK: 5,
      similarityThreshold: 0.6,
      metadata: {
        context: contextMessage,
        timestamp: new Date().toISOString(),
      },
      onContextFetched: (context) => {
        console.log(`[Coach API] Retrieved ${context.length} context items from vector DB`);
        return context;
      },
    });

    // Set up streaming response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullResponse = '';

    // Stream the response
    if (response.output && typeof response.output !== 'string') {
      const reader = response.output.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullResponse += chunk;

          // Send Server-Sent Event
          res.write(`data: ${JSON.stringify({ chunk, done: false })}\n\n`);
        }

        // Send final event
        res.write(`data: ${JSON.stringify({ chunk: '', done: true, fullResponse })}\n\n`);
        res.end();
      } catch (error) {
        console.error('[Coach API] Streaming error:', error);
        res.write(`data: ${JSON.stringify({ error: 'Streaming failed', done: true })}\n\n`);
        res.end();
      }
    } else {
      // Fallback for non-streaming response
      const responseText = typeof response.output === 'string' ? response.output : '';
      res.write(`data: ${JSON.stringify({ chunk: responseText, done: true, fullResponse: responseText })}\n\n`);
      res.end();
    }

    console.log(`[Coach API] Successfully generated response for user ${userId}`);
  } catch (error) {
    console.error('[Coach API] Error:', error);

    // If headers not sent, send JSON error
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Failed to generate coach response',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    } else {
      // If streaming started, send error event
      res.write(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error', done: true })}\n\n`);
      res.end();
    }
  }
}
