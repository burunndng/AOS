# Aura OS Design System - Comprehensive Analysis

## Overview
Aura OS is a professional, dark-themed meditation and personal transformation application. The design emphasizes elegance, depth, and subtle interactivity with a sophisticated monochromatic color palette complemented by subtle accent lighting.

---

## 1. COLOR SCHEME & PALETTES

### Primary Color Palette (Monochromatic Neutrals)
- **Deep Black**: `#0a0a0a` (bg-black, neutral-950) - Base background
- **Darkest Gray**: `#171717` (neutral-900/60) - Elevated surfaces, cards
- **Dark Gray**: `#262626` (neutral-800) - Buttons, interactive elements
- **Medium Gray**: `#525252` (neutral-700) - Borders, secondary elements
- **Light Gray**: `#a3a3a3` (neutral-400) - Primary text, accents
- **Very Light Gray**: `#e5e5e5` (neutral-100) - Primary text on dark

### Accent Colors (Minimal & Sophisticated)
- **Primary Accent**: `#d9aaef` (Purple/Lavender) - Primary interactive elements, glows
- **Secondary Accent**: `#a3a3a3` (Neutral-400) - Alternative accent
- **Module Colors**: All use the same neutral palette
  - Mind: `#a3a3a3` (neutral-400)
  - Shadow: `#737373` (neutral-500)
  - Body: `#a3a3a3` (neutral-400)
  - Spirit: `#a3a3a3` (neutral-400)

### Status/Semantic Colors
- **Success**: Green palette (`#22c55e` / `#10b981`)
- **Warning/Alert**: Amber palette (`#d97706` / `#f59e0b`)
- **Error**: Red palette (implied)

### Opacity-Based Theming
The design extensively uses rgba with opacity for layering:
- `rgba(217, 170, 239, 0.15)` - Soft accent glows
- `rgba(0, 0, 0, 0.6)` - Deep shadows
- `rgba(115, 115, 115, 0.3)` - Subtle borders
- `rgba(64, 64, 64, 0.2)` - Very subtle dividers

---

## 2. GRADIENTS USED

### Background Gradients
```css
/* Main content area */
linear-gradient(180deg, rgba(10, 10, 10, 0.4) 0%, rgba(10, 10, 10, 0.6) 100%)

/* Deep gradient */
linear-gradient(180deg, 
  rgba(15, 23, 42, 0.9) 0%, 
  rgba(26, 40, 71, 0.75) 50%, 
  rgba(15, 23, 42, 0.85) 100%)

/* Card interior */
linear-gradient(135deg, 
  rgba(23, 23, 28, 1) 0%, 
  rgba(30, 27, 38, 1) 50%, 
  rgba(23, 23, 28, 1) 100%)

/* Module-specific card gradients */
from-neutral-800 to-neutral-700

/* Accent gradients */
linear-gradient(to-r, from-accent to-accent-gold)
```

### Interactive Element Gradients
```css
/* Buttons */
from-amber-600 to-amber-700 (hover: from-amber-500 to-amber-600)
from-green-600 to-green-700 (hover: from-green-500 to-green-600)

/* Cards with accents */
from-slate-700/50 to-slate-800/30
from-amber-900/50 to-orange-900/25
from-neutral-900/50 to-neutral-900/25

/* Text gradients */
from-accent via-purple-400 to-accent (with bg-clip-text)
```

### Radial Gradients (Glow Effects)
```css
radial-gradient(circle at 30% 20%, 
  rgba(217, 170, 239, 0.1) 0%, transparent 50%)

radial-gradient(circle at top right, 
  rgba(217, 119, 6, 0.1) 0%, transparent 60%)
```

---

## 3. LAYOUT PATTERNS

### Overall App Structure
- **Sidebar Navigation**: 256px (w-64) fixed width, sticky left sidebar
- **Main Content**: Flex-1, overflow-y-auto, padded at 2rem (p-8)
- **Container Width**: No max-width restriction, full bleed to edges
- **Spacing**: Base unit of 0.25rem (1px), uses Tailwind scale

