import React, { useState, useRef, useEffect } from 'react';
import * as geminiService from '../services/geminiService.ts';
import { X, Sparkles, Play, Pause, BookCheck, Download, RotateCcw, Clock, Volume2, History, ChevronDown, AlertCircle } from 'lucide-react';

interface GuidedPracticeGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onLogPractice: () => void;
}

interface GeneratedPractice {
  id: string;
  title: string;
  script: string;
  audioBase64: string;
  createdAt: string;
  duration: number;
  tone: string;
  prompt: string;
  module: string;
}

interface PracticePreset {
  name: string;
  template: string;
  icon: string;
  module: 'body' | 'mind' | 'shadow' | 'spirit';
}

// Simple base64 decode function
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Audio decoding function
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

// --- WAV File Generation Helpers ---

function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

/**
 * Creates a valid WAV file Blob from raw PCM audio data.
 * @param pcmData The raw PCM audio data (Int16).
 * @param sampleRate The sample rate of the audio.
 * @param numChannels The number of audio channels.
 * @param bitsPerSample The number of bits per sample.
 * @returns A Blob representing the WAV file.
 */
function createWavBlob(pcmData: Uint8Array, sampleRate: number, numChannels: number, bitsPerSample: number): Blob {
    const dataSize = pcmData.length;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // RIFF chunk descriptor
    writeString(view, 0, 'RIFF');
    // chunk size
    view.setUint32(4, 36 + dataSize, true);
    // WAVE format
    writeString(view, 8, 'WAVE');
    
    // fmt sub-chunk
    writeString(view, 12, 'fmt ');
    // sub-chunk 1 size (16 for PCM)
    view.setUint32(16, 16, true);
    // audio format (1 = PCM)
    view.setUint16(20, 1, true);
    // num channels
    view.setUint16(22, numChannels, true);
    // sample rate
    view.setUint32(24, sampleRate, true);
    // byte rate
    view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
    // block align
    view.setUint16(32, numChannels * (bitsPerSample / 8), true);
    // bits per sample
    view.setUint16(34, bitsPerSample, true);
    
    // data sub-chunk
    writeString(view, 36, 'data');
    // sub-chunk 2 size
    view.setUint32(40, dataSize, true);
    
    // Write PCM data
    const pcmView = new Uint8Array(buffer, 44);
    pcmView.set(pcmData);

    return new Blob([view], { type: 'audio/wav' });
}


