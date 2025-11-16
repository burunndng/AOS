import React from 'react';
import { Sparkles, Flame, Moon, Sun, GitCompare, Brain } from 'lucide-react';
import { SectionDivider } from './SectionDivider.tsx';
import { ActiveTab } from '../types.ts';

interface SpiritToolsTabProps {
  setActiveWizard: (wizardName: string | null, linkedInsightId?: string) => void;
  historyBigMind?: any[];
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

export default function SpiritToolsTab({ setActiveWizard, historyBigMind }: SpiritToolsTabProps) {
  return (
    <div className="space-y-6 sm:space-y-8">
      <header>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-mono text-slate-100 tracking-tighter">Spirit Tools</h1>
        <p className="text-sm sm:text-base text-slate-400 mt-2">Contemplative practices for deepening meditation, concentration, and spiritual insight.</p>
      </header>

      <SectionDivider />

      {/* Concentration & Jhana Practice Section */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 mb-1">Concentration & Absorption States</h2>
          <p className="text-sm text-slate-400">Deepen your meditation practice with structured guidance on jhana states</p>
        </div>
        <div className="bg-gradient-to-br from-neutral-900/30 to-neutral-900/30 border-2 border-neutral-500/40 rounded-lg p-6">
          <div className="flex items-center gap-4 mb-3">
            <Sparkles size={32} className="text-neutral-400" />
            <h3 className="text-2xl font-bold tracking-tight text-slate-100">Jhana/Samadhi Guide</h3>
            <span className="text-xs bg-neutral-500/20 text-neutral-300 px-2 py-1 rounded-full font-semibold">Instructional</span>
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
        <div className="bg-gradient-to-br from-neutral-900/30 to-neutral-900/30 border-2 border-neutral-500/40 rounded-lg p-6">
          <div className="flex items-center gap-4 mb-3">
            <Sparkles size={32} className="text-neutral-400" />
            <h3 className="text-2xl font-bold tracking-tight text-slate-100">Meditation Practice Finder</h3>
            <span className="text-xs bg-neutral-500/20 text-neutral-300 px-2 py-1 rounded-full font-semibold">NEW</span>
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

      {/* Consciousness Maps & Models */}
      <SectionDivider />

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 mb-1">Consciousness Maps & Models</h2>
          <p className="text-sm text-slate-400">Explore frameworks for understanding states, stages, and development</p>
        </div>
        <div className="bg-gradient-to-br from-neutral-900/30 to-neutral-900/30 border-2 border-neutral-500/40 rounded-lg p-6">
          <div className="flex items-center gap-4 mb-3">
            <GitCompare size={32} className="text-neutral-400" />
            <h3 className="text-2xl font-bold tracking-tight text-slate-100">Interactive Consciousness Graph</h3>
            <span className="text-xs bg-neutral-500/20 text-neutral-300 px-2 py-1 rounded-full font-semibold">NEW</span>
          </div>
          <p className="text-slate-300 mb-4 leading-relaxed">
            Compare Timothy Leary's 8 Circuits of Consciousness with Ken Wilber's Integral Theory in an interactive,
            visual exploration. Understand the crucial distinction between <strong>states</strong> (temporary experiences)
            and <strong>stages</strong> (developmental levels), and learn how different stages interpret the same mystical
            experiences differently.
          </p>
          <div className="bg-neutral-950/50 border border-neutral-500/30 rounded-lg p-4 mb-4">
            <p className="text-sm text-neutral-200 mb-2">
              <strong>Key Insight:</strong> You can access advanced states from any stage of development - but your stage
              determines how you interpret and integrate what you experience.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <div className="bg-slate-900/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-accent">8</div>
              <div className="text-xs text-slate-400 mt-1">Circuits</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-accent">∞</div>
              <div className="text-xs text-slate-400 mt-1">Stages</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-accent">✓</div>
              <div className="text-xs text-slate-400 mt-1">Interactive</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-accent">⚡</div>
              <div className="text-xs text-slate-400 mt-1">Deep Dive</div>
            </div>
          </div>
          <button
            onClick={() => setActiveWizard('consciousness-graph')}
            className="btn-luminous px-6 py-2 rounded-md font-semibold transition text-sm"
          >
            Explore the Graph
          </button>
        </div>
      </section>

      {/* Big Mind Process */}
      <SectionDivider />

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 mb-1">Inner Voice Work & Integration</h2>
          <p className="text-sm text-slate-400">Explore and integrate the diverse voices within your consciousness</p>
        </div>
        <div className="bg-gradient-to-br from-neutral-900/30 to-neutral-900/30 border-2 border-neutral-500/40 rounded-lg p-6">
          <div className="flex items-center gap-4 mb-3">
            <Brain size={32} className="text-neutral-400" />
            <h3 className="text-2xl font-bold tracking-tight text-slate-100">Big Mind Process</h3>
            <span className="text-xs bg-neutral-500/20 text-neutral-300 px-2 py-1 rounded-full font-semibold">NEW</span>
          </div>
          <p className="text-slate-300 mb-4 leading-relaxed">
            A transformative dialogue with your inner voices. In this guided process, you'll identify the different perspectives
            within you—the Protector, the Critic, the Vulnerable Self, and more—and help them speak freely. By shifting to the
            spacious witness perspective, you'll discover how these voices work together and integrate their wisdom for wholeness.
          </p>
          <div className="bg-neutral-950/50 border border-neutral-500/30 rounded-lg p-4 mb-4">
            <p className="text-sm text-neutral-200">
              <strong>Core Practice:</strong> Identify voices → Dialogue deeply → Witness compassionately → Integrate wisdom
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <div className="bg-slate-900/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-accent">5</div>
              <div className="text-xs text-slate-400 mt-1">Stages</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-accent">🎭</div>
              <div className="text-xs text-slate-400 mt-1">Parts Work</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-accent">↔️</div>
              <div className="text-xs text-slate-400 mt-1">Dialogue</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-accent">✨</div>
              <div className="text-xs text-slate-400 mt-1">Integration</div>
            </div>
          </div>
          <button
            onClick={() => setActiveWizard('big-mind')}
            className="btn-luminous px-6 py-2 rounded-md font-semibold transition text-sm"
          >
            Start Big Mind Process
          </button>
        </div>

        {/* Big Mind History */}
        {historyBigMind && historyBigMind.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-700/50">
            <h4 className="text-lg font-semibold text-slate-100 mb-4">Recent Sessions</h4>
            <div className="space-y-3">
              {historyBigMind.slice().reverse().slice(0, 5).map((session) => (
                <div
                  key={session.id}
                  className="bg-slate-900/30 border border-slate-700/30 rounded-lg p-4 flex justify-between items-start"
                >
                  <div className="flex-grow">
                    <div className="text-sm font-semibold text-slate-200">
                      {new Date(session.date).toLocaleDateString()} at{' '}
                      {new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {session.summary?.primaryVoices && (
                      <div className="text-xs text-slate-400 mt-1">
                        Voices: {session.summary.primaryVoices.join(', ')}
                      </div>
                    )}
                    {session.summary?.witnessPerspective && (
                      <div className="text-xs text-slate-300 mt-2 italic line-clamp-2">
                        {session.summary.witnessPerspective}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setActiveWizard('big-mind')}
                    className="text-accent hover:text-accent/80 text-sm font-medium ml-4 whitespace-nowrap"
                  >
                    Review
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Insight Practice Map Section */}
      <SectionDivider />

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 mb-1">Progress of Insight</h2>
          <p className="text-sm text-slate-400">Navigate the 16 stages of insight meditation</p>
        </div>
        <div className="bg-gradient-to-br from-neutral-900/30 to-neutral-900/30 border-2 border-neutral-500/40 rounded-lg p-6">
          <div className="flex items-center gap-4 mb-3">
            <Moon size={32} className="text-neutral-400" />
            <h3 className="text-2xl font-bold tracking-tight text-slate-100">Insight Practice Map</h3>
            <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full font-semibold">Powered by Grok</span>
          </div>
          <p className="text-slate-300 mb-4 leading-relaxed">
            A comprehensive map of the 16 ñanas (stages of insight) in vipassana meditation, from Mind and Body
            through the A&P event, Dark Night stages, and High Equanimity. Track your progress, learn about each
            stage, and ask questions with our AI chatbot powered by Grok.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <div className="bg-slate-900/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-accent">16</div>
              <div className="text-xs text-slate-400 mt-1">Stages</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-accent">✓</div>
              <div className="text-xs text-slate-400 mt-1">Track Progress</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-accent">💬</div>
              <div className="text-xs text-slate-400 mt-1">AI Chatbot</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-accent">🗺️</div>
              <div className="text-xs text-slate-400 mt-1">Reference Map</div>
            </div>
          </div>
          <p className="text-sm text-slate-400 mb-5 italic">
            Based on Mahasi Sayadaw's Progress of Insight. Includes detailed descriptions of all stages,
            key markers, practice tips, and warnings for challenging phases. Ask Grok questions about your
            experience, the Dark Night, A&P event, and more.
          </p>
          <button
            onClick={() => setActiveWizard('insight-practice-map')}
            className="btn-luminous px-6 py-2 rounded-md font-semibold transition text-sm"
          >
            Open Insight Map
          </button>
        </div>
      </section>

      {/* Coming Soon Section */}
      <SectionDivider />

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 mb-1">Coming Soon</h2>
          <p className="text-sm text-slate-400">Future spiritual tools in development</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 opacity-50">
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-6">
            <div className="flex items-center gap-4 mb-3">
              <Flame size={28} className="text-orange-400"/>
              <h3 className="text-xl font-bold text-slate-100">Energy Work Guide</h3>
            </div>
            <p className="text-slate-400 text-sm">Coming soon...</p>
          </div>
        </div>
      </section>
    </div>
  );
}
