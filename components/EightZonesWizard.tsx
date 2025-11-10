import React, { useState, useEffect } from 'react';
import {
  EightZonesSession,
  EightZonesDraft,
  EightZonesStep,
  ZoneAnalysis,
} from '../types.ts';
import { X, ArrowLeft, ArrowRight, Zap, Lightbulb } from 'lucide-react';
import { enhanceZoneAnalysis, generateSynthesis, submitSessionCompletion } from '../services/eightZonesService.ts';
import { EIGHT_ZONES } from '../constants.ts';

interface EightZonesWizardProps {
  onClose: () => void;
  onSave: (session: EightZonesSession) => void;
  session: EightZonesDraft | null;
  setDraft: (session: EightZonesDraft | null) => void;
  userId: string;
}

const STEPS: EightZonesStep[] = [
  'ONBOARDING',
  'TOPIC_DEFINITION',
  'ZONE_1',
  'ZONE_2',
  'ZONE_3',
  'ZONE_4',
  'ZONE_5',
  'ZONE_6',
  'ZONE_7',
  'ZONE_8',
  'SYNTHESIS',
  'COMPLETE',
];

const createBaseSession = (): EightZonesSession => ({
  id: `eightones-${Date.now()}`,
  userId: '',
  date: new Date().toISOString(),
  currentStep: 'ONBOARDING',
  focalQuestion: '',
  zoneAnalyses: {},
});

const hydrateSession = (draft?: EightZonesDraft | null): EightZonesSession => {
  const base = createBaseSession();
  return {
    ...base,
    ...draft,
    id: draft?.id ?? base.id,
    date: draft?.date ?? base.date,
    currentStep: draft?.currentStep ?? base.currentStep,
    focalQuestion: draft?.focalQuestion ?? base.focalQuestion,
    zoneAnalyses: draft?.zoneAnalyses ?? base.zoneAnalyses,
  };
};

