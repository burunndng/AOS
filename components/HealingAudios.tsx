import React, { useMemo } from 'react';
import AlchemicalAudioPlayer from './AlchemicalAudioPlayer';
import { MerkabaIcon } from './MerkabaIcon';
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
      {/* Section Header - Dark and serious with Merkaba */}
      <div className="space-y-4 mb-8">
        <div className="flex items-center gap-4">
          <MerkabaIcon size={48} className="text-amber-900/60" />
          <h2 className="text-3xl font-semibold font-serif tracking-wide text-amber-100">
            Healing Audios & Guided Practices
          </h2>
        </div>
        <div className="w-12 h-0.5 bg-gradient-to-r from-amber-900 to-transparent" />
        <p className="text-slate-400 text-sm font-mono tracking-wide">
          A collection of transformative audio practices to support your nervous system, ground your presence, regulate your breath, and deepen your connection to yourself.
        </p>
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
            <div className="relative pl-4 border-l border-amber-900/50 hover:border-amber-900 transition-colors">
              <h3 className="text-base font-semibold text-amber-100 font-serif tracking-wider uppercase text-opacity-90">
                {categoryName}
              </h3>
              <p className="text-xs text-slate-500 mt-2 font-mono tracking-widest">
                {audios.length} {audios.length === 1 ? 'PRACTICE' : 'PRACTICES'}
              </p>
            </div>

            {/* Audio Grid */}
            <div className="grid grid-cols-1 gap-4">
              {audios.map((audio) => (
                <AlchemicalAudioPlayer
                  key={audio.id}
                  title={audio.title}
                  description={audio.description}
                  url={audio.url}
                  symbol={audio.symbol}
                  goal={audio.goal}
                  mechanism={audio.mechanism}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Footer note - Minimalist */}
      <div className="mt-12 pt-6 border-t border-amber-900/30">
        <p className="text-xs text-slate-500 font-mono tracking-wider uppercase">
          ⬥ Find a quiet, comfortable space. Allow yourself to fully immerse in these practices. Regular engagement deepens somatic awareness and supports wellbeing.
        </p>
      </div>
    </section>
  );
}
