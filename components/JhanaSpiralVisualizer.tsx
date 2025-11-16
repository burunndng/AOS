import React, { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { JhanaLevel } from '../types.ts';

const JHANA_COLORS: Record<JhanaLevel, string> = {
  'Access Concentration': '#a78bfa',
  'Momentary Concentration': '#c4b5fd',
  '1st Jhana': '#f87171',
  '2nd Jhana': '#fb923c',
  '3rd Jhana': '#fbbf24',
  '4th Jhana': '#10b981',
  '5th Jhana': '#14b8a6',
  '6th Jhana': '#06b6d4',
  '7th Jhana': '#3b82f6',
  '8th Jhana': '#8b5cf6',
};

const JHANA_DESCRIPTIONS: Record<JhanaLevel, string> = {
  'Access Concentration': 'The threshold state before jhana. Mind is collected and stable.',
  'Momentary Concentration': 'Brief moments of strong concentration during insight practice.',
  '1st Jhana': 'Sustained absorption with thinking, joy, and happiness. All five factors present.',
  '2nd Jhana': 'Thinking drops away. Stronger unification with piti and sukha. More absorbed.',
  '3rd Jhana': 'Energetic piti fades, leaving pure contentment. Equanimous happiness.',
  '4th Jhana': 'Even sukha fades into pure equanimity. Effortless absorption.',
  '5th Jhana': 'Infinite space. Mind expands beyond form to boundless space itself.',
  '6th Jhana': 'Infinite consciousness. Awareness itself becomes the object and subject.',
  '7th Jhana': 'Nothingness. The subtle sense of being dissolves into vast emptiness.',
  '8th Jhana': 'Neither-perception-nor-non-perception. The subtlest state before cessation.',
};

interface JhanaSpiralVisualizerProps {
  selectedJhana: JhanaLevel | null;
  onSelectJhana: (jhana: JhanaLevel) => void;
}

export default function JhanaSpiralVisualizer({ selectedJhana, onSelectJhana }: JhanaSpiralVisualizerProps) {
  const jhanasInOrder: JhanaLevel[] = [
    'Access Concentration',
    'Momentary Concentration',
    '1st Jhana',
    '2nd Jhana',
    '3rd Jhana',
    '4th Jhana',
    '5th Jhana',
    '6th Jhana',
    '7th Jhana',
    '8th Jhana',
  ];

  const [hoveredJhana, setHoveredJhana] = useState<JhanaLevel | null>(null);

  // Create SVG spiral path
  const generateSpiralPoints = () => {
    const points: { x: number; y: number; jhana: JhanaLevel; index: number }[] = [];
    const centerX = 400;
    const centerY = 300;
    const spiralTurns = 3;
    const maxRadius = 200;

    jhanasInOrder.forEach((jhana, i) => {
      const angle = (i / jhanasInOrder.length) * (spiralTurns * Math.PI * 2);
      const radius = (i / (jhanasInOrder.length - 1)) * maxRadius;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      points.push({ x, y, jhana, index: i });
    });

    return points;
  };

  const spiralPoints = generateSpiralPoints();

  // Draw connecting line through spiral
  const spiralPath = spiralPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="w-full space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <h3 className="text-3xl font-bold text-slate-100">The Jhana Spiral</h3>
        <p className="text-sm text-slate-400">Click on any point in the spiral to explore that jhana state</p>
      </div>

      {/* Interactive SVG Spiral */}
      <div className="flex justify-center mb-8">
        <svg width="800" height="600" viewBox="0 0 800 600" className="drop-shadow-2xl">
          {/* Background gradient */}
          <defs>
            <radialGradient id="spiralGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(30, 30, 30, 0.5)" />
              <stop offset="100%" stopColor="rgba(10, 10, 10, 0.8)" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background */}
          <rect width="800" height="600" fill="url(#spiralGradient)" />

          {/* Spiral line */}
          <path d={spiralPath} stroke="rgba(100, 80, 150, 0.3)" strokeWidth="2" fill="none" />

          {/* Spiral points with labels */}
          {spiralPoints.map((point) => {
            const isSelected = selectedJhana === point.jhana;
            const isHovered = hoveredJhana === point.jhana;
            const color = JHANA_COLORS[point.jhana];
            const baseRadius = 12;
            const radius = isSelected || isHovered ? baseRadius * 1.6 : baseRadius;

            return (
              <g key={point.jhana} className="cursor-pointer">
                {/* Glow effect for selected */}
                {(isSelected || isHovered) && (
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={radius + 12}
                    fill={color}
                    opacity="0.2"
                    className="animate-pulse"
                  />
                )}

                {/* Main circle */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={radius}
                  fill={color}
                  opacity={isSelected ? 1 : isHovered ? 0.8 : 0.6}
                  className="transition-all duration-300"
                  onClick={() => onSelectJhana(point.jhana)}
                  onMouseEnter={() => setHoveredJhana(point.jhana)}
                  onMouseLeave={() => setHoveredJhana(null)}
                  filter="url(#glow)"
                />

                {/* Index label */}
                <text
                  x={point.x}
                  y={point.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs font-bold fill-white pointer-events-none select-none"
                  fontSize="10"
                >
                  {point.index}
                </text>

                {/* Tooltip on hover */}
                {isHovered && (
                  <g>
                    <rect
                      x={point.x + 15}
                      y={point.y - 30}
                      width="140"
                      height="60"
                      rx="6"
                      fill="rgba(0, 0, 0, 0.9)"
                      stroke={color}
                      strokeWidth="2"
                    />
                    <text
                      x={point.x + 85}
                      y={point.y - 15}
                      textAnchor="middle"
                      className="text-xs font-bold fill-white pointer-events-none select-none"
                      fontSize="11"
                    >
                      {point.jhana}
                    </text>
                    <text
                      x={point.x + 85}
                      y={point.y + 5}
                      textAnchor="middle"
                      className="text-xs fill-slate-300 pointer-events-none select-none"
                      fontSize="9"
                    >
                      Click to explore
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Jhana Details */}
      {selectedJhana && (
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-2 border-slate-700 rounded-2xl p-8 animate-fade-in">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div
                className="inline-block w-4 h-4 rounded-full mb-3"
                style={{ backgroundColor: JHANA_COLORS[selectedJhana] }}
              />
              <h4 className="text-2xl font-bold text-slate-100">{selectedJhana}</h4>
            </div>
          </div>

          <p className="text-slate-300 leading-relaxed mb-4">
            {JHANA_DESCRIPTIONS[selectedJhana]}
          </p>

          <div className="flex items-center text-sm text-slate-400">
            <ChevronDown size={16} className="mr-2" />
            Scroll down to see more details in the Instructional Guide below
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-8">
        {jhanasInOrder.slice(0, 5).map((jhana) => (
          <div
            key={jhana}
            className="flex items-center gap-2 text-xs cursor-pointer p-2 rounded hover:bg-slate-800/50 transition"
            onClick={() => onSelectJhana(jhana)}
          >
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: JHANA_COLORS[jhana] }}
            />
            <span className="text-slate-300 truncate">{jhana}</span>
          </div>
        ))}
        {jhanasInOrder.slice(5).map((jhana) => (
          <div
            key={jhana}
            className="flex items-center gap-2 text-xs cursor-pointer p-2 rounded hover:bg-slate-800/50 transition"
            onClick={() => onSelectJhana(jhana)}
          >
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: JHANA_COLORS[jhana] }}
            />
            <span className="text-slate-300 truncate">{jhana}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
