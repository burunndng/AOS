import React, { useState, useEffect, useRef } from 'react';
import { SomaticPracticeSession, SomaticPacing, SomaticPreset, SafetyLevel, ValidationWarning, ValidationResult, SomaticPracticeType } from '../types.ts';
import { generateSomaticScript, validatePracticeContent } from '../services/somaticPracticeService.ts';
import { generateSpeechFromText } from '../services/geminiService.ts';
import { X, ArrowRight, Sparkles, Activity, Play, Pause, Download, ChevronDown, CheckCircle, AlertTriangle, Lightbulb } from 'lucide-react';
import { SOMATIC_PRESETS, PRACTICE_TYPES } from '../constants.ts';

// --- Re-using audio helpers ---
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
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
function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}
function createWavBlob(pcmData: Uint8Array, sampleRate: number, numChannels: number, bitsPerSample: number): Blob {
    const dataSize = pcmData.length;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
    view.setUint16(32, numChannels * (bitsPerSample / 8), true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);
    const pcmView = new Uint8Array(buffer, 44);
    pcmView.set(pcmData);
    return new Blob([view], { type: 'audio/wav' });
}
// --- End of audio helpers ---

type WizardStep = 'DEFINE' | 'GENERATING' | 'REVIEW';

interface SomaticGeneratorWizardProps {
  onClose: () => void;
  onSave: (session: SomaticPracticeSession) => void;
}

const FOCUS_AREAS = [
    "Whole Body", "Upper Body (shoulders, neck, arms)", "Lower Body (hips, legs, feet)",
    "Spine (back, core)", "Head & Face (jaw, eyes)", "Nervous System"
];

const PACING_OPTIONS: { value: SomaticPacing; label: string; }[] = [
    { value: 'slow', label: 'Slow & Gentle' },
    { value: 'moderate', label: 'Moderate Flow' },
    { value: 'fluid', label: 'Fluid & Continuous' },
    { value: 'dynamic', label: 'Dynamic & Energizing' },
];

const SafetyRating = ({ level }: { level?: SafetyLevel }) => {
  if (!level) return null;
  const config = {
    strong: { color: 'green', label: 'Strong Evidence', icon: CheckCircle },
    moderate: { color: 'yellow', label: 'Moderate Evidence', icon: Lightbulb },
    low: { color: 'red', label: 'Emerging / Low Evidence', icon: AlertTriangle }
  };
  
  const { color, label, icon: Icon } = config[level];
  
  return (
    <div className={`flex items-center gap-1 text-${color}-400 text-xs mt-1`}>
      <Icon size={14} />
      <span>{label}</span>
    </div>
  );
};

