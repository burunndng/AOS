

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

export default function StreaksTab({ practiceStack, completionHistory, findModuleKey }: StreaksTabProps) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold font-mono text-slate-100 tracking-tighter">Practice Streaks</h1>
        <p className="text-slate-400 mt-2">Consistency is key. Here's a look at your current and longest streaks for each practice.</p>
      </header>

      {practiceStack.length > 0 ? (
        <div className="space-y-3">
          {practiceStack.map(practice => {
            const streaks = calculateStreaks(completionHistory[practice.id] || []);
            const moduleInfo = modules[findModuleKey(practice.id)];
            return (
              <div key={practice.id} className={`bg-slate-800/50 border-l-4 ${moduleInfo.borderColor} rounded-r-lg p-4 flex items-center justify-between`}>
                <div>
                  <h3 className="font-medium text-slate-100">{practice.name}</h3>
                  <p className="text-sm text-slate-400">{moduleInfo.name} Practice</p>
                </div>
                <div className="flex items-center gap-6 text-center">
                  <div>
                    <p className="text-2xl font-bold text-orange-400 flex items-center gap-1">
                      <Zap size={20} /> {streaks.current}
                    </p>
                    <p className="text-xs text-slate-500">Current</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-300">{streaks.longest}</p>
                    <p className="text-xs text-slate-500">Longest</p>
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