import { QuizQuestion } from '../types';

export const ilpGraphQuizzes: QuizQuestion[] = [
  // ==================== CORE CONCEPTS ====================
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
    difficulty: 'beginner',
    question: 'Shadow work is primarily about suppressing negative emotions and traits.',
    answers: [
      { id: 'true', text: 'True', isCorrect: false },
      { id: 'false', text: 'False', isCorrect: true },
    ],
    correctExplanation:
      'Shadow work is about integration and awareness, not suppression. It involves exploring and integrating disowned aspects of ourselves.',
    relatedNodes: ['shadow-module', '3-2-1-process'],
    points: 10,
  },
  {
    id: 'core-4',
    type: 'true-false',
    category: 'core',
    difficulty: 'beginner',
    question: 'An Integral Life Practice requires deep expertise in all four modules simultaneously.',
    answers: [
      { id: 'true', text: 'True', isCorrect: false },
      { id: 'false', text: 'False', isCorrect: true },
    ],
    correctExplanation:
      'ILP emphasizes balance and ongoing development across modules. Practitioners start where they are and gradually develop all dimensions at their own pace.',
    relatedNodes: ['ilp', 'integrated-practice'],
    points: 10,
  },
  {
    id: 'core-5',
    type: 'multiple-choice',
    category: 'core',
    difficulty: 'intermediate',
    question: 'Which principle best describes the relationship between all four ILP modules?',
    answers: [
      { id: 'a', text: 'They operate independently with no interaction', isCorrect: false },
      { id: 'b', text: 'Body and Mind are primary, Spirit and Shadow are optional', isCorrect: false },
      { id: 'c', text: 'They are deeply interconnected; development in one supports the others', isCorrect: true },
      { id: 'd', text: 'Spirit development supersedes all other modules', isCorrect: false },
    ],
    correctExplanation:
      'All four modules are interconnected. Progress in body work supports mental clarity, spiritual practice benefits from psychological integration, and shadow work deepens all dimensions.',
    relatedNodes: ['aqal-framework', 'integrated-practice'],
    points: 15,
  },
  {
    id: 'core-6',
    type: 'multiple-choice',
    category: 'core',
    difficulty: 'intermediate',
    question: 'What is the primary purpose of an Integral Life Practice?',
    answers: [
      { id: 'a', text: 'To achieve perfection in all areas', isCorrect: false },
      { id: 'b', text: 'To support comprehensive personal development and consciousness evolution', isCorrect: true },
      { id: 'c', text: 'To escape worldly problems through spirituality', isCorrect: false },
      { id: 'd', text: 'To maximize physical performance', isCorrect: false },
    ],
    correctExplanation:
      'ILP supports authentic development across all dimensions of human experience, fostering growth in awareness, capacity, and integration.',
    relatedNodes: ['ilp', 'development'],
    points: 15,
  },

  // ==================== BODY MODULE ====================
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
    difficulty: 'beginner',
    question: 'What is the primary benefit of resistance training?',
    answers: [
      { id: 'a', text: 'Only building muscle size', isCorrect: false },
      { id: 'b', text: 'Building muscle, bone density, metabolic health, and functional strength', isCorrect: true },
      { id: 'c', text: 'Improving cardiovascular endurance', isCorrect: false },
      { id: 'd', text: 'Increasing flexibility', isCorrect: false },
    ],
    correctExplanation:
      'Resistance training provides multiple benefits: muscle development, increased bone density, improved metabolism, functional strength, and hormonal balance.',
    relatedNodes: ['resistance-training', 'strength'],
    points: 10,
  },
  {
    id: 'body-5',
    type: 'true-false',
    category: 'body',
    difficulty: 'beginner',
    question: 'Nutrition optimization is equally important as exercise for overall health.',
    answers: [
      { id: 'true', text: 'True', isCorrect: true },
      { id: 'false', text: 'False', isCorrect: false },
    ],
    correctExplanation:
      'Nutrition is fundamental to health, energy, recovery, and cellular function. Exercise and nutrition work synergistically; both are essential.',
    relatedNodes: ['nutrition', 'body-module'],
    points: 10,
  },
  {
    id: 'body-6',
    type: 'multiple-choice',
    category: 'body',
    difficulty: 'intermediate',
    question: 'What does "nervous system regulation" refer to?',
    answers: [
      { id: 'a', text: 'Only treating anxiety disorders', isCorrect: false },
      { id: 'b', text: 'The capacity to move between arousal and calm states appropriately', isCorrect: true },
      { id: 'c', text: 'Eliminating all stress', isCorrect: false },
      { id: 'd', text: 'Medical treatment of neurological conditions', isCorrect: false },
    ],
    correctExplanation:
      'Nervous system regulation is the flexibility to activate (sympathetic) or calm (parasympathetic) your system based on what\'s needed, building resilience.',
    relatedNodes: ['nervous-system', 'vagal-tone'],
    points: 15,
  },
  {
    id: 'body-7',
    type: 'multiple-choice',
    category: 'body',
    difficulty: 'intermediate',
    question: 'What does breathwork primarily affect in the body?',
    answers: [
      { id: 'a', text: 'Only oxygen levels', isCorrect: false },
      { id: 'b', text: 'The nervous system, vagal tone, and emotional state', isCorrect: true },
      { id: 'c', text: 'Only lung capacity', isCorrect: false },
      { id: 'd', text: 'Blood pressure alone', isCorrect: false },
    ],
    correctExplanation:
      'Breathwork influences the nervous system directly through the vagus nerve, affecting stress response, emotional regulation, and physiological states.',
    relatedNodes: ['breathwork', 'nervous-system'],
    points: 15,
  },
  {
    id: 'body-8',
    type: 'true-false',
    category: 'body',
    difficulty: 'intermediate',
    question: 'Recovery is just as important as training in a comprehensive body practice.',
    answers: [
      { id: 'true', text: 'True', isCorrect: true },
      { id: 'false', text: 'False', isCorrect: false },
    ],
    correctExplanation:
      'Recovery (sleep, rest, nutrition) is where adaptation happens. Without adequate recovery, training becomes counterproductive and injurious.',
    relatedNodes: ['recovery', 'sleep'],
    points: 10,
  },
  {
    id: 'body-9',
    type: 'multiple-choice',
    category: 'body',
    difficulty: 'advanced',
    question: 'What is the relationship between hormonal balance and overall body health?',
    answers: [
      { id: 'a', text: 'Hormones are irrelevant to health', isCorrect: false },
      { id: 'b', text: 'Hormones regulate sleep, mood, energy, immunity, and metabolism', isCorrect: true },
      { id: 'c', text: 'Only sex hormones matter', isCorrect: false },
      { id: 'd', text: 'Hormones should be suppressed', isCorrect: false },
    ],
    correctExplanation:
      'Hormonal balance affects virtually every system: sleep-wake cycles, mood, energy, immune function, metabolic rate, and stress response.',
    relatedNodes: ['hormonal-balance', 'endocrine-system'],
    points: 15,
  },
  {
    id: 'body-10',
    type: 'scenario',
    category: 'body',
    difficulty: 'advanced',
    question: 'Which combination creates the most comprehensive body practice?',
    answers: [
      { id: 'a', text: 'Zone 2 Cardio only', isCorrect: false },
      { id: 'b', text: 'Resistance + Zone 2 + Yoga + Breathwork + Sleep + Nutrition', isCorrect: true },
      { id: 'c', text: 'High-intensity training daily', isCorrect: false },
      { id: 'd', text: 'Rest only', isCorrect: false },
    ],
    correctExplanation:
      'A balanced body practice integrates strength, cardiovascular base, mobility, nervous system regulation, recovery, and nutrition.',
    relatedNodes: ['body-module', 'integrated-practice'],
    points: 15,
  },

  // ==================== MIND MODULE ====================
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
    question: 'According to Integral theory, development happens only in the cognitive dimension.',
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
    difficulty: 'beginner',
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
    question: 'In "Subject-Object" work, what does it mean to make something "object"?',
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
    type: 'true-false',
    category: 'mind',
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
    id: 'mind-7',
    type: 'multiple-choice',
    category: 'mind',
    difficulty: 'intermediate',
    question: 'What does "perspective-taking" develop in cognitive capacity?',
    answers: [
      { id: 'a', text: 'Only the ability to imagine', isCorrect: false },
      { id: 'b', text: 'Empathy, flexibility, and capacity to hold multiple viewpoints simultaneously', isCorrect: true },
      { id: 'c', text: 'The ability to win arguments', isCorrect: false },
      { id: 'd', text: 'Nothing of developmental value', isCorrect: false },
    ],
    correctExplanation:
      'Perspective-taking develops emotional intelligence, wisdom, and the capacity to integrate multiple truths—essential for development.',
    relatedNodes: ['perspective-taking', 'vertical-development'],
    points: 15,
  },
  {
    id: 'mind-8',
    type: 'multiple-choice',
    category: 'mind',
    difficulty: 'intermediate',
    question: 'What is the relationship between "subject" and "object" in development?',
    answers: [
      { id: 'a', text: 'We are always subject to everything', isCorrect: false },
      { id: 'b', text: 'Development moves things from subject (identified with) to object (can observe)', isCorrect: true },
      { id: 'c', text: 'Objects are more important than subjects', isCorrect: false },
      { id: 'd', text: 'There is no real distinction', isCorrect: false },
    ],
    correctExplanation:
      'Development increases what we can objectify (step back from and observe). What we\'re subject to unconsciously runs us; what we can objectify we can work with consciously.',
    relatedNodes: ['subject-object', 'development'],
    points: 15,
  },
  {
    id: 'mind-9',
    type: 'scenario',
    category: 'mind',
    difficulty: 'advanced',
    question: 'A person struggles with decisions and often follows others\' opinions. What developmental approach is most appropriate?',
    answers: [
      { id: 'a', text: 'Memorizing decision rules', isCorrect: false },
      { id: 'b', text: 'Developing self-authoring capacity through perspective work and subject-object exploration', isCorrect: true },
      { id: 'c', text: 'Avoiding all social influence', isCorrect: false },
      { id: 'd', text: 'Judgment about the pattern', isCorrect: false },
    ],
    correctExplanation:
      'Supporting development from Socialized Mind (influenced by others) to Self-Authoring Mind involves practices that build internal authority and perspective-taking capacity.',
    relatedNodes: ['self-authoring-mind', 'development'],
    points: 15,
  },
  {
    id: 'mind-10',
    type: 'multiple-choice',
    category: 'mind',
    difficulty: 'advanced',
    question: 'What is "horizontal" vs "vertical" development?',
    answers: [
      { id: 'a', text: 'They are the same thing', isCorrect: false },
      { id: 'b', text: 'Horizontal = more content; Vertical = higher stages of consciousness', isCorrect: true },
      { id: 'c', text: 'Horizontal is better than vertical', isCorrect: false },
      { id: 'd', text: 'Neither is important for growth', isCorrect: false },
    ],
    correctExplanation:
      'Horizontal development adds skills, knowledge, and experiences within a stage. Vertical development moves to higher stages of consciousness and complexity.',
    relatedNodes: ['horizontal-development', 'vertical-development'],
    points: 15,
  },

  // ==================== SPIRIT MODULE ====================
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
    difficulty: 'beginner',
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
    difficulty: 'beginner',
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
    type: 'true-false',
    category: 'spirit',
    difficulty: 'intermediate',
    question: 'Mindfulness is simply thinking positively about situations.',
    answers: [
      { id: 'true', text: 'True', isCorrect: false },
      { id: 'false', text: 'False', isCorrect: true },
    ],
    correctExplanation:
      'Mindfulness is non-judgmental, present-moment awareness. It\'s not about changing thoughts, but observing them without reactivity or positive thinking.',
    relatedNodes: ['mindfulness', 'meditation'],
    points: 10,
  },
  {
    id: 'spirit-7',
    type: 'multiple-choice',
    category: 'spirit',
    difficulty: 'intermediate',
    question: 'What is "equanimity" in spiritual practice?',
    answers: [
      { id: 'a', text: 'Detachment and not caring', isCorrect: false },
      { id: 'b', text: 'Peaceful stability and non-reactivity in all circumstances', isCorrect: true },
      { id: 'c', text: 'Emotional numbness', isCorrect: false },
      { id: 'd', text: 'Accepting only good things', isCorrect: false },
    ],
    correctExplanation:
      'Equanimity is a balanced, steady mind that remains peaceful whether circumstances are pleasant or challenging—a wisdom quality developed through practice.',
    relatedNodes: ['equanimity', 'wisdom'],
    points: 15,
  },
  {
    id: 'spirit-8',
    type: 'multiple-choice',
    category: 'spirit',
    difficulty: 'intermediate',
    question: 'What role does gratitude play in spiritual development?',
    answers: [
      { id: 'a', text: 'It has no developmental significance', isCorrect: false },
      { id: 'b', text: 'It shifts perspective and opens the heart to interconnection and abundance', isCorrect: true },
      { id: 'c', text: 'It\'s only for religious people', isCorrect: false },
      { id: 'd', text: 'It prevents critical thinking', isCorrect: false },
    ],
    correctExplanation:
      'Gratitude practice develops appreciation, humility, and connection. It reorients attention toward what is good and opens the heart.',
    relatedNodes: ['gratitude', 'compassion'],
    points: 15,
  },
  {
    id: 'spirit-9',
    type: 'scenario',
    category: 'spirit',
    difficulty: 'advanced',
    question: 'You experience profound peace during meditation but find it difficult to maintain in daily life. What addresses this?',
    answers: [
      { id: 'a', text: 'Trying to recreate the state constantly', isCorrect: false },
      { id: 'b', text: 'Building stable stages through consistent practice and integration into daily life', isCorrect: true },
      { id: 'c', text: 'Abandoning meditation since it\'s not working', isCorrect: false },
      { id: 'd', text: 'Only meditating more intensely', isCorrect: false },
    ],
    correctExplanation:
      'This is a classic distinction between states and stages. Building authentic spiritual development requires consistent practice that integrates temporary states into baseline consciousness.',
    relatedNodes: ['states-vs-stages', 'integration', 'practice'],
    points: 15,
  },
  {
    id: 'spirit-10',
    type: 'multiple-choice',
    category: 'spirit',
    difficulty: 'advanced',
    question: 'What is the relationship between spiritual practice and psychological health?',
    answers: [
      { id: 'a', text: 'They are unrelated', isCorrect: false },
      { id: 'b', text: 'Spiritual practice automatically resolves all psychological issues', isCorrect: false },
      { id: 'c', text: 'Both are necessary; spiritual practice supports but doesn\'t replace psychological work', isCorrect: true },
      { id: 'd', text: 'Psychological work is unnecessary if you meditate', isCorrect: false },
    ],
    correctExplanation:
      'Spiritual development and psychological integration are complementary. Both are needed for comprehensive growth; one doesn\'t replace the other.',
    relatedNodes: ['integration', 'psychological-health'],
    points: 15,
  },

  // ==================== SHADOW MODULE ====================
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
    difficulty: 'beginner',
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
    difficulty: 'beginner',
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
    type: 'true-false',
    category: 'shadow',
    difficulty: 'intermediate',
    question: 'The shadow contains only negative traits.',
    answers: [
      { id: 'true', text: 'True', isCorrect: false },
      { id: 'false', text: 'False', isCorrect: true },
    ],
    correctExplanation:
      'The shadow includes both disowned "negative" traits AND positive potentials we cannot claim (power, sexuality, beauty, leadership, etc.).',
    relatedNodes: ['golden-shadow', 'dark-shadow'],
    points: 10,
  },
  {
    id: 'shadow-6',
    type: 'multiple-choice',
    category: 'shadow',
    difficulty: 'intermediate',
    question: 'What is the "golden shadow"?',
    answers: [
      { id: 'a', text: 'Positive traits we admire in others but don\'t recognize in ourselves', isCorrect: true },
      { id: 'b', text: 'Negative traits we project', isCorrect: false },
      { id: 'c', text: 'A type of meditation', isCorrect: false },
      { id: 'd', text: 'Financial success', isCorrect: false },
    ],
    correctExplanation:
      'The golden shadow is when we project positive qualities (confidence, strength, intelligence) onto others without recognizing these potentials in ourselves.',
    relatedNodes: ['golden-shadow', 'projection'],
    points: 15,
  },
  {
    id: 'shadow-7',
    type: 'multiple-choice',
    category: 'shadow',
    difficulty: 'intermediate',
    question: 'What is the primary purpose of Internal Family Systems (IFS)?',
    answers: [
      { id: 'a', text: 'To improve family relationships', isCorrect: false },
      { id: 'b', text: 'To identify and dialog with different parts/sub-personalities within ourselves', isCorrect: true },
      { id: 'c', text: 'To suppress unwanted emotions', isCorrect: false },
      { id: 'd', text: 'To judge ourselves', isCorrect: false },
    ],
    correctExplanation:
      'IFS views the psyche as containing multiple parts with different roles and motivations. Through dialog and compassion, we integrate these parts toward wholeness.',
    relatedNodes: ['ifs', 'parts-work'],
    points: 15,
  },
  {
    id: 'shadow-8',
    type: 'true-false',
    category: 'shadow',
    difficulty: 'intermediate',
    question: 'Strong emotional reactions to others are always about them.',
    answers: [
      { id: 'true', text: 'True', isCorrect: false },
      { id: 'false', text: 'False', isCorrect: true },
    ],
    correctExplanation:
      'Strong reactions often signal projections—they\'re pointing to disowned aspects of ourselves. They\'re about them AND about us.',
    relatedNodes: ['projection', 'shadow-work'],
    points: 10,
  },
  {
    id: 'shadow-9',
    type: 'scenario',
    category: 'shadow',
    difficulty: 'advanced',
    question: 'You strongly dislike someone\'s arrogance, but fear you might be arrogant too. What shadow principle applies?',
    answers: [
      { id: 'a', text: 'You should avoid that person', isCorrect: false },
      { id: 'b', text: 'Their arrogance is entirely their fault', isCorrect: false },
      { id: 'c', text: 'Their behavior may be mirroring a disowned shadow aspect in you (projection)', isCorrect: true },
      { id: 'd', text: 'You need stronger boundaries', isCorrect: false },
    ],
    correctExplanation:
      'Strong emotional reactions often signal projections. Exploring what in yourself the other person mirrors can reveal shadow material ready for integration.',
    relatedNodes: ['projection', 'shadow-integration', 'triggers'],
    points: 15,
  },
  {
    id: 'shadow-10',
    type: 'multiple-choice',
    category: 'shadow',
    difficulty: 'advanced',
    question: 'How does shadow work support overall personal development?',
    answers: [
      { id: 'a', text: 'It doesn\'t; it\'s separate from development', isCorrect: false },
      { id: 'b', text: 'It integrates disowned aspects, freeing energy and enabling growth', isCorrect: true },
      { id: 'c', text: 'It keeps people stuck in the past', isCorrect: false },
      { id: 'd', text: 'It only helps if you have serious psychological issues', isCorrect: false },
    ],
    correctExplanation:
      'Shadow integration frees enormous energy previously used to repress disowned aspects. This energy becomes available for growth, creativity, and authentic expression.',
    relatedNodes: ['shadow-integration', 'development'],
    points: 15,
  },

  // ==================== INTEGRAL THEORY ====================
  {
    id: 'integral-1',
    type: 'multiple-choice',
    category: 'integral-theory',
    difficulty: 'beginner',
    question: 'What does AQAL stand for in Integral theory?',
    answers: [
      { id: 'a', text: 'All Quadrants, All Levels', isCorrect: true },
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
    difficulty: 'beginner',
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
    difficulty: 'intermediate',
    question: 'What does "transcend and include" mean for development?',
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
    type: 'true-false',
    category: 'integral-theory',
    difficulty: 'intermediate',
    question: 'In Integral theory, all developmental lines progress at the same speed.',
    answers: [
      { id: 'true', text: 'True', isCorrect: false },
      { id: 'false', text: 'False', isCorrect: true },
    ],
    correctExplanation:
      'People develop unevenly across different lines (cognitive, emotional, spiritual, moral, etc.). You might be advanced in one line and beginner in another.',
    relatedNodes: ['lines-of-development', 'uneven-development'],
    points: 10,
  },
  {
    id: 'integral-6',
    type: 'multiple-choice',
    category: 'integral-theory',
    difficulty: 'intermediate',
    question: 'What are "lines of development" in Integral theory?',
    answers: [
      { id: 'a', text: 'Only cognitive and emotional development', isCorrect: false },
      { id: 'b', text: 'Different capacities that develop in relative independence (cognitive, emotional, spiritual, moral, etc.)', isCorrect: true },
      { id: 'c', text: 'Linear paths everyone follows identically', isCorrect: false },
      { id: 'd', text: 'Stages that everyone must complete in order', isCorrect: false },
    ],
    correctExplanation:
      'Lines of development include cognitive, emotional, interpersonal, moral, spiritual, kinesthetic, and many others. Each can be at different stages.',
    relatedNodes: ['lines-of-development', 'aqal-framework'],
    points: 15,
  },
  {
    id: 'integral-7',
    type: 'multiple-choice',
    category: 'integral-theory',
    difficulty: 'intermediate',
    question: 'What is the relationship between stages, states, and structures in Integral theory?',
    answers: [
      { id: 'a', text: 'They are all the same thing', isCorrect: false },
      { id: 'b', text: 'Structures are permanent stages; states are temporary experiences; stages become stable structures', isCorrect: true },
      { id: 'c', text: 'None of them matter for development', isCorrect: false },
      { id: 'd', text: 'Only states are real', isCorrect: false },
    ],
    correctExplanation:
      'Temporary states (meditation experiences, moods) are different from developmental stages. Through practice, states integrate into stable structures.',
    relatedNodes: ['states', 'stages', 'structures'],
    points: 15,
  },
  {
    id: 'integral-8',
    type: 'true-false',
    category: 'integral-theory',
    difficulty: 'intermediate',
    question: 'Integral theory suggests we should develop equally in all lines.',
    answers: [
      { id: 'true', text: 'True', isCorrect: false },
      { id: 'false', text: 'False', isCorrect: true },
    ],
    correctExplanation:
      'Integral theory acknowledges that people naturally develop unevenly and that this is normal and healthy. Balance is ideal but uneven development is realistic.',
    relatedNodes: ['lines-of-development', 'development'],
    points: 10,
  },
  {
    id: 'integral-9',
    type: 'scenario',
    category: 'integral-theory',
    difficulty: 'advanced',
    question: 'Which ILP approach best reflects the integrated, multi-dimensional nature of AQAL?',
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
  {
    id: 'integral-10',
    type: 'multiple-choice',
    category: 'integral-theory',
    difficulty: 'advanced',
    question: 'How does Integral theory address the relationship between individual and collective development?',
    answers: [
      { id: 'a', text: 'Only individual development matters', isCorrect: false },
      { id: 'b', text: 'Only collective development matters', isCorrect: false },
      { id: 'c', text: 'Both are essential and interconnected through the four quadrants', isCorrect: true },
      { id: 'd', text: 'They are completely separate', isCorrect: false },
    ],
    correctExplanation:
      'Integral theory maps both individual growth (right quadrants) and collective evolution (left quadrants), recognizing that consciousness and culture co-evolve.',
    relatedNodes: ['quadrants', 'collective-development'],
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
  count: number = 15
): QuizQuestion[] {
  let questions = getQuestionsByCategory(category);

  // Filter by difficulty
  if (difficulty === 'beginner') {
    questions = questions.filter((q) => q.difficulty === 'beginner');
  } else if (difficulty === 'intermediate') {
    questions = questions.filter((q) => q.difficulty !== 'advanced');
  }
  // For advanced, include all levels

  return shuffleQuestions(questions, Math.min(count, questions.length));
}

// Get category stats
export function getCategoryStats() {
  return {
    core: getQuestionsByCategory('core').length,
    body: getQuestionsByCategory('body').length,
    mind: getQuestionsByCategory('mind').length,
    spirit: getQuestionsByCategory('spirit').length,
    shadow: getQuestionsByCategory('shadow').length,
    'integral-theory': getQuestionsByCategory('integral-theory').length,
    total: ilpGraphQuizzes.length,
  };
}
