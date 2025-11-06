import React, { useState, useEffect } from 'react';
import {
  KeganAssessmentSession,
  KeganAssessmentStep,
  KeganResponse,
  KeganPrompt,
  KeganDomain
} from '../types.ts';
import { X, ArrowLeft, ArrowRight, Sparkles, Brain, Users, Target, MessageSquare, User, Download } from 'lucide-react';
import * as geminiService from '../services/geminiService.ts';

interface KeganAssessmentWizardProps {
  onClose: () => void;
  onSave: (session: KeganAssessmentSession) => void;
  session: KeganAssessmentSession | null;
  setDraft: (session: KeganAssessmentSession | null) => void;
}

// Research-validated prompts based on Kegan & Lahey's work and the Subject-Object Interview
const KEGAN_PROMPTS: KeganPrompt[] = [
  // RELATIONSHIPS
  {
    id: 'rel-1',
    domain: 'Relationships',
    prompt: 'Describe a recent conflict or disagreement with someone important to you. What made it difficult?',
    instruction: 'Focus on how you experienced the conflict internally, not just what happened. What felt at stake for you?',
    stage3Indicator: 'Focus on preserving harmony, fear of disapproval, worry about what others think, feeling like "I am the relationship"',
    stage4Indicator: 'Focus on boundaries, your own principles being violated, maintaining integrity while negotiating, "I have relationships"',
    stage5Indicator: 'Awareness of multiple valid perspectives, seeing your own ideology as partial, comfort with paradox and incompleteness'
  },
  {
    id: 'rel-2',
    domain: 'Relationships',
    prompt: 'When someone you respect criticizes you, what goes through your mind? How do you typically respond?',
    instruction: 'Be honest about your internal experience, not what you think you "should" feel.',
    stage3Indicator: 'Devastated, identity threatened, need to repair relationship immediately, can\'t separate criticism from self-worth',
    stage4Indicator: 'Can evaluate if criticism is valid, defend principles, might feel annoyed but not threatened, "that\'s their perspective"',
    stage5Indicator: 'Curious about what\'s generating their view, see criticism as information about the system, grateful for seeing blind spots'
  },
  // WORK & PURPOSE
  {
    id: 'work-1',
    domain: 'Work & Purpose',
    prompt: 'How do you know if you\'re doing meaningful work? What tells you your work matters?',
    instruction: 'What\'s your actual experience, not what you wish it was.',
    stage3Indicator: 'Others\' approval, recognition, being valued by team/boss, fulfilling role expectations, "they need me"',
    stage4Indicator: 'Alignment with internal values/goals, measurable impact on chosen mission, self-defined standards of excellence',
    stage5Indicator: 'Awareness that "meaningfulness" is constructed, multiple valid frames, comfort with work serving different purposes'
  },
  {
    id: 'work-2',
    domain: 'Work & Purpose',
    prompt: 'Imagine your current role or career path is no longer an option. How would you experience that?',
    instruction: 'What would be hardest about this loss? What does this tell you about your relationship to your work?',
    stage3Indicator: 'Loss of identity, "I don\'t know who I\'d be," social identity crisis, fear of disappointing others',
    stage4Indicator: 'Loss of progress toward goals, need to rebuild strategic plan, frustration but would adapt with new direction',
    stage5Indicator: 'Recognition that identity transcends roles, opportunity to question assumptions, awareness of attachment to "career self"'
  },
  // VALUES & BELIEFS
  {
    id: 'values-1',
    domain: 'Values & Beliefs',
    prompt: 'Describe a core value or belief that\'s important to you. How did you come to hold this value?',
    instruction: 'Trace the origin. Did you choose it or absorb it? Could you change it?',
    stage3Indicator: 'Absorbed from important others, community, culture; difficulty imagining not holding it; "it\'s just right"',
    stage4Indicator: 'Examined and chosen, can articulate why, aware others disagree, consciously authored, "I decided this matters"',
    stage5Indicator: 'Awareness the value serves a purpose in a context, can see it as historically/culturally embedded, holds it lightly'
  },
  {
    id: 'values-2',
    domain: 'Values & Beliefs',
    prompt: 'Think of a time when two of your deeply held values came into conflict. How did you resolve it?',
    instruction: 'What was that experience like? Could you hold both as valid?',
    stage3Indicator: 'Confused, paralyzed, looked to others for "right answer," felt torn between loyalties',
    stage4Indicator: 'Analyzed priorities, made conscious choice based on hierarchy of values, possibly felt loss but had clarity',
    stage5Indicator: 'Comfortable holding paradox, both/and thinking, saw conflict as revealing limits of value system itself'
  },
  // CONFLICT & FEEDBACK
  {
    id: 'conflict-1',
    domain: 'Conflict & Feedback',
    prompt: 'When you receive feedback that challenges your self-image, what happens internally?',
    instruction: 'Be specific. What sensations, thoughts, emotions arise? How long does it take to process?',
    stage3Indicator: 'Self-image feels threatened, defensive, need to explain/justify, seek reassurance, questioning whole self',
    stage4Indicator: 'Can hear it as data, evaluate validity against internal standards, minor identity threat, recover fairly quickly',
    stage5Indicator: 'Curious about gap between self-image and feedback, question the "self-image" itself, meta-awareness of ego defending'
  },
  {
    id: 'conflict-2',
    domain: 'Conflict & Feedback',
    prompt: 'Describe a situation where you had to stand against group consensus. What was most difficult about it?',
    instruction: 'Not whether you did it, but what internal experience it produced.',
    stage3Indicator: 'Terrifying, felt like betrayal, worried about exclusion, needed validation afterward, "maybe I\'m wrong"',
    stage4Indicator: 'Difficult but manageable, believed in position, maintained conviction despite pressure, lonely but clear',
    stage5Indicator: 'Aware of social construction of "consensus," curious about own need to dissent, holds position without attachment'
  },
  // IDENTITY & SELF
  {
    id: 'identity-1',
    domain: 'Identity & Self',
    prompt: 'Complete this sentence in at least 3-4 different ways: "I am..."',
    instruction: 'After each one, ask: Is this something I HAVE (can observe) or something I AM (can\'t separate from)?',
    stage3Indicator: 'Mostly roles and relationships, "I am a mother/teacher/friend," difficulty separating from identifications',
    stage4Indicator: 'Mix of roles (have) and values/characteristics (am), some awareness of difference, "I am someone who values..."',
    stage5Indicator: 'Aware that all descriptions are partial, resistance to fixed identity, "I am a process," meta-awareness of constructing self'
  },
  {
    id: 'identity-2',
    domain: 'Identity & Self',
    prompt: 'What would you lose if you changed fundamentally as a person? What would that cost you?',
    instruction: 'Imagine becoming quite different. What feels impossible to lose?',
    stage3Indicator: 'Everything, can\'t imagine it, "I\'d lose myself," relationships would collapse, no continuity of self',
    stage4Indicator: 'Might lose some goals/plans, but core authorship remains, could rebuild identity around different values',
    stage5Indicator: 'Recognition that self is always changing, attachment to continuity is the issue, loss is inherent in transformation'
  }
];

