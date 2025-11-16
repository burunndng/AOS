/**
 * Vercel Serverless Function for Image Generation
 * Deploy to: /api/images.ts (or /api/generate-image.ts)
 * Accessible at: https://your-domain.vercel.app/api/generate-image
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

interface GenerateImageRequest {
  prompt: string;
  style?: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt, style } = req.body as GenerateImageRequest;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required and must be a string',
      });
    }

    console.log('[Image Generation] Generating image with prompt:', prompt.substring(0, 50) + '...');

    // Try Imagen API first (primary)
    try {
      const imagenResult = await generateWithImagen(prompt);
      if (imagenResult.success) {
        console.log('[Image Generation] ✓ Successfully generated image with Imagen API');
        return res.json(imagenResult);
      }
    } catch (imagenError) {
      console.warn('[Image Generation] Imagen API failed, trying fallback:', imagenError instanceof Error ? imagenError.message : String(imagenError));
    }

    // Fallback to Stable Diffusion
    try {
      const sdResult = await generateWithStableDiffusion(prompt);
      if (sdResult.success) {
        console.log('[Image Generation] ✓ Successfully generated image with Stable Diffusion');
        return res.json(sdResult);
      }
    } catch (sdError) {
      console.error('[Image Generation] Stable Diffusion failed:', sdError instanceof Error ? sdError.message : String(sdError));
    }

    // Both failed
    return res.status(503).json({
      success: false,
      error: 'Image generation service currently unavailable. Please try again later.',
    });
  } catch (error) {
    console.error('[Image Generation] Unexpected error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate image',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Generate image using Google's Imagen 4.0 Fast API
 */
async function generateWithImagen(prompt: string): Promise<{ success: boolean; imageUrl?: string; base64Data?: string; error?: string }> {
  const googleApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!googleApiKey) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY not configured');
  }

  console.log('[Imagen] Calling Imagen 4.0 Fast API...');

  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': googleApiKey,
        },
        body: JSON.stringify({
          instances: [
            {
              prompt: prompt,
            },
          ],
          parameters: {
            sampleCount: 1,
            height: 512,
            width: 384, // 3:4 aspect ratio
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.warn(`[Imagen] API error ${response.status}:`, error.substring(0, 200));
      throw new Error(`Imagen API error: ${response.status}`);
    }

    const data = await response.json() as { predictions?: string[] };

    // Check if predictions exist
    if (data.predictions && data.predictions.length > 0) {
      const base64Image = data.predictions[0];
      const imageUrl = `data:image/png;base64,${base64Image}`;

      return {
        success: true,
        imageUrl,
        base64Data: imageUrl,
      };
    }

    throw new Error('No predictions in Imagen response');
  } catch (error) {
    throw new Error(
      `Imagen generation failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Generate image using HuggingFace Stable Diffusion
 */
async function generateWithStableDiffusion(prompt: string): Promise<{ success: boolean; imageUrl?: string; base64Data?: string; error?: string }> {
  const hfApiKey = process.env.HUGGINGFACE_API_KEY;

  if (!hfApiKey) {
    throw new Error('HUGGINGFACE_API_KEY not configured in Vercel environment');
  }

  console.log('[Stable Diffusion] Calling HuggingFace API...');

  const response = await fetch(
    'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
    {
      headers: {
        Authorization: `Bearer ${hfApiKey}`,
      },
      method: 'POST',
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          negative_prompt: 'blurry, low quality, distorted, ugly',
          height: 512,
          width: 384, // 3:4 aspect ratio
          num_inference_steps: 20,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HuggingFace API error: ${response.status} - ${error}`);
  }

  const blob = await response.blob();

  // Convert blob to base64
  const arrayBuffer = await blob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString('base64');
  const imageUrl = `data:image/png;base64,${base64}`;

  return {
    success: true,
    imageUrl,
    base64Data: imageUrl,
  };
}
