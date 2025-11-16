/**
 * Explanation Modal Component
 *
 * Displays detailed explanations for recommendations, showing:
 * - Why a practice was recommended
 * - Which wizard sessions contributed
 * - What patterns were detected
 * - Confidence levels and reasoning
 *
 * This component implements the transparency feature that mitigates
 * the Barnum Effect by showing users the app's reasoning.
 */

import React, { useState, useEffect } from 'react';
import { X, HelpCircle, AlertCircle, CheckCircle2, TrendingUp, Zap } from 'lucide-react';

export interface ExplanationData {
  recommendation: string;
  whyThis: string[];
  sources: Array<{
    wizard: string;
    pattern: string;
    confidence: 'high' | 'medium' | 'low';
  }>;
  sequence: string;
  confidence: string;
}

interface ExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendationId: string;
  practiceName: string;
  explanation?: ExplanationData | null;
  isLoading?: boolean;
  error?: string | null;
}

const confidenceColor = (confidence: string): string => {
  if (confidence === 'high') return 'bg-green-900/40 border-green-700/50 text-green-300';
  if (confidence === 'medium') return 'bg-blue-900/40 border-blue-700/50 text-blue-300';
  return 'bg-amber-900/40 border-amber-700/50 text-amber-300';
};

const confidenceBadgeColor = (confidence: 'high' | 'medium' | 'low'): string => {
  if (confidence === 'high') return 'bg-green-500/20 text-green-300 border border-green-500/50';
  if (confidence === 'medium') return 'bg-blue-500/20 text-blue-300 border border-blue-500/50';
  return 'bg-amber-500/20 text-amber-300 border border-amber-500/50';
};

