import React, { useState } from 'react';
import { JourneyCard } from '../types.ts';
import { Check } from 'lucide-react';

interface LearningCardProps {
  card: JourneyCard;
  isCompleted: boolean;
  onComplete: () => void;
}

export default function LearningCard({ card, isCompleted, onComplete }: LearningCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [pollAnswers, setPollAnswers] = useState<Record<string, number>>({});
  const [dragState, setDragState] = useState<Record<string, string>>({});
  const [reflectionText, setReflectionText] = useState('');

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
    <div className="w-full max-w-3xl mx-auto animate-fadeIn">
      <div
        className="bg-gradient-to-br from-neutral-800 via-neutral-850 to-neutral-900 rounded-2xl border border-accent/30 p-8 shadow-2xl overflow-hidden relative"
        style={{
          boxShadow: '0 20px 60px rgba(217, 170, 239, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.08)',
          background: 'linear-gradient(135deg, rgba(23, 23, 28, 1) 0%, rgba(30, 27, 38, 1) 50%, rgba(23, 23, 28, 1) 100%)',
        }}
      >
        {/* Glow background effect */}
        <div className="absolute inset-0 opacity-30" style={{
          background: 'radial-gradient(circle at 30% 20%, rgba(217, 170, 239, 0.1) 0%, transparent 50%)',
        }} />

        <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex-1">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-accent via-purple-400 to-accent bg-clip-text text-transparent mb-2">{card.title}</h2>
            <p className="text-slate-300 leading-relaxed">{card.description}</p>
          </div>
          {isCompleted && (
            <div className="ml-4 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/20 to-green-500/10 border border-green-500/50 rounded-xl animate-pulse">
              <Check size={16} className="text-green-400" />
              <span className="text-sm font-semibold text-green-300">Completed</span>
            </div>
          )}
        </div>

        {/* Image/Video */}
        {card.imageUrl && (
          <div className="mb-8 rounded-xl overflow-hidden bg-neutral-700 aspect-video flex items-center justify-center group cursor-pointer border border-accent/20 hover:border-accent/40 transition-all">
            <img
              src={card.imageUrl}
              alt={card.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
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

        {/* Audio Player */}
        {card.audioUrl && (
          <div className="mb-8 p-6 bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl border border-accent/30 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center border border-accent/40">
                <span className="text-2xl">🎵</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-300 mb-2">Audio Guidance</p>
                <audio
                  src={card.audioUrl}
                  controls
                  className="w-full"
                  style={{ height: '40px' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Interaction Based on Type */}
        <div className="mb-6">
          {card.interactionType === 'text' && (
            <p className="text-slate-300 leading-relaxed">{card.description}</p>
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
            className="w-full px-4 py-3 bg-gradient-to-r from-accent/20 to-accent/10 border border-accent/40 rounded-lg hover:bg-accent/30 transition-all font-semibold text-accent hover:text-accent-light"
          >
            Continue Reading
          </button>
        )}
        </div>
      </div>
    </div>
  );
}
