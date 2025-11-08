import React, { useState, useEffect } from 'react';
import { AttachmentStyle, attachmentProfiles } from '../data/attachmentMappings.ts';
import { attachmentPracticeSequences, calculatePhaseCompletion } from '../data/attachmentPracticeSequences.ts';
import { Practice, AllPractice } from '../types.ts';
import { practices } from '../constants.ts';
import { Heart, Sparkles, Check, Lock } from 'lucide-react';
import * as geminiService from '../services/geminiService.ts';
import PracticeChatbot from './PracticeChatbot.tsx';

interface AttachmentRecommendationsProps {
  attachmentStyle: AttachmentStyle;
  anxietyScore: number;
  avoidanceScore: number;
  practiceStack?: AllPractice[];
  onPracticeClick?: (practice: Practice) => void;
}

export default function AttachmentRecommendations({
  attachmentStyle,
  anxietyScore,
  avoidanceScore,
  practiceStack = [],
  onPracticeClick
}: AttachmentRecommendationsProps) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPractice, setSelectedPractice] = useState<Practice | null>(null);

  const profile = attachmentProfiles[attachmentStyle];
  const phases = attachmentPracticeSequences[attachmentStyle];
  const stackIds = new Set(practiceStack.map(p => p.id));

  // Get all practices as a key-value map
  const allPractices = [
    ...practices.body,
    ...practices.mind,
    ...practices.spirit,
    ...practices.shadow
  ].reduce((acc, practice) => {
    acc[practice.id] = practice;
    return acc;
  }, {} as Record<string, any>);

  useEffect(() => {
    const generateExplanation = async () => {
      setLoading(true);
      const allRecommendedIds = phases.flatMap(p => p.practiceIds);
      const exp = await geminiService.explainAttachmentPractices(attachmentStyle, allRecommendedIds);
      setExplanation(exp);
      setLoading(false);
    };

    generateExplanation();
  }, [attachmentStyle, phases]);

  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Heart className={`${profile.color} flex-shrink-0 mt-1`} size={24} />
        <div>
          <h3 className="text-xl font-bold text-slate-100">{profile.label}</h3>
          <p className="text-sm text-slate-400 mt-1">{profile.description}</p>
        </div>
      </div>

      {/* Explanation */}
      {loading ? (
        <div className="flex items-center gap-2 text-slate-400">
          <Sparkles size={16} className="animate-spin" />
          <span className="text-sm">Personalizing your recommendations...</span>
        </div>
      ) : (
        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-300 leading-relaxed">{explanation}</p>
        </div>
      )}

      {/* Practice Healing Sequence */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-slate-200">Your Healing Journey</h4>
        <p className="text-xs text-slate-400">Progressive phases to support your attachment healing</p>

        <div className="space-y-3">
          {phases.map((phase) => {
            const phaseCompletion = calculatePhaseCompletion(phase.practiceIds, stackIds);
            const phasePractices = phase.practiceIds
              .map(id => allPractices[id as keyof typeof allPractices])
              .filter(Boolean);

            return (
              <div key={phase.phaseNumber} className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 space-y-3">
                {/* Phase Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-accent uppercase">{phase.duration}</span>
                      <span className="text-xs text-slate-500">Phase {phase.phaseNumber}/3</span>
                    </div>
                    <h5 className="text-sm font-bold text-slate-100">{phase.focus}</h5>
                    <p className="text-xs text-slate-400 mt-2">{phase.description}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>Progress</span>
                    <span>{phaseCompletion}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        phaseCompletion === 100
                          ? 'bg-green-500'
                          : phaseCompletion > 0
                            ? 'bg-blue-500'
                            : 'bg-slate-700'
                      }`}
                      style={{ width: `${phaseCompletion}%` }}
                    />
                  </div>
                </div>

                {/* Practices Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {phasePractices.map((p: any) => {
                    const isInStack = stackIds.has(p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          if (!isInStack) {
                            setSelectedPractice(p);
                          }
                        }}
                        disabled={isInStack}
                        className={`text-left text-xs p-2 rounded border transition-all ${
                          isInStack
                            ? 'bg-green-900/20 border-green-700/50 text-slate-400 cursor-default'
                            : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-accent/50 hover:bg-slate-800 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {isInStack && <Check size={14} className="text-green-500 flex-shrink-0 mt-0.5" />}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-200">{p.name}</p>
                            <p className={`text-xs mt-0.5 ${isInStack ? 'text-slate-500' : 'text-slate-500'}`}>
                              {p.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Overall Progress */}
      <div className="border-t border-slate-700 pt-4">
        <div className="bg-slate-900/50 rounded-lg p-3 space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span className="font-semibold">Overall Progress</span>
            <span>{Math.round((Array.from(stackIds).filter(id => phases.some(p => p.practiceIds.includes(id))).length / phases.flatMap(p => p.practiceIds).length) * 100)}%</span>
          </div>
          <p className="text-xs text-slate-400">
            {stackIds.size === 0 ? 'Click a practice to begin your guided session!' : 'Keep building your practice foundation!'}
          </p>
        </div>
      </div>

      {/* Practice Chatbot Modal */}
      {selectedPractice && (
        <PracticeChatbot
          practice={selectedPractice}
          attachmentStyle={attachmentStyle}
          anxietyScore={anxietyScore}
          avoidanceScore={avoidanceScore}
          onClose={() => setSelectedPractice(null)}
          onComplete={(sessionNotes) => {
            // Add practice to stack after completing session
            onPracticeClick?.(selectedPractice);
            setSelectedPractice(null);
          }}
        />
      )}
    </div>
  );
}
