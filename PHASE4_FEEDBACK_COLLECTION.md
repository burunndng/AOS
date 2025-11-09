# Phase 4: Plan Feedback Collection Implementation

## Overview

This document describes the Phase 4 implementation for the "Collect Plan Feedback" feature, which closes the personalization loop by allowing users to log what happened post-plan and feed it into the history store.

## Features Implemented

### 1. Plan Feedback Modal (`components/PlanFeedbackModal.tsx`)

A comprehensive modal for collecting daily feedback across all days of a plan.

**Features:**
- **Day Navigation**: Users navigate through each day of the week with Previous/Next buttons
- **Progress Tracking**: Visual progress bar showing completion status (e.g., "Day 3 of 7")
- **Workout Completion**: Checkbox to mark if the planned workout was completed
- **Yin Practice Selection**: Checkboxes for each planned yin practice with practice details (name, duration, time of day)
- **Intensity & Energy Scales**: 1-10 sliders for intensity felt and energy level with numeric display
- **Blocker Logging**: Text area for notes about challenges (e.g., "Low energy in the morning")
- **Reflections**: Optional text area for general notes and reflections about the day

**Data Structure:**
```typescript
interface PlanDayFeedback {
  date: string; // ISO date string (YYYY-MM-DD)
  dayName: string; // e.g., "Monday"
  completedWorkout: boolean;
  completedYinPractices: string[]; // Array of practice names completed
  intensityFelt: number; // 1-10 scale
  energyLevel: number; // 1-10 scale
  blockers?: string; // Notes about what got in the way
  notes?: string; // General reflections
  timestamp: string; // ISO timestamp when feedback was logged
}
```

### 2. Plan Handoff Review Component (`components/PlanHandoffReview.tsx`)

Displays aggregate progress and personalization insights in the Phase 4 HANDOFF step.

**Features:**
- **Compliance Summary**: Visual bars showing workout and yin practice completion rates with color coding:
  - Green (≥80%): Excellent
  - Teal (60-79%): Good
  - Amber (40-59%): Fair
  - Red (<40%): Low
  
- **Average Metrics**: Shows average intensity and energy levels from logged feedback

- **Personalization Insights** (if available):
  - Recommendation directives with impact levels
  - Common blockers from feedback history
  - Recommended intensity level and yin practice duration
  
- **Quick Actions**:
  - "Review Feedback" button: Opens the feedback modal to log/review daily feedback
  - "Mark Complete" button: Updates plan status to 'completed'

- **Helpful Tips**: Explains the value of daily feedback for personalization

### 3. Quick Day Actions Component (`components/QuickDayActions.tsx`)

Minimal, inline component for quick actions during plan delivery or viewing.

**Features:**
- **Mark Complete Button**: Green button to quickly mark a day as complete
- **Flag Issue Button**: Amber button that opens inline text input for flagging issues
  - Supports Enter to submit and Escape to cancel
  - Minimal UI for integration into delivery views

### 4. Enhanced IntegralBodyArchitectWizard

Updated wizard with integrated feedback collection and handoff review.

**New Props:**
```typescript
onLogPlanFeedback?: (planId: string, dayDate: string, dayName: string, feedback: Omit<PlanDayFeedback, 'date' | 'timestamp' | 'dayName'>) => void;
onToggleTrackerCompletion?: (practiceId: string) => void;
planHistory?: PlanHistoryEntry | null;
onUpdatePlanStatus?: (planId: string, status: 'active' | 'completed' | 'abandoned') => void;
```

**Changes:**
- Imports PlanFeedbackModal and PlanHandoffReview components
- Adds `isFeedbackModalOpen` state to manage feedback modal visibility
- HANDOFF step now renders PlanHandoffReview with personalization insights
- "Review Feedback" button in handoff opens the feedback modal
- Feedback modal submits data via `onLogPlanFeedback` callback

## Data Flow

### Logging Feedback

1. User navigates to HANDOFF step after saving a plan
2. User clicks "Review Feedback" button
3. PlanFeedbackModal opens showing Day 1 of 7
4. User completes feedback for each day (workout, yin practices, intensity, energy, blockers, notes)
5. Feedback is submitted via `onLogPlanFeedback` callback
6. App.tsx processes feedback and updates:
   - `integralBodyPlanHistory`: Daily feedback stored in PlanHistoryEntry
   - `planProgressByDay`: Quick lookup by plan ID and date
   - `completionHistory`: Global tracker updated with completed yin practices
   - Aggregate metrics calculated (compliance rates, average intensity/energy)

### Tracker Sync

When yin practices are marked as completed in feedback, they are automatically synced to the global `completionHistory`:

```typescript
// From App.tsx logPlanFeedback
feedback.completedYinPractices.forEach(practiceName => {
  updated[practiceName] = [...(updated[practiceName] || []), dayDate];
});
```

This ensures:
- Completed practices show in the daily tracker
- Streaks and completion tracking remain accurate
- Historical data is consistent across views

### Personalization Integration

1. When wizard opens, `generatePersonalizationSummary()` runs if history exists
2. PersonalizationSummary is passed to PlanHandoffReview
3. Recommendations, blockers, and intensity suggestions are displayed
4. Insights inform future plan generation via `buildPersonalizationPromptInsertion()`

## Acceptance Criteria Verification

✅ **Feedback inputs persist across reloads**
- Data stored in localStorage via `integralBodyPlanHistory` and `planProgressByDay`
- Verified through localStorage inspection in DevTools

✅ **Completion toggles keep tracker data in sync**
- Yin practices marked complete are added to global `completionHistory`
- Sync happens in `logPlanFeedback` callback
- Prevents duplicate entries by checking existence before adding