// ILP Module-Specific Presets
const PRACTICE_PRESETS: PracticePreset[] = [
  // ===== BODY MODULE =====
  {
    module: 'body',
    name: 'Physical Resilience',
    icon: '▲',
    template: 'Create a 10-minute somatic practice for building physical resilience and body awareness. Include breath work coordinated with gentle movement cues, progressive activation of muscle groups, and integration of breath with intention. Tone: grounded and empowering.',
  },
  {
    module: 'body',
    name: 'Metabolic Reset',
    icon: '☥',
    template: 'Create a 7-minute energizing practice to activate metabolism and boost vitality. Include dynamic breathing techniques (like breath of fire or bellows breath), activation sequences, and circulation-enhancing cues. Tone: invigorating and dynamic.',
  },
  {
    module: 'body',
    name: 'Nervous System Healing',
    icon: '◯',
    template: 'Create a 12-minute vagal toning practice to activate the parasympathetic nervous system and heal nervous system dysregulation. Include humming, extended exhales, gentle sounding, and grounding body awareness. Tone: deeply calming and restorative.',
  },

  // ===== MIND MODULE =====
  {
    module: 'mind',
    name: 'Cognitive Clarity',
    icon: '◇',
    template: 'Create a 8-minute practice for sharpening cognitive function and mental clarity. Include concentration techniques, working memory activation through sequential instruction, and executive function development. Tone: clear, precise, and mentally activating.',
  },
  {
    module: 'mind',
    name: 'Perspective Taking',
    icon: '⬟',
    template: 'Create a 10-minute guided practice for developing cognitive perspective-taking ability. Walk through first-person, second-person, third-person, and witness/metacognitive perspectives on a chosen situation. Include transitions between viewpoints and synthesis. Tone: contemplative and expansive.',
  },
  {
    module: 'mind',
    name: 'Learning Integration',
    icon: '⟡',
    template: 'Create a 7-minute active recall and memory consolidation practice. Include retrieval practice techniques, spaced repetition principles, and encoding optimization methods. Designed for deepening learning and knowledge retention. Tone: educational and supportive.',
  },

  // ===== SHADOW MODULE =====
  {
    module: 'shadow',
    name: 'Inner Critic Integration',
    icon: '◆',
    template: 'Create a 12-minute guided shadow work practice to integrate the inner critic and transform its energy. Include: recognizing the inner critic\'s presence, understanding its protective purpose, dialoguing with it, discovering its positive intent, and transforming its energy toward self-advocacy. Use inquiry-based guidance. Tone: compassionate, understanding, and empowering.',
  },
  {
    module: 'shadow',
    name: 'Shadow Reclamation',
    icon: '◈',
    template: 'Create a 15-minute deep shadow integration practice for reclaiming disowned parts. Include: identifying a disowned quality or trait, examining where this came from, recognizing why it was rejected, finding its hidden gifts and wisdom, and beginning to reintegrate it as a resource. Tone: validating, curious, and liberating.',
  },
  {
    module: 'shadow',
    name: 'Reactive Pattern Release',
    icon: '▼',
    template: 'Create a 10-minute 3-2-1 guided process for working with a reactive trigger. Include: facing the triggered response (3rd person), dialoguing with what triggered you (2nd person), becoming that trigger to find its message (1st person), and integrating the insight. Tone: gentle but direct, exploratory.',
  },
  {
    module: 'shadow',
    name: 'Self-Compassion & Shame Release',
    icon: '◊',
    template: 'Create a 13-minute self-compassion practice specifically for releasing shame and internal judgment. Include: recognizing suffering and self-criticism, connecting to common humanity of struggle, applying self-kindness phrases, somatic self-soothing, and safe emotional expression. Tone: deeply warm, protective, and unconditional.',
  },

  // ===== SPIRIT MODULE =====
  {
    module: 'spirit',
    name: 'Non-Dual Awareness',
    icon: '◉',
    template: 'Create a 15-minute non-dual meditation practice pointing to awareness itself beyond subject-object duality. Include: settling into present moment, inquiring into the awareness that\'s aware, noticing the absence of separation, resting in luminous emptiness. Draw from Advaita Vedanta and non-dual traditions. Tone: spacious, profound, pointing to the ultimate.',
  },
  {
    module: 'spirit',
    name: 'Heart-Centered Loving-Kindness',
    icon: '☯',
    template: 'Create a 12-minute loving-kindness (metta) practice expanding from the heart. Include: cultivating warmth toward self, loved ones, neutral people, difficult people, and all beings. Use phrases like "May you be at peace, may you be loved, may you be free." Focus on heart activation and energetic expansion. Tone: warm, expansive, devotional.',
  },
  {
    module: 'spirit',
    name: 'Witness Consciousness',
    icon: '⊙',
    template: 'Create a 18-minute practice for resting in Witness consciousness. Include: grounding in the present moment, noticing thoughts and sensations without attachment, identifying with the awareness that observes all arising, resting as the Witness beyond all change. Tone: stillness, clarity, impartial presence.',
  },
  {
    module: 'spirit',
    name: 'Deep Meditation',
    icon: '◙',
    template: 'Create a 20-minute meditation practice moving toward silence and stillness. Include: settling through layers of mind toward quiet, releasing the sense of separation, moving beyond conceptual thinking, resting in formless awareness. Minimal instruction, maximum space. Tone: calm, minimal, using silence and space.',
  },
  {
    module: 'spirit',
    name: 'Integral Invocation',
    icon: '⬡',
    template: 'Create a 10-minute practice invoking the I-We-It dimensions of integral consciousness (First, Second, Third person perspectives simultaneously). Include: feeling into individual awareness (I), interconnection with all beings (We), and objective reality (It). Bring all dimensions into integrated presence. Tone: integrative, spacious, multidimensional.',
  },
  {
    module: 'spirit',
    name: 'Gratitude Practice',
    icon: '※',
    template: 'Create a 11-minute practice of gratitude as a path to deeper well-being. Include: appreciation of existence, gratitude for challenges as learning opportunities, opening to abundance, expressing appreciation for life. Tone: warm, appreciative, grounded.',
  },
];

