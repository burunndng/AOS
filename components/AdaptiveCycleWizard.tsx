import React, { useState } from 'react';
import { X, ArrowLeft, ArrowRight, RefreshCw, Lightbulb, Loader, TrendingUp, Shield, Zap, AlertTriangle } from 'lucide-react';
import { AdaptiveCycleSession, AdaptiveCycleDiagnosticAnswers, AdaptiveCyclePhaseAnalysis } from '../types.ts';
import { diagnoseAdaptiveCyclePhase, generateAdaptiveCycleAnalysis } from '../services/adaptiveCycleService.ts';

type Step = 'ONBOARDING' | 'CONTEXT' | 'DIAGNOSTIC' | 'ANALYSIS' | 'COMPLETE';

interface AdaptiveCycleWizardProps {
  onClose: () => void;
  onSave: (session: AdaptiveCycleSession) => void;
}

export default function AdaptiveCycleWizard({ onClose, onSave }: AdaptiveCycleWizardProps) {
  const [step, setStep] = useState<Step>('ONBOARDING');
  const [systemToAnalyze, setSystemToAnalyze] = useState('');
  const [diagnosticAnswers, setDiagnosticAnswers] = useState<AdaptiveCycleDiagnosticAnswers>({
    potential: 5,
    connectedness: 5,
    resilience: 5,
  });
  const [diagnosedPhase, setDiagnosedPhase] = useState<'r' | 'K' | 'Ω' | 'α' | null>(null);
  const [phaseAnalysis, setPhaseAnalysis] = useState<AdaptiveCyclePhaseAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = async () => {
    switch (step) {
      case 'ONBOARDING':
        setStep('CONTEXT');
        break;
      case 'CONTEXT':
        setStep('DIAGNOSTIC');
        break;
      case 'DIAGNOSTIC':
        // Diagnose phase and generate AI analysis
        setIsLoading(true);
        try {
          const phase = diagnoseAdaptiveCyclePhase(diagnosticAnswers);
          setDiagnosedPhase(phase);

          const analysis = await generateAdaptiveCycleAnalysis(systemToAnalyze, phase, diagnosticAnswers);
          setPhaseAnalysis(analysis);

          setStep('ANALYSIS');
        } catch (error) {
          console.error('Error generating Adaptive Cycle analysis:', error);
        } finally {
          setIsLoading(false);
        }
        break;
      case 'ANALYSIS':
        setStep('COMPLETE');
        break;
      case 'COMPLETE':
        // Save the session
        if (diagnosedPhase && phaseAnalysis) {
          const session: AdaptiveCycleSession = {
            id: `adaptive-cycle-${Date.now()}`,
            date: new Date().toISOString(),
            systemToAnalyze,
            diagnosticAnswers,
            diagnosedPhase,
            phaseAnalysis,
          };
          onSave(session);
        }
        break;
    }
  };

  const handleBack = () => {
    switch (step) {
      case 'CONTEXT':
        setStep('ONBOARDING');
        break;
      case 'DIAGNOSTIC':
        setStep('CONTEXT');
        break;
      case 'ANALYSIS':
        setStep('DIAGNOSTIC');
        break;
      case 'COMPLETE':
        setStep('ANALYSIS');
        break;
    }
  };

  const canProceedToNext = () => {
    switch (step) {
      case 'ONBOARDING':
        return true;
      case 'CONTEXT':
        return systemToAnalyze.trim().length > 10;
      case 'DIAGNOSTIC':
        return true;
      case 'ANALYSIS':
        return !!phaseAnalysis;
      default:
        return true;
    }
  };

  const renderPhaseQuadrant = () => {
    if (!diagnosedPhase) return null;

    const quadrants = {
      'r': { row: 2, col: 1, color: 'bg-green-500/20 border-green-500' },
      'K': { row: 1, col: 2, color: 'bg-blue-500/20 border-blue-500' },
      'Ω': { row: 2, col: 2, color: 'bg-red-500/20 border-red-500' },
      'α': { row: 1, col: 1, color: 'bg-yellow-500/20 border-yellow-500' }
    };

    const current = quadrants[diagnosedPhase];

    return (
      <div className="grid grid-cols-2 grid-rows-2 gap-2 max-w-md mx-auto mb-6">
        {/* Top Left: α (Reorganization) */}
        <div className={`p-4 rounded-lg border-2 text-center ${diagnosedPhase === 'α' ? current.color : 'bg-slate-800/30 border-slate-700'}`}>
          <p className="text-xs text-slate-400 mb-1">Low Potential, Low Connectedness</p>
          <p className="font-bold text-slate-200">α Reorganization</p>
        </div>

        {/* Top Right: K (Conservation) */}
        <div className={`p-4 rounded-lg border-2 text-center ${diagnosedPhase === 'K' ? current.color : 'bg-slate-800/30 border-slate-700'}`}>
          <p className="text-xs text-slate-400 mb-1">High Potential, High Connectedness</p>
          <p className="font-bold text-slate-200">K Conservation</p>
        </div>

        {/* Bottom Left: r (Growth) */}
        <div className={`p-4 rounded-lg border-2 text-center ${diagnosedPhase === 'r' ? current.color : 'bg-slate-800/30 border-slate-700'}`}>
          <p className="text-xs text-slate-400 mb-1">High Potential, Low Connectedness</p>
          <p className="font-bold text-slate-200">r Growth</p>
        </div>

        {/* Bottom Right: Ω (Release) */}
        <div className={`p-4 rounded-lg border-2 text-center ${diagnosedPhase === 'Ω' ? current.color : 'bg-slate-800/30 border-slate-700'}`}>
          <p className="text-xs text-slate-400 mb-1">Low Potential, High Connectedness</p>
          <p className="font-bold text-slate-200">Ω Release</p>
        </div>
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
              The Adaptive Cycle
            </h3>
            <p className="text-slate-300 leading-relaxed">
              The Adaptive Cycle is a powerful mental model from systems thinking that describes the natural, cyclical process
              of growth, stability, collapse, and renewal in any complex system.
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
                <strong>What you'll do:</strong> You'll define a "system" in your life (like your career, a relationship, or a project),
                answer diagnostic questions, and receive an AI-powered map of where you are in the cycle—complete with strategies
                for navigating your current phase.
              </p>
            </div>
          </div>
        );

      case 'CONTEXT':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold font-mono text-slate-100">Define Your System</h3>
            <p className="text-slate-400">
              What area of your life do you want to analyze? Be specific. This could be a career, a relationship,
              a creative project, your health journey, or any other complex system in your life.
            </p>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                The system I want to map:
              </label>
              <input
                type="text"
                value={systemToAnalyze}
                onChange={(e) => setSystemToAnalyze(e.target.value)}
                placeholder='e.g., "My mid-life career transition" or "My relationship with my partner"'
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
              <div className="text-sm text-slate-500 mt-2">
                Minimum 10 characters • {systemToAnalyze.length}/10
              </div>
            </div>
          </div>
        );

      case 'DIAGNOSTIC':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold font-mono text-slate-100">Diagnostic Questions</h3>
            <p className="text-slate-400 text-sm">
              Answer these questions to map your position in the Adaptive Cycle. Use the full scale (1-10) to be accurate.
            </p>

            <div className="space-y-6">
              {/* Potential */}
              <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
                <label className="block text-sm font-semibold text-slate-200 mb-3">
                  <TrendingUp size={16} className="inline mr-2 text-green-400" />
                  How much <strong>potential for growth, novelty, and experimentation</strong> currently exists in this system?
                </label>
                <p className="text-xs text-slate-400 mb-3 italic">
                  Low (1) = Stagnant, no new energy, things feel stuck | High (10) = Abundant opportunities, rapid change, high energy for new things
                </p>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={diagnosticAnswers.potential}
                    onChange={(e) => setDiagnosticAnswers(prev => ({ ...prev, potential: parseInt(e.target.value) }))}
                    className="flex-1"
                  />
                  <span className="text-2xl font-bold text-cyan-400 w-12 text-center">{diagnosticAnswers.potential}</span>
                </div>
              </div>

              {/* Connectedness */}
              <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
                <label className="block text-sm font-semibold text-slate-200 mb-3">
                  <Zap size={16} className="inline mr-2 text-blue-400" />
                  How <strong>connected, rigid, and predictable</strong> are the structures, rules, and relationships in this system?
                </label>
                <p className="text-xs text-slate-400 mb-3 italic">
                  Low (1) = Loose, fluid, unstructured, few fixed patterns | High (10) = Highly stable, rigid roles, predictable, tightly interconnected
                </p>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={diagnosticAnswers.connectedness}
                    onChange={(e) => setDiagnosticAnswers(prev => ({ ...prev, connectedness: parseInt(e.target.value) }))}
                    className="flex-1"
                  />
                  <span className="text-2xl font-bold text-cyan-400 w-12 text-center">{diagnosticAnswers.connectedness}</span>
                </div>
              </div>

              {/* Resilience */}
              <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
                <label className="block text-sm font-semibold text-slate-200 mb-3">
                  <Shield size={16} className="inline mr-2 text-purple-400" />
                  How <strong>resilient</strong> is this system? Can it absorb shocks and adapt, or is it fragile?
                </label>
                <p className="text-xs text-slate-400 mb-3 italic">
                  Low (1) = Fragile, brittle, one disruption could collapse it | High (10) = Antifragile, robust, can absorb major shocks
                </p>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={diagnosticAnswers.resilience}
                    onChange={(e) => setDiagnosticAnswers(prev => ({ ...prev, resilience: parseInt(e.target.value) }))}
                    className="flex-1"
                  />
                  <span className="text-2xl font-bold text-cyan-400 w-12 text-center">{diagnosticAnswers.resilience}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'ANALYSIS':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold font-mono text-slate-100">Your Adaptive Cycle Map</h3>

            {isLoading ? (
              <div className="text-center py-12">
                <Loader size={48} className="animate-spin text-cyan-400 mx-auto mb-4" />
                <p className="text-slate-400">Generating your personalized analysis...</p>
              </div>
            ) : phaseAnalysis ? (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-cyan-900/30 to-slate-900/30 border border-cyan-700/50 rounded-lg p-5">
                  <p className="text-sm text-slate-400 mb-2">Your System:</p>
                  <p className="text-lg font-semibold text-slate-100 mb-4">"{systemToAnalyze}"</p>
                  <p className="text-sm text-slate-400 mb-1">Current Phase:</p>
                  <p className="text-2xl font-bold text-cyan-300">{phaseAnalysis.title}</p>
                </div>

                {renderPhaseQuadrant()}

                <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-5">
                  <h4 className="font-semibold text-slate-200 mb-2 flex items-center gap-2">
                    <Lightbulb size={18} className="text-cyan-400" />
                    What This Means For You
                  </h4>
                  <p className="text-slate-300 text-sm leading-relaxed">{phaseAnalysis.description}</p>
                </div>

                <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-5">
                  <h4 className="font-semibold text-green-300 mb-3 flex items-center gap-2">
                    <TrendingUp size={18} />
                    Strengths of This Phase
                  </h4>
                  <ul className="space-y-2">
                    {phaseAnalysis.strengths.map((strength, idx) => (
                      <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                        <span className="text-green-400 mt-1">✓</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-5">
                  <h4 className="font-semibold text-red-300 mb-3 flex items-center gap-2">
                    <AlertTriangle size={18} />
                    Risks to Watch For
                  </h4>
                  <ul className="space-y-2">
                    {phaseAnalysis.risks.map((risk, idx) => (
                      <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                        <span className="text-red-400 mt-1">⚠</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-5">
                  <h4 className="font-semibold text-blue-300 mb-3 flex items-center gap-2">
                    <Zap size={18} />
                    Strategies for This Phase
                  </h4>
                  <ul className="space-y-3">
                    {phaseAnalysis.strategies.map((strategy, idx) => (
                      <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                        <span className="text-blue-400 font-bold mt-0.5">{idx + 1}.</span>
                        <span>{strategy}</span>
                      </li>
                    ))}
                  </ul>
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
            <h3 className="text-2xl font-bold font-mono text-slate-100">Analysis Complete</h3>
            <p className="text-slate-300">
              Your Adaptive Cycle map has been saved. You can review it anytime in your Intelligence Hub.
            </p>
            <div className="bg-cyan-900/20 border border-cyan-700/50 rounded-lg p-4">
              <p className="text-sm text-cyan-200">
                <strong>Next Steps:</strong> Reflect on the strategies provided and consider which one to implement first.
                The Adaptive Cycle is always moving—revisit this assessment periodically to track your evolution.
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
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        <header className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold font-mono tracking-tight text-cyan-300">Adaptive Cycle Mapper</h2>
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
                {step === 'DIAGNOSTIC' ? 'Diagnose Phase' : step === 'ANALYSIS' ? 'Review & Save' : 'Next'}
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
