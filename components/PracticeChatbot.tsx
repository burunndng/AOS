import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, PhoneOff, Volume2, Loader } from 'lucide-react';
import { Practice } from '../types.ts';
import { AttachmentStyle } from '../data/attachmentMappings.ts';
import { getPracticePrompt } from '../data/practicePrompts.ts';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from "@google/genai";

// Audio Helper Functions (from IFSWizard)
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

interface PracticeChatbotProps {
  practice: Practice;
  attachmentStyle: AttachmentStyle;
  anxietyScore: number;
  avoidanceScore: number;
  onClose: () => void;
  onComplete: (sessionNotes: string) => void;
}

export default function PracticeChatbot({
  practice,
  attachmentStyle,
  anxietyScore,
  avoidanceScore,
  onClose,
  onComplete
}: PracticeChatbotProps) {
  const [connectionState, setConnectionState] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [transcript, setTranscript] = useState<Array<{ role: 'user' | 'bot', text: string }>>([]);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [error, setError] = useState('');

  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef(0);
  const startTimeRef = useRef<number>(Date.now());

  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');

  const promptConfig = getPracticePrompt(practice.id, attachmentStyle, anxietyScore, avoidanceScore);

  useEffect(() => {
    // Scroll to top and prevent body scroll
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.style.overflow = 'hidden';

    // Auto-start voice connection
    startMicrophone();

    // Update session duration every second
    const durationInterval = setInterval(() => {
      setSessionDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    return () => {
      document.body.style.overflow = '';
      clearInterval(durationInterval);
      cleanup();
    };
  }, []);

  const startMicrophone = async () => {
    if (connectionState === 'connected') return;
    if (!promptConfig) {
      setError('No prompt configuration found for this practice');
      setConnectionState('error');
      return;
    }

    setConnectionState('connecting');
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
            console.debug('Practice voice session opened');
            setConnectionState('connected');

            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);

            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              if (isMuted) return;

              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);

              sessionPromiseRef.current?.then((session: { sendRealtimeInput: (arg0: { media: Blob }) => any }) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
            scriptProcessorRef.current = scriptProcessor;
            mediaStreamSourceRef.current = source;
          },

          onmessage: async (message: LiveServerMessage) => {
            // Handle output transcription
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              currentOutputTranscriptionRef.current += text;
              setIsAISpeaking(true);
            }

            // Handle input transcription
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              currentInputTranscriptionRef.current += text;
            }

            // Handle model audio output
            const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64EncodedAudioString && outputAudioContextRef.current) {
              const audioCtx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioCtx.currentTime);

              try {
                const audioBuffer = await decodeAudioData(
                  decode(base64EncodedAudioString),
                  audioCtx,
                  24000,
                  1,
                );

                const source = audioCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioCtx.destination);
                source.addEventListener('ended', () => {
                  audioSourcesRef.current.delete(source);
                  if (audioSourcesRef.current.size === 0) {
                    setIsAISpeaking(false);
                  }
                });
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current = nextStartTimeRef.current + audioBuffer.duration;
                audioSourcesRef.current.add(source);
              } catch (audioErr) {
                console.error('Error decoding/playing audio:', audioErr);
              }
            }

            // Handle interruption
            if (message.serverContent?.interrupted) {
              audioSourcesRef.current.forEach(source => source.stop());
              audioSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsAISpeaking(false);
            }

            // Update transcript on turn complete
            if (message.serverContent?.turnComplete) {
              const userFullTurn = currentInputTranscriptionRef.current;
              const botFullTurn = currentOutputTranscriptionRef.current;

              setTranscript(prev => {
                const newTranscript = [...prev];
                if (userFullTurn) {
                  newTranscript.push({ role: 'user', text: userFullTurn });
                }
                if (botFullTurn) {
                  newTranscript.push({ role: 'bot', text: botFullTurn });
                }
                return newTranscript;
              });

              currentInputTranscriptionRef.current = '';
              currentOutputTranscriptionRef.current = '';
            }
          },

          onerror: (e: ErrorEvent) => {
            console.error('Practice voice session error:', e);
            setError(`Connection error: ${e.message}`);
            setConnectionState('error');
          },

          onclose: (e: CloseEvent) => {
            console.debug('Practice voice session closed', e);
            if (e.code !== 1000) {
              setError(`Session closed unexpectedly: ${e.reason || 'unknown error'}`);
              setConnectionState('error');
            } else {
              setConnectionState('idle');
            }
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: {
            parts: [{ text: promptConfig.systemPrompt }],
          },
        },
      });

      sessionPromiseRef.current = sessionPromise;

    } catch (error: any) {
      console.error('Error starting microphone:', error);
      setError(`Failed to connect: ${error.message}`);
      setConnectionState('error');
    }
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  const endSession = async () => {
    const sessionNotes = `
Practice: ${practice.name}
Attachment Style: ${attachmentStyle}
Duration: ${Math.floor(sessionDuration / 60)}m ${sessionDuration % 60}s

Transcript:
${transcript.map(t => `${t.role.toUpperCase()}: ${t.text}`).join('\n\n')}
    `.trim();

    await cleanup();
    onComplete(sessionNotes);
  };

  const cleanup = async () => {
    // Stop all audio sources
    audioSourcesRef.current.forEach(source => source.stop());
    audioSourcesRef.current.clear();

    // Disconnect audio nodes
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
    }
    if (mediaStreamSourceRef.current) {
      mediaStreamSourceRef.current.disconnect();
    }

    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }

    // Close audio contexts
    if (inputAudioContextRef.current) {
      await inputAudioContextRef.current.close();
    }
    if (outputAudioContextRef.current) {
      await outputAudioContextRef.current.close();
    }

    // Close Gemini session
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then((s: { close: () => any }) => s.close());
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-3xl w-full h-[85vh] flex flex-col my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${connectionState === 'connected' ? 'bg-green-500 animate-pulse' : connectionState === 'error' ? 'bg-red-500' : 'bg-slate-500'}`} />
            <div>
              <h2 className="text-lg font-bold text-slate-100">{practice.name}</h2>
              <p className="text-xs text-slate-400">
                {attachmentStyle.charAt(0).toUpperCase() + attachmentStyle.slice(1)} Attachment • Voice Session
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

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8">
          {connectionState === 'connecting' ? (
            <div className="text-center space-y-4">
              <Loader size={48} className="animate-spin text-accent mx-auto" />
              <p className="text-slate-300">Connecting to your voice guide...</p>
              <p className="text-xs text-slate-500">Please allow microphone access</p>
            </div>
          ) : connectionState === 'error' ? (
            <div className="text-center space-y-4">
              <p className="text-red-400">{error || 'Failed to connect'}</p>
              <button
                onClick={startMicrophone}
                className="btn-luminous px-6 py-2 rounded-lg font-semibold"
              >
                Retry
              </button>
            </div>
          ) : connectionState === 'connected' ? (
            <>
              {/* Voice Visualizer */}
              <div className="relative">
                <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${
                  isAISpeaking
                    ? 'bg-accent/20 border-4 border-accent shadow-lg shadow-accent/50 scale-110'
                    : 'bg-slate-800 border-4 border-slate-700'
                }`}>
                  <Volume2 size={48} className={isAISpeaking ? 'text-accent animate-pulse' : 'text-slate-600'} />
                </div>
                {isAISpeaking && (
                  <div className="absolute inset-0 rounded-full bg-accent/30 animate-ping" />
                )}
              </div>

              {/* Status */}
              <div className="text-center space-y-2">
                <p className="text-2xl font-bold text-slate-100">
                  {isAISpeaking ? 'Guide is speaking...' : 'Listening...'}
                </p>
                <p className="text-sm text-slate-400">
                  Session duration: {formatDuration(sessionDuration)}
                </p>
                {promptConfig && (
                  <p className="text-xs text-slate-500">
                    Recommended: {promptConfig.estimatedDuration} minutes
                  </p>
                )}
              </div>

              {/* Transcript Preview */}
              {transcript.length > 0 && (
                <div className="w-full max-h-32 overflow-y-auto bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-2">Live Transcript:</p>
                  <div className="text-xs text-slate-300 space-y-1">
                    {transcript.slice(-3).map((line, idx) => (
                      <p key={idx} className={line.role === 'user' ? 'text-blue-300' : 'text-slate-300'}>
                        <span className="font-semibold">{line.role === 'user' ? 'You' : 'Guide'}:</span> {line.text}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Controls */}
        {connectionState === 'connected' && (
          <div className="p-6 border-t border-slate-700 space-y-4">
            <div className="flex items-center justify-center gap-4">
              {/* Mute Button */}
              <button
                onClick={toggleMute}
                className={`p-4 rounded-full transition-all ${
                  isMuted
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-slate-700 hover:bg-slate-600'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </button>

              {/* End Session Button */}
              <button
                onClick={endSession}
                className="p-4 bg-green-600 hover:bg-green-700 rounded-full transition-all"
                title="Complete Session"
              >
                <PhoneOff size={24} />
              </button>
            </div>

            <p className="text-xs text-center text-slate-500">
              Click to {isMuted ? 'unmute' : 'mute'} • Hang up to complete session
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