const PracticeTypeSelector = ({ 
    selected, 
    onSelect 
  }: { 
    selected: SomaticPracticeType; 
    onSelect: (type: SomaticPracticeType) => void;
  }) => {
    const [showInfo, setShowInfo] = useState<SomaticPracticeType | null>(null);
  
    return (
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Practice Type
          <button 
            onClick={(e) => {e.preventDefault(); setShowInfo(showInfo ? null : selected);}}
            className="ml-2 text-xs text-blue-400 hover:text-blue-300"
          >
            (What's this?)
          </button>
        </label>
        
        {showInfo && (
          <div className="mb-3 p-3 bg-slate-900/50 border border-slate-700 rounded-md text-xs text-slate-300 space-y-2 animate-fade-in">
            {PRACTICE_TYPES.find(pt => pt.name === showInfo) && (() => {
              const info = PRACTICE_TYPES.find(pt => pt.name === showInfo)!;
              return (
                <>
                  <p><strong>Description:</strong> {info.description}</p>
                  <p><strong>Primary Mechanism:</strong> {info.primaryMechanism}</p>
                  <p><strong>Best For:</strong> {info.bestFor.join(', ')}</p>
                  <p><strong>Evidence:</strong> {info.evidenceBase}</p>
                  {info.exampleTechniques && (
                    <p><strong>Techniques:</strong> {info.exampleTechniques.join(', ')}</p>
                  )}
                  {info.contraindications && info.contraindications.length > 0 && (
                      <p><strong className="text-red-300">Contraindications:</strong> {info.contraindications.join(', ')}</p>
                  )}
                </>
              );
            })()}
          </div>
        )}
  
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {PRACTICE_TYPES.map(pt => (
            <button
              key={pt.name}
              onClick={() => onSelect(pt.name)}
              className={`p-2 rounded-md text-sm font-medium transition text-left ${
                selected === pt.name 
                  ? 'bg-accent text-slate-900' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <div className="font-semibold">{pt.name}</div>
              <div className="text-xs opacity-75 mt-1">{pt.bestFor[0]}</div>
            </button>
          ))}
        </div>
      </div>
    );
  };

// Smart suggestion based on intention keywords
function suggestPracticeType(intention: string): SomaticPracticeType | null {
    const lower = intention.toLowerCase();
    
    if (/(anxiety|nervous|calm|stress|worry)/i.test(lower)) {
      if (/breath/i.test(lower)) return 'Breath-Centered';
      return 'Grounding & Stability';
    }
    
    if (/(tension|tight|stiff|sore|release)/i.test(lower)) {
      return 'Gentle Movement';
    }
    
    if (/(sleep|rest|relax|wind down)/i.test(lower)) {
      return 'Progressive Relaxation';
    }
    
    if (/(energy|awaken|vital|invigorate)/i.test(lower)) {
      return 'Dynamic Activation';
    }
    
    if (/(balance|focus|mindful|meditate|flow)/i.test(lower)) {
      return 'Mindful Flow';
    }
    
    return null; // No strong suggestion
}

export default function SomaticGeneratorWizard({ onClose, onSave }: SomaticGeneratorWizardProps) {
  const [step, setStep] = useState<WizardStep>('DEFINE');
  const [showPresets, setShowPresets] = useState(true);
  
  // Form State
  const [intention, setIntention] = useState('');
  const [practiceType, setPracticeType] = useState<SomaticPracticeType>('Gentle Movement'); // Changed from 'style'
  const [duration, setDuration] = useState(10);
  const [focusArea, setFocusArea] = useState('Whole Body');
  const [pacing, setPacing] = useState<SomaticPacing>('slow');
  const [selectedPreset, setSelectedPreset] = useState<SomaticPreset | null>(null); // To display preset info
  const [suggestedType, setSuggestedType] = useState<SomaticPracticeType | null>(null);

  // Generation & Playback State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [practice, setPractice] = useState<SomaticPracticeSession | null>(null);
  const [audioBase64, setAudioBase64] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null); // NEW for validation

  // Refs for audio
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    return () => { // Cleanup audio on unmount
      audioSourceRef.current?.stop();
      audioSourceRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (intention.length > 20) { // Only suggest after substantial input
      const newSuggestedType = suggestPracticeType(intention);
      if (newSuggestedType && newSuggestedType !== practiceType) {
        setSuggestedType(newSuggestedType);
      } else {
        setSuggestedType(null); // Clear suggestion if it matches or is null
      }
    } else {
      setSuggestedType(null); // Clear suggestion for short intentions
    }
  }, [intention, practiceType]);


  const handlePresetSelect = (preset: SomaticPreset) => {
    setIntention(preset.intention);
    setPracticeType(preset.practiceType); // Changed from setStyle
    setDuration(preset.duration);
    setFocusArea(preset.focusArea || 'Whole Body');
    setPacing(preset.pacing || 'slow');
    setSelectedPreset(preset); // Store the selected preset for info display
    setShowPresets(false);
    setSuggestedType(null); // Clear suggestion when a preset is selected
  };

  const handleGenerateScript = async () => {
    if (!intention.trim()) {
      setError('Please define your intention for the practice.');
      return;
    }
    setError('');
    setIsLoading(true);
    setStep('GENERATING');
    setValidationResult(null); // Clear previous validation results
    try {
      const scriptData = await generateSomaticScript(intention, practiceType, duration, focusArea, pacing);
      
      const fullScriptText = scriptData.script.map(s => s.instruction).join(' ');
      const validation = validatePracticeContent(fullScriptText);
      setValidationResult(validation);

      const newPractice: SomaticPracticeSession = {
        id: `somatic-${Date.now()}`,
        date: new Date().toISOString(),
        title: scriptData.title,
        intention,
        practiceType, // Changed from style
        duration,
        script: scriptData.script,
        focusArea,
        pacing,
        safetyNotes: scriptData.safety_notes, // Store AI-generated safety notes
        validationWarnings: validation.warnings, // Store validation warnings
      };
      setPractice(newPractice);
      setStep('REVIEW');
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate script.");
      setStep('DEFINE');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAudio = async () => {
    if (!practice) return;
    setIsLoading(true);
    setError('');
    try {
      const fullScriptText = practice.script.map(s => s.instruction).join('\n\n');
      const base64 = await generateSpeechFromText(fullScriptText);
      setAudioBase64(base64);
    } catch(e) {
      setError(e instanceof Error ? e.message : "Failed to generate audio.");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlayback = async () => {
    if (!audioBase64 || !audioContextRef.current) return;
    if (isPlaying && audioSourceRef.current) {
        audioSourceRef.current.stop();
        setIsPlaying(false);
        return;
    }
    const audioCtx = audioContextRef.current;
    const audioData = decode(audioBase64);
    const audioBuffer = await decodeAudioData(audioData, audioCtx, 24000, 1);
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);
    source.onended = () => setIsPlaying(false);
    source.start();
    audioSourceRef.current = source;
    setIsPlaying(true);
  };
  
  const handleDownload = () => {
    if (!audioBase64 || !practice) return;
    const audioData = decode(audioBase64);
    const blob = createWavBlob(audioData, 24000, 1, 16);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${practice.title.replace(/\s+/g, '_')}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderContent = () => {
    switch(step) {
      case 'DEFINE':
        return (
          <div className="space-y-6">
            <div className="bg-slate-900/40 border border-slate-700 p-4 rounded-md text-sm text-slate-300">
                <p className="font-semibold mb-2">What is an "Intention" for Somatic Practice?</p>
                <p>It's your desired inner state or physical outcome. Instead of just "exercise," think about what you want to **feel** or **release**. Examples: "To feel more grounded," "to release tension in my neck," "to cultivate energetic flow."</p>
            </div>

            <div>
                <button
                    onClick={() => setShowPresets(!showPresets)}
                    className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3 hover:text-slate-100"
                >
                    <ChevronDown size={16} className={`transition ${showPresets ? 'rotate-0' : '-rotate-90'}`} />
                    Intention Presets
                </button>
                {showPresets && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                        {SOMATIC_PRESETS.map((preset) => (
                            <button
                                key={preset.name}
                                onClick={() => handlePresetSelect(preset)}
                                className="p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg border border-slate-600 hover:border-accent transition text-left"
                            >
                                <p className="text-sm font-medium text-slate-200">{preset.name}</p>
                                <p className="text-xs text-slate-400 mt-1">{preset.description}</p>
                                <SafetyRating level={preset.evidenceLevel} />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {selectedPreset && (
                <div className="bg-blue-900/30 border border-blue-700 rounded-md p-4 text-sm text-blue-200 space-y-2 animate-fade-in">
                    <p className="font-bold">{selectedPreset.name} Preset Details:</p>
                    <p>{selectedPreset.description}</p>
                    {selectedPreset.evidenceLevel && <SafetyRating level={selectedPreset.evidenceLevel} />}
                    {selectedPreset.contraindications && selectedPreset.contraindications.length > 0 && (
                        <div>
                            <p className="font-semibold text-red-300 flex items-center gap-1"><AlertTriangle size={14}/> Contraindications:</p>
                            <ul className="list-disc list-inside ml-4">
                                {selectedPreset.contraindications.map((c, i) => <li key={i}>{c}</li>)}
                            </ul>
                        </div>
                    )}
                    {selectedPreset.safetyNotes && selectedPreset.safetyNotes.length > 0 && (
                        <div>
                            <p className="font-semibold text-yellow-300 flex items-center gap-1"><Lightbulb size={14}/> Specific Safety Notes:</p>
                            <ul className="list-disc list-inside ml-4">
                                {selectedPreset.safetyNotes.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                        </div>
                    )}
                    {selectedPreset.citations && selectedPreset.citations.length > 0 && (
                        <div>
                            <p className="font-semibold text-blue-300 flex items-center gap-1"><Lightbulb size={14}/> Citations:</p>
                            <ul className="list-disc list-inside ml-4 text-xs">
                                {selectedPreset.citations.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Your Specific Intention</label>
                <textarea value={intention} onChange={e => setIntention(e.target.value)} rows={3} placeholder="e.g., 'To feel more grounded and release tension in my shoulders'" className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-accent" />
            </div>

            {suggestedType && suggestedType !== practiceType && (
                <div className="bg-blue-900/30 border border-blue-700 rounded-md p-3 flex items-start gap-2 animate-fade-in">
                    <Lightbulb size={16} className="text-blue-400 mt-0.5" />
                    <div className="flex-1 text-sm text-blue-200">
                        <p>Based on your intention, <strong>{suggestedType}</strong> might work well.</p>
                        <button 
                            onClick={() => setPracticeType(suggestedType)}
                            className="mt-1 text-xs underline hover:text-blue-100"
                        >
                            Use this suggestion
                        </button>
                    </div>
                    <button onClick={() => setSuggestedType(null)} className="text-blue-400 hover:text-blue-300">
                        <X size={14} />
                    </button>
                </div>
            )}

            <div>
                <PracticeTypeSelector selected={practiceType} onSelect={setPracticeType} />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Focus Area</label>
                <select value={focusArea} onChange={e => setFocusArea(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100">
                    {FOCUS_AREAS.map(area => <option key={area} value={area}>{area}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Pacing</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {PACING_OPTIONS.map(opt => <button key={opt.value} onClick={() => setPacing(opt.value)} className={`p-2 rounded-md text-sm font-medium transition ${pacing === opt.value ? 'bg-accent text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>{opt.label}</button>)}
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Duration: {duration} minutes</label>
                <input type="range" min="5" max="30" step="5" value={duration} onChange={e => setDuration(parseInt(e.target.value, 10))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-accent" />
            </div>
          </div>
        );
      case 'GENERATING':
          return (
              <div className="text-center py-12">
                  <Activity size={48} className="mx-auto text-accent animate-pulse" />
                  <h3 className="text-lg font-semibold font-mono mt-4 text-accent">Generating Your Practice...</h3>
                  <p className="text-slate-400 text-sm mt-2">Crafting precise, spatially-aware instructions.</p>
              </div>
          );
      case 'REVIEW':
          return practice && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold font-mono text-slate-100">{practice.title}</h3>
                <div className="grid grid-cols-2 gap-3 text-sm text-slate-300">
                    <div><span className="text-slate-400">Intention:</span> {practice.intention}</div>
                    <div><span className="text-slate-400">Practice Type:</span> {practice.practiceType}</div>
                    <div><span className="text-slate-400">Duration:</span> {practice.duration} min</div>
                    <div><span className="text-slate-400">Focus Area:</span> {practice.focusArea}</div>
                    <div><span className="text-slate-400">Pacing:</span> {practice.pacing}</div>
                </div>

                {validationResult && !validationResult.isValid && (
                    <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 space-y-2 animate-fade-in">
                        <p className="font-bold text-red-300 flex items-center gap-2"><AlertTriangle size={20}/> Content Warnings Detected!</p>
                        <p className="text-sm text-red-200">Aura found some potentially unscientific or overpromising language. Please review the suggestions before proceeding or regenerating.</p>
                        <ul className="list-disc list-inside ml-4 space-y-1 text-red-100">
                            {validationResult.warnings.map((warning, i) => (
                                <li key={i} className="text-xs">
                                    <span className="font-semibold">{warning.type}:</span> {warning.issue}. <span className="italic">Suggestion: "{warning.suggestion}"</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 max-h-64 overflow-y-auto">
                    {practice.script.map((segment, i) => (
                        <p key={i} className="text-slate-300 mb-3 text-sm leading-relaxed">{segment.instruction} <span className="text-slate-500 text-xs">({segment.duration_seconds}s)</span></p>
                    ))}
                </div>

                {practice.safetyNotes && practice.safetyNotes.length > 0 && (
                    <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 text-sm text-yellow-200 space-y-1">
                        <p className="font-bold flex items-center gap-2"><Lightbulb size={16}/> General Safety Notes:</p>
                        <ul className="list-disc list-inside ml-4">
                            {practice.safetyNotes.map((note, i) => <li key={i}>{note}</li>)}
                        </ul>
                    </div>
                )}
                
                <div className="flex gap-2">
                    <button onClick={handleGenerateAudio} disabled={isLoading} className={`w-full py-2 px-4 rounded-md font-medium flex items-center justify-center gap-2 transition ${audioBase64 ? 'bg-slate-700 hover:bg-slate-600' : 'btn-luminous'}`}>{isLoading ? 'Generating Audio...' : audioBase64 ? 'Re-generate Audio' : 'Generate Guided Audio'}</button>
                    {audioBase64 && <>
                        <button onClick={togglePlayback} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md">{isPlaying ? <Pause size={20}/> : <Play size={20}/>}</button>
                        <button onClick={handleDownload} className="bg-slate-600 hover:bg-slate-700 text-white p-2 rounded-md"><Download size={20}/></button>
                    </>}
                </div>
              </div>
          );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in">
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <header className="p-4 border-b border-slate-700 flex justify-between items-center">
                <h2 className="text-2xl font-bold font-mono tracking-tight text-accent flex items-center gap-2"><Activity /> Somatic Practice Generator</h2>
                <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X size={24} /></button>
            </header>
            <main className="p-6 flex-grow overflow-y-auto">
                {error && <p className="text-red-400 bg-red-900/30 p-2 rounded-md text-sm mb-4">{error}</p>}
                {renderContent()}
            </main>
            <footer className="p-4 border-t border-slate-700 flex justify-between items-center">
                <button onClick={onClose} className="text-sm text-slate-400 hover:text-white transition">Cancel</button>
                {step === 'DEFINE' && <button onClick={handleGenerateScript} disabled={isLoading || !intention.trim()} className="btn-luminous px-4 py-2 rounded-md font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"><Sparkles size={16}/> Generate <ArrowRight size={16}/></button>}
                {step === 'REVIEW' && <button onClick={() => { if (practice) onSave(practice); onClose(); }} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium">Save Practice</button>}
            </footer>
        </div>
    </div>
  );
}