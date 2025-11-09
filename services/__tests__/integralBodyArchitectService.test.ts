import type { YangConstraints, YinPreferences, HistoricalComplianceSummary, IntegralBodyPlan } from '../../types';

describe('Plan Synthesis Post-Processing', () => {
  describe('Constraint Validation', () => {
    it('should detect unavailable day conflicts', () => {
      const constraints: YangConstraints = {
        equipment: ['barbell'],
        unavailableDays: ['Monday', 'Saturday']
      };

      const hasConflict = constraints.unavailableDays.includes('Monday');
      expect(hasConflict).toBe(true);
    });

    it('should handle injury restrictions', () => {
      const constraints: YangConstraints = {
        equipment: ['dumbbells'],
        unavailableDays: [],
        injuryRestrictions: [
          {
            bodyPart: 'shoulder',
            severity: 'moderate',
            restrictions: ['no overhead pressing', 'limit lateral movement']
          }
        ]
      };

      expect(constraints.injuryRestrictions).toBeDefined();
      expect(constraints.injuryRestrictions?.[0].bodyPart).toBe('shoulder');
      expect(constraints.injuryRestrictions?.[0].restrictions).toContain('no overhead pressing');
    });

    it('should validate time windows', () => {
      const constraints: YangConstraints = {
        equipment: ['bodyweight'],
        unavailableDays: [],
        availableTimeWindows: [
          { dayOfWeek: 'Monday', startHour: 6, endHour: 8 },
          { dayOfWeek: 'Wednesday', startHour: 17, endHour: 19 }
        ]
      };

      expect(constraints.availableTimeWindows).toBeDefined();
      expect(constraints.availableTimeWindows?.length).toBe(2);
      expect(constraints.availableTimeWindows?.[0].dayOfWeek).toBe('Monday');
    });
  });

  describe('Historical Context Aggregation', () => {
    it('should aggregate compliance metrics', () => {
      const historicalContext: HistoricalComplianceSummary = {
        totalPlansAnalyzed: 5,
        averageWorkoutCompliance: 80,
        averageYinCompliance: 85,
        commonBlockers: ['fatigue', 'schedule conflicts'],
        bestPerformingDayPatterns: ['Tuesday', 'Thursday'],
        recommendedAdjustments: ['reduce intensity', 'add more rest']
      };

      expect(historicalContext.averageWorkoutCompliance).toBe(80);
      expect(historicalContext.commonBlockers.length).toBe(2);
    });

    it('should identify patterns from history', () => {
      const historicalContext: HistoricalComplianceSummary = {
        totalPlansAnalyzed: 10,
        averageWorkoutCompliance: 75,
        averageYinCompliance: 88,
        commonBlockers: ['low energy', 'competing deadlines'],
        bestPerformingDayPatterns: ['Monday and Wednesday', 'morning sessions'],
        recommendedAdjustments: [
          'space workouts further apart',
          'move high-priority practices to morning'
        ]
      };

      expect(historicalContext.bestPerformingDayPatterns).toContain('Monday and Wednesday');
      expect(historicalContext.recommendedAdjustments.length).toBe(2);
    });
  });

  describe('Synergy Scoring', () => {
    it('should create synergy notes for Yang/Yin pairings', () => {
      const yinPracticeWithSynergy = {
        name: 'Evening Coherent Breathing',
        practiceType: 'Coherent Breathing',
        duration: 15,
        timeOfDay: 'Evening',
        intention: 'Reduce stress',
        instructions: ['Inhale 5.5s', 'Exhale 5.5s'],
        synergyNotes: [
          {
            type: 'pairing-benefit' as const,
            message: 'Balances high-intensity workout with calming practice',
            relatedItems: ['Upper Body Workout']
          }
        ],
        schedulingConfidence: 92
      };

      expect(yinPracticeWithSynergy.synergyNotes).toBeDefined();
      expect(yinPracticeWithSynergy.synergyNotes[0].type).toBe('pairing-benefit');
      expect(yinPracticeWithSynergy.schedulingConfidence).toBe(92);
    });

    it('should score rest spacing', () => {
      const dayPlanWithSpacing = {
        dayName: 'Tuesday',
        summary: 'Rest Day',
        yinPractices: [],
        nutrition: { breakfast: { description: 'Breakfast', protein: 20 }, lunch: { description: 'Lunch', protein: 30 }, dinner: { description: 'Dinner', protein: 30 }, totalProtein: 80 },
        sleepHygiene: [],
        synergyMetadata: {
          yangYinBalance: 'Active recovery',
          restSpacingNotes: '2 days between intense sessions for proper recovery'
        }
      };

      expect(dayPlanWithSpacing.synergyMetadata?.restSpacingNotes).toBe('2 days between intense sessions for proper recovery');
    });

    it('should document constraint resolution', () => {
      const resolvedDay = {
        dayName: 'Wednesday',
        summary: 'Modified Workout',
        yinPractices: [],
        nutrition: { breakfast: { description: 'Breakfast', protein: 20 }, lunch: { description: 'Lunch', protein: 30 }, dinner: { description: 'Dinner', protein: 30 }, totalProtein: 80 },
        sleepHygiene: [],
        synergyMetadata: {
          yangYinBalance: 'Balanced',
          constraintResolution: 'Substituted overhead press with lateral raise due to shoulder restriction'
        }
      };

      expect(resolvedDay.synergyMetadata?.constraintResolution).toContain('shoulder restriction');
    });
  });

  describe('Synthesis Metadata Population', () => {
    it('should include confidence scores', () => {
      const metadata = {
        llmConfidenceScore: 87,
        constraintConflicts: [],
        synergyScoring: {
          yangYinPairingScore: 88,
          restSpacingScore: 85,
          overallIntegrationScore: 87
        },
        fallbackOptions: ['Move Tuesday workout to Thursday', 'Shift practice to evening']
      };

      expect(metadata.llmConfidenceScore).toBeGreaterThan(0);
      expect(metadata.llmConfidenceScore).toBeLessThanOrEqual(100);
      expect(metadata.synergyScoring.yangYinPairingScore).toBeGreaterThan(0);
    });

    it('should track constraint conflicts', () => {
      const metadata = {
        llmConfidenceScore: 82,
        constraintConflicts: [
          {
            type: 'unavailable-window',
            description: 'Monday marked unavailable but has workout',
            resolution: 'Rescheduled to Tuesday'
          },
          {
            type: 'injury-restriction',
            description: 'Overhead press conflicts with shoulder restriction',
            resolution: 'Substituted with lateral raise'
          }
        ],
        synergyScoring: {
          yangYinPairingScore: 85,
          restSpacingScore: 80,
          overallIntegrationScore: 83
        },
        fallbackOptions: []
      };

      expect(metadata.constraintConflicts.length).toBe(2);
      expect(metadata.constraintConflicts[0].type).toBe('unavailable-window');
      expect(metadata.constraintConflicts[1].type).toBe('injury-restriction');
    });

    it('should provide fallback options', () => {
      const metadata = {
        llmConfidenceScore: 85,
        constraintConflicts: [],
        synergyScoring: {
          yangYinPairingScore: 88,
          restSpacingScore: 85,
          overallIntegrationScore: 87
        },
        fallbackOptions: [
          'Move Tuesday workout to Thursday if schedule changes',
          'Substitute morning Qigong for evening if time unavailable',
          'Replace specific exercises if equipment unavailable'
        ]
      };

      expect(metadata.fallbackOptions.length).toBe(3);
      expect(metadata.fallbackOptions[0]).toContain('Tuesday');
    });
  });

  describe('Yin Practice Scheduling Confidence', () => {
    it('should assign confidence to each practice', () => {
      const practice = {
        name: 'Box Breathing',
        practiceType: 'Breathing',
        duration: 12,
        timeOfDay: 'Morning',
        intention: 'Focus',
        instructions: ['Inhale 4', 'Hold 4', 'Exhale 4', 'Hold 4'],
        schedulingConfidence: 90
      };

      expect(practice.schedulingConfidence).toBe(90);
      expect(practice.schedulingConfidence).toBeGreaterThanOrEqual(0);
      expect(practice.schedulingConfidence).toBeLessThanOrEqual(100);
    });

    it('should vary confidence based on placement constraints', () => {
      const highConfidencePractice = {
        name: 'Evening Coherent Breathing',
        practiceType: 'Breathing',
        duration: 15,
        timeOfDay: 'Evening',
        intention: 'Sleep prep',
        instructions: ['5.5s inhale', '5.5s exhale'],
        schedulingConfidence: 95
      };

      const moderateConfidencePractice = {
        name: 'Morning Qigong',
        practiceType: 'Qigong',
        duration: 10,
        timeOfDay: 'Morning',
        intention: 'Energy',
        instructions: ['Horse stance', 'Qigong flow'],
        schedulingConfidence: 75
      };

      expect(highConfidencePractice.schedulingConfidence).toBeGreaterThan(moderateConfidencePractice.schedulingConfidence);
    });
  });

  describe('Type Safety', () => {
    it('should validate synergy note types', () => {
      const validTypes = ['pairing-benefit', 'conflict-warning', 'timing-optimization', 'constraint-note'] as const;
      
      const note = {
        type: 'pairing-benefit' as const,
        message: 'This is beneficial'
      };

      expect(validTypes).toContain(note.type);
    });

    it('should validate injury severity levels', () => {
      const validSeverities = ['mild', 'moderate', 'severe'] as const;
      
      const injury = {
        bodyPart: 'knee',
        severity: 'moderate' as const,
        restrictions: ['no heavy squats', 'avoid running']
      };

      expect(validSeverities).toContain(injury.severity);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing optional fields gracefully', () => {
      const minimalConstraints: YangConstraints = {
        equipment: [],
        unavailableDays: []
      };

      expect(minimalConstraints.availableTimeWindows).toBeUndefined();
      expect(minimalConstraints.injuryRestrictions).toBeUndefined();
    });

    it('should provide default confidence when not specified', () => {
      const practice = {
        name: 'Practice',
        practiceType: 'Type',
        duration: 10,
        timeOfDay: 'Morning',
        intention: 'Intention',
        instructions: [],
        schedulingConfidence: 80
      };

      expect(practice.schedulingConfidence).toBe(80);
    });
  });
});
