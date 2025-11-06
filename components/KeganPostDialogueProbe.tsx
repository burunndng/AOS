import React, { useState, useEffect, useRef } from 'react';
import { KeganAssessmentSession, KeganProbeSession, KeganProbeExchange, KeganProbeType } from '../types.ts';
import { X, Send, Download, Brain, ChevronRight } from 'lucide-react';
import * as geminiService from '../services/geminiService.ts';

interface KeganPostDialogueProbeProps {
  assessmentSession: KeganAssessmentSession;
  onClose: () => void;
  onComplete: (probeSession: KeganProbeSession) => void;
}

const PROBE_SEQUENCE: KeganProbeType[] = ['CONTRADICTION', 'SUBJECT_OBJECT', 'ASSUMPTIONS'];

const PROBE_TYPE_LABELS: Record<KeganProbeType, { title: string; description: string }> = {
  CONTRADICTION: {
    title: 'Exploring Contradictions',
    description: 'Testing the edges of your meaning-making system by examining tensions in your values'
  },
  SUBJECT_OBJECT: {
    title: 'Making Subject into Object',
    description: 'Helping you step back from patterns you\'re embedded in'
  },
  ASSUMPTIONS: {
    title: 'Testing Big Assumptions',
    description: 'Exploring the foundational beliefs that organize your identity'
  }
};

const INTRODUCTION_MESSAGE = `Welcome to the Interactive Developmental Probe.

This dialogue moves beyond the static assessment to test the edges of your meaning-making system - similar to a real Subject-Object Interview.

**What to expect:**
• Three carefully crafted probes, each exploring a different edge
• Questions designed to reveal what you can't yet see
• A safe space to explore without judgment

**How it works:**
• I'll ask a question based on your assessment responses
• Take your time - there are no "right" answers
• The goal is to reveal your current developmental structure

Ready to begin? I'll start with the first probe.`;

