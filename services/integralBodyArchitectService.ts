import { GoogleGenAI, Type } from "@google/genai";
import { 
  IntegralBodyPlan, 
  YangConstraints, 
  YinPreferences, 
  DayPlan,
  WorkoutRoutine,
  MealPlan,
  YinPracticeDetail
} from '../types.ts';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

interface GeneratePlanInput {
  goalStatement: string;
  yangConstraints: YangConstraints;
  yinPreferences: YinPreferences;
}

interface PlanGenerationResponse {
  weekSummary: string;
  dailyTargets: {
    proteinGrams: number;
    sleepHours: number;
    workoutDays: number;
    yinPracticeMinutes: number;
  };
  days: {
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
  }[];
  shoppingList: string[];
}

export async function generateIntegralWeeklyPlan(input: GeneratePlanInput): Promise<IntegralBodyPlan> {
  const prompt = `You are The Integral Body Architect—an expert at synthesizing comprehensive, integrated weekly plans that balance Yang practices (workouts, nutrition, sleep) with Yin practices (Qigong, breathing, Microcosmic Orbit, etc.).

USER'S GOAL:
${input.goalStatement}

YANG CONSTRAINTS:
- Bodyweight: ${input.yangConstraints.bodyweight ? `${input.yangConstraints.bodyweight} kg` : 'Not specified'}
- Target Sleep: ${input.yangConstraints.sleepHours ? `${input.yangConstraints.sleepHours} hours/night` : '7-9 hours/night'}
- Equipment Available: ${input.yangConstraints.equipment.join(', ')}
- Unavailable Days: ${input.yangConstraints.unavailableDays.length > 0 ? input.yangConstraints.unavailableDays.join(', ') : 'None'}
- Nutrition Focus: ${input.yangConstraints.nutritionFocus || 'Balanced whole foods'}
- Additional Constraints: ${input.yangConstraints.additionalConstraints || 'None'}

YIN PREFERENCES:
- Primary Goal: ${input.yinPreferences.goal}
- Experience Level: ${input.yinPreferences.experienceLevel}
- Additional Intentions: ${input.yinPreferences.intentions?.join(', ') || 'None'}
- Notes: ${input.yinPreferences.additionalNotes || 'None'}

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
                notes: { type: Type.STRING }
              },
              required: ['dayName', 'summary', 'yinPractices', 'nutrition', 'sleepHygiene']
            }
          },
          shoppingList: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ['weekSummary', 'dailyTargets', 'days', 'shoppingList']
      }
    }
  });

  const planData: PlanGenerationResponse = JSON.parse(response.text);

  const now = new Date();
  const monday = getNextMonday(now);

  const plan: IntegralBodyPlan = {
    id: `integral-body-plan-${Date.now()}`,
    date: now.toISOString(),
    weekStartDate: monday.toISOString(),
    goalStatement: input.goalStatement,
    yangConstraints: input.yangConstraints,
    yinPreferences: input.yinPreferences,
    weekSummary: planData.weekSummary,
    dailyTargets: planData.dailyTargets,
    days: planData.days,
    shoppingList: planData.shoppingList
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
