# QA Plan: Phase 4 Feedback Collection

## Test Environment Setup

1. Open browser DevTools (F12)
2. Go to Application → Local Storage → http://localhost:3000/
3. Clear all entries to start fresh: Right-click → Clear All

## Test Scenario 1: Basic Feedback Collection

**Objective:** Verify that users can collect daily feedback for a plan

**Steps:**
1. Navigate to Body Tools / Stack Builder and start "Integral Body Architect" wizard
2. Complete BLUEPRINT step:
   - Enter goal statement: "Build strength and maintain flexibility"
   - Set bodyweight: 70 kg
   - Set sleep: 8 hours
   - Select equipment: bodyweight, dumbbells
   - Select Yin goal: "reduce-stress"
   - Click "Generate Plan"
3. Wait for SYNTHESIS step to complete and advance to DELIVERY
4. Review the 7-day plan in DELIVERY
5. Click "Save & Continue" → advances to HANDOFF
6. In HANDOFF, click "Review Feedback" button
7. PlanFeedbackModal opens showing "Day 1 of 7"
8. For each day:
   - Mark workout as complete (if shown)
   - Select 1-2 yin practices as completed
   - Set intensity to 7
   - Set energy to 6
   - Add blocker: "Felt tired in morning"
   - Click "Save & Next"
9. On final day (Day 7), click "Complete Feedback"

**Expected Results:**
- ✓ Modal progresses through all 7 days
- ✓ Progress bar updates (7/7, 100%)
- ✓ No errors in console
- ✓ Modal closes after final day submission

**Verify in localStorage:**
- Check `integralBodyPlanHistory` → last entry has 7 dailyFeedback items
- Check `planProgressByDay` → contains 7 entries for the plan

---

## Test Scenario 2: Data Persistence

**Objective:** Verify feedback persists across page reloads

**Prerequisite:** Complete Test Scenario 1

**Steps:**
1. Open browser console: F12
2. Type: `localStorage.getItem('integralBodyPlanHistory')` → copy the value
3. Note the feedback entries (should show 7 days)
4. Reload page: F5
5. Navigate back to Body Tools / Integral Body Architect
6. Verify HANDOFF step appears with previous feedback
7. Open DevTools and check localStorage again
8. Type: `localStorage.getItem('planProgressByDay')` → verify data structure

**Expected Results:**
- ✓ Feedback is identical before and after reload
- ✓ Compliance metrics calculate correctly in PlanHandoffReview
- ✓ No data loss or corruption

---

## Test Scenario 3: Tracker Sync

**Objective:** Verify that completed yin practices sync with global tracker

**Prerequisite:** Complete Test Scenario 1 with feedback

**Steps:**
1. In HANDOFF, review the feedback summary
2. Note the yin practice compliance percentage
3. Open browser DevTools → Application → Local Storage
4. Check `completionHistory` entry
5. For each yin practice marked complete, verify:
   - Key exists: practice name
   - Value contains date from feedback (e.g., "2024-11-09")
6. Navigate to Tracker tab
7. Review completion history for the day

**Expected Results:**
- ✓ Each completed yin practice appears in `completionHistory`
- ✓ Dates match the feedback submission date
- ✓ No duplicate entries for same practice on same date
- ✓ Tracker tab shows completed practices with checkmarks

---

## Test Scenario 4: Compliance Visualization

**Objective:** Verify compliance bars and metrics display correctly

**Prerequisite:** Complete Test Scenario 1

**Steps:**
1. In HANDOFF step, observe compliance visualization
2. Looking at feedback data:
   - Days with all practices completed: should show ≥80%
   - Days with 50% practices completed: should show ~50-60%
   - Days with no practices: should show <40%
3. Verify color coding:
   - ≥80% = Green
   - 60-79% = Teal
   - 40-59% = Amber
   - <40% = Red
4. Check that average intensity and energy display numbers 1-10

**Expected Results:**
- ✓ Compliance bars accurately reflect logged feedback
- ✓ Color coding matches percentage ranges
- ✓ Average metrics calculate correctly (sum/count)
- ✓ "No feedback logged yet" message only shows if no feedback submitted

---

## Test Scenario 5: Personalization Integration

**Objective:** Verify personalization insights display in handoff

**Steps:**
1. Complete Test Scenario 1 with varied feedback (some high compliance, some low)
2. Save the plan and note the plan ID (visible in localStorage)
3. Complete at least one more plan (to have 2+ plans in history)
4. For second plan, complete similar feedback
5. Open third plan in Integral Body Architect
6. When wizard opens, check console for log:
   - `console.log('📊 Personalization Analysis:', ...)`
   - Should show planCount, analysisPeriodDays, compliance metrics
7. In HANDOFF, verify "Personalization Insights" section shows:
   - Recommendations (adjustment directives)
   - Common blockers from feedback
   - Recommended intensity level
   - Recommended yin duration

**Expected Results:**
- ✓ Personalization analysis logs to console
- ✓ Insights render in PlanHandoffReview
- ✓ Recommendations are relevant to feedback patterns
- ✓ No errors if fewer than 2 plans exist

---

## Test Scenario 6: Edge Cases - No Feedback

**Objective:** Verify graceful handling when no feedback logged

