import { GoogleGenAI, Type } from "@google/genai";
import { 
  IntegralBodyPlan, 
  YangConstraints, 
  YinPreferences, 
  DayPlan,
  WorkoutRoutine,
  MealPlan,
  YinPracticeDetail,
  IntegralUserContext,
  PlanSynergyMeta,
  PlanFeedback,
  ScheduleWindow,
  PracticeConstraint,
  RecoveryState,
  ChronotypeType
} from '../types.ts';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export interface GeneratePlanInput {
  goalStatement: string;
  yangConstraints: YangConstraints;
  yinPreferences: YinPreferences;
  userContext?: IntegralUserContext;
}

export interface MigrationResult {
  plan: IntegralBodyPlan;
  wasMigrated: boolean;
  migrationsApplied: string[];
}

export type {
  IntegralUserContext,
  PlanSynergyMeta,
  PlanFeedback,
  ScheduleWindow,
  PracticeConstraint,
  RecoveryState,
  ChronotypeType
};

interface PlanGenerationResponseDay {
  dayId?: string;
  dayName: string;
  summary: string;
  workout?: {
    name: string;
    exercises: {
      name: string;
      sets: number;
      reps: string;
      notes?: string;
    }[];
    duration: number;
    notes?: string;
  };
  yinPractices: {
    name: string;
    practiceType: string;
    duration: number;
    timeOfDay: string;
    intention: string;
    instructions: string[];
  }[];
  nutrition: {
    breakfast: { description: string; protein: number; };
    lunch: { description: string; protein: number; };
    dinner: { description: string; protein: number; };
    snacks?: { description: string; protein: number; };
    totalProtein: number;
    totalCalories?: number;
    notes?: string;
  };
  sleepHygiene: string[];
  notes?: string;
  availabilityWindows?: ScheduleWindow[];
  dayConstraints?: PracticeConstraint[];
  readinessScore?: number;
  readinessFlags?: ReadinessFlag[];
  complianceTargets?: PlanComplianceTarget;
}

interface PlanGenerationResponse {
  weekSummary: string;
  dailyTargets: {
    proteinGrams: number;
    sleepHours: number;
    workoutDays: number;
    yinPracticeMinutes: number;
  };
  days: PlanGenerationResponseDay[];
  shoppingList: string[];
  synergy?: PlanSynergyMeta;
  feedback?: PlanFeedback;
  userContext?: IntegralUserContext;
  practiceConstraints?: PracticeConstraint[];
}

