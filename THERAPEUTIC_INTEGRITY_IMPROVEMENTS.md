# Therapeutic Integrity & Agency: Technical Improvements

**Scope:** Three focused improvements to shift from prescriptive diagnosis to facilitative inquiry, grounded in therapeutic best practices (IFS, Shadow Work, Polarity Mapping).

**Constraint:** LocalStorage-only persistence (no backend database required).

**Impact:** Transforms the Intelligence Hub from "confident pattern-matcher" to "transparent, facilitative guide."

---

## Overview: The Core Problem

The app currently outputs **prescriptive statements**:

```
Primary Focus: "Your growth edge lies in integrating vulnerability and
authentic expression, especially given the recurring pattern of playful
rebellion masking deeper work."
```

**Therapeutic issue:** This short-circuits the user's own discovery process. In IFS, Polarity Mapping, and Shadow Work, the therapeutic value comes from the user *naming* their own patterns, not from the guide declaring them.

**User impact:** The user becomes dependent on the AI's interpretation rather than developing self-authorship.

---

## Improvement 1: Facilitative Prompt Architecture

### The Change

**From (Prescriptive):**
```
"Your core pattern is: playful rebellion masking vulnerability."
```

**To (Facilitative):**
```
"I notice a pattern: high engagement with intellectual humor, but low
engagement with vulnerability work. Does that match your experience?
What's true about the tension between these two?"
```

### Implementation

**File to modify:** `services/intelligenceHub.ts` (lines 82-278)

#### Step 1: Add New Insight Type to `types.ts`

```typescript
export type InsightMode = 'facilitative' | 'prescriptive';

export interface IntelligentGuidance {
  // ... existing fields ...

  // NEW FIELD
  mode: InsightMode; // Controls whether output is a question or statement

  // NEW FIELD - For facilitative mode only
  facilitativePrompt?: string; // The guiding question instead of primary focus
}
```

#### Step 2: Update Synthesis Prompt Template

**File:** `services/intelligenceHub.ts` (lines 82-278)

**Current prompt structure (lines 91-107):**
```
You are an expert Integral Life Practice intelligence system...

## RESPONSE FORMAT

1. `## Where You Are` - 2-3 sentences MAX
2. `## Primary Focus` - 1-2 sentences identifying growth edge
3. `## Recommended Next Steps` - JSON code block
4. `## How It All Connects` - Subsections with patterns
5. `## Cautions` - Predictive warnings
```

**New prompt structure:**

Replace with:

```
You are a facilitative guide in integral developmental psychology.
Your role is to ASK rather than TELL.

## CORE INSTRUCTION

For every insight, ask a clarifying question that invites the user's
own discovery, rather than declaring a pattern.

## RESPONSE FORMAT

1. `## Where You Are` - 2-3 sentences (factual: what you did)
2. `## Pattern I Notice` - A tension or duality (not a verdict)
3. `## Question for You` - An open-ended inquiry (NOT a statement)
4. `## Recommended Next Steps` - Practices to explore (not prescribe)
5. `## How It All Connects` - Subsections with patterns (exploratory)

## EXAMPLES

