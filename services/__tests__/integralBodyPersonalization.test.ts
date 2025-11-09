/**
 * Unit tests for integralBodyPersonalization service
 * Tests deterministic adjustments given mock history datasets
 * 
 * Note: These tests use Vitest framework
 */

import { describe, it, expect } from 'vitest';
import { PlanHistoryEntry } from '../../types';
import { 
  analyzeHistoryAndPersonalize, 
  buildPersonalizationPromptInsertion 
} from '../integralBodyPersonalization';

/**
 * Test fixture: High compliance plan history
 */
const highComplianceHistory: PlanHistoryEntry[] = [
  {
    planId: 'plan-1',
    planDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    weekStartDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    goalStatement: 'Build strength and maintain energy',
    startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed' as const,
    dailyFeedback: [
      {
        date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dayName: 'Monday',
        completedWorkout: true,
        completedYinPractices: ['Coherent Breathing', 'Progressive Relaxation'],
        intensityFelt: 7,
        energyLevel: 8,
        timestamp: new Date().toISOString(),
      },
      {
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dayName: 'Tuesday',
        completedWorkout: false,
        completedYinPractices: ['Qigong'],
        intensityFelt: 5,
        energyLevel: 7,
        timestamp: new Date().toISOString(),
      },
      {
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dayName: 'Wednesday',
        completedWorkout: true,
        completedYinPractices: ['Progressive Relaxation'],
        intensityFelt: 7,
        energyLevel: 8,
        timestamp: new Date().toISOString(),
      },
      {
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dayName: 'Thursday',
        completedWorkout: false,
        completedYinPractices: ['Coherent Breathing', 'Body Scan'],
        intensityFelt: 4,
        energyLevel: 8,
        timestamp: new Date().toISOString(),
      },
      {
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dayName: 'Friday',
        completedWorkout: true,
        completedYinPractices: ['Qigong'],
        intensityFelt: 7,
        energyLevel: 7,
        timestamp: new Date().toISOString(),
      },
      {
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dayName: 'Saturday',
        completedWorkout: false,
        completedYinPractices: ['Progressive Relaxation'],
        intensityFelt: 3,
        energyLevel: 7,
        timestamp: new Date().toISOString(),
      },
      {
        date: new Date().toISOString().split('T')[0],
        dayName: 'Sunday',
        completedWorkout: false,
        completedYinPractices: ['Coherent Breathing'],
        intensityFelt: 2,
        energyLevel: 8,
        timestamp: new Date().toISOString(),
      },
    ],
    aggregateMetrics: {
      workoutComplianceRate: 42.86, // 3/7 workouts
      yinComplianceRate: 100, // All days had practices
      averageIntensity: 5.0,
      averageEnergy: 7.57,
      totalBlockerDays: 0,
    },
  },
];

/**
 * Test fixture: Low compliance with blockers
 */
const lowComplianceHistory: PlanHistoryEntry[] = [
  {
    planId: 'plan-2',
    planDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    weekStartDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    goalStatement: 'Increase fitness and flexibility',
    startedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'abandoned' as const,
    dailyFeedback: [
      {
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dayName: 'Monday',
        completedWorkout: true,
        completedYinPractices: [],
        intensityFelt: 9,
        energyLevel: 4,
        blockers: 'Muscle soreness',
        timestamp: new Date().toISOString(),
      },
      {
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dayName: 'Tuesday',
        completedWorkout: false,
        completedYinPractices: [],
        intensityFelt: 3,
        energyLevel: 3,
        blockers: 'Time constraints',
        timestamp: new Date().toISOString(),
      },
      {
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dayName: 'Wednesday',
        completedWorkout: false,
        completedYinPractices: [],
        intensityFelt: 2,
        energyLevel: 3,
        blockers: 'Time constraints',
        timestamp: new Date().toISOString(),
      },
      {
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dayName: 'Thursday',
        completedWorkout: false,
        completedYinPractices: [],
        intensityFelt: 2,
        energyLevel: 2,
        blockers: 'Fatigue',
        timestamp: new Date().toISOString(),
      },
      {
        date: new Date().toISOString().split('T')[0],
        dayName: 'Friday',
        completedWorkout: true,
        completedYinPractices: [],
        intensityFelt: 8,
        energyLevel: 3,
        blockers: 'Fatigue',
        timestamp: new Date().toISOString(),
      },
    ],
    aggregateMetrics: {
      workoutComplianceRate: 40, // 2/5 workouts
      yinComplianceRate: 0, // No practices
      averageIntensity: 4.8,
      averageEnergy: 3.0,
      totalBlockerDays: 3,
    },
  },
];

