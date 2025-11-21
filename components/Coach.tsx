
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, ChevronsDown, Sparkles } from 'lucide-react';
import { CoachMessage, Practice, ModuleKey, ModuleInfo, AllPractice, IntelligentGuidance } from '../types.ts';
import { practices } from '../constants.ts';
import { MerkabaIcon } from './MerkabaIcon.tsx';
import { generateCoachResponse, CoachContext, AppStructure } from '../services/coachChatService.ts';

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
  userProfile?: {
    experienceLevel: 'beginner' | 'intermediate' | 'advanced';
    preferredIntensity: 'low' | 'moderate' | 'high' | 'variable';
    recurringPatterns?: string[];
    commonBlockers?: string[];
    practiceComplianceRate?: number;
  };
  intelligentGuidance?: IntelligentGuidance;
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
  userProfile,
  intelligentGuidance,
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

      // Build context for coach service
      const context: CoachContext = {
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
        userProfile,
        appStructure: {
          tabs: {
            dashboard: 'Daily overview & quick access',
            stack: 'Manage your practice list',
            browse: 'Discover & add new practices',
            tracker: 'Log daily completions',
            streaks: 'Track consistency over time',
            recommendations: 'Get AI-powered suggestions',
            aqal: 'Understand your development across all dimensions',
            mindTools: 'Deep dive into cognitive & mental practices',
            bodyTools: 'Explore physical & somatic practices',
            spiritTools: 'Access spiritual & transcendent practices',
            shadowTools: 'Work with shadow self & inner darkness',
            library: 'Search all available practices',
            journal: 'Track insights & address them with practices',
            quiz: 'Self-assess your experience level',
          },
          modules: {
            body: 'Physical practices: exercise, nutrition, sleep, cold exposure',
            mind: 'Cognitive practices: meditation, learning, decision-making',
            spirit: 'Spiritual practices: consciousness work, transcendence, meaning',
            shadow: 'Shadow work: trauma processing, bias detection, shadow integration',
          },
          frameworks: {
            learyCircuits: '8 neurological circuits: Survival → Emotional-Territorial → Semantic → Bonding → Somatic → Metaprogramming → Archetypal → Non-Dual',
            wilberStages: 'Developmental stages: Archaic → Magic/Power → Mythic/Rational → Pluralistic → Systemic → Integral',
          },
        },
        ...(intelligentGuidance && {
          intelligenceHubGuidance: {
            synthesis: intelligentGuidance.synthesis,
            primaryFocus: intelligentGuidance.primaryFocus,
            nextWizard: intelligentGuidance.recommendations?.nextWizard
              ? {
                  name: intelligentGuidance.recommendations.nextWizard.name || intelligentGuidance.recommendations.nextWizard.type,
                  reason: intelligentGuidance.recommendations.nextWizard.reason,
                  priority: intelligentGuidance.recommendations.nextWizard.priority,
                }
              : undefined,
            reasoning: intelligentGuidance.reasoning,
            cautions: intelligentGuidance.cautions,
            generatedAt: intelligentGuidance.generatedAt,
          },
        }),
      };

      // Stream the coach's response
      let streamedText = '';
      const coachMessageIndex = coachResponses.length + 1;

      const result = await generateCoachResponse(
        context,
        currentMessage,
        coachResponses,
        (chunk) => {
          streamedText += chunk;
          // Update the UI with streaming chunks
          setCoachResponses(prev => {
            const lastMessage = prev[prev.length - 1];

            if (lastMessage?.role === 'coach') {
              // Update existing coach message
              return [
                ...prev.slice(0, -1),
                { ...lastMessage, text: streamedText }
              ];
            } else {
              // Create a new coach message
              return [
                ...prev,
                { role: 'coach', text: streamedText }
              ];
            }
          });
        }
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate response');
      }

      // Ensure final message is set
      setCoachResponses(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.role === 'coach') {
          return [
            ...prev.slice(0, -1),
            { ...lastMessage, text: result.text }
          ];
        } else {
          return [
            ...prev,
            { role: 'coach', text: result.text }
          ];
        }
      });
    } catch (error) {
      console.error('Coach error:', error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      // Add error message
      setCoachResponses(prev => [
        ...prev,
        {
          role: 'coach',
          text: `Sorry, I'm having trouble connecting. ${errorMessage}`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-slate-800/50 backdrop-blur-sm btn-luminous text-accent rounded-full p-3 sm:p-4 shadow-lg z-50 animate-fade-in-up transition-transform transform hover:scale-110 touch-target"
        aria-label="Open AI Coach"
      >
        <MessageCircle size={24} className="sm:w-7 sm:h-7" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:bottom-6 sm:right-6 sm:left-auto sm:w-96 w-full h-[50vh] sm:h-[60vh] bg-slate-900/70 backdrop-blur-md rounded-lg border border-accent/20 overflow-hidden flex flex-col z-50 shadow-2xl shadow-accent/10 animate-fade-in-up">
      <div className="bg-slate-900/50 p-3 sm:p-4 flex items-center justify-between gap-3 shadow-md border-b border-accent/20">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <MerkabaIcon size={18} className="text-accent flex-shrink-0" />
            <h3 className="font-bold font-mono text-slate-50 text-sm sm:text-base truncate">AI Practice Coach</h3>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-slate-300 hover:text-white transition-opacity p-1.5 flex-shrink-0 rounded hover:bg-slate-700/50">
            <X size={18} />
        </button>
      </div>

      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {coachResponses.length === 0 && (
          <div className="text-center mt-8 space-y-2">
            <div className="flex justify-center">
              <Sparkles className="text-accent" size={32} />
            </div>
            <p className="text-slate-400 text-sm">Ask about your practices, motivation, or what to add next.</p>
            <p className="text-slate-500 text-xs">Powered by DeepSeek v3.2 via OpenRouter</p>
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

      <div className="border-t border-accent/20 p-2 sm:p-3 flex gap-2 bg-slate-900/50 backdrop-blur-sm">
        <input
          type="text"
          value={chatMessage}
          onChange={(e) => setChatMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleCoachMessage()}
          placeholder="Ask the coach..."
          className="flex-1 bg-slate-800 text-slate-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent transition border border-slate-700"
          disabled={isLoading}
        />
        <button onClick={handleCoachMessage} disabled={isLoading} className="bg-accent/80 text-white rounded-md px-2.5 sm:px-3 py-2 hover:bg-accent transition disabled:bg-slate-600 disabled:cursor-not-allowed flex-shrink-0 touch-target">
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}