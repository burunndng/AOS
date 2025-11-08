/**
 * Attachment Healing Practice Sequences
 * Progressive phases for each attachment style
 */

import { AttachmentStyle } from '../data/attachmentMappings.ts';

export interface PracticePhase {
  phase: string;
  phaseNumber: number;
  duration: string;
  focus: string;
  practiceIds: string[];
  description: string;
}

export const attachmentPracticeSequences: Record<AttachmentStyle, PracticePhase[]> = {
  secure: [
    {
      phase: 'Foundation',
      phaseNumber: 1,
      duration: 'Week 1-2',
      focus: 'Maintain security',
      practiceIds: ['physiological-sigh', 'loving-kindness'],
      description: 'Continue the foundational practices that keep you grounded. Attachment is secure when you have a solid personal foundation.'
    },
    {
      phase: 'Deepening',
      phaseNumber: 2,
      duration: 'Week 3-4',
      focus: 'Relational awareness',
      practiceIds: ['expressive-writing', 'parts-dialogue'],
      description: 'Deepen your understanding of how you show up in relationships. Secure attachment benefits from continuous self-awareness.'
    },
    {
      phase: 'Integration',
      phaseNumber: 3,
      duration: 'Month 2+',
      focus: 'Advanced growth',
      practiceIds: ['self-compassion', 'coherent-breathing'],
      description: 'Develop sophisticated relational skills and continue growing. Secure attachment is a practice, not a destination.'
    }
  ],

  anxious: [
    {
      phase: 'Nervous System Stabilization',
      phaseNumber: 1,
      duration: 'Week 1-2',
      focus: 'Calm the body',
      practiceIds: ['physiological-sigh', 'coherent-breathing'],
      description: 'Anxious attachment lives in the nervous system. These practices help you feel safe in your body—the foundation for all change.'
    },
    {
      phase: 'Self-Awareness & Self-Soothing',
      phaseNumber: 2,
      duration: 'Week 3-4',
      focus: 'Know yourself',
      practiceIds: ['self-compassion', 'expressive-writing'],
      description: 'Learn to recognize your anxiety patterns and comfort yourself. The goal is self-regulation, not needing others to regulate you.'
    },
    {
      phase: 'Relational Healing',
      phaseNumber: 3,
      duration: 'Month 2+',
      focus: 'Secure connection',
      practiceIds: ['loving-kindness', 'parts-dialogue'],
      description: 'Now that you can regulate yourself, you can relate from a place of wholeness. Practice secure relating patterns.'
    }
  ],

  avoidant: [
    {
      phase: 'Embodied Presence',
      phaseNumber: 1,
      duration: 'Week 1-2',
      focus: 'Get in your body',
      practiceIds: ['physiological-sigh', 'coherent-breathing'],
      description: 'Avoidant attachment often involves disconnection from the body. These practices help you return to physical sensation and presence.'
    },
    {
      phase: 'Emotional Access',
      phaseNumber: 2,
      duration: 'Week 3-4',
      focus: 'Feel your feelings',
      practiceIds: ['expressive-writing', 'parts-dialogue'],
      description: 'Avoidant patterns suppress emotion. These practices help you access what you\'ve been keeping at a distance.'
    },
    {
      phase: 'Heart Opening',
      phaseNumber: 3,
      duration: 'Month 2+',
      focus: 'Connect & trust',
      practiceIds: ['loving-kindness', 'self-compassion'],
      description: 'With body and emotion accessible, practice opening to connection. Learn to trust vulnerability and interdependence.'
    }
  ],

  fearful: [
    {
      phase: 'Foundational Grounding',
      phaseNumber: 1,
      duration: 'Week 1-2',
      focus: 'Feel safe',
      practiceIds: ['physiological-sigh', 'coherent-breathing'],
      description: 'Fearful attachment means oscillating between craving and fearing closeness. First, help your nervous system find stability and safety.'
    },
    {
      phase: 'Internal Coherence',
      phaseNumber: 2,
      duration: 'Week 3-4',
      focus: 'Integrate yourself',
      practiceIds: ['self-compassion', 'parts-dialogue'],
      description: 'You contain conflicting impulses. These practices help integrate the part that wants closeness with the part that fears it.'
    },
    {
      phase: 'Relational Integration',
      phaseNumber: 3,
      duration: 'Month 2+',
      focus: 'Sustainable connection',
      practiceIds: ['loving-kindness', 'expressive-writing'],
      description: 'Now you can relate from a more integrated place. Practice stable, secure relating even when fear arises.'
    }
  ]
};

/**
 * Get practices for a specific phase
 */
export function getPhasePractices(style: AttachmentStyle, phaseNumber: number) {
  const phases = attachmentPracticeSequences[style];
  return phases.find(p => p.phaseNumber === phaseNumber)?.practiceIds || [];
}

/**
 * Calculate phase completion (how many practices in stack)
 */
export function calculatePhaseCompletion(phaseIds: string[], practiceStackIds: Set<string>): number {
  const completed = phaseIds.filter(id => practiceStackIds.has(id)).length;
  return Math.round((completed / phaseIds.length) * 100);
}
