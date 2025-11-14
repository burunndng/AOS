/**
 * Practice Personalization API Endpoint
 * Personalizes practice instructions based on user context and preferences
 */

import { generatePersonalizationPrompt } from '../rag/generate-prompt';
import { getDatabase } from '../lib/db';
import type { GenerationRequest, GenerationResponse, QueryResult } from '../lib/types';

/**
 * Personalize a practice for a specific user
 * @deprecated This feature is currently disabled due to ongoing issues
 */
export async function personalizePractice(
  userId: string,
  practiceId: string,
  practiceTitle: string,
  customContext?: Record<string, any>,
): Promise<GenerationResponse> {
  console.warn(`[Practices] Personalization service is disabled for practice: ${practiceTitle}`);

  // Return a basic response without personalization
  return {
    type: 'personalized_practice',
    content: 'Practice personalization service is currently disabled. Please use the standard practice instructions.',
    sources: [],
    confidence: 0,
    metadata: {
      practiceId,
      practiceTitle,
      originalInstructions: customContext?.originalInstructions || [],
      personalizedSteps: [],
      adaptations: [],
      generatedAt: new Date(),
      disabled: true,
    },
  };
}

/**
 * Generate personalized practice steps
 */
function generatePersonalizedSteps(
  practiceTitle: string,
  ragPrompt: any,
  customContext?: Record<string, any>,
): Array<{ order: number; instruction: string; adaptation?: string; duration?: number }> {
  const userProfile = ragPrompt.context.userProfile;
  const steps: Array<{
    order: number;
    instruction: string;
    adaptation?: string;
    duration?: number;
  }> = [];

  // Base steps (would come from practice definition in real system)
  const baseSteps = getBaseSteps(practiceTitle);

  for (let i = 0; i < baseSteps.length; i++) {
    const baseStep = baseSteps[i];
    const adaptation = adaptStep(baseStep, userProfile, customContext);

    steps.push({
      order: i + 1,
      instruction: adaptation.instruction,
      adaptation: adaptation.notes,
      duration: adaptation.duration,
    });
  }

  return steps;
}

/**
 * Get base steps for common practices
 */
function getBaseSteps(practiceTitle: string): Array<{ title: string; description: string }> {
  const practiceSteps: Record<string, Array<{ title: string; description: string }>> = {
    'Mindfulness Meditation': [
      {
        title: 'Find a quiet place',
        description: 'Choose a comfortable spot where you won\'t be disturbed for at least 5 minutes.',
      },
      {
        title: 'Sit comfortably',
        description: 'Sit upright with good posture, or lie down if sitting is uncomfortable.',
      },
      {
        title: 'Close your eyes',
        description: 'Gently close your eyes to reduce visual distractions.',
      },
      {
        title: 'Focus on your breath',
        description: 'Notice the natural rhythm of your breathing. Don\'t try to change it.',
      },
      {
        title: 'Return your attention',
        description: 'When your mind wanders, gently return focus to your breath without judgment.',
      },
      {
        title: 'Gradually finish',
        description: 'After the time is up, slowly open your eyes and take a few moments to return.',
      },
    ],
    'Body Scan': [
      {
        title: 'Lie down comfortably',
        description: 'Find a comfortable position, preferably lying on your back.',
      },
      {
        title: 'Start with your feet',
        description: 'Bring awareness to your feet, noticing sensations without judgment.',
      },
      {
        title: 'Move up your body',
        description: 'Slowly move your awareness up through legs, hips, torso, arms, and head.',
      },
      {
        title: 'Notice without changing',
        description: 'Simply observe sensations, tension, warmth, or ease without trying to fix anything.',
      },
      {
        title: 'Complete the scan',
        description: 'Once you reach the top of your head, let your awareness settle.',
      },
      {
        title: 'Return slowly',
        description: 'Take your time returning, noticing how you feel.',
      },
    ],
    'Loving-Kindness': [
      {
        title: 'Begin with yourself',
        description: 'Silently repeat phrases of kindness directed at yourself.',
      },
      {
        title: 'Extend to a loved one',
        description: 'Hold them in mind and offer the same wishes for their wellbeing.',
      },
      {
        title: 'Include a neutral person',
        description: 'Extend the practice to someone you neither love nor dislike.',
      },
      {
        title: 'Work with difficulty',
        description: 'Gently include someone you find challenging.',
      },
      {
        title: 'Expand to all beings',
        description: 'Finally, extend these wishes to all beings everywhere.',
      },
    ],
  };

  return practiceSteps[practiceTitle] || [
    {
      title: 'Prepare yourself',
      description: 'Set your intention and create a supportive environment.',
    },
    {
      title: 'Practice the core technique',
      description: 'Follow the main instructions for this practice.',
    },
    {
      title: 'Notice the effects',
      description: 'Observe what shifts internally as a result of the practice.',
    },
    {
      title: 'Close with gratitude',
      description: 'Acknowledge yourself for taking the time.',
    },
  ];
}

