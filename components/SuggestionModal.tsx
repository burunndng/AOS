import React from 'react';
import { X, Sparkles, AlertCircle, TrendingUp, Lightbulb } from 'lucide-react';
import type { AnalysisResult } from '../services/openRouterService';

interface SuggestionModalProps {
  isOpen: boolean;
  isLoading: boolean;
  analysis: AnalysisResult | null;
  error: string | null;
  onClose: () => void;
  onSelectWizard: (wizardType: string, specificFocus: string) => void;
}

export function SuggestionModal({
  isOpen,
  isLoading,
  analysis,
  error,
  onClose,
  onSelectWizard
}: SuggestionModalProps) {
  if (!isOpen) return null;

  const wizardDisplayNames: Record<string, string> = {
    'memory-recon': 'Memory Reconsolidation',
    'ifs': 'Internal Family Systems',
    '3-2-1': '3-2-1 Shadow Process',
    'eight-zones': 'Eight Zones of Enneagram'
  };

  const wizardIcons: Record<string, string> = {
    'memory-recon': '🧠',
    'ifs': '👥',
    '3-2-1': '🌗',
    'eight-zones': '⚪'
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
          <div className="flex items-center gap-3">
            <Sparkles className="text-cyan-400" size={24} />
            <h2 className="text-2xl font-bold">AI-Powered Next Steps</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mb-4"></div>
              <p className="text-slate-400">Analyzing your session and generating personalized recommendations...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-red-300 font-medium mb-1">Unable to generate recommendations</p>
                  <p className="text-red-200/80 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {analysis && !isLoading && (
            <div className="space-y-6">
              {/* Synthesis */}
              <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg p-5">
                <div className="flex items-start gap-3 mb-3">
                  <Lightbulb className="text-cyan-400 flex-shrink-0 mt-1" size={20} />
                  <h3 className="text-lg font-semibold text-cyan-100">Session Analysis</h3>
                </div>
                <p className="text-slate-200 leading-relaxed">{analysis.synthesis}</p>
              </div>

              {/* Caution if present */}
              {analysis.caution && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-amber-400 flex-shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="text-amber-300 font-medium text-sm mb-1">Important Consideration</p>
                      <p className="text-amber-200/90 text-sm">{analysis.caution}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              <div>
                <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                  <TrendingUp size={20} className="text-cyan-400" />
                  Recommended Next Steps
                </h3>
                <div className="space-y-3">
                  {analysis.recommendations.map((rec, index) => {
                    const isHighConfidence = rec.confidence >= 0.7;
                    const isMediumConfidence = rec.confidence >= 0.5 && rec.confidence < 0.7;

                    return (
                      <button
                        key={index}
                        onClick={() => onSelectWizard(rec.wizard, rec.specificFocus)}
                        className={`w-full text-left p-5 rounded-lg transition-all duration-300 border-2 ${
                          isHighConfidence
                            ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-500/50 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/20'
                            : isMediumConfidence
                            ? 'bg-slate-800/50 border-slate-600 hover:border-cyan-500/50 hover:bg-slate-800'
                            : 'bg-slate-800/30 border-slate-700 hover:border-slate-600 hover:bg-slate-800/50'
                        } transform hover:scale-[1.02]`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{wizardIcons[rec.wizard]}</span>
                            <div>
                              <h4 className={`font-semibold ${
                                isHighConfidence ? 'text-cyan-100' : 'text-slate-200'
                              }`}>
                                {wizardDisplayNames[rec.wizard]}
                              </h4>
                              {isHighConfidence && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/30 text-cyan-300 border border-cyan-500/50">
                                  High Confidence
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1.5">
                              <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    isHighConfidence ? 'bg-cyan-400' : isMediumConfidence ? 'bg-blue-400' : 'bg-slate-500'
                                  }`}
                                  style={{ width: `${rec.confidence * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-400 font-medium w-10 text-right">
                                {Math.round(rec.confidence * 100)}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="text-sm text-slate-300 mb-3 leading-relaxed">
                          {rec.reason}
                        </p>

                        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                          <p className="text-xs text-slate-400 mb-1 font-medium">Specific Focus:</p>
                          <p className="text-sm text-cyan-200">"{rec.specificFocus}"</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer note */}
              <div className="text-center pt-4 border-t border-slate-700">
                <p className="text-xs text-slate-500">
                  These recommendations are generated by AI based on your session. Use your judgment and inner wisdom to choose what feels right.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