### Card Layouts
```tsx
// Glass morphism card base
className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800/50 
           shadow-[0_4px_24px_rgba(0,0,0,0.6)] 
           transition-all duration-300 hover:-translate-y-0.5"

// Card grid layouts common patterns
- 3-column grids: grid-cols-3 gap-4
- 2-column grids: grid-cols-2 gap-4
- Responsive: sm:flex-row (stacks on mobile)
```

### Section Organization
```tsx
// Typical section structure
<section className="w-full max-w-4xl mx-auto text-left">
  <h2 className="text-3xl font-bold mb-2">Title</h2>
  <p className="text-slate-400 mb-6">Description</p>
  
  {/* Content grids */}
  <div className="grid grid-cols-3 gap-4 mb-8">
    {/* Cards */}
  </div>
  
  {/* Additional sections */}
  <div className="space-y-4">
    {/* List items */}
  </div>
</section>
```

### Modal/Dialog Patterns
```tsx
// Fixed overlay
<div className="fixed inset-0 bg-black/60 backdrop-blur-sm 
                flex justify-center items-center z-50 p-4">
  {/* Modal content */}
</div>

// Modal content
className="bg-slate-800 border border-slate-700 rounded-lg 
           shadow-2xl w-full max-w-lg p-6"
```

### Navigation Sidebar Items
- Height: 2.5rem (py-2.5)
- Icon size: 18px
- Gap: 0.75rem (gap-3)
- Border radius: rounded-lg
- Active state: Gradient background with accent color

---

## 4. TYPOGRAPHY & TEXT SIZING

### Font Families
- **Sans-serif (body)**: `Geist Sans`, Inter, sans-serif
- **Monospace (headings)**: `Geist Mono`, monospace
- **Letter spacing on headings**: -0.02em

### Heading Hierarchy
```tsx
// h1 - Page titles
className="text-5xl font-bold font-mono tracking-tighter"
// Used in: Dashboard header, section titles

// h2 - Section titles
className="text-3xl font-bold font-mono tracking-tight"
// Letter spacing: tracking-tighter to tracking-wider

// h3 - Subsection titles
className="text-xl font-semibold"
// Usually with colored icon prefix

// h4 - Card titles
className="text-lg font-semibold text-slate-200"

// Labels/Metadata
className="text-xs font-medium tracking-wide"
// Used for: category badges, timestamps, small descriptive text
```

### Body Text
- **Primary body**: `text-slate-300`, `text-slate-200`, `text-neutral-100`
- **Secondary text**: `text-slate-400`, `text-slate-500`
- **Size**: Default is 1rem (text-base)
- **Small text**: `text-sm` (0.875rem)
- **Extra small**: `text-xs` (0.75rem)
- **Line height**: `leading-relaxed` (1.625) for paragraphs

### Text Effects
- **Gradient text**: 
  ```css
  bg-gradient-to-r from-accent via-purple-400 to-accent
  bg-clip-text text-transparent
  ```
- **Text truncation**: Used sparingly, usually with ellipsis
- **Font weight**: 
  - Regular: 400 (default)
  - Semibold: 600 (emphasis)
  - Bold: 700 (headings)
  - Black: 900 (major headings)

---

## 5. BUTTON STYLES & INTERACTIVE ELEMENTS

### Primary Button (Luminous)
```tsx
className="btn-luminous font-bold py-3 px-6 rounded-xl 
           flex items-center justify-center gap-2 
           shadow-glow-sm hover:shadow-glow-lg 
           transition-all duration-300 transform hover:scale-105"

// Styles
background: rgba(38, 38, 38, 0.6)
border: 1px solid rgba(64, 64, 64, 0.4)
color: #e5e5e5
hover: {
  border-color: rgba(115, 115, 115, 0.6)
  background: rgba(64, 64, 64, 0.6)
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6)
  color: #fff
  scale: 1.05
}
```

