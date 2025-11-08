import React from 'react';

interface LoadingFallbackProps {
  text?: string;
  size?: 'small' | 'medium' | 'large';
}

export default function LoadingFallback({ text = 'Loading...', size = 'medium' }: LoadingFallbackProps) {
  const sizeClasses = {
    small: 'h-32',
    medium: 'h-64',
    large: 'h-screen',
  };

  return (
    <div className={`flex items-center justify-center ${sizeClasses[size]}`}>
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500 mb-4"></div>
        <p className="text-neutral-400 text-sm">{text}</p>
      </div>
    </div>
  );
}

export function TabLoadingFallback() {
  return <LoadingFallback text="Loading view..." size="large" />;
}

export function WizardLoadingFallback() {
  return <LoadingFallback text="Loading practice..." size="medium" />;
}

export function ModalLoadingFallback() {
  return <LoadingFallback text="Loading..." size="small" />;
}
