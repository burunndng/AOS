import {
  IntegralBodyPlan,
  DayPlan,
  YangConstraints,
  YinPreferences,
  HistoricalComplianceSummary,
  PersonalizationSummary
} from '../types.ts';
import { generateOpenRouterResponse, buildMessagesWithSystem, OpenRouterMessage, QWEN_FAST_MODEL } from './openRouterService.ts';

interface GeneratePlanInput {
  goalStatement: string;
  yangConstraints: YangConstraints;
  yinPreferences: YinPreferences;
  historicalContext?: HistoricalComplianceSummary;
  personalizationSummary?: PersonalizationSummary;
}

export async function generateIntegralWeeklyPlan(input: GeneratePlanInput): Promise<IntegralBodyPlan> {
  console.log('[IntegralArchitect] Starting plan generation');
  console.log('[IntegralArchitect] Goal:', input.goalStatement);

  const prompt = buildPrompt(input);

  const messages: OpenRouterMessage[] = buildMessagesWithSystem(
    'You are an expert weekly planner. Return ONLY valid JSON with no markdown.',
    [{ role: 'user', content: prompt }]
  );

  console.log('[IntegralArchitect] Calling API...');

  try {
    const response = await generateOpenRouterResponse(messages, undefined, {
      model: QWEN_FAST_MODEL,
      maxTokens: 16000,
      temperature: 0.7,
      provider: {
        quantizations: ['fp8'],
        sort: 'latency'
      }
    });

    if (!response.success) {
      throw new Error(response.error || 'API call failed');
    }

    console.log('[IntegralArchitect] Got response, length:', response.text.length);

    // Parse JSON
    let jsonText = response.text.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }

    const data = JSON.parse(jsonText);
    console.log('[IntegralArchitect] Parsed JSON successfully');

    // Build the plan
    return buildPlan(data, input);
  } catch (error) {
    console.error('[IntegralArchitect] Error:', error);
    throw new Error(`Failed to generate plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function buildPrompt(input: GeneratePlanInput): string {
  const { goalStatement, yangConstraints, yinPreferences } = input;

  return `Create a 7-day wellness plan.

GOAL: ${goalStatement}

CONSTRAINTS:
- Bodyweight: ${yangConstraints.bodyweight || 70} kg
- Sleep target: ${yangConstraints.sleepHours || 8} hours
- Equipment: ${yangConstraints.equipment.join(', ')}
- Unavailable days: ${yangConstraints.unavailableDays.length > 0 ? yangConstraints.unavailableDays.join(', ') : 'None'}

YIN PRACTICES:
- Goal: ${yinPreferences.goal}
- Experience: ${yinPreferences.experienceLevel}

Return JSON with this structure:
{
  "weekSummary": "Brief summary of the week",
  "dailyTargets": {
    "proteinGrams": 105,
    "sleepHours": 8,
    "workoutDays": 3,
    "yinPracticeMinutes": 70
  },
  "days": [
    {
      "dayName": "Monday",
      "summary": "Day summary",
      "workout": {
        "name": "Full Body A",
        "exercises": [
          {"name": "Squats", "sets": 3, "reps": "12", "notes": ""}
        ],
        "duration": 45,
        "notes": ""
      },
      "yinPractices": [
        {
          "name": "Breathing Exercise",
          "practiceType": "breathing",
          "duration": 10,
          "timeOfDay": "Evening",
          "intention": "Relax",
          "instructions": ["Breathe in for 5s", "Breathe out for 5s", "Repeat for 10 min"]
        }
      ],
      "nutrition": {
        "breakfast": {"description": "Oatmeal", "protein": 15},
        "lunch": {"description": "Chicken salad", "protein": 30},
        "dinner": {"description": "Fish and vegetables", "protein": 35},
        "snacks": {"description": "Yogurt", "protein": 15},
        "totalProtein": 95
      },
      "sleepHygiene": ["Dark room", "No caffeine after 2pm"],
      "notes": ""
    }
  ],
  "shoppingList": ["Oats", "Chicken", "Fish", "Vegetables", "Yogurt"]
}

IMPORTANT:
- days must be an array with 7 day objects (Monday-Sunday)
- Return ONLY valid JSON, no markdown or explanations`;
}

function buildPlan(data: any, input: GeneratePlanInput): IntegralBodyPlan {
  // Validate structure
  if (!data || !Array.isArray(data.days)) {
    console.error('[IntegralArchitect] Invalid data structure:', data);
    throw new Error('Invalid response structure - missing days array');
  }

  if (data.days.length !== 7) {
    console.warn('[IntegralArchitect] Expected 7 days, got', data.days.length);
  }

  const now = new Date();
  const monday = getNextMonday(now);

  // Ensure all days have required fields
  const days: DayPlan[] = data.days.map((day: any) => ({
    dayName: day.dayName || 'Unknown',
    summary: day.summary || '',
    workout: day.workout || undefined,
    yinPractices: Array.isArray(day.yinPractices) ? day.yinPractices : [],
    nutrition: day.nutrition || {
      breakfast: { description: '', protein: 0 },
      lunch: { description: '', protein: 0 },
      dinner: { description: '', protein: 0 },
      totalProtein: 0
    },
    sleepHygiene: Array.isArray(day.sleepHygiene) ? day.sleepHygiene : [],
    notes: day.notes
  }));

  return {
    id: `integral-plan-${Date.now()}`,
    date: now.toISOString(),
    weekStartDate: monday.toISOString(),
    goalStatement: input.goalStatement,
    yangConstraints: input.yangConstraints,
    yinPreferences: input.yinPreferences,
    weekSummary: data.weekSummary || 'Weekly wellness plan',
    dailyTargets: data.dailyTargets || {
      proteinGrams: 100,
      sleepHours: 8,
      workoutDays: 3,
      yinPracticeMinutes: 70
    },
    days,
    shoppingList: Array.isArray(data.shoppingList) ? data.shoppingList : []
  };
}

function getNextMonday(date: Date): Date {
  const dayOfWeek = date.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
  const monday = new Date(date);
  monday.setDate(date.getDate() + daysUntilMonday);
  monday.setHours(0, 0, 0, 0);
  return monday;
}
