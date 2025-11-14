---
layout: default
---

# AURA OS DESIGN SYSTEM - QUICK REFERENCE GUIDE

## COLOR PALETTE AT A GLANCE

```
NEUTRALS (Primary)           ACCENTS (Secondary)
─────────────────────        ─────────────────────
#0a0a0a  Black (bg)          #d9aaef  Purple/Lavender
#171717  Dark Charcoal       #d97706  Amber (alerts)
#262626  Dark Gray           #22c55e  Green (success)
#525252  Medium Gray         
#a3a3a3  Light Gray          All modules use same neutral palette
#e5e5e5  Off-white           No color differentiation between Mind/Shadow/Body/Spirit
```

## COMPONENT CHEAT SHEET

### CARDS
```tsx
// Standard
bg-neutral-900/50 backdrop-blur-sm border border-neutral-800/50
shadow-[0_4px_24px_rgba(0,0,0,0.6)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.8)]
transition-all duration-300 hover:-translate-y-0.5

// Colored (Amber example)
border-amber-600/50 hover:border-amber-500/70
bg-gradient-to-br from-slate-800/70 to-slate-900/50
```

### BUTTONS
```tsx
// Primary (Luminous)
btn-luminous py-3 px-6 rounded-xl shadow-glow-sm hover:shadow-glow-lg
transition-all transform hover:scale-105

// Secondary (Glass)
card-glass from-slate-700/50 to-slate-800/30 rounded-xl
shadow-card border-accent/20 hover:border-accent/40

// Action (Amber)
from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600
px-3 py-1.5 rounded-lg shadow-md hover:scale-105

// Action (Green)
from-green-600 to-green-700 hover:from-green-500 hover:to-green-600
```

### TEXT
```tsx
// H1: text-5xl font-bold font-mono tracking-tighter
// H2: text-3xl font-bold font-mono tracking-tight
// H3: text-xl font-semibold
// Body: text-slate-300/slate-200 text-base leading-relaxed
// Small: text-sm text-slate-400
// Micro: text-xs text-slate-500
```

### ANIMATIONS
```tsx
// Entrance
animate-fade-in                              // 0.5s
animate-fade-in-up { animationDelay: '200ms' }  // Stagger

// Hover
transform hover:scale-105                   // Buttons
hover:-translate-y-0.5                      // Cards (lift)
group-hover:scale-110                       // Icons
opacity-0 group-hover:opacity-100           // Shine effect

// Duration
transition-all duration-300 (standard)
transition-all duration-500 (longer)
transition-transform duration-300 (for transforms)
```

## SPACING REFERENCE

| Size | Value | Use Case |
|------|-------|----------|
| gap-1 | 0.25rem | Tight spacing |
| gap-2 | 0.5rem | Buttons, icons |
| gap-3 | 0.75rem | Nav items |
| gap-4 | 1rem | Within sections |
| gap-6 | 1.5rem | Between sections |
| gap-8 | 2rem | Major spacing |
| p-3 | 12px | Small cards |
| p-4 | 16px | Medium cards |
| p-6 | 24px | Large cards |
| p-8 | 32px | Content areas |

## SHADOW DEPTH LEVELS

```
Light:   shadow-md, shadow-lg, shadow-glow-sm
         0 4px 12-16px rgba(0,0,0,0.4-0.6)

Medium:  shadow-[0_4px_24px_rgba(0,0,0,0.6)] (card base)
         0 4px 24px rgba(0,0,0,0.6)

Heavy:   shadow-2xl, shadow-glow-lg
         0 8px 32px rgba(0,0,0,0.8)

Glow:    0 8px 32px rgba(217, 170, 239, 0.2) (accent glow)
```

## BORDER RADIUS SCALE

```
rounded-lg    = 8px   (inputs, small cards)
rounded-xl    = 12px  (buttons, cards)
rounded-2xl   = 16px  (large sections)
rounded-full  = 9999px (circles, badges)
```

## FONT STACK

```
HEADINGS:     'Geist Mono', monospace
              font-mono, font-bold
              tracking-tighter / tracking-tight

BODY:         'Geist Sans', Inter, sans-serif
              font-sans (default)
              leading-relaxed for paragraphs
```

## GRID PATTERNS

```tsx
// 3-column summary grid
grid grid-cols-3 gap-4

// 2-column content
grid grid-cols-2 gap-4

// Flexible row (mobile-responsive)
flex flex-col sm:flex-row gap-4

// Full width with max
w-full max-w-4xl mx-auto
```

## TYPICAL COMPONENT STRUCTURE

```tsx
// Section with title
<section className="w-full max-w-4xl mx-auto text-left animate-fade-in-up">
  <h2 className="text-3xl font-bold font-mono mb-2">Title</h2>
  <p className="text-slate-400 mb-6">Subtitle</p>
  
  {/* Cards */}
  <div className="grid grid-cols-3 gap-4 mb-8">
    <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800/50
                    shadow-[0_4px_24px_rgba(0,0,0,0.6)] rounded-xl p-6
                    hover:shadow-[0_8px_32px_rgba(0,0,0,0.8)]
                    hover:-translate-y-0.5 transition-all duration-300">
      Content
    </div>
  </div>
</section>
```

## STATE CLASSES

```
Hover:     hover:bg-slate-800/60 hover:border-accent/40 hover:shadow-lg
Focus:     focus:border-accent/40 focus:outline-none
Disabled:  disabled:opacity-50
Active:    bg-gradient-to-r from-accent/20 to-accent/8 text-accent font-semibold
```

## RECOMMENDED ACCENT BORDER COLORS

For different states/categories:
- Pending/Alert: `border-amber-600/50` → `hover:border-amber-500/70`
- Success/Complete: `border-green-600/50` → `hover:border-green-500/70`
- Info: `border-neutral-600/50` → `hover:border-neutral-500/70`
- Default: `border-neutral-800/50` → `hover:border-neutral-700/50`

## GLASS EFFECT FORMULA

{% raw %}
```tsx
style={{
  backdropFilter: 'blur(8px-12px)',
  background: 'rgba(23, 23, 23, 0.4-0.6)',
  border: '1px solid rgba(64, 64, 64, 0.2-0.5)',
  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.6),
              inset 0 1px 2px rgba(255, 255, 255, 0.05-0.1)'
}}
```
{% endraw %}

## GLOW/HOVER EFFECT PATTERN

{% raw %}
```tsx
<div className="group relative overflow-hidden">
  {/* Main content */}

  {/* Glow overlay on hover */}
  <div className="absolute inset-0 opacity-0 group-hover:opacity-100
                  transition-opacity duration-500"
       style={{
         background: 'radial-gradient(circle at top right,
                      rgba(217, 119, 6, 0.08) 0%, transparent 60%)'
       }} />
</div>
```
{% endraw %}

## QUICK GRADIENT REFERENCES

```css
/* Text gradient (uses bg-clip-text) */
from-accent via-purple-400 to-accent

/* Card interior */
from-neutral-800 to-neutral-700

/* Button warmth */
from-amber-900/50 to-orange-900/25
from-amber-600 to-amber-700

/* Success */
from-green-600 to-green-700
```

