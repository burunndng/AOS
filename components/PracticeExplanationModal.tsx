import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface PracticeExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  explanation: string;
}

// Simple Markdown to HTML converter for bolding and paragraphs
const renderMarkdown = (markdown: string) => {
  let html = markdown
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
    .replace(/__(.*?)__/g, '<u>$1</u>') // Underline text (optional, but good for consistency)
    .replace(/\n\n/g, '</p><p>') // Double newline for paragraphs
    .replace(/\n/g, '<br/>'); // Single newline for line breaks

  // Wrap in paragraph tags if it's not already
  if (!html.startsWith('<p>') && !html.startsWith('<br/>') && html.trim() !== '') {
    html = `<p>${html}</p>`;
  }
  
  return html;
};

export default function PracticeExplanationModal({ isOpen, onClose, title, explanation }: PracticeExplanationModalProps) {
  // Scroll page to top and lock body scroll when modal opens
  useEffect(() => {
    if (isOpen) {
      // Save original overflow state
      const originalOverflow = document.body.style.overflow;

      // Lock background scroll
      document.body.style.overflow = 'hidden';

      // Scroll page to top IMMEDIATELY (not smooth)
      window.scrollTo(0, 0);

      // Restore overflow when modal closes
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formattedExplanation = renderMarkdown(explanation);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-lg p-6 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start">
          <h2 className="text-xl font-bold text-slate-50">{title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X size={24} />
          </button>
        </div>
        <div className="mt-4 text-slate-300 leading-relaxed custom-explanation-content">
          <div dangerouslySetInnerHTML={{ __html: formattedExplanation }} />
        </div>
      </div>
    </div>
  );
}