const STEPS: KeganAssessmentStep[] = [
  'INTRODUCTION',
  'RELATIONSHIPS',
  'WORK_PURPOSE',
  'VALUES_BELIEFS',
  'CONFLICT_FEEDBACK',
  'IDENTITY_SELF',
  'ANALYSIS',
  'RESULTS',
  'REFLECTION'
];

const domainIcons = {
  'Relationships': Users,
  'Work & Purpose': Target,
  'Values & Beliefs': Brain,
  'Conflict & Feedback': MessageSquare,
  'Identity & Self': User
};

export default function KeganAssessmentWizard({ onClose, onSave, session: draft, setDraft }: KeganAssessmentWizardProps) {
  const [session, setSession] = useState<KeganAssessmentSession>(draft || {
    id: `kegan-${Date.now()}`,
    date: new Date().toISOString(),
    responses: []
  });

  const [currentStep, setCurrentStep] = useState<KeganAssessmentStep>('INTRODUCTION');
  const [currentResponse, setCurrentResponse] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => { if (draft) setSession(draft); }, [draft]);

  const handleSaveDraftAndClose = () => { setDraft(session); onClose(); };

  const getCurrentDomain = (): KeganDomain | null => {
    const domainMap: Record<string, KeganDomain> = {
      'RELATIONSHIPS': 'Relationships',
      'WORK_PURPOSE': 'Work & Purpose',
      'VALUES_BELIEFS': 'Values & Beliefs',
      'CONFLICT_FEEDBACK': 'Conflict & Feedback',
      'IDENTITY_SELF': 'Identity & Self'
    };
    return domainMap[currentStep] || null;
  };

  const getCurrentPrompts = (): KeganPrompt[] => {
    const domain = getCurrentDomain();
    return domain ? KEGAN_PROMPTS.filter(p => p.domain === domain) : [];
  };

  const getCurrentPromptIndex = (): number => {
    const domain = getCurrentDomain();
    if (!domain) return 0;
    const domainResponses = session.responses.filter(r => r.domain === domain);
    return domainResponses.length;
  };

  const currentPrompts = getCurrentPrompts();
  const currentPromptIndex = getCurrentPromptIndex();
  const currentPrompt = currentPrompts[currentPromptIndex];

  const canProceedToNext = () => {
    if (isAnalyzing) return false;
    if (['RELATIONSHIPS', 'WORK_PURPOSE', 'VALUES_BELIEFS', 'CONFLICT_FEEDBACK', 'IDENTITY_SELF'].includes(currentStep)) {
      return currentResponse.trim().length > 30;
    }
    return true;
  };

  const handleNext = async () => {
    // Save current response if in a prompt step
    if (currentPrompt && currentResponse.trim()) {
      const newResponse: KeganResponse = {
        promptId: currentPrompt.id,
        domain: currentPrompt.domain,
        response: currentResponse.trim()
      };

      setSession(prev => ({
        ...prev,
        responses: [...prev.responses, newResponse]
      }));

      setCurrentResponse('');
    }

    // Check if we need to move to next domain or analysis
    const domain = getCurrentDomain();
    if (domain) {
      const domainResponses = session.responses.filter(r => r.domain === domain);
      const totalDomainPrompts = KEGAN_PROMPTS.filter(p => p.domain === domain).length;

      // If we've answered all prompts in this domain, move to next step
      if (domainResponses.length + 1 >= totalDomainPrompts) {
        const currentStepIndex = STEPS.indexOf(currentStep);
        setCurrentStep(STEPS[currentStepIndex + 1]);
        return;
      }
    } else {
      // Non-prompt steps
      if (currentStep === 'INTRODUCTION') {
        setCurrentStep('RELATIONSHIPS');
      } else if (currentStep === 'IDENTITY_SELF') {
        setCurrentStep('ANALYSIS');
        await performAnalysis();
      } else if (currentStep === 'ANALYSIS') {
        setCurrentStep('RESULTS');
      } else if (currentStep === 'RESULTS') {
        setCurrentStep('REFLECTION');
      } else if (currentStep === 'REFLECTION') {
        onSave(session);
      }
    }
  };

  const performAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const interpretation = await geminiService.analyzeKeganStage(session.responses);
      setSession(prev => ({
        ...prev,
        overallInterpretation: interpretation
      }));
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBack = () => {
    const currentStepIndex = STEPS.indexOf(currentStep);
    if (currentStepIndex > 0) {
      setCurrentStep(STEPS[currentStepIndex - 1]);
    }
  };

  const handleDownload = () => {
    const content = `# Kegan Developmental Stage Assessment
Date: ${new Date(session.date).toLocaleDateString()}

## Your Responses

${session.responses.map(r => `### ${r.domain}
**Prompt:** ${KEGAN_PROMPTS.find(p => p.promptId === r.promptId)?.prompt}
**Response:** ${r.response}
`).join('\n')}

## Interpretation

${session.overallInterpretation ? `
**Center of Gravity:** ${session.overallInterpretation.centerOfGravity}
**Confidence:** ${session.overallInterpretation.confidence}

**Full Analysis:**
${session.overallInterpretation.fullAnalysis}

**Developmental Edge:**
${session.overallInterpretation.developmentalEdge}

**Recommendations:**
${session.overallInterpretation.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}
` : 'Analysis pending'}

## Your Reflection
${session.selfReflection || 'Not yet completed'}
`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kegan-assessment-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
  };

  const renderIntroduction = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-4">
        <Brain size={64} className="mx-auto text-accent" />
        <h2 className="text-3xl font-bold text-slate-100">Kegan Developmental Stage Assessment</h2>
        <p className="text-slate-300 max-w-2xl mx-auto leading-relaxed">
          This assessment explores your "center of gravity" across Robert Kegan's stages of adult development:
          the Socialized Mind, Self-Authoring Mind, and Self-Transforming Mind.
        </p>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 space-y-4">
        <h3 className="text-xl font-bold text-slate-100">The Three Stages</h3>

        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="font-bold text-blue-300">Socialized Mind (Stage 3)</h4>
            <p className="text-sm text-slate-300 mt-1">
              You are shaped by the expectations and judgments of your environment. Your sense of self is embedded in relationships.
              Approval, disapproval, and interpersonal conflict directly affect your identity. You cannot fully step back from
              your relationships to examine them objectively.
            </p>
            <p className="text-xs text-slate-400 mt-2 italic">
              Subject to: relationships, others' expectations, social roles<br/>
              Object: impulses, needs, perceptions
            </p>
          </div>

          <div className="border-l-4 border-purple-500 pl-4">
            <h4 className="font-bold text-purple-300">Self-Authoring Mind (Stage 4)</h4>
            <p className="text-sm text-slate-300 mt-1">
              You have your own internal compass, ideology, and values. You can step back from relationships and social
              expectations to make your own judgments. You create your identity and take responsibility for it. However,
              you may be unable to see your own ideology as partial or limited.
            </p>
            <p className="text-xs text-slate-400 mt-2 italic">
              Subject to: your ideology, internal system, identity<br/>
              Object: relationships, expectations, social roles
            </p>
          </div>

          <div className="border-l-4 border-amber-500 pl-4">
            <h4 className="font-bold text-amber-300">Self-Transforming Mind (Stage 5)</h4>
            <p className="text-sm text-slate-300 mt-1">
              You can step back from your own ideology and identity to see them as partial and incomplete. You can hold
              contradictions, multiple perspectives, and paradoxes without needing to resolve them. You recognize that
              all systems (including your own) are constructions and remain open to ongoing transformation.
            </p>
            <p className="text-xs text-slate-400 mt-2 italic">
              Subject to: dialectical process, transformation itself<br/>
              Object: ideology, identity, authorship
            </p>
          </div>
        </div>
      </div>

      <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-4">
        <h4 className="font-bold text-amber-300 flex items-center gap-2 mb-2">
          <Sparkles size={18} />
          Important Notes
        </h4>
        <ul className="text-sm text-slate-300 space-y-2">
          <li>• Later stages are not "better" - they're more complex and come with their own challenges</li>
          <li>• Most people are in transition between stages, not cleanly "at" one stage</li>
          <li>• You may show different stages in different life domains</li>
          <li>• This is descriptive, not prescriptive - development can't be forced</li>
          <li>• Answer honestly from your actual experience, not how you think you "should" be</li>
        </ul>
      </div>

      <p className="text-slate-400 text-center text-sm">
        You'll be asked 10 questions across 5 domains. Take your time and be honest.
        Your answers will be analyzed to identify your developmental center of gravity.
      </p>
    </div>
  );

  const renderPromptStep = () => {
    if (!currentPrompt) return null;

    const Icon = domainIcons[currentPrompt.domain];
    const domainResponses = session.responses.filter(r => r.domain === currentPrompt.domain);
    const totalDomainPrompts = KEGAN_PROMPTS.filter(p => p.domain === currentPrompt.domain).length;

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Icon size={32} className="text-accent" />
          <div>
            <h2 className="text-2xl font-bold text-slate-100">{currentPrompt.domain}</h2>
            <p className="text-sm text-slate-400">
              Question {domainResponses.length + 1} of {totalDomainPrompts}
            </p>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">{currentPrompt.prompt}</h3>
            <p className="text-sm text-slate-400 italic">{currentPrompt.instruction}</p>
          </div>

          <textarea
            value={currentResponse}
            onChange={(e) => setCurrentResponse(e.target.value)}
            className="w-full h-48 bg-slate-900/50 border border-slate-700 rounded-lg p-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/50"
            placeholder="Take your time. Write at least a few sentences about your actual experience..."
          />

          <p className="text-xs text-slate-500">
            Minimum 30 characters. Current: {currentResponse.length}
          </p>
        </div>

        <details className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
          <summary className="text-sm font-semibold text-blue-300 cursor-pointer">
            What to look for in your response (for educational purposes)
          </summary>
          <div className="mt-3 space-y-2 text-xs text-slate-300">
            <p><strong className="text-blue-300">Socialized Mind signs:</strong> {currentPrompt.stage3Indicator}</p>
            <p><strong className="text-purple-300">Self-Authoring signs:</strong> {currentPrompt.stage4Indicator}</p>
            <p><strong className="text-amber-300">Self-Transforming signs:</strong> {currentPrompt.stage5Indicator}</p>
          </div>
        </details>
      </div>
    );
  };

  const renderAnalysis = () => (
    <div className="space-y-6 animate-fade-in text-center">
      <Sparkles size={64} className="mx-auto text-accent animate-pulse" />
      <h2 className="text-3xl font-bold text-slate-100">Analyzing Your Responses</h2>
      <p className="text-slate-300 max-w-2xl mx-auto">
        The AI is examining your responses for patterns in meaning-making structure, what appears to be
        subject (embedded in) vs. object (can observe), and developmental center of gravity...
      </p>
      <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
    </div>
  );

  const renderResults = () => {
    if (!session.overallInterpretation) return null;

    const { centerOfGravity, confidence, domainVariation, developmentalEdge, recommendations, fullAnalysis } = session.overallInterpretation;

    const stageColors = {
      'Socialized Mind': 'text-blue-300',
      'Socialized/Self-Authoring Transition': 'text-blue-300',
      'Self-Authoring Mind': 'text-purple-300',
      'Self-Authoring/Self-Transforming Transition': 'text-purple-300',
      'Self-Transforming Mind': 'text-amber-300'
    };

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-100 mb-2">Your Developmental Profile</h2>
          <p className="text-slate-400">Based on your responses</p>
        </div>

        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-accent/30 rounded-lg p-8 text-center">
          <p className="text-sm text-slate-400 mb-2">Center of Gravity</p>
          <h3 className={`text-4xl font-bold mb-3 ${stageColors[centerOfGravity]}`}>
            {centerOfGravity}
          </h3>
          <p className="text-sm text-slate-400">Confidence: {confidence}</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 space-y-4">
          <h3 className="text-xl font-bold text-slate-100">Full Analysis</h3>
          <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{fullAnalysis}</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 space-y-4">
          <h3 className="text-xl font-bold text-slate-100">Domain Variation</h3>
          <p className="text-sm text-slate-400 mb-4">
            You may show different stages in different life areas. This is normal.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(domainVariation).map(([domain, stage]) => {
              const Icon = domainIcons[domain as KeganDomain];
              return (
                <div key={domain} className="bg-slate-900/50 rounded-lg p-4 flex items-center gap-3">
                  <Icon size={24} className="text-accent flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-200">{domain}</p>
                    <p className={`text-xs ${stageColors[stage]}`}>{stage}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 space-y-4">
          <h3 className="text-xl font-bold text-slate-100">Your Developmental Edge</h3>
          <p className="text-slate-300 leading-relaxed">{developmentalEdge}</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 space-y-4">
          <h3 className="text-xl font-bold text-slate-100">Recommendations</h3>
          <ul className="space-y-3">
            {recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="text-accent font-bold mt-0.5">{idx + 1}.</span>
                <span className="text-slate-300">{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-4">
          <p className="text-sm text-slate-300">
            <strong className="text-amber-300">Remember:</strong> This is an AI-assisted assessment, not a formal Subject-Object Interview.
            For a validated assessment, work with a trained developmental psychologist. Use these insights as a starting point
            for self-reflection and growth.
          </p>
        </div>
      </div>
    );
  };

  const renderReflection = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-100 mb-2">Reflection</h2>
        <p className="text-slate-400">What do you make of these results?</p>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-slate-100">Optional: Reflect on your assessment</h3>
        <p className="text-sm text-slate-400">
          After seeing your results, what resonates? What surprises you? What questions does this raise?
        </p>
        <textarea
          value={session.selfReflection || ''}
          onChange={(e) => setSession(prev => ({ ...prev, selfReflection: e.target.value }))}
          className="w-full h-32 bg-slate-900/50 border border-slate-700 rounded-lg p-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/50"
          placeholder="Your reflections (optional)..."
        />
      </div>

      <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
        <h4 className="font-semibold text-blue-300 mb-2">Next Steps</h4>
        <ul className="text-sm text-slate-300 space-y-2">
          <li>• Review the Subject-Object Explorer tool to work with specific patterns</li>
          <li>• Consider practices that support developmental growth (meditation, therapy, shadow work)</li>
          <li>• Retake this assessment in 6-12 months to track changes</li>
          <li>• Discuss results with a therapist, coach, or developmental guide</li>
        </ul>
      </div>
    </div>
  );

  const stepIndex = STEPS.indexOf(currentStep);
  const progress = ((stepIndex) / (STEPS.length - 1)) * 100;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-6 z-10">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-slate-100">Kegan Stage Assessment</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="p-2 hover:bg-slate-800 rounded-lg transition"
                title="Download Report"
              >
                <Download size={20} className="text-slate-400" />
              </button>
              <button
                onClick={handleSaveDraftAndClose}
                className="p-2 hover:bg-slate-800 rounded-lg transition"
                title="Save Draft & Close"
              >
                <X size={24} className="text-slate-400" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div
              className="bg-accent rounded-full h-2 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">
            Step {stepIndex + 1} of {STEPS.length}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentStep === 'INTRODUCTION' && renderIntroduction()}
          {['RELATIONSHIPS', 'WORK_PURPOSE', 'VALUES_BELIEFS', 'CONFLICT_FEEDBACK', 'IDENTITY_SELF'].includes(currentStep) && renderPromptStep()}
          {currentStep === 'ANALYSIS' && renderAnalysis()}
          {currentStep === 'RESULTS' && renderResults()}
          {currentStep === 'REFLECTION' && renderReflection()}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-900 border-t border-slate-700 p-6 flex justify-between">
          <button
            onClick={handleBack}
            disabled={stepIndex === 0}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <ArrowLeft size={20} />
            Back
          </button>

          <button
            onClick={handleNext}
            disabled={!canProceedToNext()}
            className="flex items-center gap-2 px-6 py-2 btn-luminous rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {currentStep === 'REFLECTION' ? 'Complete' : 'Next'}
            {currentStep !== 'REFLECTION' && <ArrowRight size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}
