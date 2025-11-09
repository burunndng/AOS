# QA Script: Plan History & Progress Tracking

## Overview
This document describes how to verify that the Integral Body Plan history feature works correctly, including persistence across reloads and import/export flows.

## Features Added

### 1. Data Structures
- **integralBodyPlanHistory**: Array of `PlanHistoryEntry` objects storing execution history keyed by plan ID
- **planProgressByDay**: Map of plan progress organized by plan ID and date

### 2. Plan History Entry Structure
```typescript
{
  planId: string;
  planDate: string;
  weekStartDate: string;
  goalStatement: string;
  startedAt: string; // ISO timestamp when plan was activated
  dailyFeedback: PlanDayFeedback[]; // One entry per day
  aggregateMetrics?: {
    workoutComplianceRate: number; // % of planned workouts completed
    yinComplianceRate: number; // % of planned yin practices completed
    averageIntensity: number;
    averageEnergy: number;
    totalBlockerDays: number;
  };
  completedAt?: string; // ISO timestamp when plan was completed
  status: 'active' | 'completed' | 'abandoned';
}
```

### 3. Daily Feedback Structure
```typescript
{
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

### 4. APIs Available for Components

The following functions are exposed from App.tsx and can be passed to components:

- **logPlanFeedback**: Log daily feedback for a plan
- **getPlanProgress**: Get progress for a specific plan
- **updatePlanStatus**: Update the status of a plan (active/completed/abandoned)

## QA Test Scenarios

### Test 1: Create and Save a Plan
**Objective**: Verify that creating a plan initializes the history entry.

**Steps**:
1. Navigate to Body Tools → Integral Body Architect
2. Fill in goal statement and constraints
3. Generate and save a plan
4. Open browser DevTools → Application → Local Storage
5. Check for `integralBodyPlanHistory` and `planProgressByDay` keys

**Expected Results**:
- `integralBodyPlanHistory` should contain an entry with:
  - `planId` matching the saved plan
  - `status: 'active'`
  - Empty `dailyFeedback` array
  - Populated `startedAt` timestamp
- `planProgressByDay` should contain an entry for the plan ID with an empty object

### Test 2: Log Daily Feedback (Manual Testing via Console)
**Objective**: Verify that feedback can be logged and persisted.

**Steps**:
1. Create a plan (see Test 1)
2. Open browser console
3. Access the App component's logPlanFeedback function (will be available when passed to components)
4. Call it with test data:
```javascript
// Example call (replace with actual function when exposed):
logPlanFeedback(
  'plan-id-here',
  '2024-01-15',
  'Monday',
  {
    completedWorkout: true,
    completedYinPractices: ['Morning Qigong', 'Coherent Breathing'],
    intensityFelt: 7,
    energyLevel: 8,
    blockers: 'Had a late meeting',
    notes: 'Felt good overall'
  }
)
```
5. Check localStorage for updated data

**Expected Results**:
- The plan history entry should have one entry in `dailyFeedback`
- The feedback should include all provided data
- `aggregateMetrics` should be calculated automatically
- `planProgressByDay[planId]['2024-01-15']` should contain the feedback

### Test 3: Persistence Across Page Reloads
**Objective**: Verify that history data persists after page reload.

**Steps**:
1. Create a plan and log some feedback (see Tests 1-2)
2. Note down the plan ID and feedback data
3. Reload the page (F5 or Cmd+R)
4. Check localStorage again for the same data

**Expected Results**:
- All plan history data should be exactly the same as before reload
- No data loss should occur
- State should be restored from localStorage

### Test 4: Export Data with Plan History
**Objective**: Verify that export includes plan history.

**Steps**:
1. Create a plan and log feedback
2. Navigate to the sidebar export option
3. Click "Export Data"
4. Open the downloaded JSON file in a text editor
5. Search for `integralBodyPlanHistory` and `planProgressByDay` keys

**Expected Results**:
- JSON file should contain `integralBodyPlanHistory` array with plan data
- JSON file should contain `planProgressByDay` object with progress data
- All feedback entries should be present and complete

### Test 5: Import Data with Plan History
**Objective**: Verify that import restores plan history correctly.

**Steps**:
1. Export data with plan history (see Test 4)
2. Open browser DevTools → Application → Local Storage
3. Clear all local storage data
4. Reload the page (should show empty state)
5. Use the import function to import the previously exported file
6. Check localStorage for restored data

**Expected Results**:
- `integralBodyPlanHistory` should be restored exactly as exported
- `planProgressByDay` should be restored exactly as exported
- All plan and feedback data should be present

### Test 6: Import Legacy Data (Without Plan History)
**Objective**: Verify graceful handling of legacy imports without plan history fields.

**Steps**:
1. Create a test JSON file without `integralBodyPlanHistory` and `planProgressByDay`:
```json
{
  "practiceStack": [],
  "practiceNotes": {},
  "completionHistory": {}
}
```
2. Import the file
3. Check localStorage

**Expected Results**:
- Import should succeed without errors
- `integralBodyPlanHistory` should be initialized as empty array `[]`
- `planProgressByDay` should be initialized as empty object `{}`
- No errors in console

### Test 7: Aggregate Metrics Calculation
**Objective**: Verify that aggregate metrics are calculated correctly.

**Steps**:
1. Create a plan
2. Log feedback for multiple days with varying data:
   - Day 1: workout completed, 2 yin practices, intensity 7, energy 8
   - Day 2: workout not completed, 0 yin practices, intensity 5, energy 6, blocker present
   - Day 3: workout completed, 3 yin practices, intensity 9, energy 9
3. Check the plan history entry in localStorage

**Expected Results**:
- `workoutComplianceRate`: 66.67% (2 out of 3 days)
- `yinComplianceRate`: Should reflect average practices per day
- `averageIntensity`: (7 + 5 + 9) / 3 = 7
- `averageEnergy`: (8 + 6 + 9) / 3 = 7.67
- `totalBlockerDays`: 1

### Test 8: Update Plan Status
**Objective**: Verify that plan status can be updated.

**Steps**:
1. Create a plan (status should be 'active')
2. Use the `updatePlanStatus` function to mark as completed
3. Check localStorage

**Expected Results**:
- Plan history entry should have `status: 'completed'`
- `completedAt` timestamp should be set
- All other data should remain unchanged

## Utility Functions

The following utility functions are available in `utils/planHistoryUtils.ts`:

1. **logPlanDayFeedback**: Core function to log daily feedback
2. **calculatePlanAggregates**: Calculate aggregate metrics for a plan
3. **mergePlanWithTracker**: Merge plan metadata with tracker completion data
4. **mapPlanDaysToProgress**: Map plan days to progress entries

## Integration Points

### For Future UI Implementation

When building UI components to display and log plan history:

1. **Import the types**:
```typescript
import { PlanHistoryEntry, PlanDayFeedback } from '../types';
```

2. **Accept the props from App.tsx**:
```typescript
interface MyComponentProps {
  planHistory: PlanHistoryEntry[];
  onLogPlanFeedback: (...) => void;
  getPlanProgress: (planId: string) => PlanHistoryEntry | null;
  onUpdatePlanStatus: (...) => void;
}
```

3. **Use the APIs**:
```typescript
// Log feedback
onLogPlanFeedback(planId, dayDate, dayName, {
  completedWorkout: true,
  completedYinPractices: ['Practice 1'],
  intensityFelt: 8,
  energyLevel: 7,
  notes: 'Great session!'
});

// Get progress
const progress = getPlanProgress(planId);
if (progress) {
  console.log('Compliance rate:', progress.aggregateMetrics?.workoutComplianceRate);
}

// Update status
onUpdatePlanStatus(planId, 'completed');
```

## Notes

- All dates should be in ISO format (YYYY-MM-DD for dates, full ISO string for timestamps)
- Intensity and energy levels are clamped to 1-10 range
- Aggregate metrics are recalculated automatically whenever feedback is logged
- The system gracefully handles legacy imports without the new fields
- Plan history is keyed by plan ID, allowing multiple plans to be tracked
- Daily progress is organized by plan ID and date for efficient lookups
