import { QuizQuestion } from '../types';

export const ilpGraphQuizzes: QuizQuestion[] = [
  // CORE CONCEPTS (5-8 questions)
  {
    id: 'core-1',
    type: 'multiple-choice',
    category: 'core',
    difficulty: 'beginner',
    question: 'What does ILP stand for?',
    answers: [
      { id: 'a', text: 'Integral Life Practice', isCorrect: true },
      { id: 'b', text: 'Integrated Learning Platform', isCorrect: false },
      { id: 'c', text: 'Interactive Life Program', isCorrect: false },
      { id: 'd', text: 'Individual Life Pathway', isCorrect: false },
    ],
    correctExplanation:
      'ILP stands for Integral Life Practice, a comprehensive approach to personal development across body, mind, spirit, and shadow dimensions.',
    relatedNodes: ['ilp', 'core-concepts'],
    points: 10,
  },
  {
    id: 'core-2',
    type: 'multiple-choice',
    category: 'core',
    difficulty: 'beginner',
    question: 'How many core development modules are part of the ILP framework?',
    answers: [
      { id: 'a', text: 'Two (Mind and Spirit)', isCorrect: false },
      { id: 'b', text: 'Three (Body, Mind, Spirit)', isCorrect: false },
      { id: 'c', text: 'Four (Body, Mind, Spirit, Shadow)', isCorrect: true },
      { id: 'd', text: 'Five (Body, Mind, Spirit, Shadow, Community)', isCorrect: false },
    ],
    correctExplanation:
      'The ILP framework has four core modules: Body (physical health), Mind (cognitive development), Spirit (consciousness), and Shadow (psychological integration).',
    relatedNodes: ['body-module', 'mind-module', 'spirit-module', 'shadow-module'],
    points: 10,
  },
  {
    id: 'core-3',
    type: 'true-false',
    category: 'core',
    difficulty: 'intermediate',
    question:
      'Shadow work is primarily about suppressing negative emotions and traits.',
    answers: [
      { id: 'true', text: 'True', isCorrect: false },
      { id: 'false', text: 'False', isCorrect: true },
    ],
    correctExplanation:
      'Shadow work is about integration and awareness, not suppression. It involves exploring and integrating disowned aspects of ourselves through practices like the 3-2-1 process.',
    relatedNodes: ['shadow-module', '3-2-1-process'],
    points: 10,
  },

  // BODY MODULE (8-10 questions)
  {
    id: 'body-1',
    type: 'multiple-choice',
    category: 'body',
    difficulty: 'beginner',
    question: 'What is Zone 2 Cardio primarily designed for?',
    answers: [
      { id: 'a', text: 'Maximum calorie burn in minimal time', isCorrect: false },
      { id: 'b', text: 'Building aerobic base and cardiovascular efficiency', isCorrect: true },
      { id: 'c', text: 'Developing fast-twitch muscle fibers', isCorrect: false },
      { id: 'd', text: 'Improving anaerobic capacity', isCorrect: false },
    ],
    correctExplanation:
      'Zone 2 Cardio focuses on low-intensity, sustained cardiovascular work that builds aerobic base and metabolic efficiency without systemic stress.',
    relatedNodes: ['zone-2-cardio', 'cardiovascular-health'],
    points: 10,
  },
  {
    id: 'body-2',
    type: 'multiple-choice',
    category: 'body',
    difficulty: 'beginner',
    question: 'How many hours of sleep are typically recommended for optimal health?',
    answers: [
      { id: 'a', text: '5-6 hours', isCorrect: false },
      { id: 'b', text: '7-9 hours', isCorrect: true },
      { id: 'c', text: '10-12 hours', isCorrect: false },
      { id: 'd', text: 'Less than 5 hours', isCorrect: false },
    ],
    correctExplanation:
      'Research-backed sleep recommendations range from 7-9 hours for most adults, with consistency and quality being essential for recovery and cognitive function.',
    relatedNodes: ['sleep', 'recovery'],
    points: 10,
  },
  {
    id: 'body-3',
    type: 'true-false',
    category: 'body',
    difficulty: 'intermediate',
    question: 'Cold exposure practices have no measurable effect on nervous system resilience.',
    answers: [
      { id: 'true', text: 'True', isCorrect: false },
      { id: 'false', text: 'False', isCorrect: true },
    ],
    correctExplanation:
      'Cold exposure has been shown to strengthen the nervous system and improve vagal tone, stress tolerance, and immune function when practiced safely.',
    relatedNodes: ['cold-exposure', 'nervous-system', 'resilience'],
    points: 10,
  },
  {
    id: 'body-4',
    type: 'multiple-choice',
    category: 'body',
    difficulty: 'intermediate',
    question:
      'In the context of physical fitness, what does "hormonal balance" primarily refer to?',
    answers: [
      { id: 'a', text: 'Only reproductive hormones', isCorrect: false },
      { id: 'b', text: 'Balance of cortisol, testosterone, estrogen, and other regulatory hormones', isCorrect: true },
      { id: 'c', text: 'Thyroid function alone', isCorrect: false },
      { id: 'd', text: 'Blood sugar regulation only', isCorrect: false },
    ],
    correctExplanation:
      'Hormonal balance encompasses multiple systems including cortisol (stress), testosterone, estrogen, thyroid, insulin, and other key regulatory hormones.',
    relatedNodes: ['hormonal-balance', 'endocrine-system'],
    points: 10,
  },
  {
    id: 'body-5',
    type: 'matching',
    category: 'body',
    difficulty: 'intermediate',
    question: 'Match each physical practice with its primary benefit:',
    answers: [
      { id: 'a', text: 'Yoga - Flexibility and nervous system regulation', isCorrect: true },
      { id: 'b', text: 'Resistance Training - Muscle and bone density', isCorrect: true },
      { id: 'c', text: 'Breathwork - Vagal tone and emotional regulation', isCorrect: true },
      { id: 'd', text: 'Nutrition Optimization - Cellular health and energy', isCorrect: true },
    ],
    correctExplanation:
      'Each body practice addresses different aspects of physical health: Yoga for flexibility and nervous system, resistance training for strength and bone health, breathwork for nervous system regulation, and nutrition for cellular function.',
    relatedNodes: ['yoga', 'resistance-training', 'breathwork', 'nutrition'],
    points: 15,
  },
  {
    id: 'body-6',
    type: 'scenario',
    category: 'body',
    difficulty: 'advanced',
    question:
      'You are designing a balanced body practice. Which approach integrates all major components?',
    answers: [
      { id: 'a', text: 'Zone 2 Cardio only, 5x per week', isCorrect: false },
      { id: 'b', text: 'Resistance training, Zone 2 cardio, yoga, breathwork, and optimized sleep/nutrition', isCorrect: true },
      { id: 'c', text: 'High-intensity training every day', isCorrect: false },
      { id: 'd', text: 'Sleep and nutrition only', isCorrect: false },
    ],
    correctExplanation:
      'A comprehensive body practice integrates strength training, cardiovascular work, mobility, nervous system practices (breathwork), and foundational elements (sleep, nutrition).',
    relatedNodes: ['body-module', 'integrated-practice'],
    points: 15,
  },

  // MIND MODULE (8-10 questions)
  {
    id: 'mind-1',
    type: 'multiple-choice',
    category: 'mind',
    difficulty: 'beginner',
    question: 'What is Kegan\'s theory primarily about?',
    answers: [
      { id: 'a', text: 'Learning styles and educational preferences', isCorrect: false },
      { id: 'b', text: 'Developmental stages of consciousness and self', isCorrect: true },
      { id: 'c', text: 'Personality types and behavioral patterns', isCorrect: false },
      { id: 'd', text: 'Memory improvement techniques', isCorrect: false },
    ],
    correctExplanation:
      'Kegan\'s theory describes stages of human consciousness and self-authoring capacity (Socialized Mind → Self-Authoring → Self-Transforming Mind).',
    relatedNodes: ['kegans-orders', 'vertical-development'],
    points: 10,
  },
  {
    id: 'mind-2',
    type: 'true-false',
    category: 'mind',
    difficulty: 'beginner',
    question:
      'According to Integral theory, development happens only in the cognitive dimension.',
    answers: [
      { id: 'true', text: 'True', isCorrect: false },
      { id: 'false', text: 'False', isCorrect: true },
    ],
    correctExplanation:
      'Integral theory emphasizes development across multiple lines: cognitive, emotional, spiritual, moral, kinesthetic, interpersonal, and more.',
    relatedNodes: ['integral-theory', 'lines-of-development'],
    points: 10,
  },
  {
    id: 'mind-3',
    type: 'multiple-choice',
    category: 'mind',
    difficulty: 'intermediate',
    question: 'What is the primary purpose of studying cognitive biases?',
    answers: [
      { id: 'a', text: 'To punish ourselves for thinking incorrectly', isCorrect: false },
      { id: 'b', text: 'To become aware of automatic patterns and make more conscious decisions', isCorrect: true },
      { id: 'c', text: 'To eliminate all subjective thinking', isCorrect: false },
      { id: 'd', text: 'To prove intelligence', isCorrect: false },
    ],
    correctExplanation:
      'Understanding cognitive biases helps us recognize automatic patterns and make more conscious, informed decisions aligned with our values.',
    relatedNodes: ['cognitive-biases', 'bias-detection'],
    points: 10,
  },
  {
    id: 'mind-4',
    type: 'multiple-choice',
    category: 'mind',
    difficulty: 'intermediate',
    question:
      'In "Subject-Object" work, what does it mean to make something "object"?',
    answers: [
      { id: 'a', text: 'To be against it', isCorrect: false },
      { id: 'b', text: 'To be controlled by it unconsciously', isCorrect: false },
      { id: 'c', text: 'To gain perspective and awareness of it', isCorrect: true },
      { id: 'd', text: 'To understand it only intellectually', isCorrect: false },
    ],
    correctExplanation:
      'Making something "object" means developing the capacity to observe and reflect on it, rather than being unconsciously identified with it (subject).',
    relatedNodes: ['subject-object', 'perspective-taking'],
    points: 10,
  },
  {
    id: 'mind-5',
    type: 'multiple-choice',
    category: 'mind',
    difficulty: 'intermediate',
    question: 'What is the Enneagram primarily used for in developmental work?',
    answers: [
      { id: 'a', text: 'Predicting the future', isCorrect: false },
      { id: 'b', text: 'Understanding core personality patterns and growth paths', isCorrect: true },
      { id: 'c', text: 'Categorizing people into fixed types', isCorrect: false },
      { id: 'd', text: 'Assigning numerical rankings to intelligence', isCorrect: false },
    ],
    correctExplanation:
      'The Enneagram maps nine core personality patterns and their growth/stress paths, offering insights into unconscious motivations and development trajectories.',
    relatedNodes: ['enneagram', 'personality-patterns'],
    points: 10,
  },
  {
    id: 'mind-6',
    type: 'scenario',
    category: 'mind',
    difficulty: 'advanced',
    question:
      'A person is struggling with decisions and often follows others\' opinions. Which developmental approach would be most appropriate?',
    answers: [
      { id: 'a', text: 'Memorizing decision rules', isCorrect: false },
      { id: 'b', text: 'Developing self-authoring capacity through perspective work and subject-object exploration', isCorrect: true },
      { id: 'c', text: 'Avoiding all social influence', isCorrect: false },
      { id: 'd', text: 'Judgment about their pattern', isCorrect: false },
    ],
    correctExplanation:
      'Supporting development from Socialized Mind (influenced by others) to Self-Authoring Mind involves practices that build internal authority and perspective-taking capacity.',
    relatedNodes: ['self-authoring-mind', 'development'],
    points: 15,
  },

  // SPIRIT MODULE (8-10 questions)
  {
    id: 'spirit-1',
    type: 'multiple-choice',
    category: 'spirit',
    difficulty: 'beginner',
    question: 'What is the primary goal of meditation practice?',
    answers: [
      { id: 'a', text: 'To empty the mind completely', isCorrect: false },
      { id: 'b', text: 'To develop awareness, stability, and connection to present experience', isCorrect: true },
      { id: 'c', text: 'To achieve specific emotional states', isCorrect: false },
      { id: 'd', text: 'To escape problems', isCorrect: false },
    ],
    correctExplanation:
      'Meditation develops awareness, mental stability, and capacity to connect with present experience in a non-reactive way.',
    relatedNodes: ['meditation', 'mindfulness', 'awareness'],
    points: 10,
  },
  {
    id: 'spirit-2',
    type: 'true-false',
    category: 'spirit',
    difficulty: 'beginner',
    question: 'Spirituality requires adherence to a specific religious tradition.',
    answers: [
      { id: 'true', text: 'True', isCorrect: false },
      { id: 'false', text: 'False', isCorrect: true },
    ],
    correctExplanation:
      'Spirituality in ILP encompasses connection to meaning, purpose, consciousness, and the sacred—which can be approached through various traditions or non-traditional paths.',
    relatedNodes: ['spirituality', 'meaning-making'],
    points: 10,
  },
  {
    id: 'spirit-3',
    type: 'multiple-choice',
    category: 'spirit',
    difficulty: 'intermediate',
    question: 'What does "witness consciousness" refer to?',
    answers: [
      { id: 'a', text: 'Being aware of witnessing events', isCorrect: false },
      { id: 'b', text: 'The capacity to observe thoughts, emotions, and experiences without identification', isCorrect: true },
      { id: 'c', text: 'Remembering past events', isCorrect: false },
      { id: 'd', text: 'Following religious witnesses', isCorrect: false },
    ],
    correctExplanation:
      'Witness consciousness is the awareness that observes the flow of thoughts, emotions, and sensations—a fundamental capacity developed through meditation.',
    relatedNodes: ['witness-consciousness', 'meditation'],
    points: 10,
  },
  {
    id: 'spirit-4',
    type: 'multiple-choice',
    category: 'spirit',
    difficulty: 'intermediate',
    question: 'What is "loving-kindness" practice designed to cultivate?',
    answers: [
      { id: 'a', text: 'Niceness and people-pleasing', isCorrect: false },
      { id: 'b', text: 'Unconditional care for oneself and others', isCorrect: true },
      { id: 'c', text: 'Romantic love', isCorrect: false },
      { id: 'd', text: 'Dependency on others', isCorrect: false },
    ],
    correctExplanation:
      'Loving-kindness (Metta) practice cultivates unconditional goodwill and care for oneself, loved ones, neutral people, difficult people, and all beings.',
    relatedNodes: ['loving-kindness', 'compassion'],
    points: 10,
  },
  {
    id: 'spirit-5',
    type: 'multiple-choice',
    category: 'spirit',
    difficulty: 'intermediate',
    question: 'How do states and stages relate in spiritual development?',
    answers: [
      { id: 'a', text: 'States are permanent, stages are temporary', isCorrect: false },
      { id: 'b', text: 'States are temporary experiences; stages are stable capacities built over time', isCorrect: true },
      { id: 'c', text: 'They are the same thing', isCorrect: false },
      { id: 'd', text: 'Only states matter for development', isCorrect: false },
    ],
    correctExplanation:
      'States are temporary experiences (like meditation experiences), while stages are stable capacities that integrate into your baseline consciousness through consistent practice.',
    relatedNodes: ['states-vs-stages', 'meditation-stages'],
    points: 10,
  },
  {
    id: 'spirit-6',
    type: 'scenario',
    category: 'spirit',
    difficulty: 'advanced',
    question:
      'You experience profound peace during meditation but find it difficult to maintain in daily life. What would a spirit practice address?',
    answers: [
      { id: 'a', text: 'Trying to recreate the state constantly', isCorrect: false },
      { id: 'b', text: 'Building stable stages of consciousness through consistent practice and integration', isCorrect: true },
      { id: 'c', text: 'Abandoning meditation since it\'s not working', isCorrect: false },
      { id: 'd', text: 'Only meditating more intensely', isCorrect: false },
    ],
    correctExplanation:
      'This is a classic distinction between states (temporary experiences) and stages (stable capacities). Building authentic spiritual development requires consistent practice that integrates temporary states into baseline consciousness.',
    relatedNodes: ['states-vs-stages', 'integration', 'practice'],
    points: 15,
  },

  // SHADOW MODULE (5-8 questions)
  {
    id: 'shadow-1',
    type: 'multiple-choice',
    category: 'shadow',
    difficulty: 'beginner',
    question: 'What is the "shadow" in psychological terms?',
    answers: [
      { id: 'a', text: 'Darkness or evil within us', isCorrect: false },
      { id: 'b', text: 'Disowned, unconscious aspects of ourselves we have rejected or repressed', isCorrect: true },
      { id: 'c', text: 'Our dreams while sleeping', isCorrect: false },
      { id: 'd', text: 'Our past mistakes', isCorrect: false },
    ],
    correctExplanation:
      'The shadow contains aspects of ourselves we have rejected, repressed, or deemed unacceptable—both "negative" traits and positive potentials we cannot claim.',
    relatedNodes: ['shadow-module', 'shadow-work'],
    points: 10,
  },
  {
    id: 'shadow-2',
    type: 'true-false',
    category: 'shadow',
    difficulty: 'beginner',
    question: 'Shadow work is only relevant if you have trauma.',
    answers: [
      { id: 'true', text: 'True', isCorrect: false },
      { id: 'false', text: 'False', isCorrect: true },
    ],
    correctExplanation:
      'Shadow work is essential for everyone as we all have unconscious patterns, projections, and disowned aspects regardless of trauma history.',
    relatedNodes: ['shadow-work', 'integration'],
    points: 10,
  },
  {
    id: 'shadow-3',
    type: 'multiple-choice',
    category: 'shadow',
    difficulty: 'intermediate',
    question: 'What does the "3-2-1 Process" in shadow work involve?',
    answers: [
      { id: 'a', text: 'Three steps, two helpers, one result', isCorrect: false },
      { id: 'b', text: 'Speaking about something in third person, second person, then first person to integrate disowned aspects', isCorrect: true },
      { id: 'c', text: 'A meditation counting to three', isCorrect: false },
      { id: 'd', text: 'Three days of journaling', isCorrect: false },
    ],
    correctExplanation:
      'The 3-2-1 Process moves something from third person (external), to second person (dialogue), to first person (integration), developing awareness and ownership of disowned parts.',
    relatedNodes: ['3-2-1-process', 'shadow-integration'],
    points: 10,
  },
  {
    id: 'shadow-4',
    type: 'multiple-choice',
    category: 'shadow',
    difficulty: 'intermediate',
    question: 'What is "projection" in the context of shadow work?',
    answers: [
      { id: 'a', text: 'Planning future events', isCorrect: false },
      { id: 'b', text: 'Attributing our disowned qualities to others', isCorrect: true },
      { id: 'c', text: 'Visualizing positive outcomes', isCorrect: false },
      { id: 'd', text: 'Making predictions', isCorrect: false },
    ],
    correctExplanation:
      'Projection is when we see our disowned aspects mirrored in others—a key mechanism for identifying shadow material through emotional reactions.',
    relatedNodes: ['projection', 'shadow-work'],
    points: 10,
  },
  {
    id: 'shadow-5',
    type: 'scenario',
    category: 'shadow',
    difficulty: 'advanced',
    question:
      'You strongly dislike someone\'s arrogance, but you secretly fear you might be arrogant too. What shadow work principle applies?',
    answers: [
      { id: 'a', text: 'You should avoid that person', isCorrect: false },
      { id: 'b', text: 'Their arrogance is their fault entirely', isCorrect: false },
      { id: 'c', text: 'Their behavior may be mirroring a disowned shadow aspect in you (projection)', isCorrect: true },
      { id: 'd', text: 'You need stronger boundaries', isCorrect: false },
    ],
    correctExplanation:
      'Strong emotional reactions often signal projections. Exploring what in yourself the other person mirrors can reveal shadow material ready for integration.',
    relatedNodes: ['projection', 'shadow-integration', 'triggers'],
    points: 15,
  },

  // INTEGRAL THEORY (5-8 questions)
  {
    id: 'integral-1',
    type: 'multiple-choice',
    category: 'integral-theory',
    difficulty: 'intermediate',
    question: 'What does AQAL stand for in Integral theory?',
    answers: [
      { id: 'a', text: 'All Qualities, All Levels', isCorrect: true },
      { id: 'b', text: 'Advanced Quantum Alignment Logic', isCorrect: false },
      { id: 'c', text: 'Analysis, Quality, Assessment, Learning', isCorrect: false },
      { id: 'd', text: 'Awareness, Quantum, Application, Life', isCorrect: false },
    ],
    correctExplanation:
      'AQAL (All Quadrants, All Levels) is a framework that integrates all dimensions of human experience and development.',
    relatedNodes: ['aqal-framework', 'integral-theory'],
    points: 10,
  },
  {
    id: 'integral-2',
    type: 'multiple-choice',
    category: 'integral-theory',
    difficulty: 'intermediate',
    question: 'What are the four quadrants in Integral theory?',
    answers: [
      { id: 'a', text: 'Self, Other, Community, World', isCorrect: false },
      { id: 'b', text: 'Interior-Individual (I), Exterior-Individual (It), Interior-Collective (We), Exterior-Collective (Its)', isCorrect: true },
      { id: 'c', text: 'Body, Mind, Spirit, Shadow', isCorrect: false },
      { id: 'd', text: 'Physical, Mental, Emotional, Spiritual', isCorrect: false },
    ],
    correctExplanation:
      'The four quadrants map subjective (interior) vs. objective (exterior) and individual vs. collective dimensions of reality.',
    relatedNodes: ['quadrants', 'aqal-framework'],
    points: 10,
  },
  {
    id: 'integral-3',
    type: 'true-false',
    category: 'integral-theory',
    difficulty: 'intermediate',
    question: 'Spiral Dynamics suggests that human values and worldviews develop in stages.',
    answers: [
      { id: 'true', text: 'True', isCorrect: true },
      { id: 'false', text: 'False', isCorrect: false },
    ],
    correctExplanation:
      'Spiral Dynamics describes evolution of consciousness through stages (like beige → purple → red → blue → orange → green → yellow), each with distinct values and worldviews.',
    relatedNodes: ['spiral-dynamics', 'value-systems'],
    points: 10,
  },
  {
    id: 'integral-4',
    type: 'multiple-choice',
    category: 'integral-theory',
    difficulty: 'advanced',
    question:
      'In Integral theory, what does "transcend and include" mean for development?',
    answers: [
      { id: 'a', text: 'Going beyond previous stages without incorporating them', isCorrect: false },
      { id: 'b', text: 'Higher development supersedes and erases lower stages', isCorrect: false },
      { id: 'c', text: 'Building on and integrating previous capacities while moving to new ones', isCorrect: true },
      { id: 'd', text: 'Remaining at one stage while understanding others', isCorrect: false },
    ],
    correctExplanation:
      'Transcend and include means each developmental stage builds upon, integrates, and includes capacities from previous stages rather than replacing them.',
    relatedNodes: ['transcend-include', 'development'],
    points: 15,
  },
  {
    id: 'integral-5',
    type: 'scenario',
    category: 'integral-theory',
    difficulty: 'advanced',
    question:
      'Which ILP approach best reflects the integrated, multi-dimensional nature of the AQAL framework?',
    answers: [
      { id: 'a', text: 'Focusing only on meditation (spirit)', isCorrect: false },
      { id: 'b', text: 'Combining practices across body, mind, spirit, and shadow dimensions', isCorrect: true },
      { id: 'c', text: 'Intellectual study of integral theory only', isCorrect: false },
      { id: 'd', text: 'Individual development without considering relationships', isCorrect: false },
    ],
    correctExplanation:
      'ILP embodies AQAL by integrating all dimensions of human experience: physical (body), psychological (mind), spiritual (spirit), and relational/shadow (shadow).',
    relatedNodes: ['aqal-framework', 'integrated-practice'],
    points: 15,
  },
];

