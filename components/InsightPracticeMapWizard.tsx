import React, { useState, useEffect, useRef } from 'react';
import { X, Circle, CheckCircle, MessageCircle, Send, Loader2, Book, History, Map } from 'lucide-react';
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

    return (
      <div className="space-y-8 pb-20">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-b from-neutral-950 via-neutral-950 to-transparent py-6">
          <div className="mb-6">
            <h2 className="text-3xl font-bold font-mono text-neutral-100 mb-1">progress of insight</h2>
            <p className="text-sm text-neutral-400">track your journey through the 16 ñanas</p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs text-neutral-400">
              <span className="font-mono">{completedStages} / 16</span>
              {session.cycleCount > 0 && (
                <span className="text-[#d9aaef]">cycle {session.cycleCount}</span>
              )}
            </div>
            <div className="w-full h-1.5 bg-neutral-900/50 rounded-full overflow-hidden border border-neutral-800/50">
              <div
                className="h-full bg-gradient-to-r from-[#d9aaef] to-[#d9aaef]/60 transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Phases */}
        {phases.map(phase => {
          const stages = getStagesByPhase(phase);

          return (
            <div key={phase} className="space-y-3">
              {/* Phase Header */}
              <div className="px-4 py-2 bg-neutral-900/30 backdrop-blur-sm border border-neutral-800/50 rounded-lg">
                <h3 className="text-sm font-mono text-neutral-300 font-medium">{phase}</h3>
                <p className="text-xs text-neutral-500 mt-0.5">{stages.length} stages</p>
              </div>

              {/* Stage Cards */}
              <div className="space-y-2">
                {stages.map((stage) => {
                  const isCurrent = isCurrentStage(stage.stage, session.currentStage);
                  const isCompleted = session.currentStage && stage.stage < session.currentStage;

                  return (
                    <div
                      key={stage.stage}
                      onClick={() => setSelectedStage(stage)}
                      className={`
                        group relative p-4 rounded-lg cursor-pointer transition-all duration-300
                        backdrop-blur-sm border
                        ${isCurrent
                          ? 'bg-[#d9aaef]/10 border-[#d9aaef]/40 shadow-[0_4px_24px_rgba(217,170,239,0.15)]'
                          : isCompleted
                          ? 'bg-neutral-900/30 border-green-600/30 hover:bg-neutral-900/50'
                          : 'bg-neutral-900/30 border-neutral-800/50 hover:bg-neutral-900/50 hover:border-neutral-700/50'
                        }
                        hover:shadow-[0_4px_24px_rgba(0,0,0,0.4)] hover:-translate-y-0.5
                      `}
                    >
                      <div className="flex items-center gap-4">
                        {/* Stage Number */}
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-mono text-sm font-bold">
                          {isCurrent ? (
                            <div className="w-8 h-8 rounded-lg bg-[#d9aaef]/30 border border-[#d9aaef] flex items-center justify-center">
                              <CheckCircle size={16} className="text-[#d9aaef]" />
                            </div>
                          ) : isCompleted ? (
                            <div className="w-8 h-8 rounded-lg bg-green-600/20 border border-green-600/50 flex items-center justify-center">
                              <CheckCircle size={16} className="text-green-500" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400">
                              {stage.stage}
                            </div>
                          )}
                        </div>

                        {/* Stage Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-sm font-medium text-neutral-100 group-hover:text-[#d9aaef] transition-colors">
                              {stage.name}
                            </span>
                            <span className="text-xs font-mono text-neutral-500">{stage.code}</span>
                          </div>
                          {isCurrent && (
                            <p className="text-xs text-[#d9aaef] font-mono">current stage</p>
                          )}
                          {isCompleted && (
                            <p className="text-xs text-green-500 font-mono">completed</p>
                          )}
                        </div>

                        {/* Arrow */}
                        <div className="flex-shrink-0 text-neutral-600 group-hover:text-neutral-400 opacity-0 group-hover:opacity-100 transition-all">
                          →
                        </div>
                      </div>
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

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800/50 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
          {/* Header */}
          <div className="sticky top-0 border-b border-neutral-800/50 px-8 py-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-xs font-mono text-neutral-500 mb-2">{selectedStage.code} • {selectedStage.phase}</div>
                <h3 className="text-3xl font-bold font-mono text-neutral-100">
                  stage {selectedStage.stage}
                </h3>
                <h4 className="text-lg text-neutral-400 mt-2">
                  {selectedStage.name}
                </h4>
              </div>
              <button
                onClick={() => setSelectedStage(null)}
                className="text-neutral-600 hover:text-neutral-300 transition-colors p-1"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-8 space-y-8">
            {/* Description */}
            <div className="bg-neutral-900/30 backdrop-blur-sm border border-neutral-800/50 rounded-lg p-6">
              <p className="text-neutral-200 leading-relaxed">{selectedStage.description}</p>
            </div>

            {/* Key Markers */}
            <div>
              <h5 className="text-sm font-mono font-bold text-[#d9aaef] mb-4">key markers</h5>
              <div className="space-y-3">
                {selectedStage.keyMarkers.map((marker, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="text-neutral-600 font-mono text-lg mt-0.5">•</div>
                    <p className="text-sm text-neutral-300 pt-0.5">{marker}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Practice Tips */}
            <div>
              <h5 className="text-sm font-mono font-bold text-[#d9aaef] mb-4">practice guidance</h5>
              <div className="space-y-3">
                {selectedStage.practiceTips.map((tip, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="text-neutral-600 font-mono text-lg mt-0.5">→</div>
                    <p className="text-sm text-neutral-300 pt-0.5">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="bg-neutral-900/30 backdrop-blur-sm border border-neutral-800/50 rounded-lg p-6">
              <p className="text-xs font-mono text-neutral-500 mb-2">DURATION</p>
              <p className="text-neutral-200 font-medium">{selectedStage.duration}</p>
            </div>

            {/* Warnings */}
            {selectedStage.warnings && selectedStage.warnings.length > 0 && (
              <div className="bg-red-950/30 backdrop-blur-sm border border-red-900/50 rounded-lg p-6">
                <p className="text-xs font-mono text-red-500 font-bold mb-3">⚠ IMPORTANT NOTES</p>
                <div className="space-y-3">
                  {selectedStage.warnings.map((warning, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="text-red-700 font-mono text-lg mt-0.5">•</div>
                      <p className="text-sm text-red-300 pt-0.5">{warning}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={() => {
                handleMarkCurrentStage(selectedStage.stage);
                setSelectedStage(null);
              }}
              disabled={isCurrent}
              className={`
                w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 font-mono text-sm
                ${isCurrent
                  ? 'bg-green-600/20 border border-green-600/50 text-green-500 cursor-default'
                  : 'bg-[#d9aaef]/20 border border-[#d9aaef]/50 text-[#d9aaef] hover:bg-[#d9aaef]/30 hover:border-[#d9aaef]/60 hover:shadow-[0_4px_16px_rgba(217,170,239,0.2)]'
                }
              `}
            >
              {isCurrent ? '✓ you are here' : 'mark as current stage'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderChatbot = () => {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-b from-neutral-950 via-neutral-950 to-transparent py-6 mb-6">
          <h2 className="text-3xl font-bold font-mono text-neutral-100 mb-2">ask grok</h2>
          <p className="text-sm text-neutral-400">concise guidance about your practice</p>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2">
          {session.chatHistory.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle size={32} className="text-neutral-600 mx-auto mb-4" />
              <p className="text-neutral-400 text-sm mb-6">
                No messages yet. Ask a question to get started.
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => setChatInput("What is the A&P event?")}
                  className="block w-full px-4 py-2.5 bg-neutral-900/30 backdrop-blur-sm border border-neutral-800/50 rounded-lg text-[#d9aaef] text-sm hover:bg-neutral-900/50 hover:border-neutral-700/50 transition-all text-left font-mono"
                >
                  → What is the A&P event?
                </button>
                <button
                  onClick={() => setChatInput("How do I know if I'm in the Dark Night?")}
                  className="block w-full px-4 py-2.5 bg-neutral-900/30 backdrop-blur-sm border border-neutral-800/50 rounded-lg text-[#d9aaef] text-sm hover:bg-neutral-900/50 hover:border-neutral-700/50 transition-all text-left font-mono"
                >
                  → Signs of the Dark Night?
                </button>
                <button
                  onClick={() => setChatInput("What should I do if I'm stuck?")}
                  className="block w-full px-4 py-2.5 bg-neutral-900/30 backdrop-blur-sm border border-neutral-800/50 rounded-lg text-[#d9aaef] text-sm hover:bg-neutral-900/50 hover:border-neutral-700/50 transition-all text-left font-mono"
                >
                  → What if I'm stuck?
                </button>
              </div>
            </div>
          ) : (
            <>
              {session.chatHistory.map(msg => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`
                      max-w-[85%] rounded-lg transition-all
                      ${msg.role === 'user'
                        ? 'bg-[#d9aaef]/20 border border-[#d9aaef]/40 text-neutral-200 px-4 py-3 rounded-br-none'
                        : 'bg-neutral-900/30 backdrop-blur-sm border border-neutral-800/50 text-neutral-200 px-4 py-3 rounded-bl-none'
                      }
                    `}
                  >
                    {msg.role === 'grok' && (
                      <div className="text-xs text-[#d9aaef] font-mono mb-1.5">grok</div>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    <p className="text-xs text-neutral-500 mt-2">
                      {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
              ))}
              {isLoadingResponse && (
                <div className="flex gap-3 justify-start">
                  <div className="bg-neutral-900/30 backdrop-blur-sm border border-neutral-800/50 px-4 py-3 rounded-lg rounded-bl-none">
                    <div className="flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin text-[#d9aaef]" />
                      <span className="text-xs text-neutral-400 font-mono">grok thinking</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-neutral-800/50 pt-4">
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
              placeholder="ask grok..."
              className="flex-1 px-4 py-2.5 bg-neutral-900/30 backdrop-blur-sm border border-neutral-800/50 rounded-lg text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-[#d9aaef]/50 focus:ring-1 focus:ring-[#d9aaef]/20 transition-all text-sm"
              disabled={isLoadingResponse}
            />
            <button
              onClick={handleSendMessage}
              disabled={!chatInput.trim() || isLoadingResponse}
              className="px-4 py-2.5 bg-[#d9aaef]/20 border border-[#d9aaef]/40 text-[#d9aaef] rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#d9aaef]/30 hover:border-[#d9aaef]/60 hover:shadow-[0_4px_16px_rgba(217,170,239,0.15)]"
            >
              {isLoadingResponse ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
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
        <div className="text-center py-16">
          <History size={32} className="text-neutral-600 mx-auto mb-4" />
          <p className="text-neutral-400 text-sm">
            No history yet. Mark stages to start tracking your progress.
          </p>
        </div>
      );
    }

    return (
      <div className="pb-20">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-b from-neutral-950 via-neutral-950 to-transparent py-6 mb-6">
          <h2 className="text-3xl font-bold font-mono text-neutral-100 mb-1">your journey</h2>
          <p className="text-sm text-neutral-400">progress through the ñanas</p>
        </div>

        {/* Timeline */}
        <div className="space-y-3">
          {session.stageHistory.map((log, idx) => {
            const stage = getStageByNumber(log.stageNumber);
            const isLatest = idx === 0;

            return (
              <div
                key={`${log.dateNoted}-${idx}`}
                className="relative"
              >
                {/* Vertical line connector */}
                {idx < session.stageHistory.length - 1 && (
                  <div className="absolute left-[19px] top-16 w-0.5 h-8 bg-neutral-800/50" />
                )}

                <div className="flex gap-5">
                  {/* Timeline marker */}
                  <div className="flex flex-col items-center pt-2 flex-shrink-0">
                    <div className={`
                      w-10 h-10 rounded-lg border font-mono text-sm font-bold flex items-center justify-center
                      ${isLatest
                        ? 'bg-[#d9aaef]/20 border-[#d9aaef]/50 text-[#d9aaef]'
                        : 'bg-green-600/20 border-green-600/50 text-green-500'
                      }
                    `}>
                      {log.stageNumber}
                    </div>
                  </div>

                  {/* Content Card */}
                  <div className={`
                    flex-1 p-4 rounded-lg backdrop-blur-sm border transition-all duration-300
                    ${isLatest
                      ? 'bg-[#d9aaef]/10 border-[#d9aaef]/40'
                      : 'bg-neutral-900/30 border-neutral-800/50'
                    }
                  `}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-neutral-100 font-medium">
                          {log.stageName}
                        </h3>
                        {isLatest && (
                          <p className="text-xs text-[#d9aaef] font-mono mt-1">latest</p>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 font-mono">
                        {new Date(log.dateNoted).toLocaleDateString()} {new Date(log.dateNoted).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>

                    {log.cycleNumber !== undefined && log.cycleNumber >= 0 && (
                      <p className="text-xs text-neutral-400 font-mono mb-2">
                        cycle {log.cycleNumber}
                      </p>
                    )}

                    {log.notes && (
                      <p className="text-sm text-neutral-300 italic mt-2">
                        {log.notes}
                      </p>
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
      {/* Header */}
      <div className="border-b border-neutral-800/50 px-8 py-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-mono text-neutral-100">insight practice map</h1>
          <p className="text-xs text-neutral-500 mt-1">mahasi sayadaw progress of insight</p>
        </div>
        <button
          onClick={onClose}
          className="text-neutral-600 hover:text-neutral-400 transition-colors p-1.5"
        >
          <X size={24} />
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-800/50 px-8 py-4 flex gap-6">
        <button
          onClick={() => setViewMode('map')}
          className={`
            flex items-center gap-2 px-3 py-2 text-sm font-mono font-medium transition-all duration-300
            border-b-2 -mb-4 pb-4
            ${viewMode === 'map'
              ? 'border-[#d9aaef] text-[#d9aaef]'
              : 'border-transparent text-neutral-600 hover:text-neutral-400'
            }
          `}
        >
          <Map size={16} />
          <span>map</span>
        </button>
        <button
          onClick={() => setViewMode('chat')}
          className={`
            flex items-center gap-2 px-3 py-2 text-sm font-mono font-medium transition-all duration-300
            border-b-2 -mb-4 pb-4
            ${viewMode === 'chat'
              ? 'border-[#d9aaef] text-[#d9aaef]'
              : 'border-transparent text-neutral-600 hover:text-neutral-400'
            }
          `}
        >
          <MessageCircle size={16} />
          <span>ask grok</span>
        </button>
        <button
          onClick={() => setViewMode('history')}
          className={`
            flex items-center gap-2 px-3 py-2 text-sm font-mono font-medium transition-all duration-300
            border-b-2 -mb-4 pb-4
            ${viewMode === 'history'
              ? 'border-[#d9aaef] text-[#d9aaef]'
              : 'border-transparent text-neutral-600 hover:text-neutral-400'
            }
          `}
        >
          <History size={16} />
          <span>history</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {viewMode === 'map' && renderStageList()}
        {viewMode === 'chat' && renderChatbot()}
        {viewMode === 'history' && renderHistory()}
      </div>

      {/* Stage Detail Modal */}
      {selectedStage && renderStageDetail()}

      {/* Footer */}
      <div className="border-t border-neutral-800/50 px-8 py-4">
        <p className="text-neutral-600 text-xs text-center font-mono">
          maps are not the territory
        </p>
      </div>
    </div>
  );
}
