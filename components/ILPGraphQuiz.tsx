import React, { useState, useEffect } from 'react';
import {
  ILPGraphQuizSession,
  QuizResult,
  ILPGraphCategory,
  DifficultyLevel,
  QuizQuestion,
} from '../types';
import {
  ilpGraphQuizzes,
  getQuizQuestions,
  QUIZ_SESSIONS_STORAGE_KEY,
  QUIZ_RESULTS_STORAGE_KEY,
  getCategoryStats,
} from '../data/ilpGraphQuizzes';
import { generateId } from '../utils/helpers';
import { Trophy, Target, TrendingUp, Award, RotateCcw, ChevronRight } from 'lucide-react';

type QuizStep = 'menu' | 'quiz' | 'results' | 'review';

interface QuizStats {
  totalTaken: number;
  averageScore: number;
  bestScore: number;
  streak: number;
  categoryScores: Record<ILPGraphCategory, { attempts: number; bestScore: number }>;
}

export const ILPGraphQuiz: React.FC = () => {
  const [step, setStep] = useState<QuizStep>('menu');
  const [selectedCategory, setSelectedCategory] = useState<ILPGraphCategory>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('beginner');
  const [numQuestions, setNumQuestions] = useState<number>(10);
  const [currentSession, setCurrentSession] = useState<ILPGraphQuizSession | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [results, setResults] = useState<QuizResult | null>(null);
  const [stats, setStats] = useState<QuizStats | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    const resultsJson = localStorage.getItem(QUIZ_RESULTS_STORAGE_KEY);
    if (resultsJson) {
      const quizResults: QuizResult[] = JSON.parse(resultsJson);
      if (quizResults.length > 0) {
        const totalTaken = quizResults.length;
        const averageScore =
          quizResults.reduce((acc, r) => acc + r.score, 0) / totalTaken;
        const bestScore = Math.max(...quizResults.map((r) => r.score));

        // Calculate streak
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const lastResult = quizResults[quizResults.length - 1];
        const lastResultDate = lastResult.date.split('T')[0];
        const streak =
          lastResultDate === today || lastResultDate === yesterday
            ? Math.min(quizResults.length, 7) // Max 7-day streak shown
            : 0;

        // Calculate per-category stats
        const categoryStats: Record<
          ILPGraphCategory,
          { attempts: number; totalScore: number }
        > = {
          core: { attempts: 0, totalScore: 0 },
          body: { attempts: 0, totalScore: 0 },
          mind: { attempts: 0, totalScore: 0 },
          spirit: { attempts: 0, totalScore: 0 },
          shadow: { attempts: 0, totalScore: 0 },
          'integral-theory': { attempts: 0, totalScore: 0 },
        };

        quizResults.forEach((result) => {
          if (categoryStats[result.category]) {
            categoryStats[result.category].attempts += 1;
            categoryStats[result.category].totalScore += result.score;
          }
        });

        const categoryScores: Record<
          ILPGraphCategory,
          { attempts: number; bestScore: number }
        > = {
          core: { attempts: 0, bestScore: 0 },
          body: { attempts: 0, bestScore: 0 },
          mind: { attempts: 0, bestScore: 0 },
          spirit: { attempts: 0, bestScore: 0 },
          shadow: { attempts: 0, bestScore: 0 },
          'integral-theory': { attempts: 0, bestScore: 0 },
        };

        Object.keys(categoryStats).forEach((cat) => {
          const stat = categoryStats[cat as ILPGraphCategory];
          categoryScores[cat as ILPGraphCategory] = {
            attempts: stat.attempts,
            bestScore:
              stat.attempts > 0 ? Math.round(stat.totalScore / stat.attempts) : 0,
          };
        });

        setStats({
          totalTaken,
          averageScore: Math.round(averageScore),
          bestScore,
          streak,
          categoryScores,
        });
      }
    }
  };

  const startQuiz = () => {
    const availableQuestions = getQuizQuestions(selectedCategory, selectedDifficulty, numQuestions);

    // Validate that we have enough unique questions
    if (availableQuestions.length < numQuestions) {
      alert(`Only ${availableQuestions.length} questions available for this combination. Please select fewer questions or a different difficulty level.`);
      return;
    }

    // Ensure no duplicate questions
    const questionIds = new Set(availableQuestions.map(q => q.id));
    if (questionIds.size !== availableQuestions.length) {
      console.warn('Warning: Duplicate questions detected, filtering...');
      return;
    }

    const newSession: ILPGraphQuizSession = {
      id: generateId(),
      date: new Date().toISOString(),
      category: selectedCategory,
      difficulty: selectedDifficulty,
      currentQuestionIndex: 0,
      answers: [],
      startTime: Date.now(),
    };

    // Store questions for this quiz session (prevents re-shuffling)
    setQuizQuestions(availableQuestions);
    setCurrentSession(newSession);
    setStep('quiz');
  };

  const selectAnswer = (answerId: string) => {
    if (!currentSession || quizQuestions.length === 0) return;

    const updatedSession = {
      ...currentSession,
      answers: [
        ...currentSession.answers,
        {
          questionId: quizQuestions[currentSession.currentQuestionIndex].id,
          selectedAnswerId: answerId,
        },
      ],
    };

    if (currentSession.currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentSession({
        ...updatedSession,
        currentQuestionIndex: currentSession.currentQuestionIndex + 1,
      });
    } else {
      finishQuiz(updatedSession, quizQuestions);
    }
  };

  const finishQuiz = (session: ILPGraphQuizSession, questions: QuizQuestion[]) => {
    let correctCount = 0;
    const categoryBreakdown: Record<ILPGraphCategory, { correct: number; total: number }> = {
      core: { correct: 0, total: 0 },
      body: { correct: 0, total: 0 },
      mind: { correct: 0, total: 0 },
      spirit: { correct: 0, total: 0 },
      shadow: { correct: 0, total: 0 },
      'integral-theory': { correct: 0, total: 0 },
    };

    const answersWithCorrectness = session.answers.map((answer, idx) => {
      const question = questions[idx];
      const isCorrect = question.answers.find(
        (a) => a.id === answer.selectedAnswerId
      )?.isCorrect;

      if (isCorrect) correctCount++;

      const category = question.category;
      if (categoryBreakdown[category]) {
        categoryBreakdown[category].total += 1;
        if (isCorrect) {
          categoryBreakdown[category].correct += 1;
        }
      }

      return { ...answer, isCorrect: !!isCorrect };
    });

    const timeSpent = Math.round((Date.now() - session.startTime) / 1000);
    const score = Math.round((correctCount / questions.length) * 100);

    const quizResult: QuizResult = {
      id: session.id,
      quizId: session.id,
      date: session.date,
      difficulty: session.difficulty,
      category: session.category,
      totalQuestions: questions.length,
      correctAnswers: correctCount,
      score,
      timeSpent,
      categoryBreakdown,
      answers: answersWithCorrectness,
    };

    // Save results
    const existingResults = localStorage.getItem(QUIZ_RESULTS_STORAGE_KEY);
    const allResults: QuizResult[] = existingResults ? JSON.parse(existingResults) : [];
    allResults.push(quizResult);
    localStorage.setItem(QUIZ_RESULTS_STORAGE_KEY, JSON.stringify(allResults));

    setResults(quizResult);
    setCurrentSession(null);

    // Show confetti for good scores
    if (score >= 80) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }

    setStep('results');
    loadStats();
  };

  const resetQuiz = () => {
    setCurrentSession(null);
    setQuizQuestions([]);
    setResults(null);
    setStep('menu');
    setShowConfetti(false);
  };

  // Get current question from stored questions
  const currentQuestion = currentSession && quizQuestions.length > 0
    ? quizQuestions[currentSession.currentQuestionIndex]
    : null;

  const categoryLabel: Record<ILPGraphCategory, string> = {
    core: 'Core Concepts',
    body: 'Body Module',
    mind: 'Mind Module',
    spirit: 'Spirit Module',
    shadow: 'Shadow Module',
    'integral-theory': 'Integral Theory',
  };

  const categoryColor: Record<ILPGraphCategory, string> = {
    core: 'from-amber-500 to-orange-500',
    body: 'from-red-500 to-pink-500',
    mind: 'from-neutral-800 to-neutral-700',
    spirit: 'from-neutral-800 to-neutral-700',
    shadow: 'from-neutral-800 to-neutral-700',
    'integral-theory': 'from-neutral-800 to-neutral-700',
  };

  const difficultyLabel: Record<DifficultyLevel, string> = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
  };

  const difficultyColor: Record<DifficultyLevel, string> = {
    beginner: 'text-green-400 bg-green-900/30 border-green-700/50',
    intermediate: 'text-yellow-400 bg-yellow-900/30 border-yellow-700/50',
    advanced: 'text-red-400 bg-red-900/30 border-red-700/50',
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { label: 'Master', emoji: '🏆', color: 'gold' };
    if (score >= 80) return { label: 'Expert', emoji: '⭐', color: 'cyan' };
    if (score >= 70) return { label: 'Proficient', emoji: '✓', color: 'green' };
    if (score >= 60) return { label: 'Good', emoji: '👍', color: 'blue' };
    return { label: 'Keep Learning', emoji: '🎓', color: 'purple' };
  };

  const categoryStats = getCategoryStats();

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 via-neutral-900 to-slate-900 rounded-xl p-6 text-white">
      {/* Confetti effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-10px`,
                animation: `fall ${2 + Math.random()}s linear forwards`,
                animationDelay: `${Math.random() * 0.5}s`,
              }}
            />
          ))}
        </div>
      )}

      <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-neutral-400 to-neutral-400 bg-clip-text text-transparent">
        ILP Graph Quiz
      </h1>
      <p className="text-slate-400 mb-8">Test your knowledge across all ILP dimensions</p>

      {step === 'menu' && (
        <div className="space-y-8 max-w-4xl">
          {/* Statistics Grid */}
          {stats && (
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/50 rounded-lg p-4 border border-neutral-700/30 backdrop-blur">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy size={20} className="text-yellow-400" />
                  <span className="text-sm text-slate-400">Quizzes</span>
                </div>
                <div className="text-3xl font-bold">{stats.totalTaken}</div>
              </div>

              <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/50 rounded-lg p-4 border border-neutral-700/30 backdrop-blur">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={20} className="text-neutral-400" />
                  <span className="text-sm text-slate-400">Average</span>
                </div>
                <div className="text-3xl font-bold">{stats.averageScore}%</div>
              </div>

              <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/50 rounded-lg p-4 border border-green-700/30 backdrop-blur">
                <div className="flex items-center gap-2 mb-2">
                  <Award size={20} className="text-green-400" />
                  <span className="text-sm text-slate-400">Best</span>
                </div>
                <div className="text-3xl font-bold">{stats.bestScore}%</div>
              </div>

              <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/50 rounded-lg p-4 border border-orange-700/30 backdrop-blur">
                <div className="flex items-center gap-2 mb-2">
                  <Target size={20} className="text-orange-400" />
                  <span className="text-sm text-slate-400">Streak</span>
                </div>
                <div className="text-3xl font-bold">{stats.streak} days</div>
              </div>
            </div>
          )}

          {/* Quiz Category Info */}
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/50 rounded-xl p-6 border border-neutral-700/30 backdrop-blur">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">📊</span> Question Library
            </h3>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="bg-slate-700/50 rounded p-3 border border-slate-600/30">
                <div className="font-semibold text-neutral-300">{categoryStats.total}</div>
                <div className="text-slate-400">Total Questions</div>
              </div>
              <div className="bg-slate-700/50 rounded p-3 border border-slate-600/30">
                <div className="font-semibold text-amber-300">{categoryStats.core} + {categoryStats.body}</div>
                <div className="text-slate-400">Core + Body</div>
              </div>
              <div className="bg-slate-700/50 rounded p-3 border border-slate-600/30">
                <div className="font-semibold text-neutral-300">{categoryStats.mind + categoryStats.spirit}</div>
                <div className="text-slate-400">Mind + Spirit</div>
              </div>
            </div>
          </div>

          {/* Quiz Configuration */}
          <div className="space-y-6">
            {/* Category Selection */}
            <div>
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-gradient-to-r from-neutral-800 to-neutral-700 flex items-center justify-center text-sm font-bold">1</span>
                Select Category
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {(['all', 'core', 'body', 'mind', 'spirit', 'shadow', 'integral-theory'] as const).map((key) => (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(key as ILPGraphCategory)}
                    className={`p-3 rounded-lg font-medium transition-all duration-300 border-2 ${
                      selectedCategory === key
                        ? `bg-gradient-to-r ${key === 'all' ? 'from-slate-600 to-slate-500' : categoryColor[key as ILPGraphCategory]} border-white/50 shadow-lg scale-105`
                        : 'bg-slate-700/50 border-slate-600 hover:border-neutral-500 hover:bg-slate-600/50'
                    }`}
                  >
                    {key === 'all' ? '🌟 All Categories' : categoryLabel[key as ILPGraphCategory]}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Selection */}
            <div>
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-gradient-to-r from-neutral-800 to-neutral-700 flex items-center justify-center text-sm font-bold">2</span>
                Select Difficulty
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(difficultyLabel).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedDifficulty(key as DifficultyLevel)}
                    className={`p-3 rounded-lg font-medium transition-all duration-300 border-2 ${
                      selectedDifficulty === key
                        ? `${difficultyColor[key as DifficultyLevel]} border-white/50 shadow-lg scale-105 bg-opacity-50`
                        : 'bg-slate-700/50 border-slate-600 hover:border-neutral-500 hover:bg-slate-600/50 text-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Count Selection */}
            <div>
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-gradient-to-r from-neutral-800 to-neutral-700 flex items-center justify-center text-sm font-bold">3</span>
                Number of Questions
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {[10, 20, 30].map((num) => (
                  <button
                    key={num}
                    onClick={() => setNumQuestions(num)}
                    className={`p-3 rounded-lg font-medium transition-all duration-300 border-2 ${
                      numQuestions === num
                        ? 'bg-gradient-to-r from-neutral-800 to-neutral-700 border-white/50 shadow-lg scale-105'
                        : 'bg-slate-700/50 border-slate-600 hover:border-cyan-500 hover:bg-slate-600/50'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={startQuiz}
            className="w-full bg-gradient-to-r from-neutral-800 to-neutral-700 hover:from-neutral-700 hover:to-neutral-700 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl flex items-center justify-center gap-2 text-lg"
          >
            Start Quiz
            <ChevronRight size={24} />
          </button>
        </div>
      )}

      {step === 'quiz' && currentQuestion && currentSession && (
        <div className="space-y-6 max-w-3xl">
          {/* Progress Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold">
                Question {currentSession.currentQuestionIndex + 1} of {quizQuestions.length}
              </span>
              <span className="text-slate-400">
                {Math.round(((currentSession.currentQuestionIndex + 1) / quizQuestions.length) * 100)}%
              </span>
            </div>
            <div className="bg-slate-700 rounded-full h-3 overflow-hidden border border-neutral-700/50">
              <div
                className="bg-gradient-to-r from-neutral-800 to-neutral-700 h-full transition-all duration-500"
                style={{
                  width: `${((currentSession.currentQuestionIndex + 1) / quizQuestions.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Category Badge */}
          <div className="flex items-center gap-3">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r ${categoryColor[currentSession.category]}`}>
              {categoryLabel[currentSession.category]}
            </span>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${difficultyColor[currentSession.difficulty]}`}>
              {difficultyLabel[currentSession.difficulty]}
            </span>
          </div>

          {/* Question Card */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-8 border border-neutral-700/30 backdrop-blur">
            <h2 className="text-2xl font-bold mb-6 leading-relaxed">{currentQuestion.question}</h2>
            {currentQuestion.description && (
              <p className="text-slate-300 text-sm mb-6 italic bg-slate-700/50 p-4 rounded border-l-2 border-neutral-500">
                {currentQuestion.description}
              </p>
            )}

            {/* Answer Options */}
            <div className="space-y-3">
              {currentQuestion.answers.map((answer, idx) => (
                <button
                  key={answer.id}
                  onClick={() => selectAnswer(answer.id)}
                  className="w-full text-left p-4 bg-slate-700/50 hover:bg-slate-600/70 border-2 border-slate-600/50 hover:border-neutral-500/70 rounded-lg transition-all duration-300 group hover:shadow-lg hover:shadow-neutral-500/20"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-neutral-800 to-neutral-700 flex items-center justify-center text-sm font-bold group-hover:scale-110 transition-transform">
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="flex-1 pt-1">{answer.text}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 'results' && results && (
        <div className="space-y-8 max-w-3xl">
          {/* Score Display */}
          <div className="text-center space-y-4">
            <div className="text-6xl font-bold bg-gradient-to-r from-neutral-400 via-neutral-400 to-neutral-400 bg-clip-text text-transparent">
              {results.score}%
            </div>
            <div className="text-2xl font-semibold">{getScoreBadge(results.score).label}</div>
            <div className="text-xl text-slate-300">
              {results.correctAnswers} out of {results.totalQuestions} correct
            </div>
          </div>

          {/* Feedback Card */}
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/50 rounded-xl p-6 border-2 border-neutral-700/30">
            {results.score >= 80 && (
              <div className="flex gap-4">
                <span className="text-4xl">🎉</span>
                <div>
                  <h3 className="text-xl font-bold text-green-400 mb-2">Excellent Performance!</h3>
                  <p className="text-slate-300">You have a strong understanding of the ILP concepts. Keep up this momentum!</p>
                </div>
              </div>
            )}
            {results.score >= 60 && results.score < 80 && (
              <div className="flex gap-4">
                <span className="text-4xl">✨</span>
                <div>
                  <h3 className="text-xl font-bold text-neutral-400 mb-2">Good Job!</h3>
                  <p className="text-slate-300">You have solid knowledge of the key concepts. Review weak areas to improve further.</p>
                </div>
              </div>
            )}
            {results.score < 60 && (
              <div className="flex gap-4">
                <span className="text-4xl">🌱</span>
                <div>
                  <h3 className="text-xl font-bold text-yellow-400 mb-2">Keep Exploring!</h3>
                  <p className="text-slate-300">Review the foundational concepts and try again. Learning is a journey, not a destination.</p>
                </div>
              </div>
            )}
          </div>

          {/* Detailed Stats */}
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/50 rounded-xl p-6 border border-neutral-700/30 space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span>📊</span> Performance Breakdown
            </h3>

            {Object.entries(results.categoryBreakdown).map(([category, stats]) => {
              const typedStats = stats as { correct: number; total: number };
              if (typedStats.total === 0) return null;
              const percentage = Math.round((typedStats.correct / typedStats.total) * 100);
              const bgColor =
                percentage >= 80
                  ? 'from-green-500/30'
                  : percentage >= 60
                    ? 'from-neutral-500/30'
                    : 'from-red-500/30';
              return (
                <div key={category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-200">
                      {categoryLabel[category as ILPGraphCategory]}
                    </span>
                    <span className="text-sm text-slate-400">
                      {typedStats.correct}/{typedStats.total} ({percentage}%)
                    </span>
                  </div>
                  <div className="bg-slate-700/50 rounded-full h-2 overflow-hidden border border-slate-600/30">
                    <div
                      className={`bg-gradient-to-r ${bgColor} h-full transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time and Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/50 rounded-lg p-4 border border-slate-700/30 text-center">
              <div className="text-2xl font-bold text-cyan-400">⏱️</div>
              <div className="text-sm text-slate-400 mt-2">Time Spent</div>
              <div className="text-lg font-semibold">{Math.floor(results.timeSpent / 60)}m {results.timeSpent % 60}s</div>
            </div>
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/50 rounded-lg p-4 border border-slate-700/30 text-center">
              <div className="text-2xl font-bold text-neutral-400">⚡</div>
              <div className="text-sm text-slate-400 mt-2">Avg per Question</div>
              <div className="text-lg font-semibold">{Math.round(results.timeSpent / results.totalQuestions)}s</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                const q = getQuizQuestions(results.category, results.difficulty, results.totalQuestions);
                setStep('review');
              }}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg transition-all border border-slate-600 hover:border-cyan-500"
            >
              Review Answers
            </button>
            <button
              onClick={resetQuiz}
              className="flex-1 bg-gradient-to-r from-neutral-800 to-neutral-700 hover:from-neutral-700 hover:to-neutral-700 text-white font-bold py-3 px-4 rounded-lg transition-all"
            >
              <RotateCcw className="inline mr-2" size={18} />
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
