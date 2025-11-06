import React, { useState, useEffect, useRef } from 'react';
import { RelationalPatternSession, RelationalPatternMessage, RelationshipContext, RelationshipType } from '../types.ts';
import { X, Send, Download, Sparkles, Users } from 'lucide-react';
import * as geminiService from '../services/geminiService.ts';

interface RelationalPatternChatbotProps {
  onClose: () => void;
  onSave: (session: RelationalPatternSession) => void;
  session: RelationalPatternSession | null;
  setDraft: (session: RelationalPatternSession | null) => void;
}

const INITIAL_MESSAGE = `Hi! I'm here to help you explore your relational patterns - how you show up in different relationships and where you might be reactive.

We'll look at several important relationships in your life and identify patterns that might be unconscious. This is shadow work - making the invisible visible.

To start: **Think of a recent moment when you felt reactive in a relationship.** This could be anger, withdrawal, defensiveness, people-pleasing, shutting down - any strong automatic response.

What relationship was it, and what happened?`;

export default function RelationalPatternChatbot({ onClose, onSave, session: draft, setDraft }: RelationalPatternChatbotProps) {
  const [session, setSession] = useState<RelationalPatternSession>(draft || {
    id: `relational-${Date.now()}`,
    date: new Date().toISOString(),
    conversation: [
      { role: 'bot', text: INITIAL_MESSAGE, timestamp: new Date().toISOString() }
    ],
    relationships: []
  });

  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.conversation]);

  useEffect(() => {
    if (draft) setSession(draft);
  }, [draft]);

  const handleSaveDraftAndClose = () => {
    setDraft(session);
    onClose();
  };

  const addMessage = (role: 'user' | 'bot', text: string) => {
    const message: RelationalPatternMessage = {
      role,
      text,
      timestamp: new Date().toISOString()
    };
    setSession(prev => ({
      ...prev,
      conversation: [...prev.conversation, message]
    }));
  };

  const handleSend = async () => {
    if (!inputText.trim() || isThinking) return;

    const userMessage = inputText.trim();
    setInputText('');
    addMessage('user', userMessage);
    setIsThinking(true);

    try {
      // Get AI response based on conversation context
      const conversationContext = session.conversation.map(m =>
        `${m.role === 'user' ? 'User' : 'Bot'}: ${m.text}`
      ).join('\n\n');

      const response = await geminiService.getRelationalPatternResponse(
        conversationContext,
        userMessage,
        session.relationships
      );

      addMessage('bot', response.message);

      // Update relationships if the AI extracted relationship data
      if (response.extractedRelationship) {
        setSession(prev => ({
          ...prev,
          relationships: [...prev.relationships, response.extractedRelationship!]
        }));
      }

      // If we have enough data (3+ relationships explored), offer analysis
      if (session.relationships.length >= 2 && response.shouldOfferAnalysis) {
        setTimeout(() => {
          addMessage('bot', `We've explored ${session.relationships.length + 1} relationship contexts. I can now analyze the patterns across these relationships.

Type "analyze" when you're ready to see the analysis, or keep exploring more relationships.`);
        }, 1000);
      }

    } catch (error) {
      console.error('Error getting response:', error);
      addMessage('bot', 'I had trouble processing that. Could you rephrase?');
    } finally {
      setIsThinking(false);
    }
  };

  const handleAnalyze = async () => {
    if (session.relationships.length < 1) {
      addMessage('bot', 'We need to explore at least one relationship before I can analyze patterns. Keep sharing!');
      return;
    }

    setIsAnalyzing(true);
    addMessage('bot', 'Analyzing your relational patterns across all the relationships we explored...');

    try {
      const analysis = await geminiService.analyzeRelationalPatterns(
        session.relationships,
        session.conversation
      );

      setSession(prev => ({
        ...prev,
        analysis
      }));

      // Show results in chat
      addMessage('bot', `## Pattern Analysis Complete

**Core Patterns Across Relationships:**
${analysis.corePatterns.map((p, i) => `${i + 1}. ${p}`).join('\n')}

**Your Reactive Signatures:**
${analysis.reactiveSignatures.map(r => `• ${r}`).join('\n')}

**Developmental Hypothesis:**
${analysis.developmentalHypothesis}

**Shadow Work:**
${analysis.shadowWork}

**Recommendations:**
${analysis.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

You can download the full report or continue exploring. Type "done" to save this session.`);

    } catch (error) {
      console.error('Analysis error:', error);
      addMessage('bot', 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();

      // Check for commands
      if (inputText.trim().toLowerCase() === 'analyze') {
        setInputText('');
        handleAnalyze();
      } else if (inputText.trim().toLowerCase() === 'done') {
        onSave(session);
      } else {
        handleSend();
      }
    }
  };

  const handleDownload = () => {
    const content = `# Relational Pattern Tracking Session
Date: ${new Date(session.date).toLocaleDateString()}

## Conversation

${session.conversation.map(m => `**${m.role === 'user' ? 'You' : 'Guide'}:** ${m.text}`).join('\n\n')}

## Relationships Explored

${session.relationships.map((r, i) => `### ${i + 1}. ${r.type}${r.personDescription ? ` (${r.personDescription})` : ''}
- **Trigger:** ${r.triggerSituation}
- **Your Reaction:** ${r.yourReaction}
- **Underlying Fear:** ${r.underlyingFear}
- **Pattern:** ${r.pattern}
`).join('\n')}

${session.analysis ? `## Pattern Analysis

### Core Patterns
${session.analysis.corePatterns.map((p, i) => `${i + 1}. ${p}`).join('\n')}

### Reactive Signatures
${session.analysis.reactiveSignatures.map(r => `• ${r}`).join('\n')}

### Developmental Hypothesis
${session.analysis.developmentalHypothesis}

### Shadow Work
${session.analysis.shadowWork}

### Recommendations
${session.analysis.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}
` : ''}
`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relational-patterns-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Users size={28} className="text-accent" />
            <div>
              <h1 className="text-2xl font-bold text-slate-100">Relational Pattern Tracker</h1>
              <p className="text-sm text-slate-400">
                {session.relationships.length} relationship{session.relationships.length !== 1 ? 's' : ''} explored
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-slate-800 rounded-lg transition"
              title="Download Report"
            >
              <Download size={20} className="text-slate-400" />
            </button>
            <button
              onClick={handleSaveDraftAndClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition"
              title="Save Draft & Close"
            >
              <X size={24} className="text-slate-400" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {session.conversation.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  msg.role === 'user'
                    ? 'bg-accent/20 border border-accent/30 text-slate-100'
                    : 'bg-slate-800/50 border border-slate-700 text-slate-300'
                }`}
              >
                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                  {msg.text.split('\n').map((line, i) => {
                    // Simple markdown rendering
                    if (line.startsWith('## ')) {
                      return <h2 key={i} className="text-xl font-bold text-slate-100 mt-4 mb-2">{line.replace('## ', '')}</h2>;
                    }
                    if (line.startsWith('**') && line.endsWith('**')) {
                      return <p key={i} className="font-semibold text-slate-200 mt-2">{line.replace(/\*\*/g, '')}</p>;
                    }
                    if (line.match(/^\d+\./)) {
                      return <p key={i} className="ml-2 mt-1">{line}</p>;
                    }
                    if (line.startsWith('• ') || line.startsWith('- ')) {
                      return <p key={i} className="ml-2 mt-1">{line}</p>;
                    }
                    return <p key={i} className="mt-1">{line}</p>;
                  })}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="flex justify-start">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <Sparkles size={16} className="animate-pulse" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          {isAnalyzing && (
            <div className="flex justify-start">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center gap-2 text-accent">
                  <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">Analyzing patterns across relationships...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-slate-700 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your response... (or 'analyze' to see patterns, 'done' to finish)"
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/50"
              disabled={isThinking || isAnalyzing}
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || isThinking || isAnalyzing}
              className="bg-accent hover:bg-accent/80 text-slate-900 px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send size={20} />
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Press Enter to send • Shift+Enter for new line • Type "analyze" to see patterns • Type "done" to finish
          </p>
        </div>
      </div>
    </div>
  );
}
