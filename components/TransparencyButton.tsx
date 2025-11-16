/**
 * Transparency Button Component
 *
 * A lightweight button that opens the explanation modal.
 * Can be added to any recommendation card to enable the "Why?" feature.
 */

import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import ExplanationModal from './ExplanationModal.tsx';
import { useExplanation } from '../hooks/useExplanation.ts';
import type { ExplanationData } from './ExplanationModal.tsx';

interface TransparencyButtonProps {
  recommendationId: string;
  practiceName: string;
  className?: string;
  variant?: 'icon' | 'button' | 'inline';
  size?: 'sm' | 'md' | 'lg';
}

export default function TransparencyButton({
  recommendationId,
  practiceName,
  className = '',
  variant = 'icon',
  size = 'md',
}: TransparencyButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { explanation, isLoading, error, fetchRecommendationExplanation, reset } = useExplanation();

  const handleClick = async () => {
    setIsModalOpen(true);
    if (!explanation) {
      await fetchRecommendationExplanation(recommendationId);
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    reset();
  };

  // Size variants for icon
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  if (variant === 'icon') {
    return (
      <>
        <button
          onClick={handleClick}
          className={`text-slate-400 hover:text-purple-400 transition flex-shrink-0 ${className}`}
          title="Why this recommendation?"
          aria-label="Explanation"
        >
          <HelpCircle size={16} className={sizeClasses[size]} />
        </button>

        <ExplanationModal
          isOpen={isModalOpen}
          onClose={handleClose}
          recommendationId={recommendationId}
          practiceName={practiceName}
          explanation={explanation as ExplanationData | null}
          isLoading={isLoading}
          error={error}
        />
      </>
    );
  }

  if (variant === 'inline') {
    return (
      <>
        <button
          onClick={handleClick}
          className={`text-xs font-medium text-purple-400 hover:text-purple-300 transition flex items-center gap-1 ${className}`}
          title="Why this recommendation?"
        >
          <HelpCircle size={14} />
          Why?
        </button>

        <ExplanationModal
          isOpen={isModalOpen}
          onClose={handleClose}
          recommendationId={recommendationId}
          practiceName={practiceName}
          explanation={explanation as ExplanationData | null}
          isLoading={isLoading}
          error={error}
        />
      </>
    );
  }

  // Default: button variant
  return (
    <>
      <button
        onClick={handleClick}
        className={`text-sm px-3 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium transition flex items-center gap-2 ${className}`}
        title="Why this recommendation?"
      >
        <HelpCircle size={16} />
        Why?
      </button>

      <ExplanationModal
        isOpen={isModalOpen}
        onClose={handleClose}
        recommendationId={recommendationId}
        practiceName={practiceName}
        explanation={explanation as ExplanationData | null}
        isLoading={isLoading}
        error={error}
      />
    </>
  );
}
