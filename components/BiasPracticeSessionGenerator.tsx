import React, { useState } from 'react';
import { X, Sparkles, Play, Pause, RotateCcw, Download, Clock, BookOpen, AlertCircle, Loader } from 'lucide-react';
import { BiasFinderParameters, BiasHypothesis } from '../types';
import { generateBiasPracticeSession, generateAudioForBiasFinder } from '../services/biasFinderService';
import BiasFinderAudioPlayer from './BiasFinderAudioPlayer';

interface BiasPracticeSessionGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  decision: string;
  parameters: BiasFinderParameters;
  identifiedBiases: BiasHypothesis[];
}

interface GeneratedPractice {
  id: string;
  title: string;
  script: string;
  audioBase64: string;
  duration: number;
  approach: string;
  biasesAddressed: string[];
  createdAt: string;
}

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function createWavBlob(pcmData: Uint8Array, sampleRate: number, numChannels: number, bitsPerSample: number): Blob {
  const dataSize = pcmData.length;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
  view.setUint16(32, numChannels * (bitsPerSample / 8), true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < dataSize; i++) {
    view.setUint8(44 + i, pcmData[i]);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

export default function BiasPracticeSessionGenerator({
  isOpen,
  onClose,
  decision,
  parameters,
  identifiedBiases,
}: BiasPracticeSessionGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedPractice, setGeneratedPractice] = useState<GeneratedPractice | null>(null);
  const [therapeuticApproach, setTherapeuticApproach] = useState<'act' | 'dbt' | 'mixed'>('mixed');
  const [showScript, setShowScript] = useState(false);

  const generatePractice = async () => {
    if (identifiedBiases.length === 0) {
      setError('No biases identified yet. Please complete the analysis first.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Generate the practice script
      const session = await generateBiasPracticeSession(
        decision,
        parameters,
        identifiedBiases,
        therapeuticApproach
      );

      // Generate audio for the script
      const audioBase64 = await generateAudioForBiasFinder(session.script);

      const practice: GeneratedPractice = {
        id: `practice-${Date.now()}`,
        title: session.title,
        script: session.script,
        audioBase64,
        duration: session.duration,
        approach: session.approach,
        biasesAddressed: session.biasesAddressed,
        createdAt: new Date().toISOString(),
      };

      setGeneratedPractice(practice);
      setError('');
    } catch (err) {
      console.error('Error generating practice session:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate practice session');
      setGeneratedPractice(null);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadAudio = () => {
    if (!generatedPractice || !generatedPractice.audioBase64) {
      setError('Audio data is not available');
      return;
    }

    try {
      const audioData = decode(generatedPractice.audioBase64);
      const blob = createWavBlob(audioData, 24000, 1, 16);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${generatedPractice.title.replace(/\s+/g, '_')}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download audio');
      console.error('Download error:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <BookOpen size={24} />
            <div>
              <h2 className="text-xl font-bold">Practice Session</h2>
              <p className="text-sm text-purple-100">Guided therapeutic exercise</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-lg transition">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Therapeutic Approach Selection */}
          {!generatedPractice && (
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                Therapeutic Approach
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['act', 'dbt', 'mixed'] as const).map((approach) => (
                  <button
                    key={approach}
                    onClick={() => setTherapeuticApproach(approach)}
                    className={`p-3 rounded-lg transition ${
                      therapeuticApproach === approach
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <div className="font-semibold capitalize">{approach}</div>
                    <div className="text-xs mt-1">
                      {approach === 'act'
                        ? 'Values & Acceptance'
                        : approach === 'dbt'
                        ? 'Mindfulness & Emotion'
                        : 'Combined approach'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="text-red-600 mt-0.5 flex-shrink-0" size={20} />
              <div>
                <p className="font-semibold text-red-900">Error</p>
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Generated Practice Display */}
          {generatedPractice ? (
            <div className="space-y-4">
              {/* Practice Info */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-bold text-lg text-gray-800 mb-3">{generatedPractice.title}</h3>

                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div>
                    <p className="text-gray-600">Duration</p>
                    <p className="font-semibold text-gray-800 flex items-center gap-1">
                      <Clock size={16} />
                      ~{generatedPractice.duration} minutes
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Approach</p>
                    <p className="font-semibold text-gray-800">{generatedPractice.approach.split('-')[0]}</p>
                  </div>
                </div>

                {generatedPractice.biasesAddressed.length > 0 && (
                  <div>
                    <p className="text-gray-600 text-sm mb-2">Addresses these biases:</p>
                    <div className="flex flex-wrap gap-2">
                      {generatedPractice.biasesAddressed.map((bias) => (
                        <span
                          key={bias}
                          className="bg-purple-200 text-purple-900 text-xs px-3 py-1 rounded-full"
                        >
                          {bias}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Audio Player */}
              {generatedPractice.audioBase64 && (
                <BiasFinderAudioPlayer
                  audioBase64={generatedPractice.audioBase64}
                  isVisible={true}
                  onError={setError}
                />
              )}

              {/* Script Preview */}
              <div className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => setShowScript(!showScript)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <span className="font-semibold text-gray-800">Script Preview</span>
                  <span className="text-gray-500">{showScript ? '−' : '+'}</span>
                </button>
                {showScript && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50 max-h-60 overflow-y-auto">
                    <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                      {generatedPractice.script}
                    </p>
                  </div>
                )}
              </div>

              {/* Download Button */}
              <button
                onClick={downloadAudio}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
              >
                <Download size={20} />
                Download Practice Audio
              </button>

              {/* Generate New Button */}
              <button
                onClick={() => {
                  setGeneratedPractice(null);
                  setShowScript(false);
                }}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition"
              >
                Generate Different Version
              </button>
            </div>
          ) : (
            <button
              onClick={generatePractice}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  Generating practice session...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Generate Personalized Practice Session
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
