# Plan Synthesis Upgrade - Manual QA Documentation

## Overview
This document describes manual QA procedures for verifying the upgraded Integral Body Architect weekly plan synthesis, which now includes:
- **Enhanced prompt** with historical compliance context and constraint details
- **Client-side post-processing** for synergy scoring and constraint validation
- **Structured synergy metadata** in plan output
- **Hard constraint enforcement** for unavailable days/times and injury restrictions

---

## Key Features to Verify

### 1. Enhanced Prompt & Constraint Handling

#### 1.1 Unavailable Days Constraint
**Setup:**
- Open Integral Body Architect wizard
- In BLUEPRINT step, select multiple "Unavailable Days" (e.g., Saturday, Sunday)
- Fill in other fields and generate plan

**Expected Behavior:**
- Plan should NOT schedule workouts on marked unavailable days
- All workouts should be placed on available days with proper rest spacing

**Verification Steps:**
1. Check each day in DELIVERY view
2. Verify no "Workout" appears on unavailable days
3. Confirm workout scheduling respects constraints

**Pass Criteria:**
- ✓ No workouts on unavailable days
- ✓ Workouts placed Monday-Friday with ~2 day spacing
- ✓ Plan summary acknowledges constraint

---

#### 1.2 Injury Restrictions
**Setup:**
- Use the wizard with the advanced schema (if UI is updated to support it)
- Set `injuryRestrictions` in YangConstraints:
  ```
  {
    bodyPart: "shoulder",
    severity: "moderate",
    restrictions: ["no overhead pressing", "limit lateral movement"]
  }
  ```

**Expected Behavior:**
- Prompt explicitly mentions injury restrictions
- Generated plan avoids restricted movements
- LLM provides alternatives (e.g., incline press instead of overhead press)

**Verification Steps:**
1. Review exercises in generated plan
2. Check that shoulder-intensive exercises are avoided
3. Verify workout notes mention adaptation

**Pass Criteria:**
- ✓ No overhead pressing exercises for shoulder injury
- ✓ Alternatives provided (incline press, machine press, etc.)
- ✓ Synthesis metadata documents injury adaptation

---

#### 1.3 Available Time Windows
**Setup:**
- Set `availableTimeWindows` in YangConstraints:
  ```
  [
    { dayOfWeek: "Monday", startHour: 6, endHour: 8 },
    { dayOfWeek: "Wednesday", startHour: 17, endHour: 19 }
  ]
  ```

**Expected Behavior:**
- Workouts scheduled within specified time windows
- Yin practices placed in available slots
- Plan respects all time constraints

**Verification Steps:**
1. Check workout timing in plan
2. Verify practices fit within time windows
3. Look for conflict resolution notes in metadata

**Pass Criteria:**
- ✓ Workouts only in specified hours
- ✓ No practices outside available windows
- ✓ Metadata documents any time window accommodations

---

### 2. Synergy Metadata Population

#### 2.1 Yang/Yin Pairing Annotations
**What to Look For in DELIVERY Step:**

Each day should show synergy explanation. In the expanded day view, look for:

**Example - Monday (Intense Workout Day):**
```
yangYinBalance: "High intensity upper body (Bench Press 4x8) balanced with 
                 evening Coherent Breathing to activate parasympathetic 
                 nervous system and support recovery"
```

**Verification Checklist:**
- [ ] Monday/Wednesday (workout days) have explicit balance explanation
- [ ] Tuesday/Thursday (rest days) mention recovery focus
- [ ] Evening practices follow workout days with calming emphasis
- [ ] Morning practices before workouts mention preparation

**What the Explanation Should Cover:**
- Yang intensity level
- Yin practice rationale
- How they balance each other
- Expected nervous system effect

---

#### 2.2 Rest Spacing Annotations
**What to Look For:**

Days should include notes about recovery spacing:

