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

/**
 * Calculate metabolic and biometric metrics
 */
interface BiometricMetrics {
  bmi: string | null;
  bmr: number;
  tdee: number;
  recommendedCalories: number;
  calorieAdjustment: string;
  proteinGrams: number;
  proteinPerKg: number;
  carbsGrams: number;
  fatsGrams: number;
}

function calculateMetrics(constraints: YangConstraints): BiometricMetrics {
  const {
    bodyweight = 70,
    height,
    age,
    sex,
    activityLevel,
    primaryGoal,
    nutritionDetails
  } = constraints;

  // BMI calculation
  const bmi = height && bodyweight
    ? (bodyweight / Math.pow(height / 100, 2)).toFixed(1)
    : null;

  // Mifflin-St Jeor BMR calculation (most accurate modern formula)
  let bmr = 0;
  if (bodyweight && height && age && sex) {
    if (sex === 'male') {
      bmr = (10 * bodyweight) + (6.25 * height) - (5 * age) + 5;
    } else if (sex === 'female') {
      bmr = (10 * bodyweight) + (6.25 * height) - (5 * age) - 161;
    } else {
      // Use average of male/female for 'other'
      const maleBmr = (10 * bodyweight) + (6.25 * height) - (5 * age) + 5;
      const femaleBmr = (10 * bodyweight) + (6.25 * height) - (5 * age) - 161;
      bmr = (maleBmr + femaleBmr) / 2;
    }
  } else {
    // Fallback: rough estimate if missing data
    bmr = bodyweight * 22; // Simple approximation
  }

  // Activity multipliers for TDEE calculation
  const activityMultipliers: Record<string, number> = {
    'sedentary': 1.2,           // Little to no exercise
    'lightly-active': 1.375,    // Exercise 1-3 days/week
    'moderately-active': 1.55,  // Exercise 3-5 days/week
    'very-active': 1.725,       // Exercise 6-7 days/week
    'athlete': 1.9              // 2x per day training
  };

  const tdee = bmr * (activityMultipliers[activityLevel || 'lightly-active'] || 1.375);

  // Calorie adjustment based on goal
  const calorieAdjustments: Record<string, number> = {
    'lose-fat': -500,        // ~0.5kg/week fat loss
    'gain-muscle': +300,     // Lean bulk
    'recomp': 0,             // Maintenance with high protein
    'maintain': 0,
    'performance': +200,     // Slight surplus for performance
    'general-health': 0
  };

  const calorieAdjustment = calorieAdjustments[primaryGoal || 'maintain'] || 0;
  const recommendedCalories = nutritionDetails?.targetCalories
    || Math.round(tdee + calorieAdjustment);

  // Protein calculation (evidence-based ranges)
  // Source: International Society of Sports Nutrition position stand
  const proteinPerKg = nutritionDetails?.proteinGramsPerKg
    || (primaryGoal === 'gain-muscle' ? 2.0   // 1.6-2.2 g/kg for muscle gain
      : primaryGoal === 'lose-fat' ? 2.2      // Higher for fat loss to preserve muscle
      : primaryGoal === 'performance' ? 1.8
      : 1.6);                                  // General health minimum

  const proteinGrams = Math.round(bodyweight * proteinPerKg);

  // Calculate remaining calories for carbs and fats
  const proteinCalories = proteinGrams * 4; // 4 kcal per gram
  const remainingCalories = recommendedCalories - proteinCalories;

  // Fat allocation: 25-30% of total calories (essential for hormones)
  const fatPercentage = 0.25;
  const fatsGrams = Math.round((recommendedCalories * fatPercentage) / 9); // 9 kcal per gram
  const fatCalories = fatsGrams * 9;

  // Remaining calories go to carbs
  const carbCalories = remainingCalories - fatCalories;
  const carbsGrams = Math.round(carbCalories / 4); // 4 kcal per gram

  return {
    bmi,
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    recommendedCalories,
    calorieAdjustment: calorieAdjustment >= 0 ? `+${calorieAdjustment}` : `${calorieAdjustment}`,
    proteinGrams,
    proteinPerKg,
    carbsGrams,
    fatsGrams
  };
}

/**
 * Get calorie adjustment guidance text based on goal
 */
function getCalorieAdjustmentGuidance(goal?: string): string {
  switch(goal) {
    case 'lose-fat': return 'Deficit of ~500 kcal/day for ~0.5kg/week loss';
    case 'gain-muscle': return 'Surplus of ~300 kcal/day for lean muscle gains';
    case 'recomp': return 'Maintenance calories with high protein (2.2g/kg) for body recomposition';
    case 'performance': return 'Slight surplus to fuel performance and recovery';
    default: return 'Maintenance calories for weight stability';
  }
}

