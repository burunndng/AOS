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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-accent via-purple-400 to-accent bg-clip-text text-transparent mb-2">
          ✨ The Integral Journey
        </h1>
        <p className="text-slate-400">
          Explore the six regions of integral practice and unlock your wholeness
        </p>
      </div>

      {/* Overall Progress */}
      <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-xl border border-accent/20 p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-300">Overall Journey Progress</span>
          <span className="text-accent font-semibold">{Math.round(totalProgress)}%</span>
        </div>
        <div className="w-full h-2 bg-neutral-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent to-purple-500 transition-all duration-300"
            style={{ width: `${totalProgress}%` }}
          />
        </div>
        <div className="flex gap-2 mt-4 flex-wrap">
          {journeyProgress.earnedBadges.map((badgeId) => {
            const badge = journeyBadges[badgeId as keyof typeof journeyBadges];
            return (
              <div
                key={badgeId}
                className="flex items-center gap-2 px-3 py-2 bg-accent/10 border border-accent/30 rounded-lg"
              >
                <span className="text-xl">{badge?.emoji}</span>
                <div className="text-sm">
                  <div className="font-semibold text-accent">{badge?.name}</div>
                  <div className="text-xs text-slate-400">{badge?.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Region Navigation */}
      <div className="grid grid-cols-6 gap-3">
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
              className={`relative p-4 rounded-xl border-2 transition-all ${
                isActive
                  ? 'border-accent bg-accent/10'
                  : 'border-neutral-700 bg-neutral-800/50 hover:border-accent/50'
              }`}
            >
              <div className="text-3xl mb-2">{region.emoji}</div>
              <div className="text-sm font-semibold text-slate-200 mb-2">{region.name}</div>
              <div className="w-full h-1 bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-300"
                  style={{ width: `${regionProgress}%` }}
                />
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {regionCards.length}/{region.cards.length}
              </div>
              {regionCompleted && (
                <div className="absolute top-2 right-2">
                  <Trophy size={16} className="text-accent" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Current Region Display */}
      {currentRegion && (
        <div className="space-y-6">
          {/* Region Header */}
          <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-xl border border-accent/20 p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="text-5xl">{currentRegion.emoji}</div>
              <div>
                <h2 className="text-3xl font-bold text-accent mb-2">{currentRegion.name}</h2>
                <p className="text-slate-300">{currentRegion.description}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm text-slate-400 mb-2">Region Progress</div>
                <div className="w-full h-2 bg-neutral-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent to-purple-500 transition-all duration-300"
                    style={{ width: `${regionProgress}%` }}
                  />
                </div>
              </div>
              <div className="ml-4 text-right">
                <div className="text-2xl font-bold text-accent">{Math.round(regionProgress)}%</div>
                <div className="text-xs text-slate-400">
                  {currentRegion.cards.filter((c) => journeyProgress.completedCards.includes(c.id)).length}/
                  {currentRegion.cards.length} cards
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
            <div className="bg-green-500/10 border border-green-500/40 rounded-xl p-6 text-center">
              <div className="text-2xl mb-2">🎉</div>
              <h3 className="text-xl font-bold text-green-400 mb-2">Region Complete!</h3>
              <p className="text-slate-300">
                You've earned the "<strong>{journeyBadges[`${selectedRegion}-complete` as keyof typeof journeyBadges]?.name}</strong>" badge!
              </p>
              {journeyRegions.findIndex((r) => r.id === selectedRegion) < journeyRegions.length - 1 && (
                <p className="text-slate-400 text-sm mt-3">Ready for the next region?</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
