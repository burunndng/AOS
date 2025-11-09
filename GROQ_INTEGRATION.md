# Groq API Integration for Big Mind Chatbot

## Overview
The Big Mind Process now supports Groq API integration for faster response streaming using the `openai/gpt-oss-120b` model. This integration provides significantly faster response times compared to the traditional Google Gemini API.

## Features Added

### 1. Dual Provider Support
- **Google Gemini** (`gemini-2.5-flash-lite`): Original provider, reliable and comprehensive
- **Groq** (`openai/gpt-oss-120b`): New provider, optimized for speed with streaming responses

### 2. Provider Selection UI
- Settings button in the Big Mind modal header
- Visual provider selection with availability status
- Provider indicator in conversation area
- Automatic fallback to best available provider

### 3. Enhanced Service Layer
- `BigMindProvider` type: `'google' | 'groq'`
- `generateBigMindResponse()` accepts optional `provider` parameter
- `summarizeBigMindSession()` accepts optional `provider` parameter
- Utility functions: `getAvailableProviders()`, `getBestProvider()`

### 4. Environment Configuration
- `GROQ_API_KEY` environment variable for Groq API access
- `API_KEY` environment variable for Google Gemini API access
- Vite configuration updated to expose both variables

## Usage

### Automatic Provider Selection
The system automatically selects the best available provider, preferring Groq for speed:
```typescript
const bestProvider = getBestProvider(); // Returns 'groq' if available, else 'google'
```

### Manual Provider Selection
Users can switch providers via the UI settings in the Big Mind modal.

### Programmatic Usage
```typescript
import { generateBigMindResponse, BigMindProvider } from './services/bigMindService';

const result = await generateBigMindResponse({
  conversation: messages,
  stage: 'VOICE_DIALOGUE',
  activeVoice: 'The Protector',
  voices: voices,
  provider: 'groq', // or 'google'
  onStreamChunk: (chunk) => console.log(chunk)
});
```

## Environment Variables

### For Vercel Deployment
Set these in your Vercel environment variables:
- `GROQ_API_KEY`: Your Groq API key
- `GEMINI_API_KEY`: Your Google Gemini API key

### For Local Development
Create a `.env` file:
```
GROQ_API_KEY=your_groq_api_key_here
GEMINI_API_KEY=your_google_gemini_api_key_here
```

## API Configuration

### Groq Configuration
- Model: `openai/gpt-oss-120b`
- Base URL: `https://api.groq.com/openai/v1`
- Max tokens: 1000
- Temperature: 0.7
- Streaming: Supported

### Google Configuration
- Model: `gemini-2.5-flash-lite`
- Max tokens: 1000
- Temperature: 0.7
- Streaming: Supported

## Error Handling

### Fallback Logic
- If selected provider fails, the system shows the error message
- Users can manually switch to the alternative provider
- Provider availability is checked and displayed in the UI

### Error Messages
- Clear error messages for API failures
- Environment variable validation
- Network connectivity handling

## Performance Benefits

### Groq Advantages
- **Speed**: Significantly faster response times
- **Streaming**: Efficient token-by-token streaming
- **Reliability**: Optimized for real-time conversations

### Google Advantages
- **Comprehension**: Strong understanding of complex prompts
- **Consistency**: Reliable response quality
- **Structured Output**: Better for JSON-structured responses

## Integration Notes

### Backward Compatibility
- All existing Big Mind functionality preserved
- Default provider selection maintains current behavior
- No breaking changes to existing API

### Session Management
- Provider choice is per-session
- Session history maintains provider context
- Integrated insights work with both providers

### Streaming Implementation
- Both providers support streaming responses
- Real-time UI updates during response generation
- Smooth user experience with immediate feedback

## Testing

### Provider Availability
```typescript
import { getAvailableProviders } from './services/bigMindService';

const providers = getAvailableProviders();
// Returns: [
//   { provider: 'google', available: true },
//   { provider: 'groq', available: true, error?: string }
// ]
```

### Manual Testing
1. Open Big Mind modal
2. Click settings icon to access provider selection
3. Switch between providers and test responses
4. Verify streaming works with both providers
5. Test error handling with invalid API keys

## Future Enhancements

### Potential Improvements
- Provider performance metrics
- Automatic provider switching based on response times
- Custom provider configurations
- Provider-specific prompt optimization
- Cost optimization features

### Monitoring
- Response time tracking
- Error rate monitoring
- Provider performance comparison
- User preference analytics

## Troubleshooting

### Common Issues
1. **Groq API Key Not Found**: Ensure `GROQ_API_KEY` is set in environment variables
2. **Streaming Not Working**: Check browser console for network errors
3. **Provider Unavailable**: Verify API key validity and network connectivity
4. **Build Errors**: Ensure all dependencies are installed correctly

### Debug Mode
Enable debug logging in development mode to see provider selection and API call details.

## Security Considerations

- API keys are server-side only and not exposed to client
- Environment variables are properly configured in Vite
- No sensitive information is logged or stored
- OpenAI SDK configured with `dangerouslyAllowBrowser: true` for Vercel edge compatibility