export interface HealingAudio {
  id: string;
  title: string;
  description: string;
  url: string;
  duration?: string;
  category: 'grounding' | 'breathing' | 'hypnosis' | 'nervous-system';
  symbol: string; // Occult/alchemical symbol
}

export const healingAudios: HealingAudio[] = [
  {
    id: 'pendulation',
    title: 'Pendulation: Building Nervous System Resilience',
    description: 'A guided practice to develop nervous system resilience through gentle pendulation between sensations.',
    url: 'https://files.catbox.moe/hl3vo9.mp3',
    category: 'nervous-system',
    symbol: '❂', // Alchemical symbol
  },
  {
    id: 'grounding-5-4-3-2-1',
    title: 'Grounding: 5-4-3-2-1',
    description: 'A sensory grounding technique using the 5-4-3-2-1 method to anchor yourself in the present moment.',
    url: 'https://files.catbox.moe/f52h34.mp3',
    category: 'grounding',
    symbol: '⬇', // Descent/grounding symbol
  },
  {
    id: 'coherent-breathing',
    title: 'Coherent Breathing',
    description: 'A rhythmic breathing practice to synchronize your breath and cultivate coherence within body and mind.',
    url: 'https://files.catbox.moe/shtgh3.mp3',
    category: 'breathing',
    symbol: '∿', // Wave/breath symbol
  },
  {
    id: 'self-hypnosis-esteem',
    title: 'Self-hypnosis: Self-Esteem & Natural Confidence',
    description: 'A hypnotic journey to strengthen your sense of worth and activate natural confidence from within.',
    url: 'https://files.catbox.moe/0x0nhh.mp3',
    category: 'hypnosis',
    symbol: '◆', // Inner gem/essence
  },
  {
    id: 'self-hypnosis-home',
    title: 'Self-hypnosis: Coming Home to Yourself',
    description: 'A transformative hypnotic experience to reconnect with your authentic self and inner sanctuary.',
    url: 'https://files.catbox.moe/zkplz4.mp3',
    category: 'hypnosis',
    symbol: '⬢', // Hexagram/center
  },
];

export const audioCategories = {
  'grounding': 'Grounding Practices',
  'breathing': 'Breathing Techniques',
  'hypnosis': 'Self-Hypnosis Journeys',
  'nervous-system': 'Nervous System Practices',
};
