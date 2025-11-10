# Gemini API Key Setup Guide

This guide will help you configure the Google Gemini API key required for AI-powered features in the application.

## Features That Require Gemini API

The following features **will not work** without a valid Gemini API key:

1. **8 Zones of Knowing**
   - Zone enhancement (AI-generated insights for each zone)
   - Synthesis generation (Step 11) - integrates all 8 zones

2. **Memory Reconsolidation (Shadow Work)**
   - Belief identification (Step 2) - extracts implicit beliefs
   - Contradiction mining - generates counter-evidence
   - Session completion - provides integration guidance

## Step-by-Step Setup

### 1. Get Your Gemini API Key

1. Visit: **https://aistudio.google.com/apikey**
2. Sign in with your Google account
3. Click **"Create API Key"** or **"Get API Key"**
4. Copy the generated API key (it will look like: `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`)

### 2. Configure the API Key Locally

#### Option A: Using `.env.local` (Recommended for Local Development)

1. Navigate to the project root directory: `/home/user/AOS/`
2. Create a new file named `.env.local`:
   ```bash
   touch .env.local
   ```
3. Add the following line to `.env.local`:
   ```bash
   GOOGLE_GENERATIVE_AI_API_KEY=your-actual-api-key-here
   ```
   Replace `your-actual-api-key-here` with your actual API key

4. Save the file

#### Option B: Using `.env` (Alternative)

1. Create a `.env` file in the project root:
   ```bash
   touch .env
   ```
2. Add the same line:
   ```bash
   GOOGLE_GENERATIVE_AI_API_KEY=your-actual-api-key-here
   ```

**Important:** Both `.env` and `.env.local` are gitignored and will NOT be committed to version control.

### 3. Restart Your Development Server

After adding the API key, restart your development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### 4. Verify the Setup

You can verify the API key is configured correctly by:

1. Navigating to the **8 Zones of Knowing** wizard
2. Completing zones 1-8
3. Attempting to generate the synthesis (Step 11)
4. If successful, you should see blind spots, novel insights, and recommendations

OR

1. Navigate to **Memory Reconsolidation**
2. Click "Identify Beliefs"
3. Enter a memory narrative (at least 50 characters)
4. Click to extract beliefs
5. If successful, you should see extracted beliefs with categories and emotional tones

## Deployment (Production)

### Vercel Deployment

If you're deploying to Vercel:

1. Go to your Vercel project dashboard
2. Navigate to **Settings → Environment Variables**
3. Add a new environment variable:
   - **Name:** `GOOGLE_GENERATIVE_AI_API_KEY`
   - **Value:** Your API key
   - **Environments:** Production, Preview, Development (select all)
4. Click **Save**
5. Redeploy your application

### Other Platforms

For other deployment platforms, consult their documentation on setting environment variables. The variable name should be:

```
GOOGLE_GENERATIVE_AI_API_KEY
```

## Alternative Environment Variable Names

The application checks for API keys in the following order:

1. `GOOGLE_GENERATIVE_AI_API_KEY` (recommended)
2. `GEMINI_API_KEY` (alternative)
3. `API_KEY` (fallback, not recommended)

You can use any of these variable names, but `GOOGLE_GENERATIVE_AI_API_KEY` is the most explicit and recommended.

## Troubleshooting

### "Failed to generate synthesis" Error

**Cause:** Missing or invalid Gemini API key

**Solution:**
1. Verify the API key is set in `.env.local` or `.env`
2. Check that the variable name is exactly `GOOGLE_GENERATIVE_AI_API_KEY`
3. Ensure there are no extra spaces or quotes around the key
4. Restart your development server

### "An unexpected error occurred" (Belief Identification)

**Cause:** Same as above - missing API key

**Solution:** Follow the same steps as above

### API Key Not Working

1. Verify the key is valid by testing it in Google AI Studio
2. Check that your Google Cloud project has the Gemini API enabled
3. Ensure you haven't exceeded any rate limits or quotas
4. Check the browser console and server logs for detailed error messages

## Security Best Practices

1. **Never commit** `.env` or `.env.local` files to git
2. **Never share** your API key publicly
3. **Rotate keys** if you suspect they've been exposed
4. **Use environment-specific keys** (different keys for dev/staging/prod)
5. **Monitor usage** in the Google AI Studio dashboard

## API Usage & Costs

- Check your API usage at: https://aistudio.google.com/
- Gemini API has a free tier with generous limits
- Monitor your usage to avoid unexpected charges
- Consider implementing rate limiting for production use

## Support

If you continue to experience issues:

1. Check the server logs for detailed error messages
2. Verify network connectivity to Google AI services
3. Consult the Google Gemini API documentation: https://ai.google.dev/docs
4. Open an issue in the project repository with error details

---

**Last Updated:** 2025-11-10
