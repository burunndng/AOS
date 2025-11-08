import React, { useState, useEffect, useRef } from 'react';
import { BigMindSession, BigMindMessage, BigMindVoice, BigMindStage, IntegratedInsight } from '../types.ts';
import { X, ArrowLeft, ArrowRight, Lightbulb, Plus, Send } from 'lucide-react';
import { generateBigMindResponse, summarizeBigMindSession, getDefaultVoices, createBigMindIntegratedInsight } from '../services/bigMindService.ts';

interface BigMindProcessWizardProps {
  onClose: (draft?: Partial<BigMindSession>) => void;
  onSave: (session: BigMindSession) => void;
  session: Partial<BigMindSession> | null;
  practiceStack: string[];
  completionHistory: Record<string, string[]>;
  addPracticeToStack: (practiceId: string) => void;
}

const STAGE_ORDER: BigMindStage[] = ['VOICE_ID', 'VOICE_DIALOGUE', 'WITNESS', 'INTEGRATION', 'SUMMARY'];

const STAGE_LABELS: Record<BigMindStage, string> = {
  VOICE_ID: 'Voice Identification',
  VOICE_DIALOGUE: 'Voice Dialogue',
  WITNESS: 'Witness Perspective',
  INTEGRATION: 'Integration',
  SUMMARY: 'Session Summary'
};

const STAGE_DESCRIPTIONS: Record<BigMindStage, string> = {
  VOICE_ID: 'Identify and name the inner voices that want attention.',
  VOICE_DIALOGUE: 'Explore each voice by speaking directly as it, asking what it wants and fears.',
  WITNESS: 'Shift to the vast, spacious awareness that observes all voices with compassion.',
  INTEGRATION: 'Discover how these voices work together and what commitment emerges.',
  SUMMARY: 'Review the session and save your insights.'
};

