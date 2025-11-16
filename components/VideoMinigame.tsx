import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface VideoSource {
  src: string;
  type: string;
}

interface VideoMinigameProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl?: string;
  videoSources?: VideoSource[];
  title?: string;
}

export default function VideoMinigame({ isOpen, onClose, videoUrl, videoSources, title = "Coming Soon" }: VideoMinigameProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Use videoSources if provided, otherwise create from videoUrl for backward compatibility
  const sources: VideoSource[] = videoSources || (videoUrl ? [{ src: videoUrl, type: 'video/mp4' }] : []);

  // Autoplay when opened
  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.log('Autoplay prevented:', error);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/95 backdrop-blur-md flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl max-h-[90vh] flex flex-col bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-purple-500/30 rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 25px 50px -12px rgba(147, 51, 234, 0.5), 0 0 100px rgba(147, 51, 234, 0.3)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border-b border-purple-500/30 flex-shrink-0">
          <h2 className="text-xl font-bold font-mono tracking-tight bg-gradient-to-r from-purple-200 to-violet-200 bg-clip-text text-transparent">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-purple-300 hover:text-purple-100 p-2 rounded-full hover:bg-purple-800/30 transition-all duration-200"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Video Container */}
        <div className="flex-1 flex items-center justify-center bg-black p-4">
          <video
            ref={videoRef}
            controls
            autoPlay
            loop
            muted
            playsInline
            className="max-w-full max-h-full rounded-lg shadow-2xl"
            style={{
              boxShadow: '0 0 50px rgba(147, 51, 234, 0.5)',
            }}
          >
            {sources.map((source, index) => (
              <source key={index} src={source.src} type={source.type} />
            ))}
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Footer hint */}
        <div className="p-4 bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border-t border-purple-500/30 text-center">
          <p className="text-purple-400/60 text-sm italic">
            This experience is coming soon...
          </p>
        </div>
      </div>
    </div>
  );
}