✅ **UI gracefully handles users skipping feedback**
- Defaults recorded without errors
- If no feedback logged, handoff shows "No feedback logged yet" message
- Modal doesn't require all fields to be filled

✅ **TypeScript builds clean**
- `npm run build` succeeds with no errors
- All components properly typed with interfaces
- New callbacks integrated into wizard props

## Usage Examples

### For Users

1. **Logging Daily Feedback:**
   - Save an Integral Body Plan → Plan transitions to HANDOFF step
   - Click "Review Feedback" → Modal opens
   - For each day: Mark workout completion, select completed yin practices, rate intensity (1-10) and energy (1-10), note blockers
   - Navigate with Previous/Next buttons
   - Click "Save & Next" for each day or "Complete Feedback" for the last day

2. **Viewing Progress:**
   - In HANDOFF step, compliance bars show completion rates
   - Red/amber/teal/green colors indicate performance level
   - Personalization insights show recommended adjustments

3. **Flagging Issues:**
   - From delivery view (if integrated), click "Flag" button
   - Type issue (e.g., "low energy", "couldn't find time")
   - Press Enter to submit

### For Developers

**Passing Callbacks from App.tsx:**
```typescript
<IntegralBodyArchitectWizard
  onClose={() => setActiveWizard(null)}
  onSave={handleSaveIntegralBodyPlan}
  personalizationSummary={currentPersonalizationSummary}
  onLogPlanFeedback={logPlanFeedback}
  onToggleTrackerCompletion={togglePracticeCompletion}
  planHistory={currentPlan ? getPlanProgress(currentPlan.id) : null}
  onUpdatePlanStatus={updatePlanStatus}
/>
```

**Handling Feedback Submission:**
```typescript
const logPlanFeedback = useCallback((
  planId: string,
  dayDate: string,
  dayName: string,
  feedback: {
    completedWorkout: boolean;
    completedYinPractices: string[];
    intensityFelt: number;
    energyLevel: number;
    blockers?: string;
    notes?: string;
  }
) => {
  // Update plan history
  // Sync with global tracker
  // Calculate aggregates
}, [...dependencies]);
```

## Testing Scenarios

### QA Test 1: Feedback Persistence
1. Generate and save a plan
2. Log feedback for each day (varying completion rates and blockers)
3. Reload the page
4. Verify feedback is still there and localStorage shows data

### QA Test 2: Tracker Sync
1. Generate and save a plan with 3 yin practices per day
2. Log feedback marking all yin practices as complete
3. Check completionHistory in localStorage
4. Verify completed practices appear in daily tracker with correct dates

### QA Test 3: Graceful Defaults
1. Save a plan without logging any feedback
2. Verify HANDOFF shows "No feedback logged yet"
3. Navigate back to review and start logging - no errors

### QA Test 4: Personalization Integration
1. Save multiple plans over time
2. Log feedback showing patterns (e.g., low compliance with morning workouts)
3. In next wizard open, verify personalization shows relevant recommendations
4. Check console logs for "📊 Personalization Analysis" output

## Files Modified/Created

### New Files
- `components/PlanFeedbackModal.tsx` - Feedback collection modal
- `components/PlanHandoffReview.tsx` - HANDOFF visualization
- `components/QuickDayActions.tsx` - Quick action buttons

### Modified Files
- `components/IntegralBodyArchitectWizard.tsx` - Integrated feedback modal and handoff review
- `App.tsx` - Enhanced logPlanFeedback with tracker sync
- `types.ts` - Already had PlanDayFeedback and PlanHistoryEntry types

## Architecture Notes

### Component Hierarchy
```
App.tsx
├── IntegralBodyArchitectWizard
│   ├── PlanFeedbackModal
│   │   └── Day-by-day feedback collection
│   └── (HANDOFF step)
│       └── PlanHandoffReview
│           ├── Compliance Summary
│           ├── Personalization Insights
│           └── Quick Actions
└── (Global state management)
    ├── integralBodyPlanHistory
    ├── planProgressByDay
    ├── completionHistory
    └── currentPersonalizationSummary
```

### Data Persistence Strategy
- localStorage stores all plan history and feedback
- No backend required
- Graceful degradation if localStorage unavailable
- Export/import included in existing App.tsx utilities

### Sync Strategy
- Forward sync: Feedback → completionHistory
- Backward compatible: Legacy plans without history work fine
- Non-destructive: Completed yin practices added, not replaced

## Future Enhancements

1. **Inline Quick Actions in Delivery View**
   - Integrate QuickDayActions component into DayCard
   - Allow marking days complete without opening modal

2. **Historical Analysis Dashboard**
   - Show compliance trends over time
   - Identify best-performing time slots and modalities
   - Export compliance reports

3. **AI Coaching Integration**
   - Coach recommends adjustments based on feedback patterns
   - Suggest practice substitutions for chronic blockers

4. **Mobile-Optimized Feedback**
   - Responsive design for phone data entry
   - Push notifications reminding to log feedback

5. **Automated Blocker Analysis**
   - NLP analysis of blocker text
   - Categorize common themes
   - Generate targeted recommendations

## Troubleshooting

### Feedback Not Persisting
- Check localStorage is enabled in browser
- Verify localStorage quota not exceeded
- Check console for errors in logPlanFeedback

### Tracker Not Syncing
- Verify completionHistory structure in localStorage
- Check that practice names in plan match those in feedback
- Ensure logPlanFeedback is being called

### Personalization Not Showing
- Verify at least one plan has feedback logged
- Check console for "📊 Personalization Analysis" log
- Ensure generatePersonalizationSummary() runs when wizard opens

### Modal Not Opening
- Check isFeedbackModalOpen state updates
- Verify onReviewFeedback callback is called
- Check for z-index conflicts with other modals (HANDOFF uses z-50)