/**
 * Adapt a practice step for user context
 */
function adaptStep(
  step: { title: string; description: string },
  userProfile: any,
  customContext?: Record<string, any>,
): { instruction: string; notes: string; duration?: number } {
  let instruction = `${step.title}: ${step.description}`;
  const notes: string[] = [];
  let duration = 5;

  // Adapt for learning modality
  if (
    userProfile.preferences.preferredModalities &&
    userProfile.preferences.preferredModalities.includes('visual')
  ) {
    notes.push('Try visualizing this step in detail');
  } else if (
    userProfile.preferences.preferredModalities &&
    userProfile.preferences.preferredModalities.includes('kinesthetic')
  ) {
    notes.push('Emphasize the felt sense and physical sensations');
  } else if (
    userProfile.preferences.preferredModalities &&
    userProfile.preferences.preferredModalities.includes('auditory')
  ) {
    notes.push('Consider using an audio guide or repeating affirmations aloud');
  }

  // Adapt for common obstacles
  if (customContext?.challenge) {
    if (customContext.challenge.includes('restlessness')) {
      notes.push('If your mind wanders, that\'s completely normal - gently bring it back');
      duration = 3; // Start shorter
    }
    if (customContext.challenge.includes('discomfort')) {
      notes.push('Feel free to adjust your position - comfort is more important than form');
    }
    if (customContext.challenge.includes('time')) {
      notes.push('Even 2-3 minutes has real benefits');
      duration = 2;
    }
  }

  // Adapt for accessibility
  if (customContext?.accessibility) {
    if (customContext.accessibility.includes('mobility')) {
      notes.push('This can be adapted to a seated or lying position as needed');
    }
  }

  return {
    instruction,
    notes: notes.join(' '),
    duration,
  };
}

/**
 * Generate adaptation suggestions
 */
function generateAdaptations(ragPrompt: any): string[] {
  const adaptations: string[] = [];
  const userProfile = ragPrompt.context.userProfile;

  // Time-based adaptations
  if (userProfile.preferences.preferredDuration === 'short') {
    adaptations.push('Start with 3-5 minutes and extend as it becomes comfortable');
  } else if (userProfile.preferences.preferredDuration === 'long') {
    adaptations.push('This practice benefits from extended engagement - consider 15-20 minutes if possible');
  }

  // Sequencing adaptations
  if (userProfile.completedPractices && userProfile.completedPractices.length === 0) {
    adaptations.push('As a beginning practice, focus on establishing consistency over intensity');
  } else {
    adaptations.push('Building on your existing practice experience, notice how this complements your other work');
  }

  // Integration suggestions
  if (
    userProfile.preferences.focusAreas &&
    userProfile.preferences.focusAreas.some((f: string) => f.includes('mindfulness'))
  ) {
    adaptations.push('This practice directly supports your mindfulness work');
  }

  // Bias-related adaptations
  if (userProfile.biases && userProfile.biases.length > 0) {
    adaptations.push(
      `You may notice patterns related to your identified biases (${userProfile.biases.slice(0, 2).join(', ')}) - observe without judgment`,
    );
  }

  return adaptations.length > 0
    ? adaptations
    : [
        'Practice consistently for maximum benefit',
        'Be patient with yourself as this becomes more natural',
      ];
}

/**
 * Get suggested customizations for a practice
 * @deprecated This feature is currently disabled due to ongoing issues
 */
export async function getSuggestedCustomizations(
  userId: string,
  practiceId: string,
): Promise<Record<string, any>> {
  console.warn(`[Practices] Customization suggestions service is disabled for practice: ${practiceId}`);

  // Return minimal customizations without personalization
  return {
    practiceId,
    practiceTitle: 'Unknown Practice',
    suggestedDuration: 'As preferred',
    suggestedFrequency: 'As preferred',
    suggestedTime: 'Anytime',
    variantPractices: [],
    commonProgressions: [],
    disabled: true,
    message: 'Customization suggestions are currently unavailable',
  };
}

/**
 * Save customized practice for user
 * @deprecated This feature is currently disabled due to ongoing issues
 */
export async function saveCustomizedPractice(
  userId: string,
  practiceId: string,
  customSteps: Array<{ order: number; instruction: string }>,
  notes?: string,
): Promise<{ success: boolean; message: string; customPracticeId?: string }> {
  console.warn(`[Practices] Save customized practice service is disabled for user: ${userId}`);

  return {
    success: false,
    message: 'Customization save service is currently disabled',
  };
}

/**
 * Health check for practice personalization service
 */
export async function healthCheck(): Promise<{ status: 'ok' | 'error'; message: string }> {
  return {
    status: 'error',
    message: 'Practice personalization service is currently disabled',
  };
}
