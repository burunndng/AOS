import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, ChevronsDown } from 'lucide-react';
import { CoachMessage, Practice, ModuleKey, ModuleInfo, AllPractice } from '../types.ts';
import { getCoachResponse } from '../services/geminiService.ts';
import { practices } from '../constants.ts';
import { MerkabaIcon } from './MerkabaIcon.tsx';

interface CoachProps {
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

export default function Coach({
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
    setChatMessage('');
    setIsLoading(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      const stackContext = practiceStack.length > 0
        ? `Current practice stack:\n${practiceStack.map(p => {
            const generalNote = practiceNotes[p.id] ? ` (General note: "${practiceNotes[p.id]}")` : '';
            const dailyNoteKey = `${p.id}-${today}`;
            const todayNote = dailyNotes[dailyNoteKey] ? ` (Today's note: "${dailyNotes[dailyNoteKey]}")` : '';
            return `- ${p.name}${generalNote}${todayNote}`;
          }).join('\n')}`
        : 'User has not selected any practices yet.';

      const moduleBreakdown = Object.entries(modules).map(([key, mod]) => {
        const count = practiceStack.filter(p => {
          if ('isCustom' in p && p.isCustom) {
            return p.module === key;
          }
          const practiceModule = (Object.keys(practices) as ModuleKey[]).find(mKey => practices[mKey].some(pr => pr.id === p.id));
          return practiceModule === key;
        }).length;
        return count > 0 ? `${mod.name}: ${count}` : null;
      }).filter(Boolean).join(', ');

      const completionContext = practiceStack.length > 0
        ? `Completion status today: ${completedCount}/${practiceStack.length} practices marked complete (${completionRate}%).`
        : '';

      const timeContext = `Total weekly commitment: ${timeCommitment.toFixed(1)} hours (${timeIndicator}).`;

      const prompt = `You are an intelligent ILP (Integrative Life Practices) coach. You're helping someone build and sustain transformative life practices.
User's current context:
- ${stackContext}
- Modules breakdown: ${moduleBreakdown || 'None selected yet'}
- ${completionContext}
- ${timeContext}
The user just asked: "${chatMessage}"
Guidelines:
- Be conversational, warm, and grounded in their actual selections. Pay close attention to any general and daily user notes on their practices, as they are critical context.
- If they ask for the "why" of practices, explain the research and benefits.
- If they're struggling (especially if mentioned in notes), suggest making it smaller or easier.
- If they're motivated, suggest adding one more practice.
- Keep responses to 2-3 sentences max. Be direct and authentic.`;

      const coachResponseText = await getCoachResponse(prompt);
      setCoachResponses(prev => [...prev, { role: 'coach', text: coachResponseText }]);
    } catch (error) {
      console.error('Coach error:', error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      setCoachResponses(prev => [...prev, { role: 'coach', text: `Sorry, I'm having trouble connecting. ${errorMessage}` }]);
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
          <p className="text-slate-400 text-sm text-center mt-4">Ask about your practices, motivation, or what to add next.</p>
        )}
        {coachResponses.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <p className={`inline-block px-3 py-2 rounded-lg max-w-[85%] text-sm shadow ${msg.role === 'user' ? 'bg-blue-600 text-blue-100 rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none'}`}>
              {msg.text}
            </p>
          </div>
        ))}
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