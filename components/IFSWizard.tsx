

// FIX: Removed erroneous file separator from the beginning of the file content.
import React, { useState, useEffect, useRef } from 'react';
import { IFSSession, IFSPart, IFSDialogueEntry, WizardPhase, IntegratedInsight } from '../types.ts';
import { X, Mic, MicOff, Sparkles, Save, Lightbulb } from 'lucide-react';
import { getCoachResponse, extractPartInfo, summarizeIFSSession } from '../services/geminiService.ts';
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
}

export default function IFSWizard({ isOpen, onClose, onSaveSession, draft, partsLibrary, insightContext, markInsightAsAddressed }: IFSWizardProps) {
  const [session, setSession] = useState<IFSSession | null>(null);
  const [currentPhase, setCurrentPhase] = useState<WizardPhase>('IDENTIFY');
  const [connectionState, setConnectionState] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [isSaving, setIsSaving] = useState(false);
  const [summaryData, setSummaryData] = useState<{ summary: string, aiIndications: string[] } | null>(null);


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
        markInsightAsAddressed(finalSession.linkedInsightId, 'Internal Family Systems', finalSession.id);
      }
      onClose(null);
  };

  const generateSummaryAndIndications = async (sessionToSave: IFSSession) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const transcriptText = sessionToSave.transcript.map(m => `${m.role}: ${m.text}`).join('\n');
      const partInfo = await extractPartInfo(transcriptText);
      const { summary, aiIndications } = await summarizeIFSSession(transcriptText, partInfo);
      
      const finalSession: IFSSession = {
        ...sessionToSave,
        partRole: partInfo.role,
        partFears: partInfo.fears,
        partPositiveIntent: partInfo.positiveIntent,
        summary,
        aiIndications
      };

      setSummaryData({ summary, aiIndications });
      setSession(finalSession); // update session state with summary data
    } catch (error) {
      console.error("Failed to extract part info or summarize on save:", error);
      // If summary fails, just close without it.
      onSaveSession(sessionToSave);
      onClose(null);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (draft) {
        setSession(draft);
        setCurrentPhase(draft.currentPhase || 'IDENTIFY');
      } else {
        const newId = `ifs-${Date.now()}`;
        const initialPhase = 'IDENTIFY';
        const initialBotMessage: IFSDialogueEntry = {
          role: 'bot',
          text: "Welcome. I'm Aura, your guide for this session. Let's gently explore your inner world. To begin, press the microphone button and tell me what you are noticing in your body or emotions right now.",
          phase: 'IDENTIFY',
        };
        setSession({
          id: newId, date: new Date().toISOString(), partId: '', partName: '',
          transcript: [initialBotMessage], integrationNote: '', currentPhase: initialPhase,
          linkedInsightId: insightContext?.id
        });
        setCurrentPhase(initialPhase);
      }
    } else {
      stopSession();
      setSummaryData(null); // Clear summary when closing
    }
    return () => {
        stopSession();
    };
  }, [isOpen, draft, insightContext]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [session?.transcript, summaryData]);

  const stopSession = async () => {
    if (connectionState === 'idle') return;
    setConnectionState('idle');

    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then((s: any) => s.close()).catch(console.error);
      sessionPromiseRef.current = null;
    }
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    mediaStreamRef.current = null;
    
    scriptProcessorRef.current?.disconnect();
    scriptProcessorRef.current = null;

    mediaStreamSourceRef.current?.disconnect();
    mediaStreamSourceRef.current = null;

    audioSourcesRef.current.forEach(source => {
        try { source.stop(); } catch (e) { console.error("Error stopping audio source:", e) }
    });
    audioSourcesRef.current.clear();
    
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
        await inputAudioContextRef.current.close().catch(console.error);
        inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
        await outputAudioContextRef.current.close().catch(console.error);
        outputAudioContextRef.current = null;
    }
  };

  const startSession = async () => {
    if (connectionState !== 'idle') return;
    setConnectionState('connecting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      nextStartTimeRef.current = 0;
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: getDynamicSystemInstruction(insightContext),
        },
        callbacks: {
          onopen: () => {
            setConnectionState('connected');
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            mediaStreamSourceRef.current = source;
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              if (sessionPromiseRef.current) {
                sessionPromiseRef.current.then((session: any) => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              }
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },
          // FIX: Refactor onmessage to prevent stale state issues when updating session transcript and handling termination.
          onmessage: async (message: LiveServerMessage) => {
            // Handle audio output
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && outputAudioContextRef.current) {
              const outputCtx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              const audioBuffer = await decodeAudioData(decode(audioData), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputCtx.destination);
              source.addEventListener('ended', () => audioSourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              audioSourcesRef.current.add(source);
            }
            if (message.serverContent?.interrupted) {
                audioSourcesRef.current.forEach(source => source.stop());
                audioSourcesRef.current.clear();
                nextStartTimeRef.current = 0;
            }

            // Handle transcriptions
            // Use functional updates to prevent stale closures and ensure latest state is used
            setSession(prevSession => {
                if (!prevSession) return null;

                let updatedInputTranscription = currentInputTranscriptionRef.current;
                let updatedOutputTranscription = currentOutputTranscriptionRef.current;
                let newTranscriptEntries: IFSDialogueEntry[] = [];
                let nextPhase = prevSession.currentPhase;

                if (message.serverContent?.outputTranscription) {
                    updatedOutputTranscription += message.serverContent.outputTranscription.text;
                }
                if (message.serverContent?.inputTranscription) {
                    updatedInputTranscription += message.serverContent.inputTranscription.text;
                }

                if (message.serverContent?.turnComplete) {
                    const fullInput = updatedInputTranscription;
                    const fullOutput = updatedOutputTranscription;
                    updatedInputTranscription = '';
                    updatedOutputTranscription = '';

                    if (fullInput) newTranscriptEntries.push({ role: 'user', text: fullInput, phase: prevSession.currentPhase });
                    if (fullOutput) newTranscriptEntries.push({ role: 'bot', text: fullOutput, phase: nextPhase });

                    const terminationPhrase = "the session is complete";
                    if (
                        (fullInput && fullInput.toLowerCase().includes(terminationPhrase)) ||
                        (fullOutput && fullOutput.toLowerCase().includes(terminationPhrase))
                    ) {
                        stopSession(); // This will prevent further messages, but session object still needs updating
                        // The summary generation is handled outside this functional update, after the state has settled
                    }
                    
                    if (prevSession.transcript.length < 3 && fullInput) {
                        (async () => {
                            const nameExtractionPrompt = `The user is starting an IFS session. From their first statement, extract a potential name for the part they are describing. User statement: "${fullInput}". Respond with only the name. If you cannot find a clear name, invent one like "The Worrier" or "The Angry One".`;
                            const extractedName = await getCoachResponse(nameExtractionPrompt);
                            const cleanName = extractedName.replace(/["'.]/g, '').trim();
                            const existingPart = partsLibrary.find(p => p.name.toLowerCase() === cleanName.toLowerCase());
                            const newPartId = existingPart ? existingPart.id : `part-${Date.now()}`;
                            setSession(s => s ? {...s, partName: cleanName, partId: newPartId} : null);
                        })();
                    }
                }

                currentInputTranscriptionRef.current = updatedInputTranscription;
                currentOutputTranscriptionRef.current = updatedOutputTranscription;
                
                // If a turn is complete and it triggered termination, generate summary after this state update
                if (message.serverContent?.turnComplete && (updatedInputTranscription === '' && updatedOutputTranscription === '')) {
                    const latestSession = { ...prevSession, transcript: [...prevSession.transcript, ...newTranscriptEntries], currentPhase: nextPhase };
                    const terminationPhrase = "the session is complete";
                    if (
                        (newTranscriptEntries.some(entry => entry.role === 'user' && entry.text.toLowerCase().includes(terminationPhrase))) ||
                        (newTranscriptEntries.some(entry => entry.role === 'bot' && entry.text.toLowerCase().includes(terminationPhrase)))
                    ) {
                        generateSummaryAndIndications(latestSession);
                    }
                    return latestSession;
                } else {
                    return { ...prevSession, transcript: [...prevSession.transcript, ...newTranscriptEntries], currentPhase: nextPhase };
                }
            });
          },
          onerror: (e: ErrorEvent) => {
            console.error('Live session error:', e);
            setConnectionState('error');
            stopSession();
          },
          onclose: () => {
            setConnectionState('idle');
          },
        }
      });
    } catch (error) {
      console.error('Failed to start session:', error);
      setConnectionState('error');
    }
  };

  const handleClose = () => {
    stopSession();
    onClose(session);
  };

  if (!isOpen) return null;

  const getButtonState = () => {
    switch (connectionState) {
        case 'idle': return { text: "Start Session", icon: <Mic size={24}/>, action: startSession, disabled: false, className: 'bg-green-600 hover:bg-green-700' };
        case 'connecting': return { text: "Connecting...", icon: <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>, action: ()=>{}, disabled: true, className: 'bg-slate-500' };
        case 'connected': return { text: "Stop Session", icon: <MicOff size={24}/>, action: stopSession, disabled: false, className: 'bg-red-600 hover:bg-red-700 animate-pulse-glow' };
        case 'error': return { text: "Session Error", icon: <Mic size={24}/>, action: startSession, disabled: false, className: 'bg-yellow-600 hover:bg-yellow-700' };
        default: return { text: "Start Session", icon: <Mic size={24}/>, action: startSession, disabled: false, className: 'bg-green-600 hover:bg-green-700' };
    }
  }
  const buttonState = getButtonState();
  const showSummaryView = !!summaryData;

  return (
    <div className="fixed inset-0 bg-slate-950/95 z-50 flex flex-col p-4 sm:p-6 text-slate-100 animate-fade-in">
      <header className="flex items-center justify-between pb-4 border-b border-slate-700/80">
        <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-accent flex items-center gap-3"><MerkabaIcon size={24}/> IFS Voice Dialogue</h1>
        <button onClick={handleClose} className="p-2 rounded-full hover:bg-slate-800 transition"><X size={24} /></button>
      </header>

      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {insightContext && (
            <div className="bg-blue-900/30 border border-blue-700 rounded-md p-3 text-sm text-blue-200 flex items-start gap-3">
                <Lightbulb size={20} className="text-blue-400 flex-shrink-0 mt-0.5"/> 
                <div>
                    <p><strong className="font-semibold text-blue-300">Starting from an insight on your {insightContext.mindToolType} session.</strong></p>
                    <p className="mt-1">{insightContext.mindToolShortSummary}</p>
                    <p className="mt-2 text-xs"><strong className="text-blue-300">Detected Pattern to Explore:</strong> "{insightContext.detectedPattern}"</p>
                </div>
            </div>
        )}
        {session?.transcript.map((msg, idx) => (
          <div key={idx} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <p className={`inline-block px-3 py-2 rounded-lg max-w-[85%] text-sm shadow ${msg.role === 'user' ? 'bg-blue-600 text-blue-100 rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none'}`}>
              {msg.text}
            </p>
          </div>
        ))}
        {isSaving && (
             <div className="flex justify-center text-slate-400 text-sm">Summarizing your session...</div>
        )}
        {showSummaryView && (
            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 space-y-3 mt-4 animate-fade-in">
                 <h3 className="font-bold font-mono text-lg text-slate-200">Session Summary</h3>
                 <p className="text-sm text-slate-300">{summaryData.summary}</p>
                 <h4 className="font-semibold font-mono text-slate-300 pt-2 border-t border-slate-700">AI Indications</h4>
                 <ul className="list-disc list-inside text-sm text-slate-400">
                    {summaryData.aiIndications?.map((ind, i) => <li key={i}>{ind}</li>)}
                 </ul>
            </div>
        )}
      </div>
      
      <div className="border-t border-slate-700/80 p-3 flex justify-center items-center flex-col gap-4">
        {showSummaryView ? (
             <button onClick={() => handleSaveAndClose(session!)} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md font-medium transition">
                Save & Close Session
            </button>
        ) : currentPhase !== 'CLOSING' ? (
           <div className="flex flex-col items-center gap-4">
                <button 
                    onClick={buttonState.action} 
                    disabled={buttonState.disabled || isSaving}
                    className={`w-20 h-20 rounded-full flex items-center justify-center text-white transition-colors duration-300 shadow-lg ${buttonState.className} disabled:opacity-70 disabled:cursor-not-allowed`}
                >
                    {buttonState.icon}
                </button>
                {connectionState === 'connected' && !isSaving && (
                    <button 
                        onClick={() => { stopSession(); if (session) generateSummaryAndIndications(session); }}
                        className="btn-luminous text-sm px-4 py-2 rounded-md font-medium transition flex items-center gap-2"
                    >
                        <Save size={16} /> End & Summarize Session
                    </button>
                )}
                 {connectionState === 'idle' && !isSaving && session && session.transcript.length > 1 && (
                     <button onClick={handleClose} className="text-slate-400 hover:text-white text-sm font-medium transition">
                        Save Draft & Close
                    </button>
                 )}
            </div>
        ) : (
            <button onClick={() => generateSummaryAndIndications(session!)} disabled={isSaving} className="btn-luminous px-6 py-3 rounded-md font-medium transition disabled:bg-slate-600">
                {isSaving ? 'Saving...' : 'Finish & View Summary'}
            </button>
        )}
        {!showSummaryView && (
            <p className="text-sm text-slate-400 h-5">
                {isSaving ? "Summarizing your session..." : connectionState === 'connected' ? "I'm listening..." : connectionState === 'error' ? 'Please try again.' : ''}
            </p>
        )}
      </div>
    </div>
  );
}