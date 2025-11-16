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
      className="fixed inset-0 bg-black/95 z-50 overflow-hidden"
      onClick={onClose}
    >
      {/* Full-screen video canvas */}
      <video
        ref={videoRef}
        controls
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-contain"
      >
        {sources.map((source, index) => (
          <source key={index} src={source.src} type={source.type} />
        ))}
        Your browser does not support the video tag.
      </video>

      {/* UI Overlay - Positioned to sides */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top-Left: Title */}
        <div className="absolute top-8 left-8 z-20">
          <h2 className="text-3xl font-bold font-mono tracking-tight bg-gradient-to-r from-purple-200 to-violet-200 bg-clip-text text-transparent">
            {title}
          </h2>
        </div>

        {/* Top-Right: Close button */}
        <div className="absolute top-8 right-8 z-20">
          <button
            onClick={onClose}
            className="text-purple-300 hover:text-purple-100 p-2 rounded-full hover:bg-purple-800/30 bg-purple-900/40 border border-purple-500/30 transition-all duration-200 pointer-events-auto"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Bottom-Left: Footer hint */}
        <div className="absolute bottom-8 left-8 max-w-xs z-20 pointer-events-auto">
          <div className="bg-black/60 backdrop-blur border border-purple-500/30 rounded-lg p-4">
            <p className="text-purple-400 text-sm italic font-mono">
              This experience is coming soon...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
