import React, { useState, useEffect } from 'react';
import { AttachmentAssessmentSession } from '../types.ts';
import { attachmentQuestions, calculateAttachmentScores, determineAttachmentStyle, getScoreLabel } from '../data/attachmentAssessment.ts';
import { X, ChevronLeft, ChevronRight, Heart } from 'lucide-react';

interface AttachmentAssessmentWizardProps {
  onClose: () => void;
  onComplete: (session: AttachmentAssessmentSession) => void;
}

type WizardStep = 'intro' | 'questions' | 'results';

export default function AttachmentAssessmentWizard({ onClose, onComplete }: AttachmentAssessmentWizardProps) {
  const [step, setStep] = useState<WizardStep>('intro');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  useEffect(() => {
    console.log('AttachmentAssessmentWizard mounted, step:', step);
  }, [step]);

  const totalQuestions = attachmentQuestions.length;
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  console.log('Rendering AttachmentAssessmentWizard with step:', step);

  const handleAnswer = (score: number) => {
    const questionId = attachmentQuestions[currentQuestion].id;
    setAnswers(prev => ({ ...prev, [questionId]: score }));

    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // Complete assessment
      completeAssessment();
    }
  };

  const completeAssessment = () => {
    const scores = calculateAttachmentScores(answers);
    const result = determineAttachmentStyle(scores);

    const session: AttachmentAssessmentSession = {
      id: `attachment-${Date.now()}`,
      date: new Date().toISOString(),
      answers,
      scores,
      style: result.style,
      description: result.description,
    };

    onComplete(session);
    setStep('results');
  };

  if (step === 'intro') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-2xl w-full p-8 space-y-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <Heart className="text-red-500" size={32} />
              <h1 className="text-3xl font-bold text-slate-100">Attachment Assessment</h1>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4 text-slate-300">
            <p>
              This 30-question assessment helps you understand your attachment patterns in relationships.
              Attachment theory describes how we connect, seek support, and manage emotions with romantic partners.
            </p>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-slate-100">What you'll discover:</h3>
              <ul className="space-y-2 text-sm">
                <li>✓ Your primary attachment style (Secure, Anxious, Avoidant, or Fearful)</li>
                <li>✓ Your anxiety and avoidance scores</li>
                <li>✓ Personalized practices to support your attachment healing</li>
                <li>✓ Insights into your relational patterns</li>
              </ul>
            </div>

            <p className="text-sm text-slate-400">
              Takes about 5-7 minutes. Answer based on how you typically feel in romantic relationships.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 hover:border-slate-600 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => setStep('questions')}
              className="flex-1 px-4 py-2 bg-accent text-slate-900 rounded-lg font-semibold hover:bg-accent/90 transition"
            >
              Start Assessment
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'questions') {
    const question = attachmentQuestions[currentQuestion];

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-2xl w-full p-8 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="text-sm text-slate-400">
              Question {currentQuestion + 1} of {totalQuestions}
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
              <X size={24} />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div className="bg-accent h-full transition-all" style={{ width: `${progress}%` }} />
          </div>

          {/* Question */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-100 leading-relaxed">
              {question.question}
            </h2>

            {/* Response Scale */}
            <div className="space-y-3">
              <div className="flex justify-between text-xs text-slate-400 px-1">
                <span>Strongly Disagree</span>
                <span>Neutral</span>
                <span>Strongly Agree</span>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {[1, 2, 3, 4, 5, 6, 7].map(score => (
                  <button
                    key={score}
                    onClick={() => handleAnswer(score)}
                    className={`py-3 rounded-lg font-semibold text-sm transition-all ${
                      answers[question.id] === score
                        ? 'bg-accent text-slate-900 shadow-lg'
                        : 'bg-slate-800 border border-slate-700 text-slate-300 hover:border-accent/50'
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            <button
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 hover:border-slate-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ChevronLeft size={18} /> Back
            </button>

            <div className="flex-1" />

            {answers[question.id] && (
              <button
                onClick={() => handleAnswer(answers[question.id])}
                className="px-6 py-2 bg-accent text-slate-900 rounded-lg font-semibold hover:bg-accent/90 transition flex items-center gap-2"
              >
                {currentQuestion === totalQuestions - 1 ? 'Complete' : 'Next'} <ChevronRight size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'results') {
    const scores = calculateAttachmentScores(answers);
    const result = determineAttachmentStyle(scores);

    const styleColors = {
      secure: 'from-green-900 to-emerald-900',
      anxious: 'from-orange-900 to-yellow-900',
      avoidant: 'from-blue-900 to-cyan-900',
      fearful: 'from-red-900 to-pink-900',
    };

    const styleEmojis = {
      secure: '🌱',
      anxious: '🌊',
      avoidant: '🏔️',
      fearful: '⛈️',
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-2xl w-full p-8 space-y-6 max-h-[90vh] overflow-y-auto">
          {/* Close Button */}
          <div className="flex justify-end">
            <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
              <X size={24} />
            </button>
          </div>

          {/* Results Header */}
          <div className={`bg-gradient-to-br ${styleColors[result.style]} rounded-lg p-6 text-center space-y-3`}>
            <div className="text-5xl">{styleEmojis[result.style]}</div>
            <h2 className="text-3xl font-bold text-slate-100">
              {result.style === 'secure' && 'Secure Attachment'}
              {result.style === 'anxious' && 'Anxious-Preoccupied'}
              {result.style === 'avoidant' && 'Dismissive-Avoidant'}
              {result.style === 'fearful' && 'Fearful-Avoidant'}
            </h2>
            <p className="text-slate-200 text-sm font-semibold">
              Anxiety: {result.anxiety.toFixed(1)} ({getScoreLabel(result.anxiety)})
            </p>
            <p className="text-slate-200 text-sm font-semibold">
              Avoidance: {result.avoidance.toFixed(1)} ({getScoreLabel(result.avoidance)})
            </p>
          </div>

          {/* Description */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <p className="text-slate-300 leading-relaxed">{result.description}</p>
          </div>

          {/* Score Breakdown */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-orange-300 uppercase tracking-wide">Attachment Anxiety</p>
              <p className="text-2xl font-bold text-slate-100">{result.anxiety.toFixed(2)}</p>
              <p className="text-xs text-slate-400">
                {result.anxiety < 3.5
                  ? 'You feel relatively secure in relationships'
                  : 'You tend to worry about relationships'}
              </p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-blue-300 uppercase tracking-wide">Attachment Avoidance</p>
              <p className="text-2xl font-bold text-slate-100">{result.avoidance.toFixed(2)}</p>
              <p className="text-xs text-slate-400">
                {result.avoidance < 3.5
                  ? 'You\'re comfortable with closeness'
                  : 'You prefer distance and independence'}
              </p>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
            <p className="text-sm font-semibold text-slate-100">Next Steps:</p>
            <p className="text-sm text-slate-300">
              Your assessment is complete! Scroll down to explore practices designed for your attachment style in the "Attachment-Aware Practices" section below.
            </p>
          </div>

          {/* Action Button */}
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-accent text-slate-900 rounded-lg font-semibold hover:bg-accent/90 transition"
          >
            View My Recommended Practices
          </button>
        </div>
      </div>
    );
  }

  return null;
}
