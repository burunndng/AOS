import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Zap, Send, Loader, Volume2, VolumeX } from 'lucide-react';
import { generateFlabbergasterResponse, getFlabbergasterGreeting, FlabbergasterMessage } from '../services/flabbergasterChatService.ts';

interface FlabbergasterPortalProps {
  isOpen: boolean;
  onClose: () => void;
  hasUnlocked?: boolean;
  onHiddenModeDiscovered?: () => void;
  onStartGeometricGame?: () => void;
  onStartVideoGame?: () => void;
  onGameComplete?: (data: { resonanceAchieved?: boolean }) => void;
}

export default function FlabbergasterPortal({ isOpen, onClose, hasUnlocked, onHiddenModeDiscovered, onStartGeometricGame, onStartVideoGame, onGameComplete }: FlabbergasterPortalProps) {
  const [messages, setMessages] = useState<FlabbergasterMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hiddenModeNotifiedRef = useRef(false);
  const [hasAchievedResonance, setHasAchievedResonance] = useState(false);
  const [pendingResonanceNotification, setPendingResonanceNotification] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioNodesRef = useRef<Array<OscillatorNode | GainNode>>([]);

  // Notify hidden mode discovery once per component lifecycle
  useEffect(() => {
    if (isOpen && !hiddenModeNotifiedRef.current) {
      onHiddenModeDiscovered?.();
      hiddenModeNotifiedRef.current = true;
    }
  }, [isOpen, onHiddenModeDiscovered]);

  // Initialize with greeting message when portal opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting: FlabbergasterMessage = {
        id: `msg-${Date.now()}`,
        role: 'oracle',
        text: getFlabbergasterGreeting(),
        timestamp: new Date().toISOString()
      };
      setMessages([greeting]);

      // Focus input after a brief delay
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  // Start/stop ambient audio based on portal state and sound enabled
  useEffect(() => {
    if (isOpen && isSoundEnabled) {
      startAmbientAudio();
    } else {
      stopAmbientAudio();
    }

    return () => {
      stopAmbientAudio();
    };
  }, [isOpen, isSoundEnabled]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle resonance achievement notification
  useEffect(() => {
    if (pendingResonanceNotification && !hasAchievedResonance) {
      const congratulatoryMessage: FlabbergasterMessage = {
        id: `msg-${Date.now()}`,
        role: 'oracle',
        text: '✨ Magnificent! You have achieved harmonic resonance with the sacred geometry. Your alignment with the cosmic patterns has resonated through the planes of existence. The universe acknowledges your attunement. ✨',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, congratulatoryMessage]);
      setHasAchievedResonance(true);
      setPendingResonanceNotification(false);
    }
  }, [pendingResonanceNotification, hasAchievedResonance]);

  // Reset state when portal closes
  useEffect(() => {
    if (!isOpen) {
      setMessages([]);
      setUserInput('');
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const userMessage: FlabbergasterMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text: userInput.trim(),
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setUserInput('');
    setIsLoading(true);
    setError(null);

    // Stream the oracle's response
    let streamedText = '';

    const result = await generateFlabbergasterResponse(
      updatedMessages,
      (chunk) => {
        streamedText += chunk;
        // Update the UI with streaming chunks
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];

          if (lastMessage?.role === 'oracle' && lastMessage?.isStreaming) {
            return [
              ...prev.slice(0, -1),
              { ...lastMessage, text: streamedText }
            ];
          } else {
            // Create a new streaming message
            return [
              ...prev,
              {
                id: `msg-${Date.now() + 1}`,
                role: 'oracle',
                text: streamedText,
                timestamp: new Date().toISOString(),
                isStreaming: true
              }
            ];
          }
        });
      }
    );

    setIsLoading(false);

    if (result.success) {
      const oracleMessage: FlabbergasterMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'oracle',
        text: result.text,
        timestamp: new Date().toISOString(),
        isStreaming: false
      };

      setMessages(prev => {
        // Remove any streaming message and add the final one
        const withoutStreaming = prev.filter(m => !m.isStreaming);
        return [...withoutStreaming, oracleMessage];
      });
    } else {
      setError(result.error || 'The Oracle is temporarily silent.');
      // If there's a fallback message, still show it
      if (result.text) {
        const oracleMessage: FlabbergasterMessage = {
          id: `msg-${Date.now() + 1}`,
          role: 'oracle',
          text: result.text,
          timestamp: new Date().toISOString(),
          isStreaming: false
        };
        setMessages(prev => {
          const withoutStreaming = prev.filter(m => !m.isStreaming);
          return [...withoutStreaming, oracleMessage];
        });
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Create and play ambient 432Hz oracle presence
  const startAmbientAudio = () => {
    try {
      if (audioContextRef.current) return; // Already playing

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      const now = audioContext.currentTime;

      // Master gain for overall volume control
      const masterGain = audioContext.createGain();
      masterGain.gain.setValueAtTime(0.15, now); // Subtle volume
      masterGain.connect(audioContext.destination);

      // Oscillator 1: 432Hz base frequency (healing frequency)
      const osc1 = audioContext.createOscillator();
      const gain1 = audioContext.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(432, now);
      gain1.gain.setValueAtTime(0.3, now);
      osc1.connect(gain1);
      gain1.connect(masterGain);

      // Oscillator 2: Perfect fifth harmonic (648Hz = 432 * 1.5)
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(648, now);
      gain2.gain.setValueAtTime(0.2, now);
      osc2.connect(gain2);
      gain2.connect(masterGain);

      // Oscillator 3: Major third harmonic (540Hz = 432 * 1.25)
      const osc3 = audioContext.createOscillator();
      const gain3 = audioContext.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(540, now);
      gain3.gain.setValueAtTime(0.15, now);
      osc3.connect(gain3);
      gain3.connect(masterGain);

      // Start all oscillators
      osc1.start(now);
      osc2.start(now);
      osc3.start(now);

      // Store nodes for cleanup
      audioNodesRef.current = [osc1, osc2, osc3, gain1, gain2, gain3, masterGain];
    } catch (e) {
      console.log('Audio context not available:', e);
    }
  };

  // Stop the ambient audio
  const stopAmbientAudio = () => {
    try {
      if (audioContextRef.current && audioNodesRef.current.length > 0) {
        const now = audioContextRef.current.currentTime;

        // Fade out the master gain
        const masterGain = audioNodesRef.current[audioNodesRef.current.length - 1] as GainNode;
        masterGain.gain.setValueAtTime(masterGain.gain.value, now);
        masterGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        // Stop oscillators after fade
        setTimeout(() => {
          audioNodesRef.current.forEach((node) => {
            if (node instanceof OscillatorNode) {
              node.stop();
            }
          });
          audioContextRef.current?.close().catch(() => {});
          audioContextRef.current = null;
          audioNodesRef.current = [];
        }, 500);
      }
    } catch (e) {
      console.log('Error stopping audio:', e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-gradient-to-br from-purple-900/95 via-indigo-900/95 to-violet-900/95 border border-purple-500/30 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 25px 50px -12px rgba(147, 51, 234, 0.5), 0 0 100px rgba(147, 51, 234, 0.3), inset 0 0 50px rgba(147, 51, 234, 0.1)',
          backdropFilter: 'blur(20px)'
        }}
      >
        {/* Background animated elements */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-4 left-4 w-32 h-32 bg-purple-500 rounded-full filter blur-3xl animate-pulse" />
          <div className="absolute bottom-4 right-4 w-24 h-24 bg-indigo-500 rounded-full filter blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-violet-500 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between p-6 border-b border-purple-500/30 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Sparkles 
                size={40} 
                className="text-purple-300"
                style={{ 
                  filter: 'drop-shadow(0 0 20px rgba(196, 181, 253, 0.8))',
                  animation: 'spin 8s linear infinite'
                }} 
              />
              <Zap 
                size={20} 
                className="text-yellow-300 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
                style={{ filter: 'drop-shadow(0 0 10px rgba(253, 224, 71, 0.8))' }}
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-mono tracking-tight bg-gradient-to-r from-purple-200 to-violet-200 bg-clip-text text-transparent">
                Flabbergaster Oracle
              </h2>
              <p className="text-purple-400 text-xs font-mono uppercase tracking-wider mt-1">
                {hasUnlocked ? "Welcome back, seeker" : "Secret portal unlocked"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSoundEnabled(!isSoundEnabled)}
              className="text-purple-300 hover:text-purple-100 p-2 rounded-full hover:bg-purple-800/30 transition-all duration-200"
              aria-label="Toggle sound"
              title={isSoundEnabled ? "Mute oracle" : "Unmute oracle"}
            >
              {isSoundEnabled ? (
                <Volume2 size={20} />
              ) : (
                <VolumeX size={20} />
              )}
            </button>
            <button
              onClick={onClose}
              className="text-purple-300 hover:text-purple-100 p-2 rounded-full hover:bg-purple-800/30 transition-all duration-200"
              aria-label="Close portal"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="relative z-10 flex-1 overflow-y-auto p-6 space-y-4" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(147, 51, 234, 0.5) transparent' }}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-purple-700/40 border border-purple-600/30 text-purple-100'
                    : 'bg-indigo-900/40 border border-indigo-600/30 text-indigo-100'
                }`}
                style={{
                  boxShadow: msg.role === 'user'
                    ? '0 4px 20px rgba(147, 51, 234, 0.2)'
                    : '0 4px 20px rgba(99, 102, 241, 0.2)'
                }}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.text}
                </p>
                {msg.isStreaming && (
                  <span className="inline-block w-2 h-4 ml-1 bg-purple-400 animate-pulse" />
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Error Display */}
        {error && (
          <div className="relative z-10 px-6 pb-2">
            <div className="bg-red-900/30 border border-red-600/30 rounded-lg p-3 text-red-300 text-sm">
              {error}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="relative z-10 p-6 border-t border-purple-500/30 flex-shrink-0">
          <div className="flex gap-3 mb-3">
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask the Oracle..."
              disabled={isLoading}
              className="flex-1 bg-purple-900/30 border border-purple-600/30 rounded-xl px-4 py-3 text-purple-100 placeholder-purple-400/50 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.3)'
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !userInput.trim()}
              className="bg-purple-600/60 hover:bg-purple-600/80 disabled:bg-purple-800/30 border border-purple-500/30 rounded-xl px-6 py-3 text-purple-100 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              style={{
                boxShadow: '0 4px 20px rgba(147, 51, 234, 0.3)'
              }}
            >
              {isLoading ? (
                <Loader size={20} className="animate-spin" />
              ) : (
                <Send size={20} />
              )}
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>

          {/* Game Launch Buttons */}
          <div className="space-y-2">
            {onStartGeometricGame && (
              <button
                onClick={() => {
                  onStartGeometricGame();
                  // Set callback to handle game completion
                  (window as any).__handleGameCompletion = (data: { resonanceAchieved?: boolean }) => {
                    if (data?.resonanceAchieved && onGameComplete) {
                      setPendingResonanceNotification(true);
                      onGameComplete(data);
                    }
                  };
                }}
                className="w-full bg-gradient-to-r from-cyan-600/40 to-purple-600/40 hover:from-cyan-600/60 hover:to-purple-600/60 border border-cyan-500/30 rounded-lg px-4 py-2 text-cyan-200 text-sm font-medium transition-all flex items-center justify-center gap-2"
                style={{
                  boxShadow: '0 4px 15px rgba(0, 217, 255, 0.2)'
                }}
              >
                <span className="text-lg">🔮</span>
                Enter the Geometric Resonance Game
              </button>
            )}

            {onStartVideoGame && (
              <button
                onClick={onStartVideoGame}
                className="w-full bg-gradient-to-r from-pink-600/40 to-orange-600/40 hover:from-pink-600/60 hover:to-orange-600/60 border border-pink-500/30 rounded-lg px-4 py-2 text-pink-200 text-sm font-medium transition-all flex items-center justify-center gap-2"
                style={{
                  boxShadow: '0 4px 15px rgba(236, 72, 153, 0.2)'
                }}
              >
                <span className="text-lg">🎮</span>
                Enter the Second Minigame (Preview)
              </button>
            )}
          </div>

          {/* Mystical hint text */}
          <p className="text-purple-400/60 text-xs italic mt-3 text-center">
            "Whisper your questions to the cosmos, and the Oracle shall answer..."
          </p>
        </div>
      </div>
    </div>
  );
}
