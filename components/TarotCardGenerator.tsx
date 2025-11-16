import React, { useState, useRef } from 'react';
import { X, Sparkles, Loader, Download } from 'lucide-react';
import { generateTarotCard, getAvailableTarotStyles, type TarotCardRequest } from '../services/tarotCardService.ts';

interface TarotCardGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export default function TarotCardGenerator({ isOpen, onClose, title = "Tarot Card Generator" }: TarotCardGeneratorProps) {
  const [description, setDescription] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('modern');
  const [includeTitle, setIncludeTitle] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageHistory, setImageHistory] = useState<{ description: string; style: string; image: string }[]>([]);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const styles = getAvailableTarotStyles();

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('Please describe your tarot card');
      return;
    }

    setIsGenerating(true);
    setError(null);

    const request: TarotCardRequest = {
      description: description.trim(),
      style: selectedStyle,
      includeTitle
    };

    const result = await generateTarotCard(request);

    if (result.success && (result.imageUrl || result.base64Data)) {
      const imageUrl = result.base64Data || result.imageUrl!;
      setGeneratedImage(imageUrl);

      // Add to history
      setImageHistory(prev => [
        { description: request.description, style: selectedStyle, image: imageUrl },
        ...prev.slice(0, 9) // Keep last 10
      ]);
    } else {
      setError(result.error || 'Failed to generate tarot card');
    }

    setIsGenerating(false);
  };

  const handleDownload = () => {
    if (!generatedImage) return;

    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `tarot-${selectedStyle}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const examplePrompts = [
    'A figure at a crossroads, holding a staff, looking into the distance',
    'Two lovers gazing at each other under a moonlit sky with celestial symbols',
    'A hermit in a tower, holding a lantern, surrounded by swirling mysteries',
    'A wheel turning with symbols of fortune, destiny, and change',
    'A figure awakening from a dream, surrounded by illusions dissolving'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center z-50 p-4 overflow-y-auto">
      <div
        className="bg-gradient-to-br from-purple-900/95 via-indigo-900/95 to-violet-900/95 border border-purple-500/30 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 25px 50px -12px rgba(147, 51, 234, 0.5), 0 0 100px rgba(147, 51, 234, 0.3)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-purple-500/30 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Sparkles size={28} className="text-violet-400" />
            <h2 className="text-2xl font-bold font-mono tracking-tight bg-gradient-to-r from-purple-200 to-violet-200 bg-clip-text text-transparent">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-purple-300 hover:text-purple-100 p-2 rounded-full hover:bg-purple-800/30 transition-all duration-200"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Panel */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-cyan-200 font-mono">Describe Your Card</h3>

              {/* Description Input */}
              <div>
                <label className="block text-sm font-mono text-purple-300 mb-2">Card Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the imagery, symbolism, and feeling of your tarot card..."
                  disabled={isGenerating}
                  className="w-full bg-purple-900/30 border border-purple-600/30 rounded-lg px-4 py-3 text-purple-100 placeholder-purple-400/50 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed resize-none h-24"
                  style={{
                    boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.3)'
                  }}
                />
              </div>

              {/* Style Selection */}
              <div>
                <label className="block text-sm font-mono text-purple-300 mb-2">Tarot Style</label>
                <select
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value)}
                  disabled={isGenerating}
                  className="w-full bg-purple-900/30 border border-purple-600/30 rounded-lg px-4 py-2 text-purple-100 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {styles.map((style) => (
                    <option key={style.id} value={style.id}>
                      {style.name} - {style.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Include Title Checkbox */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTitle}
                  onChange={(e) => setIncludeTitle(e.target.checked)}
                  disabled={isGenerating}
                  className="w-4 h-4 rounded bg-purple-900/30 border border-purple-600/30 checked:bg-purple-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="text-sm text-purple-300 font-mono">Add title to card</span>
              </label>

              {/* Quick Examples */}
              <div>
                <p className="text-xs font-mono text-purple-400 mb-2">Quick Examples:</p>
                <div className="space-y-2">
                  {examplePrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setDescription(prompt)}
                      disabled={isGenerating}
                      className="w-full text-left px-3 py-2 text-xs bg-indigo-900/40 hover:bg-indigo-800/60 border border-indigo-500/30 rounded text-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      "{prompt}"
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !description.trim()}
                className="w-full py-3 rounded-lg font-mono font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: isGenerating
                    ? 'rgba(107, 114, 128, 0.4)'
                    : 'linear-gradient(135deg, rgba(168, 85, 247, 0.6), rgba(99, 102, 241, 0.6))',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  color: isGenerating ? '#ccc' : '#e0d5ff',
                  boxShadow: '0 4px 15px rgba(168, 85, 247, 0.3)'
                }}
              >
                {isGenerating ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Channeling the Oracle...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Generate Tarot Card
                  </>
                )}
              </button>

              {/* Error Display */}
              {error && (
                <div className="bg-red-900/30 border border-red-600/30 rounded-lg p-3 text-red-300 text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* Image Display Panel */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-cyan-200 font-mono">Generated Card</h3>

              {/* Main Image Display */}
              <div
                ref={imageContainerRef}
                className="bg-black/50 border border-cyan-500/30 rounded-lg overflow-hidden flex items-center justify-center"
                style={{
                  aspectRatio: '3 / 4',
                  minHeight: '300px'
                }}
              >
                {generatedImage ? (
                  <div className="relative w-full h-full">
                    <img
                      src={generatedImage}
                      alt="Generated Tarot Card"
                      className="w-full h-full object-contain p-4"
                    />
                    <button
                      onClick={handleDownload}
                      className="absolute top-3 right-3 p-2 bg-purple-600/60 hover:bg-purple-600/80 rounded-full text-purple-100 transition-all"
                      title="Download card"
                    >
                      <Download size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-purple-400/60">
                    <Sparkles size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-mono">Awaiting your creation...</p>
                  </div>
                )}
              </div>

              {/* Image History */}
              {imageHistory.length > 0 && (
                <div>
                  <p className="text-xs font-mono text-purple-400 mb-2">Recent Creations:</p>
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                    {imageHistory.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => setGeneratedImage(item.image)}
                        className="relative group overflow-hidden rounded border border-purple-500/30 hover:border-purple-500/60 transition-all"
                        title={item.description}
                      >
                        <img
                          src={item.image}
                          alt={`Tarot ${item.style}`}
                          className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-xs text-purple-200 font-mono text-center px-1">{item.style}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