**Steps:**
1. Complete BLUEPRINT and SYNTHESIS steps
2. In DELIVERY, click "Save & Continue" without submitting any feedback
3. Observe HANDOFF step

**Expected Results:**
- ✓ No errors in console
- ✓ Shows message: "No feedback logged yet"
- ✓ "Review Feedback" button still available and clickable
- ✓ "Mark Complete" button still available

---

## Test Scenario 7: Edge Cases - Partial Feedback

**Objective:** Verify handling of incomplete feedback submission

**Steps:**
1. Open PlanFeedbackModal
2. For Day 1: Set only intensity (skip workout, yin practices, blockers, notes)
3. Click "Save & Next"
4. For Day 2-7: Leave all fields at defaults
5. Complete feedback

**Expected Results:**
- ✓ No validation errors
- ✓ All days record feedback with default values
- ✓ Compliance calculates with zeros where appropriate
- ✓ Feedback persists in localStorage

---

## Test Scenario 8: Quick Actions (if integrated in delivery)

**Objective:** Verify QuickDayActions component works

**Steps:**
1. In DELIVERY step (if QuickDayActions added to DayCard):
2. Click "Complete" button on a day card
   - Should mark that day as complete
3. Click "Flag" button on another day card
   - Should open inline input
   - Type: "low energy"
   - Press Enter
   - Should close and save

**Expected Results:**
- ✓ Quick actions update feedback data
- ✓ "Complete" button toggles state visually
- ✓ "Flag" input accepts text and keyboard shortcuts
- ✓ Changes persist when navigating away

---

## Test Scenario 9: Multiple Plans

**Objective:** Verify feedback collection works across multiple plans

**Steps:**
1. Create Plan A with feedback (Test Scenario 1)
2. Create Plan B with different feedback:
   - Higher compliance
   - Different blockers
   - Different energy levels
3. Create Plan C (partially complete feedback)
4. Check localStorage:
   - `integralBodyPlanHistory` should have 3 entries
   - `planProgressByDay` should have 3 top-level keys
5. Verify each plan's data is separate and correct

**Expected Results:**
- ✓ Each plan has independent feedback
- ✓ No data leakage between plans
- ✓ Personalization uses all plans' history
- ✓ Plan-specific endpoints work correctly

---

## Browser Console Commands for Testing

```javascript
// View all plan history
JSON.stringify(JSON.parse(localStorage.getItem('integralBodyPlanHistory')), null, 2)

// View all plan progress
JSON.stringify(JSON.parse(localStorage.getItem('planProgressByDay')), null, 2)

// View completion history
JSON.stringify(JSON.parse(localStorage.getItem('completionHistory')), null, 2)

// Check current personalization summary (if logged)
// Look for console message: "📊 Personalization Analysis:"

// Clear all data to start fresh
localStorage.clear()
```

---

## Expected localStorage Structure After Test

```json
{
  "integralBodyPlanHistory": [
    {
      "planId": "plan-uuid-1",
      "planDate": "2024-11-09",
      "weekStartDate": "2024-11-04",
      "goalStatement": "Build strength...",
      "startedAt": "2024-11-09T10:30:00Z",
      "dailyFeedback": [
        {
          "date": "2024-11-04",
          "dayName": "Monday",
          "completedWorkout": true,
          "completedYinPractices": ["Qigong"],
          "intensityFelt": 7,
          "energyLevel": 6,
          "blockers": "Felt tired in morning",
          "notes": "",
          "timestamp": "2024-11-09T10:35:00Z"
        }
        // ... 6 more days
      ],
      "aggregateMetrics": {
        "workoutComplianceRate": 100,
        "yinComplianceRate": 85.7,
        "averageIntensity": 6.7,
        "averageEnergy": 6.3,
        "totalBlockerDays": 3
      },
      "status": "completed",
      "completedAt": "2024-11-09T11:00:00Z"
    }
  ],
  "planProgressByDay": {
    "plan-uuid-1": {
      "2024-11-04": { /* daily feedback for Monday */ },
      "2024-11-05": { /* daily feedback for Tuesday */ }
      // ... through Sunday
    }
  },
  "completionHistory": {
    "Qigong": ["2024-11-04", "2024-11-05", "2024-11-06"],
    "Breathing Meditation": ["2024-11-04", "2024-11-07"]
  }
}
```

---

## Known Limitations

1. **Dates based on browser time**: Feedback dates calculated from browser local time. UTC conversion may be needed for multi-timezone teams.

2. **No offline sync**: Changes made offline will be local-only. Implement service worker for true offline support.

3. **Browser storage limits**: localStorage has ~5-10MB limit. Very large history may hit quota. Implement archival strategy for old plans.

4. **No server-side persistence**: All data is client-side only. Implement backend sync for multi-device support.

---

## Sign-off Checklist

- [ ] All 9 test scenarios passed
- [ ] No console errors
- [ ] Build completes successfully
- [ ] localStorage data structure matches expectations
- [ ] TypeScript builds without new errors
- [ ] Modal/component rendering is smooth (no lag)
- [ ] Cross-browser tested (Chrome, Firefox, Safari)
- [ ] Mobile responsive (tested on 375px width)
- [ ] Accessibility: Tab navigation works, labels present