/**
 * Test fixture: High energy, high intensity pattern
 */
const highIntensityHistory: PlanHistoryEntry[] = [
  {
    planId: 'plan-3',
    planDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    weekStartDate: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000).toISOString(),
    goalStatement: 'Push for performance gains',
    startedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed' as const,
    dailyFeedback: [
      {
        date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dayName: 'Monday',
        completedWorkout: true,
        completedYinPractices: [],
        intensityFelt: 9,
        energyLevel: 9,
        timestamp: new Date().toISOString(),
      },
      {
        date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dayName: 'Tuesday',
        completedWorkout: true,
        completedYinPractices: [],
        intensityFelt: 9,
        energyLevel: 8,
        timestamp: new Date().toISOString(),
      },
      {
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dayName: 'Wednesday',
        completedWorkout: true,
        completedYinPractices: [],
        intensityFelt: 8,
        energyLevel: 7,
        timestamp: new Date().toISOString(),
      },
      {
        date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dayName: 'Thursday',
        completedWorkout: true,
        completedYinPractices: [],
        intensityFelt: 8,
        energyLevel: 6,
        timestamp: new Date().toISOString(),
      },
      {
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dayName: 'Friday',
        completedWorkout: false,
        completedYinPractices: [],
        intensityFelt: 5,
        energyLevel: 5,
        timestamp: new Date().toISOString(),
      },
      {
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dayName: 'Saturday',
        completedWorkout: false,
        completedYinPractices: [],
        intensityFelt: 3,
        energyLevel: 6,
        timestamp: new Date().toISOString(),
      },
      {
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dayName: 'Sunday',
        completedWorkout: false,
        completedYinPractices: [],
        intensityFelt: 2,
        energyLevel: 7,
        timestamp: new Date().toISOString(),
      },
    ],
    aggregateMetrics: {
      workoutComplianceRate: 57.14, // 4/7 workouts
      yinComplianceRate: 0,
      averageIntensity: 6.29,
      averageEnergy: 6.86,
      totalBlockerDays: 0,
    },
  },
];

