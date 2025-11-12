/**
 * AI Practice Coach Backend API - Working Version
 * Uses only Gemini 2.5-flash (no Upstash Vector until that's fixed)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
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

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

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
    } = req.body as CoachRequest;

    if (!userId || !message) {
      console.error('[Coach API] Missing required fields');
      res.status(400).json({ error: 'Missing required fields: userId, message' });
      return;
    }

    console.log(`[Coach API] Processing request for user ${userId}: "${message}"`);

    // Build rich context about the user's current state
    const today = new Date().toISOString().split('T')[0];
    const stackContext = practiceStack.length > 0
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

    const completionContext = practiceStack.length > 0
      ? `Completion status today: ${completedCount}/${practiceStack.length} practices marked complete (${completionRate}%).`
      : '';

    const timeContext = `Total weekly commitment: ${timeCommitment.toFixed(1)} hours (${timeIndicator}).`;

    // Build the complete prompt
    const fullPrompt = `You are an intelligent ILP (Integrative Life Practices) coach. You're helping someone build and sustain transformative life practices.

User's current context:
- ${stackContext}
- Modules breakdown: ${moduleBreakdown || 'None selected yet'}
- ${completionContext}
- ${timeContext}

The user just asked: "${message}"

Guidelines:
- Be conversational, warm, and grounded in their actual selections
- Pay close attention to any general and daily user notes on their practices, as they are critical context
- If they ask for the "why" of practices, explain the research and benefits
- If they're struggling (especially if mentioned in notes), suggest making it smaller or easier
- If they're motivated, suggest adding one more practice
- Keep responses to 2-4 sentences. Be direct and authentic.`;

    // Set up streaming response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    console.log('[Coach API] Calling Gemini 2.5-flash with streaming...');

    try {
      // Generate streaming response with Gemini
      const response = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
      });

      let fullResponse = '';

      // Stream the response
      for await (const chunk of response.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          fullResponse += chunkText;
          // Send Server-Sent Event
          res.write(`data: ${JSON.stringify({ chunk: chunkText, done: false })}\n\n`);
        }
      }

      // Send final event
      res.write(`data: ${JSON.stringify({ chunk: '', done: true, fullResponse })}\n\n`);
      res.end();

      console.log(`[Coach API] Successfully generated response for user ${userId}`);
    } catch (streamError) {
      console.error('[Coach API] Streaming error:', streamError);
      res.write(`data: ${JSON.stringify({ error: streamError instanceof Error ? streamError.message : 'Streaming failed', done: true })}\n\n`);
      res.end();
    }
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
