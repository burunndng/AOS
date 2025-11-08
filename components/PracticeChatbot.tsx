import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Phone, PhoneOff, Volume2, Loader } from 'lucide-react';
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

export default function PracticeChatbot({
  practice,
  attachmentStyle,
  anxietyScore,
  avoidanceScore,
  onClose,
  onComplete
}: PracticeChatbotProps) {
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [sessionDuration, setSessionDuration] = useState(0);

  const liveSessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const promptConfig = getPracticePrompt(practice.id, attachmentStyle, anxietyScore, avoidanceScore);

  useEffect(() => {
    // Scroll to top and prevent body scroll
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.style.overflow = 'hidden';

    // Initialize voice session
    initializeVoiceSession();

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

  const initializeVoiceSession = async () => {
    if (!promptConfig) {
      console.error('No prompt config found for practice:', practice.id);
      setIsConnecting(false);
      return;
    }

    try {
      setIsConnecting(true);

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      mediaStreamRef.current = stream;

      // Initialize Gemini Live API
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

      // Connect to Gemini Live with audio
      liveSessionRef.current = await ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          systemInstruction: promptConfig.systemPrompt,
          temperature: 0.8,
          responseModalities: ['AUDIO'],
        }
      });

      // Set up audio context
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });

      // Handle incoming audio from Gemini
      liveSessionRef.current.on('audio', async (audioData: ArrayBuffer) => {
        setIsAISpeaking(true);
        await playAudio(audioData);
        setIsAISpeaking(false);
      });

      // Handle transcript updates (for accessibility)
      liveSessionRef.current.on('transcript', (text: string) => {
        setTranscript(prev => [...prev, text]);
      });

      // Start streaming microphone audio to Gemini
      await startAudioStreaming(stream);

      // Send initial greeting (Gemini will speak it)
      await liveSessionRef.current.send({ text: promptConfig.openingMessage });

      setIsConnected(true);
      setIsConnecting(false);
    } catch (error) {
      console.error('Error initializing voice session:', error);
      setIsConnecting(false);
      alert('Failed to connect to voice session. Please check microphone permissions.');
    }
  };

  const startAudioStreaming = async (stream: MediaStream) => {
    if (!audioContextRef.current || !liveSessionRef.current) return;

    const audioContext = audioContextRef.current;
    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);

    source.connect(processor);
    processor.connect(audioContext.destination);

    processor.onaudioprocess = async (e) => {
      if (isMuted || !liveSessionRef.current) return;

      const inputData = e.inputBuffer.getChannelData(0);

      // Convert Float32Array to Int16Array (PCM16)
      const pcm16 = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        const s = Math.max(-1, Math.min(1, inputData[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }

      // Send audio chunk to Gemini Live
      await liveSessionRef.current.sendAudio(pcm16.buffer);
    };
  };

  const playAudio = async (audioData: ArrayBuffer) => {
    if (!audioContextRef.current) return;

    const audioContext = audioContextRef.current;
    const audioBuffer = await audioContext.decodeAudioData(audioData);
    const source = audioContext.createBufferSource();

    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();

    return new Promise<void>((resolve) => {
      source.onended = () => resolve();
    });
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMuted; // Toggle
      });
    }
  };

  const endSession = async () => {
    const sessionNotes = `
Practice: ${practice.name}
Attachment Style: ${attachmentStyle}
Duration: ${Math.floor(sessionDuration / 60)}m ${sessionDuration % 60}s

Transcript:
${transcript.join('\n')}
    `.trim();

    await cleanup();
    onComplete(sessionNotes);
  };

  const cleanup = async () => {
    // Stop all audio tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }

    // Close audio context
    if (audioContextRef.current) {
      await audioContextRef.current.close();
    }

    // Disconnect from Gemini Live
    if (liveSessionRef.current) {
      await liveSessionRef.current.disconnect();
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
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`} />
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
          {isConnecting ? (
            <div className="text-center space-y-4">
              <Loader size={48} className="animate-spin text-accent mx-auto" />
              <p className="text-slate-300">Connecting to your voice guide...</p>
              <p className="text-xs text-slate-500">Please allow microphone access</p>
            </div>
          ) : isConnected ? (
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

              {/* Transcript Preview (optional) */}
              {transcript.length > 0 && (
                <div className="w-full max-h-32 overflow-y-auto bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-2">Live Transcript:</p>
                  <div className="text-xs text-slate-300 space-y-1">
                    {transcript.slice(-3).map((line, idx) => (
                      <p key={idx}>{line}</p>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-red-400">Failed to connect</p>
              <button
                onClick={initializeVoiceSession}
                className="btn-luminous px-6 py-2 rounded-lg font-semibold"
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {/* Controls */}
        {isConnected && (
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
