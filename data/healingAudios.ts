export interface HealingAudio {
  id: string;
  title: string;
  description: string;
  url: string;
  duration?: string;
  category: 'grounding' | 'breathing' | 'hypnosis' | 'nervous-system';
  symbol: string; // Occult/alchemical symbol
  goal?: string;
  mechanism?: string;
}

export const healingAudios: HealingAudio[] = [
  {
    id: 'pendulation',
    title: 'Pendulation: Building Nervous System Resilience',
    description: 'A guided practice to develop nervous system resilience through gentle pendulation between sensations.',
    url: 'https://files.catbox.moe/hl3vo9.mp3',
    category: 'nervous-system',
    symbol: '🝅', // Alchemical symbol - essence/vibration
  },
  {
    id: 'grounding-5-4-3-2-1',
    title: 'Grounding: 5-4-3-2-1',
    description: 'A sensory grounding technique using the 5-4-3-2-1 method to anchor yourself in the present moment.',
    url: 'https://files.catbox.moe/f52h34.mp3',
    category: 'grounding',
    symbol: '🜉', // Alchemical earth symbol
  },
  {
    id: 'coherent-breathing',
    title: 'Coherent Breathing',
    description: 'A rhythmic breathing practice to synchronize your breath and cultivate coherence within body and mind.',
    url: 'https://files.catbox.moe/shtgh3.mp3',
    category: 'breathing',
    symbol: '🜈', // Alchemical air/wind symbol
  },
  {
    id: 'self-hypnosis-esteem',
    title: 'Self-hypnosis: Self-Esteem & Natural Confidence',
    description: 'A hypnotic journey to strengthen your sense of worth and activate natural confidence from within.',
    url: 'https://files.catbox.moe/0x0nhh.mp3',
    category: 'hypnosis',
    symbol: '🝦', // Alchemical transformation symbol
  },
  {
    id: 'self-hypnosis-home',
    title: 'Self-hypnosis: Coming Home to Yourself',
    description: 'A transformative hypnotic experience to reconnect with your authentic self and inner sanctuary.',
    url: 'https://files.catbox.moe/zkplz4.mp3',
    category: 'hypnosis',
    symbol: '🜌', // Alchemical integration/center symbol
  },
  {
    id: 'untangled-mind',
    title: 'The Untangled Mind',
    description: 'Create distance from anxious thoughts via cognitive defusion using ACT-based techniques to observe thoughts without being entangled by them.',
    url: 'https://files.catbox.moe/oszgba.mp3',
    category: 'nervous-system',
    symbol: '🝪', // Alchemical separation/distillation symbol
    goal: 'Create distance from anxious thoughts via cognitive defusion',
    mechanism: '(C) Cognitive Reframing (ACT-based defusion)',
  },
  {
    id: 'vast-perspective',
    title: 'The Vast Perspective (Awe Induction)',
    description: 'An expansive journey to induce states of awe and transcendence, opening your perspective to the vastness of experience.',
    url: 'https://files.catbox.moe/ym0w5v.mp3',
    category: 'hypnosis',
    symbol: '🝮', // Alchemical expansion/infinity symbol
  },
  {
    id: 'effortless-drift',
    title: 'The Effortless Drift (Sleep Insomnia)',
    description: 'A gentle guided practice to release the struggle with sleep and allow yourself to drift naturally into restful slumber.',
    url: 'https://files.catbox.moe/xalace.mp3',
    category: 'hypnosis',
    symbol: '🜍', // Alchemical dissolution/sleep symbol
  },
  {
    id: 'skillful-wait',
    title: 'The Skillful Wait (Urge Surfing)',
    description: 'Master the art of urge surfing by learning to skillfully wait and ride the waves of intense sensations without acting on them.',
    url: 'https://files.catbox.moe/y3aoyc.mp3',
    category: 'nervous-system',
    symbol: '🝖', // Alchemical patience/time symbol
  },
];

export const audioCategories = {
  'grounding': 'Grounding Practices',
  'breathing': 'Breathing Techniques',
  'hypnosis': 'Self-Hypnosis Journeys',
  'nervous-system': 'Nervous System Practices',
};
