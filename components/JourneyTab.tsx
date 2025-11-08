import React, { useState, useEffect } from 'react';
import { journeyRegions, journeyBadges } from '../data/journeyContent.ts';
import { JourneyProgress } from '../types.ts';
import LearningCard from './LearningCard.tsx';
import { ChevronLeft, ChevronRight, MapPin, Trophy } from 'lucide-react';

interface JourneyTabProps {
  journeyProgress: JourneyProgress;
  updateJourneyProgress: (progress: JourneyProgress) => void;
}

export default function JourneyTab({ journeyProgress, updateJourneyProgress }: JourneyTabProps) {
  const [selectedRegion, setSelectedRegion] = useState<string>(
    journeyProgress.currentRegion || 'core'
  );
  const [selectedCardIndex, setSelectedCardIndex] = useState<number>(0);

  const currentRegion = journeyRegions.find((r) => r.id === selectedRegion);
  const currentCard = currentRegion?.cards[selectedCardIndex];

  useEffect(() => {
    // Auto-save current position
    updateJourneyProgress({
      ...journeyProgress,
      currentRegion: selectedRegion,
      currentCard: currentCard?.id,
    });
  }, [selectedRegion, selectedCardIndex]);

  const handleCardComplete = () => {
    if (currentCard && !journeyProgress.completedCards.includes(currentCard.id)) {
      const newCompleted = [...journeyProgress.completedCards, currentCard.id];
      updateJourneyProgress({
        ...journeyProgress,
        completedCards: newCompleted,
      });
    }

    // Move to next card
    if (currentRegion && selectedCardIndex < currentRegion.cards.length - 1) {
      setSelectedCardIndex(selectedCardIndex + 1);
    } else {
      // Region complete!
      const badgeId = `${selectedRegion}-complete`;
      if (!journeyProgress.earnedBadges.includes(badgeId)) {
        updateJourneyProgress({
          ...journeyProgress,
          earnedBadges: [...journeyProgress.earnedBadges, badgeId],
          visitedRegions: journeyProgress.visitedRegions.includes(selectedRegion)
            ? journeyProgress.visitedRegions
            : [...journeyProgress.visitedRegions, selectedRegion],
        });
      }
    }
  };

  const handleNextRegion = () => {
    const currentIndex = journeyRegions.findIndex((r) => r.id === selectedRegion);
    if (currentIndex < journeyRegions.length - 1) {
      setSelectedRegion(journeyRegions[currentIndex + 1].id);
      setSelectedCardIndex(0);
    }
  };

  const handlePrevRegion = () => {
    const currentIndex = journeyRegions.findIndex((r) => r.id === selectedRegion);
    if (currentIndex > 0) {
      setSelectedRegion(journeyRegions[currentIndex - 1].id);
      setSelectedCardIndex(0);
    }
  };

  const regionProgress = currentRegion
    ? (currentRegion.cards.filter((c) => journeyProgress.completedCards.includes(c.id)).length /
        currentRegion.cards.length) *
      100
    : 0;

  const totalProgress =
    (journeyProgress.completedCards.length / journeyRegions.reduce((sum, r) => sum + r.cards.length, 0)) * 100;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="relative">
        <div className="absolute -inset-4 opacity-20" style={{
          background: 'radial-gradient(circle at 50% 0%, rgba(217, 170, 239, 0.3) 0%, transparent 70%)',
        }} />
        <div className="relative">
          <h1 className="text-5xl font-black bg-gradient-to-r from-accent via-purple-400 to-accent bg-clip-text text-transparent mb-2 drop-shadow-lg">
            ✨ The Integral Journey
          </h1>
          <p className="text-slate-400 text-lg">
            Explore the six regions of integral practice and unlock your wholeness
          </p>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="bg-gradient-to-br from-neutral-800/80 via-neutral-850 to-neutral-900/80 rounded-2xl border border-accent/25 p-8 backdrop-blur-sm" style={{
        boxShadow: '0 8px 32px rgba(217, 170, 239, 0.08), inset 0 1px 2px rgba(255, 255, 255, 0.05)',
      }}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-slate-200 font-semibold text-lg">Overall Journey Progress</span>
          <span className="text-2xl font-bold bg-gradient-to-r from-accent to-purple-400 bg-clip-text text-transparent">{Math.round(totalProgress)}%</span>
        </div>
        <div className="w-full h-3 bg-neutral-700/50 rounded-full overflow-hidden border border-accent/20">
          <div
            className="h-full bg-gradient-to-r from-accent via-purple-500 to-accent transition-all duration-500 rounded-full"
            style={{ width: `${totalProgress}%`, boxShadow: '0 0 20px rgba(217, 170, 239, 0.5)' }}
          />
        </div>
        <div className="flex gap-3 mt-6 flex-wrap">
          {journeyProgress.earnedBadges.map((badgeId) => {
            const badge = journeyBadges[badgeId as keyof typeof journeyBadges];
            return (
              <div
                key={badgeId}
                className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-accent/15 to-accent/5 border border-accent/40 rounded-xl hover:border-accent/60 transition-all group"
              >
                <span className="text-2xl group-hover:scale-125 transition-transform">{badge?.emoji}</span>
                <div className="text-sm">
                  <div className="font-bold text-accent">{badge?.name}</div>
                  <div className="text-xs text-slate-400">{badge?.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Region Navigation */}
      <div className="grid grid-cols-6 gap-4">
        {journeyRegions.map((region) => {
          const isActive = region.id === selectedRegion;
          const regionCompleted = journeyProgress.earnedBadges.includes(`${region.id}-complete`);
          const regionCards = region.cards.filter((c) => journeyProgress.completedCards.includes(c.id));
          const regionProgress = (regionCards.length / region.cards.length) * 100;

          return (
            <button
              key={region.id}
              onClick={() => {
                setSelectedRegion(region.id);
                setSelectedCardIndex(0);
              }}
              className={`relative p-4 rounded-2xl border-2 transition-all group overflow-hidden ${
                isActive
                  ? 'border-accent bg-gradient-to-br from-accent/20 to-accent/5 shadow-lg shadow-accent/20'
                  : 'border-neutral-700 bg-neutral-800/30 hover:border-accent/50 hover:bg-accent/5'
              }`}
              style={isActive ? {
                boxShadow: '0 0 20px rgba(217, 170, 239, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.1)',
              } : {}}
            >
              {/* Background glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity" style={{
                background: 'radial-gradient(circle at 50% 50%, rgba(217, 170, 239, 0.2) 0%, transparent 70%)',
              }} />

              <div className="relative z-10">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{region.emoji}</div>
                <div className="text-sm font-bold text-slate-200 mb-2 line-clamp-2">{region.name}</div>
                <div className="w-full h-1.5 bg-neutral-700/50 rounded-full overflow-hidden border border-accent/20">
                  <div
                    className="h-full bg-gradient-to-r from-accent to-purple-500 transition-all duration-300"
                    style={{ width: `${regionProgress}%` }}
                  />
                </div>
                <div className="text-xs text-slate-400 mt-2 font-semibold">
                  {regionCards.length}/{region.cards.length}
                </div>
                {regionCompleted && (
                  <div className="absolute top-2 right-2 animate-pulse">
                    <Trophy size={18} className="text-accent" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Current Region Display */}
      {currentRegion && (
        <div className="space-y-6">
          {/* Region Header */}
          <div className="bg-gradient-to-br from-neutral-800/80 via-neutral-850 to-neutral-900/80 rounded-2xl border border-accent/25 p-8 backdrop-blur-sm" style={{
            boxShadow: '0 8px 32px rgba(217, 170, 239, 0.08), inset 0 1px 2px rgba(255, 255, 255, 0.05)',
          }}>
            <div className="flex items-start gap-6 mb-6">
              <div className="text-6xl">{currentRegion.emoji}</div>
              <div className="flex-1">
                <h2 className="text-4xl font-bold bg-gradient-to-r from-accent via-purple-400 to-accent bg-clip-text text-transparent mb-2">{currentRegion.name}</h2>
                <p className="text-slate-300 text-lg leading-relaxed">{currentRegion.description}</p>
              </div>
            </div>
            <div className="flex items-end justify-between gap-6">
              <div className="flex-1">
                <div className="text-sm font-semibold text-slate-400 mb-3">Region Progress</div>
                <div className="w-full h-3 bg-neutral-700/50 rounded-full overflow-hidden border border-accent/20">
                  <div
                    className="h-full bg-gradient-to-r from-accent via-purple-500 to-accent transition-all duration-300"
                    style={{ width: `${regionProgress}%`, boxShadow: '0 0 15px rgba(217, 170, 239, 0.4)' }}
                  />
                </div>
              </div>
              <div className="text-right min-w-fit">
                <div className="text-3xl font-bold bg-gradient-to-r from-accent to-purple-400 bg-clip-text text-transparent">{Math.round(regionProgress)}%</div>
                <div className="text-sm text-slate-400 font-semibold mt-1">
                  {currentRegion.cards.filter((c) => journeyProgress.completedCards.includes(c.id)).length}/{currentRegion.cards.length} cards
                </div>
              </div>
            </div>
          </div>

          {/* Learning Card */}
          {currentCard && (
            <LearningCard
              card={currentCard}
              isCompleted={journeyProgress.completedCards.includes(currentCard.id)}
              onComplete={handleCardComplete}
            />
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevRegion}
              disabled={journeyRegions.findIndex((r) => r.id === selectedRegion) === 0}
              className="flex items-center gap-2 px-4 py-2 bg-accent/20 border border-accent/40 rounded-lg hover:bg-accent/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-accent"
            >
              <ChevronLeft size={18} /> Previous Region
            </button>

            <div className="text-slate-400">
              Card {selectedCardIndex + 1} of {currentRegion.cards.length}
            </div>

            {selectedCardIndex < currentRegion.cards.length - 1 ? (
              <button
                onClick={() => setSelectedCardIndex(selectedCardIndex + 1)}
                className="flex items-center gap-2 px-4 py-2 bg-accent/20 border border-accent/40 rounded-lg hover:bg-accent/30 transition-all text-accent"
              >
                Skip Card <ChevronRight size={18} />
              </button>
            ) : (
              <button
                onClick={handleNextRegion}
                disabled={journeyRegions.findIndex((r) => r.id === selectedRegion) === journeyRegions.length - 1}
                className="flex items-center gap-2 px-4 py-2 bg-accent/20 border border-accent/40 rounded-lg hover:bg-accent/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-accent"
              >
                Next Region <ChevronRight size={18} />
              </button>
            )}
          </div>

          {/* Completion Message */}
          {regionProgress === 100 && (
            <div className="bg-gradient-to-r from-green-500/15 to-emerald-500/10 border border-green-500/50 rounded-2xl p-8 text-center relative overflow-hidden" style={{
              boxShadow: '0 0 30px rgba(34, 197, 94, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.1)',
            }}>
              <div className="absolute inset-0 opacity-20" style={{
                background: 'radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.2) 0%, transparent 70%)',
              }} />
              <div className="relative z-10">
                <div className="text-5xl mb-4 animate-bounce">🎉</div>
                <h3 className="text-2xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-3">Region Complete!</h3>
                <p className="text-slate-200 text-lg mb-4">
                  You've unlocked the <strong className="text-green-400">"{journeyBadges[`${selectedRegion}-complete` as keyof typeof journeyBadges]?.name}"</strong> badge!
                </p>
                <p className="text-slate-400">
                  You've gained deep insight into this dimension of integral practice. Your growth is accelerating.
                </p>
                {journeyRegions.findIndex((r) => r.id === selectedRegion) < journeyRegions.length - 1 && (
                  <p className="text-accent font-bold mt-4">→ Ready for the next region? The journey continues...</p>
                )}
                {journeyRegions.findIndex((r) => r.id === selectedRegion) === journeyRegions.length - 1 && (
                  <p className="text-accent font-bold mt-4">🌟 You have completed The Integral Journey! Integration awaits...</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
