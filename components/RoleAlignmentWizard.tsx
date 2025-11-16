import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, Check, Target, TrendingUp, BookOpen, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import {
  generateRoleActionSuggestion,
  generateShadowWorkInsight,
  generateIntegralReflection
} from '../services/geminiService';

import type { RoleAlignmentSession } from '../types.ts';

interface RoleAlignmentWizardProps {
  onClose: () => void;
  onSave?: (session: RoleAlignmentSession) => void | Promise<void>;
  session?: RoleAlignmentSession | null;
  setDraft?: (session: RoleAlignmentSession | null) => void;
  userId?: string;
}

type WizardStep = 'welcome' | 'profile' | 'alignment' | 'summary';

interface Role {
  name: string;
  why: string;
  goal: string;
  valueScore: number;
  valueNote: string;
  shadowNudge?: string;
  action?: string;
}

// Pre-written action suggestions based on score
const ACTION_TEMPLATES = {
  high: [
    "Share one win in your next interaction",
    "Amplify: Celebrate this alignment with someone close",
    "Document what's working to reinforce it",
    "Teach someone else about this aspect of your role",
    "Set a new growth edge within this role"
  ],
  low: [
    "Try a 5-min boundary: Delegate one task tomorrow",
    "Identify one small shift you can make this week",
    "Schedule 10 minutes to reflect on what drains you",
    "Say 'no' to one request that doesn't align",
    "Experiment with doing this role 20% differently"
  ]
};