**Example - Tuesday:**
```
restSpacingNotes: "Full rest day with only light somatic practice. 
                   2 day gap from Monday intense session allows CNS recovery 
                   before Wednesday lower body work"
```

**Verification Checklist:**
- [ ] Rest days explicitly mentioned with spacing rationale
- [ ] Notes explain why spacing is optimal
- [ ] Reference to surrounding workout days
- [ ] Recovery focus clearly communicated

---

#### 2.3 Scheduling Confidence Scores
**What to Look For:**

Each Yin practice should have a confidence score (0-100).

**Example Practice:**
```
{
  name: "Evening Coherent Breathing",
  ...
  schedulingConfidence: 95
}
```

**Verification Checklist:**
- [ ] Each Yin practice has a confidence score
- [ ] Scores range from 0-100
- [ ] Higher confidence for well-supported placements (e.g., evening practices)
- [ ] Lower confidence for less ideal placements (if any)
- [ ] Scores align with practice synergy with workout

---

### 3. Synergy Scoring System

#### 3.1 Overall Synergy Scores
**Location:** In plan.synthesisMetadata

**Metrics to Check:**
```
synergyScoring: {
  yangYinPairingScore: 88,      // How well practices complement each other
  restSpacingScore: 85,         // How well rest is distributed
  overallIntegrationScore: 87   // Overall week coherence
}
```

**Interpretation Guide:**
- **90+**: Excellent integration, practices highly synergistic
- **75-89**: Good integration, practices well-balanced
- **60-74**: Acceptable, some trade-offs made
- **<60**: Poor integration, significant compromises

**Verification Steps:**
1. Generate multiple plans with different constraints
2. Compare synergy scores
3. Verify scores reflect actual plan quality
4. Scores should be consistent with visual inspection

**Example Observations:**
- Plans with injury restrictions should show slightly lower pairing scores
- Plans with fewer constraints should score higher
- Well-spaced workouts should show high rest spacing scores

---

#### 3.2 Scheduling Confidence Ratings
**Location:** Each practice in yinPractices array

**Confidence Factors:**
- ✓ Practices scheduled at ideal times get 90+ confidence
- ✓ Practices supporting workout recovery get high confidence
- ✓ Practices in non-optimal slots get moderate confidence
- ✓ Emergency/fallback practices get lower confidence

**Verification Example:**

Morning Qigong before workout: **92 confidence**
- Ideal timing to prepare nervous system
- Direct support for workout

Evening Coherent Breathing after intense workout: **95 confidence**
- Perfect timing for parasympathetic activation
- Explicitly designed for recovery

Mid-afternoon practice with limited clear purpose: **72 confidence**
- Useful but less critical timing
- Could shift if needed

---

### 4. Constraint Conflict Resolution

#### 4.1 Constraint Conflict Documentation
**Location:** In plan.synthesisMetadata.constraintConflicts

**What Should Appear:**

```
constraintConflicts: [
  {
    type: "unavailable-window",
    description: "Saturday marked unavailable",
    resolution: "No workouts scheduled for Saturday as requested"
  },
  {
    type: "injury-restriction",
    description: "Shoulder restriction: no overhead pressing",
    resolution: "Substituted Overhead Press with Incline Dumbbell Press"
  }
]
```

**Verification Steps:**
1. Review each conflict entry
2. Verify it's a real conflict from constraints
3. Check resolution is reasonable
4. Ensure resolution is actually implemented in plan

**Quality Checks:**
- [ ] Conflicts are accurate and relevant
- [ ] Resolutions are practical and implementable
- [ ] No conflicts are missed
- [ ] Resolutions support user goals

---

#### 4.2 Fallback Options
**Location:** In plan.synthesisMetadata.fallbackOptions

**What Should Appear:**

```
fallbackOptions: [
  "Move Tuesday workout to Thursday if schedule changes",
  "Substitute morning Qigong for evening if time unavailable",
  "Replace heavy deadlifts with trap bar if lower back pain flares"
]
```

