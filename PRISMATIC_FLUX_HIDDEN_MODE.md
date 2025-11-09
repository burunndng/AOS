# Prismatic Flux Hidden Mode

## Overview
The FlabbergasterPortal now includes a secret "Prismatic Flux" hidden mode that can be unlocked via a deliberate gesture. This mode enhances the visual experience, adds new features, and provides an easter egg for curious users.

## How to Activate

### Method 1: Press-and-Hold Gesture (Primary)
1. Open the Flabbergaster portal (triple-click the spark in NavSidebar)
2. Press and hold the Eye avatar in the portal header for 3 seconds
3. Release when the visual transformation occurs

### Method 2: Keyboard Alternative
- The Eye avatar is keyboard accessible (Tab to navigate, Enter/Space to press)
- Hold the key for 3 seconds to activate hidden mode

## Hidden Mode Features

### Visual Enhancements
- **Prismatic Color Scheme**: Portal shifts from red to purple/blue gradient
- **Particle Aura**: Floating particles with animated trajectories
- **Glowing Border**: Animated rainbow border effect
- **Enhanced Animations**: Subtle scaling and hue rotation effects
- **Updated UI Colors**: All chat elements adopt prismatic coloring

### Audio Feedback
- **Gentle Chime**: Plays a harmonic chime sound upon activation
- Uses Web Audio API for synthesis (800Hz → 1200Hz sweep)
- Gracefully falls back if audio is not available

### New Content: Flabbergaster ShadowWorld
- **Shadow Realm Button**: Accessible panel with mystical messaging
- **Curated Messages**: 10 unique shadow-themed messages that cycle randomly
- **Thematic Styling**: Purple-tinted panel with ethereal design

### Persistence Features
- **Discovery Tracking**: First-time discovery is logged to localStorage
- **Subtle Indicator**: Small pulsing dot appears in header after discovery
- **State Management**: Discovery persists across browser sessions

## Technical Implementation

### Core Components
```typescript
// Hidden mode state
const [isHiddenMode, setIsHiddenMode] = useState(false);
const [hasDiscoveredHiddenMode, setHasDiscoveredHiddenMode] = useState(() => {
  return localStorage.getItem('flabbergasterHiddenModeDiscovered') === 'true';
});
```

### Gesture Detection
```typescript
const handleAvatarMouseDown = (e: React.MouseEvent) => {
  e.preventDefault();
  setIsPressing(true);
  setPressStartTime(Date.now());
  
  pressTimerRef.current = setTimeout(() => {
    activateHiddenMode();
  }, 3000);
};
```

### Visual Effects
- CSS animations for particle effects
- Dynamic style injection based on mode state
- Gradient transitions and glow effects

### Audio Synthesis
```typescript
const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
const oscillator = audioContext.createOscillator();
const gainNode = audioContext.createGain();

// Frequency sweep for chime effect
oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.3);
```

## Accessibility Considerations

### Keyboard Navigation
- Eye avatar is fully keyboard accessible
- Proper ARIA labels and tooltips
- Focus management maintained

### Visual Feedback
- High contrast maintained in both modes
- Animations respect prefers-reduced-motion
- Clear visual indicators for interactions

### Screen Reader Support
- Semantic HTML structure preserved
- State changes announced appropriately
- Alternative text for visual elements

## Performance Optimizations

### Animation Efficiency
- CSS transforms for smooth 60fps animations
- Particle count limited to prevent performance issues
- GPU-accelerated properties used

### Memory Management
- Timer cleanup on component unmount
- Event listener management
- State reset on portal close (optional)

## Data Storage

### localStorage Keys
- `flabbergasterHiddenModeDiscovered`: Tracks first discovery
- `hasDiscoveredHiddenMode`: App-level state persistence

### Data Structure
```typescript
// Discovery tracking
localStorage.setItem('flabbergasterHiddenModeDiscovered', 'true');

// Shadow messages (generated dynamically)
const shadowMessages = [
  "The shadows whisper your true name.",
  "In the void between thoughts, you find yourself.",
  // ... more messages
];
```

## Testing Checklist

### Functional Tests
- [ ] Press-and-hold activates hidden mode
- [ ] 3-second timer works correctly
- [ ] Visual transformation occurs
- [ ] Chime sound plays (when audio available)
- [ ] ShadowWorld panel appears
- [ ] Shadow messages generate correctly
- [ ] Discovery persists on reopen
- [ ] Subtle indicator shows after discovery

### Accessibility Tests
- [ ] Keyboard navigation works
- [ ] Screen reader announcements
- [ ] High contrast maintained
- [ ] Reduced motion respected

### Performance Tests
- [ ] Animations run smoothly
- [ ] No memory leaks
- [ ] Timer cleanup works
- [ ] Particle effects don't impact performance

## Browser Compatibility

### Supported Features
- **Modern Browsers**: Full feature support
- **Audio API**: Chrome, Firefox, Safari, Edge
- **CSS Animations**: Universal support
- **localStorage**: Universal support

### Fallbacks
- Audio fails gracefully if Web Audio API unavailable
- CSS animations fall back to static styling
- localStorage fails gracefully (discovery not persisted)

## Future Enhancements

### Potential Additions
- Multiple hidden gestures (e.g., specific key combinations)
- Progressive unlocking of features
- Secret achievements/badges
- Enhanced particle effects with user interaction
- Additional ShadowWorld content categories

### Extension Points
- Modular shadow message system
- Configurable gesture patterns
- Theme variations for hidden mode
- Audio customization options

## Security Considerations

### Safe Implementation
- No sensitive data exposed in hidden mode
- localStorage usage is minimal and non-sensitive
- Audio synthesis uses safe frequency ranges
- No external dependencies for hidden features

### Code Quality
- TypeScript interfaces for all new types
- Proper error handling and fallbacks
- Clean separation of concerns
- Comprehensive documentation

---

*This hidden mode is designed as an easter egg to delight curious users while maintaining the app's core functionality and accessibility standards.*