export default function ExplanationModal({
  isOpen,
  onClose,
  recommendationId,
  practiceName,
  explanation,
  isLoading = false,
  error = null,
}: ExplanationModalProps) {
  const [verificationStatus, setVerificationStatus] = useState<{
    isValid: boolean;
    issues?: string[];
    summary?: string;
  } | null>(null);

  // Determine confidence message based on explanation confidence string
  const getConfidenceMessage = (confidenceStr: string) => {
    if (!confidenceStr) return null;

    const lowerConf = confidenceStr.toLowerCase();

    if (lowerConf.includes('exploratory') || lowerConf.includes('lower')) {
      return {
        title: 'Language matches the data',
        message: 'The app is exploring early patterns from a few sessions. This is a suggestion to try—not a definitive diagnosis. More sessions will strengthen confidence.',
        color: 'bg-blue-900/20 border-blue-700/30 text-blue-300'
      };
    }

    if (lowerConf.includes('moderate') || lowerConf.includes('medium')) {
      return {
        title: 'Language matches the data',
        message: 'You\'ve done several sessions, revealing consistent patterns. This recommendation is based on solid observations, though more data strengthens it further.',
        color: 'bg-amber-900/20 border-amber-700/30 text-amber-300'
      };
    }

    if (lowerConf.includes('high')) {
      return {
        title: 'Language matches the data',
        message: 'You have strong evidence across many sessions. This recommendation is well-supported and can be trusted as a clear direction.',
        color: 'bg-emerald-900/20 border-emerald-700/30 text-emerald-300'
      };
    }

    return null;
  };

  useEffect(() => {
    if (isOpen && explanation) {
      // Verify lineage when modal opens
      verifyLineage();
    }
  }, [isOpen, explanation]);

  const verifyLineage = async () => {
    try {
      const response = await fetch('/api/insights/explain/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendationId }),
      });

      if (response.ok) {
        const data = await response.json();
        setVerificationStatus(data);
      }
    } catch (err) {
      console.error('Failed to verify lineage:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HelpCircle className="text-purple-400" size={24} />
            <div>
              <h2 className="text-xl font-bold text-slate-100">Why This Recommendation?</h2>
              <p className="text-sm text-slate-400 mt-1">Understanding the app's reasoning</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition p-1"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-slate-400">Loading explanation...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-semibold text-red-300">Error Loading Explanation</p>
                <p className="text-sm text-red-400 mt-1">{error}</p>
              </div>
            </div>
          ) : explanation ? (
            <>
              {/* Practice Name */}
              <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 border border-purple-700/50 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-purple-200 mb-2">Recommended Practice</h3>
                <p className="text-2xl font-bold text-slate-100">{practiceName}</p>
              </div>

              {/* Primary Reasons */}
              <div>
                <h3 className="text-lg font-semibold text-slate-100 mb-3 flex items-center gap-2">
                  <Zap className="text-amber-400" size={20} />
                  Why This Practice?
                </h3>
                <div className="space-y-2">
                  {explanation.whyThis.map((reason, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-slate-200 flex items-start gap-3"
                    >
                      <span className="text-purple-400 font-semibold flex-shrink-0">
                        {idx === 0 ? '•' : '–'}
                      </span>
                      <p className="text-sm leading-relaxed">{reason}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contributing Sources */}
              <div>
                <h3 className="text-lg font-semibold text-slate-100 mb-3 flex items-center gap-2">
                  <TrendingUp className="text-green-400" size={20} />
                  Data Sources ({explanation.sources.length})
                </h3>
                <div className="space-y-2">
                  {explanation.sources.map((source, idx) => (
                    <div
                      key={idx}
                      className={`rounded-lg p-4 border ${confidenceColor(source.confidence)}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-slate-100">{source.wizard}</p>
                          <p className="text-sm text-slate-300 mt-1">{source.pattern}</p>
                        </div>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded whitespace-nowrap ${confidenceBadgeColor(source.confidence)}`}
                        >
                          {source.confidence === 'high'
                            ? '✓ High confidence'
                            : source.confidence === 'medium'
                              ? '≈ Medium confidence'
                              : '? Exploratory'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Integration Timing */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <p className="text-xs font-semibold text-slate-400 uppercase mb-1">When to Practice</p>
                <p className="text-slate-200">{explanation.sequence}</p>
              </div>

              {/* Overall Confidence */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <p className="text-xs font-semibold text-slate-400 uppercase mb-1">App Confidence</p>
                <p className="text-slate-200">{explanation.confidence}</p>
              </div>

              {/* Confidence Language Check - User Friendly */}
              {(() => {
                const confMsg = getConfidenceMessage(explanation.confidence);
                if (!confMsg) return null;

                const colorClass = confMsg.color;
                const textColor = colorClass.includes('blue-900')
                  ? 'text-blue-400'
                  : colorClass.includes('amber-900')
                    ? 'text-amber-400'
                    : 'text-emerald-400';

                return (
                  <div className={`${colorClass} border rounded-lg p-4`}>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className={`${textColor} flex-shrink-0 mt-0.5`} size={20} />
                      <div>
                        <p className={`font-semibold ${textColor.replace('400', '300')} mb-1`}>{confMsg.title}</p>
                        <p className="text-sm opacity-90">{confMsg.message}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Verification Status */}
              {verificationStatus && (
                <div
                  className={`rounded-lg p-4 border ${verificationStatus.isValid ? 'bg-green-900/30 border-green-700/50' : 'bg-amber-900/30 border-amber-700/50'}`}
                >
                  <div className="flex items-start gap-3">
                    {verificationStatus.isValid ? (
                      <CheckCircle2 className="text-green-400 flex-shrink-0 mt-0.5" size={20} />
                    ) : (
                      <AlertCircle className="text-amber-400 flex-shrink-0 mt-0.5" size={20} />
                    )}
                    <div>
                      <p
                        className={`font-semibold ${verificationStatus.isValid ? 'text-green-300' : 'text-amber-300'}`}
                      >
                        {verificationStatus.summary}
                      </p>
                      {verificationStatus.issues && verificationStatus.issues.length > 0 && (
                        <ul className="text-sm text-amber-300 mt-2 space-y-1">
                          {verificationStatus.issues.map((issue, idx) => (
                            <li key={idx}>⚠ {issue}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Transparency Message */}
              <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4 text-center">
                <p className="text-sm text-blue-300">
                  <strong>Transparency in Action:</strong> This explanation shows you exactly how the app arrived at
                  this recommendation. You can verify the reasoning, challenge it with new data, or try a different
                  practice instead.
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-400">No explanation available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700 px-6 py-4 bg-slate-800/50 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 font-medium transition"
          >
            Close
          </button>
          {explanation && (
            <button
              onClick={verifyLineage}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium transition flex items-center gap-2"
            >
              <HelpCircle size={16} />
              Verify Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
