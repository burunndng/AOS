/**
 * Attachment-Aware Practice Recommendations
 * Maps attachment styles to practices that support healing and growth
 */

export type AttachmentStyle = 'secure' | 'anxious' | 'avoidant' | 'fearful';

export interface AttachmentProfile {
  style: AttachmentStyle;
  label: string;
  description: string;
  color: string;
  bodyPractices: string[];
  mindPractices: string[];
  spiritPractices: string[];
  shadowPractices: string[];
}

export const attachmentProfiles: Record<AttachmentStyle, AttachmentProfile> = {
  secure: {
    style: 'secure',
    label: 'Secure Attachment',
    description: 'You generally feel comfortable with intimacy and independence. You manage conflict directly and maintain healthy boundaries.',
    color: 'text-green-300',
    bodyPractices: ['zone2-cardio', 'resistance', 'mobility'], // Stability practices
    mindPractices: ['perspective-taking', 'attention-training'], // Clear thinking
    spiritPractices: ['meditation', 'loving-kindness', 'gratitude'], // Continued growth
    shadowPractices: ['parts-dialogue', 'perspective-shifter'], // Ongoing integration
  },

  anxious: {
    style: 'anxious',
    label: 'Anxious Attachment',
    description: 'You tend to seek reassurance and fear abandonment. You may over-focus on relationships and struggle with self-soothing when alone.',
    color: 'text-orange-300',
    bodyPractices: ['physiological-sigh', 'coherent-breathing', 'cold-exposure'], // Nervous system regulation
    mindPractices: ['attention-training', 'expressive-writing', 'subject-object-explorer'], // Self-awareness
    spiritPractices: ['self-compassion', 'loving-kindness', 'integral-inquiry'], // Self-validation
    shadowPractices: ['shadow-journaling', 'parts-dialogue', 'bias-detective'], // Understanding needs
  },

  avoidant: {
    style: 'avoidant',
    label: 'Avoidant Attachment',
    description: 'You value independence highly and may distance from emotional intimacy. You typically suppress feelings and focus on self-reliance.',
    color: 'text-blue-300',
    bodyPractices: ['resistance', 'zone2-cardio', 'mobility'], // Embodied presence
    mindPractices: ['expressive-writing', 'perspective-taking', 'belief-examination'], // Emotional access
    spiritPractices: ['loving-kindness', 'big-mind-process', 'meditation'], // Heart opening
    shadowPractices: ['shadow-journaling', 'polarity-mapper', 'parts-dialogue'], // Vulnerability exploration
  },

  fearful: {
    style: 'fearful',
    label: 'Fearful-Avoidant Attachment',
    description: 'You experience conflicting desires for closeness and distance. You oscillate between clinging and withdrawing, often accompanied by fear and shame.',
    color: 'text-red-300',
    bodyPractices: ['physiological-sigh', 'coherent-breathing', 'sleep'], // Foundational grounding
    mindPractices: ['attention-training', 'subject-object-explorer', 'expressive-writing'], // Internal stability
    spiritPractices: ['self-compassion', 'loving-kindness', 'three-two-one'], // Self-regulation
    shadowPractices: ['shadow-journaling', 'parts-dialogue', 'perspective-shifter'], // Integrated self-perception
  },
};

/**
 * Get all recommended practice IDs for an attachment style
 */
export function getRecommendedPractices(style: AttachmentStyle): string[] {
  const profile = attachmentProfiles[style];
  return [
    ...profile.bodyPractices,
    ...profile.mindPractices,
    ...profile.spiritPractices,
    ...profile.shadowPractices,
  ];
}

/**
 * Get practices grouped by system for an attachment style
 */
export function getRecommendedPracticesBySystem(style: AttachmentStyle) {
  const profile = attachmentProfiles[style];
  return {
    body: profile.bodyPractices,
    mind: profile.mindPractices,
    spirit: profile.spiritPractices,
    shadow: profile.shadowPractices,
  };
}
