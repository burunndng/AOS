import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeft, Check, BookOpen, Users, Clock, Target, Sparkles, Info, Star, TrendingUp } from 'lucide-react';
import meditationPractices, { MeditationPractice } from '../data/meditationPractices.ts';
import {
  assessmentQuestions,
  sectionOrder,
  sectionDescriptions,
  getQuestionsBySection,
  Question,
  UserProfile
} from '../data/meditationAssessment.ts';
import meditationRecommender, { RecommendationReport } from '../services/meditationRecommender.ts';

interface MeditationWizardProps {
  onClose: () => void;
}

type WizardStep = 'welcome' | 'assessment' | 'results' | 'practice-details';

export default function MeditationWizard({ onClose }: MeditationWizardProps) {
  const [step, setStep] = useState<WizardStep>('welcome');
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [recommendations, setRecommendations] = useState<RecommendationReport | null>(null);
  const [selectedPractice, setSelectedPractice] = useState<MeditationPractice | null>(null);

  const questionsBySection = getQuestionsBySection();
  const currentSection = sectionOrder[currentSectionIndex];
  const currentQuestions = questionsBySection[currentSection] || [];

  // Check if current section is complete
  const isSectionComplete = () => {
    return currentQuestions.every(q => answers[q.id] !== undefined);
  };

  const handleAnswer = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentSectionIndex < sectionOrder.length - 1) {
      setCurrentSectionIndex(prev => prev + 1);
    } else {
      // Assessment complete, generate recommendations
      generateRecommendations();
    }
  };

  const handleBack = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(prev => prev - 1);
    }
  };

  const generateRecommendations = () => {
    // Build user profile from answers
    const userProfile: UserProfile = {
      background: {
        cultural: answers['cultural-background'],
        spiritualOpenness: answers['spiritual-openness'],
        previousExperience: answers['previous-experience']
      },
      goals: {
        primary: answers['primary-goals'],
        motivations: [answers['motivation-type']]
      },
      personality: {
        learningStyle: answers['learning-style'],
        structurePreference: answers['structure-preference'],
        temperament: answers['temperament']
      },
      practical: {
        timeAvailable: answers['time-available'],
        retreatWillingness: answers['retreat-willingness'],
        locationAccess: answers['teacher-access']
      },
      priorities: {
        evidenceBased: answers['evidence-importance'],
        traditionalAuthenticity: answers['tradition-importance'],
        quickResults: answers['patience-level'] === 'immediate' || answers['patience-level'] === 'need-results' ? 10 : 5,
        spiritualDepth: answers['quick-vs-deep'] === 'deep-transformation' ? 10 : 5
      }
    };

    const report = meditationRecommender.generateReport(meditationPractices, userProfile);
    setRecommendations(report);
    setStep('results');
  };

  const renderWelcome = () => (
    <div className="space-y-6 py-8">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-gradient-to-br from-neutral-800 to-neutral-700 rounded-full mx-auto flex items-center justify-center">
          <Sparkles size={40} className="text-white" />
        </div>
        <h2 className="text-3xl font-bold text-slate-100">Meditation Practice Finder</h2>
        <p className="text-slate-300 text-lg max-w-2xl mx-auto">
          Discover the meditation practice that's right for you. This personalized assessment will match you with compatible practices based on your goals, personality, and circumstances.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto mt-8">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <BookOpen className="text-neutral-400 mb-2" size={24} />
          <h3 className="font-semibold text-slate-100 mb-1">12 Practice Styles</h3>
          <p className="text-sm text-slate-400">From Samatha to MBSR, we cover major meditation traditions</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <Target className="text-green-400 mb-2" size={24} />
          <h3 className="font-semibold text-slate-100 mb-1">Personalized Matching</h3>
          <p className="text-sm text-slate-400">Smart algorithm considers your goals, personality, and lifestyle</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <Users className="text-neutral-400 mb-2" size={24} />
          <h3 className="font-semibold text-slate-100 mb-1">Evidence-Based</h3>
          <p className="text-sm text-slate-400">Research-backed recommendations with scientific studies</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <Clock className="text-amber-400 mb-2" size={24} />
          <h3 className="font-semibold text-slate-100 mb-1">5-Minute Assessment</h3>
          <p className="text-sm text-slate-400">Quick questionnaire to find your perfect practice</p>
        </div>
      </div>

      <div className="text-center mt-8">
        <button
          onClick={() => setStep('assessment')}
          className="btn-luminous px-8 py-3 rounded-lg font-semibold text-lg transition inline-flex items-center gap-2"
        >
          Start Assessment
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );

  const renderQuestion = (question: Question) => {
    const answer = answers[question.id];

    if (question.type === 'multiple-choice') {
      return (
        <div className="space-y-3">
          {question.options?.map(option => (
            <button
              key={option.value}
              onClick={() => handleAnswer(question.id, option.value)}
              className={`w-full text-left p-4 rounded-lg border-2 transition ${
                answer === option.value
                  ? 'border-accent bg-accent/10 font-semibold'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{option.text}</span>
                {answer === option.value && <Check size={20} className="text-accent" />}
              </div>
            </button>
          ))}
        </div>
      );
    }

    if (question.type === 'multi-select') {
      const selectedValues = answer || [];
      return (
        <div className="space-y-3">
          {question.options?.map(option => {
            const isSelected = selectedValues.includes(option.value);
            const canSelect = !question.maxSelections || selectedValues.length < question.maxSelections || isSelected;

            return (
              <button
                key={option.value}
                onClick={() => {
                  if (!canSelect && !isSelected) return;

                  const newValues = isSelected
                    ? selectedValues.filter((v: any) => v !== option.value)
                    : [...selectedValues, option.value];
                  handleAnswer(question.id, newValues);
                }}
                disabled={!canSelect && !isSelected}
                className={`w-full text-left p-4 rounded-lg border-2 transition ${
                  isSelected
                    ? 'border-accent bg-accent/10 font-semibold'
                    : canSelect
                    ? 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    : 'border-slate-700 bg-slate-800/30 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{option.text}</span>
                  {isSelected && <Check size={20} className="text-accent" />}
                </div>
              </button>
            );
          })}
          {question.maxSelections && (
            <p className="text-sm text-slate-400 mt-2">
              {selectedValues.length} of {question.maxSelections} selected
            </p>
          )}
        </div>
      );
    }

    if (question.type === 'scale') {
      return (
        <div className="space-y-4">
          <input
            type="range"
            min={question.scaleMin}
            max={question.scaleMax}
            value={answer || Math.floor(((question.scaleMax || 10) - (question.scaleMin || 1)) / 2) + (question.scaleMin || 1)}
            onChange={(e) => handleAnswer(question.id, parseInt(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-accent"
          />
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">{question.scaleLabels?.[0]}</span>
            <span className="text-accent font-semibold">{answer || Math.floor(((question.scaleMax || 10) - (question.scaleMin || 1)) / 2) + (question.scaleMin || 1)}</span>
            <span className="text-slate-400">{question.scaleLabels?.[1]}</span>
          </div>
        </div>
      );
    }

    if (question.type === 'yes-no') {
      return (
        <div className="flex gap-4">
          <button
            onClick={() => handleAnswer(question.id, 'yes')}
            className={`flex-1 p-4 rounded-lg border-2 transition ${
              answer === 'yes'
                ? 'border-accent bg-accent/10 font-semibold'
                : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
            }`}
          >
            Yes
          </button>
          <button
            onClick={() => handleAnswer(question.id, 'no')}
            className={`flex-1 p-4 rounded-lg border-2 transition ${
              answer === 'no'
                ? 'border-accent bg-accent/10 font-semibold'
                : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
            }`}
          >
            No
          </button>
        </div>
      );
    }

    return null;
  };

  const renderAssessment = () => (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-slate-400">
          <span>{currentSection}</span>
          <span>Section {currentSectionIndex + 1} of {sectionOrder.length}</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-neutral-800 to-neutral-700 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentSectionIndex + 1) / sectionOrder.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Section description */}
      <div className="bg-neutral-900/20 border border-neutral-700/50 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Info size={20} className="text-neutral-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-slate-300">{sectionDescriptions[currentSection]}</p>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-8">
        {currentQuestions.map(question => (
          <div key={question.id} className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-100">{question.text}</h3>
            {renderQuestion(question)}
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-700">
        <button
          onClick={handleBack}
          disabled={currentSectionIndex === 0}
          className={`px-6 py-2 rounded-lg font-medium transition inline-flex items-center gap-2 ${
            currentSectionIndex === 0
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-slate-700 text-slate-100 hover:bg-slate-600'
          }`}
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <button
          onClick={handleNext}
          disabled={!isSectionComplete()}
          className={`px-6 py-2 rounded-lg font-medium transition inline-flex items-center gap-2 ${
            isSectionComplete()
              ? 'btn-luminous'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          {currentSectionIndex === sectionOrder.length - 1 ? 'Get Recommendations' : 'Next'}
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );

  const renderResults = () => {
    if (!recommendations) return null;

    const { topRecommendation, alternatives, notRecommended, hybridApproach } = recommendations;

    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-gradient-to-br from-neutral-800 to-neutral-700 rounded-full mx-auto flex items-center justify-center">
            <Star size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100">Your Personalized Recommendations</h2>
          <p className="text-slate-400">Based on your assessment responses</p>
        </div>

        {/* Top Recommendation */}
        <div className="bg-gradient-to-br from-neutral-900/30 to-neutral-900/30 border-2 border-neutral-500/40 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Star className="text-green-400" size={24} />
            <h3 className="text-xl font-bold text-slate-100">Top Recommendation</h3>
          </div>

          <div className="space-y-3">
            <h4 className="text-2xl font-bold text-green-400">{topRecommendation.practice.name}</h4>
            <p className="text-slate-300 leading-relaxed">{topRecommendation.practice.overview.description}</p>

            <div className="bg-slate-900/50 rounded-lg p-4 space-y-2">
              <h5 className="font-semibold text-slate-100 text-sm">Why this practice?</h5>
              <p className="text-sm text-slate-300">{topRecommendation.why}</p>
            </div>

            {/* Score breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-accent">{Math.round(topRecommendation.score.breakdown.goalAlignment * 100)}%</div>
                <div className="text-xs text-slate-400 mt-1">Goal Match</div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-accent">{Math.round(topRecommendation.score.breakdown.personalityFit * 100)}%</div>
                <div className="text-xs text-slate-400 mt-1">Personality Fit</div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-accent">{Math.round(topRecommendation.score.breakdown.practicalFit * 100)}%</div>
                <div className="text-xs text-slate-400 mt-1">Practical Fit</div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-accent">{Math.round(topRecommendation.score.breakdown.culturalAlignment * 100)}%</div>
                <div className="text-xs text-slate-400 mt-1">Cultural Fit</div>
              </div>
            </div>

            {/* Next steps */}
            {topRecommendation.nextSteps.length > 0 && (
              <div className="bg-slate-900/50 rounded-lg p-4 space-y-2">
                <h5 className="font-semibold text-slate-100 text-sm flex items-center gap-2">
                  <TrendingUp size={16} />
                  Next Steps
                </h5>
                <ul className="space-y-2">
                  {topRecommendation.nextSteps.map((step, i) => (
                    <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                      <span className="text-accent font-bold">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={() => {
                setSelectedPractice(topRecommendation.practice);
                setStep('practice-details');
              }}
              className="w-full btn-luminous py-3 rounded-lg font-semibold transition"
            >
              View Full Practice Details
            </button>
          </div>
        </div>

        {/* Alternative recommendations */}
        {alternatives.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Alternative Practices to Consider</h3>
            <div className="grid gap-4">
              {alternatives.map((alt, i) => (
                <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-bold text-slate-100">{alt.practice.name}</h4>
                    <span className="text-sm text-accent font-semibold">{Math.round(alt.score.overallScore * 100)}% match</span>
                  </div>
                  <p className="text-sm text-slate-300">{alt.why}</p>
                  <button
                    onClick={() => {
                      setSelectedPractice(alt.practice);
                      setStep('practice-details');
                    }}
                    className="text-sm text-accent hover:underline"
                  >
                    Learn more →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hybrid approach */}
        {hybridApproach && (
          <div className="bg-neutral-900/20 border border-neutral-700/50 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-slate-100">💡 Hybrid Approach Suggestion</h4>
            <p className="text-sm text-slate-300">{hybridApproach.description}</p>
            <p className="text-sm text-slate-400 italic">{hybridApproach.schedule}</p>
          </div>
        )}

        {/* Retry button */}
        <div className="text-center pt-4">
          <button
            onClick={() => {
              setStep('welcome');
              setCurrentSectionIndex(0);
              setAnswers({});
              setRecommendations(null);
            }}
            className="text-slate-400 hover:text-slate-200 transition text-sm"
          >
            Start over with new assessment
          </button>
        </div>
      </div>
    );
  };

  const renderPracticeDetails = () => {
    if (!selectedPractice) return null;

    return (
      <div className="space-y-6 max-h-[70vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 pb-4 border-b border-slate-700 z-10">
          <button
            onClick={() => setStep('results')}
            className="text-accent hover:underline mb-4 inline-flex items-center gap-1 text-sm"
          >
            <ArrowLeft size={16} />
            Back to recommendations
          </button>
          <h2 className="text-3xl font-bold text-slate-100">{selectedPractice.name}</h2>
          <p className="text-slate-400">{selectedPractice.tradition}</p>
        </div>

        {/* Overview */}
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-slate-100">Overview</h3>
          <p className="text-slate-300 leading-relaxed">{selectedPractice.overview.description}</p>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <h4 className="font-semibold text-slate-100 mb-2">Philosophy</h4>
            <p className="text-sm text-slate-300">{selectedPractice.overview.philosophy}</p>
          </div>
        </div>

        {/* Goals */}
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-slate-100">Goals</h3>
          <ul className="space-y-2">
            {selectedPractice.overview.goals.map((goal, i) => (
              <li key={i} className="flex items-start gap-2 text-slate-300">
                <Target size={16} className="text-accent mt-1 flex-shrink-0" />
                <span>{goal}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Practice Instructions */}
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-slate-100">How to Practice</h3>
          <p className="text-slate-300">{selectedPractice.practice.coreTechnique}</p>
          <div className="space-y-2">
            {selectedPractice.practice.instructions.map((instruction, i) => (
              <div key={i} className="flex items-start gap-3 text-sm text-slate-300">
                <span className="bg-accent/20 text-accent w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-semibold">
                  {i + 1}
                </span>
                <span>{instruction}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Research Benefits */}
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-slate-100">Research-Backed Benefits</h3>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="bg-neutral-900/20 border border-neutral-700/50 rounded-lg p-3">
              <h4 className="font-semibold text-neutral-400 text-sm mb-2">Cognitive</h4>
              <ul className="space-y-1">
                {selectedPractice.research.benefits.cognitive.map((benefit, i) => (
                  <li key={i} className="text-xs text-slate-300">• {benefit}</li>
                ))}
              </ul>
            </div>
            <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-3">
              <h4 className="font-semibold text-green-400 text-sm mb-2">Emotional</h4>
              <ul className="space-y-1">
                {selectedPractice.research.benefits.emotional.map((benefit, i) => (
                  <li key={i} className="text-xs text-slate-300">• {benefit}</li>
                ))}
              </ul>
            </div>
            <div className="bg-neutral-900/20 border border-neutral-700/50 rounded-lg p-3">
              <h4 className="font-semibold text-neutral-400 text-sm mb-2">Physical</h4>
              <ul className="space-y-1">
                {selectedPractice.research.benefits.physical.map((benefit, i) => (
                  <li key={i} className="text-xs text-slate-300">• {benefit}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Resources */}
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-slate-100">Recommended Resources</h3>
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-200 text-sm">Books</h4>
            {selectedPractice.resources.books.slice(0, 3).map((book, i) => (
              <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                <div className="font-semibold text-slate-100 text-sm">{book.title}</div>
                <div className="text-xs text-slate-400">by {book.author}</div>
                {book.level && <div className="text-xs text-slate-500 mt-1">{book.level}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Pros & Cons */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-green-400">Pros</h4>
            <ul className="space-y-1">
              {selectedPractice.considerations.pros.map((pro, i) => (
                <li key={i} className="text-sm text-slate-300">✓ {pro}</li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-amber-400">Considerations</h4>
            <ul className="space-y-1">
              {selectedPractice.considerations.cons.map((con, i) => (
                <li key={i} className="text-sm text-slate-300">• {con}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Who it's for */}
        <div className="bg-neutral-900/20 border border-neutral-700/50 rounded-lg p-4">
          <h4 className="font-semibold text-slate-100 mb-2">Who is this practice for?</h4>
          <p className="text-sm text-slate-300">{selectedPractice.considerations.whoItsFor}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles size={28} className="text-accent" />
              <h1 className="text-2xl font-bold text-slate-100">
                {step === 'welcome' && 'Meditation Practice Finder'}
                {step === 'assessment' && 'Assessment'}
                {step === 'results' && 'Your Recommendations'}
                {step === 'practice-details' && 'Practice Details'}
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
          {step === 'assessment' && renderAssessment()}
          {step === 'results' && renderResults()}
          {step === 'practice-details' && renderPracticeDetails()}
        </div>
      </div>
    </div>
  );
}
