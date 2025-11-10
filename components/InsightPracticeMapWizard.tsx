import React, { useState, useEffect, useRef } from 'react';
import { X, Circle, CheckCircle, MessageCircle, Send, Loader2, Book, History, Map, ChevronRight, Zap, AlertCircle } from 'lucide-react';
import {
  InsightPracticeMapSession,
  InsightStage,
  InsightStageLog,
  InsightChatMessage
} from '../types';
import {
  INSIGHT_STAGES,
  askGrokAboutInsight,
  getStageByNumber,
  getStagesByPhase,
  getPhaseColor,
  isCurrentStage
} from '../services/insightPracticeMapService';

interface Props {
  onClose: () => void;
}

type ViewMode = 'map' | 'chat' | 'history';

export default function InsightPracticeMapWizard({ onClose }: Props) {
  const [session, setSession] = useState<InsightPracticeMapSession>(() => {
    const saved = localStorage.getItem('insightPracticeMapSession');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      currentStage: undefined,
      stageHistory: [],
      cycleCount: 0,
      chatHistory: [],
      notes: ''
    };
  });

  const [selectedStage, setSelectedStage] = useState<InsightStage | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [chatInput, setChatInput] = useState('');
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Save session to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('insightPracticeMapSession', JSON.stringify(session));
  }, [session]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (viewMode === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [session.chatHistory, viewMode]);

  const handleMarkCurrentStage = (stageNumber: number) => {
    const stage = getStageByNumber(stageNumber);
    if (!stage) return;

    // Add to history
    const newLog: InsightStageLog = {
      stageNumber,
      stageName: stage.name,
      dateNoted: new Date().toISOString(),
      cycleNumber: session.cycleCount
    };

    // Check if we've completed a cycle (reached stage 16)
    const newCycleCount = stageNumber === 16 ? session.cycleCount + 1 : session.cycleCount;

    setSession({
      ...session,
      currentStage: stageNumber,
      stageHistory: [newLog, ...session.stageHistory],
      cycleCount: newCycleCount
    });
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isLoadingResponse) return;

    const userMessage: InsightChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: chatInput.trim(),
      timestamp: new Date().toISOString()
    };

    // Add user message to chat
    const updatedHistory = [...session.chatHistory, userMessage];
    setSession({
      ...session,
      chatHistory: updatedHistory
    });

    setChatInput('');
    setIsLoadingResponse(true);

    try {
      // Call Grok API
      const grokResponse = await askGrokAboutInsight(userMessage.text, updatedHistory);

      const assistantMessage: InsightChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'grok',
        text: grokResponse,
        timestamp: new Date().toISOString()
      };

      setSession(prev => ({
        ...prev,
        chatHistory: [...prev.chatHistory, assistantMessage]
      }));
    } catch (error) {
      console.error('Error getting Grok response:', error);
      const errorMessage: InsightChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'grok',
        text: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please make sure your GROK_API_KEY is set in your .env file.`,
        timestamp: new Date().toISOString()
      };

      setSession(prev => ({
        ...prev,
        chatHistory: [...prev.chatHistory, errorMessage]
      }));
    } finally {
      setIsLoadingResponse(false);
    }
  };

  const renderStageList = () => {
    const phases = ['Pre-Vipassana', 'Vipassana Begins', 'Dark Night', 'High Equanimity'];
    const currentStageNum = session.currentStage || 0;
    const completedStages = Math.min(currentStageNum - 1, 16);
    const progressPercent = (completedStages / 16) * 100;

    const getPhaseGradient = (phase: string) => {
      switch (phase) {
        case 'Pre-Vipassana':
          return 'from-blue-900/40 to-blue-800/20';
        case 'Vipassana Begins':
          return 'from-amber-900/40 to-amber-800/20';
        case 'Dark Night':
          return 'from-red-900/40 to-red-800/20';
        case 'High Equanimity':
          return 'from-emerald-900/40 to-emerald-800/20';
        default:
          return 'from-neutral-900/40 to-neutral-800/20';
      }
    };

    const getPhaseBorder = (phase: string) => {
      switch (phase) {
        case 'Pre-Vipassana':
          return 'border-blue-600/50';
        case 'Vipassana Begins':
          return 'border-amber-600/50';
        case 'Dark Night':
          return 'border-red-600/50';
        case 'High Equanimity':
          return 'border-emerald-600/50';
        default:
          return 'border-neutral-600/50';
      }
    };

    const getPhaseAccentColor = (phase: string) => {
      switch (phase) {
        case 'Pre-Vipassana':
          return 'text-blue-400';
        case 'Vipassana Begins':
          return 'text-amber-400';
        case 'Dark Night':
          return 'text-red-400';
        case 'High Equanimity':
          return 'text-emerald-400';
        default:
          return 'text-neutral-400';
      }
    };

    return (
      <div className="space-y-12 pb-20">
        {/* Header Section */}
        <div className="sticky top-0 z-10 bg-gradient-to-b from-neutral-950 via-neutral-950 to-transparent py-8 space-y-6">
          <div>
            <h2 className="text-4xl font-bold font-mono text-neutral-100 mb-2">progress of insight</h2>
            <p className="text-sm text-neutral-400">the 16 ñanas journey through vipassana meditation</p>
          </div>

          {/* Progress Bar with Stats */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs text-neutral-500 font-mono mb-1">STAGES COMPLETED</p>
                  <p className="text-2xl font-bold text-neutral-100 font-mono">{completedStages}<span className="text-neutral-500">/16</span></p>
                </div>
                {session.cycleCount > 0 && (
                  <div>
                    <p className="text-xs text-neutral-500 font-mono mb-1">CYCLES</p>
                    <p className="text-2xl font-bold text-[#d9aaef] font-mono">{session.cycleCount}</p>
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-neutral-500 font-mono mb-1">PROGRESS</p>
                <p className="text-xl font-bold text-neutral-100">{Math.round(progressPercent)}%</p>
              </div>
            </div>
            
            {/* Enhanced Progress Bar */}
            <div className="space-y-2">
              <div className="w-full h-2.5 bg-neutral-800/60 rounded-full overflow-hidden border border-neutral-700/30">
                <div
                  className="h-full bg-gradient-to-r from-[#d9aaef] via-[#d9aaef] to-[#d9aaef]/40 transition-all duration-700 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-neutral-500">
                <span>Beginning</span>
                <span>Enlightenment</span>
              </div>
            </div>
          </div>
        </div>

        {/* Phases Grid */}
        {phases.map((phase, phaseIdx) => {
          const stages = getStagesByPhase(phase);
          const phaseGradient = getPhaseGradient(phase);
          const phaseBorder = getPhaseBorder(phase);
          const phaseAccent = getPhaseAccentColor(phase);

          return (
            <div key={phase} className="space-y-4 animate-fade-in-up" style={{ animationDelay: `${phaseIdx * 100}ms` }}>
              {/* Phase Header Card */}
              <div className={`
                bg-gradient-to-r ${phaseGradient} backdrop-blur-sm
                border ${phaseBorder} rounded-xl p-5
                transition-all duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)]
              `}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className={`text-lg font-bold font-mono ${phaseAccent} mb-1`}>{phase}</h3>
                    <p className="text-xs text-neutral-400">{stages.length} stages • Transformative meditation journey</p>
                  </div>
                  <div className="flex-shrink-0 pl-4">
                    <div className={`text-3xl font-bold font-mono ${phaseAccent} opacity-40`}>{phaseIdx + 1}</div>
                  </div>
                </div>
              </div>

              {/* Stage Cards Grid */}
              <div className="grid gap-3">
                {stages.map((stage, stageIdx) => {
                  const isCurrent = isCurrentStage(stage.stage, session.currentStage);
                  const isCompleted = session.currentStage && stage.stage < session.currentStage;
                  const isUpcoming = !isCurrent && !isCompleted;

                  return (
                    <div
                      key={stage.stage}
                      onClick={() => setSelectedStage(stage)}
                      className={`
                        group relative cursor-pointer transition-all duration-300
                        rounded-lg backdrop-blur-sm border overflow-hidden
                        ${isCurrent
                          ? 'bg-gradient-to-br from-[#d9aaef]/20 to-[#d9aaef]/10 border-[#d9aaef]/50 shadow-[0_8px_24px_rgba(217,170,239,0.2)]'
                          : isCompleted
                          ? 'bg-gradient-to-br from-green-900/20 to-green-900/10 border-green-600/40 opacity-85'
                          : 'bg-neutral-900/40 border-neutral-700/40 hover:bg-neutral-900/60 hover:border-neutral-600/50'
                        }
                        hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] hover:-translate-y-1
                      `}
                    >
                      {/* Animated gradient overlay for current stage */}
                      {isCurrent && (
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{
                            background: 'radial-gradient(circle at top right, rgba(217,170,239,0.1) 0%, transparent 60%)'
                          }} />
                      )}

                      <div className="relative z-10 p-4 flex items-start gap-4">
                        {/* Stage Indicator */}
                        <div className="flex-shrink-0 pt-1">
                          <div className={`
                            w-10 h-10 rounded-lg flex items-center justify-center font-mono font-bold text-sm
                            transition-all duration-300
                            ${isCurrent
                              ? 'bg-[#d9aaef]/30 border-2 border-[#d9aaef] text-[#d9aaef] shadow-[0_0_12px_rgba(217,170,239,0.3)]'
                              : isCompleted
                              ? 'bg-green-600/30 border-2 border-green-500 text-green-400'
                              : 'bg-neutral-800/50 border border-neutral-700 text-neutral-400 group-hover:bg-neutral-700/50'
                            }
                          `}>
                            {stage.stage}
                          </div>
                        </div>

                        {/* Stage Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1">
                              <h4 className={`
                                font-semibold transition-colors
                                ${isCurrent
                                  ? 'text-neutral-100 group-hover:text-[#d9aaef]'
                                  : isCompleted
                                  ? 'text-neutral-200'
                                  : 'text-neutral-300 group-hover:text-neutral-100'
                                }
                              `}>
                                {stage.name}
                              </h4>
                              <p className="text-xs text-neutral-500 font-mono mt-0.5">{stage.code}</p>
                            </div>
                            {isCurrent && (
                              <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 bg-[#d9aaef]/20 border border-[#d9aaef]/50 rounded-full">
                                <Circle size={6} className="fill-[#d9aaef] text-[#d9aaef]" />
                                <span className="text-xs font-mono text-[#d9aaef]">current</span>
                              </span>
                            )}
                            {isCompleted && (
                              <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 bg-green-600/20 border border-green-600/50 rounded-full">
                                <CheckCircle size={14} className="text-green-500" />
                                <span className="text-xs font-mono text-green-400">done</span>
                              </span>
                            )}
                          </div>

                          {/* Description Preview */}
                          <p className="text-sm text-neutral-400 line-clamp-2 mb-2">
                            {stage.description}
                          </p>

                          {/* Key Markers Preview */}
                          {stage.keyMarkers.length > 0 && (
                            <div className="space-y-1 mb-3">
                              <p className="text-xs font-mono text-neutral-500">Key markers:</p>
                              <p className="text-xs text-neutral-400">
                                {stage.keyMarkers[0]}...
                              </p>
                            </div>
                          )}

                          {/* Duration + Action */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-neutral-600 font-mono">⏱ {stage.duration}</span>
                            <ChevronRight size={16} className="text-neutral-600 group-hover:text-neutral-400 transition-colors" />
                          </div>
                        </div>
                      </div>

                      {/* Warning indicator */}
                      {stage.warnings && stage.warnings.length > 0 && (
                        <div className="absolute top-2 right-2 opacity-60 group-hover:opacity-100 transition-opacity">
                          <AlertCircle size={16} className="text-amber-500" title="Has important notes" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderStageDetail = () => {
    if (!selectedStage) return null;

    const isCurrent = isCurrentStage(selectedStage.stage, session.currentStage);
    const isCompleted = session.currentStage && selectedStage.stage < session.currentStage;

    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-gradient-to-br from-neutral-900/80 to-neutral-950/80 backdrop-blur-lg border border-neutral-700/50 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-[0_20px_48px_rgba(0,0,0,0.8)]">
          {/* Header */}
          <div className="sticky top-0 z-20 bg-gradient-to-b from-neutral-900/90 via-neutral-900/60 to-transparent px-8 py-6 border-b border-neutral-700/30">
            <div className="flex justify-between items-start gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-lg bg-[#d9aaef]/20 border border-[#d9aaef]/50 flex items-center justify-center">
                    <span className="text-lg font-bold font-mono text-[#d9aaef]">{selectedStage.stage}</span>
                  </div>
                  <div>
                    <p className="text-xs font-mono text-neutral-500">{selectedStage.code} • {selectedStage.phase}</p>
                    <h3 className="text-2xl font-bold font-mono text-neutral-100">
                      {selectedStage.name}
                    </h3>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedStage(null)}
                className="text-neutral-600 hover:text-neutral-300 transition-colors p-2 hover:bg-neutral-800/40 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            {/* Status Indicators */}
            <div className="flex gap-3">
              {isCurrent && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#d9aaef]/20 border border-[#d9aaef]/50 rounded-lg">
                  <Circle size={8} className="fill-[#d9aaef] text-[#d9aaef] animate-pulse" />
                  <span className="text-xs font-mono text-[#d9aaef] font-semibold">YOU ARE HERE</span>
                </span>
              )}
              {isCompleted && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600/20 border border-green-600/50 rounded-lg">
                  <CheckCircle size={14} className="text-green-500" />
                  <span className="text-xs font-mono text-green-400 font-semibold">COMPLETED</span>
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-8 space-y-8">
            {/* Description - Enhanced */}
            <div className="bg-gradient-to-br from-neutral-900/60 to-neutral-900/20 backdrop-blur-sm border border-neutral-700/30 rounded-xl p-6 hover:border-neutral-600/50 transition-colors">
              <h5 className="text-xs font-mono text-neutral-500 mb-3 uppercase tracking-wide">Overview</h5>
              <p className="text-neutral-200 leading-relaxed text-base">{selectedStage.description}</p>
            </div>

            {/* Key Markers - Card Grid */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Zap size={16} className="text-[#d9aaef]" />
                <h5 className="text-sm font-mono font-bold text-[#d9aaef]">KEY MARKERS</h5>
                <p className="text-xs text-neutral-500">({selectedStage.keyMarkers.length})</p>
              </div>
              <div className="grid gap-3">
                {selectedStage.keyMarkers.map((marker, idx) => (
                  <div key={idx} className="bg-neutral-900/40 border border-neutral-700/30 rounded-lg p-4 hover:border-neutral-600/50 transition-all hover:bg-neutral-900/60">
                    <p className="text-sm text-neutral-300 leading-relaxed flex gap-3">
                      <span className="text-[#d9aaef] font-bold flex-shrink-0">{idx + 1}.</span>
                      <span>{marker}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Practice Tips - Card Grid */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Book size={16} className="text-emerald-400" />
                <h5 className="text-sm font-mono font-bold text-emerald-400">PRACTICE GUIDANCE</h5>
                <p className="text-xs text-neutral-500">({selectedStage.practiceTips.length} tips)</p>
              </div>
              <div className="grid gap-3">
                {selectedStage.practiceTips.map((tip, idx) => (
                  <div key={idx} className="bg-emerald-950/20 border border-emerald-700/30 rounded-lg p-4 hover:border-emerald-600/50 transition-all hover:bg-emerald-950/40">
                    <p className="text-sm text-emerald-100 leading-relaxed flex gap-3">
                      <span className="text-emerald-400 font-bold flex-shrink-0">→</span>
                      <span>{tip}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Duration & Timing */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-neutral-900/40 border border-neutral-700/30 rounded-xl p-6 hover:border-neutral-600/50 transition-colors">
                <p className="text-xs font-mono text-neutral-500 mb-2 uppercase tracking-wide">TYPICAL DURATION</p>
                <p className="text-neutral-100 font-medium text-lg">{selectedStage.duration}</p>
              </div>
              <div className="bg-neutral-900/40 border border-neutral-700/30 rounded-xl p-6 hover:border-neutral-600/50 transition-colors">
                <p className="text-xs font-mono text-neutral-500 mb-2 uppercase tracking-wide">STAGE NUMBER</p>
                <p className="text-neutral-100 font-medium text-lg">#{selectedStage.stage} of 16</p>
              </div>
            </div>

            {/* Warnings - Prominent */}
            {selectedStage.warnings && selectedStage.warnings.length > 0 && (
              <div className="bg-gradient-to-br from-amber-950/40 to-red-950/40 border border-amber-700/50 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle size={18} className="text-amber-500" />
                  <h5 className="text-sm font-mono font-bold text-amber-400 uppercase">Important Notes</h5>
                </div>
                <div className="space-y-3">
                  {selectedStage.warnings.map((warning, idx) => (
                    <div key={idx} className="bg-neutral-900/50 rounded-lg p-3 border-l-2 border-amber-600">
                      <p className="text-sm text-amber-100 leading-relaxed">{warning}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Button - Large and Prominent */}
            <button
              onClick={() => {
                handleMarkCurrentStage(selectedStage.stage);
                setSelectedStage(null);
              }}
              disabled={isCurrent}
              className={`
                w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 font-mono text-base flex items-center justify-center gap-2
                ${isCurrent
                  ? 'bg-green-600/20 border border-green-600/50 text-green-400 cursor-default'
                  : 'bg-gradient-to-r from-[#d9aaef]/30 to-[#d9aaef]/20 border border-[#d9aaef]/60 text-[#d9aaef] hover:from-[#d9aaef]/40 hover:to-[#d9aaef]/30 hover:border-[#d9aaef]/80 hover:shadow-[0_8px_24px_rgba(217,170,239,0.25)] transform hover:scale-105'
                }
              `}
            >
              {isCurrent ? (
                <>
                  <CheckCircle size={18} />
                  <span>✓ you are here</span>
                </>
              ) : (
                <>
                  <span>→</span>
                  <span>mark as current stage</span>
                </>
              )}
            </button>

            {/* Helpful note */}
            <div className="text-center p-4 bg-neutral-900/30 rounded-lg border border-neutral-700/20">
              <p className="text-xs text-neutral-500 font-mono">
                💡 Remember: maps are not the territory. Trust your direct experience.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderChatbot = () => {
    return (
      <div className="flex flex-col h-full space-y-6">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-b from-neutral-950 via-neutral-950 to-transparent py-6">
          <h2 className="text-4xl font-bold font-mono text-neutral-100 mb-2">ask grok</h2>
          <p className="text-sm text-neutral-400">practical guidance on navigating vipassana stages</p>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {session.chatHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-neutral-900/40 border border-neutral-700/30 flex items-center justify-center mb-6">
                <MessageCircle size={32} className="text-neutral-600" />
              </div>
              <p className="text-neutral-400 text-base mb-2">No messages yet</p>
              <p className="text-neutral-500 text-sm mb-8 max-w-sm">
                Ask any question about the meditation journey and Grok will provide guidance
              </p>
              <div className="w-full space-y-2">
                <button
                  onClick={() => setChatInput("What is the A&P event?")}
                  className="block w-full px-4 py-3 bg-neutral-900/40 backdrop-blur-sm border border-neutral-700/40 rounded-lg text-[#d9aaef] text-sm hover:bg-neutral-900/60 hover:border-neutral-600/50 transition-all text-left font-mono hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
                >
                  → What is the A&P event?
                </button>
                <button
                  onClick={() => setChatInput("How do I know if I'm in the Dark Night?")}
                  className="block w-full px-4 py-3 bg-neutral-900/40 backdrop-blur-sm border border-neutral-700/40 rounded-lg text-[#d9aaef] text-sm hover:bg-neutral-900/60 hover:border-neutral-600/50 transition-all text-left font-mono hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
                >
                  → Signs of the Dark Night?
                </button>
                <button
                  onClick={() => setChatInput("What should I do if I'm stuck in a difficult stage?")}
                  className="block w-full px-4 py-3 bg-neutral-900/40 backdrop-blur-sm border border-neutral-700/40 rounded-lg text-[#d9aaef] text-sm hover:bg-neutral-900/60 hover:border-neutral-600/50 transition-all text-left font-mono hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
                >
                  → What if I'm stuck?
                </button>
              </div>
            </div>
          ) : (
            <>
              {session.chatHistory.map((msg, idx) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 animate-fade-in-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div
                    className={`
                      max-w-[85%] rounded-xl backdrop-blur-sm transition-all
                      ${msg.role === 'user'
                        ? 'bg-gradient-to-r from-[#d9aaef]/30 to-[#d9aaef]/20 border border-[#d9aaef]/50 text-neutral-100 px-5 py-3 rounded-tr-none shadow-[0_4px_12px_rgba(217,170,239,0.15)]'
                        : 'bg-neutral-900/40 border border-neutral-700/40 text-neutral-200 px-5 py-3 rounded-tl-none hover:border-neutral-600/50 hover:bg-neutral-900/60'
                      }
                    `}
                  >
                    {msg.role === 'grok' && (
                      <div className="text-xs font-mono font-semibold text-[#d9aaef] mb-2 uppercase tracking-wide">⚡ grok</div>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    <p className="text-xs text-neutral-600 mt-2 font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
              ))}
              {isLoadingResponse && (
                <div className="flex gap-3 justify-start animate-fade-in">
                  <div className="bg-neutral-900/40 border border-neutral-700/40 px-5 py-3 rounded-xl rounded-tl-none">
                    <div className="flex items-center gap-3">
                      <Loader2 size={16} className="animate-spin text-[#d9aaef]" />
                      <span className="text-xs text-neutral-400 font-mono">grok is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-neutral-700/30 pt-4 bg-gradient-to-t from-neutral-950/60 to-transparent">
          <div className="flex gap-3">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="ask grok something..."
              className="flex-1 px-4 py-3 bg-neutral-900/40 backdrop-blur-sm border border-neutral-700/40 rounded-lg text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-[#d9aaef]/60 focus:ring-1 focus:ring-[#d9aaef]/30 transition-all text-sm hover:border-neutral-600/50"
              disabled={isLoadingResponse}
            />
            <button
              onClick={handleSendMessage}
              disabled={!chatInput.trim() || isLoadingResponse}
              className="px-4 py-3 bg-gradient-to-r from-[#d9aaef]/30 to-[#d9aaef]/20 border border-[#d9aaef]/50 text-[#d9aaef] rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:from-[#d9aaef]/40 hover:to-[#d9aaef]/30 hover:border-[#d9aaef]/70 hover:shadow-[0_4px_16px_rgba(217,170,239,0.2)] font-medium"
            >
              {isLoadingResponse ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderHistory = () => {
    if (session.stageHistory.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-neutral-900/40 border border-neutral-700/30 flex items-center justify-center mb-6">
            <History size={32} className="text-neutral-600" />
          </div>
          <p className="text-neutral-400 text-base mb-2">
            No history yet
          </p>
          <p className="text-neutral-500 text-sm max-w-sm">
            Mark stages in the map view to start tracking your progress through the ñanas
          </p>
        </div>
      );
    }

    return (
      <div className="pb-20 space-y-8">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-b from-neutral-950 via-neutral-950 to-transparent py-6">
          <h2 className="text-4xl font-bold font-mono text-neutral-100 mb-2">your journey</h2>
          <p className="text-sm text-neutral-400">progression through {session.stageHistory.length} marked stages</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-neutral-900/60 to-neutral-900/20 border border-neutral-700/30 rounded-xl p-4 text-center hover:border-neutral-600/50 transition-colors">
            <p className="text-xs text-neutral-500 font-mono mb-2">TOTAL ENTRIES</p>
            <p className="text-2xl font-bold font-mono text-neutral-100">{session.stageHistory.length}</p>
          </div>
          <div className="bg-gradient-to-br from-[#d9aaef]/10 to-[#d9aaef]/5 border border-[#d9aaef]/30 rounded-xl p-4 text-center hover:border-[#d9aaef]/50 transition-colors">
            <p className="text-xs text-neutral-500 font-mono mb-2">LATEST STAGE</p>
            <p className="text-2xl font-bold font-mono text-[#d9aaef]">#{session.stageHistory[0].stageNumber}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-900/10 border border-emerald-700/30 rounded-xl p-4 text-center hover:border-emerald-600/50 transition-colors">
            <p className="text-xs text-neutral-500 font-mono mb-2">CYCLES COMPLETED</p>
            <p className="text-2xl font-bold font-mono text-emerald-400">{session.cycleCount}</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          {session.stageHistory.map((log, idx) => {
            const stage = getStageByNumber(log.stageNumber);
            const isLatest = idx === 0;

            return (
              <div
                key={`${log.dateNoted}-${idx}`}
                className="relative animate-fade-in-up"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Vertical line connector */}
                {idx < session.stageHistory.length - 1 && (
                  <div className="absolute left-[21px] top-20 w-0.5 h-12 bg-gradient-to-b from-[#d9aaef]/40 to-neutral-700/30" />
                )}

                <div className="flex gap-6">
                  {/* Timeline marker */}
                  <div className="flex flex-col items-center pt-2 flex-shrink-0">
                    <div className={`
                      w-11 h-11 rounded-lg border-2 font-mono text-sm font-bold flex items-center justify-center
                      transition-all duration-300
                      ${isLatest
                        ? 'bg-gradient-to-br from-[#d9aaef]/30 to-[#d9aaef]/10 border-[#d9aaef] text-[#d9aaef] shadow-[0_0_16px_rgba(217,170,239,0.3)]'
                        : 'bg-green-600/20 border-green-600/50 text-green-400'
                      }
                    `}>
                      {log.stageNumber}
                    </div>
                  </div>

                  {/* Content Card */}
                  <div className={`
                    flex-1 p-5 rounded-xl backdrop-blur-sm border transition-all duration-300 group hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)]
                    ${isLatest
                      ? 'bg-gradient-to-br from-[#d9aaef]/15 to-[#d9aaef]/5 border-[#d9aaef]/50'
                      : 'bg-neutral-900/30 border-neutral-700/30 hover:border-neutral-600/50'
                    }
                  `}>
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <div className="flex-1">
                        <h3 className={`text-lg font-semibold mb-1 ${isLatest ? 'text-neutral-100' : 'text-neutral-200'}`}>
                          {log.stageName}
                        </h3>
                        {isLatest && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#d9aaef]/20 border border-[#d9aaef]/50 rounded-full">
                            <Circle size={6} className="fill-[#d9aaef] text-[#d9aaef]" />
                            <span className="text-xs font-mono text-[#d9aaef]">latest entry</span>
                          </span>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-neutral-600 font-mono mb-1">
                          {new Date(log.dateNoted).toLocaleDateString()}
                        </p>
                        <p className="text-sm font-semibold text-neutral-400 font-mono">
                          {new Date(log.dateNoted).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                    </div>

                    {log.cycleNumber !== undefined && log.cycleNumber >= 0 && (
                      <div className="inline-flex items-center gap-2 px-2 py-1 bg-neutral-800/40 border border-neutral-700/40 rounded-lg mb-3">
                        <span className="text-xs text-neutral-500 font-mono">cycle</span>
                        <span className="text-xs font-bold text-neutral-300 font-mono">{log.cycleNumber + 1}</span>
                      </div>
                    )}

                    {log.notes && (
                      <div className="pt-2 border-t border-neutral-700/20">
                        <p className="text-sm text-neutral-300 italic">
                          {log.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-neutral-950 z-50 flex flex-col">
      {/* Header with gradient background */}
      <div className="bg-gradient-to-b from-neutral-900/80 to-neutral-950/40 border-b border-neutral-800/50 px-8 py-6 flex justify-between items-center backdrop-blur-sm">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <Map size={24} className="text-[#d9aaef]" />
            <h1 className="text-3xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-[#d9aaef] to-[#d9aaef]/60">
              insight practice map
            </h1>
          </div>
          <p className="text-xs text-neutral-400 mt-1 ml-9">mahasi sayadaw • progress of insight through vipassana</p>
        </div>
        <button
          onClick={onClose}
          className="text-neutral-600 hover:text-neutral-300 hover:bg-neutral-800/50 transition-all p-2 rounded-lg"
        >
          <X size={24} />
        </button>
      </div>

      {/* Enhanced Tabs */}
      <div className="border-b border-neutral-800/50 px-8 py-0 flex gap-1 bg-neutral-950/50">
        <button
          onClick={() => setViewMode('map')}
          className={`
            flex items-center gap-2 px-4 py-3 text-sm font-mono font-medium transition-all duration-300
            relative
            ${viewMode === 'map'
              ? 'text-[#d9aaef]'
              : 'text-neutral-600 hover:text-neutral-400'
            }
          `}
        >
          <Map size={16} />
          <span>map</span>
          {viewMode === 'map' && (
            <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-[#d9aaef] to-[#d9aaef]/40" />
          )}
        </button>
        <button
          onClick={() => setViewMode('chat')}
          className={`
            flex items-center gap-2 px-4 py-3 text-sm font-mono font-medium transition-all duration-300
            relative
            ${viewMode === 'chat'
              ? 'text-[#d9aaef]'
              : 'text-neutral-600 hover:text-neutral-400'
            }
          `}
        >
          <MessageCircle size={16} />
          <span>ask grok</span>
          {viewMode === 'chat' && (
            <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-[#d9aaef] to-[#d9aaef]/40" />
          )}
        </button>
        <button
          onClick={() => setViewMode('history')}
          className={`
            flex items-center gap-2 px-4 py-3 text-sm font-mono font-medium transition-all duration-300
            relative
            ${viewMode === 'history'
              ? 'text-[#d9aaef]'
              : 'text-neutral-600 hover:text-neutral-400'
            }
          `}
        >
          <History size={16} />
          <span>history</span>
          {viewMode === 'history' && (
            <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-[#d9aaef] to-[#d9aaef]/40" />
          )}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8 bg-gradient-to-b from-neutral-950 via-neutral-950/98 to-neutral-950">
        {viewMode === 'map' && renderStageList()}
        {viewMode === 'chat' && renderChatbot()}
        {viewMode === 'history' && renderHistory()}
      </div>

      {/* Stage Detail Modal */}
      {selectedStage && renderStageDetail()}

      {/* Footer */}
      <div className="border-t border-neutral-800/50 px-8 py-4 bg-neutral-950/60">
        <p className="text-neutral-600 text-xs text-center font-mono italic">
          ✨ maps are not the territory — trust your direct experience
        </p>
      </div>
    </div>
  );
}
