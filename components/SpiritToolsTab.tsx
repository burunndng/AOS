import React from 'react';
import { Sparkles, Flame, Moon, Sun } from 'lucide-react';
import { SectionDivider } from './SectionDivider.tsx';
import { ActiveTab } from '../types.ts';

interface SpiritToolsTabProps {
  setActiveWizard: (wizardName: string | null, linkedInsightId?: string) => void;
}

const ToolCard = ({ icon, title, description, onStart }: { icon: React.ReactNode, title: string, description: string, onStart: () => void }) => (
    <div className="bg-slate-800/50 border border-slate-700/80 rounded-lg p-6 flex flex-col">
        <div className="flex items-center gap-4 mb-3">
            {icon}
            <h2 className="text-2xl font-bold tracking-tight text-slate-100">{title}</h2>
        </div>
        <p className="text-slate-400 mb-5 flex-grow">{description}</p>
        <button onClick={onStart} className="btn-luminous px-4 py-2 rounded-md font-medium transition text-sm self-start">
            Start New Session
        </button>
    </div>
);

export default function SpiritToolsTab({ setActiveWizard }: SpiritToolsTabProps) {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold font-mono text-slate-100 tracking-tighter">Spirit Tools</h1>
        <p className="text-slate-400 mt-2">Contemplative practices for deepening meditation, concentration, and spiritual insight.</p>
      </header>

      <SectionDivider />

      {/* Concentration & Jhana Practice Section */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 mb-1">Concentration & Absorption States</h2>
          <p className="text-sm text-slate-400">Deepen your meditation practice with structured guidance on jhana states</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-900/30 to-violet-900/30 border-2 border-indigo-500/40 rounded-lg p-6">
          <div className="flex items-center gap-4 mb-3">
            <Sparkles size={32} className="text-indigo-400" />
            <h3 className="text-2xl font-bold tracking-tight text-slate-100">Jhana/Samadhi Guide</h3>
            <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-full font-semibold">Instructional</span>
          </div>
          <p className="text-slate-300 mb-4 leading-relaxed">
            An instructional guide to understanding and working with concentration states and jhana practice.
            Learn about the eight jhanas, the five factors of absorption, nimittas (signs), and how to recognize
            and deepen these states in your meditation.
          </p>
          <p className="text-sm text-slate-400 mb-5 italic">
            Based on Theravada jhana maps. Provides detailed explanations of all 8 jhanas, access concentration,
            the five factors, and practical guidance for recognizing and stabilizing these states. Perfect for
            practitioners working with samatha/jhana practice.
          </p>
          <button
            onClick={() => setActiveWizard('jhana')}
            className="btn-luminous px-6 py-2 rounded-md font-semibold transition text-sm"
          >
            Open Jhana Guide
          </button>
        </div>
      </section>

      {/* Meditation Practice Finder */}
      <SectionDivider />

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 mb-1">Discover Your Practice</h2>
          <p className="text-sm text-slate-400">Find the meditation practice that matches your goals and personality</p>
        </div>
        <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border-2 border-purple-500/40 rounded-lg p-6">
          <div className="flex items-center gap-4 mb-3">
            <Sparkles size={32} className="text-purple-400" />
            <h3 className="text-2xl font-bold tracking-tight text-slate-100">Meditation Practice Finder</h3>
            <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full font-semibold">NEW</span>
          </div>
          <p className="text-slate-300 mb-4 leading-relaxed">
            Not sure which meditation practice is right for you? Take our comprehensive assessment to discover
            personalized recommendations from 12 major meditation traditions. From Samatha to Zen, from MBSR to
            Self-Inquiry - find your perfect match based on your goals, personality, and lifestyle.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <div className="bg-slate-900/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-accent">12</div>
              <div className="text-xs text-slate-400 mt-1">Practices</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-accent">5min</div>
              <div className="text-xs text-slate-400 mt-1">Assessment</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-accent">✓</div>
              <div className="text-xs text-slate-400 mt-1">Research-Based</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-accent">∞</div>
              <div className="text-xs text-slate-400 mt-1">Personalized</div>
            </div>
          </div>
          <button
            onClick={() => setActiveWizard('meditation')}
            className="btn-luminous px-6 py-2 rounded-md font-semibold transition text-sm"
          >
            Find Your Practice
          </button>
        </div>
      </section>

      {/* Future Spirit Tools Placeholder */}
      <SectionDivider />

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 mb-1">Coming Soon</h2>
          <p className="text-sm text-slate-400">More spiritual practice tools will be added here</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 opacity-50">
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-6">
            <div className="flex items-center gap-4 mb-3">
              <Flame size={28} className="text-orange-400"/>
              <h3 className="text-xl font-bold text-slate-100">Energy Work Guide</h3>
            </div>
            <p className="text-slate-400 text-sm">Coming soon...</p>
          </div>
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-6">
            <div className="flex items-center gap-4 mb-3">
              <Moon size={28} className="text-purple-400"/>
              <h3 className="text-xl font-bold text-slate-100">Insight Practice Map</h3>
            </div>
            <p className="text-slate-400 text-sm">Coming soon...</p>
          </div>
        </div>
      </section>
    </div>
  );
}
