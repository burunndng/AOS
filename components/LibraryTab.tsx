import React, { lazy, Suspense } from 'react';
import HealingAudios from './HealingAudios';

const ILPKnowledgeGraph = lazy(() => import('./ILPKnowledgeGraph.tsx').then(module => ({ default: module.ILPKnowledgeGraph })));

export default function LibraryTab() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold font-mono text-slate-100 tracking-tighter">Library</h1>
        <p className="text-slate-400 mt-2">A curated collection of resources to deepen your Integral Life Practice.</p>
      </header>

      <section>
        <h2 className="text-2xl font-bold text-slate-100 mb-2 flex items-center gap-3">
          <span className="text-purple-500 text-2xl">⬢</span>
          Integral Practice Map
        </h2>
        <p className="text-slate-400 text-sm mb-4">Explore the interconnected concepts of ILP. Click and drag to navigate, scroll to zoom, and hover over nodes for details.</p>
        <Suspense fallback={<div className="flex items-center justify-center h-96"><div className="text-neutral-400">Loading knowledge graph...</div></div>}>
          <ILPKnowledgeGraph />
        </Suspense>
      </section>

      {/* Section Divider - Audio Practices */}
      <div className="relative py-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-amber-900/30"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="px-4 text-xs font-mono text-amber-700 bg-slate-950 uppercase tracking-widest flex items-center gap-2">
            <span className="text-amber-900">⬥</span>
            Audio Practices
            <span className="text-amber-900">⬥</span>
          </span>
        </div>
      </div>

      <section>
        <HealingAudios />
      </section>

      {/* Section Divider - Educational Videos */}
      <div className="relative py-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-purple-900/30"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="px-4 text-xs font-mono text-purple-700 bg-slate-950 uppercase tracking-widest flex items-center gap-2">
            <span className="text-purple-900">◆</span>
            Educational Videos
            <span className="text-purple-900">◆</span>
          </span>
        </div>
      </div>

      {/* Videos Section */}
      <div className="space-y-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-100 mb-2 flex items-center gap-3">
            <span className="text-purple-500 text-2xl">⟐</span>
            Transformative Teachings
          </h2>
          <p className="text-slate-400 text-sm">
            Deep dives into integral theory, developmental psychology, and maps of human consciousness.
          </p>
        </div>

        <div className="space-y-6">
          <section className="group">
            <h3 className="text-lg font-semibold text-slate-200 mb-3 group-hover:text-purple-300 transition-colors">A Stranger in the Mirror</h3>
            <div className="rounded-lg overflow-hidden border border-slate-700 group-hover:border-purple-700/50 aspect-video bg-black transition-colors">
              <video
                className="w-full h-full"
                src="https://files.catbox.moe/dnau72.mp4"
                title="A Stranger in the Mirror"
                controls
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </section>

          <section className="group">
            <h3 className="text-lg font-semibold text-slate-200 mb-3 group-hover:text-purple-300 transition-colors">Your Mind's OS</h3>
            <div className="rounded-lg overflow-hidden border border-slate-700 group-hover:border-purple-700/50 aspect-video bg-black transition-colors">
              <video
                className="w-full h-full"
                src="https://files.catbox.moe/t5epdn.mp4"
                title="Your Mind's OS"
                controls
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </section>

          <section className="group">
            <h3 className="text-lg font-semibold text-slate-200 mb-3 group-hover:text-purple-300 transition-colors">Your personality is a map</h3>
            <div className="rounded-lg overflow-hidden border border-slate-700 group-hover:border-purple-700/50 aspect-video bg-black transition-colors">
              <video
                className="w-full h-full"
                src="https://files.catbox.moe/7swh24.mp4"
                title="Your personality is a map"
                controls
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </section>

          <section className="group">
            <h3 className="text-lg font-semibold text-slate-200 mb-3 group-hover:text-purple-300 transition-colors">Building your Mental Toolkit</h3>
            <div className="rounded-lg overflow-hidden border border-slate-700 group-hover:border-purple-700/50 aspect-video bg-black transition-colors">
              <video
                className="w-full h-full"
                src="https://files.catbox.moe/d0ne0h.mp4"
                title="Building your Mental Toolkit"
                controls
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </section>

          <section className="group">
            <h3 className="text-lg font-semibold text-slate-200 mb-3 group-hover:text-purple-300 transition-colors">A Map for your Mind</h3>
            <div className="rounded-lg overflow-hidden border border-slate-700 group-hover:border-purple-700/50 aspect-video bg-black transition-colors">
              <video
                className="w-full h-full"
                src="https://files.catbox.moe/5lxurs.mp4"
                title="A Map for your Mind"
                controls
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </section>

          <section className="group">
            <h3 className="text-lg font-semibold text-slate-200 mb-3 group-hover:text-purple-300 transition-colors">Upgrading your Mind's OS</h3>
            <div className="rounded-lg overflow-hidden border border-slate-700 group-hover:border-purple-700/50 aspect-video bg-black transition-colors">
              <video
                className="w-full h-full"
                src="https://files.catbox.moe/0pqp1q.mp4"
                title="Upgrading your Mind's OS"
                controls
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </section>

          <section className="group">
            <h3 className="text-lg font-semibold text-slate-200 mb-3 group-hover:text-purple-300 transition-colors">Maps of Human Growth</h3>
            <div className="rounded-lg overflow-hidden border border-slate-700 group-hover:border-purple-700/50 aspect-video bg-black transition-colors">
              <video
                className="w-full h-full"
                src="https://files.catbox.moe/znb9ff.mp4"
                title="Maps of Human Growth"
                controls
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </section>

          <section className="group">
            <h3 className="text-lg font-semibold text-slate-200 mb-3 group-hover:text-purple-300 transition-colors">Unlocking the Emotional Brain (Ecker et al.)</h3>
            <div className="rounded-lg overflow-hidden border border-slate-700 group-hover:border-purple-700/50 aspect-video bg-black transition-colors">
              <video
                className="w-full h-full"
                src="https://files.catbox.moe/89dim2.mp4"
                title="Unlocking the Emotional Brain (Ecker et al.)"
                controls
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
