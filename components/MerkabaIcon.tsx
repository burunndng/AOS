
import React from 'react';

interface MerkabaIconProps extends React.SVGProps<SVGSVGElement> {
  // FIX: Add a 'size' prop to control width and height for easier usage.
  // If 'size' is provided, it will override 'width' and 'height' from React.SVGProps.
  size?: number;
}

export const MerkabaIcon: React.FC<MerkabaIconProps> = ({ size, ...props }) => {
  const finalWidth = size ?? props.width ?? 24; // Use size, then props.width, then default to 24
  const finalHeight = size ?? props.height ?? 24; // Use size, then props.height, then default to 24

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={finalWidth}
      height={finalHeight}
      {...props}
    >
      {/* Upward-pointing tetrahedron */}
      {/* Front face */}
      <path d="M50 15 L30 65 L70 65 Z" fill="currentColor" fillOpacity="0.15" />
      {/* Left face */}
      <path d="M50 15 L30 65 L20 50 Z" fill="currentColor" fillOpacity="0.08" />
      {/* Right face */}
      <path d="M50 15 L70 65 L80 50 Z" fill="currentColor" fillOpacity="0.12" />
      {/* Edges */}
      <path d="M50 15 L30 65" />
      <path d="M50 15 L70 65" />
      <path d="M50 15 L20 50" />
      <path d="M50 15 L80 50" />
      <path d="M30 65 L20 50" />
      <path d="M70 65 L80 50" />
      <path d="M20 50 L80 50" />

      {/* Downward-pointing tetrahedron (interlocking) */}
      {/* Front face */}
      <path d="M50 85 L30 35 L70 35 Z" fill="currentColor" fillOpacity="0.15" />
      {/* Left face */}
      <path d="M50 85 L30 35 L20 50 Z" fill="currentColor" fillOpacity="0.08" />
      {/* Right face */}
      <path d="M50 85 L70 35 L80 50 Z" fill="currentColor" fillOpacity="0.12" />
      {/* Edges */}
      <path d="M50 85 L30 35" />
      <path d="M50 85 L70 35" />
      <path d="M50 85 L20 50" />
      <path d="M50 85 L80 50" />
      <path d="M30 35 L20 50" />
      <path d="M70 35 L80 50" />

      {/* Base triangles to emphasize the interlocking */}
      <path d="M30 35 L70 35 L30 65 Z" strokeOpacity="0.4" />
      <path d="M70 35 L70 65 L30 65 Z" strokeOpacity="0.4" />
    </svg>
  );
};
