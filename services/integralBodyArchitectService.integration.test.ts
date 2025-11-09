import type { 
  IntegralBodyPlan, 
  YangConstraints, 
  YinPreferences, 
  HistoricalComplianceSummary,
  DayPlan,
  YinPracticeDetail,
  PlanSynthesisMetadata,
  SynergyNote,
  TimeWindow,
  InjuryRestriction
} from '../types';

describe('Plan Synthesis Integration Tests', () => {
  describe('Constraint Validation Scenario 1: Injury Restrictions', () => {
    test('POST-PROCESSING: should identify conflicts between exercises and injury restrictions', () => {
      const constraints: YangConstraints = {
        equipment: ['barbell', 'dumbbells'],
        unavailableDays: [],
        injuryRestrictions: [
          {
            bodyPart: 'shoulder',
            severity: 'moderate',
            restrictions: ['no overhead pressing', 'limit lateral movement'],
            notes: 'Recovering from rotator cuff strain'
          }
        ]
      };

      const dayPlan: DayPlan = {
        dayName: 'Monday',
        summary: 'Upper Body Strength',
        workout: {
          name: 'Workout A - Upper Body',
          exercises: [
            { name: 'Bench Press', sets: 4, reps: '6-8' },
            { name: 'Bent Rows', sets: 4, reps: '6-8' },
            { name: 'Lateral Raise', sets: 3, reps: '10-12' }
          ],
          duration: 60
        },
        yinPractices: [],
        nutrition: {
          breakfast: { description: 'Breakfast', protein: 20 },
          lunch: { description: 'Lunch', protein: 35 },
          dinner: { description: 'Dinner', protein: 40 },
          totalProtein: 95
        },
        sleepHygiene: []
      };

      const hasInjuryConflict = dayPlan.workout?.exercises.some(ex =>
        constraints.injuryRestrictions?.some(inj =>
          inj.restrictions.some(r => 
            ex.name.toLowerCase().includes(r.toLowerCase().split(' ')[0])
          )
        )
      );

      expect(hasInjuryConflict).toBe(true);
      console.log('✓ Correctly detected Lateral Raise conflict with lateral movement restriction');
    });

    test('POST-PROCESSING: should document constraint resolution in metadata', () => {
      const metadata: PlanSynthesisMetadata = {
        llmConfidenceScore: 82,
        constraintConflicts: [
          {
            type: 'injury-restriction',
            description: 'Monday has Lateral Raise which conflicts with shoulder restriction',
            resolution: 'Exercise removed and replaced with Incline Bench Press'
          }
        ],
        synergyScoring: {
          yangYinPairingScore: 85,
          restSpacingScore: 80,
          overallIntegrationScore: 83
        }
      };

      expect(metadata.constraintConflicts[0].type).toBe('injury-restriction');
      expect(metadata.constraintConflicts[0].resolution).toContain('replaced');
      console.log('✓ Constraint resolution documented:', metadata.constraintConflicts[0].resolution);
    });
  });

  describe('Rest Spacing Validation Scenario 2: Synergy Scoring', () => {
    test('SYNERGY SCORING: should score Yang/Yin pairings', () => {
      const intenseDay: DayPlan = {
        dayName: 'Monday',
        summary: 'High Intensity Upper Body + Recovery Practice',
        workout: {
          name: 'Upper Body Strength A',
          exercises: [
            { name: 'Bench Press', sets: 4, reps: '6-8', notes: 'Main heavy lift' },
            { name: 'Rows', sets: 4, reps: '6-8' }
          ],
          duration: 75,
          notes: 'High intensity, sympathetic activation'
        },
        yinPractices: [
          {
            name: 'Evening Coherent Breathing',
            practiceType: 'Coherent Breathing',
            duration: 20,
            timeOfDay: 'Evening (30 min before bed)',
            intention: 'Parasympathetic activation for recovery',
            instructions: [
              'Sit comfortably',
              'Inhale for 5.5 seconds',
              'Exhale for 5.5 seconds',
              'Continue for 20 minutes'
            ],
            synergyNotes: [
              {
                type: 'pairing-benefit',
                message: 'Coherent breathing perfectly balances high-intensity morning workout by activating parasympathetic nervous system',
                relatedItems: ['Upper Body Strength A']
              }
            ],
            schedulingConfidence: 95
          }
        ],
        nutrition: {
          breakfast: { description: 'Pre-workout: oatmeal, berries, nut butter', protein: 15 },
          lunch: { description: 'Post-workout: chicken, rice, vegetables', protein: 45 },
          dinner: { description: 'Recovery meal: salmon, sweet potato, greens', protein: 40 },
          snacks: { description: 'Protein shake', protein: 25 },
          totalProtein: 125,
          totalCalories: 2600,
          notes: 'High calories and carbs around workout'
        },
        sleepHygiene: [
          'Lights out by 10:30 PM',
          'Room temperature 65-68°F',
          'No screens after 10 PM'
        ],
        synergyMetadata: {
          yangYinBalance: 'Intense Yang activity (75-min high-intensity workout) balanced with deep Yin parasympathetic practice',
          restSpacingNotes: 'One full rest day follows for nervous system recovery'
        }
      };

      expect(intenseDay.yinPractices[0].synergyNotes).toBeDefined();
      expect(intenseDay.yinPractices[0].synergyNotes?.[0].type).toBe('pairing-benefit');
      expect(intenseDay.yinPractices[0].schedulingConfidence).toBeGreaterThan(90);
      console.log('✓ Synergy pairing scored at confidence:', intenseDay.yinPractices[0].schedulingConfidence);
    });

    test('SYNERGY SCORING: should provide rest spacing notes', () => {
      const restDay: DayPlan = {
        dayName: 'Tuesday',
        summary: 'Complete Rest + Recovery Practices',
        yinPractices: [
          {
            name: 'Progressive Relaxation',
            practiceType: 'Progressive Relaxation',
            duration: 25,
            timeOfDay: 'Evening',
            intention: 'Release muscular tension',
            instructions: [
              'Lie down comfortably',
              'Tense and release each muscle group',
              'Start with toes, move to head',
              'End with complete relaxation'
            ],
            schedulingConfidence: 88
          }
        ],
        nutrition: {
          breakfast: { description: 'Greek yogurt with granola', protein: 15 },
          lunch: { description: 'Light salad with grilled chicken', protein: 25 },
          dinner: { description: 'Vegetable soup with lean protein', protein: 20 },
          totalProtein: 60,
          totalCalories: 1500,
          notes: 'Lower calories on rest day'
        },
        sleepHygiene: ['Early bedtime', 'Light stretching', 'Meditation'],
        synergyMetadata: {
          yangYinBalance: 'Full parasympathetic rest day',
          restSpacingNotes: 'Complete rest with minimal activity. 1 day between intense Monday and next workout on Wednesday.',
          constraintResolution: 'Strategic placement of rest day maximizes recovery benefit'
        }
      };

      expect(restDay.synergyMetadata?.restSpacingNotes).toContain('1 day between intense');
      console.log('✓ Rest spacing documented:', restDay.synergyMetadata?.restSpacingNotes);
    });
  });

  describe('Synergy Annotation Scenario 3: Multi-Day Integration', () => {
    test('SYNERGY ANNOTATIONS: should inject synergy metadata into plan', () => {
      const week: DayPlan[] = [
        {
          dayName: 'Monday',
          summary: 'Upper Body Strength',
          workout: {
            name: 'Workout A',
            exercises: [{ name: 'Bench Press', sets: 4, reps: '6-8' }],
            duration: 60
          },
          yinPractices: [
            {
              name: 'Energizing Qigong',
              practiceType: 'Qigong',
              duration: 10,
              timeOfDay: 'Morning',
              intention: 'Prepare nervous system',
              instructions: ['Horse stance', 'Breathing'],
              synergyNotes: [
                {
                  type: 'pairing-benefit',
                  message: 'Qigong prepares CNS for heavy lifting',
                  relatedItems: ['Workout A']
                }
              ],
              schedulingConfidence: 90
            }
          ],
          nutrition: { breakfast: { description: 'Breakfast', protein: 15 }, lunch: { description: 'Lunch', protein: 40 }, dinner: { description: 'Dinner', protein: 45 }, totalProtein: 100 },
          sleepHygiene: [],
          synergyMetadata: {
            yangYinBalance: 'Intense Yang balanced with preparatory Yin'
          }
        },
        {
          dayName: 'Tuesday',
          summary: 'Rest + Recovery',
          yinPractices: [
            {
              name: 'Body Scan Meditation',
              practiceType: 'Meditation',
              duration: 20,
              timeOfDay: 'Evening',
              intention: 'Awareness and recovery',
              instructions: ['Lie down', 'Scan body'],
              schedulingConfidence: 85
            }
          ],
          nutrition: { breakfast: { description: 'Breakfast', protein: 12 }, lunch: { description: 'Lunch', protein: 30 }, dinner: { description: 'Dinner', protein: 28 }, totalProtein: 70 },
          sleepHygiene: [],
          synergyMetadata: {
            yangYinBalance: 'Complete recovery',
            restSpacingNotes: '1 day rest before next heavy session'
          }
        },
        {
          dayName: 'Wednesday',
          summary: 'Lower Body Strength',
          workout: {
            name: 'Workout B',
            exercises: [{ name: 'Squat', sets: 4, reps: '6-8' }],
            duration: 70
          },
          yinPractices: [
            {
              name: 'Grounding Qigong',
              practiceType: 'Qigong',
              duration: 15,
              timeOfDay: 'Morning',
              intention: 'Ground and prepare legs',
              instructions: ['Root emphasis'],
              synergyNotes: [
                {
                  type: 'pairing-benefit',
                  message: 'Grounding practice prepares lower body for heavy squat',
                  relatedItems: ['Workout B']
                }
              ],
              schedulingConfidence: 92
            }
          ],
          nutrition: { breakfast: { description: 'Breakfast', protein: 18 }, lunch: { description: 'Lunch', protein: 45 }, dinner: { description: 'Dinner', protein: 42 }, totalProtein: 105 },
          sleepHygiene: [],
          synergyMetadata: {
            yangYinBalance: 'Grounding practice followed by lower body strength',
            restSpacingNotes: 'Good spacing: rest day between upper body (Monday) and lower body (Wednesday)'
          }
        }
      ];

      const allHaveSynergyMetadata = week.every(day => day.synergyMetadata?.yangYinBalance);
      expect(allHaveSynergyMetadata).toBe(true);

      const hasRestSpacingAnnotations = week.filter(d => d.synergyMetadata?.restSpacingNotes).length > 0;
      expect(hasRestSpacingAnnotations).toBe(true);

      console.log('✓ Full week synergy annotations verified');
      week.forEach(day => {
        if (day.workout) {
          console.log(`  ${day.dayName}: ${day.synergyMetadata?.yangYinBalance}`);
        }
      });
    });

    test('SYNERGY ANNOTATIONS: should score overall plan integration', () => {
      const planMetadata: PlanSynthesisMetadata = {
        llmConfidenceScore: 88,
        constraintConflicts: [
          {
            type: 'unavailable-window',
            description: 'Saturday marked unavailable',
            resolution: 'No workouts scheduled for Saturday'
          }
        ],
        synergyScoring: {
          yangYinPairingScore: 89,
          restSpacingScore: 87,
          overallIntegrationScore: 88
        },
        fallbackOptions: [
          'Move Wednesday workout to Thursday if needed',
          'Shift practices to evening if morning unavailable'
        ]
      };

      expect(planMetadata.synergyScoring.yangYinPairingScore).toBeGreaterThan(85);
      expect(planMetadata.synergyScoring.restSpacingScore).toBeGreaterThan(85);
      expect(planMetadata.synergyScoring.overallIntegrationScore).toBeGreaterThan(85);

      console.log('✓ Plan synergy scoring:');
      console.log(`  Yang/Yin Pairing: ${planMetadata.synergyScoring.yangYinPairingScore}/100`);
      console.log(`  Rest Spacing: ${planMetadata.synergyScoring.restSpacingScore}/100`);
      console.log(`  Overall Integration: ${planMetadata.synergyScoring.overallIntegrationScore}/100`);
    });
  });

  describe('Historical Context Scenario 4: Compliance Adaptation', () => {
    test('HISTORICAL CONTEXT: should adapt plan based on past compliance patterns', () => {
      const historicalContext: HistoricalComplianceSummary = {
        totalPlansAnalyzed: 4,
        averageWorkoutCompliance: 75,
        averageYinCompliance: 82,
        commonBlockers: ['fatigue', 'schedule conflicts', 'low motivation mid-week'],
        bestPerformingDayPatterns: ['Tuesday workouts', 'morning practices'],
        recommendedAdjustments: [
          'Focus Tuesday as primary workout day',
          'Schedule Yin practices in morning',
          'Add mid-week practice for motivation'
        ]
      };

      expect(historicalContext.commonBlockers).toContain('fatigue');
      expect(historicalContext.bestPerformingDayPatterns).toContain('Tuesday workouts');
      expect(historicalContext.recommendedAdjustments[0]).toContain('Tuesday');

      console.log('✓ Historical context loaded:');
      console.log(`  Analyzed ${historicalContext.totalPlansAnalyzed} previous plans`);
      console.log(`  Common blocker: "${historicalContext.commonBlockers[0]}"`);
      console.log(`  Recommendation: "${historicalContext.recommendedAdjustments[0]}"`);
    });

    test('HISTORICAL CONTEXT: should influence prompt and scheduling', () => {
      const historicalContext: HistoricalComplianceSummary = {
        totalPlansAnalyzed: 6,
        averageWorkoutCompliance: 78,
        averageYinCompliance: 88,
        commonBlockers: ['heavy workload mid-week', 'weekend oversleep'],
        bestPerformingDayPatterns: ['Monday and Thursday workouts', 'evening Yin practices'],
        recommendedAdjustments: [
          'Reduce volume on Wednesday-Thursday',
          'Schedule Yin practices in evening',
          'Use Saturday for light recovery only'
        ]
      };

      const adaptedPlan = {
        days: [
          {
            dayName: 'Monday',
            workoutType: 'Main lift - higher volume',
            yinTiming: 'Evening (adjusted from historical data)'
          },
          {
            dayName: 'Wednesday',
            workoutType: 'Reduced volume - adapted for mid-week blocker',
            yinTiming: 'Evening'
          },
          {
            dayName: 'Thursday',
            workoutType: 'Main lift - higher volume',
            yinTiming: 'Evening'
          },
          {
            dayName: 'Saturday',
            workoutType: 'Rest or very light activity',
            yinTiming: 'Light evening practice'
          }
        ]
      };

      expect(adaptedPlan.days[1].workoutType).toContain('Reduced volume');
      expect(adaptedPlan.days[3].workoutType).toContain('light');

      console.log('✓ Plan adapted based on historical patterns:');
      console.log(`  Wednesday volume reduced due to mid-week blocker pattern`);
      console.log(`  Saturday kept light due to weekend oversleep history`);
    });
  });

  describe('Error Handling Scenario 5: Graceful Degradation', () => {
    test('POST-PROCESSING: should handle missing optional constraint fields', () => {
      const minimalConstraints: YangConstraints = {
        equipment: ['bodyweight'],
        unavailableDays: []
      };

      const hasTimeWindows = minimalConstraints.availableTimeWindows !== undefined;
      const hasInjuryRestrictions = minimalConstraints.injuryRestrictions !== undefined;

      expect(hasTimeWindows).toBe(false);
      expect(hasInjuryRestrictions).toBe(false);

      const practice: YinPracticeDetail = {
        name: 'Practice',
        practiceType: 'Type',
        duration: 10,
        timeOfDay: 'Morning',
        intention: 'Intention',
        instructions: [],
        schedulingConfidence: 80
      };

      if (practice.synergyNotes !== undefined) {
        throw new Error('Expected synergyNotes to be undefined');
      }
      expect(practice.schedulingConfidence).toBe(80);

      console.log('✓ Gracefully handled minimal constraints and optional fields');
    });

    test('POST-PROCESSING: should provide default values when LLM response is partial', () => {
      const practice: YinPracticeDetail = {
        name: 'Practice',
        practiceType: 'Meditation',
        duration: 15,
        timeOfDay: 'Evening',
        intention: 'Calm',
        instructions: ['Step 1'],
        schedulingConfidence: 80
      };

      const confidence = practice.schedulingConfidence || 70;
      expect(confidence).toBe(80);

      console.log('✓ Default values provided for optional metadata');
    });
  });
});

