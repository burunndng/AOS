import React, { useState } from 'react';
import { X, ArrowLeft, ArrowRight, Play, Pause } from 'lucide-react';

interface IntroductionScreen {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  videoUrl: string;
  keyPoints: string[];
  benefits: string[];
}

const introductionScreens: IntroductionScreen[] = [
  {
    id: 'vipassana',
    title: 'Vipassana',
    subtitle: 'Insight Meditation',
    description: 'Vipassana, meaning "to see clearly," is an ancient meditation technique that develops insight into the nature of reality through careful observation of physical sensations and mental phenomena. This practice cultivates mindfulness and equanimity, leading to profound understanding of impermanence, suffering, and non-self.',
    videoUrl: 'https://files.catbox.moe/p9ctae.mp4',
    keyPoints: [
      'Focus on direct observation of bodily sensations and mental states',
      'Systematic body scanning technique from head to toe',
      'Non-judgmental awareness of arising and passing phenomena',
      'Development of equanimity and acceptance'
    ],
    benefits: [
      'Deep insight into the nature of mind and reality',
      'Reduction of anxiety and stress through equanimity',
      'Enhanced emotional regulation and stability',
      'Greater clarity and understanding of patterns'
    ]
  },
  {
    id: 'metta',
    title: 'Metta',
    subtitle: 'Loving-Kindness Meditation',
    description: 'Metta, or loving-kindness, is a practice of cultivating unconditional goodwill and compassion toward yourself and all beings. By systematically directing waves of loving-kindness first toward yourself, then loved ones, neutral people, difficult people, and finally all sentient beings, this practice opens the heart and dissolves barriers.',
    videoUrl: 'https://files.catbox.moe/winwhh.mp4',
    keyPoints: [
      'Systematic cultivation of goodwill toward self and others',
      'Use of phrases like "May I be happy, may I be healthy"',
      'Expansion from loved ones to all beings',
      'Transformation of difficult emotions into compassion'
    ],
    benefits: [
      'Increased compassion and empathy for yourself and others',
      'Reduced anger, resentment, and difficult emotions',
      'Enhanced sense of connection and belonging',
      'Greater emotional resilience and heart opening'
    ]
  },
  {
    id: 'samatha',
    title: 'Samatha',
    subtitle: 'Concentration Meditation',
    description: 'Samatha, meaning "tranquility," develops deep mental focus and concentration through sustained attention on a single object. By training the mind to settle on a chosen point of focus—such as the breath—practitioners cultivate profound calm, clarity, and stability. This foundation supports all other meditation practices.',
    videoUrl: 'https://files.catbox.moe/p9ctae.mp4',
    keyPoints: [
      'Sustained focus on a single object (breath, mantra, visual focus)',
      'Gentle return to focus whenever attention wanders',
      'Progressive deepening of mental absorption',
      'Cultivation of one-pointed attention'
    ],
    benefits: [
      'Deep mental calm and peace',
      'Enhanced concentration and focus in daily life',
      'Reduced mental agitation and racing thoughts',
      'Preparation for advanced meditation practices'
    ]
  }
];

interface MeditationIntroductionScreensProps {
  onClose: () => void;
}

export default function MeditationIntroductionScreens({ onClose }: MeditationIntroductionScreensProps) {
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentScreen = introductionScreens[currentScreenIndex];

  const handleNext = () => {
    if (currentScreenIndex < introductionScreens.length - 1) {
      setCurrentScreenIndex(prev => prev + 1);
      setIsPlaying(false);
    }
  };

  const handleBack = () => {
    if (currentScreenIndex > 0) {
      setCurrentScreenIndex(prev => prev - 1);
      setIsPlaying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-100">Meditation Types</h1>
              <p className="text-slate-400 text-sm">Screen {currentScreenIndex + 1} of {introductionScreens.length}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition">
              <X size={24} className="text-slate-400" />
            </button>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-neutral-800 to-neutral-700 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentScreenIndex + 1) / introductionScreens.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <h2 className="text-4xl font-bold text-slate-100">{currentScreen.title}</h2>
              <p className="text-xl text-slate-400">{currentScreen.subtitle}</p>
            </div>

            {/* Video */}
            <div className="relative w-full bg-black rounded-lg overflow-hidden">
              <video
                className="w-full h-auto max-h-[400px] object-cover"
                muted
                controls={false}
                autoPlay={false}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              >
                <source src={currentScreen.videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              {!isPlaying && (
                <button
                  onClick={(e) => {
                    const video = (e.currentTarget.parentElement?.querySelector('video') as HTMLVideoElement);
                    video?.play();
                  }}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition"
                >
                  <Play size={64} className="text-white" fill="white" />
                </button>
              )}
            </div>

            {/* Description */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <p className="text-slate-300 leading-relaxed">{currentScreen.description}</p>
            </div>

            {/* Key Points */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-slate-100">Key Points</h3>
              <div className="grid gap-2">
                {currentScreen.keyPoints.map((point, i) => (
                  <div key={i} className="flex items-start gap-3 bg-slate-800/30 border border-slate-700/50 rounded-lg p-3">
                    <div className="bg-accent/20 text-accent w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-xs">
                      {i + 1}
                    </div>
                    <p className="text-sm text-slate-300">{point}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-slate-100">Benefits</h3>
              <div className="grid md:grid-cols-2 gap-2">
                {currentScreen.benefits.map((benefit, i) => (
                  <div key={i} className="flex items-start gap-2 bg-green-900/20 border border-green-700/50 rounded-lg p-3">
                    <span className="text-green-400 font-bold text-lg flex-shrink-0">✓</span>
                    <p className="text-sm text-slate-300">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="flex-shrink-0 border-t border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={currentScreenIndex === 0}
              className={`px-6 py-2 rounded-lg font-medium transition inline-flex items-center gap-2 ${
                currentScreenIndex === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-slate-700 text-slate-100 hover:bg-slate-600'
              }`}
            >
              <ArrowLeft size={20} />
              Back
            </button>

            <span className="text-slate-400 text-sm">
              {currentScreenIndex + 1} of {introductionScreens.length}
            </span>

            <button
              onClick={handleNext}
              disabled={currentScreenIndex === introductionScreens.length - 1}
              className={`px-6 py-2 rounded-lg font-medium transition inline-flex items-center gap-2 ${
                currentScreenIndex === introductionScreens.length - 1
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'btn-luminous'
              }`}
            >
              Next
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
