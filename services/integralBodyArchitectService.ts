import { GoogleGenAI, Type } from "@google/genai";
import OpenAI from 'openai';
import {
  IntegralBodyPlan,
  DayPlan,
  YangConstraints,
  YinPreferences,
  YinPracticeDetail,
  HistoricalComplianceSummary,
  PlanSynthesisMetadata,
  SynergyNote,
  PersonalizationSummary
} from '../types.ts';
import { buildPersonalizationPromptInsertion } from './integralBodyPersonalization.ts';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// Initialize OpenRouter client (OpenAI-compatible)
const openRouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  dangerouslyAllowBrowser: true
});

// Provider types
export type IntegralBodyProvider = 'google' | 'openrouter';

const POLARIS_ALPHA_MODEL = 'openrouter/polaris-alpha';

interface GeneratePlanInput {
  goalStatement: string;
  yangConstraints: YangConstraints;
  yinPreferences: YinPreferences;
  historicalContext?: HistoricalComplianceSummary;
  personalizationSummary?: PersonalizationSummary;
  provider?: IntegralBodyProvider;
}

interface LLMPlanGenerationResponse {
  weekSummary: string;
  constraintNotes: string;
  fallbackOptions: string[];
  schedulingConfidence: number;
  dailyTargets: {
    proteinGrams: number;
    sleepHours: number;
    workoutDays: number;
    yinPracticeMinutes: number;
  };
  days: {
    dayName: string;
    summary: string;
    yangYinBalance?: string;
    constraintResolution?: string;
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
      synergyReason?: string;
      schedulingConfidence?: number;
    }[];
    nutrition: {
      breakfast: { description: string; protein: number };
      lunch: { description: string; protein: number };
      dinner: { description: string; protein: number };
      snacks?: { description: string; protein: number };
      totalProtein: number;
      totalCalories?: number;
      notes?: string;
    };
    sleepHygiene: string[];
    notes?: string;
  }[];
  shoppingList: string[];
  synergyScoring: {
    yangYinPairingScore: number;
    restSpacingScore: number;
    overallIntegrationScore: number;
  };
}

// Pre-create the response schema to avoid recreating it on every call
const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    weekSummary: { type: Type.STRING },
    constraintNotes: { type: Type.STRING },
    fallbackOptions: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    schedulingConfidence: { type: Type.NUMBER },
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
          yangYinBalance: { type: Type.STRING },
          constraintResolution: { type: Type.STRING },
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
                },
                synergyReason: { type: Type.STRING },
                schedulingConfidence: { type: Type.NUMBER }
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
    },
    synergyScoring: {
      type: Type.OBJECT,
      properties: {
        yangYinPairingScore: { type: Type.NUMBER },
        restSpacingScore: { type: Type.NUMBER },
        overallIntegrationScore: { type: Type.NUMBER }
      },
      required: ['yangYinPairingScore', 'restSpacingScore', 'overallIntegrationScore']
    }
  },
  required: [
    'weekSummary',
    'constraintNotes',
    'fallbackOptions',
    'schedulingConfidence',
    'dailyTargets',
    'days',
    'shoppingList',
    'synergyScoring'
  ]
};

export async function generateIntegralWeeklyPlan(input: GeneratePlanInput): Promise<IntegralBodyPlan> {
  const provider = input.provider || 'openrouter';

  if (provider === 'openrouter') {
    return await generateIntegralWeeklyPlanOpenRouter(input);
  } else {
    return await generateIntegralWeeklyPlanGoogle(input);
  }
}

