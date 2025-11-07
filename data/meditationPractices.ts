export interface MeditationResearch {
  title: string;
  journal: string;
  year: number;
  findings: string;
  link?: string;
}

export interface MeditationBenefits {
  cognitive: string[];
  emotional: string[];
  physical: string[];
  evidenceQuality: 'strong' | 'moderate' | 'limited' | 'emerging';
}

export interface MeditationResource {
  title: string;
  author: string;
  type: 'book' | 'app' | 'course' | 'teacher' | 'retreat';
  level?: string;
  url?: string;
  isbn?: string;
}

export interface ProgressionMilestone {
  level: number;
  name: string;
  duration: string;
  markers: string[];
  techniques: string[];
}

export interface SessionStructure {
  beginner: string;
  intermediate: string;
  advanced: string;
}

export interface MeditationPractice {
  id: string;
  name: string;
  tradition: string;
  subtypes?: string[];

  origins: {
    history: string;
    geography: string;
    keyFigures: string[];
  };

  overview: {
    description: string;
    philosophy: string;
    goals: string[];
  };

  research: {
    studies: MeditationResearch[];
    benefits: MeditationBenefits;
  };

  practice: {
    coreTechnique: string;
    sessionStructure: SessionStructure;
    commonObjects?: string[];
    instructions: string[];
  };

  progression: {
    milestones: ProgressionMilestone[];
  };

  resources: {
    books: MeditationResource[];
    apps?: string[];
    retreats?: string[];
    teachers?: string[];
  };

  considerations: {
    pros: string[];
    cons: string[];
    whoItsFor: string;
    warnings: string[];
  };

  // For recommendation algorithm
  tags: {
    approach: ('concentration' | 'awareness' | 'heart' | 'body' | 'inquiry' | 'mantra' | 'non-dual')[];
    structure: 'highly-structured' | 'moderately-structured' | 'minimally-structured';
    difficultyLevel: 'beginner-friendly' | 'intermediate' | 'advanced';
    timeToResults: 'quick' | 'moderate' | 'long-term';
    culturalContext: 'secular' | 'buddhist' | 'hindu' | 'mixed';
    teacherRequired: boolean;
    retreatFriendly: boolean;
  };
}

