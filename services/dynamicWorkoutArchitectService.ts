import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { executeWithFallback, getFallbackModel, shouldUseFallback, logFallbackAttempt } from '../utils/modelFallback';

// Lazy initialization to avoid crashes when API key is not set
let openRouter: OpenAI | null = null;
let geminiClient: GoogleGenAI | null = null;

function getOpenRouterClient(): OpenAI {
  if (!openRouter) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is not set. Please configure your API key.');
    }
    openRouter = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      dangerouslyAllowBrowser: true,
    });
  }
  return openRouter;
}

function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error('API_KEY is not set. Please configure your Gemini API key.');
    }
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

export interface WorkoutExercise {
  name: string;
  sets: number;
  reps: string;
  duration?: number;
  tempo?: string;
  restSeconds?: number;
  notes?: string;
  modifications?: string[];
  formGuidance?: string[];
}

export interface GeneratedWorkout {
  id: string;
  name: string;
  intensity: 'light' | 'moderate' | 'intense';
  duration: number;
  equipment: string[];
  exercises: WorkoutExercise[];
  warmup?: {
    name: string;
    duration: number;
    description: string;
  };
  cooldown?: {
    name: string;
    duration: number;
    description: string;
  };
  muscleGroupsFocused: string[];
  caloriesBurned?: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  notes?: string;
  somaticGuidance?: string;
}

export interface WorkoutProgram {
  id: string;
  date: string;
  title: string;
  summary: string;
  workouts: GeneratedWorkout[];
  weekView?: {
    monday?: GeneratedWorkout;
    tuesday?: GeneratedWorkout;
    wednesday?: GeneratedWorkout;
    thursday?: GeneratedWorkout;
    friday?: GeneratedWorkout;
    saturday?: GeneratedWorkout;
    sunday?: GeneratedWorkout;
  };
  personalizationNotes?: string;
  progressionRecommendations?: string[];
}

interface GenerateWorkoutInput {
  userGoals: string;
  intensity: 'light' | 'moderate' | 'intense';
  duration: number;
  equipment: string[];
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  bodyAwareness?: string;
  injuries?: string;
  preferences?: string;
  focusAreas?: string[];
  isWeeklyProgram?: boolean;
}

interface LLMWorkoutGenerationResponse {
  title: string;
  summary: string;
  personalizationNotes: string;
  progressionRecommendations: string[];
  workouts: Array<{
    name: string;
    intensity: 'light' | 'moderate' | 'intense';
    duration: number;
    equipment: string[];
    exercises: Array<{
      name: string;
      sets: number;
      reps: string;
      duration?: number;
      tempo?: string;
      restSeconds?: number;
      notes?: string;
      modifications: string[];
      formGuidance: string[];
    }>;
    warmup?: {
      name: string;
      duration: number;
      description: string;
    };
    cooldown?: {
      name: string;
      duration: number;
      description: string;
    };
    muscleGroupsFocused: string[];
    caloriesBurned?: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    notes?: string;
    somaticGuidance?: string;
  }>;
}

// JSON schema structure for reference (used in prompt)
const WORKOUT_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    summary: { type: 'string' },
    personalizationNotes: { type: 'string' },
    progressionRecommendations: {
      type: 'array',
      items: { type: 'string' }
    },
    workouts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          intensity: { type: 'string' },
          duration: { type: 'number' },
          equipment: {
            type: 'array',
            items: { type: 'string' }
          },
          exercises: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                sets: { type: 'number' },
                reps: { type: 'string' },
                duration: { type: 'number' },
                tempo: { type: 'string' },
                restSeconds: { type: 'number' },
                notes: { type: 'string' },
                modifications: {
                  type: 'array',
                  items: { type: 'string' }
                },
                formGuidance: {
                  type: 'array',
                  items: { type: 'string' }
                }
              },
              required: ['name', 'sets', 'reps', 'modifications', 'formGuidance']
            }
          },
          warmup: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              duration: { type: 'number' },
              description: { type: 'string' }
            }
          },
          cooldown: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              duration: { type: 'number' },
              description: { type: 'string' }
            }
          },
          muscleGroupsFocused: {
            type: 'array',
            items: { type: 'string' }
          },
          caloriesBurned: { type: 'number' },
          difficulty: { type: 'string' },
          notes: { type: 'string' },
          somaticGuidance: { type: 'string' }
        },
        required: ['name', 'intensity', 'duration', 'equipment', 'exercises', 'muscleGroupsFocused', 'difficulty']
      }
    }
  },
  required: ['title', 'summary', 'workouts']
};

/**
 * Helper function to call Gemini API for fallback from OpenRouter (Grok models)
 */
