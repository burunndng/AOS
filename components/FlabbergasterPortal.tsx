import React from 'react';
import { X, Sparkles, Zap } from 'lucide-react';

interface FlabbergasterPortalProps {
  isOpen: boolean;
  onClose: () => void;
  hasUnlocked: boolean;
}

export default function FlabbergasterPortal({ isOpen, onClose, hasUnlocked }: FlabbergasterPortalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-gradient-to-br from-purple-900/90 via-indigo-900/90 to-violet-900/90 border border-purple-500/30 rounded-2xl shadow-2xl w-full max-w-md p-8 animate-fade-in-up flex flex-col items-center text-center relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 25px 50px -12px rgba(147, 51, 234, 0.5), 0 0 100px rgba(147, 51, 234, 0.3), inset 0 0 50px rgba(147, 51, 234, 0.1)',
          backdropFilter: 'blur(20px)'
        }}
      >
        {/* Background animated elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 left-4 w-32 h-32 bg-purple-500 rounded-full filter blur-3xl animate-pulse" />
          <div className="absolute bottom-4 right-4 w-24 h-24 bg-indigo-500 rounded-full filter blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-violet-500 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-purple-300 hover:text-purple-100 p-2 rounded-full hover:bg-purple-800/30 transition-all duration-200 z-10"
          aria-label="Close portal"
        >
          <X size={20} />
        </button>

        <div className="relative z-10 flex flex-col items-center space-y-6">
          <div className="relative">
            <Sparkles 
              size={64} 
              className="text-purple-300"
              style={{ 
                filter: 'drop-shadow(0 0 20px rgba(196, 181, 253, 0.8))',
                animation: 'spin 8s linear infinite'
              }} 
            />
            <Zap 
              size={32} 
              className="text-yellow-300 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
              style={{ filter: 'drop-shadow(0 0 10px rgba(253, 224, 71, 0.8))' }}
            />
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-bold font-mono tracking-tight bg-gradient-to-r from-purple-200 to-violet-200 bg-clip-text text-transparent">
              Flabbergaster Portal
            </h2>
            <p className="text-purple-200 text-lg leading-relaxed">
              {hasUnlocked 
                ? "Welcome back, curious soul. The spark within you glows brighter with each visit."
                : "You've discovered the hidden spark! Your curiosity has unlocked a secret pathway."
              }
            </p>
          </div>

          <div className="bg-purple-800/30 border border-purple-600/30 rounded-lg p-4 backdrop-blur-sm max-w-sm">
            <p className="text-purple-300 text-sm italic">
              "In the quiet spaces between thoughts, the most profound mysteries reveal themselves to those who dare to look closer."
            </p>
          </div>

          <div className="flex flex-col items-center space-y-2 pt-4">
            <p className="text-purple-400 text-xs font-mono uppercase tracking-wider">
              Easter Egg Unlocked
            </p>
            <div className="flex space-x-1">
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
