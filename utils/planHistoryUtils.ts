/**
 * Utility functions and helpers for handling plan history and daily progress.
 */

import {
  IntegralBodyPlan,
  PlanHistoryEntry,
  PlanDayFeedback,
  PlanProgressByDay,
} from '../types';

/**
 * Log feedback for a specific day in a plan.
 * This will update both the plan history and the plan progress map.
 */
export function logPlanDayFeedback(
  plan: IntegralBodyPlan,
  dayDate: string,
  feedback: Omit<PlanDayFeedback, 'date' | 'timestamp'>,
  planHistory: PlanHistoryEntry[],
  planProgressByDay: PlanProgressByDay,
): {
  updatedHistory: PlanHistoryEntry[];
  updatedProgress: PlanProgressByDay;
} {
  const dayPlan = plan.days.find(day => day.dayName === feedback.dayName || day.dayName === feedback.dayName);
  const dayName = dayPlan?.dayName || feedback.dayName;
  const timestamp = new Date().toISOString();

  const existingPlanEntry = planHistory.find(entry => entry.planId === plan.id);
  const newFeedbackEntry: PlanDayFeedback = {
    date: dayDate,
    dayName,
    completedWorkout: feedback.completedWorkout,
    completedYinPractices: feedback.completedYinPractices,
    intensityFelt: Math.min(10, Math.max(1, feedback.intensityFelt)),
    energyLevel: Math.min(10, Math.max(1, feedback.energyLevel)),
    blockers: feedback.blockers,
    notes: feedback.notes,
    timestamp,
  };

  let updatedHistoryEntries = planHistory;
  if (existingPlanEntry) {
    const updatedEntry: PlanHistoryEntry = {
      ...existingPlanEntry,
      dailyFeedback: [...existingPlanEntry.dailyFeedback, newFeedbackEntry],
    };
    updatedHistoryEntries = planHistory.map(entry =>
      entry.planId === plan.id ? updatedEntry : entry,
    );
  } else {
    const newEntry: PlanHistoryEntry = {
      planId: plan.id,
      planDate: plan.date,
      weekStartDate: plan.weekStartDate,
      goalStatement: plan.goalStatement,
      startedAt: timestamp,
      status: 'active',
      dailyFeedback: [newFeedbackEntry],
    };
    updatedHistoryEntries = [...planHistory, newEntry];
  }

  const updatedProgress: PlanProgressByDay = {
    ...planProgressByDay,
    [plan.id]: {
      ...(planProgressByDay[plan.id] || {}),
      [dayDate]: newFeedbackEntry,
    },
  };

  return {
    updatedHistory: updatedHistoryEntries,
    updatedProgress,
  };
}

/**
 * Calculate aggregate metrics for a plan based on its feedback.
 */
export function calculatePlanAggregates(entry: PlanHistoryEntry): PlanHistoryEntry {
  const totalDays = entry.dailyFeedback.length;
  const workoutCompletedDays = entry.dailyFeedback.filter(day => day.completedWorkout).length;
  const totalYinPractices = entry.dailyFeedback.reduce((sum, day) => sum + day.completedYinPractices.length, 0);
  const totalIntensity = entry.dailyFeedback.reduce((sum, day) => sum + day.intensityFelt, 0);
  const totalEnergy = entry.dailyFeedback.reduce((sum, day) => sum + day.energyLevel, 0);
  const blockingDays = entry.dailyFeedback.filter(day => day.blockers && day.blockers.trim() !== '').length;

  const aggregateMetrics = {
    workoutComplianceRate: totalDays > 0 ? (workoutCompletedDays / totalDays) * 100 : 0,
    yinComplianceRate: totalDays > 0 ? (totalYinPractices / totalDays) * 100 : 0,
    averageIntensity: totalDays > 0 ? totalIntensity / totalDays : 0,
    averageEnergy: totalDays > 0 ? totalEnergy / totalDays : 0,
    totalBlockerDays: blockingDays,
  };

  return {
    ...entry,
    aggregateMetrics,
  };
}

/**
 * Merge plan history with tracker data to generate a comprehensive history entry.
 */
export function mergePlanWithTracker(
  plan: IntegralBodyPlan,
  completionHistory: Record<string, string[]>,
  planHistory: PlanHistoryEntry[],
): PlanHistoryEntry {
  const planEntry = planHistory.find(entry => entry.planId === plan.id);
  const dayFeedbackMap = planEntry?.dailyFeedback || [];
  const dailyFeedback: PlanDayFeedback[] = plan.days.map(day => {
    const dayFeedback = dayFeedbackMap.find(feedback => feedback.dayName === day.dayName);
    const completionDates = dayFeedback ? [dayFeedback.date] : [];
    const completedPractices = day.yinPractices.reduce<string[]>((acc, practice) => {
      const dates = completionHistory[practice.name] || [];
      const isCompleted = dates.some(date => completionDates.includes(date));
      if (isCompleted) {
        acc.push(practice.name);
      }
      return acc;
    }, []);

    return {
      date: dayFeedback?.date || '',
      dayName: day.dayName,
      completedWorkout: dayFeedback?.completedWorkout || false,
      completedYinPractices: completedPractices,
      intensityFelt: dayFeedback?.intensityFelt || 0,
      energyLevel: dayFeedback?.energyLevel || 0,
      blockers: dayFeedback?.blockers,
      notes: dayFeedback?.notes,
      timestamp: dayFeedback?.timestamp || '',
    };
  });

  return calculatePlanAggregates({
    planId: plan.id,
    planDate: plan.date,
    weekStartDate: plan.weekStartDate,
    goalStatement: plan.goalStatement,
    startedAt: planEntry?.startedAt || plan.date,
    status: planEntry?.status || 'active',
    dailyFeedback,
  });
}

/**
 * Map plan metadata to daily progress entries.
 */
export function mapPlanDaysToProgress(
  plan: IntegralBodyPlan,
  planProgress: PlanProgressByDay,
): PlanDayFeedback[] {
  const planProgressEntries = planProgress[plan.id] || {};
  return plan.days.map(day =>
    planProgressEntries[day.dayName] || {
      date: '',
      dayName: day.dayName,
      completedWorkout: false,
      completedYinPractices: [],
      intensityFelt: 0,
      energyLevel: 0,
      timestamp: '',
    },
  );
}
