---
layout: default
---

# Insight Practice Map - Style Guide & Implementation Examples

This guide shows exactly how to style the Insight Practice Map to match the Aura OS design system.

---

## HEADER SECTION

{% raw %}
```tsx
<div className="relative flex flex-col items-center justify-center h-full text-center overflow-hidden">
  {/* Background Icon (like Merkaba in dashboard) */}
  <SomeIcon className="absolute inset-0 w-full h-full text-slate-800/50 opacity-10" 
            style={{ transform: 'scale(2.5)' }}/>
  
  <div className="relative z-10">
    <header className="mb-8 animate-fade-in">
      <h1 className="text-5xl font-bold font-mono tracking-tighter 
                     bg-gradient-to-r from-accent via-purple-400 to-accent 
                     bg-clip-text text-transparent">
        Insight Practice Map
      </h1>
      <p className="text-slate-400 mt-2 max-w-lg">
        A journey through the 16 Ñanas of meditation and insight practice
      </p>
    </header>
  </div>
</div>
```
{% endraw %}

---

## MAIN CONTENT SECTION

{% raw %}
```tsx
<section className="mt-16 w-full max-w-4xl mx-auto text-left animate-fade-in-up" 
         style={{ animationDelay: '600ms' }}>
  
  {/* Section Title */}
  <h2 className="text-3xl font-bold font-mono text-slate-100 tracking-tight mb-2 text-center">
    Progress of Insight
  </h2>
  <p className="text-slate-400 text-center mb-6">
    The 16 Ñanas Journey
  </p>

  {/* Summary Stats Grid */}
  <div className="grid grid-cols-3 gap-4 mb-8">
    {/* Individual Stat Card */}
    <div className="card-glass relative bg-gradient-to-br from-neutral-900/50 to-neutral-900/25 
                    border border-neutral-500/40 rounded-xl p-6 text-center 
                    group hover:border-neutral-500/60 hover:-translate-y-1 
                    transition-all duration-300 overflow-hidden"
         style={{
           backdropFilter: 'blur(12px)',
           boxShadow: '0 8px 24px rgba(115, 115, 115, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
         }}>
      
      {/* Hover glow effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
           style={{
             background: 'radial-gradient(circle at top right, rgba(115, 115, 115, 0.1) 0%, transparent 60%)'
           }}></div>
      
      <div className="relative z-10">
        <div className="text-4xl font-bold text-neutral-300 group-hover:scale-110 transition-transform duration-300">
          {count}
        </div>
        <div className="text-xs text-slate-400 mt-2 font-medium tracking-wide">
          Label Text
        </div>
      </div>
    </div>
  </div>

  {/* Main Content Cards */}
  <div className="space-y-4">
    {/* Example: Stage/Item Card */}
    <div className="card-glass relative bg-gradient-to-br from-slate-800/70 to-slate-900/50 
                    border border-amber-600/50 rounded-xl p-6 
                    hover:border-amber-500/70 hover:-translate-y-1 
                    transition-all duration-300 group overflow-hidden"
         style={{
           backdropFilter: 'blur(10px)',
           boxShadow: '0 12px 32px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(217, 119, 6, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.05)'
         }}>
      
      {/* Hover glow for amber */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
           style={{
             background: 'radial-gradient(circle at top right, rgba(217, 119, 6, 0.08) 0%, transparent 60%)'
           }}></div>
      
      <div className="relative z-10">
        {/* Badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs px-3 py-1 rounded-full border font-semibold 
                           text-amber-400 bg-amber-900/30 border-amber-700/50">
            Stage 1
          </span>
          <p className="text-xs text-slate-500">
            {dateOrLabel}
          </p>
        </div>
        
        {/* Title */}
        <h4 className="text-lg font-semibold text-slate-200 mb-2">
          Stage Name
        </h4>
        
        {/* Description */}
        <p className="text-slate-400 text-sm mb-4">
          Description of the stage or insight
        </p>
        
        {/* Inner card for detail */}
        <div className="bg-slate-900/60 border border-slate-700/60 rounded-md p-3 shadow-sm"
             style={{backdropFilter: 'blur(6px)'}}>
          <p className="font-semibold text-slate-300 flex items-center gap-2">
            <IconComponent size={16} className="text-amber-400"/> Key Detail:
          </p>
          <p className="text-sm text-slate-200 mt-1">
            Detail content here
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="mt-4 flex gap-2">
          <button className="bg-gradient-to-r from-amber-600 to-amber-700 
                            hover:from-amber-500 hover:to-amber-600 
                            text-white text-xs font-medium px-3 py-1.5 rounded-lg 
                            transition-all duration-300 flex items-center gap-1 
                            shadow-md hover:shadow-lg transform hover:scale-105"
                  style={{boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)'}}>
            <IconComponent size={14} /> Primary Action
          </button>
          <button className="bg-neutral-700/60 hover:bg-neutral-700/80 rounded-md px-3 py-1.5 
                            flex justify-between items-center transition-all duration-200 
                            text-xs text-slate-300 font-medium">
            Secondary
          </button>
        </div>
      </div>
    </div>
  </div>
</section>
```
{% endraw %}

