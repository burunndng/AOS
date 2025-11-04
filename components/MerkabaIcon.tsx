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
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={finalWidth}
      height={finalHeight}
      {...props}
    >
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
      <path d="M12 22V12" />
      <path d="M22 7v10" />
      <path d="M2 7v10" />
    </svg>
  );
};