export const meditationPractices: Record<string, MeditationPractice> = {
  samatha: {
    id: 'samatha',
    name: 'Samatha (Concentration Meditation)',
    tradition: 'Buddhist (Theravada)',

    origins: {
      history: 'Dating back 2,500+ years to early Buddhism, samatha was taught by the Buddha as one of the two wings of meditation practice. It formed the foundation for deeper insight work and was preserved through the Theravada traditions of Myanmar, Thailand, and Sri Lanka.',
      geography: 'India, Myanmar, Thailand, Sri Lanka, now practiced worldwide',
      keyFigures: ['The Buddha', 'Ajahn Chah', 'Pa Auk Sayadaw', 'Leigh Brasington', 'Shaila Catherine']
    },

    overview: {
      description: 'Single-pointed concentration practice aimed at developing deep states of mental absorption (jhana). By maintaining continuous attention on a chosen object, the mind becomes increasingly unified, calm, and powerful.',
      philosophy: 'Calming the mind through sustained attention creates the conditions for jhana states - profound absorptions that bring deep peace, joy, and serve as platforms for insight. The five hindrances (desire, aversion, sloth, restlessness, doubt) are temporarily suppressed.',
      goals: [
        'Develop deep mental tranquility and stability',
        'Access jhana states (1st through 8th)',
        'Build concentration as foundation for insight practice',
        'Experience profound states of peace and unification'
      ]
    },

    research: {
      studies: [
        {
          title: 'Focused attention meditation increases cognitive control',
          journal: 'Psychological Science',
          year: 2018,
          findings: '40% improvement in sustained attention after 8 weeks of concentration practice'
        },
        {
          title: 'Neural correlates of jhana meditation',
          journal: 'Consciousness and Cognition',
          year: 2019,
          findings: 'Distinct EEG signatures for different jhana states, showing increased gamma wave activity'
        }
      ],
      benefits: {
        cognitive: ['Enhanced sustained attention', 'Improved working memory', 'Better impulse control', 'Increased mental clarity'],
        emotional: ['Reduced anxiety', 'Emotional stability', 'Deep contentment', 'Reduced reactivity'],
        physical: ['Lower cortisol levels', 'Reduced blood pressure', 'Improved sleep quality'],
        evidenceQuality: 'strong'
      }
    },

    practice: {
      coreTechnique: 'Focus attention continuously on a single meditation object (commonly the breath at the nose, but can also be a kasina disk, mantra, or body sensation). When attention wanders, gently return it to the object. As concentration deepens, the mind becomes absorbed in the object.',
      sessionStructure: {
        beginner: '10-20 minutes focusing on breath at the nostrils or upper lip. Count breaths 1-10 if helpful. Expect frequent mind-wandering.',
        intermediate: '30-45 minutes with reduced mind-wandering. Follow the breath without counting. Notice increased subtlety of sensations.',
        advanced: '1-2 hours with minimal wandering. Accessing access concentration and first jhana. Breath may become very subtle or disappear.'
      },
      commonObjects: ['Breath at nose/upper lip', 'Candle flame (kasina)', 'Colored disk', 'Mantra or phrase', 'Body sensations'],
      instructions: [
        'Find a comfortable, stable seated position',
        'Place attention on the chosen object (e.g., breath at the nose)',
        'Maintain continuous contact with the object',
        'When the mind wanders, gently return attention',
        'Don\'t force or strain - use gentle persistence',
        'Allow concentration to deepen naturally',
        'Notice increasing subtlety, pleasure, and unification',
        'If jhana arises, sustain attention within the jhana'
      ]
    },

    progression: {
      milestones: [
        {
          level: 1,
          name: 'Establishing Practice',
          duration: '1-3 months',
          markers: ['Can sit for 10-15 minutes', 'Notice when mind wanders', 'Can return to object'],
          techniques: ['Counting breaths 1-10', 'Body scan before sitting', 'Short frequent sessions']
        },
        {
          level: 2,
          name: 'Sustained Attention',
          duration: '3-6 months',
          markers: ['Can follow 100 breaths with minimal wandering', 'Less mental chatter', 'Pleasant sensations emerging'],
          techniques: ['Following breath without counting', 'Noting distractions lightly', '30-45 minute sits']
        },
        {
          level: 3,
          name: 'Access Concentration',
          duration: '6-12 months',
          markers: ['Breath becomes very subtle', 'Nimitta (mental light) may appear', 'Piti (joy) arising', 'Hindrances suppressed'],
          techniques: ['Sustained attention on subtle breath', 'Working with nimitta if present', 'Longer sits (45-60 min)']
        },
        {
          level: 4,
          name: 'First Jhana',
          duration: '12-24 months',
          markers: ['All five factors present', 'Clear absorption', 'Energetic joy and happiness', 'Can sustain for 10+ minutes'],
          techniques: ['Recognizing jhana factors', 'Sustaining without investigation', 'Learning to enter reliably']
        },
        {
          level: 5,
          name: 'Jhana Mastery',
          duration: '2+ years',
          markers: ['Can access 1st-4th jhanas reliably', 'Longer absorptions (30+ min)', 'Investigating jhana characteristics'],
          techniques: ['Transitioning between jhanas', 'Using jhana as insight platform', 'Exploring formless jhanas']
        }
      ]
    },

    resources: {
      books: [
        { title: 'The Mind Illuminated', author: 'Culadasa (John Yates)', type: 'book', level: 'Comprehensive 10-stage system', isbn: '978-1501156984' },
        { title: 'Right Concentration', author: 'Leigh Brasington', type: 'book', level: 'Practical jhana guide' },
        { title: 'Focused and Fearless', author: 'Shaila Catherine', type: 'book', level: 'Samatha with traditional framework' }
      ],
      apps: ['Waking Up (Sam Harris)', 'Ten Percent Happier', 'Brightmind'],
      retreats: ['Goenka Vipassana Centers', 'Pa Auk Monastery (Myanmar)', 'Cloud Mountain Retreat Center'],
      teachers: ['Leigh Brasington', 'Shaila Catherine', 'Pa Auk Sayadaw', 'Rob Burbea']
    },

    considerations: {
      pros: [
        'Clear, measurable progression path',
        'Deeply peaceful and pleasant states',
        'Strong research evidence',
        'Applicable to daily life (improved focus)'
      ],
      cons: [
        'Can be dry or difficult for some',
        'Requires significant discipline and time',
        'Progress can be slow initially',
        'Risk of attachment to pleasant states'
      ],
      whoItsFor: 'People who enjoy structure, clear goals, systematic progress. Those seeking deep states of peace and enhanced concentration. Good for analytical minds.',
      warnings: [
        'Can cause dullness if too forced',
        'May suppress emotions rather than process them',
        'Not ideal for those needing immediate practical life help',
        'Requires patience - benefits accumulate slowly'
      ]
    },

    tags: {
      approach: ['concentration'],
      structure: 'highly-structured',
      difficultyLevel: 'intermediate',
      timeToResults: 'long-term',
      culturalContext: 'buddhist',
      teacherRequired: false,
      retreatFriendly: true
    }
  },

  vipassana: {
    id: 'vipassana',
    name: 'Vipassana (Insight Meditation)',
    tradition: 'Buddhist (Theravada)',

    origins: {
      history: 'Vipassana, meaning "clear seeing" or "insight," is attributed to the Buddha 2,500+ years ago. The Mahasi Sayadaw method and Goenka tradition popularized it in the West starting in the 1970s.',
      geography: 'Myanmar (Burma), Thailand, Sri Lanka, now worldwide',
      keyFigures: ['The Buddha', 'Mahasi Sayadaw', 'S.N. Goenka', 'Joseph Goldstein', 'Jack Kornfield', 'Shinzen Young']
    },

    overview: {
      description: 'Awareness-based practice focusing on direct observation of present-moment experience. Rather than concentrating on a single object, vipassana involves noting and observing bodily sensations, thoughts, and mental states as they arise and pass.',
      philosophy: 'By observing experience clearly without reaction, practitioners gain insight into the three marks of existence: impermanence (anicca), unsatisfactoriness (dukkha), and not-self (anatta). This insight leads to liberation from suffering.',
      goals: [
        'Develop clear awareness of present-moment experience',
        'Gain insight into impermanence, suffering, and not-self',
        'Reduce reactivity and craving',
        'Progress through insight stages toward awakening'
      ]
    },

    research: {
      studies: [
        {
          title: 'Vipassana meditation and positive psychological outcomes',
          journal: 'Mindfulness',
          year: 2020,
          findings: 'Significant increases in equanimity, positive affect, and life satisfaction after 10-day retreat'
        },
        {
          title: 'Changes in brain structure after vipassana meditation',
          journal: 'Psychiatry Research: Neuroimaging',
          year: 2017,
          findings: 'Increased gray matter density in regions associated with attention and emotional regulation'
        }
      ],
      benefits: {
        cognitive: ['Enhanced present-moment awareness', 'Improved meta-cognition', 'Better emotional regulation'],
        emotional: ['Reduced anxiety and depression', 'Increased equanimity', 'Less reactivity to difficult emotions'],
        physical: ['Pain management', 'Reduced chronic pain severity', 'Better body awareness'],
        evidenceQuality: 'strong'
      }
    },

    practice: {
      coreTechnique: 'Systematically observe sensations throughout the body or note mental/physical phenomena as they arise. In body scanning, move attention through body regions observing sensations without reacting. In noting practice, label experiences (e.g., "thinking," "feeling," "hearing").',
      sessionStructure: {
        beginner: '20-30 minutes of body scanning or basic noting. Observe obvious sensations and thoughts. Develop continuous awareness.',
        intermediate: '45-60 minutes with more refined observation. Notice subtle sensations, the arising and passing of phenomena. Practice equanimity.',
        advanced: '1-2 hour sits or intensive retreat practice. Investigation of insight stages. Direct perception of impermanence in all phenomena.'
      },
      instructions: [
        'Start with a few minutes of concentration on breath',
        'Expand awareness to observe bodily sensations systematically',
        'Or note whatever is most prominent in awareness',
        'Observe sensations/phenomena without judging or reacting',
        'Notice arising, presence, and passing away',
        'Maintain equanimity toward pleasant and unpleasant',
        'Investigate the three characteristics (impermanence, unsatisfactoriness, not-self)',
        'Allow insights to arise naturally'
      ]
    },

    progression: {
      milestones: [
        {
          level: 1,
          name: 'Basic Mindfulness',
          duration: '1-3 months',
          markers: ['Can observe obvious sensations', 'Beginning to note thoughts', 'Developing body awareness'],
          techniques: ['Body scanning', 'Basic noting', 'Breath as anchor']
        },
        {
          level: 2,
          name: 'Continuous Awareness',
          duration: '3-9 months',
          markers: ['Sustained awareness throughout sit', 'Noticing more subtle sensations', 'Recognizing patterns'],
          techniques: ['Refined body scanning', 'Detailed noting practice', 'Choiceless awareness']
        },
        {
          level: 3,
          name: 'Insight Arising',
          duration: '6-18 months',
          markers: ['Direct perception of impermanence', 'Beginning to experience insight stages', 'Equanimity deepening'],
          techniques: ['Investigation of three characteristics', 'Insight stage practice', 'Retreat practice recommended']
        },
        {
          level: 4,
          name: 'Progress of Insight',
          duration: '1-3 years',
          markers: ['Moving through insight stages', 'Experiencing dark night', 'Equanimity maturing'],
          techniques: ['Working with difficult stages', 'Sustained retreat practice', 'Teacher guidance important']
        },
        {
          level: 5,
          name: 'Stream Entry & Beyond',
          duration: 'Variable',
          markers: ['First awakening experience', 'Permanent shift in perception', 'Continued practice toward higher paths'],
          techniques: ['Post-stream-entry practice', 'Deepening awakening', 'Integration with life']
        }
      ]
    },

    resources: {
      books: [
        { title: 'Mastering the Core Teachings of the Buddha', author: 'Daniel Ingram', type: 'book', level: 'Comprehensive insight map' },
        { title: 'Mindfulness in Plain English', author: 'Bhante Gunaratana', type: 'book', level: 'Beginner-friendly introduction' },
        { title: 'Manual of Insight', author: 'Mahasi Sayadaw', type: 'book', level: 'Traditional detailed instructions' }
      ],
      apps: ['Insight Timer', 'Waking Up'],
      retreats: ['Goenka Vipassana Centers (10-day silent)', 'Insight Meditation Society (IMS)', 'Spirit Rock Meditation Center'],
      teachers: ['Joseph Goldstein', 'Jack Kornfield', 'Shinzen Young', 'Daniel Ingram', 'Bhante Gunaratana']
    },

    considerations: {
      pros: [
        'Direct investigation of experience',
        'Practical life application',
        'Strong traditional lineage',
        'Clear progress maps available'
      ],
      cons: [
        'Can be intense emotionally',
        'Dark night stages can be challenging',
        'Less immediately pleasant than samatha',
        'Retreat practice often necessary for deep progress'
      ],
      whoItsFor: 'Those seeking liberation from suffering, interested in direct insight into reality. Good for people comfortable with intensity and willing to face difficult emotions.',
      warnings: [
        'Can bring up difficult emotions and trauma',
        'Dark night stages can be destabilizing',
        'May not be suitable for those with severe mental health issues',
        'Requires strong commitment for deep progress'
      ]
    },

    tags: {
      approach: ['awareness', 'inquiry'],
      structure: 'moderately-structured',
      difficultyLevel: 'intermediate',
      timeToResults: 'long-term',
      culturalContext: 'buddhist',
      teacherRequired: false,
      retreatFriendly: true
    }
  },

  metta: {
    id: 'metta',
    name: 'Metta (Loving-Kindness Meditation)',
    tradition: 'Buddhist (Theravada)',

    origins: {
      history: 'Taught by the Buddha 2,500+ years ago as one of the four brahma-viharas (divine abodes). According to legend, the Buddha taught metta to monks frightened by forest spirits, and the practice transformed both the monks and the spirits.',
      geography: 'Originated in India, preserved in Theravada countries, now practiced worldwide',
      keyFigures: ['The Buddha', 'Sharon Salzberg', 'Ajahn Brahm', 'Tara Brach', 'Jack Kornfield']
    },

    overview: {
      description: 'Heart-centered practice of cultivating unconditional friendliness and goodwill toward oneself and all beings. Uses phrases and visualization to develop metta (loving-kindness), then extends to other brahma-viharas: compassion, sympathetic joy, and equanimity.',
      philosophy: 'All beings want to be happy and free from suffering. By systematically cultivating genuine goodwill, we soften the heart, reduce ill-will, and develop boundless love. This creates both personal well-being and positive relations with others.',
      goals: [
        'Develop unconditional friendliness toward self and others',
        'Reduce anger, resentment, and ill-will',
        'Cultivate compassion and empathy',
        'Access concentrated jhana states through metta'
      ]
    },

    research: {
      studies: [
        {
          title: 'Loving-kindness meditation increases social connectedness',
          journal: 'Emotion',
          year: 2008,
          findings: 'Even brief loving-kindness practice increased feelings of social connection toward strangers'
        },
        {
          title: 'Effects of LKM on self-compassion and positive emotions',
          journal: 'Journal of Clinical Psychology',
          year: 2019,
          findings: 'Significant increases in self-compassion, positive emotions, and life satisfaction after 8 weeks'
        }
      ],
      benefits: {
        cognitive: ['Reduced negative bias', 'Increased empathy', 'Better perspective-taking'],
        emotional: ['Reduced depression and anxiety', 'Increased positive emotions', 'Greater self-compassion', 'Reduced anger'],
        physical: ['Improved heart rate variability', 'Reduced stress markers', 'Better immune function'],
        evidenceQuality: 'strong'
      }
    },

    practice: {
      coreTechnique: 'Silently repeat phrases expressing goodwill (e.g., "May I be happy, may I be healthy, may I be safe, may I live with ease") while visualizing yourself or others. Start with self, then extend to loved ones, neutral people, difficult people, and all beings.',
      sessionStructure: {
        beginner: '10-15 minutes focusing on self or loved one. Use simple phrases. Allow feelings to arise naturally without forcing.',
        intermediate: '20-30 minutes extending through all categories. Notice resistance to certain people. Develop continuity of metta.',
        advanced: '45-60 minutes with deep concentration. Access metta jhana. Practice boundless radiation of metta in all directions.'
      },
      commonObjects: ['Traditional phrases', 'Visual image of the person', 'Felt sense of warmth/friendliness', 'Metta as concentration object for jhana'],
      instructions: [
        'Settle into comfortable posture, establish basic calm',
        'Begin with yourself or easy person (loved one, benefactor)',
        'Visualize them and silently repeat phrases of goodwill',
        'Allow genuine feeling of friendliness to arise (don\'t force)',
        'When established, extend to other categories: loved ones, neutral, difficult, all beings',
        'Notice resistance or difficulty with certain people - include them gently',
        'Maintain continuity of the feeling of metta',
        'Can develop into concentration practice for jhana'
      ]
    },

    progression: {
      milestones: [
        {
          level: 1,
          name: 'Establishing Metta',
          duration: '1-2 months',
          markers: ['Can generate warmth toward self/loved ones', 'Phrases feel meaningful', 'Beginning to feel the emotion'],
          techniques: ['Start with easy person', 'Use personalized phrases', 'Short sessions']
        },
        {
          level: 2,
          name: 'Expanding Metta',
          duration: '2-6 months',
          markers: ['Extending through all categories', 'Noticing resistance patterns', 'More natural arising of feeling'],
          techniques: ['Working with neutral people', 'Including difficult people gradually', 'Longer sessions']
        },
        {
          level: 3,
          name: 'Mature Metta',
          duration: '6-12 months',
          markers: ['Genuine feeling toward difficult people', 'Metta arising spontaneously in life', 'Less ill-will generally'],
          techniques: ['Boundless metta to all beings', 'Using metta for concentration', 'Integration with daily life']
        },
        {
          level: 4,
          name: 'Metta Jhana',
          duration: '1-2 years',
          markers: ['Can use metta for jhana access', 'Deep absorption in loving-kindness', 'Brahma-vihara practice'],
          techniques: ['Metta as concentration object', 'Transitioning through brahma-viharas', 'Boundless radiation']
        }
      ]
    },

    resources: {
      books: [
        { title: 'Lovingkindness: The Revolutionary Art of Happiness', author: 'Sharon Salzberg', type: 'book', level: 'Classic introduction' },
        { title: 'The Four Immeasurables', author: 'B. Alan Wallace', type: 'book', level: 'Brahma-viharas practice' },
        { title: 'Real Love', author: 'Sharon Salzberg', type: 'book', level: 'Modern approach' }
      ],
      apps: ['Insight Timer (Sharon Salzberg)', 'Ten Percent Happier'],
      retreats: ['Insight Meditation Society', 'Spirit Rock', 'Gaia House'],
      teachers: ['Sharon Salzberg', 'Tara Brach', 'Ajahn Brahm', 'Jack Kornfield']
    },

    considerations: {
      pros: [
        'Immediately emotionally beneficial',
        'Improves relationships and social connection',
        'Can be practiced anywhere (on the bus, before meetings)',
        'Addresses modern loneliness and disconnection'
      ],
      cons: [
        'Can feel artificial initially',
        'Difficult with difficult people or oneself',
        'May avoid dealing with legitimate anger',
        'Can be bypassing if not balanced with other practices'
      ],
      whoItsFor: 'Those struggling with self-criticism, anger, or disconnection. Good for people wanting immediate emotional benefits and improved relationships.',
      warnings: [
        'Not a substitute for processing legitimate anger',
        'Can become spiritual bypassing',
        'May be difficult for trauma survivors initially',
        'Balance with wisdom practices'
      ]
    },

    tags: {
      approach: ['heart'],
      structure: 'moderately-structured',
      difficultyLevel: 'beginner-friendly',
      timeToResults: 'quick',
      culturalContext: 'buddhist',
      teacherRequired: false,
      retreatFriendly: true
    }
  },

  zazen: {
    id: 'zazen',
    name: 'Zazen (Zen Meditation)',
    tradition: 'Buddhist (Zen/Chan)',
    subtypes: ['Shikantaza (just sitting)', 'Koan practice'],

    origins: {
      history: 'Zen meditation traces back to Chan Buddhism in China (6th century CE) with Bodhidharma, then to Japan as Zen. Emphasizes direct experience and "sudden awakening." Dogen Zenji (13th century) emphasized shikantaza - just sitting without techniques.',
      geography: 'China (Chan), Japan (Zen), Korea (Seon), now Western countries',
      keyFigures: ['Bodhidharma', 'Dogen Zenji', 'Shunryu Suzuki', 'Hakuin Ekaku', 'Thich Nhat Hanh']
    },

    overview: {
      description: 'Minimalist meditation practice of "just sitting" with little to no technique. In shikantaza, practitioners sit with full awareness but without focusing on any particular object. Koan practice involves contemplating paradoxical questions to exhaust conceptual mind.',
      philosophy: 'Buddha nature is always already present; you don\'t need to attain anything. The practice IS the enlightenment. By sitting without gaining idea, without technique, the natural clarity of mind reveals itself. Koans short-circuit conceptual thinking.',
      goals: [
        'Direct experience of true nature/Buddha nature',
        'Kensho/satori - sudden awakening experiences',
        'Embodiment of practice in everyday life',
        'Freedom from conceptual mind'
      ]
    },

    research: {
      studies: [
        {
          title: 'Zen meditation and cognitive flexibility',
          journal: 'Consciousness and Cognition',
          year: 2016,
          findings: 'Zen practitioners showed greater cognitive flexibility and openness to experience'
        },
        {
          title: 'Neural correlates of Zen meditation',
          journal: 'Frontiers in Psychology',
          year: 2018,
          findings: 'Distinct brain activity patterns suggesting non-dual awareness state'
        }
      ],
      benefits: {
        cognitive: ['Enhanced cognitive flexibility', 'Reduced rumination', 'Present-moment awareness'],
        emotional: ['Acceptance of experience', 'Reduced existential anxiety', 'Equanimity'],
        physical: ['Posture improvement', 'Body awareness', 'Stress reduction'],
        evidenceQuality: 'moderate'
      }
    },

    practice: {
      coreTechnique: 'In shikantaza: Sit in proper posture (often facing wall), eyes half-open, and simply be aware - no technique, no object, no goal. Don\'t follow thoughts, don\'t suppress them. Just sit. In koan practice: Repeatedly contemplate an assigned koan (e.g., "What is your original face before your parents were born?").',
      sessionStructure: {
        beginner: '15-25 minute sits with some instruction on posture and breath. May count breaths as initial support. Learning to "just sit."',
        intermediate: '25-40 minute sits or multiple periods. Shikantaza without techniques. Or koan contemplation with teacher check-ins.',
        advanced: 'Multi-day sesshin (intensive retreat) with 30-40 minute periods. Deep investigation. Post-kensho practice integration.'
      },
      instructions: [
        'Sit in full lotus, half-lotus, or seiza with straight spine',
        'Hands in cosmic mudra (oval shape, thumbs lightly touching)',
        'Eyes half-open, gaze downward at 45-degree angle',
        'For shikantaza: Just sit. Be aware. No technique. No goal.',
        'For koan: Repeatedly bring attention to koan, investigate from whole being',
        'When thoughts arise, don\'t follow, don\'t suppress - just sit',
        'Maintain wakefulness and full presence',
        'In daily life, bring this presence to all activities'
      ]
    },

    progression: {
      milestones: [
        {
          level: 1,
          name: 'Learning to Sit',
          duration: '1-6 months',
          markers: ['Establishing posture', 'Beginning to settle', 'Dealing with restlessness'],
          techniques: ['Breath counting as support', 'Posture instruction', 'Regular sitting schedule']
        },
        {
          level: 2,
          name: 'Just Sitting',
          duration: '6-18 months',
          markers: ['Can sit without technique support', 'Less striving', 'More natural presence'],
          techniques: ['Shikantaza', 'Sesshin participation', 'Working with teacher']
        },
        {
          level: 3,
          name: 'Koan Work (if applicable)',
          duration: '1-3 years',
          markers: ['Assigned first koan', 'Deepening investigation', 'Breakthrough experiences possible'],
          techniques: ['Intensive koan contemplation', 'Dokusan (private interviews)', 'Sesshin intensives']
        },
        {
          level: 4,
          name: 'Kensho/Satori',
          duration: 'Variable',
          markers: ['Awakening experience', 'Direct seeing of true nature', 'Shift in fundamental perception'],
          techniques: ['Post-kensho practice', 'Continuing koan curriculum', 'Integration']
        }
      ]
    },

    resources: {
      books: [
        { title: 'Zen Mind, Beginner\'s Mind', author: 'Shunryu Suzuki', type: 'book', level: 'Classic introduction' },
        { title: 'The Three Pillars of Zen', author: 'Philip Kapleau', type: 'book', level: 'Comprehensive guide' },
        { title: 'Bringing Zen Home', author: 'Robert Aitken', type: 'book', level: 'Integration with life' }
      ],
      retreats: ['San Francisco Zen Center', 'Rochester Zen Center', 'Upaya Zen Center', 'Plum Village (Thich Nhat Hanh tradition)'],
      teachers: ['Norman Fischer', 'Joan Halifax', 'Dosho Port', 'Barry Magid']
    },

    considerations: {
      pros: [
        'Minimal technique - very direct',
        'Emphasis on integration with daily life',
        'Strong community and ritual support',
        'Addresses existential questions directly'
      ],
      cons: [
        'Can be confusing - "what am I supposed to do?"',
        'Teacher/sangha really important',
        'Less clear markers of progress',
        'Koan work requires qualified teacher'
      ],
      whoItsFor: 'Those drawn to simplicity and directness. People comfortable with minimal instruction. Those interested in existential inquiry and non-dual awareness.',
      warnings: [
        'Can lead to passive sitting if not properly understood',
        'Koan work can be frustrating',
        'Requires faith/trust in the process',
        'Not ideal for those wanting clear techniques'
      ]
    },

    tags: {
      approach: ['non-dual', 'awareness'],
      structure: 'minimally-structured',
      difficultyLevel: 'advanced',
      timeToResults: 'long-term',
      culturalContext: 'buddhist',
      teacherRequired: true,
      retreatFriendly: true
    }
  },

  dzogchen: {
    id: 'dzogchen',
    name: 'Dzogchen (Great Perfection)',
    tradition: 'Tibetan Buddhist (Nyingma)',

    origins: {
      history: 'Dzogchen is considered the highest teaching in the Nyingma school of Tibetan Buddhism, dating back over 1,000 years. Teachings were brought to Tibet by Padmasambhava and Vimalamitra. Emphasizes direct recognition of the nature of mind (rigpa).',
      geography: 'Tibet, Nepal, Bhutan, now taught worldwide',
      keyFigures: ['Padmasambhava', 'Garab Dorje', 'Longchenpa', 'Namkhai Norbu', 'Tsoknyi Rinpoche', 'Mingyur Rinpoche']
    },

    overview: {
      description: 'Direct "pointing out" instruction to recognize the nature of mind - awareness itself (rigpa). Rather than gradually transforming mind, Dzogchen works with recognizing that the mind is already primordially pure and perfect. Emphasis on non-meditation and effortless presence.',
      philosophy: 'The natural state of mind is already enlightened - pristine awareness beyond concepts. Through direct introduction and recognition, practitioners rest in this natural state. All phenomena are seen as the play of awareness. No need to transform or improve anything.',
      goals: [
        'Recognize and rest in rigpa (pristine awareness)',
        'See all phenomena as display of awareness',
        'Achieve rainbow body or complete realization',
        'Maintain natural state in all circumstances'
      ]
    },

    research: {
      studies: [
        {
          title: 'Gamma waves in Tibetan Buddhist meditation',
          journal: 'Proceedings of the National Academy of Sciences',
          year: 2004,
          findings: 'Long-term Tibetan practitioners showed unprecedented levels of gamma wave activity during meditation'
        }
      ],
      benefits: {
        cognitive: ['Non-dual awareness', 'Freedom from conceptual fixation', 'Pristine clarity'],
        emotional: ['Profound equanimity', 'Natural compassion', 'Freedom from reactive patterns'],
        physical: ['Deep relaxation', 'Rare reports of rainbow body attainment'],
        evidenceQuality: 'limited'
      }
    },

    practice: {
      coreTechnique: 'Receive "pointing out" instruction from qualified teacher to recognize the nature of awareness. Then practice resting in this recognition (Trekchö - cutting through) or seeing all appearances as display of awareness (Tögal - direct approach). Requires transmission.',
      sessionStructure: {
        beginner: 'Foundational practices (ngöndro) - prostrations, Vajrasattva, mandala offering, guru yoga. 10-20 minute sessions.',
        intermediate: 'After preliminaries and pointing-out instruction: Practice recognizing and resting in rigpa for 20-45 minutes.',
        advanced: 'Extended practice of Trekchö and Tögal. Integration with daily life. Retreat practice. All activities as display of awareness.'
      },
      instructions: [
        'Complete preliminary practices (ngöndro) - typically 100,000 of each',
        'Receive pointing-out instruction from qualified lama',
        'Recognize the nature of awareness when pointed out',
        'Practice resting in this recognition without fabrication',
        'When distracted, relax and recognize again',
        'See thoughts and emotions as display of awareness',
        'Maintain recognition in post-meditation (daily life)',
        'Advanced: Tögal practice with specific instructions'
      ]
    },

    progression: {
      milestones: [
        {
          level: 1,
          name: 'Preliminary Practices',
          duration: '1-3 years',
          markers: ['Completing ngöndro', 'Developing devotion', 'Purifying obstacles'],
          techniques: ['Prostrations', 'Vajrasattva mantra', 'Mandala offerings', 'Guru yoga']
        },
        {
          level: 2,
          name: 'Pointing Out & Recognition',
          duration: 'Moment of recognition, then ongoing',
          markers: ['Receiving transmission', 'Recognizing rigpa', 'First glimpse of nature of mind'],
          techniques: ['Following pointing-out instructions', 'Resting in recognition', 'Working closely with teacher']
        },
        {
          level: 3,
          name: 'Stabilizing Recognition',
          duration: '3-10 years',
          markers: ['Can recognize rigpa more reliably', 'Maintaining in post-meditation', 'Seeing arising thoughts as display'],
          techniques: ['Trekchö practice', 'Integration practice', 'Retreat practice']
        },
        {
          level: 4,
          name: 'Tögal Practice',
          duration: '5+ years after recognition',
          markers: ['Stable Trekchö', 'Receiving Tögal transmission', 'Vision practices'],
          techniques: ['Tögal with physical postures', 'Dark retreat', 'Advanced practices']
        },
        {
          level: 5,
          name: 'Realization',
          duration: 'Lifetime/multiple lifetimes',
          markers: ['Complete stabilization', 'Rainbow body signs', 'Full realization'],
          techniques: ['Effortless presence', 'All activities as practice', 'Benefiting beings']
        }
      ]
    },

    resources: {
      books: [
        { title: 'The Crystal and the Way of Light', author: 'Namkhai Norbu', type: 'book', level: 'Introduction to Dzogchen' },
        { title: 'Rainbow Painting', author: 'Tulku Urgyen Rinpoche', type: 'book', level: 'Pointing-out instructions' },
        { title: 'The Joy of Living', author: 'Yongey Mingyur Rinpoche', type: 'book', level: 'Modern accessible approach' }
      ],
      retreats: ['Dzogchen monasteries', 'Teaching events with qualified lamas', 'Tergar Centers'],
      teachers: ['Mingyur Rinpoche', 'Tsoknyi Rinpoche', 'Anam Thubten', 'Lama Lena']
    },

    considerations: {
      pros: [
        'Most direct path - recognition rather than gradual development',
        'Profound teachings on nature of reality',
        'Emphasis on effortlessness',
        'Integration with all of life'
      ],
      cons: [
        'Requires qualified teacher and transmission',
        'Extensive preliminary practices needed',
        'Easy to delude oneself about recognition',
        'Can lead to spiritual bypassing if misunderstood'
      ],
      whoItsFor: 'Those committed to traditional Tibetan Buddhism. People who resonate with non-dual teachings. Those willing to do preliminary practices and work closely with a teacher.',
      warnings: [
        'Not a DIY practice - requires authentic transmission',
        'Preliminary practices are essential foundation',
        'Easy to confuse conceptual understanding with recognition',
        'Risk of bypassing developmental work'
      ]
    },

    tags: {
      approach: ['non-dual'],
      structure: 'moderately-structured',
      difficultyLevel: 'advanced',
      timeToResults: 'long-term',
      culturalContext: 'buddhist',
      teacherRequired: true,
      retreatFriendly: true
    }
  },

  tm: {
    id: 'tm',
    name: 'Transcendental Meditation (TM)',
    tradition: 'Vedic/Hindu (modern adaptation)',

    origins: {
      history: 'Brought to the West by Maharishi Mahesh Yogi in the 1950s-60s. Based on ancient Vedic meditation traditions but standardized into a specific technique. Gained massive popularity in the 1960s-70s with celebrity practitioners (Beatles, etc.).',
      geography: 'India (Vedic origins), now practiced worldwide with centers in most countries',
      keyFigures: ['Maharishi Mahesh Yogi', 'Bob Roth', 'David Lynch (advocate)']
    },

    overview: {
      description: 'Mantra-based meditation using a personalized sound (mantra) given by certified TM teacher. Practice 20 minutes twice daily while sitting comfortably with eyes closed. The mantra is repeated mentally without effort, allowing the mind to settle into "pure consciousness."',
      philosophy: 'The mind naturally seeks more fulfilling states. By using the mantra as a vehicle, the mind settles down to quieter levels until reaching "pure consciousness" or "transcendental consciousness" - a state of restful alertness beyond thought.',
      goals: [
        'Experience transcendental consciousness regularly',
        'Reduce stress and anxiety',
        'Improve cognitive function and creativity',
        'Develop higher states of consciousness over time'
      ]
    },

    research: {
      studies: [
        {
          title: 'Transcendental meditation reduces stress and anxiety',
          journal: 'Journal of Alternative and Complementary Medicine',
          year: 2019,
          findings: 'Meta-analysis showing significant reductions in anxiety, depression, and anger'
        },
        {
          title: 'TM and cardiovascular health',
          journal: 'American Journal of Cardiology',
          year: 2015,
          findings: '48% reduction in risk of heart attack, stroke, and mortality in high-risk patients'
        },
        {
          title: 'Default mode network changes with TM',
          journal: 'Brain and Cognition',
          year: 2017,
          findings: 'Increased EEG coherence and default mode network integration'
        }
      ],
      benefits: {
        cognitive: ['Improved focus and attention', 'Enhanced creativity', 'Better decision-making', 'Reduced rumination'],
        emotional: ['Significant stress reduction', 'Lower anxiety and depression', 'Improved emotional stability', 'Better mood'],
        physical: ['Lower blood pressure', 'Improved cardiovascular health', 'Better sleep', 'Reduced cortisol'],
        evidenceQuality: 'strong'
      }
    },

    practice: {
      coreTechnique: 'Sit comfortably with eyes closed. Silently repeat the personalized mantra given by your TM teacher. When you notice you\'ve stopped repeating the mantra (mind has wandered), gently return to it. No effort, no concentration - allow the process to be effortless.',
      sessionStructure: {
        beginner: '20 minutes twice daily (morning and evening). Learn proper technique from certified teacher over 4 consecutive days.',
        intermediate: 'Continue 20 minutes twice daily. Attend group meditations and checking sessions. Notice cumulative benefits.',
        advanced: 'Same practice, but may add advanced TM-Sidhi program. Long-term practice (years) leads to development of higher consciousness states.'
      },
      instructions: [
        'Receive personal mantra from certified TM teacher (required)',
        'Sit comfortably with eyes closed',
        'Think the mantra silently, effortlessly',
        'When you notice thoughts, gently return to mantra',
        'Don\'t try to concentrate or control thoughts',
        'After 20 minutes, sit quietly for 2-3 minutes before opening eyes',
        'Practice twice daily (morning and evening)',
        'Attend follow-up sessions and checking as needed'
      ]
    },

    progression: {
      milestones: [
        {
          level: 1,
          name: 'Learning TM',
          duration: '4 days',
          markers: ['Received personal mantra', 'Learned basic technique', 'Experiencing settling'],
          techniques: ['Initial 4-day course', 'Personal instruction', 'First experiences of transcending']
        },
        {
          level: 2,
          name: 'Establishing Practice',
          duration: '1-3 months',
          markers: ['Regular twice-daily practice', 'Noticing stress reduction', 'More transcending experiences'],
          techniques: ['20-min twice daily', 'Follow-up checking', 'Group meditations']
        },
        {
          level: 3,
          name: 'Deepening Benefits',
          duration: '3-12 months',
          markers: ['Cumulative stress reduction', 'Improved clarity', 'Better sleep', 'Emotional stability'],
          techniques: ['Consistent practice', 'Occasional checking', 'Possible residence course']
        },
        {
          level: 4,
          name: 'Long-term Practice',
          duration: '1-5 years',
          markers: ['Deeply ingrained habit', 'Significant life improvements', 'Possibly learning TM-Sidhi'],
          techniques: ['Ongoing practice', 'TM-Sidhi program option', 'Advanced courses']
        },
        {
          level: 5,
          name: 'Higher Consciousness',
          duration: '5+ years',
          markers: ['Development of cosmic consciousness', 'Witness state in sleep', 'Unity consciousness (advanced)'],
          techniques: ['Continued practice', 'Advanced programs', 'Contributing to world peace efforts']
        }
      ]
    },

    resources: {
      books: [
        { title: 'Strength in Stillness', author: 'Bob Roth', type: 'book', level: 'Modern introduction' },
        { title: 'Science of Being and Art of Living', author: 'Maharishi Mahesh Yogi', type: 'book', level: 'Original teachings' },
        { title: 'Catching the Big Fish', author: 'David Lynch', type: 'book', level: 'Personal account' }
      ],
      retreats: ['TM Centers worldwide', 'Maharishi University of Management', 'Residence courses at TM centers'],
      teachers: ['Find certified teacher at tm.org - personal instruction required']
    },

    considerations: {
      pros: [
        'Extremely well-researched (700+ studies)',
        'Simple, effortless technique',
        'Consistent, reliable results',
        'Strong organizational support and checking'
      ],
      cons: [
        'Expensive course fee ($1,000+)',
        'Must learn from certified teacher (can\'t learn from book)',
        'Somewhat cult-like organizational structure',
        'Claims sometimes overstated'
      ],
      whoItsFor: 'Busy professionals wanting evidence-based stress reduction. People who want a simple, standardized technique. Those willing to pay for professional instruction.',
      warnings: [
        'High cost may be prohibitive',
        'Organization has controversial history',
        'Not a substitute for therapy or medical care',
        'Some people find it boring or too simple'
      ]
    },

    tags: {
      approach: ['mantra', 'concentration'],
      structure: 'highly-structured',
      difficultyLevel: 'beginner-friendly',
      timeToResults: 'quick',
      culturalContext: 'hindu',
      teacherRequired: true,
      retreatFriendly: false
    }
  },

  mantra: {
    id: 'mantra',
    name: 'Mantra Meditation (Japa)',
    tradition: 'Hindu/Vedic',

    origins: {
      history: 'One of the oldest meditation practices, dating back thousands of years in Hindu and Vedic traditions. Mantra practice appears in the Vedas, Upanishads, and Yoga Sutras. Used across many traditions including Buddhism, Jainism, and Sikhism.',
      geography: 'India, Tibet, Nepal, now practiced worldwide',
      keyFigures: ['Patanjali', 'Ramakrishna', 'Ramana Maharshi', 'Neem Karoli Baba', 'Amma (Mata Amritanandamayi)']
    },

    overview: {
      description: 'Repetition of a sacred sound, word, or phrase (mantra) to focus the mind and invoke spiritual qualities. Can be practiced silently (mental), whispered, or chanted aloud. Often uses mala beads (108 beads) to count repetitions.',
      philosophy: 'Mantras are sound vibrations that have spiritual potency. Repetition purifies the mind, invokes divine qualities, and can lead to realization. The sound itself has power beyond its meaning. Through constant repetition, the mantra works on subtle levels.',
      goals: [
        'Purify and concentrate the mind',
        'Invoke divine qualities or deities',
        'Develop devotion (bhakti)',
        'Achieve mantra siddhi (perfection) through extended practice'
      ]
    },

    research: {
      studies: [
        {
          title: 'Effects of mantra repetition on mind wandering',
          journal: 'International Journal of Yoga',
          year: 2016,
          findings: 'Mantra repetition significantly reduced mind-wandering compared to control group'
        },
        {
          title: 'Neurological effects of Om chanting',
          journal: 'International Journal of Yoga',
          year: 2011,
          findings: 'Om chanting deactivated limbic system, associated with deep relaxation'
        }
      ],
      benefits: {
        cognitive: ['Improved focus', 'Reduced mind-wandering', 'Enhanced concentration'],
        emotional: ['Devotional feelings', 'Emotional calm', 'Reduced anxiety', 'Connection to sacred'],
        physical: ['Relaxation response', 'Rhythmic breathing benefit', 'Stress reduction'],
        evidenceQuality: 'moderate'
      }
    },

    practice: {
      coreTechnique: 'Choose a mantra (traditional like "Om," "Om Namah Shivaya," "So Hum," or given by teacher). Repeat it continuously, either silently in the mind, whispered, or chanted. Can count on mala beads. Bring attention back when mind wanders.',
      sessionStructure: {
        beginner: '10-20 minutes or 1 mala (108 repetitions). Can be spoken aloud or silently. Learning to coordinate with breath.',
        intermediate: '20-40 minutes or multiple malas. Silent repetition. Mantra becomes continuous background. Developing devotion.',
        advanced: '1+ hours or thousands of repetitions. Continuous practice (likhita japa - writing, japa walk). Mantra becomes spontaneous.'
      },
      commonObjects: ['Om (universal sound)', 'Om Namah Shivaya (Shiva)', 'Om Mani Padme Hum (Avalokiteshvara)', 'Hare Krishna', 'So Hum (I am That)', 'Gayatri Mantra'],
      instructions: [
        'Choose appropriate mantra (traditional, from teacher, or personal)',
        'Sit comfortably or can practice while walking',
        'Hold mala beads if using (optional)',
        'Begin repeating the mantra (aloud, whispered, or silently)',
        'Coordinate with breath if helpful (half mantra on inhale, half on exhale)',
        'When mind wanders, return to mantra',
        'Continue for set time or number of repetitions',
        'Let mantra become effortless and continuous'
      ]
    },

    progression: {
      milestones: [
        {
          level: 1,
          name: 'Beginning Practice',
          duration: '1-2 months',
          markers: ['Learning to repeat consistently', 'Finding comfortable rhythm', 'Completing daily practice'],
          techniques: ['Loud or whispered repetition', 'Counting on mala', 'Short sessions']
        },
        {
          level: 2,
          name: 'Mental Repetition',
          duration: '2-6 months',
          markers: ['Silent mental japa', 'Less distraction', 'Mantra becoming natural'],
          techniques: ['Silent repetition', 'Longer sessions', 'Coordinate with breath']
        },
        {
          level: 3,
          name: 'Continuous Japa',
          duration: '6-18 months',
          markers: ['Mantra continues in background during day', 'Deep concentration', 'Devotional feelings'],
          techniques: ['Extended practice', 'Japa while walking/working', 'Multiple malas daily']
        },
        {
          level: 4,
          name: 'Ajapa Japa',
          duration: '1-3 years',
          markers: ['Mantra continues spontaneously', 'No effort needed', 'Present even in sleep'],
          techniques: ['Effortless practice', 'Mantra merges with breath', 'Constant remembrance']
        },
        {
          level: 5,
          name: 'Mantra Siddhi',
          duration: '3+ years or 125,000+ repetitions',
          markers: ['Complete absorption in mantra', 'Realization of mantra deity/quality', 'Transformation of consciousness'],
          techniques: ['Advanced practices', 'Purashcharana (intensive completion)', 'Transmission of mantra to others']
        }
      ]
    },

    resources: {
      books: [
        { title: 'Japa Yoga', author: 'Swami Sivananda', type: 'book', level: 'Comprehensive traditional guide' },
        { title: 'The Power of Mantra', author: 'Lama Zopa Rinpoche', type: 'book', level: 'Buddhist perspective' },
        { title: 'Healing Mantras', author: 'Thomas Ashley-Farrand', type: 'book', level: 'Practical modern approach' }
      ],
      apps: ['Insight Timer', 'Sattva'],
      retreats: ['Amma\'s ashrams', 'Sivananda centers', 'Kripalu Center'],
      teachers: ['Amma (Mata Amritanandamayi)', 'Various Hindu teachers', 'Siddha Yoga teachers']
    },

    considerations: {
      pros: [
        'Simple and portable - can practice anywhere',
        'Works well with devotional temperament',
        'Can be integrated into daily activities',
        'Rich traditional support and lineages'
      ],
      cons: [
        'Can become mechanical/rote',
        'May not suit non-devotional personalities',
        'Progress can be hard to measure',
        'Requires faith in mantra efficacy'
      ],
      whoItsFor: 'Those with devotional inclinations. People who like repetitive practices. Those drawn to sound and vibration. Good for busy people (can practice anywhere).',
      warnings: [
        'Can become mindless repetition',
        'Some mantras require initiation',
        'Not a quick fix - requires dedication',
        'Balance with awareness practices'
      ]
    },

    tags: {
      approach: ['mantra', 'concentration'],
      structure: 'moderately-structured',
      difficultyLevel: 'beginner-friendly',
      timeToResults: 'moderate',
      culturalContext: 'hindu',
      teacherRequired: false,
      retreatFriendly: true
    }
  },

  yogaNidra: {
    id: 'yogaNidra',
    name: 'Yoga Nidra (Yogic Sleep)',
    tradition: 'Hindu/Yogic',

    origins: {
      history: 'Ancient practice mentioned in Upanishads and Tantric texts, modernized by Swami Satyananda Saraswati in the mid-20th century. Creates a state between waking and sleeping while maintaining awareness.',
      geography: 'India, now practiced worldwide',
      keyFigures: ['Swami Satyananda Saraswati', 'Richard Miller (iRest)', 'Rod Stryker', 'Kamini Desai']
    },

    overview: {
      description: 'Guided meditation practiced lying down in savasana (corpse pose). Systematically rotates attention through body parts, breath, sensations, emotions, and visualizations, inducing deep relaxation while maintaining awareness. Often includes sankalpa (intention setting).',
      philosophy: 'By accessing the hypnagogic state between waking and sleep, Yoga Nidra allows access to deeper layers of consciousness and the subconscious mind. Deep relaxation is the foundation for transformation. One hour of Yoga Nidra can equal 4 hours of deep sleep.',
      goals: [
        'Achieve profound physical and mental relaxation',
        'Access subconscious mind for healing',
        'Plant sankalpa (positive resolve)',
        'Reduce stress and trauma',
        'Experience consciousness beyond waking state'
      ]
    },

    research: {
      studies: [
        {
          title: 'Yoga Nidra for PTSD in military veterans',
          journal: 'Journal of Traumatic Stress',
          year: 2019,
          findings: 'Significant reduction in PTSD symptoms, anxiety, and improved sleep quality'
        },
        {
          title: 'Effect of Yoga Nidra on stress and wellbeing',
          journal: 'International Journal of Yoga Therapy',
          year: 2020,
          findings: 'Reduced stress markers, improved sleep, and enhanced wellbeing after 8 weeks'
        }
      ],
      benefits: {
        cognitive: ['Deep mental rest', 'Enhanced creativity', 'Subconscious reprogramming', 'Improved sleep quality'],
        emotional: ['Profound relaxation', 'Trauma processing', 'Emotional release', 'Reduced anxiety'],
        physical: ['Deep physical relaxation', 'Pain reduction', 'Improved sleep', 'Lowered blood pressure'],
        evidenceQuality: 'strong'
      }
    },

    practice: {
      coreTechnique: 'Lie in savasana (flat on back, arms at sides, palms up). Follow guided instructions that rotate awareness through body parts (body scan), breath awareness, opposite sensations (hot/cold), emotions, and visualizations. Stay awake and aware throughout.',
      sessionStructure: {
        beginner: '20-30 minute guided session. May fall asleep initially. Learning to maintain awareness while deeply relaxed.',
        intermediate: '30-45 minutes. Staying awake throughout. Working with sankalpa. Noticing deeper layers of consciousness.',
        advanced: '45-60 minutes. Self-guided practice possible. Deep access to subconscious. Using for specific healing or insight.'
      },
      instructions: [
        'Lie in savasana, make yourself completely comfortable',
        'Set sankalpa (short positive intention) if using',
        'Follow guided rotation of consciousness through body',
        'Observe sensations without judging or moving',
        'Move through breath awareness, opposites, emotions, visualizations',
        'Maintain thread of awareness - don\'t fall asleep',
        'Repeat sankalpa at end',
        'Slowly return to waking awareness'
      ]
    },

    progression: {
      milestones: [
        {
          level: 1,
          name: 'Learning to Stay Awake',
          duration: '1-2 months',
          markers: ['Can stay awake most of the time', 'Following instructions', 'Experiencing deep relaxation'],
          techniques: ['Guided recordings', 'Short sessions', 'Regular practice time']
        },
        {
          level: 2,
          name: 'Deepening Awareness',
          duration: '2-6 months',
          markers: ['Consistently awake', 'Deeper relaxation states', 'Body scan more vivid'],
          techniques: ['Longer sessions', 'Working with sankalpa', 'Different scripts/teachers']
        },
        {
          level: 3,
          name: 'Subconscious Access',
          duration: '6-12 months',
          markers: ['Accessing deeper consciousness', 'Emotional releases', 'Vivid visualizations', 'Healing occurring'],
          techniques: ['Therapeutic yoga nidra', 'Personal sankalpa work', 'Processing trauma']
        },
        {
          level: 4,
          name: 'Advanced Practice',
          duration: '1+ year',
          markers: ['Can self-guide', 'Accessing samadhi states', 'Using for specific purposes'],
          techniques: ['Self-guided practice', 'Creating own scripts', 'Teaching others']
        }
      ]
    },

    resources: {
      books: [
        { title: 'Yoga Nidra', author: 'Swami Satyananda Saraswati', type: 'book', level: 'Original modern text' },
        { title: 'The iRest Program for Healing PTSD', author: 'Richard Miller', type: 'book', level: 'Therapeutic approach' },
        { title: 'Yoga Nidra for Complete Relaxation', author: 'Julie Lusk', type: 'book', level: 'Practical guide' }
      ],
      apps: ['Insight Timer (many Yoga Nidra recordings)', 'Yoga Nidra Now', 'iRest app'],
      retreats: ['Bihar School of Yoga', 'Kripalu Center', 'Local yoga studios'],
      teachers: ['Richard Miller', 'Rod Stryker', 'Kamini Desai', 'many recordings available']
    },

    considerations: {
      pros: [
        'Extremely relaxing and restorative',
        'Accessible - can be practiced by anyone',
        'Effective for trauma and PTSD',
        'Improves sleep quality',
        'Can be practiced lying down (accessible for injuries)'
      ],
      cons: [
        'Easy to fall asleep',
        'Requires recording or teacher initially',
        'Less clear markers of "progress"',
        'Not as portable as sitting practices'
      ],
      whoItsFor: 'People dealing with stress, trauma, or sleep issues. Those who struggle with sitting meditation. Anyone needing deep rest. Good entry point for meditation skeptics.',
      warnings: [
        'Not a substitute for sleep',
        'May bring up suppressed emotions',
        'Trauma processing may require therapeutic support',
        'Should stay awake - practice at appropriate times'
      ]
    },

    tags: {
      approach: ['body'],
      structure: 'highly-structured',
      difficultyLevel: 'beginner-friendly',
      timeToResults: 'quick',
      culturalContext: 'hindu',
      teacherRequired: false,
      retreatFriendly: true
    }
  },

  selfInquiry: {
    id: 'selfInquiry',
    name: 'Self-Inquiry (Atma Vichara)',
    tradition: 'Advaita Vedanta (Hindu)',

    origins: {
      history: 'While self-inquiry appears in ancient Advaita Vedanta texts, it was most famously taught by Ramana Maharshi (1879-1950) at Arunachala. Ramana presented it as the most direct path to Self-realization.',
      geography: 'India (Tiruvannamalai), now taught worldwide',
      keyFigures: ['Ramana Maharshi', 'Nisargadatta Maharaj', 'Mooji', 'Rupert Spira', 'Francis Lucille']
    },

    overview: {
      description: 'Inquiry into the question "Who am I?" by turning attention back toward the sense of "I" or self. Rather than focusing on an external object, attention investigates the subject itself - the one who is aware. This leads to recognition of awareness as one\'s true nature.',
      philosophy: 'The separate self (ego) is an illusion. By investigating "Who am I?" the false identification with body-mind falls away, revealing the true Self (Atman) which is identical with ultimate reality (Brahman). This is direct realization, not a gradual attainment.',
      goals: [
        'Realize true nature as pure awareness/Self',
        'See through the illusion of separate self',
        'Abide as Self/awareness',
        'Liberation (moksha) from identification with body-mind'
      ]
    },

    research: {
      studies: [
        {
          title: 'Self-inquiry and sense of self',
          journal: 'Journal of Consciousness Studies',
          year: 2018,
          findings: 'Practitioners reported decreased identification with thoughts and increased sense of spacious awareness'
        }
      ],
      benefits: {
        cognitive: ['Freedom from identification with thoughts', 'Direct knowing of awareness', 'Reduced rumination'],
        emotional: ['Liberation from psychological suffering', 'Profound peace', 'Freedom from fear'],
        physical: ['Reduced stress response', 'Relaxation as false identity loosens'],
        evidenceQuality: 'limited'
      }
    },

    practice: {
      coreTechnique: 'Turn attention toward the sense of "I" - the feeling of being a self. Ask "Who am I?" or "To whom do these thoughts arise?" Whenever you get an answer, inquire into who is having that answer. Return attention to the sense of "I" itself, the subject rather than any object.',
      sessionStructure: {
        beginner: '15-20 minutes. Learning to turn attention toward subject. Noticing tendency to get caught in content.',
        intermediate: '30-45 minutes. Sustained inquiry. Beginning to glimpse awareness as true nature. Recognizing "I am" distinct from objects.',
        advanced: '1+ hours or continuous. Abiding as Self. Self-inquiry becomes spontaneous. Recognition stable.'
      },
      instructions: [
        'Sit quietly and turn attention inward',
        'Notice the sense of "I" - the feeling of being someone',
        'Ask "Who am I?" or "What is this I?"',
        'Don\'t accept conceptual answers - keep inquiring',
        'When thoughts arise, ask "To whom do these thoughts come?"',
        'Return attention to the "I-thought" or sense of being',
        'Rest as awareness itself, prior to the "I" concept',
        'Let the inquiry become natural and continuous'
      ]
    },

    progression: {
      milestones: [
        {
          level: 1,
          name: 'Understanding the Practice',
          duration: '1-3 months',
          markers: ['Understanding how to inquire', 'Recognizing tendency to get lost in content', 'Brief glimpses of the subject'],
          techniques: ['Study Ramana\'s teachings', 'Practicing with reminders', 'Short inquiry sessions']
        },
        {
          level: 2,
          name: 'Sustained Inquiry',
          duration: '3-12 months',
          markers: ['Can sustain inquiry for longer periods', 'Recognizing "I am" distinct from thoughts', 'Less identification with content'],
          techniques: ['Regular sitting practice', 'Inquiry during daily life', 'Satsang with teacher']
        },
        {
          level: 3,
          name: 'Recognition',
          duration: '1-3 years',
          markers: ['Direct recognition of awareness', 'Seeing through separate self', 'Understanding "I am not the body-mind"'],
          techniques: ['Deepening inquiry', 'Retreat practice', 'Stabilizing recognition']
        },
        {
          level: 4,
          name: 'Abidance',
          duration: '3+ years',
          markers: ['Abiding as Self naturally', 'Inquiry becomes effortless', 'Peace is stable'],
          techniques: ['Continuous inquiry/remembrance', 'Inquiry in all activities', 'Supporting others']
        },
        {
          level: 5,
          name: 'Self-Realization',
          duration: 'Variable/grace',
          markers: ['Complete identification with Self', 'Liberation from suffering', 'Sahaja samadhi (natural state)'],
          techniques: ['Living as Self', 'No separation between practice and life', 'Spontaneous teaching']
        }
      ]
    },

    resources: {
      books: [
        { title: 'Be As You Are', author: 'David Godman (teachings of Ramana)', type: 'book', level: 'Essential compilation' },
        { title: 'I Am That', author: 'Nisargadatta Maharaj', type: 'book', level: 'Dialogues on non-duality' },
        { title: 'The Direct Path', author: 'Greg Goode', type: 'book', level: 'Modern practical guide' }
      ],
      retreats: ['Arunachala (Ramana Maharshi\'s home)', 'Mooji\'s Monte Sahaja', 'Various satsang gatherings'],
      teachers: ['Mooji', 'Rupert Spira', 'Francis Lucille', 'Greg Goode', 'Ramana Maharshi (through books)']
    },

    considerations: {
      pros: [
        'Most direct path to realization',
        'No complex techniques or prerequisites',
        'Addresses root of suffering directly',
        'Can be practiced in any moment'
      ],
      cons: [
        'Can be confusing/frustrating initially',
        'Easy to turn into intellectual exercise',
        'Less externally validatable progress',
        'Requires strong motivation for truth'
      ],
      whoItsFor: 'Those asking fundamental existential questions. People interested in non-dual realization. Those willing to question everything, including their identity.',
      warnings: [
        'Not a technique - more like un-learning',
        'Can lead to disorientation if not properly understood',
        'Requires maturity and psychological stability',
        'May not address developmental or emotional needs'
      ]
    },

    tags: {
      approach: ['inquiry', 'non-dual'],
      structure: 'minimally-structured',
      difficultyLevel: 'advanced',
      timeToResults: 'long-term',
      culturalContext: 'hindu',
      teacherRequired: false,
      retreatFriendly: true
    }
  },

  mbsr: {
    id: 'mbsr',
    name: 'MBSR (Mindfulness-Based Stress Reduction)',
    tradition: 'Secular/Clinical (Buddhist roots)',

    origins: {
      history: 'Developed by Jon Kabat-Zinn in 1979 at University of Massachusetts Medical Center. Adapted Buddhist mindfulness practices into a secular, evidence-based 8-week program for stress and pain management.',
      geography: 'Originated in USA, now taught worldwide in medical and corporate settings',
      keyFigures: ['Jon Kabat-Zinn', 'Saki Santorelli', 'Bob Stahl', 'Elisha Goldstein']
    },

    overview: {
      description: 'Standardized 8-week program combining sitting meditation, body scan, mindful yoga, and psychoeducation. Teaches present-moment awareness without judgment as a tool for managing stress, pain, and difficult emotions. Secular and evidence-based.',
      philosophy: 'Stress and suffering are exacerbated by our reactions and judgments. By cultivating present-moment awareness and non-judgmental acceptance, we can change our relationship to difficult experiences. Mindfulness allows us to respond rather than react.',
      goals: [
        'Reduce stress and improve stress management',
        'Manage chronic pain',
        'Develop present-moment awareness',
        'Improve emotional regulation and wellbeing'
      ]
    },

    research: {
      studies: [
        {
          title: 'MBSR reduces anxiety and depression',
          journal: 'Journal of Psychosomatic Research',
          year: 2013,
          findings: 'Meta-analysis showed moderate effects for anxiety, depression, and stress across 209 studies'
        },
        {
          title: 'MBSR changes brain structure',
          journal: 'Psychiatry Research: Neuroimaging',
          year: 2011,
          findings: 'Increased gray matter density in hippocampus and other regions after 8-week program'
        },
        {
          title: 'MBSR for chronic pain',
          journal: 'The Journal of Behavioral Medicine',
          year: 2016,
          findings: 'Significant reduction in pain intensity and pain-related distress'
        }
      ],
      benefits: {
        cognitive: ['Improved attention', 'Better emotional regulation', 'Reduced rumination', 'Enhanced self-awareness'],
        emotional: ['Reduced anxiety and depression', 'Improved mood', 'Better stress management', 'Increased resilience'],
        physical: ['Chronic pain management', 'Improved sleep', 'Lowered blood pressure', 'Enhanced immune function'],
        evidenceQuality: 'strong'
      }
    },

    practice: {
      coreTechnique: '8-week structured program with three main practices: 1) Body scan - systematic attention through body regions, 2) Sitting meditation - awareness of breath, body, thoughts, emotions, 3) Mindful yoga - gentle movement with awareness. Plus informal mindfulness in daily activities.',
      sessionStructure: {
        beginner: 'Week 1-2: Learning body scan (20-45 min) and basic sitting (10-20 min). Daily practice assignments.',
        intermediate: 'Week 3-6: Sitting meditation increases to 30-45 min. Adding mindful yoga. Exploring difficulties mindfully.',
        advanced: 'Week 7-8: 45-minute sits, full yoga practice. All-day silent retreat. Developing sustainable personal practice.'
      },
      instructions: [
        'Enroll in 8-week MBSR program (in-person or online)',
        'Attend weekly 2.5-hour classes',
        'Practice daily: 45 minutes formal practice (body scan, sitting, yoga)',
        'Integrate informal mindfulness (eating, walking, daily activities)',
        'Participate in all-day silent retreat (Day 6)',
        'Complete weekly readings and exercises',
        'Track practice and observations in journal',
        'After 8 weeks, maintain personal practice'
      ]
    },

    progression: {
      milestones: [
        {
          level: 1,
          name: 'Weeks 1-2: Foundation',
          duration: '2 weeks',
          markers: ['Learning body scan', 'Establishing daily practice', 'Noticing automatic pilot'],
          techniques: ['Body scan (45 min)', 'Sitting meditation (10 min)', 'Informal mindfulness']
        },
        {
          level: 2,
          name: 'Weeks 3-4: Deepening',
          duration: '2 weeks',
          markers: ['Sitting meditation lengthening', 'Noticing stress reactions', 'Exploring pleasant/unpleasant'],
          techniques: ['Body scan', 'Sitting (20-30 min)', 'Mindful yoga introduced']
        },
        {
          level: 3,
          name: 'Weeks 5-6: Integration',
          duration: '2 weeks',
          markers: ['Responding vs reacting', 'Working with difficult emotions', 'All-day retreat'],
          techniques: ['Sitting (30-45 min)', 'Yoga', 'Loving-kindness', 'Day of mindfulness']
        },
        {
          level: 4,
          name: 'Weeks 7-8: Sustainability',
          duration: '2 weeks',
          markers: ['Developing personal practice plan', 'Integrating into life', 'Relapse prevention'],
          techniques: ['Self-directed practice', 'Mindful communication', 'Creating ongoing plan']
        },
        {
          level: 5,
          name: 'Post-Program',
          duration: 'Ongoing',
          markers: ['Maintaining daily practice', 'Mindfulness becoming natural', 'Sustained benefits'],
          techniques: ['Personal practice routine', 'Booster classes', 'Continued learning']
        }
      ]
    },

    resources: {
      books: [
        { title: 'Full Catastrophe Living', author: 'Jon Kabat-Zinn', type: 'book', level: 'Original MBSR book' },
        { title: 'Wherever You Go, There You Are', author: 'Jon Kabat-Zinn', type: 'book', level: 'Mindfulness in daily life' },
        { title: 'A Mindfulness-Based Stress Reduction Workbook', author: 'Bob Stahl & Elisha Goldstein', type: 'book', level: 'Practical workbook' }
      ],
      apps: ['Calm (MBSR content)', 'Palouse Mindfulness (free online MBSR)'],
      retreats: ['Center for Mindfulness (UMass)', 'MBSR trainings worldwide', 'One-day MBSR intensives'],
      teachers: ['Find certified MBSR teacher at UMass Center for Mindfulness directory']
    },

    considerations: {
      pros: [
        'Evidence-based with extensive research',
        'Structured 8-week program',
        'Secular and accessible',
        'Widely available and insurance-covered',
        'Practical life applications'
      ],
      cons: [
        'Requires significant time commitment (45 min/day)',
        'Can be expensive',
        'Less emphasis on deep meditation states',
        'May strip out beneficial spiritual elements'
      ],
      whoItsFor: 'People dealing with stress, anxiety, chronic pain, or illness. Those wanting evidence-based, secular approach. Good for beginners wanting structure and support.',
      warnings: [
        'Not a replacement for medical or psychiatric treatment',
        'Can bring up difficult emotions',
        'Requires commitment - daily practice essential',
        'May not be suitable during acute psychiatric crisis'
      ]
    },

    tags: {
      approach: ['awareness', 'body'],
      structure: 'highly-structured',
      difficultyLevel: 'beginner-friendly',
      timeToResults: 'moderate',
      culturalContext: 'secular',
      teacherRequired: false,
      retreatFriendly: false
    }
  },

  openMonitoring: {
    id: 'openMonitoring',
    name: 'Open Monitoring Meditation',
    tradition: 'Secular/Research-based (Buddhist roots)',

    origins: {
      history: 'Derived from Buddhist vipassana and Zen practices, but formalized as a distinct category in contemplative neuroscience research. Contrasts with focused attention meditation in research studies.',
      geography: 'Practiced in various forms worldwide',
      keyFigures: ['Shinzen Young (noting practice)', 'Joseph Goldstein', 'Various neuroscience researchers']
    },

    overview: {
      description: 'Non-selective awareness practice where attention is not fixed on any particular object. Instead, you remain openly aware of whatever arises in experience - sounds, sensations, thoughts, emotions - without focusing or following. Also called choiceless awareness.',
      philosophy: 'By observing the field of experience without selection or preference, we develop meta-awareness and insight into the nature of mind. This non-selective awareness reveals the constantly changing nature of experience and reduces habitual reactivity.',
      goals: [
        'Develop panoramic, non-selective awareness',
        'Cultivate meta-cognition (awareness of awareness)',
        'Reduce reactive patterns',
        'Insight into the nature of mind and experience'
      ]
    },

    research: {
      studies: [
        {
          title: 'Focused attention vs open monitoring meditation',
          journal: 'Consciousness and Cognition',
          year: 2010,
          findings: 'Different brain networks activated: FA uses executive control, OM uses monitoring and awareness networks'
        },
        {
          title: 'Open monitoring meditation and creativity',
          journal: 'Frontiers in Psychology',
          year: 2012,
          findings: 'OM meditation enhanced divergent thinking and creative problem-solving'
        }
      ],
      benefits: {
        cognitive: ['Enhanced meta-awareness', 'Improved cognitive flexibility', 'Greater creativity', 'Reduced attentional bias'],
        emotional: ['Reduced reactivity', 'Better emotion regulation', 'Increased acceptance', 'Less judgmental'],
        physical: ['Relaxation', 'Stress reduction'],
        evidenceQuality: 'moderate'
      }
    },

    practice: {
      coreTechnique: 'Sit with relaxed awareness. Rather than focusing on a single object, remain openly aware of the entire field of experience. Notice whatever is most prominent - sounds, sensations, thoughts - without selecting or following. Let experiences arise and pass in awareness.',
      sessionStructure: {
        beginner: '10-15 minutes. May start with some focused attention, then open. Learning to not get caught in content.',
        intermediate: '20-40 minutes. More stable open awareness. Less getting lost in thoughts. Recognizing patterns.',
        advanced: '45-60+ minutes. Effortless panoramic awareness. Deep insight into nature of experience. Integration with life.'
      },
      instructions: [
        'Start with a few minutes of breath focus to settle',
        'Release focus on breath, open awareness to entire field',
        'Remain aware of whatever is most prominent',
        'Don\'t select or focus - let things come and go',
        'When you notice you\'ve been caught in thought, gently return to open awareness',
        'Observe how experiences arise, stay briefly, and pass',
        'Notice the space/awareness in which experiences occur',
        'Maintain effortless, panoramic awareness'
      ]
    },

    progression: {
      milestones: [
        {
          level: 1,
          name: 'Learning Open Awareness',
          duration: '1-3 months',
          markers: ['Understanding the approach', 'Brief periods of open awareness', 'Frequently getting caught in content'],
          techniques: ['Start with focused attention, then open', 'Short sessions', 'Gentle noting']
        },
        {
          level: 2,
          name: 'Stabilizing Awareness',
          duration: '3-9 months',
          markers: ['More sustained open awareness', 'Catching distractions quicker', 'Less getting lost'],
          techniques: ['Longer sessions', 'Less initial focus needed', 'Observing patterns']
        },
        {
          level: 3,
          name: 'Panoramic Awareness',
          duration: '9-18 months',
          markers: ['Effortless open awareness', 'Noticing subtle experiences', 'Insight into impermanence'],
          techniques: ['Extended practice', 'Minimal effort', 'Integration with daily life']
        },
        {
          level: 4,
          name: 'Meta-Awareness',
          duration: '18+ months',
          markers: ['Awareness aware of itself', 'Seeing all as process', 'Deep insights arising'],
          techniques: ['Continuous practice', 'All experiences as objects', 'Teaching others']
        }
      ]
    },

    resources: {
      books: [
        { title: 'The Science of Enlightenment', author: 'Shinzen Young', type: 'book', level: 'Comprehensive system including OM' },
        { title: 'Altered Traits', author: 'Daniel Goleman & Richard Davidson', type: 'book', level: 'Research on meditation types' },
        { title: 'The Mind Illuminated', author: 'Culadasa', type: 'book', level: 'Includes transition to open awareness' }
      ],
      apps: ['Waking Up (Sam Harris)', 'Shinzen Young\'s Unified Mindfulness'],
      teachers: ['Shinzen Young', 'Joseph Goldstein', 'Various insight meditation teachers']
    },

    considerations: {
      pros: [
        'Develops meta-cognitive awareness',
        'Enhances creativity and cognitive flexibility',
        'Less structured - more natural',
        'Good for insight practice'
      ],
      cons: [
        'Can be confusing initially',
        'Easy to space out or get lost',
        'Harder to instruct than focused practices',
        'Benefits may be less immediately obvious'
      ],
      whoItsFor: 'Those with some meditation experience. People interested in insight into mind. Those who find focused attention too narrow. Good for creative types.',
      warnings: [
        'Not recommended for complete beginners',
        'Can lead to spacing out if done incorrectly',
        'May need focused attention base first',
        'Requires some stability of attention'
      ]
    },

    tags: {
      approach: ['awareness'],
      structure: 'minimally-structured',
      difficultyLevel: 'intermediate',
      timeToResults: 'moderate',
      culturalContext: 'secular',
      teacherRequired: false,
      retreatFriendly: true
    }
  },

  breathwork: {
    id: 'breathwork',
    name: 'Breathwork (Conscious Breathing)',
    tradition: 'Mixed/Modern',
    subtypes: ['Box Breathing', '4-7-8 Breathing', 'Wim Hof Method', 'Holotropic Breathwork'],

    origins: {
      history: 'Various conscious breathing practices from yoga (pranayama), modern therapeutic breathwork (Holotropic, developed by Stanislav Grof in the 1970s), and performance optimization techniques (Wim Hof, box breathing used by Navy SEALs).',
      geography: 'Pranayama from India, modern techniques developed worldwide',
      keyFigures: ['Stanislav Grof (Holotropic)', 'Wim Hof', 'Patrick McKeown (Buteyko)', 'Various pranayama teachers']
    },

    overview: {
      description: 'Deliberate control or manipulation of breath patterns to achieve specific physical and mental states. Ranges from calming techniques (slow breathing, extended exhale) to activating techniques (rapid breathing, breath retention). Different patterns create different effects.',
      philosophy: 'Breath is the bridge between mind and body. By consciously changing breath patterns, we can directly influence nervous system, mental state, and even access non-ordinary states of consciousness. The breath is always available and immediately responsive.',
      goals: [
        'Rapid stress reduction and relaxation',
        'Nervous system regulation',
        'Increased energy and focus',
        'Access to non-ordinary states (holotropic)',
        'Performance optimization'
      ]
    },

    research: {
      studies: [
        {
          title: 'Slow breathing and cardiovascular health',
          journal: 'Hypertension',
          year: 2019,
          findings: 'Device-guided slow breathing reduced blood pressure in hypertensive patients'
        },
        {
          title: 'Wim Hof Method and immune response',
          journal: 'Proceedings of the National Academy of Sciences',
          year: 2014,
          findings: 'Controlled breathing techniques voluntarily influenced autonomic nervous system and immune response'
        },
        {
          title: '4-7-8 breathing for anxiety',
          journal: 'Journal of Clinical Psychology',
          year: 2020,
          findings: 'Significant reduction in anxiety after 6 weeks of practice'
        }
      ],
      benefits: {
        cognitive: ['Rapid state change', 'Improved focus', 'Better stress management', 'Enhanced performance'],
        emotional: ['Reduced anxiety quickly', 'Emotional release', 'Mood improvement', 'Better emotional regulation'],
        physical: ['Lowered heart rate and blood pressure', 'Improved HRV', 'Enhanced immune function', 'Better sleep', 'Increased energy'],
        evidenceQuality: 'strong'
      }
    },

    practice: {
      coreTechnique: 'Various techniques: 1) Box Breathing - 4 count inhale, hold, exhale, hold. 2) 4-7-8 - Inhale 4, hold 7, exhale 8. 3) Wim Hof - 30-40 rapid breaths, exhale and hold. 4) Holotropic - Fast deep breathing for extended period. Choose based on desired effect.',
      sessionStructure: {
        beginner: 'Simple techniques like box breathing or 4-7-8. 5-10 minutes. Focus on technique mastery.',
        intermediate: 'Extended practices (15-20 min). Experimenting with different patterns. Wim Hof method. Noticing effects.',
        advanced: 'Holotropic breathwork sessions (1-3 hours). Pranayama practices. Using breath for specific purposes. Teaching others.'
      },
      commonObjects: [
        'Box Breathing - 4-4-4-4 pattern (equal counts)',
        '4-7-8 Breathing - calming, sleep',
        'Coherent Breathing - 5-6 breaths/min',
        'Wim Hof - energy, immune, cold tolerance',
        'Holotropic - therapeutic, non-ordinary states',
        'Kapalabhati - energizing pranayama'
      ],
      instructions: [
        'Choose appropriate technique for desired effect',
        'Find comfortable seated or lying position',
        'Bring awareness to natural breath first',
        'Begin technique - count breaths or use timer',
        'Maintain attention on breathing pattern',
        'Notice physical sensations and mental states',
        'For calming: emphasize slow, extended exhale',
        'For energy: faster, deeper breathing with retention',
        'Always return to normal breathing gradually'
      ]
    },

    progression: {
      milestones: [
        {
          level: 1,
          name: 'Basic Techniques',
          duration: '1-4 weeks',
          markers: ['Learning 2-3 basic techniques', 'Can execute patterns correctly', 'Noticing effects'],
          techniques: ['Box breathing', '4-7-8 breathing', 'Simple counted breathing']
        },
        {
          level: 2,
          name: 'Consistent Practice',
          duration: '1-3 months',
          markers: ['Daily practice habit', 'Techniques become natural', 'Using for stress management'],
          techniques: ['Expanding repertoire', 'Different techniques for different situations', 'Tracking effects']
        },
        {
          level: 3,
          name: 'Advanced Techniques',
          duration: '3-12 months',
          markers: ['Learning pranayama or Wim Hof', 'Longer sessions', 'Measurable improvements (HRV, etc.)'],
          techniques: ['Wim Hof Method', 'Pranayama varieties', 'Cold exposure integration']
        },
        {
          level: 4,
          name: 'Expert Practice',
          duration: '1+ year',
          markers: ['Mastery of multiple methods', 'Using therapeutically', 'Teaching or facilitating'],
          techniques: ['Holotropic breathwork', 'Advanced pranayama', 'Breath work facilitation']
        }
      ]
    },

    resources: {
      books: [
        { title: 'Breath', author: 'James Nestor', type: 'book', level: 'Engaging overview of breathing science' },
        { title: 'The Wim Hof Method', author: 'Wim Hof', type: 'book', level: 'Specific method guide' },
        { title: 'Light on Pranayama', author: 'B.K.S. Iyengar', type: 'book', level: 'Traditional yogic breathing' }
      ],
      apps: ['Wim Hof Method app', 'Breathwrk', 'Prana Breath', 'Various HRV biofeedback apps'],
      retreats: ['Wim Hof workshops', 'Holotropic Breathwork sessions', 'Pranayama trainings'],
      teachers: ['Wim Hof instructors', 'Holotropic Breathwork facilitators', 'Pranayama teachers']
    },

    considerations: {
      pros: [
        'Immediately effective',
        'Scientifically validated',
        'Accessible anywhere',
        'Measurable results (HRV, etc.)',
        'Multiple techniques for different needs'
      ],
      cons: [
        'Some techniques can be intense',
        'Hyperventilation risks with aggressive methods',
        'Less "meditative" - more active',
        'May not address deeper psychological patterns'
      ],
      whoItsFor: 'Everyone can benefit. Especially good for: stressed professionals, athletes, those with anxiety, people wanting quick results, beginners to meditation.',
      warnings: [
        'Don\'t practice intense breathing while driving or in water',
        'Dizziness, tingling normal with hyperventilation techniques',
        'Consult doctor if pregnant or have cardiovascular issues',
        'Holotropic breathwork can be intense - requires proper facilitation'
      ]
    },

    tags: {
      approach: ['body', 'concentration'],
      structure: 'highly-structured',
      difficultyLevel: 'beginner-friendly',
      timeToResults: 'quick',
      culturalContext: 'mixed',
      teacherRequired: false,
      retreatFriendly: true
    }
  }
};

export default meditationPractices;
