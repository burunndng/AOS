/**
 * Theme Configuration
 * Central theme configuration for the Aura ILP meditation/growth app
 */

export const theme = {
  // Background colors
  background: {
    base: 'slate-950',
    elevated: 'slate-800/40',
    glass: 'slate-800/20',
  },

  // Module-specific color system
  modules: {
    mind: {
      primary: 'purple-500',
      primaryHex: '#8b5cf6',
      glow: 'rgba(139, 92, 246, 0.25)',
      gradient: 'from-purple-500 to-indigo-500',
      borderColor: 'border-purple-500/20',
      borderColorHover: 'hover:border-purple-400/40',
      accentClass: 'accent-purple',
      label: 'Mind',
    },
    shadow: {
      primary: 'indigo-500',
      primaryHex: '#6366f1',
      glow: 'rgba(99, 102, 241, 0.25)',
      gradient: 'from-indigo-500 to-blue-500',
      borderColor: 'border-indigo-500/20',
      borderColorHover: 'hover:border-indigo-400/40',
      accentClass: 'accent-indigo',
      label: 'Shadow',
    },
    body: {
      primary: 'emerald-500',
      primaryHex: '#10b981',
      glow: 'rgba(16, 185, 129, 0.25)',
      gradient: 'from-emerald-500 to-teal-500',
      borderColor: 'border-emerald-500/20',
      borderColorHover: 'hover:border-emerald-400/40',
      accentClass: 'accent-emerald',
      label: 'Body',
    },
    spirit: {
      primary: 'blue-500',
      primaryHex: '#3b82f6',
      glow: 'rgba(59, 130, 246, 0.25)',
      gradient: 'from-blue-500 to-cyan-500',
      borderColor: 'border-blue-500/20',
      borderColorHover: 'hover:border-blue-400/40',
      accentClass: 'accent-blue',
      label: 'Spirit',
    },
  },

  // Text colors
  text: {
    primary: 'slate-100',
    secondary: 'slate-400',
    accent: 'indigo-400',
  },

  // Card styles
  card: {
    base: 'bg-slate-800/40 backdrop-blur-xl',
    border: 'border border-slate-700/30',
    shadow: 'shadow-[0_8px_32px_rgba(0,0,0,0.4)]',
    shadowHover: 'hover:shadow-[0_20px_48px_rgba(0,0,0,0.6)]',
    transition: 'transition-all duration-300',
    hover: 'hover:-translate-y-1',
  },

  // Button styles
  button: {
    primary: 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg hover:shadow-indigo-500/50 transform hover:scale-105',
    secondary: 'bg-slate-700/40 hover:bg-slate-700/60 border border-slate-600/40',
  },

  // Animation classes
  animation: {
    fadeIn: 'animate-fade-in',
    fadeInUp: 'animate-fade-in-up',
    slideInRight: 'animate-slide-in-right',
    popIn: 'animate-pop-in',
    glow: 'animate-glow',
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
