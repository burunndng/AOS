// services/tarotCardService.ts
import { GoogleGenAI } from '@google/genai';

// Lazy initialization
let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error('API_KEY is not set. Please configure your Gemini API key.');
    }
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

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
 * Generate a tarot card image using Gemini's image generation API
 */
export async function generateTarotCard(request: TarotCardRequest): Promise<TarotCardResponse> {
  try {
    const client = getGeminiClient();

    // Build the prompt
    const prompt = buildTarotPrompt(
      request.description,
      request.style,
      request.includeTitle
    );

    console.log('Generating tarot card with prompt:', prompt.substring(0, 100) + '...');

    // Try primary model: imagen-4.0-fast-generate-001
    try {
      const response = await client.generateImage({
        prompt: prompt,
        model: 'imagen-4.0-fast-generate-001',
        config: {
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_ONLY_HIGH'
            },
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              threshold: 'BLOCK_ONLY_HIGH'
            },
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_ONLY_HIGH'
            },
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_ONLY_HIGH'
            }
          ]
        }
      });

      if (response && response.images && response.images.length > 0) {
        const image = response.images[0];

        // Return base64 data if available, otherwise use URL
        if (image.data) {
          return {
            success: true,
            base64Data: `data:image/png;base64,${image.data}`,
            imageUrl: image.url
          };
        } else if (image.url) {
          return {
            success: true,
            imageUrl: image.url
          };
        }
      }

      throw new Error('No images in response from primary model');
    } catch (primaryError) {
      console.log('Primary model failed, attempting fallback:', primaryError);

      // Fallback: Try models/gemini-2.5-flash-image
      try {
        const fallbackResponse = await client.generateImage({
          prompt: prompt,
          model: 'models/gemini-2.5-flash-image',
          config: {
            safetySettings: [
              {
                category: 'HARM_CATEGORY_HATE_SPEECH',
                threshold: 'BLOCK_ONLY_HIGH'
              },
              {
                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                threshold: 'BLOCK_ONLY_HIGH'
              },
              {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold: 'BLOCK_ONLY_HIGH'
              },
              {
                category: 'HARM_CATEGORY_HARASSMENT',
                threshold: 'BLOCK_ONLY_HIGH'
              }
            ]
          }
        });

        if (fallbackResponse && fallbackResponse.images && fallbackResponse.images.length > 0) {
          const image = fallbackResponse.images[0];

          if (image.data) {
            return {
              success: true,
              base64Data: `data:image/png;base64,${image.data}`,
              imageUrl: image.url
            };
          } else if (image.url) {
            return {
              success: true,
              imageUrl: image.url
            };
          }
        }

        throw new Error('No images in response from fallback model');
      } catch (fallbackError) {
        console.error('Both models failed:', fallbackError);
        return {
          success: false,
          error: `Failed to generate tarot card: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`
        };
      }
    }
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
