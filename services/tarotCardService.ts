// services/tarotCardService.ts
// Image generation using Gemini API REST endpoint

export interface TarotCardRequest {
  description: string;
  style: string;
  includeTitle: boolean;
}

export interface TarotCardResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
  base64Data?: string;
}

// Tarot styles with descriptive prompts
const tarotStyles: Record<string, string> = {
  'marseille': 'Traditional Marseille Tarot style with geometric patterns and classical Italian Renaissance art',
  'crowley': 'Aleister Crowley Thoth Tarot style with symbolic, mystical, and esoteric imagery',
  'rider-waite': 'Classic Rider-Waite-Smith style with detailed narrative illustrations and golden yellows',
  'gothic': 'Dark gothic tarot style with mysterious shadows, ornate details, and moody atmosphere',
  'modern': 'Contemporary modern tarot style with clean lines, vibrant colors, and artistic abstraction',
  'celestial': 'Celestial tarot style with stars, moons, planets, and cosmic imagery',
  'botanical': 'Botanical tarot style with nature, flowers, plants, and organic flowing forms',
  'abstract': 'Abstract geometric tarot style with pure forms, sacred geometry, and symbolic patterns'
};

/**
 * Build the prompt for tarot card generation
 */
function buildTarotPrompt(description: string, style: string, includeTitle: boolean): string {
  const styleDescription = tarotStyles[style] || tarotStyles['modern'];

  const basePrompt = `Generate a beautiful and mystical tarot card illustration.

Description: ${description}

Style: ${styleDescription}

Requirements:
- Create a single tarot card with clear composition
- Include a decorative border appropriate to the style
${includeTitle ? '- Add a meaningful title or number at the bottom\n' : ''}
- Use a color palette that enhances the spiritual and mystical quality
- Ensure the imagery is symbolic and evocative
- Professional art quality
- Aspect ratio: portrait (roughly 3:4)

Create something that feels like a real tarot card from the ${style} tradition.`;

  return basePrompt;
}

/**
 * Generate a tarot card image using the backend API
 * Backend handles Imagen API with Stable Diffusion fallback
 */
export async function generateTarotCard(request: TarotCardRequest): Promise<TarotCardResponse> {
  try {
    const prompt = buildTarotPrompt(
      request.description,
      request.style,
      request.includeTitle
    );

    console.log('Generating tarot card via backend API...');

    // Determine API base - support both production and development
    const apiBase = typeof window !== 'undefined'
      ? window.location.origin + '/api'
      : process.env.VITE_API_BASE || 'http://localhost:3001/api';

    const response = await fetch(`${apiBase}/images/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        style: request.style,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Backend API error:', errorData);
      return {
        success: false,
        error: errorData.error || `API error: ${response.status}`
      };
    }

    const result = await response.json() as TarotCardResponse;

    if (result.success) {
      console.log('✓ Successfully generated tarot card');
      return result;
    }

    return {
      success: false,
      error: result.error || 'Image generation failed'
    };
  } catch (error) {
    console.error('Tarot card generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate tarot card'
    };
  }
}

/**
 * Get available tarot styles
 */
export function getAvailableTarotStyles(): { id: string; name: string; description: string }[] {
  return [
    { id: 'marseille', name: 'Marseille', description: 'Traditional Renaissance style' },
    { id: 'crowley', name: 'Crowley Thoth', description: 'Mystical and symbolic' },
    { id: 'rider-waite', name: 'Rider-Waite', description: 'Classic detailed style' },
    { id: 'gothic', name: 'Gothic', description: 'Dark and mysterious' },
    { id: 'modern', name: 'Modern', description: 'Contemporary artistic' },
    { id: 'celestial', name: 'Celestial', description: 'Cosmic and ethereal' },
    { id: 'botanical', name: 'Botanical', description: 'Nature-inspired' },
    { id: 'abstract', name: 'Abstract', description: 'Geometric and symbolic' }
  ];
}