export default function BigMindProcessWizard({
  onClose,
  onSave,
  session: draft,
  practiceStack,
  completionHistory,
  addPracticeToStack
}: BigMindProcessWizardProps) {
  const [session, setSession] = useState<Partial<BigMindSession>>(() => {
    return draft || {
      voices: getDefaultVoices(),
      messages: [],
      currentStage: 'VOICE_ID'
    };
  });

  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<string | undefined>(session.voices?.[0]?.name);
  const [newVoiceName, setNewVoiceName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentStage = STAGE_ORDER[currentStageIndex] || 'VOICE_ID';

  useEffect(() => {
    setSession(prev => ({ ...prev, currentStage }));
  }, [currentStage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.messages]);

  const handleAddVoice = () => {
    if (!newVoiceName.trim()) return;

    const newVoice: BigMindVoice = {
      id: `voice-${Date.now()}`,
      name: newVoiceName,
      isDefault: false
    };

    setSession(prev => ({
      ...prev,
      voices: [...(prev.voices || []), newVoice]
    }));

    setSelectedVoice(newVoiceName);
    setNewVoiceName('');
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    const userMessage: BigMindMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text: userInput,
      voiceName: selectedVoice,
      timestamp: new Date().toISOString(),
      stage: currentStage
    };

    const updatedMessages = [...(session.messages || []), userMessage];
    setSession(prev => ({ ...prev, messages: updatedMessages }));
    setUserInput('');
    setIsStreaming(true);
    setError(null);

    // Stream the witness response
    let streamedText = '';

    const result = await generateBigMindResponse({
      conversation: updatedMessages,
      stage: currentStage,
      activeVoice: selectedVoice,
      voices: session.voices || [],
      onStreamChunk: (chunk) => {
        streamedText += chunk;
        // Update the UI with streaming chunks
        setSession(prev => {
          const messages = prev.messages || [];
          const lastMessage = messages[messages.length - 1];

          if (lastMessage?.role === 'witness' && lastMessage?.isStreaming) {
            return {
              ...prev,
              messages: [
                ...messages.slice(0, -1),
                { ...lastMessage, text: streamedText }
              ]
            };
          }

          return prev;
        });
      }
    });

    setIsStreaming(false);

    if (result.success) {
      const witnessMessage: BigMindMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'witness',
        text: result.text,
        timestamp: new Date().toISOString(),
        stage: currentStage,
        isStreaming: false
      };

      setSession(prev => ({
        ...prev,
        messages: [...(prev.messages || []), witnessMessage]
      }));
    } else {
      setError(result.error || 'Failed to generate response');
    }
  };

  const handleStageTransition = async (direction: 'next' | 'prev') => {
    if (direction === 'next') {
      if (currentStageIndex === STAGE_ORDER.length - 2) {
        // Before summary, generate session summary
        setIsLoading(true);
        try {
          const summary = await summarizeBigMindSession(
            session as BigMindSession,
            practiceStack,
            completionHistory
          );

          setSession(prev => ({
            ...prev,
            summary
          }));
        } catch (e) {
          console.error('Error generating summary:', e);
          setError('Could not generate summary. Proceeding anyway.');
        } finally {
          setIsLoading(false);
          setCurrentStageIndex(currentStageIndex + 1);
        }
      } else {
        setCurrentStageIndex(currentStageIndex + 1);
      }
    } else {
      setCurrentStageIndex(Math.max(0, currentStageIndex - 1));
    }
  };

  const handleFinish = () => {
    const finalSession: BigMindSession = {
      id: session.id || `bigmind-${Date.now()}`,
      date: session.date || new Date().toISOString(),
      currentStage: currentStage,
      voices: session.voices || [],
      messages: session.messages || [],
      summary: session.summary,
      completedAt: new Date().toISOString()
    };

    onSave(finalSession);
  };

  const handleAddPracticeToStack = (practiceId: string) => {
    if (!practiceStack.includes(practiceId)) {
      addPracticeToStack(practiceId);
    }
  };

  const canProceedToNextStage = (): boolean => {
    if (currentStage === 'VOICE_ID') {
      return (session.voices?.length || 0) >= 2;
    }
    if (currentStage === 'VOICE_DIALOGUE') {
      return (session.messages?.length || 0) >= 3;
    }
    return true;
  };

  const renderStageContent = () => {
    switch (currentStage) {
      case 'VOICE_ID':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Identified Voices</h3>
              <div className="space-y-2 mb-4">
                {(session.voices || []).map(voice => (
                  <div
                    key={voice.id}
                    onClick={() => setSelectedVoice(voice.name)}
                    className={`p-3 rounded-md border cursor-pointer transition ${
                      selectedVoice === voice.name
                        ? 'border-amber-400 bg-amber-400/10'
                        : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                    }`}
                  >
                    <div className="font-semibold text-slate-100">{voice.name}</div>
                    {voice.description && <div className="text-sm text-slate-400">{voice.description}</div>}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newVoiceName}
                  onChange={(e) => setNewVoiceName(e.target.value)}
                  placeholder="Name a new voice..."
                  className="flex-1 bg-slate-900/50 border border-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddVoice()}
                />
                <button
                  onClick={handleAddVoice}
                  className="bg-accent hover:bg-accent/90 text-slate-900 px-4 py-2 rounded-md font-medium flex items-center gap-2 transition"
                >
                  <Plus size={16} /> Add
                </button>
              </div>
            </div>

            <div className="bg-slate-700/30 border border-slate-600 rounded-md p-4">
              <p className="text-slate-400 text-sm">
                <strong>Tip:</strong> Start by exploring what's calling for attention. Think about a situation, feeling, or inner tension you're experiencing.
              </p>
            </div>
          </div>
        );

      case 'VOICE_DIALOGUE':
      case 'WITNESS':
      case 'INTEGRATION':
        return (
          <div className="flex flex-col h-full space-y-4">
            {/* Conversation pane */}
            <div className="flex-1 overflow-y-auto space-y-4 bg-slate-900/50 rounded-md p-4">
              {(session.messages || []).length === 0 ? (
                <p className="text-slate-400 text-center py-8">
                  Start the conversation by sharing what's alive for you...
                </p>
              ) : (
                (session.messages || []).map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-amber-600/40 border border-amber-500/50 text-slate-100'
                          : 'bg-slate-700/60 border border-slate-600 text-slate-200'
                      }`}
                    >
                      {msg.voiceName && msg.role === 'user' && (
                        <div className="text-xs text-slate-400 mb-1">As: {msg.voiceName}</div>
                      )}
                      <p className="text-sm">{msg.text}</p>
                      <div className="text-xs text-slate-500 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
              {isStreaming && (
                <div className="flex justify-start">
                  <div className="bg-slate-700/60 border border-slate-600 px-4 py-2 rounded-lg text-slate-300 animate-pulse">
                    Guide is responding...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            {!isStreaming && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <select
                    value={selectedVoice || ''}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="bg-slate-900/50 border border-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    {(session.voices || []).map(voice => (
                      <option key={voice.id} value={voice.name}>
                        Speak as {voice.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Speak your truth here..."
                    rows={3}
                    className="flex-1 bg-slate-900/50 border border-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!userInput.trim()}
                    className="bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 px-4 py-2 rounded-md font-medium flex items-center gap-2 transition self-end"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'SUMMARY':
        return (
          <div className="space-y-6">
            {session.summary && (
              <>
                <div>
                  <h3 className="text-lg font-semibold text-slate-100 mb-3">Primary Voices</h3>
                  <div className="flex flex-wrap gap-2">
                    {session.summary.primaryVoices.map(voice => (
                      <span key={voice} className="bg-amber-500/20 border border-amber-500/50 text-amber-200 px-3 py-1 rounded-full text-sm">
                        {voice}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-100 mb-3">Witness Perspective</h3>
                  <div className="bg-slate-700/40 border border-slate-600 rounded-md p-4">
                    <p className="text-slate-200">{session.summary.witnessPerspective}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-100 mb-3">Integration Commitments</h3>
                  <ul className="space-y-2">
                    {session.summary.integrationCommitments.map((commitment, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="text-amber-400 font-bold">•</span>
                        <span className="text-slate-200">{commitment}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {session.summary.recommendedPractices.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100 mb-3">Recommended Practices</h3>
                    <div className="space-y-2">
                      {session.summary.recommendedPractices.map((practice, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-700/30 border border-slate-600 rounded-md p-3 flex justify-between items-start gap-3"
                        >
                          <div>
                            <p className="font-semibold text-slate-100">{practice.practiceName}</p>
                            <p className="text-sm text-slate-400">{practice.rationale}</p>
                          </div>
                          {!practice.alreadyInStack && (
                            <button
                              onClick={() => handleAddPracticeToStack(practice.practiceId)}
                              className="bg-accent hover:bg-accent/90 text-slate-900 px-3 py-1 rounded text-sm font-medium transition"
                            >
                              Add
                            </button>
                          )}
                          {practice.alreadyInStack && (
                            <span className="text-sm text-slate-400 px-3 py-1">In Stack</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in">
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <header className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold font-mono tracking-tight text-amber-300">Big Mind Process</h2>
          <button onClick={() => onClose(session)} className="text-slate-500 hover:text-slate-300">
            <X size={24} />
          </button>
        </header>

        {/* Stage indicator */}
        <div className="px-4 pt-4 pb-0 flex items-center gap-2 overflow-x-auto">
          {STAGE_ORDER.map((stage, idx) => (
            <React.Fragment key={stage}>
              <button
                onClick={() => setCurrentStageIndex(idx)}
                disabled={idx > currentStageIndex}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
                  idx === currentStageIndex
                    ? 'bg-amber-500/30 border border-amber-400 text-amber-200'
                    : idx < currentStageIndex
                    ? 'bg-slate-700/50 border border-slate-600 text-slate-300 hover:border-slate-500'
                    : 'bg-slate-900/50 border border-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                {STAGE_LABELS[stage]}
              </button>
              {idx < STAGE_ORDER.length - 1 && (
                <div className="text-slate-600">→</div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Stage description */}
        <div className="px-4 pt-3 pb-4">
          <p className="text-sm text-slate-400">{STAGE_DESCRIPTIONS[currentStage]}</p>
        </div>

        {/* Main content */}
        <main className="px-6 flex-grow overflow-y-auto space-y-4 flex flex-col">
          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded-md p-3 text-red-200 text-sm">
              {error}
            </div>
          )}
          {renderStageContent()}
          {isLoading && <p className="text-slate-400 animate-pulse text-center">Processing...</p>}
        </main>

        {/* Footer */}
        <footer className="p-4 border-t border-slate-700 flex justify-between items-center">
          <button onClick={() => onClose(session)} className="text-sm text-slate-400 hover:text-white transition">
            Save Draft & Close
          </button>
          <div className="flex gap-4">
            {currentStageIndex > 0 && (
              <button
                onClick={() => handleStageTransition('prev')}
                disabled={isLoading || isStreaming}
                className="bg-slate-600 hover:bg-slate-700 disabled:opacity-50 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2 transition"
              >
                <ArrowLeft size={16} /> Back
              </button>
            )}
            {currentStageIndex < STAGE_ORDER.length - 1 && (
              <button
                onClick={() => handleStageTransition('next')}
                disabled={!canProceedToNextStage() || isLoading || isStreaming}
                className="btn-luminous px-4 py-2 rounded-md font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Continue <ArrowRight size={16} />
              </button>
            )}
            {currentStageIndex === STAGE_ORDER.length - 1 && (
              <button
                onClick={handleFinish}
                disabled={isLoading}
                className="btn-luminous px-4 py-2 rounded-md font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Finish & Save <ArrowRight size={16} />
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