export default function RoleAlignmentWizard({ onClose, onSave, session, setDraft, userId }: RoleAlignmentWizardProps) {
  const [step, setStep] = useState<WizardStep>('welcome');
  const [sessionId] = useState(() => session?.id || `role-alignment-${Date.now()}`);
  const [roles, setRoles] = useState<Role[]>([
    { name: '', why: '', goal: '', valueScore: 5, valueNote: '' },
    { name: '', why: '', goal: '', valueScore: 5, valueNote: '' },
    { name: '', why: '', goal: '', valueScore: 5, valueNote: '' }
  ]);
  const [currentRoleIndex, setCurrentRoleIndex] = useState(0);
  const [commitToActions, setCommitToActions] = useState<boolean[]>([]);
  const [integralNote, setIntegralNote] = useState('');
  const [isGeneratingAction, setIsGeneratingAction] = useState(false);
  const [isGeneratingShadow, setIsGeneratingShadow] = useState(false);
  const [isGeneratingIntegral, setIsGeneratingIntegral] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiIntegralReflection, setAiIntegralReflection] = useState<{
    integralInsight: string;
    quadrantConnections: string;
    recommendations: string[];
  } | null>(null);

  // Load draft session if it exists
  useEffect(() => {
    if (session) {
      setRoles(session.roles);
      setIntegralNote(session.integralNote || '');
      if (session.aiIntegralReflection) {
        setAiIntegralReflection(session.aiIntegralReflection);
      }
    }
  }, [session]);

  // Auto-save draft as user progresses
  useEffect(() => {
    if (setDraft) {
      const draftSession: RoleAlignmentSession = {
        id: sessionId,
        date: new Date().toISOString(),
        roles,
        integralNote,
        aiIntegralReflection: aiIntegralReflection || undefined
      };
      setDraft(draftSession);
    }
  }, [roles, integralNote, aiIntegralReflection, setDraft, sessionId]);

  const currentRole = roles[currentRoleIndex];
  const activeRoles = roles.filter(r => r.name.trim() !== '');

  const handleRoleUpdate = (index: number, field: keyof Role, value: any) => {
    const updated = [...roles];
    updated[index] = { ...updated[index], [field]: value };
    setRoles(updated);
  };

  const getSuggestion = (score: number): string => {
    const templates = score >= 7 ? ACTION_TEMPLATES.high : ACTION_TEMPLATES.low;
    return templates[Math.floor(Math.random() * templates.length)];
  };

  const handleAlignmentNext = async () => {
    // Auto-suggest action using Gemini if not already set
    if (!currentRole.action) {
      setIsGeneratingAction(true);
      try {
        const aiAction = await generateRoleActionSuggestion(
          currentRole.name,
          currentRole.why || '',
          currentRole.goal || '',
          currentRole.valueScore,
          currentRole.valueNote || '',
          currentRole.shadowNudge
        );
        handleRoleUpdate(currentRoleIndex, 'action', aiAction);
      } catch (error) {
        console.error('Error generating action:', error);
        // Fallback to original template behavior
        handleRoleUpdate(currentRoleIndex, 'action', getSuggestion(currentRole.valueScore));
      } finally {
        setIsGeneratingAction(false);
      }
    }

    if (currentRoleIndex < activeRoles.length - 1) {
      setCurrentRoleIndex(prev => prev + 1);
    } else {
      setStep('summary');
      setCommitToActions(new Array(activeRoles.length).fill(false));
      // Generate integral reflection when entering summary
      generateIntegralAnalysis();
    }
  };

  const generateIntegralAnalysis = async () => {
    setIsGeneratingIntegral(true);
    try {
      const analysis = await generateIntegralReflection(activeRoles);
      setAiIntegralReflection(analysis);
    } catch (error) {
      console.error('Error generating integral reflection:', error);
    } finally {
      setIsGeneratingIntegral(false);
    }
  };

  const handleGenerateShadowInsight = async () => {
    if (!currentRole.name || !currentRole.valueNote) return;

    setIsGeneratingShadow(true);
    try {
      const insight = await generateShadowWorkInsight(
        currentRole.name,
        currentRole.valueScore,
        currentRole.valueNote
      );
      handleRoleUpdate(currentRoleIndex, 'shadowNudge', insight);
    } catch (error) {
      console.error('Error generating shadow insight:', error);
    } finally {
      setIsGeneratingShadow(false);
    }
  };

  const handleAlignmentBack = () => {
    if (currentRoleIndex > 0) {
      setCurrentRoleIndex(prev => prev - 1);
    } else {
      setStep('profile');
    }
  };

  const renderWelcome = () => (
    <div className="space-y-6 py-8">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-gradient-to-br from-neutral-800 to-neutral-700 rounded-full mx-auto flex items-center justify-center">
          <Target size={40} className="text-white" />
        </div>
        <h2 className="text-3xl font-bold text-slate-100">Role Alignment Wizard</h2>
        <p className="text-slate-300 text-lg max-w-2xl mx-auto">
          Align your roles in the world. Discover how your key roles connect to your deeper values and find small shifts to increase harmony.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mt-8">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <Target className="text-orange-400 mb-2" size={24} />
          <h3 className="font-semibold text-slate-100 mb-1">Quick Profile</h3>
          <p className="text-sm text-slate-400">List your key roles (2 min)</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <TrendingUp className="text-pink-400 mb-2" size={24} />
          <h3 className="font-semibold text-slate-100 mb-1">Alignment Check</h3>
          <p className="text-sm text-slate-400">Score each role (5-6 min)</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <BookOpen className="text-neutral-400 mb-2" size={24} />
          <h3 className="font-semibold text-slate-100 mb-1">Action Plan</h3>
          <p className="text-sm text-slate-400">Get personalized next steps (2-3 min)</p>
        </div>
      </div>

      <div className="bg-neutral-900/20 border border-neutral-700/50 rounded-lg p-4 max-w-2xl mx-auto">
        <div className="flex items-start gap-2">
          <AlertCircle size={20} className="text-neutral-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-slate-300">
            <strong>Privacy:</strong> All data stays in-session and is cleared on exit unless you choose to save a snapshot to your journal.
          </div>
        </div>
      </div>

      <div className="text-center mt-8">
        <button
          onClick={() => setStep('profile')}
          className="btn-luminous px-8 py-3 rounded-lg font-semibold text-lg transition inline-flex items-center gap-2"
        >
          Start Role Alignment
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-slate-100">Quick Profile</h2>
        <p className="text-slate-400">List up to 3 key roles you play today. No suggestions needed—keep it personal.</p>
        <p className="text-sm text-slate-500">Examples: Parent, Employee, Neighbor, Friend, Leader, Artist...</p>
      </div>

      <div className="space-y-6">
        {roles.map((role, index) => (
          <div key={index} className="bg-slate-800/50 border border-slate-700 rounded-lg p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Role {index + 1} {index === 0 && <span className="text-red-400">*</span>}
              </label>
              <input
                type="text"
                value={role.name}
                onChange={(e) => handleRoleUpdate(index, 'name', e.target.value)}
                placeholder="e.g., Parent, Employee, Neighbor"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-accent"
              />
            </div>

            {role.name && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Why this role? (one sentence)
                </label>
                <input
                  type="text"
                  value={role.why}
                  onChange={(e) => handleRoleUpdate(index, 'why', e.target.value)}
                  placeholder="e.g., It grounds me in something bigger than myself"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-accent"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-slate-700">
        <button
          onClick={() => setStep('welcome')}
          className="px-6 py-2 rounded-lg font-medium transition inline-flex items-center gap-2 bg-slate-700 text-slate-100 hover:bg-slate-600"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <button
          onClick={() => {
            setStep('alignment');
            setCurrentRoleIndex(0);
          }}
          disabled={!roles[0].name.trim()}
          className={`px-6 py-2 rounded-lg font-medium transition inline-flex items-center gap-2 ${
            roles[0].name.trim()
              ? 'btn-luminous'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          Continue to Alignment Check
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );

  const renderAlignment = () => {
    const roleData = activeRoles[currentRoleIndex];
    if (!roleData) return null;

    return (
      <div className="space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-slate-400">
            <span>{roleData.name}</span>
            <span>Role {currentRoleIndex + 1} of {activeRoles.length}</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-neutral-800 to-neutral-700 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentRoleIndex + 1) / activeRoles.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-orange-900/20 border border-orange-700/50 rounded-lg p-4">
            <h3 className="text-lg font-bold text-slate-100 mb-2">Exploring: {roleData.name}</h3>
            {roleData.why && <p className="text-sm text-slate-400 italic">"{roleData.why}"</p>}
          </div>

          {/* Core goal */}
          <div>
            <label className="block text-lg font-semibold text-slate-100 mb-3">
              What's the core goal of this role?
            </label>
            <input
              type="text"
              value={roleData.goal}
              onChange={(e) => handleRoleUpdate(currentRoleIndex, 'goal', e.target.value)}
              placeholder="e.g., Support family growth, Contribute to team success..."
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-accent"
            />
          </div>

          {/* Value alignment slider */}
          <div className="space-y-4">
            <label className="block text-lg font-semibold text-slate-100">
              Value fit: How aligned is this with your deeper values?
            </label>
            <div className="space-y-4">
              <input
                type="range"
                min="1"
                max="10"
                value={roleData.valueScore}
                onChange={(e) => handleRoleUpdate(currentRoleIndex, 'valueScore', parseInt(e.target.value))}
                className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-accent"
              />
              <div className="flex justify-between text-sm">
                <span className="text-red-400">1 - Total mismatch</span>
                <span className="text-accent font-bold text-2xl">{roleData.valueScore}</span>
                <span className="text-green-400">10 - Perfect harmony</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Why that number?
              </label>
              <input
                type="text"
                value={roleData.valueNote}
                onChange={(e) => handleRoleUpdate(currentRoleIndex, 'valueNote', e.target.value)}
                placeholder="One sentence about this score..."
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Shadow nudge for low scores */}
          {roleData.valueScore < 5 && (
            <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-amber-300 flex items-center gap-2">
                  <AlertCircle size={18} />
                  Shadow Work Opportunity
                </h4>
                <button
                  onClick={handleGenerateShadowInsight}
                  disabled={isGeneratingShadow || !roleData.valueNote}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition bg-amber-700/30 hover:bg-amber-700/50 text-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingShadow ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      AI Insight
                    </>
                  )}
                </button>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  What feels off? What small shift could help?
                </label>
                <input
                  type="text"
                  value={roleData.shadowNudge || ''}
                  onChange={(e) => handleRoleUpdate(currentRoleIndex, 'shadowNudge', e.target.value)}
                  placeholder="e.g., It drains my energy. Try setting clearer boundaries."
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-accent"
                />
                <p className="text-xs text-slate-500 mt-1">Click "AI Insight" for a personalized suggestion</p>
              </div>
            </div>
          )}

          {/* Suggested action */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-slate-100">Suggested Action</h4>
            <div>
              <input
                type="text"
                value={roleData.action || getSuggestion(roleData.valueScore)}
                onChange={(e) => handleRoleUpdate(currentRoleIndex, 'action', e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-accent"
              />
              <p className="text-xs text-slate-500 mt-2">Feel free to edit this action to make it your own</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-700">
          <button
            onClick={handleAlignmentBack}
            className="px-6 py-2 rounded-lg font-medium transition inline-flex items-center gap-2 bg-slate-700 text-slate-100 hover:bg-slate-600"
          >
            <ArrowLeft size={20} />
            Back
          </button>

          <button
            onClick={handleAlignmentNext}
            disabled={!roleData.goal || !roleData.valueNote || isGeneratingAction}
            className={`px-6 py-2 rounded-lg font-medium transition inline-flex items-center gap-2 ${
              roleData.goal && roleData.valueNote && !isGeneratingAction
                ? 'btn-luminous'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isGeneratingAction ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                {currentRoleIndex === activeRoles.length - 1 ? 'View Summary' : 'Next Role'}
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  const renderSummary = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-gradient-to-br from-neutral-800 to-neutral-700 rounded-full mx-auto flex items-center justify-center">
          <Check size={32} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-100">Your Its Alignment Card</h2>
        <p className="text-slate-400">Review your roles and commit to your next steps</p>
      </div>

      {/* Role summary cards */}
      <div className="space-y-4">
        {activeRoles.map((role, index) => (
          <div key={index} className="bg-slate-800/50 border border-slate-700 rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-100">{role.name}</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                role.valueScore >= 7 ? 'bg-green-900/40 text-green-400' :
                role.valueScore >= 5 ? 'bg-yellow-900/40 text-yellow-400' :
                'bg-red-900/40 text-red-400'
              }`}>
                {role.valueScore}/10 fit
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <span className="text-slate-400">Goal:</span>{' '}
                <span className="text-slate-200">{role.goal}</span>
              </div>
              <div>
                <span className="text-slate-400">Why this score:</span>{' '}
                <span className="text-slate-200">{role.valueNote}</span>
              </div>
              {role.shadowNudge && (
                <div className="bg-amber-900/20 border border-amber-700/50 rounded px-3 py-2">
                  <span className="text-slate-400">Shadow note:</span>{' '}
                  <span className="text-slate-200">{role.shadowNudge}</span>
                </div>
              )}
              <div className="bg-accent/10 border border-accent/30 rounded px-3 py-2">
                <span className="text-slate-400">Action:</span>{' '}
                <span className="text-slate-200">{role.action}</span>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={commitToActions[index] || false}
                  onChange={(e) => {
                    const updated = [...commitToActions];
                    updated[index] = e.target.checked;
                    setCommitToActions(updated);
                  }}
                  className="w-4 h-4 accent-accent cursor-pointer"
                />
                <span className="text-sm text-slate-300">Commit to this action (remind me tomorrow)</span>
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* AI-Powered Integral Reflection */}
      {isGeneratingIntegral && (
        <div className="bg-neutral-900/20 border border-neutral-700/50 rounded-lg p-5 flex items-center justify-center gap-3">
          <Loader2 size={24} className="animate-spin text-neutral-400" />
          <span className="text-slate-300">Generating integral insights...</span>
        </div>
      )}

      {aiIntegralReflection && !isGeneratingIntegral && (
        <div className="bg-neutral-900/20 border border-neutral-700/50 rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="text-neutral-400" size={20} />
            <h3 className="text-lg font-bold text-slate-100">AI Integral Analysis</h3>
          </div>

          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold text-neutral-300 mb-1">Pattern Insight</h4>
              <p className="text-sm text-slate-300">{aiIntegralReflection.integralInsight}</p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-neutral-300 mb-1">Quadrant Connections (I, We, It)</h4>
              <p className="text-sm text-slate-300">{aiIntegralReflection.quadrantConnections}</p>
            </div>

            {aiIntegralReflection.recommendations.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-neutral-300 mb-2">Recommendations</h4>
                <ul className="space-y-1">
                  {aiIntegralReflection.recommendations.map((rec, i) => (
                    <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                      <span className="text-neutral-400 mt-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* User's Personal Reflection */}
      <div className="bg-neutral-900/20 border border-neutral-700/50 rounded-lg p-5 space-y-3">
        <h3 className="text-lg font-bold text-slate-100">Your Personal Reflection</h3>
        <p className="text-sm text-slate-400">
          How does this connect to your inner world (I) or relationships (We)? Add your own insights.
        </p>
        <textarea
          value={integralNote}
          onChange={(e) => setIntegralNote(e.target.value)}
          placeholder="e.g., My Parent role connects to my inner need for nurturing (I) and deepens my family bonds (We)..."
          rows={3}
          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-accent resize-none"
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={async () => {
            setIsSaving(true);
            try {
              const completedSession: RoleAlignmentSession = {
                id: sessionId,
                date: new Date().toISOString(),
                roles: activeRoles,
                integralNote,
                aiIntegralReflection: aiIntegralReflection || undefined
              };

              if (onSave) {
                await onSave(completedSession);
              }
              onClose();
            } catch (error) {
              console.error('Error saving Role Alignment session:', error);
              alert('Failed to save session. Please try again.');
            } finally {
              setIsSaving(false);
            }
          }}
          disabled={isSaving}
          className="flex-1 btn-luminous px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Saving...
            </>
          ) : (
            'Save & Complete'
          )}
        </button>
        <button
          onClick={onClose}
          className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-100 px-6 py-3 rounded-lg font-semibold transition"
        >
          Cancel
        </button>
      </div>

      <div className="text-center">
        <button
          onClick={() => {
            setStep('welcome');
            setRoles([
              { name: '', why: '', goal: '', valueScore: 5, valueNote: '' },
              { name: '', why: '', goal: '', valueScore: 5, valueNote: '' },
              { name: '', why: '', goal: '', valueScore: 5, valueNote: '' }
            ]);
            setCurrentRoleIndex(0);
            setCommitToActions([]);
            setIntegralNote('');
            setAiIntegralReflection(null);
            setIsGeneratingAction(false);
            setIsGeneratingShadow(false);
            setIsGeneratingIntegral(false);
          }}
          className="text-slate-400 hover:text-slate-200 transition text-sm"
        >
          Start over with new roles
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target size={28} className="text-accent" />
              <h1 className="text-2xl font-bold text-slate-100">
                {step === 'welcome' && 'Role Alignment Wizard'}
                {step === 'profile' && 'Quick Profile'}
                {step === 'alignment' && 'Alignment Check'}
                {step === 'summary' && 'Your Alignment Card'}
              </h1>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition">
              <X size={24} className="text-slate-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'welcome' && renderWelcome()}
          {step === 'profile' && renderProfile()}
          {step === 'alignment' && renderAlignment()}
          {step === 'summary' && renderSummary()}
        </div>
      </div>
    </div>
  );
}
