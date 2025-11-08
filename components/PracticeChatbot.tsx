import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader, CheckCircle } from 'lucide-react';
import { Practice } from '../types.ts';
import { AttachmentStyle } from '../data/attachmentMappings.ts';
import { getPracticePrompt } from '../data/practicePrompts.ts';
import { GoogleGenAI } from "@google/genai";

interface PracticeChatbotProps {
  practice: Practice;
  attachmentStyle: AttachmentStyle;
  anxietyScore: number;
  avoidanceScore: number;
  onClose: () => void;
  onComplete: (sessionNotes: string) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function PracticeChatbot({
  practice,
  attachmentStyle,
  anxietyScore,
  avoidanceScore,
  onClose,
  onComplete
}: PracticeChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);

  const promptConfig = getPracticePrompt(practice.id, attachmentStyle, anxietyScore, avoidanceScore);

  useEffect(() => {
    // Scroll to top and prevent body scroll
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.style.overflow = 'hidden';

    // Initialize chat and send opening message
    initializeChat();

    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializeChat = async () => {
    if (!promptConfig) {
      console.error('No prompt config found for practice:', practice.id);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

      // Create a new chat session with system instructions
      chatRef.current = await ai.chats.create({
        model: 'gemini-2.0-flash-exp',
        config: {
          systemInstruction: promptConfig.systemPrompt,
          temperature: 0.8,
          topP: 0.95,
        }
      });

      // Add opening message
      setMessages([{
        role: 'assistant',
        content: promptConfig.openingMessage,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error initializing chat:', error);
      setMessages([{
        role: 'assistant',
        content: `I'm having trouble connecting right now. Please try again in a moment.`,
        timestamp: new Date()
      }]);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !chatRef.current) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Send message and get streaming response
      const response = await chatRef.current.sendMessage(input.trim());

      // Add assistant response
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.text,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleComplete = () => {
    // Create session notes from conversation
    const sessionNotes = messages
      .map(m => `[${m.role.toUpperCase()}]: ${m.content}`)
      .join('\n\n');

    setIsComplete(true);

    // Wait a moment before closing to show completion state
    setTimeout(() => {
      onComplete(sessionNotes);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-3xl w-full h-[85vh] flex flex-col my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <div>
              <h2 className="text-lg font-bold text-slate-100">{practice.name}</h2>
              <p className="text-xs text-slate-400">
                {attachmentStyle.charAt(0).toUpperCase() + attachmentStyle.slice(1)} Attachment  •  {promptConfig?.estimatedDuration || 5} min session
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-accent text-slate-900'
                    : 'bg-slate-800 text-slate-100 border border-slate-700'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs opacity-60 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
                <Loader size={16} className="animate-spin text-slate-400" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        {!isComplete ? (
          <div className="p-4 border-t border-slate-700 space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your response..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-accent"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="bg-accent text-slate-900 px-4 py-2 rounded-lg font-semibold hover:bg-accent/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send size={18} />
              </button>
            </div>

            <div className="flex justify-between items-center">
              <p className="text-xs text-slate-500">Press Enter to send • Shift+Enter for new line</p>
              <button
                onClick={handleComplete}
                className="text-xs text-green-400 hover:text-green-300 transition font-semibold"
              >
                Complete Session
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 border-t border-slate-700 bg-green-900/20">
            <div className="flex items-center justify-center gap-2 text-green-400">
              <CheckCircle size={20} />
              <span className="font-semibold">Session Complete!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
