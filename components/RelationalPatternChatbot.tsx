import React, { useState, useEffect, useRef } from 'react';
import { RelationalPatternSession, RelationalPatternMessage, RelationshipContext, RelationshipType } from '../types.ts';
import { X, Send, Download, Sparkles, Users, RotateCcw } from 'lucide-react';
import * as geminiService from '../services/geminiService.ts';
import { attachmentProfiles } from '../data/attachmentMappings.ts';

interface RelationalPatternChatbotProps {
  onClose: () => void;
  onSave: (session: RelationalPatternSession) => void;
  session: RelationalPatternSession | null;
  setDraft: (session: RelationalPatternSession | null) => void;
  userId?: string;
}

// Pattern Overview Panel Component
function PatternOverviewPanel({ relationships, onScrollToRelationship }: { relationships: RelationshipContext[]; onScrollToRelationship: (type: string) => void }) {
  return (
    <div className="hidden md:flex w-80 border-l border-slate-700 bg-slate-800/30 p-4 space-y-3 overflow-y-auto flex-col">
      <h3 className="text-sm font-semibold text-slate-200 sticky top-0 bg-slate-800/50 py-2">📋 Patterns Explored ({relationships.length})</h3>
      {relationships.length === 0 ? (
        <p className="text-xs text-slate-500 italic">Start exploring relationships to see them here...</p>
      ) : (
        relationships.map((rel, idx) => (
          <div
            key={idx}
            onClick={() => onScrollToRelationship(rel.type)}
            className="bg-neutral-900/40 border border-neutral-700/40 rounded-lg p-3 cursor-pointer hover:border-accent/50 hover:bg-neutral-900/60 transition group"
          >
            <p className="text-xs font-mono text-accent group-hover:text-accent/80 transition">{rel.type}</p>
            {rel.personDescription && (
              <p className="text-xs text-slate-400 mt-1">{rel.personDescription}</p>
            )}
            <div className="flex items-center gap-1 mt-2">
              <span className={`w-2 h-2 rounded-full ${rel.pattern ? 'bg-emerald-500/60' : 'bg-amber-500/60'}`}></span>
              <span className="text-xs text-slate-400 line-clamp-2">
                {rel.pattern?.split('\n')[0] || 'Exploring...'}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// Reactive Signature Heatmap Component
function ReactiveSignatureHeatmap({ analysis }: { analysis: any }) {
  if (!analysis || !analysis.reactiveSignatures) return null;

  const signatures = analysis.reactiveSignatures || [];
  const relationshipTypes = Object.keys(analysis.relationshipSpecificPatterns || {});

  if (signatures.length === 0 || relationshipTypes.length === 0) return null;

  // Count occurrences of each signature in relationship patterns
  const heatmapData: Record<string, Record<string, number>> = {};
  signatures.forEach(sig => {
    heatmapData[sig] = {};
    relationshipTypes.forEach(relType => {
      const pattern = analysis.relationshipSpecificPatterns[relType] || '';
      const count = (pattern.toLowerCase().includes(sig.toLowerCase()) ? 1 : 0) +
                   (pattern.toLowerCase().match(new RegExp(sig.toLowerCase(), 'g')) || []).length;
      heatmapData[sig][relType] = Math.min(count, 3); // Cap at 3 for visualization
    });
  });

  return (
    <div className="my-4 p-4 bg-slate-800/50 border border-slate-700 rounded-lg overflow-x-auto">
      <h3 className="text-sm font-semibold text-slate-200 mb-3">🔥 Reactive Signature Distribution</h3>
      <table className="text-xs min-w-full">
        <thead>
          <tr>
            <th className="text-left text-slate-400 pb-2 pr-4">Signature</th>
            {relationshipTypes.slice(0, 5).map(rt => (
              <th key={rt} className="text-center text-slate-400 pb-2 px-2">{rt.split('/')[0]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {signatures.slice(0, 5).map(sig => (
            <tr key={sig} className="border-t border-slate-700">
              <td className="text-slate-300 py-2 pr-4 text-left">{sig}</td>
              {relationshipTypes.slice(0, 5).map(rt => {
                const intensity = heatmapData[sig]?.[rt] || 0;
                const opacityClass = intensity === 0 ? 'bg-slate-700/10' : intensity === 1 ? 'bg-amber-500/30' : intensity === 2 ? 'bg-amber-500/60' : 'bg-amber-500/90';
                return (
                  <td key={`${sig}-${rt}`} className="py-2 px-2 text-center">
                    <div className={`w-8 h-8 rounded ${opacityClass} flex items-center justify-center text-xs font-bold text-slate-200`}>
                      {intensity > 0 ? '■' : ''}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const INITIAL_MESSAGE = `Hi! I'm here to help you explore your relational patterns - how you show up in different relationships and where you might be reactive.

We'll look at several important relationships in your life and identify patterns that might be unconscious. This is shadow work - making the invisible visible.

To start: **Think of a recent moment when you felt reactive in a relationship.** This could be anger, withdrawal, defensiveness, people-pleasing, shutting down - any strong automatic response.

What relationship was it, and what happened?`;

export default function RelationalPatternChatbot({ onClose, onSave, session: draft, setDraft, userId }: RelationalPatternChatbotProps) {
  const [session, setSession] = useState<RelationalPatternSession>(draft || {
    id: `relational-${Date.now()}`,
    date: new Date().toISOString(),
    conversation: [
      { role: 'bot', text: INITIAL_MESSAGE, timestamp: new Date().toISOString() }
    ],
    relationships: [],
    attachmentStyle: null
  });

  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showRecoveryPrompt, setShowRecoveryPrompt] = useState(false);
  const [recoverySession, setRecoverySession] = useState<RelationalPatternSession | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.conversation]);

  useEffect(() => {
    if (draft) setSession(draft);
  }, [draft]);

  // Load recovery session on mount
  useEffect(() => {
    if (userId && !draft) {
      const storageKey = `relational-pattern-draft-${userId}`;
      const savedSession = localStorage.getItem(storageKey);
      if (savedSession) {
        try {
          const recovered = JSON.parse(savedSession);
          setRecoverySession(recovered);
          setShowRecoveryPrompt(true);
        } catch (e) {
          console.error('Failed to parse recovery session:', e);
        }
      }
    }
  }, [userId, draft]);

  const handleSaveDraftAndClose = () => {
    // Save to localStorage
    if (userId) {
      localStorage.setItem(`relational-pattern-draft-${userId}`, JSON.stringify(session));
    }
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
      let updatedSession = session;
      if (response.extractedRelationship) {
        updatedSession = {
          ...session,
          relationships: [...session.relationships, response.extractedRelationship]
        };
        setSession(updatedSession);
      }

      // Detect attachment style after 2+ relationships
      if (updatedSession.relationships.length >= 2 && !updatedSession.attachmentStyle) {
        try {
          const style = await geminiService.detectAttachmentStyle(updatedSession.relationships);
          setSession(prev => ({
            ...prev,
            attachmentStyle: style
          }));
        } catch (e) {
          console.error('Error detecting attachment style:', e);
        }
      }

      // Save draft to localStorage
      if (userId) {
        const storageKey = `relational-pattern-draft-${userId}`;
        localStorage.setItem(storageKey, JSON.stringify(updatedSession));
      }

      // If we have enough data (2+ relationships explored), offer analysis
      if (updatedSession.relationships.length >= 2 && response.shouldOfferAnalysis) {
        setTimeout(() => {
          addMessage('bot', `We've explored ${updatedSession.relationships.length} relationship contexts. I can now analyze the patterns across these relationships.

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

      // Create heatmap message
      let heatmapContent = '';
      if (analysis.reactiveSignatures && analysis.relationshipSpecificPatterns) {
        heatmapContent = `\n\n## Reactive Signature Distribution
Looking at how different reactive patterns show up across your relationships...`;
      }

      // Show results in chat
      addMessage('bot', `## Pattern Analysis Complete

**Core Patterns Across Relationships:**
${analysis.corePatterns.map((p, i) => `${i + 1}. ${p}`).join('\n')}

**Your Reactive Signatures:**
${analysis.reactiveSignatures.map(r => `• ${r}`).join('\n')}${heatmapContent}

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
        // Clear draft from localStorage
        if (userId) {
          localStorage.removeItem(`relational-pattern-draft-${userId}`);
        }
        onSave(session);
      } else {
        handleSend();
      }
    }
  };

  const handleDownload = () => {
    const attachmentLabel = session.attachmentStyle ? `**Attachment Style:** ${attachmentProfiles[session.attachmentStyle]?.label}` : '';
    const attachmentDescription = session.attachmentStyle ? `\n${attachmentProfiles[session.attachmentStyle]?.description}` : '';

    const relationshipTable = session.relationships.map((r, i) => `### ${i + 1}. ${r.type}${r.personDescription ? ` (${r.personDescription})` : ''}
- **Trigger:** ${r.triggerSituation || 'Not captured'}
- **Your Reaction:** ${r.yourReaction || 'Not captured'}
- **Underlying Fear:** ${r.underlyingFear || 'Not captured'}
- **Pattern:** ${r.pattern || 'Not captured'}
`).join('\n');

    const heatmapSummary = session.analysis ? `### Reactive Signature Frequency
${session.analysis.reactiveSignatures.map((sig, i) => `${i + 1}. **${sig}** - appears across multiple relationship contexts`).join('\n')}
` : '';

    const content = `# Relational Pattern Tracking Session
Date: ${new Date(session.date).toLocaleDateString()}
Session ID: ${session.id}

${attachmentLabel}${attachmentDescription}

## Summary
- **Relationships Explored:** ${session.relationships.length}
- **Total Insights:** ${session.analysis?.corePatterns.length || 0} core patterns identified

## Relationships Explored

${relationshipTable}

${session.analysis ? `## Pattern Analysis & Insights

### Attachment & Reactive Patterns
${heatmapSummary}

### Core Patterns Across Relationships
${session.analysis.corePatterns.map((p, i) => `${i + 1}. ${p}`).join('\n')}

### Developmental Hypothesis
${session.analysis.developmentalHypothesis}

### Shadow Work Integration
${session.analysis.shadowWork}

### Relationship-Specific Patterns
${Object.entries(session.analysis.relationshipSpecificPatterns).map(([type, pattern]) => `**${type}:** ${pattern}`).join('\n')}

### Recommended Practices
${session.analysis.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}
` : ''}

## Full Conversation

${session.conversation.map(m => `**${m.role === 'user' ? 'You' : 'Guide'}:** ${m.text}`).join('\n\n')}
`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relational-patterns-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
  };

  // Helper function to scroll to relationship
  const scrollToRelationship = (type: string) => {
    const element = chatMessagesRef.current?.querySelector(`[data-relationship="${type}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Helper to get attachment color
  const getAttachmentColor = (style: string | null | undefined) => {
    if (!style) return 'text-slate-400';
    const colors: Record<string, string> = {
      secure: 'text-emerald-400',
      anxious: 'text-amber-400',
      avoidant: 'text-blue-400',
      fearful: 'text-red-400'
    };
    return colors[style] || 'text-slate-400';
  };

  // Recovery prompt
  if (showRecoveryPrompt && recoverySession) {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md p-6 shadow-2xl">
          <h2 className="text-xl font-bold text-slate-100 mb-2">Continue Previous Session?</h2>
          <p className="text-sm text-slate-400 mb-4">
            We found an incomplete relational pattern session from {new Date(recoverySession.date).toLocaleDateString()}.
            You had explored {recoverySession.relationships.length} relationship{recoverySession.relationships.length !== 1 ? 's' : ''}.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setSession(recoverySession);
                setShowRecoveryPrompt(false);
              }}
              className="flex-1 bg-accent hover:bg-accent/80 text-slate-900 px-4 py-2 rounded-lg font-semibold transition"
            >
              Continue
            </button>
            <button
              onClick={() => {
                setShowRecoveryPrompt(false);
                if (userId) {
                  localStorage.removeItem(`relational-pattern-draft-${userId}`);
                }
              }}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-100 px-4 py-2 rounded-lg transition"
            >
              Start Fresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 md:p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl md:max-w-6xl h-[85vh] flex flex-col shadow-2xl">
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
          <div className="flex items-center gap-3">
            {session.attachmentStyle && (
              <div className={`flex items-center gap-2 px-3 py-1 bg-slate-800/50 border border-slate-700 rounded-lg ${getAttachmentColor(session.attachmentStyle)}`} title={attachmentProfiles[session.attachmentStyle]?.description}>
                <span className="text-xs font-semibold">{attachmentProfiles[session.attachmentStyle]?.label}</span>
              </div>
            )}
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

        {/* Main content with sidebar */}
        <div className="flex-1 flex overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={chatMessagesRef}>
            {session.conversation.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                data-relationship={msg.text.includes('Trigger:') ? 'marked' : undefined}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-4 ${
                    msg.role === 'user'
                      ? 'bg-accent/20 border border-accent/30 text-slate-100'
                      : 'bg-slate-800/50 border border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {msg.text.split('\n').map((line, i) => {
                      // Simple markdown rendering
                      if (line.startsWith('## ')) {
                        return <h2 key={i} className="text-lg font-bold text-slate-100 mt-3 mb-2">{line.replace('## ', '')}</h2>;
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

            {/* Heatmap display when analysis is shown */}
            {session.analysis && (
              <div className="flex justify-start">
                <ReactiveSignatureHeatmap analysis={session.analysis} />
              </div>
            )}

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

          {/* Pattern Overview Sidebar */}
          <PatternOverviewPanel
            relationships={session.relationships}
            onScrollToRelationship={scrollToRelationship}
          />
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