NO (Prescriptive - Don't do this):
"Your growth edge is integrating vulnerability. You use humor as a
defense against deeper work."

YES (Facilitative - Do this):
"I notice you engage deeply with reflection practices (Big Mind, IFS)
but often shift to humor or intellectual analysis when the conversation
gets personal. What happens at that moment? Does that pattern feel true?"

## WRITING RULES

- Use "I notice..." instead of "You are..."
- End core insights with "?" not "."
- Ask "Which of these resonates?" instead of "This is your pattern."
- Invite doubt: "I could be wrong about this..."
- Prioritize user's naming over AI's interpretation
```

#### Step 3: Add Logic to Gate Prescriptive Output

**File:** `services/intelligenceHub.ts` (new section after line 76)

```typescript
/**
 * Rate-limit prescriptive synthesis
 * Only allow one strong declarative "Primary Focus" per 24 hours
 * Subsequent requests return facilitative prompts
 */
function shouldUseFacilitativeMode(
  context: IntelligenceContext,
  userProfile?: UserProfile
): boolean {
  const lastPrescriptiveTime = localStorage.getItem(
    'lastPrescriptiveSynthesisTime'
  );

  if (!lastPrescriptiveTime) {
    return false; // First time: use prescriptive
  }

  const hoursSinceLast =
    (Date.now() - parseInt(lastPrescriptiveTime)) / (1000 * 60 * 60);

  // After 24 hours, allow prescriptive again
  if (hoursSinceLast > 24) {
    return false;
  }

  // Within 24 hours: use facilitative instead
  return true;
}

/**
 * Track when prescriptive synthesis was last used
 */
function recordPrescriptiveSynthesis(): void {
  localStorage.setItem(
    'lastPrescriptiveSynthesisTime',
    Date.now().toString()
  );
}
```

#### Step 4: Update Synthesis Logic

**File:** `services/intelligenceHub.ts` (modify `generateGuidance()` function, around line 42)

```typescript
async function generateGuidance(
  context: IntelligenceContext,
  userProfile?: UserProfile
): Promise<IntelligentGuidance> {
  const systemPrompt = buildSystemPrompt();

  // NEW: Determine if we should use facilitative mode
  const useFacilitativeMode = shouldUseFacilitativeMode(context, userProfile);

  const userPrompt = buildUserPrompt(
    context,
    userProfile,
    useFacilitativeMode // Pass mode to prompt builder
  );

  try {
    const messages = buildMessagesWithSystem(systemPrompt, [
      { role: 'user', content: userPrompt }
    ]);

    const response = await generateOpenRouterResponse(messages, undefined, {
      model: 'x-ai/grok-4-fast',
      maxTokens: 2000,
      temperature: 0.3,
    });

    if (!response.success || !response.text) {
      throw new Error('Failed to generate guidance');
    }

    const parsed = parseGuidanceResponse(response.text);

    // NEW: Record if prescriptive
    if (!useFacilitativeMode) {
      recordPrescriptiveSynthesis();
    }

    return {
      ...parsed,
      mode: useFacilitativeMode ? 'facilitative' : 'prescriptive',
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[IntelligenceHub] Error generating guidance:', error);
    throw error;
  }
}
```

#### Step 5: Update UI to Render Facilitative Questions

**File:** `components/IntelligenceHubDisplay.tsx`

```typescript
export function IntelligenceHubDisplay({ guidance }: Props) {
  return (
    <div className="intelligence-hub">
      <div className="where-you-are">
        <h3>Where You Are</h3>
        <p>{guidance.synthesis}</p>
      </div>

      {/* NEW: Render based on mode */}
      {guidance.mode === 'prescriptive' ? (
        <div className="primary-focus prescriptive">
          <h3>Primary Focus</h3>
          <p>{guidance.primaryFocus}</p>
          <p className="note">
            (Next update will explore this more fully)
          </p>
        </div>
      ) : (
        <div className="facilitative-prompt facilitative">
          <h3>Pattern I Notice</h3>
          <p>{guidance.facilitativePrompt}</p>
          <p className="note">
            (What resonates with you?)
          </p>
        </div>
      )}

      {/* Rest of the display... */}
    </div>
  );
}
```

### Therapeutic Rationale

**IFS Principle:** In Internal Family Systems, the therapist doesn't name the user's parts; the user does. The guide asks questions that help the user access their own wisdom.

**Polarity Mapping Principle:** The facilitator doesn't resolve the polarity; they help the user hold both sides and find synthesis.

**Shadow Work Principle:** The client's own words and metaphors are more powerful than the guide's interpretations.

### Effort: 4-6 hours
### Impact: HIGH - Fundamental shift in therapeutic approach

---

## Improvement 2: User Lexicon & Terminology Respect

### The Change

**Current behavior:** App assigns names ("cattie/doggie," "rebel hacker")

**New behavior:** App learns and uses user-generated names

### Implementation

#### Step 1: Add User Lexicon Structure to LocalStorage

**File:** `services/storage.ts` (new file or extend existing)

```typescript
export interface UserLexicon {
  id: string; // UUID
  term: string; // User-defined name (e.g., "rebel voice")
  context: string; // Where it came from (e.g., "Big Mind session")
  createdAt: string;
  relatedInsightIds: string[]; // Insights that reference this term
  frequency: number; // How many times it's been mentioned
}

export function initializeLexicon(): void {
  const existing = localStorage.getItem('userLexicon');
  if (!existing) {
    localStorage.setItem('userLexicon', JSON.stringify([]));
  }
}

export function addTermToLexicon(
  term: string,
  context: string
): UserLexicon {
  const lexicon: UserLexicon[] = JSON.parse(
    localStorage.getItem('userLexicon') || '[]'
  );

  // Check if term already exists
  const existing = lexicon.find(
    item => item.term.toLowerCase() === term.toLowerCase()
  );

  if (existing) {
    existing.frequency += 1;
    existing.relatedInsightIds.push(`insight-${Date.now()}`);
  } else {
    const newTerm: UserLexicon = {
      id: `term-${Date.now()}`,
      term,
      context,
      createdAt: new Date().toISOString(),
      relatedInsightIds: [`insight-${Date.now()}`],
      frequency: 1,
    };
    lexicon.push(newTerm);
  }

  localStorage.setItem('userLexicon', JSON.stringify(lexicon));
  return existing || (lexicon[lexicon.length - 1] as UserLexicon);
}

export function getLexicon(): UserLexicon[] {
  return JSON.parse(localStorage.getItem('userLexicon') || '[]');
}

export function getLexiconAsText(): string {
  const lexicon = getLexicon();
  return lexicon.map(item => `${item.term} (${item.context})`).join(', ');
}
```

#### Step 2: Capture User-Generated Terminology

**File:** `components/WizardSession.tsx` (add prompt after session completion)

```typescript
export function WizardCompletionPrompt({ wizardType, sessionData }: Props) {
  const [userTerm, setUserTerm] = useState('');

  const handleSaveWithTerm = async () => {
    if (userTerm.trim()) {
      // Save term to lexicon
      addTermToLexicon(userTerm, `${wizardType} session`);
    }

    // Continue with normal save
    onSave(sessionData);
  };

  return (
    <div className="completion-prompt">
      <h4>Give This a Name</h4>
      <p>
        What would you call this voice, pattern, or perspective?
        (e.g., "the truth-teller," "my protector," "the rebel")
      </p>
      <input
        type="text"
        value={userTerm}
        onChange={e => setUserTerm(e.target.value)}
        placeholder="e.g., 'the rebel voice'"
      />
      <button onClick={handleSaveWithTerm}>Save & Continue</button>
    </div>
  );
}
```

#### Step 3: Inject Lexicon into Synthesis Prompt

**File:** `services/intelligenceHub.ts` (modify `buildUserPrompt()`)

```typescript
function buildUserPrompt(
  context: IntelligenceContext,
  userProfile?: UserProfile,
  useFacilitativeMode?: boolean
): string {
  const lexicon = getLexicon(); // NEW
  const lexiconText = lexicon.length > 0
    ? `\n\nThe user has named these patterns/voices: ${lexicon.map(l => `"${l.term}"`).join(', ')}.
       Use these terms whenever relevant instead of generic names.`
    : '';

  const userPrompt = `
[Existing context...]

${lexiconText}

[Rest of prompt...]
  `;

  return userPrompt;
}
```

#### Step 4: Display User Terms in UI

**File:** `components/IntelligenceHubDisplay.tsx`

```typescript
export function LexiconReference() {
  const lexicon = getLexicon();

  if (lexicon.length === 0) return null;

  return (
    <div className="lexicon-reference">
      <h4>Your Terminology</h4>
      <ul>
        {lexicon.map(term => (
          <li key={term.id}>
            <strong>{term.term}</strong> ({term.context}) –
            {term.frequency} time{term.frequency > 1 ? 's' : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Therapeutic Rationale

**Self-Authorship:** When users name their own parts and patterns, they develop agency and ownership.

**Continuity:** Using consistent user-generated language creates coherence across sessions and deepens the sense of being "seen."

**Empowerment:** The user's vocabulary is prioritized over the AI's interpretations.

### Effort: 3-4 hours
### Impact: MEDIUM - Improves personalization and user agency

---

## Improvement 3: Source Quote Auditability

### The Change

**Current:** Insights appear without reference to their source
**New:** Every insight includes a quoted snippet from the raw user input

### Implementation

#### Step 1: Update Insight Type

**File:** `types.ts`

```typescript
export interface IntegratedInsight {
  // ... existing fields ...

  // NEW FIELDS
  sourceQuote?: string; // Direct quote from raw input
  sourceId?: string; // Which journal entry, practice note, or session
  confidence?: number; // AI's confidence (if available)
}
```

#### Step 2: Update Synthesis Prompt

**File:** `services/intelligenceHub.ts` (lines 82-278)

**Add to prompt instructions:**

```
## CRITICAL: ALWAYS INCLUDE SOURCE QUOTES

For every insight you generate, identify and include a short, relevant
quote from the user's raw input that supports your analysis.

Format:
- Insight: [Your analysis in 1-2 sentences]
- Source Quote: "[Exact text from user's journal/session]"

Example:
- Insight: I notice a pattern of intellectual humor emerging when vulnerability is mentioned.
- Source Quote: "I tend to make jokes whenever things get personal—it's my default move."

This allows the user to verify your reasoning and decide if they agree.
```

#### Step 3: Parse Quotes from Response

**File:** `services/intelligenceHub.ts` (modify `parseGuidanceResponse()`)

```typescript
function parseGuidanceResponse(text: string): IntelligentGuidance {
  // Extract sections from markdown response
  // NEW: Also extract source quotes

  const parseInsightWithQuote = (insightText: string) => {
    const quoteMatch = insightText.match(
      /Source Quote:\s*"([^"]+)"/
    );

    return {
      insight: insightText.split('Source Quote:')[0].trim(),
      sourceQuote: quoteMatch ? quoteMatch[1] : undefined,
    };
  };

  // ... rest of parsing logic ...
}
```

#### Step 4: Display Source Quotes in UI

**File:** `components/InsightCard.tsx`

```typescript
export function InsightCard({ insight }: Props) {
  return (
    <div className="insight-card">
      <div className="insight-content">
        <h4>{insight.detectedPattern}</h4>
        <p>{insight.description}</p>

        {/* NEW: Display source quote */}
        {insight.sourceQuote && (
          <div className="source-quote">
            <p className="quote-label">Based on:</p>
            <blockquote className="quote-text">
              "{insight.sourceQuote}"
            </blockquote>
            {insight.sourceId && (
              <p className="quote-source">
                From: {insight.sourceId}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

#### Step 5: Add CSS Styling

```css
.source-quote {
  margin-top: 16px;
  padding: 12px;
  background-color: #f5f5f5;
  border-left: 3px solid #4a90e2;
  border-radius: 4px;
  font-size: 0.9em;
  color: #555;
}

.quote-label {
  font-weight: 600;
  font-size: 0.85em;
  color: #777;
  margin-bottom: 4px;
}

.quote-text {
  font-style: italic;
  margin: 8px 0;
  padding-left: 12px;
  border-left: 2px solid #ddd;
  color: #333;
}

.quote-source {
  font-size: 0.8em;
  color: #999;
  margin-top: 4px;
}
```

### Therapeutic Rationale

**Verification:** Users can immediately check if the AI's interpretation aligns with what they actually said.

**Transparency:** Removes the "black box" feeling by showing the exact evidence used.

**Correction:** When a user disagrees, they can point to the specific quote and explain why the interpretation doesn't fit.

### Effort: 2-3 hours
### Impact: HIGH - Dramatically increases user trust and transparency

---

## Implementation Roadmap

### Phase 1 (Week 1): Foundation
- [ ] Implement facilitative prompt architecture (4-6 hours)
- [ ] Add source quote parsing and display (2-3 hours)
- **Total: 6-9 hours**
- **Impact: HIGH** - Addresses core transparency and facilitation issues

### Phase 2 (Week 2): User Agency
- [ ] Build user lexicon service (2 hours)
- [ ] Add terminology capture flow (1-2 hours)
- [ ] Integrate lexicon into synthesis (1 hour)
- **Total: 4-5 hours**
- **Impact: MEDIUM** - Improves personalization

### Phase 3 (Week 3): Testing & Polish
- [ ] Unit tests for all new services
- [ ] UI/UX testing with real users
- [ ] Documentation updates
- **Total: 3-4 hours**

**Total Implementation: 13-18 hours**

---

## Success Criteria

### After Phase 1
- ✅ First insight uses facilitative question, not prescriptive statement
- ✅ Every insight includes a source quote
- ✅ User sees exactly which text generated each insight
- ✅ Transparency modal allows user to verify reasoning

### After Phase 2
- ✅ User can name patterns in wizard completions
- ✅ Named terms appear in subsequent synthesis
- ✅ Lexicon visible in recommendations
- ✅ User feels recognized and understood

### After Phase 3
- ✅ All three improvements integrated and tested
- ✅ UX feels facilitative, not prescriptive
- ✅ Users report higher trust in insights
- ✅ Fewer instances of users disagreeing with analysis

---

## Addressing the Stress Test

These three improvements directly mitigate the risks revealed by the "HAIL PLINY" stress test:

| Stress Test Finding | How This Addresses It |
|---|---|
| App generated coherent psychology from nonsense | Source quotes show the actual evidence used; user can judge quality |
| Recommendations sounded authoritative without grounding | Facilitative mode asks questions, not declares answers |
| User had no input into naming/framing | User lexicon captures user-generated terminology |
| System appeared to have superior insight | Shifts to "I notice..." and "What's true for you?" language |
| Prescriptive approach misapplies IFS/Shadow Work | Facilitative prompt explicitly follows therapeutic best practices |

---

## LocalStorage Implementation Note

All three improvements use **only LocalStorage**:

1. **Facilitative prompt**: Rate-limit stored in `lastPrescriptiveSynthesisTime`
2. **User lexicon**: Full lexicon stored in `userLexicon` key
3. **Source quotes**: Parsed from API response, cached in insight objects

**No external database required.** This can be deployed immediately without infrastructure changes.

---

## Conclusion

These three focused improvements transform the app from **"confident pattern-matcher"** to **"transparent, facilitative guide."** They're therapeutically grounded, user-centric, and implementable within the LocalStorage constraint.

**Recommended approach:** Implement Phase 1 (6-9 hours) first. This delivers the highest therapeutic value with minimal effort.

