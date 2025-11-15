
import React, { useState, useEffect } from 'react';
import { ThreeTwoOneSession, IntegratedInsight, FaceItAnalysis, DialogueEntry, EmbodimentAnalysis, IntegrationPlan } from '../types.ts';
import { X, ArrowLeft, ArrowRight, Lightbulb, MessageCircle, Heart, Zap, Loader } from 'lucide-react';
import { summarizeThreeTwoOneSession, generateSocraticProbe, generateReflectiveProbe } from '../services/geminiService.ts';
import type { WizardSequenceContext } from '../services/wizardSequenceContext.ts';

type Step = 'ONBOARDING' | 'TRIGGER' | 'FACE_IT' | 'TALK_TO_IT' | 'BE_IT' | 'INTEGRATE' | 'SUMMARY';

function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

interface ThreeTwoOneWizardProps {
  onClose: () => void;
  onSave: (session: ThreeTwoOneSession) => void;
  session: Partial<ThreeTwoOneSession> | null;
  insightContext?: IntegratedInsight | null;
  markInsightAsAddressed: (insightId: string, shadowToolType: string, shadowSessionId: string) => void;
  sequenceContext?: WizardSequenceContext | null;
}

export default function ThreeTwoOneWizard({ onClose, onSave, session: draft, insightContext, markInsightAsAddressed, sequenceContext }: ThreeTwoOneWizardProps) {
  const [session, setSession] = useState<Partial<ThreeTwoOneSession>>(() => {
    if (insightContext && (!draft || !draft.linkedInsightId)) {
      return { ...draft, linkedInsightId: insightContext.id };
    }
    return draft || {};
  });
  const [step, setStep] = useState<Step>('ONBOARDING');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProbe, setIsLoadingProbe] = useState(false);
  const [faceItAnalysis, setFaceItAnalysis] = useState<Partial<FaceItAnalysis>>({});
  const [dialogueTranscript, setDialogueTranscript] = useState<DialogueEntry[]>([]);
  const [embodimentAnalysis, setEmbodimentAnalysis] = useState<Partial<EmbodimentAnalysis>>({});
  const [integrationPlan, setIntegrationPlan] = useState<Partial<IntegrationPlan>>({});

  // AI-guided probes and reflections
  const [faceItProbe, setFaceItProbe] = useState<string>('');
  const [beItSomaticPrompt, setBeItSomaticPrompt] = useState<string>('');
  const [userSomaticResponse, setUserSomaticResponse] = useState<string>('');

  useEffect(() => {
    if (draft) {
      setSession(draft);
      if (!draft.trigger) setStep('TRIGGER');
      else if (!draft.faceItAnalysis) setStep('FACE_IT');
      else if (!draft.dialogueTranscript) setStep('TALK_TO_IT');
      else if (!draft.embodimentAnalysis) setStep('BE_IT');
      else if (!draft.integrationPlan) setStep('INTEGRATE');

      // Load existing structured data if available
      if (draft.faceItAnalysis) setFaceItAnalysis(draft.faceItAnalysis);
      if (draft.dialogueTranscript) setDialogueTranscript(draft.dialogueTranscript);
      if (draft.embodimentAnalysis) setEmbodimentAnalysis(draft.embodimentAnalysis);
      if (draft.integrationPlan) setIntegrationPlan(draft.integrationPlan);
    }
    if (insightContext && session.linkedInsightId !== insightContext.id) {
        setSession(prev => ({ ...prev, linkedInsightId: insightContext.id }));
    }
  }, [draft, insightContext]);

  const updateSession = (field: keyof ThreeTwoOneSession, value: string) => {
    setSession(prev => ({ ...prev, [field]: value }));
  };

  const handleDialogueSubmit = async (userMessage: string) => {
    // Add user message to transcript
    setDialogueTranscript(prev => [...prev, { role: 'user', text: userMessage }]);

    // Get Socratic response from AI
    setIsLoadingProbe(true);
    try {
      const aiResponse = await generateSocraticProbe(dialogueTranscript, session.trigger || '');
      setDialogueTranscript(prev => [...prev, { role: 'bot', text: aiResponse }]);
    } catch (e) {
      console.error("Error generating Socratic probe:", e);
    } finally {
      setIsLoadingProbe(false);
    }
  };

  const handleGenerateFaceItProbe = async () => {
    if (!faceItAnalysis.objectiveDescription) return;
    setIsLoadingProbe(true);
    try {
      const probe = await generateReflectiveProbe('FACE_IT', faceItAnalysis, session.trigger || '');
      setFaceItProbe(probe);
    } catch (e) {
      console.error("Error generating Face It probe:", e);
    } finally {
      setIsLoadingProbe(false);
    }
  };

  const handleGenerateBeItPrompt = async () => {
    if (!embodimentAnalysis.embodimentStatement) return;
    setIsLoadingProbe(true);
    try {
      const prompt = await generateReflectiveProbe('BE_IT', embodimentAnalysis, session.trigger || '');
      setBeItSomaticPrompt(prompt);
    } catch (e) {
      console.error("Error generating somatic prompt:", e);
    } finally {
      setIsLoadingProbe(false);
    }
  };

  const handleNext = async () => {
    switch (step) {
      case 'ONBOARDING': setStep('TRIGGER'); break;
      case 'TRIGGER': setStep('FACE_IT'); break;
      case 'FACE_IT': setStep('TALK_TO_IT'); break;
      case 'TALK_TO_IT': setStep('BE_IT'); break;
      case 'BE_IT': setStep('INTEGRATE'); break;
      case 'INTEGRATE':
        setIsLoading(true);
        const finalSessionData: ThreeTwoOneSession = {
          id: session.id || `321-${Date.now()}`,
          date: session.date || new Date().toISOString(),
          trigger: session.trigger || '',
          triggerDescription: session.triggerDescription || '',
          dialogue: session.dialogue || '',
          embodiment: session.embodiment || '',
          integration: session.integration || '',
          faceItAnalysis: faceItAnalysis as FaceItAnalysis,
          dialogueTranscript,
          embodimentAnalysis: embodimentAnalysis as EmbodimentAnalysis,
          integrationPlan: integrationPlan as IntegrationPlan,
          linkedInsightId: session.linkedInsightId
        };
        try {
          const summary = await summarizeThreeTwoOneSession(finalSessionData);
          setSession({ ...finalSessionData, aiSummary: summary });
        } catch (e) {
            console.error("Error generating summary:", e);
             setSession({ ...finalSessionData, aiSummary: "Could not generate summary." });
        } finally {
            setIsLoading(false);
            setStep('SUMMARY');
        }
        break;
      case 'SUMMARY':
        const sessionToSave: ThreeTwoOneSession = {
            id: session.id || `321-${Date.now()}`,
            date: session.date || new Date().toISOString(),
            trigger: session.trigger || '',
            triggerDescription: session.triggerDescription || '',
            dialogue: session.dialogue || '',
            embodiment: session.embodiment || '',
            integration: session.integration || '',
            faceItAnalysis: faceItAnalysis as FaceItAnalysis,
            dialogueTranscript,
            embodimentAnalysis: embodimentAnalysis as EmbodimentAnalysis,
            integrationPlan: integrationPlan as IntegrationPlan,
            aiSummary: session.aiSummary,
            linkedInsightId: session.linkedInsightId
        };
        onSave(sessionToSave);
        if (sessionToSave.linkedInsightId) {
            markInsightAsAddressed(sessionToSave.linkedInsightId, '3-2-1 Process', sessionToSave.id);
        }
        break;
    }
  };
  
  const handleBack = () => {
    switch (step) {
      case 'TRIGGER': setStep('ONBOARDING'); break;
      case 'FACE_IT': setStep('TRIGGER'); break;
      case 'TALK_TO_IT': setStep('FACE_IT'); break;
      case 'BE_IT': setStep('TALK_TO_IT'); break;
      case 'INTEGRATE': setStep('BE_IT'); break;
      case 'SUMMARY': setStep('INTEGRATE'); break;
    }
  };
  
  const renderStep = () => {
    switch (step) {
      case 'ONBOARDING':
        return (
          <>
            <h3 className="text-xl font-semibold font-mono text-slate-100 flex items-center gap-2 mb-4">
              <Heart className="text-purple-400" size={24} /> The 3-2-1 Shadow Work Process
            </h3>
            {insightContext && (
              <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-200">
                  <strong>Welcome back.</strong> It looks like you're ready to work deeper with the pattern: <strong>"{insightContext.detectedPattern}"</strong>
                </p>
              </div>
            )}
            <div className="space-y-4 text-slate-300">
              <p>
                This guided process helps you integrate disowned parts of yourself by working with the qualities that trigger you most. Through dialogue and embodiment, you'll uncover the hidden gift in what you've rejected.
              </p>
              <div className="bg-purple-900/20 border border-purple-700/50 rounded-lg p-4 space-y-3">
                <p className="font-semibold text-purple-200">How it works:</p>
                <ol className="space-y-2 text-sm">
                  <li><strong>1. Face It:</strong> Describe the triggering quality objectively (3rd person view)</li>
                  <li><strong>2. Talk to It:</strong> Dialogue with this quality to understand its gifts (2nd person engagement)</li>
                  <li><strong>3. Be It:</strong> Embody the quality and speak from its perspective (1st person experience)</li>
                  <li><strong>4. Integrate:</strong> Re-own this quality as a valuable part of yourself</li>
                </ol>
              </div>
              <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
                <p className="font-semibold text-blue-200 mb-2">A note on approach:</p>
                <p className="text-sm">
                  Approach this process with <strong>curiosity, not criticism</strong>. The goal is integration, not self-blame.
                  The qualities that trigger you often contain gifts or positive intentions we've learned to hide from ourselves.
                </p>
              </div>
            </div>
          </>
        );
      case 'TRIGGER':
        return (
          <>
            <h3 className="text-lg font-semibold font-mono text-slate-100">Step 1: Name the Trigger</h3>
            {insightContext && (
                <div className="bg-blue-900/30 border border-blue-700 rounded-md p-4 my-4 text-sm text-blue-200 space-y-3">
                    <p className="font-bold flex items-center gap-2"><Lightbulb size={16}/> Starting from an Insight:</p>
                    <p><strong className="text-blue-300">Session Context:</strong> {insightContext.mindToolShortSummary}</p>
                    <p><strong className="text-blue-300">Detected Pattern:</strong> "{insightContext.detectedPattern}"</p>
                    <div className="mt-2">
                      <p className="text-xs text-blue-400 mb-1">Full context from your {insightContext.mindToolType} session:</p>
                      <div className="bg-slate-900/50 p-3 rounded-md max-h-48 overflow-y-auto text-xs whitespace-pre-wrap font-mono">
                        {insightContext.mindToolReport}
                      </div>
                    </div>
                    <p className="text-xs text-blue-400 mt-2">Use this context to define the quality that triggers you below.</p>
                </div>
            )}
            <p className="text-slate-400 mb-2">What person or situation is bothering you? Name the quality that triggers you (1-2 words).</p>
            <input
              type="text"
              value={session.trigger || ''}
              onChange={(e) => updateSession('trigger', e.target.value)}
              placeholder="e.g., arrogance, neediness, control"
              className="w-full bg-slate-900/50 border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </>
        );
      case 'FACE_IT':
        return (
          <>
            <h3 className="text-lg font-semibold font-mono text-slate-100 flex items-center gap-2">
              Step 2: Face It (3rd Person) <span className="text-amber-400 text-sm font-normal">Objective observation</span>
            </h3>
            <p className="text-slate-400 text-sm mb-4">Describe what you observe objectively, without judgment.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">What does this quality do or how does it act?</label>
                <input
                  type="text"
                  value={faceItAnalysis.objectiveDescription || ''}
                  onChange={(e) => setFaceItAnalysis(prev => ({ ...prev, objectiveDescription: e.target.value }))}
                  placeholder="e.g., Interrupts others, takes charge in meetings, dismisses different viewpoints"
                  className="w-full bg-slate-900/50 border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Specific behaviors or actions (comma-separated)</label>
                <input
                  type="text"
                  value={faceItAnalysis.specificActions?.join(', ') || ''}
                  onChange={(e) => setFaceItAnalysis(prev => ({ ...prev, specificActions: e.target.value.split(',').map(s => s.trim()) }))}
                  placeholder="e.g., Speaks first in meetings, doesn't ask others' opinions, makes decisions alone"
                  className="w-full bg-slate-900/50 border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">What emotions does this trigger in you? (comma-separated)</label>
                <input
                  type="text"
                  value={faceItAnalysis.triggeredEmotions?.join(', ') || ''}
                  onChange={(e) => setFaceItAnalysis(prev => ({ ...prev, triggeredEmotions: e.target.value.split(',').map(s => s.trim()) }))}
                  placeholder="e.g., Frustration, powerlessness, resentment"
                  className="w-full bg-slate-900/50 border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            {!faceItProbe && faceItAnalysis.objectiveDescription && (
              <button
                onClick={handleGenerateFaceItProbe}
                disabled={isLoadingProbe}
                className="mt-4 text-sm text-purple-300 hover:text-purple-200 flex items-center gap-2 disabled:opacity-50"
              >
                {isLoadingProbe ? <Loader size={14} className="animate-spin" /> : '✨'}
                {isLoadingProbe ? 'Generating reflection...' : 'Get a reflective question'}
              </button>
            )}

            {faceItProbe && (
              <div className="mt-4 bg-purple-900/20 border border-purple-700/50 rounded-lg p-4">
                <p className="text-sm text-purple-200 italic">💭 {faceItProbe}</p>
              </div>
            )}
          </>
        );
      case 'TALK_TO_IT':
        return (
          <>
            <h3 className="text-lg font-semibold font-mono text-slate-100 flex items-center gap-2">
              Step 3: Talk To It (2nd Person) <MessageCircle className="text-blue-400" size={20} />
            </h3>
            <p className="text-slate-400 text-sm mb-4">Have a dialogue with this quality. Ask it about its gift or positive intention.</p>
            <div className="space-y-3 max-h-96 overflow-y-auto mb-4 bg-slate-900/20 rounded-lg p-4">
              {dialogueTranscript.map((entry, idx) => (
                <div key={idx} className={`flex gap-3 ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs rounded-lg p-3 ${
                    entry.role === 'user'
                      ? 'bg-blue-900/50 border border-blue-700 text-blue-100'
                      : 'bg-purple-900/50 border border-purple-700 text-purple-100'
                  }`}>
                    <p className="text-xs font-semibold mb-1">{entry.role === 'user' ? 'You' : 'The Quality'}</p>
                    <p className="text-sm">{entry.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3 mb-4">
              <p className="text-xs text-blue-300 font-semibold mb-2">💡 Suggested questions to ask:</p>
              <ul className="text-xs text-blue-200 space-y-1">
                <li>• What do you want for me?</li>
                <li>• What is your gift or positive intention?</li>
                <li>• What are you trying to protect me from?</li>
                <li>• What do you need to feel valued?</li>
              </ul>
            </div>
            <input
              type="text"
              placeholder="Ask your question..."
              onKeyPress={(e) => {
                if (e.key === 'Enter' && (e.target as HTMLInputElement).value && !isLoadingProbe) {
                  const text = (e.target as HTMLInputElement).value;
                  handleDialogueSubmit(text);
                  (e.target as HTMLInputElement).value = '';
                }
              }}
              disabled={isLoadingProbe}
              className="w-full bg-slate-900/50 border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
            />
            {isLoadingProbe && <p className="text-xs text-purple-400 mt-2 flex items-center gap-2"><Loader size={12} className="animate-spin" /> Listening...</p>}
            {!isLoadingProbe && <p className="text-xs text-slate-500 mt-2">Press Enter to continue the dialogue</p>}
          </>
        );
      case 'BE_IT':
        return (
          <>
            <h3 className="text-lg font-semibold font-mono text-slate-100 flex items-center gap-2">
              Step 4: Be It (1st Person) <Zap className="text-yellow-400" size={20} />
            </h3>
            <p className="text-slate-400 text-sm mb-4">Embody this quality and speak from its perspective using "I".</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">"I am..." statement</label>
                <input
                  type="text"
                  value={embodimentAnalysis.embodimentStatement || ''}
                  onChange={(e) => setEmbodimentAnalysis(prev => ({ ...prev, embodimentStatement: e.target.value }))}
                  placeholder='e.g., "I am confidence. I take charge because I believe in myself and want to lead."'
                  className="w-full bg-slate-900/50 border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              {!beItSomaticPrompt && embodimentAnalysis.embodimentStatement && (
                <button
                  onClick={handleGenerateBeItPrompt}
                  disabled={isLoadingProbe}
                  className="text-sm text-yellow-300 hover:text-yellow-200 flex items-center gap-2 disabled:opacity-50"
                >
                  {isLoadingProbe ? <Loader size={14} className="animate-spin" /> : '🧘'}
                  {isLoadingProbe ? 'Generating somatic guidance...' : 'Get a somatic check-in'}
                </button>
              )}

              {beItSomaticPrompt && (
                <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
                  <p className="text-sm text-yellow-200">{beItSomaticPrompt}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Where do you feel this in your body?</label>
                <input
                  type="text"
                  value={embodimentAnalysis.somaticLocation || ''}
                  onChange={(e) => setEmbodimentAnalysis(prev => ({ ...prev, somaticLocation: e.target.value }))}
                  placeholder="e.g., My chest expands, my shoulders back, my jaw tightens"
                  className="w-full bg-slate-900/50 border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">What is my core message or gift?</label>
                <input
                  type="text"
                  value={embodimentAnalysis.coreMessage || ''}
                  onChange={(e) => setEmbodimentAnalysis(prev => ({ ...prev, coreMessage: e.target.value }))}
                  placeholder="e.g., I bring clarity and decisive action. I help you stand up for yourself."
                  className="w-full bg-slate-900/50 border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
          </>
        );
      case 'INTEGRATE':
         return (
          <>
            <h3 className="text-lg font-semibold font-mono text-slate-100 flex items-center gap-2">
              Step 5: Integration <Heart className="text-pink-400" size={20} />
            </h3>
            <p className="text-slate-400 text-sm mb-4">How can you re-own this quality in a healthy, integrated way?</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">How will you re-own this quality?</label>
                <input
                  type="text"
                  value={integrationPlan.reowningStatement || ''}
                  onChange={(e) => setIntegrationPlan(prev => ({ ...prev, reowningStatement: e.target.value }))}
                  placeholder='e.g., "I can be confident and decisive while still listening to others."'
                  className="w-full bg-slate-900/50 border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">What specific action will you take this week?</label>
                <input
                  type="text"
                  value={integrationPlan.actionableStep || ''}
                  onChange={(e) => setIntegrationPlan(prev => ({ ...prev, actionableStep: e.target.value }))}
                  placeholder="e.g., In the next meeting, speak first AND ask for one other person's opinion before deciding"
                  className="w-full bg-slate-900/50 border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Which practice from your stack might support this integration? (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., Reflective journaling, IFS practice, or meditation"
                  className="w-full bg-slate-900/50 border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
          </>
        );
       case 'SUMMARY':
        return (
            <>
                <h3 className="text-lg font-semibold font-mono text-slate-100">Session Summary</h3>
                <p className="text-slate-400 mb-4">Here's Aura's summary of your session. Reflect on it before saving.</p>
                <div className="bg-slate-700/50 p-4 rounded-md">
                    <p className="text-slate-300 italic">{session.aiSummary}</p>
                </div>
            </>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in">
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <header className="p-4 border-b border-slate-700 flex justify-between items-center">
                <h2 className="text-2xl font-bold font-mono tracking-tight text-amber-300">3-2-1 Process Wizard</h2>
                <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X size={24} /></button>
            </header>
            <main className="p-6 flex-grow overflow-y-auto space-y-4">
                {/* Wizard Sequence Context */}
                {sequenceContext && sequenceContext.sessionCount > 0 && step === 'TRIGGER' && (
                  <div className="mb-6 bg-purple-900/20 border border-purple-700/50 rounded-lg p-5">
                    <h3 className="text-sm font-semibold text-purple-300 mb-3 uppercase tracking-wider flex items-center gap-2">
                      <span className="text-purple-500">⬢</span>
                      Your Journey with this Practice
                    </h3>

                    {/* Session count */}
                    <p className="text-sm text-slate-300 mb-3">
                      This is your <strong className="text-purple-200">{sequenceContext.sessionCount + 1}{getOrdinalSuffix(sequenceContext.sessionCount + 1)}</strong> time with the 3-2-1 Process.
                      {sequenceContext.firstSessionDate && (
                        <> First session: <strong className="text-purple-200">{new Date(sequenceContext.firstSessionDate).toLocaleDateString()}</strong></>
                      )}
                    </p>

                    {/* Building on narrative */}
                    {sequenceContext.buildingOn && (
                      <div className="bg-slate-800/60 border-l-2 border-purple-500 p-3 mb-3">
                        <p className="text-sm text-purple-200">
                          <strong className="text-purple-300">Building on:</strong> {sequenceContext.buildingOn}
                        </p>
                      </div>
                    )}

                    {/* Suggested focus */}
                    {sequenceContext.suggestedFocus && (
                      <div className="bg-slate-800/60 border-l-2 border-blue-500 p-3 mb-3">
                        <p className="text-sm text-blue-200">
                          <strong className="text-blue-300">Suggested focus:</strong> {sequenceContext.suggestedFocus}
                        </p>
                      </div>
                    )}

                    {/* Pattern evolution */}
                    {sequenceContext.patternEvolution.length > 0 && (
                      <details className="mt-3">
                        <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-300 select-none">
                          View pattern evolution ({sequenceContext.patternEvolution.length} sessions) ▼
                        </summary>
                        <div className="mt-2 space-y-1 pl-4 border-l border-purple-700/50">
                          {sequenceContext.patternEvolution.map((entry, idx) => (
                            <p key={idx} className="text-xs text-slate-400">{entry}</p>
                          ))}
                        </div>
                      </details>
                    )}

                    {/* Related insights from other wizards */}
                    {sequenceContext.relatedInsights.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-purple-900/50">
                        <p className="text-xs text-slate-400 mb-2">
                          Related work from other wizards:
                        </p>
                        <div className="space-y-1">
                          {sequenceContext.relatedInsights.slice(0, 2).map(insight => (
                            <div key={insight.insightId} className="text-xs text-slate-500">
                              <span className="text-purple-400">{insight.wizardType}:</span> {insight.pattern}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {renderStep()}
                {isLoading && <p className="text-slate-400 animate-pulse">Aura is generating your summary...</p>}
            </main>
            <footer className="p-4 border-t border-slate-700 flex justify-between items-center">
                <button onClick={onClose} className="text-sm text-slate-400 hover:text-white transition">Save Draft & Close</button>
                <div className="flex gap-4">
                    {step !== 'ONBOARDING' && <button onClick={handleBack} className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-md font-medium" disabled={isLoading}><ArrowLeft size={16}/></button>}
                    <button onClick={handleNext} disabled={isLoading} className="btn-luminous px-4 py-2 rounded-md font-medium flex items-center gap-2">
                         {step === 'INTEGRATE' ? 'Generate Summary' : step === 'SUMMARY' ? 'Finish & Save' : 'Next'} <ArrowRight size={16}/>
                    </button>
                </div>
            </footer>
        </div>
    </div>
  );
}