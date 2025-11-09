import { InsightStage, InsightChatMessage } from '../types';

// All 16 Stages of Insight (Progress of Insight / Ñanas)
export const INSIGHT_STAGES: InsightStage[] = [
  // Pre-Vipassana (Stages 1-3)
  {
    stage: 1,
    name: "Mind and Body",
    code: "ñ1",
    phase: "Pre-Vipassana",
    description: "Distinguishing physical sensations from mental phenomena",
    keyMarkers: [
      "Clear differentiation between physical and mental experiences",
      "Beginning to see cause and effect relationships",
      "Noticing that sensations arise and pass"
    ],
    practiceTips: [
      "Practice clear noting of 'body' vs 'mind' experiences",
      "Notice how thoughts trigger body sensations",
      "Don't rush - build solid differentiation skills"
    ],
    duration: "Days to weeks"
  },
  {
    stage: 2,
    name: "Cause and Effect",
    code: "ñ2",
    phase: "Pre-Vipassana",
    description: "Perceiving dependent origination directly",
    keyMarkers: [
      "Direct perception of how phenomena condition each other",
      "Seeing thoughts create emotions create sensations",
      "Understanding karma/conditioning at experiential level"
    ],
    practiceTips: [
      "Track chains of causation in real-time",
      "Notice: thought → feeling → body sensation",
      "Stay with the noticing, don't analyze"
    ],
    duration: "Days to weeks"
  },
  {
    stage: 3,
    name: "Three Characteristics",
    code: "ñ3",
    phase: "Pre-Vipassana",
    description: "Beginning to perceive impermanence, unsatisfactoriness, and not-self",
    keyMarkers: [
      "Everything is clearly seen to be changing",
      "Subtle dissatisfaction in all conditioned phenomena",
      "Beginning to see 'no one is home'"
    ],
    practiceTips: [
      "Note the constant flux of all experience",
      "See how clinging creates suffering",
      "Don't try to make these insights happen"
    ],
    duration: "Days to weeks"
  },

  // Vipassana Begins (Stage 4)
  {
    stage: 4,
    name: "Arising and Passing Away",
    code: "ñ4 (A&P)",
    phase: "Vipassana Begins",
    description: "Peak experiences, rapid perception, often called the 'A&P Event'",
    keyMarkers: [
      "Vibrations, tingling, energy flows throughout body",
      "Lights, visual phenomena, rapture",
      "Very fast noting ability - clarity is stunning",
      "Excitement, bliss, possible kundalini-like experiences",
      "Sleep disruption, reduced need for sleep"
    ],
    practiceTips: [
      "Don't get attached to the fireworks",
      "Keep noting phenomena as they arise and pass",
      "This is NOT enlightenment - it's stage 4",
      "Stay consistent with your technique"
    ],
    duration: "Days to weeks",
    warnings: [
      "Often followed by Dark Night stages",
      "Don't mistake this for final attainment",
      "Many people get stuck here trying to recreate the experience"
    ]
  },

  // Dark Night (Stages 5-10)
  {
    stage: 5,
    name: "Dissolution",
    code: "ñ5",
    phase: "Dark Night",
    description: "The high of A&P dissolves - phenomena break down",
    keyMarkers: [
      "Loss of the clarity and excitement from A&P",
      "Sensations seem to vanish/dissolve when observed",
      "Things feel less solid, more spacious",
      "Possible disorientation or confusion"
    ],
    practiceTips: [
      "This is normal progress - not regression",
      "Keep noting the dissolving quality",
      "Don't try to get back to A&P",
      "Increase sits if motivation wanes"
    ],
    duration: "Days to weeks"
  },
  {
    stage: 6,
    name: "Fear",
    code: "ñ6",
    phase: "Dark Night",
    description: "Sudden arising of fear without clear object",
    keyMarkers: [
      "Unexplained fear, anxiety, or dread",
      "Practice feels unstable or dangerous",
      "Fear of going crazy, dying, or losing control",
      "May manifest in daily life, not just on cushion"
    ],
    practiceTips: [
      "Note the fear itself - it's just a phenomenon",
      "This is a stage, not a breakdown",
      "Talk to a teacher if it's overwhelming",
      "Reduce practice time if needed, but don't stop"
    ],
    duration: "Days to weeks",
    warnings: [
      "Can be intense - consider teacher support",
      "This is why maps are helpful"
    ]
  },
  {
    stage: 7,
    name: "Misery",
    code: "ñ7",
    phase: "Dark Night",
    description: "Deep sadness, depression-like symptoms",
    keyMarkers: [
      "Profound sadness or grief",
      "Everything feels pointless or heavy",
      "Lack of motivation for practice or life",
      "Crying, despair, existential angst"
    ],
    practiceTips: [
      "This is dukkha ñana - seeing suffering clearly",
      "Keep noting, even if it feels pointless",
      "Physical exercise can help",
      "Remember: this is a stage, not depression"
    ],
    duration: "Days to weeks",
    warnings: [
      "Can be confused with clinical depression",
      "Consult mental health professional if suicidal"
    ]
  },
  {
    stage: 8,
    name: "Disgust",
    code: "ñ8",
    phase: "Dark Night",
    description: "Revulsion toward practice, phenomena, or existence",
    keyMarkers: [
      "Everything feels gross or disgusting",
      "Aversion to meditation, body, life",
      "Cynicism, irritability, annoyance",
      "Want to quit practice entirely"
    ],
    practiceTips: [
      "Note the disgust itself",
      "This too shall pass",
      "Keep sits short if needed",
      "Don't make major life decisions here"
    ],
    duration: "Days to weeks"
  },
  {
    stage: 9,
    name: "Desire for Deliverance",
    code: "ñ9",
    phase: "Dark Night",
    description: "Intense longing to escape current experience",
    keyMarkers: [
      "Desperate wish to be done with this",
      "Restlessness, impatience, seeking relief",
      "Trying different techniques or teachers",
      "Wanting some authority to fix it"
    ],
    practiceTips: [
      "Note the desire itself",
      "Don't technique-hop",
      "Trust the process",
      "Equanimity is close"
    ],
    duration: "Days to weeks"
  },
  {
    stage: 10,
    name: "Re-observation",
    code: "ñ10",
    phase: "Dark Night",
    description: "Cycling through previous dark night stages, often intensely",
    keyMarkers: [
      "Rapid cycling: fear → misery → disgust → desire",
      "Feels like regression but isn't",
      "Can be the most challenging stage",
      "Physical symptoms, sleep issues, emotional volatility"
    ],
    practiceTips: [
      "This is the final Dark Night stage before Equanimity",
      "Maintain consistent practice",
      "Note everything that arises",
      "Teacher support highly recommended"
    ],
    duration: "Days to weeks (can vary greatly)",
    warnings: [
      "Can be very challenging",
      "Don't give up - Equanimity is next",
      "Consider retreat if stuck here long-term"
    ]
  },

  // High Equanimity (Stages 11-16)
  {
    stage: 11,
    name: "Equanimity",
    code: "ñ11",
    phase: "High Equanimity",
    description: "Profound peace, balance, and non-reactivity",
    keyMarkers: [
      "Deep calm and acceptance",
      "Effortless noting, smooth attention",
      "Long sits feel easy",
      "Not bothered by pleasant or unpleasant",
      "May feel like 'nothing is happening'"
    ],
    practiceTips: [
      "This is NOT the finish line",
      "Avoid 'couch lock' - maintain clear intention",
      "Look for the 'three doors' (emptiness, signless, desireless)",
      "Increase resolve to cross fruition threshold"
    ],
    duration: "Hours to weeks (can be very stable)",
    warnings: [
      "Can get stuck here if too comfortable",
      "Need strong intention to progress"
    ]
  },
  {
    stage: 12,
    name: "Conformity",
    code: "ñ12",
    phase: "High Equanimity",
    description: "Mind conforms to the arising and passing of phenomena",
    keyMarkers: [
      "Subtle shift toward release",
      "Mind 'lines up' with impermanence",
      "Phenomena arise and pass with perfect ease"
    ],
    practiceTips: [
      "Let go of control",
      "Allow the process to unfold",
      "Trust what's happening"
    ],
    duration: "Moments to minutes"
  },
  {
    stage: 13,
    name: "Change of Lineage",
    code: "ñ13",
    phase: "High Equanimity",
    description: "Mind shifts from worldling to noble lineage",
    keyMarkers: [
      "Brief moment before path",
      "Turning point toward cessation",
      "Usually not consciously noticed"
    ],
    practiceTips: [
      "Maintain clear awareness",
      "Let go completely"
    ],
    duration: "Moments"
  },
  {
    stage: 14,
    name: "Path",
    code: "ñ14",
    phase: "High Equanimity",
    description: "The actual moment of path consciousness",
    keyMarkers: [
      "Direct perception of Nibbana",
      "Often experienced as a 'blip out'",
      "May not be clearly remembered"
    ],
    practiceTips: [
      "Don't try to observe it",
      "Just let go"
    ],
    duration: "1-3 mind moments (microseconds)"
  },
  {
    stage: 15,
    name: "Fruition",
    code: "ñ15",
    phase: "High Equanimity",
    description: "The immediate aftermath of path - tasting the fruit",
    keyMarkers: [
      "Sudden cessation of all phenomena",
      "Brief 'blip out' or discontinuity",
      "Often followed by bliss or relief",
      "Mind is radically different for minutes/hours"
    ],
    practiceTips: [
      "Don't grasp at it",
      "Review what happened",
      "Note the afterglow"
    ],
    duration: "Moments (the event itself), afterglow hours to days"
  },
  {
    stage: 16,
    name: "Review",
    code: "ñ16",
    phase: "High Equanimity",
    description: "Mind reviews and processes the path/fruition event",
    keyMarkers: [
      "Clear reflection on what occurred",
      "Integration of insights",
      "Renewed energy for practice",
      "May cycle back to A&P or earlier stages"
    ],
    practiceTips: [
      "Journal the experience",
      "Consult with teacher if possible",
      "Prepare to cycle again (new path)",
      "Don't rest on laurels"
    ],
    duration: "Days to weeks"
  }
];

