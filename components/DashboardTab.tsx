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
      {/* FIX: Remove 'size' prop as width/height are controlled by Tailwind classes for full container fill. */}
      <MerkabaIcon className="absolute inset-0 w-full h-full text-slate-800/50 opacity-10" style={{ transform: 'scale(2.5)' }}/>
      <div className="relative z-10">
        <header className="mb-8 animate-fade-in">
          <h1 className={`text-5xl font-bold font-mono ${getGradientText('spirit')} tracking-tighter`}>Welcome to Aura OS</h1>
          <p className="text-slate-400 mt-2 max-w-lg">Your operating system for personal transformation. Begin your journey by exploring practices or generating a custom one.</p>
        </header>
        
        <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          {/* FIX: Use the 'size' prop for MerkabaIcon instead of Tailwind 'w-x h-y' classes for consistent sizing control. 'w-48' translates to 12rem or 192px. */}
          <MerkabaIcon size={192} className="text-accent mx-auto" />
        </div>

        <div className="mt-12 flex flex-col sm:flex-row gap-4 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <button
            onClick={openGuidedPracticeGenerator}
            className="btn-luminous font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-glow-sm hover:shadow-glow-lg transition-all duration-300 transform hover:scale-105"
          >
            <Sparkles size={20} />
            Generate a Practice
          </button>
          <button
            onClick={() => setActiveTab('browse')}
            className="card-glass bg-gradient-to-r from-slate-700/50 to-slate-800/30 hover:from-slate-600/60 hover:to-slate-700/40 text-slate-100 font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-card border border-accent/20 hover:border-accent/40" style={{backdropFilter: 'blur(8px)'}}
          >
            <Search size={20} />
            Browse Practices
          </button>
        </div>
      </div>
    </div>
  );
}