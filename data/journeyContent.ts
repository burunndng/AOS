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
        description: 'Integral Life Practice is a cross-training approach to human development that integrates four dimensions: body awareness and vitality, mental clarity and growth, spiritual connection and meaning, and shadow work—the integration of disowned parts of ourselves. Think of it as cross-training for your entire being.',
        imageUrl: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&h=400&fit=crop',
        audioUrl: 'https://files.catbox.moe/qh40b7.m4a',
        interactionType: 'text',
      },
      {
        id: 'core-2',
        title: 'Waking Up vs Growing Up',
        description: 'Waking up refers to experiences of non-dual consciousness and peak states where the sense of separate self dissolves. Growing up refers to stages of development—how your personality and perspective mature over time. Both are essential and complement each other.',
        imageUrl: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=800&h=400&fit=crop',
        interactionType: 'poll',
        interactionData: {
          question: 'Have you experienced a moment of profound peace or insight?',
          options: ['Yes', 'No', 'Not sure'],
        },
      },
      {
        id: 'core-3',
        title: 'The Four Dimensions',
        description: 'The four dimensions work together as an integrated whole. Your body grounds you in presence. Your mind clarifies understanding. Your spirit connects you to meaning. Your shadow integrates what you have denied. Together they create wholeness.',
        imageUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&h=400&fit=crop',
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
        description: 'The gross body is your physical form—skin, bones, organs. The subtle body is the energetic dimension—felt as aliveness, breath, circulation, and sensation. The causal body is the transcendent dimension, the source of all manifestation, pure consciousness expressing itself.',
        imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=400&fit=crop',
        interactionType: 'text',
      },
      {
        id: 'body-2',
        title: 'Somatics: The Felt Sense',
        description: 'Somatics is the art of feeling. Your body holds all your life experience. Through somatic awareness, you develop sensitivity to subtle sensations—tension, warmth, vibration—that reveal your deepest patterns and possibilities.',
        imageUrl: 'https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?w=800&h=400&fit=crop',
        interactionType: 'reflection',
        interactionData: {
          prompt: 'Right now, scan your body from head to toe. Where do you feel the most tension or constriction?',
        },
      },
      {
        id: 'body-3',
        title: 'The Breath Connection',
        description: 'Your breath is always available as an anchor to the present moment. Simple breathing practices like box breathing or coherent breathing can calm your nervous system, increase oxygen flow, and prepare you for deeper meditative and psychological work.',
        imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=400&fit=crop',
        interactionType: 'text',
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
        title: 'The Mind Module',
        description: 'The Mind module develops your mental clarity, cognitive flexibility, and capacity to understand complexity. Your mind is the tool for comprehending reality—for seeing patterns, integrating knowledge, and developing wisdom. Through perspective-taking, studying stages of development, and integrating both logical and intuitive thinking, you cultivate a more complete and mature intelligence. A developed mind is clear, discerning, and capable of holding multiple truths simultaneously.',
        imageUrl: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&h=400&fit=crop',
        audioUrl: 'https://files.catbox.moe/er3g5i.m4a',
        interactionType: 'text',
      },
      {
        id: 'mind-2',
        title: 'Stages of Development',
        description: 'Developmental stages describe how humans evolve in their capacity to understand reality. Each stage is more inclusive, more complex, more aware. Common models include Kegan stages, spiral dynamics, and Cook-Greuter stages. Understanding your stage helps you recognize where you are and what you might grow into.',
        imageUrl: 'https://images.unsplash.com/photo-1426024120108-99cc76989c71?w=800&h=400&fit=crop',
        interactionType: 'text',
      },
      {
        id: 'mind-3',
        title: 'Cognitive Integration',
        description: 'True intelligence integrates both hemispheres. Your left brain analyzes, breaks apart, creates distinction. Your right brain intuits, connects, creates meaning. The mature mind uses both.',
        imageUrl: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&h=400&fit=crop',
        interactionType: 'reflection',
        interactionData: {
          prompt: 'Take a challenge you\'re facing. Describe it through pure logic, then through gut feeling and intuition.',
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
        title: 'The Spirit Module',
        description: 'The Spirit module awakens your connection to the sacred, the transcendent, and the infinite dimensions of consciousness. Spirit is not belief—it is direct experience. Through contemplative practice, meditation, and states of expanded consciousness, you develop sensitivity to dimensions of existence beyond thought and emotion. Your spirit is your access to meaning, purpose, and the profound interconnection of all things. A developed spirit brings grace, wisdom, and authentic power to every area of life.',
        imageUrl: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=800&h=400&fit=crop',
        audioUrl: 'https://files.catbox.moe/v4ajsy.m4a',
        interactionType: 'text',
      },
      {
        id: 'spirit-2',
        title: 'States of Consciousness',
        description: 'The gross state is waking consciousness—solid, linear, material. The subtle state is dreaming and imagination—fluid, symbolic, poetic. The causal state is formless awareness, witnessed in deep sleep or meditation. Non-dual is the source of all states—pure consciousness expressing itself infinitely.',
        imageUrl: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=800&h=400&fit=crop',
        interactionType: 'text',
      },
      {
        id: 'spirit-3',
        title: 'Contemplative Practice',
        description: 'Contemplative practice is not about belief. It is direct experience. Through sustained attention, meditation, and prayer, you develop sensitivity to dimensions of existence beyond thought. The sacred becomes real, not as belief, but as lived experience.',
        imageUrl: 'https://images.unsplash.com/photo-1447452001602-7090c7ab2db3?w=800&h=400&fit=crop',
        interactionType: 'reflection',
        interactionData: {
          prompt: 'What does spiritual connection mean to you? Describe a moment when you felt truly connected to something larger.',
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
        title: 'The Shadow Module',
        description: 'The Shadow module teaches you to face, accept, and integrate the disowned parts of yourself—the qualities you judge, deny, and project onto others. Shadow is not darkness to fear; it is wholeness to embrace. Through courageous self-inquiry and emotional healing, you reclaim your full humanity. Shadow work transforms reactivity into wisdom, shame into compassion, and fragmentation into integration. A developed shadow practice brings authenticity, emotional freedom, and genuine self-acceptance.',
        imageUrl: 'https://images.unsplash.com/photo-1533158326339-7f3cf2404354?w=800&h=400&fit=crop',
        audioUrl: 'https://files.catbox.moe/r59ebt.m4a',
        interactionType: 'text',
      },
      {
        id: 'shadow-2',
        title: 'The 3-2-1 Process',
        description: 'The 3-2-1 process is a transformative technique. First, you face the trigger or person who provokes you. Second, you dialogue with them as if they are within you. Third, you become them—embodying that quality. Fourth, you integrate what you discovered.',
        imageUrl: 'https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?w=800&h=400&fit=crop',
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
        description: 'What irritates you in others is usually what you have disowned in yourself. Your harsh judgment of someone else\'s greed, arrogance, or weakness often points to your own disowned power, need, or vulnerability. This is the mirror.',
        imageUrl: 'https://images.unsplash.com/photo-1509233725247-49e657c54213?w=800&h=400&fit=crop',
        interactionType: 'reflection',
        interactionData: {
          prompt: 'Think of someone who really irritates you. What quality do they have that bothers you most? Be specific.',
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
        description: 'The four quadrants map all of reality. Upper-Left is subjective experience—your inner world of feelings and thoughts. Upper-Right is objective behavior—what you do, measurable and external. Lower-Left is intersubjective culture—shared meaning, values, relationships. Lower-Right is interobjective systems—institutions, ecology, technology. All four are essential for integral understanding.',
        imageUrl: 'https://images.unsplash.com/photo-1503437313881-503a91226402?w=800&h=400&fit=crop',
        interactionType: 'text',
      },
      {
        id: 'integral-2',
        title: 'AQAL (All Quadrants, All Levels)',
        description: 'AQAL means All Quadrants, All Levels. It is a comprehensive framework that includes every perspective, every dimension, and every stage of development. It is the most complete map we have for understanding consciousness and reality.',
        imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop',
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
        description: 'True integration means acting from all dimensions simultaneously. Your body is present and embodied. Your mind is clear and discerning. Your spirit is connected to purpose. Your shadow is acknowledged and integrated. This is wholeness in action.',
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop',
        interactionType: 'reflection',
        interactionData: {
          prompt: 'Take one action you want to improve. How do body, mind, spirit, and shadow show up in that situation? What would an integrated response look like?',
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