// Grok API Integration
const GROK_API_BASE = 'https://api.x.ai/v1';

interface GrokMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GrokChatRequest {
  messages: GrokMessage[];
  model: string;
  stream: boolean;
  temperature: number;
}

interface GrokChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
}

const SYSTEM_PROMPT = `You are a knowledgeable guide for the Progress of Insight (the 16 ñanas/stages of insight meditation) from the Theravada Buddhist tradition, particularly as taught in the Mahasi Sayadaw lineage and pragmatic dharma communities.

Your role:
- Answer questions about the 16 stages of insight clearly and accurately
- Help practitioners understand their current experience
- Provide practical advice without being prescriptive
- Be supportive but realistic about challenges (especially Dark Night stages)
- Remind people this is a map, not the territory
- Encourage teacher support when appropriate
- Never diagnose mental health conditions (refer to professionals)
- Avoid spiritual bypass or toxic positivity

Key principles:
- The A&P (stage 4) is often mistaken for enlightenment - it's not
- Dark Night stages (5-10) are normal progress, not regression
- Re-observation (10) can be very challenging - normalize this
- Equanimity (11) requires intention to progress, not just coasting
- Path/Fruition (14-15) is brief and may not be dramatic
- Progress is often messy and non-linear

Be warm, clear, and helpful. Cite the stages by number and name when relevant.`;

