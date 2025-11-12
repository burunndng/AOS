
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, ChevronsDown, Sparkles } from 'lucide-react';
import { CoachMessage, Practice, ModuleKey, ModuleInfo, AllPractice } from '../types.ts';
import { getCoachResponse } from '../services/geminiService.ts';
import { practices } from '../constants.ts';
import { MerkabaIcon } from './MerkabaIcon.tsx';

interface CoachProps {
  userId: string;
  practiceStack: AllPractice[];
  completedCount: number;
  completionRate: number;
  timeCommitment: number;
  timeIndicator: string;
  modules: Record<ModuleKey, ModuleInfo>;
  getStreak: (practiceId: string) => number;
  practiceNotes: Record<string, string>;
  dailyNotes: Record<string, string>;
}

interface SuggestedPractice {
  id: string;
  name: string;
  reason: string;
  similarity: number;
}

interface CoachAPIResponse {
  response: string;
  suggestedPractices?: SuggestedPractice[];
  relevantInsights?: string[];
  userContext?: {
    developmentalStage?: string;
    attachmentStyle?: string;
    identifiedBiases?: string[];
  };
}

export default function Coach({
  userId,
  practiceStack,
  completedCount,
  completionRate,
  timeCommitment,
  timeIndicator,
  modules,
  getStreak,
  practiceNotes,
  dailyNotes,
}: CoachProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [coachResponses, setCoachResponses] = useState<CoachMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedPractices, setSuggestedPractices] = useState<SuggestedPractice[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [coachResponses]);

  const handleCoachMessage = async () => {
    if (!chatMessage.trim() || isLoading) return;

    const userMsg: CoachMessage = { role: 'user', text: chatMessage };
    setCoachResponses(prev => [...prev, userMsg]);
    const currentMessage = chatMessage;
    setChatMessage('');
    setIsLoading(true);
    setShowSuggestions(false);

    // Add empty coach message that will be streamed into
    const coachMessageIndex = coachResponses.length + 1;
    setCoachResponses(prev => [...prev, { role: 'coach', text: '' }]);

    try {
      const today = new Date().toISOString().split('T')[0];

      // Calculate module breakdown
      const moduleBreakdown = Object.entries(modules).reduce((acc, [key, mod]) => {
        const count = practiceStack.filter(p => {
          if ('isCustom' in p && p.isCustom) {
            return p.module === key;
          }
          const practiceModule = (Object.keys(practices) as ModuleKey[]).find(mKey =>
            practices[mKey].some(pr => pr.id === p.id)
          );
          return practiceModule === key;
        }).length;
        if (count > 0) {
          acc[key] = { name: mod.name, count };
        }
        return acc;
      }, {} as Record<string, { name: string; count: number }>);

      // Call the enhanced backend API with streaming
      const response = await fetch('/api/coach/generate-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          message: currentMessage,
          practiceStack: practiceStack.map(p => ({
            id: p.id,
            name: p.name,
            module: 'isCustom' in p && p.isCustom ? p.module : undefined,
          })),
          completedCount,
          completionRate,
          timeCommitment,
          timeIndicator,
          modules: moduleBreakdown,
          practiceNotes,
          dailyNotes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error', message: response.statusText }));
        console.error('[Coach] API error:', errorData);
        throw new Error(errorData.message || errorData.error || `API error: ${response.statusText}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));

                  if (data.error) {
                    throw new Error(data.error);
                  }

                  if (data.chunk) {
                    fullText += data.chunk;
                    // Update the coach message in real-time
                    setCoachResponses(prev => {
                      const updated = [...prev];
                      updated[coachMessageIndex] = { role: 'coach', text: fullText };
                      return updated;
                    });
                  }

                  if (data.done) {
                    // Use fullResponse if available, otherwise use accumulated fullText
                    const finalText = data.fullResponse || fullText;
                    setCoachResponses(prev => {
                      const updated = [...prev];
                      updated[coachMessageIndex] = { role: 'coach', text: finalText };
                      return updated;
                    });
                    break;
                  }
                } catch (parseError) {
                  // Ignore JSON parse errors for incomplete chunks
                  console.debug('[Coach] Parse error (likely incomplete chunk):', parseError);
                }
              }
            }
          }
        } catch (streamError) {
          console.error('[Coach] Streaming error:', streamError);
          throw streamError;
        }
      }
    } catch (error) {
      console.error('Coach error:', error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      // Replace the empty coach message with error
      setCoachResponses(prev => {
        const updated = [...prev];
        updated[coachMessageIndex] = {
          role: 'coach',
          text: `Sorry, I'm having trouble connecting. ${errorMessage}`
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-slate-800/50 backdrop-blur-sm btn-luminous text-accent rounded-full p-4 shadow-lg z-50 animate-fade-in-up transition-transform transform hover:scale-110"
        aria-label="Open AI Coach"
      >
        <MessageCircle size={28} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[60vh] bg-slate-900/70 backdrop-blur-md rounded-lg border border-accent/20 overflow-hidden flex flex-col z-50 shadow-2xl shadow-accent/10 animate-fade-in-up">
      <div className="bg-slate-900/50 p-4 flex items-center justify-between gap-3 shadow-md border-b border-accent/20">
        <div className="flex items-center gap-3">
            <MerkabaIcon size={20} className="text-accent" />
            <h3 className="font-bold font-mono text-slate-50">AI Practice Coach</h3>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-slate-300 hover:text-white transition-opacity">
            <X size={20} />
        </button>
      </div>

      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {coachResponses.length === 0 && (
          <div className="text-center mt-8 space-y-2">
            <div className="flex justify-center">
              <Sparkles className="text-accent" size={32} />
            </div>
            <p className="text-slate-400 text-sm">Ask about your practices, motivation, or what to add next.</p>
            <p className="text-slate-500 text-xs">Powered by Gemini 2.5-flash + Upstash Vector</p>
          </div>
        )}
        {coachResponses.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <p className={`inline-block px-3 py-2 rounded-lg max-w-[85%] text-sm shadow ${msg.role === 'user' ? 'bg-blue-600 text-blue-100 rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none'}`}>
              {msg.text}
            </p>
          </div>
        ))}
        {showSuggestions && suggestedPractices.length > 0 && (
          <div className="bg-slate-800/50 border border-accent/30 rounded-lg p-3 space-y-2">
            <p className="text-xs text-accent font-semibold flex items-center gap-1">
              <Sparkles size={12} />
              Relevant Practices (from vector search)
            </p>
            <div className="space-y-2">
              {suggestedPractices.slice(0, 3).map((practice, idx) => (
                <div key={idx} className="bg-slate-700/50 rounded p-2 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-200 font-medium">{practice.name}</span>
                    <span className="text-accent text-[10px]">{(practice.similarity * 100).toFixed(0)}% match</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{practice.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-slate-700 text-slate-200 rounded-lg p-2 px-3 rounded-bl-none">
              <div className="flex items-center space-x-1">
                <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce"></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-accent/20 p-3 flex gap-2 bg-slate-900/50 backdrop-blur-sm">
        <input
          type="text"
          value={chatMessage}
          onChange={(e) => setChatMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleCoachMessage()}
          placeholder="Ask the coach..."
          className="flex-1 bg-slate-800 text-slate-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent transition border border-slate-700"
          disabled={isLoading}
        />
        <button onClick={handleCoachMessage} disabled={isLoading} className="bg-accent/80 text-white rounded-md px-3 py-2 hover:bg-accent transition disabled:bg-slate-600 disabled:cursor-not-allowed">
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}