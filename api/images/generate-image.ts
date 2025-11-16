/**
 * Image Generation Handler
 * Uses Google's Imagen API for image generation with Stable Diffusion fallback
 */

import type { Request, Response } from 'express';

interface GenerateImageRequest {
  prompt: string;
  style?: string;
  width?: number;
  height?: number;
}

interface GenerateImageResponse {
  success: boolean;
  imageUrl?: string;
  base64Data?: string;
  error?: string;
}

/**
 * Generate image using Google's Imagen API
 * Falls back to HuggingFace Stable Diffusion if Imagen fails
 */
export async function generateImage(req: Request, res: Response): Promise<void> {
  try {
    const { prompt, style = 'modern', width = 512, height = 512 } = req.body as GenerateImageRequest;

    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Prompt is required and must be a string',
      });
      return;
    }

    console.log('[Image Generation] Generating image with prompt:', prompt.substring(0, 50) + '...');

    // Try Imagen API first
    try {
      const imagenResult = await generateWithImagen(prompt);
      if (imagenResult.success) {
        console.log('[Image Generation] ✓ Successfully generated image with Imagen API');
        res.json(imagenResult);
        return;
      }
    } catch (imagenError) {
      console.warn('[Image Generation] Imagen API failed, trying fallback:', imagenError instanceof Error ? imagenError.message : String(imagenError));
    }

    // Fallback to Stable Diffusion
    try {
      const sdResult = await generateWithStableDiffusion(prompt);
      if (sdResult.success) {
        console.log('[Image Generation] ✓ Successfully generated image with Stable Diffusion');
        res.json(sdResult);
        return;
      }
    } catch (sdError) {
      console.error('[Image Generation] Stable Diffusion failed:', sdError instanceof Error ? sdError.message : String(sdError));
    }

    // Both failed
    res.status(503).json({
      success: false,
      error: 'Image generation service currently unavailable. Please try again later.',
    });
  } catch (error) {
    console.error('[Image Generation] Unexpected error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate image',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Generate image using Google's Imagen API
 */
async function generateWithImagen(prompt: string): Promise<GenerateImageResponse> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY not configured');
  }

  console.log('[Imagen] Calling Imagen API...');

  // Note: Google's Imagen API requires special setup and is typically accessed through
  // the Google Cloud Console with proper project configuration
  // For now, we'll use the Gemini API endpoint with image generation via Google Cloud

  try {
    // First, let's try to use the google genai SDK directly
    const { GoogleGenerativeAI } = await import('@google/genai');

    const client = new GoogleGenerativeAI({
      apiKey: apiKey,
    });

    // Try to use imagen-3.0-generate-001 model if available
    // This requires proper setup in Google Cloud Console
    const request = {
      model: 'imagen-3.0-generate-001',
      prompt: prompt,
      number_of_images: 1,
    };

    try {
      // Attempt to call the API
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImages?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            instances: [{ prompt }],
            parameters: {
              sampleCount: 1,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Imagen API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.predictions && data.predictions[0]) {
        const base64Image = data.predictions[0];
        const imageUrl = `data:image/png;base64,${base64Image}`;
        return {
          success: true,
          imageUrl,
          base64Data: imageUrl,
        };
      }

      throw new Error('No valid response from Imagen API');
    } catch (apiError) {
      // If the specific Imagen endpoint fails, try the general generateContent endpoint
      // which can also generate images
      console.log('[Imagen] Trying generative endpoint for image generation...');

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Generate an image: ${prompt}`,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      // Note: Gemini Flash doesn't generate images directly, so this will fail
      // We use this as a transition to the fallback
      throw new Error('Gemini API cannot generate images directly');
    }
  } catch (error) {
    throw new Error(`Imagen generation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate image using HuggingFace Stable Diffusion
 */
async function generateWithStableDiffusion(prompt: string): Promise<GenerateImageResponse> {
  const hfApiKey = process.env.HUGGINGFACE_API_KEY;

  if (!hfApiKey) {
    throw new Error('HUGGINGFACE_API_KEY not configured');
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
