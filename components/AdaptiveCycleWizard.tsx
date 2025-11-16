import React, { useState } from 'react';
import { X, ArrowLeft, ArrowRight, RefreshCw, Loader, TrendingUp, Shield, Zap } from 'lucide-react';
import { AdaptiveCycleSession, AdaptiveCycleDiagnosticAnswers, AdaptiveCycleQuadrantAnalysis } from '../types.ts';
import { generateFullAdaptiveCycleLandscape } from '../services/adaptiveCycleService.ts';

type Step = 'ONBOARDING' | 'CONTEXT' | 'SELF_ASSESSMENT' | 'LANDSCAPE' | 'COMPLETE';

interface AdaptiveCycleWizardProps {
  onClose: () => void;
  onSave: (session: AdaptiveCycleSession) => Promise<void> | void;
}

export default function AdaptiveCycleWizard({ onClose, onSave }: AdaptiveCycleWizardProps) {
  const [step, setStep] = useState<Step>('ONBOARDING');
  const [systemToAnalyze, setSystemToAnalyze] = useState('');
  const [userHint, setUserHint] = useState<AdaptiveCycleDiagnosticAnswers>({
    potential: 5,
    connectedness: 5,
    resilience: 5,
  });
  const [cycleMap, setCycleMap] = useState<AdaptiveCycleSession['cycleMap'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [skipSelfAssessment, setSkipSelfAssessment] = useState(false);

  const handleNext = async () => {
    switch (step) {
      case 'ONBOARDING':
        setStep('CONTEXT');
        break;
      case 'CONTEXT':
        setStep('SELF_ASSESSMENT');
        break;
      case 'SELF_ASSESSMENT':
        // Generate full landscape
        setIsLoading(true);
        try {
          const landscape = await generateFullAdaptiveCycleLandscape(
            systemToAnalyze,
            skipSelfAssessment ? undefined : userHint
          );
          setCycleMap(landscape);
          setStep('LANDSCAPE');
        } catch (error) {
          console.error('Error generating Adaptive Cycle landscape:', error);
        } finally {
          setIsLoading(false);
        }
        break;
      case 'LANDSCAPE':
        // Save the session
        if (cycleMap) {
          const session: AdaptiveCycleSession = {
            id: `adaptive-cycle-${Date.now()}`,
            date: new Date().toISOString(),
            systemToAnalyze,
            userHint: skipSelfAssessment ? undefined : userHint,
            cycleMap,
          };
          console.log('🔄 [AdaptiveCycle Wizard] Saving session:', session);
          await onSave(session);
          console.log('✅ [AdaptiveCycle Wizard] onSave completed');
        }
        break;
      case 'COMPLETE':
        // This case is never reached (no button on COMPLETE step)
        // Saving happens in LANDSCAPE case now
        onClose();
        break;
    }
  };

  const handleBack = () => {
    switch (step) {
      case 'CONTEXT':
        setStep('ONBOARDING');
        break;
      case 'SELF_ASSESSMENT':
        setStep('CONTEXT');
        break;
      case 'LANDSCAPE':
        setStep('SELF_ASSESSMENT');
        break;
      case 'COMPLETE':
        setStep('LANDSCAPE');
        break;
    }
  };

  const canProceedToNext = () => {
    switch (step) {
      case 'ONBOARDING':
        return true;
      case 'CONTEXT':
        return systemToAnalyze.trim().length > 10;
      case 'SELF_ASSESSMENT':
        return true;
      case 'LANDSCAPE':
        return !!cycleMap;
      default:
        return true;
    }
  };

  // Determine which quadrant to subtly highlight based on user hint
  const getHighlightedQuadrant = (): 'r' | 'K' | 'Ω' | 'α' | null => {
    if (skipSelfAssessment || !userHint) return null;

    const { potential, connectedness } = userHint;
    const isPotentialHigh = potential > 5.5;
    const isConnectednessHigh = connectedness > 5.5;

    if (isPotentialHigh && !isConnectednessHigh) return 'r';
    if (isPotentialHigh && isConnectednessHigh) return 'K';
    if (!isPotentialHigh && isConnectednessHigh) return 'Ω';
    return 'α';
  };

  const renderQuadrant = (quadrant: AdaptiveCycleQuadrantAnalysis, isHighlighted: boolean) => {
    const colorMap = {
      'r': 'border-green-500/70 bg-green-500/10',
      'K': 'border-blue-500/70 bg-blue-500/10',
      'Ω': 'border-red-500/70 bg-red-500/10',
      'α': 'border-yellow-500/70 bg-yellow-500/10'
    };

    const baseStyle = 'bg-slate-800/30 border-slate-700';
    const highlightStyle = colorMap[quadrant.phase];

    return (
      <div className={`p-5 rounded-lg border-2 ${isHighlighted ? highlightStyle : baseStyle} transition-all`}>
        <h4 className="font-bold text-slate-100 mb-3 text-lg">{quadrant.title}</h4>
        <ul className="space-y-2">
          {quadrant.points.map((point, idx) => (
            <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
              <span className="text-cyan-400 mt-1 flex-shrink-0">•</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderStep = () => {
    switch (step) {
      case 'ONBOARDING':
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold font-mono text-slate-100 flex items-center gap-2">
              <RefreshCw className="text-cyan-400" size={28} />
              The Adaptive Cycle Lens
            </h3>
            <p className="text-slate-300 leading-relaxed">
              The Adaptive Cycle is a powerful mental model from systems ecology that describes how all complex systems
              move through cycles of growth, stability, release, and renewal.
            </p>

            <div className="bg-cyan-900/20 border border-cyan-700/50 rounded-lg p-5 space-y-3">
              <p className="font-semibold text-cyan-200">The Four Phases:</p>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 font-bold mt-0.5">r</span>
                  <span><strong>Growth/Exploitation:</strong> Rapid expansion, experimentation, high energy, low structure</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 font-bold mt-0.5">K</span>
                  <span><strong>Conservation:</strong> Stability, efficiency, high structure, but also rigidity</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold mt-0.5">Ω</span>
                  <span><strong>Release/Collapse:</strong> Breakdown of old structures, chaos, freeing of resources</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 font-bold mt-0.5">α</span>
                  <span><strong>Reorganization:</strong> Innovation, renewal, experimentation, seeds of new growth</span>
                </li>
              </ul>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <p className="text-sm text-slate-300">
                <strong>What you'll get:</strong> A comprehensive four-quadrant map showing how ALL phases of the Adaptive Cycle
                are present in your situation. This isn't about diagnosing where you are—it's about seeing the whole landscape
                and understanding the full cycle.
              </p>
            </div>
          </div>
        );

      case 'CONTEXT':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold font-mono text-slate-100">Define Your System</h3>
            <p className="text-slate-400">
              What area of your life do you want to map? Be specific. This could be a career, a relationship,
              a creative project, your health journey, or any other complex system.
            </p>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                The system I want to map:
              </label>
              <input
                type="text"
                value={systemToAnalyze}
                onChange={(e) => setSystemToAnalyze(e.target.value)}
                placeholder='e.g., "My career transition" or "My relationship with my partner"'
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
              <div className="text-sm text-slate-500 mt-2">
                Minimum 10 characters • {systemToAnalyze.length}/10
              </div>
            </div>
          </div>
        );

      case 'SELF_ASSESSMENT':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold font-mono text-slate-100">Self-Assessment (Optional)</h3>
            <p className="text-slate-400 text-sm">
              Answer these questions to give the AI a hint about your current state. This is optional—the AI will generate
              a full landscape either way. If you provide answers, one quadrant will be subtly highlighted.
            </p>

            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="skip-assessment"
                checked={skipSelfAssessment}
                onChange={(e) => setSkipSelfAssessment(e.target.checked)}
                className="w-4 h-4 text-cyan-500 rounded"
              />
              <label htmlFor="skip-assessment" className="text-sm text-slate-300">
                Skip this step and generate a neutral landscape
              </label>
            </div>

            {!skipSelfAssessment && (
              <div className="space-y-6">
                {/* Potential */}
                <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
                  <label className="block text-sm font-semibold text-slate-200 mb-3">
                    <TrendingUp size={16} className="inline mr-2 text-green-400" />
                    How much <strong>potential for growth, novelty, and experimentation</strong> exists in this system?
                  </label>
                  <p className="text-xs text-slate-400 mb-3 italic">
                    Low (1) = Stagnant, stuck, no new energy | High (10) = Abundant opportunities, rapid change, high energy
                  </p>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={userHint.potential}
                      onChange={(e) => setUserHint(prev => ({ ...prev, potential: parseInt(e.target.value) }))}
                      className="flex-1"
                    />
                    <span className="text-2xl font-bold text-cyan-400 w-12 text-center">{userHint.potential}</span>
                  </div>
                </div>

                {/* Connectedness */}
                <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
                  <label className="block text-sm font-semibold text-slate-200 mb-3">
                    <Zap size={16} className="inline mr-2 text-blue-400" />
                    How <strong>connected, rigid, and predictable</strong> are the structures in this system?
                  </label>
                  <p className="text-xs text-slate-400 mb-3 italic">
                    Low (1) = Loose, fluid, unstructured | High (10) = Highly stable, rigid, tightly interconnected
                  </p>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={userHint.connectedness}
                      onChange={(e) => setUserHint(prev => ({ ...prev, connectedness: parseInt(e.target.value) }))}
                      className="flex-1"
                    />
                    <span className="text-2xl font-bold text-cyan-400 w-12 text-center">{userHint.connectedness}</span>
                  </div>
                </div>

                {/* Resilience */}
                <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
                  <label className="block text-sm font-semibold text-slate-200 mb-3">
                    <Shield size={16} className="inline mr-2 text-purple-400" />
                    How <strong>resilient</strong> is this system? Can it absorb shocks and adapt?
                  </label>
                  <p className="text-xs text-slate-400 mb-3 italic">
                    Low (1) = Fragile, brittle, one shock could break it | High (10) = Antifragile, robust, absorbs disruption
                  </p>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={userHint.resilience}
                      onChange={(e) => setUserHint(prev => ({ ...prev, resilience: parseInt(e.target.value) }))}
                      className="flex-1"
                    />
                    <span className="text-2xl font-bold text-cyan-400 w-12 text-center">{userHint.resilience}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'LANDSCAPE':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold font-mono text-slate-100">Your Adaptive Cycle Landscape</h3>

            {isLoading ? (
              <div className="text-center py-12">
                <Loader size={48} className="animate-spin text-cyan-400 mx-auto mb-4" />
                <p className="text-slate-400">Generating your personalized landscape...</p>
              </div>
            ) : cycleMap ? (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-cyan-900/30 to-slate-900/30 border border-cyan-700/50 rounded-lg p-5">
                  <p className="text-sm text-slate-400 mb-2">Your System:</p>
                  <p className="text-lg font-semibold text-slate-100">"{systemToAnalyze}"</p>
                </div>

                {!skipSelfAssessment && (
                  <p className="text-sm text-slate-400 italic text-center">
                    Quadrant highlighted based on your self-assessment scores
                  </p>
                )}

                {/* 2x2 Grid of Quadrants */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Top Left: α (Reorganization) */}
                  {renderQuadrant(cycleMap.α, getHighlightedQuadrant() === 'α')}

                  {/* Top Right: K (Conservation) */}
                  {renderQuadrant(cycleMap.K, getHighlightedQuadrant() === 'K')}

                  {/* Bottom Left: r (Growth) */}
                  {renderQuadrant(cycleMap.r, getHighlightedQuadrant() === 'r')}

                  {/* Bottom Right: Ω (Release) */}
                  {renderQuadrant(cycleMap.Ω, getHighlightedQuadrant() === 'Ω')}
                </div>

                <div className="bg-cyan-900/20 border border-cyan-700/50 rounded-lg p-4">
                  <p className="text-sm text-cyan-200">
                    <strong>Remember:</strong> All four phases are present in every system. The cycle is always moving.
                    Use this map to understand the full landscape of possibilities in your situation.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        );

      case 'COMPLETE':
        return (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="text-white" size={32} />
            </div>
            <h3 className="text-2xl font-bold font-mono text-slate-100">Landscape Complete</h3>
            <p className="text-slate-300">
              Your Adaptive Cycle landscape has been saved. You can review it anytime in your Intelligence Hub.
            </p>
            <div className="bg-cyan-900/20 border border-cyan-700/50 rounded-lg p-4">
              <p className="text-sm text-cyan-200">
                <strong>Next Steps:</strong> Reflect on all four quadrants and consider how each phase is showing up
                in your situation. The Adaptive Cycle is always moving—revisit this tool periodically to see how
                the landscape evolves.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in">
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">
        <header className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold font-mono tracking-tight text-cyan-300">Adaptive Cycle Lens</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X size={24} />
          </button>
        </header>

        <main className="p-6 flex-grow overflow-y-auto">
          {renderStep()}
        </main>

        <footer className="p-6 border-t border-slate-700 flex justify-between items-center">
          <button
            onClick={onClose}
            className="text-sm text-slate-400 hover:text-white transition"
          >
            {step === 'COMPLETE' ? 'Close' : 'Cancel'}
          </button>
          <div className="flex gap-4">
            {step !== 'ONBOARDING' && step !== 'COMPLETE' && (
              <button
                onClick={handleBack}
                className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                Back
              </button>
            )}
            {step !== 'COMPLETE' && (
              <button
                onClick={handleNext}
                disabled={!canProceedToNext() || isLoading}
                className="btn-luminous px-4 py-2 rounded-md font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {step === 'SELF_ASSESSMENT' ? 'Generate Landscape' : step === 'LANDSCAPE' ? 'Save & Close' : 'Next'}
                {!isLoading && <ArrowRight size={16} />}
                {isLoading && <Loader size={16} className="animate-spin" />}
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