// Quiz sessions storage key
export const QUIZ_SESSIONS_STORAGE_KEY = 'ilpGraphQuizSessions';
export const QUIZ_RESULTS_STORAGE_KEY = 'ilpGraphQuizResults';

// Utility function to get questions by category
export function getQuestionsByCategory(
  category: 'core' | 'body' | 'mind' | 'spirit' | 'shadow' | 'integral-theory' | 'all'
): QuizQuestion[] {
  if (category === 'all') {
    return ilpGraphQuizzes;
  }
  return ilpGraphQuizzes.filter((q) => q.category === category);
}

// Utility function to get questions by difficulty
export function getQuestionsByDifficulty(
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): QuizQuestion[] {
  return ilpGraphQuizzes.filter((q) => q.difficulty === difficulty);
}

// Utility function to shuffle questions
export function shuffleQuestions(
  questions: QuizQuestion[],
  count?: number
): QuizQuestion[] {
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return count ? shuffled.slice(0, count) : shuffled;
}

// Utility function to get questions for a quiz session
export function getQuizQuestions(
  category: 'core' | 'body' | 'mind' | 'spirit' | 'shadow' | 'integral-theory' | 'all',
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  count: number = 10
): QuizQuestion[] {
  let questions = getQuestionsByCategory(category);

  // If not asking for all difficulties, filter by difficulty
  if (difficulty !== 'beginner') {
    // Allow intermediate and advanced for intermediate, all for advanced
    questions = questions.filter(
      (q) =>
        q.difficulty === difficulty ||
        (difficulty === 'intermediate' && q.difficulty === 'beginner')
    );
  }

  return shuffleQuestions(questions, Math.min(count, questions.length));
}
