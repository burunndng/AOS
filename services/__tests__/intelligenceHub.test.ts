/**
 * Intelligence Hub Parser Tests
 * Validates the new Markdown + JSON format parsing
 */

// Mock response from Grok with new format
const mockGrokResponse = `## Where You Are

You have 6 practices in your stack: Meditation, IFS, Self-Compassion, Zone 2 Cardio, Gratitude, Breathwork. Completed 7/7 today [cite: completion data 2024-11-14]. I don't see any completed wizard sessions or developmental assessments yet.

## Primary Focus

Your broad foundation suggests readiness for diagnostic work. Start with Kegan Assessment to identify your growth edge.

## Recommended Next Steps

\`\`\`json
{
  "nextWizard": {
    "type": "kegan_assessment",
    "name": "Kegan Developmental Assessment",
    "reason": "No developmental data exists; this establishes baseline",
    "focus": "Identify your subject-object structure",
    "priority": "high",
    "confidence": 0.88,
    "evidence": ["[No assessments in profile]"],
    "timing": "this_week"
  },
  "practiceChanges": {
    "add": [],
    "remove": [],
    "modify": []
  },
  "insightWork": {
    "pattern": "No pending patterns yet",
    "approachSuggestion": "Complete diagnostic wizard first"
  },
  "stackBalance": {
    "body": "33%",
    "mind": "50%",
    "spirit": "17%",
    "shadow": "0%"
  }
}
\`\`\`

## How It All Connects

### What I Noticed:
- Strong practice consistency (7/7 completion)
- No shadow work in stack despite IFS practice
- Gap: diagnostic data missing
- Balanced Body/Mind modules

### Connections:
- IFS work benefits from knowing developmental stage
- Shadow gap limits integration of Mind practices
- Kegan assessment will reveal growth edge for targeted practice selection

## Cautions

⚠️ **Edge Avoidance via Practice Stacking**
*Evidence:* 7/7 practice completion but 0 wizard sessions [cite: session count]
*Risk:* You might feel "too busy" to start Kegan Assessment
*Signal:* You add another practice instead of doing the wizard this week
*Response:* Pause Breathwork (newest addition) to make space for wizard work
`;

describe('Intelligence Hub Parser', () => {
  test('should extract markdown sections correctly', () => {
    // Test section extraction
    const whereYouAreRegex = /## Where You Are\s*\n([\s\S]*?)(?=\n##|$)/i;
    const match = mockGrokResponse.match(whereYouAreRegex);

    expect(match).toBeTruthy();
    expect(match![1]).toContain('6 practices');
    expect(match![1]).toContain('Completed 7/7');
  });

  test('should extract JSON block correctly', () => {
    const jsonMatch = mockGrokResponse.match(/```json\s*([\s\S]*?)\s*```/);

    expect(jsonMatch).toBeTruthy();

    const parsed = JSON.parse(jsonMatch![1]);

    expect(parsed.nextWizard.type).toBe('kegan_assessment');
    expect(parsed.nextWizard.confidence).toBe(0.88);
    expect(parsed.nextWizard.priority).toBe('high');
    expect(parsed.stackBalance.shadow).toBe('0%');
  });

  test('should extract list items from subsections', () => {
    const connectionsRegex = /### Connections:\s*\n([\s\S]*?)(?=\n##|$)/i;
    const match = mockGrokResponse.match(connectionsRegex);

    expect(match).toBeTruthy();

    const items = match![1]
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^-\s*/, '').trim());

    expect(items.length).toBeGreaterThan(0);
    expect(items[0]).toContain('IFS work benefits');
  });

  test('should extract cautions with structure', () => {
    const cautionsRegex = /## Cautions\s*\n([\s\S]*?)$/i;
    const match = mockGrokResponse.match(cautionsRegex);

    expect(match).toBeTruthy();
    expect(match![1]).toContain('⚠️');
    expect(match![1]).toContain('Evidence:');
    expect(match![1]).toContain('Risk:');
    expect(match![1]).toContain('Signal:');
    expect(match![1]).toContain('Response:');
  });

  test('validates recommended wizard has required fields', () => {
    const jsonMatch = mockGrokResponse.match(/```json\s*([\s\S]*?)\s*```/);
    const parsed = JSON.parse(jsonMatch![1]);
    const wizard = parsed.nextWizard;

    // Required fields from new schema
    expect(wizard).toHaveProperty('type');
    expect(wizard).toHaveProperty('name');
    expect(wizard).toHaveProperty('reason');
    expect(wizard).toHaveProperty('focus');
    expect(wizard).toHaveProperty('priority');
    expect(wizard).toHaveProperty('confidence');
    expect(wizard).toHaveProperty('evidence');
    expect(wizard).toHaveProperty('timing');
  });

  test('validates stack balance percentages', () => {
    const jsonMatch = mockGrokResponse.match(/```json\s*([\s\S]*?)\s*```/);
    const parsed = JSON.parse(jsonMatch![1]);
    const balance = parsed.stackBalance;

    expect(balance).toHaveProperty('body');
    expect(balance).toHaveProperty('mind');
    expect(balance).toHaveProperty('spirit');
    expect(balance).toHaveProperty('shadow');

    // Verify format
    expect(balance.body).toMatch(/^\d+%$/);
    expect(balance.mind).toMatch(/^\d+%$/);
  });
});

// Export mock for use in other tests
export { mockGrokResponse };
