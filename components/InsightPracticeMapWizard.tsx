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

    return (
      <div className="space-y-6 pb-20">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Progress of Insight Map</h2>
          <p className="text-slate-400 text-sm">The 16 Ñanas of Insight Meditation</p>
          {session.cycleCount > 0 && (
            <p className="text-emerald-400 text-sm mt-2">
              Cycles completed: {session.cycleCount}
            </p>
          )}
        </div>

        {phases.map(phase => {
          const stages = getStagesByPhase(phase);
          const phaseColorClass = getPhaseColor(phase);

          return (
            <div key={phase} className="space-y-2">
              <div className={`px-3 py-2 rounded-lg border ${phaseColorClass}`}>
                <h3 className="font-semibold">{phase}</h3>
              </div>

              <div className="space-y-2">
                {stages.map(stage => {
                  const isCurrent = isCurrentStage(stage.stage, session.currentStage);

                  return (
                    <div
                      key={stage.stage}
                      onClick={() => setSelectedStage(stage)}
                      className={`
                        p-3 rounded-lg border cursor-pointer transition-all
                        ${isCurrent
                          ? 'bg-purple-500/20 border-purple-500/50'
                          : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600/50'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        {isCurrent ? (
                          <CheckCircle size={20} className="text-purple-400 flex-shrink-0" />
                        ) : (
                          <Circle size={20} className="text-slate-500 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="text-slate-100 font-medium">
                              {stage.stage}. {stage.name}
                            </span>
                            <span className="text-slate-500 text-xs">{stage.code}</span>
                          </div>
                          {isCurrent && (
                            <p className="text-purple-400 text-xs mt-1">You are here</p>
                          )}
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

    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold text-slate-100">
                Stage {selectedStage.stage}: {selectedStage.name}
              </h3>
              <p className="text-slate-400 text-sm">{selectedStage.code}</p>
            </div>
            <button
              onClick={() => setSelectedStage(null)}
              className="text-slate-400 hover:text-slate-300"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div className={`px-3 py-2 rounded-lg border ${phaseColorClass}`}>
              <p className="font-semibold">{selectedStage.phase}</p>
            </div>

            <div>
              <p className="text-slate-300">{selectedStage.description}</p>
            </div>

            <div>
              <h4 className="text-slate-100 font-semibold mb-2">What to Look For:</h4>
              <ul className="space-y-1">
                {selectedStage.keyMarkers.map((marker, idx) => (
                  <li key={idx} className="text-slate-300 text-sm flex gap-2">
                    <span className="text-purple-400">•</span>
                    <span>{marker}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-slate-100 font-semibold mb-2">Practice Tips:</h4>
              <ul className="space-y-1">
                {selectedStage.practiceTips.map((tip, idx) => (
                  <li key={idx} className="text-slate-300 text-sm flex gap-2">
                    <span className="text-emerald-400">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {selectedStage.warnings && selectedStage.warnings.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <h4 className="text-red-400 font-semibold mb-2">⚠️ Important Notes:</h4>
                <ul className="space-y-1">
                  {selectedStage.warnings.map((warning, idx) => (
                    <li key={idx} className="text-red-300 text-sm flex gap-2">
                      <span>•</span>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className="text-slate-400 text-sm">
                <strong>Duration:</strong> {selectedStage.duration}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  handleMarkCurrentStage(selectedStage.stage);
                  setSelectedStage(null);
                }}
                className={`
                  flex-1 px-4 py-3 rounded-lg font-medium transition-all
                  ${isCurrentStage(selectedStage.stage, session.currentStage)
                    ? 'bg-slate-700 text-slate-400 cursor-default'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }
                `}
                disabled={isCurrentStage(selectedStage.stage, session.currentStage)}
              >
                {isCurrentStage(selectedStage.stage, session.currentStage)
                  ? 'Currently Here'
                  : 'Mark as Current Stage'
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderChatbot = () => {
    return (
      <div className="flex flex-col h-full">
        <div className="text-center mb-4 pb-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-slate-100 mb-2">Ask Grok</h2>
          <p className="text-slate-400 text-sm">
            Ask questions about the stages, your practice, or any confusion
          </p>
          <div className="mt-2 px-3 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <p className="text-purple-400 text-xs">
              Powered by Grok - xAI's AI assistant
            </p>
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {session.chatHistory.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle size={48} className="text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-sm">
                No messages yet. Ask a question about the stages!
              </p>
              <div className="mt-6 space-y-2">
                <p className="text-slate-500 text-xs">Example questions:</p>
                <button
                  onClick={() => setChatInput("What is the A&P event?")}
                  className="block mx-auto text-purple-400 text-xs hover:text-purple-300"
                >
                  "What is the A&P event?"
                </button>
                <button
                  onClick={() => setChatInput("How do I know if I'm in the Dark Night?")}
                  className="block mx-auto text-purple-400 text-xs hover:text-purple-300"
                >
                  "How do I know if I'm in the Dark Night?"
                </button>
                <button
                  onClick={() => setChatInput("What should I do if I'm stuck in Re-observation?")}
                  className="block mx-auto text-purple-400 text-xs hover:text-purple-300"
                >
                  "What should I do if I'm stuck in Re-observation?"
                </button>
              </div>
            </div>
          ) : (
            <>
              {session.chatHistory.map(msg => (
                <div
                  key={msg.id}
                  className={`
                    flex gap-3
                    ${msg.role === 'user' ? 'justify-end' : 'justify-start'}
                  `}
                >
                  <div
                    className={`
                      max-w-[80%] p-3 rounded-lg
                      ${msg.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-800 text-slate-100 border border-slate-700'
                      }
                    `}
                  >
                    {msg.role === 'grok' && (
                      <div className="flex items-center gap-2 mb-2 text-purple-400 text-xs">
                        <MessageCircle size={14} />
                        <span>Grok</span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                    <p className={`text-xs mt-2 ${msg.role === 'user' ? 'text-purple-200' : 'text-slate-500'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {isLoadingResponse && (
                <div className="flex gap-3 justify-start">
                  <div className="bg-slate-800 text-slate-100 border border-slate-700 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin text-purple-400" />
                      <span className="text-sm text-slate-400">Grok is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </>
          )}
        </div>

        {/* Chat Input */}
        <div className="border-t border-slate-700 pt-4">
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
              placeholder="Ask about the stages, your practice..."
              className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
              disabled={isLoadingResponse}
            />
            <button
              onClick={handleSendMessage}
              disabled={!chatInput.trim() || isLoadingResponse}
              className="px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-all"
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
        <div className="text-center py-12">
          <History size={48} className="text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-sm">
            No stage history yet. Mark stages as you progress!
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3 pb-20">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-slate-100 mb-2">Stage History</h2>
          <p className="text-slate-400 text-sm">Your journey through the ñanas</p>
        </div>

        {session.stageHistory.map((log, idx) => (
          <div
            key={`${log.dateNoted}-${idx}`}
            className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-slate-100 font-medium">
                  {log.stageNumber}. {log.stageName}
                </h3>
                {log.cycleNumber !== undefined && log.cycleNumber > 0 && (
                  <p className="text-emerald-400 text-xs">Cycle {log.cycleNumber}</p>
                )}
              </div>
              <p className="text-slate-500 text-xs">
                {new Date(log.dateNoted).toLocaleDateString()}
              </p>
            </div>
            {log.notes && (
              <p className="text-slate-400 text-sm mt-2">{log.notes}</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-100">Insight Practice Map</h1>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-300 transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      {/* View Mode Tabs */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex gap-2">
        <button
          onClick={() => setViewMode('map')}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
            ${viewMode === 'map'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-slate-300'
            }
          `}
        >
          <Map size={18} />
          <span>Map</span>
        </button>
        <button
          onClick={() => setViewMode('chat')}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
            ${viewMode === 'chat'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-slate-300'
            }
          `}
        >
          <MessageCircle size={18} />
          <span>Ask Grok</span>
        </button>
        <button
          onClick={() => setViewMode('history')}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
            ${viewMode === 'history'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-slate-300'
            }
          `}
        >
          <History size={18} />
          <span>History</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {viewMode === 'map' && renderStageList()}
        {viewMode === 'chat' && renderChatbot()}
        {viewMode === 'history' && renderHistory()}
      </div>

      {/* Stage Detail Modal */}
      {selectedStage && renderStageDetail()}

      {/* Info Footer */}
      <div className="bg-slate-900 border-t border-slate-800 p-3">
        <p className="text-slate-500 text-xs text-center">
          Based on Mahasi Sayadaw's Progress of Insight. Maps are not the territory.
        </p>
      </div>
    </div>
  );
}
