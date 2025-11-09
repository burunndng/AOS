import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Plus } from 'lucide-react';

interface QuickDayActionsProps {
  dayName: string;
  dayDate: string;
  onMarkComplete: () => void;
  onFlagIssue: (issue: string) => void;
}

export default function QuickDayActions({
  dayName,
  dayDate,
  onMarkComplete,
  onFlagIssue,
}: QuickDayActionsProps) {
  const [showIssueInput, setShowIssueInput] = useState(false);
  const [issueText, setIssueText] = useState('');

  const handleSubmitIssue = () => {
    if (issueText.trim()) {
      onFlagIssue(issueText);
      setIssueText('');
      setShowIssueInput(false);
    }
  };

  return (
    <div className="flex gap-2 items-center">
      <button
        onClick={onMarkComplete}
        title={`Mark ${dayName} complete`}
        className="flex items-center gap-1 px-3 py-1 text-xs rounded-md bg-green-900/30 hover:bg-green-900/50 text-green-300 transition border border-green-700"
      >
        <CheckCircle2 size={14} />
        Complete
      </button>

      {!showIssueInput ? (
        <button
          onClick={() => setShowIssueInput(true)}
          title={`Flag issue for ${dayName}`}
          className="flex items-center gap-1 px-3 py-1 text-xs rounded-md bg-amber-900/30 hover:bg-amber-900/50 text-amber-300 transition border border-amber-700"
        >
          <AlertCircle size={14} />
          Flag
        </button>
      ) : (
        <div className="flex gap-1 items-center">
          <input
            type="text"
            value={issueText}
            onChange={e => setIssueText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                handleSubmitIssue();
              } else if (e.key === 'Escape') {
                setShowIssueInput(false);
                setIssueText('');
              }
            }}
            placeholder="e.g., low energy, missed workout"
            className="px-2 py-1 text-xs rounded-md bg-slate-800 border border-slate-600 text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent"
            autoFocus
          />
          <button
            onClick={handleSubmitIssue}
            className="px-2 py-1 text-xs rounded-md bg-accent text-slate-900 hover:bg-teal-400 transition font-medium"
          >
            <Plus size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
