/**
 * Attachment Styles Assessment (ECR-R based)
 * 30-item validated questionnaire for measuring adult attachment patterns
 */

export interface AttachmentQuestion {
  id: string;
  question: string;
  reverse: boolean; // Whether to reverse score this item
}

export interface AttachmentAnswers {
  [questionId: string]: number; // 1-7 scale
}

export interface AttachmentScores {
  anxiety: number;
  avoidance: number;
}

export interface AttachmentResult {
  style: 'secure' | 'anxious' | 'avoidant' | 'fearful';
  anxiety: number;
  avoidance: number;
  description: string;
}

export const attachmentQuestions: AttachmentQuestion[] = [
  { id: 'q1', question: 'I worry about being abandoned by those close to me.', reverse: false },
  { id: 'q2', question: 'I find it easy to get emotionally close to others.', reverse: true },
  { id: 'q3', question: 'I prefer not to show others how I feel deep down.', reverse: false },
  { id: 'q4', question: 'I often worry that my partner doesn\'t really love me.', reverse: false },
  { id: 'q5', question: 'I am comfortable depending on romantic partners.', reverse: true },
  { id: 'q6', question: 'I need a lot of reassurance that I am loved by my partner.', reverse: false },
  { id: 'q7', question: 'I try to avoid getting too close to others.', reverse: false },
  { id: 'q8', question: 'I rarely worry about my partner leaving me.', reverse: true },
  { id: 'q9', question: 'I find it difficult to trust romantic partners completely.', reverse: false },
  { id: 'q10', question: 'My desire to be very close sometimes scares people away.', reverse: false },
  { id: 'q11', question: 'I am nervous when partners get too close to me.', reverse: false },
  { id: 'q12', question: 'I worry that I care about my relationships more than my partners do.', reverse: false },
  { id: 'q13', question: 'I feel comfortable sharing my private thoughts and feelings with my partner.', reverse: true },
  { id: 'q14', question: 'When my partner is out of sight, I worry that they might become interested in someone else.', reverse: false },
  { id: 'q15', question: 'I prefer to keep my independence, even in close relationships.', reverse: false },
  { id: 'q16', question: 'I get frustrated when romantic partners are not available when I need them.', reverse: false },
  { id: 'q17', question: 'It helps to turn to romantic partners in times of need.', reverse: true },
  { id: 'q18', question: 'I worry about being alone.', reverse: false },
  { id: 'q19', question: 'I don\'t feel comfortable opening up to romantic partners.', reverse: false },
  { id: 'q20', question: 'I often wish that my partner\'s feelings for me were as strong as my feelings for them.', reverse: false },
  { id: 'q21', question: 'I want to get close to my partner, but I keep pulling back.', reverse: false },
  { id: 'q22', question: 'I do not worry about being abandoned.', reverse: true },
  { id: 'q23', question: 'It makes me uncomfortable when a romantic partner wants to be very close.', reverse: false },
  { id: 'q24', question: 'I resent it when my partner spends time away from me.', reverse: false },
  { id: 'q25', question: 'I tell my partner just about everything.', reverse: true },
  { id: 'q26', question: 'Sometimes romantic partners change their feelings about me for no apparent reason.', reverse: false },
  { id: 'q27', question: 'My independence is more important to me than my relationships.', reverse: false },
  { id: 'q28', question: 'I worry that I won\'t measure up to other people.', reverse: false },
  { id: 'q29', question: 'It\'s easy for me to be affectionate with my partner.', reverse: true },
  { id: 'q30', question: 'I find that my partners don\'t want to get as close as I would like.', reverse: false },
];

/**
 * Calculate attachment scores from responses
 * Returns anxiety and avoidance scores on 1-7 scale
 */
export function calculateAttachmentScores(answers: AttachmentAnswers): AttachmentScores {
  // Anxiety items (indices for q1, q4, q6, q8, q10, q12, q14, q16, q18, q20, q22, q24, q26, q28, q30)
  const anxietyQuestions = [0, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29];

  // Avoidance items (indices for q2, q3, q5, q7, q9, q11, q13, q15, q17, q19, q21, q23, q25, q27, q29)
  const avoidanceQuestions = [1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28];

  // Calculate anxiety score
  const anxietyScores = anxietyQuestions.map(idx => {
    const q = attachmentQuestions[idx];
    let score = answers[q.id] || 4;
    if (q.reverse) {
      score = 8 - score; // Reverse: 1→7, 2→6, etc.
    }
    return score;
  });
  const anxiety = anxietyScores.reduce((a, b) => a + b, 0) / anxietyScores.length;

  // Calculate avoidance score
  const avoidanceScores = avoidanceQuestions.map(idx => {
    const q = attachmentQuestions[idx];
    let score = answers[q.id] || 4;
    if (q.reverse) {
      score = 8 - score;
    }
    return score;
  });
  const avoidance = avoidanceScores.reduce((a, b) => a + b, 0) / avoidanceScores.length;

  return { anxiety, avoidance };
}

/**
 * Determine attachment style from anxiety and avoidance scores
 */
export function determineAttachmentStyle(scores: AttachmentScores): AttachmentResult {
  const threshold = 3.5;
  const highAnxiety = scores.anxiety >= threshold;
  const highAvoidance = scores.avoidance >= threshold;

  let style: AttachmentResult['style'];
  let description: string;

  if (!highAnxiety && !highAvoidance) {
    style = 'secure';
    description = 'You feel comfortable with intimacy and independence. You handle conflict directly and maintain healthy boundaries. You generally feel secure in relationships.';
  } else if (highAnxiety && !highAvoidance) {
    style = 'anxious';
    description = 'You tend to seek high levels of intimacy and reassurance. You may worry about being abandoned and over-focus on relationships. You want closeness but fear rejection.';
  } else if (!highAnxiety && highAvoidance) {
    style = 'avoidant';
    description = 'You value independence and self-reliance. You may distance from emotional intimacy and suppress feelings. You prefer to handle challenges alone.';
  } else {
    style = 'fearful';
    description = 'You experience conflicting desires for closeness and distance. You oscillate between clinging and withdrawing. You may experience both fear and shame in relationships.';
  }

  return { style, anxiety: scores.anxiety, avoidance: scores.avoidance, description };
}

/**
 * Get a label for anxiety/avoidance score
 */
export function getScoreLabel(score: number): string {
  if (score < 2) return 'Very Low';
  if (score < 3) return 'Low';
  if (score < 4) return 'Moderate';
  if (score < 5) return 'Moderate-High';
  if (score < 6) return 'High';
  return 'Very High';
}