async function generateIntegralWeeklyPlanGoogle(input: GeneratePlanInput): Promise<IntegralBodyPlan> {
  const historicalContext = input.historicalContext ? buildHistoricalContextPrompt(input.historicalContext) : '';

  // Build personalization insertion if summary is provided
  const personalizationInsertion = input.personalizationSummary
    ? buildPersonalizationPromptInsertion(input.personalizationSummary)
    : '';

  const prompt = `You are The Integral Body Architect—an expert at synthesizing comprehensive, integrated weekly plans that balance Yang practices (workouts, nutrition, sleep) with Yin practices (Qigong, breathing, Microcosmic Orbit, etc.).

USER'S GOAL:
${input.goalStatement}

YANG CONSTRAINTS:
- Bodyweight: ${input.yangConstraints.bodyweight ? `${input.yangConstraints.bodyweight} kg` : 'Not specified'}
- Target Sleep: ${input.yangConstraints.sleepHours ? `${input.yangConstraints.sleepHours} hours/night` : '7-9 hours/night'}
- Equipment Available: ${input.yangConstraints.equipment.join(', ')}
- Unavailable Days: ${input.yangConstraints.unavailableDays.length > 0 ? input.yangConstraints.unavailableDays.join(', ') : 'None'}
${input.yangConstraints.availableTimeWindows && input.yangConstraints.availableTimeWindows.length > 0 ? `- Available Time Windows: ${formatTimeWindows(input.yangConstraints.availableTimeWindows)}` : ''}
${input.yangConstraints.injuryRestrictions && input.yangConstraints.injuryRestrictions.length > 0 ? `- Injury/Pain Restrictions: ${formatInjuryRestrictions(input.yangConstraints.injuryRestrictions)}` : ''}
- Nutrition Focus: ${input.yangConstraints.nutritionFocus || 'Balanced whole foods'}
- Additional Constraints: ${input.yangConstraints.additionalConstraints || 'None'}

YIN PREFERENCES:
- Primary Goal: ${input.yinPreferences.goal}
- Experience Level: ${input.yinPreferences.experienceLevel}
- Additional Intentions: ${input.yinPreferences.intentions?.join(', ') || 'None'}
- Notes: ${input.yinPreferences.additionalNotes || 'None'}

${historicalContext}

${personalizationInsertion}

YOUR TASK:
Create a comprehensive, integrated 7-day plan that:

1. YANG PLANNING:
   - Calculate daily protein target (1.6g per kg bodyweight)
   - Design 2 distinct resistance training workouts (Workout A & B) using available equipment
   - Schedule workouts on available days with at least 1 rest day between sessions
   - Structure nutrition with higher carbs/protein on workout days
   - Include specific sleep hygiene practices
   - RESPECT ALL HARD CONSTRAINTS: Unavailable days, time windows, and injury restrictions are non-negotiable

2. YIN PLANNING:
   - Select practices matched to user's intention and experience level
   - For "reduce-stress": Prioritize Coherent Breathing (5.5s inhale/exhale), Progressive Relaxation
   - For "increase-focus": Prioritize Box Breathing, Qigong movements
   - For "wind-down": Prioritize Coherent Breathing 30min before bedtime, body scan
   - For "increase-energy": Prioritize energizing Qigong, Wim Hof breathing (if intermediate)
   - For "balance": Mix grounding and energizing practices
   - Beginner: Start with 5-10 minute practices, simpler techniques
   - Intermediate: 10-20 minute practices, can include Microcosmic Orbit, advanced Qigong

3. SYNERGY & SCHEDULING INTELLIGENCE:
   - Provide explicit reason for why each Yin practice is beneficial in its assigned position
   - Explain Yang/Yin balance rationale for each day
   - Include rest spacing notes (e.g., "2 days rest between intense sessions")
   - Flag any potential conflicts or compromises made
   - Suggest fallback scheduling options if primary placement becomes unavailable
   - Provide scheduling confidence (0-100) for each practice placement

4. CONSTRAINT RESOLUTION:
   - List any hard constraints and how they were resolved
   - If conflicts arose between practices and constraints, explain the resolution
   - Provide alternative fallback scheduling if the primary plan cannot be executed
   - Ensure all unavailable days/times and injury restrictions are honored

5. CONSOLIDATION:
   - Provide detailed instructions for each practice
   - Include specific exercises, sets, reps for workouts
   - Give meal ideas with protein content
   - Create a shopping list for the week's nutrition
   - Ensure overall integration is coherent and realistic

Return a comprehensive 7-day plan with detailed synergy metadata and constraint analysis.
Be specific, actionable, evidence-based, and explicit about scheduling reasoning.`;

  // Add timeout to API call (60 seconds)
  const apiPromise = ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA as any
    }
  });

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Plan generation timed out after 60 seconds. Please try again.')), 60000)
  );

  let response;
  try {
    response = await Promise.race([apiPromise, timeoutPromise]);
  } catch (error) {
    if (error instanceof Error && error.message.includes('timed out')) {
      throw error;
    }
    throw new Error(`Failed to generate plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  let planData: LLMPlanGenerationResponse;
  try {
    planData = JSON.parse(response.text);
  } catch (error) {
    throw new Error('Failed to parse plan response. Please try again.');
  }

  const now = new Date();
  const monday = getNextMonday(now);

  const days = planData.days.map(dayData => postProcessDay(dayData, input.yangConstraints));

  const { conflicts } = validateConstraints(days, input.yangConstraints);

  const plan: IntegralBodyPlan = {
    id: `integral-body-plan-${Date.now()}`,
    date: now.toISOString(),
    weekStartDate: monday.toISOString(),
    goalStatement: input.goalStatement,
    yangConstraints: input.yangConstraints,
    yinPreferences: input.yinPreferences,
    weekSummary: planData.weekSummary,
    dailyTargets: planData.dailyTargets,
    days,
    shoppingList: planData.shoppingList,
    synthesisMetadata: {
      llmConfidenceScore: planData.schedulingConfidence,
      constraintConflicts: conflicts,
      synergyScoring: planData.synergyScoring,
      fallbackOptions: planData.fallbackOptions
    },
    historicalContext: input.historicalContext
  };

  return plan;
}

async function generateIntegralWeeklyPlanOpenRouter(input: GeneratePlanInput): Promise<IntegralBodyPlan> {
  const historicalContext = input.historicalContext ? buildHistoricalContextPrompt(input.historicalContext) : '';

  // Build personalization insertion if summary is provided
  const personalizationInsertion = input.personalizationSummary
    ? buildPersonalizationPromptInsertion(input.personalizationSummary)
    : '';

  const prompt = `You are The Integral Body Architect—an expert at synthesizing comprehensive, integrated weekly plans that balance Yang practices (workouts, nutrition, sleep) with Yin practices (Qigong, breathing, Microcosmic Orbit, etc.).

USER'S GOAL:
${input.goalStatement}

YANG CONSTRAINTS:
- Bodyweight: ${input.yangConstraints.bodyweight ? `${input.yangConstraints.bodyweight} kg` : 'Not specified'}
- Target Sleep: ${input.yangConstraints.sleepHours ? `${input.yangConstraints.sleepHours} hours/night` : '7-9 hours/night'}
- Equipment Available: ${input.yangConstraints.equipment.join(', ')}
- Unavailable Days: ${input.yangConstraints.unavailableDays.length > 0 ? input.yangConstraints.unavailableDays.join(', ') : 'None'}
${input.yangConstraints.availableTimeWindows && input.yangConstraints.availableTimeWindows.length > 0 ? `- Available Time Windows: ${formatTimeWindows(input.yangConstraints.availableTimeWindows)}` : ''}
${input.yangConstraints.injuryRestrictions && input.yangConstraints.injuryRestrictions.length > 0 ? `- Injury/Pain Restrictions: ${formatInjuryRestrictions(input.yangConstraints.injuryRestrictions)}` : ''}
- Nutrition Focus: ${input.yangConstraints.nutritionFocus || 'Balanced whole foods'}
- Additional Constraints: ${input.yangConstraints.additionalConstraints || 'None'}

YIN PREFERENCES:
- Primary Goal: ${input.yinPreferences.goal}
- Experience Level: ${input.yinPreferences.experienceLevel}
- Additional Intentions: ${input.yinPreferences.intentions?.join(', ') || 'None'}
- Notes: ${input.yinPreferences.additionalNotes || 'None'}

${historicalContext}

${personalizationInsertion}

YOUR TASK:
Create a comprehensive, integrated 7-day plan that:

1. YANG PLANNING:
   - Calculate daily protein target (1.6g per kg bodyweight)
   - Design 2 distinct resistance training workouts (Workout A & B) using available equipment
   - Schedule workouts on available days with at least 1 rest day between sessions
   - Structure nutrition with higher carbs/protein on workout days
   - Include specific sleep hygiene practices
   - RESPECT ALL HARD CONSTRAINTS: Unavailable days, time windows, and injury restrictions are non-negotiable

2. YIN PLANNING:
   - Select practices matched to user's intention and experience level
   - For "reduce-stress": Prioritize Coherent Breathing (5.5s inhale/exhale), Progressive Relaxation
   - For "increase-focus": Prioritize Box Breathing, Qigong movements
   - For "wind-down": Prioritize Coherent Breathing 30min before bedtime, body scan
   - For "increase-energy": Prioritize energizing Qigong, Wim Hof breathing (if intermediate)
   - For "balance": Mix grounding and energizing practices
   - Beginner: Start with 5-10 minute practices, simpler techniques
   - Intermediate: 10-20 minute practices, can include Microcosmic Orbit, advanced Qigong

3. SYNERGY & SCHEDULING INTELLIGENCE:
   - Provide explicit reason for why each Yin practice is beneficial in its assigned position
   - Explain Yang/Yin balance rationale for each day
   - Include rest spacing notes (e.g., "2 days rest between intense sessions")
   - Flag any potential conflicts or compromises made
   - Suggest fallback scheduling options if primary placement becomes unavailable
   - Provide scheduling confidence (0-100) for each practice placement

4. CONSTRAINT RESOLUTION:
   - List any hard constraints and how they were resolved
   - If conflicts arose between practices and constraints, explain the resolution
   - Provide alternative fallback scheduling if the primary plan cannot be executed
   - Ensure all unavailable days/times and injury restrictions are honored

5. CONSOLIDATION:
   - Provide detailed instructions for each practice
   - Include specific exercises, sets, reps for workouts
   - Give meal ideas with protein content
   - Create a shopping list for the week's nutrition
   - Ensure overall integration is coherent and realistic

Return ONLY valid JSON matching this structure (no markdown, no code blocks, just raw JSON):
{
  "weekSummary": string,
  "constraintNotes": string,
  "fallbackOptions": [string],
  "schedulingConfidence": number (0-100),
  "dailyTargets": {
    "proteinGrams": number,
    "sleepHours": number,
    "workoutDays": number,
    "yinPracticeMinutes": number
  },
  "days": [{
    "dayName": string,
    "summary": string,
    "yangYinBalance": string,
    "constraintResolution": string,
    "workout": {
      "name": string,
      "exercises": [{"name": string, "sets": number, "reps": string, "notes": string}],
      "duration": number,
      "notes": string
    } or null,
    "yinPractices": [{"name": string, "practiceType": string, "duration": number, "timeOfDay": string, "intention": string, "instructions": [string], "synergyReason": string, "schedulingConfidence": number}],
    "nutrition": {"breakfast": {"description": string, "protein": number}, "lunch": {"description": string, "protein": number}, "dinner": {"description": string, "protein": number}, "snacks": {"description": string, "protein": number} or null, "totalProtein": number, "totalCalories": number or null, "notes": string},
    "sleepHygiene": [string],
    "notes": string or null
  }],
  "shoppingList": [string],
  "synergyScoring": {
    "yangYinPairingScore": number,
    "restSpacingScore": number,
    "overallIntegrationScore": number
  }
}

Be specific, actionable, evidence-based, and explicit about scheduling reasoning.`;

  try {
    const apiPromise = openRouter.chat.completions.create({
      model: POLARIS_ALPHA_MODEL,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.7
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Plan generation timed out after 60 seconds. Please try again.')), 60000)
    );

    let response;
    try {
      response = await Promise.race([apiPromise, timeoutPromise]);
    } catch (error) {
      if (error instanceof Error && error.message.includes('timed out')) {
        throw error;
      }
      throw new Error(`Failed to generate plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    let planData: LLMPlanGenerationResponse;
    const responseText = response.choices[0]?.message?.content || '';

    try {
      planData = JSON.parse(responseText);
    } catch (error) {
      console.error('Failed to parse OpenRouter response:', responseText);
      throw new Error('Failed to parse plan response. Please try again.');
    }

    const now = new Date();
    const monday = getNextMonday(now);

    const days = planData.days.map(dayData => postProcessDay(dayData, input.yangConstraints));

    const { conflicts } = validateConstraints(days, input.yangConstraints);

    const plan: IntegralBodyPlan = {
      id: `integral-body-plan-${Date.now()}`,
      date: now.toISOString(),
      weekStartDate: monday.toISOString(),
      goalStatement: input.goalStatement,
      yangConstraints: input.yangConstraints,
      yinPreferences: input.yinPreferences,
      weekSummary: planData.weekSummary,
      dailyTargets: planData.dailyTargets,
      days,
      shoppingList: planData.shoppingList,
      synthesisMetadata: {
        llmConfidenceScore: planData.schedulingConfidence,
        constraintConflicts: conflicts,
        synergyScoring: planData.synergyScoring,
        fallbackOptions: planData.fallbackOptions
      },
      historicalContext: input.historicalContext
    };

    return plan;
  } catch (error) {
    throw new Error(`OpenRouter API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function buildHistoricalContextPrompt(history: HistoricalComplianceSummary): string {
  return `HISTORICAL PERFORMANCE CONTEXT:
Based on analysis of ${history.totalPlansAnalyzed} previous plans:
- Average workout compliance: ${history.averageWorkoutCompliance}%
- Average Yin practice compliance: ${history.averageYinCompliance}%
- Common blockers: ${history.commonBlockers.join(', ')}
- Best performing day patterns: ${history.bestPerformingDayPatterns.join(', ')}
- Recommended adjustments: ${history.recommendedAdjustments.join('; ')}

Use this context to design a plan that is realistic and addresses known blockers.`;
}

function formatTimeWindows(windows: any[]): string {
  return windows.map(w => `${w.dayOfWeek} ${w.startHour}:00-${w.endHour}:00`).join(', ');
}

function formatInjuryRestrictions(restrictions: any[]): string {
  return restrictions
    .map(r => `${r.bodyPart} (${r.severity}): ${r.restrictions.join(', ')}`)
    .join('; ');
}

interface DayDataFromLLM {
  dayName: string;
  summary: string;
  yangYinBalance?: string;
  constraintResolution?: string;
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
    synergyReason?: string;
    schedulingConfidence?: number;
  }[];
  nutrition: {
    breakfast: { description: string; protein: number };
    lunch: { description: string; protein: number };
    dinner: { description: string; protein: number };
    snacks?: { description: string; protein: number };
    totalProtein: number;
    totalCalories?: number;
    notes?: string;
  };
  sleepHygiene: string[];
  notes?: string;
}

function postProcessDay(dayData: DayDataFromLLM, constraints: YangConstraints): DayPlan {
  const yinPractices: YinPracticeDetail[] = dayData.yinPractices.map(practice => {
    const synergyNotes: SynergyNote[] = [];
    
    if (practice.synergyReason) {
      synergyNotes.push({
        type: 'pairing-benefit',
        message: practice.synergyReason,
        relatedItems: dayData.workout ? [dayData.workout.name] : undefined
      });
    }

    return {
      name: practice.name,
      practiceType: practice.practiceType,
      duration: practice.duration,
      timeOfDay: practice.timeOfDay,
      intention: practice.intention,
      instructions: practice.instructions,
      synergyNotes: synergyNotes.length > 0 ? synergyNotes : undefined,
      schedulingConfidence: practice.schedulingConfidence || 80
    };
  });

  return {
    dayName: dayData.dayName,
    summary: dayData.summary,
    workout: dayData.workout,
    yinPractices,
    nutrition: dayData.nutrition,
    sleepHygiene: dayData.sleepHygiene,
    notes: dayData.notes,
    synergyMetadata: {
      yangYinBalance: dayData.yangYinBalance || 'Balanced',
      restSpacingNotes: extractRestSpacingNotes(dayData),
      constraintResolution: dayData.constraintResolution
    }
  };
}

function extractRestSpacingNotes(dayData: DayDataFromLLM): string | undefined {
  if (!dayData.notes) return undefined;
  
  if (dayData.notes.toLowerCase().includes('rest') || 
      dayData.notes.toLowerCase().includes('recovery') ||
      dayData.notes.toLowerCase().includes('spacing')) {
    return dayData.notes;
  }
  
  return undefined;
}

function validateConstraints(
  days: DayPlan[],
  constraints: YangConstraints
): { conflicts: Array<{ type: string; description: string; resolution: string }> } {
  const conflicts: Array<{ type: string; description: string; resolution: string }> = [];

  // Pre-compute for O(1) lookups
  const unavailableDaysSet = new Set(constraints.unavailableDays);

  // Build injury restriction map for O(1) lookup
  const injuryRestrictionMap = new Map<string, { bodyPart: string; restrictedKeywords: Set<string> }>();
  if (constraints.injuryRestrictions) {
    constraints.injuryRestrictions.forEach(injury => {
      const restrictedKeywords = new Set(
        injury.restrictions.map(r => r.toLowerCase())
      );
      injuryRestrictionMap.set(injury.bodyPart, {
        bodyPart: injury.bodyPart,
        restrictedKeywords
      });
    });
  }

  days.forEach((day) => {
    // Check unavailable days - O(1) lookup with Set
    if (unavailableDaysSet.has(day.dayName)) {
      if (day.workout) {
        conflicts.push({
          type: 'unavailable-window',
          description: `${day.dayName} is marked unavailable but has a workout`,
          resolution: `Workout should be rescheduled to available day`
        });
      }
    }

    // Check injury restrictions - O(e × r) instead of O(i × e × r)
    if (day.workout && injuryRestrictionMap.size > 0) {
      const exerciseNames = day.workout.exercises.map(ex => ex.name.toLowerCase());

      for (const [bodyPart, restriction] of injuryRestrictionMap) {
        const hasRestrictedExercise = exerciseNames.some(exName =>
          Array.from(restriction.restrictedKeywords).some(keyword =>
            exName.includes(keyword)
          )
        );

        if (hasRestrictedExercise) {
          conflicts.push({
            type: 'injury-restriction',
            description: `${day.dayName} has exercise conflicting with ${bodyPart} restriction`,
            resolution: `Exercise should be modified or removed per injury restriction`
          });
        }
      }
    }
  });

  return { conflicts };
}

function getNextMonday(date: Date): Date {
  const dayOfWeek = date.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
  const monday = new Date(date);
  monday.setDate(date.getDate() + daysUntilMonday);
  monday.setHours(0, 0, 0, 0);
  return monday;
}
