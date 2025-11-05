
import React from 'react';
import { MerkabaIcon } from './MerkabaIcon.tsx';

interface SectionDividerProps {
  className?: string;
}

export const SectionDivider: React.FC<SectionDividerProps> = ({ className = '' }) => {
  return (
    <div className={`flex items-center justify-center w-full my-8 ${className}`}>
      <div className="flex-grow h-px bg-slate-700/50"></div>
      {/* FIX: Use the 'size' prop for MerkabaIcon instead of Tailwind 'w-x h-y' classes for consistent sizing control. */}
      <MerkabaIcon size={24} className="mx-4 text-slate-600 transform rotate-90" />
      <div className="flex-grow h-px bg-slate-700/50"></div>
    </div>
  );
};