describe('integralBodyPersonalization', () => {
  describe('analyzeHistoryAndPersonalize', () => {
    it('should generate default summary when history is empty', () => {
      const result = analyzeHistoryAndPersonalize([]);
      
      expect(result.planCount).toBe(0);
      expect(result.adjustmentDirectives).toHaveLength(0);
      expect(result.recommendedIntensityLevel).toBe('moderate');
    });

    it('should analyze high compliance history correctly', () => {
      const result = analyzeHistoryAndPersonalize(highComplianceHistory);
      
      expect(result.planCount).toBe(1);
      expect(result.timeWeightedAverage.workoutCompliance).toBeGreaterThan(35);
      expect(result.timeWeightedAverage.yinCompliance).toBeGreaterThan(90);
      expect(result.timeWeightedAverage.averageEnergy).toBeGreaterThan(7);
      expect(result.inferredPreferences.length).toBeGreaterThan(0);
    });

    it('should detect low compliance and suggest load reduction', () => {
      const result = analyzeHistoryAndPersonalize(lowComplianceHistory);
      
      expect(result.planCount).toBe(1);
      expect(result.timeWeightedAverage.workoutCompliance).toBeLessThan(50);
      expect(result.adjustmentDirectives.some(d => d.type === 'load-reduction')).toBe(true);
    });

    it('should recommend low intensity for low compliance', () => {
      const result = analyzeHistoryAndPersonalize(lowComplianceHistory);
      
      expect(result.recommendedIntensityLevel).toBe('low');
    });

    it('should identify common blockers', () => {
      const result = analyzeHistoryAndPersonalize(lowComplianceHistory);
      
      expect(result.commonBlockers.length).toBeGreaterThan(0);
      expect(result.commonBlockers[0]).toMatch(/time constraints|fatigue|muscle soreness/i);
    });

    it('should recommend shorter Yin practices for low compliance', () => {
      const result = analyzeHistoryAndPersonalize(lowComplianceHistory);
      
      expect(result.recommendedYinDuration).toBeLessThanOrEqual(10);
    });

    it('should detect high intensity patterns and suggest moderation', () => {
      const result = analyzeHistoryAndPersonalize(highIntensityHistory);
      
      // Should suggest intensity moderation
      const hasIntensityDirective = result.adjustmentDirectives.some(
        d => d.type === 'intensity-nudge' || d.type === 'recovery-boost'
      );
      expect(hasIntensityDirective || result.recommendedIntensityLevel === 'moderate').toBe(true);
    });

    it('should apply time decay to older plans', () => {
      // Create a mixed history with recent and old plans
      const mixedHistory: PlanHistoryEntry[] = [
        highComplianceHistory[0],
        {
          ...lowComplianceHistory[0],
          planId: 'plan-old',
          planDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(), // >28 days old
        },
      ];

      const result = analyzeHistoryAndPersonalize(mixedHistory);
      
      // Should only count 1 plan (recent one)
      expect(result.planCount).toBe(1);
    });
  });

  describe('buildPersonalizationPromptInsertion', () => {
    it('should return empty string for empty history', () => {
      const summary = analyzeHistoryAndPersonalize([]);
      const insertion = buildPersonalizationPromptInsertion(summary);
      
      expect(insertion).toBe('');
    });

    it('should build comprehensive prompt insertion for high compliance', () => {
      const summary = analyzeHistoryAndPersonalize(highComplianceHistory);
      const insertion = buildPersonalizationPromptInsertion(summary);
      
      expect(insertion).toContain('PERSONALIZATION & ADAPTIVE TUNING');
      expect(insertion).toContain('Workout Compliance');
      expect(insertion).toContain('Yin Practice Compliance');
      expect(insertion).toContain('Recommended Intensity');
    });

    it('should include adjustment directives in prompt', () => {
      const summary = analyzeHistoryAndPersonalize(lowComplianceHistory);
      const insertion = buildPersonalizationPromptInsertion(summary);
      
      if (summary.adjustmentDirectives.length > 0) {
        expect(insertion).toContain('RECOMMENDED ADJUSTMENTS');
      }
    });

    it('should include blockers in prompt', () => {
      const summary = analyzeHistoryAndPersonalize(lowComplianceHistory);
      const insertion = buildPersonalizationPromptInsertion(summary);
      
      if (summary.commonBlockers.length > 0) {
        expect(insertion).toContain('KNOWN BLOCKERS');
      }
    });
  });

  describe('Deterministic output validation', () => {
    it('should produce deterministic results for same input', () => {
      const result1 = analyzeHistoryAndPersonalize(highComplianceHistory);
      const result2 = analyzeHistoryAndPersonalize(highComplianceHistory);
      
      expect(result1).toEqual(result2);
    });

    it('should have confidence scores between 0 and 100', () => {
      const result = analyzeHistoryAndPersonalize(highComplianceHistory);
      
      result.adjustmentDirectives.forEach(d => {
        expect(d.confidence).toBeGreaterThanOrEqual(0);
        expect(d.confidence).toBeLessThanOrEqual(100);
      });
    });

    it('should have valid impact levels', () => {
      const result = analyzeHistoryAndPersonalize(highComplianceHistory);
      
      result.adjustmentDirectives.forEach(d => {
        expect(['low', 'medium', 'high']).toContain(d.impact);
      });
    });
  });
});
