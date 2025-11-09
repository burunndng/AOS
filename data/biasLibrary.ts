/**
 * Bias Library - Canonical definitions of cognitive biases
 * Used by the Bias Finder feature to ensure consistent and accurate bias identification
 */

export interface BiasDefinition {
  id: string;
  name: string;
  category: string;
  definition: string;
  commonTriggers: string[];
  examples: string[];
  questions: string[]; // Socratic questions to probe for this bias
}

export const BIAS_LIBRARY: BiasDefinition[] = [
  {
    id: 'confirmation-bias',
    name: 'Confirmation Bias',
    category: 'Information Processing',
    definition: 'The tendency to search for, interpret, favor, and recall information in a way that confirms or supports one\'s prior beliefs or values.',
    commonTriggers: ['High stakes', 'Strong existing beliefs', 'Time pressure'],
    examples: [
      'Only reading news sources that align with your political views',
      'Ignoring data that contradicts your initial hypothesis in a project',
      'Selectively remembering feedback that supports your decision'
    ],
    questions: [
      'What was the sequence of information you gathered for this decision?',
      'What percentage of that information challenged your initial preference?',
      'Did you actively seek out information that might contradict your initial inclination?',
      'What sources did you consult? Were they diverse in perspective?',
      'Can you identify any information you dismissed or ignored? Why?'
    ]
  },
  {
    id: 'availability-heuristic',
    name: 'Availability Heuristic',
    category: 'Mental Shortcut',
    definition: 'The tendency to overestimate the likelihood of events that are more readily available in memory, often due to their vividness or recency.',
    commonTriggers: ['Recent events', 'Vivid experiences', 'Rushed decisions'],
    examples: [
      'Overestimating plane crash risk after seeing news coverage of a crash',
      'Basing a hiring decision on a recent negative experience with a similar candidate',
      'Avoiding an investment because you recently heard about someone losing money'
    ],
    questions: [
      'What recent events or experiences came to mind when making this decision?',
      'Did any vivid or emotionally charged memories influence your thinking?',
      'Were you drawing primarily from recent experiences rather than broader data?',
      'Did you consider base rates or statistical probabilities, or rely on what came easily to mind?',
      'Can you identify examples that contradict the pattern you were thinking of?'
    ]
  },
  {
    id: 'anchoring-bias',
    name: 'Anchoring Bias',
    category: 'Information Processing',
    definition: 'The tendency to rely too heavily on the first piece of information encountered (the "anchor") when making decisions.',
    commonTriggers: ['First impressions', 'Initial numbers', 'Opening offers'],
    examples: [
      'Being influenced by the initial price when negotiating',
      'Letting the first candidate interviewed set the bar for all others',
      'Basing a budget on last year\'s numbers without reassessing needs'
    ],
    questions: [
      'What was the first piece of information you encountered about this decision?',
      'Did you adjust sufficiently from that initial reference point?',
      'Were there any initial numbers, estimates, or suggestions that stuck with you?',
      'How much did your final decision differ from where you started?',
      'Did you independently generate alternative reference points?'
    ]
  },
  {
    id: 'sunk-cost-fallacy',
    name: 'Sunk Cost Fallacy',
    category: 'Decision Making',
    definition: 'The tendency to continue an endeavor once an investment in money, effort, or time has been made, even when abandoning it would be more beneficial.',
    commonTriggers: ['Prior investment', 'Commitment consistency', 'Loss aversion'],
    examples: [
      'Continuing a failing project because of the resources already invested',
      'Staying in a movie you\'re not enjoying because you paid for the ticket',
      'Persisting with a career path because of years of training'
    ],
    questions: [
      'How much time, money, or effort had you already invested before this decision point?',
      'If you were starting fresh today with no prior investment, would you make the same choice?',
      'Did the thought of "wasting" your prior investment influence your decision?',
      'Were you focused more on past costs or future benefits?',
      'What would an outside observer with no stake in your past investments recommend?'
    ]
  },
  {
    id: 'overconfidence-bias',
    name: 'Overconfidence Bias',
    category: 'Self-Assessment',
    definition: 'The tendency to have excessive confidence in one\'s own answers, abilities, or predictions, often overestimating knowledge and underestimating risks.',
    commonTriggers: ['Expertise in one area', 'Past successes', 'Lack of feedback'],
    examples: [
      'Underestimating project timelines based on optimistic assumptions',
      'Making investment decisions without proper research',
      'Dismissing expert advice because of your own experience'
    ],
    questions: [
      'How confident were you in your initial assessment? (Rate 0-100%)',
      'What was your estimated probability of success or accuracy?',
      'Did you consider alternative scenarios or what could go wrong?',
      'How much uncertainty did you factor into your decision?',
      'Did you seek feedback or second opinions to calibrate your confidence?'
    ]
  },
  {
    id: 'recency-bias',
    name: 'Recency Bias',
    category: 'Memory',
    definition: 'The tendency to weigh recent events or information more heavily than earlier events or information.',
    commonTriggers: ['Recent feedback', 'Latest performance', 'Current trends'],
    examples: [
      'Evaluating an employee based primarily on their last month of work',
      'Making investment decisions based on recent market movements',
      'Changing strategy based on the most recent customer complaint'
    ],
    questions: [
      'What were the most recent events or information you considered?',
      'Did you give equal weight to older data and recent data?',
      'Were you influenced more by the latest feedback or the overall pattern?',
      'How far back in time did you look when gathering information?',
      'Did recent events overshadow longer-term trends?'
    ]
  },
  {
    id: 'framing-effect',
    name: 'Framing Effect',
    category: 'Information Processing',
    definition: 'The tendency to draw different conclusions from the same information depending on how it is presented or framed.',
    commonTriggers: ['Positive/negative framing', 'Gain/loss framing', 'Comparison anchors'],
    examples: [
      'Preferring "90% success rate" over "10% failure rate"',
      'Choosing differently when options are framed as gains vs. losses',
      'Being influenced by how a choice is described rather than its substance'
    ],
    questions: [
      'How was the information presented to you? (As gains, losses, percentages, absolutes?)',
      'Would you have decided differently if the same facts were framed differently?',
      'Who presented the information, and might they have had a preferred framing?',
      'Did you reframe the information in different ways to test your thinking?',
      'Were you focused on avoiding losses or achieving gains?'
    ]
  },
  {
    id: 'groupthink',
    name: 'Groupthink',
    category: 'Social Influence',
    definition: 'The tendency for group members to conform to consensus opinions and avoid critical evaluation of alternatives to maintain harmony.',
    commonTriggers: ['Team pressure', 'Desire for harmony', 'Strong leader'],
    examples: [
      'Going along with a team decision despite private reservations',
      'Not voicing concerns to avoid disrupting group cohesion',
      'Adopting the leader\'s view without independent analysis'
    ],
    questions: [
      'Did you make this decision alone or with others?',
      'If in a group, did anyone voice dissenting opinions?',
      'Did you feel pressure to conform to the group\'s emerging consensus?',
      'Were alternative viewpoints seriously considered or quickly dismissed?',
      'Did you privately disagree but publicly go along with the decision?'
    ]
  },
  {
    id: 'status-quo-bias',
    name: 'Status Quo Bias',
    category: 'Decision Making',
    definition: 'The tendency to prefer things to stay the same and to resist change, often choosing the default or current state of affairs.',
    commonTriggers: ['Uncertainty about change', 'Loss aversion', 'Decision fatigue'],
    examples: [
      'Keeping default settings without exploring alternatives',
      'Staying with the current vendor despite better options',
      'Avoiding a beneficial change because it requires effort'
    ],
    questions: [
      'Was maintaining the current situation one of your options?',
      'Did you seriously consider alternatives to the status quo?',
      'What effort or risk did change represent compared to staying the same?',
      'Were you influenced by the ease of not changing anything?',
      'Did you have a default option that required less active decision-making?'
    ]
  },
  {
    id: 'hindsight-bias',
    name: 'Hindsight Bias',
    category: 'Memory',
    definition: 'The tendency to believe, after an outcome is known, that one would have predicted or expected that outcome beforehand.',
    commonTriggers: ['Known outcomes', 'Retrospective analysis', 'Pattern recognition'],
    examples: [
      'Claiming you "knew" a project would fail after it does',
      'Believing you would have predicted a market crash',
      'Overestimating how predictable events were before they happened'
    ],
    questions: [
      'Are you analyzing this decision after knowing the outcome?',
      'Before the outcome, how predictable did this seem?',
      'Are you reconstructing your thinking with knowledge you didn\'t have at the time?',
      'What did you actually know at the moment of decision versus what you know now?',
      'Are you being fair to your past self\'s state of knowledge?'
    ]
  }
];