---

## PHASE/SECTION DIVIDER

```tsx
<div className="mt-8 mb-6">
  <h3 className="text-xl font-semibold text-slate-300 mb-4 flex items-center gap-2">
    <IconComponent size={20} className="text-amber-400"/> Section Title
  </h3>
  <div className="h-px bg-gradient-to-r from-amber-600/50 to-transparent"></div>
</div>
```

---

## PROGRESS/TIMELINE INDICATOR

{% raw %}
```tsx
{/* Progress Bar */}
<div className="sticky top-0 bg-gradient-to-b from-slate-950 via-slate-950 to-transparent pt-2 pb-6 mb-6">
  <div className="text-center mb-4">
    <h2 className="text-3xl font-black text-slate-100 mb-1">Progress of Insight</h2>
    <p className="text-slate-400 text-sm">The 16 Ñanas Journey</p>
  </div>
  
  {/* Actual progress bar */}
  <div className="h-2 bg-slate-700/60 rounded-full overflow-hidden">
    <div className="h-full bg-gradient-to-r from-accent/80 to-accent rounded-full"
         style={{ width: `${progressPercent}%` }}
         className="transition-all duration-500 ease-out"></div>
  </div>
  <p className="text-xs text-slate-400 mt-2 text-center">
    {completedCount} of {totalCount} stages completed
  </p>
</div>
```
{% endraw %}

---

## COMPLETED/ADDRESSED STATE CARDS

{% raw %}
```tsx
{/* For completed items, use green borders */}
<div className="card-glass relative bg-gradient-to-br from-slate-800/70 to-slate-900/50 
                border border-green-600/50 rounded-xl p-6 
                hover:border-green-500/70 hover:-translate-y-1 
                transition-all duration-300 group overflow-hidden opacity-85"
     style={{
       backdropFilter: 'blur(10px)',
       boxShadow: '0 12px 32px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(34, 197, 94, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.05)'
     }}>
  
  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
       style={{
         background: 'radial-gradient(circle at top right, rgba(34, 197, 94, 0.08) 0%, transparent 60%)'
       }}></div>
  
  <div className="relative z-10">
    {/* Green checkmark badge */}
    <div className="flex items-center gap-2 mb-3">
      <CheckCircleIcon size={16} className="text-green-500" />
      <span className="text-xs px-2 py-1 rounded-full border font-semibold 
                       text-green-400 bg-green-900/30 border-green-700/50">
        Completed
      </span>
    </div>
    
    <h4 className="text-lg font-semibold text-slate-200">Stage Name</h4>
    <p className="text-slate-400 text-sm mt-2">Completion details</p>
  </div>
</div>
```
{% endraw %}

---

## TAB/VIEW SWITCHER BUTTONS

```tsx
<div className="flex gap-2 mb-6">
  <button className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
    activeView === 'map' 
      ? 'bg-gradient-to-r from-accent/20 to-accent/8 text-accent font-semibold border border-accent/40 shadow-lg'
      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 hover:border hover:border-accent/30'
  }`}
  onClick={() => setActiveView('map')}>
    <MapIcon size={18} className="inline mr-2" /> Map View
  </button>
  
  <button className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
    activeView === 'chat' 
      ? 'bg-gradient-to-r from-accent/20 to-accent/8 text-accent font-semibold border border-accent/40 shadow-lg'
      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 hover:border hover:border-accent/30'
  }`}
  onClick={() => setActiveView('chat')}>
    <ChatIcon size={18} className="inline mr-2" /> Chat
  </button>
</div>
```

---

## CHAT/CONVERSATION SECTION