function buildPrompt(input: GeneratePlanInput): string {
  const { goalStatement, yangConstraints, yinPreferences } = input;

  // Calculate metabolic metrics
  const metrics = calculateMetrics(yangConstraints);

  return `Create a 7-day wellness plan for this individual.

## USER PROFILE

**Demographics:**
- Age: ${yangConstraints.age || 'Not provided'} years
- Sex: ${yangConstraints.sex || 'Not specified'}
- Height: ${yangConstraints.height || 'Not provided'} cm
- Weight: ${yangConstraints.bodyweight || 70} kg
- BMI: ${metrics.bmi || 'Unknown (need height)'}

**Activity & Experience:**
- Baseline Activity Level: ${yangConstraints.activityLevel || 'lightly-active (assumed)'}
- Strength Training Experience: ${yangConstraints.strengthTrainingExperience || 'beginner (assumed)'}
- Yin Practice Experience: ${yinPreferences.experienceLevel}

**Goals:**
- Primary Goal: ${goalStatement}
- Body Composition Goal: ${yangConstraints.primaryGoal || 'general-health'}
${yangConstraints.targetBodyComposition?.targetWeight ? `- Target Weight: ${yangConstraints.targetBodyComposition.targetWeight} kg` : ''}

## METABOLIC CALCULATIONS

**Estimated Metrics:**
- BMR (Basal Metabolic Rate): ${metrics.bmr} kcal/day
- TDEE (Total Daily Energy Expenditure): ${metrics.tdee} kcal/day
- Recommended Calories: ${metrics.recommendedCalories} kcal/day (${metrics.calorieAdjustment} from TDEE)
- Protein Target: ${metrics.proteinGrams}g/day (${metrics.proteinPerKg}g/kg bodyweight)
- Carbs Target: ~${metrics.carbsGrams}g/day
- Fats Target: ~${metrics.fatsGrams}g/day

**Strategy:** ${getCalorieAdjustmentGuidance(yangConstraints.primaryGoal)}

## CONSTRAINTS

**Training:**
- Equipment: ${yangConstraints.equipment.join(', ')}
- Max Workout Duration: ${yangConstraints.maxWorkoutDuration || 60} minutes/session
- Unavailable Days: ${yangConstraints.unavailableDays.length > 0 ? yangConstraints.unavailableDays.join(', ') : 'None'}
- Preferred Times: ${yangConstraints.preferredWorkoutTimes?.join(', ') || 'Flexible'}
- Sleep Target: ${yangConstraints.sleepHours || 8} hours/night

**Injuries/Limitations:**
${yangConstraints.injuryRestrictions && yangConstraints.injuryRestrictions.length > 0
  ? yangConstraints.injuryRestrictions.map(inj =>
      `- ${inj.bodyPart}: ${inj.restrictions.join(', ')} (Severity: ${inj.severity}${inj.painLevel ? `, Pain: ${inj.painLevel}/10` : ''})`
    ).join('\n')
  : '- None reported'}

**Nutrition:**
- Dietary Focus: ${yangConstraints.nutritionFocus || 'Balanced, whole foods'}
${yangConstraints.nutritionDetails?.dietaryRestrictions?.length
  ? `- Dietary Restrictions: ${yangConstraints.nutritionDetails.dietaryRestrictions.join(', ')}`
  : ''}
- Meals Per Day: ${yangConstraints.nutritionDetails?.mealsPerDay || 3}
${yangConstraints.nutritionDetails?.cookingSkill
  ? `- Cooking Skill: ${yangConstraints.nutritionDetails.cookingSkill}`
  : ''}
${yangConstraints.nutritionDetails?.targetCalories
  ? `- User-Specified Calorie Target: ${yangConstraints.nutritionDetails.targetCalories} kcal/day (OVERRIDE: Use this instead of TDEE calculation)`
  : ''}
${yangConstraints.nutritionDetails?.proteinGramsPerKg
  ? `- User-Specified Protein Target: ${yangConstraints.nutritionDetails.proteinGramsPerKg}g/kg (OVERRIDE: Use this instead of goal-based default)`
  : ''}

## YIN PRACTICES

- Goal: ${yinPreferences.goal}
- Experience: ${yinPreferences.experienceLevel}
${yinPreferences.intentions?.length ? `- Intentions: ${yinPreferences.intentions.join(', ')}` : ''}

---

## IMPORTANT SAFETY & PERSONALIZATION RULES

1. **Age Considerations:**
${yangConstraints.age && yangConstraints.age > 50
  ? '   - PRIORITY: Include joint mobility work, longer warm-ups (8-10 min), moderate intensity (RPE 6-7), emphasize recovery'
  : yangConstraints.age && yangConstraints.age < 25
    ? '   - Can handle higher volume and intensity, faster recovery, prioritize progressive overload'
    : '   - Standard adult programming, balance volume and recovery'}

2. **Sex-Specific Guidelines:**
${yangConstraints.sex === 'female'
  ? '   - Account for potential hormonal fluctuations, may need deload weeks, slightly lower absolute volume'
  : yangConstraints.sex === 'male'
    ? '   - Can typically handle slightly higher volume, prioritize compound movements'
    : '   - Use balanced programming'}

3. **Experience-Based Progression:**
${yangConstraints.strengthTrainingExperience === 'never' || yangConstraints.strengthTrainingExperience === 'beginner'
  ? '   - START CONSERVATIVE: Focus on movement quality over weight, use RPE 6-7, include detailed form cues, limit exercise variety (3-4 exercises/session)'
  : yangConstraints.strengthTrainingExperience === 'intermediate'
    ? '   - Use progressive overload, RPE 7-8, can handle more volume and variety'
    : '   - Advanced programming available: can use RPE 8-9, higher frequency, specialized techniques'}

4. **Injury Management:**
${yangConstraints.injuryRestrictions?.some(inj => inj.severity === 'severe')
  ? '   - ⚠️ SEVERE INJURY DETECTED: Avoid affected movements entirely, suggest pain-free alternatives, recommend medical clearance before training'
  : yangConstraints.injuryRestrictions?.some(inj => inj.severity === 'moderate')
    ? '   - MODERATE INJURY: Modify affected movements, reduce range of motion, monitor pain levels (<3/10), include rehab exercises'
    : yangConstraints.injuryRestrictions?.length
      ? '   - MILD INJURY: Exercise with caution, avoid painful ranges, include mobility work'
      : '   - No injuries reported, full movement library available'}

5. **Nutrition Planning:**
   - Use calculated TDEE (${metrics.tdee} kcal) as baseline
   - Daily target: ${metrics.recommendedCalories} kcal (${yangConstraints.primaryGoal || 'maintenance'})
   - Distribute protein (${metrics.proteinGrams}g) across ${yangConstraints.nutritionDetails?.mealsPerDay || 3} meals (~${Math.round(metrics.proteinGrams / (yangConstraints.nutritionDetails?.mealsPerDay || 3))}g per meal)
   - Prioritize nutrient timing: protein within 2 hours post-workout
${yangConstraints.nutritionDetails?.dietaryRestrictions?.length
  ? `   - STRICT ADHERENCE REQUIRED: All meals must comply with: ${yangConstraints.nutritionDetails.dietaryRestrictions.join(', ')}`
  : ''}
${yangConstraints.nutritionDetails?.cookingSkill === 'minimal'
  ? '   - Cooking Skill: MINIMAL - Use simple recipes, pre-cooked proteins, microwaveable options, minimal prep time (<10 min)'
  : yangConstraints.nutritionDetails?.cookingSkill === 'basic'
    ? '   - Cooking Skill: BASIC - Simple recipes with 5-7 ingredients, 15-20 min prep, clear instructions'
    : yangConstraints.nutritionDetails?.cookingSkill === 'intermediate'
      ? '   - Cooking Skill: INTERMEDIATE - Can handle varied techniques, 20-30 min prep, balanced complexity'
      : yangConstraints.nutritionDetails?.cookingSkill === 'advanced'
        ? '   - Cooking Skill: ADVANCED - Complex recipes welcome, diverse cuisines, batch cooking, meal prep strategies'
        : '   - Cooking Skill: BASIC (default) - Simple, approachable recipes'}
   - If user wants nutrition-only plan: Focus entirely on detailed meal planning, shopping lists, macro tracking, and meal prep strategies. Workouts can be minimal or skipped.

## RESPONSE FORMAT

Return JSON with this structure:
{
  "weekSummary": "Brief summary acknowledging user's profile (age, sex, experience) and goals",
  "dailyTargets": {
    "calories": ${metrics.recommendedCalories},
    "proteinGrams": ${metrics.proteinGrams},
    "carbsGrams": ${metrics.carbsGrams},
    "fatsGrams": ${metrics.fatsGrams},
    "sleepHours": ${yangConstraints.sleepHours || 8},
    "workoutDays": 3,
    "yinPracticeMinutes": 70
  },
  "days": [
    {
      "dayName": "Monday",
      "summary": "Day summary citing specific considerations (e.g., 'Recovery focus due to knee injury')",
      "workout": {
        "name": "Full Body A",
        "targetRPE": 7,
        "exercises": [
          {
            "name": "Goblet Squat",
            "sets": 3,
            "reps": "12",
            "rpe": 7,
            "notes": "Stop if knee pain exceeds 3/10. Reduce range if needed."
          }
        ],
        "duration": ${yangConstraints.maxWorkoutDuration || 60},
        "warmup": ["5 min walk", "Hip circles", "Bodyweight squats"],
        "cooldown": ["5 min walk", "Quad stretch"],
        "notes": "Focus on form over weight. Rest 90-120s between sets."
      },
      "yinPractices": [
        {
          "name": "Breathing Exercise",
          "practiceType": "breathing",
          "duration": 10,
          "timeOfDay": "Evening",
          "intention": "Relax and prepare for sleep",
          "instructions": ["Breathe in for 4s", "Hold for 4s", "Breathe out for 6s", "Repeat for 10 min"]
        }
      ],
      "nutrition": {
        "breakfast": {
          "description": "Oatmeal with protein powder and berries",
          "calories": ${Math.round(metrics.recommendedCalories * 0.25)},
          "protein": ${Math.round(metrics.proteinGrams * 0.25)},
          "carbs": ${Math.round(metrics.carbsGrams * 0.3)},
          "fats": ${Math.round(metrics.fatsGrams * 0.2)}
        },
        "lunch": {
          "description": "Chicken breast with rice and vegetables",
          "calories": ${Math.round(metrics.recommendedCalories * 0.35)},
          "protein": ${Math.round(metrics.proteinGrams * 0.35)},
          "carbs": ${Math.round(metrics.carbsGrams * 0.4)},
          "fats": ${Math.round(metrics.fatsGrams * 0.3)}
        },
        "dinner": {
          "description": "Salmon with sweet potato and greens",
          "calories": ${Math.round(metrics.recommendedCalories * 0.3)},
          "protein": ${Math.round(metrics.proteinGrams * 0.3)},
          "carbs": ${Math.round(metrics.carbsGrams * 0.25)},
          "fats": ${Math.round(metrics.fatsGrams * 0.4)}
        },
        "snacks": {
          "description": "Greek yogurt with nuts",
          "calories": ${Math.round(metrics.recommendedCalories * 0.1)},
          "protein": ${Math.round(metrics.proteinGrams * 0.1)},
          "carbs": ${Math.round(metrics.carbsGrams * 0.05)},
          "fats": ${Math.round(metrics.fatsGrams * 0.1)}
        },
        "totalCalories": ${metrics.recommendedCalories},
        "totalProtein": ${metrics.proteinGrams},
        "totalCarbs": ${metrics.carbsGrams},
        "totalFats": ${metrics.fatsGrams},
        "hydration": "${yangConstraints.bodyweight ? Math.round((yangConstraints.bodyweight * 0.033) * 10) / 10 : 2.5}L water"
      },
      "sleepHygiene": ["Dark room", "Cool temp (18-20°C)", "No caffeine after 2pm", "${yangConstraints.sleepHours ? Math.floor(yangConstraints.sleepHours * 60 + (22 * 60 - yangConstraints.sleepHours * 60)) : '22'}:00 bedtime"],
      "notes": ""
    }
  ],
  "shoppingList": ["Oats", "Protein powder", "Chicken breast", "Salmon", "Rice", "Sweet potato", "Mixed greens", "Greek yogurt", "Nuts", "Berries"]
}

CRITICAL REQUIREMENTS:
- days must be an array with exactly 7 day objects (Monday-Sunday)
- Use calculated calories (${metrics.recommendedCalories} kcal) and macros (P: ${metrics.proteinGrams}g, C: ${metrics.carbsGrams}g, F: ${metrics.fatsGrams}g)
- Respect max workout duration (${yangConstraints.maxWorkoutDuration || 60} minutes)
- Account for ${yangConstraints.strengthTrainingExperience || 'beginner'} experience level in exercise selection and volume
- Work around injuries: ${yangConstraints.injuryRestrictions?.map(i => i.bodyPart).join(', ') || 'none'}
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
