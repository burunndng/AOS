/**
 * Lightweight insight stages data for the ouroboros 3D visualization
 * Contains only essential info: stage number, name, phase, brief description, 1-2 key markers, duration
 */

export interface OuterborosStage {
  stage: number;
  name: string;
  phase: 'Pre-Vipassana' | 'Vipassana Begins' | 'Dark Night' | 'High Equanimity';
  description: string;
  keyMarkers: string[];
  duration: string;
}

export const INSIGHT_OUROBOROS_STAGES: OuterborosStage[] = [
  {
    stage: 1,
    name: 'Mind and Body',
    phase: 'Pre-Vipassana',
    description: 'Distinguishing mind from matter through careful observation. The foundation for all insight.',
    keyMarkers: ['Clear distinction between mental and physical', 'Initial stability in observation'],
    duration: 'Days to weeks'
  },
  {
    stage: 2,
    name: 'Discerning Cause and Effect',
    phase: 'Pre-Vipassana',
    description: 'Understanding how mental and physical phenomena arise dependent on conditions.',
    keyMarkers: ['Seeing dependent origination', 'Cause-effect relationships become obvious'],
    duration: 'Days to weeks'
  },
  {
    stage: 3,
    name: 'The Three Characteristics',
    phase: 'Pre-Vipassana',
    description: 'Perceiving impermanence, unsatisfactoriness, and non-self in all phenomena.',
    keyMarkers: ['Clear perception of anicca, dukkha, anatta', 'Natural arising and passing away'],
    duration: 'Days to weeks'
  },
  {
    stage: 4,
    name: 'Arising and Passing Away',
    phase: 'Pre-Vipassana',
    description: 'Experiencing the rapid arising and dissolution of all phenomena. Gateway to vipassana.',
    keyMarkers: ['Crystalline clarity, profound peace', 'Objects appear and disappear microscopically'],
    duration: 'Hours to days'
  },
  {
    stage: 5,
    name: 'Dissolution',
    phase: 'Vipassana Begins',
    description: 'Objects still arise but predominantly pass away. The body may feel like it dissolves.',
    keyMarkers: ['Emphasis on dissolution, fear and anxiety begin', 'Body perceived as unstable'],
    duration: 'Hours to days'
  },
  {
    stage: 6,
    name: 'Fear',
    phase: 'Vipassana Begins',
    description: 'Stark perception of impermanence becomes frightening. Anxiety and dread arise naturally.',
    keyMarkers: ['Fear, vulnerability, constant change', 'Physical sensations intensify'],
    duration: 'Days to weeks'
  },
  {
    stage: 7,
    name: 'Misery',
    phase: 'Dark Night',
    description: 'Deepening into pain, suffering, and profound dissatisfaction. Physical symptoms intensify.',
    keyMarkers: ['Depression, futility, existential dread', 'Body aches and illness commonly appear'],
    duration: 'Weeks to months'
  },
  {
    stage: 8,
    name: 'Disgust',
    phase: 'Dark Night',
    description: 'Revulsion toward existence itself. The body becomes an object of aversion.',
    keyMarkers: ['Disgust with physical form and existence', 'Desire to escape all sensations'],
    duration: 'Weeks to months'
  },
  {
    stage: 9,
    name: 'Desire for Deliverance',
    phase: 'Dark Night',
    description: 'Desperate yearning to escape suffering. The darkest point before insight.',
    keyMarkers: ['Desperate wish for cessation', 'Willingness to do anything to get out'],
    duration: 'Weeks to months'
  },
  {
    stage: 10,
    name: 'Re-observation',
    phase: 'Dark Night',
    description: 'Re-examining experiences with equanimity. The turning point from aversion to clarity.',
    keyMarkers: ['Shifting to neutral observation', 'Beginning to accept what is'],
    duration: 'Days to weeks'
  },
  {
    stage: 11,
    name: 'Equanimity',
    phase: 'High Equanimity',
    description: 'Deep peace and acceptance. Phenomena are perceived with perfect balance and indifference.',
    keyMarkers: ['Profound peace and clarity', 'No preference for any arising experience'],
    duration: 'Days to weeks'
  },
  {
    stage: 12,
    name: 'Conformity',
    phase: 'High Equanimity',
    description: 'Experiences conform to three characteristics with crystalline clarity and serenity.',
    keyMarkers: ['Seamless perception of impermanence', 'Effortless observation'],
    duration: 'Hours to days'
  },
  {
    stage: 13,
    name: 'Change of Lineage',
    phase: 'High Equanimity',
    description: 'Consciousness shifts its focus. A crucial transition point toward full enlightenment.',
    keyMarkers: ['Subtle shift in awareness', 'Gateway to absorption states'],
    duration: 'Moments to seconds'
  },
  {
    stage: 14,
    name: 'Path',
    phase: 'High Equanimity',
    description: 'Momentary path consciousness that irreversibly establishes progress toward liberation.',
    keyMarkers: ['Profound knowing without observation', 'Unshakeable change occurs'],
    duration: 'Moments'
  },
  {
    stage: 15,
    name: 'Fruition',
    phase: 'High Equanimity',
    description: 'The result consciousness—liberation is tasted directly. A moment of cessation and release.',
    keyMarkers: ['Complete cessation of conditioned experience', 'Perfect peace and freedom'],
    duration: 'Moments'
  },
  {
    stage: 16,
    name: 'Reviewing Consciousness',
    phase: 'High Equanimity',
    description: 'Reflecting on the path traversed. Integration and understanding consolidate the shift.',
    keyMarkers: ['Review of the entire journey', 'Natural understanding deepens'],
    duration: 'Minutes to hours'
  }
];

export function getOuroborosStageByNumber(stageNumber: number): OuterborosStage | undefined {
  return INSIGHT_OUROBOROS_STAGES.find(s => s.stage === stageNumber);
}

export function getOuroborosStagesByPhase(phase: string): OuterborosStage[] {
  return INSIGHT_OUROBOROS_STAGES.filter(s => s.phase === phase);
}
