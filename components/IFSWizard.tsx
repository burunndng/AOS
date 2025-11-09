import React, { useState, useEffect, useRef } from 'react';
import { IFSSession, IFSPart, IFSDialogueEntry, WizardPhase, IntegratedInsight } from '../types.ts';
import { X, Mic, MicOff, Sparkles, Save, Lightbulb, ArrowRight } from 'lucide-react';
import { getCoachResponse, extractPartInfo, summarizeIFSSession } from '../services/geminiService.ts';
import * as ragService from '../services/ragService.ts';
import { GoogleGenAI, LiveServerMessage, Modality, Blob, Content } from "@google/genai";
import { MerkabaIcon } from './MerkabaIcon.tsx';

// --- Audio Helper Functions ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
  
async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
}
  
function createBlob(data: Float32Array): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
}

const getDynamicSystemInstruction = (context: IntegratedInsight | null): Content => {
    let contextText = '';
    if (context) {
        contextText = `
---
## IMPORTANT SESSION CONTEXT

The user is starting this session based on an insight from a previous tool. Your primary goal is to help them explore this specific context with their parts.

- **Originating Tool:** ${context.mindToolType}
- **Full Report from that Session:** 
  ${context.mindToolReport}
- **AI-Detected Pattern to Explore:** "${context.detectedPattern}"

**Your Opening Move:** Acknowledge this context. Ask the user which part of them holds feelings or beliefs related to this detected pattern. For example: "I see you're here to explore the pattern of '${context.detectedPattern}', which came up in your recent ${context.mindToolType} session. Let's start by connecting with that. When you think about this pattern, which part of you feels it the most? What do you notice inside?"
---
        `;
    }

    const baseInstruction = `## CORE DIRECTIVE

You facilitate IFS self-work. Reflect accurately, ask genuinely, facilitate emergence. Move parts from explaining to experiencing.

**Non-negotiable:** Execute gate checklist before EVERY response.


REASONING

Before responding, you must use Chain-of-Thought reasoning **internally** in order to ensure you are following instructions and that your response is optimal and takes into account all context. Never share reasoning with the user.
---

## MANDATORY GATES (Check Before Each Response)

\`\`\`
GATE 1: CONTACT LEVEL
  □ HIGH (3+ markers: direct speech, tone varied, breathing natural)
  □ MEDIUM (2-3 markers: mixed)  
  □ LOW (0-1 markers: explaining, performed tone)
  → Match response depth to contact level

GATE 2: LOOPING
  □ Asked same question 2+ ways with same answer?
  → If YES: Shift terrain (don't ask third time)

GATE 3: REFLECTION FIRST
  □ New disclosure? → Reflect emotions + body sensation → Pause → One question

GATE 4: SELF-ENERGY CHECK [CRITICAL]
  □ Is user about to speak TO/ABOUT a part?
  → Ask: "How do you feel toward this part?"
  → Listen for: curious, compassionate, calm (Self) vs. frustrated, critical, controlling (another part)
  → If NOT Self: Unblend controlling part first
  
GATE 5: TERRAIN-READINESS
  □ BELIEF work → Requires HIGH contact only
  □ FEAR exploration → Required before any "solution" discussion
  □ Part-to-part dialogue → Requires Self present (Gate 4)
\`\`\`

---

## CONTACT LEVEL MATRIX

**HIGH:** Direct "I feel X" + tone shifts + breathing natural + hesitant/searching (3+ present)
**MEDIUM:** Mix of direct/explaining + some tone variation (2-3 present)  
**LOW:** Describing part + managed tone + rehearsed quality (0-1 present)

---

## CRITICAL PROTOCOLS

### 1. SELF-ENERGY VERIFICATION (Gate 4)

**Before user speaks to/about a part, ALWAYS ask:**
> "How do you feel toward this part?"

**Self-energy indicators:** Curious, compassionate, calm, open
**Manager blended indicators:** Frustrated, critical, "it needs to stop," controlling tone, "should" language

**If manager detected:**
> "I notice a part feels [frustrated/critical] toward [other part]. That makes sense. Before we talk to [other part], can we get to know this [frustrated] part? What's it afraid would happen?"

**Do NOT proceed without Self present.**

### 2. FEAR EXPLORATION BEFORE SOLUTIONS

**Do NOT suggest new roles/strategies until you've explored:**
- "What are you afraid would happen if you stopped?"
- "What specifically do you fear about [outcome]?"
- "What's the worst-case scenario you're preventing?"

**Then validate** (don't argue): "You believe [fear]. Thank you for telling me."

**Only after understanding fears:** "What would you need to feel safe stepping back?"

**Let the part tell you** - don't offer solutions.

### 3. POLARIZATION RECOGNITION

**Manager signals:** "Should," controlling, critical, "it's making things worse," problem-solving
**Firefighter signals:** Urgent, "I don't care," desperate to escape, impulsive

**When detected:**
> "I notice two parts: one that [manager] and one that [firefighter]. They're in conflict. Instead of having them argue, let's have Self get to know each separately. Which feels more comfortable to understand first?"

---

## QUESTION ARCHITECTURE BY TERRAIN

**EARLY CONTACT:** "What's alive right now?" "What do you want me to understand?"

**FUNCTION:** "What's your job?" "How long?" "What happens if you don't?"

**EMBODIMENT:** "Where in body?" "Texture/shape/color?" "What does body want to do?"

**PROTECTIVE INTENT:** "What are you protecting from?" "What's your fear about them?"

**FEARS (Required before solutions):** "What would happen if you stopped?" "What's worst-case?" "What do you believe about them?"

**BELIEF (HIGH contact only):** "What do you believe is true about them?" [Reflect exactly, don't argue]

**DESIRE:** "What would you want if not afraid?"

---

## CORE MISTAKES TO AVOID

❌ Allow part-to-part dialogue without Self present
❌ Offer solutions before exploring fears
❌ Miss manager-firefighter polarizations  
❌ Accept performative agreements (if too quick: "Does this feel true?")
❌ Stay in intellectual analysis vs. embodied experience
❌ Ask multiple questions (ask one, wait, next)
❌ Fill silence (count 2-3 sec minimum)
❌ Attempt belief work below HIGH contact

---


---

## SESSION STRUCTURE

**Opening:** "How have parts been this week? What's alive today?"

**During:** Execute gates, reflect before questions, redirect story→sensation, stay with emergence

**Closing (2-3 min):** "Anything else part needs to say?" → Gratitude → "What's it like having heard this?" → Ground ("Feel feet, breath, body")

**Voice pacing:** 30% slower than normal, 2-3 sec pauses, calm breathing between phrases

---

## SAFETY BOUNDARIES

**Pause if:** Suicidal ideation, self-harm urges, acute crisis, overwhelming flooding
**Response:** "This needs professional support. Can you contact your therapist?"

**Monitor:** Between-session activation, firefighter urges, dissociation, solo work replacing human connection

---

## REMEMBER

Self-energy must be present before part-to-part work.
Fears must be understood before solutions discussed.
Polarizations need Self relating to both parts, not parts arguing.
Contact level determines depth - don't violate gates.
Emergence over agenda - follow what appears.

---

**Before responding: Execute all gates. Trust the process.**

---
`;
    return { parts: [{ text: contextText + baseInstruction }] };
};