const TONE_OPTIONS = [
  { value: 'calm', label: 'Calm', description: 'Peaceful and soothing' },
  { value: 'energetic', label: 'Energetic', description: 'Uplifting and motivating' },
  { value: 'contemplative', label: 'Contemplative', description: 'Deep and reflective' },
  { value: 'clinical', label: 'Clinical', description: 'Educational and precise' },
  { value: 'warm', label: 'Warm', description: 'Friendly and approachable' },
];

const DURATION_OPTIONS = [5, 10, 15, 20, 30];

const MODULE_INFO = {
  body: { name: 'Body', color: 'bg-green-900', textColor: 'text-green-200', borderColor: 'border-green-700', icon: '▲', iconColor: 'text-teal-400' },
  mind: { name: 'Mind', color: 'bg-neutral-900', textColor: 'text-neutral-200', borderColor: 'border-neutral-700', icon: '◇', iconColor: 'text-blue-400' },
  shadow: { name: 'Shadow', color: 'bg-amber-900', textColor: 'text-amber-200', borderColor: 'border-amber-700', icon: '◆', iconColor: 'text-purple-400' },
  spirit: { name: 'Spirit', color: 'bg-neutral-900', textColor: 'text-neutral-200', borderColor: 'border-neutral-700', icon: '◉', iconColor: 'text-amber-400' },
};

// Color mapping for practice preset icons by module
const getPresetIconColor = (module: 'body' | 'mind' | 'shadow' | 'spirit'): string => {
  const colors: Record<string, string> = {
    body: 'text-teal-400',
    mind: 'text-blue-400',
    shadow: 'text-purple-400',
    spirit: 'text-amber-400',
  };
  return colors[module] || 'text-slate-300';
};

