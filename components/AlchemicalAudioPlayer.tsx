import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface AlchemicalAudioPlayerProps {
  title: string;
  description: string;
  url: string;
  symbol?: string;
  goal?: string;
  mechanism?: string;
}

export default function AlchemicalAudioPlayer({
  title,
  description,
  url,
  symbol = '⟐',
  goal,
  mechanism,
}: AlchemicalAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        setIsLoading(true);
        audioRef.current.play().catch((err) => {
          console.error('Audio playback error:', err);
          setIsLoading(false);
        });
      }
    }
  };

  const resetPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setIsLoading(false);
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    setIsLoading(false);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="group relative h-full">
      {/* Main container - Dark occult aesthetic */}
      <div className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-amber-900/40 rounded-lg p-4 backdrop-blur-sm hover:border-amber-900/70 transition-all duration-500 shadow-2xl flex flex-col">
        {/* Occult divider line at top */}
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-amber-900/50 to-transparent" />

        {/* Header section */}
        <div className="mb-4 flex-shrink-0">
          <h3 className="text-base font-semibold text-amber-100 font-serif tracking-wider mb-1">
            {title}
          </h3>
          <p className="text-xs text-slate-400 font-mono tracking-widest uppercase mb-2">
            {symbol} {description}
          </p>
          {goal && (
            <p className="text-xs text-amber-200/70 font-mono tracking-wide">
              <span className="text-amber-600">Goal:</span> {goal}
            </p>
          )}
          {mechanism && (
            <p className="text-xs text-amber-200/70 font-mono tracking-wide">
              <span className="text-amber-600">Mechanism:</span> {mechanism}
            </p>
          )}
        </div>

        {/* Player Controls Section */}
        <div className="space-y-3 mt-auto flex-shrink-0">
          {/* Play Button and Controls */}
          <div className="flex items-center gap-4">
            {/* Main Play/Pause Button - Occult style */}
            <button
              onClick={togglePlayback}
              disabled={isLoading}
              className="relative flex items-center justify-center w-12 h-12 transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group/btn flex-shrink-0"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {/* Outer occult ring with minimal glow */}
              <div className="absolute inset-0 rounded-full border border-amber-900/60 group-hover/btn:border-amber-700 transition-colors duration-300" />
              <div className="absolute inset-1 rounded-full border border-amber-900/20" />

              {/* Inner button */}
              <div className="relative w-10 h-10 rounded-full bg-gradient-to-b from-amber-950 to-slate-950 flex items-center justify-center border border-amber-900/50 group-hover/btn:border-amber-700 transition-all shadow-inner">
                {isLoading ? (
                  <div className="animate-spin text-amber-700">
                    <RotateCcw size={16} />
                  </div>
                ) : isPlaying ? (
                  <Pause size={14} className="text-amber-700 fill-amber-700" />
                ) : (
                  <Play size={14} className="text-amber-700 fill-amber-700 ml-0.5" />
                )}
              </div>
            </button>

            {/* Reset Button */}
            <button
              onClick={resetPlayback}
              className="p-2 text-slate-400 hover:text-amber-700 transition-colors duration-200 border border-slate-700/50 hover:border-amber-900/50 rounded hover:bg-amber-950/30 flex-shrink-0"
              title="Reset"
            >
              <RotateCcw size={14} />
            </button>

            {/* Time Display */}
            <div className="flex-1">
              <div className="text-xs font-mono text-amber-700 text-right tracking-wider">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
          </div>

          {/* Progress Bar - Minimalist occult style */}
          <div className="relative h-0.5 bg-slate-800 rounded-full overflow-hidden cursor-pointer group/progress hover:h-1 transition-all duration-200">
            <div
              className="absolute inset-y-0 left-0 bg-amber-900 transition-all duration-100"
              style={{ width: `${progressPercent}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-amber-800 rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-lg shadow-amber-900/50"
              style={{ left: `${progressPercent}%`, transform: 'translate(-50%, -50%)' }}
            />
          </div>

          {/* Audio element */}
          <audio
            ref={audioRef}
            src={url}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={handlePlay}
            onPause={handlePause}
            onEnded={handleEnded}
            onLoadStart={() => setIsLoading(true)}
            crossOrigin="anonymous"
          />
        </div>

        {/* Occult divider line at bottom */}
        <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-amber-900/50 to-transparent" />

        {/* Subtle corner glyphs */}
        <div className="absolute top-2 right-3 text-amber-900/30 text-xs font-serif">⬥</div>
        <div className="absolute bottom-2 left-3 text-amber-900/30 text-xs font-serif">⬥</div>
      </div>
    </div>
  );
}