async function callGeminiFallback(prompt: string): Promise<string> {
  try {
    const response = await getGeminiClient().models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 8000,
      }
    });

    return response.text || '';
  } catch (error) {
    throw new Error(`Gemini fallback failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function generateDynamicWorkout(input: GenerateWorkoutInput): Promise<WorkoutProgram> {
  const prompt = `You are the Dynamic Workout Architect—an expert at creating personalized, adaptive workout programs that align with both physical training principles and somatic body awareness.

USER'S FITNESS GOALS:
${input.userGoals}

WORKOUT PARAMETERS:
- Intensity Level: ${input.intensity}
- Session Duration: ${input.duration} minutes
- Available Equipment: ${input.equipment.join(', ')}
- Experience Level: ${input.experienceLevel}
${input.focusAreas && input.focusAreas.length > 0 ? `- Focus Areas: ${input.focusAreas.join(', ')}` : ''}
${input.bodyAwareness ? `- Body Awareness Preferences: ${input.bodyAwareness}` : ''}
${input.injuries ? `- Injury/Pain Considerations: ${input.injuries}` : ''}
${input.preferences ? `- Additional Preferences: ${input.preferences}` : ''}

YOUR TASK:
Create ${input.isWeeklyProgram ? 'a comprehensive 7-day workout program' : 'a personalized, effective workout'} that:

1. EXERCISE SELECTION:
   - Choose exercises that match available equipment and experience level
   - Prioritize compound movements for efficiency
   - Include progressive overload opportunities
   - Align with stated focus areas and goals

2. WORKOUT STRUCTURE:
   - Include proper warm-up (dynamic stretching, mobility prep)
   - Progressive loading within the session
   - Variety in rep ranges and tempos
   - Appropriate rest periods for recovery
   - Cool-down with static stretching/breathing

3. EXERCISE DETAILS:
   - Provide specific sets, reps, and tempo for each exercise
   - Include clear form guidance and key cues
   - Suggest modifications for different experience levels
   - Add notes on breathing, mind-muscle connection

4. SOMATIC INTEGRATION:
   - Include body awareness cues during exercises
   - Suggest breathing patterns for different movement phases
   - Note opportunities for proprioceptive feedback
   - Include relaxation/integration phases

5. PERSONALIZATION:
   - Address injury considerations with adapted variations
   - Respect experience level while offering progression
   - Match intensity to user's capacity and goals
   - Consider energy expenditure and recovery needs

${input.isWeeklyProgram ? `6. WEEKLY PROGRAMMING:
   - Distribute workouts across the week with adequate recovery
   - Vary intensity and focus to avoid plateaus
   - Balance upper body, lower body, and full-body sessions
   - Include at least one active recovery or flexibility day` : ''}

Return a detailed${input.isWeeklyProgram ? ', structured 7-day workout program' : ' workout session'} with comprehensive exercise descriptions and personalization notes.
Be specific, actionable, and emphasize the mind-body connection throughout.

IMPORTANT: Return your response as valid JSON only, with no additional text or markdown formatting. Use this schema:
${JSON.stringify(WORKOUT_RESPONSE_SCHEMA, null, 2)}`;

  // Use executeWithFallback for automatic fallback handling
  const responseText = await executeWithFallback(
    'DynamicWorkoutArchitect',
    'x-ai/grok-4-fast',
    async (primaryModel) => {
      try {
        const apiPromise = getOpenRouterClient().chat.completions.create({
          model: primaryModel,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 8000
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Workout generation timed out after 60 seconds. Please try again.')), 60000)
        );

        const response = await Promise.race([apiPromise, timeoutPromise]);
        return response.choices[0]?.message?.content || '';
      } catch (error) {
        if (error instanceof Error && error.message.includes('timed out')) {
          throw error;
        }
        throw new Error(`Failed to generate workout: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    async (fallbackModel) => {
      try {
        console.log('[DynamicWorkoutArchitect] Attempting fallback to Gemini:', fallbackModel);
        return await callGeminiFallback(prompt);
      } catch (error) {
        throw new Error(`Gemini fallback failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  let workoutData: LLMWorkoutGenerationResponse;
  try {
    workoutData = JSON.parse(responseText);
  } catch (error) {
    throw new Error('Failed to parse workout response. Please try again.');
  }

  const now = new Date();
  const generatedWorkouts: GeneratedWorkout[] = workoutData.workouts.map((w, idx) => ({
    id: `workout-${Date.now()}-${idx}`,
    name: w.name,
    intensity: w.intensity,
    duration: w.duration,
    equipment: w.equipment,
    exercises: w.exercises,
    warmup: w.warmup,
    cooldown: w.cooldown,
    muscleGroupsFocused: w.muscleGroupsFocused,
    caloriesBurned: w.caloriesBurned,
    difficulty: w.difficulty,
    notes: w.notes,
    somaticGuidance: w.somaticGuidance
  }));

  const program: WorkoutProgram = {
    id: `program-${Date.now()}`,
    date: now.toISOString(),
    title: workoutData.title,
    summary: workoutData.summary,
    workouts: generatedWorkouts,
    personalizationNotes: workoutData.personalizationNotes,
    progressionRecommendations: workoutData.progressionRecommendations
  };

  return program;
}
