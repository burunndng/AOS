# Integral Body Architect - UI Form Additions

## Status
✅ **Phase 1 (Backend)**: Complete
- Types updated
- calculateMetrics() function added
- buildPrompt() updated with biometric calculations

✅ **Phase 2 (Props)**: Complete
- State variables added
- Props passed to BlueprintStep

✅ **Phase 3 (UI)**: Complete
- Icon imports added (User, Target)
- Props destructuring updated
- expandedSections state updated
- Essential Profile section added
- Training Goals & Experience section added

---

## Required UI Additions to BlueprintStep

### 1. Add to destructuring (line ~523):

```typescript
const {
  goalStatement,
  onGoalChange,
  // ADD THESE:
  age,
  onAgeChange,
  sex,
  onSexChange,
  height,
  onHeightChange,
  bodyweight,
  onBodyweightChange,
  activityLevel,
  onActivityLevelChange,
  strengthTrainingExperience,
  onStrengthTrainingExperienceChange,
  primaryGoal,
  onPrimaryGoalChange,
  maxWorkoutDuration,
  onMaxWorkoutDurationChange,
  preferredWorkoutTimes,
  onTogglePreferredWorkoutTime,
  // ... rest of existing
} = props;
```

### 2. Add NEW section after "Your Goals" section (after line ~598):

```tsx
{/* NEW SECTION: Essential Profile */}
<CollapsibleSection
  title="Essential Profile"
  icon={<User size={18} className="text-cyan-400" />}
  isExpanded={expandedSections.essentialProfile}
  onToggle={() => toggleSection('essentialProfile')}
>
  <div className="space-y-4">
    {/* Demographics Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
          Age (years) <span className="text-red-400">*</span>
        </label>
        <input
          type="number"
          value={age}
          onChange={e => onAgeChange(e.target.value)}
          placeholder="28"
          min="13"
          max="100"
          required
          className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
          Sex <span className="text-red-400">*</span>
        </label>
        <select
          value={sex}
          onChange={e => onSexChange(e.target.value as 'male' | 'female' | 'other')}
          className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100 text-sm"
        >
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other/Prefer not to say</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
          Height (cm) <span className="text-red-400">*</span>
        </label>
        <input
          type="number"
          value={height}
          onChange={e => onHeightChange(e.target.value)}
          placeholder="175"
          min="120"
          max="250"
          required
          className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100 text-sm"
        />
      </div>
    </div>

    {/* Body & Activity Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
          Bodyweight (kg) <span className="text-red-400">*</span>
        </label>
        <input
          type="number"
          value={bodyweight}
          onChange={e => onBodyweightChange(e.target.value)}
          placeholder="70"
          min="30"
          max="250"
          step="0.1"
          required
          className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
          Activity Level <span className="text-red-400">*</span>
        </label>
        <select
          value={activityLevel}
          onChange={e => onActivityLevelChange(e.target.value as any)}
          className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100 text-sm"
        >
          <option value="sedentary">Sedentary (desk job, little exercise)</option>
          <option value="lightly-active">Lightly Active (exercise 1-3 days/week)</option>
          <option value="moderately-active">Moderately Active (exercise 3-5 days/week)</option>
          <option value="very-active">Very Active (exercise 6-7 days/week)</option>
          <option value="athlete">Athlete (2x/day training)</option>
        </select>
        <p className="text-xs text-slate-500 mt-1">Your baseline activity outside of planned workouts</p>
      </div>
    </div>
  </div>
</CollapsibleSection>

{/* NEW SECTION: Training Goals & Experience */}
<CollapsibleSection
  title="Training Goals & Experience"
  icon={<Target size={18} className="text-purple-400" />}
  isExpanded={expandedSections.trainingGoals}
  onToggle={() => toggleSection('trainingGoals')}
>
  <div className="space-y-4">
    <div>
      <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
        Primary Goal <span className="text-red-400">*</span>
      </label>
      <select
        value={primaryGoal}
        onChange={e => onPrimaryGoalChange(e.target.value as any)}
        className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100 text-sm"
      >
        <option value="lose-fat">Lose Fat</option>
        <option value="gain-muscle">Gain Muscle</option>
        <option value="recomp">Body Recomposition (lose fat + gain muscle)</option>
        <option value="maintain">Maintain Current Composition</option>
        <option value="performance">Performance (strength/endurance)</option>
        <option value="general-health">General Health & Wellness</option>
      </select>
      <p className="text-xs text-slate-500 mt-1">This determines your calorie/macro targets and training split</p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
          Strength Training Experience <span className="text-red-400">*</span>
        </label>
        <select
          value={strengthTrainingExperience}
          onChange={e => onStrengthTrainingExperienceChange(e.target.value as any)}
          className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100 text-sm"
        >
          <option value="never">Never trained with weights</option>
          <option value="beginner">Beginner (&lt;6 months)</option>
          <option value="intermediate">Intermediate (6mo-2yrs)</option>
          <option value="advanced">Advanced (2+ years)</option>
        </select>
        <p className="text-xs text-slate-500 mt-1">Determines exercise complexity and volume</p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
          Max Workout Duration
        </label>
        <select
          value={maxWorkoutDuration}
          onChange={e => onMaxWorkoutDurationChange(e.target.value)}
          className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100 text-sm"
        >
          <option value="30">30 minutes</option>
          <option value="45">45 minutes</option>
          <option value="60">60 minutes</option>
          <option value="90">90 minutes</option>
        </select>
        <p className="text-xs text-slate-500 mt-1">Realistic time you have per session</p>
      </div>
    </div>

    {/* Preferred Workout Times */}
    <div>
      <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
        Preferred Workout Times (Optional)
      </label>
      <div className="grid grid-cols-3 gap-2">
        {(['morning', 'afternoon', 'evening'] as const).map(time => (
          <button
            key={time}
            onClick={() => onTogglePreferredWorkoutTime(time)}
            className={`p-2.5 rounded-md text-xs font-medium transition capitalize ${
              preferredWorkoutTimes.includes(time)
                ? 'bg-accent text-slate-900'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {time}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-500 mt-2">AI will schedule workouts during these times</p>
    </div>
  </div>
</CollapsibleSection>
```

### 3. Update expandedSections state (line ~555):

```typescript
const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
  goals: true,
  essentialProfile: true,  // NEW
  trainingGoals: true,     // NEW
  yangConstraints: true,
  yinStates: true,
  recoveryLifestyle: true,
});
```

### 4. Add User icon import (top of file):

```typescript
import { X, ArrowRight, Heart, Dumbbell, Wind, CheckCircle, Download, Play, ChevronDown, ChevronUp, Share2, AlertTriangle, Plus, Trash2, Clock, FileText, User, Target } from 'lucide-react';
```

---

## Files Modified So Far

1. ✅ `types.ts` - Added YangConstraints fields
2. ✅ `services/integralBodyArchitectService.ts` - Added calculateMetrics(), updated buildPrompt()
3. ✅ `components/IntegralBodyArchitectWizard.tsx` - State & props (partial - needs UI completion)

---

## Next Steps

1. Add the UI sections above to BlueprintStep component
2. Test the form with sample data
3. Verify metrics calculation
4. Commit changes

---

## Testing Checklist

- [ ] Form validation works (age, height, weight required)
- [ ] BMI calculated correctly (e.g., 75kg, 180cm = 23.1)
- [ ] TDEE calculated based on activity level
- [ ] Calorie adjustment based on goal
- [ ] Protein/carbs/fats distributed correctly
- [ ] Age considerations reflected in prompt
- [ ] Experience level affects exercise selection
- [ ] Max duration respected in workouts
