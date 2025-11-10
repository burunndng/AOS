// useJuxtapositionAnimation - Custom hook for managing juxtaposition cycle animations

import { useRef, useEffect, useCallback } from 'react';
import { ANIMATION_TIMINGS } from './constants';

type CycleStep = 'old-truth' | 'pause' | 'new-truth' | 'complete';

interface UseJuxtapositionAnimationProps {
  prefersReducedMotion: boolean;
  isPaused: boolean;
  onStepChange: (step: CycleStep) => void;
}

export function useJuxtapositionAnimation({
  prefersReducedMotion,
  isPaused,
  onStepChange,
}: UseJuxtapositionAnimationProps) {
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }
    };
  }, []);

  const clearTimer = useCallback(() => {
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
      animationTimerRef.current = null;
    }
  }, []);

  const startCycle = useCallback(() => {
    if (prefersReducedMotion || isPaused) return;

    clearTimer();

    onStepChange('old-truth');

    animationTimerRef.current = setTimeout(() => {
      onStepChange('pause');

      animationTimerRef.current = setTimeout(() => {
        onStepChange('new-truth');

        animationTimerRef.current = setTimeout(() => {
          onStepChange('complete');
        }, ANIMATION_TIMINGS.NEW_TRUTH_DISPLAY);
      }, ANIMATION_TIMINGS.PAUSE_BETWEEN);
    }, ANIMATION_TIMINGS.OLD_TRUTH_DISPLAY);
  }, [prefersReducedMotion, isPaused, onStepChange, clearTimer]);

  const pauseCycle = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  const resumeCycle = useCallback(() => {
    startCycle();
  }, [startCycle]);

  return {
    startCycle,
    pauseCycle,
    resumeCycle,
    clearTimer,
  };
}
