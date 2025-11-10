import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';

interface AlchemicalAudioPlayerProps {
  title: string;
  description: string;
  url: string;
  icon: string;
  alchemicalSymbol?: string;
}

export default function AlchemicalAudioPlayer({
  title,
  description,
  url,
  icon,
  alchemicalSymbol = '◇',
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
    <div className="group relative">
      {/* Alchemical background glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-900/20 via-blue-900/10 to-indigo-900/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Main container */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-purple-500/30 rounded-2xl p-6 backdrop-blur-sm hover:border-purple-500/60 transition-all duration-300 shadow-2xl hover:shadow-purple-900/50">
        {/* Header with icon and title */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl filter drop-shadow-lg">{icon}</span>
              <h3 className="text-xl font-semibold text-slate-100 font-mono tracking-tight">
                {title}
              </h3>
            </div>
            <p className="text-sm text-slate-400">{description}</p>
          </div>

          {/* Alchemical corner symbol */}
          <div className="text-2xl text-purple-400/40 opacity-50 group-hover:opacity-100 transition-opacity">
            {alchemicalSymbol}
          </div>
        </div>

        {/* Player Controls Section */}
        <div className="mt-6 space-y-4">
          {/* Play Button and Controls */}
          <div className="flex items-center gap-4">
            {/* Main Play/Pause Button - Circular with Alchemical Design */}
            <button
              onClick={togglePlayback}
              disabled={isLoading}
              className="relative flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 transform hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group/btn"
              title={isPlaying ? 'Pause audio' : 'Play audio'}
            >
              {/* Outer glow ring */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600/50 via-blue-600/50 to-purple-600/50 blur-md opacity-0 group-hover/btn:opacity-100 transition-opacity" />

              {/* Middle ring */}
              <div className="absolute inset-1 rounded-full border-2 border-purple-400/50 group-hover/btn:border-purple-400/100 transition-colors" />

              {/* Inner button */}
              <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 flex items-center justify-center shadow-lg transition-all">
                {isLoading ? (
                  <div className="animate-spin">
                    <Volume2 size={24} className="text-purple-100" />
                  </div>
                ) : isPlaying ? (
                  <Pause size={24} className="text-purple-100" fill="currentColor" />
                ) : (
                  <Play size={24} className="text-purple-100 ml-1" fill="currentColor" />
                )}
              </div>
            </button>

            {/* Reset Button */}
            <button
              onClick={resetPlayback}
              className="p-3 rounded-full text-slate-300 hover:text-purple-300 hover:bg-purple-900/30 transition-all duration-200 border border-slate-700/50 hover:border-purple-500/50"
              title="Reset audio"
            >
              <RotateCcw size={18} />
            </button>

            {/* Time Display */}
            <div className="flex-1">
              <div className="text-sm font-mono text-purple-300 text-right">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="relative h-1 bg-slate-700 rounded-full overflow-hidden cursor-pointer group/progress hover:h-2 transition-all duration-200">
              {/* Background progress */}
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-600 via-blue-500 to-purple-600 rounded-full transition-all duration-100"
                style={{ width: `${progressPercent}%` }}
              />

              {/* Glowing progress indicator */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full shadow-lg shadow-purple-500/50 opacity-0 group-hover/progress:opacity-100 transition-opacity"
                style={{ left: `${progressPercent}%`, transform: 'translate(-50%, -50%)' }}
              />
            </div>
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

        {/* Decorative alchemical elements */}
        <div className="absolute top-3 left-3 text-purple-500/20 text-xs opacity-30 group-hover:opacity-50 transition-opacity">
          ◇◆◇
        </div>
        <div className="absolute bottom-3 right-3 text-blue-500/20 text-xs opacity-30 group-hover:opacity-50 transition-opacity">
          ◆◇◆
        </div>
      </div>
    </div>
  );
}
