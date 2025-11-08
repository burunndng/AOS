import React, { useState, useEffect } from 'react';
import { AttachmentStyle, attachmentProfiles, getRecommendedPracticesBySystem } from '../data/attachmentMappings.ts';
import { Practice } from '../types.ts';
import { practices } from '../constants.ts';
import { Heart, Sparkles } from 'lucide-react';
import * as geminiService from '../services/geminiService.ts';

interface AttachmentRecommendationsProps {
  attachmentStyle: AttachmentStyle;
  onPracticeClick?: (practice: Practice) => void;
}

export default function AttachmentRecommendations({
  attachmentStyle,
  onPracticeClick
}: AttachmentRecommendationsProps) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const profile = attachmentProfiles[attachmentStyle];
  const recommendedPracticesBySystem = getRecommendedPracticesBySystem(attachmentStyle);

  // Get practice objects
  const allPractices = { ...practices.body, ...practices.mind, ...practices.spirit, ...practices.shadow };
  const practicesBySystem = {
    body: recommendedPracticesBySystem.body.map(id => allPractices[id as keyof typeof allPractices]).filter(Boolean),
    mind: recommendedPracticesBySystem.mind.map(id => allPractices[id as keyof typeof allPractices]).filter(Boolean),
    spirit: recommendedPracticesBySystem.spirit.map(id => allPractices[id as keyof typeof allPractices]).filter(Boolean),
    shadow: recommendedPracticesBySystem.shadow.map(id => allPractices[id as keyof typeof allPractices]).filter(Boolean),
  };

  useEffect(() => {
    const generateExplanation = async () => {
      setLoading(true);
      const allRecommended = [
        ...recommendedPracticesBySystem.body,
        ...recommendedPracticesBySystem.mind,
        ...recommendedPracticesBySystem.spirit,
        ...recommendedPracticesBySystem.shadow
      ];
      const exp = await geminiService.explainAttachmentPractices(attachmentStyle, allRecommended);
      setExplanation(exp);
      setLoading(false);
    };

    generateExplanation();
  }, [attachmentStyle]);

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

      {/* Practice Recommendations by System */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-slate-200">Recommended Practices</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Body Practices */}
          <div className="bg-green-950/40 border border-green-800/50 rounded-lg p-4">
            <p className="text-xs font-bold text-green-300 mb-3">🧘 BODY</p>
            <div className="space-y-2">
              {practicesBySystem.body.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => onPracticeClick?.(p)}
                  className="text-left text-xs text-slate-300 hover:text-green-300 transition-colors p-2 rounded hover:bg-green-900/30 w-full"
                >
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{p.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Mind Practices */}
          <div className="bg-blue-950/40 border border-blue-800/50 rounded-lg p-4">
            <p className="text-xs font-bold text-blue-300 mb-3">🧠 MIND</p>
            <div className="space-y-2">
              {practicesBySystem.mind.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => onPracticeClick?.(p)}
                  className="text-left text-xs text-slate-300 hover:text-blue-300 transition-colors p-2 rounded hover:bg-blue-900/30 w-full"
                >
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{p.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Spirit Practices */}
          <div className="bg-purple-950/40 border border-purple-800/50 rounded-lg p-4">
            <p className="text-xs font-bold text-purple-300 mb-3">✨ SPIRIT</p>
            <div className="space-y-2">
              {practicesBySystem.spirit.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => onPracticeClick?.(p)}
                  className="text-left text-xs text-slate-300 hover:text-purple-300 transition-colors p-2 rounded hover:bg-purple-900/30 w-full"
                >
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{p.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Shadow Practices */}
          <div className="bg-amber-950/40 border border-amber-800/50 rounded-lg p-4">
            <p className="text-xs font-bold text-amber-300 mb-3">🌑 SHADOW</p>
            <div className="space-y-2">
              {practicesBySystem.shadow.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => onPracticeClick?.(p)}
                  className="text-left text-xs text-slate-300 hover:text-amber-300 transition-colors p-2 rounded hover:bg-amber-900/30 w-full"
                >
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{p.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="border-t border-slate-700 pt-4 text-center">
        <p className="text-xs text-slate-400">
          Click any practice to learn more or add it to your stack
        </p>
      </div>
    </div>
  );
}
