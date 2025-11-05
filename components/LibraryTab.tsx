import React from 'react';
// FIX: Use a named import for ILPKnowledgeGraph as it is not a default export.
import { ILPKnowledgeGraph } from './ILPKnowledgeGraph.tsx';

export default function LibraryTab() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold font-mono text-slate-100 tracking-tighter">Library</h1>
        <p className="text-slate-400 mt-2">A curated collection of resources to deepen your Integral Life Practice.</p>
      </header>
      
      <section>
        <h2 className="text-3xl font-semibold font-mono tracking-tight text-slate-200 mb-2">Integral Practice Map</h2>
        <p className="text-slate-400 mb-4">Explore the interconnected concepts of ILP. Click and drag to navigate, scroll to zoom, and hover over nodes for details.</p>
        <ILPKnowledgeGraph />
      </section>

      <div className="space-y-10 pt-8 border-t border-slate-800">
        
        <section>
          <h2 className="text-3xl font-semibold font-mono tracking-tight text-slate-200 mb-3">A Stranger in the Mirror</h2>
          <div className="rounded-lg overflow-hidden border border-slate-700 aspect-video bg-black">
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

        <section>
          <h2 className="text-3xl font-semibold font-mono tracking-tight text-slate-200 mb-3">Your Mind's OS</h2>
          <div className="rounded-lg overflow-hidden border border-slate-700 aspect-video bg-black">
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

        <section>
          <h2 className="text-3xl font-semibold font-mono tracking-tight text-slate-200 mb-3">Your personality is a map</h2>
          <div className="rounded-lg overflow-hidden border border-slate-700 aspect-video bg-black">
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

        <section>
          <h2 className="text-3xl font-semibold font-mono tracking-tight text-slate-200 mb-3">Building your Mental Toolkit</h2>
          <div className="rounded-lg overflow-hidden border border-slate-700 aspect-video bg-black">
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

        <section>
          <h2 className="text-3xl font-semibold font-mono tracking-tight text-slate-200 mb-3">A Map for your Mind</h2>
          <div className="rounded-lg overflow-hidden border border-slate-700 aspect-video bg-black">
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
        
        <section>
          <h2 className="text-3xl font-semibold font-mono tracking-tight text-slate-200 mb-3">Upgrading your Mind's OS</h2>
          <div className="rounded-lg overflow-hidden border border-slate-700 aspect-video bg-black">
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

        <section>
          <h2 className="text-3xl font-semibold font-mono tracking-tight text-slate-200 mb-3">Maps of Human Growth</h2>
          <div className="rounded-lg overflow-hidden border border-slate-700 aspect-video bg-black">
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

        <section>
          <h2 className="text-3xl font-semibold font-mono tracking-tight text-slate-200 mb-3">Unlocking the Emotional Brain (Ecker et al.)</h2>
          <div className="rounded-lg overflow-hidden border border-slate-700 aspect-video bg-black">
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
  );
}