import React, { useState, useEffect } from 'react';
import {
  ILPGraphQuizSession,
  QuizResult,
  ILPGraphCategory,
  DifficultyLevel,
} from '../types';
import {
  ilpGraphQuizzes,
  getQuizQuestions,
  QUIZ_SESSIONS_STORAGE_KEY,
  QUIZ_RESULTS_STORAGE_KEY,
} from '../data/ilpGraphQuizzes';
import { generateId } from '../utils/helpers';

type QuizStep = 'menu' | 'quiz' | 'results';

interface QuizStats {
  totalTaken: number;
  averageScore: number;
  bestScore: number;
  categoryScores: Record<ILPGraphCategory, { attempts: number; bestScore: number }>;
}

export const ILPGraphQuiz: React.FC = () => {
  const [step, setStep] = useState<QuizStep>('menu');
  const [selectedCategory, setSelectedCategory] = useState<ILPGraphCategory>('core');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('beginner');
  const [currentSession, setCurrentSession] = useState<ILPGraphQuizSession | null>(null);
  const [results, setResults] = useState<QuizResult | null>(null);
  const [stats, setStats] = useState<QuizStats | null>(null);

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
          categoryScores,
        });
      }
    }
  };

  const startQuiz = () => {
    const questions = getQuizQuestions(selectedCategory, selectedDifficulty, 10);
    const newSession: ILPGraphQuizSession = {
      id: generateId(),
      date: new Date().toISOString(),
      category: selectedCategory,
      difficulty: selectedDifficulty,
      currentQuestionIndex: 0,
      answers: [],
      startTime: Date.now(),
    };
    setCurrentSession(newSession);
    setStep('quiz');
  };

  const selectAnswer = (answerId: string) => {
    if (!currentSession) return;

    const updatedSession = {
      ...currentSession,
      answers: [
        ...currentSession.answers,
        {
          questionId: currentQuestion.id,
          selectedAnswerId: answerId,
        },
      ],
    };

    if (currentSession.currentQuestionIndex < questions.length - 1) {
      setCurrentSession({
        ...updatedSession,
        currentQuestionIndex: currentSession.currentQuestionIndex + 1,
      });
    } else {
      // Quiz complete
      finishQuiz(updatedSession);
    }
  };

  const finishQuiz = (session: ILPGraphQuizSession) => {
    const questions = getQuizQuestions(session.category, session.difficulty, 10);
    let correctCount = 0;
    const categoryBreakdown: Record<ILPGraphCategory, { correct: number; total: number }> = {
      core: { correct: 0, total: 0 },
      body: { correct: 0, total: 0 },
      mind: { correct: 0, total: 0 },
      spirit: { correct: 0, total: 0 },
      shadow: { correct: 0, total: 0 },
      'integral-theory': { correct: 0, total: 0 },
    };

    const answersWithCorrectness = session.answers.map((answer) => {
      const question = questions.find((q) => q.id === answer.questionId);
      if (!question) return { ...answer, isCorrect: false };

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
    setStep('results');
    loadStats();
  };

  const resetQuiz = () => {
    setCurrentSession(null);
    setResults(null);
    setStep('menu');
  };

  // Get questions
  const questions = currentSession
    ? getQuizQuestions(currentSession.category, currentSession.difficulty, 10)
    : [];
  const currentQuestion = currentSession ? questions[currentSession.currentQuestionIndex] : null;

  const categoryLabel: Record<ILPGraphCategory, string> = {
    core: 'Core Concepts',
    body: 'Body Module',
    mind: 'Mind Module',
    spirit: 'Spirit Module',
    shadow: 'Shadow Module',
    'integral-theory': 'Integral Theory',
  };

  const difficultyLabel: Record<DifficultyLevel, string> = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-xl p-6 text-white">
      <h1 className="text-3xl font-bold mb-6">ILP Graph Quiz</h1>

      {step === 'menu' && (
        <div className="space-y-6">
          {/* Statistics */}
          {stats && (
            <div className="bg-slate-800 rounded-lg p-4 border border-purple-700">
              <h2 className="text-xl font-semibold mb-4">Your Statistics</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-700 p-3 rounded">
                  <div className="text-2xl font-bold text-green-400">{stats.totalTaken}</div>
                  <div className="text-sm text-slate-300">Quizzes Taken</div>
                </div>
                <div className="bg-slate-700 p-3 rounded">
                  <div className="text-2xl font-bold text-blue-400">{stats.averageScore}%</div>
                  <div className="text-sm text-slate-300">Average Score</div>
                </div>
                <div className="bg-slate-700 p-3 rounded">
                  <div className="text-2xl font-bold text-yellow-400">{stats.bestScore}%</div>
                  <div className="text-sm text-slate-300">Best Score</div>
                </div>
              </div>

              {/* Category breakdown */}
              <div className="mt-4 space-y-2">
                <h3 className="text-sm font-semibold text-slate-300">Category Performance:</h3>
                {Object.entries(stats.categoryScores).map(([cat, score]) => (
                  score.attempts > 0 && (
                    <div key={cat} className="flex justify-between items-center text-sm">
                      <span>{categoryLabel[cat as ILPGraphCategory]}</span>
                      <span className="text-blue-300">
                        {score.bestScore}% ({score.attempts} attempts)
                      </span>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Quiz Selection */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Select Category</h2>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(categoryLabel).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key as ILPGraphCategory)}
                  className={`p-3 rounded-lg font-medium transition-all ${
                    selectedCategory === key
                      ? 'bg-purple-600 border-2 border-purple-400'
                      : 'bg-slate-700 border-2 border-slate-600 hover:border-purple-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Select Difficulty</h2>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(difficultyLabel).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSelectedDifficulty(key as DifficultyLevel)}
                  className={`p-3 rounded-lg font-medium transition-all ${
                    selectedDifficulty === key
                      ? 'bg-blue-600 border-2 border-blue-400'
                      : 'bg-slate-700 border-2 border-slate-600 hover:border-blue-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startQuiz}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all"
          >
            Start Quiz
          </button>
        </div>
      )}

      {step === 'quiz' && currentQuestion && (
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Question {currentSession!.currentQuestionIndex + 1} of {questions.length}</span>
              <span>{categoryLabel[currentSession!.category]}</span>
            </div>
            <div className="bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-600 to-blue-600 h-full transition-all"
                style={{
                  width: `${((currentSession!.currentQuestionIndex + 1) / questions.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="bg-slate-800 rounded-lg p-6 border border-purple-700">
            <h2 className="text-xl font-bold mb-4">{currentQuestion.question}</h2>
            {currentQuestion.description && (
              <p className="text-slate-300 text-sm mb-4">{currentQuestion.description}</p>
            )}

            {/* Difficulty indicator */}
            <div className="mb-4">
              <span
                className={`text-xs font-semibold px-2 py-1 rounded ${
                  currentQuestion.difficulty === 'beginner'
                    ? 'bg-green-900 text-green-200'
                    : currentQuestion.difficulty === 'intermediate'
                      ? 'bg-yellow-900 text-yellow-200'
                      : 'bg-red-900 text-red-200'
                }`}
              >
                {difficultyLabel[currentQuestion.difficulty]}
              </span>
            </div>

            {/* Answers */}
            <div className="space-y-3">
              {currentQuestion.answers.map((answer) => (
                <button
                  key={answer.id}
                  onClick={() => selectAnswer(answer.id)}
                  className="w-full text-left p-4 bg-slate-700 hover:bg-slate-600 border-2 border-slate-600 hover:border-purple-500 rounded-lg transition-all"
                >
                  {answer.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 'results' && results && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">Quiz Complete!</h2>
            <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-2">
              {results.score}%
            </div>
            <p className="text-slate-300">
              You got {results.correctAnswers} out of {results.totalQuestions} questions correct
            </p>
          </div>

          {/* Performance Feedback */}
          <div className="bg-slate-800 rounded-lg p-6 border border-purple-700">
            <h3 className="text-xl font-semibold mb-4">Performance Analysis</h3>
            {results.score >= 80 && (
              <p className="text-green-400 mb-4">🎉 Excellent! You have a strong understanding of the ILP concepts.</p>
            )}
            {results.score >= 60 && results.score < 80 && (
              <p className="text-blue-400 mb-4">✓ Good job! You have solid knowledge of the key concepts.</p>
            )}
            {results.score < 60 && (
              <p className="text-yellow-400 mb-4">Keep exploring! Try reviewing the foundational concepts and retake the quiz.</p>
            )}

            {/* Category breakdown */}
            <div className="space-y-3 mt-4">
              <h4 className="font-semibold text-slate-300">Category Breakdown:</h4>
              {Object.entries(results.categoryBreakdown).map(([category, stats]) => {
                if (stats.total === 0) return null;
                const percentage = Math.round((stats.correct / stats.total) * 100);
                return (
                  <div key={category} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{categoryLabel[category as ILPGraphCategory]}</span>
                      <span className="text-blue-300">
                        {stats.correct}/{stats.total} ({percentage}%)
                      </span>
                    </div>
                    <div className="bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          percentage >= 80
                            ? 'bg-green-600'
                            : percentage >= 60
                              ? 'bg-blue-600'
                              : 'bg-red-600'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time Spent */}
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 text-center">
            <p className="text-slate-300">
              Time spent: <span className="text-white font-semibold">{results.timeSpent} seconds</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={resetQuiz}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg transition-all"
            >
              Back to Menu
            </button>
            <button
              onClick={() => {
                setSelectedDifficulty(selectedDifficulty === 'beginner' ? 'intermediate' : 'advanced');
                startQuiz();
              }}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
