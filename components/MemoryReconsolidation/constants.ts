// Memory Reconsolidation Wizard Constants

export const VALIDATION_CONSTANTS = {
  MIN_BELIEF_CONTEXT_LENGTH: 50,
  MIN_CUSTOM_PLAN_LENGTH: 20,
  MAX_JUXTAPOSITION_CYCLES: 5,
} as const;

export const ANIMATION_TIMINGS = {
  OLD_TRUTH_DISPLAY: 8000,
  PAUSE_BETWEEN: 3000,
  NEW_TRUTH_DISPLAY: 8000,
  COPY_FEEDBACK: 2000,
} as const;

export const INTEGRATION_PRACTICES = [
  {
    practiceId: 'meditation',
    practiceName: 'Daily Meditation',
    description: 'Mindful awareness practice',
    bestFor: ['grounding', 'awareness'],
  },
  {
    practiceId: 'expressive-writing',
    practiceName: 'Expressive Writing',
    description: 'Process emotions through writing',
    bestFor: ['emotional-regulation', 'integration'],
  },
  {
    practiceId: 'loving-kindness',
    practiceName: 'Loving-Kindness Meditation',
    description: 'Cultivate self-compassion',
    bestFor: ['compassion', 'self-acceptance'],
  },
  {
    practiceId: 'coherent-breathing',
    practiceName: 'Coherent Breathing',
    description: 'Regulate nervous system through breath',
    bestFor: ['regulation', 'grounding'],
  },
] as const;
