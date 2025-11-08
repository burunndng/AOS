import React, { useState } from 'react';
import { JourneyCard } from '../types.ts';
import { Volume2, Play, Check } from 'lucide-react';

interface LearningCardProps {
  card: JourneyCard;
  isCompleted: boolean;
  onComplete: () => void;
}

export default function LearningCard({ card, isCompleted, onComplete }: LearningCardProps) {
  const [showAudio, setShowAudio] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [pollAnswers, setPollAnswers] = useState<Record<string, number>>({});
  const [dragState, setDragState] = useState<Record<string, string>>({});
  const [reflectionText, setReflectionText] = useState('');

  const playAudio = async () => {
    if (card.audioScript) {
      setShowAudio(true);
      // In production, call Gemini TTS API here
    }
  };

  const handleQuizAnswer = (index: number) => {
    setSelectedAnswer(index);
    if (card.quizQuestion && index === card.quizQuestion.correct) {
      setTimeout(onComplete, 500);
    }
  };

  const handlePoll = (option: string) => {
    setPollAnswers({ ...pollAnswers, [card.id]: 1 });
    onComplete();
  };

  const handleReflectionSubmit = () => {
    if (reflectionText.trim()) {
      // Save reflection locally
      localStorage.setItem(`reflection-${card.id}`, reflectionText);
      onComplete();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-xl border border-accent/20 p-8 shadow-xl"
        style={{
          boxShadow: '0 8px 32px rgba(217, 170, 239, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-accent mb-2">{card.title}</h2>
            <p className="text-slate-300">{card.description}</p>
          </div>
          {isCompleted && (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-500/40 rounded-lg">
              <Check size={16} className="text-green-400" />
              <span className="text-sm text-green-300">Completed</span>
            </div>
          )}
        </div>

        {/* Image/Video */}
        {card.imageUrl && (
          <div className="mb-6 rounded-lg overflow-hidden bg-neutral-700 aspect-video flex items-center justify-center">
            <img src={card.imageUrl} alt={card.title} className="w-full h-full object-cover" />
          </div>
        )}

        {card.videoUrl && (
          <div className="mb-6 rounded-lg overflow-hidden bg-neutral-700 aspect-video">
            <video
              src={card.videoUrl}
              controls
              className="w-full h-full"
              style={{ backgroundColor: '#000' }}
            />
          </div>
        )}

        {/* Audio Button */}
        {card.audioScript && (
          <button
            onClick={playAudio}
            className="flex items-center gap-2 px-4 py-2 bg-accent/20 border border-accent/40 rounded-lg hover:bg-accent/30 transition-all mb-6 text-accent"
          >
            <Volume2 size={18} />
            <span>Hear It (60 seconds)</span>
          </button>
        )}

        {/* Interaction Based on Type */}
        <div className="mb-6">
          {card.interactionType === 'text' && (
            <p className="text-slate-300 leading-relaxed">{card.audioScript}</p>
          )}

          {card.interactionType === 'poll' && card.interactionData?.options && (
            <div className="space-y-3">
              <p className="font-semibold text-slate-200 mb-4">
                {card.interactionData.question}
              </p>
              <div className="space-y-2">
                {card.interactionData.options.map((option: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => handlePoll(option)}
                    className="w-full text-left px-4 py-3 bg-neutral-700 hover:bg-accent/20 border border-neutral-600 hover:border-accent/40 rounded-lg transition-all"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {card.interactionType === 'quiz' && card.quizQuestion && (
            <div>
              <p className="font-semibold text-slate-200 mb-4">{card.quizQuestion.question}</p>
              <div className="space-y-2">
                {card.quizQuestion.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuizAnswer(idx)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all border ${
                      selectedAnswer === idx
                        ? idx === card.quizQuestion?.correct
                          ? 'bg-green-500/20 border-green-500 text-green-300'
                          : 'bg-red-500/20 border-red-500 text-red-300'
                        : 'bg-neutral-700 border-neutral-600 hover:border-accent/40'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {selectedAnswer !== null && selectedAnswer === card.quizQuestion.correct && (
                <p className="text-green-400 mt-4 flex items-center gap-2">
                  <Check size={16} /> Correct!
                </p>
              )}
            </div>
          )}

          {card.interactionType === 'reflection' && (
            <div>
              <p className="font-semibold text-slate-200 mb-4">
                {card.interactionData?.prompt}
              </p>
              <textarea
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                placeholder="Write your reflection here..."
                className="w-full px-4 py-3 bg-neutral-700 border border-neutral-600 rounded-lg text-slate-200 placeholder-slate-500 focus:border-accent/40 focus:outline-none resize-none h-32"
              />
              <button
                onClick={handleReflectionSubmit}
                disabled={!reflectionText.trim()}
                className="mt-4 px-4 py-2 bg-accent/20 border border-accent/40 rounded-lg hover:bg-accent/30 transition-all disabled:opacity-50 text-accent"
              >
                Save Reflection
              </button>
            </div>
          )}

          {card.interactionType === 'drag-drop' && card.interactionData?.pairs && (
            <div>
              <p className="font-semibold text-slate-200 mb-4">
                {card.interactionData.question}
              </p>
              <div className="grid grid-cols-2 gap-4">
                {card.interactionData.pairs.map((pair: any, idx: number) => (
                  <div key={idx} className="text-center">
                    <div className="px-3 py-2 bg-neutral-700 rounded-lg border border-neutral-600 text-sm text-slate-300 mb-2">
                      {pair.item}
                    </div>
                    <div className="px-3 py-2 bg-accent/20 rounded-lg border border-accent/40 text-sm text-accent">
                      {pair.practice}
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={onComplete}
                className="mt-4 w-full px-4 py-2 bg-accent/20 border border-accent/40 rounded-lg hover:bg-accent/30 transition-all text-accent"
              >
                Mark as Understood
              </button>
            </div>
          )}
        </div>

        {/* Complete Button */}
        {!isCompleted && card.interactionType === 'text' && (
          <button
            onClick={onComplete}
            className="w-full px-4 py-3 bg-accent/20 border border-accent/40 rounded-lg hover:bg-accent/30 transition-all font-semibold text-accent"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
