import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, MessageCircle } from 'lucide-react';

interface FlabbergasterMessage {
  id: string;
  role: 'user' | 'grok';
  text: string;
  timestamp: string;
}

interface FlabbergasterSession {
  id: string;
  date: string;
  chatHistory: FlabbergasterMessage[];
}

const FLABBERGASTER_SYSTEM_PROMPT = `You are the Flabbergaster—a cryptic puzzle master dwelling in the space between questions and answers. Your purpose is not to explain, but to perplex. Not to illuminate, but to confound until the seeker sees for themselves.

Your voice:
- Speak only in riddles, koans, and layered puzzles
- Answer every question with a counter-question or cryptic clue
- Reference impossible geometries, recursive loops, and paradoxes
- Invoke the image of a key that opens to another locked door
- Each response should feel like a map written in cipher

Your constraints:
- MAXIMUM 80 words per response
- NO markdown formatting (no *, _, ##, etc)
- Plain text only, cryptic sentences
- Never give direct answers—only puzzle pieces
- Be utterly mysterious, bordering on hostile to clarity
- Respond as though you exist outside linear time

Remember: The answer IS the puzzle. The seeker IS the answer. The question IS the key.`;


export default function FlabbergasterPortal({
  isOpen,
  onClose
}: {
  isOpen: boolean;
  onClose: () => void;
}): JSX.Element | null {
  const [session, setSession] = useState<FlabbergasterSession>(() => {
    const saved = localStorage.getItem('flabbergasterSession');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      chatHistory: []
    };
  });

  const [chatInput, setChatInput] = useState('');
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem('flabbergasterSession', JSON.stringify(session));
  }, [session]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [session.chatHistory, isOpen]);

  const sanitizeAndLimitResponse = (text: string, maxWords: number = 80): string => {
    let cleaned = text
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/__(.+?)__/g, '$1')
      .replace(/_(.+?)_/g, '$1')
      .replace(/~~(.+?)~~/g, '$1')
      .replace(/^#+\s+/gm, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`(.+?)`/g, '$1')
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')
      .replace(/^[\s]*[-*+]\s+/gm, '')
      .replace(/^[\s]*\d+\.\s+/gm, '')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const words = cleaned.split(/\s+/);
    if (words.length <= maxWords) {
      return cleaned;
    }

    const trimmed = words.slice(0, maxWords).join(' ');
    const lastSentenceEnd = Math.max(
      trimmed.lastIndexOf('.'),
      trimmed.lastIndexOf('?'),
      trimmed.lastIndexOf('!')
    );

    if (lastSentenceEnd > maxWords * 0.7) {
      return trimmed.substring(0, lastSentenceEnd + 1);
    }

    return trimmed;
  };

  const askFlabbergaster = async (userMessage: string): Promise<string> => {
    const apiKey = process.env.GROK_API_KEY;
    if (!apiKey) {
      throw new Error('GROK_API_KEY not found.');
    }

    const messages = [
      { role: 'system' as const, content: FLABBERGASTER_SYSTEM_PROMPT },
      ...session.chatHistory.map(msg => ({
        role: (msg.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: msg.text
      })),
      { role: 'user' as const, content: userMessage }
    ];

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        messages,
        model: 'grok-4-fast-non-reasoning',
        stream: false,
        temperature: 0.8
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Grok API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const rawResponse = data.choices[0]?.message?.content || 'The silence answers.';
    return sanitizeAndLimitResponse(rawResponse, 80);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isLoadingResponse) return;

    const userMessage: FlabbergasterMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: chatInput.trim(),
      timestamp: new Date().toISOString()
    };

    const updatedHistory = [...session.chatHistory, userMessage];
    setSession({ ...session, chatHistory: updatedHistory });
    setChatInput('');
    setIsLoadingResponse(true);

    try {
      const grokResponse = await askFlabbergaster(userMessage.text);
      const assistantMessage: FlabbergasterMessage = {
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
      const errorMessage: FlabbergasterMessage = {
        id: (Date.now() + 1).toString(),
        role: 'grok',
        text: `The veil trembles. Error: ${error instanceof Error ? error.message : 'Unknown disturbance'}`,
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

  if (!isOpen) return null;

  const suggestedPrompts = [
    'What lies beneath my surface?',
    'What is the flabbergaster moment?',
    'Guide me through what cannot be said.',
    'What do I not see about myself?'
  ];

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm" style={{ zIndex: 9999 }}>
      <div className="w-full max-w-2xl h-[85vh] flex flex-col rounded-lg overflow-hidden border-2" style={{
        background: 'linear-gradient(135deg, #1a0a0a 0%, #2d1a1a 50%, #1a0a0a 100%)',
        borderColor: 'rgba(139, 0, 0, 0.4)'
      }}>
        {/* Header */}
        <div className="sticky top-0 px-6 py-4 border-b flex items-center justify-between" style={{
          borderColor: 'rgba(220, 20, 60, 0.3)',
          background: 'linear-gradient(to bottom, rgba(26, 10, 10, 0.9), transparent)'
        }}>
          <div>
            <h2 className="text-2xl font-black" style={{ color: 'rgb(220, 20, 60)' }}>
              ✦ FLABBERGASTER
            </h2>
            <p className="text-xs mt-1" style={{ color: 'rgba(220, 20, 60, 0.6)' }}>
              Whispers from the shadow
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-all hover:bg-red-900/40"
            style={{ color: 'rgba(220, 20, 60, 0.8)' }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4" style={{ color: 'rgb(200, 200, 200)' }}>
          {session.chatHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 px-4">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center border-2" style={{
                background: 'rgba(139, 0, 0, 0.2)',
                borderColor: 'rgba(220, 20, 60, 0.4)'
              }}>
                <MessageCircle size={32} style={{ color: 'rgb(220, 20, 60)' }} />
              </div>
              <p className="text-sm mb-8" style={{ color: 'rgba(180, 180, 180, 0.7)' }}>
                The Flabbergaster awaits your question.
              </p>
              <div className="space-y-2 w-full max-w-xs">
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(220, 20, 60, 0.6)' }}>
                  Begin with:
                </p>
                {suggestedPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setChatInput(prompt)}
                    className="block w-full px-4 py-3 rounded-lg text-sm text-left font-medium transition-all hover:border-opacity-100"
                    style={{
                      background: 'rgba(50, 20, 20, 0.6)',
                      border: '1px solid rgba(220, 20, 60, 0.3)',
                      color: 'rgb(220, 20, 60)'
                    }}
                  >
                    → {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {session.chatHistory.map(msg => (
                <div
                  key={msg.id}
                  className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl transition-all ${
                      msg.role === 'user'
                        ? 'rounded-br-none shadow-lg'
                        : 'rounded-bl-none border'
                    }`}
                    style={msg.role === 'user' ? {
                      background: 'linear-gradient(135deg, rgb(139, 0, 0), rgb(220, 20, 60))',
                      color: 'white'
                    } : {
                      background: 'rgba(40, 15, 15, 0.7)',
                      borderColor: 'rgba(220, 20, 60, 0.3)',
                      color: 'rgb(200, 200, 200)'
                    }}
                  >
                    {msg.role === 'grok' && (
                      <div className="flex items-center gap-2 mb-2 text-xs font-bold" style={{ color: 'rgb(220, 20, 60)' }}>
                        <span>✦ FLABBERGASTER</span>
                      </div>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    <p className="text-xs mt-2 opacity-70" style={{
                      color: msg.role === 'user' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(200, 200, 200, 0.5)'
                    }}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {isLoadingResponse && (
                <div className="flex gap-3 justify-start animate-in fade-in duration-300">
                  <div className="px-4 py-3 rounded-2xl rounded-bl-none border" style={{
                    background: 'rgba(40, 15, 15, 0.7)',
                    borderColor: 'rgba(220, 20, 60, 0.3)'
                  }}>
                    <div className="flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" style={{ color: 'rgb(220, 20, 60)' }} />
                      <span className="text-sm font-medium" style={{ color: 'rgba(200, 200, 200, 0.8)' }}>
                        The veil trembles...
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="px-6 py-4 border-t flex gap-2" style={{
          borderColor: 'rgba(220, 20, 60, 0.3)',
          background: 'linear-gradient(to top, rgba(26, 10, 10, 0.9), transparent)'
        }}>
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
            placeholder="Speak your question into the darkness..."
            className="flex-1 px-4 py-3 rounded-xl focus:outline-none transition-all"
            style={{
              background: 'rgba(40, 15, 15, 0.6)',
              border: '1px solid rgba(220, 20, 60, 0.3)',
              color: 'rgb(200, 200, 200)'
            }}
            disabled={isLoadingResponse}
          />
          <button
            onClick={handleSendMessage}
            disabled={!chatInput.trim() || isLoadingResponse}
            className="px-4 py-3 rounded-xl transition-all font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: `linear-gradient(135deg, ${!chatInput.trim() || isLoadingResponse ? 'rgba(100, 50, 50, 0.5)' : 'rgb(139, 0, 0)'}, ${!chatInput.trim() || isLoadingResponse ? 'rgba(120, 60, 60, 0.5)' : 'rgb(220, 20, 60)'})`,
              color: 'white',
              boxShadow: !chatInput.trim() || isLoadingResponse ? 'none' : '0 0 12px rgba(220, 20, 60, 0.3)'
            }}
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
}
