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
        imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=400&fit=crop',
        interactionType: 'text',
        audioScript: 'ILP stands for Integral Life Practice. It is a comprehensive approach to personal development that integrates four dimensions: body awareness and vitality, mental clarity and growth, spiritual connection and meaning, and shadow work—the integration of disowned parts of ourselves. Think of it as cross-training for your entire being.',
      },
      {
        id: 'core-2',
        title: 'Waking Up vs Growing Up',
        description: 'Understand the difference between glimpses of higher consciousness and sustained stages of development.',
        imageUrl: 'https://images.unsplash.com/photo-1518904147e5-95207c67d65b?w=800&h=400&fit=crop',
        interactionType: 'poll',
        interactionData: {
          question: 'Have you experienced a moment of profound peace or insight?',
          options: ['Yes', 'No', 'Not sure'],
        },
        audioScript: 'Waking up refers to experiences of non-dual consciousness, states where the sense of separate self dissolves. Moments of peak experience, profound peace, or dissolution of the ego. Growing up refers to stages of development—how your personality and perspective mature over time. Both are essential and complement each other.',
      },
      {
        id: 'core-3',
        title: 'The Four Dimensions',
        description: 'Body, Mind, Spirit, and Shadow form the foundation of integral practice.',
        imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop',
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
        audioScript: 'The four dimensions work together as an integrated whole. Your body grounds you in presence. Your mind clarifies understanding. Your spirit connects you to meaning. Your shadow integrates what you have denied. Together they create wholeness.',
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
        imageUrl: 'https://images.unsplash.com/photo-1588286840104-8957b019727f?w=800&h=400&fit=crop',
        interactionType: 'text',
        audioScript: 'The gross body is your physical form—skin, bones, organs. The subtle body is the energetic dimension—felt as aliveness, breath, circulation, and sensation. The causal body is the transcendent dimension, the source of all manifestation, pure consciousness expressing itself.',
      },
      {
        id: 'body-2',
        title: 'Somatics: The Felt Sense',
        description: 'Learn to feel and access your body\'s wisdom through somatic awareness.',
        imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=400&fit=crop',
        interactionType: 'reflection',
        interactionData: {
          prompt: 'Right now, scan your body from head to toe. Where do you feel the most tension or constriction?',
        },
        audioScript: 'Somatics is the art of feeling. Your body holds all your life experience. Through somatic awareness, you develop sensitivity to subtle sensations—tension, warmth, vibration—that reveal your deepest patterns and possibilities.',
      },
      {
        id: 'body-3',
        title: 'The Breath Connection',
        description: 'Breathing is the bridge between conscious and unconscious.',
        imageUrl: 'https://images.unsplash.com/photo-1599091160904-b8b4d5c6a3f0?w=800&h=400&fit=crop',
        interactionType: 'text',
        audioScript: 'Your breath is always available as an anchor to the present moment. Simple breathing practices like box breathing or coherent breathing can calm your nervous system, increase oxygen flow, and prepare you for deeper meditative and psychological work.',
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
        imageUrl: 'https://images.unsplash.com/photo-1516738901601-e1b62f54ddf0?w=800&h=400&fit=crop',
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
        audioScript: 'Perspective-taking is seeing through multiple lenses. Scientific, artistic, systemic, personal, cultural—each reveals different truths about the same situation. The integral approach holds all perspectives as valid and necessary.',
      },
      {
        id: 'mind-2',
        title: 'Stages of Development',
        description: 'How consciousness matures through predictable stages.',
        imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop',
        interactionType: 'text',
        audioScript: 'Developmental stages describe how humans evolve in their capacity to understand reality. Each stage is more inclusive, more complex, more aware. Common models include Kegan stages, spiral dynamics, and Cook-Greuter stages. Understanding your stage helps you recognize where you are and what you might grow into.',
      },
      {
        id: 'mind-3',
        title: 'Cognitive Integration',
        description: 'Balance analytical thinking with intuitive knowing.',
        imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop',
        interactionType: 'reflection',
        interactionData: {
          prompt: 'Take a challenge you\'re facing. Describe it through pure logic, then through gut feeling and intuition.',
        },
        audioScript: 'True intelligence integrates both hemispheres. Your left brain analyzes, breaks apart, creates distinction. Your right brain intuits, connects, creates meaning. The mature mind uses both.',
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
        imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=400&fit=crop',
        interactionType: 'text',
        audioScript: 'The Witness is pure awareness—the consciousness that observes thoughts, feelings, and sensations without identification or judgment. It is always available, like the sky behind clouds. Behind every emotion is the witness. Behind every thought is the witness. Can you feel it right now?',
      },
      {
        id: 'spirit-2',
        title: 'States of Consciousness',
        description: 'Gross, subtle, causal, and non-dual states.',
        imageUrl: 'https://images.unsplash.com/photo-1528148343865-19218e4fb2e7?w=800&h=400&fit=crop',
        interactionType: 'text',
        audioScript: 'The gross state is waking consciousness—solid, linear, material. The subtle state is dreaming and imagination—fluid, symbolic, poetic. The causal state is formless awareness, witnessed in deep sleep or meditation. Non-dual is the source of all states—pure consciousness expressing itself infinitely.',
      },
      {
        id: 'spirit-3',
        title: 'Contemplative Practice',
        description: 'Sustained attention opens spiritual insight.',
        imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=400&fit=crop',
        interactionType: 'reflection',
        interactionData: {
          prompt: 'What does spiritual connection mean to you? Describe a moment when you felt truly connected to something larger.',
        },
        audioScript: 'Contemplative practice is not about belief. It is direct experience. Through sustained attention, meditation, and prayer, you develop sensitivity to dimensions of existence beyond thought. The sacred becomes real, not as belief, but as lived experience.',
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
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop',
        interactionType: 'text',
        audioScript: 'Shadow is everything you believe you are NOT. It includes disowned qualities—aggression, neediness, power. It includes repressed traumas and forgotten memories. It includes all the judged, rejected parts. Shadow work is the courageous practice of facing and integrating these exiled aspects of yourself.',
      },
      {
        id: 'shadow-2',
        title: 'The 3-2-1 Process',
        description: 'A powerful technique for shadow integration.',
        imageUrl: 'https://images.unsplash.com/photo-1488220477530-c8876a0aaed5?w=800&h=400&fit=crop',
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
        audioScript: 'The 3-2-1 process is a transformative technique. First, you face the trigger or person who provokes you. Second, you dialogue with them as if they are within you. Third, you become them—embodying that quality. Fourth, you integrate what you discovered.',
      },
      {
        id: 'shadow-3',
        title: 'Projection Detection',
        description: 'Learn to spot when you\'re projecting.',
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop',
        interactionType: 'reflection',
        interactionData: {
          prompt: 'Think of someone who really irritates you. What quality do they have that bothers you most? Be specific.',
        },
        audioScript: 'What irritates you in others is usually what you have disowned in yourself. Your harsh judgment of someone else\'s greed, arrogance, or weakness often points to your own disowned power, need, or vulnerability. This is the mirror.',
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
        imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f70d504d0?w=800&h=400&fit=crop',
        interactionType: 'text',
        audioScript: 'The four quadrants map all of reality. Upper-Left is subjective experience—your inner world of feelings and thoughts. Upper-Right is objective behavior—what you do, measurable and external. Lower-Left is intersubjective culture—shared meaning, values, relationships. Lower-Right is interobjective systems—institutions, ecology, technology. All four are essential for integral understanding.',
      },
      {
        id: 'integral-2',
        title: 'AQAL (All Quadrants, All Levels)',
        description: 'The master framework for integral analysis.',
        imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f70d504d0?w=800&h=400&fit=crop',
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
        audioScript: 'AQAL means All Quadrants, All Levels. It is a comprehensive framework that includes every perspective, every dimension, and every stage of development. It is the most complete map we have for understanding consciousness and reality.',
      },
      {
        id: 'integral-3',
        title: 'Integration Practice',
        description: 'Bring all four dimensions into conscious action.',
        imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=400&fit=crop',
        interactionType: 'reflection',
        interactionData: {
          prompt: 'Take one action you want to improve. How do body, mind, spirit, and shadow show up in that situation? What would an integrated response look like?',
        },
        audioScript: 'True integration means acting from all dimensions simultaneously. Your body is present and embodied. Your mind is clear and discerning. Your spirit is connected to purpose. Your shadow is acknowledged and integrated. This is wholeness in action.',
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
