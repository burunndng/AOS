import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';

interface BiasFinderAudioPlayerProps {
  audioBase64: string;
  isVisible?: boolean;
  onError?: (error: string) => void;
  compact?: boolean;
}

// Decode base64 to Uint8Array
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Decode PCM audio data to AudioBuffer
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number
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

export default function BiasFinderAudioPlayer({
  audioBase64,
  isVisible = true,
  onError,
  compact = false,
}: BiasFinderAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const playbackStartTimeRef = useRef<number>(0);
  const playbackAnimationRef = useRef<number>(0);

  useEffect(() => {
    if (isVisible && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });
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
  }, [isVisible]);

  const togglePlayback = async () => {
    if (!audioBase64) {
      onError?.('No audio data available');
      return;
    }

    if (isPlaying) {
      // Pause
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
        audioSourceRef.current.disconnect();
        audioSourceRef.current = null;
      }
      cancelAnimationFrame(playbackAnimationRef.current);
      setIsPlaying(false);
      return;
    }

    try {
      const audioCtx = audioContextRef.current;
      if (!audioCtx) {
        onError?.('Audio context not available');
        return;
      }

      if (!audioBufferRef.current) {
        const audioData = decode(audioBase64);
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
      console.error('Audio playback error:', err);
      onError?.('Failed to play audio');
    }
  };

  const resetPlayback = () => {
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current.disconnect();
      audioSourceRef.current = null;
    }
    cancelAnimationFrame(playbackAnimationRef.current);
    setPlaybackTime(0);
    setIsPlaying(false);
    audioBufferRef.current = null;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!audioBase64 || !isVisible) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
        <button
          onClick={togglePlayback}
          className="p-1.5 hover:bg-purple-200 rounded-full transition"
          title={isPlaying ? 'Pause audio' : 'Play audio'}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <div className="flex-1 bg-gray-200 rounded-full h-2 relative">
          <div
            className="bg-purple-600 h-2 rounded-full transition-all"
            style={{ width: `${durationSeconds > 0 ? (playbackTime / durationSeconds) * 100 : 0}%` }}
          />
        </div>
        <span className="text-xs text-gray-600 min-w-fit">
          {formatTime(playbackTime)} / {formatTime(durationSeconds)}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        <Volume2 size={20} className="text-purple-600" />
        <h4 className="font-semibold text-gray-800">Audio Narrative</h4>
      </div>

      <div className="space-y-3">
        {/* Play Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlayback}
            className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full transition"
            title={isPlaying ? 'Pause audio' : 'Play audio'}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>

          <button
            onClick={resetPlayback}
            className="p-2 hover:bg-gray-200 text-gray-600 rounded-full transition"
            title="Reset audio"
          >
            <RotateCcw size={20} />
          </button>

          <div className="text-sm text-gray-600 font-mono">
            {formatTime(playbackTime)} / {formatTime(durationSeconds)}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-200 rounded-full h-2 relative cursor-pointer hover:h-3 transition-all">
          <div
            className="bg-gradient-to-r from-purple-600 to-blue-600 h-full rounded-full transition-all"
            style={{ width: `${durationSeconds > 0 ? (playbackTime / durationSeconds) * 100 : 0}%` }}
          />
        </div>
      </div>
    </div>
  );
}
