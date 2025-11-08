import { JourneyRegion } from '../types.ts';

export const journeyRegions: JourneyRegion[] = [
  {
    id: 'core',
    name: 'The Trailhead',
    emoji: '🥾',
    description: 'Start your journey into Integral Life Practice',
    cards: [
      {
        id: 'core-1',
        title: 'What is ILP?',
        description: 'Integral Life Practice is a cross-training approach to human development, engaging body, mind, spirit, and shadow.',
        interactionType: 'text',
        audioScript: 'ILP stands for Integral Life Practice. It is a comprehensive approach to personal development that integrates four dimensions: body awareness and vitality, mental clarity and growth, spiritual connection and meaning, and shadow work—the integration of disowned parts of ourselves.',
      },
      {
        id: 'core-2',
        title: 'Waking Up vs Growing Up',
        description: 'Understand the difference between glimpses of higher consciousness and sustained stages of development.',
        interactionType: 'poll',
        interactionData: {
          question: 'Have you experienced a moment of profound peace or insight?',
          options: ['Yes', 'No', 'Not sure'],
        },
        audioScript: 'Waking up refers to experiences of non-dual consciousness, states where the sense of separate self dissolves. Growing up refers to stages of development—how your personality and perspective mature over time. Both are essential and complement each other.',
      },
      {
        id: 'core-3',
        title: 'The Four Dimensions',
        description: 'Body, Mind, Spirit, and Shadow form the foundation of integral practice.',
        interactionType: 'drag-drop',
        interactionData: {
          question: 'Match each dimension to its practice:',
          pairs: [
            { item: 'Body', practice: 'Yoga, Breathing' },
            { item: 'Mind', practice: 'Meditation, Study' },
            { item: 'Spirit', practice: 'Prayer, Contemplation' },
            { item: 'Shadow', practice: 'Journaling, Therapy' },
          ],
        },
      },
    ],
  },
  {
    id: 'body',
    name: 'The Living Temple',
    emoji: '🏃',
    description: 'Awaken your physical presence and embodied awareness',
    cards: [
      {
        id: 'body-1',
        title: 'The Three Bodies',
        description: 'Physical, energetic, and causal dimensions of your body.',
        interactionType: 'text',
        audioScript: 'The gross body is your physical form. The subtle body is the energetic dimension—felt as aliveness, breath, and sensation. The causal body is the transcendent dimension, the source of all manifestation.',
      },
      {
        id: 'body-2',
        title: 'Somatics: The Felt Sense',
        description: 'Learn to feel and access your body\'s wisdom through somatic awareness.',
        interactionType: 'reflection',
        interactionData: {
          prompt: 'Scan your body. Where do you feel the most tension right now?',
        },
      },
      {
        id: 'body-3',
        title: 'The Breath Connection',
        description: 'Breathing is the bridge between conscious and unconscious.',
        interactionType: 'text',
        audioScript: 'Your breath is always available as an anchor. Simple breathing practices like box breathing or coherent breathing can calm your nervous system, increase awareness, and prepare you for deeper work.',
      },
    ],
  },
  {
    id: 'mind',
    name: 'The Vista Point',
    emoji: '🧠',
    description: 'Expand your mental flexibility and perspective-taking capacity',
    cards: [
      {
        id: 'mind-1',
        title: 'Perspective-Taking',
        description: 'See from multiple viewpoints using integral lenses.',
        interactionType: 'quiz',
        quizQuestion: {
          question: 'A person asks you for money. Which perspective is pluralistic?',
          options: [
            'Help them directly',
            'Consider systemic causes of poverty',
            'Follow the rules about charity',
            'Make the most efficient decision',
          ],
          correct: 1,
        },
      },
      {
        id: 'mind-2',
        title: 'Stages of Development',
        description: 'How consciousness matures through predictable stages.',
        interactionType: 'text',
        audioScript: 'Developmental stages describe how humans evolve in their capacity to understand reality. Each stage is more inclusive and complex. Common models include Kegan, spiral dynamics, and Cook-Greuter stages. Understanding your stage helps you recognize where you are in your growth journey.',
      },
      {
        id: 'mind-3',
        title: 'Cognitive Integration',
        description: 'Balance analytical thinking with intuitive knowing.',
        interactionType: 'reflection',
        interactionData: {
          prompt: 'Describe a problem using both logic and intuition.',
        },
      },
    ],
  },
  {
    id: 'spirit',
    name: 'The Inner Sanctum',
    emoji: '✨',
    description: 'Access deeper states of consciousness and spiritual insight',
    cards: [
      {
        id: 'spirit-1',
        title: 'The Witness',
        description: 'Learn to access the awareness that observes all experience.',
        interactionType: 'text',
        audioScript: 'The Witness is pure awareness—the consciousness that observes thoughts, feelings, and sensations without identification. It is always available, like the sky behind clouds.',
      },
      {
        id: 'spirit-2',
        title: 'States of Consciousness',
        description: 'Gross, subtle, causal, and non-dual states.',
        interactionType: 'text',
        audioScript: 'The gross state is waking consciousness. The subtle state is dreaming and imagery. The causal state is formless, witnessed in deep sleep. Non-dual is the source of all states—unmanifest wholeness.',
      },
      {
        id: 'spirit-3',
        title: 'Contemplative Practice',
        description: 'Sustained attention opens spiritual insight.',
        interactionType: 'reflection',
        interactionData: {
          prompt: 'What does spiritual connection mean to you?',
        },
      },
    ],
  },
  {
    id: 'shadow',
    name: 'The Cave of Mirrors',
    emoji: '🪞',
    description: 'Integrate disowned parts and transform reactivity',
    cards: [
      {
        id: 'shadow-1',
        title: 'What is Shadow?',
        description: 'The parts of yourself you\'ve disowned or refused to see.',
        interactionType: 'text',
        audioScript: 'Shadow is everything you believe you are NOT. It includes disowned qualities, repressed traumas, and projected judgments. Shadow work is the courageous practice of seeing and integrating these parts.',
      },
      {
        id: 'shadow-2',
        title: 'The 3-2-1 Process',
        description: 'A powerful technique for shadow integration.',
        interactionType: 'quiz',
        quizQuestion: {
          question: 'What is the first step of 3-2-1?',
          options: [
            'Embody the disowned part',
            'Face and observe the trigger',
            'Dialogue with the projection',
            'Integrate the shadow',
          ],
          correct: 1,
        },
      },
      {
        id: 'shadow-3',
        title: 'Projection Detection',
        description: 'Learn to spot when you\'re projecting.',
        interactionType: 'reflection',
        interactionData: {
          prompt: 'Think of someone who irritates you. What quality do they have that bothers you?',
        },
      },
    ],
  },
  {
    id: 'integral',
    name: 'The Architect\'s Office',
    emoji: '🏗️',
    description: 'Integrate all dimensions into a holistic framework',
    cards: [
      {
        id: 'integral-1',
        title: 'The Four Quadrants',
        description: 'A complete map of reality and consciousness.',
        interactionType: 'text',
        audioScript: 'The four quadrants are: Upper-Left (subjective experience), Upper-Right (objective behavior), Lower-Left (intersubjective culture), and Lower-Right (interobjective systems). All four are essential for integral understanding.',
      },
      {
        id: 'integral-2',
        title: 'AQAL (All Quadrants, All Levels)',
        description: 'The master framework for integral analysis.',
        interactionType: 'quiz',
        quizQuestion: {
          question: 'AQAL stands for:',
          options: [
            'All Questions, All Lessons',
            'All Quadrants, All Levels',
            'Awareness, Quality, Action, Learning',
            'Authentic, Quality, Aligned, Living',
          ],
          correct: 1,
        },
      },
      {
        id: 'integral-3',
        title: 'Integration Practice',
        description: 'Bring all four dimensions into conscious action.',
        interactionType: 'reflection',
        interactionData: {
          prompt: 'How do body, mind, spirit, and shadow show up in your daily life?',
        },
      },
    ],
  },
];

export const journeyBadges = {
  'core-complete': {
    name: 'Trailhead Navigator',
    description: 'You understand the foundations of ILP',
    emoji: '🥾',
  },
  'body-complete': {
    name: 'Body Awakened',
    description: 'You\'ve explored embodied awareness',
    emoji: '🏃',
  },
  'mind-complete': {
    name: 'Mind Expander',
    description: 'You\'ve expanded your perspective',
    emoji: '🧠',
  },
  'spirit-complete': {
    name: 'Spirit Seeker',
    description: 'You\'ve accessed deeper consciousness',
    emoji: '✨',
  },
  'shadow-complete': {
    name: 'Shadow Integrator',
    description: 'You\'ve begun shadow work',
    emoji: '🪞',
  },
  'integral-complete': {
    name: 'Integral Master',
    description: 'You\'ve mastered the integral framework',
    emoji: '🏗️',
  },
};
