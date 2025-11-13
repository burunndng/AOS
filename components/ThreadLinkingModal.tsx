import React, { useState } from 'react';
import { Thread, ThreadTheme } from '../types';
import { X, Sparkles } from 'lucide-react';

interface ThreadLinkingModalProps {
  sessionSummary: string; // Brief description of the session
  suggestedThreads: Thread[];
  onLinkExisting: (threadId: string) => void;
  onCreateNew: (title: string, theme: ThreadTheme) => void;
  onSkip: () => void;
  onGetAiSuggestion: () => void;
}

export function ThreadLinkingModal({
  sessionSummary,
  suggestedThreads,
  onLinkExisting,
  onCreateNew,
  onSkip,
  onGetAiSuggestion
}: ThreadLinkingModalProps) {
  const [mode, setMode] = useState<'suggest' | 'create'>('suggest');
  const [newJourneyTitle, setNewJourneyTitle] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<ThreadTheme>('other');

  const themes: { value: ThreadTheme; label: string }[] = [
    { value: 'worthiness', label: 'Self-Worth' },
    { value: 'safety', label: 'Safety & Trust' },
    { value: 'belonging', label: 'Belonging' },
    { value: 'control', label: 'Control' },
    { value: 'shame', label: 'Shame' },
    { value: 'abandonment', label: 'Abandonment' },
    { value: 'perfectionism', label: 'Perfectionism' },
    { value: 'self-compassion', label: 'Self-Compassion' },
    { value: 'other', label: 'Other' }
  ];

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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-900">
          <h2 className="text-2xl font-bold">Link to a Journey?</h2>
          <button
            onClick={onSkip}
            className="text-slate-400 hover:text-slate-200 transition"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 mb-6">
            <p className="text-cyan-100 text-sm font-medium mb-2">This session:</p>
            <p className="text-slate-300">{sessionSummary}</p>
          </div>

          {mode === 'suggest' ? (
            <div className="space-y-6">
              {suggestedThreads.length > 0 && (
                <div>
                  <p className="text-slate-400 text-sm mb-3">
                    This might be related to:
                  </p>
                  <div className="space-y-2">
                    {suggestedThreads.map(thread => (
                      <button
                        key={thread.id}
                        onClick={() => onLinkExisting(thread.id)}
                        className="w-full text-left p-4 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 hover:border-cyan-500/50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-slate-100">{thread.title}</div>
                            <div className="text-sm text-slate-400 mt-1">
                              {thread.metrics.sessionsCount} session{thread.metrics.sessionsCount !== 1 ? 's' : ''} •{' '}
                              Last active {formatRelativeDate(thread.lastActiveAt)}
                            </div>
                          </div>
                          {thread.metrics.intensityTrend.length > 1 && (
                            <div className="text-right ml-4">
                              <div className="text-xs text-slate-500">Intensity</div>
                              <div className="text-sm font-semibold text-emerald-400">
                                {thread.metrics.intensityTrend[0]} → {thread.metrics.lastIntensity}
                              </div>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setMode('create')}
                  className="btn-luminous px-6 py-3 rounded-lg font-semibold"
                >
                  Start a New Journey
                </button>
                <button
                  onClick={onGetAiSuggestion}
                  className="px-6 py-3 rounded-lg font-semibold bg-gradient-to-r from-purple-600/80 to-blue-600/80 hover:from-purple-600 hover:to-blue-600 text-white transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/20"
                >
                  <Sparkles size={18} />
                  Get AI-Powered Next Steps
                </button>
                <button
                  onClick={onSkip}
                  className="px-6 py-3 rounded-lg font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                >
                  Keep Standalone
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Journey Name
                </label>
                <input
                  type="text"
                  value={newJourneyTitle}
                  onChange={e => setNewJourneyTitle(e.target.value)}
                  placeholder="e.g., 'Healing Perfectionism', 'Building Self-Worth'"
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Theme
                </label>
                <select
                  value={selectedTheme}
                  onChange={e => setSelectedTheme(e.target.value as ThreadTheme)}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  {themes.map(theme => (
                    <option key={theme.value} value={theme.value}>
                      {theme.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onCreateNew(newJourneyTitle.trim(), selectedTheme)}
                  disabled={!newJourneyTitle.trim()}
                  className="flex-1 btn-luminous px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Journey
                </button>
                <button
                  onClick={() => setMode('suggest')}
                  className="px-6 py-3 rounded-lg font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