{% raw %}
```tsx
{/* Chat Container */}
<div className="flex flex-col gap-4 max-h-96 overflow-y-auto pr-2">
  {/* User Message */}
  <div className="flex justify-end">
    <div className="bg-slate-700/60 border border-slate-600/60 rounded-lg p-3 max-w-xs text-sm text-slate-200">
      {userMessage}
    </div>
  </div>
  
  {/* Assistant Message */}
  <div className="flex justify-start">
    <div className="bg-gradient-to-br from-amber-900/30 to-orange-900/20 
                    border border-amber-600/50 rounded-lg p-3 max-w-xs 
                    text-sm text-slate-200" style={{backdropFilter: 'blur(6px)'}}>
      {assistantMessage}
    </div>
  </div>
</div>

{/* Input area */}
<div className="flex gap-2 mt-4">
  <input 
    type="text"
    value={inputText}
    onChange={(e) => setInputText(e.target.value)}
    placeholder="Ask about your practice..."
    className="flex-1 px-4 py-3 bg-neutral-700 border border-neutral-600 
               rounded-lg text-slate-200 placeholder-slate-500 
               focus:border-accent/40 focus:outline-none"
  />
  <button className="bg-gradient-to-r from-amber-600 to-amber-700 
                    hover:from-amber-500 hover:to-amber-600 
                    text-white px-4 py-3 rounded-lg transition-all 
                    transform hover:scale-105 shadow-md"
          onClick={handleSend}>
    <SendIcon size={18} />
  </button>
</div>
```
{% endraw %}

---

## MODAL/OVERLAY PATTERN (if needed)

```tsx
<div className="fixed inset-0 bg-black/60 backdrop-blur-sm 
                flex justify-center items-center z-50 p-4">
  <div className="bg-slate-800 border border-slate-700 rounded-lg 
                  shadow-2xl w-full max-w-lg p-6 animate-fade-in-up">
    <div className="flex justify-between items-start mb-4">
      <h2 className="text-xl font-bold text-slate-50">Title</h2>
      <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
        <XIcon size={24} />
      </button>
    </div>
    
    {/* Content */}
    <div className="text-slate-300 leading-relaxed">
      Content here
    </div>
  </div>
</div>
```

---

## SPACING & LAYOUT GRID

```tsx
// Main container with typical Aura spacing
<div className="w-full max-w-4xl mx-auto px-4">
  {/* Large section spacing */}
  <div className="space-y-8">
    {/* Header section - gap 2rem between elements */}
    <header className="space-y-4">
      <h1>Title</h1>
      <p>Description</p>
    </header>
    
    {/* Cards section - gap 1rem between cards */}
    <div className="space-y-4">
      <Card />
      <Card />
    </div>
    
    {/* Grid with consistent gaps */}
    <div className="grid grid-cols-3 gap-4">
      <Card />
      <Card />
      <Card />
    </div>
  </div>
</div>
```

---

## ANIMATION ENTRANCE PATTERN

{% raw %}
```tsx
// Section with staggered entrance
<section className="w-full max-w-4xl mx-auto text-left animate-fade-in-up" 
         style={{ animationDelay: '0ms' }}>
  <h2 className="text-3xl font-bold mb-2">Title</h2>
  <p className="text-slate-400 mb-6">Subtitle</p>
  
  {/* Stats with staggered animation */}
  <div className="grid grid-cols-3 gap-4 mb-8">
    {stats.map((stat, idx) => (
      <div key={idx} className="animate-fade-in-up overflow-hidden"
           style={{ animationDelay: `${(idx + 1) * 100}ms` }}>
        <StatCard {...stat} />
      </div>
    ))}
  </div>
  
  {/* Main content with further delay */}
  <div className="animate-fade-in-up"
       style={{ animationDelay: '400ms' }}>
    <MainContent />
  </div>
</section>
```
{% endraw %}

---

## KEY TAKEAWAYS FOR INSIGHT PRACTICE MAP

1. **Use the exact card classes from theme.ts**: `bg-neutral-900/50 backdrop-blur-sm border border-neutral-800/50`

2. **Match the DashboardTab structure**: Header with gradient text + icon, then sections with spacing

3. **For colored sections**: Use amber for pending/primary, green for completed

4. **Button actions**: Small amber/green gradient buttons with scale-105 on hover

5. **Inner cards**: Use darker `bg-slate-900/60` for nested information boxes

6. **Smooth animations**: Fade-in-up on section entrance with staggered delays

7. **Consistent spacing**: gap-4 within sections, gap-6 between sections, p-6 for cards

8. **Font consistency**: Text-3xl bold mono for section titles, text-slate-300 for body

9. **Hover effects**: All cards get -translate-y-1 and shadow enhancement

10. **Glow overlays**: Use radial gradients on group hover for polish

