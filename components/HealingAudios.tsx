import React, { useMemo } from 'react';
import AlchemicalAudioPlayer from './AlchemicalAudioPlayer';
import { healingAudios, audioCategories } from '../data/healingAudios';

export default function HealingAudios() {
  // Group audios by category
  const groupedAudios = useMemo(() => {
    const grouped = healingAudios.reduce(
      (acc, audio) => {
        if (!acc[audio.category]) {
          acc[audio.category] = [];
        }
        acc[audio.category].push(audio);
        return acc;
      },
      {} as Record<string, typeof healingAudios>
    );
    return grouped;
  }, []);

  const categoryOrder = ['nervous-system', 'grounding', 'breathing', 'hypnosis'];

  return (
    <section className="space-y-8">
      {/* Section Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-purple-600/10 blur-2xl opacity-50 rounded-lg" />
        <div className="relative">
          <h2 className="text-3xl font-semibold font-mono tracking-tight text-slate-200 mb-2 flex items-center gap-3">
            <span className="text-4xl">✨</span>
            Healing Audios & Guided Practices
          </h2>
          <p className="text-slate-400">
            A collection of transformative audio practices to support your nervous system, ground your presence, regulate your breath, and deepen your connection to yourself.
          </p>
        </div>
      </div>

      {/* Render each category */}
      {categoryOrder.map((categoryKey) => {
        const audios = groupedAudios[categoryKey];
        if (!audios || audios.length === 0) return null;

        const categoryName =
          audioCategories[categoryKey as keyof typeof audioCategories] ||
          categoryKey;

        return (
          <div key={categoryKey} className="space-y-4">
            {/* Category Header */}
            <div className="relative pl-4 border-l-2 border-purple-500/50 hover:border-purple-500 transition-colors">
              <h3 className="text-xl font-semibold text-purple-300 font-mono tracking-tight">
                {categoryName}
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {audios.length} {audios.length === 1 ? 'practice' : 'practices'}
              </p>
            </div>

            {/* Audio Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {audios.map((audio) => (
                <AlchemicalAudioPlayer
                  key={audio.id}
                  title={audio.title}
                  description={audio.description}
                  url={audio.url}
                  icon={audio.icon}
                  alchemicalSymbol="◇"
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Footer message */}
      <div className="mt-10 p-6 bg-gradient-to-r from-slate-800/50 to-purple-900/20 border border-purple-500/20 rounded-lg">
        <p className="text-slate-400 text-sm">
          💫 <span className="text-purple-300 font-semibold">Tip:</span> Find a quiet, comfortable space. Allow yourself to fully immerse in these practices. Regular engagement with these audios can deepen your somatic awareness and support your overall wellbeing.
        </p>
      </div>
    </section>
  );
}
