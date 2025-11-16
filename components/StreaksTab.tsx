

import React from 'react';
import { AllPractice, ModuleKey } from '../types.ts';
// FIX: Add file extension to import path.
import { modules } from '../constants.ts';
import { Zap } from 'lucide-react';

interface StreaksTabProps {
  practiceStack: AllPractice[];
  completionHistory: Record<string, string[]>; // { practiceId: ['YYYY-MM-DD', ...] }
  findModuleKey: (practiceId: string) => ModuleKey;
}

// Utility to calculate streaks
// FIX: Corrected streak calculation logic to ensure 'current' streak is 0 if not completed today.
const calculateStreaks = (dates: string[]): { current: number, longest: number } => {
  if (!dates || dates.length === 0) return { current: 0, longest: 0 };

  const sortedDates = [...new Set(dates)].map(d => {
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    return date;
  }).sort((a, b) => b.getTime() - a.getTime());

  if (sortedDates.length === 0) return { current: 0, longest: 0 };

  let longestStreak = 0;
  let currentLongestRun = 0;
  if (sortedDates.length > 0) {
      currentLongestRun = 1; // Start counting from the most recent completion
      longestStreak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
          const diff = (sortedDates[i - 1].getTime() - sortedDates[i].getTime()) / (1000 * 3600 * 24);
          if (diff === 1) { // Consecutive day
              currentLongestRun++;
          } else if (diff > 1) { // Gap in days
              currentLongestRun = 1; // Reset longest run for potential new streak
          }
          if (currentLongestRun > longestStreak) {
              longestStreak = currentLongestRun;
          }
      }
  }


  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const mostRecentCompletion = sortedDates[0];
  
  // Check if most recent completion is today or yesterday
  if (mostRecentCompletion.getTime() === today.getTime() || mostRecentCompletion.getTime() === yesterday.getTime()) {
      let expectedDate = new Date(mostRecentCompletion);
      expectedDate.setHours(0,0,0,0);

      for (const date of sortedDates) {
          if (date.getTime() === expectedDate.getTime()) {
              currentStreak++;
              expectedDate.setDate(expectedDate.getDate() - 1);
          } else {
              break;
          }
      }
  }

  // If the last completion was not today, the current streak is 0.
  // This logic is for "current streak" meaning active as of today/yesterday.
  if (mostRecentCompletion.getTime() !== today.getTime() && mostRecentCompletion.getTime() !== yesterday.getTime()) {
      currentStreak = 0;
  }
  
  // If the current streak is just 1 and it's not today's completion, it also means no active streak.
  // Example: completed Monday, now Wednesday. Most recent is Monday, not today or yesterday.
  // The loop above would give 1. We want 0.
  if (currentStreak === 1 && mostRecentCompletion.getTime() !== today.getTime()) {
      currentStreak = 0;
  }


  return { current: currentStreak, longest: longestStreak };
};

const MilestoneBadge = ({ days }: { days: number }) => {
  let icon = '';
  let color = 'bg-slate-700 text-slate-300';
  let label = '';

  if (days >= 100) {
    icon = '🏆';
    color = 'bg-yellow-600/40 border border-yellow-500/50 text-yellow-300';
    label = 'Legendary';
  } else if (days >= 30) {
    icon = '⭐';
    color = 'bg-purple-600/40 border border-purple-500/50 text-purple-300';
    label = 'Master';
  } else if (days >= 7) {
    icon = '🔥';
    color = 'bg-orange-600/40 border border-orange-500/50 text-orange-300';
    label = 'Committed';
  }

  if (!label) return null;

  return (
    <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${color}`}>
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
};

export default function StreaksTab({ practiceStack, completionHistory, findModuleKey }: StreaksTabProps) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-4xl font-bold font-mono text-slate-100 tracking-tighter">Practice Streaks</h1>
        <p className="text-slate-400 mt-2">Consistency is key. Build streaks, unlock achievements, and celebrate your commitment.</p>
      </header>

      {practiceStack.length > 0 ? (
        <div className="space-y-4">
          {practiceStack.map(practice => {
            const streaks = calculateStreaks(completionHistory[practice.id] || []);
            const moduleInfo = modules[findModuleKey(practice.id)];

            // Visual scaling based on streak length
            const currentScale = Math.min(1.2, 1 + (streaks.current * 0.02));
            const longestScale = Math.min(1.2, 1 + (streaks.longest * 0.02));

            // Color gradient based on streak progress
            const getCurrentColor = () => {
              if (streaks.current >= 30) return 'text-yellow-300';
              if (streaks.current >= 7) return 'text-orange-400';
              if (streaks.current > 0) return 'text-green-400';
              return 'text-slate-400';
            };

            const getLongestColor = () => {
              if (streaks.longest >= 100) return 'text-yellow-300';
              if (streaks.longest >= 30) return 'text-orange-400';
              if (streaks.longest >= 7) return 'text-green-400';
              return 'text-slate-400';
            };

            return (
              <div
                key={practice.id}
                className={`relative group bg-gradient-to-r border-l-4 ${moduleInfo.borderColor} rounded-xl overflow-hidden transition-all duration-300 ${streaks.current > 0 ? 'from-orange-900/30 to-orange-900/10 hover:from-orange-900/50 hover:to-orange-900/20' : 'from-slate-800/60 to-slate-800/30 hover:from-slate-800/80 hover:to-slate-800/50'}`}
              >
                {/* Active streak glow */}
                {streaks.current > 0 && (
                  <div className="absolute inset-0 -z-10 opacity-40 group-hover:opacity-60 transition-opacity" style={{
                    background: 'radial-gradient(circle at right, rgba(249, 115, 22, 0.2), transparent)',
                    filter: 'blur(30px)'
                  }}></div>
                )}

                <div className="p-5 flex items-center justify-between relative z-10">
                  <div className="flex-grow">
                    <h3 className="font-semibold text-base text-slate-100 group-hover:text-white transition-colors">{practice.name}</h3>
                    <p className="text-sm text-slate-400 mt-1">{moduleInfo.name} Practice</p>
                  </div>

                  <div className="flex items-center gap-8 text-center">
                    {/* Current Streak */}
                    <div className="flex flex-col items-center">
                      <div style={{ transform: `scale(${currentScale})` }} className="transition-transform duration-300">
                        <p className={`text-4xl font-black flex items-center gap-2 ${getCurrentColor()}`}>
                          <Zap size={24} className={streaks.current > 0 ? 'animate-pulse' : ''} />
                          {streaks.current}
                        </p>
                      </div>
                      <p className="text-xs text-slate-400 mt-2 font-semibold">CURRENT</p>
                      {streaks.current > 0 && <p className="text-xs text-orange-400 font-bold mt-1">🔥 Active</p>}
                    </div>

                    {/* Divider */}
                    <div className="w-px h-12 bg-slate-700/50"></div>

                    {/* Longest Streak */}
                    <div className="flex flex-col items-center">
                      <div style={{ transform: `scale(${longestScale})` }} className="transition-transform duration-300">
                        <p className={`text-4xl font-black ${getLongestColor()}`}>
                          {streaks.longest}
                        </p>
                      </div>
                      <p className="text-xs text-slate-400 mt-2 font-semibold">LONGEST</p>
                      <MilestoneBadge days={streaks.longest} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-slate-700 rounded-lg">
          <h2 className="text-xl font-semibold text-slate-300">No Streaks Yet</h2>
          <p className="text-slate-500 mt-2">Add practices to your stack and complete them daily to build streaks.</p>
        </div>
      )}
    </div>
  );
}