export default function GuidedPracticeGenerator({ isOpen, onClose, onLogPractice }: GuidedPracticeGeneratorProps) {
  // UI State
  const [step, setStep] = useState<'create' | 'preview' | 'history'>('create');
  const [showPresets, setShowPresets] = useState(true);
  const [selectedModule, setSelectedModule] = useState<'body' | 'mind' | 'shadow' | 'spirit' | null>(null);

  // Form State
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(10);
  const [tone, setTone] = useState('calm');
  const [customDuration, setCustomDuration] = useState(false);

  // Generation State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedPractices, setGeneratedPractices] = useState<GeneratedPractice[]>([]);
  const [currentPractice, setCurrentPractice] = useState<GeneratedPractice | null>(null);

  // Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);

  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const playbackStartTimeRef = useRef<number>(0);
  const playbackAnimationRef = useRef<number>(0);

  useEffect(() => {
    if (isOpen && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    return () => {
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
        audioSourceRef.current.disconnect();
        audioSourceRef.current = null;
      }
      if (playbackAnimationRef.current) {
        cancelAnimationFrame(playbackAnimationRef.current);
      }
      setIsPlaying(false);
    };
  }, [isOpen]);

  // Load history on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('generatedPractices');
      if (saved) {
        const historyItems = JSON.parse(saved);
        // Add the empty audioBase64 property so the state shape is consistent
        const practicesWithEmptyAudio = historyItems.map((item: Omit<GeneratedPractice, 'audioBase64'>) => ({
            ...item,
            audioBase64: '', 
        }));
        setGeneratedPractices(practicesWithEmptyAudio);
      }
    } catch (err) {
      console.error('Failed to load practice history:', err);
    }
  }, []);

  // Save history when it changes, omitting the large audio data
  useEffect(() => {
    if (generatedPractices.length === 0 && !localStorage.getItem('generatedPractices')) return;
    try {
      // Create a version of the practices for storage without the large audio data.
      const practicesForStorage = generatedPractices.map(({ audioBase64, ...rest }) => rest);
      localStorage.setItem('generatedPractices', JSON.stringify(practicesForStorage.slice(0, 20)));
    } catch (err) {
      console.error('Failed to save practice history:', err);
      setError("Could not save practice history. Your browser's storage might be full.");
    }
  }, [generatedPractices]);
  
  const presetsForModule = selectedModule
    ? PRACTICE_PRESETS.filter(p => p.module === selectedModule)
    : PRACTICE_PRESETS;

  const handlePresetSelect = (preset: PracticePreset) => {
    setPrompt(preset.template);
    setShowPresets(false);
  };

  const buildPromptWithSettings = (): string => {
    const basePrompt = prompt.trim();
    if (!basePrompt) return '';

    let enhancedPrompt = basePrompt;

    if (!basePrompt.toLowerCase().includes('minute')) {
      enhancedPrompt += `\n\nDuration: ${duration} minutes`;
    }

    if (tone !== 'calm') {
      const toneDesc = TONE_OPTIONS.find(t => t.value === tone)?.description || tone;
      enhancedPrompt += `\n\nTone: ${toneDesc}`;
    }

    enhancedPrompt += '\n\nMake this a complete, ready-to-follow practice with clear instructions and smooth transitions.';

    return enhancedPrompt;
  };

  const handleGenerate = async () => {
    const enhancedPrompt = buildPromptWithSettings();
    if (!enhancedPrompt) {
      setError('Please enter a prompt or select a preset.');
      return;
    }

    setError('');
    setIsLoading(true);
    setCurrentPractice(null);
    audioBufferRef.current = null;

    try {
      const { title, script } = await geminiService.generatePracticeScript(enhancedPrompt);
      const audioBase64 = await geminiService.generateSpeechFromText(script);

      const newPractice: GeneratedPractice = {
        id: `practice-${Date.now()}`,
        title,
        script,
        audioBase64,
        createdAt: new Date().toISOString(),
        duration,
        tone,
        prompt: enhancedPrompt,
        module: selectedModule || 'mind',
      };

      setCurrentPractice(newPractice);
      setGeneratedPractices(prev => [newPractice, ...prev]);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred during generation.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    if (!currentPractice) return;
    setPrompt(currentPractice.prompt);
    setStep('create');
  };

  const togglePlayback = async () => {
    if (!currentPractice || !audioContextRef.current) return;
    const audioCtx = audioContextRef.current;
  
    if (isPlaying && audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
      setIsPlaying(false);
      cancelAnimationFrame(playbackAnimationRef.current);
      return;
    }
  
    try {
      let audioDataToPlay = currentPractice.audioBase64;
  
      // If audio data is missing, generate it on-the-fly.
      if (!audioDataToPlay) {
        setIsLoading(true);
        setError('');
        try {
          const newAudioBase64 = await geminiService.generateSpeechFromText(currentPractice.script);
          audioDataToPlay = newAudioBase64;
          const updatedPractice = { ...currentPractice, audioBase64: newAudioBase64 };
          setCurrentPractice(updatedPractice);
          setGeneratedPractices(prev => prev.map(p => p.id === updatedPractice.id ? updatedPractice : p));
        } catch (genErr) {
          setError('Failed to generate audio for this practice.');
          console.error('Audio generation error:', genErr);
          setIsLoading(false);
          return;
        } finally {
          setIsLoading(false);
        }
      }
      
      if (!audioBufferRef.current) {
        const audioData = decode(audioDataToPlay);
        audioBufferRef.current = await decodeAudioData(audioData, audioCtx, 24000, 1);
        setDurationSeconds(audioBufferRef.current.duration);
      }
  
      const source = audioCtx.createBufferSource();
      source.buffer = audioBufferRef.current;
      source.connect(audioCtx.destination);
  
      source.onended = () => {
        setIsPlaying(false);
        audioSourceRef.current = null;
        if (playbackTime >= (audioBufferRef.current?.duration || 0) - 0.1) {
            setPlaybackTime(0);
        }
        cancelAnimationFrame(playbackAnimationRef.current);
      };
  
      const offset = playbackTime % (audioBufferRef.current.duration || Infinity);
      playbackStartTimeRef.current = audioCtx.currentTime - offset;
      source.start(0, offset);
      audioSourceRef.current = source;
      setIsPlaying(true);
      
      const animate = () => {
        if (audioSourceRef.current) {
          const elapsed = audioCtx.currentTime - playbackStartTimeRef.current;
          if (elapsed <= (audioBufferRef.current?.duration || 0)) {
            setPlaybackTime(elapsed);
          }
          playbackAnimationRef.current = requestAnimationFrame(animate);
        }
      };
      animate();
  
    } catch (err) {
      setError('Failed to play audio. Please try again.');
      console.error('Audio playback error:', err);
    }
  };

  const downloadAudio = () => {
    if (!currentPractice || !currentPractice.audioBase64) {
        alert("Audio data is not available for download. Please play the track first to generate it.");
        return;
    }

    const audioData = decode(currentPractice.audioBase64);
    // The audio is 16-bit PCM, 1 channel, at 24000Hz sample rate.
    const blob = createWavBlob(audioData, 24000, 1, 16);

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentPractice.title.replace(/\s+/g, '_')}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-slate-800 border border-slate-700/80 rounded-lg shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-6 border-b border-slate-700 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold font-mono tracking-tight text-slate-50 flex items-center gap-2">
              <Sparkles size={20} className="text-neutral-400" />
              Generate Guided Practice
            </h2>
            <p className="text-slate-400 mt-1">Create ILP practices from the Integral Life Platform</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X size={24} />
          </button>
        </header>

        <div className="px-6 pt-4 border-b border-slate-700 flex gap-4">
          <button
            onClick={() => setStep('create')}
            className={`pb-3 px-2 border-b-2 font-medium transition ${ step === 'create' ? 'border-neutral-500 text-neutral-400' : 'border-transparent text-slate-400 hover:text-slate-300' }`}
          >
            Create
          </button>
          <button
            onClick={() => setStep('history')}
            className={`pb-3 px-2 border-b-2 font-medium transition flex items-center gap-2 ${ step === 'history' ? 'border-neutral-500 text-neutral-400' : 'border-transparent text-slate-400 hover:text-slate-300' }`}
          >
            <History size={16} />
            History {generatedPractices.length > 0 && `(${generatedPractices.length})`}
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-6">
          {step === 'create' && (
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-slate-300 mb-3 block">ILP Module</label>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {(['body', 'mind', 'shadow', 'spirit'] as const).map((module) => (
                    <button
                      key={module}
                      onClick={() => setSelectedModule(selectedModule === module ? null : module)}
                      className={`p-3 rounded-lg border-2 transition text-center ${ selectedModule === module ? `${MODULE_INFO[module].color} ${MODULE_INFO[module].borderColor}` : 'bg-slate-700/50 border-slate-600 hover:border-slate-500' }`}
                    >
                      <div className={`text-2xl mb-1 ${MODULE_INFO[module].iconColor}`}>{MODULE_INFO[module].icon}</div>
                      <p className={`text-xs font-medium ${ selectedModule === module ? MODULE_INFO[module].textColor : 'text-slate-300' }`}>
                        {MODULE_INFO[module].name}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <button
                  onClick={() => setShowPresets(!showPresets)}
                  className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3 hover:text-slate-100"
                >
                  <ChevronDown size={16} className={`transition ${showPresets ? 'rotate-0' : '-rotate-90'}`} />
                  {selectedModule ? `${MODULE_INFO[selectedModule].name} Presets` : 'All Presets'}
                </button>
                {showPresets && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                    {presetsForModule.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => handlePresetSelect(preset)}
                        className="p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg border border-slate-600 hover:border-neutral-500 transition text-left"
                      >
                        <div className={`text-xl mb-1 ${getPresetIconColor(preset.module)}`}>{preset.icon}</div>
                        <p className="text-sm font-medium text-slate-200">{preset.name}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="practice-prompt" className="block text-sm font-medium text-slate-300 mb-2">
                  Custom Prompt
                </label>
                <textarea
                  id="practice-prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  className="w-full text-sm bg-slate-900/50 border border-slate-700 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the practice you'd like to create..."
                  disabled={isLoading}
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={16} className="text-slate-400" />
                  <label className="text-sm font-medium text-slate-300">Duration</label>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {DURATION_OPTIONS.map((dur) => (
                    <button
                      key={dur}
                      onClick={() => { setDuration(dur); setCustomDuration(false); }}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition ${ !customDuration && duration === dur ? 'bg-neutral-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600' }`}
                    >
                      {dur}m
                    </button>
                  ))}
                  <div className="flex items-center gap-2 flex-grow justify-end">
                    <input
                      type="number" min="1" max="120"
                      value={customDuration ? duration : ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (val > 0 && val <= 120) { setDuration(val); setCustomDuration(true); }
                      }}
                      placeholder="Custom"
                      className="w-20 px-2 py-2 bg-slate-700 border border-slate-600 rounded-md text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Volume2 size={16} className="text-slate-400" />
                  <label className="text-sm font-medium text-slate-300">Tone</label>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {TONE_OPTIONS.map((option) => (
                    <button
                      key={option.value} onClick={() => setTone(option.value)}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition text-center ${ tone === option.value ? 'bg-neutral-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600' }`}
                      title={option.description}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 flex gap-3">
                  <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-300">{error}</p>
                    <p className="text-xs text-red-400 mt-1">Try rewording your prompt or select a preset.</p>
                  </div>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isLoading || !prompt.trim()}
                className="w-full btn-luminous font-medium py-3 px-4 rounded-md transition flex items-center justify-center gap-2 disabled:cursor-not-allowed"
              >
                {isLoading ? ( <> <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Generating... </> ) : ( <> <Sparkles size={16} /> Generate Practice </> )}
              </button>
            </div>
          )}

          {step === 'preview' && currentPractice && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-2xl ${MODULE_INFO[currentPractice.module as keyof typeof MODULE_INFO]?.iconColor}`}>{MODULE_INFO[currentPractice.module as keyof typeof MODULE_INFO]?.icon || '🎯'}</span>
                  <div>
                    <h3 className="text-xl font-bold text-slate-100">{currentPractice.title}</h3>
                    <p className="text-xs font-medium uppercase text-slate-400 tracking-wide">
                      {MODULE_INFO[currentPractice.module as keyof typeof MODULE_INFO]?.name || currentPractice.module}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 ml-10">
                  Duration: {currentPractice.duration}m • Tone: {currentPractice.tone} • Created: {new Date(currentPractice.createdAt).toLocaleTimeString()}
                </p>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 space-y-4">
                <div className="flex items-center gap-4">
                  <button onClick={togglePlayback} disabled={isLoading} className="bg-neutral-600 hover:bg-neutral-700 text-white p-3 rounded-full transition flex-shrink-0 disabled:bg-slate-500">
                    {isLoading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : isPlaying ? <Pause size={24} /> : <Play size={24} />}
                  </button>
                  <div className="flex-grow">
                    <p className="text-sm font-medium text-slate-200">
                      {isLoading ? 'Generating Audio...' : isPlaying ? 'Playing...' : 'Listen to Your Practice'}
                    </p>
                    <p className="text-xs text-slate-400">High-quality AI-generated audio</p>
                  </div>
                </div>

                {durationSeconds > 0 && (
                  <div className="space-y-2">
                    <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-neutral-500 h-full" style={{ width: `${(playbackTime / durationSeconds) * 100}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>{formatTime(playbackTime)}</span>
                      <span>{formatTime(durationSeconds)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                <p className="text-xs font-medium text-slate-400 mb-2">PRACTICE SCRIPT</p>
                <div className="max-h-40 overflow-y-auto"><p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{currentPractice.script}</p></div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button onClick={downloadAudio} className="bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded-md transition flex items-center justify-center gap-2"><Download size={16} /> <span className="hidden sm:inline">Download</span></button>
                <button onClick={handleRegenerate} className="bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded-md transition flex items-center justify-center gap-2"><RotateCcw size={16} /> <span className="hidden sm:inline">Regenerate</span></button>
                <button onClick={onLogPractice} className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition flex items-center justify-center gap-2"><BookCheck size={16} /> <span className="hidden sm:inline">Log</span></button>
              </div>
            </div>
          )}

          {step === 'history' && (
            <div className="space-y-3">
              {generatedPractices.length === 0 ? (
                <div className="text-center py-8">
                  <History size={32} className="text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400">No practices generated yet</p>
                </div>
              ) : (
                generatedPractices.map((practice) => (
                  <button
                    key={practice.id}
                    onClick={() => { setCurrentPractice(practice); audioBufferRef.current = null; setPlaybackTime(0); setDurationSeconds(0); setStep('preview'); }}
                    className="w-full p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg border border-slate-600 hover:border-neutral-500 transition text-left"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-grow flex items-center gap-3">
                        <span className={`text-2xl ${MODULE_INFO[practice.module as keyof typeof MODULE_INFO]?.iconColor}`}>{MODULE_INFO[practice.module as keyof typeof MODULE_INFO]?.icon || '🎯'}</span>
                        <div>
                          <p className="font-medium text-slate-100">{practice.title}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {MODULE_INFO[practice.module as keyof typeof MODULE_INFO]?.name} • {practice.duration}m • {practice.tone} • {new Date(practice.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Play size={16} className="text-slate-400 flex-shrink-0" />
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <footer className="p-4 border-t border-slate-700 flex justify-end items-center bg-slate-800/50">
          <button onClick={onClose} className="text-sm text-slate-400 hover:text-white transition">
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}