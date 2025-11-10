
// FIX: Add file content for components/ShadowToolsTab.tsx
import React from 'react';
import { ThreeTwoOneSession, IFSSession, IFSPart, MemoryReconsolidationDraft, MemoryReconsolidationSession } from '../types.ts';
import { ChevronDown, ChevronUp, Shield, GitMerge, Users, MessageCircle, Brain } from 'lucide-react';
import { SectionDivider } from './SectionDivider.tsx';

interface ShadowToolsTabProps {
  onStart321: (linkedInsightId?: string) => void; // Modified to accept linkedInsightId
  onStartIFS: (linkedInsightId?: string) => void; // Modified to accept linkedInsightId
  onStartMemoryRecon: (linkedInsightId?: string) => void;
  setActiveWizard: (wizardName: string | null) => void;
  sessionHistory321: ThreeTwoOneSession[];
  sessionHistoryIFS: IFSSession[];
  memoryReconHistory: MemoryReconsolidationSession[];
  draft321Session: Partial<ThreeTwoOneSession> | null;
  draftIFSSession: IFSSession | null;
  draftMemoryRecon: MemoryReconsolidationDraft | null;
  setDraft321Session: (draft: Partial<ThreeTwoOneSession> | null) => void;
  // FIX: Renamed prop `setDraftIFSSession` to `setDraftIFS` to match the state setter in `App.tsx`.
  setDraftIFS: (draft: IFSSession | null) => void;
  partsLibrary: IFSPart[];
  markInsightAsAddressed: (insightId: string, shadowToolType: string, shadowSessionId: string) => void; // NEW
}

const ToolCard = ({ icon, title, description, onStart, onResume, hasDraft }: { icon: React.ReactNode, title: string, description: string, onStart: (linkedInsightId?: string) => void, onResume: (linkedInsightId?: string) => void, hasDraft: boolean }) => (
    <div className="bg-slate-800/50 border border-slate-700/80 rounded-lg p-6 flex flex-col">
        <div className="flex items-center gap-4 mb-3">
            {icon}
            <h2 className="text-2xl font-bold tracking-tight text-slate-100">{title}</h2>
        </div>
        <p className="text-slate-400 mb-5 flex-grow">{description}</p>
        <div className="flex gap-4">
          <button onClick={() => onStart()} className="btn-luminous px-4 py-2 rounded-md font-medium transition text-sm">
            Start New
          </button>
          {hasDraft && (
            <button onClick={() => onResume()} className="bg-slate-600/80 hover:bg-slate-700 text-white px-4 py-2 rounded-md font-medium transition text-sm">
              Resume Draft
            </button>
          )}
        </div>
    </div>
);

export default function ShadowToolsTab({
  onStart321,
  onStartIFS,
  onStartMemoryRecon,
  setActiveWizard,
  sessionHistory321,
  sessionHistoryIFS,
  memoryReconHistory,
  draft321Session,
  draftIFSSession,
  draftMemoryRecon,
}: ShadowToolsTabProps) {

  return (
    <div className="space-y-8">
       <header>
        <h1 className="text-4xl font-bold font-mono text-slate-100 tracking-tighter">Shadow Tools</h1>
        <p className="text-slate-400 mt-2">Guided processes to uncover, understand, and integrate unconscious patterns.</p>
      </header>

      <SectionDivider />

      <div className="flex justify-center my-6">
        <img src="https://files.catbox.moe/sjd9bx.gif" alt="Shadow Tools" className="w-full max-w-2xl rounded-lg" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ToolCard
          icon={<GitMerge size={28} className="text-amber-400"/>}
          title="3-2-1 Process"
          description="Integrate parts of yourself you've projected onto others by facing them, talking to them, and being them."
          onStart={() => onStart321()}
          onResume={() => onStart321(draft321Session?.linkedInsightId)} // Pass linkedInsightId if resuming
          hasDraft={!!draft321Session}
        />
        <ToolCard
          icon={<Users size={28} className="text-cyan-400"/>}
          title="Internal Family Systems"
          description="Connect with your internal 'parts' with curiosity and compassion to understand their positive intent."
          onStart={() => onStartIFS()}
          onResume={() => onStartIFS(draftIFSSession?.linkedInsightId)} // Pass linkedInsightId if resuming
          hasDraft={!!draftIFSSession}
        />
        <ToolCard
          icon={<Brain size={28} className="text-emerald-400"/>}
          title="Memory Reconsolidation"
          description="Unwind implicit beliefs by juxtaposing old truths with lived contradictions, then anchor the shift."
          onStart={() => onStartMemoryRecon()}
          onResume={() => onStartMemoryRecon(draftMemoryRecon?.linkedInsightId)}
          hasDraft={!!draftMemoryRecon}
        />
        <div className="bg-gradient-to-br from-neutral-900/30 to-neutral-900/30 border-2 border-neutral-500/40 rounded-lg p-6 flex flex-col lg:col-span-3">
          <div className="flex items-center gap-4 mb-3">
            <MessageCircle size={32} className="text-neutral-400"/>
            <h2 className="text-2xl font-bold tracking-tight text-slate-100">Relational Pattern Tracker</h2>
            <span className="text-xs bg-neutral-500/20 text-neutral-300 px-2 py-1 rounded-full font-semibold">AI Chatbot</span>
          </div>
          <p className="text-slate-300 mb-5 flex-grow">
            Explore how you show up in different relationships through an interactive conversation.
            Identify reactive patterns across romantic, family, work, and social contexts. Uncover the unconscious
            fears and needs driving your automatic behaviors.
          </p>
          <button
            onClick={() => setActiveWizard('relational')}
            className="btn-luminous px-6 py-2 rounded-md font-semibold transition text-sm self-start"
          >
            Start Conversation
          </button>
        </div>
      </div>

      {memoryReconHistory.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-100">Recent Memory Reconsolidation Sessions</h3>
            <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-full font-semibold">Shift Metrics</span>
          </div>
          <div className="grid gap-3">
            {memoryReconHistory.slice(-3).reverse().map(session => {
              const belief = session.implicitBeliefs?.[0]?.belief || 'Unnamed belief';
              const baseline = session.baselineIntensity || 1;
              const shiftRaw = session.completionSummary?.intensityShift ?? 0;
              const shiftPercent = baseline ? Math.round((shiftRaw / baseline) * 100) : 0;
              const completion = session.completedAt ? new Date(session.completedAt).toLocaleDateString() : new Date(session.date).toLocaleDateString();
              return (
                <div key={session.id} className="bg-slate-800/40 border border-slate-700/70 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="text-sm text-slate-400 uppercase tracking-wide">{completion}</div>
                    <div className="text-lg font-semibold text-slate-100">{belief}</div>
                    <div className="text-xs text-slate-400 mt-1">
                      Integration: {session.completionSummary?.selectedPractices.map(p => p.practiceName).join(', ') || '—'}
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div>
                      <div className="text-xs text-slate-400">Baseline</div>
                      <div className="text-lg font-semibold text-amber-300">{baseline}/10</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Shift</div>
                      <div className={`text-lg font-semibold ${shiftPercent >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                        {shiftPercent >= 0 ? `-${shiftPercent}%` : `+${Math.abs(shiftPercent)}%`}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}