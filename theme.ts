/**
 * Theme Configuration
 * Professional dark theme for the Aura ILP meditation/growth app
 * Design philosophy: Dark, serious, elegant
 */

export const theme = {
  // Background colors - Deep blacks and dark grays
  background: {
    base: 'neutral-950',
    elevated: 'neutral-900/60',
    glass: 'neutral-900/30',
  },

  // Module-specific color system - Monochromatic with subtle variations
  modules: {
    mind: {
      primary: 'neutral-400',
      primaryHex: '#a3a3a3',
      glow: 'rgba(0, 0, 0, 0.6)',
      gradient: 'from-neutral-800 to-neutral-700',
      borderColor: 'border-neutral-700/30',
      borderColorHover: 'hover:border-neutral-600/50',
      accentClass: 'accent-neutral',
      label: 'Mind',
    },
    shadow: {
      primary: 'neutral-500',
      primaryHex: '#737373',
      glow: 'rgba(0, 0, 0, 0.6)',
      gradient: 'from-neutral-800 to-neutral-700',
      borderColor: 'border-neutral-700/30',
      borderColorHover: 'hover:border-neutral-600/50',
      accentClass: 'accent-neutral',
      label: 'Shadow',
    },
    body: {
      primary: 'neutral-400',
      primaryHex: '#a3a3a3',
      glow: 'rgba(0, 0, 0, 0.6)',
      gradient: 'from-neutral-800 to-neutral-700',
      borderColor: 'border-neutral-700/30',
      borderColorHover: 'hover:border-neutral-600/50',
      accentClass: 'accent-neutral',
      label: 'Body',
    },
    spirit: {
      primary: 'neutral-400',
      primaryHex: '#a3a3a3',
      glow: 'rgba(0, 0, 0, 0.6)',
      gradient: 'from-neutral-800 to-neutral-700',
      borderColor: 'border-neutral-700/30',
      borderColorHover: 'hover:border-neutral-600/50',
      accentClass: 'accent-neutral',
      label: 'Spirit',
    },
  },

  // Text colors - High contrast grays
  text: {
    primary: 'neutral-100',
    secondary: 'neutral-500',
    accent: 'neutral-300',
  },

  // Card styles - Professional depth through shadows
  card: {
    base: 'bg-neutral-900/50 backdrop-blur-sm',
    border: 'border border-neutral-800/50',
    shadow: 'shadow-[0_4px_24px_rgba(0,0,0,0.6)]',
    shadowHover: 'hover:shadow-[0_8px_32px_rgba(0,0,0,0.8)]',
    transition: 'transition-all duration-300',
    hover: 'hover:-translate-y-0.5',
  },

  // Button styles - Minimal and elegant
  button: {
    primary: 'bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02]',
    secondary: 'bg-neutral-900/40 hover:bg-neutral-800/60 border border-neutral-800/60',
  },

  // Animation classes
  animation: {
    fadeIn: 'animate-fade-in',
    fadeInUp: 'animate-fade-in-up',
    slideInRight: 'animate-slide-in-right',
    popIn: 'animate-pop-in',
    glow: 'animate-shadow',
  },
};

// Helper functions for module-specific styling
export const getModuleTheme = (module: 'mind' | 'shadow' | 'body' | 'spirit') => {
  return theme.modules[module];
};

export const getCardClasses = (accentModule?: 'mind' | 'shadow' | 'body' | 'spirit') => {
  const base = `${theme.card.base} ${theme.card.border} ${theme.card.shadow} ${theme.card.shadowHover} ${theme.card.transition} ${theme.card.hover}`;
  if (accentModule) {
    const moduleTheme = theme.modules[accentModule];
    return `${base} ${moduleTheme.borderColor} ${moduleTheme.borderColorHover}`;
  }
  return base;
};

export const getGradientText = (module: 'mind' | 'shadow' | 'body' | 'spirit') => {
  const moduleTheme = theme.modules[module];
  return `bg-gradient-to-r ${moduleTheme.gradient} bg-clip-text text-transparent`;
};
