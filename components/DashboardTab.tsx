import React from 'react';
import { Sparkles, Search } from 'lucide-react';
import { ActiveTab } from '../types.ts';
import { MerkabaIcon } from './MerkabaIcon.tsx';
import { getGradientText } from '../theme.ts';

interface DashboardTabProps {
  openGuidedPracticeGenerator: () => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export default function DashboardTab({ openGuidedPracticeGenerator, setActiveTab }: DashboardTabProps) {

  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center overflow-hidden">
      {/* Multiple layered background effects for depth */}

      {/* Animated radial gradient orbs */}
      <div className="absolute inset-0">
        {/* Primary glow orb - top right */}
        <div className="absolute top-0 -right-1/3 w-full h-96 bg-gradient-to-b from-purple-500/20 via-purple-500/5 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }}></div>

        {/* Secondary glow orb - bottom left */}
        <div className="absolute bottom-0 -left-1/4 w-full h-80 bg-gradient-to-t from-cyan-500/15 via-cyan-500/5 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }}></div>

        {/* Tertiary glow - center */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-500/10 via-transparent to-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '1s' }}></div>

        {/* Fine grain texture overlay */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)]"></div>
      </div>

      {/* Background Icon */}
      <MerkabaIcon className="absolute inset-0 w-full h-full text-slate-700/40 opacity-5" style={{ transform: 'scale(2.5)' }}/>

      {/* Content container with depth effect */}
      <div className="relative z-10">
        {/* Ambient glow rectangle behind header */}
        <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{
          background: 'radial-gradient(ellipse 40% 30% at 50% 20%, rgba(168, 85, 247, 0.15), transparent)',
          filter: 'blur(60px)'
        }}></div>

        <header className="mb-8 animate-fade-in relative">
          {/* Subtle text glow effect */}
          <div className="absolute inset-0 -z-10 blur-2xl opacity-30" style={{
            background: `linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(34, 197, 233, 0.2))`,
            borderRadius: '100%',
            width: '600px',
            height: '200px',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}></div>

          <h1 className={`text-6xl md:text-7xl font-bold font-mono ${getGradientText('spirit')} tracking-tighter drop-shadow-lg`} style={{
            textShadow: '0 0 40px rgba(168, 85, 247, 0.3), 0 0 20px rgba(34, 197, 233, 0.2)'
          }}>Welcome to Aura OS</h1>

          <div className="relative mt-4 inline-block">
            {/* Glowing underline effect */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-accent to-transparent blur-sm opacity-60"></div>
            <p className="text-lg text-slate-300 mt-4 max-w-2xl mx-auto leading-relaxed font-light">
              Your operating system for personal transformation.
              <br />
              <span className="text-accent/80">Begin your journey</span> by exploring practices or generating a custom one.
            </p>
          </div>
        </header>

        {/* Central icon with enhanced glow */}
        <div className="animate-fade-in-up relative py-8" style={{ animationDelay: '200ms' }}>
          {/* Icon glow halo */}
          <div className="absolute inset-0 flex items-center justify-center -z-10">
            <div className="w-64 h-64 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }}></div>
          </div>

          {/* Icon with glow */}
          <div className="relative drop-shadow-2xl">
            <MerkabaIcon size={224} className="text-accent mx-auto filter drop-shadow-lg" style={{
              filter: 'drop-shadow(0 0 30px rgba(34, 197, 233, 0.5)) drop-shadow(0 0 60px rgba(168, 85, 247, 0.3))'
            }} />
          </div>
        </div>

        {/* Action buttons with enhanced styling */}
        <div className="mt-16 flex flex-col sm:flex-row gap-6 animate-fade-in-up justify-center" style={{ animationDelay: '400ms' }}>
          {/* Primary action button */}
          <button
            onClick={openGuidedPracticeGenerator}
            className="group relative btn-luminous font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-2 shadow-glow-sm hover:shadow-glow-lg transition-all duration-300 transform hover:scale-105 overflow-hidden"
            style={{
              boxShadow: '0 0 30px rgba(168, 85, 247, 0.3), 0 0 60px rgba(34, 197, 233, 0.1)'
            }}
          >
            {/* Animated background shine */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
            <Sparkles size={20} />
            <span>Generate a Practice</span>
          </button>

          {/* Secondary action button */}
          <button
            onClick={() => setActiveTab('browse')}
            className="group relative card-glass bg-gradient-to-br from-slate-700/40 via-slate-800/30 to-slate-900/40 hover:from-slate-600/60 hover:to-slate-700/50 text-slate-100 font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-card border border-accent/30 hover:border-accent/50 backdrop-blur-md"
            style={{
              boxShadow: '0 0 20px rgba(34, 197, 233, 0.15), inset 0 0 20px rgba(255, 255, 255, 0.05)'
            }}
          >
            {/* Animated border glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none" style={{
              background: `radial-gradient(circle at 50% 50%, rgba(34, 197, 233, 0.1), transparent)`,
              filter: 'blur(20px)'
            }}></div>
            <Search size={20} />
            <span>Browse Practices</span>
          </button>
        </div>

        {/* Bottom ambient text */}
        <div className="mt-16 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
          <p className="text-xs text-slate-500 tracking-widest uppercase opacity-60 hover:opacity-100 transition-opacity">
            ✨ Powered by Integral Consciousness ✨
          </p>
        </div>
      </div>
    </div>
  );
}