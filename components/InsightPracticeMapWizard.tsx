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
        {/* Header with Progress */}
        <div className="sticky top-0 bg-gradient-to-b from-slate-950 via-slate-950 to-transparent pt-2 pb-6">
          <div className="text-center mb-4">
            <h2 className="text-3xl font-black text-slate-100 mb-1">Progress of Insight</h2>
            <p className="text-slate-400 text-sm">The 16 Ñanas Journey</p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-xs font-medium text-slate-300">
                {completedStages} / 16 Stages
              </p>
              {session.cycleCount > 0 && (
                <p className="text-xs font-medium text-emerald-400">
                  ✓ Cycle {session.cycleCount}
                </p>
              )}
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stages by Phase */}
        {phases.map(phase => {
          const stages = getStagesByPhase(phase);
          const phaseColorClass = getPhaseColor(phase);
          const phaseNum = phases.indexOf(phase);

          return (
            <div key={phase} className="space-y-3">
              <div className={`px-4 py-3 rounded-xl border-2 ${phaseColorClass} bg-opacity-20 backdrop-blur-sm`}>
                <h3 className="font-bold text-base">{phase}</h3>
                <p className="text-xs opacity-70 mt-0.5">
                  {stages.length} Stages
                </p>
              </div>

              <div className="grid gap-2.5">
                {stages.map((stage, idx) => {
                  const isCurrent = isCurrentStage(stage.stage, session.currentStage);
                  const isCompleted = session.currentStage && stage.stage < session.currentStage;
                  const stageNum = stage.stage;

                  return (
                    <div
                      key={stage.stage}
                      onClick={() => setSelectedStage(stage)}
                      className={`
                        group p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                        ${isCurrent
                          ? 'bg-gradient-to-r from-purple-600/30 to-purple-500/10 border-purple-500/70 shadow-lg shadow-purple-500/20'
                          : isCompleted
                          ? 'bg-slate-800/50 border-slate-600/50 hover:border-slate-500/70'
                          : 'bg-slate-800/30 border-slate-700/40 hover:bg-slate-800/40 hover:border-slate-600/50'
                        }
                      `}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          {isCurrent ? (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center animate-pulse">
                              <CheckCircle size={18} className="text-white" />
                            </div>
                          ) : isCompleted ? (
                            <div className="w-8 h-8 rounded-full bg-emerald-500/30 flex items-center justify-center">
                              <CheckCircle size={18} className="text-emerald-400" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                              {stageNum}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-0.5">
                            <span className="text-slate-100 font-semibold text-sm group-hover:text-white transition-colors">
                              {stage.name}
                            </span>
                            <span className="text-slate-500 text-xs font-mono bg-slate-900/50 px-2 py-0.5 rounded">
                              {stage.code}
                            </span>
                          </div>
                          {isCurrent && (
                            <p className="text-purple-300 text-xs font-medium">📍 Current Stage</p>
                          )}
                          {isCompleted && (
                            <p className="text-emerald-400 text-xs font-medium">✓ Completed</p>
                          )}
                        </div>

                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="text-slate-400 group-hover:text-slate-200">
                            →
                          </div>
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

    const phaseColorClass = getPhaseColor(selectedStage.phase);
    const isCurrent = isCurrentStage(selectedStage.stage, session.currentStage);

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-slate-900 to-slate-950 border-b-2 border-slate-700 px-6 py-5 flex justify-between items-start backdrop-blur-sm">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className={`px-3 py-1 rounded-lg border-2 ${phaseColorClass} text-xs font-bold`}>
                  {selectedStage.phase}
                </div>
                <span className="text-slate-400 font-mono text-sm">{selectedStage.code}</span>
              </div>
              <h3 className="text-3xl font-black text-slate-100">
                Stage {selectedStage.stage}
              </h3>
              <h4 className="text-lg font-semibold text-slate-300 mt-1">
                {selectedStage.name}
              </h4>
            </div>
            <button
              onClick={() => setSelectedStage(null)}
              className="text-slate-400 hover:text-slate-200 transition-colors p-2 hover:bg-slate-800 rounded-lg"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Description */}
            <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4">
              <p className="text-slate-200 leading-relaxed text-base">{selectedStage.description}</p>
            </div>

            {/* Key Markers */}
            <div>
              <h4 className="text-slate-100 font-bold text-lg mb-3 flex items-center gap-2">
                <span className="text-purple-400">✦</span> What to Look For
              </h4>
              <div className="space-y-2">
                {selectedStage.keyMarkers.map((marker, idx) => (
                  <div key={idx} className="bg-slate-800/30 border-l-2 border-purple-500/50 rounded-lg p-3 flex gap-3">
                    <span className="text-purple-400 font-bold flex-shrink-0">•</span>
                    <span className="text-slate-300 text-sm">{marker}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Practice Tips */}
            <div>
              <h4 className="text-slate-100 font-bold text-lg mb-3 flex items-center gap-2">
                <span className="text-emerald-400">★</span> Practice Tips
              </h4>
              <div className="space-y-2">
                {selectedStage.practiceTips.map((tip, idx) => (
                  <div key={idx} className="bg-emerald-500/10 border-l-2 border-emerald-500/50 rounded-lg p-3 flex gap-3">
                    <span className="text-emerald-400 font-bold flex-shrink-0">→</span>
                    <span className="text-slate-300 text-sm">{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4">
              <p className="text-slate-300 text-sm">
                <span className="font-bold text-slate-200">⏱ Expected Duration:</span>
              </p>
              <p className="text-slate-200 font-semibold mt-1">{selectedStage.duration}</p>
            </div>

            {/* Warnings */}
            {selectedStage.warnings && selectedStage.warnings.length > 0 && (
              <div className="bg-red-500/10 border-2 border-red-500/40 rounded-xl p-4">
                <h4 className="text-red-400 font-bold mb-3 flex items-center gap-2">
                  <span>⚠️</span> Important Notes
                </h4>
                <div className="space-y-2">
                  {selectedStage.warnings.map((warning, idx) => (
                    <div key={idx} className="flex gap-3">
                      <span className="text-red-400 font-bold flex-shrink-0">•</span>
                      <span className="text-red-300 text-sm">{warning}</span>
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
              className={`
                w-full px-6 py-4 rounded-xl font-bold text-lg transition-all duration-200
                ${isCurrent
                  ? 'bg-emerald-500/20 border-2 border-emerald-500/50 text-emerald-400 cursor-default'
                  : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white shadow-lg hover:shadow-purple-500/25 hover:scale-105'
                }
              `}
              disabled={isCurrent}
            >
              {isCurrent
                ? '✓ You are currently here'
                : '📍 Mark as Current Stage'
              }
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderChatbot = () => {
    return (
      <div className="flex flex-col h-full">
        {/* Chat Header */}
        <div className="sticky top-0 bg-gradient-to-b from-slate-950 via-slate-950 to-transparent text-center mb-4 pb-6 pt-2">
          <h2 className="text-3xl font-black text-slate-100 mb-2">Ask Grok</h2>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            Get concise guidance about stages and your practice
          </p>
          <div className="mt-3 px-3 py-2 bg-gradient-to-r from-purple-500/10 to-purple-400/5 border border-purple-500/30 rounded-xl inline-block">
            <p className="text-purple-400 text-xs font-medium">
              💭 Powered by Grok
            </p>
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-6">
          {session.chatHistory.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 mx-auto mb-6 bg-purple-500/10 border border-purple-500/30 rounded-full flex items-center justify-center">
                <MessageCircle size={32} className="text-purple-400" />
              </div>
              <p className="text-slate-400 text-sm mb-8">
                No messages yet. Ask a question about the stages or your practice!
              </p>
              <div className="space-y-3">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">💡 Try asking:</p>
                <button
                  onClick={() => setChatInput("What is the A&P event?")}
                  className="block w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-purple-400 text-sm hover:bg-slate-800 hover:border-purple-500/50 transition-all text-left font-medium"
                >
                  → What is the A&P event?
                </button>
                <button
                  onClick={() => setChatInput("How do I know if I'm in the Dark Night?")}
                  className="block w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-purple-400 text-sm hover:bg-slate-800 hover:border-purple-500/50 transition-all text-left font-medium"
                >
                  → How do I know if I'm in the Dark Night?
                </button>
                <button
                  onClick={() => setChatInput("What should I do if I'm stuck in Re-observation?")}
                  className="block w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-purple-400 text-sm hover:bg-slate-800 hover:border-purple-500/50 transition-all text-left font-medium"
                >
                  → What should I do if I'm stuck?
                </button>
              </div>
            </div>
          ) : (
            <>
              {session.chatHistory.map(msg => (
                <div
                  key={msg.id}
                  className={`
                    flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300
                    ${msg.role === 'user' ? 'justify-end' : 'justify-start'}
                  `}
                >
                  <div
                    className={`
                      max-w-[85%] px-4 py-3 rounded-2xl transition-all
                      ${msg.role === 'user'
                        ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-br-none shadow-lg'
                        : 'bg-slate-800/60 border border-slate-700 text-slate-100 rounded-bl-none'
                      }
                    `}
                  >
                    {msg.role === 'grok' && (
                      <div className="flex items-center gap-2 mb-2 text-purple-400 text-xs font-bold">
                        <MessageCircle size={14} />
                        <span>GROK</span>
                      </div>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    <p className={`text-xs mt-2 opacity-70 ${msg.role === 'user' ? 'text-purple-100' : 'text-slate-400'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {isLoadingResponse && (
                <div className="flex gap-3 justify-start animate-in fade-in duration-300">
                  <div className="bg-slate-800/60 border border-slate-700 px-4 py-3 rounded-2xl rounded-bl-none">
                    <div className="flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin text-purple-400" />
                      <span className="text-sm text-slate-300 font-medium">Grok thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </>
          )}
        </div>

        {/* Chat Input */}
        <div className="border-t border-slate-700 pt-4 sticky bottom-0 bg-slate-950">
          <div className="flex gap-2">
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
              placeholder="Ask about stages or your practice..."
              className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              disabled={isLoadingResponse}
            />
            <button
              onClick={handleSendMessage}
              disabled={!chatInput.trim() || isLoadingResponse}
              className="px-4 py-3 bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl transition-all font-medium hover:shadow-lg hover:shadow-purple-500/25 disabled:shadow-none"
            >
              {isLoadingResponse ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Send size={20} />
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
          <div className="w-16 h-16 mx-auto mb-6 bg-slate-700/20 rounded-full flex items-center justify-center">
            <History size={32} className="text-slate-500" />
          </div>
          <p className="text-slate-400 text-sm">
            No history yet. Start marking stages as you progress!
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4 pb-20">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-b from-slate-950 via-slate-950 to-transparent text-center mb-6 pt-2 pb-6">
          <h2 className="text-3xl font-black text-slate-100 mb-1">Your Journey</h2>
          <p className="text-slate-400 text-sm">Progress through the 16 Ñanas</p>
        </div>

        {/* Timeline */}
        <div className="space-y-3">
          {session.stageHistory.map((log, idx) => {
            const stage = getStageByNumber(log.stageNumber);
            const phaseColor = stage ? getPhaseColor(stage.phase) : '';
            const isLatest = idx === 0;

            return (
              <div
                key={`${log.dateNoted}-${idx}`}
                className={`
                  relative group animate-in fade-in slide-in-from-right-4 duration-300
                  ${isLatest ? 'ring-2 ring-purple-500/50' : ''}
                `}
              >
                {/* Timeline connector */}
                {idx < session.stageHistory.length - 1 && (
                  <div className="absolute left-5 top-12 w-1 h-8 bg-gradient-to-b from-slate-700 to-slate-800" />
                )}

                <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/20 border border-slate-700 rounded-xl p-4 hover:bg-gradient-to-br hover:from-slate-800/70 hover:to-slate-800/40 transition-all">
                  <div className="flex gap-4">
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center pt-1">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0
                        ${isLatest
                          ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white ring-2 ring-purple-500/50 ring-offset-2 ring-offset-slate-800'
                          : 'bg-slate-700 text-slate-300'
                        }
                      `}>
                        {log.stageNumber}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <h3 className="text-slate-100 font-bold">
                          {log.stageName}
                        </h3>
                        {isLatest && (
                          <span className="text-purple-400 text-xs font-bold px-2 py-1 bg-purple-500/20 rounded">
                            Latest
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 mb-2 text-xs">
                        {log.cycleNumber !== undefined && log.cycleNumber >= 0 && (
                          <div className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded text-emerald-400 font-medium">
                            🔄 Cycle {log.cycleNumber}
                          </div>
                        )}
                        <div className="px-2 py-1 bg-slate-700/50 rounded text-slate-400">
                          📅 {new Date(log.dateNoted).toLocaleDateString()} at {new Date(log.dateNoted).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>

                      {log.notes && (
                        <p className="text-slate-400 text-sm italic mt-2 p-2 bg-slate-900/40 rounded border-l-2 border-slate-600">
                          "{log.notes}"
                        </p>
                      )}
                    </div>
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
    <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-900 border-b-2 border-slate-800 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-100">Insight Practice Map</h1>
          <p className="text-slate-400 text-xs mt-0.5">Progress of Insight (16 Ñanas)</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 transition-colors p-2 hover:bg-slate-800 rounded-lg"
        >
          <X size={24} />
        </button>
      </div>

      {/* View Mode Tabs */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex gap-2">
        <button
          onClick={() => setViewMode('map')}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all
            ${viewMode === 'map'
              ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/25'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-300'
            }
          `}
        >
          <Map size={18} />
          <span>Map</span>
        </button>
        <button
          onClick={() => setViewMode('chat')}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all
            ${viewMode === 'chat'
              ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/25'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-300'
            }
          `}
        >
          <MessageCircle size={18} />
          <span>Ask Grok</span>
        </button>
        <button
          onClick={() => setViewMode('history')}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all
            ${viewMode === 'history'
              ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/25'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-300'
            }
          `}
        >
          <History size={18} />
          <span>History</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-slate-950 to-slate-950">
        {viewMode === 'map' && renderStageList()}
        {viewMode === 'chat' && renderChatbot()}
        {viewMode === 'history' && renderHistory()}
      </div>

      {/* Stage Detail Modal */}
      {selectedStage && renderStageDetail()}

      {/* Info Footer */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-900 border-t-2 border-slate-800 px-6 py-3">
        <p className="text-slate-500 text-xs text-center font-medium">
          🧘 Based on Mahasi Sayadaw's Progress of Insight • Maps are not the territory
        </p>
      </div>
    </div>
  );
}
