import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface EnergyWorkGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EnergyWorkGuideModal({ isOpen, onClose }: EnergyWorkGuideModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Lock body scroll when modal opens
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-800 border border-slate-700/80 rounded-lg shadow-2xl max-w-md w-full max-h-[70vh] overflow-y-auto animate-fade-in-up">
        {/* Header */}
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700/80 px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-100">Energy Work Guide</h2>
            <p className="text-xs text-slate-400 mt-0.5">Coming soon...</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition p-1"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-center justify-center">
            <img
              src="https://files.catbox.moe/257yfz.avif"
              alt="Energy Work Guide - Coming Soon"
              className="w-full max-w-xs rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
