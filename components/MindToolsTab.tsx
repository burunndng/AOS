import React, { useState } from 'react';
import { BrainCircuit, GitCompareArrows, Layers, Shuffle, TrendingUp, Sparkles, Target, Heart } from 'lucide-react'; // Removed Activity
import { SectionDivider } from './SectionDivider.tsx';
import { ActiveTab } from '../types.ts';
import { AttachmentStyle } from '../data/attachmentMappings.ts';
import AttachmentRecommendations from './AttachmentRecommendations.tsx';

interface MindToolsTabProps {
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

export default function MindToolsTab({ setActiveWizard }: MindToolsTabProps) {
  const [selectedAttachmentStyle, setSelectedAttachmentStyle] = useState<AttachmentStyle>('secure');

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold font-mono text-slate-100 tracking-tighter">Mind Tools</h1>
        <p className="text-slate-400 mt-2">Wizards to train metacognition, reveal blind spots, and accelerate your cognitive development.</p>
      </header>

      <SectionDivider />

      {/* Developmental Assessment Section */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 mb-1">Developmental Assessment</h2>
          <p className="text-sm text-slate-400">Understand your center of gravity across Kegan's stages of adult development</p>
        </div>
        <div className="bg-gradient-to-br from-amber-900/30 to-neutral-900/30 border-2 border-accent/40 rounded-lg p-6">
          <div className="flex items-center gap-4 mb-3">
            <TrendingUp size={32} className="text-accent" />
            <h3 className="text-2xl font-bold tracking-tight text-slate-100">Kegan Stage Assessment</h3>
          </div>
          <p className="text-slate-300 mb-4 leading-relaxed">
            Explore your developmental stage across the Socialized Mind, Self-Authoring Mind, and Self-Transforming Mind.
            This research-validated assessment examines your meaning-making structure across relationships, values, identity, and more.
          </p>
          <p className="text-sm text-slate-400 mb-5 italic">
            Based on Robert Kegan's constructive-developmental theory. Takes 15-20 minutes. Retake every 6-12 months to track growth.
          </p>
          <button
            onClick={() => setActiveWizard('kegan')}
            className="btn-luminous px-6 py-2 rounded-md font-semibold transition text-sm"
          >
            Start Assessment
          </button>
        </div>
      </section>

      <SectionDivider />

      {/* Attachment-Aware Practices Section */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 mb-1">Attachment-Aware Practices</h2>
          <p className="text-sm text-slate-400">Discover practices that heal your attachment patterns and support secure relationships</p>
        </div>

        <div className="space-y-4">
          {/* Style Selector */}
          <div className="flex flex-wrap gap-2">
            {(['secure', 'anxious', 'avoidant', 'fearful'] as AttachmentStyle[]).map(style => (
              <button
                key={style}
                onClick={() => setSelectedAttachmentStyle(style)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  selectedAttachmentStyle === style
                    ? 'bg-accent text-slate-900 shadow-lg'
                    : 'bg-slate-800/50 border border-slate-700 text-slate-300 hover:border-accent/50'
                }`}
              >
                {style.charAt(0).toUpperCase() + style.slice(1)}
              </button>
            ))}
          </div>

          {/* Attachment Recommendations Component */}
          <AttachmentRecommendations
            attachmentStyle={selectedAttachmentStyle}
            onPracticeClick={(practice) => {
              // Could add practice to stack here
              console.log('Would add practice:', practice.id);
            }}
          />
        </div>
      </section>

      <SectionDivider />

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 mb-1">Metacognitive Wizards</h2>
          <p className="text-sm text-slate-400">Tools for working with specific patterns and biases</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ToolCard
          icon={<BrainCircuit size={28} className="text-neutral-400"/>}
          title="Bias Detective"
          description="Uncover the unconscious cognitive biases that shape your decisions and learn to think with greater clarity."
          onStart={() => setActiveWizard('bias')}
        />
        <ToolCard
          icon={<Layers size={28} className="text-neutral-400"/>}
          title="Subject-Object Explorer"
          description="A guided process to make unconscious patterns visible, moving them from 'subject' (what runs you) to 'object' (what you can see)."
          onStart={() => setActiveWizard('so')}
        />
        <ToolCard 
          icon={<GitCompareArrows size={28} className="text-orange-400"/>}
          title="Perspective Shifter"
          description="Dissolve stuck situations and conflicts by systematically adopting 1st, 2nd, 3rd, and Witness perspectives."
          onStart={() => setActiveWizard('ps')}
        />
        <ToolCard
          icon={<Shuffle size={28} className="text-green-400"/>}
          title="Polarity Mapper"
          description="Reframe 'either/or' problems into 'both/and' polarities, developing the capacity to manage complex tensions productively."
          onStart={() => setActiveWizard('pm')}
        />
        <ToolCard
          icon={<Target size={28} className="text-orange-400"/>}
          title="Role Alignment Wizard"
          description="Align your key roles with your deeper values. Score each role, identify misalignments, and discover small shifts to increase harmony."
          onStart={() => setActiveWizard('role-alignment')}
        />
        </div>
      </section>

    </div>
  );
}