/**
 * Get a bias definition by ID
 */
export function getBiasById(id: string): BiasDefinition | undefined {
  return BIAS_LIBRARY.find(bias => bias.id === id);
}

/**
 * Get biases by category
 */
export function getBiasesByCategory(category: string): BiasDefinition[] {
  return BIAS_LIBRARY.filter(bias => bias.category === category);
}

/**
 * Get biases likely given decision parameters
 */
export function getLikelyBiases(params: {
  stakes: 'Low' | 'Medium' | 'High';
  timePressure: 'Ample' | 'Moderate' | 'Rushed';
  emotionalState: string;
}): BiasDefinition[] {
  const likely: BiasDefinition[] = [];

  // High stakes + Rushed = Confirmation Bias, Availability Heuristic
  if ((params.stakes === 'High' || params.stakes === 'Medium') && params.timePressure === 'Rushed') {
    likely.push(
      getBiasById('confirmation-bias')!,
      getBiasById('availability-heuristic')!,
      getBiasById('anchoring-bias')!
    );
  }
  // Low time pressure might allow for Status Quo Bias
  else if (params.timePressure === 'Ample') {
    likely.push(
      getBiasById('status-quo-bias')!,
      getBiasById('overconfidence-bias')!
    );
  }
  // High stakes alone
  else if (params.stakes === 'High') {
    likely.push(
      getBiasById('sunk-cost-fallacy')!,
      getBiasById('confirmation-bias')!,
      getBiasById('overconfidence-bias')!
    );
  }
  // Moderate conditions
  else {
    likely.push(
      getBiasById('recency-bias')!,
      getBiasById('framing-effect')!,
      getBiasById('anchoring-bias')!
    );
  }

  // Emotional states can suggest additional biases
  const emotionalStateLower = params.emotionalState.toLowerCase();
  if (emotionalStateLower.includes('anxious') || emotionalStateLower.includes('stressed')) {
    if (!likely.find(b => b.id === 'availability-heuristic')) {
      likely.push(getBiasById('availability-heuristic')!);
    }
  }
  if (emotionalStateLower.includes('excited') || emotionalStateLower.includes('confident')) {
    if (!likely.find(b => b.id === 'overconfidence-bias')) {
      likely.push(getBiasById('overconfidence-bias')!);
    }
  }

  // Return top 4 most likely
  return likely.slice(0, 4).filter(Boolean);
}

/**
 * Get all bias categories
 */
export function getAllCategories(): string[] {
  const categories = new Set(BIAS_LIBRARY.map(bias => bias.category));
  return Array.from(categories).sort();
}
