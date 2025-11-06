
// FIX: Add file content for components/ShadowToolsTab.tsx
import React, { useState } from 'react';
import { ThreeTwoOneSession, IFSSession, IFSPart } from '../types.ts';
import { ChevronDown, ChevronUp, Shield, GitMerge, Users } from 'lucide-react';
import { SectionDivider } from './SectionDivider.tsx';

interface ShadowToolsTabProps {
  onStart321: (linkedInsightId?: string) => void; // Modified to accept linkedInsightId
  onStartIFS: (linkedInsightId?: string) => void; // Modified to accept linkedInsightId
  sessionHistory321: ThreeTwoOneSession[];
  sessionHistoryIFS: IFSSession[];
  draft321Session: Partial<ThreeTwoOneSession> | null;
  draftIFSSession: IFSSession | null;
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
  onStart321, onStartIFS,
  sessionHistory321, sessionHistoryIFS,
  draft321Session, draftIFSSession,
  setDraft321Session, 
  // FIX: Renamed prop from `setDraftIFSSession` to `setDraftIFS`.
  setDraftIFS,
  markInsightAsAddressed // Not directly used here, but passed through App.tsx
}: ShadowToolsTabProps) {

  return (
    <div className="space-y-8">
       <header>
        <h1 className="text-4xl font-bold font-mono text-slate-100 tracking-tighter">Shadow Tools</h1>
        <p className="text-slate-400 mt-2">Guided processes to uncover, understand, and integrate unconscious patterns.</p>
      </header>
      
      <SectionDivider />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      </div>
    </div>
  );
}