export default function KeganPostDialogueProbe({
  assessmentSession,
  onClose,
  onComplete
}: KeganPostDialogueProbeProps) {
  const [probeSession, setProbeSession] = useState<KeganProbeSession>({
    id: `probe-${Date.now()}`,
    assessmentSessionId: assessmentSession.id,
    date: new Date().toISOString(),
    exchanges: []
  });

  const [currentProbeIndex, setCurrentProbeIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: 'bot' | 'user'; text: string }>>([
    { role: 'bot', text: INTRODUCTION_MESSAGE }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationHistory]);

  // Generate the first probe when user starts
  const handleStart = async () => {
    setShowIntro(false);
    await generateNextProbe();
  };

  const generateNextProbe = async () => {
    if (currentProbeIndex >= PROBE_SEQUENCE.length) {
      // All probes complete, generate integrated insights
      await handleComplete();
      return;
    }

    setIsGenerating(true);
    const probeType = PROBE_SEQUENCE[currentProbeIndex];

    try {
      let question = '';

      // Generate the appropriate probe based on type
      switch (probeType) {
        case 'CONTRADICTION':
          question = await geminiService.generateContradictionProbe(assessmentSession);
          break;
        case 'SUBJECT_OBJECT':
          question = await geminiService.generateSubjectByObjectProbe(assessmentSession);
          break;
        case 'ASSUMPTIONS':
          question = await geminiService.generateAssumptionBoundaryProbe(assessmentSession);
          break;
      }

      setCurrentQuestion(question);

      // Add probe context message
      const contextMessage = `**${PROBE_TYPE_LABELS[probeType].title}**\n\n${PROBE_TYPE_LABELS[probeType].description}\n\n---\n\n${question}`;
      setConversationHistory(prev => [...prev, { role: 'bot', text: contextMessage }]);

      // Create the exchange record
      const newExchange: KeganProbeExchange = {
        id: `exchange-${Date.now()}`,
        probeType,
        question
      };

      setProbeSession(prev => ({
        ...prev,
        exchanges: [...prev.exchanges, newExchange]
      }));

    } catch (error) {
      console.error('Error generating probe:', error);
      setConversationHistory(prev => [
        ...prev,
        { role: 'bot', text: 'I encountered an error generating the probe. Please try again or close this dialogue.' }
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || isAnalyzing) return;

    const userResponse = inputText.trim();
    setInputText('');
    setConversationHistory(prev => [...prev, { role: 'user', text: userResponse }]);
    setIsAnalyzing(true);

    try {
      // Update the current exchange with the user's response
      const updatedExchanges = [...probeSession.exchanges];
      const currentExchange = updatedExchanges[currentProbeIndex];
      currentExchange.userResponse = userResponse;

      // Analyze the response
      const analysis = await geminiService.analyzeProbeResponse(currentExchange, assessmentSession);
      currentExchange.aiAnalysis = analysis;

      setProbeSession(prev => ({
        ...prev,
        exchanges: updatedExchanges
      }));

      // Show analysis feedback
      let feedbackMessage = `**What this reveals:**\n\n${analysis.subjectObjectReveal}\n\n${analysis.developmentalInsight}`;

      // If there's a follow-up probe, ask it
      if (analysis.nextProbe) {
        feedbackMessage += `\n\n---\n\n**Follow-up:** ${analysis.nextProbe}`;
        setConversationHistory(prev => [...prev, { role: 'bot', text: feedbackMessage }]);
        // Don't advance to next probe type yet - wait for follow-up response
      } else {
        // Move to next probe
        setConversationHistory(prev => [...prev, { role: 'bot', text: feedbackMessage }]);

        // Wait a moment, then generate the next probe
        setTimeout(() => {
          setCurrentProbeIndex(prev => prev + 1);
        }, 1000);
      }

    } catch (error) {
      console.error('Error analyzing response:', error);
      setConversationHistory(prev => [
        ...prev,
        { role: 'bot', text: 'I encountered an error analyzing your response. Please continue with your exploration.' }
      ]);
      // Move to next probe even if analysis fails
      setTimeout(() => {
        setCurrentProbeIndex(prev => prev + 1);
      }, 1000);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate next probe when index changes
  useEffect(() => {
    if (!showIntro && currentProbeIndex < PROBE_SEQUENCE.length && currentProbeIndex > 0) {
      generateNextProbe();
    }
  }, [currentProbeIndex]);

  const handleComplete = async () => {
    setIsAnalyzing(true);
    setConversationHistory(prev => [
      ...prev,
      { role: 'bot', text: 'Thank you for engaging with these probes. I\'m now integrating all of your responses to provide refined developmental insights...' }
    ]);

    try {
      const integratedInsights = await geminiService.generateProbeIntegratedInsights(
        assessmentSession,
        probeSession
      );

      const updatedProbeSession: KeganProbeSession = {
        ...probeSession,
        integratedInsights
      };

      setProbeSession(updatedProbeSession);

      // Show completion message
      const completionMessage = `**Developmental Probe Complete**

Through this interactive exploration, we've gained deeper insight into your meaning-making system.

**Confirmed Stage:** ${integratedInsights.confirmedStage}

**What you're currently subject to (embedded in):**
${integratedInsights.subjectStructure.map(s => `• ${s}`).join('\n')}

**What you can now hold as object (reflect on):**
${integratedInsights.objectStructure.map(o => `• ${o}`).join('\n')}

**Big Assumptions identified:**
${integratedInsights.bigAssumptions.map(a => `• ${a}`).join('\n')}

**Developmental Edge:**
${integratedInsights.edgeOfDevelopment}

You can download the complete report using the download button above. Click "Complete" to finish.`;

      setConversationHistory(prev => [...prev, { role: 'bot', text: completionMessage }]);

      // Auto-complete after showing results
      setTimeout(() => {
        onComplete(updatedProbeSession);
      }, 2000);

    } catch (error) {
      console.error('Error generating integrated insights:', error);
      setConversationHistory(prev => [
        ...prev,
        { role: 'bot', text: 'I encountered an error generating the final insights. Your responses have been saved. You can close this dialogue.' }
      ]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (showIntro) {
        handleStart();
      } else {
        handleSend();
      }
    }
  };

  const handleDownload = () => {
    const content = `# Kegan Stage Assessment - Interactive Developmental Probe
Date: ${new Date(probeSession.date).toLocaleDateString()}

## Original Assessment
**Center of Gravity:** ${assessmentSession.overallInterpretation?.centerOfGravity}

## Interactive Dialogue

${conversationHistory.map(msg =>
  `**${msg.role === 'user' ? 'You' : 'Developmental Probe'}:** ${msg.text}`
).join('\n\n')}

${probeSession.integratedInsights ? `
## Integrated Developmental Insights

**Confirmed Stage:** ${probeSession.integratedInsights.confirmedStage}

**Refined Analysis:**
${probeSession.integratedInsights.refinedAnalysis}

**Developmental Edge:**
${probeSession.integratedInsights.edgeOfDevelopment}

**Big Assumptions:**
${probeSession.integratedInsights.bigAssumptions.map((a, i) => `${i + 1}. ${a}`).join('\n')}

**What You're Subject To (Embedded In):**
${probeSession.integratedInsights.subjectStructure.map((s, i) => `${i + 1}. ${s}`).join('\n')}

**What You Can Hold as Object (Reflect On):**
${probeSession.integratedInsights.objectStructure.map((o, i) => `${i + 1}. ${o}`).join('\n')}

**Developmental Recommendations:**
${probeSession.integratedInsights.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}
` : ''}
`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kegan-probe-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
  };

  const progressPercentage = ((currentProbeIndex / PROBE_SEQUENCE.length) * 100);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex flex-col border-b border-slate-700">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <Brain size={28} className="text-accent" />
              <div>
                <h1 className="text-2xl font-bold text-slate-100">Interactive Developmental Probe</h1>
                <p className="text-sm text-slate-400">
                  {showIntro
                    ? 'Testing the edges of your meaning-making system'
                    : `Probe ${currentProbeIndex + 1} of ${PROBE_SEQUENCE.length}${currentProbeIndex < PROBE_SEQUENCE.length ? ` - ${PROBE_TYPE_LABELS[PROBE_SEQUENCE[currentProbeIndex]].title}` : ' - Complete'}`
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {probeSession.integratedInsights && (
                <button
                  onClick={handleDownload}
                  className="p-2 hover:bg-slate-800 rounded-lg transition"
                  title="Download Report"
                >
                  <Download size={20} className="text-slate-400" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-800 rounded-lg transition"
                title="Close"
              >
                <X size={24} className="text-slate-400" />
              </button>
            </div>
          </div>
          {/* Progress bar */}
          {!showIntro && (
            <div className="px-6 pb-4">
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {conversationHistory.map((msg, idx) => (
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
                <div className="whitespace-pre-wrap prose prose-invert prose-sm max-w-none">
                  {msg.text.split('\n').map((line, i) => {
                    // Handle markdown bold
                    if (line.startsWith('**') && line.endsWith('**')) {
                      return <div key={i} className="font-bold text-accent mb-2">{line.slice(2, -2)}</div>;
                    }
                    // Handle bullet points
                    if (line.startsWith('• ')) {
                      return <div key={i} className="ml-4 mb-1">{line}</div>;
                    }
                    // Handle horizontal rules
                    if (line === '---') {
                      return <hr key={i} className="my-3 border-slate-600" />;
                    }
                    return <div key={i}>{line || <br />}</div>;
                  })}
                </div>
              </div>
            </div>
          ))}

          {isGenerating && (
            <div className="flex justify-start">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-400 border-t-transparent" />
                  <span>Generating probe question...</span>
                </div>
              </div>
            </div>
          )}

          {isAnalyzing && (
            <div className="flex justify-start">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-400 border-t-transparent" />
                  <span>Analyzing your response...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-slate-700 p-4">
          {showIntro ? (
            <button
              onClick={handleStart}
              disabled={isGenerating}
              className="w-full bg-accent hover:bg-accent/90 text-slate-900 font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Begin Developmental Probe
              <ChevronRight size={20} />
            </button>
          ) : (
            <div className="flex gap-2">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Share your thoughts... (Press Enter to send, Shift+Enter for new line)"
                className="flex-1 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-accent/50"
                rows={3}
                disabled={isAnalyzing || isGenerating || currentProbeIndex >= PROBE_SEQUENCE.length}
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim() || isAnalyzing || isGenerating || currentProbeIndex >= PROBE_SEQUENCE.length}
                className="bg-accent hover:bg-accent/90 text-slate-900 font-semibold px-6 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
