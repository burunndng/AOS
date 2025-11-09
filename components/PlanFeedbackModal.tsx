import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';
import { IntegralBodyPlan, PlanDayFeedback } from '../types';

interface PlanFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: IntegralBodyPlan | null;
  onSubmitFeedback: (dayDate: string, dayName: string, feedback: Omit<PlanDayFeedback, 'date' | 'timestamp' | 'dayName'>) => void;
}

export default function PlanFeedbackModal({
  isOpen,
  onClose,
  plan,
  onSubmitFeedback,
}: PlanFeedbackModalProps) {
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [feedbackData, setFeedbackData] = useState<Record<string, Omit<PlanDayFeedback, 'date' | 'timestamp' | 'dayName'>>>({});

  if (!isOpen || !plan) return null;

  const days = plan.days;
  const currentDay = days[currentDayIndex];
  const baseDate = new Date(plan.weekStartDate);
  const currentDayDate = new Date(baseDate);
  currentDayDate.setDate(baseDate.getDate() + currentDayIndex);
  const dayDateStr = currentDayDate.toISOString().split('T')[0];

  const currentFeedback = feedbackData[dayDateStr] || {
    completedWorkout: false,
    completedYinPractices: [],
    intensityFelt: 5,
    energyLevel: 5,
    blockers: '',
    notes: '',
  };

  const handleNextDay = () => {
    if (currentDayIndex < days.length - 1) {
      setCurrentDayIndex(prev => prev + 1);
    }
  };

  const handlePrevDay = () => {
    if (currentDayIndex > 0) {
      setCurrentDayIndex(prev => prev - 1);
    }
  };

  const handleSubmitAndNext = () => {
    onSubmitFeedback(dayDateStr, currentDay.dayName, currentFeedback);
    setFeedbackData(prev => ({
      ...prev,
      [dayDateStr]: currentFeedback,
    }));
    handleNextDay();
  };

  const handleSubmitAndClose = () => {
    onSubmitFeedback(dayDateStr, currentDay.dayName, currentFeedback);
    onClose();
  };

  const toggleYinPractice = (practiceName: string) => {
    setFeedbackData(prev => ({
      ...prev,
      [dayDateStr]: {
        ...currentFeedback,
        completedYinPractices: currentFeedback.completedYinPractices.includes(practiceName)
          ? currentFeedback.completedYinPractices.filter(p => p !== practiceName)
          : [...currentFeedback.completedYinPractices, practiceName],
      },
    }));
  };

  const progressPercent = ((currentDayIndex + 1) / days.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-100 font-mono">Daily Feedback</h2>
            <p className="text-sm text-slate-400 mt-1">How did {currentDay.dayName} go?</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-300">Day {currentDayIndex + 1} of {days.length}</span>
              <span className="text-xs text-slate-400">{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-accent to-teal-400 h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Workout completion */}
          <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-400" />
              Workout
            </h3>
            {currentDay.workout ? (
              <div>
                <div className="text-sm text-slate-300 mb-3">
                  <p className="font-medium">{currentDay.workout.name}</p>
                  <p className="text-xs text-slate-400 mt-1">{currentDay.workout.duration} minutes</p>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentFeedback.completedWorkout}
                    onChange={e => setFeedbackData(prev => ({
                      ...prev,
                      [dayDateStr]: { ...currentFeedback, completedWorkout: e.target.checked },
                    }))}
                    className="w-5 h-5 rounded border-slate-600 bg-slate-700 cursor-pointer"
                  />
                  <span className="text-slate-300">I completed this workout</span>
                </label>
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">Rest day - no workout planned</p>
            )}
          </div>

          {/* Yin practices completion */}
          {currentDay.yinPractices.length > 0 && (
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                <CheckCircle2 size={20} className="text-teal-400" />
                Yin Practices
              </h3>
              <div className="space-y-3">
                {currentDay.yinPractices.map((practice, idx) => (
                  <label key={idx} className="flex items-start gap-3 cursor-pointer p-2 hover:bg-slate-800 rounded transition">
                    <input
                      type="checkbox"
                      checked={currentFeedback.completedYinPractices.includes(practice.name)}
                      onChange={() => toggleYinPractice(practice.name)}
                      className="w-5 h-5 rounded border-slate-600 bg-slate-700 cursor-pointer mt-0.5 flex-shrink-0"
                    />
                    <div className="flex-1">
                      <p className="text-slate-300 font-medium">{practice.name}</p>
                      <p className="text-xs text-slate-400">{practice.duration} min • {practice.timeOfDay}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Intensity & Energy */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Intensity Felt (1-10)
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={currentFeedback.intensityFelt}
                onChange={e => setFeedbackData(prev => ({
                  ...prev,
                  [dayDateStr]: { ...currentFeedback, intensityFelt: parseInt(e.target.value) },
                }))}
                className="w-full accent-accent"
              />
              <div className="text-center text-2xl font-bold text-accent mt-2">
                {currentFeedback.intensityFelt}
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Energy Level (1-10)
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={currentFeedback.energyLevel}
                onChange={e => setFeedbackData(prev => ({
                  ...prev,
                  [dayDateStr]: { ...currentFeedback, energyLevel: parseInt(e.target.value) },
                }))}
                className="w-full accent-teal-500"
              />
              <div className="text-center text-2xl font-bold text-teal-400 mt-2">
                {currentFeedback.energyLevel}
              </div>
            </div>
          </div>

          {/* Blockers */}
          <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-500" />
              Any blockers or challenges?
            </label>
            <textarea
              value={currentFeedback.blockers || ''}
              onChange={e => setFeedbackData(prev => ({
                ...prev,
                [dayDateStr]: { ...currentFeedback, blockers: e.target.value },
              }))}
              placeholder="e.g., 'Low energy in the morning', 'Couldn't find time for evening practice'"
              rows={2}
              className="w-full bg-slate-800 border border-slate-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100 text-sm"
            />
          </div>

          {/* Additional notes */}
          <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Additional notes or reflections
            </label>
            <textarea
              value={currentFeedback.notes || ''}
              onChange={e => setFeedbackData(prev => ({
                ...prev,
                [dayDateStr]: { ...currentFeedback, notes: e.target.value },
              }))}
              placeholder="e.g., 'Felt strong today', 'Need more recovery time'"
              rows={2}
              className="w-full bg-slate-800 border border-slate-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100 text-sm"
            />
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between gap-3 pt-6 border-t border-slate-700">
            <div className="flex gap-3">
              <button
                onClick={handlePrevDay}
                disabled={currentDayIndex === 0}
                className="px-4 py-2 rounded-md font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <button
                onClick={handleNextDay}
                disabled={currentDayIndex === days.length - 1}
                className="px-4 py-2 rounded-md font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>

            <div className="flex gap-3">
              {currentDayIndex < days.length - 1 && (
                <button
                  onClick={handleSubmitAndNext}
                  className="btn-luminous px-6 py-2 rounded-md font-medium"
                >
                  Save & Next
                </button>
              )}
              {currentDayIndex === days.length - 1 && (
                <button
                  onClick={handleSubmitAndClose}
                  className="btn-luminous px-6 py-2 rounded-md font-medium"
                >
                  Complete Feedback
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
