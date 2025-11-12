
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, ChevronsDown, Sparkles, RotateCcw, MessageSquare } from 'lucide-react';
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

const QUICK_PROMPTS = [
  'How am I doing with my practice stack?',
  'What should I focus on today?',
  'How can I make this easier?',
  'Should I add another practice?',
  'Why is consistency important?'
];

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
  const [coachResponses, setCoachResponses] = useState<CoachMessage[]>(() => {
    // Load chat history from localStorage
    const saved = localStorage.getItem('coach-chat-history');
    return saved ? JSON.parse(saved) : [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Save chat history to localStorage
  useEffect(() => {
    localStorage.setItem('coach-chat-history', JSON.stringify(coachResponses));
  }, [coachResponses]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      setTimeout(() => {
        chatContainerRef.current?.scrollTo(0, chatContainerRef.current.scrollHeight);
      }, 0);
    }
  }, [coachResponses, isLoading]);

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const buildCoachContext = () => {
    const today = new Date().toISOString().split('T')[0];
    const stackContext = practiceStack.length > 0
      ? `Current practice stack:\n${practiceStack.map(p => {
          const generalNote = practiceNotes[p.id] ? ` (Note: "${practiceNotes[p.id]}")` : '';
          const dailyNoteKey = `${p.id}-${today}`;
          const todayNote = dailyNotes[dailyNoteKey] ? ` (Today: "${dailyNotes[dailyNoteKey]}")` : '';
          const streak = getStreak(p.id);
          const streakInfo = streak > 0 ? ` [${streak} day streak]` : '';
          return `- ${p.name}${streakInfo}${generalNote}${todayNote}`;
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
      ? `Today's progress: ${completedCount}/${practiceStack.length} practices marked complete (${completionRate}%). ${completionRate === 100 ? '🎯 Perfect day!' : completionRate >= 75 ? '✨ Great progress!' : completionRate >= 50 ? '🚀 Keep going!' : '💪 You got this!'}`
      : 'No practices selected yet.';

    const timeContext = `Total weekly commitment: ${timeCommitment.toFixed(1)} hours (${timeIndicator}).`;

    return {
      stackContext,
      moduleBreakdown,
      completionContext,
      timeContext
    };
  };

  const handleCoachMessage = async (message?: string) => {
    const textToSend = message || chatMessage;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: CoachMessage = { role: 'user', text: textToSend };
    setCoachResponses(prev => [...prev, userMsg]);
    setChatMessage('');
    setIsLoading(true);
    setHasError(false);

    try {
      const context = buildCoachContext();

      const prompt = `You are an intelligent ILP (Integrative Life Practices) coach. You're helping someone build and sustain transformative life practices with wisdom, warmth, and practical guidance.

User's current context:
- ${context.stackContext}
- Modules breakdown: ${context.moduleBreakdown || 'None selected yet'}
- ${context.completionContext}
- ${context.timeContext}

The user just asked: "${textToSend}"

Guidelines:
- Be warm, authentic, and deeply grounded in their actual selections
- Pay close attention to their general notes and daily notes - they contain critical context about struggles or breakthroughs
- If they ask about practice benefits, reference research and real transformation
- If notes show struggling: suggest making it smaller, easier, or more joyful
- If notes show motivation: encourage adding one more practice or deepening commitment
- If they're building consistency: celebrate streaks and momentum
- Keep responses to 2-3 sentences max. Be direct and authentic.
- Ask clarifying questions if their intent isn't clear
- Offer specific, actionable suggestions`;

      const coachResponseText = await getCoachResponse(prompt);
      setCoachResponses(prev => [...prev, { role: 'coach', text: coachResponseText }]);
    } catch (error) {
      console.error('Coach error:', error);
      setHasError(true);
      const errorMessage = error instanceof Error ? error.message : "Connection error";
      setCoachResponses(prev => [...prev, { role: 'coach', text: `I'm having trouble connecting right now. ${errorMessage} Please try again.` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    if (confirm('Clear all chat history? This cannot be undone.')) {
      setCoachResponses([]);
      setChatMessage('');
    }
  };

  const showGreeting = coachResponses.length === 0;
  const completionEmoji = completionRate >= 100 ? '🎯' : completionRate >= 75 ? '✨' : completionRate >= 50 ? '🚀' : '💪';

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-slate-800/50 backdrop-blur-sm btn-luminous text-accent rounded-full p-4 shadow-lg z-50 animate-fade-in-up transition-all transform hover:scale-110 hover:shadow-xl hover:bg-slate-800/70 group"
        aria-label="Open AI Coach"
        title="Ask your AI Practice Coach"
      >
        <MessageCircle size={28} className="group-hover:rotate-12 transition-transform" />
        {coachResponses.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {coachResponses.filter(m => m.role === 'coach').length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[60vh] bg-gradient-to-b from-slate-900/80 to-slate-950/90 backdrop-blur-lg rounded-lg border border-accent/30 overflow-hidden flex flex-col z-50 shadow-2xl shadow-accent/20 animate-fade-in-up">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900/80 to-slate-800/80 p-4 flex items-center justify-between gap-3 shadow-md border-b border-accent/20">
        <div className="flex items-center gap-3">
          <div className="relative">
            <MerkabaIcon size={20} className="text-accent animate-pulse" />
            <Sparkles size={12} className="text-blue-400 absolute -top-1 -right-1" />
          </div>
          <div>
            <h3 className="font-bold font-mono text-slate-50 text-sm">AI Practice Coach</h3>
            <p className="text-xs text-slate-400">{completionEmoji} {completionRate}% today</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearHistory}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded hover:bg-slate-800/50"
            title="Clear chat history"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-300 hover:text-white transition-colors p-1 rounded hover:bg-slate-800/50"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {showGreeting && (
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-slate-700/60 to-slate-800/60 text-slate-200 rounded-lg p-4 rounded-bl-none border border-accent/20">
              <p className="text-sm mb-2">Hey! I'm your AI Practice Coach. I'm here to help you stay motivated, build consistency, and get the most from your practice stack.</p>
              <p className="text-xs text-slate-400">Ask me anything about your practices, or pick one of the suggestions below.</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-slate-500 font-semibold px-1">Quick questions:</p>
              <div className="space-y-1">
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleCoachMessage(prompt)}
                    disabled={isLoading}
                    className="w-full text-left text-xs bg-slate-800/50 hover:bg-slate-700/80 text-slate-300 hover:text-slate-100 rounded px-3 py-2 transition border border-slate-700/50 hover:border-accent/50 disabled:opacity-50"
                  >
                    <MessageSquare size={12} className="inline mr-2" />
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {coachResponses.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`inline-block px-4 py-2 rounded-lg max-w-[85%] text-sm shadow transition ${
              msg.role === 'user'
                ? 'bg-blue-600 text-blue-50 rounded-br-none border border-blue-500/50'
                : 'bg-slate-700/80 text-slate-100 rounded-bl-none border border-accent/30 leading-relaxed'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-700/80 text-slate-200 rounded-lg p-3 px-4 rounded-bl-none border border-accent/30">
              <div className="flex items-center space-x-1.5">
                <span className="h-2.5 w-2.5 bg-accent rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="h-2.5 w-2.5 bg-accent rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="h-2.5 w-2.5 bg-accent rounded-full animate-bounce"></span>
              </div>
            </div>
          </div>
        )}

        {hasError && (
          <div className="bg-red-900/30 text-red-200 rounded-lg p-3 text-xs border border-red-700/50 rounded-bl-none">
            Connection lost. Retrying...
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-accent/20 p-3 flex gap-2 bg-slate-900/60 backdrop-blur-sm">
        <input
          ref={inputRef}
          type="text"
          value={chatMessage}
          onChange={(e) => setChatMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleCoachMessage()}
          placeholder="Ask the coach..."
          className="flex-1 bg-slate-800/80 text-slate-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:ring-opacity-50 transition border border-slate-700 hover:border-slate-600 placeholder-slate-500"
          disabled={isLoading}
          autoComplete="off"
        />
        <button
          onClick={() => handleCoachMessage()}
          disabled={isLoading || !chatMessage.trim()}
          className="bg-accent/80 text-white rounded-md px-3 py-2 hover:bg-accent transition disabled:bg-slate-700 disabled:cursor-not-allowed font-semibold text-sm flex items-center gap-1"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}