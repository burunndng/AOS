# Model Fallback Quick Reference Guide

## For Developers: How to Use Fallback

### Fallback Utility Location
```
/utils/modelFallback.ts
```

### Basic Usage Pattern

```typescript
import { executeWithFallback, getFallbackModel } from '../utils/modelFallback';

// Simple text generation with fallback
const result = await executeWithFallback(
  'YourWizardName',
  'gemini-2.5-flash-lite',
  async (primaryModel) => {
    // Your primary API call here
    const response = await api.call(primaryModel);
    return response.text;
  },
  async (fallbackModel) => {
    // Your fallback API call here
    const response = await fallbackApi.call(fallbackModel);
    return response.text;
  }
);
```

## Fallback Rules at a Glance

| Primary Model | Fallback Model | Provider Change |
|---|---|---|
| DeepSeek-V3, DeepSeek-R1 | gemini-2.5-flash-lite | OpenRouter → Google |
| Grok-4, Grok-4-Fast | gemini-2.5-flash-lite | OpenRouter → Google |
| Any Gemini Model | openai/gpt-oss-120b:exacto | Google → OpenRouter |
| Other Models | No fallback | - |

## Error Types That Trigger Fallback

✅ **These will trigger fallback:**
- `429 - Too Many Requests` (rate limit)
- `quota exceeded` / `out of quota`
- `503 - Service Unavailable`
- `timeout` / `timed out`
- `resource exhausted`

❌ **These will NOT trigger fallback (fatal errors):**
- `invalid API key`
- `authentication failed`
- `model not found`
- `context length exceeded` (usually)

## Common Patterns in This Codebase

### Pattern 1: Simple Text Generation
Used in: `geminiService.generateText()`, `biasDetectiveService`

```typescript
return await executeWithFallback(
  'ServiceName',
  'gemini-2.5-flash-lite',
  async (primaryModel) => {
    const response = await ai.models.generateContent({
      model: primaryModel,
      contents: prompt,
    });
    return response.text || '';
  },
  async (fallbackModel) => {
    return await callOpenRouterFallback(prompt);
  }
);
```

### Pattern 2: JSON Generation with Schema
Used in: `geminiService.populateCustomPractice()`

```typescript
return await executeWithFallback(
  'ServiceName',
  'gemini-2.5-pro',
  async (primaryModel) => {
    // Gemini API call with schema
    const response = await ai.models.generateContent({
      model: primaryModel,
      contents: prompt,
      config: { responseMimeType: 'application/json', responseSchema: {...} }
    });
    return JSON.parse(response.text);
  },
  async (fallbackModel) => {
    // OpenRouter fallback - parse JSON from response
    const text = await callOpenRouterFallback(prompt);
    return JSON.parse(text);
  }
);
```

### Pattern 3: Streaming with Fallback
Used in: `openRouterService.generateOpenRouterResponse()`

```typescript
return await executeWithFallback(
  'ServiceName',
  primaryModel,
  async (primaryModel) => {
    if (onStreamChunk) {
      const stream = await client.chat.completions.create({...});
      let fullText = '';
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || '';
        fullText += text;
        if (text) onStreamChunk(text);
      }
      return { success: true, text: fullText };
    }
    // Non-streaming...
  },
  async (fallbackModel) => {
    // Fallback doesn't support streaming
    return await fallbackFunction();
  }
);
```

## Helper Functions Reference

### In openRouterService.ts
```typescript
// Already set up - call Gemini for fallback
async function callGeminiFallback(
  messages: OpenRouterMessage[],
  maxTokens?: number,
  temperature?: number
): Promise<string>
```

### In geminiService.ts
```typescript
// Already set up - call OpenRouter for fallback
async function callOpenRouterFallback(prompt: string, maxTokens?: number): Promise<string>

// Generic wrapper for Gemini calls with fallback
async function safeGeminiCall(
  wizardName: string,
  model: string,
  prompt: string,
  maxTokens?: number
): Promise<string>
```

### In other Gemini services (bias*, somatic*, perspective*, etc.)
```typescript
// Set up locally in each service
async function callOpenRouterFallback(prompt: string, maxTokens?: number): Promise<string> {
  const response = await getOpenRouterClient().chat.completions.create({
    model: 'openai/gpt-oss-120b:exacto',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: maxTokens,
    provider: { quantizations: ['bf16'] }
  });
  return response.choices[0]?.message?.content || '';
}
```