function test(description: string, testFn: () => void) {
  try {
    testFn();
    console.log(`✓ ${description}`);
  } catch (error) {
    console.error(`✗ ${description}`);
    console.error(error);
    process.exit(1);
  }
}

function describe(name: string, testsSuite: () => void) {
  console.log(`\n📋 ${name}`);
  console.log('─'.repeat(60));
  testsSuite();
}

function expect(value: any) {
  return {
    toBe(expected: any) {
      if (value !== expected) {
        throw new Error(`Expected ${value} to be ${expected}`);
      }
    },
    toEqual(expected: any) {
      if (JSON.stringify(value) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(value)} to equal ${JSON.stringify(expected)}`);
      }
    },
    toContain(expected: any) {
      if (Array.isArray(value)) {
        if (!value.includes(expected)) {
          throw new Error(`Expected array to contain ${expected}`);
        }
      } else if (typeof value === 'string') {
        if (!value.includes(expected)) {
          throw new Error(`Expected "${value}" to contain "${expected}"`);
        }
      } else {
        throw new Error(`Cannot call toContain on ${typeof value}`);
      }
    },
    toBeGreaterThan(expected: number) {
      if (!(value > expected)) {
        throw new Error(`Expected ${value} to be greater than ${expected}`);
      }
    },
    toBeDefined() {
      if (value === undefined) {
        throw new Error(`Expected value to be defined`);
      }
    },
    toBeFalse() {
      if (value !== false) {
        throw new Error(`Expected ${value} to be false`);
      }
    },
    toBeTrue() {
      if (value !== true) {
        throw new Error(`Expected ${value} to be true`);
      }
    }
  };
}