### Secondary Button (Glass)
```tsx
className="card-glass bg-gradient-to-r from-slate-700/50 to-slate-800/30 
           hover:from-slate-600/60 hover:to-slate-700/40 
           text-slate-100 font-bold py-3 px-6 rounded-xl 
           flex items-center justify-center gap-2 
           transition-all duration-300 transform hover:scale-105 
           shadow-card border border-accent/20 hover:border-accent/40"
```

### Accent Buttons (CTA)
```tsx
// Amber/Orange accent (warning/secondary action)
className="bg-gradient-to-r from-amber-600 to-amber-700 
           hover:from-amber-500 hover:to-amber-600 
           text-white text-xs font-medium px-3 py-1.5 rounded-lg 
           transition-all duration-300 flex items-center gap-1 
           shadow-md hover:shadow-lg transform hover:scale-105"

// Green accent (success/confirmation)
className="bg-gradient-to-r from-green-600 to-green-700 
           hover:from-green-500 hover:to-green-600 
           text-white text-xs font-medium px-3 py-1.5 rounded-lg 
           transition-all duration-300"
```

### Tertiary/Icon Buttons
```tsx
className="text-slate-400 hover:text-slate-200 
           hover:bg-slate-800/60 hover:border hover:border-accent/30 
           transition-all duration-300 group"

// On hover: Icon scales by 110%
className="group-hover:scale-110 transition-transform duration-300"
```

### Navigation Buttons (Sidebar)
```tsx
// Inactive
className="text-slate-400 hover:text-slate-200 
           hover:bg-slate-800/60 hover:border hover:border-accent/30 
           hover:shadow-md"

// Active
className="bg-gradient-to-r from-accent/20 to-accent/8 
           text-accent font-semibold border border-accent/40 
           shadow-lg"
boxShadow: '0 8px 32px rgba(217, 170, 239, 0.2), 
           0 0 20px rgba(217, 170, 239, 0.15), 
           inset 0 1px 2px rgba(255, 255, 255, 0.1)'
```

### Input Fields
```tsx
className="w-full px-4 py-3 bg-neutral-700 border border-neutral-600 
           rounded-lg text-slate-200 placeholder-slate-500 
           focus:border-accent/40 focus:outline-none resize-none"
```

### Small Action Buttons
```tsx
className="px-2 py-1 rounded-full border font-semibold text-xs"
// Colors vary: text-neutral-400 bg-neutral-900/30, etc.
```

---

## 6. CARD & CONTAINER STYLES

### Standard Card (Glass Morphism)
```tsx
className="bg-neutral-900/50 backdrop-blur-sm 
           border border-neutral-800/50 
           shadow-[0_4px_24px_rgba(0,0,0,0.6)]
           hover:shadow-[0_8px_32px_rgba(0,0,0,0.8)]
           transition-all duration-300 hover:-translate-y-0.5"
```

### Accent Card (Colored borders)
```tsx
// Example: Amber accent
className="bg-gradient-to-br from-slate-800/70 to-slate-900/50 
           border border-amber-600/50 rounded-xl p-6 
           hover:border-amber-500/70 hover:-translate-y-1 
           transition-all duration-300 group"
style={{
  backdropFilter: 'blur(10px)',
  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.3), 
             0 1px 3px rgba(217, 119, 6, 0.2), 
             inset 0 1px 2px rgba(255, 255, 255, 0.05)'
}}

// Hover glow effect
<div className="absolute inset-0 opacity-0 group-hover:opacity-100">
  style={{background: 'radial-gradient(circle at top right, 
                      rgba(217, 119, 6, 0.08) 0%, transparent 60%)'}}
</div>
```

### Nested/Inner Cards
```tsx
className="bg-slate-900/60 border border-slate-700/60 
           rounded-md p-3 shadow-sm"
style={{backdropFilter: 'blur(6px)'}}
```