## Environment Variables Required

```bash
# For OpenRouter services (primary)
OPENROUTER_API_KEY=sk-or-...

# For Gemini services (primary)
API_KEY=AIza...

# Optional site info
SITE_URL=https://auraos.app
```

## Monitoring Fallback

### Check Fallback Logs
All fallback attempts are logged with:
```
[Model Fallback] {ServiceName}: Switching from {primaryModel} to {fallbackModel}
Error: {error message}
```

Look for these in console output or logs to see when fallback is being used:
```
[Model Fallback] GeminiService: Switching from gemini-2.5-flash-lite to openai/gpt-oss-120b:exacto
[Model Fallback] OpenRouter: Switching from deepseek/deepseek-v3.2-exp to gemini-2.5-flash-lite
```

## Adding Fallback to New Functions

### Step 1: Add Imports
```typescript
import { executeWithFallback } from '../utils/modelFallback';
```

### Step 2: Determine Model and Service Type
- Is it a Gemini model? → Fallback is OpenRouter
- Is it a DeepSeek/Grok model? → Fallback is Gemini
- Is it something else? → No fallback needed

### Step 3: Wrap Your API Call
```typescript
// Before
export async function myFunction(param: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: prompt,
  });
  return response.text;
}

// After
export async function myFunction(param: string): Promise<string> {
  return await executeWithFallback(
    'MyFunctionName',
    'gemini-2.5-flash-lite',
    async (primaryModel) => {
      const response = await ai.models.generateContent({
        model: primaryModel,
        contents: prompt,
      });
      return response.text;
    },
    async (fallbackModel) => {
      return await callOpenRouterFallback(prompt);
    }
  );
}
```

## Debugging Fallback Issues

### If Fallback Not Triggering
1. Check error message - is it in the `shouldUseFallback()` list?
2. Verify API keys are set: `OPENROUTER_API_KEY` and `API_KEY`
3. Check console for `[Model Fallback]` logs

### If Fallback Throwing Error
1. Check error is from fallback (different provider)
2. Verify fallback model is accessible
3. Check response format matches expectation (some models need JSON parsing)

### If Both Primary and Fallback Fail
1. Check network connectivity
2. Check API key validity
3. Check API rate limits for both providers
4. Service returns error with both attempts' context

## Services Already Using Fallback

### Complete Implementation (Ready to Use)
- ✅ openRouterService.ts
- ✅ geminiService.ts (generateText, populateCustomPractice)
- ✅ dynamicWorkoutArchitectService.ts
- ✅ biasDetectiveService.ts (generateBiasedDecisionAnalysis)

### Infrastructure in Place (Ready to Wrap)
- ⚙️ biasFinderService.ts
- ⚙️ somaticPracticeService.ts
- ⚙️ perspectiveShifterService.ts

### Automatic via Delegation
- ↗️ adaptiveCycleService.ts
- ↗️ memoryReconsolidationService.ts
- ↗️ eightZonesService.ts
- ↗️ geminiRecommendationService.ts
- ↗️ flabbergasterChatService.ts
- ↗️ coachChatService.ts

### Multi-Provider Chains
- 🔄 bigMindService.ts (Google/Groq/OpenRouter)
- 🔄 integralBodyArchitectService.ts (Gemini/Qwen)

## Quick Test

To test fallback without breaking anything:

```typescript
// In any Gemini service
import { getFallbackModel } from '../utils/modelFallback';

const config = getFallbackModel('gemini-2.5-flash-lite');
console.log(config); // Should show: gpt-oss-120b:exacto on OpenRouter
```

## Cost Implications

- **Fallback Usage:** Only when primary fails (error-driven)
- **Cost Impact:** Minimal (only on errors)
- **Model Costs:** OpenRouter may be cheaper than Gemini Pro for fallbacks
- **Recommendation:** Monitor fallback logs to understand error patterns

## Support & Questions

For questions about implementation:
1. Check FALLBACK_IMPLEMENTATION_SUMMARY.md for detailed docs
2. Review the utils/modelFallback.ts source code
3. Look at implementations in openRouterService.ts and geminiService.ts
4. Check logs for `[Model Fallback]` entries