export default function EightZonesWizard({
  onClose,
  onSave,
  session: draft,
  setDraft,
  userId,
}: EightZonesWizardProps) {
  const [session, setSession] = useState<EightZonesSession>(() => hydrateSession(draft));

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Input state for each zone
  const [topicInput, setTopicInput] = useState(draft?.focalQuestion || '');
  const [zoneInputs, setZoneInputs] = useState<Record<number, string>>(
    draft?.zoneAnalyses
      ? Object.entries(draft.zoneAnalyses).reduce(
          (acc, [zoneNum, analysis]) => ({
            ...acc,
            [zoneNum]: analysis.userInput,
          }),
          {}
        )
      : {}
  );

  const [showEnhancements, setShowEnhancements] = useState<Record<number, boolean>>({});
  const [synthesisData, setSynthesisData] = useState<any>(null);

  useEffect(() => {
    if (draft) setSession(hydrateSession(draft));
  }, [draft]);

  const handleSaveDraftAndClose = () => {
    setDraft({
      ...session,
      focalQuestion: topicInput,
      zoneAnalyses: Object.entries(zoneInputs).reduce((acc, [zoneNum, input]) => {
        if (input.trim()) {
          acc[parseInt(zoneNum)] = {
            zoneNumber: parseInt(zoneNum),
            zoneFocus: EIGHT_ZONES[parseInt(zoneNum) - 1]?.focus || '',
            userInput: input,
          };
        }
        return acc;
      }, {} as Record<number, ZoneAnalysis>),
    });
    onClose();
  };

  const updateSession = (updates: Partial<EightZonesSession>) => {
    setSession((prev) => ({ ...prev, ...updates }));
  };

  const canProceedToNext = () => {
    if (isLoading) return false;
    switch (session.currentStep) {
      case 'ONBOARDING':
        return true;
      case 'TOPIC_DEFINITION':
        return topicInput.trim().length > 30;
      case 'ZONE_1':
      case 'ZONE_2':
      case 'ZONE_3':
      case 'ZONE_4':
      case 'ZONE_5':
      case 'ZONE_6':
      case 'ZONE_7':
      case 'ZONE_8': {
        const zoneNum = parseInt(session.currentStep.split('_')[1]);
        return zoneInputs[zoneNum]?.trim().length > 20;
      }
      case 'SYNTHESIS':
        return !!synthesisData;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const currentIndex = STEPS.indexOf(session.currentStep);
      let nextStep = STEPS[currentIndex + 1] || session.currentStep;

      if (session.currentStep === 'TOPIC_DEFINITION') {
        // Save focal question and move to Zone 1
        updateSession({
          focalQuestion: topicInput,
          currentStep: nextStep,
        });
      } else if (session.currentStep.startsWith('ZONE_')) {
        // Save zone analysis and optionally enhance it
        const zoneNum = parseInt(session.currentStep.split('_')[1]);
        const zone = EIGHT_ZONES[zoneNum - 1];

        const newZoneAnalyses = { ...session.zoneAnalyses };
        newZoneAnalyses[zoneNum] = {
          zoneNumber: zoneNum,
          zoneFocus: zone.focus,
          userInput: zoneInputs[zoneNum],
        };

        // Try to enhance the zone analysis with AI
        try {
          const enhancement = await enhanceZoneAnalysis(
            userId,
            zoneNum,
            zone.focus,
            zoneInputs[zoneNum],
            session.focalQuestion,
            Object.values(newZoneAnalyses).slice(0, -1)
          );
          newZoneAnalyses[zoneNum].aiEnhancement = enhancement;
        } catch (enhanceError) {
          console.warn('[8Zones] Could not enhance zone:', enhanceError);
          // Continue anyway - enhancement is optional
        }

        updateSession({
          zoneAnalyses: newZoneAnalyses,
          currentStep: nextStep,
        });
      } else if (session.currentStep === 'SYNTHESIS') {
        // Generate synthesis from all zones
        const synthesis = await generateSynthesis(userId, session.focalQuestion, session.zoneAnalyses);
        setSynthesisData(synthesis);
        updateSession({
          blindSpots: synthesis.blindSpots,
          novelInsights: synthesis.novelInsights,
          recommendations: synthesis.recommendations,
          synthesisReport: synthesis.synthesisReport,
          zoneConnections: synthesis.connections,
          currentStep: 'COMPLETE',
        });
      }
    } catch (err) {
      console.error('[8Zones] Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    const currentIndex = STEPS.indexOf(session.currentStep);
    if (currentIndex > 0) {
      updateSession({ currentStep: STEPS[currentIndex - 1] });
    }
  };

  const handleComplete = () => {
    const finalSession: EightZonesSession = {
      ...session,
      completedAt: new Date().toISOString(),
    };
    onSave(finalSession);
    setDraft(null);
  };

  const renderStep = () => {
    switch (session.currentStep) {
      case 'ONBOARDING':
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold font-mono text-slate-100">
              8 Zones of Knowing: Integral Analysis
            </h3>
            <p className="text-slate-300 leading-relaxed">
              The 8 Zones of Knowing framework (Ken Wilber's Integral Theory) provides a comprehensive
              map for understanding any complex topic through eight distinct but interconnected perspectives.
            </p>
            <ul className="space-y-3 text-slate-300">
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 font-bold">1.</span>
                <span>Define your focal question or issue</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 font-bold">2.</span>
                <span>Explore all 8 zones systematically</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 font-bold">3.</span>
                <span>Receive AI-enhanced insights for each zone</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 font-bold">4.</span>
                <span>Synthesize an integrated, holistic understanding</span>
              </li>
            </ul>
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 mt-6">
              <p className="text-emerald-200 text-sm font-medium">
                💡 This process avoids "flatland" thinking—single-perspective analysis that misses critical
                dimensions of complex issues.
              </p>
            </div>
          </div>
        );

      case 'TOPIC_DEFINITION':
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold font-mono text-slate-100">Define Your Focal Question</h3>
            <p className="text-slate-300">
              What topic, challenge, or system do you want to understand more fully? Be specific and clear.
            </p>
            <textarea
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              rows={6}
              placeholder="Example: 'What is the full impact and nature of remote work on organizational culture and individual wellbeing?'"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
            <div className="text-sm text-slate-400">
              Minimum 30 characters • {topicInput.length}/30
            </div>
          </div>
        );

      case 'ZONE_1':
      case 'ZONE_2':
      case 'ZONE_3':
      case 'ZONE_4':
      case 'ZONE_5':
      case 'ZONE_6':
      case 'ZONE_7':
      case 'ZONE_8': {
        const zoneNum = parseInt(session.currentStep.split('_')[1]);
        const zone = EIGHT_ZONES[zoneNum - 1];
        const currentAnalysis = session.zoneAnalyses[zoneNum];

        return (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold px-2 py-1 rounded bg-cyan-500/20 text-cyan-300">
                  {zone.quadrant} {zone.perspective.toUpperCase()}
                </span>
                <span className="text-sm text-slate-400">Zone {zoneNum} of 8</span>
              </div>
              <h3 className="text-2xl font-bold font-mono text-slate-100">{zone.focus}</h3>
            </div>

            <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 space-y-3">
              <div className="text-sm">
                <p className="font-semibold text-slate-300 mb-2">Key Question:</p>
                <p className="text-slate-400 italic">"{zone.keyQuestion}"</p>
              </div>
              <div className="text-sm">
                <p className="font-semibold text-slate-300 mb-2">Zone Description:</p>
                <p className="text-slate-400">{zone.description}</p>
              </div>
              <div className="text-sm">
                <p className="font-semibold text-slate-300 mb-2">Methodologies:</p>
                <p className="text-slate-400">{zone.methodologies.join(', ')}</p>
              </div>
            </div>

            <div>
              <label className="block mb-2">
                <span className="text-slate-300 font-medium">Your Analysis:</span>
              </label>
              <textarea
                value={zoneInputs[zoneNum] || ''}
                onChange={(e) => setZoneInputs({ ...zoneInputs, [zoneNum]: e.target.value })}
                rows={8}
                placeholder={`Analyze ${zone.focus} for: "${session.focalQuestion}"\n\nThink about: ${zone.keyQuestion}`}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
              <div className="text-sm text-slate-400 mt-2">
                Minimum 20 characters • {(zoneInputs[zoneNum] || '').length}/20
              </div>
            </div>

            {currentAnalysis?.aiEnhancement && (
              <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-300">
                  <Lightbulb size={18} />
                  <span className="font-semibold">AI Enhancement</span>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">{currentAnalysis.aiEnhancement}</p>
              </div>
            )}

            {!showEnhancements[zoneNum] && (zoneInputs[zoneNum]?.length || 0) > 20 && (
              <button
                onClick={() => setShowEnhancements({ ...showEnhancements, [zoneNum]: true })}
                className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 transition flex items-center justify-center gap-2"
              >
                <Zap size={16} />
                Show AI Enhancement (Optional)
              </button>
            )}
          </div>
        );
      }

      case 'SYNTHESIS':
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold font-mono text-slate-100">Integral Synthesis</h3>
            <p className="text-slate-300">
              Generating a comprehensive, integrated analysis that shows how all 8 zones interconnect...
            </p>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-400">Synthesizing your analysis across all zones...</p>
              </div>
            ) : synthesisData ? (
              <div className="space-y-6">
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 space-y-2">
                  <p className="font-semibold text-red-300 mb-2">Blind Spots (Missing Perspectives):</p>
                  <ul className="space-y-1">
                    {synthesisData.blindSpots.map((spot: string, idx: number) => (
                      <li key={idx} className="text-slate-300 text-sm flex items-start gap-2">
                        <span className="text-red-400 mt-1">•</span>
                        <span>{spot}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4 space-y-2">
                  <p className="font-semibold text-emerald-300 mb-2">Novel Insights (New Understandings):</p>
                  <ul className="space-y-1">
                    {synthesisData.novelInsights.map((insight: string, idx: number) => (
                      <li key={idx} className="text-slate-300 text-sm flex items-start gap-2">
                        <span className="text-emerald-400 mt-1">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-4 space-y-2">
                  <p className="font-semibold text-cyan-300 mb-2">Recommendations (Next Steps):</p>
                  <ul className="space-y-1">
                    {synthesisData.recommendations.map((rec: string, idx: number) => (
                      <li key={idx} className="text-slate-300 text-sm flex items-start gap-2">
                        <span className="text-cyan-400 mt-1">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <p className="font-semibold text-slate-200 mb-3">Integrated Analysis:</p>
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{synthesisData.synthesisReport}</p>
                </div>
              </div>
            ) : (
              <button
                onClick={handleNext}
                className="btn-luminous px-6 py-3 rounded-lg font-semibold"
              >
                Generate Synthesis
              </button>
            )}
          </div>
        );

      case 'COMPLETE':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="text-white" size={32} />
              </div>
              <h3 className="text-2xl font-bold font-mono text-slate-100">Analysis Complete</h3>
              <p className="text-slate-300 mt-2">Your 8-zone integral analysis has been generated and saved.</p>
            </div>

            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-cyan-500/30 rounded-xl p-6 space-y-4">
              <div>
                <div className="text-sm text-slate-400 mb-1">Focal Question</div>
                <div className="text-lg font-medium text-slate-100">{session.focalQuestion}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-slate-400 mb-1">Zones Analyzed</div>
                  <div className="text-2xl font-bold text-cyan-300">8</div>
                </div>
                <div>
                  <div className="text-sm text-slate-400 mb-1">Insights Generated</div>
                  <div className="text-2xl font-bold text-emerald-300">
                    {(session.novelInsights?.length || 0) +
                      (session.blindSpots?.length || 0) +
                      (session.recommendations?.length || 0)}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleComplete}
              className="btn-luminous px-6 py-3 rounded-lg font-semibold w-full"
            >
              Save & Close
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  const currentStepIndex = STEPS.indexOf(session.currentStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl w-full max-w-4xl border border-slate-700 shadow-2xl my-8">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-100">8 Zones of Knowing</h2>
            <div className="text-sm text-slate-400 mt-1">
              Step {currentStepIndex + 1} of {STEPS.length}: {session.currentStep.replace(/_/g, ' ')}
            </div>
          </div>
          <button onClick={handleSaveDraftAndClose} className="text-slate-400 hover:text-slate-200 transition">
            <X size={24} />
          </button>
        </div>

        <div className="h-1 bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-8 max-h-[calc(100vh-16rem)] overflow-y-auto">
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="text-red-200 font-medium mb-2">Error</div>
              <div className="text-red-300 text-sm">{error}</div>
              <button
                onClick={() => setError(null)}
                className="mt-3 px-4 py-2 bg-red-900/30 hover:bg-red-900/50 rounded text-red-200 text-sm transition"
              >
                Retry
              </button>
            </div>
          )}

          {renderStep()}
        </div>

        <div className="p-6 border-t border-slate-700 flex items-center justify-between bg-slate-900/50">
          <button
            onClick={handleBack}
            disabled={currentStepIndex === 0 || session.currentStep === 'COMPLETE'}
            className="flex items-center gap-2 px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          {session.currentStep !== 'COMPLETE' && (
            <button
              onClick={handleNext}
              disabled={!canProceedToNext()}
              className="flex items-center gap-2 px-6 py-2 btn-luminous rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Processing...
                </>
              ) : (
                <>
                  Next
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
