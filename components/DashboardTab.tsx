import React from 'react';
import { Sparkles, Search, GitBranch, TrendingUp, Calendar } from 'lucide-react';
import { ActiveTab, Thread } from '../types.ts';
import { MerkabaIcon } from './MerkabaIcon.tsx';
import { getGradientText } from '../theme.ts';

interface DashboardTabProps {
  openGuidedPracticeGenerator: () => void;
  setActiveTab: (tab: ActiveTab) => void;
  threads?: Thread[];
}

export default function DashboardTab({ openGuidedPracticeGenerator, setActiveTab, threads = [] }: DashboardTabProps) {

  // Get active threads sorted by last active
  const activeThreads = threads
    .filter(t => t.status === 'active')
    .sort((a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime())
    .slice(0, 3); // Show top 3

  const formatRelativeDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-full text-center overflow-hidden p-6">
      {/* FIX: Remove 'size' prop as width/height are controlled by Tailwind classes for full container fill. */}
      <MerkabaIcon className="absolute inset-0 w-full h-full text-slate-800/50 opacity-10" style={{ transform: 'scale(2.5)' }}/>

      <div className="relative z-10 w-full max-w-4xl">
        {/* Active Journeys Section - if any exist */}
        {activeThreads.length > 0 && (
          <div className="mb-12 animate-fade-in">
            <div className="flex items-center justify-center gap-2 mb-4">
              <GitBranch size={20} className="text-cyan-400" />
              <h2 className="text-xl font-semibold text-slate-200">Active Journeys</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {activeThreads.map(thread => (
                <button
                  key={thread.id}
                  onClick={() => setActiveTab('journal')}
                  className="card-glass bg-gradient-to-br from-slate-800/70 to-slate-900/50 border border-slate-700/50 hover:border-cyan-500/50 rounded-xl p-4 text-left transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-medium">
                      {thread.theme}
                    </span>
                    <span className="text-xs text-slate-500">{thread.metrics.sessionsCount} session{thread.metrics.sessionsCount !== 1 ? 's' : ''}</span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-100 mb-2 line-clamp-2">
                    {thread.title}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Calendar size={12} />
                    <span>Last active {formatRelativeDate(thread.lastActiveAt)}</span>
                  </div>
                  {thread.metrics.lastIntensity !== undefined && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                      <TrendingUp size={12} />
                      <span>Intensity: <span className="text-cyan-400 font-medium">{thread.metrics.lastIntensity}/10</span></span>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => setActiveTab('journal')}
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              View all journeys →
            </button>
          </div>
        )}

        {/* Main Welcome Section */}
        <header className="mb-8 animate-fade-in">
          <h1 className={`text-5xl font-bold font-mono ${getGradientText('spirit')} tracking-tighter`}>Welcome to Aura OS</h1>
          <p className="text-slate-400 mt-2 max-w-lg mx-auto">Your operating system for personal transformation. Begin your journey by exploring practices or generating a custom one.</p>
        </header>

        <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          {/* FIX: Use the 'size' prop for MerkabaIcon instead of Tailwind 'w-x h-y' classes for consistent sizing control. 'w-48' translates to 12rem or 192px. */}
          <MerkabaIcon size={192} className="text-accent mx-auto" />
        </div>

        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '400ms' }}>
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