export async function generateIntegralWeeklyPlan(input: GeneratePlanInput): Promise<IntegralBodyPlan> {
  const yangConstraints = input.yangConstraints;
  const yinPreferences = input.yinPreferences;
  const userContext = input.userContext;

  const prompt = `You are The Integral Body Architect—an expert at synthesizing comprehensive, integrated weekly plans that balance Yang practices (workouts, nutrition, sleep) with Yin practices (Qigong, breathing, Microcosmic Orbit, etc.).

USER'S GOAL:
${input.goalStatement}

YANG CONSTRAINTS:
- Bodyweight: ${yangConstraints.bodyweight ? `${yangConstraints.bodyweight} kg` : 'Not specified'}
- Target Sleep: ${yangConstraints.sleepHours ? `${yangConstraints.sleepHours} hours/night` : '7-9 hours/night'}
- Equipment Available: ${yangConstraints.equipment.join(', ')}
- Unavailable Days: ${yangConstraints.unavailableDays.length > 0 ? yangConstraints.unavailableDays.join(', ') : 'None'}
- Nutrition Focus: ${yangConstraints.nutritionFocus || 'Balanced whole foods'}
- Additional Constraints: ${yangConstraints.additionalConstraints || 'None'}
${yangConstraints.trainingAge ? `- Training Age: ${yangConstraints.trainingAge} years` : ''}
${yangConstraints.recoveryState ? `- Recovery State: ${yangConstraints.recoveryState}` : ''}
${yangConstraints.injuries && yangConstraints.injuries.length > 0 ? `- Injuries/Limitations: ${yangConstraints.injuries.join(', ')}` : ''}
${yangConstraints.constraints && yangConstraints.constraints.length > 0 ? `- Specific Constraints: ${yangConstraints.constraints.map(c => c.description).join('; ')}` : ''}

YIN PREFERENCES:
- Primary Goal: ${yinPreferences.goal}
- Experience Level: ${yinPreferences.experienceLevel}
- Additional Intentions: ${yinPreferences.intentions?.join(', ') || 'None'}
- Notes: ${yinPreferences.additionalNotes || 'None'}
${yinPreferences.stressLevel ? `- Stress Level: ${yinPreferences.stressLevel}/10` : ''}
${yinPreferences.energyLevel ? `- Energy Level: ${yinPreferences.energyLevel}/10` : ''}
${yinPreferences.chronotype ? `- Chronotype: ${yinPreferences.chronotype}` : ''}
${yinPreferences.scheduleWindows && yinPreferences.scheduleWindows.length > 0 ? `- Available Time Windows: ${yinPreferences.scheduleWindows.map(w => `${w.dayOfWeek} ${w.startTime}-${w.endTime}`).join(', ')}` : ''}

${userContext ? `
USER CONTEXT (Extended):
${userContext.trainingAge ? `- Training Experience: ${userContext.trainingAge} years` : ''}
${userContext.recoveryState ? `- Current Recovery: ${userContext.recoveryState}` : ''}
${userContext.injuries && userContext.injuries.length > 0 ? `- Active Injuries: ${userContext.injuries.join(', ')}` : ''}
${userContext.stressLevel ? `- Stress: ${userContext.stressLevel}/10` : ''}
${userContext.energyLevel ? `- Energy: ${userContext.energyLevel}/10` : ''}
${userContext.chronotype ? `- Chronotype: ${userContext.chronotype} (optimize timing accordingly)` : ''}
` : ''}

YOUR TASK:
Create a comprehensive, integrated 7-day plan that:

1. YANG PLANNING:
   - Calculate daily protein target (1.6g per kg bodyweight)
   - Design 2 distinct resistance training workouts (Workout A & B) using available equipment
   - Schedule workouts on available days with at least 1 rest day between sessions
   - Structure nutrition with higher carbs/protein on workout days
   - Include specific sleep hygiene practices

2. YIN PLANNING:
   - Select practices matched to user's intention and experience level
   - For "reduce-stress": Prioritize Coherent Breathing (5.5s inhale/exhale), Progressive Relaxation
   - For "increase-focus": Prioritize Box Breathing, Qigong movements
   - For "wind-down": Prioritize Coherent Breathing 30min before bedtime, body scan
   - For "increase-energy": Prioritize energizing Qigong, Wim Hof breathing (if intermediate)
   - For "balance": Mix grounding and energizing practices
   - Beginner: Start with 5-10 minute practices, simpler techniques
   - Intermediate: 10-20 minute practices, can include Microcosmic Orbit, advanced Qigong

3. INTELLIGENT SCHEDULING:
   - Place calming Yin practices (Coherent Breathing) 30min before bedtime
   - Schedule resistance workouts on available days with rest between
   - Place energizing Qigong/practices on non-workout mornings
   - Structure nutrition to support workout days vs rest days
   - Ensure daily plan is realistic and not overwhelming

4. CONSOLIDATION:
   - Provide detailed instructions for each practice
   - Include specific exercises, sets, reps for workouts
   - Give meal ideas with protein content
   - Create a shopping list for the week's nutrition

Return a comprehensive 7-day plan following the exact JSON schema provided.
Be specific, actionable, and evidence-based. Each day should feel cohesive and integrated.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          weekSummary: { type: Type.STRING },
          dailyTargets: {
            type: Type.OBJECT,
            properties: {
              proteinGrams: { type: Type.NUMBER },
              sleepHours: { type: Type.NUMBER },
              workoutDays: { type: Type.NUMBER },
              yinPracticeMinutes: { type: Type.NUMBER }
            },
            required: ['proteinGrams', 'sleepHours', 'workoutDays', 'yinPracticeMinutes']
          },
          days: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                dayId: { type: Type.STRING },
                dayName: { type: Type.STRING },
                summary: { type: Type.STRING },
                workout: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    exercises: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING },
                          sets: { type: Type.NUMBER },
                          reps: { type: Type.STRING },
                          notes: { type: Type.STRING }
                        },
                        required: ['name', 'sets', 'reps']
                      }
                    },
                    duration: { type: Type.NUMBER },
                    notes: { type: Type.STRING }
                  },
                  required: ['name', 'exercises', 'duration']
                },
                yinPractices: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      practiceType: { type: Type.STRING },
                      duration: { type: Type.NUMBER },
                      timeOfDay: { type: Type.STRING },
                      intention: { type: Type.STRING },
                      instructions: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                      }
                    },
                    required: ['name', 'practiceType', 'duration', 'timeOfDay', 'intention', 'instructions']
                  }
                },
                nutrition: {
                  type: Type.OBJECT,
                  properties: {
                    breakfast: {
                      type: Type.OBJECT,
                      properties: {
                        description: { type: Type.STRING },
                        protein: { type: Type.NUMBER }
                      },
                      required: ['description', 'protein']
                    },
                    lunch: {
                      type: Type.OBJECT,
                      properties: {
                        description: { type: Type.STRING },
                        protein: { type: Type.NUMBER }
                      },
                      required: ['description', 'protein']
                    },
                    dinner: {
                      type: Type.OBJECT,
                      properties: {
                        description: { type: Type.STRING },
                        protein: { type: Type.NUMBER }
                      },
                      required: ['description', 'protein']
                    },
                    snacks: {
                      type: Type.OBJECT,
                      properties: {
                        description: { type: Type.STRING },
                        protein: { type: Type.NUMBER }
                      },
                      required: ['description', 'protein']
                    },
                    totalProtein: { type: Type.NUMBER },
                    totalCalories: { type: Type.NUMBER },
                    notes: { type: Type.STRING }
                  },
                  required: ['breakfast', 'lunch', 'dinner', 'totalProtein']
                },
                sleepHygiene: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                notes: { type: Type.STRING },
                availabilityWindows: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      dayOfWeek: { type: Type.STRING },
                      startTime: { type: Type.STRING },
                      endTime: { type: Type.STRING },
                      preferenceLevel: { type: Type.STRING },
                      location: { type: Type.STRING }
                    },
                    required: ['dayOfWeek', 'startTime', 'endTime']
                  }
                },
                dayConstraints: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      description: { type: Type.STRING },
                      appliesTo: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                      },
                      constraintType: { type: Type.STRING },
                      notes: { type: Type.STRING },
                      window: {
                        type: Type.OBJECT,
                        properties: {
                          dayOfWeek: { type: Type.STRING },
                          startTime: { type: Type.STRING },
                          endTime: { type: Type.STRING },
                          preferenceLevel: { type: Type.STRING },
                          location: { type: Type.STRING }
                        },
                        required: ['dayOfWeek', 'startTime', 'endTime']
                      }
                    },
                    required: ['description', 'constraintType']
                  }
                },
                readinessScore: { type: Type.NUMBER },
                readinessFlags: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      focus: { type: Type.STRING },
                      level: { type: Type.STRING },
                      rationale: { type: Type.STRING }
                    },
                    required: ['focus', 'level']
                  }
                },
                complianceTargets: {
                  type: Type.OBJECT,
                  properties: {
                    workouts: { type: Type.NUMBER },
                    yinPracticeMinutes: { type: Type.NUMBER },
                    nutritionAdherencePercent: { type: Type.NUMBER },
                    sleepHours: { type: Type.NUMBER },
                    recoveryScore: { type: Type.NUMBER }
                  }
                }
              },
              required: ['dayName', 'summary', 'yinPractices', 'nutrition', 'sleepHygiene']
            }
          },
          shoppingList: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          synergy: {
            type: Type.OBJECT,
            properties: {
              rationale: { type: Type.STRING },
              warnings: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              pairings: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    focusArea: { type: Type.STRING },
                    pairedWith: { type: Type.STRING },
                    rationale: { type: Type.STRING }
                  },
                  required: ['focusArea', 'pairedWith', 'rationale']
                }
              },
              readinessFlags: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    focus: { type: Type.STRING },
                    level: { type: Type.STRING },
                    rationale: { type: Type.STRING }
                  },
                  required: ['focus', 'level']
                }
              }
            }
          },
          feedback: {
            type: Type.OBJECT,
            properties: {
              complianceTarget: {
                type: Type.OBJECT,
                properties: {
                  workouts: { type: Type.NUMBER },
                  yinPracticeMinutes: { type: Type.NUMBER },
                  nutritionAdherencePercent: { type: Type.NUMBER },
                  sleepHours: { type: Type.NUMBER },
                  recoveryScore: { type: Type.NUMBER }
                }
              },
              trackingMetrics: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              checkInPrompts: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              dailyCompliance: {
                type: Type.OBJECT,
                additionalProperties: {
                  type: Type.OBJECT,
                  properties: {
                    target: {
                      type: Type.OBJECT,
                      properties: {
                        workouts: { type: Type.NUMBER },
                        yinPracticeMinutes: { type: Type.NUMBER },
                        nutritionAdherencePercent: { type: Type.NUMBER },
                        sleepHours: { type: Type.NUMBER },
                        recoveryScore: { type: Type.NUMBER }
                      }
                    },
                    actual: {
                      type: Type.OBJECT,
                      properties: {
                        workouts: { type: Type.NUMBER },
                        yinPracticeMinutes: { type: Type.NUMBER },
                        nutritionAdherencePercent: { type: Type.NUMBER },
                        sleepHours: { type: Type.NUMBER },
                        recoveryScore: { type: Type.NUMBER }
                      }
                    },
                    status: { type: Type.STRING },
                    updatedAt: { type: Type.STRING },
                    notes: { type: Type.STRING }
                  }
                }
              }
            }
          },
          userContext: {
            type: Type.OBJECT,
            properties: {
              trainingAge: { type: Type.NUMBER },
              recoveryState: { type: Type.STRING },
              injuries: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              stressLevel: { type: Type.NUMBER },
              energyLevel: { type: Type.NUMBER },
              chronotype: { type: Type.STRING },
              scheduleWindows: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    dayOfWeek: { type: Type.STRING },
                    startTime: { type: Type.STRING },
                    endTime: { type: Type.STRING },
                    preferenceLevel: { type: Type.STRING },
                    location: { type: Type.STRING }
                  },
                  required: ['dayOfWeek', 'startTime', 'endTime']
                }
              }
            }
          },
          practiceConstraints: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING },
                appliesTo: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                constraintType: { type: Type.STRING },
                notes: { type: Type.STRING },
                window: {
                  type: Type.OBJECT,
                  properties: {
                    dayOfWeek: { type: Type.STRING },
                    startTime: { type: Type.STRING },
                    endTime: { type: Type.STRING },
                    preferenceLevel: { type: Type.STRING },
                    location: { type: Type.STRING }
                  },
                  required: ['dayOfWeek', 'startTime', 'endTime']
                }
              },
              required: ['description', 'constraintType']
            }
          }
        },
        required: ['weekSummary', 'dailyTargets', 'days', 'shoppingList']
      }
    }
  });

  const planData: PlanGenerationResponse = JSON.parse(response.text);

  const now = new Date();
  const monday = getNextMonday(now);
  const planId = `integral-body-plan-${Date.now()}`;

  const daysWithIds = planData.days.map((day, index) => {
    const yinMinutes = day.yinPractices?.reduce((total, practice) => total + (practice.duration || 0), 0) ?? 0;

    return {
      ...day,
      dayId: day.dayId || `${planId}-day-${index}`,
      availabilityWindows: day.availabilityWindows ?? userContext?.scheduleWindows?.filter(window => window.dayOfWeek === day.dayName),
      dayConstraints: day.dayConstraints ?? planData.practiceConstraints?.filter(constraint => !constraint.appliesTo || constraint.appliesTo.includes(day.dayName)),
      complianceTargets: day.complianceTargets || {
        workouts: day.workout ? 1 : 0,
        yinPracticeMinutes: yinMinutes,
        nutritionAdherencePercent: 80,
        sleepHours: planData.dailyTargets?.sleepHours || 8,
      }
    };
  });

  const plan: IntegralBodyPlan = {
    id: planId,
    date: now.toISOString(),
    weekStartDate: monday.toISOString(),
    goalStatement: input.goalStatement,
    yangConstraints: input.yangConstraints,
    yinPreferences: input.yinPreferences,
    weekSummary: planData.weekSummary,
    dailyTargets: planData.dailyTargets,
    days: daysWithIds,
    shoppingList: planData.shoppingList,
    userContext: planData.userContext || input.userContext || {
      trainingAge: yangConstraints.trainingAge,
      recoveryState: yangConstraints.recoveryState,
      injuries: yangConstraints.injuries,
      stressLevel: yinPreferences.stressLevel,
      energyLevel: yinPreferences.energyLevel,
      chronotype: yinPreferences.chronotype,
      scheduleWindows: yinPreferences.scheduleWindows,
    },
    synergy: planData.synergy,
    feedback: planData.feedback || {
      complianceTarget: {
        workouts: planData.dailyTargets.workoutDays,
        yinPracticeMinutes: planData.dailyTargets.yinPracticeMinutes,
        sleepHours: planData.dailyTargets.sleepHours,
      },
      trackingMetrics: ['workouts', 'yinPractices', 'nutrition', 'sleep'],
      checkInPrompts: [
        'How are you feeling about your energy levels?',
        'Are the practices fitting well into your schedule?',
        'Any adjustments needed for the next week?',
      ],
    },
    intelligenceFlags: {
      personalizedForRecovery: Boolean(yangConstraints.recoveryState),
      chronotypeOptimized: Boolean(yinPreferences.chronotype),
      injuryAdapted: Boolean(yangConstraints.injuries && yangConstraints.injuries.length > 0),
      constraintsApplied: Boolean(yangConstraints.constraints && yangConstraints.constraints.length > 0),
    }
  };

  return plan;
}

function getNextMonday(date: Date): Date {
  const dayOfWeek = date.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
  const monday = new Date(date);
  monday.setDate(date.getDate() + daysUntilMonday);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function migrateLegacyPlan(legacyPlan: any): MigrationResult {
  const migrationsApplied: string[] = [];
  let wasMigrated = false;

  const plan: IntegralBodyPlan = { ...legacyPlan };

  if (!plan.userContext) {
    plan.userContext = {
      trainingAge: plan.yangConstraints?.trainingAge,
      recoveryState: plan.yangConstraints?.recoveryState,
      injuries: plan.yangConstraints?.injuries,
      stressLevel: plan.yinPreferences?.stressLevel,
      energyLevel: plan.yinPreferences?.energyLevel,
      chronotype: plan.yinPreferences?.chronotype,
      scheduleWindows: plan.yinPreferences?.scheduleWindows,
    };
    if (Object.values(plan.userContext).some(v => v !== undefined)) {
      migrationsApplied.push('Added userContext from constraints/preferences');
      wasMigrated = true;
    }
  }

  if (!plan.synergy) {
    plan.synergy = {
      rationale: 'Legacy plan - synergy analysis not available',
      pairings: [],
      warnings: [],
      readinessFlags: [],
    };
    migrationsApplied.push('Added default synergy metadata');
    wasMigrated = true;
  }

  if (!plan.feedback) {
    plan.feedback = {
      complianceTarget: {
        workouts: plan.dailyTargets?.workoutDays,
        yinPracticeMinutes: plan.dailyTargets?.yinPracticeMinutes,
        sleepHours: plan.dailyTargets?.sleepHours,
      },
      trackingMetrics: ['workouts', 'yinPractices', 'nutrition', 'sleep'],
      checkInPrompts: [
        'How are you feeling about your energy levels?',
        'Are the practices fitting well into your schedule?',
        'Any adjustments needed for the next week?',
      ],
    };
    migrationsApplied.push('Added default feedback structure');
    wasMigrated = true;
  }

  if (!plan.intelligenceFlags) {
    plan.intelligenceFlags = {
      personalizedForRecovery: Boolean(plan.yangConstraints?.recoveryState),
      chronotypeOptimized: Boolean(plan.yinPreferences?.chronotype),
      injuryAdapted: Boolean(plan.yangConstraints?.injuries && plan.yangConstraints.injuries.length > 0),
      constraintsApplied: Boolean(plan.yangConstraints?.constraints && plan.yangConstraints.constraints.length > 0),
    };
    migrationsApplied.push('Added intelligence flags');
    wasMigrated = true;
  }

  if (plan.days && Array.isArray(plan.days)) {
    let dayMigrated = false;

    plan.days = plan.days.map((day, index) => {
      const migratedDay = { ...day };
      
      if (!migratedDay.dayId) {
        migratedDay.dayId = `${plan.id}-day-${index}`;
        dayMigrated = true;
      }

      if (!migratedDay.complianceTargets) {
        const yinMinutes = migratedDay.yinPractices?.reduce((total: number, practice: YinPracticeDetail) => total + (practice.duration || 0), 0) ?? 0;

        migratedDay.complianceTargets = {
          workouts: migratedDay.workout ? 1 : 0,
          yinPracticeMinutes: yinMinutes,
          nutritionAdherencePercent: 80,
          sleepHours: plan.dailyTargets?.sleepHours || 8,
        };
        dayMigrated = true;
      }

      if (!migratedDay.dayConstraints && plan.yangConstraints?.constraints) {
        migratedDay.dayConstraints = plan.yangConstraints.constraints;
        dayMigrated = true;
      }

      return migratedDay;
    });

    if (dayMigrated) {
      migrationsApplied.push('Added day IDs and compliance targets to days');
      wasMigrated = true;
    }
  }

  return {
    plan,
    wasMigrated,
    migrationsApplied,
  };
}

export function migrateAllPlans(plans: IntegralBodyPlan[]): IntegralBodyPlan[] {
  let updated = false;
  const migratedPlans = plans.map(plan => {
    const result = migrateLegacyPlan(plan);
    if (result.wasMigrated) {
      updated = true;
      return result.plan;
    }
    return plan;
  });

  return updated ? migratedPlans : plans;
}