### Card Padding & Spacing
- Large cards: `p-6` to `p-8` (24-32px)
- Medium cards: `p-4` to `p-6` (16-24px)
- Small cards: `p-3` (12px)

---

## 7. ANIMATIONS & TRANSITIONS

### Keyframe Animations (Defined in index.html)
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
/* Duration: 0.5s ease-out */

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
/* Duration: 0.6s ease-out */

@keyframes slideInRight {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}
/* Duration: 0.5s ease-out */

@keyframes popIn {
  0% { transform: scale(0.95); opacity: 0; }
  70% { transform: scale(1.02); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
/* Duration: 0.3s ease-out */

@keyframes shadow {
  0%, 100% { box-shadow: 0 4px 24px rgba(0, 0, 0, 0.6); }
  50% { box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8); }
}
/* Duration: 3s ease-in-out infinite */
```

### Transition Patterns
```tsx
// Standard smooth transition
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)

// Hover effects
transform hover:scale-105              // Scale up 5%
hover:-translate-y-0.5 to -translate-y-1  // Lift up (2-4px)
hover:shadow-lg                        // Enhance shadow

// Opacity transitions
opacity-0 group-hover:opacity-100
transition-opacity duration-500

// Color transitions
hover:bg-slate-800/60
hover:border-accent/40
hover:text-accent

// Icon animations
group-hover:scale-110                  // Icon grows 10%
group-hover:animate-spin               // Rotating icon
transition-transform duration-300

// Group hover "shine" effect
absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent
opacity-0 group-hover:opacity-10
translate-x-[-100%] group-hover:translate-x-[100%]
transition-all duration-700
```

### Animation Delays (Staggered entrance)
```tsx
animate-fade-in
animate-fade-in-up  style={{ animationDelay: '200ms' }}
animate-fade-in-up  style={{ animationDelay: '400ms' }}
animate-fade-in-up  style={{ animationDelay: '600ms' }}
```

---

## 8. SHADOW SYSTEM

### Shadow Depth Levels
```css
/* Subtle shadow (cards at rest) */
shadow-[0_4px_24px_rgba(0,0,0,0.6)]

/* Medium shadow (cards on hover) */
shadow-[0_8px_32px_rgba(0,0,0,0.8)]

/* Deep shadow (modals, overlays) */
shadow-2xl                    /* 0 25px 50px -12px rgba(0,0,0,0.25) */
box-shadow: 0 20px 60px rgba(217, 170, 239, 0.15)

/* Small shadow (buttons) */
shadow-md
shadow-lg

/* Combined layered shadows */
box-shadow: 0 8px 24px rgba(217, 170, 239, 0.2), 
            0 0 20px rgba(217, 170, 239, 0.15), 
            inset 0 1px 2px rgba(255, 255, 255, 0.1)
```

### Inset Shadows (Subtle emboss)
```css
inset 0 1px 2px rgba(255, 255, 255, 0.1)
inset 0 1px 2px rgba(255, 255, 255, 0.05)
```

---

## 9. BORDER & OUTLINE SYSTEM

### Border Base Classes
```tsx
border                                 // 1px solid
border-neutral-800/50                  // Subtle dark border
border-neutral-700/30                  // Very subtle border
border-neutral-600/50                  // Medium visible border

/* Module-specific borders */
border-neutral-700/30
border-amber-600/50
border-green-600/50
border-amber-500/40

