/**
 * AI Practice Coach Backend API
 * Uses OpenRouter API for conversational coaching
 * No dependencies on vector databases or RAG systems
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

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
  userProfile?: {
    experienceLevel: 'beginner' | 'intermediate' | 'advanced';
    preferredIntensity: 'low' | 'moderate' | 'high' | 'variable';
    recurringPatterns?: string[];
    commonBlockers?: string[];
    practiceComplianceRate?: number;
  };
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
      userProfile,
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

    // Build user profile context if available
    let profileContext = '';
    if (userProfile) {
      profileContext = `
User profile:
- Experience: ${userProfile.experienceLevel}
- Intensity preference: ${userProfile.preferredIntensity}
- Compliance: ${(userProfile.practiceComplianceRate ?? 0 * 100).toFixed(0)}%${
        userProfile.recurringPatterns && userProfile.recurringPatterns.length > 0
          ? `\n- Recurring patterns: ${userProfile.recurringPatterns.slice(0, 2).join(', ')}`
          : ''
      }${
        userProfile.commonBlockers && userProfile.commonBlockers.length > 0
          ? `\n- Blockers to address: ${userProfile.commonBlockers.slice(0, 2).join(', ')}`
          : ''
      }`;
    }

    // Build the complete prompt with strict word limit enforcement
    const fullPrompt = `You are a concise ILP (Integrative Life Practices) coach helping someone with transformative practices.

User's context:
- ${stackContext}
- Modules: ${moduleBreakdown || 'None selected'}
- ${completionContext}
- ${timeContext}${profileContext}

User asked: "${message}"

CRITICAL: Respond in 30-40 words MAX. Be direct, warm, and grounded.
- Reference their profile/patterns when relevant
- Suggest smaller changes if struggling, bigger if motivated
- Be authentic and conversational`;

    console.log('[Coach API] Building prompt with word limit constraint (30-40 words max)');

    // Set up streaming response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    console.log('[Coach API] Calling OpenRouter API with streaming...');

    try {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY environment variable is not set');
      }

      // Call OpenRouter API with streaming
      const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://ilp.coach',
          'X-Title': 'ILP Coach',
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-v3.2-exp',
          messages: [
            {
              role: 'user',
              content: fullPrompt,
            },
          ],
          stream: true,
          temperature: 0.5,
          max_tokens: 120,
        }),
      });

      if (!openrouterResponse.ok) {
        const errorData = await openrouterResponse.json();
        throw new Error(`OpenRouter API error: ${errorData.error?.message || openrouterResponse.statusText}`);
      }

      if (!openrouterResponse.body) {
        throw new Error('No response body from OpenRouter API');
      }

      const reader = openrouterResponse.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);

              if (data === '[DONE]') {
                // End of stream
                res.write(`data: ${JSON.stringify({ chunk: '', done: true, fullResponse })}\n\n`);
                continue;
              }

              try {
                const json = JSON.parse(data);
                const chunkText = json.choices?.[0]?.delta?.content || '';

                if (chunkText) {
                  fullResponse += chunkText;
                  // Send Server-Sent Event
                  res.write(`data: ${JSON.stringify({ chunk: chunkText, done: false })}\n\n`);
                }
              } catch (parseError) {
                console.debug('[Coach API] Parse error for line:', data, parseError);
              }
            }
          }
        }

        // Ensure final event is sent
        if (!fullResponse) {
          res.write(`data: ${JSON.stringify({ chunk: '', done: true, fullResponse: 'I apologize, I was unable to generate a response. Please try again.' })}\n\n`);
        }
      } finally {
        reader.releaseLock();
      }

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