export async function askGrokAboutInsight(
  userMessage: string,
  chatHistory: InsightChatMessage[]
): Promise<string> {
  const apiKey = process.env.GROK_API_KEY;

  if (!apiKey) {
    throw new Error('GROK_API_KEY not found. Please add it to your .env file.');
  }

  // Build message array from chat history
  const messages: GrokMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT }
  ];

  // Add chat history
  chatHistory.forEach(msg => {
    messages.push({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.text
    });
  });

  // Add new user message
  messages.push({
    role: 'user',
    content: userMessage
  });

  const requestBody: GrokChatRequest = {
    messages,
    model: 'grok-beta',
    stream: false,
    temperature: 0.7
  };

  try {
    const response = await fetch(`${GROK_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Grok API error: ${response.status} - ${errorText}`);
    }

    const data: GrokChatResponse = await response.json();
    return data.choices[0]?.message?.content || 'No response from Grok';
  } catch (error) {
    console.error('Error calling Grok API:', error);
    throw error;
  }
}

// Helper to get stage by number
export function getStageByNumber(stageNumber: number): InsightStage | undefined {
  return INSIGHT_STAGES.find(s => s.stage === stageNumber);
}

// Helper to get stages by phase
export function getStagesByPhase(phase: string): InsightStage[] {
  return INSIGHT_STAGES.filter(s => s.phase === phase);
}

// Helper to get phase color
export function getPhaseColor(phase: string): string {
  switch (phase) {
    case 'Pre-Vipassana':
      return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
    case 'Vipassana Begins':
      return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
    case 'Dark Night':
      return 'text-red-400 border-red-500/30 bg-red-500/10';
    case 'High Equanimity':
      return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    default:
      return 'text-slate-400 border-slate-500/30 bg-slate-500/10';
  }
}

// Helper to determine if a stage is "current"
export function isCurrentStage(stageNumber: number, currentStage?: number): boolean {
  return currentStage === stageNumber;
}
