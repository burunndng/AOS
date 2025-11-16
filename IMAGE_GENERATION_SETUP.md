# Image Generation Setup Guide

The Tarot Card Generator uses a backend endpoint for secure image generation. This guide explains how to set it up.

## How It Works

1. **Frontend** (React) → sends prompt to backend API
2. **Backend** (Vercel Serverless Function) → calls HuggingFace Stable Diffusion
3. **Returns** base64 image to frontend

This approach:
- ✅ Keeps API keys secure (not in client code)
- ✅ Avoids CORS issues
- ✅ Supports both local development and production

## Local Development Setup

### 1. Start the Local Backend API

```bash
npm run dev:api
```

This starts Express server at `http://localhost:3001` with the image generation endpoint at `/api/images/generate`.

### 2. Start the Frontend

```bash
npm run dev
```

The frontend will automatically detect `localhost` and call `http://localhost:3001/api/images/generate`.

### 3. Set HuggingFace API Key

Create `.env.local` with your HuggingFace token:

```env
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxx
```

Get your token: https://huggingface.co/settings/tokens

## Production Setup (Vercel)

### 1. Push to Git

```bash
git push origin main
```

### 2. Connect to Vercel

Visit https://vercel.com and import your GitHub repository.

### 3. Add Environment Variable

In Vercel Project Settings → Environment Variables, add:

```
Name: HUGGINGFACE_API_KEY
Value: hf_xxxxxxxxxxxxxxxxxxxxx
```

### 4. Deploy

Vercel automatically deploys on git push. Your endpoint will be:

```
https://your-project.vercel.app/api/generate-image
```

The frontend automatically detects production and uses this endpoint.

## Architecture

```
┌─────────────────────────────────────────────────┐
│           GitHub Pages (Frontend)                │
│    React App + Tarot Card Generator             │
│      (burunndng.github.io)                      │
└──────────────┬──────────────────────────────────┘
               │ POST /api/generate-image
               ↓
┌──────────────────────────────────────────────────┐
│       Vercel Serverless Function                │
│     api/generate-image.ts                       │
└──────────────┬──────────────────────────────────┘
               │ Calls
               ↓
┌──────────────────────────────────────────────────┐
│     HuggingFace Stable Diffusion API             │
│      (image generation service)                  │
└──────────────────────────────────────────────────┘
```

## Troubleshooting

### Getting 405 Error
- **Development**: Make sure `npm run dev:api` is running on port 3001
- **Production**: Deploy the backend to Vercel first

### Getting 503 Error
- Check HuggingFace API key is set correctly
- Verify the model `stabilityai/stable-diffusion-xl-base-1.0` is available
- Check rate limiting (HuggingFace has limits)

### Getting Timeout
- Image generation can take 10-30 seconds
- The function timeout is set to 60 seconds in `vercel.json`

## Files

- **Frontend**: `services/tarotCardService.ts` - handles API calls
- **Local Backend**: `api/images/generate-image.ts` (Express)
- **Production Backend**: `api/generate-image.ts` (Vercel Serverless)
- **Config**: `vercel.json` - Vercel deployment settings
- **Env**: `.env.local` - local development secrets

## Customization

To use a different image generation service:

1. Update `api/generate-image.ts` to call your service
2. Add necessary API keys to `.env.local` and Vercel
3. Frontend code stays the same!

