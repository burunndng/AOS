import React, { useState } from 'react';
import { BrainCircuit, GitCompareArrows, Layers, Shuffle, TrendingUp, Sparkles, Target, Heart } from 'lucide-react'; // Removed Activity
import { SectionDivider } from './SectionDivider.tsx';
import { ActiveTab, AttachmentAssessmentSession, Practice } from '../types.ts';
import { AttachmentStyle } from '../data/attachmentMappings.ts';
import AttachmentRecommendations from './AttachmentRecommendations.tsx';
import AttachmentAssessmentWizard from './AttachmentAssessmentWizard.tsx';

interface MindToolsTabProps {
  setActiveWizard: (wizardName: string | null, linkedInsightId?: string) => void;
  attachmentAssessment?: AttachmentAssessmentSession;
  onCompleteAttachmentAssessment?: (session: AttachmentAssessmentSession) => void;
  addToStack?: (practice: Practice) => void;
  practiceStack?: any[];
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

export default function MindToolsTab({
  setActiveWizard,
  attachmentAssessment,
  onCompleteAttachmentAssessment,
  addToStack,
  practiceStack = []
}: MindToolsTabProps) {
  const [showAttachmentWizard, setShowAttachmentWizard] = useState(false);
  const [selectedAttachmentStyle, setSelectedAttachmentStyle] = useState<AttachmentStyle>(attachmentAssessment?.style || 'secure');

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

        {!attachmentAssessment ? (
          /* Assessment CTA */
          <div className="bg-gradient-to-br from-pink-900/30 to-rose-900/30 border-2 border-pink-700/40 rounded-lg p-6 text-center space-y-4">
            <h3 className="text-xl font-bold text-slate-100">Take the Attachment Assessment</h3>
            <p className="text-slate-300 max-w-md mx-auto">
              Understand your attachment style in relationships and discover personalized practices to support healing and secure connection.
            </p>
            <button
              onClick={() => setShowAttachmentWizard(true)}
              className="btn-luminous px-6 py-2 rounded-md font-semibold transition text-sm"
            >
              Start Assessment (5 min)
            </button>
          </div>
        ) : (
          /* Results and Recommendations */
          <div className="space-y-4">
            {/* Assessment Result Card */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Your Attachment Style</p>
                  <p className="text-lg font-bold text-slate-100 mt-1">
                    {attachmentAssessment.style === 'secure' && '🌱 Secure Attachment'}
                    {attachmentAssessment.style === 'anxious' && '🌊 Anxious-Preoccupied'}
                    {attachmentAssessment.style === 'avoidant' && '🏔️ Dismissive-Avoidant'}
                    {attachmentAssessment.style === 'fearful' && '⛈️ Fearful-Avoidant'}
                  </p>
                </div>
                <button
                  onClick={() => setShowAttachmentWizard(true)}
                  className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1 border border-slate-700 rounded hover:border-slate-600 transition"
                >
                  Retake
                </button>
              </div>
            </div>

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
              anxietyScore={attachmentAssessment?.scores.anxiety || 3.5}
              avoidanceScore={attachmentAssessment?.scores.avoidance || 3.5}
              practiceStack={practiceStack}
              onPracticeClick={(practice) => {
                addToStack?.(practice);
              }}
            />
          </div>
        )}
      </section>

      {/* Attachment Assessment Wizard Modal */}
      {showAttachmentWizard && (
        <AttachmentAssessmentWizard
          onClose={() => setShowAttachmentWizard(false)}
          onComplete={(session) => {
            onCompleteAttachmentAssessment?.(session);
            setSelectedAttachmentStyle(session.style);
            setShowAttachmentWizard(false);
          }}
        />
      )}

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