**Verification Checklist:**
- [ ] 2-4 fallback options provided
- [ ] Options are practical and realistic
- [ ] Cover different types of constraints (schedule, injury, equipment)
- [ ] Maintain plan integrity if executed

**Use Case:**
- User can manually swap workouts if urgent schedule conflict
- Practices can move to fallback times if primary time unavailable
- Exercises can be substituted if injury flares

---

### 5. Historical Context Integration

#### 5.1 Compliance History Influence
**Setup (requires backend integration from Ticket 2):**
- If historical compliance data available, pass it to generateIntegralWeeklyPlan
- Compliance history includes:
  - Average workout compliance %
  - Average Yin practice compliance %
  - Common blockers (e.g., "fatigue on Wednesdays")
  - Best performing patterns (e.g., "Tuesday workouts succeed 90%")

**Expected Behavior:**
- Plan should emphasize strong historical patterns
- Should adjust for known blockers
- Should account for user's actual compliance, not theoretical ideal

**Verification Steps:**
1. Compare plans with and without historical context
2. Verify adjustments make sense for user profile
3. Check that high-compliance patterns are prioritized

**Example:**
- If user historically skips Wednesday workouts (73% compliance)
- New plan should reduce Wednesday intensity or move to Tuesday
- Metadata should note this adaptation

---

#### 5.2 Prompt Incorporation
**What to Verify:**

When historical context is available:
1. Check prompt includes compliance data summary
2. Verify LLM instructions to adapt for known blockers
3. Confirm synthesisMetadata acknowledges historical context
4. Plan should feel personalized to user's actual patterns

---

### 6. Visual Verification Checklist

#### In DELIVERY Step, Verify For Each Day:

**Monday (Typical Workout Day):**
- [ ] Workout listed with specific exercises
- [ ] Yin practice in evening with synergy note
- [ ] High protein nutrition
- [ ] Sleep hygiene tips
- [ ] synergyMetadata explains Yang/Yin integration
- [ ] Practices have confidence scores

**Tuesday (Typical Rest Day):**
- [ ] No workout scheduled
- [ ] Light/recovery Yin practice
- [ ] Lower calorie nutrition
- [ ] restSpacingNotes present
- [ ] Explains recovery role

**Saturday (Constraint Example - If Marked Unavailable):**
- [ ] NO workout
- [ ] Light activity / social day if not fully unavailable
- [ ] Flexible nutrition
- [ ] Constraint resolution documented

---

## Test Scenarios

### Scenario 1: Basic Constraint Validation
**Input:**
- Goal: "Build strength while managing stress"
- Unavailable: Saturday, Sunday
- No other constraints

**Expected Output:**
- Workouts Mon-Fri only
- Proper spacing between workouts
- Weekend shows only Yin practices
- Metadata shows 0 conflicts

---

### Scenario 2: Injury-Aware Planning
**Input:**
- Goal: "Shoulder-friendly strength training"
- Shoulder injury: moderate severity
- Restrictions: "no overhead pressing"

**Expected Output:**
- No overhead press, military press, or lateral raises
- Substitute with incline press, machine press
- Metadata includes injury resolution note
- Confidence scores may be slightly lower due to exercise substitutions

---

### Scenario 3: Time-Window Constrained
**Input:**
- Goal: "Fit workouts around work schedule"
- Available windows: Mon/Wed 6-7am, Fri 5-7pm only
- Limited equipment: dumbbells only

**Expected Output:**
- Workouts fit within time windows
- Dumbbell exercises only
- May need to split or adjust volume
- Metadata documents time window accommodation
- Fallback options provided

---

### Scenario 4: Historical Context Adaptation
**Input:**
- Previous 4 plans analyzed
- Average workout compliance: 72%
- Average Yin compliance: 88%
- Common blocker: "Midweek fatigue"
- Best pattern: "Tuesday strength training"