interface IFSWizardProps {
  isOpen: boolean;
  onClose: (draft: IFSSession | null) => void;
  onSaveSession: (session: IFSSession) => void;
  draft: IFSSession | null;
  partsLibrary: IFSPart[];
  insightContext?: IntegratedInsight | null;
  markInsightAsAddressed: (insightId: string, shadowToolType: string, shadowSessionId: string) => void;
  userId: string;
}

const IFSWizard: React.FC<IFSWizardProps> = ({ isOpen, onClose, onSaveSession, draft, partsLibrary, insightContext, markInsightAsAddressed, userId }) => {
  const [session, setSession] = useState<IFSSession | null>(null);
  const [currentPhase, setCurrentPhase] = useState<WizardPhase>('IDENTIFY');
  const [connectionState, setConnectionState] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [isSaving, setIsSaving] = useState(false);
  const [summaryData, setSummaryData] = useState<{ summary: string, aiIndications: string[] } | null>(null);
  const [userSpeechInput, setUserSpeechInput] = useState(''); // State for user's speech input during live session
  // FIX: Added useState for error state
  const [error, setError] = useState<string | null>(null);
  // FIX: Added useState for isPlaying state
  const [isPlaying, setIsPlaying] = useState(false);
  const [ragSyncing, setRagSyncing] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const sessionPromiseRef = useRef<any>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef(0);
  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');

  const handleSaveAndClose = (finalSession: IFSSession) => {
      onSaveSession(finalSession);
      if (finalSession.linkedInsightId) {
        // FIX: Corrected property name from `linkedInsight` to `linkedInsightId`.
        markInsightAsAddressed(finalSession.linkedInsightId, 'Internal Family Systems', finalSession.id);
      }
      onClose(null); // Clear draft after saving

      // RAG: Generate insights and sync session
      handleCompleteWithRAG(finalSession);
  };

  const handleCompleteWithRAG = async (finalSession: IFSSession) => {
    setRagSyncing(true);
    try {
      // Extract identified parts
      const identifiedParts = finalSession.identifiedParts?.map(p => p.name) || [];

      // Summarize conversations
      const conversations: Record<string, string> = {};
      finalSession.dialogueHistory?.forEach((entry, idx) => {
        conversations[`exchange_${idx}`] = entry.text;
      });

      // Generate RAG insights
      const insights = await ragService.generateIFSInsights(userId, {
        identifiedParts,
        conversations,
      });

      // Sync the completed session to backend
      await ragService.syncUserSession(userId, {
        id: finalSession.id,
        userId: userId,
        type: 'ifs_work',
        content: {
          identifiedParts,
          voicesIdentified: finalSession.identifiedParts?.length || 0,
          dialogueCount: finalSession.dialogueHistory?.length || 0,
          summary: summaryData?.summary || '',
        },
        insights: insights.metadata?.insights || [],
        completedAt: new Date(),
      });

      console.log('[IFSWizard] Session synced and indexed');
    } catch (err) {
      console.error('[IFSWizard] RAG sync error:', err);
      // Don't block completion if RAG fails
    } finally {
      setRagSyncing(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  // Initialize session or load draft
  useEffect(() => {
    if (draft) {
      setSession(draft);
      setCurrentPhase(draft.currentPhase);
    } else {
      const newSessionId = `ifs-${Date.now()}`;
      const initialSession: IFSSession = {
        id: newSessionId,
        date: new Date().toISOString(),
        partId: '',
        partName: '',
        transcript: [],
        integrationNote: '',
        currentPhase: 'IDENTIFY',
        linkedInsightId: insightContext?.id, // Link to insight if provided
      };
      setSession(initialSession);
      setCurrentPhase('IDENTIFY');
    }
  }, [draft, insightContext]);

  // Scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [session?.transcript]);

  // Handle audio cleanup on unmount or wizard close
  useEffect(() => {
    return () => {
      if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then((s: { close: () => any; }) => s.close());
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (inputAudioContextRef.current) {
        inputAudioContextRef.current.close();
      }
      if (outputAudioContextRef.current) {
        outputAudioContextRef.current.close();
      }
      audioSourcesRef.current.forEach(source => source.stop());
      audioSourcesRef.current.clear();
      nextStartTimeRef.current = 0;
    };
  }, []);

  const updateTranscript = (role: 'user' | 'bot', text: string, phase: WizardPhase) => {
    setSession(prev => {
      if (!prev) return null;
      const newTranscript = [...prev.transcript, { role, text, phase }];
      return { ...prev, transcript: newTranscript };
    });
  };

  const startMicrophone = async () => {
    if (connectionState === 'connected') return;

    setConnectionState('connecting');
    // FIX: Use setError hook to update error state
    setError('');
    
    try {
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.debug('IFS Live session opened');
            setConnectionState('connected');
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromiseRef.current?.then((session: { sendRealtimeInput: (arg0: { media: Blob; }) => any; }) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
            scriptProcessorRef.current = scriptProcessor;
            mediaStreamSourceRef.current = source;
          },
          // FIX: Refactored onmessage to prevent stale state issues when updating session transcript and handling termination.
          onmessage: async (message: LiveServerMessage) => {
            // Use a functional update for `setSession` to ensure it always operates on the latest state
            // especially important for `session.transcript`
            setSession(prevSession => {
              if (!prevSession) return null;

              let updatedSession = { ...prevSession };
              let newBotTextChunk = '';
              let newUserTextChunk = '';

              if (message.serverContent?.outputTranscription) {
                  const text = message.serverContent.outputTranscription.text;
                  currentOutputTranscriptionRef.current += text;
                  newBotTextChunk = text;
              }
              if (message.serverContent?.inputTranscription) {
                  const text = message.serverContent.inputTranscription.text;
                  currentInputTranscriptionRef.current += text;
                  newUserTextChunk = text;
              }

              // Handle model audio output
              const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
              if (base64EncodedAudioString && outputAudioContextRef.current) {
                const audioCtx = outputAudioContextRef.current;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioCtx.currentTime);
                decodeAudioData(
                  decode(base64EncodedAudioString),
                  audioCtx,
                  24000,
                  1,
                ).then(audioBuffer => {
                  const source = audioCtx.createBufferSource();
                  source.buffer = audioBuffer;
                  source.connect(audioCtx.destination);
                  source.addEventListener('ended', () => {
                    audioSourcesRef.current.delete(source);
                  });
                  source.start(nextStartTimeRef.current);
                  nextStartTimeRef.current = nextStartTimeRef.current + audioBuffer.duration;
                  audioSourcesRef.current.add(source);
                }).catch(audioErr => console.error('Error decoding/playing audio:', audioErr));
              }

              const interrupted = message.serverContent?.interrupted;
              if (interrupted) {
                audioSourcesRef.current.forEach(source => source.stop());
                audioSourcesRef.current.clear();
                nextStartTimeRef.current = 0;
              }

              // Update transcript based on turn completion
              if (message.serverContent?.turnComplete) {
                  const userFullTurn = currentInputTranscriptionRef.current;
                  const botFullTurn = currentOutputTranscriptionRef.current;

                  let newTranscript = [...updatedSession.transcript];
                  if (userFullTurn) {
                      newTranscript.push({ role: 'user', text: userFullTurn, phase: updatedSession.currentPhase });
                  }
                  if (botFullTurn) {
                      newTranscript.push({ role: 'bot', text: botFullTurn, phase: updatedSession.currentPhase });
                  }
                  updatedSession.transcript = newTranscript;

                  currentInputTranscriptionRef.current = '';
                  currentOutputTranscriptionRef.current = '';
                  setUserSpeechInput(''); // Clear user speech input on turn complete
              } else {
                  // While turn is not complete, update the last user/bot entry dynamically
                  // This is a simplified approach; a more robust solution would track partial transcriptions
                  // FIX: Changed 'at(-1)' to 'array[array.length - 1]' as a safer alternative for the last element.
                  let lastUserEntry = updatedSession.transcript[updatedSession.transcript.length - 1];
                  if (lastUserEntry?.role === 'user' && lastUserEntry?.phase === updatedSession.currentPhase) {
                      // If exists and matches current phase, update
                      lastUserEntry.text = currentInputTranscriptionRef.current;
                  } else if (newUserTextChunk) {
                      // If no existing or not matching phase, create a new one for the current partial input
                      updatedSession.transcript.push({ role: 'user', text: newUserTextChunk, phase: updatedSession.currentPhase });
                  }
                  
                  // FIX: Changed 'at(-1)' to 'array[array.length - 1]' as a safer alternative for the last element.
                  let lastBotEntry = updatedSession.transcript[updatedSession.transcript.length - 1];
                  if (lastBotEntry?.role === 'bot' && lastBotEntry?.phase === updatedSession.currentPhase) {
                      lastBotEntry.text = currentOutputTranscriptionRef.current;
                  } else if (newBotTextChunk) {
                      updatedSession.transcript.push({ role: 'bot', text: newBotTextChunk, phase: updatedSession.currentPhase });
                  }
              }

              return updatedSession;
            });
            
          },
          onerror: (e: ErrorEvent) => {
            console.error('IFS Live session error:', e);
            // FIX: Use setError hook to update error state
            setError(`Connection error: ${e.message}`);
            setConnectionState('error');
            stopMicrophone(); // Attempt to clean up
          },
          onclose: (e: CloseEvent) => {
            console.debug('IFS Live session closed', e);
            if (e.code !== 1000) { // 1000 is normal closure
                // FIX: Use setError hook to update error state
                setError(`Session closed unexpectedly: ${e.reason || 'unknown error'}`);
                setConnectionState('error');
            } else {
                setConnectionState('idle');
            }
            stopMicrophone(); // Ensure cleanup
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: getDynamicSystemInstruction(insightContext),
        },
      });
      sessionPromiseRef.current = sessionPromise;
      
    } catch (e) {
      console.error('Failed to start microphone or connect to AI:', e);
      // FIX: Use setError hook to update error state
      setError(`Failed to start: ${e instanceof Error ? e.message : 'unknown error'}`);
      setConnectionState('error');
    }
  };

  const stopMicrophone = () => {
    if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then((s: { close: () => any; }) => s.close());
        sessionPromiseRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (mediaStreamSourceRef.current) {
      mediaStreamSourceRef.current.disconnect();
      mediaStreamSourceRef.current = null;
    }
    audioSourcesRef.current.forEach(source => source.stop());
    audioSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    currentInputTranscriptionRef.current = '';
    currentOutputTranscriptionRef.current = '';
    setConnectionState('idle');
    // FIX: Use setIsPlaying hook to update isPlaying state
    setIsPlaying(false);
  };
  
  const getPartInfo = async () => {
      if (!session || isSaving) return;
      setIsSaving(true);
      // FIX: Use setError hook to update error state
      setError('');
      try {
          const fullTranscript = session.transcript.map(entry => `${entry.role}: ${entry.text}`).join('\n');
          const info = await extractPartInfo(fullTranscript);
          setSession(prev => ({ ...prev!, partRole: info.role, partFears: info.fears, partPositiveIntent: info.positiveIntent }));
          updateTranscript('bot', `Okay, I'm hearing that this part's role is typically a ${info.role}, and its fears might be around ${info.fears}. It sounds like its positive intent for you is to ${info.positiveIntent}. Does that resonate?`, currentPhase);
      } catch (e) {
          console.error("Error extracting part info:", e);
          // FIX: Use setError hook to update error state
          setError("Failed to extract part information. Please try again.");
          updateTranscript('bot', "Sorry, I couldn't quite get that part's information. Let's try to gently explore it with your words. What are you noticing about its role, its fears, and what it's trying to do for you?", currentPhase);
      } finally {
          setIsSaving(false);
      }
  };

  const summarizeSession = async () => {
      if (!session || isSaving) return;
      setIsSaving(true);
      // FIX: Use setError hook to update error state
      setError('');
      try {
          const fullTranscript = session.transcript.map(entry => `${entry.role}: ${entry.text}`).join('\n');
          // FIX: Use the correct properties for part info when summarizing.
          const partInfo = {
            role: session.partRole || '',
            fears: session.partFears || '',
            positiveIntent: session.partPositiveIntent || '',
          };
          const { summary, aiIndications } = await summarizeIFSSession(fullTranscript, partInfo);
          setSummaryData({ summary, aiIndications });
          setSession(prev => ({ ...prev!, summary, aiIndications, currentPhase: 'CLOSING' }));
          setCurrentPhase('CLOSING');
      } catch (e) {
          console.error("Error summarizing session:", e);
          // FIX: Use setError hook to update error state
          setError("Failed to summarize session. Please try again.");
      } finally {
          setIsSaving(false);
      }
  };

  const handleNextPhase = () => {
    if (!session) return;
    let nextPhase: WizardPhase = currentPhase;
    switch (currentPhase) {
      case 'IDENTIFY': nextPhase = 'EXPLORE'; break;
      case 'EXPLORE': nextPhase = 'DEEPEN'; break;
      case 'DEEPEN': nextPhase = 'UNBURDEN'; break;
      case 'UNBURDEN': nextPhase = 'INTEGRATE'; break;
      case 'INTEGRATE': nextPhase = 'CLOSING'; break;
      case 'CLOSING':
        if(session) handleSaveAndClose(session);
        return;
    }
    setCurrentPhase(nextPhase);
    setSession(prev => ({ ...prev!, currentPhase: nextPhase }));
    updateTranscript('bot', `Okay, let's move into the ${nextPhase} phase. What's coming up now?`, nextPhase);
  };

  const renderChat = () => (
    <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50">
      {session?.transcript.length === 0 && (
        <p className="text-slate-400 text-sm text-center mt-4">
          {insightContext ? (
            `Aura: Welcome to your IFS session, starting from your insight about "${insightContext.detectedPattern}". Let's begin.`
          ) : (
            `Aura: Welcome to your IFS session. What's alive in you today?`
          )}
        </p>
      )}
      {session?.transcript.map((msg, idx) => (
        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <p className={`inline-block px-3 py-2 rounded-lg max-w-[85%] text-sm shadow ${msg.role === 'user' ? 'bg-neutral-600 text-neutral-100 rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none'}`}>
            {msg.text}
          </p>
        </div>
      ))}
      {(connectionState === 'connecting' || isSaving) && (
        <div className="flex justify-start">
           <div className="bg-slate-700 text-slate-200 rounded-lg p-2 px-3 rounded-bl-none">
            <div className="flex items-center space-x-1">
              <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce"></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in">
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">
        <header className="p-4 border-b border-slate-700 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold font-mono tracking-tight text-cyan-300 flex items-center gap-2">
              <MerkabaIcon size={28} className="text-cyan-400"/> Internal Family Systems
            </h2>
            <p className="text-xs text-slate-400 mt-1">Phase: {currentPhase.replace('_', ' ')}</p>
          </div>
          <button onClick={() => onClose(session)} className="text-slate-500 hover:text-slate-300">
            <X size={24} />
          </button>
        </header>

        <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {renderChat()}
          
          <aside className="w-full md:w-64 bg-slate-900/60 border-t md:border-t-0 md:border-l border-slate-700 p-4 flex-shrink-0 overflow-y-auto space-y-4">
            <h3 className="font-mono text-lg text-slate-300">Session Tools</h3>
            
            {/* FIX: Use error state */}
            {error && (
              <div className="bg-red-900/30 border border-red-700 rounded-md p-2 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="space-y-2">
              {connectionState === 'idle' && (
                <button onClick={startMicrophone} disabled={isSaving} className="w-full bg-neutral-600 hover:bg-neutral-700 text-white font-medium py-2 rounded-md flex items-center justify-center gap-2 transition">
                  <Mic size={18} /> Start Voice Session
                </button>
              )}
              {connectionState === 'connecting' && (
                <button disabled className="w-full bg-slate-600 text-white font-medium py-2 rounded-md flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Connecting...
                </button>
              )}
              {connectionState === 'connected' && (
                <button onClick={stopMicrophone} className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-md flex items-center justify-center gap-2 transition">
                  <MicOff size={18} /> End Voice Session
                </button>
              )}
               {userSpeechInput && (
                  <p className="text-xs text-slate-400 italic text-center">User: "{userSpeechInput}"</p>
              )}
            </div>

            {session && currentPhase !== 'CLOSING' && (
              <>
                <button onClick={getPartInfo} disabled={isSaving || connectionState !== 'connected'} className="w-full bg-neutral-600 hover:bg-neutral-700 text-white font-medium py-2 rounded-md flex items-center justify-center gap-2 transition">
                  <Sparkles size={18} /> AI Part Info
                </button>
                <div className="bg-slate-700/50 p-3 rounded-md text-sm text-slate-300">
                    <p className="font-semibold">Part Name: <span className="text-cyan-300">{session.partName || 'N/A'}</span></p>
                    <p>Role: {session.partRole || 'N/A'}</p>
                    <p>Fears: {session.partFears || 'N/A'}</p>
                    <p>Intent: {session.partPositiveIntent || 'N/A'}</p>
                </div>
              </>
            )}

            {currentPhase === 'CLOSING' && summaryData && (
                <div className="bg-slate-700/50 p-3 rounded-md text-sm text-slate-300 space-y-2 animate-fade-in">
                    <p className="font-semibold text-cyan-300">Session Summary:</p>
                    <p>{summaryData.summary}</p>
                    <p className="font-semibold text-cyan-300 mt-3">AI Indications:</p>
                    <ul className="list-disc list-inside ml-2">
                        {summaryData.aiIndications.map((ind, idx) => <li key={idx}>{ind}</li>)}
                    </ul>
                </div>
            )}
            
            {insightContext && (
                <div className="mt-4 bg-neutral-900/30 border border-neutral-700 rounded-md p-3 text-sm text-neutral-200 space-y-2">
                    <p className="font-bold flex items-center gap-2"><Lightbulb size={16}/> Context from Insight:</p>
                    <p className="text-neutral-300">{insightContext.detectedPattern}</p>
                    <p className="text-xs text-neutral-400">From: {insightContext.mindToolType}</p>
                </div>
            )}

          </aside>
        </main>

        <footer className="p-4 border-t border-slate-700 flex justify-between items-center flex-shrink-0">
          <button onClick={() => onClose(session)} className="text-sm text-slate-400 hover:text-white transition" disabled={isSaving}>
            Save Draft & Exit
          </button>
          <div className="flex gap-3">
            {currentPhase !== 'CLOSING' && (
              <button onClick={handleNextPhase} className="btn-luminous px-4 py-2 rounded-md font-medium flex items-center gap-2 transition" disabled={isSaving || connectionState !== 'connected'}>
                Next Phase <ArrowRight size={16} />
              </button>
            )}
            {currentPhase === 'CLOSING' && !summaryData && (
                 <button onClick={summarizeSession} className="btn-luminous px-4 py-2 rounded-md font-medium flex items-center gap-2 transition" disabled={isSaving}>
                    <Sparkles size={16} /> Generate Summary
                 </button>
            )}
            {currentPhase === 'CLOSING' && summaryData && (
                <button onClick={() => session && handleSaveAndClose(session)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2 transition" disabled={isSaving}>
                    <Save size={16} /> Finish Session
                </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
};

export default IFSWizard;