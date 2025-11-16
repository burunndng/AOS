import React, { useState } from 'react';
import { Sparkles, Search } from 'lucide-react';
import { ActiveTab } from '../types.ts';
import { MerkabaIcon } from './MerkabaIcon.tsx';
import VideoMinigame from './VideoMinigame.tsx';

interface DashboardTabProps {
  openGuidedPracticeGenerator: () => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export default function DashboardTab({ openGuidedPracticeGenerator, setActiveTab }: DashboardTabProps) {
  const [showVideo] = useState(true);
  const [videoMuted, setVideoMuted] = useState(true);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const unmute = () => {
    setVideoMuted(false);
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.volume = 1;
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-full text-center overflow-y-auto pb-20">
      {/* Subtle background effect - background icon */}
      <MerkabaIcon className="absolute inset-0 w-full h-full text-slate-700/30 opacity-5" style={{ transform: 'scale(2.5)' }}/>

      {/* Refined ambient glow - single, subtle layer */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-gradient-to-r from-purple-500/8 via-transparent to-cyan-500/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }}></div>
      </div>

      {/* Content container */}
      <div className="relative z-10 max-w-4xl px-6">
        {/* Header Section */}
        <header className="mb-12 animate-fade-in">
          {/* Subtle accent line above title */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-accent/50"></div>
            <span className="text-xs font-mono text-accent/70 tracking-wider uppercase">Integral Life Practice</span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-accent/50"></div>
          </div>

          {/* Main heading - refined, readable, elegant */}
          <h1 className="text-5xl md:text-6xl font-bold font-mono text-slate-100 tracking-tight mb-4 leading-tight">
            Welcome to <span className="bg-gradient-to-r from-purple-400 via-accent to-cyan-400 bg-clip-text text-transparent">Aura OS</span>
          </h1>

          {/* Subtitle with better spacing and hierarchy */}
          <p className="text-lg text-slate-400 mt-6 max-w-2xl mx-auto leading-relaxed font-light">
            Your operating system for conscious development. Choose from evidence-based practices, or generate a custom journey tailored to your goals.
          </p>
        </header>

        {/* Central icon with subtle glow */}
        <div className="animate-fade-in-up relative py-8 mb-8" style={{ animationDelay: '100ms' }}>
          {/* Subtle icon halo */}
          <div className="absolute inset-0 flex items-center justify-center -z-10">
            <div className="w-48 h-48 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '6s' }}></div>
          </div>

          {/* Icon */}
          <div className="relative">
            <MerkabaIcon size={180} className="text-accent mx-auto opacity-90" style={{
              filter: 'drop-shadow(0 0 20px rgba(34, 197, 233, 0.3))'
            }} />
          </div>
        </div>

        {/* Action buttons - refined styling */}
        <div className="mt-12 flex flex-col sm:flex-row gap-4 animate-fade-in-up justify-center" style={{ animationDelay: '200ms' }}>
          {/* Primary action button */}
          <button
            onClick={openGuidedPracticeGenerator}
            className="group relative btn-luminous font-bold py-3 px-8 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-105 overflow-hidden"
            style={{
              boxShadow: '0 0 20px rgba(168, 85, 247, 0.2), 0 0 40px rgba(34, 197, 233, 0.1)'
            }}
          >
            {/* Subtle shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            <Sparkles size={18} />
            <span>Generate Custom Practice</span>
          </button>

          {/* Secondary action button */}
          <button
            onClick={() => setActiveTab('browse')}
            className="group relative font-semibold py-3 px-8 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-105"
            style={{
              background: 'rgba(51, 65, 85, 0.4)',
              border: '1px solid rgba(34, 197, 233, 0.3)',
              boxShadow: '0 0 15px rgba(34, 197, 233, 0.1), inset 0 0 15px rgba(255, 255, 255, 0.03)'
            }}
          >
            {/* Subtle border glow on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg pointer-events-none" style={{
              background: `radial-gradient(circle at 50% 50%, rgba(34, 197, 233, 0.08), transparent)`,
              filter: 'blur(15px)'
            }}></div>
            <Search size={18} />
            <span>Browse All Practices</span>
          </button>
        </div>

        {/* Bottom text - signature */}
        <div className="mt-16 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <p className="text-xs text-slate-500 tracking-widest uppercase opacity-50 hover:opacity-70 transition-opacity cursor-default">
            Body • Mind • Spirit • Shadow
          </p>
        </div>
      </div>

      {/* Autoplay Video Section - positioned well below the Body • Mind • Spirit • Shadow */}
      {showVideo && (
        <div className="w-full mt-32 px-6 mb-20 animate-fade-in" style={{ animationDelay: '400ms' }}>
          <div className="max-w-2xl mx-auto">
            {/* Video container */}
            <div className="relative bg-black/40 border border-purple-500/30 rounded-2xl overflow-hidden backdrop-blur shadow-2xl" style={{
              boxShadow: '0 25px 50px -12px rgba(147, 51, 234, 0.5), 0 0 100px rgba(147, 51, 234, 0.3)'
            }}>
              <video
                ref={videoRef}
                autoPlay
                muted={videoMuted}
                loop
                playsInline
                controls
                className="w-full h-auto display-block"
              >
                <source src="https://files.catbox.moe/fpwjc2.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>

              {/* Unmute Button Overlay */}
              {videoMuted && (
                <button
                  onClick={unmute}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/20 transition-all duration-300 group cursor-pointer"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                    <span className="text-white font-bold text-lg drop-shadow-lg">Click to Unmute</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
