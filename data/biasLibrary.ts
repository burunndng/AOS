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
  },
  {
    id: 'dunning-kruger-effect',
    name: 'Dunning-Kruger Effect',
    category: 'Self-Assessment',
    definition: 'The tendency for people with low ability at a task to overestimate their competence, while experts underestimate theirs.',
    commonTriggers: ['Limited expertise', 'Rapid skill gain', 'New domain knowledge'],
    examples: [
      'A novice programmer believing they can architect a system without consulting experienced developers',
      'A new manager overestimating their capability to handle complex personnel decisions',
      'Someone with surface knowledge of a topic confidently arguing with experts'
    ],
    questions: [
      'How much experience do you have with similar decisions or tasks?',
      'What would experts in this field say about your competence level?',
      'Are you aware of what you don\'t know about this domain?',
      'Did you seek input from someone more experienced than yourself?',
      'How might your confidence change after learning more about the complexity?'
    ]
  },
  {
    id: 'planning-fallacy',
    name: 'Planning Fallacy',
    category: 'Decision Making',
    definition: 'The tendency to underestimate the time, costs, and risks of future actions while overestimating the benefits.',
    commonTriggers: ['Complex projects', 'Optimistic thinking', 'Unfamiliar tasks'],
    examples: [
      'Estimating a project will take 2 weeks when it historically takes 4 weeks',
      'Underestimating household renovation costs and timelines',
      'Starting a business with overly optimistic revenue projections'
    ],
    questions: [
      'How have similar projects gone in the past—how much longer did they take?',
      'What uncertainties or potential obstacles did you factor in?',
      'Did you add buffer time for unexpected issues?',
      'Did you consult historical data or base rates for your estimates?',
      'What assumptions did you make that could prove false?'
    ]
  },
  {
    id: 'illusion-of-control',
    name: 'Illusion of Control',
    category: 'Self-Assessment',
    definition: 'The tendency to overestimate one\'s ability to control or influence outcomes that depend partly on chance or external factors.',
    commonTriggers: ['Routine tasks', 'Familiarity with process', 'Past successes'],
    examples: [
      'Believing your lucky socks improve your sports performance',
      'Thinking you can consistently beat the stock market through individual stock picks',
      'Overestimating your influence on a negotiation outcome'
    ],
    questions: [
      'How much of this outcome actually depends on factors outside your control?',
      'What would happen if you removed yourself from the equation?',
      'Are you taking credit for outcomes that may have happened regardless?',
      'What external variables could override your efforts?',
      'How much of your past success was due to luck versus your actions?'
    ]
  },
  {
    id: 'fundamental-attribution-error',
    name: 'Fundamental Attribution Error',
    category: 'Judgment',
    definition: 'The tendency to attribute others\' actions to their character or abilities rather than to situational factors.',
    commonTriggers: ['Evaluating others\' behavior', 'Conflict situations', 'Performance reviews'],
    examples: [
      'Assuming a coworker missed a deadline because they\'re lazy, not because they were overloaded',
      'Concluding someone is rude based on one interaction, ignoring they might have been having a bad day',
      'Blaming an employee\'s poor performance on lack of competence rather than inadequate training'
    ],
    questions: [
      'What situational factors might have contributed to this person\'s behavior?',
      'What would you do in their situation with their constraints?',
      'Are you considering the full context of their circumstances?',
      'What might they say about why they acted that way?',
      'Have you asked them about the circumstances before drawing conclusions?'
    ]
  },
  {
    id: 'false-consensus-effect',
    name: 'False Consensus Effect',
    category: 'Social Influence',
    definition: 'The tendency to overestimate the extent to which others share our beliefs, attitudes, values, and behaviors.',
    commonTriggers: ['Group settings', 'Common interests', 'Strongly held beliefs'],
    examples: [
      'Assuming most people hold the same political views as you do',
      'Thinking your colleagues agree with your assessment when they may have reservations',
      'Believing your lifestyle or values are more mainstream than they actually are'
    ],
    questions: [
      'How do you know that others share your perspective on this?',
      'Have you tested this assumption with a diverse group?',
      'Could the people around you simply be agreeing to avoid conflict?',
      'What percentage of people beyond your immediate circle would agree?',
      'Did you seek out people who think differently to challenge this assumption?'
    ]
  },
  {
    id: 'cognitive-dissonance',
    name: 'Cognitive Dissonance',
    category: 'Information Processing',
    definition: 'The discomfort experienced when holding two contradictory beliefs, leading to rationalization or selective exposure.',
    commonTriggers: ['Conflicting values', 'Behavioral inconsistency', 'New contradictory information'],
    examples: [
      'Continuing to buy from companies whose values contradict your beliefs, while justifying exceptions',
      'Dismissing evidence that contradicts a past decision you made',
      'Feeling uncomfortable with data that conflicts with your preferred outcome'
    ],
    questions: [
      'Are you experiencing discomfort because of contradictory beliefs?',
      'Are you rationalizing inconsistencies in your values or behavior?',
      'Is there information you\'re avoiding because it contradicts your position?',
      'Could you acknowledge both perspectives without needing to resolve the tension?',
      'What core values might be in conflict here?'
    ]
  },
  {
    id: 'in-group-bias',
    name: 'In-group Bias',
    category: 'Social Influence',
    definition: 'The tendency to favor members of your own group and disfavor those from outside groups.',
    commonTriggers: ['Group identity', 'Competition between groups', 'In-group loyalty'],
    examples: [
      'Viewing your company\'s choices more favorably than a competitor\'s identical choices',
      'Assuming team members from your department are more competent than equally qualified people from other departments',
      'Being more lenient with mistakes made by "our team" than by rivals'
    ],
    questions: [
      'Are you judging this person or group differently because of their group membership?',
      'Would you evaluate the same action differently if it came from someone in your group?',
      'What would an outsider say about the fairness of your assessment?',
      'Are you giving in-group members the benefit of the doubt more than out-group members?',
      'Can you identify specific criteria beyond group membership for your judgment?'
    ]
  },
  {
    id: 'bandwagon-effect',
    name: 'Bandwagon Effect',
    category: 'Social Influence',
    definition: 'The tendency to do, believe, or want something because many other people do.',
    commonTriggers: ['Popular trends', 'Majority opinion', 'Social proof'],
    examples: [
      'Adopting an investment strategy because many others are doing it, without independent research',
      'Supporting a position primarily because it\'s gaining traction on social media',
      'Choosing technology or products because "everyone" is using them'
    ],
    questions: [
      'Why do you believe this—because of the evidence or because others believe it?',
      'Would you hold this position if fewer people agreed with it?',
      'Did you arrive at this independently or through social influence?',
      'What would your decision be based on the merits alone?',
      'Can you identify reasons beyond "popularity" for this choice?'
    ]
  },
  {
    id: 'endowment-effect',
    name: 'Endowment Effect',
    category: 'Decision Making',
    definition: 'The tendency to place higher value on something simply because you own or possess it.',
    commonTriggers: ['Ownership', 'Possession length', 'Personal attachment'],
    examples: [
      'Asking a higher price for your car than you would pay for an identical car from someone else',
      'Overvaluing ideas you proposed versus those suggested by colleagues',
      'Thinking your possessions are worth more than objective market value'
    ],
    questions: [
      'Would you value this differently if you didn\'t own it?',
      'What would you pay for this if you didn\'t already have it?',
      'Is your valuation based on objective factors or possession?',
      'How long have you owned or been attached to this?',
      'Would an outside valuer agree with your assessment?'
    ]
  },
  {
    id: 'loss-aversion',
    name: 'Loss Aversion',
    category: 'Decision Making',
    definition: 'The tendency to feel the pain of losses about twice as strongly as the pleasure of equivalent gains.',
    commonTriggers: ['Risk of loss', 'Change from status quo', 'Past losses'],
    examples: [
      'Holding a losing investment longer than a winning one to avoid realizing a loss',
      'Avoiding a change that could improve outcomes due to fear of losing what you have',
      'Overweighting potential downsides when comparing options'
    ],
    questions: [
      'Are you giving more weight to potential losses than potential gains?',
      'What specifically are you afraid of losing?',
      'How likely is that loss compared to potential gains?',
      'Would you be more willing to change if there were no loss involved?',
      'Are you being proportional in weighing gains and losses?'
    ]
  },
  {
    id: 'optimism-bias',
    name: 'Optimism Bias',
    category: 'Self-Assessment',
    definition: 'The tendency to believe that you are more likely to experience positive outcomes and less likely to experience negative ones than others.',
    commonTriggers: ['Future planning', 'Personal capabilities', 'Comparative thinking'],
    examples: [
      'Thinking you\'re less likely to get sick or have an accident than average',
      'Believing your relationship is stronger than average and less likely to fail',
      'Overestimating the likelihood of job success or career advancement'
    ],
    questions: [
      'Are you assuming this will work out better for you than for others in similar situations?',
      'What negative outcomes are possible that you haven\'t considered?',
      'How do comparable situations typically turn out?',
      'Are you treating your situation as somehow special or exempt from normal probabilities?',
      'What would a pessimist or realist say about the actual odds?'
    ]
  },
  {
    id: 'negativity-bias',
    name: 'Negativity Bias',
    category: 'Information Processing',
    definition: 'The tendency to give more weight and attention to negative experiences or information than positive ones.',
    commonTriggers: ['Mixed feedback', 'Media exposure', 'Performance reviews'],
    examples: [
      'Focusing on one critical comment while ignoring nine compliments',
      'Disproportionately remembering a failed project over multiple successes',
      'Overestimating risks or problems while underestimating benefits'
    ],
    questions: [
      'Are you focusing disproportionately on negative information?',
      'How many positive data points are you balancing against the negative?',
      'What would the full picture look like if you weighted all information equally?',
      'Is the negative information actually more important or are you just paying it more attention?',
      'What positive aspects are you overlooking?'
    ]
  },
  {
    id: 'false-memory',
    name: 'False Memory',
    category: 'Memory',
    definition: 'The tendency to remember things differently than they actually occurred, filling in gaps with plausible but inaccurate details.',
    commonTriggers: ['Distant past events', 'Emotionally significant experiences', 'Repeated recounting'],
    examples: [
      'Misremembering the exact details of a conflict while being confident in your version',
      'Believing you said something in a conversation when you didn\'t, but thought of it later',
      'Reconstructing past conversations based on what seems logical rather than what was said'
    ],
    questions: [
      'How certain are you about these specific details?',
      'Is anyone else present who remembers this differently?',
      'Have you filled in gaps in your memory with what seems logical?',
      'How often have you recounted this story, and could it have changed in the retelling?',
      'What physical evidence or records exist that could confirm your memory?'
    ]
  },
  {
    id: 'clustering-illusion',
    name: 'Clustering Illusion',
    category: 'Pattern Recognition',
    definition: 'The tendency to see patterns or clusters in random data and attribute them to meaningful causes.',
    commonTriggers: ['Data interpretation', 'Pattern seeking', 'Small sample sizes'],
    examples: [
      'Seeing a trend in three consecutive months of sales data when it\'s just random variation',
      'Concluding a sports team is "on a winning streak" based on short-term results',
      'Attributing meaning to coincidences or random patterns in data'
    ],
    questions: [
      'Is this pattern based on enough data to be statistically meaningful?',
      'Could this pattern occur by chance alone?',
      'What would you expect from random data over this time period?',
      'Do you have a causal explanation, or are you just identifying a pattern?',
      'How large is your sample size compared to what would be needed for significance?'
    ]
  },
  {
    id: 'regression-to-mean',
    name: 'Regression to the Mean (Misunderstanding)',
    category: 'Statistical Understanding',
    definition: 'The failure to recognize that extreme outcomes tend to be followed by more moderate ones, leading to incorrect causal conclusions.',
    commonTriggers: ['Extreme events', 'Intervention timing', 'Performance fluctuations'],
    examples: [
      'Attributing improvement after an extreme poor performance to a management change, when improvement was natural',
      'Crediting a coach for improvement when it\'s simply the athlete returning to their average level',
      'Implementing changes after terrible results and attributing the recovery to those changes'
    ],
    questions: [
      'Was this extreme result exceptional or typical for this situation?',
      'If nothing had changed, would performance have improved anyway?',
      'What would natural variation alone predict for the next period?',
      'Are you assuming the change you made caused the improvement?',
      'How do results compare to the historical average or trend?'
    ]
  },
  {
    id: 'survivorship-bias',
    name: 'Survivorship Bias',
    category: 'Information Processing',
    definition: 'The tendency to focus on successful examples while overlooking failed ones, leading to overly optimistic conclusions.',
    commonTriggers: ['Visible successes', 'Business analysis', 'Career decisions'],
    examples: [
      'Learning business strategies from billionaires\' advice while ignoring those who failed trying the same approach',
      'Following career paths of successful people while ignoring equally talented people who didn\'t succeed',
      'Believing risky strategies work because you see the wins, not the hidden losses'
    ],
    questions: [
      'Are you only looking at the successes while ignoring the failures?',
      'How many people tried this approach and failed?',
      'What happened to those who followed similar strategies but didn\'t succeed?',
      'Does the success rate match the visibility you have of it?',
      'What would the analysis look like if you included all attempts, not just successes?'
    ]
  },
  {
    id: 'selection-bias',
    name: 'Selection Bias',
    category: 'Information Processing',
    definition: 'The tendency to draw conclusions from non-representative samples that aren\'t properly randomized or selected.',
    commonTriggers: ['Convenience sampling', 'Self-selection', 'Filtered information'],
    examples: [
      'Assuming customer satisfaction based only on feedback from satisfied customers who bothered to respond',
      'Evaluating a product based only on reviews from enthusiasts, not average users',
      'Concluding a training program works based on employees who completed it, ignoring those who dropped out'
    ],
    questions: [
      'Are you drawing conclusions from a representative sample or only from readily available examples?',
      'Who is missing from your analysis that might have different experiences?',
      'Is there a systematic reason why certain people or cases are included while others are excluded?',
      'Would the conclusion change if you included all relevant cases, not just the ones you\'ve seen?',
      'What selection mechanism determined who got included in your sample?'
    ]
  },
  {
    id: 'backfire-effect',
    name: 'Backfire Effect',
    category: 'Information Processing',
    definition: 'The tendency to become more entrenched in a belief when presented with contradictory evidence.',
    commonTriggers: ['Identity-threatening information', 'Strongly held beliefs', 'Polarized issues'],
    examples: [
      'Dismissing fact-checks and becoming more convinced in a false belief',
      'Reacting negatively to evidence that contradicts your initial stance and doubling down',
      'Interpreting corrections as attacks and defending your position more strongly'
    ],
    questions: [
      'Are you rejecting evidence because it feels like an attack on your identity?',
      'How would you respond to this same information if it came from a trusted source?',
      'Are you becoming more entrenched rather than genuinely reconsidering?',
      'What would it take for you to reconsider your position?',
      'Can you separate the evidence from the messenger\'s intent?'
    ]
  },
  {
    id: 'empathy-gap',
    name: 'Empathy Gap',
    category: 'Judgment',
    definition: 'The difficulty in accurately imagining how differently you would think, feel, or act in a different emotional or physical state.',
    commonTriggers: ['Future emotions', 'Different experiences', 'Emotional transitions'],
    examples: [
      'Judging hungry people for overeating when you\'re full and not hungry',
      'Not understanding why someone made an angry decision when you\'re calm',
      'Thinking you\'ll stick to a strict diet while hungry at the grocery store'
    ],
    questions: [
      'Are you judging someone in a different emotional state than your current one?',
      'How would you feel or act if you were in their specific circumstances?',
      'Is it easy for you to remember what it was like to be in that state?',
      'Are you being fair to past or future versions of yourself?',
      'What would that person say about why they acted that way?'
    ]
  },
  {
    id: 'actor-observer-bias',
    name: 'Actor-Observer Bias',
    category: 'Judgment',
    definition: 'The tendency to attribute your own behaviors to external circumstances while attributing others\' behaviors to their character.',
    commonTriggers: ['Success/failure interpretation', 'Comparative judgment', 'Self-serving needs'],
    examples: [
      'Blaming a poor presentation on being tired, but assuming someone else did poorly because they\'re not good at presenting',
      'Attributing your late arrival to traffic while assuming someone else was just disorganized',
      'Crediting your success to effort while assuming others\' success came from luck or privilege'
    ],
    questions: [
      'Are you applying different standards to explain your behavior versus others\' behavior?',
      'What external factors affected the other person\'s situation that you might be overlooking?',
      'Would you accept the same explanation for your behavior that you\'re giving them?',
      'What role did character or ability play in your performance versus theirs?',
      'Are you being symmetrical in your attributions?'
    ]
  },
  {
    id: 'curse-of-knowledge',
    name: 'Curse of Knowledge',
    category: 'Mental Shortcut',
    definition: 'The difficulty in imagining what it\'s like to not know something you already know, or to imagine others lack knowledge you have.',
    commonTriggers: ['Expertise', 'Teaching', 'Communication gaps'],
    examples: [
      'A developer explaining technical concepts at too high a level for beginners to understand',
      'Assuming team members understand your context when you haven\'t explained it',
      'Writing instructions that are unclear because you know the process too well'
    ],
    questions: [
      'Are you assuming others understand things you take for granted?',
      'What basic steps or context might someone new need to know?',
      'How would you explain this to someone with no background in the field?',
      'What assumptions are embedded in your communication that aren\'t obvious?',
      'Have you tested your explanation with someone unfamiliar with the topic?'
    ]
  },
  {
    id: 'spotlight-effect',
    name: 'Spotlight Effect',
    category: 'Self-Assessment',
    definition: 'The tendency to overestimate how much others notice or care about your appearance, behavior, or mistakes.',
    commonTriggers: ['Self-consciousness', 'Social settings', 'Noticeable errors'],
    examples: [
      'Being extremely self-conscious about a small stain on your shirt when others don\'t notice it',
      'Believing everyone noticed your mistake or awkward comment when most people didn\'t register it',
      'Thinking you stand out negatively more than you actually do'
    ],
    questions: [
      'How much do you actually think others noticed or cared about this?',
      'If the situation were reversed, would you notice or remember this about someone else?',
      'Are you in a genuine spotlight or is it imagined?',
      'How long will people actually remember or care about this?',
      'Is your worry proportional to actual consequences?'
    ]
  },
  {
    id: 'mere-exposure-effect',
    name: 'Mere Exposure Effect',
    category: 'Mental Shortcut',
    definition: 'The tendency to develop a preference for things or people simply because you are familiar with them, even without positive interaction.',
    commonTriggers: ['Repeated exposure', 'Familiarity', 'Status quo'],
    examples: [
      'Growing to like a song you didn\'t enjoy initially through repeated listening',
      'Preferring a familiar brand even when objective quality hasn\'t changed',
      'Favoring existing team members in hiring because you\'re familiar with them'
    ],
    questions: [
      'Is your preference based on actual qualities or on familiarity?',
      'Would you like this equally if you hadn\'t been exposed to it repeatedly?',
      'Have you tried quality alternatives you might prefer but are less familiar with?',
      'Is familiarity creating an unfair advantage in your decision?',
      'What would a fresh evaluation reveal compared to your current preference?'
    ]
  },
  {
    id: 'semmelweis-reflex',
    name: 'Semmelweis Reflex',
    category: 'Information Processing',
    definition: 'The tendency to reject new information or evidence because it contradicts established practices or norms.',
    commonTriggers: ['Established methods', 'Institutional inertia', 'Expert credentials'],
    examples: [
      'Resisting a new technology because "we\'ve always done it this way"',
      'Dismissing research findings because they contradict established protocols',
      'Defending current practices against evidence of better alternatives'
    ],
    questions: [
      'Are you rejecting this idea because it\'s genuinely flawed, or because it\'s new?',
      'What would change your mind about the current approach?',
      'Has the evidence been properly reviewed by qualified experts?',
      'What are the costs of being wrong in clinging to the old way versus adopting the new?',
      'Are you defending the practice or defending your investment in it?'
    ]
  },
  {
    id: 'authority-bias',
    name: 'Authority Bias',
    category: 'Social Influence',
    definition: 'The tendency to attribute greater accuracy to the opinions of authority figures and be more likely to accept their statements as truth.',
    commonTriggers: ['Expert opinions', 'Hierarchical settings', 'Credentials'],
    examples: [
      'Accepting a doctor\'s recommendation without seeking second opinions from other qualified professionals',
      'Automatically deferring to senior management\'s views without independent analysis',
      'Trusting a celebrity endorser\'s claims about a product because of their status'
    ],
    questions: [
      'Are you accepting this because it\'s true or because of who said it?',
      'What would you think about this same statement from a non-authority?',
      'Have you independently verified the claims being made?',
      'Is this person actually an authority in this specific domain?',
      'What would other qualified experts say?'
    ]
  },
  {
    id: 'false-dilemma',
    name: 'False Dilemma (False Choice)',
    category: 'Decision Making',
    definition: 'The tendency to incorrectly limit decision-making to only two options when more alternatives exist.',
    commonTriggers: ['Extreme framing', 'Polarized debates', 'Limited information'],
    examples: [
      'Thinking you either need to accept a bad deal or walk away, when negotiation is possible',
      'Believing it\'s either their way or completely wrong, with no middle ground',
      'Presenting options as "stay or leave" when many intermediate choices exist'
    ],
    questions: [
      'Are there more than two options available?',
      'What middle-ground or hybrid approaches haven\'t you considered?',
      'Who benefits from you seeing only these two choices?',
      'What would happen if you combined elements of both approaches?',
      'What alternatives are you not seeing?'
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
 * Enhanced parameters for bias detection with richer context
 */
export interface EnhancedBiasFinderParams {
  stakes: 'Low' | 'Medium' | 'High';
  timePressure: 'Ample' | 'Moderate' | 'Rushed';
  emotionalState: string;
  decisionType?: 'hiring' | 'financial' | 'strategic' | 'interpersonal' | 'evaluation' | 'technical' | 'belief' | 'other';
  context?: string; // Free text to capture additional nuance
}

/**
 * Comprehensive emotional state keyword mapping
 */
const EMOTIONAL_STATE_KEYWORDS: Record<string, string[]> = {
  'anxious': ['anxious', 'nervous', 'worried', 'stressed', 'tense', 'afraid', 'scared', 'fearful'],
  'angry': ['angry', 'frustrated', 'irritated', 'annoyed', 'furious', 'enraged', 'bitter'],
  'excited': ['excited', 'enthusiastic', 'thrilled', 'energized', 'optimistic', 'hopeful', 'confident', 'pumped'],
  'calm': ['calm', 'peaceful', 'relaxed', 'serene', 'composed', 'collected'],
  'sad': ['sad', 'depressed', 'down', 'disappointed', 'discouraged', 'defeated', 'helpless'],
  'ashamed': ['ashamed', 'embarrassed', 'humiliated', 'guilty', 'regretful'],
  'overconfident': ['confident', 'sure', 'certain', 'convinced', 'know', 'expert'],
  'conflicted': ['conflicted', 'torn', 'confused', 'uncertain', 'unsure', 'ambivalent']
};

/**
 * Detect emotional states from free text
 */
function detectEmotionalStates(emotionalState: string): string[] {
  const lower = emotionalState.toLowerCase();
  const detected: string[] = [];

  for (const [emotion, keywords] of Object.entries(EMOTIONAL_STATE_KEYWORDS)) {
    if (keywords.some(keyword => lower.includes(keyword))) {
      detected.push(emotion);
    }
  }

  return detected.length > 0 ? detected : ['neutral'];
}

/**
 * Get biases likely given decision parameters - enhanced version
 */
export function getLikelyBiases(params: EnhancedBiasFinderParams): BiasDefinition[] {
  const likely: Map<string, number> = new Map(); // bias id -> confidence score
  const maxBiases = 5; // Allow up to 5 suggestions

  // Helper to add bias with confidence
  const addBias = (biasId: string, confidence: number) => {
    const current = likely.get(biasId) || 0;
    likely.set(biasId, Math.max(current, confidence));
  };

  const emotions = detectEmotionalStates(params.emotionalState);
  const context = (params.context || '').toLowerCase();

  // === STAKES-BASED BIASES ===
  if (params.stakes === 'High') {
    addBias('sunk-cost-fallacy', 0.9); // High stakes = past investment weighs heavily
    addBias('loss-aversion', 0.85);    // Fear of losing existing position
    addBias('overconfidence-bias', 0.8);
  }
  if (params.stakes === 'Medium') {
    addBias('anchoring-bias', 0.8);
    addBias('confirmation-bias', 0.75);
  }

  // === TIME PRESSURE BIASES ===
  if (params.timePressure === 'Rushed') {
    addBias('availability-heuristic', 0.9);  // What comes to mind first
    addBias('confirmation-bias', 0.85);      // No time to seek contradictions
    addBias('anchoring-bias', 0.8);
    addBias('planning-fallacy', 0.7);        // Quick estimates are often wrong
  } else if (params.timePressure === 'Ample') {
    addBias('status-quo-bias', 0.8);         // More time to deliberate = easier to stick with current
    addBias('mere-exposure-effect', 0.7);    // Familiarity bias increases with time
    addBias('overconfidence-bias', 0.75);    // More time to build false confidence
  }

  // === EMOTIONAL STATE BIASES ===
  if (emotions.includes('anxious')) {
    addBias('availability-heuristic', 0.9);  // Vivid fears come easily to mind
    addBias('negativity-bias', 0.85);        // Focus on threats
    addBias('loss-aversion', 0.8);
    addBias('empathy-gap', 0.7);
  }
  if (emotions.includes('angry')) {
    addBias('fundamental-attribution-error', 0.9);  // Angry at someone's behavior
    addBias('backfire-effect', 0.85);               // Defensive about evidence
    addBias('in-group-bias', 0.8);                  // Us vs them mentality
    addBias('recency-bias', 0.7);
  }
  if (emotions.includes('excited')) {
    addBias('overconfidence-bias', 0.95);   // Peak confidence
    addBias('optimism-bias', 0.9);
    addBias('illusion-of-control', 0.85);
    addBias('planning-fallacy', 0.8);       // Underestimate obstacles
  }
  if (emotions.includes('overconfident')) {
    addBias('dunning-kruger-effect', 0.95); // Core definition
    addBias('overconfidence-bias', 0.9);
    addBias('illusion-of-control', 0.85);
    addBias('curse-of-knowledge', 0.8);
  }
  if (emotions.includes('sad')) {
    addBias('negativity-bias', 0.85);
    addBias('false-memory', 0.8);           // Reconstruct sad narratives
    addBias('loss-aversion', 0.75);
  }
  if (emotions.includes('ashamed')) {
    addBias('cognitive-dissonance', 0.9);   // Conflicting self-image
    addBias('false-memory', 0.85);          // Rewrite embarrassing details
    addBias('backfire-effect', 0.8);        // Defensive about criticism
  }
  if (emotions.includes('conflicted')) {
    addBias('cognitive-dissonance', 0.95);
    addBias('framing-effect', 0.85);
    addBias('false-dilemma', 0.8);          // See only two options when conflicted
  }

  // === DECISION TYPE BIASES ===
  if (params.decisionType === 'hiring' || context.includes('hire') || context.includes('candidate')) {
    addBias('fundamental-attribution-error', 0.9);  // Judge candidate's character
    addBias('anchoring-bias', 0.85);                // First impression sticks
    addBias('recency-bias', 0.8);                   // Recent interview memory dominates
    addBias('in-group-bias', 0.75);                 // Favor similar candidates
    addBias('mere-exposure-effect', 0.7);           // Familiarity advantage
  }
  if (params.decisionType === 'financial' || context.includes('invest') || context.includes('money')) {
    addBias('overconfidence-bias', 0.9);
    addBias('availability-heuristic', 0.85);        // Recent market moves
    addBias('bandwagon-effect', 0.8);               // What others are doing
    addBias('loss-aversion', 0.85);                 // Fear of losses > desire for gains
    addBias('survivorship-bias', 0.8);              // Learning from winners, not losers
    addBias('selection-bias', 0.75);
  }
  if (params.decisionType === 'evaluation' || context.includes('rate') || context.includes('assess') || context.includes('perform')) {
    addBias('fundamental-attribution-error', 0.9);  // Blame character, not circumstance
    addBias('recency-bias', 0.85);                  // Recent performance dominates
    addBias('in-group-bias', 0.8);                  // Lenient with "our people"
    addBias('halo-effect-adjacent', 0.75);          // One trait colors all
  }
  if (params.decisionType === 'interpersonal' || context.includes('friend') || context.includes('team') || context.includes('relationship')) {
    addBias('fundamental-attribution-error', 0.95); // Judge their motives harshly
    addBias('actor-observer-bias', 0.9);            // Different standards for us vs them
    addBias('empathy-gap', 0.85);                   // Can't imagine their state
    addBias('in-group-bias', 0.8);
  }
  if (params.decisionType === 'belief' || context.includes('believe') || context.includes('true') || context.includes('opinion')) {
    addBias('confirmation-bias', 0.95);             // Core belief-matching behavior
    addBias('backfire-effect', 0.9);                // Reject contradictory evidence
    addBias('cognitive-dissonance', 0.85);
    addBias('false-consensus-effect', 0.8);         // Assume others agree
  }
  if (params.decisionType === 'strategic' || context.includes('plan') || context.includes('project') || context.includes('timeline')) {
    addBias('planning-fallacy', 0.95);              // Underestimate time/cost
    addBias('optimism-bias', 0.9);                  // Assume best case
    addBias('anchoring-bias', 0.8);                 // Initial estimate sticks
    addBias('illusion-of-control', 0.75);
  }
  if (params.decisionType === 'technical' || context.includes('data') || context.includes('analyz')) {
    addBias('clustering-illusion', 0.9);            // See patterns in noise
    addBias('selection-bias', 0.85);                // Look at filtered data
    addBias('survivorship-bias', 0.85);             // Look at successes
    addBias('regression-to-mean', 0.8);             // Misinterpret variance
  }

  // === CONTEXT-BASED BIASES ===
  if (context.includes('group') || context.includes('team') || context.includes('meeting')) {
    addBias('groupthink', 0.9);
    addBias('bandwagon-effect', 0.85);
    addBias('authority-bias', 0.8);                 // Leader's view dominates
    addBias('false-consensus-effect', 0.8);
  }
  if (context.includes('past') || context.includes('outcome') || context.includes('result') || context.includes('happened')) {
    addBias('hindsight-bias', 0.95);                // "I knew it would happen"
    addBias('false-memory', 0.85);                  // Reconstruct what we remember
    addBias('regression-to-mean', 0.8);             // Misinterpret how extreme events work
  }
  if (context.includes('new') || context.includes('change') || context.includes('different')) {
    addBias('semmelweis-reflex', 0.9);              // Reject the new
    addBias('status-quo-bias', 0.85);               // Prefer current
    addBias('loss-aversion', 0.8);                  // Fear what we might lose
  }
  if (context.includes('value') || context.includes('price') || context.includes('worth')) {
    addBias('endowment-effect', 0.9);               // Value what we have more
    addBias('anchoring-bias', 0.85);                // First price suggested sticks
    addBias('loss-aversion', 0.8);
  }
  if (context.includes('compare') || context.includes('versus') || context.includes('better')) {
    addBias('false-dilemma', 0.85);                 // See only two options
    addBias('framing-effect', 0.85);                // How it's presented matters
    addBias('bandwagon-effect', 0.75);              // What's popular matters
  }
  if (context.includes('news') || context.includes('media') || context.includes('social')) {
    addBias('availability-heuristic', 0.9);         // Vivid recent media
    addBias('negativity-bias', 0.9);                // Bad news sticks
    addBias('clustering-illusion', 0.8);            // See patterns in media
  }

  // === MITIGATING FACTORS ===
  // If they explicitly mention base rates, historical data, or seeking other views - reduce bias confidence
  if (context.includes('base rate') || context.includes('historical') || context.includes('past projects')) {
    for (const [biasId] of likely) {
      likely.set(biasId, likely.get(biasId)! * 0.8); // 20% reduction
    }
  }
  if (context.includes('expert') || context.includes('consult') || context.includes('second opinion')) {
    likely.delete('dunning-kruger-effect');
    likely.delete('overconfidence-bias');
    for (const [biasId] of likely) {
      likely.set(biasId, likely.get(biasId)! * 0.85);
    }
  }

  // Sort by confidence and return top N
  const sorted = Array.from(likely.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxBiases)
    .map(([biasId]) => getBiasById(biasId))
    .filter(Boolean) as BiasDefinition[];

  return sorted;
}

/**
 * Get all bias categories
 */
export function getAllCategories(): string[] {
  const categories = new Set(BIAS_LIBRARY.map(bias => bias.category));
  return Array.from(categories).sort();
}