**Expected Output:**
- Tuesday is primary workout day
- Lower intensity Wed/Thu
- More Yin practices Wed/Thu for energy/motivation
- Metadata acknowledges historical patterns
- Plan feels personalized to actual user performance

---

## Quality Metrics

### Synergy Quality
- ✓ Plan feels coherent and integrated
- ✓ Yang/Yin pairings make sense
- ✓ No arbitrary practice placements
- ✓ Recovery strategies evident

### Constraint Compliance
- ✓ Zero unavailable day violations
- ✓ Injury restrictions strictly honored
- ✓ Time windows respected
- ✓ Conflicts documented and resolved

### User Feasibility
- ✓ Plan is realistic for stated goals
- ✓ Workload is appropriate
- ✓ Yin practices feel integrated, not just "added"
- ✓ Fallback options exist for real-world adjustments

### Documentation Quality
- ✓ Synergy explanations are clear
- ✓ Confidence scores are justified
- ✓ Conflict resolutions are understandable
- ✓ Fallback options are practical

---

## Common Issues to Watch For

### Issue 1: Conflicting Constraints Not Detected
**What to Look For:**
- Plans that violate unavailable days despite input
- Exercises that conflict with injuries
- Scheduling outside time windows

**How to Report:**
- Document which constraint was violated
- Show where in plan the violation occurs
- Note if metadata correctly flagged it

### Issue 2: Weak Synergy Explanations
**What to Look For:**
- vague yangYinBalance descriptions
- Generic rest spacing notes
- No clear connection between practices

**How to Report:**
- Quote the weak description
- Explain what would make it better
- Suggest more specific rationale

### Issue 3: Incorrect Confidence Scores
**What to Look For:**
- High confidence (95+) for poorly-placed practices
- Low confidence (40-) for well-placed practices
- Inconsistent scoring across similar practices

**How to Report:**
- Compare scores for similar practice types
- Explain why score seems wrong
- Suggest more appropriate score

### Issue 4: Missing Fallback Options
**What to Look For:**
- Plans with significant constraints but no fallbacks
- Fallbacks that don't make sense
- Fallbacks that violate constraints if used

**How to Report:**
- Identify what fallbacks are needed
- Explain why current ones are inadequate
- Suggest specific practical fallbacks

---

## Sign-Off Checklist

- [ ] Basic plan generation works without errors
- [ ] All 7 days populate with appropriate content
- [ ] Synergy metadata present on every day
- [ ] Scheduling confidence scores assigned
- [ ] Synthesis metadata includes synergy scores
- [ ] Constraint conflicts detected and documented
- [ ] Fallback options provided
- [ ] Historical context influences plans when available
- [ ] Unavailable days respected
- [ ] Injury restrictions honored
- [ ] Time windows (if specified) respected
- [ ] Plans feel coherent and integrated
- [ ] Explanations are clear and specific
- [ ] Confidence scores seem justified
- [ ] No obvious errors or missing data

---

## Feedback Channel

When verifying features:
1. Test each constraint type independently
2. Combine constraints to verify interaction
3. Check metadata for accuracy
4. Verify UI displays all new fields properly
5. Confirm backward compatibility (plans without new fields still work)
6. Document any errors with specific examples

---

## Appendix: Type Definitions Reference

### New Constraint Types
- `TimeWindow`: { dayOfWeek: string, startHour: number, endHour: number }
- `InjuryRestriction`: { bodyPart: string, severity: 'mild'|'moderate'|'severe', restrictions: string[] }

### New Metadata Types
- `SynergyNote`: Type categorization of synergy reasons
- `SynergyMetadata`: Day-level synergy explanation
- `PlanSynthesisMetadata`: Week-level integration scores and conflict tracking
- `HistoricalComplianceSummary`: Aggregated compliance data from past plans

---

**Version**: 1.0  
**Date**: 2025-01-09  
**Feature Ticket**: Upgrade plan synthesis