/* Accent borders */
border-accent/20 to border-accent/40
```

### Border Radius
```tsx
rounded-lg                             // 0.5rem (8px)
rounded-xl                             // 0.75rem (12px)
rounded-2xl                            // 1rem (16px)
rounded-full                           /* 9999px (circles) */
```

---

## 10. Z-INDEX HIERARCHY

```tsx
z-10                                   // Content layer (main)
z-50                                   // Modals, floating coaches
z-[1000+]                             // Absolutely positioned overlays
relative z-10                          // Relative positioning within cards
absolute inset-0                       // Glow/gradient overlays within cards
```

---

## 11. INTERACTIVE ELEMENT SPECIFICS

### Badges/Pills
```tsx
className="text-xs px-2 py-1 rounded-full border font-semibold"
// Colors: category.color (varies by tool type)
// Example: text-neutral-400 bg-neutral-900/30 border-neutral-700/50
```

### Progress Bars
```tsx
// Background
className="h-2 bg-slate-700/60 rounded-full overflow-hidden"

// Filled portion
className="h-full bg-gradient-to-r from-accent/80 to-accent rounded-full"

// Animated fill
style={{ width: `${progressPercent}%` }}
transition-all duration-500 ease-out
```

### Scrollbar Styling
```css
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(115, 115, 115, 0.3);
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(163, 163, 163, 0.5);
}
```

---

## 12. RESPONSIVE DESIGN PATTERNS

```tsx
// Flex direction changes
className="flex flex-col sm:flex-row gap-4"

// Grid responsiveness
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4

// Padding/spacing adjustments
p-4 sm:p-6 lg:p-8

// Sidebar behavior
// Sidebar: 256px wide, sticky left
// Main: flex-1, overflow-y-auto
// Assumedly collapses on mobile (pattern common in similar apps)
```

---

## 13. ACCESSIBILITY & POLISH

### Focus States
- Inputs: `focus:border-accent/40 focus:outline-none`
- Buttons: Scale/shadow changes on hover
- Links: Color transitions

### Cursor & Feedback
- Interactive elements: `cursor-pointer`
- Disabled state: `disabled:opacity-50`
- Loading states: `Loader2` icon with rotation animation

### Opacity & Layering
Heavy use of opacity for depth:
- Cards: `bg-neutral-900/50`, `bg-neutral-900/60`
- Borders: `/30` to `/50` opacity
- Backgrounds: `/25` to `/70` opacity
- Text: Full opacity for primary, `/60-90` for secondary

---

## 14. VISUAL POLISH DETAILS

### Backdrop Filters
```tsx
backdrop-blur-sm                       // blur(4px)
backdrop-blur-8                        // blur(8px)
backdrop-blur-12                       // blur(12px)
style={{backdropFilter: 'blur(4px)'}}
```

### Glow Effects
```tsx
// Light glow
box-shadow: 0 8px 32px rgba(217, 170, 239, 0.2)

// Strong glow
box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3)

// Radial glow overlay
radial-gradient(circle at top right, 
  rgba(217, 119, 6, 0.1) 0%, transparent 60%)
```

### Color Tint Overlays
```tsx
// On hover, elements get a colored tint
<div className="absolute inset-0 opacity-0 group-hover:opacity-100 
                transition-opacity duration-500" 
     style={{background: 'radial-gradient(...)'}} />
```

---

## IMPLEMENTATION RECOMMENDATIONS FOR INSIGHT PRACTICE MAP

1. **Match the card base**: Use `bg-neutral-900/50 backdrop-blur-sm border border-neutral-800/50` for all cards
2. **Gradient text headings**: Apply `bg-gradient-to-r from-accent via-purple-400 to-accent bg-clip-text text-transparent` for section titles
3. **Accent borders**: Use colored borders (amber-600/50 for pending, green-600/50 for completed) on cards that need emphasis
4. **Button hierarchy**: Primary actions use the scale-105 hover effect, secondary actions use opacity changes
5. **Spacing**: Use consistent 1.5rem (gap-6) between sections, 1rem (gap-4) within sections
6. **Typography**: Headings in Geist Mono with tracking-tight, body text in Geist Sans with leading-relaxed
7. **Animations**: Fade-in-up for list entries, scale for buttons, shadow-to-shadow for card elevation
8. **Grid layout**: 3-column grids for summaries, full-width for detailed content, 2-column for side-by-side comparisons

