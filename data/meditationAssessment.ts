export type QuestionType = 'multiple-choice' | 'scale' | 'multi-select' | 'yes-no';

export interface QuestionOption {
  text: string;
  value: string | number;
  tags?: string[];
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  section: string;
  options?: QuestionOption[];
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: [string, string];
  weight: 'high' | 'medium' | 'low';
  affects: string[];
  followUp?: string;
  maxSelections?: number;
}

export interface UserProfile {
  background: {
    cultural?: string;
    spiritualOpenness?: number;
    previousExperience?: string[];
  };
  goals: {
    primary?: string[];
    motivations?: string[];
  };
  personality: {
    learningStyle?: string;
    structurePreference?: number;
    temperament?: string;
  };
  practical: {
    timeAvailable?: string;
    retreatWillingness?: string;
    locationAccess?: string;
  };
  priorities: {
    evidenceBased?: number;
    traditionalAuthenticity?: number;
    quickResults?: number;
    spiritualDepth?: number;
  };
}

export const assessmentQuestions: Question[] = [
  // SECTION 1: Personal Background
  {
    id: 'cultural-background',
    type: 'multiple-choice',
    section: 'Personal Background',
    text: 'What\'s your cultural or spiritual background?',
    weight: 'high',
    affects: ['culturalContext', 'tradition_alignment'],
    options: [
      { text: 'Secular/Non-religious', value: 'secular' },
      { text: 'Buddhist', value: 'buddhist' },
      { text: 'Hindu/Vedic', value: 'hindu' },
      { text: 'Christian/Jewish/Muslim/Other Abrahamic', value: 'abrahamic' },
      { text: 'Spiritual but not religious', value: 'spiritual' },
      { text: 'Agnostic/Questioning', value: 'agnostic' }
    ]
  },

  {
    id: 'spiritual-openness',
    type: 'scale',
    section: 'Personal Background',
    text: 'How comfortable are you with spiritual or religious concepts in meditation practice?',
    weight: 'high',
    affects: ['spiritualOpenness', 'culturalContext'],
    scaleMin: 1,
    scaleMax: 10,
    scaleLabels: ['Prefer purely secular/scientific', 'Very open to spiritual/religious elements']
  },

  {
    id: 'previous-experience',
    type: 'multi-select',
    section: 'Personal Background',
    text: 'Have you tried any of these practices before? (Select all that apply)',
    weight: 'medium',
    affects: ['experienceLevel', 'approach_familiarity'],
    options: [
      { text: 'Meditation apps (Calm, Headspace, etc.)', value: 'apps' },
      { text: 'Yoga classes', value: 'yoga' },
      { text: 'Prayer or contemplative practice', value: 'prayer' },
      { text: 'Breathwork or pranayama', value: 'breathwork' },
      { text: 'Therapy or counseling', value: 'therapy' },
      { text: 'Psychedelics or plant medicines', value: 'psychedelics' },
      { text: 'Silent retreat', value: 'retreat' },
      { text: 'None of the above', value: 'none' }
    ]
  },

  // SECTION 2: Goals & Motivations
  {
    id: 'primary-goals',
    type: 'multi-select',
    section: 'Goals & Motivations',
    text: 'What are your primary goals? (Select up to 3)',
    weight: 'high',
    affects: ['goalAlignment', 'practice_recommendation'],
    maxSelections: 3,
    options: [
      { text: 'Reduce stress and anxiety', value: 'stress-reduction', tags: ['therapeutic', 'quick-results'] },
      { text: 'Spiritual awakening or enlightenment', value: 'awakening', tags: ['traditional', 'spiritual-depth'] },
      { text: 'Improve focus and productivity', value: 'focus', tags: ['concentration', 'performance'] },
      { text: 'Understand my mind and emotions better', value: 'insight', tags: ['insight', 'psychological'] },
      { text: 'Develop compassion and loving-kindness', value: 'compassion', tags: ['heart-practices', 'relational'] },
      { text: 'Manage chronic pain or illness', value: 'pain', tags: ['therapeutic', 'body-based', 'mbsr'] },
      { text: 'Explore consciousness and reality', value: 'consciousness', tags: ['non-dual', 'advanced'] },
      { text: 'Find inner peace and contentment', value: 'peace', tags: ['concentration', 'jhana'] },
      { text: 'Emotional healing and processing', value: 'healing', tags: ['therapeutic', 'body-based'] }
    ]
  },

  {
    id: 'motivation-type',
    type: 'multiple-choice',
    section: 'Goals & Motivations',
    text: 'Which statement best describes your primary motivation?',
    weight: 'high',
    affects: ['motivationType', 'approach'],
    options: [
      { text: 'I\'m dealing with specific problems (anxiety, pain, insomnia)', value: 'problem-solving' },
      { text: 'I want to optimize my performance and capabilities', value: 'performance' },
      { text: 'I\'m seeking spiritual or existential truth', value: 'truth-seeking' },
      { text: 'I want to become a better, more compassionate person', value: 'character-development' },
      { text: 'I\'m curious and want to explore my mind', value: 'exploration' }
    ]
  },

  // SECTION 3: Personality & Learning Style
  {
    id: 'learning-style',
    type: 'multiple-choice',
    section: 'Personality & Preferences',
    text: 'How do you prefer to learn new skills?',
    weight: 'medium',
    affects: ['structurePreference', 'teacherRequired'],
    options: [
      { text: 'Clear, step-by-step instructions and structured programs', value: 'structured' },
      { text: 'Exploration and self-discovery with minimal guidance', value: 'exploratory' },
      { text: 'Mix of structure and freedom', value: 'balanced' },
      { text: 'Working closely with a teacher or mentor', value: 'guided' }
    ]
  },

  {
    id: 'structure-preference',
    type: 'scale',
    section: 'Personality & Preferences',
    text: 'Structure vs. Freedom: How do you prefer to practice?',
    weight: 'high',
    affects: ['structureLevel', 'practice_structure'],
    scaleMin: 1,
    scaleMax: 10,
    scaleLabels: ['Highly structured: clear techniques and steps', 'Complete freedom: minimal instructions']
  },

  {
    id: 'temperament',
    type: 'multiple-choice',
    section: 'Personality & Preferences',
    text: 'Which description resonates most with you?',
    weight: 'medium',
    affects: ['temperament', 'approach'],
    options: [
      { text: 'Analytical and systematic - I like understanding how things work', value: 'analytical' },
      { text: 'Devotional and heart-centered - I connect through feeling', value: 'devotional' },
      { text: 'Intuitive and experiential - I prefer direct experience over concepts', value: 'experiential' },
      { text: 'Active and energetic - I prefer practices with movement or intensity', value: 'active' },
      { text: 'Calm and contemplative - I enjoy quiet, still practices', value: 'contemplative' }
    ]
  },

  {
    id: 'patience-level',
    type: 'multiple-choice',
    section: 'Personality & Preferences',
    text: 'How patient are you with gradual progress?',
    weight: 'medium',
    affects: ['timeToResults', 'expectation_management'],
    options: [
      { text: 'Very patient - I\'m in this for the long haul', value: 'very-patient' },
      { text: 'Moderately patient - I can wait but want some milestones', value: 'moderately-patient' },
      { text: 'I need to see results relatively quickly to stay motivated', value: 'need-results' },
      { text: 'I want immediate benefits or I lose interest', value: 'immediate' }
    ]
  },

  // SECTION 4: Practical Considerations
  {
    id: 'time-available',
    type: 'multiple-choice',
    section: 'Practical Considerations',
    text: 'How much time can you realistically commit to daily practice?',
    weight: 'high',
    affects: ['timeCommitment', 'practice_feasibility'],
    options: [
      { text: '5-10 minutes', value: '5-10' },
      { text: '15-20 minutes', value: '15-20' },
      { text: '30-45 minutes', value: '30-45' },
      { text: '1 hour or more', value: '60+' },
      { text: 'Variable / depends on the day', value: 'variable' }
    ]
  },

  {
    id: 'consistency-confidence',
    type: 'scale',
    section: 'Practical Considerations',
    text: 'How confident are you in maintaining a daily practice?',
    weight: 'medium',
    affects: ['commitment_level', 'support_needed'],
    scaleMin: 1,
    scaleMax: 10,
    scaleLabels: ['I struggle with consistency', 'I\'m very disciplined']
  },

  {
    id: 'retreat-willingness',
    type: 'multiple-choice',
    section: 'Practical Considerations',
    text: 'Are you willing to attend meditation retreats?',
    weight: 'medium',
    affects: ['retreatFriendly', 'depth_potential'],
    options: [
      { text: 'Yes, definitely interested', value: 'yes-interested' },
      { text: 'Maybe in the future', value: 'maybe' },
      { text: 'Probably not', value: 'probably-not' },
      { text: 'Definitely not', value: 'no' }
    ]
  },

  {
    id: 'teacher-access',
    type: 'multiple-choice',
    section: 'Practical Considerations',
    text: 'What\'s your access to teachers or meditation centers?',
    weight: 'medium',
    affects: ['teacherRequired', 'practice_feasibility'],
    options: [
      { text: 'Good access - I have local centers or teachers', value: 'good' },
      { text: 'Limited - would rely on online resources', value: 'limited' },
      { text: 'Willing to travel for initial instruction', value: 'travel' },
      { text: 'Prefer self-guided from books/apps', value: 'self-guided' }
    ]
  },

  {
    id: 'budget',
    type: 'multiple-choice',
    section: 'Practical Considerations',
    text: 'What\'s your budget for meditation instruction/courses?',
    weight: 'low',
    affects: ['cost_consideration'],
    options: [
      { text: 'Free resources only', value: 'free' },
      { text: 'Willing to pay for apps or books ($10-50)', value: 'minimal' },
      { text: 'Can invest in courses or workshops ($100-500)', value: 'moderate' },
      { text: 'Open to significant investment ($500+)', value: 'substantial' }
    ]
  },

  // SECTION 5: Values & Priorities
  {
    id: 'evidence-importance',
    type: 'scale',
    section: 'Values & Priorities',
    text: 'How important is scientific research and evidence to you?',
    weight: 'medium',
    affects: ['evidenceBased', 'practice_validation'],
    scaleMin: 1,
    scaleMax: 10,
    scaleLabels: ['Not important - I trust tradition/experience', 'Very important - I want strong research backing']
  },

  {
    id: 'tradition-importance',
    type: 'scale',
    section: 'Values & Priorities',
    text: 'How important is traditional authenticity and lineage?',
    weight: 'medium',
    affects: ['traditionalAuthenticity', 'cultural_adaptation'],
    scaleMin: 1,
    scaleMax: 10,
    scaleLabels: ['Not important - prefer modern adaptations', 'Very important - want authentic traditional practice']
  },

  {
    id: 'community-preference',
    type: 'multiple-choice',
    section: 'Values & Priorities',
    text: 'How important is community and group practice to you?',
    weight: 'low',
    affects: ['community_support'],
    options: [
      { text: 'Very important - I want to practice with others', value: 'very-important' },
      { text: 'Somewhat important - occasional group practice would be nice', value: 'somewhat' },
      { text: 'Neutral - I can take it or leave it', value: 'neutral' },
      { text: 'Prefer solo practice', value: 'prefer-solo' }
    ]
  },

  {
    id: 'quick-vs-deep',
    type: 'multiple-choice',
    section: 'Values & Priorities',
    text: 'Which appeals more to you?',
    weight: 'high',
    affects: ['depth_vs_speed', 'practice_type'],
    options: [
      { text: 'Quick, practical benefits for daily life', value: 'quick-practical' },
      { text: 'Deep transformation even if it takes years', value: 'deep-transformation' },
      { text: 'Both - practical benefits now, depth over time', value: 'both' }
    ]
  }
];

// Helper function to group questions by section
export function getQuestionsBySection(): Record<string, Question[]> {
  const sections: Record<string, Question[]> = {};

  assessmentQuestions.forEach(question => {
    if (!sections[question.section]) {
      sections[question.section] = [];
    }
    sections[question.section].push(question);
  });

  return sections;
}

// Get section order
export const sectionOrder = [
  'Personal Background',
  'Goals & Motivations',
  'Personality & Preferences',
  'Practical Considerations',
  'Values & Priorities'
];

export const sectionDescriptions: Record<string, string> = {
  'Personal Background': 'Help us understand your background and previous experience with meditation or contemplative practices.',
  'Goals & Motivations': 'What brings you to meditation? What are you hoping to achieve or explore?',
  'Personality & Preferences': 'Everyone learns differently. These questions help us match you with compatible practice styles.',
  'Practical Considerations': 'Let\'s make sure recommendations fit your life circumstances and available time.',
  'Values & Priorities': 'What matters most to you in a meditation practice?'
};
